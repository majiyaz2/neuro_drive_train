// src/components/game/GameCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Track } from './Track';
import { Car, SerializableNetwork } from './Car';
import { HUD } from './HUD';
import { Network, calculateProgressiveCheckpointReward } from '@/lib/network';
import { BrowserTrainer as Trainer, type TrainingConfig } from '@/lib/browserTrainer';

export type GameCanvasCommand = 'start' | 'pause' | 'reset' | 'apply' | null;

export interface GameCanvasProps {
    trackIndex?: number;
    carImagePaths?: string[];
    trainingConfig?: Partial<TrainingConfig>;
    command?: GameCanvasCommand;
    simulationSpeed?: number;
    onSimulationComplete?: (networks: SerializableNetwork[]) => void;
    onLoadingChange?: (loading: boolean) => void;
    onSimulatingChange?: (simulating: boolean) => void;
    onGenerationComplete?: (generation: number, fitness: number) => void;
    onHypermutationChange?: (enabled: boolean) => void;
    addLog?: (log: string) => void;
}

export interface GameCanvasRef {
    start: () => Promise<void>;
    pause: () => void;
    reset: () => void;
}

export interface SimulationConfig {
    width: number;
    height: number;
    backgroundColor: number;
    frameDuration: number;
}

const DEFAULT_CONFIG: SimulationConfig = {
    width: 960,
    height: 540,
    backgroundColor: 0x1a1a2e,
    frameDuration: 1 / 60,
};

/**
 * Convert a Network instance from lib to SerializableNetwork for Car component.
 * Creates a closure over the network to provide feedForward functionality.
 */
function networkToSerializable(network: Network): SerializableNetwork {
    return {
        dimensions: network.dimensions,
        hasReachedGoal: network.hasReachedGoal,
        smallestEdgeDistance: network.smallestEdgeDistance,
        highestCheckpoint: network.highestCheckpoint,
        distanceCovered: network.distanceCovered,
        survivalTime: network.survivalTime,
        wallProximityPenalty: network.wallProximityPenalty,
        layers: network.layers.map(layer => ({
            outputs: [...layer.outputs],
            weights: layer.weights.map(w => [...w]),
            highestCheckpoint: layer.highestCheckpoint,
        })),
        inputs: [...network.inputs],
        feedForward: async (inputs: number[]) => {
            const outputs = network.feedForward(inputs);
            return outputs ?? [0, 0, 0];
        },
    };
}

export const GameCanvas = forwardRef<GameCanvasRef, GameCanvasProps>(function GameCanvas({
    trackIndex = 0,
    carImagePaths = [
        '/assets/cars/car0.png',
        '/assets/cars/car1.png',
        '/assets/cars/car2.png',
        '/assets/cars/car3.png',
        '/assets/cars/car4.png',
    ],
    trainingConfig,
    command,
    simulationSpeed = 1,
    onSimulationComplete,
    onLoadingChange,
    onSimulatingChange,
    onGenerationComplete,
    onHypermutationChange,
    addLog,
}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const trainerRef = useRef<Trainer | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [simulationRound, setSimulationRound] = useState(1);
    const speedRef = useRef(simulationSpeed);

    // Keep speedRef updated when simulationSpeed prop changes
    useEffect(() => {
        speedRef.current = simulationSpeed;
    }, [simulationSpeed]);
    const abortRef = useRef(false);

    // Pause function
    const pause = useCallback(() => {
        abortRef.current = true;
        setIsSimulating(false);
        onSimulatingChange?.(false);
    }, [onSimulatingChange]);

    // Reset function
    const reset = useCallback(() => {
        abortRef.current = true;
        setIsSimulating(false);
        onSimulatingChange?.(false);
        trainerRef.current = null;
        setSimulationRound(1);
    }, [onSimulatingChange]);

    // Apply config function - updates trainer without full reset
    const applyConfig = useCallback(() => {
        if (trainerRef.current && trainingConfig) {
            trainerRef.current.updateConfig(trainingConfig);
            console.log('Applied new training config:', trainingConfig);
        }
    }, [trainingConfig]);

    // Initialize PixiJS Application
    useEffect(() => {
        if (!containerRef.current) return;

        const app = new Application();
        let mounted = true;

        const init = async () => {
            await app.init({
                resizeTo: containerRef.current as HTMLElement,
                backgroundColor: DEFAULT_CONFIG.backgroundColor,
                antialias: true,
            });

            // Check if component was unmounted during async init
            if (!mounted) {
                app.destroy(true);
                return;
            }

            containerRef.current?.appendChild(app.canvas);
            appRef.current = app;
            setIsLoading(false);
            onLoadingChange?.(false);
        };

        init();

        return () => {
            mounted = false;
            if (appRef.current) {
                appRef.current.destroy(true);
            }
            appRef.current = null;
        };
    }, []);

    // Internal function to run the next generation (can be called recursively)
    const runNextGeneration = useCallback(async () => {
        if (!trainerRef.current) return;

        // Convert trainer networks to SerializableNetwork for Car component
        const networks = trainerRef.current.networks.map(networkToSerializable);
        const currentRound = trainerRef.current.simulationRound;

        // Run simulation
        const app = appRef.current;
        if (!app) return;

        // Clear previous content
        app.stage.removeChildren();

        // Create main container
        const gameContainer = new Container();
        gameContainer.sortableChildren = true;
        app.stage.addChild(gameContainer);

        // Stretch simulation to fill the canvas
        const fillSimulation = () => {
            const scaleX = app.screen.width / DEFAULT_CONFIG.width;
            const scaleY = app.screen.height / DEFAULT_CONFIG.height;
            gameContainer.scale.set(scaleX, scaleY);
            gameContainer.x = 0;
            gameContainer.y = 0;
        };

        fillSimulation();
        app.renderer.on('resize', fillSimulation);

        // Load track
        const track = new Track();
        await track.load(trackIndex);
        gameContainer.addChild(track);

        // Create HUD
        const dimensions = networks[0]?.dimensions || [5, 4, 2];
        const hud = new HUD(currentRound, dimensions);
        hud.zIndex = 200;
        gameContainer.addChild(hud);

        // Create cars
        const cars: Car[] = [];
        for (let i = 0; i < networks.length; i++) {
            const network = networks[i];
            const car = new Car(network, track);
            const carImagePath = carImagePaths[i % carImagePaths.length];
            await car.loadSprite(carImagePath);
            car.zIndex = 50;
            cars.push(car);
            gameContainer.addChild(car);
        }

        // Move track overlay to gameContainer so it renders above cars
        const overlay = track.getOverlaySprite();
        if (overlay) {
            track.removeChild(overlay);
            overlay.zIndex = 150;
            gameContainer.addChild(overlay);
        }

        // Create checkpoints visualization
        const checkpointsContainer = new Container();
        checkpointsContainer.zIndex = 10;
        for (let i = 0; i < track.checkpoints.length; i++) {
            const [x, y] = track.checkpoints[i];

            // Checkpoint circle
            const circle = new Graphics();
            circle.circle(x, y, 15).fill({ color: 0xffffff, alpha: 0.4 });

            // Checkpoint label
            const textStyle = new TextStyle({
                fontSize: 12,
                fill: 0xffffff,
            });
            const label = new Text({ text: String(i), style: textStyle });
            label.anchor.set(0.5, 0.5);
            label.position.set(x, y);

            checkpointsContainer.addChild(circle);
            checkpointsContainer.addChild(label);
        }
        gameContainer.addChild(checkpointsContainer);

        // Simulation loop
        let populationAlive = cars.length;
        const populationTotal = cars.length;

        const updateLoop = async () => {
            if (abortRef.current) {
                app.ticker.remove(updateLoop);
                setIsSimulating(false);
                return;
            }

            const deltaTime = (app.ticker.deltaTime / 60) * speedRef.current; // Normalize to seconds and apply speed multiplier

            for (const car of cars) {
                if (!car.isRunning) continue;

                // Update car (includes radar probing and neural network inference)
                await car.update(deltaTime);

                // Calculate front position (where radars are) for better collision and checkpoint detection
                const carFacing = car.rotation;
                const frontX = car.position.x + 40 * Math.cos(carFacing);
                const frontY = car.position.y + 40 * Math.sin(carFacing);

                // Check road collision for both front and rear
                if (!track.isRoad(car.position.x, car.position.y) || !track.isRoad(frontX, frontY)) {
                    car.shutOff();
                }

                // Check checkpoints (using front of car for better feel as it's the "leading" edge)
                for (let i = 0; i < track.checkpoints.length; i++) {
                    const [cx, cy] = track.checkpoints[i];
                    const distance = Math.sqrt(
                        Math.pow(cx - frontX, 2) + Math.pow(cy - frontY, 2)
                    );
                    if (distance < 40) {
                        car.hitCheckpoint(i);
                    }
                }
            }

            // Update population count
            const runningCars = cars.filter((c) => c.isRunning);
            populationAlive = runningCars.length;

            // Update HUD
            if (runningCars.length > 0) {
                hud.update(
                    runningCars[0].network,
                    populationAlive,
                    populationTotal,
                    runningCars[0].speed
                );
            }

            // Check if simulation should end
            if (populationAlive === 0) {
                app.ticker.remove(updateLoop);

                // Update network stats from simulation results
                for (const car of cars) {
                    car.network.highestCheckpoint = car.lastCheckpointPassed;
                    car.network.smallestEdgeDistance = car.smallestEdgeDistance;
                    car.network.distanceCovered = car.distanceCovered;
                    car.network.hasReachedGoal =
                        car.lastCheckpointPassed === track.checkpoints.length - 1;
                }

                // Sync stats back to trainer networks and run evolution
                if (trainerRef.current) {
                    for (let i = 0; i < cars.length; i++) {
                        const trainerNetwork = trainerRef.current.networks[i];
                        if (trainerNetwork) {
                            trainerNetwork.highestCheckpoint = cars[i].network.highestCheckpoint;
                            trainerNetwork.smallestEdgeDistance = cars[i].network.smallestEdgeDistance;
                            trainerNetwork.distanceCovered = cars[i].distanceCovered;
                            trainerNetwork.survivalTime = cars[i].survivalTime;
                            trainerNetwork.wallProximityPenalty = cars[i].wallProximityPenalty;
                            trainerNetwork.hasReachedGoal = cars[i].network.hasReachedGoal;
                        }
                    }

                    // Calculate best fitness BEFORE evolution (evolution creates new networks with reset values)
                    const bestFitness = Math.max(...cars.map(car => {
                        // Use progressive checkpoint rewards (later checkpoints worth exponentially more)
                        const checkpointReward = calculateProgressiveCheckpointReward(car.lastCheckpointPassed);
                        const fitness =
                            (car.distanceCovered * 1.0) +
                            checkpointReward +
                            (car.survivalTime * 5) -
                            (car.wallProximityPenalty * 10);
                        return fitness;
                    }));

                    // Run evolution and create next generation
                    const wasStagnated = trainerRef.current.isStagnated;
                    trainerRef.current.evolveAndSave();
                    const isStagnated = trainerRef.current.isStagnated;

                    if (wasStagnated && !isStagnated) {
                        onHypermutationChange?.(false);
                    }

                    setSimulationRound(trainerRef.current.simulationRound);

                    // Report generation completion with best fitness score
                    onGenerationComplete?.(trainerRef.current.simulationRound, bestFitness);
                }

                // Callback with updated networks
                onSimulationComplete?.(cars.map((c) => c.network));

                // Automatically continue to next generation if not at max iterations
                if (trainerRef.current?.canContinue() && !abortRef.current) {
                    // Short delay to allow UI update before next generation
                    setTimeout(() => {
                        if (!abortRef.current) {
                            runNextGeneration();
                        }
                    }, 100);
                } else {
                    setIsSimulating(false);
                    onSimulatingChange?.(false);
                    console.log('Training complete or aborted.');
                }
            }
        };

        app.ticker.add(updateLoop);
    }, [trackIndex, carImagePaths, onSimulationComplete]);

    // Start training with real networks from Trainer
    const startTraining = useCallback(async () => {
        setIsSimulating(true);
        onSimulatingChange?.(true);
        abortRef.current = false;

        // Create or reuse trainer (loads chromosomes from storage)
        if (!trainerRef.current) {
            trainerRef.current = new Trainer(trainingConfig, addLog);
            setSimulationRound(trainerRef.current.simulationRound);
        }

        // Run next generation
        await runNextGeneration();
    }, [runNextGeneration, trainingConfig, onSimulatingChange]);

    // Expose control methods via ref
    useImperativeHandle(ref, () => ({
        start: startTraining,
        pause,
        reset,
    }), [startTraining, pause, reset]);

    // Keyboard handler for ESC to abort
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSimulating) {
                abortRef.current = true;
                console.log('Simulation aborted');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSimulating]);

    // Handle external commands from parent component
    useEffect(() => {
        if (!command) return;

        switch (command) {
            case 'start':
                if (!isSimulating && !isLoading) {
                    startTraining();
                }
                break;
            case 'pause':
                pause();
                break;
            case 'reset':
                reset();
                break;
            case 'apply':
                applyConfig();
                break;
        }
    }, [command, isSimulating, isLoading, startTraining, pause, reset, applyConfig]);

    return (
        <div ref={containerRef} className="h-full w-full overflow-hidden" />
    );
});

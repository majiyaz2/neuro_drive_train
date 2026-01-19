// src/components/game/GameCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Track } from './Track';
import { Car, SerializableNetwork } from './Car';
import { HUD } from './HUD';
import { Network } from '@/lib/network';
import { BrowserTrainer as Trainer, type TrainingConfig } from '@/lib/browserTrainer';

export interface GameCanvasProps {
    trackIndex?: number;
    carImagePaths?: string[];
    trainingConfig?: Partial<TrainingConfig>;
    onSimulationComplete?: (networks: SerializableNetwork[]) => void;
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
        layers: network.layers.map(layer => ({
            outputs: [...layer.outputs],
            weights: layer.weights.map(w => [...w]),
            highestCheckpoint: layer.highestCheckpoint,
        })),
        inputs: [...network.inputs],
        feedForward: async (inputs: number[]) => {
            const outputs = network.feedForward(inputs);
            return outputs ?? [0, 0];
        },
    };
}

export function GameCanvas({
    trackIndex = 0,
    carImagePaths = [
        '/assets/cars/car0.png',
        '/assets/cars/car1.png',
        '/assets/cars/car2.png',
        '/assets/cars/car3.png',
        '/assets/cars/car4.png',
    ],
    trainingConfig,
    onSimulationComplete,
}: GameCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const trainerRef = useRef<Trainer | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [simulationRound, setSimulationRound] = useState(1);
    const abortRef = useRef(false);

    // Initialize PixiJS Application
    useEffect(() => {
        if (!containerRef.current) return;

        const app = new Application();
        let mounted = true;

        const init = async () => {
            await app.init({
                width: DEFAULT_CONFIG.width,
                height: DEFAULT_CONFIG.height,
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
        };

        init();

        return () => {
            mounted = false;
            if (appRef.current && appRef.current.stage) {
                appRef.current.destroy(true);
            }
            appRef.current = null;
        };
    }, []);

    // Simulation function
    const simulateGeneration = useCallback(
        async (networks: SerializableNetwork[], simulationRound: number) => {
            const app = appRef.current;
            if (!app) return;

            abortRef.current = false;

            // Clear previous content
            app.stage.removeChildren();

            // Create main container
            const gameContainer = new Container();
            gameContainer.sortableChildren = true;
            app.stage.addChild(gameContainer);

            // Load track
            const track = new Track();
            await track.load(trackIndex);
            gameContainer.addChild(track);

            // Create HUD
            const dimensions = networks[0]?.dimensions || [5, 4, 2];
            const hud = new HUD(simulationRound, dimensions);
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

            // Ensure track overlay is on top
            const overlay = track.getOverlaySprite();
            if (overlay) {
                overlay.zIndex = 150;
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

                const deltaTime = app.ticker.deltaTime / 60; // Normalize to seconds

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
                                trainerNetwork.hasReachedGoal = cars[i].network.hasReachedGoal;
                            }
                        }

                        // Run evolution and create next generation
                        trainerRef.current.evolveAndSave();
                        setSimulationRound(trainerRef.current.simulationRound);
                    }

                    // Callback with updated networks
                    onSimulationComplete?.(cars.map((c) => c.network));
                    setIsSimulating(false);
                }
            };

            app.ticker.add(updateLoop);
        },
        [trackIndex, carImagePaths, onSimulationComplete]
    );

    // Start training with real networks from Trainer
    const startTraining = useCallback(async () => {
        setIsSimulating(true);

        // Create or reuse trainer (loads chromosomes from storage)
        if (!trainerRef.current) {
            trainerRef.current = new Trainer(trainingConfig);
            setSimulationRound(trainerRef.current.simulationRound);
        }

        // Convert trainer networks to SerializableNetwork for Car component
        const networks = trainerRef.current.networks.map(networkToSerializable);

        // Run simulation
        await simulateGeneration(networks, simulationRound);
    }, [simulateGeneration, simulationRound, trainingConfig]);

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

    return (
        <div className="game-container">
            <div ref={containerRef} className="canvas-wrapper" />
            <div className="controls">
                <button
                    onClick={startTraining}
                    disabled={isSimulating || isLoading}
                    className="train-button"
                >
                    {isLoading ? 'Loading...' : isSimulating ? 'Simulating... (ESC to abort)' : 'Start Training'}
                </button>
            </div>
            <style jsx>{`
        .game-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 20px;
        }
        .canvas-wrapper {
          border: 2px solid #333;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .controls {
          display: flex;
          gap: 12px;
        }
        .train-button {
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .train-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .train-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}

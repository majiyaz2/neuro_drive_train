// src/components/game/GameCanvas.tsx
'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { Track } from './Track';
import { Car, SerializableNetwork } from './Car';
import { HUD } from './HUD';

export interface GameCanvasProps {
    trackIndex?: number;
    carImagePaths?: string[];
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

// Demo network for testing when backend is not available
function createDemoNetwork(): SerializableNetwork {
    return {
        dimensions: [5, 4, 2],
        hasReachedGoal: false,
        smallestEdgeDistance: 100,
        highestCheckpoint: 0,
        layers: [
            {
                outputs: [0, 0, 0, 0],
                weights: Array(5).fill(Array(4).fill(0.5)),
                highestCheckpoint: 0,
            },
            {
                outputs: [0, 0],
                weights: Array(4).fill(Array(2).fill(0.5)),
                highestCheckpoint: 0,
            },
        ],
        inputs: [0, 0, 0, 0, 0],
        // Simple demo feedForward - always accelerate and steer based on radar
        feedForward: async (inputs: number[]) => {
            // Basic steering logic: turn towards the side with more open space
            const leftRadars = (inputs[0] + inputs[1]) / 2;
            const rightRadars = (inputs[3] + inputs[4]) / 2;
            const steer = (rightRadars - leftRadars) * 0.5;
            // Accelerate if front is clear
            const accelerate = inputs[2] > 0.3 ? 1 : 0;
            return [accelerate*2, -steer];
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
    onSimulationComplete,
}: GameCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<Application | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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

                    // Check road collision
                    if (!track.isRoad(car.position.x, car.position.y)) {
                        car.shutOff();
                    }

                    // Check checkpoints
                    for (let i = 0; i < track.checkpoints.length; i++) {
                        const [cx, cy] = track.checkpoints[i];
                        const distance = Math.sqrt(
                            Math.pow(cx - car.position.x, 2) + Math.pow(cy - car.position.y, 2)
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

                    // Update network stats
                    for (const car of cars) {
                        car.network.highestCheckpoint = car.lastCheckpointPassed;
                        car.network.smallestEdgeDistance = car.smallestEdgeDistance;
                        car.network.hasReachedGoal =
                            car.lastCheckpointPassed === track.checkpoints.length - 1;
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

    // Start training with demo networks
    const startTraining = useCallback(async () => {
        setIsSimulating(true);

        // Create demo networks for testing (5 cars)
        const networks: SerializableNetwork[] = Array(5)
            .fill(null)
            .map(() => createDemoNetwork());

        // Run simulation
        await simulateGeneration(networks, 1);
    }, [simulateGeneration]);

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

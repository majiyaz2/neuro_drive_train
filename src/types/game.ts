// src/types/game.ts

export interface Position {
    x: number;
    y: number;
}

export interface Radar {
    length: number;
    position: Position;
    hasCollided: boolean;
}

export interface RadarList {
    radars: Radar[];
}

export interface Layer {
    outputs: number[];
    weights: number[][];
    highestCheckpoint: number;
}

export interface NetworkOutput {
    dimensions: number[];
    hasReachedGoal: boolean;
    smallestEdgeDistance: number;
    highestCheckpoint: number;
    layers: Layer[];
    inputs: number[];
}

export interface TrackCheckpoint {
    x: number;
    y: number;
    id: number;
}

export interface SimulationStats {
    generation: number;
    populationAlive: number;
    populationTotal: number;
    averageCheckpoint: number;
    carsReachedGoal: number;
    averageEdgeDistance: number;
}

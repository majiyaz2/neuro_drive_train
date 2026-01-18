// src/components/game/Car.ts
import { Container, Sprite, Texture, Assets } from 'pixi.js';
import { Radar } from './Radar';
import type { Track } from './Track';
import type { NetworkOutput } from '@/types/game';

export interface CarConfig {
    maxSpeed: number;
    slippingSpeedRatio: number;
    anchorX: number;
    anchorY: number;
    radarAngles: number[];
    deceleration: number;
    acceleration: number;
}

const DEFAULT_CONFIG: CarConfig = {
    maxSpeed: 6.0,
    slippingSpeedRatio: 0.75,
    anchorX: 0.5,
    anchorY: 0.5,
    radarAngles: [-70, -35, 0, 35, 70],
    deceleration: 0.05,
    acceleration: 0.1,
};

export interface SerializableNetwork {
    dimensions: number[];
    hasReachedGoal: boolean;
    smallestEdgeDistance: number;
    highestCheckpoint: number;
    layers: {
        outputs: number[];
        weights: number[][];
        highestCheckpoint: number;
    }[];
    inputs: number[];
    feedForward?: (inputs: number[]) => Promise<number[]>;
}

export class Car extends Container {
    private body: Sprite | null = null;
    radars: Radar[] = [];
    private track: Track;
    network: SerializableNetwork;
    private config: CarConfig;

    speed: number = 0.0;
    carRotation: number = 0.0;
    isRunning: boolean = true;
    lastCheckpointPassed: number = 0;
    smallestEdgeDistance: number = 100;

    constructor(
        network: SerializableNetwork,
        track: Track,
        config: Partial<CarConfig> = {}
    ) {
        super();
        this.network = network;
        this.track = track;
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Create radars
        for (const angle of this.config.radarAngles) {
            const radar = new Radar(angle);
            this.radars.push(radar);
            this.addChild(radar);
        }
    }

    async loadSprite(texturePath: string): Promise<void> {
        const texture = await Assets.load<Texture>(texturePath);
        this.body = new Sprite(texture);
        this.body.anchor.set(this.config.anchorX, this.config.anchorY);
        this.addChild(this.body);

        // Position at first checkpoint
        if (this.track.checkpoints.length > 0) {
            const [startX, startY] = this.track.checkpoints[0];
            this.position.set(startX, startY);
        }
    }

    get slippingSpeed(): number {
        return this.config.maxSpeed * this.config.slippingSpeedRatio;
    }

    async update(deltaTime: number): Promise<void> {
        if (!this.body) return;

        const renderSpeed = deltaTime * 60;
        this.speed -= this.config.deceleration;

        if (this.isRunning) {
            // Get radar measurements (normalized 0-1)
            const measurements = this.radars.map(
                (radar) => this.probe(radar) / radar.maxLengthPixels
            );

            // Get neural network output
            let acceleration = 0;
            let steerPosition = 0;

            if (this.network.feedForward) {
                const outputs = await this.network.feedForward(measurements);
                [acceleration, steerPosition] = outputs;
            } else {
                // Network output via API will be handled externally
                // This is for local-only simulation
            }

            if (acceleration > 0) {
                this.speed += this.config.acceleration;
            }

            // Clamp speed
            if (this.speed > this.config.maxSpeed) {
                this.speed = this.config.maxSpeed;
            }

            // Calculate steer impact based on speed
            let steerImpact: number;
            if (this.speed > this.slippingSpeed) {
                steerImpact =
                    -this.speed / this.config.maxSpeed +
                    this.slippingSpeed / this.config.maxSpeed +
                    1;
            } else {
                steerImpact = 1;
            }

            this.carRotation -= steerPosition * this.speed * steerImpact * renderSpeed * 3;
        } else {
            // Gradual slowdown when not running
            this.speed -= 0.05 * this.speed;
        }

        // Stop completely if speed is too low
        if (this.speed < 0) {
            this.speed = 0.0;
            this.shutOff();
        }

        // Update visual rotation (PixiJS uses radians)
        this.body.rotation = -this.degreesToRadians(this.carRotation);

        // Update position
        const radians = this.degreesToRadians(this.carRotation);
        this.position.x += this.speed * renderSpeed * Math.cos(radians);
        this.position.y += this.speed * renderSpeed * Math.sin(radians);
    }

    private probe(radar: Radar): number {
        let probeLength = 0;
        const startX = this.position.x;
        const startY = this.position.y;
        let x2 = startX;
        let y2 = startY;

        const radians = this.degreesToRadians(this.carRotation + radar.angle);

        while (probeLength < radar.maxLengthPixels && this.track.isRoad(x2, y2)) {
            probeLength += 2;
            x2 = startX + probeLength * Math.cos(radians);
            y2 = startY + probeLength * Math.sin(radians);
        }

        radar.updateBeam(startX, startY, x2, y2, probeLength);

        if (probeLength < this.smallestEdgeDistance) {
            this.smallestEdgeDistance = probeLength;
        }

        return probeLength;
    }

    hitCheckpoint(id: number): void {
        if (id - this.lastCheckpointPassed === 1) {
            this.lastCheckpointPassed = id;
        } else if (id < this.lastCheckpointPassed) {
            this.shutOff();
        }
    }

    shutOff(): void {
        this.isRunning = false;
        // Hide radars
        for (const radar of this.radars) {
            radar.visible = false;
        }
    }

    private degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    getRadarMeasurements(): number[] {
        return this.radars.map((r) => r.length / r.maxLengthPixels);
    }

    destroy(): void {
        for (const radar of this.radars) {
            radar.destroy();
        }
        this.body?.destroy();
        super.destroy();
    }
}

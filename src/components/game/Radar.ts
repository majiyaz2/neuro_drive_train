// src/components/game/Radar.ts
import { Graphics, Container } from 'pixi.js';

export interface RadarConfig {
    maxLengthPixels: number;
    beamColor: number;
    beamAlpha: number;
    beamWidth: number;
}

const DEFAULT_CONFIG: RadarConfig = {
    maxLengthPixels: 200,
    beamColor: 0xffffff,
    beamAlpha: 0.5,
    beamWidth: 2,
};

export class Radar extends Container {
    radarAngle: number;
    private beam: Graphics;
    private config: RadarConfig;
    x2: number = 0;
    y2: number = 0;
    length: number = 0;
    hasCollided: boolean = false;

    constructor(angle: number, config: Partial<RadarConfig> = {}) {
        super();
        this.radarAngle = angle;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.beam = new Graphics();
        this.addChild(this.beam);
    }

    get maxLengthPixels(): number {
        return this.config.maxLengthPixels;
    }

    updateBeam(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        probeLength: number
    ): void {
        this.x2 = endX;
        this.y2 = endY;
        this.length = probeLength;
        this.hasCollided = probeLength < this.config.maxLengthPixels;

        // Redraw beam line
        this.beam.clear();
        this.beam
            .moveTo(startX, startY)
            .lineTo(endX, endY)
            .stroke({
                width: this.config.beamWidth,
                color: this.config.beamColor,
                alpha: this.config.beamAlpha,
            });
    }

    destroy(): void {
        this.beam.destroy();
        super.destroy();
    }
}

// src/components/game/Track.ts
import { Container, Sprite, Texture, Assets } from 'pixi.js';

export interface TrackData {
    checkpoints: [number, number][];
}

export interface TrackConfig {
    width: number;
    height: number;
    roadColor: { r: number; g: number; b: number; a: number };
}

const DEFAULT_CONFIG: TrackConfig = {
    width: 960,
    height: 540,
    roadColor: { r: 75, g: 75, b: 75, a: 255 },
};

export class Track extends Container {
    private backgroundSprite: Sprite | null = null;
    private overlaySprite: Sprite | null = null;
    private mapMatrix: number[][] = [];
    checkpoints: [number, number][] = [];
    private config: TrackConfig;

    constructor(config: Partial<TrackConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async load(trackIndex: number): Promise<void> {
        const basePath = `/assets/tracks`;

        // Load track images
        const [backgroundTexture, overlayTexture, trackData] = await Promise.all([
            Assets.load<Texture>(`${basePath}/track${trackIndex}.png`),
            Assets.load<Texture>(`${basePath}/track${trackIndex}-overlay.png`),
            fetch(`${basePath}/track${trackIndex}.json`).then((res) => res.json()) as Promise<TrackData>,
        ]);

        // Create background sprite
        this.backgroundSprite = new Sprite(backgroundTexture);
        this.backgroundSprite.zIndex = 0;
        this.addChild(this.backgroundSprite);

        // Create overlay sprite (rendered on top of cars)
        this.overlaySprite = new Sprite(overlayTexture);
        this.overlaySprite.zIndex = 100;
        this.addChild(this.overlaySprite);

        // Store checkpoints
        this.checkpoints = trackData.checkpoints;

        // Build collision map from background image (load directly by path)
        await this.buildCollisionMap(trackIndex);

        // Enable sorting for z-index
        this.sortableChildren = true;
    }

    private async buildCollisionMap(trackIndex: number): Promise<void> {
        // Create a canvas to extract pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D context');

        canvas.width = this.config.width;
        canvas.height = this.config.height;

        // Load image directly from known path
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = `/assets/tracks/track${trackIndex}.png`;

        await new Promise<void>((resolve, reject) => {
            image.onload = () => {
                ctx.drawImage(image, 0, 0);
                resolve();
            };
            image.onerror = (err) => {
                console.error('Failed to load image for collision map:', err);
                reject(new Error('Failed to load track image'));
            };
            // Handle case where image is already cached
            if (image.complete && image.naturalWidth > 0) {
                ctx.drawImage(image, 0, 0);
                resolve();
            }
        });

        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, this.config.width, this.config.height);
        const pixels = imageData.data;

        // Build map matrix
        this.mapMatrix = [];
        const { roadColor } = this.config;

        for (let y = 0; y < this.config.height; y++) {
            const row: number[] = [];
            for (let x = 0; x < this.config.width; x++) {
                const i = (y * this.config.width + x) * 4;
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];

                // Check if pixel matches road color
                const isRoad =
                    r === roadColor.r &&
                    g === roadColor.g &&
                    b === roadColor.b &&
                    a === roadColor.a;
                row.push(isRoad ? 1 : 0);
            }
            this.mapMatrix.push(row);
        }
    }

    isRoad(x: number, y: number): boolean {
        if (x < 0 || x >= this.config.width || y < 0 || y >= this.config.height) {
            return false;
        }
        // PixiJS uses standard coordinate system (y increases downward)
        const row = this.mapMatrix[Math.floor(y)];
        if (!row) return false;
        return row[Math.floor(x)] === 1;
    }

    getOverlaySprite(): Sprite | null {
        return this.overlaySprite;
    }
}

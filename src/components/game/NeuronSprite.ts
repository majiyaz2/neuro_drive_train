// src/components/game/NeuronSprite.ts
import { Container, Graphics, Text, TextStyle } from 'pixi.js';

export interface NeuronConfig {
    borderRadius: number;
    fillRadius: number;
    borderColor: number;
    fontSize: number;
}

const DEFAULT_CONFIG: NeuronConfig = {
    borderRadius: 22,
    fillRadius: 20,
    borderColor: 0x000000,
    fontSize: 12,
};

export class NeuronSprite extends Container {
    private border: Graphics;
    private fill: Graphics;
    private valueText: Text;
    private config: NeuronConfig;

    constructor(x: number, y: number, config: Partial<NeuronConfig> = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.position.set(x, y);

        // Create border circle
        this.border = new Graphics();
        this.border.circle(0, 0, this.config.borderRadius).fill(this.config.borderColor);
        this.addChild(this.border);

        // Create fill circle
        this.fill = new Graphics();
        this.fill.circle(0, 0, this.config.fillRadius).fill(0xffffff);
        this.addChild(this.fill);

        // Create value text
        const textStyle = new TextStyle({
            fontSize: this.config.fontSize,
            fill: 0xffffff,
        });
        this.valueText = new Text({ text: '0.00', style: textStyle });
        this.valueText.anchor.set(0.5, 0.5);
        this.addChild(this.valueText);
    }

    update(value: number): void {
        this.valueText.text = value.toFixed(2);

        // Update fill color based on value
        this.fill.clear();
        let color: number;

        if (value > 0) {
            // Green for positive - clamp to valid range
            const greenIntensity = Math.min(255, Math.floor(Math.abs(value) * 200));
            color = (greenIntensity << 8); // 0x00XX00
        } else {
            // Red for negative
            const redIntensity = Math.min(255, Math.floor(Math.abs(value) * 200));
            color = (redIntensity << 16); // 0xXX0000
        }

        this.fill.circle(0, 0, this.config.fillRadius).fill(color);
    }

    destroy(): void {
        this.border.destroy();
        this.fill.destroy();
        this.valueText.destroy();
        super.destroy();
    }
}

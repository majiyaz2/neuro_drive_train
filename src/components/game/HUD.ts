// src/components/game/HUD.ts
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { NeuronSprite } from './NeuronSprite';
import type { SerializableNetwork } from './Car';

export interface HUDConfig {
    canvasHeight: number;
    labelColor: number;
    fontSize: number;
    neuronSpacing: number;
    layerSpacing: number;
}

const DEFAULT_CONFIG: HUDConfig = {
    canvasHeight: 540,
    labelColor: 0x000000,
    fontSize: 14,
    neuronSpacing: 50,
    layerSpacing: 50,
};

export class HUD extends Container {
    private roundLabel: Text;
    private populationLabel: Text;
    private speedLabel: Text;
    private neurons: NeuronSprite[] = [];
    private config: HUDConfig;
    private background: Graphics;

    constructor(
        simulationRound: number,
        dimensions: number[],
        config: Partial<HUDConfig> = {}
    ) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };

        // Semi-transparent background for readability
        this.background = new Graphics();
        this.background.rect(0, 0, 400, 40).fill({ color: 0xffffff, alpha: 0.7 });
        this.background.position.set(10, this.config.canvasHeight - 35);
        this.addChild(this.background);

        const textStyle = new TextStyle({
            fontSize: this.config.fontSize,
            fill: this.config.labelColor,
            fontFamily: 'Arial',
        });

        // Create labels
        this.roundLabel = new Text({ text: `Round: ${simulationRound}`, style: textStyle });
        this.roundLabel.position.set(20, this.config.canvasHeight - 30);
        this.addChild(this.roundLabel);

        this.populationLabel = new Text({ text: 'Population: 0/0', style: textStyle });
        this.populationLabel.position.set(120, this.config.canvasHeight - 30);
        this.addChild(this.populationLabel);

        this.speedLabel = new Text({ text: 'Speed: 0.00', style: textStyle });
        this.speedLabel.position.set(280, this.config.canvasHeight - 30);
        this.addChild(this.speedLabel);

        // Create neural network visualization
        this.buildNeuronVisualization(dimensions);
    }

    private buildNeuronVisualization(dimensions: number[]): void {
        let x = 40;

        for (const neuronCount of dimensions) {
            const totalHeight = neuronCount * this.config.neuronSpacing - 10;
            let y = (this.config.canvasHeight - totalHeight) / 2;

            for (let i = 0; i < neuronCount; i++) {
                const neuron = new NeuronSprite(x, y);
                this.neurons.push(neuron);
                this.addChild(neuron);
                y += this.config.neuronSpacing;
            }

            x += this.config.layerSpacing;
        }
    }

    update(
        network: SerializableNetwork,
        alive: number,
        population: number,
        speed: number
    ): void {
        this.populationLabel.text = `Population: ${alive}/${population}`;
        this.speedLabel.text = `Speed: ${speed.toFixed(2)}`;

        // Update neuron values
        let index = 0;

        // Update input layer neurons
        for (const input of network.inputs) {
            if (this.neurons[index]) {
                this.neurons[index].update(input);
                index++;
            }
        }

        // Update hidden and output layer neurons
        for (const layer of network.layers) {
            for (const value of layer.outputs) {
                if (this.neurons[index]) {
                    this.neurons[index].update(value);
                    index++;
                }
            }
        }
    }

    setRound(round: number): void {
        this.roundLabel.text = `Round: ${round}`;
    }

    destroy(): void {
        for (const neuron of this.neurons) {
            neuron.destroy();
        }
        this.roundLabel.destroy();
        this.populationLabel.destroy();
        this.speedLabel.destroy();
        this.background.destroy();
        super.destroy();
    }
}

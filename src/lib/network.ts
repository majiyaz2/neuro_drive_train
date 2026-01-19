export class Layer {
    outputs: number[];
    weights: number[][];
    highestCheckpoint: number = 0;

    constructor(outputsCount: number, inputCounts: number) {
        this.outputs = new Array(outputsCount).fill(0.0)
        this.weights = Array.from({ length: outputsCount }, () =>
            Array.from({ length: inputCounts }, () => Math.random() * 2 - 1)
        )
    }

    feedForward(inputs: number[]): void {
        for (let outputIndex = 0; outputIndex < this.outputs.length; outputIndex++) {
            let sum = 0;
            for (let inputIndex = 0; inputIndex < inputs.length; inputIndex++) {
                sum += (inputs[inputIndex] ?? 0) * (this.weights[outputIndex]?.[inputIndex] ?? 0);
            }
            this.outputs[outputIndex] = Math.tanh(sum);
        }
    }
}

export interface RankableChromosome {
    chromosome: number[];
    smallestEdgeDistance: number;
    highestCheckpoint: number;
}

export class Network {
    dimensions: number[];
    hasReachedGoal: boolean = false;
    smallestEdgeDistance: number = 0;
    highestCheckpoint: number = 0;
    layers: Layer[] = [];
    inputs: number[] = [];

    constructor(dimensions: number[]) {
        this.dimensions = dimensions;
        for (let i = 0; i < dimensions.length - 1; i++) {
            this.layers.push(new Layer(dimensions[i + 1] ?? 0, dimensions[i] ?? 0));
        }
    }

    feedForward(inputs: number[]): number[] | undefined {
        this.inputs = [...inputs];
        let currentInputs = inputs;
        for (const layer of this.layers) {
            layer.feedForward(currentInputs);
            currentInputs = [...layer.outputs];
        }
        return this.layers[this.layers.length - 1]?.outputs;
    }

    serialize(): RankableChromosome {
        const chromosome: number[] = [];
        for (const layer of this.layers) {
            for (const weights of layer.weights) {
                for (const weight of weights) {
                    chromosome.push(weight);
                }
            }
        }
        return {
            chromosome,
            smallestEdgeDistance: this.smallestEdgeDistance,
            highestCheckpoint: this.highestCheckpoint
        }
    }

    deserialize(chromosome: number[]): void {
        let layerIndex = 0;
        let outputIndex = 0;
        let inputIndex = 0;

        for (const gene of chromosome) {
            this.layers[layerIndex]!.weights[outputIndex]![inputIndex] = gene;
            inputIndex++;
            if (inputIndex > this.layers[layerIndex]!.weights[outputIndex]!.length - 1) {
                inputIndex = 0;
                outputIndex++;
                if (outputIndex > this.layers[layerIndex]!.weights!.length - 1) {
                    outputIndex = 0;
                    layerIndex++;
                }
            }
        }
    }
}

export function compareChromosomes(a: RankableChromosome, b: RankableChromosome): number {
    if (a.highestCheckpoint == b.highestCheckpoint) {
        return b.smallestEdgeDistance - a.smallestEdgeDistance;
    }
    return b.highestCheckpoint - a.highestCheckpoint;
}
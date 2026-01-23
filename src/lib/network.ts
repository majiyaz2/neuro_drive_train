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
    dimensions: number[];
    smallestEdgeDistance: number;
    highestCheckpoint: number;
    distanceCovered: number;
    survivalTime: number;
    wallProximityPenalty: number;
}

export class Network {
    dimensions: number[];
    hasReachedGoal: boolean = false;
    smallestEdgeDistance: number = 0;
    highestCheckpoint: number = 0;
    distanceCovered: number = 0;
    survivalTime: number = 0;
    wallProximityPenalty: number = 0;
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
            dimensions: this.dimensions,
            smallestEdgeDistance: this.smallestEdgeDistance,
            highestCheckpoint: this.highestCheckpoint,
            distanceCovered: this.distanceCovered,
            survivalTime: this.survivalTime,
            wallProximityPenalty: this.wallProximityPenalty
        }
    }

    deserialize(data: number[] | RankableChromosome): void {
        const chromosome = Array.isArray(data) ? data : data.chromosome;

        if (!chromosome || !Array.isArray(chromosome)) {
            console.error("Invalid chromosome data for deserialization:", data);
            throw new Error("chromosome is not iterable");
        }

        let layerIndex = 0;
        let outputIndex = 0;
        let inputIndex = 0;

        for (const gene of chromosome) {
            const layer = this.layers[layerIndex];
            if (!layer) break;

            const weights = layer.weights[outputIndex];
            if (!weights) break;

            weights[inputIndex] = gene;
            inputIndex++;

            if (inputIndex > weights.length - 1) {
                inputIndex = 0;
                outputIndex++;
                if (outputIndex > layer.weights.length - 1) {
                    outputIndex = 0;
                    layerIndex++;
                }
            }
        }
    }
}

/**
 * Calculate progressive checkpoint reward.
 * Later checkpoints are worth exponentially more to encourage passing difficult sections.
 * Checkpoint 1: 100, Checkpoint 5: 500, Checkpoint 10: 5000+
 */
export function calculateProgressiveCheckpointReward(checkpointsPassed: number): number {
    let totalReward = 0;
    for (let i = 1; i <= checkpointsPassed; i++) {
        // Exponential growth: reward = 100 * 1.5^(checkpoint-1)
        // Checkpoint 1: 100, 2: 150, 3: 225, 4: 337, 5: 506, 6: 759, 7: 1139, 8: 1708...
        totalReward += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    return totalReward;
}

/**
 * Calculate a weighted fitness score for a chromosome.
 * Higher score = better performance.
 */
export function calculateFitness(c: RankableChromosome): number {
    // Weights for each component
    const DISTANCE_WEIGHT = 1.0;          // Primary: distance traveled
    const SURVIVAL_WEIGHT = 5.0;          // Reward for surviving longer
    const WALL_PENALTY_WEIGHT = -10.0;    // Penalty for driving close to walls
    const AVG_SPEED_WEIGHT = 2.0;         // Reward for efficient driving

    // Calculate average speed (distance / time), avoid division by zero
    const avgSpeed = c.survivalTime > 0 ? c.distanceCovered / c.survivalTime : 0;

    // Use progressive checkpoint rewards (later checkpoints worth more)
    const checkpointReward = calculateProgressiveCheckpointReward(c.highestCheckpoint);

    // Calculate weighted fitness
    const fitness =
        (c.distanceCovered * DISTANCE_WEIGHT) +
        checkpointReward +
        (c.survivalTime * SURVIVAL_WEIGHT) +
        (c.wallProximityPenalty * WALL_PENALTY_WEIGHT) +
        (avgSpeed * AVG_SPEED_WEIGHT);

    return fitness;
}

export function compareChromosomes(a: RankableChromosome, b: RankableChromosome): number {
    // Compare by weighted fitness score (higher is better)
    return calculateFitness(b) - calculateFitness(a);
}
import { Evolution } from "./evolution";
import { Network } from "./network";
import type { RankableChromosome } from "./network";
import { Storage } from "./storage";

export interface TrainingConfig {
    networkDimensions: number[];
    populationCount: number;
    keepCount: number;
    maxGenerationIterations: number;
}

const DEFAULT_CONFIG: TrainingConfig = {
    networkDimensions: [5, 4, 2],
    populationCount: 10,
    keepCount: 2,
    maxGenerationIterations: 10
}

export class Trainer {
    private config: TrainingConfig;
    private evolution: Evolution;
    private storage: Storage;
    networks: Network[];
    private _simulationRound: number = 1;

    get simulationRound(): number {
        return this._simulationRound;
    }

    incrementRound(): void {
        this._simulationRound++;
    }

    /**
     * Run evolution on current networks and save best chromosomes to storage.
     * Creates new networks from evolved offspring for next generation.
     */
    evolveAndSave(): void {
        console.log(`=== Evolution after Round ${this._simulationRound} ===`);

        const avgCheckpoint = this.networks.reduce(
            (acc, network) => acc + network.highestCheckpoint, 0)
            / this.networks.length;
        const carsReachedGoal = this.networks.filter((n) => n.hasReachedGoal).length;
        const avgSmallestEdgeDistance = this.networks.slice(0, this.config.keepCount).reduce(
            (acc, network) => acc + network.smallestEdgeDistance, 0)
            / this.config.keepCount;

        console.log(`Average checkpoint: ${avgCheckpoint.toFixed(2)}`);
        console.log(`Cars reached goal: ${carsReachedGoal}/${this.config.populationCount}`);
        console.log(`Average smallest edge distance: ${avgSmallestEdgeDistance.toFixed(2)}`);

        const serialized: RankableChromosome[] = this.networks.map((n) => n.serialize());
        const offspring = this.evolution.execute(serialized);
        this.storage.save(offspring.slice(0, this.config.keepCount));

        this.networks = offspring.map((chromosome) => {
            const network = new Network(this.config.networkDimensions);
            network.deserialize(chromosome);
            return network;
        });

        this._simulationRound++;
    }

    constructor(config: Partial<TrainingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.networks = Array.from(
            { length: this.config.populationCount },
            () => new Network(this.config.networkDimensions)
        )
        this.evolution = new Evolution(
            this.config.populationCount,
            this.config.keepCount
        );
        this.storage = new Storage("chromosomes.json");

        const bestChromosomes = this.storage.load();
        for (let i = 0; i < bestChromosomes.length; i++) {
            this.networks[i]!.deserialize(bestChromosomes[i]!);
        }
    }

    train(): Network[] {
        while (this.simulationRound <= this.config.maxGenerationIterations) {
            console.log(`=== Round ${this.simulationRound} ===`);
            this.simulateGeneration();
            this.incrementRound();

            const avgCheckpoint = this.networks.reduce(
                (acc, network) => acc + network.highestCheckpoint, 0)
                / this.networks.length;
            const carsReachedGoal = this.networks.filter((n) => n.hasReachedGoal).length;
            const avgSmallestEdgeDistance = this.networks.slice(0, this.config.keepCount).reduce(
                (acc, network) => acc + network.smallestEdgeDistance, 0)
                / this.config.keepCount;

            console.log(`Average checkpoint: ${avgCheckpoint}`);
            console.log(`Cars reached goal: ${carsReachedGoal}`);
            console.log(`Average smallest edge distance: ${avgSmallestEdgeDistance}`);

            const serialized: RankableChromosome[] = this.networks.map((n) => n.serialize());
            const offspring = this.evolution.execute(serialized)
            this.storage.save(offspring.slice(0, this.config.keepCount))
            if (this.simulationRound <= this.config.maxGenerationIterations) {
                this.networks = offspring.map((c) => {
                    const network = new Network(this.config.networkDimensions)
                    network.deserialize(c)
                    return network
                });
            } else {
                const newNetworks: Network[] = [];
                for (let i = 0; i < this.config.populationCount; i++) {
                    const network = new Network(this.config.networkDimensions)
                    network.deserialize(offspring[i]!)
                    network.highestCheckpoint = this.networks[i]!.highestCheckpoint
                    network.smallestEdgeDistance = this.networks[i]!.smallestEdgeDistance
                    network.hasReachedGoal = this.networks[i]!.hasReachedGoal
                    newNetworks.push(network)
                }
                this.networks = newNetworks
            }

        }
        return this.networks;
    }

    private simulateGeneration(): void {
        for (const network of this.networks) {
            network.highestCheckpoint = Math.floor(Math.random() * 11)
            network.smallestEdgeDistance = Math.random() * 2 - 1
            network.hasReachedGoal = Math.random() > 0.5
        }
    }




}
/**
 * Browser-compatible Trainer that uses localStorage for persistence.
 * Use this in client components instead of the server-side Trainer.
 */
import { Evolution } from "./evolution";
import { Network } from "./network";
import type { RankableChromosome } from "./network";
import { BrowserStorage } from "./browserStorage";

export interface TrainingConfig {
    networkDimensions: number[];
    populationCount: number;
    keepCount: number;
    maxGenerationIterations: number;
    mutationRate: number;
}

const DEFAULT_CONFIG: TrainingConfig = {
    networkDimensions: [5, 4, 3],
    populationCount: 10,
    keepCount: 2,
    maxGenerationIterations: 10,
    mutationRate: 0.05
};

export class BrowserTrainer {
    private config: TrainingConfig;
    private evolution: Evolution;
    private storage: BrowserStorage;
    networks: Network[];
    private _simulationRound: number = 1;
    private addLog?: (log: string) => void;

    get simulationRound(): number {
        return this._simulationRound;
    }

    get maxGenerationIterations(): number {
        return this.config.maxGenerationIterations;
    }

    /**
     * Check if training can continue (i.e., we haven't hit the max iterations).
     */
    canContinue(): boolean {
        return this._simulationRound < this.config.maxGenerationIterations;
    }

    incrementRound(): void {
        this._simulationRound++;
    }

    /**
     * Run evolution on current networks and save best chromosomes to localStorage.
     * Creates new networks from evolved offspring for next generation.
     */
    evolveAndSave(): void {
        this.addLog?.(`=== Round ${this._simulationRound} Results ===`);

        const avgCheckpoint = this.networks.reduce(
            (acc, network) => acc + network.highestCheckpoint, 0)
            / this.networks.length;
        const carsReachedGoal = this.networks.filter((n) => n.hasReachedGoal).length;
        const avgSmallestEdgeDistance = this.networks.slice(0, this.config.keepCount).reduce(
            (acc, network) => acc + network.smallestEdgeDistance, 0)
            / this.config.keepCount;

        this.addLog?.(`Average checkpoint: ${avgCheckpoint.toFixed(2)}`);
        this.addLog?.(`Cars reached goal: ${carsReachedGoal}/${this.config.populationCount}`);
        this.addLog?.(`Average smallest edge distance: ${avgSmallestEdgeDistance.toFixed(2)}`);

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

    constructor(config: Partial<TrainingConfig> = {}, addLog?: (log: string) => void) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.networks = Array.from(
            { length: this.config.populationCount },
            () => new Network(this.config.networkDimensions)
        );
        this.evolution = new Evolution(
            this.config.populationCount,
            this.config.keepCount,
            this.config.mutationRate
        );
        this.storage = new BrowserStorage("chromosomes");

        if (addLog) {
            this.addLog = addLog;
        }

        // Load best chromosomes from localStorage if available
        const bestChromosomes = this.storage.load();
        for (let i = 0; i < Math.min(bestChromosomes.length, this.networks.length); i++) {
            this.networks[i]!.deserialize(bestChromosomes[i]!);
        }
    }

    /**
     * Update configuration at runtime.
     * Recreates networks and evolution with new population size.
     */
    updateConfig(config: Partial<TrainingConfig>): void {
        const newConfig = { ...this.config, ...config };

        // Only recreate if population size changed
        if (newConfig.populationCount !== this.config.populationCount) {
            this.config = newConfig;
            this.networks = Array.from(
                { length: this.config.populationCount },
                () => new Network(this.config.networkDimensions)
            );
            this.evolution = new Evolution(
                this.config.populationCount,
                this.config.keepCount,
                this.config.mutationRate
            );

            // Load best chromosomes from localStorage if available
            const bestChromosomes = this.storage.load();
            for (let i = 0; i < Math.min(bestChromosomes.length, this.networks.length); i++) {
                this.networks[i]!.deserialize(bestChromosomes[i]!);
            }
        } else {
            // Just update config values that don't require network recreation
            this.config = newConfig;
            this.evolution = new Evolution(
                this.config.populationCount,
                this.config.keepCount,
                this.config.mutationRate
            );
        }

        console.log('Training config updated:', this.config);
    }
}

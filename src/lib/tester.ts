import { Network } from "./network";
import { Storage } from "./storage";

export interface TestingConfig {
    networkDimensions: number[];
    populationCount: number;
    keepCount: number;
    maxGenerationIterations: number;
}

const DEFAULT_CONFIG: TestingConfig = {
    networkDimensions: [5, 4, 2],
    populationCount: 10,
    keepCount: 2,
    maxGenerationIterations: 10
}

export class Tester {
    private config: TestingConfig;
    private storage: Storage;
    networks: Network[];
    private simulationRound: number = 1

    constructor(config: Partial<TestingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.networks = Array.from(
            {length: this.config.populationCount},
            () => new Network(this.config.networkDimensions)
        )
        this.storage = new Storage("chromosomes.json");
        
        const bestChromosomes = this.storage.load();
        for (let i = 0; i < bestChromosomes.length; i++) {
            this.networks[i]!.deserialize(bestChromosomes[i]!);
        }
    }

    test(): Network[]{
        while (this.simulationRound <= this.config.maxGenerationIterations) {
        console.log(`=== Round ${this.simulationRound} ===`);
        this.simulationRound++;

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
    }
    return this.networks;
}

}
import { compareChromosomes } from "./network";
import type { RankableChromosome } from "./network";

export class Evolution {
    populationCount: number;
    keepCount: number;
    mutationRate: number;

    constructor(populationCount: number, keepCount: number, mutationRate: number = 0.2) {
        this.populationCount = populationCount;
        this.keepCount = keepCount;
        this.mutationRate = mutationRate;
    }

    execute(rankableChromosomes: RankableChromosome[]): number[][] {
        const sortedChromosomes = [...rankableChromosomes].sort(compareChromosomes).map(c => c.chromosome);
        const keepChromosomes = sortedChromosomes.slice(0, this.keepCount);

        // Start with the best performers (elitism)
        const offspring: number[][] = [...keepChromosomes.map((c) => [...c])];

        // Fill remaining population with crossover offspring
        while (offspring.length < this.populationCount) {
            // Select two random parents from the kept chromosomes
            const parent1Index = Math.floor(Math.random() * keepChromosomes.length);
            let parent2Index = Math.floor(Math.random() * keepChromosomes.length);
            // Ensure different parents if possible
            if (keepChromosomes.length > 1 && parent2Index === parent1Index) {
                parent2Index = (parent1Index + 1) % keepChromosomes.length;
            }

            const parent1 = keepChromosomes[parent1Index]!;
            const parent2 = keepChromosomes[parent2Index]!;
            const splitIndex = Math.floor(Math.random() * parent1.length);

            // Create child via crossover
            const child = [
                ...parent1.slice(0, splitIndex),
                ...parent2.slice(splitIndex)
            ];
            offspring.push(child);
        }

        // Mutation - apply mutation to non-elite offspring
        for (let i = this.keepCount; i < offspring.length; i++) {
            for (let j = 0; j < offspring[i]!.length; j++) {
                if (Math.random() < this.mutationRate) {
                    offspring[i]![j] = Math.random() * 2 - 1;
                }
            }
        }

        return offspring;
    }

}
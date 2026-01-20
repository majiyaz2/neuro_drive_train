import { compareChromosomes } from "./network";
import type { RankableChromosome } from "./network";

export class Evolution {
    populationCount: number;
    keepCount: number;

    constructor(populationCount: number, keepCount: number) {
        this.populationCount = populationCount;
        this.keepCount = keepCount;
    }

    execute(rankableChromosomes: RankableChromosome[]): number[][] {
        const sortedChromosomes = [...rankableChromosomes].sort(compareChromosomes).map(c => c.chromosome);
        const keepChromosomes = sortedChromosomes.slice(0, this.keepCount);
        // Cross Over
        const reproductionTimes = Math.floor(
            (this.populationCount - this.keepCount) / this.keepCount
        );
        const offspring: number[][] = [...keepChromosomes.map((c) => [...c])];
        for (let i = 0; i < reproductionTimes; i++) {
            for (let j = 0; j < keepChromosomes.length - 1; j += 2) {
                const parent1 = keepChromosomes[j]!;
                const parent2 = keepChromosomes[j + 1]!;
                const splitIndex = Math.floor(Math.random() * parent1.length);
                offspring.push([
                    ...parent1.slice(0, splitIndex),
                    ...parent2.slice(splitIndex)
                ]);
                offspring.push([
                    ...parent2.slice(0, splitIndex),
                    ...parent1.slice(splitIndex)
                ]);
            }
        }
        // Mutation
        for (let i = this.keepCount; i < offspring.length; i++) {
            for (let j = 0; j < offspring[i]!.length; j++) {
                if (Math.floor(Math.random() * 5) == 1) {
                    offspring[i]![j] = Math.random() * 2 - 1;
                }
            }
        }

        if (offspring.length !== this.populationCount) {
            throw new Error("Offspring length is not equal to population count");
        }
        return offspring;
    }

}
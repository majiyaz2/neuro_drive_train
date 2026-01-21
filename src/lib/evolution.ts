import { compareChromosomes } from "./network";
import type { RankableChromosome } from "./network";

export class Evolution {
    populationCount: number;
    keepCount: number;
    baseMutationRate: number;
    generation: number = 0;

    constructor(populationCount: number, keepCount: number, mutationRate: number = 0.2) {
        this.populationCount = populationCount;
        this.keepCount = keepCount;
        this.baseMutationRate = mutationRate;
    }

    /**
     * Generate a random number from a Gaussian (normal) distribution
     * using the Box-Muller transform.
     * @param mean - The mean of the distribution (default 0)
     * @param stdDev - The standard deviation (default 1)
     */
    private gaussianRandom(mean: number = 0, stdDev: number = 1): number {
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stdDev + mean;
    }

    /**
     * Calculate adaptive mutation rate based on generation.
     * Starts strong and decreases over time, but never below a minimum.
     */
    private getAdaptiveMutationRate(): number {
        // Decay factor: mutation rate decreases as generations increase
        // Formula: rate = base * (1 / (1 + generation * 0.02))
        // This ensures rate decreases but never goes below ~25% of base rate
        const decayFactor = 1 / (1 + this.generation * 0.02);
        const minRate = this.baseMutationRate * 0.25;
        return Math.max(minRate, this.baseMutationRate * decayFactor);
    }

    /**
     * Calculate adaptive mutation strength (how much to perturb weights).
     * Decreases over time for finer adjustments in later generations.
     */
    private getAdaptiveMutationStrength(): number {
        // Start with larger perturbations, become more precise over time
        // Range: 0.5 (early) to 0.1 (late generations)
        const strength = 0.5 / (1 + this.generation * 0.05);
        return Math.max(0.1, strength);
    }

    execute(rankableChromosomes: RankableChromosome[], isStagnated: boolean = false): number[][] {
        this.generation++;

        const sortedChromosomes = [...rankableChromosomes].sort(compareChromosomes).map(c => c.chromosome);
        const keepChromosomes = sortedChromosomes.slice(0, this.keepCount);

        // Start with the best performers (elitism)
        const offspring: number[][] = [...keepChromosomes.map((c) => [...c])];

        // Calculate how many random immigrants to introduce when stagnated
        const randomImmigrantCount = isStagnated
            ? Math.floor((this.populationCount - this.keepCount) * 0.2) // 20% random immigrants
            : 0;

        // Add random immigrants (completely new random chromosomes)
        const chromosomeLength = keepChromosomes[0]?.length ?? 0;
        for (let i = 0; i < randomImmigrantCount; i++) {
            const randomChromosome = Array.from(
                { length: chromosomeLength },
                () => Math.random() * 2 - 1
            );
            offspring.push(randomChromosome);
        }

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

        // Adaptive mutation parameters
        let mutationRate = this.getAdaptiveMutationRate();
        let mutationStrength = this.getAdaptiveMutationStrength();

        // HYPERMUTATION: When stagnated, drastically increase mutation
        if (isStagnated) {
            mutationRate = Math.min(0.8, mutationRate * 3); // 3x mutation rate, max 80%
            mutationStrength = Math.min(0.8, mutationStrength * 2); // 2x strength
        }

        const replacementChance = isStagnated ? 0.3 : 0.15; // More full replacements when stagnated

        // Mutation - apply adaptive mutation to non-elite offspring
        for (let i = this.keepCount; i < offspring.length; i++) {
            for (let j = 0; j < offspring[i]!.length; j++) {
                if (Math.random() < mutationRate) {
                    if (Math.random() < replacementChance) {
                        // Full replacement: completely random new weight (exploration)
                        offspring[i]![j] = Math.random() * 2 - 1;
                    } else {
                        // Gaussian perturbation: add noise to existing weight (exploitation)
                        const perturbation = this.gaussianRandom(0, mutationStrength);
                        offspring[i]![j] = Math.max(-1, Math.min(1, offspring[i]![j]! + perturbation));
                    }
                }
            }
        }

        return offspring;
    }

    /**
     * Reset generation counter (call when restarting training)
     */
    resetGeneration(): void {
        this.generation = 0;
    }
}

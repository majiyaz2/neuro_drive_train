

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Network } from "@/server/lib/network";
import { Storage } from "@/server/lib/storage";
import { Tester } from "@/server/lib/tester";
import { Trainer } from "@/server/lib/trainer";
import { PredictInputSChema, NetworkInputSchema } from "@/server/types/neuralNetwork";
import { z } from "zod";

// Network dimensions must match what was used during training
const NETWORK_DIMENSIONS = [5, 4, 2];

export const neuralNetworkRouter = createTRPCRouter({
    predict: publicProcedure
        .input(PredictInputSChema)
        .mutation(({ input }) => {
            const { radars, network: networkInput } = input;

            const network = new Network(networkInput.dimensions);
            const chromosome: number[] = [];
            for (const layer of networkInput.layers) {
                for (const weights of layer.weights) {
                    for (const weight of weights) {
                        chromosome.push(weight);
                    }
                }
            }
            network.deserialize(chromosome);

            const radarlengths = radars.radars.map((r) => r.length);
            const result = network.feedForward(radarlengths);
            return result ?? [];
        }),

    train: publicProcedure.query(async () => {
        const trainer = new Trainer();
        const networks = trainer.train();
        return networks.map((network) => ({
            dimensions: network.dimensions,
            hasReachedGoal: network.hasReachedGoal,
            highestCheckpoint: network.highestCheckpoint,
            smallestEdgeDistance: network.smallestEdgeDistance,
            layers: network.layers.map((layer) => ({
                outputs: layer.outputs,
                weights: layer.weights,
                highestCheckpoint: layer.highestCheckpoint,
            })),
            inputs: network.inputs,
        }));
    }),

    test: publicProcedure.query(async () => {
        const tester = new Tester();
        const networks = tester.test();
        return networks.map((network) => ({
            dimensions: network.dimensions,
            hasReachedGoal: network.hasReachedGoal,
            highestCheckpoint: network.highestCheckpoint,
            smallestEdgeDistance: network.smallestEdgeDistance,
            layers: network.layers.map((layer) => ({
                outputs: layer.outputs,
                weights: layer.weights,
                highestCheckpoint: layer.highestCheckpoint,
            })),
            inputs: network.inputs,
        }));
    }),

    // Load the best trained network from storage for client-side inference
    loadBestNetwork: publicProcedure
        .input(z.object({ index: z.number().optional() }).optional())
        .query(({ input }) => {
            const storage = new Storage("chromosomes.json");
            const chromosomes = storage.load();

            if (chromosomes.length === 0) {
                return null;
            }

            // Use provided index or default to 0 (best network)
            const networkIndex = input?.index ?? 0;

            if (networkIndex < 0 || networkIndex >= chromosomes.length) {
                return null;
            }

            // Return the selected chromosome and dimensions
            // Client will create Network instance and deserialize locally
            return {
                dimensions: NETWORK_DIMENSIONS,
                chromosome: chromosomes[networkIndex],
                index: networkIndex,
                totalNetworks: chromosomes.length,
            };
        }),

    // List all available networks from storage
    listNetworks: publicProcedure.query(() => {
        const storage = new Storage("chromosomes.json");
        const chromosomes = storage.load();

        const networkNames = ["GPT 5", "Gemini 3 Pro", "Claude 3.5 Sonnet", "Claude 3.5 Haiku"];

        return {
            networks: chromosomes.map((chromosome, index) => ({
                id: index,
                name: networkNames[index] ? networkNames[index] : `Network ${index + 1}`,
                chromosomeSize: chromosome.length,
            })),
            total: chromosomes.length,
        };
    }),
});

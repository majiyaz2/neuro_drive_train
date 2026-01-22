"use client";

import { useMemo, useCallback } from "react";
import { api } from "@/trpc/react";
import { Network } from "@/server/lib/network";

/**
 * Custom hook to load a trained neural network and run inference locally.
 * 
 * The network weights are loaded once from the server (via tRPC),
 * then all inference runs client-side for zero-latency predictions.
 * 
 * @param networkIndex - Optional index of the network to load (default: 0 for best network)
 * @returns Object with:
 *  - network: The Network instance (null if not loaded)
 *  - isLoading: Whether the network is being loaded
 *  - error: Any error that occurred during loading
 *  - predict: Function to run inference with ray inputs
 *  - refetch: Function to reload the network from storage
 *  - networkInfo: Metadata about the loaded network
 */
export function useNeuralNetwork(networkIndex?: number) {
    // Fetch the network chromosome from storage (server-side)
    const { data, isLoading, error, refetch } = api.neuralNetwork.loadBestNetwork.useQuery(
        { index: networkIndex },
        { enabled: true }
    );

    // Create and deserialize the network instance on the client
    const network = useMemo(() => {
        if (!data?.chromosome || !data?.dimensions) {
            return null;
        }

        const net = new Network(data.dimensions);
        net.deserialize(data.chromosome);
        return net;
    }, [data]);

    // Prediction function - runs entirely on the client
    const predict = useCallback((rayDistances: number[]): number[] | null => {
        if (!network) {
            console.warn("Network not loaded yet, cannot predict");
            return null;
        }

        // Normalize ray distances if needed (optional - depends on your training data)
        const outputs = network.feedForward(rayDistances);
        return outputs ?? null;
    }, [network]);

    return {
        network,
        isLoading,
        error,
        predict,
        refetch,
        isReady: !!network,
        networkInfo: data ? {
            index: data.index,
            totalNetworks: data.totalNetworks,
        } : null,
    };
}

export default useNeuralNetwork;


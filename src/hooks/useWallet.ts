'use client';

import { useState, useCallback, useEffect } from 'react';
import {
    createPublicClient,
    http,
    formatEther,
    type Address,
    createWalletClient,
    custom
} from 'viem';
import { sepolia } from 'viem/chains';
import { toast } from 'sonner';

export function useWallet() {
    const [account, setAccount] = useState<Address | null>(null);
    const [balance, setBalance] = useState<string>("0");
    const [isConnecting, setIsConnecting] = useState(false);

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
    });

    const fetchBalance = useCallback(async (addr: Address) => {
        try {
            const bal = await publicClient.getBalance({ address: addr });
            setBalance(Number(formatEther(bal)).toFixed(4));
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    }, [publicClient]);

    const connectWallet = async () => {
        if (typeof window === 'undefined' || !window.ethereum) {
            toast.error("MetaMask not found!");
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as Address[];
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                fetchBalance(accounts[0]);
            }
        } catch (err) {
            console.error("Connection failed:", err);
        } finally {
            setIsConnecting(false);
        }
    };

    const getWalletClient = useCallback(() => {
        if (typeof window === 'undefined' || !window.ethereum || !account) return null;
        return createWalletClient({
            account,
            chain: sepolia,
            transport: custom(window.ethereum),
        });
    }, [account]);

    // Auto-connect if already authorized
    useEffect(() => {
        const checkConnection = async () => {
            if (typeof window !== 'undefined' && window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: "eth_accounts" }) as Address[];
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                        fetchBalance(accounts[0]);
                    }
                } catch (err) {
                    console.error("Auto-connect failed:", err);
                }
            }
        };
        checkConnection();
    }, [fetchBalance]);

    return {
        account,
        balance,
        isConnecting,
        connectWallet,
        fetchBalance,
        publicClient,
        getWalletClient
    };
}

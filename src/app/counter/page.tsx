"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Hash,
} from "viem";
import { sepolia } from "viem/chains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { COUNTER_ADDRESS, COUNTER_ABI } from "@/lib/counterContract";

// Extend window with ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

type TxStatus = "idle" | "pending" | "success" | "error";

export default function CounterPage() {
  const [account, setAccount] = useState<Address | null>(null);
  const [counterValue, setCounterValue] = useState<bigint | null>(null);
  const [incrementAmount, setIncrementAmount] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create public client for reading
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
  });

  // Fetch counter value
  const fetchCounterValue = useCallback(async () => {
    try {
      const value = await publicClient.readContract({
        address: COUNTER_ADDRESS,
        abi: COUNTER_ABI,
        functionName: "x",
      });
      setCounterValue(value);
    } catch (err) {
      console.error("Failed to fetch counter value:", err);
    }
  }, []);

  // Fetch value on load and periodically
  useEffect(() => {
    fetchCounterValue();
    const interval = setInterval(fetchCounterValue, 10000);
    return () => clearInterval(interval);
  }, [fetchCounterValue]);

  // Connect wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    try {
      setError(null);
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        setError("No accounts found");
        return;
      }

      // Check if on Sepolia
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xaa36a7") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          });
        } catch {
          setError("Please switch to Sepolia network in MetaMask");
          return;
        }
      }

      setAccount(accounts[0] as Address);
    } catch (err) {
      console.error("Failed to connect wallet:", err);
      setError("Failed to connect wallet");
    }
  };

  // Get wallet client (created fresh for each transaction)
  const getWalletClient = () => {
    if (!window.ethereum || !account) return null;
    return createWalletClient({
      account,
      chain: sepolia,
      transport: custom(window.ethereum),
    });
  };

  // Increment by 1
  const handleIncrement = async () => {
    const walletClient = getWalletClient();
    if (!walletClient || !account) return;

    try {
      setTxStatus("pending");
      setError(null);
      setTxHash(null);

      const hash = await walletClient.writeContract({
        address: COUNTER_ADDRESS,
        abi: COUNTER_ABI,
        functionName: "inc",
      });

      setTxHash(hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setTxStatus("success");
      fetchCounterValue();
    } catch (err) {
      console.error("Transaction failed:", err);
      setTxStatus("error");
      setError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  // Increment by amount
  const handleIncrementBy = async () => {
    const walletClient = getWalletClient();
    if (!walletClient || !account || !incrementAmount) return;

    const amount = BigInt(incrementAmount);
    if (amount <= 0n) {
      setError("Amount must be greater than 0");
      return;
    }

    try {
      setTxStatus("pending");
      setError(null);
      setTxHash(null);

      const hash = await walletClient.writeContract({
        address: COUNTER_ADDRESS,
        abi: COUNTER_ABI,
        functionName: "incBy",
        args: [amount],
      });

      setTxHash(hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      setTxStatus("success");
      setIncrementAmount("");
      fetchCounterValue();
    } catch (err) {
      console.error("Transaction failed:", err);
      setTxStatus("error");
      setError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  return (
    <div className="min-h-screen bg-linear-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-purple-500/30 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Counter Contract
          </CardTitle>
          <CardDescription className="text-slate-400">
            Interact with the Counter on Sepolia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection */}
          {!account ? (
            <Button
              onClick={connectWallet}
              className="w-full bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Connect MetaMask
            </Button>
          ) : (
            <div className="text-center text-sm text-slate-400">
              Connected:{" "}
              <span className="text-purple-400 font-mono">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          )}

          {/* Counter Value Display */}
          <div className="text-center py-8 rounded-xl bg-slate-900/50 border border-purple-500/20">
            <div className="text-sm text-slate-500 mb-2">Current Value</div>
            <div className="text-6xl font-bold text-white">
              {counterValue !== null ? counterValue.toString() : "..."}
            </div>
          </div>

          {/* Increment Buttons */}
          {account && (
            <div className="space-y-4">
              <Button
                onClick={handleIncrement}
                disabled={txStatus === "pending"}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6"
              >
                {txStatus === "pending" ? "Processing..." : "Increment +1"}
              </Button>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Amount"
                  value={incrementAmount}
                  onChange={(e) => setIncrementAmount(e.target.value)}
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                  min="1"
                />
                <Button
                  onClick={handleIncrementBy}
                  disabled={txStatus === "pending" || !incrementAmount}
                  className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                >
                  Increment By
                </Button>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {txHash && (
            <div className="text-center text-sm">
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                View on Etherscan ↗
              </a>
            </div>
          )}

          {txStatus === "success" && (
            <div className="text-center text-emerald-400 text-sm">
              ✓ Transaction confirmed!
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="text-center text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Contract Address */}
          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
            Contract:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${COUNTER_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 font-mono"
            >
              {COUNTER_ADDRESS.slice(0, 10)}...{COUNTER_ADDRESS.slice(-8)}
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

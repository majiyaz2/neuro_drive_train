"use client";

import { useState } from "react";
import { Scene } from "@/components/game3D/Scene";
import { MapCard } from "@/components/ui/MapCard";
import { Leaderboard } from "@/components/ui/Leaderboard";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Activity, Wallet, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
    createPublicClient,
    createWalletClient,
    custom,
    http,
    parseEther,
    formatEther,
    decodeEventLog,
    type Address,
    type Hash
} from "viem";
import { sepolia } from "viem/chains";
import { NEXUS_DRIVE_ADDRESS, NEXUS_DRIVE_ABI } from "@/lib/nexusDriveContract";
import { useEffect, useCallback } from "react";
import { useWallet } from "@/hooks/useWallet";
import { IpfsService } from "@/lib/ipfsService";

interface Track {
    index: number;
    name: string;
    fee: string;
    description: string;
    difficulty: string;
    rewardMultiplier: string;
}


const TRACKS: Track[] = [
    { index: 0, name: "Neon Circuit", fee: "0.0001", difficulty: "EASY", rewardMultiplier: "1.0x", description: "A high-speed neon-lit circuit with sharp turns and long straights. Perfect for testing raw speed." },
    { index: 1, name: "Brutal Desert", fee: "0.0002", difficulty: "HARD", rewardMultiplier: "2.5x", description: "Harsh terrain and unpredictable corners. Tests the suspension and stability of your neural patterns." },
    { index: 2, name: "Cyber Jungle", fee: "0.00015", difficulty: "MEDIUM", rewardMultiplier: "1.8x", description: "Dense environment with narrow paths. Requires precise steering and quick reflexes and precise driving." },
    { index: 3, name: "Acid Raid", fee: "0.0001", difficulty: "HARD", rewardMultiplier: "2.2x", description: "Corrosive atmosphere. Focuses on survival time and navigating through treacherous obstacles." },
    { index: 4, name: "Giga Void", fee: "0.0005", difficulty: "BRUTAL", rewardMultiplier: "5.0x", description: "High stakes, high rewards. The ultimate field to prove your agent's peak performance." },
];

export default function StagingPage() {
    const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [activeAttemptId, setActiveAttemptId] = useState<bigint | null>(null);
    const [loadedModel, setLoadedModel] = useState<any>(null);
    const [isPending, setIsPending] = useState(false);

    const {
        account,
        balance,
        connectWallet,
        getWalletClient,
        publicClient,
        isConnecting,
        fetchBalance
    } = useWallet();

    const handleLoadModel = async () => {
        if (!account) return;
        try {
            setIsPending(true);
            const cids = await publicClient.readContract({
                address: NEXUS_DRIVE_ADDRESS,
                abi: NEXUS_DRIVE_ABI,
                functionName: 'getUserModels',
                args: [account]
            }) as string[];

            if (cids.length === 0) {
                toast.error("No registered models found for this wallet.");
                return;
            }

            const latestCid = cids[cids.length - 1];
            const ipfs = new IpfsService();
            const modelData = await ipfs.fetchModel(latestCid!);
            setLoadedModel(modelData);
            toast.success("Model loaded from blockchain!");
        } catch (err) {
            console.error("Failed to load model:", err);
            toast.error("Failed to load model from IPFS/Blockchain.");
        } finally {
            setIsPending(false);
        }
    };

    const handleAttemptTrack = async () => {
        if (!account || selectedTrack === null || !window.ethereum) return;

        const track = TRACKS[selectedTrack];
        const walletClient = createWalletClient({
            account,
            chain: sepolia,
            transport: custom(window.ethereum),
        });

        try {
            setIsPending(true);
            const hash = await walletClient.writeContract({
                address: NEXUS_DRIVE_ADDRESS,
                abi: NEXUS_DRIVE_ABI,
                functionName: "attemptTrack",
                args: [BigInt(selectedTrack)],
                value: parseEther(track.fee)
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            // Parse logs to find attemptId from TrackAttempted event
            const logs = receipt.logs.map(log => {
                try {
                    const event = decodeEventLog({
                        abi: NEXUS_DRIVE_ABI,
                        data: log.data,
                        topics: log.topics,
                    });
                    return event;
                } catch { return null; }
            }).filter(Boolean);

            if (logs.length > 0 && logs[0]) {
                const event = logs[0] as any;
                if (event.eventName === 'TrackAttempted') {
                    setActiveAttemptId(event.args.attemptId);
                }
            }

            setIsSimulating(true);
        } catch (err) {
            console.error("Transaction failed:", err);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden font-base">
            {/* Left Main Content - Map Selection or 3D Scene */}
            <main className={cn(
                "flex-1 flex flex-col gap-8 overflow-hidden",
                isSimulating ? "p-0" : "p-8 overflow-y-auto"
            )}>
                {isSimulating && selectedTrack !== null ? (
                    <Scene
                        onBack={() => {
                            setIsSimulating(false);
                            setActiveAttemptId(null);
                        }}
                        attemptId={activeAttemptId}
                        account={account}
                        customModel={loadedModel}
                    />
                ) : (
                    <>
                        <header className="flex items-center justify-between border-b-4 border-border pb-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Activity className="size-6 text-main-foreground bg-main p-1 rounded-sm border-2 border-border shadow-shadow" />
                                    <h1 className="text-4xl font-heading uppercase tracking-tighter">Mission Selection</h1>
                                </div>
                                <p className="text-muted-foreground font-mono flex items-center gap-2">
                                    <Info className="size-3" />
                                    CHOOSE A CIRCUIT CORE TO COMMENCE TESTING SEQUENCE
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <div
                                    className="p-3 border-2 border-border bg-card shadow-shadow rounded-base flex items-center gap-3 cursor-pointer hover:bg-main hover:text-main-foreground transition-colors"
                                    onClick={!account ? connectWallet : undefined}
                                >
                                    <Wallet className="size-5" />
                                    <div className="font-mono leading-none">
                                        <p className="text-[10px] text-muted-foreground uppercase">
                                            {account ? `${account.slice(0, 6)}...` : "Wallet"}
                                        </p>
                                        <p className="text-sm font-bold">
                                            {account ? `${balance} ETH` : isConnecting ? "SYNCING..." : "CONNECT"}
                                        </p>
                                    </div>
                                </div>
                                {account && (
                                    <Button
                                        variant="neutral"
                                        className="h-full border-2 border-border shadow-shadow"
                                        onClick={handleLoadModel}
                                        disabled={isPending}
                                    >
                                        <Trophy className="size-4" />
                                        {loadedModel ? "Swap Model" : "Load My Model"}
                                    </Button>
                                )}
                            </div>
                        </header>
                        <ScrollArea className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pr-4">
                                {TRACKS.map((track) => (
                                    <MapCard
                                        key={track.index}
                                        trackIndex={track.index}
                                        trackName={track.name}
                                        entryFee={track.fee}
                                        description={track.description}
                                        difficulty={track.difficulty}
                                        rewardMultiplier={track.rewardMultiplier}
                                        isSelected={selectedTrack === track.index}
                                        onSelect={setSelectedTrack}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="mt-auto border-t-4 border-border pt-8 flex items-center justify-between">
                            <div className="max-w-md">
                                <p className="text-xs font-mono uppercase text-muted-foreground mb-1">Deployment Protocol</p>
                                <p className="text-sm">
                                    Starting a session requires a small entry fee to the NexusDrive smart contract.
                                    Successful models obtain victory rewards and blockchain registration.
                                </p>
                            </div>

                            <Button
                                size="lg"
                                disabled={selectedTrack === null || isPending}
                                onClick={handleAttemptTrack}
                                className="h-20 px-12 text-2xl font-heading uppercase gap-4"
                            >
                                {isPending ? "Syncing..." : (selectedTrack === null ? "Select Circuit" : "Attempt Track")}
                                <ChevronRight className="size-8" />
                            </Button>
                        </div>
                    </>
                )}
            </main>

            {/* Right Sidebar - Leaderboard (Hidden during simulation) */}
            {!isSimulating && (
                <aside className="w-[380px] border-l-4 border-border bg-card p-6 overflow-y-auto">
                    <Leaderboard />
                </aside>
            )}
        </div>
    );
}

"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Hash, ShieldCheck, Share2, ArrowRight, Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";
import { NEXUS_DRIVE_ADDRESS, NEXUS_DRIVE_ABI } from "@/lib/nexusDriveContract";

interface VictoryModalProps {
    modelHash: string;
    nonce: string;
    difficulty: string;
    reward: string;
    attemptId?: bigint | null;
    onClaim: () => void;
    onClose: () => void;
}

export function VictoryModal({
    modelHash,
    nonce,
    difficulty,
    reward,
    attemptId,
    onClaim,
    onClose,
}: VictoryModalProps) {
    const { getWalletClient, publicClient, account } = useWallet();
    const [isPending, setIsPending] = React.useState(false);

    const handleClaim = async () => {
        if (!account || !attemptId) {
            toast.error("No active session or wallet connected.");
            return;
        }

        const walletClient = getWalletClient();
        if (!walletClient) return;

        try {
            setIsPending(true);
            const { request } = await publicClient.simulateContract({
                account,
                address: NEXUS_DRIVE_ADDRESS,
                abi: NEXUS_DRIVE_ABI,
                functionName: "claimVictory",
                args: [attemptId, modelHash as `0x${string}`, BigInt(nonce)],
            });

            const hash = await walletClient.writeContract(request);
            console.log("Transaction sent:", hash);

            await publicClient.waitForTransactionReceipt({ hash });
            toast.success("Victory claimed successfully! Reward transferred to your wallet.");
            onClaim();
        } catch (err) {
            console.error("Claim failed:", err);
            toast.error("Failed to claim victory. See console for details.");
        } finally {
            setIsPending(false);
        }
    };
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md p-4 pointer-events-auto font-base">
            <Card className="w-full max-w-lg border-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] bg-card overflow-hidden">
                <CardHeader className="bg-main text-main-foreground border-b-4 border-border py-8">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="p-6 bg-background rounded-full border-4 border-border shadow-shadow">
                            <Trophy className="size-16 text-main-foreground" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-5xl font-heading uppercase tracking-tighter">Trial Complete</CardTitle>
                            <CardDescription className="text-main-foreground/80 font-mono text-xs uppercase font-bold tracking-widest">
                                Circuit Synced • Neural Pattern Registered
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border-2 border-border bg-secondary-background rounded-base">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Session Difficulty</p>
                            <p className="text-lg font-heading text-main-foreground">{difficulty}</p>
                        </div>
                        <div className="p-4 border-2 border-border bg-secondary-background rounded-base">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Expected Reward</p>
                            <p className="text-lg font-heading text-main-foreground">{reward} ETH</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                <Hash className="size-4" />
                                <span>Model Verification Proof</span>
                            </div>
                            <div className="p-3 bg-background border-2 border-border font-mono text-xs break-all rounded-base">
                                <p className="text-muted-foreground text-[10px] mb-1">HASH:</p>
                                <p className="font-bold">{modelHash}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-muted-foreground text-[10px]">POW NONCE:</span>
                                    <span className="text-main-foreground font-bold">{nonce}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 bg-main/10 border-2 border-main/20 rounded-base text-xs font-mono font-bold text-main-foreground">
                            <ShieldCheck className="size-4" />
                            <span>CRYPTO-PROOF VERIFIED BY CLIENT MINER</span>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="p-8 pt-0 flex flex-col gap-3">
                    <Button
                        size="lg"
                        className="w-full h-16 text-xl font-heading uppercase gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
                        onClick={handleClaim}
                        disabled={isPending}
                    >
                        {isPending ? <Loader2 className="size-6 animate-spin" /> : "Claim Victory & Register Model"}
                        {!isPending && <ArrowRight className="size-6" />}
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="neutral" className="flex-1 gap-2" onClick={() => console.log('Share Link')}>
                            <Share2 className="size-4" />
                            Share Stats
                        </Button>
                        <Button variant="neutral" className="flex-1" onClick={onClose}>
                            Return to Staging
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

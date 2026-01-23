"use client";

import { Card } from "@/components/ui/card";
import { Activity, Zap, CheckCircle2, Wallet, Timer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

interface HudOverlayProps {
    speed: number;
    checkpoints: number;
    totalCheckpoints: number;
    sessionActive: boolean;
    powProgress: number;
    walletAddress?: string;
    entryFee?: string;
    onBack: () => void;
}

export function HudOverlay({
    speed,
    checkpoints,
    totalCheckpoints,
    sessionActive,
    powProgress,
    walletAddress = "0x7F...8A31",
    entryFee = "0.01",
    onBack
}: HudOverlayProps) {
    return (
        <div className="absolute inset-0 pointer-events-none p-6 font-mono z-50">
            {/* Top Left: Navigation & Session Status */}
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-auto">
                <Button
                    variant="neutral"
                    size="sm"
                    className="w-fit gap-2 uppercase font-bold border-2 shadow-shadow"
                    onClick={onBack}
                >
                    <ArrowLeft className="size-4" />
                    Back to Staging
                </Button>

                <Card className="p-3 border- border-border bg-main shadow-shadow rounded-base text-main-foreground flex items-center gap-3">
                    <Activity className="size-5 animate-pulse" />
                    <div className="leading-tight">
                        <p className="text-[10px] uppercase font-bold opacity-80">Session Status</p>
                        <p className="text-sm font-heading">{sessionActive ? "ACTIVE TRIAL" : "IDLE"}</p>
                    </div>
                </Card>

                <div className="p-3 border-2 border-border bg-card shadow-shadow rounded-base flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                        <Wallet className="size-3" />
                        <span>Connected Wallet</span>
                    </div>
                    <p className="text-xs font-bold">{walletAddress}</p>
                    <p className="text-[10px] text-main-foreground font-bold mt-1">ENTRY: {entryFee} ETH</p>
                </div>
            </div>

            {/* Top Right: Telemetry */}
            <div className="absolute top-6 right-6 flex flex-col gap-3 items-end pointer-events-auto">
                <div className="p-4 border-2 border-border bg-card shadow-shadow rounded-base flex flex-col items-end min-w-[140px]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold mb-1">
                        <Zap className="size-3" />
                        <span>Velocity</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-heading tracking-tighter">{Math.floor(speed)}</span>
                        <span className="text-xs font-bold uppercase">km/h</span>
                    </div>
                </div>

                <div className="p-4 border-2 border-border bg-card shadow-shadow rounded-base flex flex-col items-end min-w-[140px]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase font-bold mb-1">
                        <CheckCircle2 className="size-3" />
                        <span>Progress</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{checkpoints}</span>
                        <span className="text-muted-foreground text-sm">/ {totalCheckpoints}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary border border-border rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-main transition-all duration-300"
                            style={{ width: `${(checkpoints / totalCheckpoints) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Left: PoW Progress */}
            <div className="absolute bottom-6 left-6 pointer-events-auto">
                <Card className="p-4 border-2 border-border bg-background shadow-shadow rounded-base min-w-[280px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                            <Timer className="size-4" />
                            <span>Client-Side PoW</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-main-foreground bg-main px-1">
                            {Math.floor(powProgress)}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-secondary border-2 border-border rounded-base overflow-hidden">
                        <div
                            className="h-full bg-main transition-all duration-500"
                            style={{ width: `${powProgress}%` }}
                        />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-2 uppercase font-bold">
                        NONCE MINING IN PROGRESS • MODEL VERIFICATION PENDING
                    </p>
                </Card>
            </div>

            {/* Bottom Right: Live Feed (Simple Overlay) */}
            <div className="absolute bottom-6 right-6 pointer-events-auto">
                <div className="p-3 border-2 border-border bg-card/80 backdrop-blur-sm shadow-shadow rounded-base text-[10px] font-mono w-[240px]">
                    <p className="text-main-foreground font-bold mb-2 uppercase border-b border-border pb-1">Live Contract Feed</p>
                    <div className="space-y-1 opacity-80">
                        <p className="flex justify-between">
                            <span className="text-secondary-foreground">[14:02]</span>
                            <span className="flex-1 ml-2 text-ellipsis overflow-hidden">NEW ATTEMPT 0x7F...A31</span>
                        </p>
                        <p className="flex justify-between">
                            <span className="text-secondary-foreground">[13:58]</span>
                            <span className="flex-1 ml-2 text-ellipsis overflow-hidden">REWARD PAID 0x2E...B12</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

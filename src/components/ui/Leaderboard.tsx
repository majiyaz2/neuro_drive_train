"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, History, Wallet, Hash } from "lucide-react";
import * as React from "react";

interface LeaderboardEntry {
    attemptId: string;
    walletAddress: string;
    generation: number;
    fitness: number;
    timestamp: string;
}

const MOCK_DATA: LeaderboardEntry[] = [
    { attemptId: "1254", walletAddress: "0x7F...8A31", generation: 142, fitness: 48920, timestamp: "2m ago" },
    { attemptId: "1253", walletAddress: "0x12...4f5e", generation: 85, fitness: 45210, timestamp: "5m ago" },
    { attemptId: "1252", walletAddress: "0xab...9e2a", generation: 210, fitness: 42100, timestamp: "12m ago" },
    { attemptId: "1251", walletAddress: "0xfe...1b8c", generation: 15, fitness: 38500, timestamp: "1h ago" },
    { attemptId: "1250", walletAddress: "0x5d...a7cb", generation: 198, fitness: 35000, timestamp: "2h ago" },
    { attemptId: "1249", walletAddress: "0x9a...cde4", generation: 42, fitness: 31200, timestamp: "5h ago" },
];

export function Leaderboard() {
    return (
        <Card className="h-full flex flex-col border-2 overflow-hidden">
            <CardHeader className="border-b-2 border-border bg-main text-main-foreground">
                <div className="flex items-center gap-2">
                    <Trophy className="size-5" />
                    <CardTitle className="uppercase tracking-widest text-lg">Top Pilots</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                        {MOCK_DATA.map((entry, idx) => (
                            <div
                                key={entry.attemptId}
                                className="p-3 border-2 border-border shadow-shadow bg-secondary-background rounded-base relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 px-2 py-0.5 bg-main border-l-2 border-b-2 border-border text-[10px] font-bold text-main-foreground uppercase">
                                    #{idx + 1}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                        <Wallet className="size-3 text-main-foreground bg-main p-0.5 rounded-sm border border-border" />
                                        <span>{entry.walletAddress}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase">
                                        <div className="flex flex-col border-r border-border pr-2">
                                            <span className="text-muted-foreground">Gen</span>
                                            <span className="font-bold">{entry.generation}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Fitness</span>
                                            <span className="font-bold text-main-foreground">{entry.fitness.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-1 text-[8px] font-mono text-muted-foreground border-t border-border pt-1">
                                        <span className="flex items-center gap-1">
                                            <Hash className="size-2" />
                                            ATTEMPT {entry.attemptId}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <History className="size-2" />
                                            {entry.timestamp}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

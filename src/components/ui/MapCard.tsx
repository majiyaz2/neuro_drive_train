"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Map as MapIcon, Route, Activity, Zap, Shield } from "lucide-react";
import * as React from "react";

interface MapCardProps {
    trackIndex: number;
    trackName: string;
    entryFee: string;
    description: string;
    isSelected: boolean;
    onSelect: (index: number) => void;
}

const icons = [MapIcon, Route, Activity, Zap, Shield];

export function MapCard({
    trackIndex,
    trackName,
    entryFee,
    description,
    isSelected,
    onSelect,
}: MapCardProps) {
    const Icon = icons[trackIndex % icons.length];

    return (
        // remove shadows
        <Card
            className={cn(
                "cursor-pointer transition-all shadow-none shadow-white",
                isSelected ? "border-main" : "hover:scale-[1.001]"
            )}
            onClick={() => onSelect(trackIndex)}
        >
            <CardHeader className="flex flex-row items-center gap-4">
                <div className={cn(
                    "p-3 border-2 border-border shadow-shadow rounded-base",
                    isSelected ? "bg-main text-main-foreground" : "bg-secondary-background"
                )}>
                    <Icon className="size-8" />
                </div>
                <div>
                    <CardTitle className="text-xl uppercase">{trackName}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">ID: {trackIndex.toString().padStart(3, '0')}</p>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm mb-4 leading-relaxed">
                    {description}
                </p>
                <div className="flex items-center justify-between font-mono text-sm bg-secondary-background p-2 border-2 border-border rounded-base">
                    <span>ENTRY FEE</span>
                    <span className="font-bold text-main-foreground bg-main px-2 border-l-2 border-border">{entryFee} ETH</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    variant={isSelected ? "default" : "neutral"}
                    className="w-full uppercase font-heading"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(trackIndex);
                    }}
                >
                    {isSelected ? "Selected" : "Select Circuit"}
                </Button>
            </CardFooter>
        </Card>
    );
}

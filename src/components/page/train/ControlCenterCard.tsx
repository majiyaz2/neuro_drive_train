'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Rewind, FastForward } from 'lucide-react';

interface ControlCenterCardProps {
    isSimulating: boolean;
    isLoading: boolean;
    currentSpeed: number;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
    onSlowDown: () => void;
    onSpeedUp: () => void;
    onSaveToIpfs?: () => void;
    onLoadFromIpfs?: () => void;
    isWalletConnected?: boolean;
}

export function ControlCenterCard({
    isSimulating,
    isLoading,
    currentSpeed,
    onStart,
    onPause,
    onReset,
    onSlowDown,
    onSpeedUp,
    onSaveToIpfs,
    onLoadFromIpfs,
    isWalletConnected = false,
}: ControlCenterCardProps) {

    return (
        <div className="flex items-center gap-4 bg-secondary-background border-2 border-border p-4 shadow-shadow">
            <div className="flex items-center gap-3 pr-4 border-r-2 border-border">
                <Play className="size-5" />
                <span className="text-sm font-heading uppercase tracking-wider">
                    Control Center
                </span>
            </div>

            <div className="flex items-center gap-2 flex-1">
                <Button
                    className="px-8"
                    onClick={onStart}
                    disabled={isSimulating || isLoading}
                >
                    <Play className="size-4" />
                    {isLoading ? 'Loading...' : 'Start Training'}
                </Button>

                <Button
                    variant="neutral"
                    onClick={onPause}
                    disabled={!isSimulating}
                >
                    <Pause className="size-4" />
                    Pause
                </Button>

                <Button
                    variant="neutral"
                    onClick={onReset}
                    disabled={isSimulating}
                >
                    <RotateCcw className="size-4" />
                    Reset
                </Button>
            </div>

            {/* IPFS Controls */}
            <div className="flex items-center gap-2 px-4 border-l-2 border-r-2 border-border">
                <Button
                    variant="neutral"
                    onClick={onSaveToIpfs}
                    disabled={isSimulating || !isWalletConnected}
                    title={!isWalletConnected ? "Connect wallet to save" : "Save Best Model to IPFS & Blockchain"}
                >
                    Save Model
                </Button>
                <Button
                    variant="neutral"
                    onClick={onLoadFromIpfs}
                    disabled={isSimulating || !isWalletConnected}
                    title={!isWalletConnected ? "Connect wallet to load" : "Load Model from IPFS"}
                >
                    Load Model
                </Button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center gap-2 pl-4 border-l-2 border-border">
                <Button
                    variant="neutral"
                    size="icon"
                    onClick={onSlowDown}
                    disabled={currentSpeed <= 0.25}
                    title="Slow Down (0.5x)"
                >
                    <Rewind className="size-4" />
                </Button>

                <span className="min-w-[60px] text-center font-mono text-sm px-2 py-2 bg-background border-2 border-border p-4 shadow-shadow">
                    {currentSpeed}x
                </span>

                <Button
                    variant="neutral"
                    size="icon"
                    onClick={onSpeedUp}
                    disabled={currentSpeed >= 4}
                    title="Speed Up (2x)"
                >
                    <FastForward className="size-4" />
                </Button>
            </div>
        </div>
    );



}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface ControlCenterCardProps {
    isSimulating: boolean;
    isLoading: boolean;
    onStart: () => void;
    onPause: () => void;
    onReset: () => void;
}

export function ControlCenterCard({
    isSimulating,
    isLoading,
    onStart,
    onPause,
    onReset,
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
            </div>
        );
    


}

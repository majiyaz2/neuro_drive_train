'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Check, Map } from 'lucide-react';

export interface TrainingParameters {
    populationSize: number;
    mutationRate: number;
    hiddenLayers: string;
    trackIndex: number;
    keepCount: number;
    maxIterations: number;
}

interface ParametersCardProps {
    parameters: TrainingParameters;
    onParametersChange: (params: TrainingParameters) => void;
    disabled?: boolean;
}

export function ParametersCard({
    parameters,
    onParametersChange,
    disabled = false,
}: ParametersCardProps) {
    // Local state for staged changes
    const [localParams, setLocalParams] = useState<TrainingParameters>(parameters);

    // Check if there are pending changes
    const hasChanges = useMemo(() => {
        return (
            localParams.populationSize !== parameters.populationSize ||
            localParams.mutationRate !== parameters.mutationRate ||
            localParams.hiddenLayers !== parameters.hiddenLayers ||
            localParams.trackIndex !== parameters.trackIndex ||
            localParams.keepCount !== parameters.keepCount ||
            localParams.maxIterations !== parameters.maxIterations
        );
    }, [localParams, parameters]);

    // Sync local state when parent parameters change (e.g., from reset)
    useEffect(() => {
        setLocalParams(parameters);
    }, [parameters]);

    const handleApply = () => {
        onParametersChange(localParams);
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider">
                    Parameters
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Population Size */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Population Size</span>
                        <span className="font-mono bg-main px-2 border-2 border-border">
                            {localParams.populationSize}
                        </span>
                    </div>
                    <Slider
                        value={[localParams.populationSize]}
                        min={10}
                        max={200}
                        step={10}
                        disabled={disabled}
                        onValueChange={([value]) =>
                            setLocalParams((prev) => ({
                                ...prev,
                                populationSize: value,
                            }))
                        }
                    />
                </div>

                {/* Keep Count */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Keep Count</span>
                        <span className="font-mono bg-main px-2 border-2 border-border">
                            {localParams.keepCount}
                        </span>
                    </div>
                    <Slider
                        value={[localParams.keepCount]}
                        min={2}
                        max={Math.min(20, localParams.populationSize / 2)}
                        step={1}
                        disabled={disabled}
                        onValueChange={([value]) =>
                            setLocalParams((prev) => ({
                                ...prev,
                                keepCount: value,
                            }))
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Best performers kept per generation
                    </p>
                </div>

                {/* Max Iterations */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Max Iterations</span>
                        <span className="font-mono bg-main px-2 border-2 border-border">
                            {localParams.maxIterations}
                        </span>
                    </div>
                    <Slider
                        value={[localParams.maxIterations]}
                        min={10}
                        max={500}
                        step={10}
                        disabled={disabled}
                        onValueChange={([value]) =>
                            setLocalParams((prev) => ({
                                ...prev,
                                maxIterations: value,
                            }))
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Training generations before stopping
                    </p>
                </div>

                {/* Mutation Rate */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Mutation Rate</span>
                        <span className="font-mono bg-main px-2 border-2 border-border">
                            {(localParams.mutationRate * 100).toFixed(1)}%
                        </span>
                    </div>
                    <Slider
                        value={[localParams.mutationRate * 100]}
                        min={1}
                        max={50}
                        step={0.5}
                        disabled={disabled}
                        onValueChange={([value]) =>
                            setLocalParams((prev) => ({
                                ...prev,
                                mutationRate: value / 100,
                            }))
                        }
                    />
                </div>

                {/* Hidden Layers */}
                <div className="space-y-2">
                    <span className="text-sm">Hidden Layers</span>
                    <Select
                        value={localParams.hiddenLayers}
                        disabled={disabled}
                        onValueChange={(value) =>
                            setLocalParams((prev) => ({
                                ...prev,
                                hiddenLayers: value,
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select layers" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1-layer">1 Layer (Simple)</SelectItem>
                            <SelectItem value="2-layer">2 Layers (Standard)</SelectItem>
                            <SelectItem value="3-layer">3 Layers (Deep)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Track/Map Selector */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Map className="size-4" />
                        <span>Track</span>
                    </div>
                    <Select
                        value={String(localParams.trackIndex)}
                        disabled={disabled}
                        onValueChange={(value) =>
                            setLocalParams((prev) => ({
                                ...prev,
                                trackIndex: parseInt(value, 10),
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select track" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">Track 1 - Oval</SelectItem>
                            <SelectItem value="1">Track 2 - S-Curve</SelectItem>
                            <SelectItem value="2">Track 3 - Circuit</SelectItem>
                            <SelectItem value="3">Track 4 - Complex</SelectItem>
                            <SelectItem value="4">Track 5 - Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Apply Button */}
                <Button
                    variant="default"
                    className="w-full"
                    disabled={disabled || !hasChanges}
                    onClick={handleApply}
                >
                    <Check className="size-4 mr-2" />
                    Apply Changes
                </Button>
                {hasChanges && !disabled && (
                    <p className="text-xs text-center text-muted-foreground">
                        You have unsaved changes
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

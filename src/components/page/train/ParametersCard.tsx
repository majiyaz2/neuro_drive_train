'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Map, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export interface TrainingParameters {
    populationSize: number;
    mutationRate: number;
    trackIndex: number;
    keepCount: number;
    maxIterations: number;
    hypermutationEnabled: boolean;
}

interface ParametersCardProps {
    parameters: TrainingParameters;
    localParams: TrainingParameters;
    onLocalParamsChange: (params: TrainingParameters) => void;
    disabled?: boolean;
}

export function ParametersCard({
    parameters,
    localParams,
    onLocalParamsChange,
    disabled = false,
}: ParametersCardProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider">
                    Parameters
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                            onLocalParamsChange({
                                ...localParams,
                                trackIndex: parseInt(value, 10),
                            })
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
                            onLocalParamsChange({
                                ...localParams,
                                populationSize: value,
                            })
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
                            onLocalParamsChange({
                                ...localParams,
                                keepCount: value,
                            })
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
                            onLocalParamsChange({
                                ...localParams,
                                maxIterations: value,
                            })
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
                            onLocalParamsChange({
                                ...localParams,
                                mutationRate: value / 100,
                            })
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Chance of random gene changes per offspring
                    </p>
                </div>

                {/* Hypermutation Toggle */}
                <div className="flex items-center justify-between py-2 border-t border-border">
                    <div className="flex items-center gap-2">
                        <Zap className="size-4" />
                        <div>
                            <span className="text-sm">Hypermutation</span>
                            <p className="text-xs text-muted-foreground">
                                Auto-boost mutation when stuck
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={localParams.hypermutationEnabled}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                            onLocalParamsChange({
                                ...localParams,
                                hypermutationEnabled: checked,
                            })
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}

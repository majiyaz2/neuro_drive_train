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

export interface TrainingParameters {
    populationSize: number;
    mutationRate: number;
    hiddenLayers: string;
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
                            {parameters.populationSize}
                        </span>
                    </div>
                    <Slider
                        value={[parameters.populationSize]}
                        min={10}
                        max={200}
                        step={10}
                        disabled={disabled}
                        onValueChange={([value]) =>
                            onParametersChange({
                                ...parameters,
                                populationSize: value,
                            })
                        }
                    />
                </div>

                {/* Mutation Rate */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Mutation Rate</span>
                        <span className="font-mono bg-main px-2 border-2 border-border">
                            {(parameters.mutationRate * 100).toFixed(1)}%
                        </span>
                    </div>
                    <Slider
                        value={[parameters.mutationRate * 100]}
                        min={1}
                        max={50}
                        step={0.5}
                        disabled={disabled}
                        onValueChange={([value]) =>
                            onParametersChange({
                                ...parameters,
                                mutationRate: value / 100,
                            })
                        }
                    />
                </div>

                {/* Hidden Layers */}
                <div className="space-y-2">
                    <span className="text-sm">Hidden Layers</span>
                    <Select
                        value={parameters.hiddenLayers}
                        disabled={disabled}
                        onValueChange={(value) =>
                            onParametersChange({
                                ...parameters,
                                hiddenLayers: value,
                            })
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
            </CardContent>
        </Card>
    );
}

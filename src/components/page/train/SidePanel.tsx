'use client';

import { useState, useMemo, useEffect } from 'react';
import { ParametersCard, type TrainingParameters } from './ParametersCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface SidePanelProps {
    parameters: TrainingParameters;
    onParametersChange: (params: TrainingParameters) => void;
    isSimulating: boolean;
}

export function SidePanel({
    parameters,
    onParametersChange,
    isSimulating,
}: SidePanelProps) {
    // Local state for staged changes
    const [localParams, setLocalParams] = useState<TrainingParameters>(parameters);

    // Sync local state when parent parameters change (e.g., from reset)
    useEffect(() => {
        setLocalParams(parameters);
    }, [parameters]);

    // Check if there are pending changes
    const hasChanges = useMemo(() => {
        return (
            localParams.populationSize !== parameters.populationSize ||
            localParams.mutationRate !== parameters.mutationRate ||
            localParams.trackIndex !== parameters.trackIndex ||
            localParams.keepCount !== parameters.keepCount ||
            localParams.maxIterations !== parameters.maxIterations ||
            localParams.hypermutationEnabled !== parameters.hypermutationEnabled
        );
    }, [localParams, parameters]);

    const handleApply = () => {
        onParametersChange(localParams);
    };

    return (
        <aside className="w-[280px] h-full flex flex-col border-l-2 border-border bg-background overflow-hidden">
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-4 p-4">
                    <ParametersCard
                        parameters={parameters}
                        localParams={localParams}
                        onLocalParamsChange={setLocalParams}
                        disabled={isSimulating}
                    />
                </div>
            </ScrollArea>

            {/* Sticky Apply Button at the bottom, outside ScrollArea */}
            <div className="p-4 border-t-2 border-border bg-background">
                <Button
                    variant="default"
                    className="w-full"
                    disabled={isSimulating || !hasChanges}
                    onClick={handleApply}
                >
                    <Check className="size-4 mr-2" />
                    Apply Changes
                </Button>
                {hasChanges && !isSimulating && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        You have unsaved changes
                    </p>
                )}
            </div>
        </aside>
    );
}

export type { TrainingParameters } from './ParametersCard';
export type { FitnessDataPoint } from './FitnessHistoryCard';
export type { LogEntry } from './ConsoleCard';

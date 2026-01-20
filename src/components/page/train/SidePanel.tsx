'use client';

import { ParametersCard, type TrainingParameters } from './ParametersCard';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    return (
        <aside className="w-[280px] h-full flex flex-col border-l-2 border-border bg-background overflow-hidden">
            <ScrollArea className="flex-1 h-full">
                <div className="flex flex-col gap-4 p-4">
                    <ParametersCard
                        parameters={parameters}
                        onParametersChange={onParametersChange}
                        disabled={isSimulating}
                    />
                </div>
            </ScrollArea>
        </aside>
    );
}


export type { TrainingParameters } from './ParametersCard';
export type { FitnessDataPoint } from './FitnessHistoryCard';
export type { LogEntry } from './ConsoleCard';

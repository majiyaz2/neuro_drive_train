'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

export interface FitnessDataPoint {
    generation: number;
    fitness: number;
}

interface FitnessHistoryCardProps {
    data: FitnessDataPoint[];
}

const chartConfig = {
    fitness: {
        label: 'Fitness',
        color: 'var(--chart-1)',
    },
} satisfies ChartConfig;

export function FitnessHistoryCard({ data }: FitnessHistoryCardProps) {
    // Show last 10 generations for a cleaner view
    const displayData = data.slice(-10);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider">
                    Fitness History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[150px] w-full">
                        <LineChart data={displayData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="generation"
                                tickFormatter={(value) => `Gen ${value}`}
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fontSize: 10 }}
                                domain={[0, 100]}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Line
                                type="monotone"
                                dataKey="fitness"
                                stroke="var(--color-fitness)"
                                strokeWidth={2}
                                dot={{ fill: 'var(--chart-active-dot)', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <div className="h-[150px] flex items-center justify-center text-sm opacity-60">
                        No data yet. Start training!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

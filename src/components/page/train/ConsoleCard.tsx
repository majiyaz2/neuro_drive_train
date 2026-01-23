'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRef, useEffect } from 'react';

export interface LogEntry {
    timestamp: Date;
    message: string;
}

interface ConsoleCardProps {
    logs: LogEntry[];
}

export function ConsoleCard({ logs }: ConsoleCardProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-wider">
                    Console
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    ref={scrollRef}
                    className="h-[250px] overflow-y-auto bg-secondary-background border-2 border-border p-2 font-mono text-xs space-y-1"
                >
                    {logs.length > 0 ? (
                        logs.map((log, index) => (
                            <div key={index} className="text-green-700">
                                <span className="text-chart-2">&gt;</span> {log.message}
                            </div>
                        ))
                    ) : (
                        <div className="text-foreground/50">
                            <span className="text-chart-2">&gt;</span> Waiting for simulation...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

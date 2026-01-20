'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { SidePanel, type TrainingParameters, type FitnessDataPoint, type LogEntry } from '@/components/page/train';
import { ControlCenterCard } from '@/components/page/train/ControlCenterCard';
import { FitnessHistoryCard } from '@/components/page/train/FitnessHistoryCard';
import { ConsoleCard } from '@/components/page/train/ConsoleCard';
import { Sun, Moon, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameCanvasCommand } from '@/components/game/GameCanvas';

// Dynamically import GameCanvas to avoid SSR issues with PixiJS
const GameCanvas = dynamic(
  () => import('@/components/game/GameCanvas').then((mod) => mod.GameCanvas),
  { ssr: false }
);

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [command, setCommand] = useState<GameCanvasCommand>(null);

  const [parameters, setParameters] = useState<TrainingParameters>({
    populationSize: 50,
    mutationRate: 0.05,
    trackIndex: 2,
    keepCount: 10,
    maxIterations: 100,
  });

  const [fitnessHistory, setFitnessHistory] = useState<FitnessDataPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs((prev) => [...prev.slice(-50), { timestamp: new Date(), message }]);
  }, []);

  const handleStart = useCallback(() => {
    addLog('initializing neural_net_core...');
    addLog(`loading track_data: "circuit_alpha"`);
    addLog(`populating agents (n=${parameters.populationSize})`);
    addLog('simulation running...');
    setCommand('start');
    // Reset command after a tick to allow re-triggering
    setTimeout(() => setCommand(null), 100);
  }, [addLog, parameters.populationSize]);

  const handlePause = useCallback(() => {
    addLog('simulation paused');
    setCommand('pause');
    setTimeout(() => setCommand(null), 100);
  }, [addLog]);

  const handleReset = useCallback(() => {
    addLog('resetting simulation...');
    setFitnessHistory([]);
    setCommand('reset');
    setTimeout(() => setCommand(null), 100);
  }, [addLog]);

  const handleApplyParameters = useCallback((newParams: TrainingParameters) => {
    const trackChanged = newParams.trackIndex !== parameters.trackIndex;
    setParameters(newParams);
    if (trackChanged) {
      addLog(`Switching to Track ${newParams.trackIndex + 1}`);
    }
    addLog(`Applying parameters: population=${newParams.populationSize}, mutation=${(newParams.mutationRate * 100).toFixed(1)}%`);
    setCommand('apply');
    setTimeout(() => setCommand(null), 100);
  }, [addLog, parameters.trackIndex]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-background ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-main border-b-2 border-border">
        <div className="flex items-center gap-3">
          <Cpu className="size-8" />
          <div>
            <h1 className="text-xl font-heading uppercase tracking-wide text-main-foreground">
              Neuro Drive Train
            </h1>
            <p className="text-xs text-main-foreground/70">
              Neural Network Racing Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 border-2 border-border bg-secondary-background font-mono text-sm">
            v2.4.0-alpha
          </span>
          <Button variant="neutral" size="icon" onClick={toggleDarkMode}>
            {isDarkMode ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Simulation Area - Left Column */}
        <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
          <ControlCenterCard
            isSimulating={isSimulating}
            isLoading={isLoading}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />

          <div className="flex-1 border-2 border-border bg-secondary-background shadow-shadow overflow-hidden">
            <GameCanvas
              addLog={addLog}
              trackIndex={parameters.trackIndex}
              command={command}
              trainingConfig={{
                maxGenerationIterations: parameters.maxIterations,
                populationCount: parameters.populationSize,
                keepCount: parameters.keepCount,
                mutationRate: parameters.mutationRate
              }}
              onLoadingChange={setIsLoading}
              onSimulatingChange={setIsSimulating}
              onGenerationComplete={(gen, fitness) => {
                setFitnessHistory((prev) => [...prev, { generation: gen, fitness }]);
                addLog(`Fitness score: ${fitness.toFixed(1)}%`);
              }}
            />
          </div>
        </main>

        {/* Parameters Area - Middle Column */}
        <SidePanel
          parameters={parameters}
          onParametersChange={handleApplyParameters}
          isSimulating={isSimulating}
        />

        {/* Stats Area - Right Column */}
        <div className="w-[320px] flex flex-col border-l-2 border-border bg-background overflow-hidden">
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
            <FitnessHistoryCard data={fitnessHistory} />
            <ConsoleCard logs={logs} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between px-6 py-3 border-t-2 border-border text-sm">
        <span className="text-foreground/60">
          © 2023 Neuro Drive Inc. All rights reserved.
        </span>
        <nav className="flex gap-6 text-foreground/80">
          <a href="#" className="hover:underline">Documentation</a>
          <a href="#" className="hover:underline">GitHub</a>
          <a href="#" className="hover:underline">Models</a>
        </nav>
      </footer>
    </div>
  );
}

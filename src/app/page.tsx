'use client';

import dynamic from 'next/dynamic';

// Dynamically import GameCanvas to avoid SSR issues with PixiJS
const GameCanvas = dynamic(
  () => import('@/components/game/GameCanvas').then((mod) => mod.GameCanvas),
  { ssr: false }
);

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          🚗 Neuro Drive Train
        </h1>
        <p className="text-gray-300 text-lg">
          Neural Network Racing Simulation
        </p>
      </header>

      <main>
        <GameCanvas trackIndex={2} trainingConfig={{ maxGenerationIterations: 100, populationCount: 50, keepCount: 10 }} />
      </main>

      <footer className="mt-8 text-gray-400 text-sm">
        Press <kbd className="px-2 py-1 bg-gray-700 rounded text-white">ESC</kbd> to abort simulation
      </footer>
    </div>
  );
}

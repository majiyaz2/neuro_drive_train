"use client";

import { Scene } from "@/components/game3D/Scene";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";
import Link from "next/link";

export default function TestingPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const { account } = useWallet();

  // For testing purposes, we use a mock attemptId if none exists
  const mockAttemptId = 1n;

  if (isPlaying) {
    return (
      <div className="h-screen w-full">
        <Scene
          onBack={() => setIsPlaying(false)}
          attemptId={mockAttemptId}
          account={account}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 font-base">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-heading uppercase tracking-tighter text-white">
            Lab Environment
          </h1>
          <p className="text-slate-400 font-mono text-lg">
            NEURAL PATTERN VALIDATION & VICTORY SEQUENCE TESTING
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="p-8 border-4 border-slate-800 bg-slate-900 shadow-[8px_8px_0px_0px_rgba(30,41,59,1)] rounded-base space-y-6">
            <div className="flex items-center justify-center gap-4">
              <Rocket className="size-12 text-main" />
              <div className="text-left">
                <h3 className="text-2xl font-heading text-white uppercase">Trial Config</h3>
                <p className="text-slate-500 font-mono text-xs">MODE: ROBUST_VICTORY_V1</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-slate-400 font-mono text-sm border-b border-slate-800 pb-2">
                <span>WALLET SYNC:</span>
                <span className={account ? "text-green-400" : "text-red-400"}>
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "NOT_SYNCED"}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-sm border-b border-slate-800 pb-2">
                <span>SIM_ENGINE:</span>
                <span className="text-main">CANNON_PHYSICS</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-sm pb-2">
                <span>VALIDATION:</span>
                <span className="text-main">SEQUENTIAL_CHECKPOINTS + POW</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full h-20 text-3xl font-heading uppercase gap-4"
              onClick={() => setIsPlaying(true)}
            >
              Initialize Trial
              <Rocket className="size-8" />
            </Button>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-mono">
            <ArrowLeft className="size-4" />
            RETURN TO COMMAND CENTER
          </Link>
        </div>
      </div>
    </div>
  );
}

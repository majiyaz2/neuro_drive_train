// src/hooks/useGameLoop.ts
import { useRef, useCallback, useEffect } from 'react';
import type { Application, Ticker } from 'pixi.js';

export interface UseGameLoopOptions {
    onUpdate: (deltaTime: number) => void | Promise<void>;
    autoStart?: boolean;
}

export interface UseGameLoopReturn {
    start: () => void;
    stop: () => void;
    isRunning: boolean;
}

export function useGameLoop(
    app: Application | null,
    options: UseGameLoopOptions
): UseGameLoopReturn {
    const isRunningRef = useRef(false);
    const updateFnRef = useRef(options.onUpdate);

    // Keep update function reference current
    useEffect(() => {
        updateFnRef.current = options.onUpdate;
    }, [options.onUpdate]);

    const tickerCallback = useCallback((ticker: Ticker) => {
        const deltaTime = ticker.deltaTime / 60; // Normalize to seconds
        updateFnRef.current(deltaTime);
    }, []);

    const start = useCallback(() => {
        if (!app || isRunningRef.current) return;
        app.ticker.add(tickerCallback);
        isRunningRef.current = true;
    }, [app, tickerCallback]);

    const stop = useCallback(() => {
        if (!app || !isRunningRef.current) return;
        app.ticker.remove(tickerCallback);
        isRunningRef.current = false;
    }, [app, tickerCallback]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (app && isRunningRef.current) {
                app.ticker.remove(tickerCallback);
            }
        };
    }, [app, tickerCallback]);

    // Auto-start if requested
    useEffect(() => {
        if (options.autoStart && app) {
            start();
        }
    }, [options.autoStart, app, start]);

    return {
        start,
        stop,
        isRunning: isRunningRef.current,
    };
}

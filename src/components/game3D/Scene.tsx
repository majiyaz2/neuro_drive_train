"use client"
import { Debug, Physics } from '@react-three/cannon'
import { Environment, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import React, { useState, useCallback, Suspense } from 'react'
import { HudOverlay } from './HudOverlay'
import { VictoryModal } from './VictoryModal'
import { useToggledControl } from '@/hooks/use-toggled-control'
import { Plane } from './Plane'
import Vehicle from './Vehicle'
import { Road } from './Road'



import { Checkpoint } from './Checkpoint'
import { keccak256, encodePacked } from 'viem'

const TILE_SIZE = 8;
const TOTAL_CHECKPOINTS = 4;

const CHECKPOINT_POSITIONS: [number, number, number, number][] = [
    [TILE_SIZE * 2, 2, 0, Math.PI / 2], // Mid bottom straight
    [TILE_SIZE * 5, 2, TILE_SIZE * 3.5, 0], // Mid right column
    [TILE_SIZE * 2, 2, TILE_SIZE * 7, Math.PI / 2], // Mid top straight
    [-TILE_SIZE, 2, TILE_SIZE * 3.5, 0], // Mid left column
];

export const Scene = ({
    onBack,
    attemptId,
    account,
    customModel
}: {
    onBack: () => void,
    attemptId?: bigint | null,
    account?: string | null,
    customModel?: any
}) => {
    const ToggledDebug = useToggledControl(Debug, '?')

    // Telemetry state
    const [telemetry, setTelemetry] = useState({ speed: 0, checkpoints: 0 })
    const [victoryStats, setVictoryStats] = useState<{ modelHash: string; nonce: string } | null>(null)
    const [isSimulating, setIsSimulating] = useState(true)
    const [nextCheckpoint, setNextCheckpoint] = useState(0)
    const [isGeneratingProof, setIsGeneratingProof] = useState(false)

    // Refs for performant tracking
    const nextCheckpointRef = React.useRef(0)
    const speedRef = React.useRef(0)
    const lastUpdateRef = React.useRef(0)

    const handleProgress = useCallback((speed: number) => {
        speedRef.current = speed

        // Only trigger a re-render for speed every 100ms
        const now = Date.now()
        if (now - lastUpdateRef.current > 100) {
            setTelemetry(prev => ({
                ...prev,
                speed: speedRef.current,
                checkpoints: nextCheckpointRef.current // Sync with latest checkpoint
            }))
            lastUpdateRef.current = now
        }
    }, [])
    // const handleProgress = useCallback((speed: number) => {
    //     speedRef.current = speed
        
    //     // Only trigger a re-render for speed every 100ms
    //     const now = Date.now()
    //     if (now - lastUpdateRef.current > 100) {
    //         setTelemetry(prev => ({ 
    //             ...prev, 
    //             speed: speedRef.current,
    //             checkpoints: nextCheckpointRef.current // Sync with latest checkpoint
    //         }))
    //         lastUpdateRef.current = now
    //     }
    // }, [])


    const handleVictory = useCallback(async () => {
        setIsGeneratingProof(true)
        console.log("🏁 Race Complete! Generating proof...")

        // Use model CID or a hash of the custom model as modelHash
        // For now, using a placeholder that looks like a real hash
        const modelHash = keccak256(encodePacked(['string'], [customModel?.name || "default_model"]))

        // Simple Proof of Work (Proof of Racing)
        // Find a nonce such that keccak256(attemptId + modelHash + nonce) starts with 00
        let nonce = 0
        const id = attemptId || 0n

        // Small delay to simulate computation and let UI update
        await new Promise(resolve => setTimeout(resolve, 1500))

        while (nonce < 100000) {
            const hash = keccak256(encodePacked(['uint256', 'bytes32', 'uint256'], [id, modelHash, BigInt(nonce)]))
            if (hash.startsWith('0x00')) {
                break
            }
            nonce++
        }

        setVictoryStats({ modelHash, nonce: nonce.toString() })
        setIsSimulating(false)
        setIsGeneratingProof(false)
    }, [customModel, attemptId])

    const handleCheckpointHit = useCallback((index: number) => {
        // Ignore hits for checkpoints we've already passed or just hit
        if (index < nextCheckpointRef.current) return;

        if (index === nextCheckpointRef.current) {
            console.log(`✅ Checkpoint ${index} hit!`)
            const newNext = index + 1
            nextCheckpointRef.current = newNext
            setNextCheckpoint(newNext)

            // Immediate state update for checkpoints so UI is responsive, 
            // but use the latest speedRef to avoid "jumping" back to a throttled speed
            setTelemetry(prev => ({
                ...prev,
                checkpoints: newNext,
                speed: speedRef.current
            }))

            if (newNext === TOTAL_CHECKPOINTS) {
                handleVictory()
            }
        } else {
            // Only warn if they hit a future checkpoint while skipping others
            console.warn(`❌ Wrong checkpoint. Expected ${nextCheckpointRef.current}, hit ${index}. Please don't skip!`)
        }
    }, [handleVictory])

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas camera={{ fov: 50, position: [0, 5, 15] }} shadows style={{ width: '100%', height: '100%' }}>
                {/* <fog attach="fog" args={['#76767dff', 100, 0]} /> */}
                <color attach="background" args={['#509a50ff']} />
                <ambientLight intensity={0.1 * Math.PI} />
                <spotLight
                    angle={0.5}
                    castShadow
                    decay={0}
                    intensity={Math.PI}
                    penumbra={1}
                    position={[10, 10, 10]}
                />
                <Physics
                    broadphase="SAP"
                    defaultContactMaterial={{ contactEquationRelaxation: 4, friction: 1e-3 }}
                    allowSleep
                >
                    <ToggledDebug>
                        <Plane position={[15, 0, 30]} rotation={[-Math.PI / 2, 0, 0]} userData={{ id: 'floor' }} />
                        <Vehicle
                            position={[0, 3, 0]}
                            rotation={[0, Math.PI / 2, 0]}
                            angularVelocity={[0, 0.5, 0]}
                            enableRays={true}
                            networkIndex={1}
                            onProgress={handleProgress}
                            customModel={customModel}
                        />
                        <Road position={[0, 0.05, 0]} />

                        {/* Render Checkpoints */}
                        {CHECKPOINT_POSITIONS.map((pos, i) => (
                            <Checkpoint
                                key={i}
                                index={i}
                                position={[pos[0], pos[1], pos[2]]}
                                rotation={[0, pos[3], 0]}
                                onHit={handleCheckpointHit}
                                isActive={i === nextCheckpoint}
                            />
                        ))}
                    </ToggledDebug>
                </Physics>
                <Suspense fallback={null}>
                    <Environment files="textures/umhlanga_sunrise_1k.hdr" background resolution={1080} blur={0} />
                </Suspense>
                <OrbitControls />
            </Canvas>

            {/* UI Layer */}
            <HudOverlay
                speed={telemetry.speed}
                checkpoints={telemetry.checkpoints}
                totalCheckpoints={TOTAL_CHECKPOINTS}
                sessionActive={isSimulating}
                powProgress={isGeneratingProof ? 50 : (telemetry.checkpoints / TOTAL_CHECKPOINTS) * 100}
                onBack={onBack}
            />

            {isGeneratingProof && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm z-40">
                    <div className="bg-card p-8 border-4 border-border shadow-shadow animate-pulse text-center">
                        <h2 className="text-2xl font-heading uppercase mb-2">Generating Neural Proof</h2>
                        <p className="font-mono text-xs">MINING POW NONCE FOR BLOCKCHAIN VERIFICATION...</p>
                    </div>
                </div>
            )}

            {victoryStats && (
                <VictoryModal
                    modelHash={victoryStats.modelHash}
                    nonce={victoryStats.nonce}
                    difficulty="MEDIUM"
                    reward="0.05"
                    attemptId={attemptId}
                    onClaim={() => {
                        console.log("Victory claimed successfully!")
                        onBack()
                    }}
                    onClose={() => setVictoryStats(null)}
                />
            )}
        </div>
    )
}


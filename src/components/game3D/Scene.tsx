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

export const Scene = ({ onBack }: { onBack: () => void }) => {
    const ToggledDebug = useToggledControl(Debug, '?')

    // Telemetry state
    const [telemetry, setTelemetry] = useState({ speed: 0, checkpoints: 0 })
    const [victoryStats, setVictoryStats] = useState<{ modelHash: string; nonce: string } | null>(null)
    const [isSimulating, setIsSimulating] = useState(true)

    // Throttle ref for progress updates
    const lastUpdateRef = React.useRef(0)

    const handleProgress = useCallback((speed: number, checkpoints: number) => {
        // Throttle updates to every 100ms to avoid excessive re-renders
        const now = Date.now()
        if (now - lastUpdateRef.current > 100) {
            setTelemetry({ speed, checkpoints })
            lastUpdateRef.current = now
        }
    }, [])

    const handleGoalReached = useCallback((stats: { modelHash: string; nonce: string }) => {
        setVictoryStats(stats)
        setIsSimulating(false)
    }, [])

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
                            position={[0, 2, 0]}
                            rotation={[0, -Math.PI / 4, 0]}
                            angularVelocity={[0, 0.5, 0]}
                            enableRays={true}
                            networkIndex={1}
                            onProgress={handleProgress}
                            onGoalReached={handleGoalReached}
                        />
                        <Road position={[0, 0.05, 0]} />
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
                totalCheckpoints={10}
                sessionActive={isSimulating}
                powProgress={isSimulating ? (telemetry.checkpoints / 10) * 100 : 100}
                onBack={onBack}
            />

            {victoryStats && (
                <VictoryModal
                    modelHash={victoryStats.modelHash}
                    nonce={victoryStats.nonce}
                    difficulty="MEDIUM"
                    reward="0.05"
                    onClaim={() => {
                        console.log("Claiming victory...")
                        setVictoryStats(null)
                    }}
                    onClose={() => setVictoryStats(null)}
                />
            )}
        </div>
    )
}


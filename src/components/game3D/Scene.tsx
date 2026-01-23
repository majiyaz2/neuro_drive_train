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
import { createPublicClient, createWalletClient, custom, http, type Address, hexToBytes, bytesToHex } from 'viem'
import { sepolia } from 'viem/chains'
import { NEXUS_DRIVE_ADDRESS, NEXUS_DRIVE_ABI } from '@/lib/nexusDriveContract'
import { IpfsService } from '@/lib/ipfsService'

export const Scene = ({
    onBack,
    attemptId,
    account
}: {
    onBack: () => void,
    attemptId: bigint | null,
    account: Address | null
}) => {
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

    const handleClaim = async () => {
        if (!account || !attemptId || !victoryStats || !window.ethereum) return;

        const ipfs = new IpfsService(); // Using simulation mode unless key is provided
        const publicClient = createPublicClient({
            chain: sepolia,
            transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
        });

        const walletClient = createWalletClient({
            account,
            chain: sepolia,
            transport: custom(window.ethereum),
        });

        try {
            console.log("Uploading model to IPFS...");
            // In a real scenario, we'd upload actual weights here
            const dummyModel = {
                weights: [0.1, -0.2, 0.5],
                stats: victoryStats,
                timestamp: Date.now()
            };
            const ipfsHash = await ipfs.uploadModel(dummyModel);

            // Convert IPFS CID (string) to bytes32 for the contract
            // For now, we'll hash the string to simulate a bytes32 modelHash
            // Realistic implementation would involve decoding Base58 CID
            const modelHashBytes = bytesToHex(new TextEncoder().encode(ipfsHash.slice(0, 31)));

            console.log("Claiming victory on-chain...");
            const hash = await walletClient.writeContract({
                address: NEXUS_DRIVE_ADDRESS,
                abi: NEXUS_DRIVE_ABI,
                functionName: "claimVictory",
                args: [attemptId, modelHashBytes as `0x${string}`]
            });

            await publicClient.waitForTransactionReceipt({ hash });
            console.log("Victory claimed successfully!");
            setVictoryStats(null);
            onBack();
        } catch (err) {
            console.error("Claim failed:", err);
        }
    };

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
                    onClaim={handleClaim}
                    onClose={() => setVictoryStats(null)}
                />
            )}
        </div>
    )
}


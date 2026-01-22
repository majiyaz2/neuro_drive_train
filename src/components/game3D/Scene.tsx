"use client"
import { Debug, Physics } from '@react-three/cannon'
import { Environment, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import  { Suspense } from 'react'
import { useToggledControl } from '@/components/game3D/use-toggled-control'
import { Plane } from './Plane'
import { Pillar } from './Pillar'

export const Scene = () => {
    const ToggledDebug = useToggledControl(Debug, '?')

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
                        <Pillar position={[-5, 2.5, -5]} userData={{ id: 'pillar-1' }} />
                        <Pillar position={[0, 2.5, -5]} userData={{ id: 'pillar-2' }} />
                        <Pillar position={[5, 2.5, -5]} userData={{ id: 'pillar-3' }} />
                    </ToggledDebug>
                </Physics>
                <Suspense fallback={null}>
                    <Environment files="textures/umhlanga_sunrise_1k.hdr" background resolution={1080} blur={0} />
                </Suspense>
                <OrbitControls />
            </Canvas>
        </div>
    )
}


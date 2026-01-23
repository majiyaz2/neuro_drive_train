/**
 * Taxi Model - Complete assembly with chassis and wheels
 * 
 * For individual components, use:
 * - TaxiChassis - Just the car body
 * - TaxiWheel - Individual wheels with physics
 */
import { useGLTF } from '@react-three/drei'
import type { JSX } from 'react'

export { TaxiChassis } from './TaxiChassis'
export { TaxiWheel } from './TaxiWheel'

// Legacy combined model for backwards compatibility
export function Model(props: JSX.IntrinsicElements['group']) {
    const { nodes, materials } = useGLTF('/models/Taxi.glb') as any
    return (
        <group {...props} dispose={null}>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.car_taxi.geometry}
                material={materials.citybits_texture}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={100}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.car_taxi_wheel_front_left.geometry}
                    material={materials.citybits_texture}
                    position={[0.002, -0.002, 0]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.car_taxi_wheel_rear_left.geometry}
                    material={materials.citybits_texture}
                    position={[0.002, 0.003, 0]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.car_taxi_wheel_front_right.geometry}
                    material={materials.citybits_texture}
                    position={[-0.002, -0.002, 0]}
                />
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.car_taxi_wheel_rear_right.geometry}
                    material={materials.citybits_texture}
                    position={[-0.002, 0.003, 0]}
                />
            </mesh>
        </group>
    )
}

useGLTF.preload('/models/Taxi.glb')
/* eslint-disable react/display-name */
import { useGLTF } from '@react-three/drei'
import { forwardRef } from 'react'
import type { Material, Mesh } from 'three'
import type { GLTF } from 'three-stdlib'

useGLTF.preload('/models/Taxi.glb')

type TaxiGLTF = GLTF & {
    materials: Record<'citybits_texture', Material>
    nodes: Record<'car_taxi' | 'car_taxi_wheel_front_left' | 'car_taxi_wheel_rear_left' | 'car_taxi_wheel_front_right' | 'car_taxi_wheel_rear_right', Mesh>
}

export const TaxiChassis = forwardRef<Mesh>((_, ref) => {
    const { nodes, materials } = useGLTF('/models/Taxi.glb') as unknown as TaxiGLTF

    return (
        <mesh ref={ref}>
            <group scale={4.9} position={[0, -0.2, 0.1]}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.car_taxi.geometry}
                    material={materials.citybits_texture}
                    rotation={[-Math.PI / 2, 0, 0]}
                    scale={100}
                />
            </group>
        </mesh>
    )
})

import { useGLTF } from '@react-three/drei'
import type { JSX } from 'react'

export function Model(props: JSX.IntrinsicElements['group']) {
    const { nodes, materials } = useGLTF('/models/Building-Blue-Yellow.glb') as any
    return (
        <group {...props} dispose={null}>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.building_H.geometry}
                material={materials.citybits_texture}
                scale={100}
            />
        </group>
    )
}

useGLTF.preload('/models/Building-Blue-Yellow.glb')

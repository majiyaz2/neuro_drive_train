import React, { useRef } from 'react'
import type { JSX } from 'react'
import { useGLTF } from '@react-three/drei'


export function Model(props: JSX.IntrinsicElements['group']) {
  const { nodes, materials } = useGLTF('/models/Building-Green.glb') as any
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.building_D.geometry}
        material={materials.citybits_texture}
        scale={100}
      />
    </group>
  )
}

useGLTF.preload('/models/Building-Green.glb')
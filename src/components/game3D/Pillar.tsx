import type { CylinderArgs, CylinderProps } from '@react-three/cannon'
import { useCylinder } from '@react-three/cannon'
import { useRef } from 'react'
import { Mesh } from 'three'

export function Pillar(props: CylinderProps) {
    const args: CylinderArgs = [0.7, 0.7, 5, 16]
    const [ref] = useCylinder(
        () => ({
            args,
            mass: 1000,
            ...props,
        }),
        useRef<Mesh>(null),
    )
    return (
        <mesh ref={ref} castShadow>
            <cylinderGeometry args={args} />
            <meshNormalMaterial />
        </mesh>
    )
}
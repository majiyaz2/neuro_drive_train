import { usePlane, type PlaneProps } from '@react-three/cannon'
import { useRef } from 'react'
import { Group } from 'three'

export function Plane(props: PlaneProps) {
    const [ref] = usePlane(() => ({ material: 'ground', type: 'Static', ...props }), useRef<Group>(null))
    return (
        <group ref={ref}>
            <mesh receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial
                    color="#1c1c29ff"
                />
            </mesh>
        </group>
    )
}
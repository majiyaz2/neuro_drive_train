
import { useBox } from "@react-three/cannon";
import { useRef } from "react";
import * as THREE from 'three';
import { Group } from "three";

// Road piece size (each tile is 8 units - quadrupled from original)
const TILE_SIZE = 8;
// Physics collision box dimensions for each tile
const COLLISION_SIZE = TILE_SIZE;
const COLLISION_HEIGHT = 0.2;
// Wall dimensions for collision buffers
const WALL_HEIGHT = 2;
const WALL_THICKNESS = 0.3;

export function RoadStraight({ position, rotationY = 0, geometry, material }: {
    position: [number, number, number];
    rotationY?: number;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
}) {
    const [ref] = useBox(
        () => ({
            args: [COLLISION_SIZE, COLLISION_HEIGHT + 0.3, COLLISION_SIZE],
            position: position,
            // rotation: [0, rotationY, 0],
            type: 'Static',
            material: 'ground',
        }),
        useRef<Group>(null),
    );

    return (
        <group ref={ref}>
            <mesh
                castShadow
                receiveShadow
                geometry={geometry}
                material={material}
                position={[0, -COLLISION_HEIGHT / 2, 0]}
                rotation={[-Math.PI / 2, 0, rotationY]}
                scale={400}
            />
        </group>
    );
}
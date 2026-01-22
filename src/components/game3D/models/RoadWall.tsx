import { useBox } from "@react-three/cannon";
import { useRef } from "react";
import { Group } from "three";

export function RoadWall({ position, args, visible = false }: {
    position: [number, number, number];
    args: [number, number, number]; // width, height, depth
    visible?: boolean;
}) {
    const [ref] = useBox(
        () => ({
            args: args,
            position: position,
            type: 'Static',
            material: 'ground',
        }),
        useRef<Group>(null),
    );

    return (
        <group ref={ref}>
            {visible && (
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={args} />
                    <meshStandardMaterial color="red" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
}
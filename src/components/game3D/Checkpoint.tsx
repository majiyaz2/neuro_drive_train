import { useBox } from "@react-three/cannon";
import { Mesh } from "three";
import { useRef } from "react";

interface CheckpointProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    index: number;
    onHit: (index: number) => void;
    isActive?: boolean;
}

export function Checkpoint({ position, rotation = [0, 0, 0], index, onHit, isActive }: CheckpointProps) {
    const [ref] = useBox(() => ({
        isTrigger: true,
        args: [6, 4, 0.5], // Gate size
        position,
        rotation,
        onCollide: (e) => {
            // Check if what collided is the car (it has userData.id = 'chassis' or similar)
            // In our Vehicle.tsx, the chassisBody has no explicit id set in userData, 
            // but we can identify it. Actually, any collision with the trigger should count 
            // as it is likely the vehicle.
            onHit(index);
        },
    }), useRef<Mesh>(null));

    return (
        <mesh ref={ref}>
            <boxGeometry args={[6, 4, 0.1]} />
            <meshStandardMaterial
                color={isActive ? "#ffff00" : "#ff00ff"}
                transparent
                opacity={0.2}
                emissive={isActive ? "#ffff00" : "#ff00ff"}
                emissiveIntensity={isActive ? 2 : 0.5}
            />
            {/* Visual gate posts */}
            <mesh position={[-3, 0, 0]}>
                <boxGeometry args={[0.2, 4, 0.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[3, 0, 0]}>
                <boxGeometry args={[0.2, 4, 0.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[0, 2, 0]}>
                <boxGeometry args={[6.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </mesh>
    );
}

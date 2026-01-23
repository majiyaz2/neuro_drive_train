import { useBox } from "@react-three/cannon";
import { useRef, useMemo } from "react";
import { Group } from "three";

// Road piece size (each tile is 8 units)
const TILE_SIZE = 8;
const WALL_HEIGHT = 2;
const WALL_THICKNESS = 0.3;

// Number of segments to approximate the curve
const CURVE_SEGMENTS = 0;

interface WallSegmentProps {
    position: [number, number, number];
    rotation: [number, number, number];
    args: [number, number, number];
    visible?: boolean;
}

function WallSegment({ position, rotation, args, visible = false }: WallSegmentProps) {
    const [ref] = useBox(
        () => ({
            args: args,
            position: position,
            rotation: rotation,
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

interface RoadCornerWallProps {
    position: [number, number, number]; // Center of the corner tile
    rotationY: number; // Rotation of the corner (0, 90, 180, 270 degrees in radians)
    radius: 'inner' | 'outer'; // Inner curve or outer curve
    visible?: boolean;
}

/**
 * Creates a curved wall for road corners using multiple box segments arranged in an arc.
 * The curve is approximated using CURVE_SEGMENTS number of small boxes.
 */
export function RoadCornerWall({ position, rotationY, radius, visible = true }: RoadCornerWallProps) {
    // Calculate the wall segments for the curved wall
    const segments = useMemo(() => {
        const result: Array<{
            position: [number, number, number];
            rotation: [number, number, number];
            args: [number, number, number];
        }> = [];

        // The road curves around the CORNER of the tile (not center)
        // The pivot point is at one corner, and the curve sweeps 90 degrees
        // Inner wall: curves at the inner edge of the road 
        // Outer wall: curves at the outer edge of the road
        const curveRadius = radius === 'inner'
            ? TILE_SIZE * 0.5   // Inner road edge - half tile from pivot
            : TILE_SIZE;        // Outer road edge - full tile from pivot

        // Arc spans 90 degrees (PI/2 radians)
        const arcAngle = Math.PI / 2;
        const segmentAngle = arcAngle / CURVE_SEGMENTS;
        const segmentLength = (curveRadius * arcAngle) / CURVE_SEGMENTS;

        for (let i = 0; i < CURVE_SEGMENTS; i++) {
            // Calculate angle for the middle of this segment
            // Start at 0 and go to PI/2
            const angle = (i + 0.5) * segmentAngle;

            // Position relative to the corner pivot point
            // The pivot is at the corner of the tile, so we need to offset from tile center
            // For a default (unrotated) corner, pivot is at (-TILE_SIZE/2, -TILE_SIZE/2) relative to center
            const pivotOffsetX = -TILE_SIZE / 2;
            const pivotOffsetZ = -TILE_SIZE / 2;

            // Calculate position on the arc relative to pivot
            const localX = pivotOffsetX + curveRadius * Math.cos(angle);
            const localZ = pivotOffsetZ + curveRadius * Math.sin(angle);

            // Apply the corner's rotation to the position
            const cos = Math.cos(rotationY);
            const sin = Math.sin(rotationY);

            const rotatedX = localX * cos - localZ * sin;
            const rotatedZ = localX * sin + localZ * cos;

            result.push({
                position: [
                    position[0] + rotatedX,
                    position[1] + WALL_HEIGHT / 2,
                    position[2] + rotatedZ
                ] as [number, number, number],
                rotation: [0, rotationY + angle, 0] as [number, number, number],
                args: [segmentLength * 1.2, WALL_HEIGHT, WALL_THICKNESS] as [number, number, number]
            });
        }

        return result;
    }, [position, rotationY, radius]);

    return (
        <group>
            {segments.map((segment, index) => (
                <WallSegment
                    key={`${radius}-${index}`}
                    position={segment.position}
                    rotation={segment.rotation}
                    args={segment.args}
                    visible={visible}
                />
            ))}
        </group>
    );
}

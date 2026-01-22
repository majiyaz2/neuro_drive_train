import { useRaycastClosest } from '@react-three/cannon'
import { extend, type ThreeElement, useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react'
import { BufferAttribute, BufferGeometry, Line as ThreeLine, Object3D, Vector3 } from 'three'

extend({ ThreeLine })

declare module '@react-three/fiber' {
    interface ThreeElements {
        threeLine: ThreeElement<typeof ThreeLine>
    }
}

// Sensor configuration for raycasting
const rayLength = 5

// Sensor positions relative to the chassis
// Each sensor has an offset from the chassis center and a direction
const sensorPositions = [
    { offset: [0, 0.3, 2], direction: [0, 0, 1] },        // Front center
    { offset: [0.8, 0.3, 1.8], direction: [0.5, 0, 1] },  // Front right
    { offset: [-0.8, 0.3, 1.8], direction: [-0.5, 0, 1] }, // Front left
    { offset: [1, 0.3, 0], direction: [1, 0, 0] },         // Right side
    { offset: [-1, 0.3, 0], direction: [-1, 0, 0] },       // Left side
]

// Ray result type matching the original game.js pattern
export type RayResult = {
    hasHit: boolean
    hitPoint: [number, number, number] | null
    hitDistance: number
    hitNormal: [number, number, number] | null
    rayIndex: number
}

type RayData = {
    from: [number, number, number]
    to: [number, number, number]
}

type CarRaysProps = {
    chassisRef: RefObject<Object3D | null>
    enabled?: boolean
    onProbe?: (results: RayResult[]) => void
}

// Individual ray sensor component - receives positions as props and uses them in deps
function RaySensor({
    rayIndex,
    from,
    to,
    onResult
}: {
    rayIndex: number
    from: [number, number, number]
    to: [number, number, number]
    onResult: (result: RayResult) => void
}) {
    useRaycastClosest(
        {
            from,
            to,
            skipBackfaces: true,
            collisionFilterMask: -1, // Collide with everything
        },
        (e) => {
            const result: RayResult = {
                hasHit: e.hasHit,
                hitPoint: e.hasHit && e.hitPointWorld
                    ? [e.hitPointWorld[0] ?? 0, e.hitPointWorld[1] ?? 0, e.hitPointWorld[2] ?? 0]
                    : null,
                hitDistance: e.hasHit && e.distance !== undefined
                    ? e.distance
                    : rayLength,
                hitNormal: e.hasHit && e.hitNormalWorld
                    ? [e.hitNormalWorld[0] ?? 0, e.hitNormalWorld[1] ?? 0, e.hitNormalWorld[2] ?? 0]
                    : null,
                rayIndex,
            }
            onResult(result)
        },
        // IMPORTANT: Include from and to in deps so hook re-runs when they change
        [from[0], from[1], from[2], to[0], to[1], to[2]]
    )
    return null
}

// Single ray line component with mutable geometry
function RayLine({ lineRef, color }: { lineRef: (el: ThreeLine | null) => void, color: string }) {
    const geometry = useMemo(() => {
        const geom = new BufferGeometry()
        const positions = new Float32Array([0, 0, 0, 0, 0, 1])
        geom.setAttribute('position', new BufferAttribute(positions, 3))
        return geom
    }, [])

    return (
        <threeLine ref={lineRef} geometry={geometry}>
            <lineBasicMaterial color={color} linewidth={2} />
        </threeLine>
    )
}

export function CarRays({ chassisRef, enabled = true, onProbe }: CarRaysProps) {
    const raysRef = useRef<Object3D>(null)
    const lineRefs = useRef<(ThreeLine | null)[]>([])

    // State for ray positions - updating this will trigger RaySensor re-renders with new deps
    const [rayPositions, setRayPositions] = useState<RayData[]>(
        sensorPositions.map(() => ({
            from: [0, 0, 0] as [number, number, number],
            to: [0, 0, rayLength] as [number, number, number],
        }))
    )

    // State for results and hit distances (for visual feedback)
    const [hitDistances, setHitDistances] = useState<number[]>(Array(sensorPositions.length).fill(rayLength))
    const resultsRef = useRef<RayResult[]>(Array(sensorPositions.length).fill(null).map((_, i) => ({
        hasHit: false,
        hitPoint: null,
        hitDistance: rayLength,
        hitNormal: null,
        rayIndex: i,
    })))

    // Handle ray result callback
    const handleRayResult = useCallback((result: RayResult) => {
        resultsRef.current[result.rayIndex] = result

        // Update hit distance for visual feedback
        setHitDistances(prev => {
            const newDistances = [...prev]
            newDistances[result.rayIndex] = result.hitDistance
            return newDistances
        })

        // Call onProbe with all results
        if (onProbe) {
            onProbe([...resultsRef.current])
        }
    }, [onProbe])

    // Compute colors based on hit distance
    const rayColors = useMemo(() => {
        return hitDistances.map(hitDistance => {
            const normalizedDist = Math.min(hitDistance / rayLength, 1)
            // Interpolate from red (close) to green (far)
            const r = Math.floor(255 * (1 - normalizedDist))
            const g = Math.floor(255 * normalizedDist)
            return `rgb(${r}, ${g}, 0)`
        })
    }, [hitDistances])

    // Update counter for throttling state updates
    const frameCountRef = useRef(0)

    useFrame(() => {
        if (!enabled || !chassisRef.current) return

        const chassisPosition = new Vector3()
        const chassisQuaternion = chassisRef.current.quaternion.clone()
        chassisRef.current.getWorldPosition(chassisPosition)
        chassisRef.current.getWorldQuaternion(chassisQuaternion)

        const newRayPositions: RayData[] = []

        sensorPositions.forEach((sensor, i) => {
            const line = lineRefs.current[i]

            // Transform sensor offset to world space
            const offset = new Vector3(...sensor.offset as [number, number, number])
            offset.applyQuaternion(chassisQuaternion)
            const start = chassisPosition.clone().add(offset)

            // Transform direction to world space
            const dir = new Vector3(...sensor.direction as [number, number, number]).normalize()
            dir.applyQuaternion(chassisQuaternion)

            // Full length end for raycasting
            const rayEnd = start.clone().add(dir.clone().multiplyScalar(rayLength))

            newRayPositions.push({
                from: start.toArray() as [number, number, number],
                to: rayEnd.toArray() as [number, number, number],
            })

            // Get hit distance for visual line
            const hitDistance = hitDistances[i] ?? rayLength
            const visualEnd = start.clone().add(dir.clone().multiplyScalar(hitDistance))

            // Update line geometry if available - shows actual hit position
            if (line) {
                const positions = line.geometry.attributes.position
                if (positions) {
                    positions.setXYZ(0, start.x, start.y, start.z)
                    positions.setXYZ(1, visualEnd.x, visualEnd.y, visualEnd.z)
                    positions.needsUpdate = true
                }
            }
        })

        // Throttle state updates to every 3 frames to reduce re-renders
        frameCountRef.current++
        if (frameCountRef.current >= 1) {
            frameCountRef.current = 0
            setRayPositions(newRayPositions)
        }
    })

    if (!enabled) return null

    return (
        <group ref={raysRef}>
            {sensorPositions.map((_, i) => (
                <RayLine
                    key={`line-${i}`}
                    lineRef={(el) => { lineRefs.current[i] = el }}
                    color={rayColors[i] ?? "red"}
                />
            ))}
            {rayPositions.map((ray, i) => (
                <RaySensor
                    key={`sensor-${i}`}
                    rayIndex={i}
                    from={ray.from}
                    to={ray.to}
                    onResult={handleRayResult}
                />
            ))}
        </group>
    )
}

export default CarRays

import { useRaycastClosest } from '@react-three/cannon'
import { extend, type ThreeElement, useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react'
import { BufferAttribute, BufferGeometry, Line as ThreeLine, LineBasicMaterial, Object3D, Vector3 } from 'three'

extend({ ThreeLine })

declare module '@react-three/fiber' {
    interface ThreeElements {
        threeLine: ThreeElement<typeof ThreeLine>
    }
}

// Sensor configuration for raycasting
const rayLength = 10

// Sensor positions relative to the chassis
// Each sensor has an offset from the chassis center and a direction
// We use the same angles as the 2D car: [-70, -35, 0, 35, 70]
// All sensors start from the same front-center position to match 2D logic
const frontCenter: [number, number, number] = [0, 0.3, 0];
const sensorPositions = [
    { offset: frontCenter, direction: [Math.sin(-70 * Math.PI / 180), 0, Math.cos(-70 * Math.PI / 180)] },
    { offset: frontCenter, direction: [Math.sin(-35 * Math.PI / 180), 0, Math.cos(-35 * Math.PI / 180)] },
    { offset: frontCenter, direction: [0, 0, 1] },
    { offset: frontCenter, direction: [Math.sin(35 * Math.PI / 180), 0, Math.cos(35 * Math.PI / 180)] },
    { offset: frontCenter, direction: [Math.sin(70 * Math.PI / 180), 0, Math.cos(70 * Math.PI / 180)] },
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

    // Refs for immediate hit data (no state re-renders)
    const hitDataRef = useRef<{ hasHit: boolean; distance: number }[]>(
        Array(sensorPositions.length).fill(null).map(() => ({ hasHit: false, distance: rayLength }))
    )
    const resultsRef = useRef<RayResult[]>(Array(sensorPositions.length).fill(null).map((_, i) => ({
        hasHit: false,
        hitPoint: null,
        hitDistance: rayLength,
        hitNormal: null,
        rayIndex: i,
    })))



    // Handle ray result callback - store directly in refs for immediate access
    const handleRayResult = useCallback((result: RayResult) => {
        resultsRef.current[result.rayIndex] = result

        // Store hit data in ref for immediate access in useFrame
        hitDataRef.current[result.rayIndex] = {
            hasHit: result.hasHit,
            distance: result.hitDistance
        }

        // Call onProbe with all results
        if (onProbe) {
            onProbe([...resultsRef.current])
        }
    }, [onProbe])

    // Compute colors directly from refs
    const getColorForRay = (i: number): string => {
        const data = hitDataRef.current[i]
        if (!data) return 'rgb(0, 200, 255)'

        // If no hit, return cyan
        if (!data.hasHit || data.distance >= rayLength) {
            return 'rgb(0, 200, 255)' // Cyan for no hit
        }

        // Interpolate from red (close) to yellow/green (far) for hits
        const normalizedDist = Math.min(data.distance / rayLength, 1)
        const r = Math.floor(255 * (1 - normalizedDist))
        const g = Math.floor(255 * normalizedDist)
        return `rgb(${r}, ${g}, 0)`
    }

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

            // Read directly from ref for immediate feedback
            const data = hitDataRef.current[i]
            const hasHit = data?.hasHit ?? false
            const hitDistance = data?.distance ?? rayLength

            // If no hit, show full ray length; otherwise show hit distance
            const visualLength = hasHit ? hitDistance : rayLength
            const visualEnd = start.clone().add(dir.clone().multiplyScalar(visualLength))

            // Update line color directly on the material
            if (line && line.material) {
                const color = getColorForRay(i)
                    ; (line.material as LineBasicMaterial).color.setStyle(color)
            }

            // Update line geometry if available
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
                    color={getColorForRay(i)}
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

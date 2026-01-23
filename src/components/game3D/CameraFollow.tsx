import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'

interface CameraFollowProps {
    /** Reference to the object to follow (chassis mesh) */
    targetRef: React.RefObject<THREE.Object3D | null>
    /** Offset from the target for the follow camera position (in local space) */
    offset?: [number, number, number]
    /** Lerp factor for smooth camera movement (0-1, lower = smoother) */
    lerpFactor?: number
    /** Enable/disable camera follow */
    enabled?: boolean
}

/**
 * CameraFollow component that makes the camera smoothly follow a target object.
 * Based on the pattern: camera.position.lerp(followCam.getWorldPosition(), lerpFactor)
 */
export function CameraFollow({
    targetRef,
    offset = [0, 5, -10], // Default: behind and above the vehicle
    lerpFactor = 0.05,
    enabled = true,
}: CameraFollowProps) {
    const { camera } = useThree()

    // Create a virtual "follow camera" object that will be positioned relative to the target
    const followCamRef = useRef<THREE.Object3D>(new THREE.Object3D())

    // Temp vectors to avoid garbage collection
    const targetPosition = useRef(new THREE.Vector3())
    const followCamWorldPos = useRef(new THREE.Vector3())
    const lookAtPos = useRef(new THREE.Vector3())

    useFrame(() => {
        if (!enabled || !targetRef.current) return

        const target = targetRef.current

        // Get the target's world position for lookAt
        target.getWorldPosition(targetPosition.current)

        // Calculate follow camera position in world space
        // The offset is applied in the target's local space, then converted to world space
        followCamRef.current.position.set(...offset)

        // Attach the follow cam to the target temporarily to get world position
        // This makes the offset relative to the target's orientation
        const parent = followCamRef.current.parent
        target.add(followCamRef.current)
        followCamRef.current.getWorldPosition(followCamWorldPos.current)

        // Remove from target (we don't want it permanently attached)
        if (parent) {
            parent.add(followCamRef.current)
        } else {
            target.remove(followCamRef.current)
        }

        // Smoothly interpolate camera position towards the follow cam position
        camera.position.lerp(followCamWorldPos.current, lerpFactor)

        // Make camera look at the target
        camera.lookAt(targetPosition.current)
    })

    return null // This component only handles camera logic, no visual output
}

export default CameraFollow

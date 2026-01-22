import type { BoxProps, WheelInfoOptions } from '@react-three/cannon'
import { useBox, useRaycastVehicle } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh } from 'three'

import { CarRays, type RayResult } from './CarRays'
import { CameraFollow } from './CameraFollow'
import { useControls } from '../../hooks/use-controls'
import { Wheel } from './models/Wheel'
// import { useNeuralNetwork } from '../hooks/useNeuralNetwork'
import { TaxiChassis } from './models/TaxiChassis'
import useNeuralNetwork from '@/hooks/useNeuralNetwork'

export type VehicleProps = Required<Pick<BoxProps, 'angularVelocity' | 'position' | 'rotation'>> & {
  back?: number
  force?: number
  front?: number
  height?: number
  maxBrake?: number
  radius?: number
  steer?: number
  width?: number
  enableRays?: boolean
  networkIndex?: number
}

function Vehicle({
  angularVelocity,
  back = -1.15,
  force = 1500,
  front = 1.3,
  height = -0.04,
  maxBrake = 50,
  position,
  radius = 0.7,
  rotation,
  steer = 0.5,
  width = 1.2,
  enableRays = true,
  networkIndex = 0,
}: VehicleProps) {
  const wheels = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const chassisGroup = useRef<Group>(null)

  const controls = useControls()

  // Load neural network for client-side inference (no API calls per frame)
  const { predict, isReady: networkReady } = useNeuralNetwork(networkIndex)

  // Store latest ray results for neural network input
  const latestRayResultsRef = useRef<RayResult[]>([])

  // Autonomous mode toggle (press 'N' to switch)
  const autonomousModeRef = useRef(false)
  const lastAutonomousKeyRef = useRef(false)

  // Store neural network outputs for use in useFrame when in autonomous mode
  const nnOutputsRef = useRef<number[] | null>(null)

  // Handle ray probe results - just store them, prediction happens in useFrame
  const handleProbeResults = (results: RayResult[]) => {
    latestRayResultsRef.current = results
  }

  const wheelInfo: WheelInfoOptions = {
    axleLocal: [-1, 0, 0], // This is inverted for asymmetrical wheel models (left v. right sided)
    customSlidingRotationalSpeed: -30,
    dampingCompression: 4.4,
    dampingRelaxation: 10,
    directionLocal: [0, -1, 0], // set to same as Physics Gravity
    frictionSlip: 2,
    maxSuspensionForce: 1e4,
    maxSuspensionTravel: 0.3,
    radius,
    suspensionRestLength: 0.3,
    suspensionStiffness: 30,
    useCustomSlidingRotationalSpeed: true,
  }

  const wheelInfo1: WheelInfoOptions = {
    ...wheelInfo,
    chassisConnectionPointLocal: [-width / 2, height, front],
    isFrontWheel: true,
  }
  const wheelInfo2: WheelInfoOptions = {
    ...wheelInfo,
    chassisConnectionPointLocal: [width / 2, height, front],
    isFrontWheel: true,
  }
  const wheelInfo3: WheelInfoOptions = {
    ...wheelInfo,
    chassisConnectionPointLocal: [-width / 2, height, back],
    isFrontWheel: false,
  }
  const wheelInfo4: WheelInfoOptions = {
    ...wheelInfo,
    chassisConnectionPointLocal: [width / 2, height, back],
    isFrontWheel: false,
  }

  const [chassisBody, chassisApi] = useBox(
    () => ({
      allowSleep: false,
      angularVelocity,
      args: [1.7, 1, 4],
      mass: 500,
      onCollide: (e) => console.log('bonk', e.body.userData),
      position,
      rotation,
    }),
    useRef<Mesh>(null),
  )

  const [vehicle, vehicleApi] = useRaycastVehicle(
    () => ({
      chassisBody,
      wheelInfos: [wheelInfo1, wheelInfo2, wheelInfo3, wheelInfo4],
      wheels,
    }),
    useRef<Group>(null),
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // useEffect(() => vehicleApi.sliding.subscribe((v) => console.log('sliding', v)), [])

  useFrame(() => {
    const { backward, brake, forward, left, reset, right, autonomous } = controls.current

    // Toggle autonomous mode on 'N' key press (edge detection)
    if (autonomous && !lastAutonomousKeyRef.current) {
      autonomousModeRef.current = !autonomousModeRef.current
      console.log(`🚗 Mode: ${autonomousModeRef.current ? 'AUTONOMOUS (Neural Network)' : 'MANUAL (Keyboard)'}`)
    }
    lastAutonomousKeyRef.current = autonomous

    if (autonomousModeRef.current) {
      // AUTONOMOUS MODE: Run neural network prediction every frame

      if (networkReady) {
        // Get ray distances from latest results, default to max ray length (5) if no results
        const defaultRayLength = 5
        const rayDistances = latestRayResultsRef.current.length > 0
          ? latestRayResultsRef.current.map(r => r.hitDistance)
          : [defaultRayLength, defaultRayLength, defaultRayLength, defaultRayLength, defaultRayLength]

        // Run prediction every frame
        const outputs = predict(rayDistances)

        if (outputs) {
          nnOutputsRef.current = outputs

          // Apply steering to FRONT wheels (indices 0 and 1)
          vehicleApi.setSteeringValue(outputs[0] ?? 0, 0)
          vehicleApi.setSteeringValue(outputs[0] ?? 0, 1)

          // Apply engine force to BACK wheels (indices 2 and 3)
          // NOTE: Negative force = forward, positive force = backward
          const engineForce = (outputs[1] ?? 0) * -1500
          vehicleApi.applyEngineForce(engineForce, 2)
          vehicleApi.applyEngineForce(engineForce, 3)
        } else {
          // No outputs from neural network - use default values (no steering, move forward)
          vehicleApi.setSteeringValue(0, 0)
          vehicleApi.setSteeringValue(0, 1)
          vehicleApi.applyEngineForce(-1500, 2)
          vehicleApi.applyEngineForce(-1500, 3)
        }

      }

      // Still allow braking in autonomous mode
      for (let b = 2; b < 4; b++) {
        vehicleApi.setBrake(brake ? maxBrake : 0, b)
      }
    } else {
      // MANUAL MODE: Use keyboard controls
      for (let e = 2; e < 4; e++) {
        vehicleApi.applyEngineForce(forward || backward ? force * (forward && !backward ? -1 : 1) : 0, e)
      }

      for (let s = 0; s < 2; s++) {
        vehicleApi.setSteeringValue(left || right ? steer * (left && !right ? 1 : -1) : 0, s)
      }

      for (let b = 2; b < 4; b++) {
        vehicleApi.setBrake(brake ? maxBrake : 0, b)
      }
    }

    if (reset) {
      chassisApi.position.set(...position)
      chassisApi.velocity.set(0, 0, 0)
      chassisApi.angularVelocity.set(...angularVelocity)
      chassisApi.rotation.set(...rotation)
    }
  })

  return (
    <group ref={vehicle} position={[0, -0.3, 0]}>
      <group ref={chassisGroup}>
        <TaxiChassis ref={chassisBody} />
        <CarRays
          chassisRef={chassisBody}
          enabled={enableRays}
          onProbe={handleProbeResults}
        />
      </group>
      <Wheel ref={wheels[0]} radius={radius} leftSide meshOffset={[-0.2, 0, 0]} />
      <Wheel ref={wheels[1]} radius={radius} meshOffset={[0.2, 0, 0]} />
      <Wheel ref={wheels[2]} radius={radius} leftSide meshOffset={[0.2, 0, 0]} />
      <Wheel ref={wheels[3]} radius={radius} meshOffset={[-0.2, 0, 0]} />
    </group>
  )
}

export default Vehicle


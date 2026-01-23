import type { BoxProps, WheelInfoOptions } from '@react-three/cannon'
import { useBox, useRaycastVehicle } from '@react-three/cannon'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
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
  onProgress?: (speed: number) => void
  onGoalReached?: (stats: { modelHash: string; nonce: string }) => void
  customModel?: any
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
  onProgress,
  onGoalReached,
  customModel,
}: VehicleProps) {
  const wheels = [useRef<Group>(null), useRef<Group>(null), useRef<Group>(null), useRef<Group>(null)]
  const chassisGroup = useRef<Group>(null)

  const controls = useControls()

  // Load neural network for client-side inference (no API calls per frame)
  const { predict, isReady: networkReady } = useNeuralNetwork(networkIndex, customModel)

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

  // Tracking state
  const velocityRef = useRef([0, 0, 0])
  const lastCheckpointRef = useRef(0)

  // Subscribe to velocity
  useEffect(() => {
    return chassisApi.velocity.subscribe((v) => (velocityRef.current = v))
  }, [chassisApi.velocity])

  useFrame(() => {
    const { backward, brake, forward, left, reset, right, autonomous } = controls.current

    // Calculate speed in KM/H (physics units are m/s)
    const speedMs = Math.sqrt(
      velocityRef.current[0] ** 2 +
      velocityRef.current[1] ** 2 +
      velocityRef.current[2] ** 2
    )
    const speedKmh = speedMs * 3.6

    // Notify progress
    onProgress?.(speedKmh)

    // Toggle autonomous mode on 'N' key press (edge detection)
    if (autonomous && !lastAutonomousKeyRef.current) {
      autonomousModeRef.current = !autonomousModeRef.current
      console.log(`🚗 Mode: ${autonomousModeRef.current ? 'AUTONOMOUS (Neural Network)' : 'MANUAL (Keyboard)'}`)
    }
    lastAutonomousKeyRef.current = autonomous

    if (autonomousModeRef.current) {
      // AUTONOMOUS MODE: Run neural network prediction every frame

      if (networkReady) {
        // Get ray distances from latest results, default to max ray length (20) if no results
        const defaultRayLength = 7
        const rawDistances = latestRayResultsRef.current.length > 0
          ? latestRayResultsRef.current.map(r => r.hitDistance)
          : Array(5).fill(defaultRayLength)

        // Normalize inputs to [0, 1] range to match 2D training environment
        const rayDistances = rawDistances.map(d => d / defaultRayLength)

        // Run prediction every frame
        const outputs = predict(rayDistances)

        if (outputs) {
          nnOutputsRef.current = outputs

          // Neural Network Output Mapping (matching Car.ts):
          // outputs[0] -> Acceleration
          // outputs[1] -> Steering
          // outputs[2] -> Brake

          // Apply steering to FRONT wheels (indices 0 and 1)
          // Normalize steering output (outputs[1] is in [-1, 1]) by multiplying with steer factor
          // Invert steering: in 2D, positive = turn right; in 3D physics, positive = turn left
          const steeringValue = -(outputs[0] ?? 0) * steer
          vehicleApi.setSteeringValue(steeringValue, 0)
          vehicleApi.setSteeringValue(steeringValue, 1)

          // Apply engine force to BACK wheels (indices 2 and 3)
          // match 2D logic: accelerate if outputs[0] > 0
          const shouldAccelerate = (outputs[1] ?? 0) > 0
          const engineForce = shouldAccelerate ? -force : 0
          vehicleApi.applyEngineForce(engineForce, 2)
          vehicleApi.applyEngineForce(engineForce, 3)

          // Apply braking logic: match 2D logic if outputs[2] > 0.5
          const shouldBrake = (outputs[2] ?? 0) > 0.5
          for (let b = 2; b < 4; b++) {
            vehicleApi.setBrake(shouldBrake ? maxBrake : 0, b)
          }
        } else {
          // No outputs from neural network - fallback to moving forward
          vehicleApi.setSteeringValue(0, 0)
          vehicleApi.setSteeringValue(0, 1)
          vehicleApi.applyEngineForce(-force, 2)
          vehicleApi.applyEngineForce(-force, 3)
          for (let b = 2; b < 4; b++) {
            vehicleApi.setBrake(0, b)
          }
        }
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
      lastCheckpointRef.current = 0
    }
  })

  return (
    <group ref={vehicle}>
      <CameraFollow
              targetRef={chassisBody}
              offset={[0, 5, -10]}
              lerpFactor={0.05}
              enabled={true}
            />
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
      <Wheel ref={wheels[2]} radius={radius} leftSide meshOffset={[-0.2, 0, 0]} />
      <Wheel ref={wheels[3]} radius={radius} meshOffset={[0.2, 0, 0]} />
    </group>
  )
}

export default Vehicle


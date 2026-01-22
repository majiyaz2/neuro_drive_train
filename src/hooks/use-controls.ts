import type { MutableRefObject } from 'react'
import { useEffect, useRef } from 'react'

function useKeyControls(
  { current }: MutableRefObject<Record<GameControl, boolean>>,
  map: Record<KeyCode, GameControl>,
) {
  useEffect(() => {
    const handleKeydown = ({ key }: KeyboardEvent) => {
      if (!isKeyCode(key)) return
      current[map[key]] = true
    }
    window.addEventListener('keydown', handleKeydown)
    const handleKeyup = ({ key }: KeyboardEvent) => {
      if (!isKeyCode(key)) return
      current[map[key]] = false
    }
    window.addEventListener('keyup', handleKeyup)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      window.removeEventListener('keyup', handleKeyup)
    }
  }, [current, map])
}

const keyControlMap = {
  ' ': 'brake',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'forward',
  a: 'left',
  d: 'right',
  r: 'reset',
  s: 'backward',
  w: 'forward',
  n: 'autonomous',  // Toggle neural network control
} as const

type KeyCode = keyof typeof keyControlMap
type GameControl = typeof keyControlMap[KeyCode]

const keyCodes = Object.keys(keyControlMap) as KeyCode[]
const isKeyCode = (v: unknown): v is KeyCode => keyCodes.includes(v as KeyCode)

export function useControls() {
  const controls = useRef<Record<GameControl, boolean>>({
    backward: false,
    brake: false,
    forward: false,
    left: false,
    reset: false,
    right: false,
    autonomous: false,
  })

  useKeyControls(controls, keyControlMap)

  return controls
}

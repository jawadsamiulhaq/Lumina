import { useEffect, useState } from 'react'
import { animate } from 'framer-motion'

/** Animated number that counts up to `value` on mount / change. */
export function CountUp({ value, format }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value])

  return <>{format ? format(display) : Math.round(display).toLocaleString()}</>
}

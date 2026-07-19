import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { easeOut } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Remaining = { days: number; hours: number; minutes: number; seconds: number; total: number }

function getRemaining(target: number): Remaining {
  const total = Math.max(0, target - Date.now())
  const s = Math.floor(total / 1000)
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    total,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Live countdown to `endsAt`. Ticks every second and animates each digit group
 * with a vertical "flip". Calls `onExpire` once the timer reaches zero.
 */
export function Countdown({
  endsAt,
  onExpire,
  variant = 'lg',
  tone = 'onDark',
  className,
}: {
  endsAt: string
  onExpire?: () => void
  variant?: 'lg' | 'sm'
  /** 'onDark' = white tiles for dark backgrounds; 'onLight' = ink tiles for white cards. */
  tone?: 'onDark' | 'onLight'
  className?: string
}) {
  const target = new Date(endsAt).getTime()
  const [remaining, setRemaining] = useState(() => getRemaining(target))

  // Keep the latest onExpire without re-subscribing the interval.
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRemaining(target)
      setRemaining(r)
      if (r.total <= 0) {
        clearInterval(id)
        onExpireRef.current?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  const units = [
    { label: 'Days', value: remaining.days },
    { label: 'Hours', value: remaining.hours },
    { label: 'Mins', value: remaining.minutes },
    { label: 'Secs', value: remaining.seconds },
  ]

  const big = variant === 'lg'
  const dark = tone === 'onDark'
  const tile = dark
    ? 'bg-white/15 text-white ring-white/20 backdrop-blur-sm'
    : 'bg-ink-100 text-ink-900 ring-ink-200'
  const labelCls = dark ? 'text-white/70' : 'text-ink-400'
  const sep = dark ? 'text-white/40' : 'text-ink-300'

  return (
    <div className={cn('flex items-stretch', big ? 'gap-2 sm:gap-3' : 'gap-1.5', className)}>
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'relative overflow-hidden rounded-xl text-center font-black tabular-nums ring-1',
                tile,
                big ? 'h-14 w-14 text-2xl sm:h-16 sm:w-16 sm:text-3xl' : 'h-9 w-9 text-base',
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={u.value}
                  initial={{ y: '-110%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '110%', opacity: 0 }}
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {pad(u.value)}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className={cn('mt-1 font-semibold uppercase tracking-wide', labelCls, big ? 'text-[10px] sm:text-xs' : 'text-[9px]')}>
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && big && (
            <span className={cn('mx-0.5 self-start pt-3 text-2xl font-black sm:text-3xl', sep)}>:</span>
          )}
        </div>
      ))}
    </div>
  )
}

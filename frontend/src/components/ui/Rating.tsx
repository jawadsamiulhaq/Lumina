import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Rating({
  value,
  count,
  size = 16,
  showCount = true,
}: {
  value: number
  count?: number
  size?: number
  showCount?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex" aria-label={`Rated ${value} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(value)
          return (
            <Star
              key={i}
              style={{ width: size, height: size }}
              className={cn(filled ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200')}
            />
          )
        })}
      </div>
      {showCount && (
        <span className="text-xs text-ink-500">
          {value > 0 ? value.toFixed(1) : 'No reviews'}
          {count !== undefined && count > 0 ? ` (${count})` : ''}
        </span>
      )}
    </div>
  )
}

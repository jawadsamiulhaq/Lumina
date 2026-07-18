import type { ComponentType } from 'react'
import { LayoutList, Clock, CreditCard, Truck, PackageCheck, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAdminOrderStats } from '@/hooks/queries'
import type { OrderStatus, OrderStatusCounts } from '@/types/api'
import { cn } from '@/lib/utils'
import { staggerContainer, cardItem } from '@/lib/motion'

type Filter = OrderStatus | 'All'

type Card = {
  key: Filter
  label: string
  countOf: (s: OrderStatusCounts) => number
  icon: ComponentType<{ className?: string }>
  /** classes for the icon chip when this card is shown */
  chip: string
  /** ring + border color when this card is the active filter */
  active: string
}

const CARDS: Card[] = [
  { key: 'All', label: 'All orders', countOf: (s) => s.total, icon: LayoutList, chip: 'bg-ink-100 text-ink-600', active: 'border-ink-300 ring-ink-200' },
  { key: 'Pending', label: 'Pending', countOf: (s) => s.pending, icon: Clock, chip: 'bg-amber-50 text-amber-600', active: 'border-amber-300 ring-amber-100' },
  { key: 'Paid', label: 'Paid', countOf: (s) => s.paid, icon: CreditCard, chip: 'bg-brand-50 text-brand-700', active: 'border-brand-300 ring-brand-100' },
  { key: 'Shipped', label: 'Shipped', countOf: (s) => s.shipped, icon: Truck, chip: 'bg-indigo-50 text-indigo-600', active: 'border-indigo-300 ring-indigo-100' },
  { key: 'Delivered', label: 'Delivered', countOf: (s) => s.delivered, icon: PackageCheck, chip: 'bg-emerald-50 text-emerald-600', active: 'border-emerald-300 ring-emerald-100' },
  { key: 'Cancelled', label: 'Cancelled', countOf: (s) => s.cancelled, icon: XCircle, chip: 'bg-red-50 text-accent-500', active: 'border-red-300 ring-red-100' },
]

type Props = {
  selected: Filter
  onSelect: (status: Filter) => void
  enabled?: boolean
}

/**
 * A row of stat cards showing how many orders sit in each status. Clicking a
 * card filters the orders list to that status; the active card is highlighted.
 */
export function OrderStatusStats({ selected, onSelect, enabled = true }: Props) {
  const { data, isLoading, isError } = useAdminOrderStats(enabled)

  if (!enabled || isError) return null

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
    >
      {CARDS.map((c) => {
        const isActive = selected === c.key
        const Icon = c.icon
        return (
          <motion.button
            key={c.key}
            variants={cardItem}
            type="button"
            onClick={() => onSelect(c.key)}
            aria-pressed={isActive}
            className={cn(
              'flex flex-col gap-3 rounded-2xl border bg-white p-4 text-left transition',
              isActive ? cn('ring-2', c.active) : 'border-ink-100 hover:border-ink-200 hover:shadow-sm',
            )}
          >
            <span className={cn('grid size-9 place-items-center rounded-xl', c.chip)}>
              <Icon className="size-5" />
            </span>
            <div>
              {isLoading || !data ? (
                <div className="h-7 w-10 animate-pulse rounded-md bg-ink-100" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-ink-900">{c.countOf(data)}</p>
              )}
              <p className="text-xs font-medium text-ink-500">{c.label}</p>
            </div>
          </motion.button>
        )
      })}
    </motion.div>
  )
}

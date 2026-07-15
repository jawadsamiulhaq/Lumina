import type { ComponentType } from 'react'
import { ShoppingBag, CreditCard, Truck, PackageCheck, Check, XCircle } from 'lucide-react'
import type { OrderStatus, OrderTimeline } from '@/types/api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

// ---- Single source of truth for how each status looks ----

type StatusMeta = { label: string; badge: string; dot: string }

const STATUS_META: Record<OrderStatus, StatusMeta> = {
  Pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  Paid: { label: 'Paid', badge: 'bg-brand-50 text-brand-700', dot: 'bg-brand-600' },
  Shipped: { label: 'Shipped', badge: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500' },
  Delivered: { label: 'Delivered', badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  Cancelled: { label: 'Cancelled', badge: 'bg-red-50 text-accent-500', dot: 'bg-accent-500' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', m.badge)}>
      <span className={cn('size-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

// ---- Progress timeline ----
// Completion is derived from the status RANK, not just from timestamps, so an order
// whose status was set directly (e.g. admin jumps Pending -> Delivered) still renders a
// coherent, filled progress bar even when intermediate timestamps are missing.

type HappyStatus = Exclude<OrderStatus, 'Cancelled'>

const RANK: Record<HappyStatus, number> = { Pending: 0, Paid: 1, Shipped: 2, Delivered: 3 }

const STEPS: { label: string; tsKey: keyof OrderTimeline; icon: ComponentType<{ className?: string }> }[] = [
  { label: 'Ordered', tsKey: 'createdAt', icon: ShoppingBag },
  { label: 'Paid', tsKey: 'paidAt', icon: CreditCard },
  { label: 'Shipped', tsKey: 'shippedAt', icon: Truck },
  { label: 'Delivered', tsKey: 'deliveredAt', icon: PackageCheck },
]

export function StatusTimeline({ status, timeline }: { status: OrderStatus; timeline: OrderTimeline }) {
  if (status === 'Cancelled') return <CancelledView timeline={timeline} />

  const current = RANK[status as HappyStatus]
  const steps = STEPS.map((s, rank) => ({
    ...s,
    done: rank <= current,
    active: rank === current,
    ts: timeline[s.tsKey],
  }))
  const progress = current / (STEPS.length - 1) // 0 → 1

  return (
    <>
      {/* Horizontal (tablet/desktop) */}
      <ol className="relative hidden items-start justify-between sm:flex">
        {/* connector track + fill; ends tuck under the first/last nodes (each column is 25% wide) */}
        <span className="absolute left-[12.5%] right-[12.5%] top-[18px] h-0.5 rounded-full bg-ink-100" aria-hidden />
        <span
          className="absolute left-[12.5%] top-[18px] h-0.5 rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `calc(${progress} * 75%)` }}
          aria-hidden
        />
        {steps.map((s) => (
          <li key={s.label} className="flex flex-1 flex-col items-center gap-2 text-center">
            <StepDot {...s} />
            <StepLabel {...s} />
          </li>
        ))}
      </ol>

      {/* Vertical (mobile) */}
      <ol className="relative flex flex-col gap-5 sm:hidden">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex items-start gap-3">
            {i < steps.length - 1 && (
              <span
                className={cn('absolute left-[17px] top-9 bottom-[-1.25rem] w-0.5 rounded-full', steps[i + 1].done ? 'bg-emerald-500' : 'bg-ink-100')}
                aria-hidden
              />
            )}
            <StepDot {...s} />
            <div className="pt-1">
              <StepLabel {...s} />
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}

type StepView = { label: string; icon: ComponentType<{ className?: string }>; done: boolean; active: boolean; ts: string | null }

function StepDot({ icon: Icon, done, active }: StepView) {
  return (
    <div
      className={cn(
        'relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 bg-white transition',
        done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-ink-200 text-ink-300',
        active && 'ring-4 ring-emerald-500/15',
      )}
    >
      {done && !active ? <Check className="size-4" /> : <Icon className="size-4" />}
    </div>
  )
}

function StepLabel({ label, done, active, ts }: StepView) {
  return (
    <div>
      <p className={cn('text-xs font-semibold', done ? 'text-ink-900' : 'text-ink-400')}>
        {label}
        {active && <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">• Current</span>}
      </p>
      {ts && <p className="mt-0.5 text-[11px] text-ink-400">{formatDateTime(ts)}</p>}
    </div>
  )
}

function CancelledView({ timeline }: { timeline: OrderTimeline }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent-500 text-white">
        <XCircle className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-accent-500">Order cancelled</p>
        <p className="mt-0.5 text-xs text-ink-500">
          {timeline.cancelledAt ? `Cancelled on ${formatDateTime(timeline.cancelledAt)}.` : 'This order has been cancelled.'}
          {timeline.paidAt && ' If payment was captured, a refund may apply.'}
        </p>
      </div>
    </div>
  )
}

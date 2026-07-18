import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DollarSign, ShoppingCart, Package, AlertTriangle, Receipt } from 'lucide-react'
import { Spinner, ErrorState } from '@/components/ui/States'
import { CountUp } from '@/components/ui/CountUp'
import { StatusBadge } from '@/components/order/OrderStatus'
import { useDashboard } from '@/hooks/queries'
import type { OrderListItem } from '@/types/api'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { staggerContainer, cardItem } from '@/lib/motion'

export function AdminOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  // Group recent orders into a per-day revenue series for the trend chart.
  const revenueSeries = useMemo(() => buildDailyRevenue(data?.recentOrders ?? []), [data?.recentOrders])

  if (isLoading) return <Spinner label="Loading dashboard…" />
  if (isError || !data) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />

  const avgOrderValue = data.paidOrderCount > 0 ? Math.round(data.totalRevenueInCents / data.paidOrderCount) : 0

  const stats = [
    { label: 'Revenue', value: data.totalRevenueInCents, icon: DollarSign, tone: 'text-emerald-500 bg-emerald-50', money: true },
    { label: 'Paid orders', value: data.paidOrderCount, icon: ShoppingCart, tone: 'text-brand-600 bg-brand-50' },
    { label: 'Avg order value', value: avgOrderValue, icon: Receipt, tone: 'text-indigo-500 bg-indigo-50', money: true },
    { label: 'Active products', value: data.productCount, icon: Package, tone: 'text-sky-500 bg-sky-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Overview</h1>
      <p className="mt-1 text-sm text-ink-500">Store performance at a glance.</p>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={cardItem} className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className={`grid size-10 place-items-center rounded-xl ${s.tone}`}>
              <s.icon className="size-5" />
            </div>
            <p className="mt-4 text-3xl font-bold text-ink-900">
              <CountUp value={s.value} format={s.money ? (n) => formatPrice(Math.round(n)) : undefined} />
            </p>
            <p className="mt-1 text-sm text-ink-500">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <RevenueChart series={revenueSeries} />
        <StatusBreakdown paid={data.paidOrderCount} pending={data.pendingOrderCount} total={data.totalOrderCount} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Recent orders */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">No orders yet.</p>
          ) : (
            <div className="divide-y divide-ink-100">
              {data.recentOrders.map((o) => (
                <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 transition hover:bg-ink-50">
                  <div>
                    <p className="text-sm font-medium text-ink-900">#{o.id} · {o.email}</p>
                    <p className="text-xs text-ink-400">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <span className="text-sm font-semibold text-ink-900">{formatPrice(o.totalInCents)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-ink-900">
            <AlertTriangle className="size-4 text-amber-500" /> Low stock alerts
            {data.lowStockCount > 0 && (
              <span className="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600">{data.lowStockCount}</span>
            )}
          </h2>
          {data.lowStockProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-400">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStockProducts.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5">
                  <span className="line-clamp-1 text-sm text-ink-700">{p.name}</span>
                  <span className={`text-sm font-bold ${p.stock === 0 ? 'text-accent-500' : 'text-amber-600'}`}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

/** Revenue over recent days — single-series bar chart (one hue, no legend needed). */
function RevenueChart({ series }: { series: { label: string; value: number }[] }) {
  const max = Math.max(1, ...series.map((d) => d.value))
  const totalRecent = series.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-semibold text-ink-900">Recent revenue</h2>
        <span className="text-sm text-ink-400">{formatPrice(totalRecent)} total</span>
      </div>
      <p className="mb-4 text-xs text-ink-400">Order value across the latest orders, grouped by day.</p>

      {series.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-400">No recent orders to chart.</p>
      ) : (
        <div className="flex h-44 items-end gap-2 border-b border-ink-100 pb-px">
          {series.map((d) => (
            <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
              {/* tooltip */}
              <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                <span className="block text-[11px] text-white/70">{d.label}</span>
                {formatPrice(d.value)}
              </div>
              <div
                className="w-full rounded-t bg-brand-500 transition-colors group-hover:bg-brand-600"
                style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      )}
      {series.length > 0 && (
        <div className="mt-2 flex gap-2">
          {series.map((d) => (
            <span key={d.label} className="flex-1 truncate text-center text-[11px] text-ink-400">{d.label}</span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Order status split — reserved status colors, each with a text label + count (never color alone). */
function StatusBreakdown({ paid, pending, total }: { paid: number; pending: number; total: number }) {
  const other = Math.max(0, total - paid - pending)
  const segments = [
    { label: 'Paid', value: paid, bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { label: 'Pending', value: pending, bar: 'bg-amber-400', dot: 'bg-amber-400' },
    { label: 'Fulfilled / other', value: other, bar: 'bg-ink-300', dot: 'bg-ink-300' },
  ]
  const sum = Math.max(1, paid + pending + other)

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-semibold text-ink-900">Orders by status</h2>
        <span className="text-sm text-ink-400">{total} total</span>
      </div>
      <p className="mb-4 text-xs text-ink-400">How every order breaks down.</p>

      {total === 0 ? (
        <p className="py-12 text-center text-sm text-ink-400">No orders yet.</p>
      ) : (
        <>
          <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {segments
              .filter((s) => s.value > 0)
              .map((s) => (
                <div key={s.label} className={s.bar} style={{ width: `${(s.value / sum) * 100}%` }} title={`${s.label}: ${s.value}`} />
              ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-sm">
                <span className={`size-2.5 shrink-0 rounded-full ${s.dot}`} />
                <span className="text-ink-600">{s.label}</span>
                <span className="ml-auto font-semibold text-ink-900">{s.value}</span>
                <span className="w-10 text-right text-xs text-ink-400">{Math.round((s.value / sum) * 100)}%</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function buildDailyRevenue(orders: OrderListItem[]): { label: string; value: number }[] {
  if (orders.length === 0) return []
  const byDay = new Map<string, { date: Date; value: number }>()
  for (const o of orders) {
    if (o.status === 'Cancelled') continue
    const d = new Date(o.createdAt)
    const key = d.toISOString().slice(0, 10)
    const existing = byDay.get(key)
    if (existing) existing.value += o.totalInCents
    else byDay.set(key, { date: d, value: o.totalInCents })
  }
  return [...byDay.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((b) => ({ label: b.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: b.value }))
}

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DollarSign, ShoppingCart, Package, AlertTriangle, Clock } from 'lucide-react'
import { Spinner, ErrorState } from '@/components/ui/States'
import { CountUp } from '@/components/ui/CountUp'
import { StatusBadge } from '@/components/order/OrderStatus'
import { useDashboard } from '@/hooks/queries'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { staggerContainer, cardItem } from '@/lib/motion'

export function AdminOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard()

  if (isLoading) return <Spinner label="Loading dashboard…" />
  if (isError || !data) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />

  const stats = [
    { label: 'Revenue', value: data.totalRevenueInCents, icon: DollarSign, tone: 'text-emerald-500 bg-emerald-50', money: true },
    { label: 'Paid orders', value: data.paidOrderCount, icon: ShoppingCart, tone: 'text-brand-600 bg-brand-50' },
    { label: 'Active products', value: data.productCount, icon: Package, tone: 'text-indigo-500 bg-indigo-50' },
    { label: 'Pending orders', value: data.pendingOrderCount, icon: Clock, tone: 'text-amber-500 bg-amber-50' },
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
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

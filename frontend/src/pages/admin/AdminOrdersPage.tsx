import { Fragment, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Spinner, ErrorState, EmptyState } from '@/components/ui/States'
import { StatusBadge } from '@/components/order/OrderStatus'
import { AdminOrderDetailInline } from '@/components/order/AdminOrderDetailInline'
import { useAdminOrders } from '@/hooks/queries'
import type { OrderStatus } from '@/types/api'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

const STATUSES: (OrderStatus | 'All')[] = ['All', 'Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']

export function AdminOrdersPage() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<OrderStatus | 'All'>('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const { data, isLoading, isError, error, refetch } = useAdminOrders(page, status === 'All' ? undefined : status)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Orders</h1>
          <p className="mt-1 text-sm text-ink-500">{data?.totalCount ?? 0} total</p>
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | 'All'); setPage(1); setExpandedId(null) }} className="w-44">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {isLoading ? (
          <Spinner label="Loading orders…" />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No orders" description="Orders will appear here once customers check out." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"><span className="sr-only">Expand</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((o) => {
                  const isOpen = expandedId === o.id
                  return (
                    <Fragment key={o.id}>
                      <tr
                        onClick={() => setExpandedId((cur) => (cur === o.id ? null : o.id))}
                        aria-expanded={isOpen}
                        className={cn('cursor-pointer', isOpen ? 'bg-ink-50' : 'hover:bg-ink-50')}
                      >
                        <td className="px-4 py-3 font-medium text-brand-600">#{o.id}</td>
                        <td className="px-4 py-3 text-ink-600">{o.email}</td>
                        <td className="px-4 py-3 text-ink-600">{formatDate(o.createdAt)}</td>
                        <td className="px-4 py-3 text-ink-600">{o.itemCount}</td>
                        <td className="px-4 py-3 font-medium text-ink-900">{formatPrice(o.totalInCents)}</td>
                        <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <ChevronDown className={cn('inline size-4 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-ink-50/60">
                          <td colSpan={7} className="px-4 pb-5 pt-1">
                            <AdminOrderDetailInline orderId={o.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="px-3 text-sm text-ink-500">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}

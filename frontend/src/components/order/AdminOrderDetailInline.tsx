import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Select } from '@/components/ui/Input'
import { Spinner, ErrorState } from '@/components/ui/States'
import { StatusTimeline } from '@/components/order/OrderStatus'
import { useAdminOrder } from '@/hooks/queries'
import { ordersApi } from '@/api/services'
import type { OrderStatus } from '@/types/api'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

const STATUSES: OrderStatus[] = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
const FALLBACK = 'https://placehold.co/200x200/eceef2/8591a6?text=—'

/** Full order details from the admin's perspective, rendered inline (inside an expanded table row). */
export function AdminOrderDetailInline({ orderId }: { orderId: number }) {
  const qc = useQueryClient()
  const { data: order, isLoading, isError, error, refetch } = useAdminOrder(orderId)

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success('Order status updated.')
      void qc.invalidateQueries({ queryKey: ['admin-order', orderId] })
      void qc.invalidateQueries({ queryKey: ['admin-orders'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  if (isLoading) return <div className="py-6"><Spinner label="Loading details…" /></div>
  if (isError || !order) return <div className="py-6"><ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">Customer: <span className="font-medium text-ink-900">{order.email}</span></p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-500">Change status</span>
          <Select
            value={order.status}
            onChange={(e) => mutation.mutate(e.target.value as OrderStatus)}
            disabled={mutation.isPending}
            className="w-40"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border border-ink-100 p-5">
        <StatusTimeline status={order.status} timeline={order.timeline} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-2xl border border-ink-100 p-5">
          <h3 className="mb-3 text-sm font-semibold text-ink-900">Items</h3>
          <div className="divide-y divide-ink-100">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 py-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                  <img src={item.imageUrl ?? FALLBACK} alt="" className="size-full object-cover" />
                </div>
                <div className="flex flex-1 justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{item.productName}</p>
                    <p className="mt-0.5 text-sm text-ink-500">{formatPrice(item.unitPriceInCents)} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-ink-900">{formatPrice(item.lineTotalInCents)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-ink-100 pt-3">
            <span className="font-bold text-ink-900">Total</span>
            <span className="text-lg font-bold text-ink-900">{formatPrice(order.totalInCents)}</span>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-ink-100 p-5">
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Shipping</h3>
          <address className="space-y-0.5 text-sm not-italic text-ink-600">
            <p className="font-medium text-ink-900">{order.shippingFullName}</p>
            <p>{order.shippingLine1}</p>
            {order.shippingLine2 && <p>{order.shippingLine2}</p>}
            <p>{order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ''} {order.shippingPostalCode}</p>
            <p>{order.shippingCountry}</p>
          </address>
        </div>
      </div>

      <Link to={`/admin/orders/${order.id}`} className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">
        Open full page →
      </Link>
    </div>
  )
}

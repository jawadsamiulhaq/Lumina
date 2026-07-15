import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Select } from '@/components/ui/Input'
import { Spinner, ErrorState } from '@/components/ui/States'
import { StatusBadge, StatusTimeline } from '@/components/order/OrderStatus'
import { useAdminOrder } from '@/hooks/queries'
import { ordersApi } from '@/api/services'
import type { OrderStatus } from '@/types/api'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

const STATUSES: OrderStatus[] = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled']
const FALLBACK = 'https://placehold.co/200x200/eceef2/8591a6?text=—'

export function AdminOrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
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

  if (isLoading) return <Spinner label="Loading order…" />
  if (isError || !order) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />

  return (
    <div>
      <Link to="/admin/orders" className="mb-5 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Order #{order.id}</h1>
          <p className="mt-1 text-sm text-ink-500">Placed {formatDate(order.createdAt)} · {order.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Select value={order.status} onChange={(e) => mutation.mutate(e.target.value as OrderStatus)} disabled={mutation.isPending} className="w-40">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6">
        <StatusTimeline status={order.status} timeline={order.timeline} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink-900">Items</h2>
          <div className="divide-y divide-ink-100">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 py-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                  <img src={item.imageUrl ?? FALLBACK} alt="" className="size-full object-cover" />
                </div>
                <div className="flex flex-1 justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{item.productName}</p>
                    <p className="text-sm text-ink-500">{formatPrice(item.unitPriceInCents)} × {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-ink-900">{formatPrice(item.lineTotalInCents)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-ink-100 pt-4">
            <span className="font-bold text-ink-900">Total</span>
            <span className="text-xl font-bold text-ink-900">{formatPrice(order.totalInCents)}</span>
          </div>
        </div>

        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-3 font-semibold text-ink-900">Shipping</h2>
          <address className="space-y-0.5 text-sm not-italic text-ink-600">
            <p className="font-medium text-ink-900">{order.shippingFullName}</p>
            <p>{order.shippingLine1}</p>
            {order.shippingLine2 && <p>{order.shippingLine2}</p>}
            <p>{order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ''} {order.shippingPostalCode}</p>
            <p>{order.shippingCountry}</p>
          </address>
        </div>
      </div>
    </div>
  )
}

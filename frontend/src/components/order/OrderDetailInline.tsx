import { Link } from 'react-router-dom'
import { Spinner, ErrorState } from '@/components/ui/States'
import { StatusTimeline } from '@/components/order/OrderStatus'
import { useMyOrder } from '@/hooks/queries'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'

const FALLBACK = 'https://placehold.co/200x200/eceef2/8591a6?text=—'

/** Full order details rendered inline (inside an expanded list row). */
export function OrderDetailInline({ orderId }: { orderId: number }) {
  const { data: order, isLoading, isError, error, refetch } = useMyOrder(orderId)

  if (isLoading) return <div className="py-6"><Spinner label="Loading details…" /></div>
  if (isError || !order) return <div className="py-6"><ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} /></div>

  return (
    <div className="space-y-6">
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
                    {item.productSlug ? (
                      <Link to={`/products/${item.productSlug}`} className="font-medium text-ink-900 hover:text-brand-600">{item.productName}</Link>
                    ) : (
                      <span className="font-medium text-ink-900">{item.productName}</span>
                    )}
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
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Shipping to</h3>
          <address className="space-y-0.5 text-sm not-italic text-ink-600">
            <p className="font-medium text-ink-900">{order.shippingFullName}</p>
            <p>{order.shippingLine1}</p>
            {order.shippingLine2 && <p>{order.shippingLine2}</p>}
            <p>{order.shippingCity}{order.shippingState ? `, ${order.shippingState}` : ''} {order.shippingPostalCode}</p>
            <p>{order.shippingCountry}</p>
            <p className="pt-2 text-ink-400">{order.email}</p>
          </address>
        </div>
      </div>

      <Link to={`/account/orders/${order.id}`} className="inline-flex text-sm font-medium text-brand-600 hover:text-brand-700">
        Open full page →
      </Link>
    </div>
  )
}

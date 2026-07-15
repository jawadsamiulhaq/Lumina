import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Spinner, ErrorState } from '@/components/ui/States'
import { StatusBadge, StatusTimeline } from '@/components/order/OrderStatus'
import { useMyOrder } from '@/hooks/queries'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'

const FALLBACK = 'https://placehold.co/200x200/eceef2/8591a6?text=—'

export function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const { data: order, isLoading, isError, error, refetch } = useMyOrder(orderId)

  if (isLoading) return <Container className="py-10"><Spinner label="Loading order…" /></Container>
  if (isError || !order) return <Container className="py-10"><ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} /></Container>

  return (
    <>
      <Seo title={`Order #${order.id}`} />
      <Container className="py-8">
        <Link to="/account/orders" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900">
          <ArrowLeft className="size-4" /> Back to orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">Order #{order.id}</h1>
            <p className="mt-1 text-sm text-ink-500">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-8 rounded-3xl border border-ink-100 p-6">
          <StatusTimeline status={order.status} timeline={order.timeline} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-ink-100 p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">Items</h2>
            <div className="divide-y divide-ink-100">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-4 py-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
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
            <div className="mt-4 flex justify-between border-t border-ink-100 pt-4">
              <span className="font-bold text-ink-900">Total</span>
              <span className="text-xl font-bold text-ink-900">{formatPrice(order.totalInCents)}</span>
            </div>
          </div>

          <div className="h-fit rounded-3xl border border-ink-100 p-6">
            <h2 className="mb-3 text-lg font-semibold text-ink-900">Shipping to</h2>
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
      </Container>
    </>
  )
}

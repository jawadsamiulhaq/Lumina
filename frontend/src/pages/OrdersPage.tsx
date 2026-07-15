import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState, ErrorState } from '@/components/ui/States'
import { StatusBadge } from '@/components/order/OrderStatus'
import { useMyOrders } from '@/hooks/queries'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { staggerContainer, cardItem } from '@/lib/motion'

export function OrdersPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useMyOrders(page)

  return (
    <>
      <Seo title="My orders" />
      <Container className="py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">My orders</h1>

        {isLoading ? (
          <Spinner label="Loading orders…" />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<Package className="size-7" />}
            title="No orders yet"
            description="When you place an order, it will show up here."
            action={<Link to="/products"><Button>Start shopping</Button></Link>}
          />
        ) : (
          <>
            <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
              {data.items.map((o) => (
                <motion.div key={o.id} variants={cardItem}>
                  <Link to={`/account/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 p-5 transition hover:border-ink-200 hover:shadow-sm">
                    <div>
                      <p className="font-semibold text-ink-900">Order #{o.id}</p>
                      <p className="text-sm text-ink-500">{formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={o.status} />
                      <span className="font-bold text-ink-900">{formatPrice(o.totalInCents)}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span className="px-3 text-sm text-ink-500">Page {page} of {data.totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </Container>
    </>
  )
}

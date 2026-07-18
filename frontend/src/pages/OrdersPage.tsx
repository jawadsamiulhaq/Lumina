import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Package, ChevronDown } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { Spinner, EmptyState, ErrorState } from '@/components/ui/States'
import { StatusBadge } from '@/components/order/OrderStatus'
import { OrderDetailInline } from '@/components/order/OrderDetailInline'
import { useMyOrders } from '@/hooks/queries'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { staggerContainer, cardItem } from '@/lib/motion'
import { cn } from '@/lib/utils'

export function OrdersPage() {
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<number | null>(null)
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
              {data.items.map((o) => {
                const isOpen = expandedId === o.id
                return (
                  <motion.div
                    key={o.id}
                    variants={cardItem}
                    className={cn('overflow-hidden rounded-2xl border transition', isOpen ? 'border-ink-200 shadow-sm' : 'border-ink-100 hover:border-ink-200')}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId((cur) => (cur === o.id ? null : o.id))}
                      aria-expanded={isOpen}
                      className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left"
                    >
                      <div>
                        <p className="font-semibold text-ink-900">Order #{o.id}</p>
                        <p className="text-sm text-ink-500">{formatDate(o.createdAt)} · {o.itemCount} item{o.itemCount === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <StatusBadge status={o.status} />
                        <span className="font-bold text-ink-900">{formatPrice(o.totalInCents)}</span>
                        <ChevronDown className={cn('size-5 text-ink-400 transition-transform', isOpen && 'rotate-180')} />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-ink-100 p-5">
                            <OrderDetailInline orderId={o.id} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
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

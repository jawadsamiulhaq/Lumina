import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Minus, Plus, ShoppingBag, ChevronRight } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { Rating } from '@/components/ui/Rating'
import { Field, TextArea } from '@/components/ui/Input'
import { Spinner, ErrorState } from '@/components/ui/States'
import { Skeleton } from '@/components/ui/Skeleton'
import { useProduct, useReviews, queryKeys } from '@/hooks/queries'
import { reviewsApi } from '@/api/services'
import { useAddToCart } from '@/hooks/useAddToCart'
import { useAuthStore } from '@/store/authStore'
import { formatPrice, formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'
import { cn } from '@/lib/utils'
import { optimizeImageUrl } from '@/lib/image'
import { Star } from 'lucide-react'

const FALLBACK = 'https://placehold.co/900x900/eceef2/8591a6?text=No+image'

export function ProductDetailPage() {
  const { slug = '' } = useParams()
  const { data: product, isLoading, isError, error, refetch } = useProduct(slug)
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null)
  // optionId -> selected valueId
  const [selectedValues, setSelectedValues] = useState<Record<number, number>>({})
  const addToCart = useAddToCart()

  if (isLoading) return <Container className="py-10"><Spinner label="Loading product…" /></Container>
  if (isError || !product) return <Container className="py-10"><ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} /></Container>

  const images = product.images.length ? product.images : [{ id: 0, url: FALLBACK, altText: product.name, sortOrder: 0, isPrimary: true }]
  const current = images[Math.min(activeImg, images.length - 1)]

  // ---- Variant resolution ----
  const hasVariants = product.hasVariants
  const activeVariants = product.variants.filter((v) => v.isActive)
  const selectedIds = product.options.map((o) => selectedValues[o.id]).filter((v): v is number => v != null)
  const allSelected = hasVariants && selectedIds.length === product.options.length
  const selectedVariant = allSelected
    ? activeVariants.find((v) => v.optionValueIds.length === selectedIds.length && selectedIds.every((id) => v.optionValueIds.includes(id)))
    : undefined

  const fromPrice = hasVariants && activeVariants.length ? Math.min(...activeVariants.map((v) => v.priceInCents)) : product.priceInCents
  const displayPrice = selectedVariant?.priceInCents ?? fromPrice
  const effectiveStock = hasVariants ? (selectedVariant?.stock ?? 0) : product.stock
  const allSoldOut = hasVariants ? activeVariants.every((v) => v.stock <= 0) : product.stock <= 0
  const canAdd = hasVariants ? Boolean(selectedVariant && selectedVariant.stock > 0) : !allSoldOut

  async function handleAdd() {
    if (!product) return
    if (hasVariants && !selectedVariant) { toast.info('Please choose an option first.'); return }
    if (!canAdd) return
    const rect = mainRef.current?.getBoundingClientRect() ?? null
    await addToCart(product.id, { quantity: qty, imageUrl: current.url, fromRect: rect, openDrawer: true, variantId: selectedVariant?.id ?? null })
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <>
      <Seo title={product.name} description={product.description.slice(0, 150)} image={current.url} />
      <Container className="py-8">
        <nav className="mb-5 flex items-center gap-1 text-sm text-ink-400">
          <Link to="/products" className="hover:text-ink-700">Shop</Link>
          <ChevronRight className="size-3.5" />
          <Link to={`/products?category=${product.categorySlug}`} className="hover:text-ink-700">{product.categoryName}</Link>
          <ChevronRight className="size-3.5" />
          <span className="truncate text-ink-600">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div
              ref={mainRef}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
              }}
              onMouseLeave={() => setZoom(null)}
              className="relative aspect-square overflow-hidden rounded-3xl border border-ink-100 bg-ink-50"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={current.id + '-' + activeImg}
                  src={optimizeImageUrl(current.url, 1000)}
                  alt={current.altText ?? product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%`, transform: 'scale(1.7)' } : undefined}
                  onError={(e) => { if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK }}
                  className="size-full object-cover transition-transform duration-200"
                />
              </AnimatePresence>
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={
                      'size-20 overflow-hidden rounded-xl border-2 transition ' +
                      (i === activeImg ? 'border-brand-500' : 'border-transparent hover:border-ink-200')
                    }
                  >
                    <img src={optimizeImageUrl(img.url, 160)} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-ink-400">{product.categoryName}</p>
            <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-ink-900">{product.name}</h1>
            <div className="mt-3"><Rating value={product.averageRating} count={product.reviewCount} /></div>
            <p className="mt-5 text-3xl font-bold text-ink-900">
              {hasVariants && !selectedVariant ? <>From {formatPrice(fromPrice)}</> : formatPrice(displayPrice)}
            </p>

            <div className="mt-3">
              {allSoldOut ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-accent-500">Out of stock</span>
              ) : hasVariants && !selectedVariant ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-sm font-medium text-ink-500">Choose an option</span>
              ) : effectiveStock <= 5 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">Only {effectiveStock} left</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">In stock</span>
              )}
            </div>

            {hasVariants && (
              <div className="mt-6 space-y-4">
                {product.options.map((opt) => (
                  <div key={opt.id}>
                    <p className="text-sm font-medium text-ink-700">{opt.name}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {opt.values.map((val) => {
                        const isSelected = selectedValues[opt.id] === val.id
                        return (
                          <button
                            key={val.id}
                            type="button"
                            onClick={() => {
                              setSelectedValues((s) => ({ ...s, [opt.id]: val.id }))
                              setQty(1)
                              // Switch the gallery to this value's linked image (e.g. a color swatch photo).
                              if (val.imageUrl) {
                                const idx = images.findIndex((img) => img.url === val.imageUrl)
                                if (idx !== -1) setActiveImg(idx)
                              }
                            }}
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                              isSelected ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-400',
                            )}
                          >
                            {val.imageUrl && (
                              <img src={val.imageUrl} alt="" className="size-5 rounded-full object-cover" />
                            )}
                            {val.value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                {allSelected && !selectedVariant && (
                  <p className="text-sm font-medium text-accent-500">This combination isn’t available.</p>
                )}
              </div>
            )}

            <p className="mt-6 leading-relaxed text-ink-600">{product.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-ink-200">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100">
                  <Minus className="size-4" />
                </button>
                <span className="w-10 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))} disabled={qty >= effectiveStock} className="grid size-11 place-items-center rounded-full text-ink-600 hover:bg-ink-100 disabled:opacity-30">
                  <Plus className="size-4" />
                </button>
              </div>
              <Button size="lg" onClick={handleAdd} disabled={!canAdd} className="min-w-52 gap-2">
                <AnimatePresence mode="wait" initial={false}>
                  {added ? (
                    <motion.span key="added" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <Check className="size-5" /> Added to cart
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <ShoppingBag className="size-5" /> Add to cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>

        <ReviewsSection slug={slug} />
      </Container>
    </>
  )
}

function ReviewsSection({ slug }: { slug: string }) {
  const { data: reviews, isLoading } = useReviews(slug)
  const status = useAuthStore((s) => s.status)
  const qc = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create(slug, { rating, comment }),
    onSuccess: () => {
      toast.success('Thanks for your review!')
      setComment('')
      void qc.invalidateQueries({ queryKey: queryKeys.reviews(slug) })
      void qc.invalidateQueries({ queryKey: queryKeys.product(slug) })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not submit review.')),
  })

  return (
    <section className="mt-16 border-t border-ink-100 pt-10">
      <h2 className="text-2xl font-bold text-ink-900">Customer reviews</h2>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          ) : reviews && reviews.length > 0 ? (
            reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-ink-100 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{r.userName}</p>
                  <span className="text-xs text-ink-400">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-1"><Rating value={r.rating} showCount={false} size={14} /></div>
                <p className="mt-2 text-sm text-ink-600">{r.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-500">No reviews yet. Be the first to review this product.</p>
          )}
        </div>

        {status === 'authenticated' && (
          <div className="h-fit rounded-2xl border border-ink-100 p-5">
            <h3 className="font-semibold text-ink-900">Write a review</h3>
            <p className="mt-1 text-xs text-ink-400">You can review products you’ve purchased.</p>
            <div className="mt-4 flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
                  <Star className={'size-6 ' + (i + 1 <= rating ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200')} />
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Field label="Your review">
                <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you think?" />
              </Field>
            </div>
            <Button className="mt-4 w-full" loading={mutation.isPending} disabled={!comment.trim()} onClick={() => mutation.mutate()}>
              Submit review
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

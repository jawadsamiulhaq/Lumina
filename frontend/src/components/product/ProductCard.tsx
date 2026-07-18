import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Plus } from 'lucide-react'
import type { ProductListItem } from '@/types/api'
import { formatPrice } from '@/lib/format'
import { cardItem } from '@/lib/motion'
import { Rating } from '@/components/ui/Rating'
import { useAddToCart } from '@/hooks/useAddToCart'
import { cn } from '@/lib/utils'
import { optimizeImageUrl, optimizedSrcSet } from '@/lib/image'

const FALLBACK = 'https://placehold.co/600x600/eceef2/8591a6?text=No+image'
// Rendered card width tops out around 280px in the 4-col desktop grid; 2x covers retina displays.
const CARD_IMAGE_WIDTH = 400

export function ProductCard({ product }: { product: ProductListItem }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [added, setAdded] = useState(false)
  const addToCart = useAddToCart()
  const soldOut = product.stock <= 0

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut) return
    const rect = imgRef.current?.getBoundingClientRect() ?? null
    await addToCart(product.id, { imageUrl: product.primaryImageUrl ?? FALLBACK, fromRect: rect })
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <motion.div variants={cardItem}>
      <Link to={`/products/${product.slug}`} className="group block">
        <motion.article
          whileHover={{ y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-ink-100 bg-white transition-shadow hover:shadow-[0_18px_40px_-18px_rgba(28,32,41,0.35)]"
        >
          <div className="relative aspect-square overflow-hidden bg-ink-50">
            <motion.img
              ref={imgRef}
              src={optimizeImageUrl(product.primaryImageUrl ?? FALLBACK, CARD_IMAGE_WIDTH)}
              srcSet={optimizedSrcSet(product.primaryImageUrl ?? FALLBACK, CARD_IMAGE_WIDTH)}
              sizes="(min-width: 1024px) 280px, (min-width: 768px) 30vw, 45vw"
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={(e) => { if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK }}
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
            />
            {product.isFeatured && (
              <span className="absolute left-3 top-3 rounded-full bg-ink-900/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                Featured
              </span>
            )}
            {soldOut && (
              <span className="absolute right-3 top-3 rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                Sold out
              </span>
            )}
            <button
              onClick={handleAdd}
              disabled={soldOut}
              aria-label="Add to cart"
              className={cn(
                'absolute bottom-3 right-3 grid size-11 place-items-center rounded-full text-white shadow-lg transition',
                'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
                'focus-visible:translate-y-0 focus-visible:opacity-100',
                added ? 'bg-emerald-500' : 'bg-brand-600 hover:bg-brand-700',
                soldOut && 'cursor-not-allowed opacity-40',
              )}
            >
              <motion.span key={added ? 'check' : 'plus'} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                {added ? <Check className="size-5" /> : <Plus className="size-5" />}
              </motion.span>
            </button>
          </div>

          <div className="space-y-1.5 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{product.categoryName}</p>
            <h3 className="line-clamp-1 font-semibold text-ink-900">{product.name}</h3>
            <Rating value={product.averageRating} count={product.reviewCount} size={14} />
            <p className="pt-1 text-lg font-bold text-ink-900">{formatPrice(product.priceInCents)}</p>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  )
}

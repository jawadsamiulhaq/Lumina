import { motion } from 'framer-motion'
import type { ProductListItem } from '@/types/api'
import { ProductCard } from './ProductCard'
import { staggerContainer } from '@/lib/motion'

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </motion.div>
  )
}

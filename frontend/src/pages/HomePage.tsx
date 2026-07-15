import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { useProducts, useCategories } from '@/hooks/queries'
import { fadeInUp, staggerContainer, easeOut } from '@/lib/motion'

const CATEGORY_IMAGES: Record<string, string> = {
  electronics: 'https://picsum.photos/seed/cat-electronics/600/500',
  apparel: 'https://picsum.photos/seed/cat-apparel/600/500',
  'home-kitchen': 'https://picsum.photos/seed/cat-home/600/500',
  'sports-outdoors': 'https://picsum.photos/seed/cat-sports/600/500',
}

export function HomePage() {
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 400], [0, 80])
  const { data: featured, isLoading } = useProducts({ featuredOnly: true, pageSize: 8 })
  const { data: categories } = useCategories()

  return (
    <>
      <Seo title="Modern products for everyday life" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <motion.div style={{ y: heroY }} className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-40 -top-40 size-[38rem] rounded-full bg-brand-600 blur-[120px]" />
          <div className="absolute -bottom-40 -right-20 size-[32rem] rounded-full bg-accent-500 blur-[130px]" />
        </motion.div>
        <Container className="relative py-24 lg:py-32">
          <motion.div initial="hidden" animate="show" variants={staggerContainer} className="max-w-2xl">
            <motion.p variants={fadeInUp} className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-brand-200">
              New season · Free shipping over $50
            </motion.p>
            <motion.h1 variants={fadeInUp} className="text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
              Design that moves
              <span className="block bg-gradient-to-r from-brand-300 to-accent-500 bg-clip-text text-transparent">
                with your life.
              </span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-5 max-w-lg text-lg text-ink-300">
              Premium electronics, apparel and home essentials — curated, beautifully made, and ready to ship.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap gap-3">
              <Link to="/products">
                <Button size="lg" className="gap-2">
                  Shop now <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/products?featured=true">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  View featured
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Trust bar */}
      <Container>
        <div className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-3">
          {[
            [Truck, 'Fast, free shipping', 'On all orders over $50'],
            [ShieldCheck, 'Secure checkout', 'Powered by Stripe'],
            [RotateCcw, '30-day returns', 'No questions asked'],
          ].map(([Icon, title, sub]) => {
            const I = Icon as typeof Truck
            return (
              <div key={title as string} className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4">
                <div className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <I className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">{title as string}</p>
                  <p className="text-xs text-ink-500">{sub as string}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Container>

      {/* Categories */}
      <Container className="py-10">
        <SectionHeading title="Shop by category" />
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {categories?.map((c) => (
            <motion.div key={c.id} variants={fadeInUp}>
              <Link
                to={`/products?category=${c.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-ink-100"
              >
                <img
                  src={CATEGORY_IMAGES[c.slug] ?? `https://picsum.photos/seed/${c.slug}/600/500`}
                  alt={c.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-lg font-bold text-white">{c.name}</p>
                  <p className="text-xs text-white/70">{c.productCount} products</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </Container>

      {/* Featured */}
      <Container className="py-10">
        <SectionHeading title="Featured products" action={<Link to="/products" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>} />
        {isLoading ? <ProductGridSkeleton /> : featured && featured.items.length > 0 ? <ProductGrid products={featured.items} /> : null}
      </Container>
    </>
  )
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="mb-6 flex items-end justify-between"
    >
      <h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      {action}
    </motion.div>
  )
}

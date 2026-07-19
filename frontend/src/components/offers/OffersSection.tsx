import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Container } from '@/components/Container'
import { OfferBanner } from './OfferBanner'
import { OfferCard } from './OfferCard'
import { useOffers } from '@/hooks/queries'
import { staggerContainer } from '@/lib/motion'

/**
 * Storefront offers block: the top active offer as a hero countdown banner,
 * plus any additional active offers as compact cards. Renders nothing when
 * there are no live offers, and drops offers whose countdown reaches zero.
 */
export function OffersSection() {
  const { data } = useOffers()
  const [expired, setExpired] = useState<Set<number>>(new Set())
  const markExpired = useCallback((id: number) => {
    setExpired((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const live = (data ?? []).filter((o) => !expired.has(o.id) && new Date(o.endsAt).getTime() > Date.now())
  if (live.length === 0) return null

  const [hero, ...rest] = live

  return (
    <Container className="py-8 sm:py-12">
      <OfferBanner offer={hero} onExpire={() => markExpired(hero.id)} />

      {rest.length > 0 && (
        <>
          <h2 className="mb-4 mt-10 text-lg font-bold tracking-tight text-ink-900">More offers</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {rest.map((o) => (
              <OfferCard key={o.id} offer={o} onExpire={() => markExpired(o.id)} />
            ))}
          </motion.div>
        </>
      )}
    </Container>
  )
}

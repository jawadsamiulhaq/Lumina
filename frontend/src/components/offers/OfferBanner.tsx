import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Countdown } from './Countdown'
import { fadeInUp } from '@/lib/motion'
import type { Offer } from '@/types/api'

export function OfferBanner({ offer, onExpire }: { offer: Offer; onExpire: () => void }) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="relative overflow-hidden rounded-3xl bg-ink-950 text-white shadow-lg"
    >
      {/* Background */}
      {offer.imageUrl ? (
        <>
          <img src={offer.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-950/80 to-ink-950/40" />
        </>
      ) : (
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-accent-600" />
          <div className="absolute -left-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-10 size-80 rounded-full bg-accent-500/30 blur-3xl" />
        </div>
      )}

      <div className="relative flex flex-col gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between lg:p-12">
        <div className="max-w-xl">
          {offer.discountLabel && (
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white shadow">
              {offer.discountLabel}
            </span>
          )}
          <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">{offer.title}</h2>
          {offer.subtitle && <p className="mt-3 max-w-lg text-base text-white/80 sm:text-lg">{offer.subtitle}</p>}
          <Link to={offer.ctaUrl} className="mt-7 inline-block">
            <Button size="lg" className="gap-2">
              {offer.ctaText} <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="shrink-0">
          <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-white/70">
            <Clock className="size-4" /> Hurry — ends in
          </p>
          <Countdown endsAt={offer.endsAt} onExpire={onExpire} variant="lg" />
        </div>
      </div>
    </motion.div>
  )
}

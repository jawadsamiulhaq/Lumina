import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Countdown } from './Countdown'
import { cardItem } from '@/lib/motion'
import type { Offer } from '@/types/api'

export function OfferCard({ offer, onExpire }: { offer: Offer; onExpire: () => void }) {
  return (
    <motion.div variants={cardItem} className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
      <div className="relative h-32 bg-gradient-to-br from-brand-600 to-accent-600">
        {offer.imageUrl && <img src={offer.imageUrl} alt="" className="absolute inset-0 size-full object-cover" />}
        {offer.discountLabel && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
            {offer.discountLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold text-ink-900">{offer.title}</h3>
        {offer.subtitle && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{offer.subtitle}</p>}
        <div className="mt-4">
          <Countdown endsAt={offer.endsAt} onExpire={onExpire} variant="sm" tone="onLight" />
        </div>
        <Link to={offer.ctaUrl} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
          {offer.ctaText} <ArrowRight className="size-4" />
        </Link>
      </div>
    </motion.div>
  )
}

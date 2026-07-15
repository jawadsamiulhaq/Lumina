import { AnimatePresence, motion } from 'framer-motion'
import { useFlyStore } from '@/store/flyStore'

/** Renders product images that arc from the "add to cart" button toward the cart icon. */
export function FlyToCartLayer() {
  const requests = useFlyStore((s) => s.requests)
  const getTarget = useFlyStore((s) => s.cartTarget)
  const done = useFlyStore((s) => s.done)

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      <AnimatePresence>
        {requests.map((req) => {
          const target = getTarget?.()
          const tx = target ? target.left + target.width / 2 - req.from.size / 2 : req.from.x
          const ty = target ? target.top + target.height / 2 - req.from.size / 2 : req.from.y - 200
          return (
            <motion.img
              key={req.id}
              src={req.imageUrl}
              initial={{ x: req.from.x, y: req.from.y, width: req.from.size, height: req.from.size, opacity: 1, borderRadius: 16 }}
              animate={{ x: tx, y: ty, width: 28, height: 28, opacity: 0.2, borderRadius: 999 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => done(req.id)}
              className="fixed left-0 top-0 object-cover shadow-lg"
              alt=""
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

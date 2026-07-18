import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Loader2, X } from 'lucide-react'
import { useProductSearch } from '@/hooks/queries'
import { useDebounce } from '@/hooks/useDebounce'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ProductListItem } from '@/types/api'

const FALLBACK = 'https://placehold.co/80x80/eceef2/8591a6?text=—'

type Props = {
  /** Called after navigating (e.g. to close the mobile menu). */
  onNavigate?: () => void
  autoFocus?: boolean
  className?: string
}

/**
 * Real-time product search. As the user types we debounce the term, fetch a
 * short list of matching products and render them in a dropdown. Keyboard:
 * ↑/↓ to move, Enter to open the highlighted product (or run a full search),
 * Esc to close.
 */
export function SearchBar({ onNavigate, autoFocus, className }: Props) {
  const navigate = useNavigate()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1) // -1 = the "see all results" row

  const debounced = useDebounce(term, 220)
  const { data, isFetching } = useProductSearch(debounced)
  const items = data?.items ?? []
  const total = data?.totalCount ?? 0
  const hasQuery = debounced.trim().length >= 2
  const showPanel = open && term.trim().length >= 2

  // Reset the highlighted row whenever the result set changes.
  useEffect(() => { setActive(-1) }, [debounced])

  // Close on outside click.
  useEffect(() => {
    if (!showPanel) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showPanel])

  function goToSearch() {
    const q = term.trim()
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
    close()
  }

  function goToProduct(p: ProductListItem) {
    navigate(`/products/${p.slug}`)
    close()
  }

  function close() {
    setOpen(false)
    inputRef.current?.blur()
    onNavigate?.()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); return }
    if (!showPanel) {
      if (e.key === 'Enter') goToSearch()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i >= items.length - 1 ? -1 : i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= -1 ? items.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && items[active]) goToProduct(items[active])
      else goToSearch()
    }
  }

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <input
          ref={inputRef}
          value={term}
          autoFocus={autoFocus}
          onChange={(e) => { setTerm(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products…"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="w-full rounded-full border border-ink-200 bg-ink-50 py-2 pl-9 pr-9 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        {term && (
          <button
            type="button"
            onClick={() => { setTerm(''); setOpen(false); inputRef.current?.focus() }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-xl"
          >
            {!hasQuery ? null : items.length === 0 && !isFetching ? (
              <div className="px-4 py-6 text-center text-sm text-ink-500">
                No products match “<span className="font-medium text-ink-700">{debounced.trim()}</span>”.
              </div>
            ) : (
              <>
                <ul className="max-h-[22rem] overflow-y-auto py-1.5">
                  {items.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active === i}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => goToProduct(p)}
                        className={cn(
                          'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors',
                          active === i ? 'bg-ink-50' : 'hover:bg-ink-50',
                        )}
                      >
                        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                          <img src={p.primaryImageUrl ?? FALLBACK} alt="" className="size-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink-900">
                            <Highlight text={p.name} query={debounced.trim()} />
                          </p>
                          <p className="truncate text-xs text-ink-400">{p.categoryName}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink-900">{formatPrice(p.priceInCents)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onMouseEnter={() => setActive(-1)}
                  onClick={goToSearch}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 border-t border-ink-100 px-4 py-2.5 text-sm font-medium transition-colors',
                    active === -1 ? 'bg-brand-50 text-brand-700' : 'text-brand-600 hover:bg-ink-50',
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    {isFetching && <Loader2 className="size-3.5 animate-spin" />}
                    See all results for “{debounced.trim()}”
                  </span>
                  {total > 0 && <span className="text-xs text-ink-400">{total} found</span>}
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Bolds the part of `text` that matches `query` (case-insensitive, first hit). */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent font-bold text-brand-600">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

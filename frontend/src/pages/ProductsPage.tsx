import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { SlidersHorizontal, PackageOpen, X, Star } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useProducts, useCategories } from '@/hooks/queries'
import type { Category, ProductQueryParams, ProductSort } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { formatPrice } from '@/lib/format'

const SORT_OPTIONS: { label: string; value: ProductSort }[] = [
  { label: 'Newest', value: 'Newest' },
  { label: 'Price: Low to High', value: 'PriceAsc' },
  { label: 'Price: High to Low', value: 'PriceDesc' },
  { label: 'Name: A–Z', value: 'NameAsc' },
  { label: 'Top rated', value: 'TopRated' },
]

const PRICE_BANDS: { label: string; min?: number; max?: number }[] = [
  { label: 'Any price' },
  { label: 'Under $50', max: 5000 },
  { label: '$50 – $150', min: 5000, max: 15000 },
  { label: '$150 – $400', min: 15000, max: 40000 },
  { label: 'Over $400', min: 40000 },
]

type Updater = (next: Record<string, string | undefined>, resetPage?: boolean) => void

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const { data: categories } = useCategories()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const category = params.get('category') ?? ''
  const search = params.get('search') ?? ''
  const sort = (params.get('sort') as ProductSort) || 'Newest'
  const featured = params.get('featured') === 'true'
  const page = Number(params.get('page') ?? '1')
  const minPrice = params.get('min') ? Number(params.get('min')) : undefined
  const maxPrice = params.get('max') ? Number(params.get('max')) : undefined

  const query: ProductQueryParams = useMemo(
    () => ({
      categorySlug: category || undefined,
      search: search || undefined,
      sort,
      featuredOnly: featured || undefined,
      minPriceCents: minPrice,
      maxPriceCents: maxPrice,
      page,
      pageSize: 12,
    }),
    [category, search, sort, featured, minPrice, maxPrice, page],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useProducts(query)

  const update: Updater = (next, resetPage = true) => {
    const merged = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') merged.delete(k)
      else merged.set(k, v)
    }
    if (resetPage) merged.delete('page')
    setParams(merged)
  }

  const activeBand = PRICE_BANDS.findIndex((b) => b.min === minPrice && b.max === maxPrice)
  const categoryName = categories?.find((c) => c.slug === category)?.name
  const title = category ? categoryName ?? 'Products' : search ? `Search: “${search}”` : 'All products'

  // Removable chips summarizing every active filter.
  const activePills: { key: string; label: string; remove: () => void }[] = []
  if (search) activePills.push({ key: 'search', label: `“${search}”`, remove: () => update({ search: undefined }) })
  if (category) activePills.push({ key: 'category', label: categoryName ?? category, remove: () => update({ category: undefined }) })
  if (minPrice !== undefined || maxPrice !== undefined)
    activePills.push({ key: 'price', label: priceRangeLabel(minPrice, maxPrice), remove: () => update({ min: undefined, max: undefined }) })
  if (featured) activePills.push({ key: 'featured', label: 'Featured', remove: () => update({ featured: undefined }) })

  const filterCount = activePills.length

  return (
    <>
      <Seo title={title} />
      <Container className="py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
            {data && <p className="mt-1 text-sm text-ink-500">{data.totalCount} product{data.totalCount === 1 ? '' : 's'}</p>}
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter trigger */}
            <Button variant="outline" size="sm" className="gap-2 lg:hidden" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal className="size-4" />
              Filters
              {filterCount > 0 && (
                <span className="grid size-5 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{filterCount}</span>
              )}
            </Button>
            <div className="hidden items-center gap-2 sm:flex">
              <SlidersHorizontal className="size-4 text-ink-400" />
            </div>
            <Select value={sort} onChange={(e) => update({ sort: e.target.value })} className="w-44 sm:w-52">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Active filter pills */}
        {activePills.length > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {activePills.map((p) => (
              <button
                key={p.key}
                onClick={p.remove}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1 pl-3 pr-2 text-sm text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
              >
                {p.label}
                <X className="size-3.5 text-ink-400" />
              </button>
            ))}
            <button onClick={() => setParams(new URLSearchParams())} className="px-2 text-sm font-medium text-brand-600 hover:text-brand-700">
              Clear all
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Desktop filters */}
          <aside className="hidden lg:block">
            <FiltersPanel
              categories={categories}
              category={category}
              activeBand={activeBand}
              minPrice={minPrice}
              maxPrice={maxPrice}
              featured={featured}
              update={update}
            />
          </aside>

          {/* Results */}
          <div>
            {isLoading ? (
              <ProductGridSkeleton count={12} />
            ) : isError ? (
              <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
            ) : !data || data.items.length === 0 ? (
              <EmptyState
                icon={<PackageOpen className="size-7" />}
                title="No products found"
                description="Try adjusting your filters or search terms."
                action={<Button variant="outline" size="sm" onClick={() => setParams(new URLSearchParams())}>Reset filters</Button>}
              />
            ) : (
              <>
                <div className={isFetching ? 'opacity-60 transition' : 'transition'}>
                  <ProductGrid products={data.items} />
                </div>
                {data.totalPages > 1 && (
                  <Pagination
                    page={data.page}
                    totalPages={data.totalPages}
                    onPage={(p) => update({ page: p.toString() }, false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
                <h2 className="font-semibold text-ink-900">Filters</h2>
                <button onClick={() => setDrawerOpen(false)} className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100">
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <FiltersPanel
                  categories={categories}
                  category={category}
                  activeBand={activeBand}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  featured={featured}
                  update={update}
                />
              </div>
              <div className="border-t border-ink-100 p-4">
                <Button className="w-full" onClick={() => setDrawerOpen(false)}>
                  Show {data?.totalCount ?? ''} results
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function FiltersPanel({
  categories,
  category,
  activeBand,
  minPrice,
  maxPrice,
  featured,
  update,
}: {
  categories?: Category[]
  category: string
  activeBand: number
  minPrice?: number
  maxPrice?: number
  featured: boolean
  update: Updater
}) {
  return (
    <div className="space-y-6">
      <FilterGroup title="Category">
        <FilterChip active={!category} onClick={() => update({ category: undefined })}>All</FilterChip>
        {categories?.map((c) => (
          <FilterChip key={c.id} active={category === c.slug} onClick={() => update({ category: c.slug })}>
            {c.name}
          </FilterChip>
        ))}
      </FilterGroup>

      <FilterGroup title="Price">
        {PRICE_BANDS.map((b, i) => (
          <FilterChip
            key={b.label}
            active={i === activeBand || (activeBand === -1 && i === 0 && minPrice === undefined && maxPrice === undefined)}
            onClick={() => update({ min: b.min?.toString(), max: b.max?.toString() })}
          >
            {b.label}
          </FilterChip>
        ))}
        <PriceRange minPrice={minPrice} maxPrice={maxPrice} update={update} />
      </FilterGroup>

      <FilterGroup title="Featured">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => update({ featured: e.target.checked ? 'true' : undefined })}
            className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
          />
          <span className="inline-flex items-center gap-1.5">
            <Star className="size-4 text-amber-400" /> Featured only
          </span>
        </label>
      </FilterGroup>
    </div>
  )
}

function PriceRange({ minPrice, maxPrice, update }: { minPrice?: number; maxPrice?: number; update: Updater }) {
  const [min, setMin] = useState(minPrice !== undefined ? String(minPrice / 100) : '')
  const [max, setMax] = useState(maxPrice !== undefined ? String(maxPrice / 100) : '')

  function apply() {
    const minCents = min.trim() ? Math.round(Number(min) * 100) : undefined
    const maxCents = max.trim() ? Math.round(Number(max) * 100) : undefined
    if ((minCents !== undefined && Number.isNaN(minCents)) || (maxCents !== undefined && Number.isNaN(maxCents))) return
    update({ min: minCents?.toString(), max: maxCents?.toString() })
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <Input type="number" min={0} inputMode="numeric" placeholder="Min $" value={min} onChange={(e) => setMin(e.target.value)} className="px-2.5 py-2 text-sm" />
        <span className="text-ink-300">–</span>
        <Input type="number" min={0} inputMode="numeric" placeholder="Max $" value={max} onChange={(e) => setMax(e.target.value)} className="px-2.5 py-2 text-sm" />
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={apply}>Apply price</Button>
    </div>
  )
}

function priceRangeLabel(min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `${formatPrice(min)} – ${formatPrice(max)}`
  if (min !== undefined) return `Over ${formatPrice(min)}`
  if (max !== undefined) return `Under ${formatPrice(max)}`
  return 'Any price'
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</h3>
      <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5">{children}</div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-full px-3 py-1.5 text-left text-sm transition lg:rounded-lg ' +
        (active ? 'bg-brand-600 font-medium text-white lg:bg-brand-50 lg:text-brand-700' : 'bg-ink-50 text-ink-600 hover:bg-ink-100 lg:bg-transparent')
      }
    >
      {children}
    </button>
  )
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </Button>
      <span className="px-3 text-sm text-ink-500">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
        Next
      </Button>
    </div>
  )
}

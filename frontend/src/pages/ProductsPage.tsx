import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, PackageOpen } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/States'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useProducts, useCategories } from '@/hooks/queries'
import type { ProductQueryParams, ProductSort } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'

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

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const { data: categories } = useCategories()

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

  function update(next: Record<string, string | undefined>, resetPage = true) {
    const merged = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') merged.delete(k)
      else merged.set(k, v)
    }
    if (resetPage) merged.delete('page')
    setParams(merged)
  }

  const activeBand = PRICE_BANDS.findIndex((b) => b.min === minPrice && b.max === maxPrice)
  const title = category ? categories?.find((c) => c.slug === category)?.name ?? 'Products' : search ? `Search: “${search}”` : 'All products'

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
            <SlidersHorizontal className="size-4 text-ink-400" />
            <Select value={sort} onChange={(e) => update({ sort: e.target.value })} className="w-52">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          {/* Filters */}
          <aside className="space-y-6">
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
                  active={i === activeBand || (activeBand === -1 && i === 0)}
                  onClick={() => update({ min: b.min?.toString(), max: b.max?.toString() })}
                >
                  {b.label}
                </FilterChip>
              ))}
            </FilterGroup>
            {(category || search || minPrice || maxPrice || featured) && (
              <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams())}>
                Clear all filters
              </Button>
            )}
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
    </>
  )
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

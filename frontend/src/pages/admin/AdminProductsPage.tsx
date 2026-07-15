import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner, ErrorState, EmptyState } from '@/components/ui/States'
import { useAdminProducts } from '@/hooks/queries'
import { productsApi } from '@/api/services'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

const FALLBACK = 'https://placehold.co/80x80/eceef2/8591a6?text=—'

export function AdminProductsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError, error, refetch } = useAdminProducts({ search: search || undefined, page, pageSize: 15, sort: 'Newest' })

  const del = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => {
      toast.success('Product removed.')
      void qc.invalidateQueries({ queryKey: ['admin-products'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Products</h1>
          <p className="mt-1 text-sm text-ink-500">{data?.totalCount ?? 0} total</p>
        </div>
        <Link to="/admin/products/new"><Button className="gap-2"><Plus className="size-4" /> New product</Button></Link>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search products…" className="pl-9" />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {isLoading ? (
          <Spinner label="Loading products…" />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No products" description="Create your first product to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.primaryImageUrl ?? FALLBACK} alt="" className="size-11 rounded-lg object-cover" />
                        <span className="font-medium text-ink-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{p.categoryName}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{formatPrice(p.priceInCents)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock === 0 ? 'font-semibold text-accent-500' : p.stock <= 5 ? 'font-semibold text-amber-600' : 'text-ink-600'}>{p.stock}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-100 text-ink-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/products/${p.id}/edit`} className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"><Pencil className="size-4" /></Link>
                        <button
                          onClick={() => { if (confirm(`Delete “${p.name}”?`)) del.mutate(p.id) }}
                          className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-red-50 hover:text-accent-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="px-3 text-sm text-ink-500">Page {page} of {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}

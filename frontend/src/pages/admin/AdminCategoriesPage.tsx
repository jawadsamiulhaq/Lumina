import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner, ErrorState, EmptyState } from '@/components/ui/States'
import { categoriesApi } from '@/api/services'
import type { Category } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

export function AdminCategoriesPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })

  const remove = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.success('Category deleted.')
      void qc.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Categories</h1>
          <p className="mt-1 text-sm text-ink-500">{data?.length ?? 0} total</p>
        </div>
        <Link to="/admin/categories/new"><Button className="gap-2"><Plus className="size-4" /> New category</Button></Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {isLoading ? (
          <Spinner label="Loading categories…" />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No categories" description="Create your first category to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.map((c: Category) => (
                  <tr key={c.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                    <td className="px-4 py-3 text-ink-500">/{c.slug}</td>
                    <td className="px-4 py-3 text-ink-600">{c.productCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/categories/${c.id}/edit`} className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"><Pencil className="size-4" /></Link>
                        <button
                          onClick={() => { if (confirm(`Delete “${c.name}”?`)) remove.mutate(c.id) }}
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
    </div>
  )
}

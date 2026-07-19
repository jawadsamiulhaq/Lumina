import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner, ErrorState, EmptyState } from '@/components/ui/States'
import { useAdminOffers, queryKeys } from '@/hooks/queries'
import { offersApi } from '@/api/services'
import type { AdminOffer, OfferStatus } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { toast } from '@/store/toastStore'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<OfferStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  Scheduled: 'bg-indigo-50 text-indigo-600',
  Expired: 'bg-ink-100 text-ink-500',
  Disabled: 'bg-amber-50 text-amber-600',
}

export function AdminOffersPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useAdminOffers()

  const remove = useMutation({
    mutationFn: (id: number) => offersApi.remove(id),
    onSuccess: () => {
      toast.success('Offer deleted.')
      void qc.invalidateQueries({ queryKey: queryKeys.adminOffers })
      void qc.invalidateQueries({ queryKey: queryKeys.offers })
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Offers</h1>
          <p className="mt-1 text-sm text-ink-500">{data?.length ?? 0} total · time-limited promotions shown on the home page</p>
        </div>
        <Link to="/admin/offers/new"><Button className="gap-2"><Plus className="size-4" /> New offer</Button></Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {isLoading ? (
          <Spinner label="Loading offers…" />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="No offers yet" description="Create a time-limited offer to show a countdown banner on the storefront." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Offer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Runs</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.map((o: AdminOffer) => (
                  <tr key={o.id} className="hover:bg-ink-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                          {o.imageUrl && <img src={o.imageUrl} alt="" className="size-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-ink-900">{o.title}</p>
                            {o.discountLabel && <span className="shrink-0 rounded bg-accent-500/10 px-1.5 py-0.5 text-[11px] font-bold text-accent-500">{o.discountLabel}</span>}
                          </div>
                          {o.subtitle && <p className="truncate text-xs text-ink-400">{o.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_TONE[o.status])}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      <span className="whitespace-nowrap">{formatDateTime(o.startsAt)}</span>
                      <span className="mx-1 text-ink-300">→</span>
                      <span className="whitespace-nowrap">{formatDateTime(o.endsAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{o.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/offers/${o.id}/edit`} className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900"><Pencil className="size-4" /></Link>
                        <button
                          onClick={() => { if (confirm(`Delete “${o.title}”?`)) remove.mutate(o.id) }}
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

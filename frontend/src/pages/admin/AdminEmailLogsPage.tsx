import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Spinner, ErrorState, EmptyState } from '@/components/ui/States'
import { emailLogsApi } from '@/api/services'
import type { EmailStatus } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<EmailStatus, string> = {
  Sent: 'bg-emerald-50 text-emerald-600',
  Logged: 'bg-amber-50 text-amber-600',
  Failed: 'bg-red-50 text-accent-500',
}

function StatusBadge({ status }: { status: EmailStatus }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_TONE[status])}>{status}</span>
}

export function AdminEmailLogsPage() {
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['email-logs', page],
    queryFn: () => emailLogsApi.list(page),
  })

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
          <Inbox className="size-6 text-brand-600" /> Email log
        </h1>
        <p className="mt-1 text-sm text-ink-500">{data?.totalCount ?? 0} emails sent · newest first</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {isLoading ? (
          <Spinner label="Loading email log…" />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={<Inbox className="size-7" />} title="No emails yet" description="Sent emails (like password resets) will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Recipient</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data.items.map((e) => (
                  <tr key={e.id} onClick={() => setSelectedId(e.id)} className="cursor-pointer hover:bg-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">{e.toEmail}</td>
                    <td className="px-4 py-3 text-ink-600">{e.subject}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3 text-ink-500">{formatDateTime(e.createdAt)}</td>
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

      <EmailLogModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function EmailLogModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['email-log', id],
    queryFn: () => emailLogsApi.get(id!),
    enabled: id != null,
  })

  return (
    <Modal
      open={id != null}
      onClose={onClose}
      size="lg"
      title="Email details"
      description={data ? `To ${data.toEmail} · ${formatDateTime(data.createdAt)}` : ''}
      footer={<Button onClick={onClose}>Close</Button>}
    >
      {isLoading ? (
        <Spinner label="Loading…" />
      ) : isError || !data ? (
        <ErrorState message={getApiErrorMessage(error)} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div><span className="text-ink-400">Status:</span> <StatusBadge status={data.status} /></div>
            <div><span className="text-ink-400">Subject:</span> <span className="font-medium text-ink-900">{data.subject}</span></div>
          </div>

          {data.error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">
              <p className="font-semibold">Send failed</p>
              <p className="mt-0.5 break-words">{data.error}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">Content</p>
            <div className="overflow-hidden rounded-2xl border border-ink-100">
              <iframe title="Email content" sandbox="" srcDoc={data.body} className="h-[360px] w-full bg-white" />
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

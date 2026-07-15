import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner, ErrorState } from '@/components/ui/States'
import { useAdminUsers } from '@/hooks/queries'
import { adminApi } from '@/api/services'
import { formatDate } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

export function AdminUsersPage() {
  const qc = useQueryClient()
  const { data, isLoading, isError, error, refetch } = useAdminUsers()

  const mutation = useMutation({
    mutationFn: (v: { id: string; isAdmin: boolean }) => adminApi.setRole(v.id, v.isAdmin),
    onSuccess: () => { toast.success('Role updated.'); void qc.invalidateQueries({ queryKey: ['admin-users'] }) },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">Users</h1>
      <p className="mt-1 text-sm text-ink-500">Promote or demote administrators.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {data?.map((u) => {
                  const isAdmin = u.roles.includes('Admin')
                  return (
                    <tr key={u.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-ink-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span key={r} className={`rounded-full px-2 py-0.5 text-xs font-medium ${r === 'Admin' ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-500'}`}>{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={isAdmin ? 'outline' : 'primary'}
                          size="sm"
                          className="gap-1.5"
                          loading={mutation.isPending && mutation.variables?.id === u.id}
                          onClick={() => mutation.mutate({ id: u.id, isAdmin: !isAdmin })}
                        >
                          {isAdmin ? <><ShieldOff className="size-4" /> Demote</> : <><ShieldCheck className="size-4" /> Make admin</>}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

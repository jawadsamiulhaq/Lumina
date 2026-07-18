import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Lock, LockOpen, ShieldCheck, Mail, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner, ErrorState, EmptyState } from '@/components/ui/States'
import { toast } from '@/store/toastStore'
import { useAdminUsers, useRoles, usePermissions, queryKeys } from '@/hooks/queries'
import { adminApi } from '@/api/services'
import { getApiErrorMessage } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { roleTone, groupPermissions } from '@/lib/rbac'

const LOCK_MINUTES = 5

export function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const qc = useQueryClient()
  const { data: users, isLoading, isError, error, refetch } = useAdminUsers()
  const { data: roles } = useRoles()
  const { data: permissions } = usePermissions()

  const user = users?.find((u) => u.id === id)
  const [draftRoles, setDraftRoles] = useState<string[]>([])

  useEffect(() => {
    if (user) setDraftRoles(user.roles)
  }, [user?.id, user?.roles])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.adminUsers })
    void qc.invalidateQueries({ queryKey: queryKeys.roles })
  }

  const rolesMut = useMutation({
    mutationFn: (roleNames: string[]) => adminApi.setUserRoles(id, roleNames),
    onSuccess: () => { toast.success('Roles updated.'); invalidate() },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })
  const lockMut = useMutation({
    mutationFn: (lock: boolean) => (lock ? adminApi.lockUser(id, LOCK_MINUTES) : adminApi.unlockUser(id)),
    onSuccess: (_d, lock) => { toast[lock ? 'info' : 'success'](lock ? `Locked ${LOCK_MINUTES} min.` : 'Unlocked.'); invalidate() },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  // Effective permissions: which permission comes from which assigned role.
  const effective = useMemo(() => {
    const map = new Map<string, string[]>() // permission -> roles granting it
    for (const rn of draftRoles) {
      const role = roles?.find((r) => r.name === rn)
      role?.permissions.forEach((p) => map.set(p, [...(map.get(p) ?? []), rn]))
    }
    return map
  }, [draftRoles, roles])

  const groups = useMemo(() => groupPermissions(permissions ?? []), [permissions])
  const dirty = user && (draftRoles.length !== user.roles.length || draftRoles.some((r) => !user.roles.includes(r)))

  if (isLoading) return <Spinner label="Loading user…" />
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
  if (!user) {
    return (
      <EmptyState
        title="User not found"
        description="This user may have been deleted."
        action={<Link to="/admin/users"><Button variant="outline">Back to users</Button></Link>}
      />
    )
  }

  function toggleRole(name: string) {
    setDraftRoles((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]))
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to users
      </Link>

      {/* Header card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">
            {(user.firstName[0] ?? '') + (user.lastName[0] ?? '')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900">{user.firstName} {user.lastName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" /> {user.email}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5" /> Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.isLocked ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-3 py-1.5 text-sm font-semibold text-accent-500"><Lock className="size-4" /> Locked</span>
              <Button variant="outline" size="sm" className="gap-1.5" loading={lockMut.isPending} onClick={() => lockMut.mutate(false)}><LockOpen className="size-4" /> Unlock</Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" loading={lockMut.isPending} onClick={() => lockMut.mutate(true)}><Lock className="size-4" /> Lock {LOCK_MINUTES} min</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Roles */}
        <div className="h-fit rounded-2xl border border-ink-100 bg-white p-5">
          <h2 className="font-semibold text-ink-900">Roles</h2>
          <p className="mt-0.5 text-sm text-ink-500">Assign roles to grant their permissions.</p>
          <div className="mt-4 space-y-2">
            {roles?.map((r) => {
              const tone = roleTone(r)
              const checked = draftRoles.includes(r.name)
              return (
                <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 hover:bg-ink-50'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleRole(r.name)} className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200" />
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-900"><span className={`size-2 rounded-full ${tone.dot}`} /> {r.name}</span>
                  <span className="ml-auto text-xs text-ink-400">{r.permissions.length}</span>
                </label>
              )
            })}
          </div>
          {dirty && (
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="outline" size="sm" onClick={() => setDraftRoles(user.roles)}>Reset</Button>
              <Button size="sm" loading={rolesMut.isPending} onClick={() => rolesMut.mutate(draftRoles)}>Save roles</Button>
            </div>
          )}
        </div>

        {/* Effective permissions */}
        <div className="rounded-2xl border border-ink-100 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900"><ShieldCheck className="size-4 text-ink-300" /> Effective permissions</h2>
            <span className="text-sm text-ink-400">{effective.size} granted</span>
          </div>
          <p className="mt-0.5 text-sm text-ink-500">Every capability this user has, and the role that grants it.</p>

          {effective.size === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">No permissions — assign a role to grant access.</p>
          ) : (
            <div className="mt-4 space-y-5">
              {groups.map((g) => {
                const granted = g.permissions.filter((p) => effective.has(p.name))
                if (granted.length === 0) return null
                return (
                  <div key={g.group}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">{g.group}</p>
                    <ul className="space-y-1.5">
                      {granted.map((p) => (
                        <li key={p.name} className="flex items-center gap-2.5 rounded-lg bg-ink-50/70 px-3 py-2 text-sm">
                          <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                          <span className="text-ink-700">{p.description}</span>
                          <span className="ml-auto flex flex-wrap gap-1">
                            {effective.get(p.name)!.map((rn) => {
                              const role = roles?.find((r) => r.name === rn)
                              const tone = roleTone({ name: rn, isSystem: role?.isSystem ?? false })
                              return <span key={rn} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.chip}`}>{rn}</span>
                            })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

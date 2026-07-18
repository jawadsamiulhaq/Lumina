import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Lock, LockOpen, Pencil, Trash2, ShieldCheck, Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, ErrorState } from '@/components/ui/States'
import { toast } from '@/store/toastStore'
import { useAdminUsers, useRoles, queryKeys } from '@/hooks/queries'
import { adminApi } from '@/api/services'
import type { CreateUserBody, UpdateUserBody } from '@/api/services'
import type { AdminUser, Role } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { roleTone } from '@/lib/rbac'

const LOCK_MINUTES = 5

function useNow(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [active])
}

export function UsersTab() {
  const qc = useQueryClient()
  const { data: users, isLoading, isError, error, refetch } = useAdminUsers()
  const { data: roles } = useRoles()

  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null)

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: queryKeys.adminUsers })
    void qc.invalidateQueries({ queryKey: queryKeys.roles })
  }

  const lockMut = useMutation({
    mutationFn: (v: { id: string; lock: boolean }) => (v.lock ? adminApi.lockUser(v.id, LOCK_MINUTES) : adminApi.unlockUser(v.id)),
    onSuccess: (_d, v) => { toast[v.lock ? 'info' : 'success'](v.lock ? `Locked for ${LOCK_MINUTES} min.` : 'User unlocked.'); invalidate() },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { toast.success('User deleted.'); invalidate() },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const anyLocked = (users ?? []).some((u) => u.isLocked)
  useNow(anyLocked)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = users ?? []
    if (!q) return list
    return list.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q))
  }, [users, query])

  const permCountFor = (u: AdminUser) => {
    const set = new Set<string>()
    for (const rn of u.roles) roles?.find((r) => r.name === rn)?.permissions.forEach((p) => set.add(p))
    return set.size
  }

  if (isLoading) return <Spinner label="Loading users…" />
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        <Button className="ml-auto gap-2" onClick={() => setEditing('new')}>
          <UserPlus className="size-4" /> Add user
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-400">No users found.</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-ink-50/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/users/${u.id}`} className="font-medium text-ink-900 hover:text-brand-600">{u.firstName} {u.lastName}</Link>
                      <p className="text-xs text-ink-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 && <span className="text-xs text-ink-300">—</span>}
                        {u.roles.map((rn) => {
                          const role = roles?.find((r) => r.name === rn)
                          const tone = roleTone({ name: rn, isSystem: role?.isSystem ?? false })
                          return <span key={rn} className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone.chip}`}>{rn}</span>
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-ink-300" /> {permCountFor(u)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-500">
                          <Lock className="size-3.5" /> Locked{u.lockedUntil ? ` · ${countdown(u.lockedUntil)}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                          <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton title="View" to={`/admin/users/${u.id}`}><Eye className="size-4" /></IconButton>
                        <IconButton title="Edit" onClick={() => setEditing(u)}><Pencil className="size-4" /></IconButton>
                        {u.isLocked ? (
                          <IconButton title="Unlock" onClick={() => lockMut.mutate({ id: u.id, lock: false })}><LockOpen className="size-4 text-emerald-600" /></IconButton>
                        ) : (
                          <IconButton title={`Lock ${LOCK_MINUTES} min`} onClick={() => lockMut.mutate({ id: u.id, lock: true })}><Lock className="size-4 text-amber-500" /></IconButton>
                        )}
                        <IconButton title="Delete" onClick={() => setConfirmDelete(u)}><Trash2 className="size-4 text-accent-500" /></IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && <UserFormModal user={editing === 'new' ? null : editing} roles={roles ?? []} onClose={() => setEditing(null)} onSaved={invalidate} />}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete user"
        description={confirmDelete ? `${confirmDelete.firstName} ${confirmDelete.lastName} will be removed.` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMut.isPending} onClick={() => { if (confirmDelete) deleteMut.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) }) }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">This permanently removes the account and can't be undone.</p>
      </Modal>
    </div>
  )
}

function IconButton({ title, onClick, to, children }: { title: string; onClick?: () => void; to?: string; children: React.ReactNode }) {
  const cls = 'grid size-9 place-items-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-900'
  if (to) return <Link to={to} title={title} aria-label={title} className={cls}>{children}</Link>
  return <button title={title} aria-label={title} onClick={onClick} className={cls}>{children}</button>
}

function countdown(untilIso: string): string {
  const ms = Math.max(0, new Date(untilIso).getTime() - Date.now())
  const total = Math.ceil(ms / 1000)
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`
}

function UserFormModal({ user, roles, onClose, onSaved }: { user: AdminUser | null; roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [roleNames, setRoleNames] = useState<string[]>(user?.roles ?? ['Customer'])
  const [error, setError] = useState('')

  const createMut = useMutation({
    mutationFn: (body: CreateUserBody) => adminApi.createUser(body),
    onSuccess: () => { toast.success('User created.'); onSaved(); onClose() },
    onError: (e) => setError(getApiErrorMessage(e)),
  })
  const updateMut = useMutation({
    mutationFn: (body: UpdateUserBody) => adminApi.updateUser(user!.id, body),
    onSuccess: () => { toast.success('User updated.'); onSaved(); onClose() },
    onError: (e) => setError(getApiErrorMessage(e)),
  })

  function toggleRole(name: string) {
    setRoleNames((prev) => (prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]))
  }

  function submit() {
    setError('')
    if (!firstName.trim() || !email.trim()) { setError('Name and email are required.'); return }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError('Enter a valid email.'); return }
    if (user) updateMut.mutate({ firstName, lastName, email, roles: roleNames })
    else {
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
      createMut.mutate({ firstName, lastName, email, password, roles: roleNames })
    }
  }

  const pending = createMut.isPending || updateMut.isPending

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={user ? 'Edit user' : 'Add user'}
      description={user ? 'Update details and roles.' : 'Create a user and assign their roles.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={pending} onClick={submit}>{user ? 'Save changes' : 'Create user'}</Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
          <Field label="Last name"><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          </div>
          {!user && (
            <div className="sm:col-span-2">
              <Field label="Temporary password" hint="At least 8 characters, with upper, lower and a digit.">
                <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink-900">Roles</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => {
              const tone = roleTone(r)
              const checked = roleNames.includes(r.name)
              return (
                <label key={r.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-brand-300 bg-brand-50/50' : 'border-ink-200 hover:bg-ink-50'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleRole(r.name)} className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200" />
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-900">
                    <span className={`size-2 rounded-full ${tone.dot}`} /> {r.name}
                  </span>
                  <span className="ml-auto text-xs text-ink-400">{r.permissions.length} perms</span>
                </label>
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-accent-500">{error}</p>}
      </div>
    </Modal>
  )
}

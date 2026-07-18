import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Pencil, Lock, Users as UsersIcon, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, ErrorState } from '@/components/ui/States'
import { toast } from '@/store/toastStore'
import { useRoles, usePermissions, queryKeys } from '@/hooks/queries'
import { rolesApi } from '@/api/services'
import type { Role } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { roleTone, groupPermissions } from '@/lib/rbac'

export function RolesTab() {
  const qc = useQueryClient()
  const { data: roles, isLoading, isError, error, refetch } = useRoles()
  const { data: permissions } = usePermissions()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<Role | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null)
  const [draft, setDraft] = useState<string[]>([])

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.roles })

  const selected = useMemo(() => roles?.find((r) => r.id === selectedId) ?? roles?.[0] ?? null, [roles, selectedId])

  // Sync the editable permission draft whenever the selected role changes.
  useEffect(() => {
    if (selected) setDraft(selected.permissions)
  }, [selected?.id, selected?.permissions])

  const saveMut = useMutation({
    mutationFn: (v: { id: string; permissions: string[] }) => rolesApi.setPermissions(v.id, v.permissions),
    onSuccess: () => { toast.success('Permissions saved.'); invalidate() },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => { toast.success('Role deleted.'); setSelectedId(null); invalidate() },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const groups = useMemo(() => groupPermissions(permissions ?? []), [permissions])
  const dirty = selected && (draft.length !== selected.permissions.length || draft.some((p) => !selected.permissions.includes(p)))

  if (isLoading) return <Spinner label="Loading roles…" />
  if (isError) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />

  function togglePerm(key: string) {
    setDraft((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }
  function toggleGroup(keys: string[], allOn: boolean) {
    setDraft((prev) => (allOn ? prev.filter((k) => !keys.includes(k)) : [...new Set([...prev, ...keys])]))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-ink-500">Define roles once, then assign them to users on the Users tab.</p>
        <Button className="gap-2" onClick={() => setEditingRole('new')}><Plus className="size-4" /> Create role</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-2">
          {roles?.map((r) => {
            const tone = roleTone(r)
            const active = r.id === selected?.id
            return (
              <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-200' : 'border-ink-100 bg-white hover:bg-ink-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${tone.dot}`} />
                  <span className="font-semibold text-ink-900">{r.name}</span>
                  {r.isSystem && <Lock className="size-3.5 text-ink-300" />}
                  <span className="ml-auto inline-flex items-center gap-1 text-xs text-ink-400"><UsersIcon className="size-3.5" /> {r.memberCount}</span>
                </div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-ink-400"><ShieldCheck className="size-3.5" /> {r.permissions.length} permissions</p>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-ink-100 pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                  <span className={`size-2.5 rounded-full ${roleTone(selected).dot}`} /> {selected.name}
                  {selected.isSystem && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">System</span>}
                </h2>
                <p className="mt-0.5 text-sm text-ink-500">{selected.memberCount} member(s) · {selected.permissions.length} permissions</p>
              </div>
              <div className="flex gap-1">
                {!selected.isSystem && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingRole(selected)}><Pencil className="size-4" /> Rename</Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-accent-500" onClick={() => setConfirmDelete(selected)}><Trash2 className="size-4" /> Delete</Button>
                  </>
                )}
              </div>
            </div>

            {selected.isSystem && (
              <p className="mb-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
                {selected.name === 'Admin' ? 'The Admin role always has every permission and can’t be changed.' : 'This is a system role and its permissions are fixed.'}
              </p>
            )}

            <div className="space-y-5">
              {groups.map((g) => {
                const keys = g.permissions.map((p) => p.name)
                const allOn = keys.every((k) => draft.includes(k))
                return (
                  <div key={g.group}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{g.group}</p>
                      {!selected.isSystem && (
                        <button onClick={() => toggleGroup(keys, allOn)} className="text-xs font-medium text-brand-600 hover:text-brand-700">{allOn ? 'Clear' : 'Select all'}</button>
                      )}
                    </div>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {g.permissions.map((p) => (
                        <label key={p.name} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm ${selected.isSystem ? 'text-ink-400' : 'cursor-pointer text-ink-700 hover:bg-ink-50'}`}>
                          <input type="checkbox" checked={draft.includes(p.name)} disabled={selected.isSystem} onChange={() => togglePerm(p.name)} className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200 disabled:opacity-60" />
                          {p.description}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {!selected.isSystem && (
              <div className="mt-5 flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
                {dirty && <span className="text-xs text-ink-400">Unsaved changes</span>}
                <Button variant="outline" size="sm" disabled={!dirty} onClick={() => setDraft(selected.permissions)}>Reset</Button>
                <Button size="sm" disabled={!dirty} loading={saveMut.isPending} onClick={() => saveMut.mutate({ id: selected.id, permissions: draft })}>Save permissions</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingRole && <RoleDetailsModal role={editingRole === 'new' ? null : editingRole} onClose={() => setEditingRole(null)} onSaved={(id) => { void invalidate(); if (id) setSelectedId(id) }} />}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete role"
        description={confirmDelete ? `${confirmDelete.name} will be removed and unassigned from ${confirmDelete.memberCount} user(s).` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMut.isPending} onClick={() => { if (confirmDelete) deleteMut.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) }) }}>Delete role</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">Users keep their other roles; only this one is removed.</p>
      </Modal>
    </div>
  )
}

function RoleDetailsModal({ role, onClose, onSaved }: { role: Role | null; onClose: () => void; onSaved: (id?: string) => void }) {
  const [name, setName] = useState(role?.name ?? '')
  const [error, setError] = useState('')

  const createMut = useMutation({
    mutationFn: (n: string) => rolesApi.create(n),
    onSuccess: (r) => { toast.success('Role created.'); onSaved(r.id); onClose() },
    onError: (e) => setError(getApiErrorMessage(e)),
  })
  const updateMut = useMutation({
    mutationFn: (n: string) => rolesApi.update(role!.id, n),
    onSuccess: (r) => { toast.success('Role renamed.'); onSaved(r.id); onClose() },
    onError: (e) => setError(getApiErrorMessage(e)),
  })

  function submit() {
    setError('')
    if (!name.trim()) { setError('Role name is required.'); return }
    if (role) updateMut.mutate(name.trim())
    else createMut.mutate(name.trim())
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={role ? 'Rename role' : 'Create role'}
      description={role ? undefined : 'Name the role, then pick its permissions.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={createMut.isPending || updateMut.isPending} onClick={submit}>{role ? 'Save' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Role name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warehouse" /></Field>
        {error && <p className="text-sm font-medium text-accent-500">{error}</p>}
      </div>
    </Modal>
  )
}

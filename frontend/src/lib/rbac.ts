import type { Permission, Role } from '@/types/api'

/** Deterministic colour tone for a role chip/dot, keyed on the role name. */
const TONES: { chip: string; dot: string }[] = [
  { chip: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500' },
  { chip: 'bg-indigo-50 text-indigo-600', dot: 'bg-indigo-500' },
  { chip: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  { chip: 'bg-sky-50 text-sky-600', dot: 'bg-sky-500' },
  { chip: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  { chip: 'bg-pink-50 text-pink-600', dot: 'bg-pink-500' },
]
const NEUTRAL = { chip: 'bg-ink-100 text-ink-500', dot: 'bg-ink-400' }

export function roleTone(role: Pick<Role, 'name' | 'isSystem'>): { chip: string; dot: string } {
  if (role.name === 'Admin') return TONES[0]
  if (role.name === 'Customer') return NEUTRAL
  let hash = 0
  for (const ch of role.name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

/** Group a flat permission catalog by its dotted prefix, e.g. "products.manage" → "Products". */
export function groupPermissions(permissions: Permission[]): { group: string; permissions: Permission[] }[] {
  const groups = new Map<string, Permission[]>()
  for (const p of permissions) {
    const key = p.name.split('.')[0]
    const list = groups.get(key) ?? []
    list.push(p)
    groups.set(key, list)
  }
  return [...groups.entries()].map(([key, perms]) => ({ group: titleCase(key), permissions: perms }))
}

export function permissionLabel(permissions: Permission[], name: string): string {
  return permissions.find((p) => p.name === name)?.description ?? name
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

import { useState } from 'react'
import { Users, ShieldCheck } from 'lucide-react'
import { useAdminUsers, useRoles } from '@/hooks/queries'
import { UsersTab } from '@/components/admin/rbac/UsersTab'
import { RolesTab } from '@/components/admin/rbac/RolesTab'

type Tab = 'users' | 'roles'

export function AdminUsersPage() {
  const { data: users } = useAdminUsers()
  const { data: roles } = useRoles()
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Users &amp; access</h1>
        <p className="mt-1 text-sm text-ink-500">Manage users, roles and permissions (RBAC).</p>
      </div>

      <div className="mt-6 flex gap-1 rounded-xl bg-ink-100 p-1 sm:w-fit">
        <TabButton active={tab === 'users'} onClick={() => setTab('users')} icon={Users} label="Users" count={users?.length} />
        <TabButton active={tab === 'roles'} onClick={() => setTab('roles')} icon={ShieldCheck} label="Roles & permissions" count={roles?.length} />
      </div>

      <div className="mt-6">{tab === 'users' ? <UsersTab /> : <RolesTab />}</div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: typeof Users; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition sm:flex-none ${active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
    >
      <Icon className="size-4" /> {label}
      {count != null && <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-ink-100 text-ink-500' : 'bg-ink-200/60 text-ink-500'}`}>{count}</span>}
    </button>
  )
}

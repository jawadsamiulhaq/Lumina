import { useState } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Mail, Store, Menu, X } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { PERM } from '@/lib/permissions'

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true, perm: PERM.dashboard },
  { to: '/admin/products', label: 'Products', icon: Package, end: false, perm: PERM.products },
  { to: '/admin/categories', label: 'Categories', icon: FolderTree, end: false, perm: PERM.categories },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart, end: false, perm: PERM.orders },
  { to: '/admin/users', label: 'Users', icon: Users, end: false, perm: PERM.users },
  { to: '/admin/email-templates', label: 'Email templates', icon: Mail, end: false, perm: PERM.settings },
]

export function AdminLayout() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const permissions = useAuthStore((s) => s.user?.permissions ?? [])

  const canAccess = (perm: string) => isAdmin || permissions.includes(perm)
  const navItems = NAV.filter((item) => canAccess(item.perm))

  // Send users who can't see the dashboard to their first accessible section.
  if (location.pathname === '/admin' && !canAccess(PERM.dashboard) && navItems.length > 0) {
    return <Navigate to={navItems[0].to} replace />
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Seo title="Admin" />
      {/* Topbar */}
      <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-ink-100 bg-white px-4">
        <button onClick={() => setOpen((v) => !v)} className="grid size-10 place-items-center rounded-xl text-ink-600 hover:bg-ink-100 lg:hidden">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <Link to="/admin" className="flex items-center gap-2 font-black text-ink-900">
          <span className="grid size-8 place-items-center rounded-xl bg-ink-900 text-white">L</span>
          Admin
        </Link>
        <Link to="/" className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100">
          <Store className="size-4" /> View store
        </Link>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-ink-100 p-4 lg:block">
          <SidebarNav items={navItems} />
        </aside>

        {/* Sidebar (mobile) */}
        <AnimatePresence>
          {open && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed inset-y-0 left-0 top-16 z-40 w-64 border-r border-ink-100 bg-white p-4 lg:hidden"
            >
              <SidebarNav items={navItems} onNavigate={() => setOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function SidebarNav({ items, onNavigate }: { items: typeof NAV; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
            )
          }
        >
          <item.icon className="size-4.5" /> {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

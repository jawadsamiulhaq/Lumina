import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, LogOut, ShieldCheck } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { ChangePasswordCard } from '@/components/account/ChangePasswordCard'
import { useAuthStore } from '@/store/authStore'

export function AccountPage() {
  const { user, isAdmin, logout } = useAuthStore()
  if (!user) return null

  return (
    <>
      <Seo title="My account" />
      <Container className="py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">My account</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-ink-100 p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-14 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white">
                {user.firstName.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-ink-900">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-ink-500">{user.email}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {user.roles.map((r) => (
                <span key={r} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-600">
                  {r === 'Admin' && <ShieldCheck className="size-3.5" />}{r}
                </span>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-6 gap-2" onClick={() => void logout()}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-ink-100 p-6">
            <h2 className="text-lg font-semibold text-ink-900">Quick links</h2>
            <div className="mt-4 space-y-2">
              <Link to="/account/orders" className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4 transition hover:border-ink-200 hover:bg-ink-50">
                <Package className="size-5 text-brand-600" />
                <div>
                  <p className="font-medium text-ink-900">My orders</p>
                  <p className="text-sm text-ink-500">Track and review your purchases</p>
                </div>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4 transition hover:border-ink-200 hover:bg-ink-50">
                  <ShieldCheck className="size-5 text-brand-600" />
                  <div>
                    <p className="font-medium text-ink-900">Admin dashboard</p>
                    <p className="text-sm text-ink-500">Manage products, orders and users</p>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>

          <ChangePasswordCard />
        </div>
      </Container>
    </>
  )
}

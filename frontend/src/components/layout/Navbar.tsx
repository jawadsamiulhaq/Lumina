import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBag, User, Menu, X, LayoutDashboard, LogOut, Package } from 'lucide-react'
import { SearchBar } from '@/components/search/SearchBar'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { useFlyStore } from '@/store/flyStore'
import { useCategories } from '@/hooks/queries'
import { useCanAccessAdmin } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

export function Navbar() {
  const cartBtnRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const { user, status, logout } = useAuthStore()
  const canAccessAdmin = useCanAccessAdmin()
  const count = useCartStore((s) => s.cart?.itemCount ?? 0)
  const bumpKey = useCartStore((s) => s.bumpKey)
  const openCart = useCartStore((s) => s.open)
  const registerCartTarget = useFlyStore((s) => s.registerCartTarget)
  const { data: categories } = useCategories()

  useEffect(() => {
    registerCartTarget(() => cartBtnRef.current?.getBoundingClientRect() ?? null)
    return () => registerCartTarget(null)
  }, [registerCartTarget])

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-ink-900">
          <span className="grid size-8 place-items-center rounded-xl bg-brand-600 text-white">L</span>
          Lumina
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <NavLink to="/products" className={navClass}>
            Shop
          </NavLink>
          {categories?.slice(0, 4).map((c) => (
            <NavLink key={c.id} to={`/products?category=${c.slug}`} className={navClass}>
              {c.name}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 items-center md:flex">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {/* Account */}
          <div className="relative hidden md:block">
            {status === 'authenticated' ? (
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100"
              >
                <User className="size-4" />
                <span className="max-w-24 truncate">{user?.firstName || 'Account'}</span>
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100">
                <User className="size-4" /> Sign in
              </Link>
            )}
            <AnimatePresence>
              {accountOpen && status === 'authenticated' && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-ink-100 bg-white p-1.5 shadow-xl"
                  >
                    <MenuLink to="/account" icon={User} label="My account" onClick={() => setAccountOpen(false)} />
                    <MenuLink to="/account/orders" icon={Package} label="My orders" onClick={() => setAccountOpen(false)} />
                    {canAccessAdmin && (
                      <MenuLink to="/admin" icon={LayoutDashboard} label="Admin dashboard" onClick={() => setAccountOpen(false)} />
                    )}
                    <button
                      onClick={() => {
                        setAccountOpen(false)
                        void logout()
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <button
            ref={cartBtnRef}
            onClick={openCart}
            aria-label="Open cart"
            className="relative grid size-11 place-items-center rounded-full text-ink-700 hover:bg-ink-100"
          >
            <ShoppingBag className="size-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={bumpKey}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: [1.4, 1] }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button onClick={() => setMenuOpen((v) => !v)} className="grid size-11 place-items-center rounded-full text-ink-700 hover:bg-ink-100 lg:hidden">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-ink-100 lg:hidden"
          >
            <div className="space-y-2 px-4 py-4">
              <SearchBar onNavigate={() => setMenuOpen(false)} />
              <div className="flex flex-col">
                <MobileLink to="/products" label="Shop all" onClick={() => setMenuOpen(false)} />
                {categories?.map((c) => (
                  <MobileLink key={c.id} to={`/products?category=${c.slug}`} label={c.name} onClick={() => setMenuOpen(false)} />
                ))}
                <div className="my-2 h-px bg-ink-100" />
                {status === 'authenticated' ? (
                  <>
                    <MobileLink to="/account" label="My account" onClick={() => setMenuOpen(false)} />
                    <MobileLink to="/account/orders" label="My orders" onClick={() => setMenuOpen(false)} />
                    {canAccessAdmin && <MobileLink to="/admin" label="Admin dashboard" onClick={() => setMenuOpen(false)} />}
                    <button onClick={() => { setMenuOpen(false); void logout() }} className="px-1 py-2.5 text-left text-sm font-medium text-accent-500">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <MobileLink to="/login" label="Sign in" onClick={() => setMenuOpen(false)} />
                    <MobileLink to="/register" label="Create account" onClick={() => setMenuOpen(false)} />
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  )
}

function MenuLink({ to, icon: Icon, label, onClick }: { to: string; icon: typeof User; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-100">
      <Icon className="size-4" /> {label}
    </Link>
  )
}

function MobileLink({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link to={to} onClick={onClick} className="px-1 py-2.5 text-sm font-medium text-ink-700">
      {label}
    </Link>
  )
}

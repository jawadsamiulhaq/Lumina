import { Suspense, lazy } from 'react'
import type { ComponentType } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { RequireAuth, RequireAdminArea, RequirePermission } from '@/components/routing/Guards'
import { Spinner } from '@/components/ui/States'
import { PERM } from '@/lib/permissions'
import { HomePage } from '@/pages/HomePage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ProductDetailPage } from '@/pages/ProductDetailPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutSuccessPage, CheckoutCancelPage } from '@/pages/CheckoutResultPages'
import { AccountPage } from '@/pages/AccountPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { OrderDetailPage } from '@/pages/OrderDetailPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Code-split the heavy / role-gated areas so the storefront's initial bundle
// stays lean. Checkout pulls in the large country/state/city dataset, and the
// admin panel is only ever used by admins — neither belongs in the first load.
const CheckoutPage = lazyNamed(() => import('@/pages/CheckoutPage'), 'CheckoutPage')
const AdminLayout = lazyNamed(() => import('@/pages/admin/AdminLayout'), 'AdminLayout')
const AdminOverviewPage = lazyNamed(() => import('@/pages/admin/AdminOverviewPage'), 'AdminOverviewPage')
const AdminProductsPage = lazyNamed(() => import('@/pages/admin/AdminProductsPage'), 'AdminProductsPage')
const AdminProductFormPage = lazyNamed(() => import('@/pages/admin/AdminProductFormPage'), 'AdminProductFormPage')
const AdminCategoriesPage = lazyNamed(() => import('@/pages/admin/AdminCategoriesPage'), 'AdminCategoriesPage')
const AdminCategoryFormPage = lazyNamed(() => import('@/pages/admin/AdminCategoryFormPage'), 'AdminCategoryFormPage')
const AdminOrdersPage = lazyNamed(() => import('@/pages/admin/AdminOrdersPage'), 'AdminOrdersPage')
const AdminOrderDetailPage = lazyNamed(() => import('@/pages/admin/AdminOrderDetailPage'), 'AdminOrderDetailPage')
const AdminUsersPage = lazyNamed(() => import('@/pages/admin/AdminUsersPage'), 'AdminUsersPage')
const AdminUserDetailPage = lazyNamed(() => import('@/pages/admin/AdminUserDetailPage'), 'AdminUserDetailPage')
const AdminEmailTemplatePage = lazyNamed(() => import('@/pages/admin/AdminEmailTemplatePage'), 'AdminEmailTemplatePage')

export function App() {
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Spinner label="Loading…" /></div>}>
      <Routes>
        {/* Storefront */}
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
          <Route path="checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="checkout/cancel" element={<CheckoutCancelPage />} />
          <Route path="account" element={<RequireAuth><AccountPage /></RequireAuth>} />
          <Route path="account/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="account/orders/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Admin */}
        <Route path="admin" element={<RequireAdminArea><AdminLayout /></RequireAdminArea>}>
          <Route index element={<RequirePermission perm={PERM.dashboard}><AdminOverviewPage /></RequirePermission>} />
          <Route path="products" element={<RequirePermission perm={PERM.products}><AdminProductsPage /></RequirePermission>} />
          <Route path="products/new" element={<RequirePermission perm={PERM.products}><AdminProductFormPage /></RequirePermission>} />
          <Route path="products/:id/edit" element={<RequirePermission perm={PERM.products}><AdminProductFormPage /></RequirePermission>} />
          <Route path="categories" element={<RequirePermission perm={PERM.categories}><AdminCategoriesPage /></RequirePermission>} />
          <Route path="categories/new" element={<RequirePermission perm={PERM.categories}><AdminCategoryFormPage /></RequirePermission>} />
          <Route path="categories/:id/edit" element={<RequirePermission perm={PERM.categories}><AdminCategoryFormPage /></RequirePermission>} />
          <Route path="orders" element={<RequirePermission perm={PERM.orders}><AdminOrdersPage /></RequirePermission>} />
          <Route path="orders/:id" element={<RequirePermission perm={PERM.orders}><AdminOrderDetailPage /></RequirePermission>} />
          <Route path="users" element={<RequirePermission perm={PERM.users}><AdminUsersPage /></RequirePermission>} />
          <Route path="users/:id" element={<RequirePermission perm={PERM.users}><AdminUserDetailPage /></RequirePermission>} />
          <Route path="email-templates" element={<RequirePermission perm={PERM.settings}><AdminEmailTemplatePage /></RequirePermission>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

/** React.lazy helper for modules that use named (not default) exports. */
function lazyNamed<T extends Record<string, unknown>, K extends keyof T>(
  factory: () => Promise<T>,
  name: K,
) {
  return lazy(() => factory().then((m) => ({ default: m[name] as ComponentType })))
}

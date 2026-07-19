/** Permission keys, mirroring the backend Permissions constants. */
export const PERM = {
  dashboard: 'dashboard.view',
  products: 'products.manage',
  categories: 'categories.manage',
  orders: 'orders.manage',
  orderStats: 'orders.stats',
  users: 'users.manage',
  settings: 'settings.manage',
} as const

/** Every permission that grants access to some part of the admin area. */
export const ADMIN_PERMISSIONS: string[] = [PERM.dashboard, PERM.products, PERM.categories, PERM.orders, PERM.users, PERM.settings]

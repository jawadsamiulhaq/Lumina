import { api } from '@/lib/api'
import type {
  AdminUser,
  AuthResponse,
  Cart,
  Category,
  CheckoutSession,
  DashboardStats,
  Order,
  OrderListItem,
  OrderStatusCounts,
  OrderStatus,
  PagedResult,
  Permission,
  ProductDetail,
  ProductInput,
  ProductListItem,
  ProductQueryParams,
  Review,
  Role,
  ShippingAddressInput,
  UploadResult,
  User,
} from '@/types/api'

// ---- Auth ----
export const authApi = {
  register: (body: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),
  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),
  refresh: () => api.post<AuthResponse>('/auth/refresh', {}).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
}

// ---- Products ----
export const productsApi = {
  list: (params: ProductQueryParams) =>
    api.get<PagedResult<ProductListItem>>('/products', { params }).then((r) => r.data),
  bySlug: (slug: string) => api.get<ProductDetail>(`/products/${slug}`).then((r) => r.data),
  // admin
  adminList: (params: ProductQueryParams) =>
    api.get<PagedResult<ProductListItem>>('/products/admin', { params }).then((r) => r.data),
  adminGet: (id: number) => api.get<ProductDetail>(`/products/admin/${id}`).then((r) => r.data),
  create: (body: ProductInput) => api.post<ProductDetail>('/products', body).then((r) => r.data),
  update: (id: number, body: ProductInput) =>
    api.put<ProductDetail>(`/products/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/products/${id}`).then((r) => r.data),
}

// ---- Categories ----
export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),
  create: (body: { name: string }) => api.post<Category>('/categories', body).then((r) => r.data),
  update: (id: number, body: { name: string }) =>
    api.put<Category>(`/categories/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/categories/${id}`).then((r) => r.data),
}

// ---- Cart ----
export const cartApi = {
  get: () => api.get<Cart>('/cart').then((r) => r.data),
  add: (productId: number, quantity: number, variantId?: number | null) =>
    api.post<Cart>('/cart/items', { productId, quantity, variantId: variantId ?? null }).then((r) => r.data),
  update: (cartItemId: number, quantity: number) =>
    api.put<Cart>(`/cart/items/${cartItemId}`, { quantity }).then((r) => r.data),
  remove: (cartItemId: number) => api.delete<Cart>(`/cart/items/${cartItemId}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
}

// ---- Orders ----
export const ordersApi = {
  checkout: (shipping: ShippingAddressInput) =>
    api.post<CheckoutSession>('/orders/checkout', { shipping }).then((r) => r.data),
  myOrders: (page = 1, pageSize = 10) =>
    api.get<PagedResult<OrderListItem>>('/orders', { params: { page, pageSize } }).then((r) => r.data),
  myOrder: (id: number) => api.get<Order>(`/orders/${id}`).then((r) => r.data),
  // admin
  adminList: (page = 1, pageSize = 20, status?: OrderStatus) =>
    api.get<PagedResult<OrderListItem>>('/orders/admin', { params: { page, pageSize, status } }).then((r) => r.data),
  adminStats: () => api.get<OrderStatusCounts>('/orders/admin/stats').then((r) => r.data),
  adminGet: (id: number) => api.get<Order>(`/orders/admin/${id}`).then((r) => r.data),
  updateStatus: (id: number, status: OrderStatus) =>
    api.put<Order>(`/orders/admin/${id}/status`, { status }).then((r) => r.data),
}

// ---- Reviews ----
export const reviewsApi = {
  list: (slug: string) => api.get<Review[]>(`/products/${slug}/reviews`).then((r) => r.data),
  create: (slug: string, body: { rating: number; comment: string }) =>
    api.post<Review>(`/products/${slug}/reviews`, body).then((r) => r.data),
}

// ---- Admin: users + dashboard ----
export interface CreateUserBody {
  firstName: string
  lastName: string
  email: string
  password: string
  roles: string[]
}
export interface UpdateUserBody {
  firstName: string
  lastName: string
  email: string
  roles: string[]
}

export const adminApi = {
  users: () => api.get<AdminUser[]>('/admin/users').then((r) => r.data),
  createUser: (body: CreateUserBody) => api.post<AdminUser>('/admin/users', body).then((r) => r.data),
  updateUser: (id: string, body: UpdateUserBody) => api.put<AdminUser>(`/admin/users/${id}`, body).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  setRole: (id: string, isAdmin: boolean) =>
    api.put<AdminUser>(`/admin/users/${id}/role`, { isAdmin }).then((r) => r.data),
  setUserRoles: (id: string, roles: string[]) =>
    api.put<AdminUser>(`/admin/users/${id}/roles`, { roles }).then((r) => r.data),
  lockUser: (id: string, minutes: number) =>
    api.post<AdminUser>(`/admin/users/${id}/lock`, { minutes }).then((r) => r.data),
  unlockUser: (id: string) => api.post<AdminUser>(`/admin/users/${id}/unlock`).then((r) => r.data),
  dashboard: () => api.get<DashboardStats>('/admin/dashboard').then((r) => r.data),
}

// ---- Admin: roles + permissions (RBAC) ----
export const rolesApi = {
  list: () => api.get<Role[]>('/admin/roles').then((r) => r.data),
  permissions: () => api.get<Permission[]>('/admin/permissions').then((r) => r.data),
  create: (name: string) => api.post<Role>('/admin/roles', { name }).then((r) => r.data),
  update: (id: string, name: string) => api.put<Role>(`/admin/roles/${id}`, { name }).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/roles/${id}`).then((r) => r.data),
  setPermissions: (id: string, permissions: string[]) =>
    api.put<Role>(`/admin/roles/${id}/permissions`, { permissions }).then((r) => r.data),
}

// ---- Uploads ----
export const uploadsApi = {
  image: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<UploadResult>('/uploads/image', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data)
  },
}

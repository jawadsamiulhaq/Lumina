export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  productCount: number
}

export interface ProductImage {
  id: number
  url: string
  altText: string | null
  sortOrder: number
  isPrimary: boolean
}

export interface ProductListItem {
  id: number
  name: string
  slug: string
  priceInCents: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  categoryName: string
  categorySlug: string
  primaryImageUrl: string | null
  averageRating: number
  reviewCount: number
  hasVariants: boolean
}

export interface ProductOptionValue {
  id: number
  value: string
  imageUrl: string | null
}

export interface ProductOption {
  id: number
  name: string
  values: ProductOptionValue[]
}

export interface ProductVariant {
  id: number
  sku: string | null
  priceInCents: number
  priceOverrideInCents: number | null
  stock: number
  isActive: boolean
  optionValueIds: number[]
  description: string
}

export interface ProductDetail {
  id: number
  name: string
  slug: string
  description: string
  priceInCents: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  categoryId: number
  categoryName: string
  categorySlug: string
  images: ProductImage[]
  averageRating: number
  reviewCount: number
  createdAt: string
  hasVariants: boolean
  options: ProductOption[]
  variants: ProductVariant[]
}

export type ProductSort = 'Newest' | 'PriceAsc' | 'PriceDesc' | 'NameAsc' | 'TopRated'

export interface ProductQueryParams {
  search?: string
  categorySlug?: string
  minPriceCents?: number
  maxPriceCents?: number
  sort?: ProductSort
  featuredOnly?: boolean
  page?: number
  pageSize?: number
}

export interface CartItem {
  id: number
  productId: number
  name: string
  slug: string
  unitPriceInCents: number
  quantity: number
  stock: number
  imageUrl: string | null
  lineTotalInCents: number
  variantId: number | null
  variantLabel: string | null
}

export interface Cart {
  items: CartItem[]
  subtotalInCents: number
  itemCount: number
}

export type OrderStatus = 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled'

export interface OrderItem {
  productName: string
  productSlug: string | null
  imageUrl: string | null
  unitPriceInCents: number
  quantity: number
  lineTotalInCents: number
}

export interface OrderTimeline {
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}

export interface Order {
  id: number
  status: OrderStatus
  totalInCents: number
  email: string
  shippingFullName: string
  shippingLine1: string
  shippingLine2: string | null
  shippingCity: string
  shippingState: string | null
  shippingPostalCode: string
  shippingCountry: string
  timeline: OrderTimeline
  items: OrderItem[]
  createdAt: string
}

export interface OrderListItem {
  id: number
  status: OrderStatus
  totalInCents: number
  itemCount: number
  email: string
  createdAt: string
}

export interface OrderStatusCounts {
  pending: number
  paid: number
  shipped: number
  delivered: number
  cancelled: number
  total: number
}

export interface Review {
  id: number
  rating: number
  comment: string
  userName: string
  createdAt: string
}

export interface ShippingAddressInput {
  email: string
  fullName: string
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface CheckoutSession {
  sessionId: string
  url: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  permissions: string[]
}

export interface AuthResponse {
  accessToken: string
  accessTokenExpiresAt: string
  user: User
  isImpersonating: boolean
  impersonatorName: string | null
}

export interface ProductImageInput {
  url: string
  altText?: string | null
  sortOrder: number
  isPrimary: boolean
}

export interface ProductOptionValueInput {
  value: string
  imageUrl?: string | null
}

export interface ProductOptionInput {
  name: string
  values: ProductOptionValueInput[]
}

export interface ProductVariantValueInput {
  optionName: string
  value: string
}

export interface ProductVariantInput {
  sku?: string | null
  priceInCents?: number | null
  stock: number
  isActive: boolean
  values: ProductVariantValueInput[]
}

export interface ProductInput {
  name: string
  description: string
  priceInCents: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  categoryId: number
  images: ProductImageInput[]
  options: ProductOptionInput[]
  variants: ProductVariantInput[]
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
  createdAt: string
  isLocked: boolean
  lockedUntil: string | null
}

export interface AdminResetPasswordResult {
  email: string
  temporaryPassword: string
}

export interface Role {
  id: string
  name: string
  isSystem: boolean
  permissions: string[]
  memberCount: number
}

export interface Permission {
  name: string
  description: string
}

export interface LowStockProduct {
  id: number
  name: string
  slug: string
  stock: number
}

export interface DashboardStats {
  totalRevenueInCents: number
  paidOrderCount: number
  totalOrderCount: number
  pendingOrderCount: number
  productCount: number
  lowStockCount: number
  lowStockProducts: LowStockProduct[]
  recentOrders: OrderListItem[]
}

export interface UploadResult {
  url: string
  fileName: string
  sizeBytes: number
}

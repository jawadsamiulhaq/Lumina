import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { categoriesApi, offersApi, ordersApi, productsApi, reviewsApi, adminApi, rolesApi } from '@/api/services'
import type { OrderStatus, ProductQueryParams } from '@/types/api'

export const queryKeys = {
  products: (params: ProductQueryParams) => ['products', params] as const,
  product: (slug: string) => ['product', slug] as const,
  categories: ['categories'] as const,
  offers: ['offers'] as const,
  adminOffers: ['admin-offers'] as const,
  adminOffer: (id: number) => ['admin-offer', id] as const,
  reviews: (slug: string) => ['reviews', slug] as const,
  myOrders: (page: number) => ['my-orders', page] as const,
  myOrder: (id: number) => ['my-order', id] as const,
  adminOrders: (page: number, status?: OrderStatus) => ['admin-orders', page, status] as const,
  adminOrder: (id: number) => ['admin-order', id] as const,
  adminOrderStats: ['admin-order-stats'] as const,
  adminProducts: (params: ProductQueryParams) => ['admin-products', params] as const,
  adminUsers: ['admin-users'] as const,
  roles: ['admin-roles'] as const,
  permissions: ['admin-permissions'] as const,
  dashboard: ['dashboard'] as const,
}

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
  })
}

/**
 * Live product suggestions for the search typeahead. Kept intentionally small
 * (few results) and only fires once the term is meaningful, so it stays snappy
 * even when many products share a prefix (e.g. everything starting with "ho…").
 */
export function useProductSearch(term: string, limit = 6) {
  const query = term.trim()
  return useQuery({
    queryKey: ['product-search', query, limit] as const,
    queryFn: () => productsApi.list({ search: query, page: 1, pageSize: limit, sort: 'NameAsc' }),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => productsApi.bySlug(slug),
    enabled: !!slug,
  })
}

export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.list, staleTime: 5 * 60 * 1000 })
}

export function useOffers() {
  return useQuery({ queryKey: queryKeys.offers, queryFn: offersApi.list, staleTime: 60 * 1000 })
}

export function useAdminOffers() {
  return useQuery({ queryKey: queryKeys.adminOffers, queryFn: offersApi.adminList })
}

export function useAdminOffer(id: number) {
  return useQuery({ queryKey: queryKeys.adminOffer(id), queryFn: () => offersApi.adminGet(id), enabled: id > 0 })
}

export function useReviews(slug: string) {
  return useQuery({ queryKey: queryKeys.reviews(slug), queryFn: () => reviewsApi.list(slug), enabled: !!slug })
}

export function useMyOrders(page: number) {
  return useQuery({
    queryKey: queryKeys.myOrders(page),
    queryFn: () => ordersApi.myOrders(page),
    placeholderData: keepPreviousData,
  })
}

export function useMyOrder(id: number) {
  return useQuery({ queryKey: queryKeys.myOrder(id), queryFn: () => ordersApi.myOrder(id), enabled: id > 0 })
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: adminApi.dashboard })
}

export function useAdminUsers() {
  return useQuery({ queryKey: queryKeys.adminUsers, queryFn: adminApi.users })
}

export function useRoles() {
  return useQuery({ queryKey: queryKeys.roles, queryFn: rolesApi.list })
}

export function usePermissions() {
  return useQuery({ queryKey: queryKeys.permissions, queryFn: rolesApi.permissions, staleTime: 10 * 60 * 1000 })
}

export function useAdminProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: queryKeys.adminProducts(params),
    queryFn: () => productsApi.adminList(params),
    placeholderData: keepPreviousData,
  })
}

export function useAdminOrders(page: number, status?: OrderStatus) {
  return useQuery({
    queryKey: queryKeys.adminOrders(page, status),
    queryFn: () => ordersApi.adminList(page, 20, status),
    placeholderData: keepPreviousData,
  })
}

export function useAdminOrder(id: number) {
  return useQuery({ queryKey: queryKeys.adminOrder(id), queryFn: () => ordersApi.adminGet(id), enabled: id > 0 })
}

export function useAdminOrderStats(enabled = true) {
  return useQuery({ queryKey: queryKeys.adminOrderStats, queryFn: ordersApi.adminStats, enabled })
}

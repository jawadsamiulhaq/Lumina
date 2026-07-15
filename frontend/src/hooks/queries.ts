import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { categoriesApi, ordersApi, productsApi, reviewsApi, adminApi } from '@/api/services'
import type { OrderStatus, ProductQueryParams } from '@/types/api'

export const queryKeys = {
  products: (params: ProductQueryParams) => ['products', params] as const,
  product: (slug: string) => ['product', slug] as const,
  categories: ['categories'] as const,
  reviews: (slug: string) => ['reviews', slug] as const,
  myOrders: (page: number) => ['my-orders', page] as const,
  myOrder: (id: number) => ['my-order', id] as const,
  adminOrders: (page: number, status?: OrderStatus) => ['admin-orders', page, status] as const,
  adminOrder: (id: number) => ['admin-order', id] as const,
  adminProducts: (params: ProductQueryParams) => ['admin-products', params] as const,
  adminUsers: ['admin-users'] as const,
  dashboard: ['dashboard'] as const,
}

export function useProducts(params: ProductQueryParams) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productsApi.list(params),
    placeholderData: keepPreviousData,
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

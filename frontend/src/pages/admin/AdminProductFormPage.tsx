import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, TextArea, Select } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/States'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { VariantEditor, variantKey, type OptionDraft, type VariantDraft, type ComboPart } from '@/components/admin/VariantEditor'
import { productsApi, categoriesApi } from '@/api/services'
import type { ProductImageInput, ProductInput } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  priceDollars: z.coerce.number().positive('Price must be greater than 0'),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  categoryId: z.coerce.number().int().positive('Choose a category'),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
})
type FormValues = z.input<typeof schema>

export function AdminProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const productId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [images, setImages] = useState<ProductImageInput[]>([])
  const [options, setOptions] = useState<OptionDraft[]>([])
  const [variants, setVariants] = useState<VariantDraft[]>([])

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => productsApi.adminGet(productId),
    enabled: isEdit,
  })

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, isFeatured: false, stock: 0 },
  })
  const basePriceCents = Math.round(Number(watch('priceDollars') || 0) * 100)

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        priceDollars: product.priceInCents / 100,
        stock: product.stock,
        categoryId: product.categoryId,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      })
      setImages(product.images.map((i) => ({ url: i.url, altText: i.altText, sortOrder: i.sortOrder, isPrimary: i.isPrimary })))

      setOptions(product.options.map((o) => ({ name: o.name, values: o.values.map((v) => v.value) })))
      const valueMap = new Map<number, ComboPart>()
      product.options.forEach((o) => o.values.forEach((v) => valueMap.set(v.id, { optionName: o.name, value: v.value })))
      setVariants(
        product.variants.map((v) => {
          const combo = v.optionValueIds.map((id) => valueMap.get(id)).filter((c): c is ComboPart => Boolean(c))
          return { key: variantKey(combo), combo, stock: v.stock, priceInCents: v.priceOverrideInCents, sku: v.sku ?? '', isActive: v.isActive }
        }),
      )
    }
  }, [product, reset])

  const mutation = useMutation({
    mutationFn: (body: ProductInput) => (isEdit ? productsApi.update(productId, body) : productsApi.create(body)),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated.' : 'Product created.')
      void qc.invalidateQueries({ queryKey: ['admin-products'] })
      navigate('/admin/products')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save product.')),
  })

  function onSubmit(values: FormValues) {
    const body: ProductInput = {
      name: values.name,
      description: values.description,
      priceInCents: Math.round(Number(values.priceDollars) * 100),
      stock: Number(values.stock),
      categoryId: Number(values.categoryId),
      isActive: values.isActive,
      isFeatured: values.isFeatured,
      images: images.map((img, i) => ({ ...img, sortOrder: i })),
      options: options
        .filter((o) => o.name.trim() && o.values.some((v) => v.trim()))
        .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) })),
      variants: variants.map((v) => ({
        sku: v.sku.trim() || null,
        priceInCents: v.priceInCents,
        stock: v.stock,
        isActive: v.isActive,
        values: v.combo.map((c) => ({ optionName: c.optionName, value: c.value })),
      })),
    }
    mutation.mutate(body)
  }

  if (isEdit && loadingProduct) return <Spinner label="Loading product…" />

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin/products" className="mb-5 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">{isEdit ? 'Edit product' : 'New product'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 space-y-4">
          <Field label="Name" error={errors.name?.message}><Input {...register('name')} placeholder="Product name" /></Field>
          <Field label="Description" error={errors.description?.message}>
            <TextArea rows={5} {...register('description')} placeholder="Describe the product…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (USD)" error={errors.priceDollars?.message}>
              <Input type="number" step="0.01" min="0" {...register('priceDollars')} placeholder="0.00" />
            </Field>
            <Field label="Stock" error={errors.stock?.message}>
              <Input type="number" min="0" {...register('stock')} placeholder="0" />
            </Field>
            <Field label="Category" error={errors.categoryId?.message}>
              <Select {...register('categoryId')} defaultValue="">
                <option value="" disabled>Select…</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" {...register('isActive')} className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400" /> Active (visible in store)
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" {...register('isFeatured')} className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400" /> Featured on homepage
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <h2 className="mb-4 font-semibold text-ink-900">Images</h2>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <VariantEditor
            options={options}
            variants={variants}
            basePriceCents={basePriceCents}
            onOptionsChange={setOptions}
            onVariantsChange={setVariants}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/admin/products"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Create product'}</Button>
        </div>
      </form>
    </div>
  )
}

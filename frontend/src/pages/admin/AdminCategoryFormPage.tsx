import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/States'
import { categoriesApi } from '@/api/services'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
})
type FormValues = z.infer<typeof schema>

export function AdminCategoryFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const categoryId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Categories has no single-get endpoint; read the cached list and find by id.
  const { data: categories, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list })
  const category = isEdit ? categories?.find((c) => c.id === categoryId) : undefined

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (category) reset({ name: category.name })
  }, [category, reset])

  const mutation = useMutation({
    mutationFn: (body: { name: string }) =>
      isEdit ? categoriesApi.update(categoryId, body) : categoriesApi.create(body),
    onSuccess: () => {
      toast.success(isEdit ? 'Category updated.' : 'Category created.')
      void qc.invalidateQueries({ queryKey: ['categories'] })
      navigate('/admin/categories')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save category.')),
  })

  function onSubmit(values: FormValues) {
    mutation.mutate({ name: values.name.trim() })
  }

  if (isEdit && isLoading) return <Spinner label="Loading category…" />

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/admin/categories" className="mb-5 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to categories
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">{isEdit ? 'Edit category' : 'New category'}</h1>
      <p className="mt-1 text-sm text-ink-500">The URL slug is generated automatically from the name.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="rounded-2xl border border-ink-100 bg-white p-6">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="e.g. Home & Kitchen" autoFocus />
          </Field>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/admin/categories"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Create category'}</Button>
        </div>
      </form>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, UploadCloud, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/States'
import { offersApi, uploadsApi } from '@/api/services'
import { useAdminOffer, queryKeys } from '@/hooks/queries'
import type { OfferInput } from '@/types/api'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'

const schema = z
  .object({
    title: z.string().min(1, 'Title is required').max(160),
    subtitle: z.string().max(300).optional(),
    discountLabel: z.string().max(40).optional(),
    ctaText: z.string().min(1, 'Button text is required').max(60),
    ctaUrl: z.string().min(1, 'Button link is required').max(500),
    startsAt: z.string().min(1, 'Start time is required'),
    endsAt: z.string().min(1, 'End time is required'),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), { path: ['endsAt'], message: 'End time must be after the start time' })
type FormValues = z.infer<typeof schema>

// datetime-local <-> ISO(UTC) conversions
function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function nowPlus(days: number): string {
  return toLocalInput(new Date(Date.now() + days * 86_400_000).toISOString())
}

export function AdminOfferFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const offerId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: offer, isLoading } = useAdminOffer(isEdit ? offerId : 0)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', subtitle: '', discountLabel: '', ctaText: 'Shop now', ctaUrl: '/products',
      startsAt: nowPlus(0), endsAt: nowPlus(7), isActive: true, sortOrder: 0,
    },
  })

  useEffect(() => {
    if (offer) {
      reset({
        title: offer.title,
        subtitle: offer.subtitle ?? '',
        discountLabel: offer.discountLabel ?? '',
        ctaText: offer.ctaText,
        ctaUrl: offer.ctaUrl,
        startsAt: toLocalInput(offer.startsAt),
        endsAt: toLocalInput(offer.endsAt),
        isActive: offer.isActive,
        sortOrder: offer.sortOrder,
      })
      setImageUrl(offer.imageUrl)
    }
  }, [offer, reset])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const result = await uploadsApi.image(file)
      setImageUrl(result.url)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: (body: OfferInput) => (isEdit ? offersApi.update(offerId, body) : offersApi.create(body)),
    onSuccess: () => {
      toast.success(isEdit ? 'Offer updated.' : 'Offer created.')
      void qc.invalidateQueries({ queryKey: queryKeys.adminOffers })
      void qc.invalidateQueries({ queryKey: queryKeys.offers })
      navigate('/admin/offers')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not save offer.')),
  })

  function onSubmit(values: FormValues) {
    mutation.mutate({
      title: values.title.trim(),
      subtitle: values.subtitle?.trim() || null,
      discountLabel: values.discountLabel?.trim() || null,
      imageUrl,
      ctaText: values.ctaText.trim(),
      ctaUrl: values.ctaUrl.trim(),
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      isActive: values.isActive,
      sortOrder: values.sortOrder,
    })
  }

  if (isEdit && isLoading) return <Spinner label="Loading offer…" />

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/admin/offers" className="mb-5 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to offers
      </Link>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">{isEdit ? 'Edit offer' : 'New offer'}</h1>
      <p className="mt-1 text-sm text-ink-500">Time-limited promotion with a live countdown on the home page.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6">
          <Field label="Title" error={errors.title?.message}>
            <Input {...register('title')} placeholder="e.g. Summer Sale" autoFocus />
          </Field>
          <Field label="Subtitle" error={errors.subtitle?.message} hint="Optional supporting line.">
            <Input {...register('subtitle')} placeholder="e.g. Up to 30% off selected items" />
          </Field>
          <Field label="Discount badge" error={errors.discountLabel?.message} hint="Optional short badge, e.g. “30% OFF”.">
            <Input {...register('discountLabel')} placeholder="30% OFF" />
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Banner image</span>
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-ink-100">
                <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
                <button type="button" onClick={() => setImageUrl(null)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-accent-500 shadow hover:bg-white">
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 p-6 text-center transition hover:border-ink-300 hover:bg-ink-50">
                {uploading ? <Loader2 className="size-6 animate-spin text-brand-500" /> : <UploadCloud className="size-6 text-ink-400" />}
                <span className="text-sm font-medium text-ink-700">Click to upload a banner (optional)</span>
                <span className="text-xs text-ink-400">PNG, JPG, WEBP up to 5MB</span>
                <input type="file" accept="image/*" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
              </label>
            )}
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-6 sm:grid-cols-2">
          <Field label="Starts at" error={errors.startsAt?.message}>
            <Input type="datetime-local" {...register('startsAt')} />
          </Field>
          <Field label="Ends at" error={errors.endsAt?.message}>
            <Input type="datetime-local" {...register('endsAt')} />
          </Field>
        </div>

        <div className="grid gap-4 rounded-2xl border border-ink-100 bg-white p-6 sm:grid-cols-2">
          <Field label="Button text" error={errors.ctaText?.message}>
            <Input {...register('ctaText')} placeholder="Shop now" />
          </Field>
          <Field label="Button link" error={errors.ctaUrl?.message} hint="e.g. /products or /products?category=shoes">
            <Input {...register('ctaUrl')} placeholder="/products" />
          </Field>
          <Field label="Display order" error={errors.sortOrder?.message} hint="Lower shows first.">
            <Input type="number" min={0} {...register('sortOrder', { valueAsNumber: true })} />
          </Field>
          <label className="flex items-center gap-3 self-end rounded-xl border border-ink-200 px-4 py-2.5">
            <input type="checkbox" {...register('isActive')} className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200" />
            <span className="text-sm font-medium text-ink-900">Active</span>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/admin/offers"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Create offer'}</Button>
        </div>
      </form>
    </div>
  )
}

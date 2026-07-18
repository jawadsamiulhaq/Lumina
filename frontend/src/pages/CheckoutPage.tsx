import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, ShoppingBag } from 'lucide-react'
import { Country, State, City } from 'country-state-city'
import { Seo } from '@/components/Seo'
import { Container } from '@/components/Container'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/States'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersApi } from '@/api/services'
import { formatPrice } from '@/lib/format'
import { getApiErrorMessage } from '@/lib/api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  fullName: z.string().min(1, 'Full name is required'),
  line1: z.string().min(1, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
})
type FormValues = z.infer<typeof schema>

export function CheckoutPage() {
  const cart = useCartStore((s) => s.cart)
  const user = useAuthStore((s) => s.user)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const items = cart?.items ?? []

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: user?.email ?? '',
      fullName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      city: '',
      state: '',
      country: 'United States',
    },
  })

  // Cascading location selects: Country -> State/Province -> City.
  // We keep ISO codes locally for the cascade, but store readable names in the form.
  const countries = useMemo(() => Country.getAllCountries(), [])
  const [countryCode, setCountryCode] = useState('US')
  const [stateCode, setStateCode] = useState('')
  const states = useMemo(() => State.getStatesOfCountry(countryCode), [countryCode])
  const cities = useMemo(() => {
    // Prefer cities of the chosen state; if the country has no states at all,
    // fall back to every city in the country so the dropdown still populates.
    if (stateCode) return City.getCitiesOfState(countryCode, stateCode)
    if (states.length === 0) return City.getCitiesOfCountry(countryCode) ?? []
    return []
  }, [countryCode, stateCode, states.length])
  const cityValue = watch('city')

  function handleCountryChange(code: string) {
    setCountryCode(code)
    setStateCode('')
    setValue('country', countries.find((c) => c.isoCode === code)?.name ?? '', { shouldValidate: true })
    setValue('state', '')
    setValue('city', '', { shouldValidate: true })
  }

  function handleStateChange(code: string) {
    setStateCode(code)
    setValue('state', states.find((s) => s.isoCode === code)?.name ?? '')
    setValue('city', '', { shouldValidate: true })
  }

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setSubmitting(true)
    try {
      const session = await ordersApi.checkout(values)
      window.location.assign(session.url) // redirect to Stripe Checkout
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Could not start checkout.'))
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <Container className="py-16">
        <Seo title="Checkout" />
        <EmptyState
          icon={<ShoppingBag className="size-7" />}
          title="Your cart is empty"
          description="Add items before checking out."
          action={<Link to="/products"><Button>Browse products</Button></Link>}
        />
      </Container>
    )
  }

  return (
    <>
      <Seo title="Checkout" />
      <Container className="py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Checkout</h1>

        {serverError && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-ink-900">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Full name" error={errors.fullName?.message}><Input {...register('fullName')} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Address" error={errors.line1?.message}><Input {...register('line1')} /></Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Apartment, suite (optional)" error={errors.line2?.message}><Input {...register('line2')} /></Field>
              </div>
              <Field label="Country" error={errors.country?.message}>
                <Select value={countryCode} onChange={(e) => handleCountryChange(e.target.value)}>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="State / Province" error={errors.state?.message}>
                {states.length > 0 ? (
                  <Select value={stateCode} onChange={(e) => handleStateChange(e.target.value)}>
                    <option value="">Select state / province</option>
                    {states.map((s) => (
                      <option key={s.isoCode} value={s.isoCode}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input {...register('state')} placeholder="State / Province" />
                )}
              </Field>
              <Field label="City" error={errors.city?.message}>
                {cities.length > 0 ? (
                  <Select value={cityValue} onChange={(e) => setValue('city', e.target.value, { shouldValidate: true })}>
                    <option value="">Select city</option>
                    {cities.map((c, i) => (
                      <option key={`${c.name}-${i}`} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input {...register('city')} placeholder="City" />
                )}
              </Field>
              <Field label="Postal code" error={errors.postalCode?.message}><Input {...register('postalCode')} /></Field>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-ink-100 bg-ink-50/50 p-6">
            <h2 className="text-lg font-bold text-ink-900">Order summary</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                    <img src={item.imageUrl ?? ''} alt="" className="size-full object-cover" />
                    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-ink-900 text-[10px] font-bold text-white">{item.quantity}</span>
                  </div>
                  <span className="line-clamp-1 flex-1 text-sm text-ink-700">{item.name}</span>
                  <span className="text-sm font-medium text-ink-900">{formatPrice(item.lineTotalInCents)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-ink-200 pt-4">
              <span className="font-bold text-ink-900">Total</span>
              <span className="text-xl font-bold text-ink-900">{formatPrice(cart?.subtotalInCents ?? 0)}</span>
            </div>
            <Button type="submit" className="mt-6 w-full gap-2" size="lg" loading={submitting}>
              <Lock className="size-4" /> Pay with Stripe
            </Button>
            <p className="mt-3 text-center text-xs text-ink-400">Test mode — use card 4242 4242 4242 4242.</p>
          </aside>
        </form>
      </Container>
    </>
  )
}

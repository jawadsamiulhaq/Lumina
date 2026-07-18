import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useCartStore } from '@/store/cartStore'
import { getApiErrorMessage } from '@/lib/api'
import { passwordSchema } from '@/lib/validation'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema,
})
type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const registerUser = useAuthStore((s) => s.register)
  const refreshCart = useCartStore((s) => s.refresh)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await registerUser(values)
      await refreshCart()
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Could not create account.'))
    }
  }

  return (
    <>
      <Seo title="Create account" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full rounded-3xl border border-ink-100 bg-white p-8 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-ink-900">Create your account</h1>
          <p className="mt-1 text-sm text-ink-500">Join Lumina in a few seconds.</p>

          {serverError && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">{serverError}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" error={errors.firstName?.message}>
                <Input autoComplete="given-name" {...register('firstName')} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <Input autoComplete="family-name" {...register('lastName')} />
              </Field>
            </div>
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
            </Field>
            <Field label="Password" error={errors.password?.message} hint="8+ chars with upper, lower and a number">
              <Input type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { MailCheck } from 'lucide-react'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { authApi } from '@/api/services'
import { getApiErrorMessage } from '@/lib/api'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await authApi.forgotPassword(values.email)
      setSent(true)
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
    }
  }

  return (
    <>
      <Seo title="Forgot password" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full rounded-3xl border border-ink-100 bg-white p-8 shadow-sm"
        >
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MailCheck className="size-7" />
              </div>
              <h1 className="text-2xl font-bold text-ink-900">Check your email</h1>
              <p className="mt-2 text-sm text-ink-500">
                If an account exists for <span className="font-medium text-ink-700">{getValues('email')}</span>, we've sent a link to reset your password.
              </p>
              <Link to="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-ink-900">Forgot your password?</h1>
              <p className="mt-1 text-sm text-ink-500">Enter your email and we'll send you a reset link.</p>

              {serverError && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">{serverError}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <Field label="Email" error={errors.email?.message}>
                  <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
                </Field>
                <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                  Send reset link
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-500">
                Remembered it?{' '}
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Sign in</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </>
  )
}

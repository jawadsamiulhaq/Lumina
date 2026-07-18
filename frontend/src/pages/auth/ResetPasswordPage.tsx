import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Seo } from '@/components/Seo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { authApi } from '@/api/services'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'
import { passwordSchema } from '@/lib/validation'

const schema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const invalidLink = !email || !token

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await authApi.resetPassword({ email, token, newPassword: values.password })
      toast.success('Password updated. You can now sign in.')
      navigate('/login', { replace: true })
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'This reset link is invalid or has expired.'))
    }
  }

  return (
    <>
      <Seo title="Reset password" />
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-md place-items-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full rounded-3xl border border-ink-100 bg-white p-8 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-ink-900">Set a new password</h1>
          <p className="mt-1 text-sm text-ink-500">
            {invalidLink ? 'This reset link looks incomplete.' : `For ${email}`}
          </p>

          {invalidLink ? (
            <div className="mt-6">
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">
                The link is missing information. Please request a new reset link.
              </p>
              <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">{serverError}</div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <Field label="New password" error={errors.password?.message} hint="At least 8 characters, with upper, lower and a digit.">
                  <Input type="password" autoComplete="new-password" placeholder="••••••••" {...register('password')} />
                </Field>
                <Field label="Confirm password" error={errors.confirm?.message}>
                  <Input type="password" autoComplete="new-password" placeholder="••••••••" {...register('confirm')} />
                </Field>
                <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
                  Update password
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-ink-500">
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">Back to sign in</Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </>
  )
}

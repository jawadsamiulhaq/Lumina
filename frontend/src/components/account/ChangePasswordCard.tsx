import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { authApi } from '@/api/services'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'
import { passwordSchema } from '@/lib/validation'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' })
type FormValues = z.infer<typeof schema>

export function ChangePasswordCard() {
  const [open, setOpen] = useState(false)

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-ink-100 p-6 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <KeyRound className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Password</h2>
            <p className="text-sm text-ink-500">Change the password you use to sign in.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setOpen(true)}>Change password</Button>
      </div>

      {open && <ChangePasswordModal onClose={() => setOpen(false)} />}
    </motion.div>
  )
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) => authApi.changePassword(body),
    onSuccess: () => { toast.success('Password changed.'); onClose() },
    onError: (e) => setServerError(getApiErrorMessage(e)),
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    mutation.mutate({ currentPassword: values.currentPassword, newPassword: values.newPassword })
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Change password"
      description="Enter your current password, then choose a new one."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={mutation.isPending} onClick={handleSubmit(onSubmit)}>Update password</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-accent-500">{serverError}</div>}
        <Field label="Current password" error={errors.currentPassword?.message}>
          <Input type="password" autoComplete="current-password" {...register('currentPassword')} />
        </Field>
        <Field label="New password" error={errors.newPassword?.message} hint="At least 8 characters, with upper, lower and a digit.">
          <Input type="password" autoComplete="new-password" {...register('newPassword')} />
        </Field>
        <Field label="Confirm new password" error={errors.confirm?.message}>
          <Input type="password" autoComplete="new-password" {...register('confirm')} />
        </Field>
        {/* Hidden submit so Enter submits the form */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}

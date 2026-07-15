import { forwardRef } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const base =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 ' +
  'transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:opacity-60'

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm font-medium text-ink-700">{label}</span>}
      {children}
      {error ? (
        <span className="block text-xs font-medium text-accent-500">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-ink-400">{hint}</span>
      ) : null}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, className)} {...props} />
  },
)

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(base, 'min-h-24 resize-y', className)} {...props} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(base, 'appearance-none bg-white pr-9', className)} {...props}>
        {children}
      </select>
    )
  },
)

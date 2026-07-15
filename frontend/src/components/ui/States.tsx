import type { ReactNode } from 'react'
import { Loader2, PackageOpen, AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-400">
      <Loader2 className="size-7 animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-ink-50 text-ink-400">
        {icon ?? <PackageOpen className="size-7" />}
      </div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-red-50 text-accent-500">
        <AlertTriangle className="size-7" />
      </div>
      <h3 className="text-lg font-semibold text-ink-900">Something went wrong</h3>
      <p className="max-w-sm text-sm text-ink-500">{message ?? 'Please try again in a moment.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Retry
        </Button>
      )}
    </div>
  )
}

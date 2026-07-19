import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { RotateCcw, Save, Mail, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, TextArea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner, ErrorState } from '@/components/ui/States'
import { emailTemplatesApi } from '@/api/services'
import { getApiErrorMessage } from '@/lib/api'
import { toast } from '@/store/toastStore'
import { formatDateTime } from '@/lib/format'

const KEY = 'password-reset'

// Sample values used only to render the live preview.
const SAMPLE: Record<string, string> = {
  firstName: 'Alex',
  resetLink: 'https://your-store.com/reset-password?email=alex%40example.com&token=sample-token',
}

function render(html: string, values: Record<string, string>) {
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, name: string) => values[name] ?? `{{${name}}}`)
}

export function AdminEmailTemplatePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['email-template', KEY],
    queryFn: () => emailTemplatesApi.get(KEY),
  })

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  // Seed the form once the template loads (or after a save/reset returns fresh data).
  useEffect(() => {
    if (data) { setSubject(data.subject); setBody(data.htmlBody) }
  }, [data])

  const saveMut = useMutation({
    mutationFn: () => emailTemplatesApi.update(KEY, { subject, htmlBody: body }),
    onSuccess: (t) => { setSubject(t.subject); setBody(t.htmlBody); toast.success('Template saved.') },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })
  const resetMut = useMutation({
    mutationFn: () => emailTemplatesApi.reset(KEY),
    onSuccess: (t) => { setSubject(t.subject); setBody(t.htmlBody); setConfirmReset(false); toast.success('Reset to default.') },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  })

  const previewDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset="utf-8"><style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.6;padding:20px;margin:0}
        a{color:#4f46e5}
      </style></head><body>${render(body, SAMPLE)}</body></html>`,
    [body],
  )

  const missingRequired = data ? data.placeholders.includes('resetLink') && !/\{\{\s*resetLink\s*\}\}/.test(body) : false
  const dirty = !!data && (subject !== data.subject || body !== data.htmlBody)

  if (isLoading) return <Spinner label="Loading template…" />
  if (isError || !data) return <ErrorState message={getApiErrorMessage(error)} onRetry={() => void refetch()} />

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink-900">
            <Mail className="size-6 text-brand-600" /> Email templates
          </h1>
          <p className="mt-1 text-sm text-ink-500">{data.name} · last updated {formatDateTime(data.updatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(true)} className="gap-2">
            <RotateCcw className="size-4" /> Reset to default
          </Button>
          <Button onClick={() => saveMut.mutate()} loading={saveMut.isPending} disabled={!dirty || missingRequired} className="gap-2">
            <Save className="size-4" /> Save
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-ink-100 bg-ink-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Available placeholders</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {data.placeholders.map((p) => (
            <code key={p} className="rounded-md bg-white px-2 py-1 text-xs font-medium text-brand-700 ring-1 ring-ink-200">{`{{${p}}}`}</code>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink-500">Insert these anywhere in the subject or body — they're replaced with real values when the email is sent.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Body (HTML)" error={missingRequired ? 'The body must include {{resetLink}} so users can reset.' : undefined}>
            <TextArea value={body} onChange={(e) => setBody(e.target.value)} rows={16} className="font-mono text-sm" />
          </Field>
          {missingRequired && (
            <p className="flex items-center gap-1.5 text-sm text-accent-500">
              <AlertTriangle className="size-4" /> Add the reset link back before saving.
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-900">Live preview</p>
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div className="border-b border-ink-100 bg-ink-50 px-4 py-2 text-sm">
              <span className="text-ink-400">Subject:</span>{' '}
              <span className="font-medium text-ink-900">{render(subject, SAMPLE)}</span>
            </div>
            <iframe title="Email preview" sandbox="" srcDoc={previewDoc} className="h-[420px] w-full" />
          </div>
          <p className="mt-2 text-xs text-ink-400">Preview uses sample values (e.g. firstName = “Alex”).</p>
        </div>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset to default"
        description="Replace the current subject and body with Lumina's built-in default."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>Cancel</Button>
            <Button variant="danger" loading={resetMut.isPending} onClick={() => resetMut.mutate()}>Reset</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">Your customizations for this template will be discarded.</p>
      </Modal>
    </div>
  )
}

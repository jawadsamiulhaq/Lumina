import { useState } from 'react'
import { Plus, X, Trash2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// ---- Draft models used while editing (before mapping to the API request) ----

export type OptionDraft = { name: string; values: string[] }
export type ComboPart = { optionName: string; value: string }
export type VariantDraft = {
  key: string
  combo: ComboPart[]
  stock: number
  priceInCents: number | null // override; null = use base price
  sku: string
  isActive: boolean
}

/** Order-independent, case-insensitive identity for a variant combination. */
export function variantKey(combo: ComboPart[]): string {
  return combo
    .map((c) => `${c.optionName.trim().toLowerCase()}=${c.value.trim().toLowerCase()}`)
    .sort()
    .join('|')
}

export function comboLabel(combo: ComboPart[]): string {
  return combo.map((c) => `${c.optionName}: ${c.value}`).join(', ')
}

function cartesian(options: OptionDraft[]): ComboPart[][] {
  const valid = options
    .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length)
  if (!valid.length) return []
  return valid.reduce<ComboPart[][]>(
    (acc, opt) => acc.flatMap((combo) => opt.values.map((v) => [...combo, { optionName: opt.name, value: v }])),
    [[]],
  )
}

interface Props {
  options: OptionDraft[]
  variants: VariantDraft[]
  basePriceCents: number
  onOptionsChange: (o: OptionDraft[]) => void
  onVariantsChange: (v: VariantDraft[]) => void
}

export function VariantEditor({ options, variants, basePriceCents, onOptionsChange, onVariantsChange }: Props) {
  const patchOption = (i: number, patch: Partial<OptionDraft>) =>
    onOptionsChange(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))

  const generate = () => {
    const combos = cartesian(options)
    const byKey = new Map(variants.map((v) => [v.key, v]))
    onVariantsChange(
      combos.map((combo) => {
        const key = variantKey(combo)
        return byKey.get(key) ?? { key, combo, stock: 0, priceInCents: null, sku: '', isActive: true }
      }),
    )
  }

  const patchVariant = (key: string, patch: Partial<VariantDraft>) =>
    onVariantsChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)))

  const comboCount = cartesian(options).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-ink-900">Options &amp; variants</h2>
          <p className="mt-0.5 text-sm text-ink-500">Add options like Size or Color. Leave empty for a simple product.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => onOptionsChange([...options, { name: '', values: [] }])}
        >
          <Plus className="size-4" /> Add option
        </Button>
      </div>

      {/* Options */}
      {options.length > 0 && (
        <div className="space-y-3">
          {options.map((opt, i) => (
            <OptionRow
              key={i}
              option={opt}
              onNameChange={(name) => patchOption(i, { name })}
              onValuesChange={(values) => patchOption(i, { values })}
              onRemove={() => onOptionsChange(options.filter((_, idx) => idx !== i))}
            />
          ))}

          <div className="flex items-center gap-3">
            <Button type="button" size="sm" className="gap-2" onClick={generate} disabled={comboCount === 0}>
              <Wand2 className="size-4" /> Generate variants{comboCount > 0 ? ` (${comboCount})` : ''}
            </Button>
            <p className="text-xs text-ink-400">Regenerating keeps stock/price you already entered.</p>
          </div>
        </div>
      )}

      {/* Variants grid */}
      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-ink-100">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-3 py-2 font-medium">Variant</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Price override</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {variants.map((v) => (
                <tr key={v.key} className={v.isActive ? '' : 'opacity-50'}>
                  <td className="px-3 py-2 font-medium text-ink-900">{comboLabel(v.combo)}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => patchVariant(v.key, { stock: Math.max(0, Number(e.target.value)) })}
                      className="w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={v.priceInCents == null ? '' : (v.priceInCents / 100).toString()}
                      placeholder={(basePriceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        patchVariant(v.key, {
                          priceInCents: e.target.value === '' ? null : Math.round(Number(e.target.value) * 100),
                        })
                      }
                      className="w-24"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={v.sku} onChange={(e) => patchVariant(v.key, { sku: e.target.value })} className="w-28" placeholder="—" />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={v.isActive}
                      onChange={(e) => patchVariant(v.key, { isActive: e.target.checked })}
                      className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onVariantsChange(variants.filter((x) => x.key !== v.key))}
                      className="grid size-8 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-accent-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OptionRow({
  option,
  onNameChange,
  onValuesChange,
  onRemove,
}: {
  option: OptionDraft
  onNameChange: (name: string) => void
  onValuesChange: (values: string[]) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState('')

  const addValue = () => {
    const v = draft.trim()
    if (!v) return
    if (!option.values.some((x) => x.toLowerCase() === v.toLowerCase())) onValuesChange([...option.values, v])
    setDraft('')
  }

  return (
    <div className="rounded-xl border border-ink-100 p-3">
      <div className="flex items-center gap-2">
        <Input
          value={option.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Option name (e.g. Size)"
          className="max-w-xs"
        />
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-red-50 hover:text-accent-500"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {option.values.map((val) => (
          <span key={val} className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">
            {val}
            <button type="button" onClick={() => onValuesChange(option.values.filter((x) => x !== val))} className="text-ink-400 hover:text-accent-500">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addValue()
              }
            }}
            placeholder="Add value + Enter"
            className="h-8 w-40 text-xs"
          />
          <button type="button" onClick={addValue} className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

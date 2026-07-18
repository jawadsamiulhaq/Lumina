import { useState } from 'react'
import { Plus, X, Trash2, Wand2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { ProductImageInput } from '@/types/api'
import { cn } from '@/lib/utils'

// ---- Draft models used while editing (before mapping to the API request) ----

export type OptionValueDraft = { value: string; imageUrl: string | null }
export type OptionDraft = { name: string; values: OptionValueDraft[] }
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
    .map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.value.trim()).filter(Boolean) }))
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
  images: ProductImageInput[]
  onOptionsChange: (o: OptionDraft[]) => void
  onVariantsChange: (v: VariantDraft[]) => void
}

export function VariantEditor({ options, variants, basePriceCents, images, onOptionsChange, onVariantsChange }: Props) {
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
              images={images}
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
  images,
  onNameChange,
  onValuesChange,
  onRemove,
}: {
  option: OptionDraft
  images: ProductImageInput[]
  onNameChange: (name: string) => void
  onValuesChange: (values: OptionValueDraft[]) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState('')
  const [pickerFor, setPickerFor] = useState<string | null>(null)

  const addValue = () => {
    const v = draft.trim()
    if (!v) return
    if (!option.values.some((x) => x.value.toLowerCase() === v.toLowerCase()))
      onValuesChange([...option.values, { value: v, imageUrl: null }])
    setDraft('')
  }

  const removeValue = (value: string) => onValuesChange(option.values.filter((x) => x.value !== value))
  const setValueImage = (value: string, imageUrl: string | null) =>
    onValuesChange(option.values.map((x) => (x.value === value ? { ...x, imageUrl } : x)))

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
      {images.length > 0 && (
        <p className="mt-2 text-xs text-ink-400">Tip: link a value (e.g. a color) to a product image so the gallery switches when it's picked.</p>
      )}

      <div className="mt-3 flex flex-wrap items-start gap-2">
        {option.values.map((val) => (
          <div key={val.value} className="flex flex-col items-start gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 py-1 pl-1 pr-2.5 text-xs font-medium text-ink-700">
              {val.imageUrl ? (
                <img src={val.imageUrl} alt="" className="size-5 rounded-full object-cover" />
              ) : images.length > 0 ? (
                <span className="grid size-5 place-items-center rounded-full bg-ink-200 text-ink-400">
                  <ImageIcon className="size-3" />
                </span>
              ) : null}
              {val.value}
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPickerFor(pickerFor === val.value ? null : val.value)}
                  title="Link an image"
                  className={cn('rounded-full p-0.5', pickerFor === val.value ? 'bg-brand-100 text-brand-600' : 'text-ink-400 hover:text-brand-600')}
                >
                  <ImageIcon className="size-3" />
                </button>
              )}
              <button type="button" onClick={() => removeValue(val.value)} className="text-ink-400 hover:text-accent-500">
                <X className="size-3" />
              </button>
            </span>

            {pickerFor === val.value && (
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-100 bg-white p-2 shadow-sm">
                <button
                  type="button"
                  onClick={() => { setValueImage(val.value, null); setPickerFor(null) }}
                  title="No image"
                  className={cn(
                    'grid size-9 place-items-center rounded-lg border text-[9px] font-medium text-ink-400',
                    !val.imageUrl ? 'border-brand-500 text-brand-600' : 'border-ink-200 hover:border-ink-300',
                  )}
                >
                  None
                </button>
                {images.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => { setValueImage(val.value, img.url); setPickerFor(null) }}
                    className={cn(
                      'size-9 overflow-hidden rounded-lg border-2',
                      val.imageUrl === img.url ? 'border-brand-500' : 'border-transparent hover:border-ink-200',
                    )}
                  >
                    <img src={img.url} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
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

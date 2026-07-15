import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { UploadCloud, X, Star, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import { uploadsApi } from '@/api/services'
import type { ProductImageInput } from '@/types/api'
import { toast } from '@/store/toastStore'
import { getApiErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'

export function ImageUploader({
  images,
  onChange,
}: {
  images: ProductImageInput[]
  onChange: (images: ProductImageInput[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded: ProductImageInput[] = []
      for (const file of Array.from(files)) {
        const result = await uploadsApi.image(file)
        uploaded.push({ url: result.url, altText: file.name, sortOrder: 0, isPrimary: false })
      }
      const merged = [...images, ...uploaded].map((img, i) => ({ ...img, sortOrder: i }))
      if (!merged.some((m) => m.isPrimary) && merged.length) merged[0].isPrimary = true
      onChange(merged)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed.'))
    } finally {
      setUploading(false)
    }
  }

  function setPrimary(index: number) {
    onChange(images.map((img, i) => ({ ...img, isPrimary: i === index })))
  }

  function remove(index: number) {
    const next = images.filter((_, i) => i !== index).map((img, i) => ({ ...img, sortOrder: i }))
    if (!next.some((m) => m.isPrimary) && next.length) next[0].isPrimary = true
    onChange(next)
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((img, i) => ({ ...img, sortOrder: i })))
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); void handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition',
          dragging ? 'border-brand-400 bg-brand-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-50',
        )}
      >
        {uploading ? <Loader2 className="size-7 animate-spin text-brand-500" /> : <UploadCloud className="size-7 text-ink-400" />}
        <p className="text-sm font-medium text-ink-700">Drag & drop images here, or click to browse</p>
        <p className="text-xs text-ink-400">PNG, JPG, WEBP up to 5MB each</p>
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => void handleFiles(e.target.files)} />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div
                key={img.url}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn('group relative aspect-square overflow-hidden rounded-xl border-2', img.isPrimary ? 'border-brand-500' : 'border-transparent')}
              >
                <img src={img.url} alt={img.altText ?? ''} className="size-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-between bg-ink-950/0 p-1.5 opacity-0 transition group-hover:bg-ink-950/30 group-hover:opacity-100">
                  <div className="flex justify-between">
                    <button type="button" onClick={() => setPrimary(i)} title="Set as primary" className="grid size-6 place-items-center rounded-full bg-white text-amber-500">
                      <Star className={cn('size-3.5', img.isPrimary && 'fill-amber-400')} />
                    </button>
                    <button type="button" onClick={() => remove(i)} title="Remove" className="grid size-6 place-items-center rounded-full bg-white text-accent-500">
                      <X className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <button type="button" onClick={() => move(i, -1)} className="grid size-6 place-items-center rounded-full bg-white text-ink-600 disabled:opacity-30" disabled={i === 0}>
                      <ArrowLeft className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="grid size-6 place-items-center rounded-full bg-white text-ink-600 disabled:opacity-30" disabled={i === images.length - 1}>
                      <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
                {img.isPrimary && (
                  <span className="absolute bottom-1 left-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Primary</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

import { create } from 'zustand'

export interface FlyRequest {
  id: number
  imageUrl: string
  from: { x: number; y: number; size: number }
}

interface FlyState {
  requests: FlyRequest[]
  cartTarget: (() => DOMRect | null) | null
  registerCartTarget: (fn: (() => DOMRect | null) | null) => void
  fly: (imageUrl: string, from: DOMRect) => void
  done: (id: number) => void
}

let counter = 0

export const useFlyStore = create<FlyState>((set) => ({
  requests: [],
  cartTarget: null,
  registerCartTarget: (fn) => set({ cartTarget: fn }),
  fly: (imageUrl, from) =>
    set((s) => ({
      requests: [
        ...s.requests,
        { id: ++counter, imageUrl, from: { x: from.left, y: from.top, size: Math.min(from.width, 120) } },
      ],
    })),
  done: (id) => set((s) => ({ requests: s.requests.filter((r) => r.id !== id) })),
}))

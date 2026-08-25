import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Category } from '@/lib/types'

type FilterValue = {
  category: Category | null
  setCategory: (category: Category | null) => void
}

const FilterContext = createContext<FilterValue | null>(null)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<Category | null>(null)
  const value = useMemo(() => ({ category, setCategory }), [category])
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
}

export function useCategoryFilter() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useCategoryFilter must be used within FilterProvider')
  return ctx
}

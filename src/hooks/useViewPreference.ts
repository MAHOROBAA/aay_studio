import { useState } from 'react'

export type LibraryView = 'grid' | 'list'

export function useViewPreference(storageKey: string): [LibraryView, (next: LibraryView) => void] {
  const [view, setViewState] = useState<LibraryView>(() => {
    const stored = window.localStorage.getItem(storageKey)
    return stored === 'list' ? 'list' : 'grid'
  })

  function setView(next: LibraryView) {
    setViewState(next)
    window.localStorage.setItem(storageKey, next)
  }

  return [view, setView]
}

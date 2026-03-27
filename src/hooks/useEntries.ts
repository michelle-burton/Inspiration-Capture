import { useState, useCallback } from 'react'
import type { CaptureEntry, NewCaptureEntry } from '../types'
import {
  getEntries,
  saveEntry,
  deleteEntry,
  updateEntry,
  getEntryById,
} from '../utils/storage'

// Central hook for reading and mutating capture entries.
// All pages use this hook so state stays consistent within a session.
export function useEntries() {
  const [entries, setEntries] = useState<CaptureEntry[]>(() => getEntries())

  const refresh = useCallback(() => {
    setEntries(getEntries())
  }, [])

  const addEntry = useCallback((data: NewCaptureEntry): CaptureEntry => {
    const entry = saveEntry(data)
    setEntries(getEntries())
    return entry
  }, [])

  const removeEntry = useCallback((id: string) => {
    deleteEntry(id)
    setEntries(getEntries())
  }, [])

  const editEntry = useCallback(
    (id: string, data: Partial<NewCaptureEntry>): CaptureEntry | null => {
      const updated = updateEntry(id, data)
      setEntries(getEntries())
      return updated
    },
    []
  )

  const getById = useCallback((id: string) => getEntryById(id), [])

  return { entries, refresh, addEntry, removeEntry, editEntry, getById }
}

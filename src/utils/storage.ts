import type { CaptureEntry, NewCaptureEntry, Tag } from '../types'

const STORAGE_KEY = 'inspiration_capture_entries'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// Migrate an entry whose tags may be legacy strings (from the scaffold phase).
function migrateEntry(raw: unknown): CaptureEntry {
  const e = raw as Record<string, unknown>
  const tags: Tag[] = Array.isArray(e.tags)
    ? (e.tags as unknown[]).map((t, i) => {
        if (typeof t === 'string') {
          const colors = ['cyan', 'purple', 'pink'] as const
          return { value: t, color: colors[i % colors.length] }
        }
        return t as Tag
      })
    : []

  return {
    id:           String(e.id ?? generateId()),
    title:        String(e.title ?? 'Untitled'),
    createdAt:    String(e.createdAt ?? new Date().toISOString()),
    photos:       Array.isArray(e.photos) ? (e.photos as string[]) : [],
    audioUrl:     typeof e.audioUrl === 'string' ? e.audioUrl : undefined,
    transcript:   typeof e.transcript === 'string' ? e.transcript : undefined,
    observations: String(e.observations ?? ''),
    source:       (['photo', 'voice', 'text', 'mixed'].includes(e.source as string)
                    ? e.source
                    : 'text') as CaptureEntry['source'],
    tags,
  }
}

// Read all entries, newest first. Migrates legacy string tags transparently.
export function getEntries(): CaptureEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown[]
    return parsed
      .map(migrateEntry)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

export function getEntryById(id: string): CaptureEntry | undefined {
  return getEntries().find((e) => e.id === id)
}

// Persist a new entry and return it with generated id + createdAt.
export function saveEntry(data: NewCaptureEntry): CaptureEntry {
  const entry: CaptureEntry = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  }
  const existing = getEntries()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...existing]))
  return entry
}

export function deleteEntry(id: string): void {
  const updated = getEntries().filter((e) => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function updateEntry(id: string, data: Partial<NewCaptureEntry>): CaptureEntry | null {
  const entries = getEntries()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return null
  const updated: CaptureEntry = { ...entries[idx], ...data }
  entries[idx] = updated
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return updated
}

// ── Tag ──────────────────────────────────────────────────────────────────────

export type TagColor = 'cyan' | 'purple' | 'pink'

export type Tag = {
  value: string    // e.g. "ArtStyle"
  color: TagColor
}

// ── Core entry model ─────────────────────────────────────────────────────────

export type CaptureEntry = {
  id: string
  title: string
  createdAt: string        // ISO date string
  photos: string[]         // base64 data URLs (localStorage MVP)
  audioUrl?: string        // base64 / object URL for recorded audio
  transcript?: string      // manual notes or future voice-to-text
  tags: Tag[]
  observations: string
  source: 'photo' | 'voice' | 'text' | 'mixed'
}

// Omit server-generated fields when creating a new entry
export type NewCaptureEntry = Omit<CaptureEntry, 'id' | 'createdAt'>

// ── Navigation ───────────────────────────────────────────────────────────────

export type NavTab = 'home' | 'capture' | 'gallery'

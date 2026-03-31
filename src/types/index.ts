// ── Tag ───────────────────────────────────────────────────────────────────────

export type TagColor = 'cyan' | 'purple' | 'pink'

export type Tag = {
  id: string
  user_id: string
  name: string
  color: TagColor
  created_at: string
  updated_at: string
}

// ── Event ─────────────────────────────────────────────────────────────────────

export type EventStatus = 'draft' | 'active' | 'archived'

export type Event = {
  id: string
  user_id: string
  title: string
  slug: string
  description: string | null
  location: string | null
  start_date: string | null
  end_date: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

// ── Entry Image ───────────────────────────────────────────────────────────────

export type EntryImage = {
  id: string
  entry_id: string
  storage_path: string
  public_url: string | null
  file_name: string | null
  mime_type: string | null
  file_size: number | null
  width: number | null
  height: number | null
  created_at: string
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export type SourceType = 'camera' | 'library' | 'text_only'

export type Entry = {
  id: string
  user_id: string
  event_id: string
  title: string | null
  booth_name: string | null
  artist_name: string | null
  visual_inspiration: string | null
  emotional_reaction: string | null
  brand_idea: string | null
  material_or_phrase: string | null
  notes: string | null
  price_range: string | null
  source_type: SourceType
  is_favorite: boolean
  is_archived: boolean
  captured_at: string | null
  created_at: string
  updated_at: string
  // Joined from Supabase
  entry_images?: EntryImage[]
  entry_tags?: { tag: Tag }[]
}

export type NewEntry = Omit<Entry,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'entry_images' | 'entry_tags'
>

// ── Curated Set ───────────────────────────────────────────────────────────────

export type CuratedSetStatus = 'draft' | 'ready' | 'archived'

export type CuratedSet = {
  id: string
  user_id: string
  event_id: string
  title: string
  description: string | null
  status: CuratedSetStatus
  created_at: string
  updated_at: string
  // Joined
  curated_set_entries?: { entry_id: string }[]
}

export type CuratedSetWithEntries = Omit<CuratedSet, 'curated_set_entries'> & {
  curated_set_entries: {
    sort_order: number
    added_at: string
    entry: Entry
  }[]
}

// ── Question Set ──────────────────────────────────────────────────────────────

export type QuestionSet = {
  id: string
  user_id: string
  title: string
  description: string | null
  question_1: string
  question_2: string
  question_3: string
  created_at: string
  updated_at: string
}

// ── Navigation ────────────────────────────────────────────────────────────────

export type NavTab = 'home' | 'events' | 'question-sets'

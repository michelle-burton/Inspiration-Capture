import { supabase } from './supabase'
import type { NewEntry } from '../types'

// ── Events ────────────────────────────────────────────────────────────────────

export async function getEvents() {
  return supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
}

export async function createEvent(data: {
  title: string
  slug: string
  description?: string
  location?: string
  start_date?: string
  end_date?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase
    .from('events')
    .insert({ ...data, user_id: user?.id })
    .select()
    .single()
}

export async function updateEvent(id: string, data: Partial<{
  title: string
  description: string
  location: string
  start_date: string
  end_date: string
  status: string
}>) {
  return supabase
    .from('events')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

// ── Entries ───────────────────────────────────────────────────────────────────

export async function getEntries(eventId: string) {
  return supabase
    .from('entries')
    .select('*, entry_images(*), entry_tags(tag:tags(*))')
    .eq('event_id', eventId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
}

export async function getEntryById(id: string) {
  return supabase
    .from('entries')
    .select('*, entry_images(*), entry_tags(tag:tags(*))')
    .eq('id', id)
    .single()
}

export async function createEntry(data: NewEntry) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase
    .from('entries')
    .insert({ ...data, user_id: user?.id })
    .select()
    .single()
}

export async function updateEntry(id: string, data: Partial<NewEntry>) {
  return supabase
    .from('entries')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
}

export async function deleteEntry(id: string) {
  return supabase
    .from('entries')
    .delete()
    .eq('id', id)
}

export async function toggleFavorite(id: string, value: boolean) {
  return supabase
    .from('entries')
    .update({ is_favorite: value, updated_at: new Date().toISOString() })
    .eq('id', id)
}

// ── Tags ──────────────────────────────────────────────────────────────────────

export async function getTags() {
  return supabase
    .from('tags')
    .select('*')
    .order('name')
}

export async function upsertTag(name: string, color: string) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase
    .from('tags')
    .upsert({ name, color, user_id: user?.id }, { onConflict: 'user_id,name' })
    .select()
    .single()
}

export async function addTagToEntry(entryId: string, tagId: string) {
  return supabase
    .from('entry_tags')
    .upsert({ entry_id: entryId, tag_id: tagId })
}

export async function removeTagFromEntry(entryId: string, tagId: string) {
  return supabase
    .from('entry_tags')
    .delete()
    .eq('entry_id', entryId)
    .eq('tag_id', tagId)
}

export async function deleteAllEntryTags(entryId: string) {
  return supabase
    .from('entry_tags')
    .delete()
    .eq('entry_id', entryId)
}

// ── Images ────────────────────────────────────────────────────────────────────

export async function addEntryImage(data: {
  entry_id: string
  storage_path: string
  public_url: string
  file_name: string
  mime_type: string
  file_size: number
}) {
  return supabase
    .from('entry_images')
    .insert(data)
    .select()
    .single()
}

export async function deleteEntryImage(id: string, storagePath: string) {
  await supabase.storage.from('entry-images').remove([storagePath])
  return supabase.from('entry_images').delete().eq('id', id)
}

import { useNavigate } from 'react-router-dom'
import { SignedImage } from '../ui/SignedImage'
import { formatDate } from '../../utils/format'

type MiniEntry = {
  id:           string
  title:        string | null
  booth_name:   string | null
  artist_name:  string | null
  created_at:   string
  entry_images: { storage_path: string }[]
}

interface EntryThumbnailChipProps {
  entryIds: string[]
  entries:  MiniEntry[]
}

export function EntryThumbnailChip({ entryIds, entries }: EntryThumbnailChipProps) {
  const navigate = useNavigate()

  const matched = entryIds
    .map(id => entries.find(e => e.id === id))
    .filter((e): e is MiniEntry => !!e)

  if (matched.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {matched.map(entry => {
        const thumb = entry.entry_images?.[0]
        const label = entry.title || entry.booth_name || entry.artist_name || formatDate(entry.created_at)
        return (
          <button
            key={entry.id}
            onClick={() => navigate(`/entry/${entry.id}`)}
            title={label}
            className="flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-full pl-0.5 pr-3 py-0.5 transition-all active:scale-95 group"
          >
            {thumb ? (
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                <SignedImage storagePath={thumb.storage_path} className="w-full h-full" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[0.7rem]">text_snippet</span>
              </div>
            )}
            <span className="text-[10px] font-bold text-on-surface-variant group-hover:text-on-surface truncate max-w-[80px] transition-colors">
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

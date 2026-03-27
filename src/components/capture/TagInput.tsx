import { useState } from 'react'
import { Chip } from '../ui/Chip'
import type { Tag, TagColor } from '../../types'

// Preset tags with fixed colors
const PRESET_TAGS: { value: string; color: TagColor }[] = [
  { value: 'ArtStyle',    color: 'cyan'   },
  { value: 'Packaging',   color: 'purple' },
  { value: 'BoothDesign', color: 'pink'   },
  { value: 'Typography',  color: 'cyan'   },
  { value: 'Lighting',    color: 'purple' },
  { value: 'ColorPalette',color: 'pink'   },
  { value: 'Pattern',     color: 'cyan'   },
  { value: 'Concept',     color: 'purple' },
  { value: 'Product',     color: 'pink'   },
  { value: 'People',      color: 'cyan'   },
]

const COLOR_CYCLE: TagColor[] = ['cyan', 'purple', 'pink']

interface TagInputProps {
  tags: Tag[]
  onChange: (tags: Tag[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(value: string, color?: TagColor) {
    const clean = value.trim().replace(/^#/, '')
    if (!clean || tags.some((t) => t.value === clean)) return
    const resolvedColor: TagColor = color ?? COLOR_CYCLE[tags.length % COLOR_CYCLE.length]
    onChange([...tags, { value: clean, color: resolvedColor }])
  }

  function removeTag(value: string) {
    onChange(tags.filter((t) => t.value !== value))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault()
      addTag(input)
      setInput('')
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1].value)
    }
  }

  const selectedValues = new Set(tags.map((t) => t.value))

  return (
    <div className="space-y-3">
      {/* Custom tag input */}
      <div className="flex items-center gap-2 bg-surface-container-lowest rounded-md px-3 py-2.5 focus-within:outline focus-within:outline-1 focus-within:outline-primary/40 transition-all">
        <span className="material-symbols-outlined text-on-surface-variant text-lg">sell</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a tag and press Enter"
          className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none font-body"
        />
      </div>

      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Chip
              key={tag.value}
              label={tag.value}
              color={tag.color}
              selected
              onRemove={() => removeTag(tag.value)}
            />
          ))}
        </div>
      )}

      {/* Preset quick-tags */}
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
          Quick Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.filter((t) => !selectedValues.has(t.value)).map((tag) => (
            <Chip
              key={tag.value}
              label={tag.value}
              color={tag.color}
              onClick={() => addTag(tag.value, tag.color)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

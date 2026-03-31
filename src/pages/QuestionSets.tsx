import { useState, useEffect } from 'react'
import { getQuestionSets, createQuestionSet, updateQuestionSet, deleteQuestionSet } from '../utils/db'
import { GlowButton } from '../components/ui/GlowButton'
import { formatDate } from '../utils/format'
import type { QuestionSet } from '../types'

type FormState = {
  title:      string
  description: string
  question_1: string
  question_2: string
  question_3: string
}

const EMPTY_FORM: FormState = {
  title:       '',
  description: '',
  question_1:  '',
  question_2:  '',
  question_3:  '',
}

const EXAMPLE_QUESTIONS = [
  'What themes keep repeating visually?',
  'What products seem most desirable and buyable?',
  'What style direction feels most aligned with me?',
]

export default function QuestionSets() {
  const [sets,       setSets]       = useState<QuestionSet[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId,  setConfirmId]  = useState<string | null>(null)

  useEffect(() => {
    loadSets()
  }, [])

  async function loadSets() {
    const { data } = await getQuestionSets()
    setSets(data ?? [])
    setLoading(false)
  }

  function updateField(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function startEdit(set: QuestionSet) {
    setEditingId(set.id)
    setForm({
      title:       set.title,
      description: set.description ?? '',
      question_1:  set.question_1,
      question_2:  set.question_2,
      question_3:  set.question_3,
    })
    setShowForm(true)
    setExpandedId(null)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.question_1.trim() || !form.question_2.trim() || !form.question_3.trim()) return
    setSaving(true)

    if (editingId) {
      const { data } = await updateQuestionSet(editingId, {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        question_1:  form.question_1.trim(),
        question_2:  form.question_2.trim(),
        question_3:  form.question_3.trim(),
      })
      if (data) setSets(prev => prev.map(s => s.id === editingId ? data : s))
    } else {
      const { data } = await createQuestionSet({
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        question_1:  form.question_1.trim(),
        question_2:  form.question_2.trim(),
        question_3:  form.question_3.trim(),
      })
      if (data) setSets(prev => [data, ...prev])
    }

    setSaving(false)
    cancelForm()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    await deleteQuestionSet(id)
    setSets(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
    setConfirmId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="font-headline font-bold text-2xl text-on-surface">Question Sets</h1>
          <p className="text-on-surface-variant text-xs mt-0.5">
            Reusable question guides for AI analysis
          </p>
        </div>
        {!showForm && (
          <GlowButton variant="primary" onClick={startCreate} icon="add">
            New Set
          </GlowButton>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-xl bg-surface-container p-5 space-y-4">
          <p className="font-headline font-bold text-on-surface">
            {editingId ? 'Edit Question Set' : 'New Question Set'}
          </p>

          <input
            type="text"
            value={form.title}
            onChange={e => updateField('title', e.target.value)}
            placeholder="Title  e.g. Product Viability Review"
            className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
          />
          <input
            type="text"
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Description (optional)"
            className="w-full bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none focus:ring-1 focus:ring-primary/40"
          />

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              3 Analysis Questions
            </p>
            {([1, 2, 3] as const).map(n => {
              const key = `question_${n}` as keyof FormState
              const placeholder = EXAMPLE_QUESTIONS[n - 1]
              return (
                <div key={n} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-2.5">
                    <span className="text-primary text-xs font-bold">{n}</span>
                  </div>
                  <textarea
                    value={form[key]}
                    onChange={e => updateField(key, e.target.value)}
                    placeholder={placeholder}
                    rows={2}
                    className="flex-1 bg-surface-container-high rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 pt-1">
            <GlowButton
              variant="primary"
              onClick={handleSave}
              disabled={
                !form.title.trim() ||
                !form.question_1.trim() ||
                !form.question_2.trim() ||
                !form.question_3.trim() ||
                saving
              }
              className="flex-1"
            >
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Set'}
            </GlowButton>
            <button onClick={cancelForm} className="px-4 text-on-surface-variant text-sm font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {sets.length === 0 && !showForm && (
        <div className="rounded-xl bg-surface-container p-10 flex flex-col items-center text-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant text-5xl">quiz</span>
          <div>
            <p className="font-headline font-bold text-on-surface">No question sets yet</p>
            <p className="text-on-surface-variant text-sm mt-1">
              Build reusable sets of 3 questions to guide AI analysis of your curated inspiration.
            </p>
          </div>
          <GlowButton variant="primary" onClick={startCreate} icon="add">
            Create Question Set
          </GlowButton>
        </div>
      )}

      {/* Question sets list */}
      {sets.length > 0 && (
        <div className="space-y-3">
          {sets.map(set => {
            const isExpanded = expandedId === set.id
            const isConfirm  = confirmId  === set.id
            const isDeleting = deletingId === set.id

            return (
              <div key={set.id} className="rounded-xl bg-surface-container overflow-hidden">
                {/* Card header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : set.id)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-surface-container-high transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-on-surface">{set.title}</p>
                    {set.description && (
                      <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{set.description}</p>
                    )}
                    <p className="text-[10px] text-on-surface-variant mt-1">{formatDate(set.created_at)}</p>
                  </div>
                  <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Expanded: questions + actions */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-outline-variant/10">
                    <div className="space-y-3 pt-4">
                      {[set.question_1, set.question_2, set.question_3].map((q, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-primary text-xs font-bold">{i + 1}</span>
                          </div>
                          <p className="text-sm text-on-surface leading-relaxed">{q}</p>
                        </div>
                      ))}
                    </div>

                    {isConfirm ? (
                      <div className="rounded-xl bg-surface-container-high ring-1 ring-tertiary/30 p-4 space-y-3">
                        <p className="text-sm text-on-surface font-bold">Delete this question set?</p>
                        <p className="text-xs text-on-surface-variant">This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmId(null)}
                            className="flex-1 rounded-xl py-2.5 bg-surface-container text-sm font-bold text-on-surface-variant active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(set.id)}
                            disabled={isDeleting}
                            className="flex-1 rounded-xl py-2.5 bg-tertiary/10 ring-1 ring-tertiary/40 text-sm font-bold text-tertiary active:scale-95 disabled:opacity-40"
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <GlowButton variant="secondary" onClick={() => startEdit(set)} icon="edit" className="flex-1 py-2.5">
                          Edit
                        </GlowButton>
                        <button
                          onClick={() => setConfirmId(set.id)}
                          className="px-4 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-tertiary text-sm font-bold transition-colors active:scale-95"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

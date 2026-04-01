import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getQuestionSets } from '../../utils/db'
import { createAnalysisRun, invokeAnalysis } from '../../utils/analysis'
import { GlowButton } from '../ui/GlowButton'
import { formatDate } from '../../utils/format'
import type { QuestionSet } from '../../types'

interface AnalysisSetupModalProps {
  eventId:       string
  curatedSetId:  string
  curatedSetTitle: string
  entryCount:    number
  onClose:       () => void
}

export function AnalysisSetupModal({
  eventId,
  curatedSetId,
  curatedSetTitle,
  entryCount,
  onClose,
}: AnalysisSetupModalProps) {
  const navigate = useNavigate()

  const [questionSets,       setQuestionSets]       = useState<QuestionSet[]>([])
  const [selectedSetId,      setSelectedSetId]      = useState<string | null>(null)
  const [loading,            setLoading]            = useState(true)
  const [running,            setRunning]            = useState(false)
  const [error,              setError]              = useState<string | null>(null)

  useEffect(() => {
    getQuestionSets().then(({ data }) => {
      setQuestionSets(data ?? [])
      if (data && data.length === 1) setSelectedSetId(data[0].id)
      setLoading(false)
    })
  }, [])

  const selectedSet = questionSets.find(s => s.id === selectedSetId)

  async function handleRun() {
    if (!selectedSetId || !selectedSet) return
    setRunning(true)
    setError(null)

    const runTitle = `${curatedSetTitle} × ${selectedSet.title} — ${formatDate(new Date().toISOString())}`

    const { data: run, error: createErr } = await createAnalysisRun({
      event_id:        eventId,
      curated_set_id:  curatedSetId,
      question_set_id: selectedSetId,
      title:           runTitle,
    })

    if (createErr || !run) {
      setError('Could not create analysis run: ' + (createErr?.message ?? 'unknown error'))
      setRunning(false)
      return
    }

    // Fire edge function — don't await, navigate immediately
    invokeAnalysis(run.id).catch(console.error)
    navigate(`/analysis-runs/${run.id}`)
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-4">
      <div className="w-full max-w-lg bg-surface rounded-2xl p-6 space-y-5 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-headline font-bold text-lg text-on-surface">Run Analysis</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {curatedSetTitle} · {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary active:scale-90 transition-all">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Question Set Picker */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Select a Question Set
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
            </div>
          ) : questionSets.length === 0 ? (
            <div className="rounded-xl bg-surface-container p-4 text-center space-y-3">
              <p className="text-sm text-on-surface-variant">No question sets yet.</p>
              <GlowButton variant="secondary" onClick={() => navigate('/question-sets')} icon="quiz">
                Create a Question Set
              </GlowButton>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {questionSets.map(qs => (
                <button
                  key={qs.id}
                  onClick={() => setSelectedSetId(qs.id)}
                  className={`w-full text-left rounded-xl p-4 transition-all ${
                    selectedSetId === qs.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'bg-surface-container hover:bg-surface-container-high'
                  }`}
                >
                  <p className="font-headline font-bold text-sm text-on-surface">{qs.title}</p>
                  {qs.description && (
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{qs.description}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preview selected questions */}
        {selectedSet && (
          <div className="rounded-xl bg-surface-container p-4 space-y-2">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Questions</p>
            {[selectedSet.question_1, selectedSet.question_2, selectedSet.question_3].map((q, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        )}

        {/* Model info */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">psychology</span>
          <span>claude-3-5-sonnet · typically 20–45 seconds</span>
        </div>

        {error && (
          <p className="text-xs text-tertiary bg-tertiary/10 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <GlowButton
            variant="primary"
            onClick={handleRun}
            disabled={!selectedSetId || running}
            className="flex-1 py-3"
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            {running ? 'Starting…' : 'Run Analysis'}
          </GlowButton>
          <button onClick={onClose} className="px-4 text-sm font-bold text-on-surface-variant">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

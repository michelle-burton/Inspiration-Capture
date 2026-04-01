import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnalysisRunsForSet } from '../../utils/analysis'
import { formatTime } from '../../utils/format'
import type { AnalysisRun, AnalysisRunStatus } from '../../types'

interface AnalysisRunHistoryProps {
  curatedSetId: string
}

const STATUS_STYLE: Record<AnalysisRunStatus, string> = {
  queued:    'bg-secondary-container/30 text-secondary',
  running:   'bg-primary/20 text-primary',
  completed: 'bg-primary/20 text-primary',
  failed:    'bg-tertiary/20 text-tertiary',
}

const STATUS_ICON: Record<AnalysisRunStatus, string> = {
  queued:    'hourglass_empty',
  running:   'progress_activity',
  completed: 'check_circle',
  failed:    'error',
}

export function AnalysisRunHistory({ curatedSetId }: AnalysisRunHistoryProps) {
  const navigate = useNavigate()
  const [runs,    setRuns]    = useState<AnalysisRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAnalysisRunsForSet(curatedSetId).then(({ data }) => {
      setRuns((data ?? []) as AnalysisRun[])
      setLoading(false)
    })
  }, [curatedSetId])

  if (loading || runs.length === 0) return null

  return (
    <section className="space-y-3">
      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
        Analysis History · {runs.length}
      </p>
      <div className="space-y-2">
        {runs.map(run => {
          const status = run.status as AnalysisRunStatus
          const qs = run.question_set as any
          return (
            <button
              key={run.id}
              onClick={() => navigate(`/analysis-runs/${run.id}`)}
              className="w-full text-left rounded-xl bg-surface-container hover:bg-surface-container-high p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${STATUS_STYLE[status]}`}>
                <span className={`material-symbols-outlined text-sm ${status === 'running' ? 'animate-spin' : ''}`}>
                  {STATUS_ICON[status]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">
                  {qs?.title ?? 'Analysis'}
                </p>
                <p className="text-xs text-on-surface-variant">{formatTime(run.created_at)}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[status]}`}>
                {status}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

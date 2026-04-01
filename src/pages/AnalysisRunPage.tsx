import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { getAnalysisRun, createAnalysisRun, invokeAnalysis } from '../utils/analysis'
import { EntryThumbnailChip } from '../components/analysis/EntryThumbnailChip'
import { GlowButton } from '../components/ui/GlowButton'
import { formatDate } from '../utils/format'
import type {
  AnalysisRun,
  AnalysisResult,
  AnalysisPattern,
  AnalysisOpportunity,
  AnalysisTopIdea,
  AnalysisNextAction,
  QuestionAnswer,
} from '../types'

// ── Types for joined data ─────────────────────────────────────────────────────
type MiniEntry = {
  id:           string
  title:        string | null
  booth_name:   string | null
  artist_name:  string | null
  created_at:   string
  entry_images: { storage_path: string }[]
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
const FREQ_STYLE: Record<string, string> = {
  high:   'bg-primary/20 text-primary',
  medium: 'bg-secondary-container/30 text-secondary',
  low:    'bg-surface-container-highest text-on-surface-variant',
}

const CAT_LABEL: Record<string, string> = {
  research:  'Research',
  create:    'Create',
  reach_out: 'Reach Out',
  purchase:  'Purchase',
  other:     'Other',
}
const CAT_STYLE: Record<string, string> = {
  research:  'bg-secondary-container/30 text-secondary',
  create:    'bg-primary/20 text-primary',
  reach_out: 'bg-tertiary/20 text-tertiary',
  purchase:  'bg-surface-container-highest text-on-surface-variant',
  other:     'bg-surface-container-highest text-on-surface-variant',
}

// ── Loading status steps ──────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  queued:    'Queued — waiting to start…',
  running:   'Running — Claude is analyzing your entries…',
  completed: 'Analysis complete!',
  failed:    'Analysis failed',
}

export default function AnalysisRunPage() {
  const { runId } = useParams<{ runId: string }>()
  const navigate  = useNavigate()

  const [run,     setRun]     = useState<AnalysisRun | null>(null)
  const [result,  setResult]  = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [rerunning, setRerunning] = useState(false)

  // Entries extracted from the curated set join — used for traceability chips
  const [entries, setEntries] = useState<MiniEntry[]>([])

  const loadRun = useCallback(async () => {
    if (!runId) return
    const { data } = await getAnalysisRun(runId)
    if (!data) return
    const typedRun = data as unknown as AnalysisRun
    setRun(typedRun)

    // Extract flat entry list for traceability
    const cse = typedRun.curated_set?.curated_set_entries ?? []
    setEntries(
      cse
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(cse => cse.entry as MiniEntry)
    )

    if (typedRun.result) {
      setResult(typedRun.result as AnalysisResult)
    }
    setLoading(false)
  }, [runId])

  useEffect(() => {
    loadRun()
  }, [loadRun])

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!runId) return

    const channel = supabase
      .channel(`analysis-run-${runId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'analysis_runs', filter: `id=eq.${runId}` },
        (payload) => {
          const updated = payload.new as AnalysisRun
          setRun(prev => prev ? { ...prev, ...updated } : updated)
          // When completed or failed, do a full reload to get the joined result
          if (updated.status === 'completed' || updated.status === 'failed') {
            loadRun()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [runId, loadRun])

  // ── Re-run ────────────────────────────────────────────────────────────────
  async function handleRerun() {
    if (!run) return
    setRerunning(true)
    const { data: newRun, error } = await createAnalysisRun({
      event_id:        run.event_id,
      curated_set_id:  run.curated_set_id,
      question_set_id: run.question_set_id ?? '',
      title:           run.title.replace(/—.*$/, '— ' + formatDate(new Date().toISOString())),
    })
    if (error || !newRun) { setRerunning(false); return }
    invokeAnalysis(newRun.id).catch(console.error)
    navigate(`/analysis-runs/${newRun.id}`)
  }

  // ── Export helpers ────────────────────────────────────────────────────────
  function downloadMarkdown() {
    if (!result?.markdown_export) return
    const blob = new Blob([result.markdown_export], { type: 'text/markdown' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${run?.title ?? 'analysis'}.md`.replace(/\s+/g, '-')
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadJSON() {
    if (!result) return
    const payload = {
      run:          { title: run?.title, created_at: run?.created_at, model: run?.model_name },
      synopsis:     result.synopsis,
      answers:      result.answers_json,
      patterns:     result.patterns_json,
      opportunities:result.opportunities_json,
      top_ideas:    result.top_ideas_json,
      next_actions: result.next_actions_json,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${run?.title ?? 'analysis'}.json`.replace(/\s+/g, '-')
    a.click()
    URL.revokeObjectURL(url)
  }

  async function copyMarkdown() {
    if (!result?.markdown_export) return
    await navigator.clipboard.writeText(result.markdown_export)
    alert('Copied to clipboard!')
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <p className="font-headline font-bold text-on-surface">Run not found</p>
        <GlowButton variant="secondary" onClick={() => navigate(-1)}>Go back</GlowButton>
      </div>
    )
  }

  const status = run.status as string
  const qs     = run.question_set

  // ── In-progress state ─────────────────────────────────────────────────────
  if (status === 'queued' || status === 'running') {
    return (
      <div className="min-h-screen bg-surface px-6 py-10 flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-4xl animate-spin">psychology</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-headline font-bold text-xl text-on-surface">
              {status === 'queued' ? 'Queued' : 'Analyzing…'}
            </p>
            <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
              {STATUS_LABELS[status]}
            </p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="w-full max-w-xs space-y-3">
          {[
            { key: 'queued',  label: 'Run queued',              icon: 'hourglass_empty' },
            { key: 'running', label: 'Claude analyzing entries', icon: 'psychology' },
            { key: 'save',    label: 'Saving results',          icon: 'save' },
          ].map((step, i) => {
            const isActive = (status === 'queued' && i === 0) || (status === 'running' && i <= 1)
            const isDone   = (status === 'running' && i === 0)
            return (
              <div key={step.key} className={`flex items-center gap-3 transition-opacity ${isActive || isDone ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-primary/20' : isActive ? 'bg-primary/10' : 'bg-surface-container'
                }`}>
                  <span className={`material-symbols-outlined text-sm ${isDone ? 'text-primary' : isActive ? 'text-primary animate-pulse' : 'text-on-surface-variant'}`}>
                    {isDone ? 'check' : step.icon}
                  </span>
                </div>
                <p className={`text-sm font-bold ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-on-surface-variant text-center">
          This page updates automatically — no need to refresh.
        </p>
      </div>
    )
  }

  // ── Failed state ──────────────────────────────────────────────────────────
  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-surface px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-on-surface-variant active:scale-95 transition-transform">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="rounded-2xl bg-surface-container ring-1 ring-tertiary/30 p-6 space-y-4 text-center">
          <span className="material-symbols-outlined text-tertiary text-5xl">error</span>
          <div>
            <p className="font-headline font-bold text-on-surface">Analysis Failed</p>
            {run.error_message && (
              <p className="text-xs text-on-surface-variant mt-2 font-mono bg-surface-container-high rounded-lg px-3 py-2 text-left">
                {run.error_message}
              </p>
            )}
          </div>
          <GlowButton variant="primary" onClick={handleRerun} disabled={rerunning} className="w-full py-3">
            <span className="material-symbols-outlined">refresh</span>
            {rerunning ? 'Starting…' : 'Try Again'}
          </GlowButton>
        </div>
      </div>
    )
  }

  // ── Completed — full result ───────────────────────────────────────────────
  const answers      = (result?.answers_json      ?? []) as QuestionAnswer[]
  const patterns     = (result?.patterns_json     ?? []) as AnalysisPattern[]
  const opportunities = (result?.opportunities_json ?? []) as AnalysisOpportunity[]
  const topIdeas     = (result?.top_ideas_json    ?? []) as AnalysisTopIdea[]
  const nextActions  = (result?.next_actions_json ?? []) as AnalysisNextAction[]

  return (
    <div className="min-h-screen bg-surface px-6 py-10 space-y-8 pb-10">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-on-surface-variant active:scale-95 transition-transform">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline font-bold text-lg text-on-surface truncate">{run.title}</h1>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-0.5 flex-wrap">
            {run.curated_set && <span>{run.curated_set.title}</span>}
            {qs && <><span>·</span><span>{qs.title}</span></>}
            <span>·</span>
            <span>{formatDate(run.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            Complete
          </span>
        </div>
      </div>

      {/* ── Synopsis ────────────────────────────────────── */}
      {result?.synopsis && (
        <section className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 p-5 ring-1 ring-primary/20">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Synopsis</p>
          <p className="text-sm text-on-surface leading-relaxed">{result.synopsis}</p>
        </section>
      )}

      {/* ── Questions & Answers ─────────────────────────── */}
      {answers.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Questions &amp; Answers
          </p>
          {answers.map((qa) => (
            <div key={qa.question_number} className="rounded-xl bg-surface-container p-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-[10px] font-bold">{qa.question_number}</span>
                </div>
                <p className="text-xs font-bold text-on-surface-variant">{qa.question_text}</p>
              </div>
              <p className="text-sm text-on-surface leading-relaxed pl-8">{qa.answer}</p>
              {qa.entry_ids?.length > 0 && (
                <div className="pl-8">
                  <EntryThumbnailChip entryIds={qa.entry_ids} entries={entries} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Patterns ────────────────────────────────────── */}
      {patterns.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Patterns · {patterns.length}
          </p>
          {patterns.map(p => (
            <div key={p.id} className="rounded-xl bg-surface-container p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-headline font-bold text-sm text-on-surface">{p.title}</p>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${FREQ_STYLE[p.frequency] ?? FREQ_STYLE.low}`}>
                  {p.frequency}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{p.description}</p>
              {p.entry_ids?.length > 0 && (
                <EntryThumbnailChip entryIds={p.entry_ids} entries={entries} />
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Opportunities ────────────────────────────────── */}
      {opportunities.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Opportunities · {opportunities.length}
          </p>
          {opportunities.map(o => (
            <div key={o.id} className="rounded-xl bg-surface-container p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-headline font-bold text-sm text-on-surface">{o.title}</p>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 ${FREQ_STYLE[o.potential] ?? FREQ_STYLE.low}`}>
                  {o.potential}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">{o.description}</p>
              {o.entry_ids?.length > 0 && (
                <EntryThumbnailChip entryIds={o.entry_ids} entries={entries} />
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Top Ideas ────────────────────────────────────── */}
      {topIdeas.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Top Ideas · {topIdeas.length}
          </p>
          {topIdeas.map((idea, i) => (
            <div key={idea.id} className="rounded-xl bg-surface-container p-4 space-y-2 ring-1 ring-primary/10">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-cta flex items-center justify-center flex-shrink-0">
                  <span className="text-on-primary text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-sm text-on-surface">{idea.title}</p>
                  <p className="text-sm text-on-surface-variant leading-relaxed mt-1">{idea.description}</p>
                </div>
              </div>
              {idea.rationale && (
                <div className="ml-10 rounded-lg bg-primary/5 px-3 py-2">
                  <p className="text-[11px] text-primary font-bold">Why this is strong</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{idea.rationale}</p>
                </div>
              )}
              {idea.entry_ids?.length > 0 && (
                <div className="ml-10">
                  <EntryThumbnailChip entryIds={idea.entry_ids} entries={entries} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ── Next Actions ─────────────────────────────────── */}
      {nextActions.length > 0 && (
        <section className="space-y-3">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            Next Actions · {nextActions.length}
          </p>
          <div className="rounded-xl bg-surface-container divide-y divide-outline-variant/10">
            {nextActions.map(action => (
              <div key={action.id} className="flex items-start gap-3 p-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${CAT_STYLE[action.category] ?? CAT_STYLE.other}`}>
                  {CAT_LABEL[action.category] ?? action.category}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-on-surface leading-relaxed">{action.action}</p>
                  {action.entry_ids?.length > 0 && (
                    <EntryThumbnailChip entryIds={action.entry_ids} entries={entries} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Export ───────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Export</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={copyMarkdown}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high py-4 text-on-surface-variant hover:text-primary transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">content_copy</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Copy MD</span>
          </button>
          <button
            onClick={downloadMarkdown}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high py-4 text-on-surface-variant hover:text-primary transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">download</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Download .md</span>
          </button>
          <button
            onClick={downloadJSON}
            className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high py-4 text-on-surface-variant hover:text-secondary transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">data_object</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Download JSON</span>
          </button>
        </div>
      </section>

      {/* ── Re-run ───────────────────────────────────────── */}
      <GlowButton
        variant="secondary"
        onClick={handleRerun}
        disabled={rerunning}
        icon="refresh"
        className="w-full py-3"
      >
        {rerunning ? 'Starting new run…' : 'Run Again'}
      </GlowButton>
    </div>
  )
}

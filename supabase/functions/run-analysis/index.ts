import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let analysis_run_id: string | undefined

  try {
    const body = await req.json()
    analysis_run_id = body.analysis_run_id

    if (!analysis_run_id) {
      return new Response(JSON.stringify({ error: 'analysis_run_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client — bypasses RLS so edge function can read/write freely
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ── 1. Mark as running ────────────────────────────────────────────────────
    await supabase
      .from('analysis_runs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', analysis_run_id)

    // ── 2. Load all data for the run ─────────────────────────────────────────
    const { data: run, error: runError } = await supabase
      .from('analysis_runs')
      .select(`
        *,
        event:events(title, location),
        curated_set:curated_sets(
          title, description,
          curated_set_entries(
            sort_order,
            entry:entries(
              id, title, booth_name, artist_name,
              visual_inspiration, emotional_reaction,
              brand_idea, material_or_phrase,
              notes, price_range, is_favorite,
              entry_tags(tag:tags(name))
            )
          )
        ),
        question_set:question_sets(title, question_1, question_2, question_3)
      `)
      .eq('id', analysis_run_id)
      .single()

    if (runError || !run) throw new Error(`Could not load run: ${runError?.message}`)

    const entries = (run.curated_set.curated_set_entries as any[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((cse: any) => cse.entry)

    const qs = run.question_set as any

    // ── 3. Assemble prompt ───────────────────────────────────────────────────
    const entriesText = entries.map((e: any) => {
      const tags = (e.entry_tags ?? []).map((et: any) => et.tag.name).join(', ') || 'none'
      const name = e.title || e.booth_name || e.artist_name || 'Untitled'
      return [
        `[ENTRY id:${e.id}]`,
        `Name: ${name}`,
        e.artist_name   ? `Artist: ${e.artist_name}`              : null,
        e.visual_inspiration   ? `Visual: ${e.visual_inspiration}` : null,
        e.emotional_reaction   ? `Feeling: ${e.emotional_reaction}`: null,
        e.brand_idea           ? `Brand idea: ${e.brand_idea}`     : null,
        e.material_or_phrase   ? `Material/phrase: ${e.material_or_phrase}` : null,
        e.price_range          ? `Price: ${e.price_range}`         : null,
        e.notes                ? `Notes: ${e.notes}`               : null,
        `Tags: ${tags}`,
        e.is_favorite          ? `Favorited: yes`                  : null,
      ].filter(Boolean).join('\n')
    }).join('\n\n---\n\n')

    const prompt = `You are an expert creative strategist analyzing inspiration captured at a design and art convention.

EVENT: ${run.event.title}${run.event.location ? ` — ${run.event.location}` : ''}
CURATED SET: "${run.curated_set.title}"${run.curated_set.description ? `\nSET DESCRIPTION: ${run.curated_set.description}` : ''}
TOTAL ENTRIES: ${entries.length}

══ ENTRIES ══

${entriesText}

══ ANALYSIS QUESTIONS ══

1. ${qs.question_1}
2. ${qs.question_2}
3. ${qs.question_3}

══ INSTRUCTIONS ══

Analyze all entries above. Use the ENTRY id values (e.g. "abc-123") in entry_ids arrays to trace insights back to specific captures.

Respond with ONLY a valid JSON code block — no prose, no explanation:

\`\`\`json
{
  "synopsis": "2–3 sentence overview of the collection as a whole",
  "answers": [
    { "question_number": 1, "question_text": "${qs.question_1}", "answer": "detailed answer", "entry_ids": ["entry-id"] },
    { "question_number": 2, "question_text": "${qs.question_2}", "answer": "detailed answer", "entry_ids": ["entry-id"] },
    { "question_number": 3, "question_text": "${qs.question_3}", "answer": "detailed answer", "entry_ids": ["entry-id"] }
  ],
  "patterns": [
    { "id": "kebab-slug", "title": "Pattern Name", "description": "what this reveals", "frequency": "high", "entry_ids": ["entry-id"] }
  ],
  "opportunities": [
    { "id": "kebab-slug", "title": "Opportunity Name", "description": "why this matters and how to act", "potential": "high", "entry_ids": ["entry-id"] }
  ],
  "top_ideas": [
    { "id": "kebab-slug", "title": "Idea Name", "description": "what this is", "rationale": "why this is strong", "entry_ids": ["entry-id"] }
  ],
  "next_actions": [
    { "id": "kebab-slug", "action": "concrete specific action", "category": "create", "entry_ids": ["entry-id"] }
  ]
}
\`\`\`

Use "high", "medium", or "low" for frequency and potential.
Use one of: "research", "create", "reach_out", "purchase", "other" for category.
Include at least 3 patterns, 3 opportunities, 3 top_ideas, and 4 next_actions.
Be specific and actionable — reference what you actually saw in the entries.`

    // ── 4. Call Claude API ────────────────────────────────────────────────────
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      throw new Error(`Anthropic API error ${aiRes.status}: ${errText}`)
    }

    const aiData = await aiRes.json()
    const rawResponse: string = aiData.content?.[0]?.text ?? ''

    // ── 5. Parse JSON from response ──────────────────────────────────────────
    let structured: any
    const fenceMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
    try {
      structured = JSON.parse(fenceMatch ? fenceMatch[1].trim() : rawResponse.trim())
    } catch {
      throw new Error('Could not parse AI response as JSON')
    }

    // ── 6. Build Obsidian-compatible markdown export ──────────────────────────
    const runDate = new Date().toISOString().split('T')[0]
    const markdown = [
      `---`,
      `title: "${run.title}"`,
      `curated_set: "${run.curated_set.title}"`,
      `event: "${run.event.title}"`,
      `question_set: "${qs.title}"`,
      `model: "claude-3-5-sonnet-20241022"`,
      `run_date: "${runDate}"`,
      `entry_count: ${entries.length}`,
      `tags: [analysis, inspiration, convention]`,
      `---`,
      ``,
      `# ${run.title}`,
      ``,
      `**Event:** ${run.event.title}  `,
      `**Curated Set:** ${run.curated_set.title}  `,
      `**Entries Analyzed:** ${entries.length}  `,
      `**Date:** ${runDate}`,
      ``,
      `## Synopsis`,
      ``,
      structured.synopsis ?? '',
      ``,
      `## Questions & Answers`,
      ``,
      ...(structured.answers ?? []).flatMap((qa: any) => [
        `### ${qa.question_number}. ${qa.question_text}`,
        ``,
        qa.answer,
        ``,
      ]),
      `## Patterns`,
      ``,
      ...(structured.patterns ?? []).flatMap((p: any) => [
        `### ${p.title}  _(${p.frequency} frequency)_`,
        ``,
        p.description,
        ``,
      ]),
      `## Opportunities`,
      ``,
      ...(structured.opportunities ?? []).flatMap((o: any) => [
        `### ${o.title}  _(${o.potential} potential)_`,
        ``,
        o.description,
        ``,
      ]),
      `## Top Ideas`,
      ``,
      ...(structured.top_ideas ?? []).flatMap((idea: any) => [
        `### ${idea.title}`,
        ``,
        idea.description,
        ``,
        `> **Why this is strong:** ${idea.rationale}`,
        ``,
      ]),
      `## Next Actions`,
      ``,
      ...(structured.next_actions ?? []).map((a: any) =>
        `- **[${a.category.toUpperCase()}]** ${a.action}`
      ),
      ``,
      `---`,
      `*Generated by Inspiration Capture · claude-3-5-sonnet-20241022*`,
    ].join('\n')

    // ── 7. Save result ────────────────────────────────────────────────────────
    const { error: insertError } = await supabase.from('analysis_results').insert({
      analysis_run_id:    analysis_run_id,
      synopsis:           structured.synopsis ?? null,
      answers_json:       structured.answers ?? null,
      patterns_json:      structured.patterns ?? null,
      opportunities_json: structured.opportunities ?? null,
      top_ideas_json:     structured.top_ideas ?? null,
      next_actions_json:  structured.next_actions ?? null,
      raw_response:       rawResponse,
      markdown_export:    markdown,
    })

    if (insertError) throw new Error(`Failed to save result: ${insertError.message}`)

    // ── 8. Mark completed ─────────────────────────────────────────────────────
    await supabase
      .from('analysis_runs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', analysis_run_id)

    return new Response(JSON.stringify({ success: true, analysis_run_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('[run-analysis] error:', err)

    // Mark run as failed if we have the ID
    if (analysis_run_id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        await supabase
          .from('analysis_runs')
          .update({ status: 'failed', error_message: err?.message ?? 'Unknown error' })
          .eq('id', analysis_run_id)
      } catch (_) { /* silent */ }
    }

    return new Response(JSON.stringify({ error: err?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

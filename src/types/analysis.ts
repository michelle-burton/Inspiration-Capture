// ── Analysis Run ──────────────────────────────────────────────────────────────

export type AnalysisRunStatus = 'queued' | 'running' | 'completed' | 'failed'

export type AnalysisRun = {
  id:              string
  user_id:         string
  event_id:        string
  curated_set_id:  string
  question_set_id: string | null
  title:           string
  prompt_version:  string
  model_name:      string
  status:          AnalysisRunStatus
  error_message:   string | null
  started_at:      string | null
  completed_at:    string | null
  created_at:      string
  updated_at:      string
  // Joined
  event?:          { title: string; location: string | null }
  curated_set?:    {
    title: string
    description: string | null
    curated_set_entries: {
      sort_order: number
      entry: {
        id: string
        title: string | null
        booth_name: string | null
        artist_name: string | null
        created_at: string
        entry_images: { storage_path: string }[]
      }
    }[]
  }
  question_set?:   {
    title:      string
    question_1: string
    question_2: string
    question_3: string
  } | null
  result?:         AnalysisResult | null
}

// ── Analysis Result ───────────────────────────────────────────────────────────

export type QuestionAnswer = {
  question_number: 1 | 2 | 3
  question_text:   string
  answer:          string
  entry_ids:       string[]
}

export type AnalysisPattern = {
  id:          string
  title:       string
  description: string
  frequency:   'high' | 'medium' | 'low'
  entry_ids:   string[]
}

export type AnalysisOpportunity = {
  id:          string
  title:       string
  description: string
  potential:   'high' | 'medium' | 'low'
  entry_ids:   string[]
}

export type AnalysisTopIdea = {
  id:          string
  title:       string
  description: string
  rationale:   string
  entry_ids:   string[]
}

export type AnalysisNextAction = {
  id:        string
  action:    string
  category:  'research' | 'create' | 'reach_out' | 'purchase' | 'other'
  entry_ids: string[]
}

export type AnalysisResult = {
  id:                  string
  analysis_run_id:     string
  synopsis:            string | null
  answers_json:        QuestionAnswer[]     | null
  patterns_json:       AnalysisPattern[]    | null
  opportunities_json:  AnalysisOpportunity[]| null
  top_ideas_json:      AnalysisTopIdea[]    | null
  next_actions_json:   AnalysisNextAction[] | null
  raw_response:        string | null
  markdown_export:     string | null
  created_at:          string
  updated_at:          string
}

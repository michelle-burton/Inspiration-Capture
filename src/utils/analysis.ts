import { supabase } from './supabase'

export async function createAnalysisRun(data: {
  event_id:        string
  curated_set_id:  string
  question_set_id: string
  title:           string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase
    .from('analysis_runs')
    .insert({
      ...data,
      user_id:        user?.id,
      status:         'queued',
      model_name:     'claude-3-5-sonnet-20241022',
      prompt_version: '1.0',
    })
    .select()
    .single()
}

export async function getAnalysisRun(id: string) {
  return supabase
    .from('analysis_runs')
    .select(`
      *,
      event:events(title, location),
      curated_set:curated_sets(
        title, description,
        curated_set_entries(
          sort_order,
          entry:entries(
            id, title, booth_name, artist_name, created_at,
            entry_images(storage_path)
          )
        )
      ),
      question_set:question_sets(title, question_1, question_2, question_3),
      result:analysis_results(*)
    `)
    .eq('id', id)
    .single()
}

export async function getAnalysisRunsForSet(curatedSetId: string) {
  return supabase
    .from('analysis_runs')
    .select('*, question_set:question_sets(title)')
    .eq('curated_set_id', curatedSetId)
    .order('created_at', { ascending: false })
}

export async function invokeAnalysis(analysisRunId: string) {
  return supabase.functions.invoke('run-analysis', {
    body: { analysis_run_id: analysisRunId },
  })
}

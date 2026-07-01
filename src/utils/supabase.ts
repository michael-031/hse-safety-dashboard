import { createClient } from '@supabase/supabase-js'
import type { SafetyData } from '../types/dashboard'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if credentials are valid and configured (not the default placeholders)
export const hasSupabaseConfig = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  supabaseAnonKey !== 'your_supabase_anon_public_key'
)

export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl : 'https://placeholder.supabase.co',
  hasSupabaseConfig ? supabaseAnonKey : 'placeholder-key'
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rowToSafetyData = (row: any): SafetyData => {
  const data: SafetyData = {
    totalManHours:  row.total_man_hours  ?? 0,
    lti:            row.lti              ?? 0,
    rwc:            row.rwc              ?? 0,
    mtc:            row.mtc              ?? 0,
    fac:            row.fac              ?? 0,
    observations:   row.observations     ?? 0,
    hazardsClosed:  row.hazards_closed   ?? 0,
    auditsPlanned:  row.audits_planned   ?? 0,
    auditsCompleted: row.audits_completed ?? 0,
  }
  if ('custom_metrics' in row) {
    data.customMetrics = row.custom_metrics
  }
  return data
}

export const safetyDataToRow = (data: SafetyData) => {
  const row: any = {
    id:               1,
    total_man_hours:  data.totalManHours,
    lti:              data.lti,
    rwc:              data.rwc,
    mtc:              data.mtc,
    fac:              data.fac,
    observations:     data.observations,
    hazards_closed:   data.hazardsClosed,
    audits_planned:   data.auditsPlanned,
    audits_completed: data.auditsCompleted,
    updated_at:       new Date().toISOString(),
  }
  if (data.customMetrics !== undefined) {
    row.custom_metrics = data.customMetrics
  }
  return row
}

// ─── Fetch the single metrics row ─────────────────────────────────────────────
export const fetchMetrics = async (): Promise<SafetyData | null> => {
  const { data, error } = await supabase
    .from('hse_metrics')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) {
    console.error('[supabase] fetchMetrics error:', error.message)
    return null
  }
  return rowToSafetyData(data)
}

// ─── Upsert (overwrite) the single metrics row ────────────────────────────────
export const saveMetrics = async (data: SafetyData, includeCustom: boolean = false): Promise<boolean> => {
  const row = safetyDataToRow(data)
  const { id: _id, ...rowWithoutId } = row
  if (!includeCustom) {
    delete rowWithoutId.custom_metrics
  }
  
  const { error } = await supabase
    .from('hse_metrics')
    .update({ ...rowWithoutId, updated_at: new Date().toISOString() })
    .eq('id', 1)

  if (error) {
    console.error('[supabase] saveMetrics error:', error.message)
    return false
  }
  return true
}


export interface SafetyData {
  totalManHours: number
  lti: number
  rwc: number
  mtc: number
  fac: number
  observations: number
  hazardsClosed: number
  auditsPlanned: number
  auditsCompleted: number
  customMetrics?: any
}

export interface CalculatedMetrics {
  tri: number
  trir: number
  ltifr: number
  hazardCloseOutRate: number
  auditCompletionRate: number
  riskStatus: 'low' | 'moderate' | 'high'
  riskLabel: string
}

export interface MetricItem {
  id: string
  label: string
  type: 'exposure' | 'lagging' | 'leading'
  value: number
  info?: string
  target?: number        // Target baseline benchmark
  isCustom?: boolean     // Added by user
  isRecordable?: boolean // Lagging indicators: if it contributes to TRIR/TRI (defaults to true)
  color?: string         // Legend & chart color override
  isActive?: boolean     // False if soft-deleted
}

export interface KPITargets {
  trir: number
  ltifr: number
  hazardCloseOut: number
  auditCompletion: number
}
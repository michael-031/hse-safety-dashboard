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
  target?: number        // Leading indicators only
  isCustom?: boolean     // Added by user
  isRecordable?: boolean // Lagging indicators: if it contributes to TRIR/TRI (defaults to true)
  color?: string         // Legend & chart color override
  isActive?: boolean     // False if soft-deleted
}
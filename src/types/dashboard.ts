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
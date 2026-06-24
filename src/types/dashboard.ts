export interface SafetyData {
  safeWorkDays: number
  totalManHours: number
  lti: number
  rwc: number
  mtc: number
  fac: number
  observations: number
  ergoAssessed: number
  ergoTotal: number
  cacrResolved: number
  cacrTotal: number
  trainingCompleted: number
  trainingTotal: number
  daysLost: number
}

export interface CalculatedMetrics {
  tri: number
  trir: number
  ltifr: number
  ergoRate: number
  cacrRate: number
  trainingRate: number
  severityIndex: number
  riskStatus: 'low' | 'moderate' | 'high'
  riskLabel: string
}
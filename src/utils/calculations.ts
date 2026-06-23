import type { SafetyData, CalculatedMetrics } from '../types/dashboard'

export function calculateSafetyMetrics(
  data: SafetyData,
  useExcelFormula: boolean = false
): CalculatedMetrics {
  const {
    totalManHours,
    lti,
    rwc,
    mtc,
    observations,
    hazardsClosed,
    auditsPlanned,
    auditsCompleted,
  } = data

  // 1. Total Recordable Incidents (TRI) = LTI + RWC + MTC
  const tri = lti + rwc + mtc

  // 2. Total Recordable Incident Rate (TRIR) = (TRI * 200,000) / Man-Hours
  const trir = totalManHours > 0 ? (tri * 200000) / totalManHours : 0

  // 3. Lost Time Injury Frequency Rate (LTIFR) = (LTI * 1,000,000) / Man-Hours
  const ltifr = totalManHours > 0 ? (lti * 1000000) / totalManHours : 0

  // 4. Hazard Close-Out Rate (%)
  // Standard: (Closed / Observations) * 100
  // Excel screenshot: (Observations / Closed) * 100
  let hazardCloseOutRate = 0
  if (useExcelFormula) {
    hazardCloseOutRate = hazardsClosed > 0 ? (observations / hazardsClosed) * 100 : 0
  } else {
    hazardCloseOutRate = observations > 0 ? (hazardsClosed / observations) * 100 : 0
  }

  // 5. Audit Completion Rate (%) = (Completed / Planned) * 100
  const auditCompletionRate =
    auditsPlanned > 0 ? (auditsCompleted / auditsPlanned) * 100 : 0

  // 6. Risk Status & Label based on TRIR
  let riskStatus: 'low' | 'moderate' | 'high' = 'low'
  let riskLabel = ''

  if (trir < 1.00) {
    riskStatus = 'low'
    riskLabel = `STABLE / LOW RISK PERFORMANCE BOUNDS (TRIR < 1.00)`
  } else if (trir >= 1.00 && trir < 2.00) {
    riskStatus = 'moderate'
    riskLabel = `MODERATE RISK PERFORMANCE BOUNDS (1.00 <= TRIR < 2.00)`
  } else {
    riskStatus = 'high'
    riskLabel = `HIGH RISK PERFORMANCE BOUNDS (TRIR >= 2.00)`
  }

  return {
    tri,
    trir,
    ltifr,
    hazardCloseOutRate,
    auditCompletionRate,
    riskStatus,
    riskLabel,
  }
}

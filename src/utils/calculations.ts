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
    ergoAssessed,
    ergoTotal,
    cacrResolved,
    cacrTotal,
    trainingCompleted,
    trainingTotal,
    daysLost,
  } = data

  // 1. Total Recordable Incidents (TRI) = LTI + RWC + MTC
  const tri = lti + rwc + mtc

  // 2. Total Recordable Incident Rate (TRIR) = (TRI * 200,000) / Exposure Hours
  const trir = totalManHours > 0 ? (tri * 200000) / totalManHours : 0

  // 3. Lost Time Injury Frequency Rate (LTIFR) = (LTI * 1,000,000) / Exposure Hours
  const ltifr = totalManHours > 0 ? (lti * 1000000) / totalManHours : 0

  // 4. Ergonomic Workstation Assessment Rate (%) = (Assessed / Total) * 100
  const ergoRate = ergoTotal > 0 ? (ergoAssessed / ergoTotal) * 100 : 0

  // 5. Corrective Action Closure Rate (CACR) (%)
  // Standard: (Resolved Within Target / Total Identified Safety Actions) * 100
  // Excel screenshot equivalent: (Total Identified Safety Actions / Resolved) * 100
  let cacrRate: number
  if (useExcelFormula) {
    cacrRate = cacrResolved > 0 ? (cacrTotal / cacrResolved) * 100 : 0
  } else {
    cacrRate = cacrTotal > 0 ? (cacrResolved / cacrTotal) * 100 : 0
  }

  // 6. HSE Induction & Refresher Training Completion Rate (%) = (Trained / Total) * 100
  const trainingRate = trainingTotal > 0 ? (trainingCompleted / trainingTotal) * 100 : 0

  // 7. Severity Index (SI) = Days Lost
  const severityIndex = daysLost

  // 8. Risk Status & Label based on TRIR, LTI, and other thresholds
  let riskStatus: 'low' | 'moderate' | 'high'
  let riskLabel: string

  if (lti > 0 || trir >= 0.50 || cacrRate < 85 || ergoRate < 90) {
    riskStatus = 'high'
    riskLabel = `HIGH RISK BOUNDS (LTI: ${lti} | TRIR: ${trir.toFixed(2)} >= 0.50)`
  } else if (trir > 0 || cacrRate < 95 || ergoRate < 95 || trainingRate < 100) {
    riskStatus = 'moderate'
    riskLabel = `MODERATE RISK BOUNDS (CACR: ${cacrRate.toFixed(1)}% | Ergo: ${ergoRate.toFixed(1)}%)`
  } else {
    riskStatus = 'low'
    riskLabel = 'STABLE / ON TRACK (All indicators within safe operational bounds)'
  }

  return {
    tri,
    trir,
    ltifr,
    ergoRate,
    cacrRate,
    trainingRate,
    severityIndex,
    riskStatus,
    riskLabel,
  }
}


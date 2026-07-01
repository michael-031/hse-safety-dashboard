import type { SafetyData, CalculatedMetrics, MetricItem } from '../types/dashboard'

export function calculateSafetyMetrics(
  data: SafetyData,
  useExcelFormula: boolean = false,
  metricsList?: MetricItem[]
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

  // Helper to extract metric values dynamically
  const getMetricValue = (id: string, fallback: number) => {
    if (!metricsList) return fallback
    const found = metricsList.find(m => m.id === id && m.isActive !== false)
    return found ? found.value : 0
  }

  // Helper to check if metric is active
  const getMetricActive = (id: string) => {
    if (!metricsList) return true
    const found = metricsList.find(m => m.id === id)
    return found ? found.isActive !== false : false
  }

  // 1. Total Recordable Incidents (TRI)
  let tri = lti + rwc + mtc
  if (metricsList) {
    const lagging = metricsList.filter(m => m.type === 'lagging' && m.isActive !== false)
    tri = lagging
      .filter(m => m.id === 'lti' || m.id === 'rwc' || m.id === 'mtc' || (m.isCustom && m.isRecordable !== false))
      .reduce((sum, m) => sum + m.value, 0)
  }

  // 2. Total Recordable Incident Rate (TRIR) = (TRI * 200,000) / Man-Hours
  const manHoursVal = getMetricValue('totalManHours', totalManHours)
  const trir = manHoursVal > 0 ? (tri * 200000) / manHoursVal : 0

  // 3. Lost Time Injury Frequency Rate (LTIFR) = (LTI * 1,000,000) / Man-Hours
  const ltiVal = getMetricValue('lti', lti)
  const ltifr = manHoursVal > 0 ? (ltiVal * 1000000) / manHoursVal : 0

  // 4. Hazard Close-Out Rate (%)
  let hazardCloseOutRate = 0
  const obsActive = getMetricActive('observations')
  const hcActive = getMetricActive('hazardsClosed')
  if (obsActive && hcActive) {
    const obsVal = getMetricValue('observations', observations)
    const hcVal = getMetricValue('hazardsClosed', hazardsClosed)
    if (useExcelFormula) {
      hazardCloseOutRate = hcVal > 0 ? (obsVal / hcVal) * 100 : 0
    } else {
      hazardCloseOutRate = obsVal > 0 ? (hcVal / obsVal) * 100 : 0
    }
  }

  // 5. Audit Completion Rate (%) = (Completed / Planned) * 100
  let auditCompletionRate = 0
  const apActive = getMetricActive('auditsPlanned')
  const acActive = getMetricActive('auditsCompleted')
  if (apActive && acActive) {
    const apVal = getMetricValue('auditsPlanned', auditsPlanned)
    const acVal = getMetricValue('auditsCompleted', auditsCompleted)
    auditCompletionRate = apVal > 0 ? (acVal / apVal) * 100 : 0
  }

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


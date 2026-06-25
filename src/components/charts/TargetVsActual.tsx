import React from 'react'
import ReactECharts from 'echarts-for-react'

interface TargetVsActualProps {
  observations: number
  hazardRate: number
  auditRate: number
  hoveredCategory?: string | null
}

export const TargetVsActual: React.FC<TargetVsActualProps> = ({
  observations,
  hazardRate,
  auditRate,
  hoveredCategory,
}) => {
  const chartRef = React.useRef<any>(null)

  React.useEffect(() => {
    if (!chartRef.current) return
    const chartInstance = chartRef.current.getEchartsInstance()

    chartInstance.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
    })
    chartInstance.dispatchAction({
      type: 'hideTip',
    })

    if (hoveredCategory) {
      const nameMap: Record<string, number> = {
        observations: 0,
        hazard: 1,
        audit: 2,
      }
      const idx = nameMap[hoveredCategory]
      if (idx !== undefined) {
        chartInstance.dispatchAction({
          type: 'highlight',
          seriesIndex: 0,
          dataIndex: idx,
        })
        chartInstance.dispatchAction({
          type: 'showTip',
          seriesIndex: 0,
          dataIndex: idx,
        })
      }
    }
  }, [hoveredCategory])
  // Define targets
  const targetObs = 400
  const targetHazard = 90
  const targetAudit = 95

  // Calculate achievement percentages (normalized)
  const obsAchieved = targetObs > 0 ? (observations / targetObs) * 100 : 0
  const hazardAchieved = targetHazard > 0 ? (hazardRate / targetHazard) * 100 : 0
  const auditAchieved = targetAudit > 0 ? (auditRate / targetAudit) * 100 : 0

  // Colors mapping: Blue (Observations), Yellow (Hazard Closeout), Green (Audit Execution), Red (Failing metrics / Target boundaries)
  const blueColor = '#3b82f6'
  const yellowColor = '#fbbf24'
  const greenColor = '#10b981'
  const redColor = '#ef4444'

  const data = [
    {
      name: 'Safety Observations',
      achieved: Math.round(obsAchieved * 10) / 10,
      actual: `${observations} Logged`,
      target: `Target: > ${targetObs}`,
      rawActual: observations,
      rawTarget: targetObs,
      color: observations >= targetObs ? blueColor : redColor,
    },
    {
      name: 'Hazard SLA Close-Out',
      achieved: Math.round(hazardAchieved * 10) / 10,
      actual: `${Math.round(hazardRate * 10) / 10}%`,
      target: `Target: Min ${targetHazard}%`,
      rawActual: hazardRate,
      rawTarget: targetHazard,
      color: hazardRate >= targetHazard ? yellowColor : redColor,
    },
    {
      name: 'HSE Audit Execution',
      achieved: Math.round(auditAchieved * 10) / 10,
      actual: `${Math.round(auditRate * 10) / 10}%`,
      target: `Target: Min ${targetAudit}%`,
      rawActual: auditRate,
      rawTarget: targetAudit,
      color: auditRate >= targetAudit ? greenColor : redColor,
    },
  ]

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#071324',
      borderColor: 'rgba(96, 165, 250, 0.2)',
      borderWidth: 1,
      textStyle: {
        color: '#ffffff',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        fontWeight: 500,
      },
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.3); border-radius: 8px;',
      formatter: (params: any) => {
        const index = params[0].dataIndex
        const item = data[index]
        return `
          <div style="font-weight: 700; margin-bottom: 4px; color: #ffffff;">${item.name}</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
            Actual: <span style="color: #ffffff; font-weight: 600;">${item.actual}</span><br/>
            Target: <span style="color: #64748b;">${item.target}</span><br/>
            Achievement: <span style="color: ${item.color}; font-weight: 700;">${item.achieved}%</span>
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '10%',
      top: '5%',
      bottom: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: (value: any) => Math.max(120, Math.ceil(value.max / 10) * 10),
      axisLabel: {
        formatter: '{value}%',
        color: '#94a3b8',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(96, 165, 250, 0.06)',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: {
        color: '#ffffff',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
        fontWeight: 600,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      axisTick: {
        show: false,
      },
    },
    series: [
      {
        name: 'Achievement',
        type: 'bar',
        barWidth: 14,
        itemStyle: {
          borderRadius: 8,
          color: (params: any) => {
            return data[params.dataIndex].color
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            return data[params.dataIndex].actual
          },
          color: '#ffffff',
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 11,
        },
        data: data.map((d) => d.achieved),
        markLine: {
          symbol: 'none',
          lineStyle: {
            color: '#ef4444',
            type: 'dashed',
            width: 1.5,
            opacity: 0.7,
          },
          label: {
            show: true,
            position: 'end',
            formatter: 'Target (100%)',
            color: '#ef4444',
            fontSize: 9,
            fontWeight: 700,
            fontFamily: 'Plus Jakarta Sans',
          },
          data: [
            {
              xAxis: 100,
            },
          ],
        },
      },
    ],
  }

  return (
    <div className="target-chart-container" style={{ width: '100%' }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  )
}
export default TargetVsActual

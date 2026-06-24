import React from 'react'
import ReactECharts from 'echarts-for-react'

interface TargetVsActualProps {
  ergoRate: number
  cacrRate: number
  trainingRate: number
  hoveredCategory?: string | null
}

export const TargetVsActual: React.FC<TargetVsActualProps> = ({
  ergoRate,
  cacrRate,
  trainingRate,
  hoveredCategory,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        ergo: 0,
        hazard: 1,
        cacr: 1,
        audit: 2,
        training: 2,
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

  // Define targets from the PDF Metric Architecture Framework
  const targetErgo = 95
  const targetCacr = 95
  const targetTraining = 100

  // Calculate achievement percentages (normalized relative to target, capped/scaled sensibly)
  const ergoAchieved = targetErgo > 0 ? ergoRate : 0
  const cacrAchieved = targetCacr > 0 ? cacrRate : 0
  const trainingAchieved = targetTraining > 0 ? trainingRate : 0

  // Colors mapping (Muted green for achieved/exceeded, Muted amber for action required/warning)
  const safeColor = '#16a34a' // Green status marker
  const warningColor = '#d97706' // Amber status marker
  const alertColor = '#dc2626' // Red status marker

  const getMetricColor = (val: number, target: number) => {
    if (val >= target) return safeColor
    if (val >= target * 0.9) return warningColor
    return alertColor
  }

  const data = [
    {
      name: 'Ergonomic Assessments',
      achieved: Math.round(ergoAchieved * 10) / 10,
      actual: `${Math.round(ergoRate * 10) / 10}%`,
      target: `Target: ≥ ${targetErgo}%`,
      rawActual: ergoRate,
      rawTarget: targetErgo,
      color: getMetricColor(ergoRate, targetErgo),
    },
    {
      name: 'Corrective Actions (CACR)',
      achieved: Math.round(cacrAchieved * 10) / 10,
      actual: `${Math.round(cacrRate * 10) / 10}%`,
      target: `Target: ≥ ${targetCacr}%`,
      rawActual: cacrRate,
      rawTarget: targetCacr,
      color: getMetricColor(cacrRate, targetCacr),
    },
    {
      name: 'HSE Training Completion',
      achieved: Math.round(trainingAchieved * 10) / 10,
      actual: `${Math.round(trainingRate * 10) / 10}%`,
      target: `Target: ${targetTraining}%`,
      rawActual: trainingRate,
      rawTarget: targetTraining,
      color: getMetricColor(trainingRate, targetTraining),
    },
  ]

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#ffffff',
      borderColor: 'rgba(94, 124, 107, 0.12)',
      borderWidth: 1,
      textStyle: {
        color: '#1c2821',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        fontWeight: 500,
      },
      extraCssText: 'box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 8px;',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const index = params[0].dataIndex
        const item = data[index]
        return `
          <div style="font-weight: 700; margin-bottom: 4px; color: #1c2821;">${item.name}</div>
          <div style="font-size: 11px; color: #5e6b62; line-height: 1.5;">
            Actual Compliance: <span style="color: #1c2821; font-weight: 600;">${item.actual}</span><br/>
            Requirement: <span style="color: #8b9990;">${item.target}</span><br/>
            Performance Level: <span style="color: ${item.color}; font-weight: 700;">${item.achieved >= item.rawTarget ? 'Compliant' : 'Needs Action'}</span>
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '12%',
      top: '5%',
      bottom: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: '#8b9990',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(94, 124, 107, 0.05)',
        },
      },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: {
        color: '#1c2821',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
        fontWeight: 600,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(94, 124, 107, 0.1)',
        },
      },
      axisTick: {
        show: false,
      },
    },
    series: [
      {
        name: 'Actual Rate',
        type: 'bar',
        barWidth: 14,
        itemStyle: {
          borderRadius: 8,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          color: (params: any) => {
            return data[params.dataIndex].color
          },
        },
        label: {
          show: true,
          position: 'right',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            return data[params.dataIndex].actual
          },
          color: '#1c2821',
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 700,
          fontSize: 11,
        },
        data: data.map((d) => d.achieved),
        markLine: {
          symbol: 'none',
          lineStyle: {
            color: 'rgba(28, 40, 33, 0.25)',
            type: 'dashed',
            width: 1.5,
          },
          label: {
            show: false,
          },
          data: [
            {
              xAxis: 95,
              name: '95% Threshold',
              lineStyle: {
                color: '#d97706',
              },
            },
            {
              xAxis: 100,
              name: '100% Target',
              lineStyle: {
                color: '#16a34a',
              },
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


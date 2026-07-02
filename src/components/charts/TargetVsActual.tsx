import React from 'react'
import ReactECharts from 'echarts-for-react'

export interface LeadingMetricData {
  name: string
  actual: number
  target: number
  displayActual: string
  displayTarget: string
  color: string
}

interface TargetVsActualProps {
  leadingData: LeadingMetricData[]
  hoveredCategory?: string | null
  theme?: 'light' | 'dark'
}

export const TargetVsActual: React.FC<TargetVsActualProps> = ({
  leadingData,
  hoveredCategory,
  theme = 'dark',
}) => {
  const chartRef = React.useRef<any>(null)

  const data = React.useMemo(() => {
    return leadingData.map(d => {
      const achieved = d.target > 0 ? (d.actual / d.target) * 100 : 0
      return {
        name: d.name,
        achieved: Math.round(achieved * 10) / 10,
        actual: d.displayActual,
        target: d.displayTarget,
        color: d.color,
      }
    })
  }, [leadingData])

  React.useEffect(() => {
    if (!chartRef.current) return
    const chartInstance = chartRef.current.getEchartsInstance()

    chartInstance.dispatchAction({
      type: 'downplay', seriesIndex: 0,
    })
    chartInstance.dispatchAction({
      type: 'hideTip',
    })

    if (hoveredCategory) {
      const idx = leadingData.findIndex((d) =>
        d.name.toLowerCase().includes(hoveredCategory.toLowerCase())
      )
      if (idx !== -1) {
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
  }, [hoveredCategory, leadingData])

  const isDark = theme !== 'light'
  const textColor = isDark ? '#ffffff' : '#0f172a'
  const textMuted = isDark ? '#94a3b8' : '#475569'
  const textSecondaryColor = isDark ? '#64748b' : '#64748b'
  const tooltipBg = isDark ? '#071324' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.15)'
  const axisLineColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  const splitLineColor = isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(37, 99, 235, 0.06)'

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: textColor,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 12,
        fontWeight: 500,
      },
      extraCssText: `box-shadow: ${isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'}; border-radius: 8px;`,
      formatter: (params: any) => {
        const index = params[0].dataIndex
        const item = data[index]
        if (!item) return ''
        return `
          <div style="font-weight: 700; margin-bottom: 4px; color: ${textColor};">${item.name}</div>
          <div style="font-size: 11px; color: ${textMuted}; line-height: 1.5;">
            Actual: <span style="color: ${textColor}; font-weight: 600;">${item.actual}</span><br/>
            Target: <span style="color: ${textSecondaryColor};">${item.target}</span><br/>
            Achievement: <span style="color: ${item.color}; font-weight: 700;">${item.achieved}%</span>
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '12%',
      top: 35,
      bottom: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: (value: any) => Math.max(120, Math.ceil(value.max / 10) * 10),
      axisLabel: {
        formatter: '{value}%',
        color: textMuted,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
        },
      },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLabel: {
        color: textColor,
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
        fontWeight: 600,
      },
      axisLine: {
        lineStyle: {
          color: axisLineColor,
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
            return data[params.dataIndex]?.color || '#3b82f6'
          },
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => {
            return data[params.dataIndex]?.actual || ''
          },
          color: textColor,
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
    dataZoom: data.length > 8 ? [
      {
        type: 'inside',
        yAxisIndex: 0,
        startValue: Math.max(0, data.length - 8),
        endValue: data.length - 1,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true
      },
      {
        type: 'slider',
        show: true,
        yAxisIndex: 0,
        width: 8,
        right: 4,
        startValue: Math.max(0, data.length - 8),
        endValue: data.length - 1,
        borderColor: 'transparent',
        fillerColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
        backgroundColor: 'transparent',
        handleSize: 0,
        showDetail: false,
        zoomLock: true
      }
    ] : [],
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


import React from 'react'
import ReactECharts from 'echarts-for-react'

export interface LaggingMetricData {
  name: string
  value: number
  color?: string
}

interface IncidentDonutProps {
  laggingData: LaggingMetricData[]
  hoveredCategory?: string | null
  theme?: 'light' | 'dark'
}

export const IncidentDonut: React.FC<IncidentDonutProps> = ({
  laggingData,
  hoveredCategory,
  theme = 'dark',
}) => {
  const total = laggingData.reduce((sum, item) => sum + item.value, 0)
  const isAllZero = total === 0

  const chartRef = React.useRef<any>(null)

  const defaultColors = [
    '#ef4444', // Red
    '#fbbf24', // Yellow
    '#3b82f6', // Blue
    '#10b981', // Green
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#14b8a6', // Teal
  ]

  const filteredData = React.useMemo(() => {
    return isAllZero
      ? [
          {
            value: 1,
            name: 'Safe Workplace',
            tooltip: {
              formatter: 'All indicators stable: 0 incidents',
            },
          },
        ]
      : laggingData
          .filter((item) => item.value > 0)
          .map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: item.color || defaultColors[index % defaultColors.length]
            }
          }))
  }, [laggingData, isAllZero])

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
      const idx = filteredData.findIndex((item) =>
        item.name.toLowerCase().includes(hoveredCategory.toLowerCase())
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
  }, [hoveredCategory, filteredData])

  const isDark = theme !== 'light'
  const textColor = isDark ? '#ffffff' : '#0f172a'
  const tooltipBg = isDark ? '#071324' : '#ffffff'
  const tooltipBorder = isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.15)'
  const chartBorderColor = isDark ? '#071324' : '#ffffff'
  const emphasisColor = isDark ? '#ffffff' : '#0f172a'
  const centerValueColor = isAllZero ? '#10b981' : (isDark ? '#ffffff' : '#0f172a')

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
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
      formatter: '{b}: <b>{c}</b> ({d}%)',
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: 'Incidents',
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: chartBorderColor,
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: emphasisColor,
            formatter: '{b}\n{c}',
            fontFamily: 'Plus Jakarta Sans',
          },
        },
        labelLine: {
          show: false,
        },
        color: isAllZero
          ? [isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)']
          : defaultColors,
        data: filteredData,
      },
    ],
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
      <div className="donut-chart-container" style={{ position: 'relative', width: '100%' }}>
        <ReactECharts
          ref={chartRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'svg' }}
        />
        {/* Center Value Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '1.65rem',
              fontWeight: 800,
              color: centerValueColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            {isAllZero ? '0' : total}
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-secondary)',
              marginTop: '0.2rem',
              display: 'block',
            }}
          >
            {isAllZero ? 'Incidents' : 'Total'}
          </span>
        </div>
      </div>

      {/* Custom HTML Legend below the chart */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '0.4rem 0.8rem',
          marginTop: '0.75rem',
          width: '100%',
        }}
      >
        {isAllZero ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '11px',
              fontFamily: 'Plus Jakarta Sans',
              color: 'var(--text-secondary)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                display: 'inline-block',
              }}
            />
            <span>Safe Workplace</span>
          </div>
        ) : (
          laggingData
            .filter((item) => item.value > 0)
            .map((item, index) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '11px',
                  fontFamily: 'Plus Jakarta Sans',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: item.color || defaultColors[index % defaultColors.length],
                    display: 'inline-block',
                  }}
                />
                <span>{item.name}</span>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
export default IncidentDonut


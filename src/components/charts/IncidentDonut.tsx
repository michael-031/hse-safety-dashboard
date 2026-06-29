import React from 'react'
import ReactECharts from 'echarts-for-react'

interface IncidentDonutProps {
  lti: number
  rwc: number
  mtc: number
  fac: number
  hoveredCategory?: string | null
  theme?: 'light' | 'dark'
}

export const IncidentDonut: React.FC<IncidentDonutProps> = ({
  lti,
  rwc,
  mtc,
  fac,
  hoveredCategory,
  theme = 'dark',
}) => {
  const total = lti + rwc + mtc + fac
  const isAllZero = total === 0

  const chartRef = React.useRef<any>(null)

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
      : [
          { value: lti, name: 'LTI (Lost Time)' },
          { value: rwc, name: 'RWC (Restricted Work)' },
          { value: mtc, name: 'MTC (Medical Treatment)' },
          { value: fac, name: 'FAC (First Aid)' },
        ].filter((item) => item.value > 0)
  }, [lti, rwc, mtc, fac, isAllZero])

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
          : [
              '#ef4444', // LTI - Red
              '#fbbf24', // RWC - Yellow
              '#3b82f6', // MTC - Blue
              '#10b981', // FAC - Green
            ],
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
          [
            { name: 'LTI (Lost Time)', color: '#ef4444', value: lti },
            { name: 'RWC (Restricted Work)', color: '#fbbf24', value: rwc },
            { name: 'MTC (Medical Treatment)', color: '#3b82f6', value: mtc },
            { name: 'FAC (First Aid)', color: '#10b981', value: fac },
          ]
            .filter((item) => item.value > 0)
            .map((item) => (
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
                    backgroundColor: item.color,
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

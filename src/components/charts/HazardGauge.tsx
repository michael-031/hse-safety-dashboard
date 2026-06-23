import React from 'react'
import ReactECharts from 'echarts-for-react'

interface HazardGaugeProps {
  rate: number
}

export const HazardGauge: React.FC<HazardGaugeProps> = ({ rate }) => {
  // Determine color based on safety performance targets (SLA Target: 90%)
  let ringColor = '#ef4444' // red
  if (rate >= 90) {
    ringColor = '#10b981' // green
  } else if (rate >= 75) {
    ringColor = '#f59e0b' // orange
  }

  const roundedRate = Math.round(rate * 10) / 10
  const displayRate = isNaN(roundedRate) || !isFinite(roundedRate) ? 0 : roundedRate

  // Clamped rate for the progress arc (max 100%)
  const clampedRate = Math.min(100, displayRate)

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: {
          show: false,
        },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            borderWidth: 0,
            color: ringColor,
            shadowColor: ringColor,
            shadowBlur: 8,
          },
        },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [[1, 'rgba(255, 255, 255, 0.05)']],
          },
        },
        splitLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        data: [
          {
            value: clampedRate,
            name: 'Close-out Rate',
          },
        ],
        detail: {
          show: false,
        },
      },
    ],
  }

  return (
    <div style={{ position: 'relative', height: '140px', width: '140px', margin: '0 auto' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
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
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#f8fafc',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {displayRate}%
        </span>
        <span
          style={{
            fontSize: '0.62rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginTop: '0.25rem',
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          SLA Target: 90%
        </span>
      </div>
    </div>
  )
}
export default HazardGauge

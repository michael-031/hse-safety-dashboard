import React from 'react'
import ReactECharts from 'echarts-for-react'

interface IncidentDonutProps {
  lti: number
  rwc: number
  mtc: number
  fac: number
}

export const IncidentDonut: React.FC<IncidentDonutProps> = ({
  lti,
  rwc,
  mtc,
  fac,
}) => {
  const total = lti + rwc + mtc + fac
  const isAllZero = total === 0

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
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
      formatter: '{b}: <b>{c}</b> ({d}%)',
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: {
        color: '#5e6b62',
        fontFamily: 'Plus Jakarta Sans',
        fontSize: 11,
      },
      itemWidth: 10,
      itemHeight: 10,
      icon: 'circle',
    },
    series: [
      {
        name: 'Incidents',
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#ffffff',
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
            color: '#1c2821',
            formatter: '{b}\n{c}',
            fontFamily: 'Plus Jakarta Sans',
          },
        },
        labelLine: {
          show: false,
        },
        color: isAllZero
          ? ['rgba(94, 124, 107, 0.25)']
          : [
              '#cf4b4b', // LTI - Crimson Red
              '#e08c48', // RWC - Muted Orange
              '#d1a336', // MTC - Muted Gold/Yellow
              '#4c7a80', // FAC - Muted Slate/Cyan
            ],
        data: isAllZero
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
            ].filter((item) => item.value > 0),
      },
    ],
  }

  return (
    <div style={{ position: 'relative', height: '220px', width: '100%' }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
      {/* Center Value Indicator */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            display: 'block',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: isAllZero ? '#3b624a' : '#1c2821',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {isAllZero ? '0' : total}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
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
  )
}
export default IncidentDonut

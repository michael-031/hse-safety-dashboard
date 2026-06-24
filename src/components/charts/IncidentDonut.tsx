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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
      <div style={{ position: 'relative', height: '175px', width: '100%' }}>
        <ReactECharts
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
              color: isAllZero ? '#3b624a' : '#1c2821',
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
                backgroundColor: 'rgba(94, 124, 107, 0.25)',
                display: 'inline-block',
              }}
            />
            <span>Safe Workplace</span>
          </div>
        ) : (
          [
            { name: 'LTI (Lost Time)', color: '#cf4b4b', value: lti },
            { name: 'RWC (Restricted Work)', color: '#e08c48', value: rwc },
            { name: 'MTC (Medical Treatment)', color: '#d1a336', value: mtc },
            { name: 'FAC (First Aid)', color: '#4c7a80', value: fac },
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

import React, { useState, useEffect } from 'react'
import type { SafetyData } from '../types/dashboard'
import { calculateSafetyMetrics } from '../utils/calculations'
import InputForm from '../components/forms/InputForm'
import KPICard from '../components/cards/KPICard'
import IncidentDonut from '../components/charts/IncidentDonut'
import TargetVsActual from '../components/charts/TargetVsActual'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

// Default values seeded from the Excel sheet screenshot
const DEFAULT_SAFETY_DATA: SafetyData = {
  totalManHours: 1200000,
  lti: 1,
  rwc: 2,
  mtc: 3,
  fac: 14,
  observations: 420,
  hazardsClosed: 385,
  auditsPlanned: 24,
  auditsCompleted: 22,
}

export const Dashboard: React.FC = () => {
  // Toggle input section visibility
  const [isInputVisible, setIsInputVisible] = useState(true)

  // Safety Data state
  const [safetyData, setSafetyData] = useState<SafetyData>(() => {
    const saved = localStorage.getItem('hse_safety_data')
    if (saved) {
      try {
        return JSON.parse(saved) as SafetyData
      } catch (e) {
        console.error('Error parsing safety data:', e)
      }
    }
    return DEFAULT_SAFETY_DATA
  })

  // Start with Excel formula active
  const [useExcelFormula, setUseExcelFormula] = useState<boolean>(() => {
    const saved = localStorage.getItem('hse_use_excel_formula')
    return saved ? saved === 'true' : true
  })

  // Cache state changes
  useEffect(() => {
    localStorage.setItem('hse_safety_data', JSON.stringify(safetyData))
  }, [safetyData])

  useEffect(() => {
    localStorage.setItem('hse_use_excel_formula', String(useExcelFormula))
  }, [useExcelFormula])

  // Compute metrics
  const calculated = calculateSafetyMetrics(safetyData, useExcelFormula)

  // Risk Pill Styling (matching the Carlos Brown / Anna Jones status pills)
  const getRiskPill = () => {
    if (calculated.riskStatus === 'low') {
      return {
        bg: 'var(--color-success-bg)',
        text: 'var(--color-success)',
        label: 'Stable / On track',
      }
    } else if (calculated.riskStatus === 'moderate') {
      return {
        bg: 'var(--color-warning-bg)',
        text: 'var(--color-warning)',
        label: 'Moderate Risk / Warning',
      }
    } else {
      return {
        bg: 'var(--color-danger-bg)',
        text: 'var(--color-danger)',
        label: 'High Risk / Action Req.',
      }
    }
  }

  const riskPill = getRiskPill()

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        padding: '1.5rem', 
        maxWidth: '1600px',
        margin: '0 auto',
      }}
      className="dashboard-container"
    >
      
      {/* Main content area split */}
      <div 
        style={{ 
          display: 'flex', 
          gap: isInputVisible ? '1.5rem' : '0px',
          minWidth: 0,
          width: '100%',
          transition: 'gap 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="layout-grid"
      >
        
        {/* Left column: Input parameters card */}
        <aside 
          style={{ 
            width: isInputVisible ? '330px' : '0px',
            flexShrink: 0,
            opacity: isInputVisible ? 1 : 0,
            transform: isInputVisible ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
            position: 'sticky',
            top: '1.5rem',
            height: 'fit-content',
          }}
        >
          {/* Prevent inner inputs from wrapping during transition */}
          <div style={{ width: '330px' }}>
            <InputForm
              data={safetyData}
              onChange={setSafetyData}
              useExcelFormula={useExcelFormula}
              onFormulaToggle={setUseExcelFormula}
            />
          </div>
        </aside>

        {/* Right column: Analytics Dashboard */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
          
          {/* Header Card */}
          <div 
            className="glass-panel"
            style={{ 
              padding: '1.25rem 1.75rem', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Toggle Input Button */}
              <button
                id="btn-toggle-input"
                onClick={() => setIsInputVisible(!isInputVisible)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid rgba(94, 124, 107, 0.1)',
                  borderRadius: '50%',
                  width: '2.5rem',
                  height: '2.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all var(--transition-normal)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(94, 124, 107, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-input)'}
                title={isInputVisible ? "Hide Inputs" : "Show Inputs"}
              >
                {isInputVisible ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
              </button>
              
              <div>
              <h1 
                style={{ 
                  fontSize: '1.35rem', 
                  fontWeight: 800, 
                  letterSpacing: '-0.02em', 
                  color: 'var(--text-primary)'
                }}
              >
                Executive Health & Safety Dashboard
              </h1>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                HSE Performance Calculator & Preventative Indicator Analysis
              </p>
            </div>
          </div>
          
          {/* Risk Badge (Modeled after 'Balance On track' pill tag) */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                background: riskPill.bg, 
                padding: '0.35rem 0.75rem', 
                borderRadius: '20px', 
                border: 'none',
              }}
            >
              <span 
                className="risk-dot" 
                style={{ 
                  backgroundColor: riskPill.text, 
                  boxShadow: `0 0 8px ${riskPill.text}` 
                }}
              ></span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: riskPill.text }}>
                {riskPill.label}
              </span>
            </div>
          </div>

          {/* Top KPI Cards Row */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '1rem' 
            }}
          >
            {/* TRIR Card: Bar sparkline variant */}
            <KPICard
              title="Total Recordable Incident Rate"
              value={calculated.trir.toFixed(2)}
              subValue="TRIR Target: < 1.00"
              variant="bar"
              badgeText={calculated.trir < 1.00 ? 'On Track' : 'Warning'}
              badgeColor={calculated.trir < 1.00 ? 'success' : calculated.trir < 2.00 ? 'warning' : 'danger'}
            />
            {/* LTIFR Card: Line sparkline variant */}
            <KPICard
              title="Lost Time Frequency Rate"
              value={calculated.ltifr.toFixed(2)}
              subValue="LTIFR Target: < 1.00"
              variant="line"
            />
            {/* Hazard Rate: Circle indicator */}
            <KPICard
              title="Hazard Close-Out Rate"
              value={`${calculated.hazardCloseOutRate.toFixed(1)}%`}
              subValue={useExcelFormula ? 'Formula: Observations/Closed' : 'Formula: Closed/Observations'}
              variant="circle"
            />
            {/* Audit Completion: Solid Sage green accent card! */}
            <KPICard
              title="Audit Completion Rate"
              value={`${calculated.auditCompletionRate.toFixed(1)}%`}
              subValue="Compliance Target: 95.0%"
              variant="accent"
            />
            {/* Recordable Cases: Default style, displays dynamic risk pills */}
            <KPICard
              title="Total Recordable Cases"
              value={calculated.tri}
              subValue={`LTI (${safetyData.lti}) • RWC (${safetyData.rwc}) • MTC (${safetyData.mtc})`}
              badgeText={calculated.tri === 0 ? 'Excellent' : calculated.tri < 5 ? 'Stable' : 'Alert'}
              badgeColor={calculated.tri === 0 ? 'success' : calculated.tri < 5 ? 'warning' : 'danger'}
            />
          </div>

          {/* Bottom Indicators Panels */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', 
              gap: '1.5rem' 
            }}
            className="indicators-grid"
          >
            
            {/* Lagging Indicators Panel */}
            <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Lagging Indicators (Incident Breakdown)
                </h3>
                <div style={{ height: '1px', background: 'rgba(94, 124, 107, 0.05)', marginTop: '0.4rem' }}></div>
              </div>

              {/* Layout for Table & Donut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <table className="hse-table">
                  <thead>
                    <tr>
                      <th>Incident Classification</th>
                      <th style={{ textAlign: 'right' }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cf4b4b' }}></span>
                        Lost Time Injuries (LTI)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.lti}</td>
                    </tr>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e08c48' }}></span>
                        Restricted Work Cases (RWC)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.rwc}</td>
                    </tr>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1a336' }}></span>
                        Medical Treatment Cases (MTC)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.mtc}</td>
                    </tr>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4c7a80' }}></span>
                        First Aid Cases (FAC)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.fac}</td>
                    </tr>
                  </tbody>
                </table>

                {/* ECharts donut chart */}
                <div>
                  <IncidentDonut
                    lti={safetyData.lti}
                    rwc={safetyData.rwc}
                    mtc={safetyData.mtc}
                    fac={safetyData.fac}
                  />
                </div>
              </div>
            </section>

            {/* Leading Indicators Panel */}
            <section className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Leading Indicators (Preventative Targets)
                </h3>
                <div style={{ height: '1px', background: 'rgba(94, 124, 107, 0.05)', marginTop: '0.4rem' }}></div>
              </div>

              {/* Table and Comparison Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <table className="hse-table">
                  <thead>
                    <tr>
                      <th>Proactive HSE Metric</th>
                      <th style={{ textAlign: 'center' }}>Actual</th>
                      <th style={{ textAlign: 'right' }}>Target Benchmark</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Safety Observations Logged</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: safetyData.observations >= 400 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {safetyData.observations}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        KPI Target &gt; 400
                      </td>
                    </tr>
                    <tr>
                      <td>Hazard SLA Close-Out Performance</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: calculated.hazardCloseOutRate >= 90 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {calculated.hazardCloseOutRate.toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        Min 90.0% Standard
                      </td>
                    </tr>
                    <tr>
                      <td>HSE Safety Audit Execution</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: calculated.auditCompletionRate >= 95 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                        {calculated.auditCompletionRate.toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        Min 95.0% Compliance
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Normalized comparison bar chart */}
                <div>
                  <TargetVsActual
                    observations={safetyData.observations}
                    hazardRate={calculated.hazardCloseOutRate}
                    auditRate={calculated.auditCompletionRate}
                  />
                </div>
              </div>
            </section>
            
          </div>
          
        </main>
        
      </div>
      
      {/* Responsive adjustments helper styles */}
      <style>{`
        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 1rem !important;
          }
          .layout-grid {
            grid-template-columns: 1fr !important;
          }
          aside {
            position: relative !important;
            top: 0 !important;
          }
        }
        @media (max-width: 768px) {
          .indicators-grid {
            grid-template-columns: 1fr !important;
          }
          .hse-table {
            font-size: 0.78rem;
          }
        }
      `}</style>
    </div>
  )
}
export default Dashboard

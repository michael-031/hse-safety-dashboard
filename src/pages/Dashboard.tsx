import React, { useState, useEffect } from 'react'
import type { SafetyData } from '../types/dashboard'
import { calculateSafetyMetrics } from '../utils/calculations'
import InputForm from '../components/forms/InputForm'
import KPICard from '../components/cards/KPICard'
import IncidentDonut from '../components/charts/IncidentDonut'
import TargetVsActual from '../components/charts/TargetVsActual'
import { 
  PanelLeftClose, 
  PanelLeftOpen, 
  Play, 
  Pause, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle
} from 'lucide-react'

// Beautiful SVG QR Code
const QRCodeSVG: React.FC = () => (
  <svg width="110" height="110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ background: '#ffffff', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
    <rect x="0" y="0" width="28" height="28" fill="var(--text-primary)" />
    <rect x="4" y="4" width="20" height="20" fill="#ffffff" />
    <rect x="8" y="8" width="12" height="12" fill="var(--text-primary)" />

    <rect x="72" y="0" width="28" height="28" fill="var(--text-primary)" />
    <rect x="76" y="4" width="20" height="20" fill="#ffffff" />
    <rect x="80" y="8" width="12" height="12" fill="var(--text-primary)" />

    <rect x="0" y="72" width="28" height="28" fill="var(--text-primary)" />
    <rect x="4" y="76" width="20" height="20" fill="#ffffff" />
    <rect x="8" y="80" width="12" height="12" fill="var(--text-primary)" />

    <rect x="38" y="10" width="10" height="10" fill="var(--text-primary)" />
    <rect x="48" y="20" width="10" height="10" fill="var(--text-primary)" />
    <rect x="44" y="44" width="12" height="12" fill="var(--text-primary)" />
    <rect x="58" y="38" width="10" height="10" fill="var(--text-primary)" />
    <rect x="80" y="80" width="16" height="16" fill="var(--text-primary)" />
    <rect x="70" y="48" width="10" height="10" fill="var(--text-primary)" />
    <rect x="48" y="70" width="10" height="10" fill="var(--text-primary)" />
    <rect x="38" y="80" width="10" height="10" fill="var(--text-primary)" />
    <rect x="84" y="44" width="10" height="10" fill="var(--text-primary)" />
    
    <rect x="24" y="44" width="10" height="10" fill="var(--text-primary)" />
    <rect x="34" y="54" width="10" height="10" fill="var(--text-primary)" />
    <rect x="54" y="54" width="10" height="10" fill="var(--text-primary)" />
    
    <rect x="80" y="60" width="6" height="6" fill="var(--text-primary)" />
    <rect x="86" y="66" width="6" height="6" fill="var(--text-primary)" />
    <rect x="60" y="80" width="6" height="6" fill="var(--text-primary)" />
    <rect x="66" y="86" width="6" height="6" fill="var(--text-primary)" />
    <rect x="90" y="90" width="10" height="10" fill="var(--text-primary)" />
  </svg>
)

// Default values seeded from the PDF Current Performance Baseline (Mandaue Site)
const DEFAULT_SAFETY_DATA: SafetyData = {
  safeWorkDays: 245,
  totalManHours: 1200000,
  lti: 0,
  rwc: 0,
  mtc: 0,
  fac: 14,
  observations: 420,
  ergoAssessed: 942,
  ergoTotal: 1000, // Yields 94.2%
  cacrResolved: 70,
  cacrTotal: 80, // Yields 87.5%
  trainingCompleted: 100,
  trainingTotal: 100, // Yields 100%
  daysLost: 0,
}

export const Dashboard: React.FC = () => {
  // Toggle input section visibility
  const [isInputVisible, setIsInputVisible] = useState(true)

  // Safety Data state
  const [safetyData, setSafetyData] = useState<SafetyData>(() => {
    const saved = localStorage.getItem('hse_safety_data_v2')
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
    return saved ? saved === 'true' : false
  })

  // Slideshow States
  const [slideshowActive, setSlideshowActive] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideshowPlay, setSlideshowPlay] = useState(true)
  const [slideshowSpeed, setSlideshowSpeed] = useState(8000) // Default 8s

  // Intake Form Modal State
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)
  const [intakeSuccess, setIntakeSuccess] = useState(false)
  const [intakeForm, setIntakeForm] = useState({
    reporterName: '',
    location: 'Production Floor 1',
    type: 'Micro-Ergonomic Discomfort',
    description: '',
    resolvedOnSpot: false
  })

  // Cache state changes
  useEffect(() => {
    localStorage.setItem('hse_safety_data_v2', JSON.stringify(safetyData))
  }, [safetyData])

  useEffect(() => {
    localStorage.setItem('hse_use_excel_formula', String(useExcelFormula))
  }, [useExcelFormula])

  // Trigger ECharts resize when input visibility toggles to fit new percentage widths
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 420)
    return () => clearTimeout(timer)
  }, [isInputVisible, slideshowActive])

  // Auto-advance slideshow
  useEffect(() => {
    if (!slideshowActive || !slideshowPlay) return

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4)
    }, slideshowSpeed)

    return () => clearInterval(timer)
  }, [slideshowActive, slideshowPlay, slideshowSpeed])

  // Compute metrics
  const calculated = calculateSafetyMetrics(safetyData, useExcelFormula)

  // PDF Status Colors (Muted primary palette)
  const colors = {
    safe: '#16a34a', // Safe status markers
    intermediate: '#d97706', // Intermediate action requirements
    alert: '#dc2626', // Alert thresholds
  }

  // Get status color based on thresholds
  const getErgoStatus = () => {
    if (calculated.ergoRate >= 95) return colors.safe
    if (calculated.ergoRate >= 90) return colors.intermediate
    return colors.alert
  }

  const getCacrStatus = () => {
    if (calculated.cacrRate >= 95) return colors.safe
    if (calculated.cacrRate >= 85) return colors.intermediate
    return colors.alert
  }

  const getTrainingStatus = () => {
    if (calculated.trainingRate >= 100) return colors.safe
    if (calculated.trainingRate >= 90) return colors.intermediate
    return colors.alert
  }

  const getTrirStatus = () => {
    if (calculated.trir < 0.50) return colors.safe
    if (calculated.trir < 1.00) return colors.intermediate
    return colors.alert
  }

  const getLtifrStatus = () => {
    if (safetyData.lti === 0) return colors.safe
    if (calculated.ltifr < 1.00) return colors.intermediate
    return colors.alert
  }

  const getSeverityStatus = () => {
    if (safetyData.daysLost === 0) return colors.safe
    if (safetyData.daysLost <= 5) return colors.intermediate
    return colors.alert
  }

  const getOverallPill = () => {
    if (calculated.riskStatus === 'low') {
      return {
        bg: 'var(--color-success-bg)',
        text: colors.safe,
        label: 'Stable / On track',
      }
    } else if (calculated.riskStatus === 'moderate') {
      return {
        bg: 'var(--color-warning-bg)',
        text: colors.intermediate,
        label: 'Moderate Risk / Warning',
      }
    } else {
      return {
        bg: 'var(--color-danger-bg)',
        text: colors.alert,
        label: 'High Risk / Action Req.',
      }
    }
  }

  const overallPill = getOverallPill()

  // Interactive Demo Tour States
  const [demoActive, setDemoActive] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [donutHoverCategory, setDonutHoverCategory] = useState<string | null>(null)
  const [barHoverCategory, setBarHoverCategory] = useState<string | null>(null)

  // Layout Refs to calculate virtual cursor coordinates dynamically
  const donutContainerRef = React.useRef<HTMLDivElement>(null)
  const barContainerRef = React.useRef<HTMLDivElement>(null)



  // Process Tour steps
  useEffect(() => {
    if (!demoActive) return

    const steps = [
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          setDonutHoverCategory(null)
          setBarHoverCategory(null)
        }
      },
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 - 35, y: rect.top + rect.height / 2 - 35 })
          setDonutHoverCategory('lti')
          setBarHoverCategory(null)
        }
      },
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 35, y: rect.top + rect.height / 2 - 30 })
          setDonutHoverCategory('rwc')
        }
      },
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 35, y: rect.top + rect.height / 2 + 30 })
          setDonutHoverCategory('mtc')
        }
      },
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 - 35, y: rect.top + rect.height / 2 + 35 })
          setDonutHoverCategory('fac')
        }
      },
      () => {
        if (barContainerRef.current) {
          const rect = barContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + 50 })
          setDonutHoverCategory(null)
          setBarHoverCategory('ergo')
        }
      },
      () => {
        if (barContainerRef.current) {
          const rect = barContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + 100 })
          setBarHoverCategory('cacr')
        }
      },
      () => {
        if (barContainerRef.current) {
          const rect = barContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + 150 })
          setBarHoverCategory('training')
        }
      },
    ]

    const timer = setTimeout(() => {
      steps[demoStep]()
      const nextStep = (demoStep + 1) % steps.length
      setDemoStep(nextStep)
    }, 2000)

    return () => clearTimeout(timer)
  }, [demoActive, demoStep])

  // Handle Intake Form submission
  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Safety observations and identified actions increment instantly
    const updatedObservations = safetyData.observations + 1
    const updatedCacrTotal = safetyData.cacrTotal + 1
    const updatedCacrResolved = safetyData.cacrResolved + (intakeForm.resolvedOnSpot ? 1 : 0)

    setSafetyData({
      ...safetyData,
      observations: updatedObservations,
      cacrTotal: updatedCacrTotal,
      cacrResolved: updatedCacrResolved,
    })

    setIntakeSuccess(true)
    setTimeout(() => {
      setIsIntakeOpen(false)
      setIntakeSuccess(false)
      setIntakeForm({
        reporterName: '',
        location: 'Production Floor 1',
        type: 'Micro-Ergonomic Discomfort',
        description: '',
        resolvedOnSpot: false
      })
    }, 1500)
  }



  return (
    <div
      style={{
        height: '100vh',
        padding: '1.25%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="dashboard-container"
    >
      {/* Main content area split */}
      <div
        style={{
          display: 'flex',
          gap: isInputVisible ? '1.25rem' : '0px',
          minWidth: 0,
          width: '100%',
          flex: 1,
          transition: 'gap 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="layout-grid"
      >
        {/* Left column: Input parameters sidebar */}
        <aside
          style={{
            width: isInputVisible ? '320px' : '0px',
            flexShrink: 0,
            opacity: isInputVisible ? 1 : 0,
            transform: isInputVisible ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
            position: 'sticky',
            top: '1.25rem',
            height: '100%',
            minHeight: 0,
          }}
        >
          <div style={{ width: '320px', height: '100%', minHeight: 0 }}>
            <InputForm
              data={safetyData}
              onChange={setSafetyData}
              useExcelFormula={useExcelFormula}
              onFormulaToggle={setUseExcelFormula}
            />
          </div>
        </aside>

        {/* Right column: Analytics Dashboard */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0, height: '100%', minHeight: 0 }}>
          
          {/* Header Card */}
          <div
            className="glass-panel"
            style={{
              padding: '1rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                id="btn-toggle-input"
                onClick={() => setIsInputVisible(!isInputVisible)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid rgba(94, 124, 107, 0.1)',
                  borderRadius: '50%',
                  width: '2.25rem',
                  height: '2.25rem',
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
                {isInputVisible ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>

              <div>
                <h1
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)'
                  }}
                >
                  Health & Safety KPI Dashboard Blueprint
                </h1>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                  Innodata Mandaue City Site Deployment Plan & Metric Library
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* Slideshow Trigger Button */}
              <button
                id="btn-start-slideshow"
                onClick={() => setSlideshowActive(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'var(--color-primary)',
                  border: 'none',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'white',
                  transition: 'all var(--transition-normal)',
                  boxShadow: '0 4px 10px rgba(94, 124, 107, 0.2)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Play size={11} fill="white" /> TV Slideshow Mode
              </button>

              {/* Interactive Demo Tour Toggle */}
              <button
                id="btn-toggle-demo"
                onClick={() => {
                  const nextVal = !demoActive
                  setDemoActive(nextVal)
                  if (!nextVal) {
                    setDonutHoverCategory(null)
                    setBarHoverCategory(null)
                  } else {
                    setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
                    setDemoStep(0)
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: demoActive ? 'rgba(94, 124, 107, 0.15)' : 'var(--bg-input)',
                  border: demoActive ? '1px solid var(--color-primary)' : '1px solid rgba(94, 124, 107, 0.08)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: demoActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <span
                  className="risk-dot"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: demoActive ? 'var(--color-primary)' : 'var(--text-muted)',
                    animation: demoActive ? 'pulse-dot 1.5s infinite ease-in-out' : 'none',
                    display: 'inline-block'
                  }}
                ></span>
                {demoActive ? 'Interactive Tour Active' : 'Start Tour'}
              </button>

              {/* Overall Risk Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: overallPill.bg,
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  border: 'none',
                }}
              >
                <span
                  className="risk-dot"
                  style={{
                    backgroundColor: overallPill.text,
                    boxShadow: `0 0 6px ${overallPill.text}`
                  }}
                ></span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: overallPill.text }}>
                  {overallPill.label}
                </span>
              </div>
            </div>
          </div>

          {/* Top KPI Cards Row - Seeding Mandaue Site Baseline */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem'
            }}
          >
            {/* SAFE WORK DAYS */}
            <KPICard
              title="SAFE WORK DAYS"
              value={safetyData.safeWorkDays}
              subValue="CONSECUTIVE DAYS"
              variant="accent" // Solid Sage green accent card!
            />
            {/* SITE TRIR */}
            <KPICard
              title="SITE TRIR"
              value={calculated.trir.toFixed(2)}
              subValue="TARGET: < 0.50"
              variant="bar"
              badgeText={calculated.trir < 0.50 ? 'On Track' : 'Needs Action'}
              badgeColor={calculated.trir < 0.50 ? 'success' : 'danger'}
            />
            {/* ERGO AUDIT COMPLIANCE */}
            <KPICard
              title="ERGO AUDIT COMPLIANCE"
              value={`${calculated.ergoRate.toFixed(1)}%`}
              subValue="TARGET: > 90%"
              variant="circle"
              badgeText={calculated.ergoRate >= 95 ? 'Excellent' : calculated.ergoRate >= 90 ? 'Stable' : 'Alert'}
              badgeColor={calculated.ergoRate >= 95 ? 'success' : calculated.ergoRate >= 90 ? 'warning' : 'danger'}
            />
            {/* ACTION CLOSURE RATE */}
            <KPICard
              title="ACTION CLOSURE RATE"
              value={`${calculated.cacrRate.toFixed(1)}%`}
              subValue="TARGET: 95.0%"
              variant="line"
              badgeText={calculated.cacrRate >= 95 ? 'Compliant' : 'Needs Action'}
              badgeColor={calculated.cacrRate >= 95 ? 'success' : 'warning'}
            />
          </div>

          {/* Bottom Indicators Panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.25fr 1fr',
              gap: '1.25rem',
              flex: 1,
              minHeight: 0,
            }}
            className="indicators-grid"
          >
            {/* Metric Architecture Framework & QR Portal Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', minHeight: 0 }}>
              
              {/* Metric Architecture Framework Table Card */}
              <section className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Metric Architecture Framework
                  </h3>
                  <div style={{ height: '1px', background: 'rgba(94, 124, 107, 0.05)', marginTop: '0.4rem' }}></div>
                </div>

                <table className="hse-table" style={{ fontSize: '0.78rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Category</th>
                      <th>KPI Metric Name</th>
                      <th>Target Threshold</th>
                      <th style={{ textAlign: 'center' }}>Actual</th>
                      <th>Cadence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Leading 1 */}
                    <tr>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>LEADING</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>Ergonomic Workstation Assessment Rate</td>
                      <td>&ge; 95% of active floor</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: getErgoStatus() }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getErgoStatus() }}></span>
                          {calculated.ergoRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Monthly / Roll-up</td>
                    </tr>
                    {/* Leading 2 */}
                    <tr>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>LEADING</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>Corrective Action Closure Rate (CACR)</td>
                      <td>&ge; 95% within 5 days</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: getCacrStatus() }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getCacrStatus() }}></span>
                          {calculated.cacrRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Weekly Verification</td>
                    </tr>
                    {/* Leading 3 */}
                    <tr>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>LEADING</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>HSE Training Completion</td>
                      <td>100% compliance rate</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: getTrainingStatus() }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getTrainingStatus() }}></span>
                          {calculated.trainingRate.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Bi-Weekly Batching</td>
                    </tr>
                    {/* Lagging 1 */}
                    <tr>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#fdf2f2', color: '#dc2626' }}>LAGGING</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>Total Recordable Incident Rate (TRIR)</td>
                      <td>&lt; 0.50 per 200k hrs</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: getTrirStatus() }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getTrirStatus() }}></span>
                          {calculated.trir.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Monthly Consolidated</td>
                    </tr>
                    {/* Lagging 2 */}
                    <tr>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#fdf2f2', color: '#dc2626' }}>LAGGING</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>Lost Time Injury Frequency (LTIFR)</td>
                      <td>0.00 Absolute</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: getLtifrStatus() }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getLtifrStatus() }}></span>
                          {safetyData.lti} ({calculated.ltifr.toFixed(2)})
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Real-time Tracking</td>
                    </tr>
                    {/* Lagging 3 */}
                    <tr>
                      <td>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: '#fdf2f2', color: '#dc2626' }}>LAGGING</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>Severity Index (Days Lost)</td>
                      <td>0.00 Days Lost</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: getSeverityStatus() }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getSeverityStatus() }}></span>
                          {safetyData.daysLost} Days
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>Real-time Tracking</td>
                    </tr>
                  </tbody>
                </table>

                {/* Normalization Note */}
                <div style={{
                  fontSize: '0.65rem',
                  lineHeight: 1.35,
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(94, 124, 107, 0.04)',
                  color: 'var(--text-secondary)',
                  marginTop: 'auto',
                }}>
                  <strong>Statistical Normalization Note:</strong> Standardized multi-hour operational rates utilize the globally accepted corporate benchmark factor of 200,000 hours (representing the baseline exposure window for 100 full-time workers working 40 hours per week for 50 weeks annually).
                </div>
              </section>

              {/* QR Submission Portal Linkage Card */}
              <section className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <QRCodeSVG />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Mobile Hazard Intake Portal
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    Scan the QR code to log micro-ergonomic discomfort and near-miss hazards instantly, updating the lobby board in real-time.
                  </p>
                  <button
                    onClick={() => setIsIntakeOpen(true)}
                    style={{
                      marginTop: '0.6rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      background: 'rgba(94, 124, 107, 0.08)',
                      border: '1px solid rgba(94, 124, 107, 0.15)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(94, 124, 107, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(94, 124, 107, 0.08)'}
                  >
                    <Plus size={12} /> Open Intake Form
                  </button>
                </div>
              </section>

            </div>

            {/* Right Column: Visual Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', minHeight: 0 }}>
              
              {/* Lagging Indicators - Incident Breakdown */}
              <section className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Incident Classification Breakdown
                  </h3>
                  <div style={{ height: '1px', background: 'rgba(94, 124, 107, 0.05)', marginTop: '0.4rem' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1rem', alignItems: 'center', flex: 1, width: '100%', minHeight: 0 }}>
                  <table className="hse-table" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th>Incident</th>
                        <th style={{ textAlign: 'right' }}>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#cf4b4b' }}></span>
                          LTI (Lost Time)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.lti}</td>
                      </tr>
                      <tr>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e08c48' }}></span>
                          RWC (Restricted Work)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.rwc}</td>
                      </tr>
                      <tr>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1a336' }}></span>
                          MTC (Medical Treatment)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.mtc}</td>
                      </tr>
                      <tr>
                        <td style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4c7a80' }}></span>
                          FAC (First Aid)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.fac}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div ref={donutContainerRef} style={{ height: '100%', minHeight: '120px' }}>
                    <IncidentDonut
                      lti={safetyData.lti}
                      rwc={safetyData.rwc}
                      mtc={safetyData.mtc}
                      fac={safetyData.fac}
                      hoveredCategory={donutHoverCategory}
                    />
                  </div>
                </div>
              </section>

              {/* Leading Indicators - Proactive Targets */}
              <section className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
                <div>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    Leading Indicators Target Comparison
                  </h3>
                  <div style={{ height: '1px', background: 'rgba(94, 124, 107, 0.05)', marginTop: '0.4rem' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'space-around', minHeight: 0 }}>
                  <div ref={barContainerRef} style={{ flex: 1, minHeight: '140px' }}>
                    <TargetVsActual
                      ergoRate={calculated.ergoRate}
                      cacrRate={calculated.cacrRate}
                      trainingRate={calculated.trainingRate}
                      hoveredCategory={barHoverCategory}
                    />
                  </div>
                </div>
              </section>

            </div>
          </div>
        </main>
      </div>

      {/* Fullscreen TV Slideshow Overlay */}
      {slideshowActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'radial-gradient(circle at center, #1e2d24 0%, #0f1612 100%)',
            color: '#f8fafc',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            padding: '3rem',
            animation: 'fadeIn 0.5s ease'
          }}
        >
          {/* Slideshow Top Navigation Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '0.4rem 0.8rem',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: colors.safe,
                letterSpacing: '0.05em'
              }}>
                LOBBY TV MODE
              </span>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                  Innodata Mandaue City Site
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>
                  HSE Performance Metrics & Safety Architecture Blueprint
                </p>
              </div>
            </div>

            <button
              onClick={() => setSlideshowActive(false)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            >
              <X size={20} />
            </button>
          </div>

          {/* Slideshow Inner Slides content */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
            {/* Slide 1: Welcome & Baseline Overview */}
            {currentSlide === 0 && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-around', animation: 'fadeIn 0.6s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
                    Welcome to Innodata Mandaue City Site
                  </h3>
                  <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                    Current Site Safety Performance Baseline (Mandaue Site)
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', padding: '0 2rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.05em' }}>SAFE WORK DAYS</div>
                    <div style={{ fontSize: '5.5rem', fontWeight: 900, color: colors.safe, margin: '1rem 0' }}>{safetyData.safeWorkDays}</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>CONSECUTIVE DAYS SAFE</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.05em' }}>SITE TRIR</div>
                    <div style={{ fontSize: '5.5rem', fontWeight: 900, color: getTrirStatus(), margin: '1rem 0' }}>{calculated.trir.toFixed(2)}</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>TARGET: &lt; 0.50</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.05em' }}>ERGO AUDIT COMPLIANCE</div>
                    <div style={{ fontSize: '5.5rem', fontWeight: 900, color: getErgoStatus(), margin: '1rem 0' }}>{calculated.ergoRate.toFixed(1)}%</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>TARGET: &gt; 90%</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', padding: '2.5rem 2rem', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, letterSpacing: '0.05em' }}>ACTION CLOSURE RATE (CACR)</div>
                    <div style={{ fontSize: '5.5rem', fontWeight: 900, color: getCacrStatus(), margin: '1rem 0' }}>{calculated.cacrRate.toFixed(1)}%</div>
                    <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>TARGET: 95.0%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Slide 2: Leading Indicators details */}
            {currentSlide === 1 && (
              <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', alignItems: 'center', animation: 'fadeIn 0.6s ease' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Leading Indicators Framework</h3>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>Proactive safety measures logged by employees and safety inspectors.</p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.5rem' }}>
                    <table className="hse-table-dark" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', color: '#e2e8f0' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Metric Name</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Target</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>Ergonomic Workstation Assessment Rate</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>&ge; 95% of Floor</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: getErgoStatus(), fontWeight: 800 }}>{calculated.ergoRate.toFixed(1)}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>Corrective Action Closure Rate (CACR)</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>&ge; 95% in 5 days</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: getCacrStatus(), fontWeight: 800 }}>{calculated.cacrRate.toFixed(1)}%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>HSE Induction & Refresher training</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>100% trained</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: getTrainingStatus(), fontWeight: 800 }}>{calculated.trainingRate.toFixed(1)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ height: '90%', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '1rem', textAlign: 'center' }}>Proactive Targets vs Actual Rates</h4>
                  <div style={{ flex: 1 }}>
                    <TargetVsActual
                      ergoRate={calculated.ergoRate}
                      cacrRate={calculated.cacrRate}
                      trainingRate={calculated.trainingRate}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Slide 3: Lagging Outcomes Details */}
            {currentSlide === 2 && (
              <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1.2fr 1.0fr', gap: '3rem', alignItems: 'center', animation: 'fadeIn 0.6s ease' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>Lagging Outcomes (Incidents)</h3>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>Historical injury rates normalized against {safetyData.totalManHours.toLocaleString()} exposure man-hours.</p>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', padding: '1.5rem' }}>
                    <table className="hse-table-dark" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', color: '#e2e8f0' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Outcome Metric</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center' }}>Target</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>Total Recordable Incident Rate (TRIR)</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>&lt; 0.50 (200k hrs)</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: getTrirStatus(), fontWeight: 800 }}>{calculated.trir.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>Lost Time Injury Frequency (LTIFR)</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>0.00 Absolute</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: getLtifrStatus(), fontWeight: 800 }}>{safetyData.lti}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '1rem 0.75rem', fontWeight: 700 }}>Severity Index (SI)</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>0.00 Days Lost</td>
                          <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: getSeverityStatus(), fontWeight: 800 }}>{safetyData.daysLost} Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ height: '90%', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: '1rem', textAlign: 'center' }}>Incident Classification Breakdown</h4>
                  <div style={{ flex: 1, minHeight: '180px' }}>
                    <IncidentDonut
                      lti={safetyData.lti}
                      rwc={safetyData.rwc}
                      mtc={safetyData.mtc}
                      fac={safetyData.fac}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Slide 4: QR Mobile Submission link */}
            {currentSlide === 3 && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', animation: 'fadeIn 0.6s ease' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em' }}>
                    Help Keep Our Workspace Safe!
                  </h3>
                  <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
                    Log micro-ergonomic discomfort, near-miss hazards, or report unsafe conditions immediately. Your reports directly update these metrics.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '3rem 4rem', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
                  <div style={{ transform: 'scale(1.4)' }}>
                    <QRCodeSVG />
                  </div>
                  
                  <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: colors.safe, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Scan QR code with your mobile camera</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: colors.safe, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Fill out the short Mobile Intake form</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: colors.safe, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Metrics update instantly on the lobby screen</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slideshow Bottom Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            {/* Speed selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ROTATE SPEED:</span>
              {[
                { label: '5s', ms: 5000 },
                { label: '8s', ms: 8000 },
                { label: '15s', ms: 15000 },
              ].map((sp) => (
                <button
                  key={sp.label}
                  onClick={() => setSlideshowSpeed(sp.ms)}
                  style={{
                    background: slideshowSpeed === sp.ms ? 'var(--color-primary)' : 'rgba(255,255,255,0.06)',
                    color: slideshowSpeed === sp.ms ? 'white' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {/* Slide Navigation and Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + 4) % 4)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '2.5rem', height: '2.5rem', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    style={{
                      width: idx === currentSlide ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: idx === currentSlide ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % 4)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', width: '2.5rem', height: '2.5rem', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Play/Pause controls */}
            <button
              onClick={() => setSlideshowPlay(!slideshowPlay)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                padding: '0.45rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'white'
              }}
            >
              {slideshowPlay ? (
                <>
                  <Pause size={12} fill="white" /> Pause Slideshow
                </>
              ) : (
                <>
                  <Play size={12} fill="white" /> Resume Slideshow
                </>
              )}
            </button>
          </div>

          {/* Scrolling Ticker at the bottom */}
          <div style={{
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '1rem 0',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div className="marquee" style={{
              display: 'flex',
              whiteSpace: 'nowrap',
              animation: 'marquee 30s linear infinite',
              gap: '4rem',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.5)',
              fontWeight: 600
            }}>
              <span>• Safety is everyone's responsibility. Report hazards immediately.</span>
              <span>• Innodata Mandaue City Site - Days since last recordable injury: <strong style={{ color: colors.safe }}>{safetyData.safeWorkDays}</strong>.</span>
              <span>• Ergonomic comfort at work reduces strain. Request a workstation assessment today.</span>
              <span>• Remember: Stop, Think, Act safely!</span>
              <span>• Corrective actions closure compliance: <strong style={{ color: getCacrStatus() }}>{calculated.cacrRate.toFixed(1)}%</strong>.</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Intake Form Modal */}
      {isIntakeOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(28, 40, 33, 0.65)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.25s ease'
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '1.75rem',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <button
              onClick={() => setIsIntakeOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={18} />
            </button>

            {intakeSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <CheckCircle size={48} color={colors.safe} style={{ margin: '0 auto 1rem auto' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>Report Logged Successfully</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Safety metrics and observations updated in real-time. Thank you!
                </p>
              </div>
            ) : (
              <form onSubmit={handleIntakeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    HSE Observation Intake
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Submit near-misses, ergonomic concerns, or unsafe acts.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reporterName">
                    Reporter Name / Employee ID
                    <span className="form-label-info">Optional</span>
                  </label>
                  <input
                    id="reporterName"
                    type="text"
                    className="form-input"
                    value={intakeForm.reporterName}
                    onChange={(e) => setIntakeForm({ ...intakeForm, reporterName: e.target.value })}
                    placeholder="e.g. Employee #241"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="location">Location of Hazard</label>
                  <select
                    id="location"
                    className="form-input"
                    value={intakeForm.location}
                    onChange={(e) => setIntakeForm({ ...intakeForm, location: e.target.value })}
                    style={{ background: 'var(--bg-input)' }}
                  >
                    <option value="Production Floor 1">Production Floor 1</option>
                    <option value="Production Floor 2">Production Floor 2</option>
                    <option value="Server Room">Server Room</option>
                    <option value="Breakroom">Breakroom / Cafeteria</option>
                    <option value="Lobby Entrance">Lobby Entrance</option>
                    <option value="Office Floors">Office Floors</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="type">Report Category</label>
                  <select
                    id="type"
                    className="form-input"
                    value={intakeForm.type}
                    onChange={(e) => setIntakeForm({ ...intakeForm, type: e.target.value })}
                    style={{ background: 'var(--bg-input)' }}
                  >
                    <option value="Micro-Ergonomic Discomfort">Micro-Ergonomic Discomfort</option>
                    <option value="Near-Miss Hazard">Near-Miss Hazard</option>
                    <option value="Unsafe Condition / Act">Unsafe Condition / Act</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Hazard Description</label>
                  <textarea
                    id="description"
                    className="form-input"
                    rows={3}
                    style={{ resize: 'none', fontFamily: 'inherit', padding: '0.65rem 0.85rem' }}
                    value={intakeForm.description}
                    onChange={(e) => setIntakeForm({ ...intakeForm, description: e.target.value })}
                    placeholder="Describe what you observed or discomfort felt..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0' }}>
                  <input
                    id="resolvedOnSpot"
                    type="checkbox"
                    checked={intakeForm.resolvedOnSpot}
                    onChange={(e) => setIntakeForm({ ...intakeForm, resolvedOnSpot: e.target.checked })}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                  />
                  <label htmlFor="resolvedOnSpot" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Resolved on-the-spot? (Closes action instantly)
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.25rem' }}
                >
                  Submit Incident Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Virtual Cursor element for Tour Demo */}
      {demoActive && (
        <div
          id="virtual-cursor"
          style={{
            position: 'fixed',
            left: cursorPos.x,
            top: cursorPos.y,
            width: '20px',
            height: '20px',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%231c2821\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m4 4 7.07 17 2.51-7.39L21 11.07z\'/%3E%3C/svg%3E")',
            backgroundSize: 'contain',
            pointerEvents: 'none',
            zIndex: 999999,
            transition: 'left 1.2s cubic-bezier(0.25, 1, 0.5, 1), top 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
      )}

      {/* CSS Styles and Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }

        .marquee span {
          display: inline-block;
        }

        /* Dark table styles for the slideshow overlay */
        .hse-table-dark th {
          padding: 0.8rem;
          font-weight: 700;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .hse-table-dark td {
          padding: 1rem 0.8rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        @media (min-width: 1025px) {
          .dashboard-container {
            height: 100vh;
            overflow: hidden;
          }
          .layout-grid {
            min-height: 0;
          }
          aside {
            height: 100% !important;
            position: relative !important;
            top: 0 !important;
          }
          main {
            height: 100% !important;
            min-height: 0;
          }
          .indicators-grid {
            flex: 1;
            min-height: 0;
          }
          .donut-chart-container {
            height: 200px;
          }
          .target-chart-container {
            height: 200px;
          }
          .hse-table th {
            padding: 0.6rem 0.75rem !important;
          }
          .hse-table td {
            padding: 0.65rem 0.75rem !important;
          }
        }
        @media (max-width: 1024px) {
          .dashboard-container {
            padding: 1rem !important;
            height: auto !important;
            min-height: 100vh;
            overflow: auto !important;
          }
          .layout-grid {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          aside {
            position: relative !important;
            top: 0 !important;
            height: auto !important;
            width: 100% !important;
          }
          aside > div {
            width: 100% !important;
          }
          main {
            height: auto !important;
          }
          .indicators-grid {
            grid-template-columns: 1fr !important;
          }
          .donut-chart-container {
            height: 175px;
          }
          .target-chart-container {
            height: 200px;
          }
        }
      `}</style>
    </div>
  )
}
export default Dashboard


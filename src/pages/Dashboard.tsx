import React, { useState, useEffect, useCallback } from 'react'
import type { SafetyData } from '../types/dashboard'
import { calculateSafetyMetrics } from '../utils/calculations'
import InputForm from '../components/forms/InputForm'
import KPICard from '../components/cards/KPICard'
import IncidentDonut from '../components/charts/IncidentDonut'
import TargetVsActual from '../components/charts/TargetVsActual'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { supabase, hasSupabaseConfig, fetchMetrics, saveMetrics, rowToSafetyData } from '../utils/supabase'

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

// Preset quarterly and milestone safety scenarios for slideshow
const SLIDESHOW_DATA = [
  {
    name: "Q1 - Baseline Performance",
    data: {
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
  },
  {
    name: "Q2 - High Activity Period",
    data: {
      totalManHours: 1850000,
      lti: 2,
      rwc: 4,
      mtc: 5,
      fac: 22,
      observations: 510,
      hazardsClosed: 480,
      auditsPlanned: 36,
      auditsCompleted: 34,
    }
  },
  {
    name: "Q3 - Zero Harm Milestone",
    data: {
      totalManHours: 1400000,
      lti: 0,
      rwc: 0,
      mtc: 0,
      fac: 0,
      observations: 480,
      hazardsClosed: 460,
      auditsPlanned: 28,
      auditsCompleted: 28,
    }
  },
  {
    name: "Q4 - High Risk Alert",
    data: {
      totalManHours: 1100000,
      lti: 3,
      rwc: 5,
      mtc: 6,
      fac: 28,
      observations: 310,
      hazardsClosed: 220,
      auditsPlanned: 20,
      auditsCompleted: 15,
    }
  },
  {
    name: "Year-End Recovery",
    data: {
      totalManHours: 1500000,
      lti: 0,
      rwc: 1,
      mtc: 2,
      fac: 12,
      observations: 600,
      hazardsClosed: 580,
      auditsPlanned: 30,
      auditsCompleted: 29,
    }
  }
]

export const Dashboard: React.FC = () => {
  // Toggle input section visibility
  const [isInputVisible, setIsInputVisible] = useState(true)

  // Theme state: dark mode is default
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('hse_dashboard_theme')
    return (saved === 'light' || saved === 'dark') ? saved : 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('hse_dashboard_theme', theme)
  }, [theme])

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
  // Start with Excel formula active
  const [useExcelFormula, setUseExcelFormula] = useState<boolean>(() => {
    const saved = localStorage.getItem('hse_use_excel_formula')
    return saved ? saved === 'true' : true
  })

  // Save button state
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  // Plain state updater (no broadcast)
  const updateSafetyData = (newData: SafetyData) => {
    setSafetyData(newData)
  }

  // ── Supabase DB: load on mount + subscribe to realtime changes ──────────────
  useEffect(() => {
    if (!hasSupabaseConfig) return

    // Load current row from DB on mount
    fetchMetrics().then((row) => {
      if (row) setSafetyData(row)
    })

    // Subscribe to row-level changes so all devices auto-update on save
    const channel = supabase
      .channel('hse-metrics-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hse_metrics', filter: 'id=eq.1' },
        (payload) => {
          setSafetyData(rowToSafetyData(payload.new))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // ── Save handler: write to DB ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!hasSupabaseConfig || isSaving) return
    setIsSaving(true)
    setSaveStatus('idle')
    const ok = await saveMetrics(safetyData)
    setIsSaving(false)
    setSaveStatus(ok ? 'saved' : 'error')
    // Clear status badge after 3 s
    setTimeout(() => setSaveStatus('idle'), 3000)
  }, [safetyData, isSaving])

  // Cache state changes
  useEffect(() => {
    localStorage.setItem('hse_safety_data', JSON.stringify(safetyData))
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
  }, [isInputVisible])

  // Compute metrics
  const calculated = calculateSafetyMetrics(safetyData, useExcelFormula)

  // Risk Pill Styling (matching the Carlos Brown / Joel Cannan badges)
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

  // Interactive Demo Tour States
  const [demoActive, setDemoActive] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [donutHoverCategory, setDonutHoverCategory] = useState<string | null>(null)
  const [barHoverCategory, setBarHoverCategory] = useState<string | null>(null)

  // Layout Refs to calculate virtual cursor coordinates dynamically
  const donutContainerRef = React.useRef<HTMLDivElement>(null)
  const barContainerRef = React.useRef<HTMLDivElement>(null)

  // Slideshow States
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [pptHoverCategory, setPptHoverCategory] = useState<string | null>(null)

  // Get dynamic adaptive background gradient per slide scenario
  const getSlideBackground = (index: number) => {
    const isLight = theme === 'light'
    switch (index) {
      case 0: // Q1 Baseline (Slate Navy)
        return isLight 
          ? 'radial-gradient(circle at 50% 0%, #cbd5e1 0%, #f8fafc 100%)' // Soft Gray Glow
          : 'radial-gradient(circle at 50% 0%, #0d2547 0%, #020813 100%)'
      case 1: // Q2 High Activity (Ocean Blue)
        return isLight 
          ? 'radial-gradient(circle at 50% 0%, #d0e7fc 0%, #f8fafc 100%)' // Soft Blue Glow
          : 'radial-gradient(circle at 50% 0%, #0a355c 0%, #010f22 100%)'
      case 2: // Q3 Zero Harm (Emerald Green)
        return isLight 
          ? 'radial-gradient(circle at 50% 0%, #d1f7e5 0%, #f8fafc 100%)' // Soft Green Glow
          : 'radial-gradient(circle at 50% 0%, #063c26 0%, #000c07 100%)'
      case 3: // Q4 High Risk Alert (Critical Red)
        return isLight 
          ? 'radial-gradient(circle at 50% 0%, #ffd8d8 0%, #f8fafc 100%)' // Soft Red Glow
          : 'radial-gradient(circle at 50% 0%, #3a0e0e 0%, #0b0202 100%)'
      case 4: // Year-End Recovery (Amber Gold)
        return isLight 
          ? 'radial-gradient(circle at 50% 0%, #fef0c7 0%, #f8fafc 100%)' // Soft Gold Glow
          : 'radial-gradient(circle at 50% 0%, #352506 0%, #0a0701 100%)'
      default:
        return isLight 
          ? 'radial-gradient(circle at 50% 0%, #cbd5e1 0%, #f8fafc 100%)'
          : 'radial-gradient(circle at 50% 0%, #0d2547 0%, #020813 100%)'
    }
  }

  // Toggle Fullscreen PPT Presentation Mode
  const enterPresentationMode = () => {
    setIsPresentationMode(true)
    setIsSlideshowPlaying(true) // Automatically start playing on entering presentation
    
    // Request fullscreen on documentElement
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err)
      })
    }
  }

  const exitPresentationMode = () => {
    setIsPresentationMode(false)
    setIsSlideshowPlaying(false)
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err)
      })
    }
  }

  // Listen for fullscreen change event (e.g. if user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsPresentationMode(isCurrentlyFullscreen)
      if (!isCurrentlyFullscreen) {
        setIsSlideshowPlaying(false)
        document.body.classList.remove('presentation-mode-active')
      } else {
        document.body.classList.add('presentation-mode-active')
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.body.classList.remove('presentation-mode-active')
    }
  }, [])

  // Keyboard navigation for PPT Mode
  useEffect(() => {
    if (!isPresentationMode) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setCurrentSlideIndex((prevIdx) => {
          const nextIdx = (prevIdx + 1) % SLIDESHOW_DATA.length
          setSafetyData(SLIDESHOW_DATA[nextIdx].data)
          return nextIdx
        })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentSlideIndex((prevIdx) => {
          const nextIdx = (prevIdx - 1 + SLIDESHOW_DATA.length) % SLIDESHOW_DATA.length
          setSafetyData(SLIDESHOW_DATA[nextIdx].data)
          return nextIdx
        })
      } else if (e.key === 'Escape') {
        exitPresentationMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPresentationMode])

  // Slideshow Autoplay Timer Effect
  useEffect(() => {
    if (!isSlideshowPlaying) return

    const timer = setInterval(() => {
      setCurrentSlideIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % SLIDESHOW_DATA.length
        setSafetyData(SLIDESHOW_DATA[nextIdx].data)
        return nextIdx
      })
    }, 3000)

    return () => clearInterval(timer)
  }, [isSlideshowPlaying])

  // Pause slideshow if demo tour becomes active
  useEffect(() => {
    if (demoActive) {
      setIsSlideshowPlaying(false)
    }
  }, [demoActive])

  // Pause demo tour if slideshow becomes active
  useEffect(() => {
    if (isSlideshowPlaying) {
      setDemoActive(false)
    }
  }, [isSlideshowPlaying])

  // Handle Demo tour activation
  useEffect(() => {
    if (!demoActive) {
      setDonutHoverCategory(null)
      setBarHoverCategory(null)
      return
    }
    // Start cursor in the center of the screen
    setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    setDemoStep(0)
  }, [demoActive])

  // Process Tour steps
  useEffect(() => {
    if (!demoActive) return

    const steps = [
      // Step 0: Move to Donut Chart Center
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          setDonutHoverCategory(null)
          setBarHoverCategory(null)
        }
      },
      // Step 1: Hover Donut Item LTI
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 - 35, y: rect.top + rect.height / 2 - 35 })
          setDonutHoverCategory('lti')
          setBarHoverCategory(null)
        }
      },
      // Step 2: Hover Donut Item RWC
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 35, y: rect.top + rect.height / 2 - 30 })
          setDonutHoverCategory('rwc')
        }
      },
      // Step 3: Hover Donut Item MTC
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 35, y: rect.top + rect.height / 2 + 30 })
          setDonutHoverCategory('mtc')
        }
      },
      // Step 4: Hover Donut Item FAC
      () => {
        if (donutContainerRef.current) {
          const rect = donutContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 - 35, y: rect.top + rect.height / 2 + 35 })
          setDonutHoverCategory('fac')
        }
      },
      // Step 5: Move to Bar Chart Audit Execution
      () => {
        if (barContainerRef.current) {
          const rect = barContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 30, y: rect.top + 45 })
          setDonutHoverCategory(null)
          setBarHoverCategory('audit')
        }
      },
      // Step 6: Hover Bar Hazard SLA
      () => {
        if (barContainerRef.current) {
          const rect = barContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 40, y: rect.top + 100 })
          setBarHoverCategory('hazard')
        }
      },
      // Step 7: Hover Bar Safety Observations
      () => {
        if (barContainerRef.current) {
          const rect = barContainerRef.current.getBoundingClientRect()
          setCursorPos({ x: rect.left + rect.width / 2 + 20, y: rect.top + 155 })
          setBarHoverCategory('observations')
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

  return (
    <>
      {isPresentationMode && (
        <div
          id="presentation-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: getSlideBackground(currentSlideIndex),
            color: theme === 'light' ? '#0f172a' : '#ffffff',
            zIndex: 999999,
            padding: '2rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transition: 'background 1s ease-in-out',
          }}
        >
          {/* Top Progress bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)' }}>
            <div 
              style={{ 
                height: '100%', 
                width: `${((currentSlideIndex + 1) / SLIDESHOW_DATA.length) * 100}%`, 
                background: 'linear-gradient(to right, #60a5fa, #2563eb)',
                transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
              }} 
            />
          </div>

          {/* Top Control Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: theme === 'light' ? '#2563eb' : '#60a5fa', fontWeight: 800 }}>
                HSE Executive Presentation Mode
              </span>
              <h2 
                key={currentSlideIndex}
                className="ppt-slide-animate"
                style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.15rem', letterSpacing: '-0.02em', color: theme === 'light' ? '#0f172a' : '#ffffff' }}
              >
                {SLIDESHOW_DATA[currentSlideIndex].name}
              </h2>
            </div>
            
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
              {/* Risk Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: riskPill.bg,
                  padding: '0.4rem 0.95rem',
                  borderRadius: '24px',
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
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: riskPill.text }}>
                  {riskPill.label}
                </span>
              </div>

              <button
                onClick={exitPresentationMode}
                className="btn"
                style={{
                  background: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                  border: theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)',
                  color: theme === 'light' ? '#0f172a' : '#ffffff',
                  fontSize: '0.75rem',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  transition: 'all 0.25s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.background = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}
              >
                Exit Presentation
              </button>
            </div>
          </div>

          {/* Presentation Body: Large cards + Large Charts */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: 0 }}>
            
            {/* KPI Row (Large view) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              {[
                { title: "Total Recordable Incident Rate", value: calculated.trir.toFixed(2), target: "Target: < 1.00", color: calculated.trir < 1.00 ? '#10b981' : '#ef4444', hoverCat: null },
                { title: "Lost Time Frequency Rate", value: calculated.ltifr.toFixed(2), target: "Target: < 1.00", color: calculated.ltifr < 1.00 ? '#10b981' : '#ef4444', hoverCat: 'lti' },
                { title: "Hazard Close-Out Rate", value: `${calculated.hazardCloseOutRate.toFixed(1)}%`, target: "Target: > 90%", color: calculated.hazardCloseOutRate >= 90 ? '#fbbf24' : '#ef4444', hoverCat: 'hazard' },
                { title: "Audit Completion Rate", value: `${calculated.auditCompletionRate.toFixed(1)}%`, target: "Target: > 95%", color: calculated.auditCompletionRate >= 95 ? '#10b981' : '#ef4444', hoverCat: 'audit' },
                { title: "Total Recordable Cases", value: calculated.tri, target: `LTI: ${safetyData.lti} • RWC: ${safetyData.rwc} • MTC: ${safetyData.mtc}`, color: calculated.tri === 0 ? '#10b981' : '#fbbf24', hoverCat: 'mtc' },
              ].map((kpi, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel" 
                  onMouseEnter={() => kpi.hoverCat && setPptHoverCategory(kpi.hoverCat)}
                  onMouseLeave={() => setPptHoverCategory(null)}
                  style={{ 
                    padding: '1.25rem 1.5rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    background: theme === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(7, 19, 36, 0.65)',
                    border: pptHoverCategory === kpi.hoverCat && kpi.hoverCat
                      ? '1px solid var(--color-primary)'
                      : (theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)'),
                    height: '135px',
                    cursor: kpi.hoverCat ? 'pointer' : 'default',
                    transition: 'all 0.25s',
                    transform: pptHoverCategory === kpi.hoverCat && kpi.hoverCat ? 'translateY(-2px)' : 'none',
                    boxShadow: pptHoverCategory === kpi.hoverCat && kpi.hoverCat 
                      ? '0 6px 18px rgba(37, 99, 235, 0.25)' 
                      : 'var(--shadow-sm)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: theme === 'light' ? '#475569' : '#94a3b8', fontWeight: 700 }}>{kpi.title}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.25rem 0' }}>
                    <span 
                      key={currentSlideIndex}
                      className="ppt-slide-animate"
                      style={{ fontSize: '2.5rem', fontWeight: 800, color: kpi.color, letterSpacing: '-0.02em', display: 'inline-block' }}
                    >
                      {kpi.value}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: theme === 'light' ? '#475569' : '#64748b', borderTop: theme === 'light' ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem' }}>{kpi.target}</div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1, minHeight: 0 }}>
              {/* Donut Chart Container */}
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '1rem 1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: theme === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(7, 19, 36, 0.65)', 
                  border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                  height: '100%',
                  minHeight: 0
                }}
              >
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: theme === 'light' ? '#0f172a' : '#ffffff', marginBottom: '0.35rem' }}>
                  Incident Breakdown (Lagging)
                </h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' }}>
                  <div style={{ height: '260px', width: '100%' }}>
                    <IncidentDonut
                      lti={safetyData.lti}
                      rwc={safetyData.rwc}
                      mtc={safetyData.mtc}
                      fac={safetyData.fac}
                      hoveredCategory={pptHoverCategory}
                      theme={theme}
                    />
                  </div>
                </div>
              </div>

              {/* Target vs Actual Bar Chart Container */}
              <div 
                className="glass-panel" 
                style={{ 
                  padding: '1rem 1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  background: theme === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(7, 19, 36, 0.65)', 
                  border: theme === 'light' ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                  height: '100%',
                  minHeight: 0
                }}
              >
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: theme === 'light' ? '#0f172a' : '#ffffff', marginBottom: '0.35rem' }}>
                  Preventative Targets vs Performance (Leading)
                </h3>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' }}>
                  <div style={{ height: '260px', width: '100%' }}>
                    <TargetVsActual
                      observations={safetyData.observations}
                      hazardRate={calculated.hazardCloseOutRate}
                      auditRate={calculated.auditCompletionRate}
                      hoveredCategory={pptHoverCategory}
                      theme={theme}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer controls and direct navigation dots */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            
            {/* Action Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => {
                  setCurrentSlideIndex((prev) => {
                    const nextIdx = (prev - 1 + SLIDESHOW_DATA.length) % SLIDESHOW_DATA.length
                    updateSafetyData(SLIDESHOW_DATA[nextIdx].data)
                    return nextIdx
                  })
                }}
                style={{
                  background: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                  border: theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                  color: theme === 'light' ? '#0f172a' : '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}
              >
                ←
              </button>

              <button
                onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                className="btn"
                style={{
                  background: isSlideshowPlaying 
                    ? 'linear-gradient(to bottom, #2563eb, #1d4ed8)' 
                    : (theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'),
                  border: isSlideshowPlaying 
                    ? '1px solid rgba(255, 255, 255, 0.2)' 
                    : (theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.12)'),
                  color: isSlideshowPlaying ? '#ffffff' : (theme === 'light' ? '#0f172a' : '#ffffff'),
                  fontSize: '0.75rem',
                  padding: '0.45rem 1.25rem',
                  borderRadius: '30px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: isSlideshowPlaying ? '0 4px 16px rgba(37, 99, 235, 0.4)' : 'none',
                  transition: 'all 0.25s'
                }}
              >
                {isSlideshowPlaying ? '❚❚ Pause Auto' : '▶ Play Auto'}
              </button>

              <button
                onClick={() => {
                  setCurrentSlideIndex((prev) => {
                    const nextIdx = (prev + 1) % SLIDESHOW_DATA.length
                    updateSafetyData(SLIDESHOW_DATA[nextIdx].data)
                    return nextIdx
                  })
                }}
                style={{
                  background: theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
                  border: theme === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                  color: theme === 'light' ? '#0f172a' : '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = theme === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}
              >
                →
              </button>
            </div>

            {/* Dots Indicator */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {SLIDESHOW_DATA.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentSlideIndex(idx)
                    updateSafetyData(slide.data)
                    setIsSlideshowPlaying(false) // Pause autoplay on manual click
                  }}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: idx === currentSlideIndex ? '#2563eb' : (theme === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255, 255, 255, 0.25)'),
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s'
                  }}
                  title={slide.name}
                />
              ))}
            </div>

            <div style={{ fontSize: '0.62rem', color: theme === 'light' ? '#475569' : '#64748b', marginTop: '0.1rem' }}>
              Tip: Use Left/Right Arrow keys or Spacebar to navigate. Press ESC to exit.
            </div>
          </div>

        </div>
      )}

      <div
        style={{
          height: '100vh',
          padding: '1rem 1.5%',
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
          gap: isInputVisible ? '1.5rem' : '0px',
          minWidth: 0,
          width: '100%',
          flex: 1,
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
            height: '100%',
            minHeight: 0,
          }}
        >
          {/* Prevent inner inputs from wrapping during transition */}
          <div style={{ width: '330px', height: '100%', minHeight: 0 }}>
            <InputForm
              data={safetyData}
              onChange={(newData) => updateSafetyData(newData)}
              useExcelFormula={useExcelFormula}
              onFormulaToggle={setUseExcelFormula}
              theme={theme}
              onThemeToggle={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              onSave={hasSupabaseConfig ? handleSave : undefined}
              isSaving={isSaving}
              saveStatus={saveStatus}
            />
          </div>
        </aside>

        {/* Right column: Analytics Dashboard */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0, height: '100%', minHeight: 0 }}>

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
                  border: '1px solid rgba(96, 165, 250, 0.15)',
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
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Interactive Demo Tour Toggle */}
              <button
                id="btn-toggle-demo"
                onClick={() => setDemoActive(!demoActive)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: demoActive ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-input)',
                  border: demoActive ? '1px solid var(--color-primary)' : '1px solid rgba(96, 165, 250, 0.15)',
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
                    boxShadow: demoActive ? '0 0 6px var(--color-primary)' : 'none',
                    display: 'inline-block'
                  }}
                ></span>
                {demoActive ? 'Interactive Tour Active' : 'Start Interactive Tour'}
              </button>

              {/* Autoplay Slideshow Toggle */}
              <button
                id="btn-toggle-slideshow"
                onClick={() => setIsSlideshowPlaying(!isSlideshowPlaying)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: isSlideshowPlaying 
                    ? 'linear-gradient(to bottom, #2563eb, #1d4ed8)' 
                    : 'var(--bg-input)',
                  border: isSlideshowPlaying 
                    ? '1px solid rgba(255, 255, 255, 0.2)' 
                    : '1px solid rgba(96, 165, 250, 0.15)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isSlideshowPlaying ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: isSlideshowPlaying ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <span
                  className="risk-dot"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isSlideshowPlaying ? '#ffffff' : 'var(--text-muted)',
                    animation: isSlideshowPlaying ? 'pulse-dot 1.5s infinite ease-in-out' : 'none',
                    boxShadow: isSlideshowPlaying ? '0 0 6px #ffffff' : 'none',
                    display: 'inline-block'
                  }}
                ></span>
                {isSlideshowPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
              </button>

              {/* Manual Scenario Select Dropdown */}
              <select
                id="select-slideshow-scenario"
                value={currentSlideIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10)
                  setCurrentSlideIndex(idx)
                  updateSafetyData(SLIDESHOW_DATA[idx].data)
                  setIsSlideshowPlaying(false) // Pause autoplay on manual change
                }}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid rgba(96, 165, 250, 0.15)',
                  color: 'var(--text-primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.42rem 0.75rem',
                  borderRadius: '20px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all var(--transition-normal)'
                }}
              >
                {SLIDESHOW_DATA.map((slide, idx) => (
                  <option key={idx} value={idx} style={{ background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>
                    {slide.name}
                  </option>
                ))}
              </select>

              {/* Fullscreen PPT Mode Button */}
              <button
                id="btn-present-ppt"
                onClick={enterPresentationMode}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'linear-gradient(to bottom, #2563eb, #1d4ed8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all var(--transition-normal)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                Present Fullscreen
              </button>

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
              gap: '1.5rem',
              flex: 1,
              minHeight: 0,
            }}
            className="indicators-grid"
          >

            {/* Lagging Indicators Panel */}
            <section className="glass-panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Lagging Indicators (Incident Breakdown)
                </h3>
                <div style={{ height: '1px', background: 'var(--border-divider)', marginTop: '0.4rem' }}></div>
              </div>

              {/* Layout for Table & Donut */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center', flex: 1, width: '100%' }}>
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
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                        Lost Time Injuries (LTI)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.lti}</td>
                    </tr>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                        Restricted Work Cases (RWC)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.rwc}</td>
                    </tr>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
                        Medical Treatment Cases (MTC)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.mtc}</td>
                    </tr>
                    <tr>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                        First Aid Cases (FAC)
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{safetyData.fac}</td>
                    </tr>
                  </tbody>
                </table>

                {/* ECharts donut chart */}
                <div ref={donutContainerRef}>
                  <IncidentDonut
                    lti={safetyData.lti}
                    rwc={safetyData.rwc}
                    mtc={safetyData.mtc}
                    fac={safetyData.fac}
                    hoveredCategory={donutHoverCategory}
                    theme={theme}
                  />
                </div>
              </div>
            </section>

            {/* Leading Indicators Panel */}
            <section className="glass-panel" style={{ padding: '1.15rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
              <div>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                  Leading Indicators (Preventative Targets)
                </h3>
                <div style={{ height: '1px', background: 'var(--border-divider)', marginTop: '0.4rem' }}></div>
              </div>

              {/* Table and Comparison Chart */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'space-around' }}>
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
                <div ref={barContainerRef}>
                  <TargetVsActual
                    observations={safetyData.observations}
                    hazardRate={calculated.hazardCloseOutRate}
                    auditRate={calculated.auditCompletionRate}
                    hoveredCategory={barHoverCategory}
                    theme={theme}
                  />
                </div>
              </div>
            </section>

          </div>

        </main>

      </div>

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

      {/* Responsive adjustments helper styles */}
      <style>{`
        #presentation-overlay .donut-chart-container {
          height: 220px !important;
        }
        #presentation-overlay .target-chart-container {
          height: 230px !important;
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
          }
          .indicators-grid {
            flex: 1;
            min-height: 0;
          }
          .indicators-grid > .glass-panel {
            height: 100%;
          }
          .donut-chart-container {
            height: 180px;
          }
          .target-chart-container {
            height: 165px;
          }
          .hse-table th {
            padding: 0.5rem 0.75rem !important;
          }
          .hse-table td {
            padding: 0.55rem 0.75rem !important;
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
          }
          main {
            height: auto !important;
          }
          .donut-chart-container {
            height: 175px;
          }
          .target-chart-container {
            height: 200px;
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
    </>
  )
}
export default Dashboard

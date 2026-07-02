import React, { useState, useEffect } from 'react'
import type { MetricItem, KPITargets } from '../../types/dashboard'
import { RotateCcw, HelpCircle, Sun, Moon, Save, CheckCircle, AlertCircle, Loader, Edit2, Trash2, Plus, X, Lock, Unlock } from 'lucide-react'

interface InputFormProps {
  metrics: MetricItem[]
  onChange: (newMetrics: MetricItem[]) => void
  useExcelFormula: boolean
  onFormulaToggle: (val: boolean) => void
  theme?: 'light' | 'dark'
  onThemeToggle?: () => void
  onSave?: () => void
  isSaving?: boolean
  saveStatus?: 'idle' | 'saved' | 'error'
  adminPasscodeHash: string | null
  onSavePasscodeHash: (newHash: string) => void
  kpiTargets: KPITargets
  onKpiTargetsChange: (newTargets: KPITargets) => void
}

export const InputForm: React.FC<InputFormProps> = ({
  metrics,
  onChange,
  useExcelFormula,
  onFormulaToggle,
  theme = 'dark',
  onThemeToggle,
  onSave,
  isSaving = false,
  saveStatus = 'idle',
  adminPasscodeHash = null,
  onSavePasscodeHash,
  kpiTargets,
  onKpiTargetsChange,
}) => {
  // Lock state: starts locked if an admin passcode hash exists in the database
  const [isLocked, setIsLocked] = useState(() => !!adminPasscodeHash)

  // Passcode modal states
  const [passcodeModalOpen, setPasscodeModalOpen] = useState(false)
  const [passcodeVal, setPasscodeVal] = useState('')
  const [passcodeConfirmVal, setPasscodeConfirmVal] = useState('')
  const [passcodeError, setPasscodeError] = useState('')

  // Change passcode states
  const [changePasscodeModalOpen, setChangePasscodeModalOpen] = useState(false)
  const [currentPasscodeVal, setCurrentPasscodeVal] = useState('')
  const [newPasscodeVal, setNewPasscodeVal] = useState('')
  const [newPasscodeConfirmVal, setNewPasscodeConfirmVal] = useState('')
  const [changeError, setChangeError] = useState('')

  // Adding indicator state
  const [addingType, setAddingType] = useState<'lagging' | 'leading' | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newInfo, setNewInfo] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newColor, setNewColor] = useState('#8b5cf6') // Purple default

  // Editing indicator state
  const [editingMetric, setEditingMetric] = useState<MetricItem | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editInfo, setEditInfo] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editColor, setEditColor] = useState('')

  // Deleting confirmation state
  const [deletingMetric, setDeletingMetric] = useState<MetricItem | null>(null)

  // SHA-256 Hashing helper using native Web Crypto API
  const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message)
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Sync locked state if database passcode updates remotely
  useEffect(() => {
    if (!adminPasscodeHash) {
      setIsLocked(false)
    }
  }, [adminPasscodeHash])

  // 15-Minute inactivity auto-lock timer
  useEffect(() => {
    if (isLocked) return

    let timeoutId: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsLocked(true)
      }, 900000) // 15 minutes in ms
    }

    resetTimer()

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(e => document.addEventListener(e, resetTimer))

    return () => {
      clearTimeout(timeoutId)
      events.forEach(e => document.removeEventListener(e, resetTimer))
    }
  }, [isLocked])

  const handleLockClick = () => {
    if (isLocked) {
      setPasscodeVal('')
      setPasscodeConfirmVal('')
      setPasscodeError('')
      setPasscodeModalOpen(true)
    } else {
      setIsLocked(true)
    }
  }

  const handleVerifyOrSetPasscode = async () => {
    setPasscodeError('')
    if (!adminPasscodeHash) {
      if (!passcodeVal) {
        setPasscodeError('Passcode cannot be empty')
        return
      }
      if (passcodeVal !== passcodeConfirmVal) {
        setPasscodeError('Passcodes do not match')
        return
      }
      const hash = await sha256(passcodeVal)
      onSavePasscodeHash(hash)
      setIsLocked(false)
      setPasscodeModalOpen(false)
    } else {
      const enteredHash = await sha256(passcodeVal)
      if (enteredHash === adminPasscodeHash) {
        setIsLocked(false)
        setPasscodeModalOpen(false)
      } else {
        setPasscodeError('Incorrect passcode')
      }
    }
  }

  const handleChangePasscode = async () => {
    setChangeError('')
    if (!newPasscodeVal) {
      setChangeError('New passcode cannot be empty')
      return
    }
    if (newPasscodeVal !== newPasscodeConfirmVal) {
      setChangeError('New passcodes do not match')
      return
    }

    if (adminPasscodeHash) {
      const currentHash = await sha256(currentPasscodeVal)
      if (currentHash !== adminPasscodeHash) {
        setChangeError('Current passcode is incorrect')
        return
      }
    }

    const newHash = await sha256(newPasscodeVal)
    onSavePasscodeHash(newHash)
    setChangePasscodeModalOpen(false)
    setCurrentPasscodeVal('')
    setNewPasscodeVal('')
    setNewPasscodeConfirmVal('')
  }

  const handleInputChange = (id: string, value: string) => {
    const stripped = value.replace(/[^0-9]/g, '')
    const numValue = stripped === '' ? 0 : Math.max(0, parseInt(stripped, 10))
    onChange(metrics.map(m => {
      if (m.id === id) {
        return { ...m, value: numValue }
      }
      return m
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End',
    ]
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!/^\d+$/.test(pasted)) {
      e.preventDefault()
    }
  }

  const zeroAllInputs = () => {
    onChange(metrics.map(m => ({ ...m, value: 0 })))
  }

  const startEditing = (m: MetricItem) => {
    setEditingMetric(m)
    setEditLabel(m.label)
    setEditInfo(m.info || '')
    setEditTarget(m.target !== undefined ? String(m.target) : '')
    setEditColor(m.color || '')
  }

  const saveEditedMetric = () => {
    if (!editingMetric || !editLabel.trim()) return
    onChange(metrics.map(m => {
      if (m.id === editingMetric.id) {
        return {
          ...m,
          label: editLabel,
          info: editInfo || undefined,
          target: (m.type === 'leading' || m.type === 'lagging')
            ? (isNaN(parseInt(editTarget, 10)) ? (m.type === 'leading' ? 100 : 0) : parseInt(editTarget, 10))
            : undefined,
          color: editColor || undefined
        }
      }
      return m
    }))
    setEditingMetric(null)
  }

  const confirmDelete = () => {
    if (!deletingMetric) return
    const id = deletingMetric.id
    onChange(metrics.map(m => {
      if (m.id === id) {
        if (m.isCustom) {
          return null
        } else {
          return { ...m, isActive: false }
        }
      }
      return m
    }).filter(Boolean) as MetricItem[])
    setDeletingMetric(null)
  }

  const saveNewMetric = (type: 'lagging' | 'leading') => {
    if (!newLabel.trim()) return
    const newId = 'custom_' + Date.now()
    const newItem: MetricItem = {
      id: newId,
      label: newLabel,
      type,
      value: 0,
      info: newInfo || undefined,
      target: (type === 'leading' || type === 'lagging')
        ? (isNaN(parseInt(newTarget, 10)) ? (type === 'leading' ? 100 : 0) : parseInt(newTarget, 10))
        : undefined,
      color: newColor,
      isCustom: true,
      isActive: true
    }
    onChange([...metrics, newItem])
    setAddingType(null)
    setNewLabel('')
    setNewInfo('')
    setNewTarget('')
  }

  const restoreMetric = (id: string) => {
    onChange(metrics.map(m => {
      if (m.id === id) {
        return { ...m, isActive: true }
      }
      return m
    }))
  }

  const badgeStyle = (type: 'exposure' | 'lagging' | 'leading') => {
    const isDark = theme === 'dark'
    const colors = {
      exposure: {
        bg: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.08)',
        color: isDark ? '#60a5fa' : '#2563eb',
        border: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.15)',
      },
      lagging: {
        bg: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(220, 38, 38, 0.08)',
        color: isDark ? '#ef4444' : '#dc2626',
        border: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.15)',
      },
      leading: {
        bg: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.08)',
        color: isDark ? '#10b981' : '#059669',
        border: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.15)',
      },
    }[type]

    return {
      fontSize: '0.62rem',
      fontWeight: 800 as const,
      padding: '0.12rem 0.35rem',
      borderRadius: '4px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.03em',
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: colors.bg,
      color: colors.color,
      border: `1px solid ${colors.border}`,
    }
  }

  const sectionHeaderStyle = (color: string, borderColor: string) => ({
    fontSize: '0.72rem',
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color,
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.6rem',
    marginBottom: '0.2rem',
    borderBottom: `1px solid ${borderColor}`,
    paddingBottom: '0.35rem',
  })

  const renderFormGroup = (m: MetricItem) => (
    <div key={m.id} className="form-group" style={{ position: 'relative' }}>
      <label className="form-label" htmlFor={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {m.label}
          <span style={badgeStyle(m.type)}>{m.type === 'exposure' ? 'Exposure' : m.type === 'lagging' ? 'Lagging' : 'Leading'}</span>
        </span>
        {m.info && <span className="form-label-info">{m.info}</span>}
      </label>
      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
        <input
          id={m.id}
          type="number"
          min="0"
          className="form-input"
          value={m.value || ''}
          onChange={(e) => handleInputChange(m.id, e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={m.type === 'exposure' ? 'e.g. 1200000' : '0'}
          style={{ flex: 1 }}
          disabled={isLocked}
        />
        {/* Metric Settings Actions */}
        {m.id !== 'totalManHours' && !isLocked && (
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            <button
              onClick={() => startEditing(m)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                width: '1.95rem',
                height: '1.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary)'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              title="Edit settings"
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={() => setDeletingMetric(m)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                color: '#ef4444',
                width: '1.95rem',
                height: '1.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ef4444'
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.background = 'var(--bg-input)'
              }}
              title="Delete indicator"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const exposureMetrics = metrics.filter(m => m.type === 'exposure' && m.isActive !== false)
  const laggingMetrics = metrics.filter(m => m.type === 'lagging' && m.isActive !== false)
  const leadingMetrics = metrics.filter(m => m.type === 'leading' && m.isActive !== false)
  const inactiveStandardMetrics = metrics.filter(m => !m.isCustom && m.isActive === false)

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        height: '100%',
        minHeight: 0,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            HSE Data Input Section
          </h3>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              marginTop: '0.15rem',
              lineHeight: 1.4,
            }}
          >
            Adjust parameters to update the executive dashboard in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {/* Lock/Unlock Toggle Button */}
          <button
            onClick={handleLockClick}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '50%',
              width: '2.2rem',
              height: '2.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isLocked ? '#ef4444' : '#10b981',
              transition: 'all var(--transition-normal)',
              flexShrink: 0,
              boxShadow: 'var(--shadow-sm)',
            }}
            title={isLocked ? 'Unlock editing controls' : 'Lock editing controls'}
          >
            {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
          </button>

          {onThemeToggle && (
            <button
              id="btn-toggle-theme"
              onClick={onThemeToggle}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '2.2rem',
                height: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                transition: 'all var(--transition-normal)',
                flexShrink: 0,
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-hover)'
                e.currentTarget.style.color = 'var(--text-primary)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)'
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons: Reset + Save */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          id="btn-preset-sample"
          className="btn btn-secondary"
          onClick={zeroAllInputs}
          disabled={isLocked}
          title="Set all safety metrics inputs to zero"
          style={{
            fontSize: '0.72rem',
            padding: '0.45rem 0.65rem',
            flex: 1,
            whiteSpace: 'nowrap',
            opacity: isLocked ? 0.5 : 1,
            cursor: isLocked ? 'not-allowed' : 'pointer',
          }}
        >
          <RotateCcw size={11} /> Reset
        </button>

        {onSave && (
          <button
            id="btn-save-metrics"
            onClick={() => {
              if (onSave) onSave()
              setIsLocked(true) // Auto-lock editing after saving successfully
            }}
            disabled={isSaving || isLocked}
            title={isLocked ? 'Unlock first to save modifications' : 'Save metrics to database — all connected devices will update'}
            style={{
              fontSize: '0.72rem',
              padding: '0.45rem 0.75rem',
              flex: 2,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: (isSaving || isLocked) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background:
                isLocked ? 'rgba(255,255,255,0.05)' :
                saveStatus === 'saved' ? 'rgba(16,185,129,0.15)' :
                saveStatus === 'error'  ? 'rgba(239,68,68,0.15)'  :
                'linear-gradient(135deg, var(--color-primary), #6366f1)',
              color:
                isLocked ? 'var(--text-muted)' :
                saveStatus === 'saved' ? '#10b981' :
                saveStatus === 'error'  ? '#ef4444'  :
                '#ffffff',
              opacity: (isSaving || isLocked) ? 0.5 : 1,
              boxShadow: (saveStatus === 'idle' && !isLocked) ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
            }}
          >
            {isSaving && <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />}
            {saveStatus === 'saved' && <CheckCircle size={12} />}
            {saveStatus === 'error'  && <AlertCircle size={12} />}
            {!isSaving && saveStatus === 'idle' && <Save size={12} />}
            {isSaving ? 'Saving…' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Failed' : 'Save & Sync'}
          </button>
        )}
      </div>

      {/* Change Passcode button if unlocked and passcode exists */}
      {!isLocked && adminPasscodeHash && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.6rem' }}>
          <button
            onClick={() => {
              setCurrentPasscodeVal('')
              setNewPasscodeVal('')
              setNewPasscodeConfirmVal('')
              setChangeError('')
              setChangePasscodeModalOpen(true)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.68rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            Change Admin Passcode
          </button>
        </div>
      )}

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-divider)' }} />

      {/* Fields Wrapper */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 350px)',
          paddingRight: '2px',
        }}
      >
        {/* SECTION 1: BASELINE & EXPOSURE */}
        {exposureMetrics.length > 0 && (
          <>
            <div style={sectionHeaderStyle('var(--text-secondary)', 'var(--border-divider)')}>
              <span>Baseline & Exposure</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-muted)' }}>— Normalizing factors</span>
            </div>
            {exposureMetrics.map(renderFormGroup)}
          </>
        )}

        {/* SECTION 2: LAGGING INDICATORS */}
        <div style={sectionHeaderStyle(
          theme === 'dark' ? '#ef4444' : '#dc2626',
          theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.15)'
        )}>
          <span>Lagging Indicators</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-muted)' }}>— Incident outcomes</span>
        </div>
        {laggingMetrics.map(renderFormGroup)}

        {/* Inline form to add lagging indicator */}
        {!isLocked && (
          addingType === 'lagging' ? (
            <div className="glass-panel" style={{ padding: '0.85rem', border: '1px dashed var(--border-color)', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderRadius: 'var(--radius-md)', margin: '0.4rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Lagging Incident</span>
                <button onClick={() => setAddingType(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
              </div>
              <input type="text" placeholder="Name e.g. Near Misses" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
              <input type="text" placeholder="Description e.g. Near misses logged" value={newInfo} onChange={e => setNewInfo(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
              <input type="number" placeholder="Target Benchmark e.g. 0" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>Chart Color:</span>
                {['#ef4444', '#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'].map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, border: newColor === c ? '2px solid white' : 'none', cursor: 'pointer', outline: newColor === c ? '1px solid black' : 'none' }} />
                ))}
              </div>
              <button onClick={() => saveNewMetric('lagging')} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.35rem', fontWeight: 800 }}>Add Indicator</button>
            </div>
          ) : (
            <button
              onClick={() => { setAddingType('lagging'); setNewColor('#8b5cf6'); }}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                transition: 'all 0.25s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Plus size={12} /> Add Custom Lagging Indicator
            </button>
          )
        )}

        {/* SECTION 3: LEADING INDICATORS */}
        <div style={sectionHeaderStyle(
          theme === 'dark' ? '#10b981' : '#059669',
          theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.15)'
        )}>
          <span>Leading Indicators</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-muted)' }}>— Preventative actions</span>
        </div>
        {leadingMetrics.map(renderFormGroup)}

        {/* Inline form to add leading indicator */}
        {!isLocked && (
          addingType === 'leading' ? (
            <div className="glass-panel" style={{ padding: '0.85rem', border: '1px dashed var(--border-color)', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderRadius: 'var(--radius-md)', margin: '0.4rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Leading Indicator</span>
                <button onClick={() => setAddingType(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
              </div>
              <input type="text" placeholder="Name e.g. Toolbox Talks" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
              <input type="text" placeholder="Description e.g. Talks completed" value={newInfo} onChange={e => setNewInfo(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
              <input type="number" placeholder="Target Benchmark e.g. 20" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>Chart Color:</span>
                {['#ef4444', '#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'].map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, border: newColor === c ? '2px solid white' : 'none', cursor: 'pointer', outline: newColor === c ? '1px solid black' : 'none' }} />
                ))}
              </div>
              <button onClick={() => saveNewMetric('leading')} className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '0.35rem', fontWeight: 800 }}>Add Indicator</button>
            </div>
          ) : (
            <button
              onClick={() => { setAddingType('leading'); setNewColor('#10b981'); }}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
                transition: 'all 0.25s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <Plus size={12} /> Add Custom Leading Indicator
            </button>
          )
        )}

        {/* Restore hidden default fields if any exist */}
        {!isLocked && inactiveStandardMetrics.length > 0 && (
          <div style={{ marginTop: '0.5rem', padding: '0.6rem', border: '1px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Hidden Standard Indicators:</span>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {inactiveStandardMetrics.map(m => (
                <button
                  key={m.id}
                  onClick={() => restoreMetric(m.id)}
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px dashed var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  <Plus size={10} /> Restore {m.id.replace(/^[a-z]/, char => char.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid var(--border-divider)' }} />

      {/* Formula Settings Panel */}
      <div
        style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.45rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Close-Out Formula
            </span>
            <span
              title="Standard: Closed/Observations (91.7%). Excel screenshot: Observations/Closed (109.1%)."
              style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}
            >
              <HelpCircle size={12} />
            </span>
          </div>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.35rem',
              borderRadius: '4px',
              backgroundColor: useExcelFormula ? 'var(--color-warning-bg)' : 'var(--color-primary-glow)',
              color: useExcelFormula ? 'var(--color-warning)' : 'var(--color-primary)',
            }}
          >
            {useExcelFormula ? 'Excel formula' : 'Standard'}
          </span>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            background: 'rgba(94, 124, 107, 0.05)', 
            padding: '0.15rem', 
            borderRadius: '8px',
            alignItems: 'center' 
          }}
        >
          <button
            id="btn-formula-std"
            onClick={() => !isLocked && onFormulaToggle(false)}
            disabled={isLocked}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              background: !useExcelFormula ? 'var(--bg-panel)' : 'transparent',
              color: !useExcelFormula ? 'var(--color-success)' : 'var(--text-secondary)',
              boxShadow: !useExcelFormula ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all var(--transition-fast)',
              opacity: isLocked && useExcelFormula ? 0.35 : 1,
            }}
          >
            Closed / Obs
          </button>
          <button
            id="btn-formula-excel"
            onClick={() => !isLocked && onFormulaToggle(true)}
            disabled={isLocked}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              background: useExcelFormula ? 'var(--bg-panel)' : 'transparent',
              color: useExcelFormula ? 'var(--color-warning)' : 'var(--text-secondary)',
              boxShadow: useExcelFormula ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all var(--transition-fast)',
              opacity: isLocked && !useExcelFormula ? 0.35 : 1,
            }}
          >
            Obs / Closed
          </button>
        </div>
      </div>

      {/* Global KPI Target Baselines Panel */}
      <div
        style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Global KPI Targets
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            (Unlocked Edit)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)' }}>TRIR Limit</label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              disabled={isLocked}
              value={kpiTargets.trir}
              onChange={e => onKpiTargetsChange({ ...kpiTargets, trir: parseFloat(e.target.value) || 1.00 })}
              className="form-input"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)' }}>LTIFR Limit</label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              disabled={isLocked}
              value={kpiTargets.ltifr}
              onChange={e => onKpiTargetsChange({ ...kpiTargets, ltifr: parseFloat(e.target.value) || 1.00 })}
              className="form-input"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Hazard SLA Min %</label>
            <input
              type="number"
              step="1"
              min="1"
              max="100"
              disabled={isLocked}
              value={kpiTargets.hazardCloseOut}
              onChange={e => onKpiTargetsChange({ ...kpiTargets, hazardCloseOut: parseInt(e.target.value, 10) || 90 })}
              className="form-input"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <label style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Audit Comp Min %</label>
            <input
              type="number"
              step="1"
              min="1"
              max="100"
              disabled={isLocked}
              value={kpiTargets.auditCompletion}
              onChange={e => onKpiTargetsChange({ ...kpiTargets, auditCompletion: parseInt(e.target.value, 10) || 95 })}
              className="form-input"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.45rem' }}
            />
          </div>
        </div>
      </div>

      {/* Premium Edit Settings Overlay Modal */}
      {editingMetric && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '360px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Edit Indicator Settings</h4>
              <button onClick={() => setEditingMetric(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Label Name</label>
              <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} className="form-input" style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Description</label>
              <input type="text" value={editInfo} onChange={e => setEditInfo(e.target.value)} className="form-input" style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }} />
            </div>

            {(editingMetric.type === 'leading' || editingMetric.type === 'lagging') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Target Value</label>
                <input type="number" min="0" value={editTarget} onChange={e => setEditTarget(e.target.value)} className="form-input" style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }} />
              </div>
            )}

            {editingMetric.type !== 'exposure' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Chart Accent Color</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {['#ef4444', '#fbbf24', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'].map(c => (
                    <button key={c} onClick={() => setEditColor(c)} style={{ width: '16px', height: '16px', borderRadius: '50%', background: c, border: editColor === c ? '2px solid white' : 'none', cursor: 'pointer', outline: editColor === c ? '1px solid black' : 'none' }} />
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setEditingMetric(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Cancel</button>
              <button onClick={saveEditedMetric} className="btn btn-primary" style={{ flex: 2, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Deletion Confirmation Overlay Modal */}
      {deletingMetric && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Delete Indicator?</h4>
              <button onClick={() => setDeletingMetric(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Are you sure you want to delete <strong>{deletingMetric.label}</strong>? This action will remove it from the input form, dashboard cards, and charts.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setDeletingMetric(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Cancel</button>
              <button onClick={confirmDelete} className="btn" style={{ flex: 2, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800, background: '#ef4444', color: 'white', border: 'none' }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Passcode Lock/Unlock Modal */}
      {passcodeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {!adminPasscodeHash ? 'Create Admin Passcode' : 'Unlock Input Controls'}
              </h4>
              <button onClick={() => setPasscodeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {!adminPasscodeHash
                ? 'Create a secure admin passcode. This passcode will be required to unlock these dashboard controls for editing in the future.'
                : 'Enter the admin passcode to enable editing inputs, managing metrics, and database syncing.'
              }
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Passcode</label>
                <input
                  type="password"
                  placeholder="Enter passcode"
                  value={passcodeVal}
                  onChange={e => setPasscodeVal(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleVerifyOrSetPasscode() }}
                />
              </div>

              {!adminPasscodeHash && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm Passcode</label>
                  <input
                    type="password"
                    placeholder="Confirm passcode"
                    value={passcodeConfirmVal}
                    onChange={e => setPasscodeConfirmVal(e.target.value)}
                    className="form-input"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyOrSetPasscode() }}
                  />
                </div>
              )}

              {passcodeError && (
                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>{passcodeError}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setPasscodeModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Cancel</button>
              <button onClick={handleVerifyOrSetPasscode} className="btn btn-primary" style={{ flex: 2, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                {!adminPasscodeHash ? 'Set Passcode' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Passcode Modal */}
      {changePasscodeModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '340px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Change Passcode</h4>
              <button onClick={() => setChangePasscodeModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Current Passcode</label>
                <input
                  type="password"
                  placeholder="Enter current passcode"
                  value={currentPasscodeVal}
                  onChange={e => setCurrentPasscodeVal(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleChangePasscode() }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>New Passcode</label>
                <input
                  type="password"
                  placeholder="Enter new passcode"
                  value={newPasscodeVal}
                  onChange={e => setNewPasscodeVal(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleChangePasscode() }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Confirm New Passcode</label>
                <input
                  type="password"
                  placeholder="Confirm new passcode"
                  value={newPasscodeConfirmVal}
                  onChange={e => setNewPasscodeConfirmVal(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleChangePasscode() }}
                />
              </div>

              {changeError && (
                <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 600 }}>{changeError}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button onClick={() => setChangePasscodeModalOpen(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>Cancel</button>
              <button onClick={handleChangePasscode} className="btn btn-primary" style={{ flex: 2, padding: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>Update Passcode</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default InputForm

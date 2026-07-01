import React, { useState } from 'react'
import type { MetricItem } from '../../types/dashboard'
import { RotateCcw, HelpCircle, Sun, Moon, Save, CheckCircle, AlertCircle, Loader, Edit2, Trash2, Plus, X } from 'lucide-react'

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
}) => {
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

  const handleInputChange = (id: string, value: string) => {
    // Strip any non-digit characters, parse strictly, clamp to >= 0
    const stripped = value.replace(/[^0-9]/g, '')
    const numValue = stripped === '' ? 0 : Math.max(0, parseInt(stripped, 10))
    onChange(metrics.map(m => {
      if (m.id === id) {
        return { ...m, value: numValue }
      }
      return m
    }))
  }

  // Block non-numeric key presses (allow: digits, Backspace, Delete, Tab, arrows, Home, End)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Home', 'End',
    ]
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault()
    }
  }

  // Block paste of non-numeric content
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
    setEditTarget(String(m.target || ''))
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
          target: m.type === 'leading' ? (parseInt(editTarget, 10) || 100) : undefined,
          color: editColor || undefined
        }
      }
      return m
    }))
    setEditingMetric(null)
  }

  const handleDelete = (id: string) => {
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
      target: type === 'leading' ? (parseInt(newTarget, 10) || 100) : undefined,
      color: newColor,
      isCustom: true,
      isActive: true
    }
    onChange([...metrics, newItem])
    // Reset inputs
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
        />
        {/* Metric Settings Actions */}
        {m.id !== 'totalManHours' && (
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
              onClick={() => handleDelete(m.id)}
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

      {/* Action Buttons: Reset + Save */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          id="btn-preset-sample"
          className="btn btn-secondary"
          onClick={zeroAllInputs}
          title="Set all safety metrics inputs to zero"
          style={{ fontSize: '0.72rem', padding: '0.45rem 0.65rem', flex: 1, whiteSpace: 'nowrap' }}
        >
          <RotateCcw size={11} /> Reset
        </button>

        {onSave && (
          <button
            id="btn-save-metrics"
            onClick={onSave}
            disabled={isSaving}
            title="Save metrics to database — all connected devices will update"
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
              cursor: isSaving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              background:
                saveStatus === 'saved' ? 'rgba(16,185,129,0.15)' :
                saveStatus === 'error'  ? 'rgba(239,68,68,0.15)'  :
                'linear-gradient(135deg, var(--color-primary), #6366f1)',
              color:
                saveStatus === 'saved' ? '#10b981' :
                saveStatus === 'error'  ? '#ef4444'  :
                '#ffffff',
              opacity: isSaving ? 0.7 : 1,
              boxShadow: saveStatus === 'idle' ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
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
        {addingType === 'lagging' ? (
          <div className="glass-panel" style={{ padding: '0.85rem', border: '1px dashed var(--border-color)', background: 'var(--bg-input)', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderRadius: 'var(--radius-md)', margin: '0.4rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Add Lagging Incident</span>
              <button onClick={() => setAddingType(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={12} /></button>
            </div>
            <input type="text" placeholder="Name e.g. Near Misses" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
            <input type="text" placeholder="Description e.g. Near misses logged" value={newInfo} onChange={e => setNewInfo(e.target.value)} className="form-input" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} />
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
        {addingType === 'leading' ? (
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
        )}

        {/* Restore hidden default fields if any exist */}
        {inactiveStandardMetrics.length > 0 && (
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
            onClick={() => onFormulaToggle(false)}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: !useExcelFormula ? 'var(--bg-panel)' : 'transparent',
              color: !useExcelFormula ? 'var(--color-success)' : 'var(--text-secondary)',
              boxShadow: !useExcelFormula ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            Closed / Obs
          </button>
          <button
            id="btn-formula-excel"
            onClick={() => onFormulaToggle(true)}
            style={{
              flex: 1,
              padding: '0.35rem',
              fontSize: '0.7rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: useExcelFormula ? 'var(--bg-panel)' : 'transparent',
              color: useExcelFormula ? 'var(--color-warning)' : 'var(--text-secondary)',
              boxShadow: useExcelFormula ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            Obs / Closed
          </button>
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

            {editingMetric.type === 'leading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Target Value</label>
                <input type="number" min="1" value={editTarget} onChange={e => setEditTarget(e.target.value)} className="form-input" style={{ fontSize: '0.82rem', padding: '0.45rem 0.65rem' }} />
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
    </div>
  )
}
export default InputForm

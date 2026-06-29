import React from 'react'
import type { SafetyData } from '../../types/dashboard'
import { RotateCcw, HelpCircle, Sun, Moon } from 'lucide-react'

interface InputFormProps {
  data: SafetyData
  onChange: (newData: SafetyData) => void
  useExcelFormula: boolean
  onFormulaToggle: (val: boolean) => void
  theme?: 'light' | 'dark'
  onThemeToggle?: () => void
}

export const InputForm: React.FC<InputFormProps> = ({
  data,
  onChange,
  useExcelFormula,
  onFormulaToggle,
  theme = 'dark',
  onThemeToggle,
}) => {
  const handleInputChange = (field: keyof SafetyData, value: string) => {
    // Parse to positive number, default to 0 if invalid
    const numValue = Math.max(0, parseInt(value, 10) || 0)
    onChange({
      ...data,
      [field]: numValue,
    })
  }

  const zeroAllInputs = () => {
    onChange({
      totalManHours: 0,
      lti: 0,
      rwc: 0,
      mtc: 0,
      fac: 0,
      observations: 0,
      hazardsClosed: 0,
      auditsPlanned: 0,
      auditsCompleted: 0,
    })
  }

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

      {/* Preset Buttons */}
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
        {/* Total Man-Hours */}
        <div className="form-group">
          <label className="form-label" htmlFor="totalManHours">
            Total Man-Hours Worked
            <span className="form-label-info">Staff & Contractors</span>
          </label>
          <input
            id="totalManHours"
            type="number"
            className="form-input"
            value={data.totalManHours || ''}
            onChange={(e) => handleInputChange('totalManHours', e.target.value)}
            placeholder="e.g. 1200000"
          />
        </div>

        {/* LTI */}
        <div className="form-group">
          <label className="form-label" htmlFor="lti">
            Lost Time Injuries (LTI)
            <span className="form-label-info">Lost workdays</span>
          </label>
          <input
            id="lti"
            type="number"
            className="form-input"
            value={data.lti || ''}
            onChange={(e) => handleInputChange('lti', e.target.value)}
            placeholder="e.g. 1"
          />
        </div>

        {/* RWC */}
        <div className="form-group">
          <label className="form-label" htmlFor="rwc">
            Restricted Work Cases (RWC)
            <span className="form-label-info">Restricted duties</span>
          </label>
          <input
            id="rwc"
            type="number"
            className="form-input"
            value={data.rwc || ''}
            onChange={(e) => handleInputChange('rwc', e.target.value)}
            placeholder="e.g. 2"
          />
        </div>

        {/* MTC */}
        <div className="form-group">
          <label className="form-label" htmlFor="mtc">
            Medical Treatment Cases (MTC)
            <span className="form-label-info">Beyond first aid</span>
          </label>
          <input
            id="mtc"
            type="number"
            className="form-input"
            value={data.mtc || ''}
            onChange={(e) => handleInputChange('mtc', e.target.value)}
            placeholder="e.g. 3"
          />
        </div>

        {/* FAC */}
        <div className="form-group">
          <label className="form-label" htmlFor="fac">
            First Aid Cases (FAC)
            <span className="form-label-info">Minor site treatment</span>
          </label>
          <input
            id="fac"
            type="number"
            className="form-input"
            value={data.fac || ''}
            onChange={(e) => handleInputChange('fac', e.target.value)}
            placeholder="e.g. 14"
          />
        </div>

        {/* Safety Observations */}
        <div className="form-group">
          <label className="form-label" htmlFor="observations">
            Safety Observations Logged
            <span className="form-label-info">Hazard cards logged</span>
          </label>
          <input
            id="observations"
            type="number"
            className="form-input"
            value={data.observations || ''}
            onChange={(e) => handleInputChange('observations', e.target.value)}
            placeholder="e.g. 420"
          />
        </div>

        {/* Hazards Closed Within SLA */}
        <div className="form-group">
          <label className="form-label" htmlFor="hazardsClosed">
            Hazards Closed Within SLA
            <span className="form-label-info">Closed inside SLA window</span>
          </label>
          <input
            id="hazardsClosed"
            type="number"
            className="form-input"
            value={data.hazardsClosed || ''}
            onChange={(e) => handleInputChange('hazardsClosed', e.target.value)}
            placeholder="e.g. 385"
          />
        </div>

        {/* Safety Audits Planned */}
        <div className="form-group">
          <label className="form-label" htmlFor="auditsPlanned">
            Total Safety Audits Planned
            <span className="form-label-info">Scheduled audits</span>
          </label>
          <input
            id="auditsPlanned"
            type="number"
            className="form-input"
            value={data.auditsPlanned || ''}
            onChange={(e) => handleInputChange('auditsPlanned', e.target.value)}
            placeholder="e.g. 24"
          />
        </div>

        {/* Safety Audits Completed */}
        <div className="form-group">
          <label className="form-label" htmlFor="auditsCompleted">
            Total Safety Audits Completed
            <span className="form-label-info">Completed & signed off</span>
          </label>
          <input
            id="auditsCompleted"
            type="number"
            className="form-input"
            value={data.auditsCompleted || ''}
            onChange={(e) => handleInputChange('auditsCompleted', e.target.value)}
            placeholder="e.g. 22"
          />
        </div>
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
    </div>
  )
}
export default InputForm

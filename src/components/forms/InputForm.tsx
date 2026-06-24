import React from 'react'
import type { SafetyData } from '../../types/dashboard'
import { RotateCcw, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react'

interface InputFormProps {
  data: SafetyData
  onChange: (newData: SafetyData) => void
  useExcelFormula: boolean
  onFormulaToggle: (val: boolean) => void
}

export const InputForm: React.FC<InputFormProps> = ({
  data,
  onChange,
  useExcelFormula,
  onFormulaToggle,
}) => {
  const handleInputChange = (field: keyof SafetyData, value: string) => {
    const numValue = Math.max(0, parseInt(value, 10) || 0)
    onChange({
      ...data,
      [field]: numValue,
    })
  }

  const handleStepChange = (field: keyof SafetyData, step: number) => {
    const currentValue = data[field] || 0
    const newValue = Math.max(0, currentValue + step)
    onChange({
      ...data,
      [field]: newValue,
    })
  }

  const loadPreset = (presetName: 'sample' | 'perfect' | 'high_risk') => {
    if (presetName === 'sample') {
      // PDF Baseline data (Mandaue Site baseline)
      onChange({
        safeWorkDays: 245,
        totalManHours: 1200000,
        lti: 0,
        rwc: 0,
        mtc: 0,
        fac: 14,
        observations: 420,
        ergoAssessed: 942,
        ergoTotal: 1000,
        cacrResolved: 70,
        cacrTotal: 80, // yields 87.5% Close-out rate
        trainingCompleted: 100,
        trainingTotal: 100,
        daysLost: 0,
      })
    } else if (presetName === 'perfect') {
      onChange({
        safeWorkDays: 365,
        totalManHours: 1500000,
        lti: 0,
        rwc: 0,
        mtc: 0,
        fac: 2,
        observations: 500,
        ergoAssessed: 1000,
        ergoTotal: 1000,
        cacrResolved: 60,
        cacrTotal: 60,
        trainingCompleted: 120,
        trainingTotal: 120,
        daysLost: 0,
      })
    } else if (presetName === 'high_risk') {
      onChange({
        safeWorkDays: 0,
        totalManHours: 800000,
        lti: 3,
        rwc: 2,
        mtc: 4,
        fac: 28,
        observations: 310,
        ergoAssessed: 820,
        ergoTotal: 1000,
        cacrResolved: 60,
        cacrTotal: 90,
        trainingCompleted: 80,
        trainingTotal: 100,
        daysLost: 45,
      })
    }
  }

  const renderInputField = (
    field: keyof SafetyData,
    label: string,
    subLabel: string,
    step: number = 1,
    placeholder: string = "0"
  ) => {
    return (
      <div className="form-group" key={field}>
        <label className="form-label" htmlFor={field}>
          {label}
          <span className="form-label-info">{subLabel}</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleStepChange(field, -step)}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              minWidth: '32px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            -
          </button>
          <input
            id={field}
            type="number"
            className="form-input"
            style={{ textAlign: 'center', height: '34px', padding: '0.25rem 0.5rem' }}
            value={data[field] ?? ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleStepChange(field, step)}
            style={{
              padding: '0.5rem 0.75rem',
              fontSize: '1rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              minWidth: '32px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none'
            }}
          >
            +
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        minHeight: 0,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          HSE Data Input Section
        </h3>
        <p
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            marginTop: '0.15rem',
            lineHeight: 1.3,
          }}
        >
          Adjust parameters to update the lobby TV dashboard in real-time.
        </p>
      </div>

      {/* Preset Buttons */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          id="btn-preset-sample"
          className="btn btn-secondary"
          onClick={() => loadPreset('sample')}
          title="Load metrics directly from the PDF blueprint sample"
          style={{ fontSize: '0.7rem', padding: '0.4rem 0.5rem', flex: 1, whiteSpace: 'nowrap' }}
        >
          <RotateCcw size={10} /> PDF Baseline
        </button>
        <button
          id="btn-preset-perfect"
          className="btn btn-secondary"
          onClick={() => loadPreset('perfect')}
          title="Load a high-performing zero-incident month"
          style={{ fontSize: '0.7rem', padding: '0.4rem 0.5rem', flex: 1, whiteSpace: 'nowrap' }}
        >
          <ShieldCheck size={10} style={{ color: 'var(--color-success)' }} /> Perfect
        </button>
        <button
          id="btn-preset-high-risk"
          className="btn btn-secondary"
          onClick={() => loadPreset('high_risk')}
          title="Load safety alert warning metrics"
          style={{ fontSize: '0.7rem', padding: '0.4rem 0.5rem', flex: 1, whiteSpace: 'nowrap' }}
        >
          <AlertTriangle size={10} style={{ color: 'var(--color-danger)' }} /> Alerts
        </button>
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid rgba(94, 124, 107, 0.08)' }} />

      {/* Fields Wrapper */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 290px)',
          paddingRight: '4px',
        }}
      >
        {renderInputField('safeWorkDays', 'Safe Work Days', 'Consecutive days', 1, '245')}
        {renderInputField('totalManHours', 'Total Exposure Hours', 'Staff man-hours', 10000, '1200000')}
        {renderInputField('lti', 'Lost Time Injuries (LTI)', 'Lost workdays count', 1, '0')}
        {renderInputField('rwc', 'Restricted Work Cases (RWC)', 'Restricted duties count', 1, '0')}
        {renderInputField('mtc', 'Medical Treatment Cases (MTC)', 'Medical care count', 1, '0')}
        {renderInputField('fac', 'First Aid Cases (FAC)', 'Minor treatment count', 1, '14')}
        {renderInputField('daysLost', 'Days Lost (Severity Index)', 'Injury days lost count', 1, '0')}
        {renderInputField('observations', 'Safety Observations', 'Near-misses logged', 5, '420')}

        <div style={{ padding: '0.25rem 0', borderTop: '1px dashed rgba(94, 124, 107, 0.1)' }} />

        {renderInputField('ergoAssessed', 'Ergo Assessed', 'Workstations assessed', 5, '942')}
        {renderInputField('ergoTotal', 'Ergo Total Floor', 'Total floor workstations', 10, '1000')}

        <div style={{ padding: '0.25rem 0', borderTop: '1px dashed rgba(94, 124, 107, 0.1)' }} />

        {renderInputField('cacrResolved', 'CACR Resolved', 'Resolved within target', 5, '70')}
        {renderInputField('cacrTotal', 'CACR Total Identified', 'Total identified actions', 5, '80')}

        <div style={{ padding: '0.25rem 0', borderTop: '1px dashed rgba(94, 124, 107, 0.1)' }} />

        {renderInputField('trainingCompleted', 'HSE Trained Staff', 'Trained employees', 5, '100')}
        {renderInputField('trainingTotal', 'HSE Total Staff', 'Total staff count', 5, '100')}
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid rgba(94, 124, 107, 0.08)' }} />

      {/* Formula Settings Panel */}
      <div
        style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: '0.6rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.4rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              CACR Formula Standard
            </span>
            <span
              title="Standard: Resolved/Total (87.5%). Excel: Total/Resolved (114.2%)."
              style={{ cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}
            >
              <HelpCircle size={11} />
            </span>
          </div>
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '0.1rem 0.3rem',
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
            borderRadius: '6px',
            alignItems: 'center' 
          }}
        >
          <button
            id="btn-formula-std"
            onClick={() => onFormulaToggle(false)}
            style={{
              flex: 1,
              padding: '0.3rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: !useExcelFormula ? 'var(--bg-panel)' : 'transparent',
              color: !useExcelFormula ? 'var(--color-success)' : 'var(--text-secondary)',
              boxShadow: !useExcelFormula ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            Resolved / Total
          </button>
          <button
            id="btn-formula-excel"
            onClick={() => onFormulaToggle(true)}
            style={{
              flex: 1,
              padding: '0.3rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              background: useExcelFormula ? 'var(--bg-panel)' : 'transparent',
              color: useExcelFormula ? 'var(--color-warning)' : 'var(--text-secondary)',
              boxShadow: useExcelFormula ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            Total / Resolved
          </button>
        </div>
      </div>
    </div>
  )
}
export default InputForm


import React from 'react'

interface KPICardProps {
  title: string
  value: string | number
  subValue?: string
  variant?: 'default' | 'bar' | 'line' | 'circle' | 'accent'
  badgeText?: string
  badgeColor?: 'success' | 'warning' | 'danger'
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subValue,
  variant = 'default',
  badgeText,
  badgeColor,
}) => {
  // Styles for pill badges (soft pastels matching the Carlos Brown / Joel Cannan badges)
  const getBadgeStyle = () => {
    if (!badgeColor) return {}
    const colors = {
      success: {
        bg: 'var(--color-success-bg)',
        text: 'var(--color-success)',
      },
      warning: {
        bg: 'var(--color-warning-bg)',
        text: 'var(--color-warning)',
      },
      danger: {
        bg: 'var(--color-danger-bg)',
        text: 'var(--color-danger)',
      },
    }
    return {
      backgroundColor: colors[badgeColor].bg,
      color: colors[badgeColor].text,
      padding: '0.2rem 0.5rem',
      borderRadius: '20px',
      fontSize: '0.7rem',
      fontWeight: 700,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.15rem',
    }
  }

  // Draw Inline SVGs for Sparklines/Decors
  const renderSparkline = () => {
    if (variant === 'bar') {
      return (
        <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 'auto' }}>
          <rect x="2" y="10" width="4" height="14" rx="2" fill="var(--color-primary)" opacity="0.35" />
          <rect x="10" y="4" width="4" height="20" rx="2" fill="var(--color-primary)" opacity="0.55" />
          <rect x="18" y="14" width="4" height="10" rx="2" fill="var(--color-primary)" opacity="0.75" />
          <rect x="26" y="8" width="4" height="16" rx="2" fill="var(--color-primary)" opacity="0.95" />
          <rect x="34" y="2" width="4" height="22" rx="2" fill="var(--color-primary)" />
        </svg>
      )
    }

    if (variant === 'line') {
      return (
        <svg width="55" height="24" viewBox="0 0 55 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 'auto' }}>
          <path
            d="M2 18C8 16 10 6 18 10C26 14 28 4 36 8C44 12 46 2 53 6"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    }

    if (variant === 'accent') {
      return (
        <svg width="55" height="24" viewBox="0 0 55 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: 'auto' }}>
          <path
            d="M2 14C8 16 10 4 18 8C26 12 28 2 36 6C44 10 46 4 53 2"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </svg>
      )
    }

    if (variant === 'circle') {
      return (
        <div
          style={{
            marginLeft: 'auto',
            width: '2.2rem',
            height: '2.2rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
      )
    }

    return null
  }

  const isAccent = variant === 'accent'

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        position: 'relative',
        overflow: 'hidden',
        background: isAccent ? 'var(--color-primary)' : 'var(--bg-panel)',
        color: isAccent ? '#ffffff' : 'var(--text-primary)',
        boxShadow: isAccent 
          ? '0 10px 25px rgba(94, 124, 107, 0.25)' 
          : 'var(--shadow-md)',
      }}
    >
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isAccent ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-secondary)',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </span>
        {renderSparkline()}
      </div>

      {/* Main Metric Value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.65rem',
          marginTop: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: isAccent ? '#ffffff' : 'var(--text-primary)',
          }}
        >
          {value}
        </span>
        {badgeText && (
          <span style={getBadgeStyle()}>{badgeText}</span>
        )}
      </div>

      {/* Sub Value Target / Info */}
      {subValue && (
        <div
          style={{
            fontSize: '0.72rem',
            color: isAccent ? 'rgba(255, 255, 255, 0.65)' : 'var(--text-muted)',
            marginTop: '0.65rem',
            paddingTop: '0.5rem',
            borderTop: isAccent ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.03)',
            fontWeight: 500,
          }}
        >
          {subValue}
        </div>
      )}
    </div>
  )
}
export default KPICard

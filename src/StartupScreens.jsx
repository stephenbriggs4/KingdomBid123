import React from 'react'

export function ConfigurationMissingScreen({ message }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '40px 20px', fontFamily: 'system-ui, sans-serif',
      background: '#faf7f0', color: '#1c2814',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Configuration missing</div>
      <div style={{ fontSize: 14, color: '#66716c', maxWidth: 480, lineHeight: 1.6 }}>{message}</div>
    </div>
  )
}

export function ProductionDevelopmentWarning() {
  return null
}

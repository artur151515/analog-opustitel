'use client'

import { memo } from 'react'

interface SimpleChartProps {
  symbol: string
  timeframe?: string
  className?: string
}

function SimpleChart({ 
  symbol, 
  timeframe = '5', 
  className = '' 
}: SimpleChartProps) {
  return (
    <div className={`simple-chart ${className}`} style={{ height: '100%', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
        border: '1px solid #374151',
        borderRadius: '8px',
        color: '#9CA3AF',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#E5E7EB' }}>
            Trading Chart
          </div>
          <div style={{ fontSize: '14px', marginBottom: '4px' }}>
            Symbol: {symbol}
          </div>
          <div style={{ fontSize: '14px', marginBottom: '16px' }}>
            Timeframe: {timeframe}m
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Chart placeholder - TradingView disabled for stability
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(SimpleChart)















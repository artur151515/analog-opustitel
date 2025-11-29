'use client'

import { memo, useState, useEffect } from 'react'

interface IframeTradingViewWidgetProps {
  symbol: string
  timeframe?: string
  className?: string
}

function IframeTradingViewWidget({ 
  symbol, 
  timeframe = '5', 
  className = '' 
}: IframeTradingViewWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const iframeUrl = `https://www.tradingview.com/chart/?symbol=FX%3A${symbol}&interval=${timeframe}&theme=dark&style=1&locale=en&enable_publishing=false&allow_symbol_change=true&save_image=false&studies=`

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setError('Failed to load TradingView chart')
    setIsLoading(false)
  }

  if (error) {
    return (
      <div className={`tradingview-widget-container ${className}`} style={{ height: '100%', width: '100%' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
          border: '1px solid #EF4444',
          borderRadius: '8px',
          color: '#FCA5A5',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#FCA5A5' }}>
              Chart Error
            </div>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`tradingview-widget-container ${className}`} style={{ height: '100%', width: '100%', position: 'relative' }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)',
          border: '1px solid #374151',
          borderRadius: '8px',
          color: '#9CA3AF',
          fontFamily: 'Inter, system-ui, sans-serif',
          zIndex: 10
        }}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: '#E5E7EB' }}>
              Loading TradingView Chart
            </div>
            <div style={{ fontSize: '14px', marginBottom: '4px' }}>
              Symbol: {symbol}
            </div>
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>
              Timeframe: {timeframe}m
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      )}
      
      <iframe
        src={iframeUrl}
        style={{
          width: '100%',
          height: 'calc(100% - 32px)',
          border: 'none',
          borderRadius: '8px'
        }}
        title={`TradingView Chart - ${symbol} ${timeframe}m`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
      
      <div className="tradingview-widget-copyright" style={{ padding: '8px', textAlign: 'center' }}>
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank" 
          style={{ color: '#3B82F6', textDecoration: 'none', fontSize: '12px' }}
        >
          Track all markets on TradingView
        </a>
      </div>
    </div>
  )
}

export default memo(IframeTradingViewWidget)















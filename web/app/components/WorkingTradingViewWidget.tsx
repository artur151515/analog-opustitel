'use client'

import { useEffect, useRef, memo, useState, useCallback } from 'react'

interface WorkingTradingViewWidgetProps {
  symbol: string
  timeframe?: string
  className?: string
}

function WorkingTradingViewWidget({ 
  symbol, 
  timeframe = '5', 
  className = '' 
}: WorkingTradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const widgetInstanceRef = useRef<any>(null)
  const scriptLoadedRef = useRef(false)

  const loadTradingViewScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Проверяем, загружен ли уже скрипт
      if (window.TradingView) {
        resolve()
        return
      }

      // Проверяем, есть ли уже скрипт в DOM
      const existingScript = document.querySelector('script[src*="embed-widget-advanced-chart.js"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', () => reject(new Error('Failed to load TradingView script')))
        return
      }

      // Создаем новый скрипт
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
      script.async = true
      script.crossOrigin = 'anonymous'
      
      script.onload = () => {
        scriptLoadedRef.current = true
        resolve()
      }
      
      script.onerror = () => {
        reject(new Error('Failed to load TradingView script'))
      }
      
      document.head.appendChild(script)
    })
  }, [])

  const createWidget = useCallback(async () => {
    if (!container.current) return

    try {
      setIsLoading(true)
      setError(null)

      // Очищаем контейнер
      if (container.current) {
        container.current.innerHTML = ''
      }

      // Проверяем, что контейнер все еще в DOM
      if (!container.current || !container.current.parentNode) {
        return
      }

      // Загружаем скрипт TradingView
      await loadTradingViewScript()

      // Проверяем, что TradingView доступен
      if (!window.TradingView) {
        throw new Error('TradingView library not available')
      }

      // Создаем уникальный ID для виджета
      const widgetId = `tradingview_${symbol}_${timeframe}_${Date.now()}`

      // Создаем контейнер для виджета
      const widgetContainer = document.createElement('div')
      widgetContainer.id = widgetId
      widgetContainer.style.width = '100%'
      widgetContainer.style.height = '100%'

      // Добавляем контейнер
      container.current.appendChild(widgetContainer)

      // Проверяем, что контейнер все еще существует
      if (!container.current || !container.current.parentNode || !widgetContainer.parentNode) {
        return
      }

      // Конфигурация виджета
      const config = {
        autosize: true,
        symbol: `FX:${symbol}`,
        interval: timeframe,
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        enable_publishing: false,
        allow_symbol_change: true,
        support_host: 'https://www.tradingview.com',
        backgroundColor: 'rgba(19, 23, 34, 1)',
        gridColor: 'rgba(42, 46, 57, 0.06)',
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        calendar: false,
        studies: [],
        container_id: widgetId,
      }

      // Создаем виджет
      widgetInstanceRef.current = new window.TradingView.widget(config)
      
      setIsLoading(false)
      setError(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating TradingView widget')
      setIsLoading(false)
      console.error('TradingView widget error:', err)
    }
  }, [symbol, timeframe, loadTradingViewScript])

  const cleanup = useCallback(() => {
    try {
      // Очищаем виджет, если он был создан
      if (widgetInstanceRef.current && typeof widgetInstanceRef.current.remove === 'function') {
        widgetInstanceRef.current.remove()
      }
      
      // Очищаем контейнер
      if (container.current) {
        container.current.innerHTML = ''
      }
      
      widgetInstanceRef.current = null
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }, [])

  useEffect(() => {
    createWidget()
    return cleanup
  }, [createWidget, cleanup])

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
              onClick={createWidget}
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
    <div className={`tradingview-widget-container ${className}`} style={{ height: '100%', width: '100%' }}>
      {isLoading && (
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
      <div ref={container} style={{ height: 'calc(100% - 32px)', width: '100%' }} />
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

// Добавляем типы для TradingView
declare global {
  interface Window {
    TradingView: any
  }
}

export default memo(WorkingTradingViewWidget)















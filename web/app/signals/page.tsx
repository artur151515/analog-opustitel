'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import SignalCard from '../components/SignalCard'
import Disclaimer from '../components/Disclaimer'
import TradingViewWidget from '../components/TradingViewWidget'
import SignalRecommendations from '../components/SignalRecommendations'
import { LanguageProvider, useLanguage, LanguageSwitcher } from '../components/LanguageSwitcher'
import { ChartBarIcon, ArrowLeftIcon, ArrowPathIcon, UserIcon } from '@heroicons/react/24/outline'

interface Signal {
  id: number
  symbol: string
  tf: string
  direction: 'UP' | 'DOWN'
  enter_at: string
  expire_at: string
  generated_at: string
  confidence?: number
}

interface Stats {
  symbol: string
  tf: string
  winrate_last_n: number
  n: number
  break_even_at: number
  signals_count: number
  wins: number
  losses: number
  skips: number
}

interface SymbolsResponse {
  symbols: string[]
  timeframes: string[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function SignalsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD')
  const [selectedTimeframe, setSelectedTimeframe] = useState(searchParams?.get('tf') || '5m')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isGeneratingSignal, setIsGeneratingSignal] = useState(false)
  const { t, language } = useLanguage()
  
  // Dynamic API URL based on current host
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      // Use current host for API calls (Nginx proxies /api/ to backend)
      return `${window.location.protocol}//${window.location.host}/api`
    }
    // Fallback for SSR
    return process.env.NEXT_PUBLIC_API_URL || 'https://visionoftrading.com/api'
  }
  
  const apiUrl = getApiUrl()
  console.log('API URL:', apiUrl)

  // Fetch available symbols and timeframes
  const { data: symbolsData } = useSWR<SymbolsResponse>(
    `${apiUrl}/symbols`,
    fetcher
  )

  // Fetch latest signal
  const { data: signal, error: signalError, mutate: mutateSignal } = useSWR<Signal>(
    selectedSymbol && selectedTimeframe
      ? `${apiUrl}/signal?symbol=${selectedSymbol}&tf=${selectedTimeframe}`
      : null,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  )

  // Fetch statistics
  const { data: stats, error: statsError } = useSWR<Stats>(
    selectedSymbol && selectedTimeframe
      ? `${apiUrl}/stats?symbol=${selectedSymbol}&tf=${selectedTimeframe}`
      : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  )

  // Check authorization
  useEffect(() => {
    const checkAuth = async () => {
      // Check if admin mode is enabled
      const isAdmin = localStorage.getItem('admin_mode') === 'true'
      
      if (isAdmin) {
        setIsAuthorized(true)
        setCheckingAuth(false)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        setCheckingAuth(false)
        router.push('/auth/login')
        return
      }

      try {
        const response = await fetch(`${apiUrl}/auth/can-access-signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.can_access) {
            setIsAuthorized(true)
          } else {
            setCheckingAuth(false)
            router.push('/dashboard')
          }
        } else {
          localStorage.removeItem('token')
          setCheckingAuth(false)
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setCheckingAuth(false)
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [])

  // Auto-refresh signal data
  useEffect(() => {
    const interval = setInterval(() => {
      mutateSignal()
    }, 5000)  // Changed from 10000 to 5000ms (5 seconds) for faster updates

    return () => clearInterval(interval)
  }, [mutateSignal])

  const symbols = symbolsData?.symbols || ['EURJPY', 'CADJPY', 'GBPJPY', 'EURUSD', 'GBPUSD']
  const timeframes = symbolsData?.timeframes || ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']

  const winratePercentage = stats ? (stats.winrate_last_n * 100).toFixed(1) : '0.0'
  const breakEvenPercentage = stats ? (stats.break_even_at * 100).toFixed(1) : '54.1'

  // Function to generate new signal
  const generateNewSignal = async () => {
    setIsGeneratingSignal(true)
    try {
      const response = await fetch(`${apiUrl}/signal/${selectedSymbol}/${selectedTimeframe}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        // Refresh the signal data
        mutateSignal()
        // Show success message
        console.log('New signal generated successfully!')
      } else {
        console.error('Failed to generate new signal')
      }
    } catch (error) {
      console.error('Error generating new signal:', error)
    } finally {
      setIsGeneratingSignal(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white font-light">{language === 'ru' ? 'Проверка доступа...' : 'Checking access...'}</div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <LanguageSwitcher />
      {/* Header */}
      <header className="header-modern">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="btn-secondary px-4 py-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="ml-2">{t('back')}</span>
              </button>
            </div>
            <div className="flex-shrink-0 text-center absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                📈 Vision of Trading
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-secondary px-4 py-2"
              >
                <UserIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => mutateSignal()}
                className="btn-secondary px-4 py-2"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowDisclaimer(true)}
                className="btn-secondary px-4 py-2"
              >
                <span className="text-sm">Disclaimer</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Symbol Selection */}
          <div className="card">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Trading Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="select"
            >
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="card">
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="select"
            >
              {timeframes.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TradingView Chart */}
        <div className="mb-8">
          <div className="tradingview-widget-container p-0 overflow-hidden" style={{ height: '500px' }}>
            <TradingViewWidget 
              symbol={selectedSymbol}
              timeframe={selectedTimeframe.replace('m', '')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signal Card */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {t('latest_signal')}
                </span>
              </h2>
              <button
                onClick={generateNewSignal}
                disabled={isGeneratingSignal}
                className="btn-primary"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isGeneratingSignal ? 'animate-spin' : ''}`} />
                <span className="ml-2">{isGeneratingSignal ? 'Generating...' : 'Get New Signal'}</span>
              </button>
            </div>
            <SignalCard 
              signal={signal || null} 
              isLoading={!signal && !signalError}
            />
            
            {signalError && (
              <div className="card border-danger-200 bg-danger-50">
                <p className="text-danger-800">
                  Failed to load signal data. Please try again.
                </p>
              </div>
            )}

            {/* Recommendations */}
            {signal && (
              <div className="mt-6">
                <SignalRecommendations signal={signal} />
              </div>
            )}
          </div>

        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {t('auto_refresh')} • {new Date().toLocaleTimeString()}
          </p>
        </div>
      </main>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <Disclaimer onClose={() => setShowDisclaimer(false)} />
      )}
    </div>
  )
}

export default function SignalsPage() {
  return (
    <LanguageProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Загрузка...</p>
          </div>
        </div>
      }>
        <SignalsPageContent />
      </Suspense>
    </LanguageProvider>
  )
}

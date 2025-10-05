'use client'

import { useState, useEffect } from 'react'
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
  const [selectedSymbol, setSelectedSymbol] = useState('CADJPY')
  const [selectedTimeframe, setSelectedTimeframe] = useState(searchParams?.get('tf') || '5m')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const { t, language } = useLanguage()
  
  // Dynamic API URL based on current host
  const getApiUrl = () => {
    if (typeof window !== 'undefined') {
      // Use current host for API calls
      return `${window.location.protocol}//${window.location.host}`
    }
    // Fallback for SSR
    return process.env.NEXT_PUBLIC_API_URL || 'http://144.124.233.176'
  }
  
  const apiUrl = getApiUrl()
  console.log('API URL:', apiUrl)

  // Fetch available symbols and timeframes
  const { data: symbolsData } = useSWR<SymbolsResponse>(
    `${apiUrl}/api/symbols`,
    fetcher
  )

  // Fetch latest signal
  const { data: signal, error: signalError, mutate: mutateSignal } = useSWR<Signal>(
    selectedSymbol && selectedTimeframe
      ? `${apiUrl}/api/signal?symbol=${selectedSymbol}&tf=${selectedTimeframe}`
      : null,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  )

  // Fetch statistics
  const { data: stats, error: statsError } = useSWR<Stats>(
    selectedSymbol && selectedTimeframe
      ? `${apiUrl}/api/stats?symbol=${selectedSymbol}&tf=${selectedTimeframe}`
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
        router.push('/auth/login')
        return
      }

      try {
        const response = await fetch(`${apiUrl}/api/auth/can-access-signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.can_access) {
            setIsAuthorized(true)
          } else {
            router.push('/dashboard')
          }
        } else {
          localStorage.removeItem('token')
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/auth/login')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [apiUrl, router])

  // Auto-refresh signal data
  useEffect(() => {
    const interval = setInterval(() => {
      mutateSignal()
    }, 5000)  // Changed from 10000 to 5000ms (5 seconds) for faster updates

    return () => clearInterval(interval)
  }, [mutateSignal])

  const symbols = symbolsData?.symbols || ['CADJPY', 'GBPJPY', 'EURUSD', 'GBPUSD']
  const timeframes = symbolsData?.timeframes || ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']

  const winratePercentage = stats ? (stats.winrate_last_n * 100).toFixed(1) : '0.0'
  const breakEvenPercentage = stats ? (stats.break_even_at * 100).toFixed(1) : '54.1'

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
      <header className="bg-[#0f1419] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span className="font-light text-sm">{t('back')}</span>
              </button>
            </div>
            <div className="flex-shrink-0 text-center absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-light text-white tracking-tight">
                Trade Vision
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="font-light text-sm">{language === 'ru' ? 'Профиль' : 'Profile'}</span>
              </button>
              <button
                onClick={() => mutateSignal()}
                className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4" />
                {t('refresh')}
              </button>
              <button
                onClick={() => setShowDisclaimer(true)}
                className="btn-secondary"
              >
                Disclaimer
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Symbol Selection */}
          <div className="bg-[#0f1419] rounded-lg border border-gray-800 p-5">
            <label className="block text-xs font-light text-gray-400 mb-2 uppercase tracking-wider">
              Trading Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="block w-full rounded-md border-gray-700 bg-[#1a1f2e] text-white shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:text-sm font-light"
            >
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selection */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
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
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-0 overflow-hidden" style={{ height: '500px' }}>
            <TradingViewWidget 
              symbol={selectedSymbol}
              timeframe={selectedTimeframe.replace('m', '')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signal Card */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">
              {t('latest_signal')}
            </h2>
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
      <SignalsPageContent />
    </LanguageProvider>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import SignalCard from '../components/SignalCard'
import Disclaimer from '../components/Disclaimer'
import SimpleChart from '../components/SimpleChart'
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
  timeframes: string[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function SignalsStablePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD')
  const [selectedTimeframe, setSelectedTimeframe] = useState(searchParams?.get('tf') || '5m')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const { t, language } = useLanguage()

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Проверяем localStorage для Pocket Option авторизации
        const pocketId = localStorage.getItem('pocket_option_id')
        const balance = localStorage.getItem('user_balance')
        const isVerified = localStorage.getItem('is_verified')
        const userTier = localStorage.getItem('user_tier')

        if (pocketId && balance && isVerified === 'true') {
          setIsAuthorized(true)
        } else {
          // Редирект на логин если не авторизован
          router.push('/pocket-option')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/pocket-option')
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // Получение сигнала
  const { data: signal, error: signalError, isLoading: signalLoading } = useSWR(
    isAuthorized ? `/api/signal?symbol=${selectedSymbol}&tf=${selectedTimeframe}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Обновление каждые 30 секунд
      revalidateOnFocus: true,
    }
  )

  // Получение статистики
  const { data: stats, error: statsError } = useSWR(
    isAuthorized ? `/api/stats?symbol=${selectedSymbol}&tf=${selectedTimeframe}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Обновление каждую минуту
    }
  )

  const getApiUrl = (path: string) => {
    return path
  }

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol)
  }

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe)
  }

  const handleBackToMain = () => {
    router.push('/')
  }

  const handleViewDashboard = () => {
    router.push('/dashboard')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Проверка авторизации...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">Перенаправление...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Header */}
      <div className="bg-[#0f1419] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToMain}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                title="На главную"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-light tracking-tight">Trading Signals</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={handleViewDashboard}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Symbol and Timeframe Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-400">Symbol:</span>
              <select
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EURUSD">EUR/USD</option>
                <option value="GBPUSD">GBP/USD</option>
                <option value="USDJPY">USD/JPY</option>
                <option value="AUDUSD">AUD/USD</option>
                <option value="USDCAD">USD/CAD</option>
                <option value="EURGBP">EUR/GBP</option>
                <option value="EURJPY">EUR/JPY</option>
                <option value="GBPJPY">GBP/JPY</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Timeframe:</span>
              <select
                value={selectedTimeframe}
                onChange={(e) => handleTimeframeChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Simple Chart */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-0 overflow-hidden" style={{ height: '500px' }}>
            <SimpleChart 
              symbol={selectedSymbol}
              timeframe={selectedTimeframe.replace('m', '')}
            />
          </div>
        </div>

        {/* Signal Card */}
        <div className="mb-8">
          {signalLoading && (
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-400">Загрузка сигнала...</p>
            </div>
          )}
          
          {signalError && (
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-8 text-center">
              <p className="text-red-400">Ошибка загрузки сигнала</p>
            </div>
          )}
          
          {signal && !signalLoading && (
            <SignalCard signal={signal} />
          )}
        </div>

        {/* Statistics */}
        {stats && (
          <div className="mb-8">
            <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-6">
              <h3 className="text-lg font-medium mb-4">Статистика</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.winrate_last_n}%</p>
                  <p className="text-gray-400">Win Rate (last {stats.n})</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{stats.signals_count}</p>
                  <p className="text-gray-400">Total Signals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.break_even_at}</p>
                  <p className="text-gray-400">Break Even At</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {signal && <SignalRecommendations signal={signal} />}

        {/* Disclaimer */}
        <div className="mt-8">
          <button
            onClick={() => setShowDisclaimer(true)}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Disclaimer
          </button>
        </div>

        {showDisclaimer && (
          <Disclaimer onClose={() => setShowDisclaimer(false)} />
        )}
      </div>
    </div>
  )
}

export default function SignalsStablePage() {
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
        <SignalsStablePageContent />
      </Suspense>
    </LanguageProvider>
  )
}

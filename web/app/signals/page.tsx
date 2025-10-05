'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import SignalCard from '../components/SignalCard'
import Disclaimer from '../components/Disclaimer'
import { ChartBarIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

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

export default function SignalsPage() {
  const searchParams = useSearchParams()
  const [selectedSymbol, setSelectedSymbol] = useState('CADJPY')
  const [selectedTimeframe, setSelectedTimeframe] = useState(searchParams?.get('tf') || '5m')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  
  // Debug API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
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

  // Auto-refresh signal data
  useEffect(() => {
    const interval = setInterval(() => {
      mutateSignal()
    }, 10000)

    return () => clearInterval(interval)
  }, [mutateSignal])

  const symbols = symbolsData?.symbols || ['CADJPY', 'GBPJPY', 'EURUSD', 'GBPUSD']
  const timeframes = symbolsData?.timeframes || ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d']

  const winratePercentage = stats ? (stats.winrate_last_n * 100).toFixed(1) : '0.0'
  const breakEvenPercentage = stats ? (stats.break_even_at * 100).toFixed(1) : '54.1'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Back
              </button>
              <h1 className="text-2xl font-bold text-gradient">
                Trading Signals
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => mutateSignal()}
                className="btn-secondary flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Symbol Selection */}
          <div className="card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Signal Card */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Latest Signal
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
          </div>

          {/* Statistics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Statistics
            </h2>
            
            {stats ? (
              <div className="space-y-4">
                {/* Winrate */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Winrate (Last {stats.n} signals)
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {winratePercentage}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stats.winrate_last_n >= stats.break_even_at
                          ? 'bg-success-500'
                          : 'bg-danger-500'
                      }`}
                      style={{ width: `${Math.min(stats.winrate_last_n * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Break-even at {breakEvenPercentage}%
                  </p>
                </div>

                {/* Performance Stats */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Performance Breakdown
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Signals:</span>
                      <span className="font-medium">{stats.signals_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-success-600">Wins:</span>
                      <span className="font-medium text-success-600">{stats.wins}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-danger-600">Losses:</span>
                      <span className="font-medium text-danger-600">{stats.losses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Skips:</span>
                      <span className="font-medium text-gray-600">{stats.skips}</span>
                    </div>
                  </div>
                </div>

                {/* TradingView Widget */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Live Chart
                  </h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500 text-sm">
                      TradingView widget would be embedded here
                    </p>
                  </div>
                </div>
              </div>
            ) : statsError ? (
              <div className="card border-danger-200 bg-danger-50">
                <p className="text-danger-800">
                  Failed to load statistics. Please try again.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Auto-refreshing every 10 seconds • Last update: {new Date().toLocaleTimeString()}
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

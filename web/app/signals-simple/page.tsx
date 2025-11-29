'use client'

import { useState, useEffect } from 'react'

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

export default function SimpleSignalsPage() {
  const [signal, setSignal] = useState<Signal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD')
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    // Проверяем авторизацию пользователя
    const checkAuthorization = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        window.location.href = '/pocket-option'
        return
      }

      try {
        const apiUrl = typeof window !== 'undefined' 
          ? `${window.location.protocol}//${window.location.host}/api`
          : 'https://visionoftrading.com/api'
        
        const response = await fetch(`${apiUrl}/auth/can-access-signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.can_access) {
            setIsAuthorized(true)
            setUserInfo({
              isVerified: data.is_verified,
              hasMinDeposit: data.has_min_deposit,
              balance: data.balance
            })
          } else {
            window.location.href = '/pocket-option'
          }
        } else {
          localStorage.removeItem('token')
          window.location.href = '/pocket-option'
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        window.location.href = '/pocket-option'
      }
    }

    checkAuthorization()
  }, [])

  useEffect(() => {
    if (!isAuthorized) return

    const fetchSignal = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/signal?symbol=${selectedSymbol}&tf=${selectedTimeframe}`)
        if (!response.ok) {
          throw new Error('Failed to fetch signal')
        }
        const data = await response.json()
        setSignal(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSignal()

  }, [isAuthorized, selectedSymbol, selectedTimeframe])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Загрузка...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Ошибка</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* User Info */}
        {userInfo && (
          <div className="bg-[#0f1419] rounded-lg p-4 mb-8 border border-gray-800">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Добро пожаловать!</h2>
                <p className="text-gray-400">ID: {userInfo.pocketId}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500">${userInfo.balance.toFixed(2)}</p>
                <p className="text-sm text-gray-400">Баланс</p>
              </div>
            </div>
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-8">Торговые сигналы</h1>
        
        {signal ? (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Последний сигнал</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Символ:</span>
                <span className="ml-2 font-semibold">{signal.symbol}</span>
              </div>
              <div>
                <span className="text-gray-400">Таймфрейм:</span>
                <span className="ml-2 font-semibold">{signal.tf}</span>
              </div>
              <div>
                <span className="text-gray-400">Направление:</span>
                <span className={`ml-2 font-semibold ${signal.direction === 'UP' ? 'text-green-500' : 'text-red-500'}`}>
                  {signal.direction === 'UP' ? 'ВВЕРХ' : 'ВНИЗ'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Вход:</span>
                <span className="ml-2 font-semibold">{new Date(signal.enter_at).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-300">Нет доступных сигналов</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">TradingView График</h2>
          <div className="h-96 bg-gray-700 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">График EURJPY 1h</p>
          </div>
        </div>
      </div>
    </div>
  )
}


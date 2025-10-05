'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUpIcon, ArrowDownIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

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

interface SignalCardProps {
  signal: Signal | null
  isLoading?: boolean
}

export default function SignalCard({ signal, isLoading }: SignalCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!signal) return

    const updateTimer = () => {
      const now = new Date()
      const expireAt = new Date(signal.expire_at)
      const enterAt = new Date(signal.enter_at)
      
      if (now >= expireAt) {
        setIsExpired(true)
        setTimeLeft('Expired')
        return
      }

      if (now < enterAt) {
        const timeToEnter = enterAt.getTime() - now.getTime()
        const minutes = Math.floor(timeToEnter / 60000)
        const seconds = Math.floor((timeToEnter % 60000) / 1000)
        setTimeLeft(`Starts in ${minutes}:${seconds.toString().padStart(2, '0')}`)
      } else {
        const timeToExpire = expireAt.getTime() - now.getTime()
        const minutes = Math.floor(timeToExpire / 60000)
        const seconds = Math.floor((timeToExpire % 60000) / 1000)
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')} left`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [signal])

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!signal) {
    return (
      <div className="card text-center">
        <div className="text-gray-500 mb-4">
          <ClockIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">No Active Signal</p>
          <p className="text-sm">Waiting for new trading opportunities...</p>
        </div>
      </div>
    )
  }

  const isUp = signal.direction === 'UP'
  const signalClass = isUp ? 'signal-up' : 'signal-down'
  const Icon = isUp ? ArrowUpIcon : ArrowDownIcon

  return (
    <div className={`card border-l-4 ${signalClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isUp ? 'bg-success-100' : 'bg-danger-100'}`}>
            <Icon className={`h-5 w-5 ${isUp ? 'text-success-600' : 'text-danger-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {signal.symbol} {signal.direction}
            </h3>
            <p className="text-sm text-gray-600">
              {signal.tf} • Generated {formatDistanceToNow(new Date(signal.generated_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        {signal.confidence && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Confidence</div>
            <div className="text-lg font-semibold text-gray-900">
              {Math.round(signal.confidence)}%
            </div>
          </div>
        )}
      </div>

      {/* Signal Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Enter Time</div>
          <div className="font-medium text-gray-900">
            {new Date(signal.enter_at).toLocaleTimeString()}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1">Expire Time</div>
          <div className="font-medium text-gray-900">
            {new Date(signal.expire_at).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <>
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600">Signal Expired</span>
            </>
          ) : (
            <>
              <ClockIcon className="h-5 w-5 text-primary-600" />
              <span className="text-gray-700 font-medium">{timeLeft}</span>
            </>
          )}
        </div>
        
        {!isExpired && (
          <div className="text-sm text-gray-600">
            {new Date(signal.enter_at) <= new Date() ? 'Active' : 'Pending'}
          </div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-gray-400' : 'bg-success-500 animate-pulse'}`}></div>
        <span className="text-sm text-gray-600">
          {isExpired ? 'Signal completed' : 'Signal active'}
        </span>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import Disclaimer from './components/Disclaimer'

const timeframes = [
  { id: '3m', name: '3 Minutes', description: 'Quick scalping signals' },
  { id: '5m', name: '5 Minutes', description: 'Popular timeframe' },
  { id: '7m', name: '7 Minutes', description: 'Custom strategy' },
]

const features = [
  {
    name: 'Real-time Signals',
    description: 'Get instant notifications when our algorithm detects high-probability setups',
    icon: ClockIcon,
  },
  {
    name: 'Professional Analytics',
    description: 'Comprehensive statistics and performance metrics for informed decisions',
    icon: ChartBarIcon,
  },
  {
    name: 'Secure & Reliable',
    description: 'Bank-grade security with HMAC verification and no-repaint guarantee',
    icon: ShieldCheckIcon,
  },
]

export default function HomePage() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">
                {process.env.NEXT_PUBLIC_APP_NAME || 'Opustoshitel TV'}
              </h1>
            </div>
            <Link
              href="/signals"
              className="btn-primary flex items-center gap-2"
            >
              View Signals
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Signals that lead to{' '}
            <span className="text-gradient">success</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional trading signals powered by advanced algorithms, 
            real-time market analysis, and comprehensive risk management.
          </p>
        </motion.div>

        {/* Timeframe Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {timeframes.map((timeframe, index) => (
            <Link
              key={timeframe.id}
              href={`/signals?tf=${timeframe.id}`}
              className="group"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="card hover:shadow-lg transition-shadow duration-300 group-hover:border-primary-300"
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {timeframe.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {timeframe.description}
                  </p>
                  <div className="inline-flex items-center text-primary-600 group-hover:text-primary-700">
                    Start Trading
                    <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                <feature.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.name}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to start trading?
            </h2>
            <p className="text-gray-600 mb-6">
              Join thousands of traders who trust our signals for their trading decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signals" className="btn-primary text-lg px-8 py-3">
                View Live Signals
              </Link>
              <button
                onClick={() => setShowDisclaimer(true)}
                className="btn-secondary text-lg px-8 py-3"
              >
                Learn More
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <Disclaimer onClose={() => setShowDisclaimer(false)} />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">
              {process.env.NEXT_PUBLIC_APP_NAME || 'Opustoshitel TV'}
            </h3>
            <p className="text-gray-400 mb-4">
              Professional trading signals and analytics
            </p>
            <div className="text-sm text-gray-500">
              <p>⚠️ 18+ Only | Not Financial Advice | Trading Involves Risk</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { LanguageProvider, useLanguage } from './components/LanguageSwitcher'
import Disclaimer from './components/Disclaimer'

const timeframes = [
  { id: '3m', name_ru: '3 Минуты', name_en: '3 Minutes', description_ru: 'Быстрые скальпинг сигналы', description_en: 'Quick scalping signals' },
  { id: '5m', name_ru: '5 Минут', name_en: '5 Minutes', description_ru: 'Популярный таймфрейм', description_en: 'Popular timeframe' },
  { id: '7m', name_ru: '7 Минут', name_en: '7 Minutes', description_ru: 'Кастомная стратегия', description_en: 'Custom strategy' },
]

const features = [
  {
    name_ru: 'Сигналы в реальном времени',
    name_en: 'Real-time Signals',
    description_ru: 'Получайте мгновенные уведомления когда наш алгоритм обнаруживает высоковероятные настройки',
    description_en: 'Get instant notifications when our algorithm detects high-probability setups',
    icon: ClockIcon,
  },
  {
    name_ru: 'Аналитика в реальном времени',
    name_en: 'Real-time Analytics',
    description_ru: 'Отслеживайте производительность ваших сигналов с детальной статистикой',
    description_en: 'Track your signal performance with detailed statistics',
    icon: ChartBarIcon,
  },
  {
    name_ru: 'Безопасность данных',
    name_en: 'Data Security',
    description_ru: 'Ваши данные защищены с помощью современного шифрования',
    description_en: 'Your data is protected with modern encryption',
    icon: ShieldCheckIcon,
  },
]

function HomePageContent() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const { language, t } = useLanguage()

  const getFeatureName = (feature: any) => {
    return language === 'ru' ? feature.name_ru : feature.name_en
  }

  const getFeatureDescription = (feature: any) => {
    return language === 'ru' ? feature.description_ru : feature.description_en
  }

  const getTimeframeName = (tf: any) => {
    return language === 'ru' ? tf.name_ru : tf.name_en
  }

  const getTimeframeDescription = (tf: any) => {
    return language === 'ru' ? tf.description_ru : tf.description_en
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'ru' ? 'Торговые сигналы' : 'Trading Signals'}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl"
            >
              {language === 'ru' ? 'Профессиональные торговые сигналы' : 'Professional Trading Signals'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto"
            >
              {language === 'ru' 
                ? 'Получайте точные торговые сигналы на основе алгоритмического анализа рынка в реальном времени'
                : 'Get accurate trading signals based on real-time algorithmic market analysis'
              }
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10"
            >
              <Link
                href="/signals?tf=3m"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-xl text-white bg-black hover:bg-gray-800 transition-colors"
              >
                {language === 'ru' ? 'Начать торговлю' : 'Start Trading'}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeframes Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {language === 'ru' ? 'Выберите таймфрейм' : 'Choose Timeframe'}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {language === 'ru' 
                ? 'Различные стратегии для разных стилей торговли'
                : 'Different strategies for different trading styles'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {timeframes.map((timeframe) => (
              <motion.div
                key={timeframe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {getTimeframeName(timeframe)}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {getTimeframeDescription(timeframe)}
                  </p>
                  <Link
                    href={`/signals?tf=${timeframe.id}`}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-black hover:bg-gray-800 transition-colors"
                  >
                    {language === 'ru' ? 'Просмотр сигналов' : 'View Signals'}
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {language === 'ru' ? 'Почему выбирают нас' : 'Why Choose Us'}
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              {language === 'ru' 
                ? 'Мы предоставляем лучшие торговые сигналы на рынке'
                : 'We provide the best trading signals in the market'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-black mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {getFeatureName(feature)}
                </h3>
                <p className="text-gray-600">
                  {getFeatureDescription(feature)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              {language === 'ru' ? 'Готовы начать?' : 'Ready to Start?'}
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              {language === 'ru' 
                ? 'Присоединяйтесь к тысячам трейдеров, которые уже используют наши сигналы'
                : 'Join thousands of traders already using our signals'
              }
            </p>
            <div className="mt-8">
              <Link
                href="/signals?tf=5m"
                className="inline-flex items-center px-8 py-4 border border-white text-lg font-medium rounded-xl text-black bg-white hover:bg-gray-100 transition-colors"
              >
                {language === 'ru' ? 'Попробовать бесплатно' : 'Try Free'}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              {language === 'ru' 
                ? '© 2024 Торговые сигналы. Все права защищены.'
                : '© 2024 Trading Signals. All rights reserved.'
              }
            </p>
            <button
              onClick={() => setShowDisclaimer(true)}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300 underline"
            >
              {language === 'ru' ? 'Отказ от ответственности' : 'Disclaimer'}
            </button>
          </div>
        </div>
      </footer>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <Disclaimer onClose={() => setShowDisclaimer(false)} />
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <HomePageContent />
    </LanguageProvider>
  )
}

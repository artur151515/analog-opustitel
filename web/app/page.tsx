'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon, ChartBarIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { LanguageProvider, useLanguage, LanguageSwitcher } from './components/LanguageSwitcher'
import Disclaimer from './components/Disclaimer'

const timeframes = [
  { id: '3m', name_ru: '3 Минуты', name_en: '3 Minutes', description_ru: 'Быстрые скальпинг сигналы', description_en: 'Quick scalping signals' },
  { id: '5m', name_ru: '5 Минут', name_en: '5 Minutes', description_ru: 'Популярный таймфрейм', description_en: 'Popular timeframe' },
  { id: '7m', name_ru: '7 Минут', name_en: '7 Minutes', description_ru: 'Кастомная стратегия', description_en: 'Custom strategy' },
]

const features = [
  {
    name_ru: 'Скорость',
    name_en: 'Speed',
    description_ru: 'Мгновенные сигналы без задержек, чтобы вы действовали первыми и не упускали прибыльные возможности',
    description_en: 'Instant signals without delays so you act first and never miss profitable opportunities',
    icon: ClockIcon,
  },
  {
    name_ru: 'Надёжность',
    name_en: 'Reliability',
    description_ru: 'Алгоритмический анализ на основе проверенных стратегий и машинного обучения для точных прогнозов',
    description_en: 'Algorithmic analysis based on proven strategies and machine learning for accurate predictions',
    icon: ChartBarIcon,
  },
  {
    name_ru: 'Поддержка 24/7',
    name_en: '24/7 Support',
    description_ru: 'Круглосуточная техническая поддержка и мониторинг системы для бесперебойной работы',
    description_en: '24/7 technical support and system monitoring for uninterrupted operation',
    icon: ShieldCheckIcon,
  },
]

function HomePageContent() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const { language, t } = useLanguage()

  // Check if admin mode is enabled for direct signal access
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_mode') === 'true'

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
    <div className="min-h-screen bg-[#0a0e1a]">
      <LanguageSwitcher />
      {/* Header */}
      <header className="header-modern">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-6">
            <div className="flex-1"></div>
            <div className="flex-shrink-0 text-center">
              <h1 className="text-3xl font-bold text-white tracking-tight bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                📈 Vision of Trading
              </h1>
            </div>
            <div className="flex-1"></div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-bold text-white sm:text-7xl md:text-8xl tracking-tight mb-8"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                {language === 'ru' ? 'Профессиональные торговые сигналы' : 'Professional Trading Signals'}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed"
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
              className="mt-12"
            >
              <Link
                href={isAdmin ? "/signals?tf=3m" : "/pocket-option"}
                className="btn-primary text-lg px-10 py-4 shadow-glow hover:shadow-glow"
              >
                {language === 'ru' ? 'Начать торговлю' : 'Start Trading'}
                <ArrowRightIcon className="ml-3 h-6 w-6" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeframes Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'ru' ? 'Выберите таймфрейм' : 'Choose Timeframe'}
              </span>
            </h2>
            <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto">
              {language === 'ru' 
                ? 'Различные стратегии для разных стилей торговли'
                : 'Different strategies for different trading styles'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {timeframes.map((timeframe, index) => (
              <motion.div
                key={timeframe.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="timeframe-card group"
              >
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                      <span className="text-2xl font-bold text-white">{timeframe.id}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {getTimeframeName(timeframe)}
                    </h3>
                    <p className="text-slate-300 text-lg leading-relaxed">
                      {getTimeframeDescription(timeframe)}
                    </p>
                  </div>
                  <Link
                    href={isAdmin ? `/signals?tf=${timeframe.id}` : "/pocket-option"}
                    className="btn-primary w-full group"
                  >
                    {language === 'ru' ? 'Просмотр сигналов' : 'View Signals'}
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-white tracking-tight mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                {language === 'ru' ? 'Почему выбирают нас?' : 'Why Choose Us?'}
              </span>
            </h2>
            <p className="text-xl text-slate-300 font-medium max-w-3xl mx-auto">
              {language === 'ru' 
                ? 'Передовые технологии и алгоритмический анализ для ваших успешных сделок'
                : 'Advanced technology and algorithmic analysis for your successful trades'
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card-hover text-center"
              >
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 mx-auto shadow-lg">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {getFeatureName(feature)}
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  {getFeatureDescription(feature)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent"></div>
        <div className="relative max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="glass-dark rounded-3xl p-12 md:p-16 text-center border-2 border-slate-700/50 shadow-2xl">
            <h2 className="text-5xl font-bold text-white tracking-tight mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {language === 'ru' ? 'Готовы начать?' : 'Ready to Start?'}
              </span>
            </h2>
            <p className="text-xl text-slate-300 font-medium mb-10 max-w-2xl mx-auto">
              {language === 'ru' 
                ? 'Присоединяйтесь к тысячам трейдеров, которые уже используют наши сигналы'
                : 'Join thousands of traders already using our signals'
              }
            </p>
            <div>
              <Link
                href="/auth/register"
                className="btn-primary text-lg px-10 py-4 shadow-glow"
              >
                {language === 'ru' ? 'Попробовать бесплатно' : 'Try Free'}
                <ArrowRightIcon className="ml-3 h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="text-center">
            <p className="text-slate-400 font-medium text-sm mb-4">
              {language === 'ru' 
                ? '© 2024 Vision of Trading. Все права защищены.'
                : '© 2024 Vision of Trading. All rights reserved.'
              }
            </p>
            <button
              onClick={() => setShowDisclaimer(true)}
              className="text-xs text-slate-500 hover:text-blue-400 underline font-medium transition-colors"
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

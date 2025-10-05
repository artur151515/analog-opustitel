'use client'

import React, { useState } from 'react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'

type Language = 'ru' | 'en'

interface Translations {
  [key: string]: {
    ru: string
    en: string
  }
}

const translations: Translations = {
  'latest_signal': {
    ru: 'Последний сигнал',
    en: 'Latest Signal'
  },
  'generated': {
    ru: 'Создан',
    en: 'Generated'
  },
  'enter_time': {
    ru: 'Время входа',
    en: 'Enter Time'
  },
  'expire_time': {
    ru: 'Время истечения',
    en: 'Expire Time'
  },
  'signal_active': {
    ru: 'Сигнал активен',
    en: 'Signal active'
  },
  'signal_expired': {
    ru: 'Сигнал истёк',
    en: 'Signal expired'
  },
  'signal_completed': {
    ru: 'Сигнал завершён',
    en: 'Signal completed'
  },
  'getting_signal': {
    ru: 'Получение сигнала...',
    en: 'Getting signal...'
  },
  'loading_data': {
    ru: '⏳ Загрузка данных',
    en: '⏳ Loading data'
  },
  'auto_refresh': {
    ru: 'Автообновление каждые 5 секунд • Последнее обновление',
    en: 'Auto-refreshing every 5 seconds • Last update'
  },
  'view_signals': {
    ru: 'Просмотр сигналов',
    en: 'View Signals'
  },
  'trading_signals': {
    ru: 'Торговые сигналы',
    en: 'Trading Signals'
  },
  'recommendations': {
    ru: 'Рекомендации по сигналу',
    en: 'Signal Recommendations'
  },
  'seasonal_factor': {
    ru: 'Сезонный фактор',
    en: 'Seasonal Factor'
  },
  'trade_entry': {
    ru: 'Открытие сделки',
    en: 'Trade Entry'
  },
  'capital_management': {
    ru: 'Управление капиталом',
    en: 'Capital Management'
  },
  'back': {
    ru: 'Назад',
    en: 'Back'
  },
  'refresh': {
    ru: 'Обновить',
    en: 'Refresh'
  },
  'disclaimer': {
    ru: 'Отказ от ответственности',
    en: 'Disclaimer'
  }
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

export const useLanguage = () => {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ru')

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage()
  const [isAdmin, setIsAdmin] = useState(false)

  const toggleAdmin = () => {
    setIsAdmin(!isAdmin)
    localStorage.setItem('admin_mode', (!isAdmin).toString())
  }

  // Check admin mode on mount
  React.useEffect(() => {
    const adminMode = localStorage.getItem('admin_mode') === 'true'
    setIsAdmin(adminMode)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {/* Admin Toggle */}
      <button
        onClick={toggleAdmin}
        className={`border rounded-lg p-2 transition-colors shadow-lg ${
          isAdmin 
            ? 'bg-red-600 border-red-500 hover:bg-red-700' 
            : 'bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-gray-50'
        }`}
        title={isAdmin ? 'Выйти из админ-режима' : 'Войти в админ-режим'}
      >
        <span className={`text-xs font-bold ${isAdmin ? 'text-white' : 'text-gray-800'}`}>
          {isAdmin ? 'ADMIN' : 'USER'}
        </span>
      </button>
      
      {/* Language Toggle */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-2">
        <div className="flex items-center gap-2">
          <GlobeAltIcon className="h-5 w-5 text-gray-600" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-gray-800 font-medium text-sm border-none outline-none cursor-pointer"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  )
}

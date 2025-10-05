'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage, LanguageProvider, LanguageSwitcher } from '../components/LanguageSwitcher'

const POCKET_OPTION_URL = 'https://u3.shortink.io/register?utm_campaign=826027&utm_source=affiliate&utm_medium=sr&a=p8pRB2PXJ6nXKA&ac=affiliatetesting&code=50START'

function DashboardPageContent() {
  const router = useRouter()
  const { language } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pocketOptionId, setPocketOptionId] = useState('')
  const [checkingBalance, setCheckingBalance] = useState(false)

  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_API_URL || 'http://144.124.233.176'

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        localStorage.removeItem('token')
        router.push('/auth/login')
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка загрузки данных' : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      })

      if (response.ok) {
        setShowChangePassword(false)
        setOldPassword('')
        setNewPassword('')
        alert(language === 'ru' ? 'Пароль успешно изменён' : 'Password changed successfully')
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка смены пароля' : 'Password change error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    }
  }

  const handleSubmitPocketId = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-pocket-option`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pocket_option_id: pocketOptionId })
      })

      if (response.ok) {
        fetchUserData()
        setPocketOptionId('')
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка привязки ID' : 'ID binding error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    }
  }

  const handleCheckBalance = async () => {
    setCheckingBalance(true)
    setError('')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${apiUrl}/api/auth/check-balance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.ok) {
        fetchUserData()
        if (data.has_min_deposit) {
          alert(language === 'ru' ? 'Баланс подтверждён! Переход к сигналам...' : 'Balance confirmed! Redirecting to signals...')
          router.push('/signals?tf=5m')
        } else {
          setError(language === 'ru' 
            ? `Недостаточно средств. Ваш баланс: $${data.balance}. Минимум: $${data.min_required}`
            : `Insufficient funds. Your balance: $${data.balance}. Minimum: $${data.min_required}`
          )
        }
      } else {
        setError(data.detail || (language === 'ru' ? 'Ошибка проверки баланса' : 'Balance check error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    } finally {
      setCheckingBalance(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="text-white font-light">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a]">
      <LanguageSwitcher />
      
      {/* Header */}
      <header className="bg-[#0f1419] border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-light text-white tracking-tight">
              Trade Vision
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-light text-sm transition-colors"
            >
              {language === 'ru' ? 'Выйти' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <h2 className="text-3xl font-light text-white tracking-tight mb-8">
          {language === 'ru' ? 'Личный кабинет' : 'Dashboard'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-light">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Info */}
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Информация' : 'Information'}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-xs font-light mb-1">Email</p>
                <p className="text-white font-light">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-light mb-1">Pocket Option ID</p>
                <p className="text-white font-light">{user?.pocket_option_id || (language === 'ru' ? 'Не привязан' : 'Not linked')}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-light mb-1">{language === 'ru' ? 'Баланс' : 'Balance'}</p>
                <p className="text-white font-light">${user?.balance || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-light mb-1">{language === 'ru' ? 'Статус' : 'Status'}</p>
                <p className={`font-light ${user?.has_min_deposit ? 'text-green-400' : 'text-yellow-400'}`}>
                  {user?.has_min_deposit 
                    ? (language === 'ru' ? 'Активен' : 'Active')
                    : (language === 'ru' ? 'Требуется депозит' : 'Deposit required')
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Действия' : 'Actions'}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-light text-sm transition-colors"
              >
                {language === 'ru' ? 'Сменить пароль' : 'Change Password'}
              </button>
              
              {user?.has_min_deposit && (
                <button
                  onClick={() => router.push('/signals?tf=5m')}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-light text-sm transition-colors"
                >
                  {language === 'ru' ? 'Перейти к сигналам' : 'Go to Signals'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        {showChangePassword && (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6 mb-8">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Смена пароля' : 'Change Password'}
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-light text-gray-400 mb-2">
                  {language === 'ru' ? 'Старый пароль' : 'Old Password'}
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-light text-gray-400 mb-2">
                  {language === 'ru' ? 'Новый пароль' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors"
              >
                {language === 'ru' ? 'Сменить' : 'Change'}
              </button>
            </form>
          </div>
        )}

        {/* Pocket Option Setup */}
        {!user?.pocket_option_id && (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6 mb-8">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Привязать Pocket Option' : 'Link Pocket Option'}
            </h3>
            <p className="text-gray-400 font-light text-sm mb-4">
              {language === 'ru' 
                ? 'Для доступа к сигналам необходимо зарегистрироваться на Pocket Option'
                : 'To access signals, you need to register on Pocket Option'
              }
            </p>
            <button
              onClick={() => window.open(POCKET_OPTION_URL, '_blank')}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-light mb-4 transition-colors"
            >
              {language === 'ru' ? 'Зарегистрироваться на Pocket Option' : 'Register on Pocket Option'}
            </button>
            <form onSubmit={handleSubmitPocketId}>
              <label className="block text-sm font-light text-gray-400 mb-2">
                {language === 'ru' ? 'Введите ваш Pocket Option ID' : 'Enter your Pocket Option ID'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pocketOptionId}
                  onChange={(e) => setPocketOptionId(e.target.value)}
                  required
                  placeholder="12345678"
                  className="flex-1 px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors"
                >
                  {language === 'ru' ? 'Привязать' : 'Link'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deposit Check */}
        {user?.pocket_option_id && !user?.has_min_deposit && (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Пополнение счёта' : 'Deposit'}
            </h3>
            <p className="text-gray-400 font-light text-sm mb-4">
              {language === 'ru' 
                ? 'Для доступа к сигналам необходимо внести минимум $200 на ваш счёт Pocket Option. После пополнения нажмите кнопку ниже.'
                : 'To access signals, deposit minimum $200 to your Pocket Option account. After depositing, click the button below.'
              }
            </p>
            <button
              onClick={handleCheckBalance}
              disabled={checkingBalance}
              className="w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {checkingBalance 
                ? (language === 'ru' ? 'Проверка...' : 'Checking...') 
                : (language === 'ru' ? 'Проверить баланс' : 'Check Balance')
              }
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <LanguageProvider>
      <DashboardPageContent />
    </LanguageProvider>
  )
}


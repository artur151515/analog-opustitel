'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage, LanguageProvider, LanguageSwitcher } from '../components/LanguageSwitcher'

const POCKET_OPTION_URL = 'https://pocket1.click/smart/nyOwXkCc8yHFkA?model=sr&promo=50START'

function DashboardPageContent() {
  const router = useRouter()
  const { language } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [accessStatus, setAccessStatus] = useState<any>(null)
  const [pocketOptionId, setPocketOptionId] = useState('')
  const [checkingBalance, setCheckingBalance] = useState(false)
  const [showPromoModal, setShowPromoModal] = useState(false)

  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/api`
    : process.env.NEXT_PUBLIC_API_URL || 'https://visionoftrading.com/api'

  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
        
        // Fetch access status
        const accessResponse = await fetch(`${apiUrl}/auth/can-access-signals`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (accessResponse.ok) {
          const accessData = await accessResponse.json()
          setAccessStatus(accessData)
          
          // If no deposit and verified, show promo modal
          if (data.is_verified && data.pocket_option_verified && !accessData.can_access) {
            setShowPromoModal(true)
          }
        }
      } else {
        localStorage.removeItem('token')
        router.push('/auth/login')
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка загрузки данных' : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [router, apiUrl, language])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleSubmitPocketId = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!pocketOptionId.trim()) {
      setError(language === 'ru' ? 'Введите Pocket Option ID' : 'Enter Pocket Option ID')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/auth/verify-pocket-option`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pocket_option_id: pocketOptionId.trim() })
      })

      if (response.ok) {
        setPocketOptionId('')
        await fetchUserData() // Refresh user data
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка верификации ID' : 'ID verification error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка сети' : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!oldPassword || !newPassword) {
      setError(language === 'ru' ? 'Заполните все поля' : 'Fill all fields')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      })

      if (response.ok) {
        setOldPassword('')
        setNewPassword('')
        setShowChangePassword(false)
        alert(language === 'ru' ? 'Пароль изменен' : 'Password changed')
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка' : 'Error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка сети' : 'Network error')
    }
  }

  const handleCheckBalance = async () => {
    if (!user?.pocket_option_id) return
    
    setCheckingBalance(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/pocket-option/check-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await fetchUserData()
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка проверки баланса' : 'Balance check error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка сети' : 'Network error')
    } finally {
      setCheckingBalance(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleRegisterPocketOption = () => {
    const token = localStorage.getItem('token')
    let userId = ''
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        userId = user?.id || ''
      } catch (e) {
        console.error('Error parsing token:', e)
      }
    }
    
    const refUrl = `${POCKET_OPTION_URL}&click_id=${userId}`
    window.open(refUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">{language === 'ru' ? 'Загрузка...' : 'Loading...'}</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">📊 {language === 'ru' ? 'Личный кабинет' : 'Dashboard'}</h1>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <button
                onClick={handleLogout}
                className="btn btn-secondary text-sm"
              >
                {language === 'ru' ? 'Выйти' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* User Info */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
          <h3 className="text-2xl font-semibold text-white mb-6">
            {language === 'ru' ? 'Информация' : 'Information'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Email</label>
              <div className="text-lg text-white bg-slate-900/50 px-4 py-3 rounded-lg">{user.email}</div>
            </div>
            
            <div>
              <label className="text-sm text-slate-400 block mb-2">
                {language === 'ru' ? 'Баланс' : 'Balance'}
              </label>
              <div className="text-lg text-white bg-slate-900/50 px-4 py-3 rounded-lg">
                ${user.pocket_option_balance || user.balance || 0}
              </div>
            </div>
            
            {user.pocket_option_id && (
              <div>
                <label className="text-sm text-slate-400 block mb-2">Pocket Option ID</label>
                <div className="text-lg text-white bg-slate-900/50 px-4 py-3 rounded-lg font-mono">{user.pocket_option_id}</div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
          <h3 className="text-2xl font-semibold text-white mb-6">
            {language === 'ru' ? 'Действия' : 'Actions'}
          </h3>
          
          <div className="space-y-4">
            {!showChangePassword ? (
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full md:w-auto btn btn-secondary"
              >
                {language === 'ru' ? 'Сменить пароль' : 'Change Password'}
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={language === 'ru' ? 'Старый пароль' : 'Old password'}
                    className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'ru' ? 'Новый пароль' : 'New password'}
                    className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex space-x-4">
                  <button type="submit" className="btn btn-primary">
                    {language === 'ru' ? 'Изменить' : 'Change'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false)
                      setOldPassword('')
                      setNewPassword('')
                      setError('')
                    }}
                    className="btn btn-secondary"
                  >
                    {language === 'ru' ? 'Отмена' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Pocket Option Setup */}
        {!user.pocket_option_verified && (
          <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 backdrop-blur-sm rounded-2xl border border-green-700/50 p-8 mb-8 shadow-2xl">
            <h3 className="text-2xl font-semibold text-white mb-4">
              {language === 'ru' ? 'Настройка Pocket Option' : 'Pocket Option Setup'}
            </h3>
            
            <p className="text-slate-300 mb-6">
              {language === 'ru' 
                ? 'Для получения доступа к сигналам необходимо зарегистрироваться на Pocket Option'
                : 'To get access to signals, you need to register on Pocket Option'}
            </p>
            
            <button
              onClick={handleRegisterPocketOption}
              className="w-full mb-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              {language === 'ru' ? 'Зарегистрироваться на Pocket Option' : 'Register on Pocket Option'}
            </button>
            
            <form onSubmit={handleSubmitPocketId} className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Pocket Option ID
                </label>
                <input
                  type="text"
                  value={pocketOptionId}
                  onChange={(e) => setPocketOptionId(e.target.value)}
                  placeholder={language === 'ru' ? 'Введите ваш Pocket Option ID' : 'Enter your Pocket Option ID'}
                  className="w-full px-4 py-3 bg-slate-900/50 text-white rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (language === 'ru' ? 'Проверка...' : 'Checking...') : (language === 'ru' ? 'Подтвердить ID' : 'Confirm ID')}
              </button>
            </form>
          </div>
        )}

        {/* Balance Check */}
        {user.pocket_option_verified && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
            <h3 className="text-2xl font-semibold text-white mb-4">
              {language === 'ru' ? 'Статус депозита' : 'Deposit Status'}
            </h3>
            
            <p className="text-slate-300 mb-4">
              {language === 'ru'
                ? 'Внесите минимальный депозит $10 для получения доступа к сигналам.'
                : 'Make a deposit of at least $10 to get access to signals.'}
            </p>
            
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <p className="text-yellow-300 text-sm">
                <strong>Pocket Option ID:</strong> {user.pocket_option_id}
              </p>
            </div>
            
            <button
              onClick={handleCheckBalance}
              disabled={checkingBalance}
              className="btn btn-primary w-full"
            >
              {checkingBalance ? (language === 'ru' ? 'Проверяем...' : 'Checking...') : (language === 'ru' ? 'Проверить баланс' : 'Check Balance')}
            </button>
          </div>
        )}

        {/* Access Status */}
        {accessStatus && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-2xl">
            <h3 className="text-2xl font-semibold text-white mb-6">
              {language === 'ru' ? 'Статус доступа' : 'Access Status'}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{language === 'ru' ? 'Email подтвержден' : 'Email Verified'}</span>
                <span className={accessStatus.is_verified ? 'text-green-400' : 'text-red-400'}>
                  {accessStatus.is_verified ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pocket Option ID</span>
                <span className={accessStatus.pocket_option_verified ? 'text-green-400' : 'text-red-400'}>
                  {accessStatus.pocket_option_verified ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{language === 'ru' ? 'Минимальный депозит' : 'Minimum Deposit'}</span>
                <span className={accessStatus.has_min_deposit ? 'text-green-400' : 'text-red-400'}>
                  {accessStatus.has_min_deposit ? '✓' : '✗'}
                </span>
              </div>
              
              {accessStatus.message && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-300 text-sm">{accessStatus.message}</p>
                </div>
              )}
              
              {accessStatus.can_access && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => router.push('/signals?tf=5m')}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-lg"
                  >
                    {language === 'ru' ? 'Перейти к сигналам' : 'Go to Signals'}
                  </button>
                </div>
              )}
              
              {!accessStatus.can_access && accessStatus.message && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-sm font-semibold mb-2">
                      {language === 'ru' ? 'Уровни доступа к сигналам:' : 'Signal access levels:'}
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li>• $10+ — {language === 'ru' ? '1 сигнал в день' : '1 signal per day'}</li>
                      <li>• $50+ — {language === 'ru' ? 'Безлимит (основные пары)' : 'Unlimited (major pairs)'}</li>
                      <li>• $150+ — {language === 'ru' ? 'Безлимит (все активы)' : 'Unlimited (all assets)'}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Promo Modal */}
        {showPromoModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/30 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <button
                onClick={() => setShowPromoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {language === 'ru' ? 'Добро пожаловать!' : 'Welcome!'}
                </h2>
                <p className="text-xl text-slate-300">
                  {language === 'ru' 
                    ? 'Для начала работы с торговыми сигналами необходимо пополнить ваш аккаунт'
                    : 'To start working with trading signals, you need to top up your account'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Level 1 */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-3">$10+</div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {language === 'ru' ? 'Базовый' : 'Basic'}
                    </h3>
                    <ul className="text-slate-300 space-y-1 text-sm">
                      <li>• {language === 'ru' ? '1 сигнал в день' : '1 signal per day'}</li>
                      <li>• {language === 'ru' ? 'Основные пары' : 'Major pairs'}</li>
                      <li>• {language === 'ru' ? 'Стандартные ТФ' : 'Standard TF'}</li>
                    </ul>
                  </div>
                </div>

                {/* Level 2 */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border-2 border-blue-500/50 p-6 hover:border-blue-400/70 transition-all transform scale-105">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-3">$50+</div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {language === 'ru' ? 'Расширенный' : 'Advanced'}
                    </h3>
                    <ul className="text-slate-200 space-y-1 text-sm">
                      <li>• {language === 'ru' ? 'Безлимит сигналов' : 'Unlimited signals'}</li>
                      <li>• {language === 'ru' ? 'Основные пары' : 'Major pairs'}</li>
                      <li>• {language === 'ru' ? 'Все таймфреймы' : 'All timeframes'}</li>
                    </ul>
                  </div>
                </div>

                {/* Level 3 */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 hover:border-amber-500/50 transition-all">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-amber-400 mb-3">$150+</div>
                    <h3 className="text-lg font-semibold text-white mb-3">
                      {language === 'ru' ? 'Премиум' : 'Premium'}
                    </h3>
                    <ul className="text-slate-300 space-y-1 text-sm">
                      <li>• {language === 'ru' ? 'Безлимит сигналов' : 'Unlimited signals'}</li>
                      <li>• {language === 'ru' ? 'Все активы (OTC)' : 'All assets (OTC)'}</li>
                      <li>• {language === 'ru' ? 'VIP поддержка' : 'VIP support'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  {language === 'ru' ? 'Понятно' : 'Got it'}
                </button>
              </div>
            </div>
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


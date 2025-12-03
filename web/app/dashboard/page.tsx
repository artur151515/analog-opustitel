'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage, LanguageProvider, LanguageSwitcher } from '../components/LanguageSwitcher'

const POCKET_OPTION_URL = 'https://trade-option.xyz/register?utm_campaign=54509&utm_source=affiliate&utm_medium=sr&a=oRKAuWfixoOAgt&ac=sasha_bb700&code=BB700'

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
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckBalance = async () => {
    if (!user?.pocket_option_id) return

    setCheckingBalance(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${apiUrl}/pocket-option/check-balance/${user.pocket_option_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchUserData() // Refresh user data
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка проверки баланса' : 'Balance check error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    } finally {
      setCheckingBalance(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${apiUrl}/auth/change-password`, {
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
                <p className="text-gray-400 text-xs font-light mb-1">{language === 'ru' ? 'Статус' : 'Status'}</p>
                <p className="font-light text-green-400">
                  {language === 'ru' ? 'Активен' : 'Active'}
                </p>
              </div>
              {user?.pocket_option_id && (
                <div>
                  <p className="text-gray-400 text-xs font-light mb-1">Pocket Option ID</p>
                  <p className="text-white font-light">{user.pocket_option_id}</p>
                </div>
              )}
              {accessStatus?.pocket_option_balance !== undefined && (
                <div>
                  <p className="text-gray-400 text-xs font-light mb-1">{language === 'ru' ? 'Баланс' : 'Balance'}</p>
                  <p className="text-white font-light">${accessStatus.pocket_option_balance}</p>
                </div>
              )}
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
        {!user?.pocket_option_verified && (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6 mb-8">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Настройка Pocket Option' : 'Pocket Option Setup'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <button
                  onClick={() => window.open(POCKET_OPTION_URL, '_blank')}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-light transition-colors mb-4"
                >
                  {language === 'ru' ? 'Зарегистрироваться на Pocket Option' : 'Register on Pocket Option'}
                </button>
              </div>
              
              <form onSubmit={handleSubmitPocketId} className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-400 mb-2">
                    {language === 'ru' ? 'Pocket Option ID' : 'Pocket Option ID'}
                  </label>
                  <input
                    type="text"
                    value={pocketOptionId}
                    onChange={(e) => setPocketOptionId(e.target.value)}
                    placeholder={language === 'ru' ? 'Введите ваш Pocket Option ID' : 'Enter your Pocket Option ID'}
                    required
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg font-light transition-colors"
                >
                  {loading ? (language === 'ru' ? 'Проверяем...' : 'Checking...') : (language === 'ru' ? 'Подтвердить ID' : 'Verify ID')}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Deposit Check */}
        {user?.pocket_option_verified && !user?.has_min_deposit && (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6 mb-8">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Проверка депозита' : 'Deposit Check'}
            </h3>
            
            <div className="space-y-4">
              <p className="text-gray-400 font-light text-sm">
                {language === 'ru' 
                  ? 'Пополните депозит на сумму не менее $10 для получения доступа к сигналам.'
                  : 'Make a deposit of at least $10 to get access to signals.'
                }
              </p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  <strong>Pocket Option ID:</strong> {user.pocket_option_id}
                </p>
              </div>
              
              <button
                onClick={handleCheckBalance}
                disabled={checkingBalance}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg font-light transition-colors"
              >
                {checkingBalance ? (language === 'ru' ? 'Проверяем...' : 'Checking...') : (language === 'ru' ? 'Проверить баланс' : 'Check Balance')}
              </button>
            </div>
          </div>
        )}

        {/* Access Status */}
        {accessStatus && (
          <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6 mb-8">
            <h3 className="text-lg font-light text-white mb-4">
              {language === 'ru' ? 'Статус доступа' : 'Access Status'}
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{language === 'ru' ? 'Email подтвержден' : 'Email Verified'}</span>
                <span className={accessStatus.is_verified ? 'text-green-400' : 'text-red-400'}>
                  {accessStatus.is_verified ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pocket Option ID</span>
                <span className={accessStatus.pocket_option_verified ? 'text-green-400' : 'text-red-400'}>
                  {accessStatus.pocket_option_verified ? '✓' : '✗'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">{language === 'ru' ? 'Минимальный депозит' : 'Minimum Deposit'}</span>
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
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => router.push('/signals?tf=5m')}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-light transition-colors"
                  >
                    {language === 'ru' ? 'Перейти к сигналам' : 'Go to Signals'}
                  </button>
                </div>
              )}
              
              {!accessStatus.can_access && accessStatus.message && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-sm font-light mb-2">
                      {language === 'ru' ? 'Уровни доступа к сигналам:' : 'Signal access levels:'}
                    </p>
                    <ul className="text-xs text-gray-300 space-y-1">
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-blue-500/30 p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <button
                onClick={() => setShowPromoModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
              
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Добро пожаловать!
                </h2>
                <p className="text-xl text-slate-300">
                  Для начала работы с торговыми сигналами необходимо пополнить ваш аккаунт
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Level 1 */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 hover:border-blue-500/50 transition-all">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400 mb-3">$10+</div>
                    <h3 className="text-lg font-semibold text-white mb-3">Базовый</h3>
                    <ul className="text-slate-300 space-y-1 text-sm">
                      <li>• 1 сигнал в день</li>
                      <li>• Основные пары</li>
                      <li>• Стандартные ТФ</li>
                    </ul>
                  </div>
                </div>

                {/* Level 2 */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border-2 border-blue-500/50 p-6 hover:border-blue-400/70 transition-all transform scale-105">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-3">$50+</div>
                    <h3 className="text-lg font-semibold text-white mb-3">Расширенный</h3>
                    <ul className="text-slate-200 space-y-1 text-sm">
                      <li>• Безлимит сигналов</li>
                      <li>• Основные пары</li>
                      <li>• Все таймфреймы</li>
                    </ul>
                  </div>
                </div>

                {/* Level 3 */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 hover:border-amber-500/50 transition-all">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-amber-400 mb-3">$150+</div>
                    <h3 className="text-lg font-semibold text-white mb-3">Премиум</h3>
                    <ul className="text-slate-300 space-y-1 text-sm">
                      <li>• Безлимит сигналов</li>
                      <li>• Все активы (OTC)</li>
                      <li>• VIP поддержка</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowPromoModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Понятно
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


'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage, LanguageProvider } from '../../components/LanguageSwitcher'

const POCKET_OPTION_URL = 'https://u3.shortink.io/register?utm_campaign=826027&utm_source=affiliate&utm_medium=sr&a=p8pRB2PXJ6nXKA&ac=affiliatetesting&code=50START'

function RegisterPageContent() {
  const router = useRouter()
  const { language, t } = useLanguage()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pocketOptionId, setPocketOptionId] = useState('')
  const [verificationToken, setVerificationToken] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : process.env.NEXT_PUBLIC_API_URL || 'http://144.124.233.176'

  // Auto-check verification status
  useEffect(() => {
    if (step === 2 && verificationToken) {
      const checkVerification = async () => {
        try {
          const response = await fetch(`${apiUrl}/api/auth/verify-email/${verificationToken}`, {
            method: 'POST'
          })
          
          if (response.ok) {
            setEmailVerified(true)
            setTimeout(() => {
              setStep(3)
            }, 2000)
          }
        } catch (error) {
          console.error('Verification check failed:', error)
        }
      }

      // Check every 3 seconds
      const interval = setInterval(checkVerification, 3000)
      
      // Also check immediately
      checkVerification()

      return () => clearInterval(interval)
    }
  }, [step, verificationToken, apiUrl])

  // Step 1: Email Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError(language === 'ru' ? 'Пароль должен быть минимум 6 символов' : 'Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationToken(data.verification_token)
        setStep(2)
      } else {
        setError(data.detail || (language === 'ru' ? 'Ошибка регистрации' : 'Registration error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify Email
  const handleVerifyEmail = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${apiUrl}/api/auth/verify-email/${verificationToken}`, {
        method: 'POST'
      })

      if (response.ok) {
        setStep(3)
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка подтверждения' : 'Verification error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Step 3: Open Pocket Option (automatic)
  const openPocketOption = () => {
    window.open(POCKET_OPTION_URL, '_blank')
    setStep(4)
  }

  // Step 4: Submit Pocket Option ID
  const handleSubmitPocketId = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // First login
      const loginResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      })

      if (!loginResponse.ok) {
        setError(language === 'ru' ? 'Ошибка входа' : 'Login error')
        return
      }

      const loginData = await loginResponse.json()
      const token = loginData.access_token

      // Then submit Pocket Option ID
      const response = await fetch(`${apiUrl}/api/auth/verify-pocket-option`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pocket_option_id: pocketOptionId })
      })

      if (response.ok) {
        localStorage.setItem('token', token)
        setStep(5)
      } else {
        const data = await response.json()
        setError(data.detail || (language === 'ru' ? 'Ошибка привязки ID' : 'ID binding error'))
      }
    } catch (err) {
      setError(language === 'ru' ? 'Ошибка соединения' : 'Connection error')
    } finally {
      setLoading(false)
    }
  }

  // Step 5: Check Balance
  const handleCheckBalance = async () => {
    setLoading(true)
    setError('')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${apiUrl}/api/auth/check-balance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        if (data.has_min_deposit) {
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white tracking-tight mb-2">
            Trade Vision
          </h1>
          <p className="text-gray-400 font-light text-sm">
            {language === 'ru' ? 'Регистрация' : 'Registration'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-light ${
                  step >= s ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {s}
                </div>
                {s < 5 && (
                  <div className={`w-12 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-700'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-light">
              {error}
            </div>
          )}

          {/* Step 1: Email Registration */}
          {step === 1 && (
            <form onSubmit={handleRegister}>
              <h2 className="text-xl font-light text-white mb-6">
                {language === 'ru' ? 'Создайте аккаунт' : 'Create Account'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-400 mb-2">
                    {language === 'ru' ? 'Email' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-400 mb-2">
                    {language === 'ru' ? 'Пароль' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-gray-400 mb-2">
                    {language === 'ru' ? 'Подтвердите пароль' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {loading ? (language === 'ru' ? 'Загрузка...' : 'Loading...') : (language === 'ru' ? 'Продолжить' : 'Continue')}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Verify Email */}
          {step === 2 && (
            <div className="text-center">
              <h2 className="text-xl font-light text-white mb-4">
                {language === 'ru' ? 'Подтвердите Email' : 'Verify Email'}
              </h2>
              <p className="text-gray-400 font-light text-sm mb-6">
                {language === 'ru' 
                  ? 'Проверьте почту и перейдите по ссылке подтверждения. После этого страница автоматически обновится.'
                  : 'Check your email and click the verification link. The page will update automatically.'
                }
              </p>
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gray-700 rounded-lg text-gray-300 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-3"></div>
                  {language === 'ru' ? 'Ожидание подтверждения...' : 'Waiting for verification...'}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Redirect to Pocket Option */}
          {step === 3 && (
            <div className="text-center">
              <h2 className="text-xl font-light text-white mb-4">
                {language === 'ru' ? 'Зарегистрируйтесь на Pocket Option' : 'Register on Pocket Option'}
              </h2>
              <p className="text-gray-400 font-light text-sm mb-6">
                {language === 'ru' 
                  ? 'Для доступа к сигналам необходимо зарегистрироваться на платформе Pocket Option'
                  : 'To access signals, you need to register on Pocket Option platform'
                }
              </p>
              <button
                onClick={openPocketOption}
                className="w-full py-3 bg-green-500 text-white rounded-lg font-light hover:bg-green-600 transition-colors"
              >
                {language === 'ru' ? 'Перейти к регистрации' : 'Go to Registration'}
              </button>
            </div>
          )}

          {/* Step 4: Enter Pocket Option ID */}
          {step === 4 && (
            <form onSubmit={handleSubmitPocketId}>
              <h2 className="text-xl font-light text-white mb-4">
                {language === 'ru' ? 'Введите ваш ID' : 'Enter your ID'}
              </h2>
              <p className="text-gray-400 font-light text-sm mb-6">
                {language === 'ru' 
                  ? 'После регистрации на Pocket Option, скопируйте ваш ID и вставьте его ниже'
                  : 'After registering on Pocket Option, copy your ID and paste it below'
                }
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-gray-400 mb-2">
                    Pocket Option ID
                  </label>
                  <input
                    type="text"
                    value={pocketOptionId}
                    onChange={(e) => setPocketOptionId(e.target.value)}
                    required
                    placeholder="12345678"
                    className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {loading ? (language === 'ru' ? 'Загрузка...' : 'Loading...') : (language === 'ru' ? 'Продолжить' : 'Continue')}
                </button>
              </div>
            </form>
          )}

          {/* Step 5: Check Balance */}
          {step === 5 && (
            <div className="text-center">
              <h2 className="text-xl font-light text-white mb-4">
                {language === 'ru' ? 'Пополните счёт' : 'Deposit Funds'}
              </h2>
              <p className="text-gray-400 font-light text-sm mb-6">
                {language === 'ru' 
                  ? 'Для доступа к сигналам необходимо внести минимум $200 на ваш счёт Pocket Option'
                  : 'To access signals, you need to deposit minimum $200 to your Pocket Option account'
                }
              </p>
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-light text-sm">
                  {language === 'ru' 
                    ? 'После пополнения нажмите кнопку "Проверить баланс"'
                    : 'After depositing, click "Check Balance" button'
                  }
                </p>
              </div>
              <button
                onClick={handleCheckBalance}
                disabled={loading}
                className="w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading ? (language === 'ru' ? 'Проверка...' : 'Checking...') : (language === 'ru' ? 'Проверить баланс' : 'Check Balance')}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 font-light text-sm">
            {language === 'ru' ? 'Уже есть аккаунт?' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-white hover:text-gray-300">
              {language === 'ru' ? 'Войти' : 'Sign In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <LanguageProvider>
      <RegisterPageContent />
    </LanguageProvider>
  )
}


'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage, LanguageProvider } from '../../components/LanguageSwitcher'

function VerifyEmailPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language } = useLanguage()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  const token = searchParams?.get('token')

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus('error')
      setMessage(language === 'ru' ? 'Токен подтверждения не найден' : 'Verification token not found')
    }
  }, [token, language])

  const verifyEmail = async (token: string) => {
    try {
      const apiUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : process.env.NEXT_PUBLIC_API_URL || 'http://144.124.233.176'

      const response = await fetch(`${apiUrl}/api/auth/verify-email/${token}`, {
        method: 'POST'
      })

      if (response.ok) {
        setStatus('success')
        setMessage(language === 'ru' ? 'Email успешно подтверждён!' : 'Email successfully verified!')
        
        // Redirect to registration page step 3 after 2 seconds
        setTimeout(() => {
          router.push('/auth/register?step=3')
        }, 2000)
      } else {
        const errorData = await response.json()
        setStatus('error')
        setMessage(errorData.detail || (language === 'ru' ? 'Ошибка подтверждения email' : 'Email verification error'))
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setStatus('error')
      setMessage(language === 'ru' ? 'Ошибка сети' : 'Network error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white tracking-tight mb-2">
            Trade Vision
          </h1>
          <p className="text-gray-400 font-light">
            {language === 'ru' ? 'Подтверждение Email' : 'Email Verification'}
          </p>
        </div>

        <div className="bg-[#0f1419] rounded-xl border border-gray-800 p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <h2 className="text-xl font-light text-white mb-2">
                {language === 'ru' ? 'Подтверждение...' : 'Verifying...'}
              </h2>
              <p className="text-gray-400 font-light text-sm">
                {language === 'ru' ? 'Пожалуйста, подождите' : 'Please wait'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-white mb-2">
                {language === 'ru' ? 'Успешно!' : 'Success!'}
              </h2>
              <p className="text-gray-400 font-light text-sm mb-6">
                {message}
              </p>
              <p className="text-gray-500 font-light text-xs">
                {language === 'ru' ? 'Перенаправление...' : 'Redirecting...'}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-light text-white mb-2">
                {language === 'ru' ? 'Ошибка' : 'Error'}
              </h2>
              <p className="text-gray-400 font-light text-sm mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  href="/auth/register"
                  className="block w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors"
                >
                  {language === 'ru' ? 'Вернуться к регистрации' : 'Back to Registration'}
                </Link>
                <Link
                  href="/"
                  className="block w-full py-3 border border-gray-600 text-gray-300 rounded-lg font-light hover:bg-gray-800 transition-colors"
                >
                  {language === 'ru' ? 'На главную' : 'Home'}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 font-light text-sm">
            {language === 'ru' ? 'Уже есть аккаунт?' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-white hover:underline">
              {language === 'ru' ? 'Войти' : 'Sign In'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <LanguageProvider>
      <VerifyEmailPageContent />
    </LanguageProvider>
  )
}

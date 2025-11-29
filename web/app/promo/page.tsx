'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function PromoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const apiUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}/api`
    : process.env.NEXT_PUBLIC_API_URL || 'https://visionoftrading.com/api'

  useEffect(() => {
    const fetchUser = async () => {
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
          
          // Check if user has deposit
          const accessResponse = await fetch(`${apiUrl}/auth/can-access-signals`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (accessResponse.ok) {
            const accessData = await accessResponse.json()
            
            // If user has access, redirect to signals
            if (accessData.can_access) {
              router.push('/signals')
              return
            }
          }
        } else {
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Error:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router, apiUrl])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Добро пожаловать!
          </h1>
          <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
            Для начала работы с торговыми сигналами необходимо пополнить ваш аккаунт
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-3xl border border-blue-500/30 p-12 mb-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Уровни доступа к сигналам
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Level 1 */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 hover:border-blue-500/50 transition-all">
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-400 mb-4">$10+</div>
                <h3 className="text-xl font-semibold text-white mb-4">Базовый доступ</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• 1 сигнал в день</li>
                  <li>• Основные валютные пары</li>
                  <li>• Стандартные таймфреймы</li>
                </ul>
              </div>
            </div>

            {/* Level 2 */}
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border-2 border-blue-500/50 p-8 hover:border-blue-400/70 transition-all transform scale-105">
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-400 mb-4">$50+</div>
                <h3 className="text-xl font-semibold text-white mb-4">Расширенный доступ</h3>
                <ul className="text-slate-200 space-y-2 text-sm">
                  <li>• Безлимит сигналов</li>
                  <li>• Основные валютные пары</li>
                  <li>• Все таймфреймы</li>
                  <li>• Приоритетная поддержка</li>
                </ul>
              </div>
            </div>

            {/* Level 3 */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 hover:border-amber-500/50 transition-all">
              <div className="text-center">
                <div className="text-5xl font-bold text-amber-400 mb-4">$150+</div>
                <h3 className="text-xl font-semibold text-white mb-4">Премиум доступ</h3>
                <ul className="text-slate-300 space-y-2 text-sm">
                  <li>• Безлимит сигналов</li>
                  <li>• Все активы (включая OTC)</li>
                  <li>• Эксклюзивные таймфреймы</li>
                  <li>• VIP поддержка</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Пополнить баланс
            <ArrowRightIcon className="ml-3 h-6 w-6" />
          </button>
          
          <p className="text-slate-400 text-sm">
            После пополнения баланса вы сможете получить доступ к торговым сигналам
          </p>
        </div>
      </div>
    </div>
  )
}




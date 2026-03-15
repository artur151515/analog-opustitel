'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { LanguageProvider, useLanguage, LanguageSwitcher } from './components/LanguageSwitcher'
import Disclaimer from './components/Disclaimer'

/* ── Decorative chart SVG left ─────────────────────────────── */
function ChartLeft() {
  return (
    <svg
      viewBox="0 0 320 560"
      className="absolute left-0 top-0 h-full w-auto pointer-events-none select-none"
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
    >
      {/* grid */}
      {[100, 200, 300, 400, 500].map(y => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} className="chart-bg-grid" />
      ))}
      {[80, 160, 240].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="560" className="chart-bg-grid" />
      ))}
      {/* main price line */}
      <polyline
        className="chart-bg-line"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,510 20,490 40,505 60,465 80,480 100,440 115,455 135,410 150,425 170,380 190,395 210,345 230,360 250,315 270,328 290,285 310,260 320,240"
      />
      {/* area fill */}
      <polygon
        points="0,510 20,490 40,505 60,465 80,480 100,440 115,455 135,410 150,425 170,380 190,395 210,345 230,360 250,315 270,328 290,285 310,260 320,240 320,560 0,560"
        fill="url(#chartGradLeft)"
        opacity="0.06"
      />
      {/* candle wicks */}
      {[
        [40,455,520], [80,430,490], [130,400,465], [180,365,410],
        [230,310,385], [275,270,340],
      ].map(([x, hi, lo], i) => (
        <line key={i} x1={x} y1={hi} x2={x} y2={lo} stroke="#00c49a" strokeWidth="2" opacity="0.15" />
      ))}
      {/* tick marks */}
      {[240, 315, 380, 440, 500].map((y, i) => (
        <text key={i} x="4" y={y + 4} fontSize="9" fill="#00c49a" opacity="0.25" fontFamily="monospace">
          {(1.1200 + i * 0.0050).toFixed(4)}
        </text>
      ))}
      <defs>
        <linearGradient id="chartGradLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c49a" />
          <stop offset="100%" stopColor="#00c49a" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Decorative chart SVG right ────────────────────────────── */
function ChartRight() {
  return (
    <svg
      viewBox="0 0 320 560"
      className="absolute right-0 top-0 h-full w-auto pointer-events-none select-none"
      preserveAspectRatio="xMaxYMid meet"
      aria-hidden="true"
    >
      {[100, 200, 300, 400, 500].map(y => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} className="chart-bg-grid" />
      ))}
      {[80, 160, 240].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="560" className="chart-bg-grid" />
      ))}
      <polyline
        className="chart-bg-line"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="0,280 20,295 40,270 55,285 75,250 95,268 115,238 135,255 155,225 175,240 195,210 215,228 235,195 255,215 275,185 295,175 320,158"
      />
      <polygon
        points="0,280 20,295 40,270 55,285 75,250 95,268 115,238 135,255 155,225 175,240 195,210 215,228 235,195 255,215 275,185 295,175 320,158 320,560 0,560"
        fill="url(#chartGradRight)"
        opacity="0.06"
      />
      {[
        [55,240,300], [115,220,260], [175,215,255], [235,180,225],
        [295,160,200],
      ].map(([x, hi, lo], i) => (
        <line key={i} x1={x} y1={hi} x2={x} y2={lo} stroke="#00c49a" strokeWidth="2" opacity="0.15" />
      ))}
      {[160, 210, 250, 280, 320].map((y, i) => (
        <text key={i} x="270" y={y + 4} fontSize="9" fill="#00c49a" opacity="0.25" fontFamily="monospace" textAnchor="end">
          {(1.0850 + i * 0.0060).toFixed(4)}
        </text>
      ))}
      <defs>
        <linearGradient id="chartGradRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c49a" />
          <stop offset="100%" stopColor="#00c49a" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ── Stats bar ──────────────────────────────────────────────── */
const stats = [
  { label_ru: 'Сигналов сегодня', label_en: 'Signals today', value: '48' },
  { label_ru: 'Точность', label_en: 'Accuracy',              value: '78.4%' },
  { label_ru: 'Активных трейдеров', label_en: 'Active traders', value: '1 240' },
  { label_ru: 'Инструментов', label_en: 'Instruments',        value: '12' },
]

const timeframes = [
  { id: '3m', label_ru: '3 мин', label_en: '3 min', desc_ru: 'Скальпинг', desc_en: 'Scalping' },
  { id: '5m', label_ru: '5 мин', label_en: '5 min', desc_ru: 'Оптимальный', desc_en: 'Optimal' },
  { id: '7m', label_ru: '7 мин', label_en: '7 min', desc_ru: 'Swing-вход', desc_en: 'Swing entry' },
]

function HomePageContent() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const { language } = useLanguage()
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_mode') === 'true'
  const ru = language === 'ru'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <LanguageSwitcher />

      {/* ── Header ── */}
      <header className="header-modern relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <polyline points="3,17 8,11 13,14 21,6" stroke="#020a08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text-bright)' }}>
                ProfitHunter
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="btn-secondary text-sm px-4 py-2">
                {ru ? 'Войти' : 'Sign In'}
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm px-4 py-2">
                {ru ? 'Начать' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '88vh', display: 'flex', alignItems: 'center' }}>
        {/* chart decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-72 opacity-60">
            <ChartLeft />
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-72 opacity-60">
            <ChartRight />
          </div>
        </div>

        {/* subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,196,154,0.06) 0%, transparent 70%)',
        }} />

        {/* horizontal scan line */}
        <div className="absolute w-full h-px" style={{ top: '42%', background: 'linear-gradient(90deg, transparent 0%, rgba(0,196,154,0.15) 30%, rgba(0,196,154,0.15) 70%, transparent 100%)' }} />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center w-full py-24">
          {/* label */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase"
            style={{ border: '1px solid var(--border-mid)', color: 'var(--accent)', background: 'var(--accent-dim)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            {ru ? 'Система сигналов активна' : 'Signal system live'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight mb-6"
            style={{ color: 'var(--text-bright)', lineHeight: 1.1 }}
          >
            {ru ? 'Торговые сигналы' : 'Trading Signals'}
            <br />
            <span style={{ color: 'var(--accent)', fontWeight: 300 }}>
              {ru ? 'в реальном времени' : 'in real time'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg mb-10 mx-auto max-w-2xl"
            style={{ color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.7 }}
          >
            {ru
              ? 'Алгоритмический анализ forex и бинарных опционов. Точные сигналы входа — без лишнего шума.'
              : 'Algorithmic analysis of forex and binary options. Precise entry signals — no noise.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              className="btn-primary text-base px-8 py-3 shadow-glow"
            >
              {ru ? 'Получить доступ' : 'Get Access'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary text-base px-8 py-3"
            >
              {ru ? 'Войти в кабинет' : 'Sign In'}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ borderTop: '1px solid var(--border-dim)', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mono text-2xl font-medium mb-1" style={{ color: 'var(--accent)' }}>{s.value}</div>
                <div className="text-xs tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
                  {ru ? s.label_ru : s.label_en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Timeframes ── */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-3" style={{ color: 'var(--text-bright)' }}>
              {ru ? 'Выберите таймфрейм' : 'Choose Timeframe'}
            </h2>
            <p className="text-base" style={{ color: 'var(--text-mid)', fontWeight: 300 }}>
              {ru ? 'Сигналы для любого стиля торговли' : 'Signals for any trading style'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {timeframes.map((tf, i) => (
              <motion.div
                key={tf.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="timeframe-card"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="mono text-3xl font-medium" style={{ color: 'var(--accent)' }}>
                    {tf.id.toUpperCase()}
                  </div>
                  <span className="text-xs uppercase tracking-widest px-2 py-1 rounded" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    {ru ? tf.desc_ru : tf.desc_en}
                  </span>
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-mid)', fontWeight: 300 }}>
                  {ru ? tf.label_ru : tf.label_en}
                </p>
                <Link
                  href={isAdmin ? `/signals?tf=${tf.id}` : '/pocket-option'}
                  className="btn-primary w-full text-sm py-2.5"
                >
                  {ru ? 'Смотреть сигналы' : 'View Signals'}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-16" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dim)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                title_ru: 'Скорость',
                title_en: 'Speed',
                desc_ru: 'Сигналы генерируются мгновенно — ты действуешь первым',
                desc_en: 'Signals generated instantly — you act first',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                  </svg>
                ),
                title_ru: 'Алгоритм',
                title_en: 'Algorithm',
                desc_ru: 'Технический анализ + ML паттерны для точных входов',
                desc_en: 'Technical analysis + ML patterns for precise entries',
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title_ru: 'Надёжность',
                title_en: 'Reliability',
                desc_ru: 'Мониторинг 24/7 и прозрачная статистика по каждому инструменту',
                desc_en: '24/7 monitoring and transparent stats per instrument',
              },
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border-mid)' }}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-base font-medium mb-1" style={{ color: 'var(--text-bright)' }}>
                    {ru ? f.title_ru : f.title_en}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-mid)', fontWeight: 300, lineHeight: 1.6 }}>
                    {ru ? f.desc_ru : f.desc_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <div className="rounded-2xl p-12" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}>
            <h2 className="text-3xl font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>
              {ru ? 'Готовы начать?' : 'Ready to start?'}
            </h2>
            <p className="text-base mb-8" style={{ color: 'var(--text-mid)', fontWeight: 300 }}>
              {ru
                ? 'Зарегистрируйтесь бесплатно и подключите аккаунт Pocket Option для доступа к сигналам'
                : 'Sign up free and connect your Pocket Option account to access signals'}
            </p>
            <Link href="/auth/register" className="btn-primary text-base px-10 py-3 shadow-glow">
              {ru ? 'Начать бесплатно' : 'Start Free'}
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--border-dim)', background: 'var(--bg-surface)' }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'var(--accent)' }}>
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
                <polyline points="3,17 8,11 13,14 21,6" stroke="#020a08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-mid)' }}>ProfitHunter</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2025 ProfitHunter. {ru ? 'Все права защищены.' : 'All rights reserved.'}
          </p>
          <button
            onClick={() => setShowDisclaimer(true)}
            className="text-xs underline transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {ru ? 'Отказ от ответственности' : 'Disclaimer'}
          </button>
        </div>
      </footer>

      {showDisclaimer && <Disclaimer onClose={() => setShowDisclaimer(false)} />}
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

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Проверяем, является ли это DOM ошибкой
    if (error.name === 'NotFoundError' && error.message.includes('removeChild')) {
      console.warn('DOM manipulation error caught, attempting recovery...')
      // Попытаемся очистить проблемные элементы
      setTimeout(() => {
        try {
          const problematicElements = document.querySelectorAll('.tradingview-widget-container')
          problematicElements.forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el)
            }
          })
        } catch (e) {
          console.error('Failed to clean up DOM elements:', e)
        }
      }, 100)
    }
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Что-то пошло не так
            </h1>
            <p className="text-gray-400 mb-6">
              Произошла ошибка при загрузке страницы
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

'use client'

export default function TestSignalsPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Test Signals Page</h1>
      <p className="text-gray-300 mb-4">Эта страница работает!</p>
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl mb-2">API Test</h2>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/signal?symbol=EURJPY&tf=1h')
              const data = await response.json()
              alert('API работает: ' + JSON.stringify(data))
            } catch (error) {
              alert('API ошибка: ' + error)
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded"
        >
          Тест API
        </button>
      </div>
    </div>
  )
}
















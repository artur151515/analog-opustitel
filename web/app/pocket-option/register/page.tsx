"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PocketOptionRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    setLoading(true);
    
    // Получаем user ID из токена если есть
    const token = localStorage.getItem('token');
    let userId = '';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub || '';
      } catch (e) {
        console.error('Error parsing token:', e);
      }
    }
    
    // Формируем URL с трекингом
    // Используем userId как click_id для связи постбеков
    const refUrl = `https://pocket1.click/smart/nyOwXkCc8yHFkA?model=sr&click_id=${userId}&promo=50START`;
    
    // Открываем Pocket Option в новом окне
    window.open(refUrl, "_blank");
    
    // Через некоторое время перенаправляем обратно
    setTimeout(() => {
      setLoading(false);
      router.push("/pocket-option");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold mb-6">Регистрация на Pocket Option</h1>
          
          <div className="mb-8">
            <div className="bg-blue-100 p-6 rounded-lg mb-6">
              <h2 className="text-xl font-semibold mb-4">Важно!</h2>
              <p className="text-blue-800 mb-4">
                Для получения доступа к сигналам необходимо зарегистрироваться на Pocket Option по нашей партнерской ссылке.
              </p>
              <p className="text-blue-800">
                После регистрации вернитесь на сайт и введите ваш Pocket Option ID.
              </p>
            </div>

            <div className="bg-green-100 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Преимущества регистрации:</h3>
              <ul className="text-green-800 text-left space-y-1">
                <li>• Доступ к торговым сигналам</li>
                <li>• Автоматическая проверка депозитов</li>
                <li>• Синхронизация данных с нашим сервисом</li>
                <li>• Поддержка 24/7</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg text-xl font-semibold mb-4"
          >
            {loading ? "Открываем Pocket Option..." : "Зарегистрироваться на Pocket Option"}
          </button>

          <p className="text-gray-600 text-sm">
            После регистрации не забудьте вернуться и ввести ваш Pocket Option ID
          </p>

          <div className="mt-8 pt-6 border-t">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Назад к настройкам
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}





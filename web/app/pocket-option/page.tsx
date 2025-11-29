"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://visionoftrading.com";

export default function PocketOptionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [accessStatus, setAccessStatus] = useState<any>(null);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Проверяем статус доступа
        const accessResponse = await fetch(`${apiUrl}/auth/can-access-signals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          setAccessStatus(accessData);
          
          // Определяем текущий шаг
          if (!userData.is_verified) {
            setStep(1);
          } else if (!userData.pocket_option_verified) {
            setStep(2);
          } else if (!userData.has_min_deposit) {
            setStep(3);
          } else {
            setStep(4);
          }
        }
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      router.push("/auth/login");
    }
  };

  const handleRegisterOnPocketOption = () => {
    // Открываем Pocket Option в новом окне
    window.open("https://po.cash", "_blank");
  };

  const handleVerifyPocketOptionId = async (pocketOptionId: string) => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/auth/verify-pocket-option`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pocket_option_id: pocketOptionId }),
      });

      if (response.ok) {
        await checkUserStatus(); // Обновляем статус
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Ошибка верификации Pocket Option ID");
      }
    } catch (error) {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!user?.pocket_option_id) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiUrl}/pocket-option/check-balance/${user.pocket_option_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const balanceData = await response.json();
        // Обновляем баланс пользователя
        await checkUserStatus();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Ошибка проверки баланса");
      }
    } catch (error) {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const getWebhookUrl = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/pocket-option/webhook-url`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const webhookData = await response.json();
        return webhookData.webhook_url;
      }
    } catch (error) {
      console.error("Error getting webhook URL:", error);
    }
    return null;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Шаг 1: Подтвердите Email</h2>
            <p className="mb-4">
              Проверьте свою почту и перейдите по ссылке для подтверждения email адреса.
            </p>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-blue-800">
                Письмо отправлено на: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Шаг 2: Регистрация на Pocket Option</h2>
            <p className="mb-6">
              Зарегистрируйтесь на Pocket Option по нашей ссылке для получения доступа к сигналам.
            </p>
            
            <div className="mb-6">
              <button
                onClick={handleRegisterOnPocketOption}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
              >
                Зарегистрироваться на Pocket Option
              </button>
            </div>

            <PocketOptionIdForm 
              onVerify={handleVerifyPocketOptionId}
              loading={loading}
              error={error}
            />
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Шаг 3: Пополните депозит</h2>
            <p className="mb-4">
              Пополните депозит на сумму не менее $10 для получения доступа к сигналам.
            </p>
            
            <div className="bg-yellow-100 p-4 rounded-lg mb-6">
              <p className="text-yellow-800">
                Ваш Pocket Option ID: <strong>{user?.pocket_option_id}</strong>
              </p>
            </div>

            <button
              onClick={handleCheckBalance}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg"
            >
              {loading ? "Проверяем..." : "Проверить баланс"}
            </button>

            {accessStatus?.pocket_option_balance > 0 && (
              <div className="mt-4 bg-green-100 p-4 rounded-lg">
                <p className="text-green-800">
                  Текущий баланс: <strong>${accessStatus.pocket_option_balance}</strong>
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-100 p-4 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              ✅ Доступ к сигналам получен!
            </h2>
            <p className="mb-6">
              Все условия выполнены. Теперь вы можете получать торговые сигналы.
            </p>
            
            <div className="bg-green-100 p-4 rounded-lg mb-6">
              <p className="text-green-800">
                Ваш Pocket Option ID: <strong>{user?.pocket_option_id}</strong>
              </p>
              <p className="text-green-800">
                Баланс: <strong>${accessStatus?.pocket_option_balance || 0}</strong>
              </p>
            </div>

            <button
              onClick={() => router.push("/signals")}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-semibold"
            >
              Перейти к сигналам
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      stepNumber <= step
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        stepNumber < step ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Email</span>
              <span>Регистрация</span>
              <span>Депозит</span>
              <span>Готово</span>
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Webhook Info - Hidden */}
        </div>
      </div>
    </div>
  );
}

// Компонент для ввода Pocket Option ID
function PocketOptionIdForm({ onVerify, loading, error }: {
  onVerify: (id: string) => void;
  loading: boolean;
  error: string;
}) {
  const [pocketOptionId, setPocketOptionId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pocketOptionId.trim()) {
      onVerify(pocketOptionId.trim());
    }
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={pocketOptionId}
          onChange={(e) => setPocketOptionId(e.target.value)}
          placeholder="Введите ваш Pocket Option ID"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !pocketOptionId.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg"
        >
          {loading ? "Проверяем..." : "Подтвердить"}
        </button>
      </form>
      
      {error && (
        <div className="mt-2 bg-red-100 p-3 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}





"use client";

import { useState, useEffect } from "react";
import {
	LanguageProvider,
	useLanguage,
	LanguageSwitcher,
} from "../components/LanguageSwitcher";

interface Signal {
	id: number;
	symbol: string;
	tf: string;
	direction: "UP" | "DOWN";
	enter_at: string;
	expire_at: string;
	generated_at: string;
	confidence?: number;
}

function SimpleSignalsPageContent() {
	const [signal, setSignal] =
		useState<Signal | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<
		string | null
	>(null);
	const [selectedSymbol, setSelectedSymbol] =
		useState("EURUSD");
	const [selectedTimeframe, setSelectedTimeframe] =
		useState("5m");
	const [isAuthorized, setIsAuthorized] =
		useState(false);
	const [userInfo, setUserInfo] =
		useState<any>(null);
	const { translate } = useLanguage();

	useEffect(() => {
		// Проверяем авторизацию пользователя
		const checkAuthorization = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				window.location.href = "/pocket-option";
				return;
			}

			try {
				const apiUrl =
					typeof window !== "undefined"
						? `${window.location.protocol}//${window.location.host}/api`
						: "https://visionoftrading.com/api";

				const response = await fetch(
					`${apiUrl}/auth/can-access-signals`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					},
				);

				if (response.ok) {
					const data = await response.json();
					if (data.can_access) {
						setIsAuthorized(true);
						setUserInfo({
							isVerified: data.is_verified,
							hasMinDeposit: data.has_min_deposit,
							balance: data.balance,
						});
					} else {
						window.location.href = "/pocket-option";
					}
				} else {
					localStorage.removeItem("token");
					window.location.href = "/pocket-option";
				}
			} catch (err) {
				console.error("Auth check failed:", err);
				window.location.href = "/pocket-option";
			}
		};

		checkAuthorization();
	}, []);

	useEffect(() => {
		if (!isAuthorized) return;

		const fetchSignal = async () => {
			try {
				setLoading(true);
				const response = await fetch(
					`/api/signal?symbol=${selectedSymbol}&tf=${selectedTimeframe}`,
				);
				if (!response.ok) {
					throw new Error("failed_to_fetch");
				}
				const data = await response.json();
				setSignal(data);
				setError(null);
			} catch (err) {
				if (
					err instanceof Error &&
					err.message === "failed_to_fetch"
				) {
					setError(
						translate({
							ru: "Не удалось получить сигнал",
							en: "Failed to fetch signal",
						}),
					);
				} else {
					setError(
						translate({
							ru: "Неизвестная ошибка",
							en: "Unknown error",
						}),
					);
				}
			} finally {
				setLoading(false);
			}
		};

		fetchSignal();
	}, [
		isAuthorized,
		selectedSymbol,
		selectedTimeframe,
	]);

	if (loading) {
		return (
			<div className="min-h-screen bg-[#0a0e1a] text-white p-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold mb-4">
						{translate({
							ru: "Загрузка...",
							en: "Loading...",
						})}
					</h1>
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-[#0a0e1a] text-white p-8">
				<div className="text-center">
					<h1 className="text-3xl font-bold mb-4 text-red-500">
						{translate({ ru: "Ошибка", en: "Error" })}
					</h1>
					<p className="text-gray-300">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0a0e1a] text-white p-8">
			<div className="max-w-4xl mx-auto">
				{/* User Info */}
				{userInfo && (
					<div className="bg-[#0f1419] rounded-lg p-4 mb-8 border border-gray-800">
						<div className="flex justify-between items-center">
							<div>
								<h2 className="text-lg font-semibold">
									{translate({
										ru: "Добро пожаловать!",
										en: "Welcome!",
									})}
								</h2>
								<p className="text-gray-400">
									ID: {userInfo.pocketId}
								</p>
							</div>
							<div className="text-right">
								<p className="text-2xl font-bold text-green-500">
									${userInfo.balance.toFixed(2)}
								</p>
								<p className="text-sm text-gray-400">
									{translate({
										ru: "Баланс",
										en: "Balance",
									})}
								</p>
							</div>
						</div>
					</div>
				)}

				<div className="flex justify-between items-center mb-6">
					<h1 className="text-3xl font-bold">
						{translate({
							ru: "Торговые сигналы",
							en: "Trading signals",
						})}
					</h1>
					<LanguageSwitcher />
				</div>

				{signal ? (
					<div className="bg-gray-800 rounded-lg p-6 mb-8">
						<h2 className="text-xl font-semibold mb-4">
							{translate({
								ru: "Последний сигнал",
								en: "Latest signal",
							})}
						</h2>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<span className="text-gray-400">
									{translate({
										ru: "Символ:",
										en: "Symbol:",
									})}
								</span>
								<span className="ml-2 font-semibold">
									{signal.symbol}
								</span>
							</div>
							<div>
								<span className="text-gray-400">
									{translate({
										ru: "Таймфрейм:",
										en: "Timeframe:",
									})}
								</span>
								<span className="ml-2 font-semibold">
									{signal.tf}
								</span>
							</div>
							<div>
								<span className="text-gray-400">
									{translate({
										ru: "Направление:",
										en: "Direction:",
									})}
								</span>
								<span
									className={`ml-2 font-semibold ${
										signal.direction === "UP"
											? "text-green-500"
											: "text-red-500"
									}`}
								>
									{signal.direction === "UP"
										? translate({ ru: "Вверх", en: "UP" })
										: translate({ ru: "Вниз", en: "DOWN" })}
								</span>
							</div>
							<div>
								<span className="text-gray-400">
									{translate({
										ru: "Вход:",
										en: "Entry:",
									})}
								</span>
								<span className="ml-2 font-semibold">
									{new Date(
										signal.enter_at,
									).toLocaleTimeString()}
								</span>
							</div>
						</div>
					</div>
				) : (
					<div className="bg-gray-800 rounded-lg p-6 mb-8">
						<p className="text-gray-300">
							{translate({
								ru: "Нет доступных сигналов",
								en: "No signals available",
							})}
						</p>
					</div>
				)}

				<div className="bg-gray-800 rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4">
						{translate({
							ru: "График TradingView",
							en: "TradingView chart",
						})}
					</h2>
					<div className="h-96 bg-gray-700 rounded-lg flex items-center justify-center">
						<p className="text-gray-400">
							{translate({
								ru: "График EURJPY 1h",
								en: "EURJPY chart 1h",
							})}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function SimpleSignalsPage() {
	return (
		<LanguageProvider>
			<SimpleSignalsPageContent />
		</LanguageProvider>
	);
}

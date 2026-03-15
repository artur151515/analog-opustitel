"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	useLanguage,
	LanguageProvider,
	LanguageSwitcher,
} from "../components/LanguageSwitcher";

function DashboardPageContent() {
	const router = useRouter();
	const { language } = useLanguage();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [accessStatus, setAccessStatus] = useState<any>(null);

	const apiUrl =
		typeof window !== "undefined"
			? `${window.location.protocol}//${window.location.host}/api`
			: process.env.NEXT_PUBLIC_API_URL || "https://proffithunter.com/api";

	// Determine if market is open (weekday) or OTC time (weekend)
	const now = new Date();
	const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat
	const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

	const fetchUserData = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/auth/login");
			return;
		}

		try {
			const response = await fetch(`${apiUrl}/auth/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data);

				const accessResponse = await fetch(
					`${apiUrl}/auth/can-access-signals`,
					{ headers: { Authorization: `Bearer ${token}` } }
				);

				if (accessResponse.ok) {
					const accessData = await accessResponse.json();
					setAccessStatus(accessData);
				}
			} else {
				localStorage.removeItem("token");
				router.push("/auth/login");
			}
		} catch (err) {
			console.error("Error loading data:", err);
		} finally {
			setLoading(false);
		}
	}, [router, apiUrl]);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	const handleLogout = () => {
		localStorage.removeItem("token");
		router.push("/");
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
				<div className="text-white font-light">
					{language === "ru" ? "Загрузка..." : "Loading..."}
				</div>
			</div>
		);
	}

	const hasAccess = accessStatus?.can_access;
	const accessLevel = accessStatus?.access_level || "none";
	const hasOtcAccess = accessLevel === "unlimited_all";

	return (
		<div className="min-h-screen bg-[#0a0e1a]">
			<LanguageSwitcher />

			{/* Header */}
			<header className="bg-[#0f1419] border-b border-gray-800">
				<div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
					<div className="flex justify-between items-center py-6">
						<h1 className="text-2xl font-light text-white tracking-tight">
							ProfitHunter
						</h1>
						<div className="flex items-center gap-3">
							{user && (
								<span className="text-gray-400 text-sm hidden sm:block">
									{user.email}
								</span>
							)}
							<button
								onClick={handleLogout}
								className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-light text-sm transition-colors"
							>
								{language === "ru" ? "Выйти" : "Logout"}
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
				{/* If no access - show deposit prompt */}
				{!hasAccess && (
					<NoAccessSection
						user={user}
						accessStatus={accessStatus}
						apiUrl={apiUrl}
						language={language}
						onRefresh={fetchUserData}
					/>
				)}

				{/* If has access - show signal type selection */}
				{hasAccess && (
					<>
						<h2 className="text-3xl font-light text-white tracking-tight mb-2">
							{language === "ru"
								? "Выберите тип сигналов"
								: "Choose Signal Type"}
						</h2>
						<p className="text-gray-400 font-light mb-8">
							{isWeekend
								? language === "ru"
									? "Сейчас выходные — биржа закрыта, доступны OTC сигналы"
									: "Weekend — market closed, OTC signals available"
								: language === "ru"
									? "Биржа открыта — доступны основные торговые сигналы"
									: "Market open — main trading signals available"}
						</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Regular Exchange */}
							<button
								onClick={() => {
									if (!isWeekend) router.push("/signals?tf=5m&mode=regular");
								}}
								disabled={isWeekend}
								className={`relative group rounded-2xl border p-8 text-left transition-all duration-300 ${
									isWeekend
										? "bg-[#0f1419]/50 border-gray-800/50 cursor-not-allowed opacity-50"
										: "bg-[#0f1419] border-gray-700 hover:border-[#00c49a] hover:shadow-lg hover:shadow-[#00c49a]/10 cursor-pointer"
								}`}
							>
								<div className="flex justify-between items-start mb-6">
									<div
										className={`w-14 h-14 rounded-xl flex items-center justify-center ${
											isWeekend
												? "bg-gray-800 text-gray-500"
												: "bg-[#00c49a]/10 text-[#00c49a]"
										}`}
									>
										<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
										</svg>
									</div>
									<span
										className={`px-3 py-1 rounded-full text-xs font-medium ${
											isWeekend
												? "bg-red-500/10 text-red-400 border border-red-500/20"
												: "bg-green-500/10 text-green-400 border border-green-500/20"
										}`}
									>
										{isWeekend
											? language === "ru" ? "Закрыта" : "Closed"
											: language === "ru" ? "Открыта" : "Open"}
									</span>
								</div>

								<h3 className="text-xl font-semibold text-white mb-2">
									{language === "ru" ? "Обычная биржа" : "Regular Exchange"}
								</h3>
								<p className="text-gray-400 text-sm mb-4">
									EUR/USD, GBP/USD, USD/JPY, CAD/JPY, GBP/JPY, EUR/JPY
								</p>
								<p className="text-gray-500 text-xs">
									{language === "ru"
										? "Пн-Пт \u2022 Таймфреймы: 3м, 5м, 7м"
										: "Mon-Fri \u2022 Timeframes: 3m, 5m, 7m"}
								</p>

								{isWeekend && (
									<div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
										<p className="text-red-400/70 text-xs">
											{language === "ru"
												? "Биржа закрыта по выходным. Торговля возобновится в понедельник."
												: "Exchange closed on weekends. Trading resumes Monday."}
										</p>
									</div>
								)}
							</button>

							{/* OTC */}
							<button
								onClick={() => {
									if (isWeekend && hasOtcAccess)
										router.push("/signals?tf=5m&mode=otc");
								}}
								disabled={!isWeekend || !hasOtcAccess}
								className={`relative group rounded-2xl border p-8 text-left transition-all duration-300 ${
									!isWeekend || !hasOtcAccess
										? "bg-[#0f1419]/50 border-gray-800/50 cursor-not-allowed opacity-50"
										: "bg-[#0f1419] border-gray-700 hover:border-[#f59e0b] hover:shadow-lg hover:shadow-[#f59e0b]/10 cursor-pointer"
								}`}
							>
								<div className="flex justify-between items-start mb-6">
									<div
										className={`w-14 h-14 rounded-xl flex items-center justify-center ${
											!isWeekend || !hasOtcAccess
												? "bg-gray-800 text-gray-500"
												: "bg-amber-500/10 text-amber-400"
										}`}
									>
										<svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<span
										className={`px-3 py-1 rounded-full text-xs font-medium ${
											isWeekend && hasOtcAccess
												? "bg-green-500/10 text-green-400 border border-green-500/20"
												: !hasOtcAccess
													? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
													: "bg-red-500/10 text-red-400 border border-red-500/20"
										}`}
									>
										{!hasOtcAccess
											? "$200+"
											: isWeekend
												? language === "ru" ? "Открыто" : "Open"
												: language === "ru" ? "Закрыто" : "Closed"}
									</span>
								</div>

								<h3 className="text-xl font-semibold text-white mb-2">
									{language === "ru" ? "OTC Сигналы" : "OTC Signals"}
								</h3>
								<p className="text-gray-400 text-sm mb-4">
									{language === "ru"
										? "Внебиржевые активы для торговли по выходным"
										: "Over-the-counter assets for weekend trading"}
								</p>
								<p className="text-gray-500 text-xs">
									{language === "ru"
										? "Сб-Вс \u2022 Таймфреймы: 3м, 5м, 7м"
										: "Sat-Sun \u2022 Timeframes: 3m, 5m, 7m"}
								</p>

								{!hasOtcAccess && (
									<div className="mt-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
										<p className="text-amber-400/70 text-xs">
											{language === "ru"
												? "Требуется депозит от $200 для доступа к OTC сигналам."
												: "Deposit $200+ required for OTC signals."}
										</p>
									</div>
								)}

								{hasOtcAccess && !isWeekend && (
									<div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
										<p className="text-red-400/70 text-xs">
											{language === "ru"
												? "OTC доступен только по выходным (Сб-Вс)."
												: "OTC available weekends only (Sat-Sun)."}
										</p>
									</div>
								)}
							</button>
						</div>

						{/* Balance info */}
						<div className="mt-8 bg-[#0f1419] rounded-xl border border-gray-800 p-6">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-gray-400 text-sm">
										{language === "ru" ? "Ваш баланс" : "Your balance"}
									</p>
									<p className="text-2xl font-light text-white">
										${accessStatus?.pocket_option_balance || 0}
									</p>
								</div>
								<div>
									<p className="text-gray-400 text-sm">
										{language === "ru" ? "Уровень доступа" : "Access level"}
									</p>
									<p className="text-lg font-light text-[#00c49a]">
										{accessLevel === "unlimited_all"
											? language === "ru" ? "Премиум" : "Premium"
											: accessLevel === "unlimited_main"
												? language === "ru" ? "Расширенный" : "Extended"
												: language === "ru" ? "Базовый" : "Basic"}
									</p>
								</div>
								<div className="text-right">
									<p className="text-gray-400 text-sm">
										{language === "ru" ? "Сейчас" : "Now"}
									</p>
									<p className="text-lg font-light text-white">
										{new Date().toLocaleTimeString(
											language === "ru" ? "ru-RU" : "en-US",
											{ hour: "2-digit", minute: "2-digit" }
										)}
									</p>
									<p className="text-gray-500 text-xs">
										{isWeekend
											? language === "ru" ? "Выходной" : "Weekend"
											: language === "ru" ? "Рабочий день" : "Weekday"}
									</p>
								</div>
							</div>
						</div>
					</>
				)}
			</main>
		</div>
	);
}

function NoAccessSection({
	user,
	accessStatus,
	apiUrl,
	language,
	onRefresh,
}: {
	user: any;
	accessStatus: any;
	apiUrl: string;
	language: string;
	onRefresh: () => void;
}) {
	const [pocketOptionId, setPocketOptionId] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [checkingBalance, setCheckingBalance] = useState(false);

	const POCKET_OPTION_BASE_URL = "https://pocket-option.su";

	const handleSubmitPocketId = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!pocketOptionId.trim()) return;
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
				body: JSON.stringify({ pocket_option_id: pocketOptionId.trim() }),
			});
			if (response.ok) {
				setPocketOptionId("");
				onRefresh();
			} else {
				const data = await response.json();
				setError(data.detail || "Error");
			}
		} catch {
			setError(language === "ru" ? "Ошибка соединения" : "Connection error");
		} finally {
			setLoading(false);
		}
	};

	const handleCheckBalance = async () => {
		if (!user?.pocket_option_id) return;
		setCheckingBalance(true);
		try {
			const token = localStorage.getItem("token");
			await fetch(
				`${apiUrl}/pocket-option/check-balance/${user.pocket_option_id}`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			onRefresh();
		} catch {
			// ignore
		} finally {
			setCheckingBalance(false);
		}
	};

	return (
		<div className="space-y-6">
			<h2 className="text-3xl font-light text-white tracking-tight mb-4">
				{language === "ru" ? "Получите доступ к сигналам" : "Get Signal Access"}
			</h2>

			{error && (
				<div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
					{error}
				</div>
			)}

			{!user?.pocket_option_verified && (
				<div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6">
					<h3 className="text-lg font-light text-white mb-4">
						1. {language === "ru" ? "Зарегистрируйтесь на Pocket Option" : "Register on Pocket Option"}
					</h3>
					<button
						onClick={() =>
							window.open(`${POCKET_OPTION_BASE_URL}?click_id=${user?.id}`, "_blank")
						}
						className="w-full py-3 bg-[#00c49a] hover:bg-[#00b38a] text-white rounded-lg font-light transition-colors mb-4"
					>
						{language === "ru" ? "Зарегистрироваться" : "Register"}
					</button>
					<form onSubmit={handleSubmitPocketId} className="space-y-3">
						<input
							type="text"
							value={pocketOptionId}
							onChange={(e) => setPocketOptionId(e.target.value)}
							placeholder="Pocket Option ID"
							required
							className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-[#00c49a] outline-none"
						/>
						<button
							type="submit"
							disabled={loading}
							className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg font-light transition-colors"
						>
							{loading
								? language === "ru" ? "Проверяем..." : "Checking..."
								: language === "ru" ? "Подтвердить ID" : "Verify ID"}
						</button>
					</form>
				</div>
			)}

			{user?.pocket_option_verified && !user?.has_min_deposit && (
				<div className="bg-[#0f1419] rounded-xl border border-gray-800 p-6">
					<h3 className="text-lg font-light text-white mb-4">
						2. {language === "ru" ? "Пополните депозит" : "Make a deposit"}
					</h3>
					<p className="text-gray-400 text-sm mb-4">
						{language === "ru" ? "Минимальный депозит: $50" : "Minimum deposit: $50"}
					</p>

					<div className="grid grid-cols-3 gap-3 mb-4">
						<div className="bg-[#1a1f2e] rounded-lg p-3 text-center border border-gray-700">
							<p className="text-blue-400 font-bold text-lg">$50+</p>
							<p className="text-gray-400 text-xs">
								{language === "ru" ? "Базовый" : "Basic"}
							</p>
						</div>
						<div className="bg-[#1a1f2e] rounded-lg p-3 text-center border border-blue-500/30">
							<p className="text-purple-400 font-bold text-lg">$100+</p>
							<p className="text-gray-400 text-xs">
								{language === "ru" ? "Расширенный" : "Extended"}
							</p>
						</div>
						<div className="bg-[#1a1f2e] rounded-lg p-3 text-center border border-gray-700">
							<p className="text-amber-400 font-bold text-lg">$200+</p>
							<p className="text-gray-400 text-xs">
								{language === "ru" ? "Премиум + OTC" : "Premium + OTC"}
							</p>
						</div>
					</div>

					<button
						onClick={handleCheckBalance}
						disabled={checkingBalance}
						className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg font-light transition-colors"
					>
						{checkingBalance
							? language === "ru" ? "Проверяем..." : "Checking..."
							: language === "ru" ? "Проверить баланс" : "Check Balance"}
					</button>
				</div>
			)}
		</div>
	);
}

export default function DashboardPage() {
	return (
		<LanguageProvider>
			<DashboardPageContent />
		</LanguageProvider>
	);
}

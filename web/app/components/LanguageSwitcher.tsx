"use client";

import React, {
	useState,
	useCallback,
	Fragment,
} from "react";
import {
	Menu,
	Transition,
} from "@headlessui/react";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

type Language = "ru" | "en";

interface Translations {
	[key: string]: {
		ru: string;
		en: string;
	};
}

const translations: Translations = {
	latest_signal: {
		ru: "Последний сигнал",
		en: "Latest Signal",
	},
	generated: {
		ru: "Создан",
		en: "Generated",
	},
	enter_time: {
		ru: "Время входа",
		en: "Enter Time",
	},
	expire_time: {
		ru: "Время истечения",
		en: "Expire Time",
	},
	signal_active: {
		ru: "Сигнал активен",
		en: "Signal active",
	},
	signal_expired: {
		ru: "Сигнал истёк",
		en: "Signal expired",
	},
	signal_completed: {
		ru: "Сигнал завершён",
		en: "Signal completed",
	},
	getting_signal: {
		ru: "Получение сигнала...",
		en: "Getting signal...",
	},
	loading_data: {
		ru: "⏳ Загрузка данных",
		en: "⏳ Loading data",
	},
	auto_refresh: {
		ru: "Автообновление каждые 5 секунд • Последнее обновление",
		en: "Auto-refreshing every 5 seconds • Last update",
	},
	view_signals: {
		ru: "Просмотр сигналов",
		en: "View Signals",
	},
	trading_signals: {
		ru: "Торговые сигналы",
		en: "Trading Signals",
	},
	recommendations: {
		ru: "Рекомендации по сигналу",
		en: "Signal Recommendations",
	},
	seasonal_factor: {
		ru: "Сезонный фактор",
		en: "Seasonal Factor",
	},
	trade_entry: {
		ru: "Открытие сделки",
		en: "Trade Entry",
	},
	capital_management: {
		ru: "Управление капиталом",
		en: "Capital Management",
	},
	back: {
		ru: "Назад",
		en: "Back",
	},
	refresh: {
		ru: "Обновить",
		en: "Refresh",
	},
	disclaimer: {
		ru: "Отказ от ответственности",
		en: "Disclaimer",
	},
	logout: {
		ru: "Выйти из системы",
		en: "Logout",
	},
	logout_btn: {
		ru: "ВЫЙТИ",
		en: "LOGOUT",
	},
};

export type TranslateOptions = {
	ru: string;
	en: string;
};

export interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: (key: string) => string;
	translate: (options: TranslateOptions) => string;
}

export const LanguageContext =
	React.createContext<
		LanguageContextType | undefined
	>(undefined);

export const useLanguage = () => {
	const context = React.useContext(
		LanguageContext,
	);
	if (!context) {
		throw new Error(
			"useLanguage must be used within a LanguageProvider",
		);
	}
	return context;
};

export const LanguageProvider: React.FC<{
	children: React.ReactNode;
}> = ({ children }) => {
	const [language, setLanguage] =
		useState<Language>("ru");

	const t = useCallback(
		(key: string): string => {
			return translations[key]?.[language] || key;
		},
		[language],
	);

	const translate = useCallback(
		(options: TranslateOptions): string =>
			language === "ru" ? options.ru : options.en,
		[language],
	);

	return (
		<LanguageContext.Provider
			value={{ language, setLanguage, t, translate }}
		>
			{children}
		</LanguageContext.Provider>
	);
};

export const LanguageSwitcher: React.FC = () => {
	const { language, setLanguage, translate } =
		useLanguage();
	const [isAdmin, setIsAdmin] = useState(false);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	const toggleAdmin = () => {
		setIsAdmin(!isAdmin);
		localStorage.setItem(
			"admin_mode",
			(!isAdmin).toString(),
		);
	};

	const handleLogout = async () => {
		try {
			const token = localStorage.getItem("auth_token");
			if (token) {
				const response = await fetch("/api/auth/logout", {
					method: "POST",
					headers: {
						"Authorization": `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				
				if (response.ok) {
					localStorage.removeItem("auth_token");
					setIsLoggedIn(false);
					window.location.href = "/auth/login";
				}
			}
		} catch (error) {
			console.error("Logout error:", error);
		}
	};

	// Check admin mode and login status on mount
	React.useEffect(() => {
		const adminMode =
			localStorage.getItem("admin_mode") === "true";
		setIsAdmin(adminMode);
		
		const token = localStorage.getItem("auth_token");
		setIsLoggedIn(!!token);
	}, []);

	const languages: {
		value: Language;
		label: string;
	}[] = [
		{ value: "ru", label: "Русский" },
		{ value: "en", label: "English" },
	];

	const handleChangeLanguage = (
		lang: Language,
	) => {
		setLanguage(lang);
	};

	const activeLanguage = languages.find(
		(item) => item.value === language,
	);

	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-2 sm:flex-row sm:items-center">
			{/* Logout Button */}
			{isLoggedIn && (
				<button
					onClick={handleLogout}
					className="group relative flex h-10 min-w-[100px] items-center justify-center rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/20 via-red-500/10 to-red-500/5 px-4 text-xs font-bold uppercase tracking-wide text-red-50 shadow-[0_15px_40px_-20px_rgba(239,68,68,0.7)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_25px_45px_-20px_rgba(239,68,68,0.7)]"
					title={translate({
						ru: "Выйти из системы",
						en: "Logout",
					})}
				>
					<span className="text-red-50">
						{translate({
							ru: "ВЫЙТИ",
							en: "LOGOUT",
						})}
					</span>
				</button>
			)}
			
			{/* Admin Toggle */}
			<button
				onClick={toggleAdmin}
				className={`group relative flex h-10 min-w-[90px] items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/20 via-white/10 to-white/5 px-4 text-xs font-bold uppercase tracking-wide text-slate-50 shadow-[0_15px_40px_-20px_rgba(15,23,42,0.7)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_25px_45px_-20px_rgba(15,23,42,0.7)] ${
					isAdmin
						? "from-rose-500/40 via-rose-500/20 to-rose-500/10 text-rose-50"
						: "from-slate-900/80 via-slate-900/60 to-slate-900/50 text-slate-200"
				}`}
				title={translate({
					ru: isAdmin
						? "Выйти из админ-режима"
						: "Войти в админ-режим",
					en: isAdmin
						? "Disable admin mode"
						: "Enable admin mode",
				})}
			>
				<span
					className={`transition ${
						isAdmin ? "text-white" : "text-slate-200"
					}`}
				>
					{isAdmin ? "ADMIN" : "USER"}
				</span>
			</button>

			{/* Language Toggle */}
			<Menu
				as="div"
				className="relative flex-1 min-w-[150px] sm:min-w-[170px]"
			>
				<Menu.Button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-gradient-to-br from-white/25 via-white/15 to-white/5 px-4 py-2 text-sm font-medium text-slate-900 shadow-[0_15px_45px_-25px_rgba(59,130,246,0.65)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_30px_55px_-25px_rgba(56,189,248,0.65)] dark:text-slate-200">
					<span className="flex items-center gap-2">
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/80 to-indigo-500/70 text-white shadow-inner shadow-blue-900/40">
							<GlobeAltIcon className="h-4 w-4" />
						</span>
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
							{translate({
								ru: "Язык интерфейса",
								en: "Interface language",
							})}
						</span>
					</span>
					<div className="flex items-center gap-2">
						<span className="rounded-lg bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-800 shadow-inner shadow-white/40 dark:bg-slate-800/60 dark:text-slate-100 dark:shadow-slate-900/60">
							{activeLanguage?.label ?? "English"}
						</span>
						<ChevronDownIcon className="h-4 w-4 text-slate-500 transition group-hover:text-slate-700 dark:text-slate-300 dark:group-hover:text-slate-100" />
					</div>
				</Menu.Button>
				<Transition
					as={Fragment}
					enter="transition ease-out duration-150"
					enterFrom="transform opacity-0 scale-95"
					enterTo="transform opacity-100 scale-100"
					leave="transition ease-in duration-100"
					leaveFrom="transform opacity-100 scale-100"
					leaveTo="transform opacity-0 scale-95"
				>
					<Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 p-1 text-sm shadow-2xl shadow-blue-900/40 backdrop-blur-2xl focus:outline-none">
						{languages.map((lang) => (
							<Menu.Item key={lang.value}>
								{({ active }) => (
									<button
										onClick={() =>
											handleChangeLanguage(lang.value)
										}
										className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
											active || language === lang.value
												? "bg-gradient-to-r from-blue-500/30 via-blue-500/20 to-blue-500/10 text-blue-100"
												: "text-slate-200"
										}`}
									>
										<span>{lang.label}</span>
										{language === lang.value && (
											<span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_2px_rgba(96,165,250,0.85)]" />
										)}
									</button>
								)}
							</Menu.Item>
						))}
					</Menu.Items>
				</Transition>
			</Menu>
		</div>
	);
};

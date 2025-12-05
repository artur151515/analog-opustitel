"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	LanguageProvider,
	useLanguage,
	LanguageSwitcher,
} from "../../../components/LanguageSwitcher";

function PocketOptionRegisterPageContent() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { translate } = useLanguage();

	const handleRegister = () => {
		setLoading(true);
		// Открываем Pocket Option в новом окне
		window.open("https://trade-option.xyz/register?utm_campaign=54509&utm_source=affiliate&utm_medium=sr&a=oRKAuWfixoOAgt&ac=sasha_bb700&code=BB700", "_blank");

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
					<LanguageSwitcher />
					<h1 className="text-3xl font-bold mb-6">
						{translate({
							ru: "Регистрация на Pocket Option",
							en: "Register on Pocket Option",
						})}
					</h1>

					<div className="mb-8">
						<div className="bg-blue-100 p-6 rounded-lg mb-6">
							<h2 className="text-xl font-semibold mb-4">
								{translate({
									ru: "Важно!",
									en: "Important!",
								})}
							</h2>
							<p className="text-blue-800 mb-4">
								{translate({
									ru: "Чтобы получить доступ к сигналам, зарегистрируйтесь по нашей партнёрской ссылке на Pocket Option.",
									en: "To gain access to the signals, register on Pocket Option using our partner link.",
								})}
							</p>
							<p className="text-blue-800">
								{translate({
									ru: "После регистрации вернитесь на сайт и введите свой Pocket Option ID.",
									en: "After registering, return to the site and enter your Pocket Option ID.",
								})}
							</p>
						</div>

						<div className="bg-green-100 p-4 rounded-lg mb-6">
							<h3 className="font-semibold text-green-800 mb-2">
								{translate({
									ru: "Преимущества регистрации:",
									en: "Benefits of registration:",
								})}
							</h3>
							<ul className="text-green-800 text-left space-y-1">
								<li>
									•{" "}
									{translate({
										ru: "Доступ к торговым сигналам",
										en: "Access to trading signals",
									})}
								</li>
								<li>
									•{" "}
									{translate({
										ru: "Автоматическая проверка депозитов",
										en: "Automatic deposit verification",
									})}
								</li>
								<li>
									•{" "}
									{translate({
										ru: "Синхронизация данных с нашим сервисом",
										en: "Data sync with our service",
									})}
								</li>
								<li>
									•{" "}
									{translate({
										ru: "Поддержка 24/7",
										en: "24/7 support",
									})}
								</li>
							</ul>
						</div>
					</div>

					<button
						onClick={handleRegister}
						disabled={loading}
						className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg text-xl font-semibold mb-4"
					>
						{loading
							? translate({
									ru: "Открываем Pocket Option...",
									en: "Opening Pocket Option...",
							  })
							: translate({
									ru: "Зарегистрироваться на Pocket Option",
									en: "Register on Pocket Option",
							  })}
					</button>

					<p className="text-gray-600 text-sm">
						{translate({
							ru: "После регистрации не забудьте вернуться и ввести ваш Pocket Option ID.",
							en: "After registering, please return and enter your Pocket Option ID.",
						})}
					</p>

					<div className="mt-8 pt-6 border-t">
						<button
							onClick={() => router.back()}
							className="text-blue-600 hover:text-blue-800"
						>
							{translate({
								ru: "← Назад к настройкам",
								en: "← Back to setup",
							})}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function PocketOptionRegisterPage() {
	return (
		<LanguageProvider>
			<PocketOptionRegisterPageContent />
		</LanguageProvider>
	);
}

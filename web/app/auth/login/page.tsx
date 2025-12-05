"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	useLanguage,
	LanguageProvider,
} from "../../components/LanguageSwitcher";

function LoginPageContent() {
	const router = useRouter();
	const { language, translate } = useLanguage();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const apiUrl =
		typeof window !== "undefined"
			? `${window.location.protocol}//${window.location.host}/api`
			: process.env.NEXT_PUBLIC_API_URL ||
			  "https://visionoftrading.com/api";

	const handleLogin = async (
		e: React.FormEvent,
	) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch(
				`${apiUrl}/auth/login`,
				{
					method: "POST",
					headers: {
						"Content-Type":
							"application/x-www-form-urlencoded",
					},
					body: `username=${encodeURIComponent(
						email,
					)}&password=${encodeURIComponent(password)}`,
				},
			);

			if (response.ok) {
				const data = await response.json();
				localStorage.setItem(
					"auth_token",
					data.access_token,
				);

				// Always redirect to dashboard after login
				router.push("/dashboard");
			} else {
				const data = await response.json();
				setError(
					data.detail ||
						(language === "ru"
							? "Неверный email или пароль"
							: "Invalid email or password"),
				);
			}
		} catch (err) {
			setError(
				language === "ru"
					? "Ошибка соединения"
					: "Connection error",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
			<div className="max-w-md w-full">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-light text-white tracking-tight mb-2">
						Trade Vision
					</h1>
					<p className="text-gray-400 font-light text-sm">
						{language === "ru"
							? "Вход в систему"
							: "Sign In"}
					</p>
				</div>

				{/* Content */}
				<div className="bg-[#0f1419] rounded-xl border border-gray-800 p-8">
					{error && (
						<div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-light">
							{error}
						</div>
					)}

					<form onSubmit={handleLogin}>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-light text-gray-400 mb-2">
									{translate({
										ru: "Электронная почта",
										en: "Email",
									})}
								</label>
								<input
									type="email"
									value={email}
									onChange={(e) =>
										setEmail(e.target.value)
									}
									required
									className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
								/>
							</div>
							<div>
								<label className="block text-sm font-light text-gray-400 mb-2">
									{language === "ru"
										? "Пароль"
										: "Password"}
								</label>
								<input
									type="password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
									className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
								/>
							</div>
							<button
								type="submit"
								disabled={loading}
								className="w-full py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors disabled:opacity-50"
							>
								{loading
									? language === "ru"
										? "Загрузка..."
										: "Loading..."
									: language === "ru"
									? "Войти"
									: "Sign In"}
							</button>
						</div>
					</form>
				</div>

				{/* Footer */}
				<div className="mt-6 text-center">
					<p className="text-gray-400 font-light text-sm">
						{language === "ru"
							? "Нет аккаунта?"
							: "Don't have an account?"}{" "}
						<Link
							href="/auth/register"
							className="text-white hover:text-gray-300"
						>
							{language === "ru"
								? "Зарегистрироваться"
								: "Sign Up"}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<LanguageProvider>
			<LoginPageContent />
		</LanguageProvider>
	);
}

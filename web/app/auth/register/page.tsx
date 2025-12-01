"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	useLanguage,
	LanguageProvider,
} from "../../components/LanguageSwitcher";

const POCKET_OPTION_URL =
	"https://pocket-option.su";

function RegisterPageContent() {
	const router = useRouter();
	const { language } = useLanguage();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] =
		useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const apiUrl =
		typeof window !== "undefined"
			? `${window.location.protocol}//${window.location.host}/api`
			: process.env.NEXT_PUBLIC_API_URL ||
			  "https://visionoftrading.com/api";

	// Standard Registration with Email Verification
	const handleRegister = async (
		e: React.FormEvent,
	) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError(
				language === "ru"
					? "Пароли не совпадают"
					: "Passwords do not match",
			);
			return;
		}

		if (password.length < 6) {
			setError(
				language === "ru"
					? "Пароль должен быть минимум 6 символов"
					: "Password must be at least 6 characters",
			);
			return;
		}

		setLoading(true);

		try {
			const response = await fetch(
				`${apiUrl}/auth/register`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, password }),
				},
			);

			const data = await response.json();

			if (response.ok) {
				// Redirect to email verification page
				router.push(
					"/auth/verify-email?email=" +
						encodeURIComponent(email),
				);
			} else {
				setError(
					data.detail ||
						(language === "ru"
							? "Ошибка регистрации"
							: "Registration error"),
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
							? "Регистрация"
							: "Registration"}
					</p>
				</div>

				{/* Content */}
				<div className="bg-[#0f1419] rounded-xl border border-gray-800 p-8">
					{error && (
						<div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-light">
							{error}
						</div>
					)}

					<form onSubmit={handleRegister}>
						<h2 className="text-xl font-light text-white mb-6">
							{language === "ru"
								? "Создайте аккаунт"
								: "Create Account"}
						</h2>
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-light text-gray-400 mb-2">
									{language === "ru"
										? "Электронная почта"
										: "Email"}
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
									minLength={6}
									className="w-full px-4 py-3 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white font-light focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
								/>
							</div>
							<div>
								<label className="block text-sm font-light text-gray-400 mb-2">
									{language === "ru"
										? "Подтвердите пароль"
										: "Confirm Password"}
								</label>
								<input
									type="password"
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									required
									minLength={6}
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
									? "Зарегистрироваться"
									: "Register"}
							</button>
						</div>
					</form>

					{/* Info about PocketOption */}
					<div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
						<p className="text-blue-400 text-sm font-light">
							{language === "ru"
								? "После регистрации перейдите по ссылке PocketOption для получения сигналов."
								: "After registration, visit PocketOption link to access signals."}
						</p>
						<a
							href={POCKET_OPTION_URL}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-block mt-2 text-white hover:text-gray-300 text-sm underline"
						>
							{language === "ru"
								? "Перейти на PocketOption"
								: "Go to PocketOption"}
						</a>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-6 text-center">
					<p className="text-gray-400 font-light text-sm">
						{language === "ru"
							? "Уже есть аккаунт?"
							: "Already have an account?"}{" "}
						<Link
							href="/auth/login"
							className="text-white hover:text-gray-300"
						>
							{language === "ru" ? "Войти" : "Sign In"}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default function RegisterPage() {
	return (
		<LanguageProvider>
			<RegisterPageContent />
		</LanguageProvider>
	);
}

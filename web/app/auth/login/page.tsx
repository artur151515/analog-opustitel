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
					"token",
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
		<div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg-primary)' }}>
			<div className="max-w-sm w-full">
				{/* Logo */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center gap-2 mb-4">
						<div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'var(--accent)' }}>
							<svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
								<polyline points="3,17 8,11 13,14 21,6" stroke="#020a08" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
							</svg>
						</div>
						<span className="text-xl font-semibold" style={{ color: 'var(--text-bright)' }}>ProfitHunter</span>
					</div>
					<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
						{language === "ru" ? "Вход в систему" : "Sign In"}
					</p>
				</div>

				{/* Card */}
				<div className="rounded-xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
					{error && (
						<div className="mb-6 p-3 rounded-lg text-sm" style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,69,96,0.2)', color: 'var(--red)' }}>
							{error}
						</div>
					)}

					<form onSubmit={handleLogin}>
						<div className="space-y-4">
							<div>
								<label className="block text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
									{translate({ ru: "Email", en: "Email" })}
								</label>
								<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input w-full" />
							</div>
							<div>
								<label className="block text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
									{language === "ru" ? "Пароль" : "Password"}
								</label>
								<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input w-full" />
							</div>
							<button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2" style={{ opacity: loading ? 0.6 : 1 }}>
								{loading ? (language === "ru" ? "Загрузка..." : "Loading...") : (language === "ru" ? "Войти" : "Sign In")}
							</button>
						</div>
					</form>
				</div>

				<div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
					{language === "ru" ? "Нет аккаунта?" : "No account?"}{" "}
					<Link href="/auth/register" style={{ color: 'var(--accent)' }}>
						{language === "ru" ? "Зарегистрироваться" : "Sign Up"}
					</Link>
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

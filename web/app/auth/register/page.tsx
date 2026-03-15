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
		<div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: 'var(--bg-primary)' }}>
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
						{language === "ru" ? "Регистрация" : "Registration"}
					</p>
				</div>

				{/* Card */}
				<div className="rounded-xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
					{error && (
						<div className="mb-5 p-3 rounded-lg text-sm" style={{ background: 'var(--red-dim)', border: '1px solid rgba(255,69,96,0.2)', color: 'var(--red)' }}>
							{error}
						</div>
					)}

					<form onSubmit={handleRegister}>
						<div className="space-y-4">
							<div>
								<label className="block text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
									Email
								</label>
								<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input w-full" />
							</div>
							<div>
								<label className="block text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
									{language === "ru" ? "Пароль" : "Password"}
								</label>
								<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input w-full" />
							</div>
							<div>
								<label className="block text-xs mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
									{language === "ru" ? "Подтвердите пароль" : "Confirm Password"}
								</label>
								<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="input w-full" />
							</div>
							<button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2" style={{ opacity: loading ? 0.6 : 1 }}>
								{loading ? (language === "ru" ? "Загрузка..." : "Loading...") : (language === "ru" ? "Создать аккаунт" : "Create Account")}
							</button>
						</div>
					</form>

					{/* PO hint */}
					<div className="mt-5 p-3 rounded-lg text-sm" style={{ background: 'var(--accent-dim)', border: '1px solid var(--border-mid)', color: 'var(--text-mid)' }}>
						{language === "ru"
							? "После регистрации зайдите на Pocket Option по нашей ссылке для доступа к сигналам."
							: "After registration, join Pocket Option via our link to access signals."}{" "}
						<a href={POCKET_OPTION_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
							Pocket Option →
						</a>
					</div>
				</div>

				<div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
					{language === "ru" ? "Уже есть аккаунт?" : "Already have an account?"}{" "}
					<Link href="/auth/login" style={{ color: 'var(--accent)' }}>
						{language === "ru" ? "Войти" : "Sign In"}
					</Link>
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

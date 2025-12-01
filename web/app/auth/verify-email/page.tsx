"use client";

import {
	useState,
	useEffect,
	useCallback,
} from "react";
import {
	useRouter,
	useSearchParams,
} from "next/navigation";
import Link from "next/link";
import {
	LanguageProvider,
	useLanguage,
} from "../../components/LanguageSwitcher";

function VerifyEmailPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const [isVerifying, setIsVerifying] =
		useState(false);
	const [isVerified, setIsVerified] =
		useState(false);
	const { translate } = useLanguage();

	const handleVerifyEmail = useCallback(
		async (token: string) => {
			setIsVerifying(true);
			setError("");
			setMessage("");

			try {
				const apiUrl =
					typeof window !== "undefined"
						? `${window.location.protocol}//${window.location.host}/api`
						: process.env.NEXT_PUBLIC_API_URL ||
						  "https://visionoftrading.com/api";

				const response = await fetch(
					`${apiUrl}/auth/verify-email/${token}`,
					{
						method: "GET",
						headers: {
							"Content-Type": "application/json",
						},
					},
				);

				if (response.ok) {
					const data = await response.json();
					setIsVerified(true);
					setMessage(
						data.message ||
							translate({
								ru: "Email успешно подтверждён! Теперь вы можете войти в систему.",
								en: "Email verified successfully! You can now sign in.",
							}),
					);

					// Перенаправляем на страницу входа через 3 секунды
					setTimeout(() => {
						router.push("/auth/login");
					}, 3000);
				} else {
					const data = await response.json();
					setError(
						data.detail ||
							translate({
								ru: "Ошибка подтверждения email. Ссылка может быть недействительной.",
								en: "Email verification failed. The link may be invalid.",
							}),
					);
				}
			} catch (err) {
				setError(
					translate({
						ru: "Ошибка соединения с сервером",
						en: "Server connection error",
					}),
				);
			} finally {
				setIsVerifying(false);
			}
		},
		[router, translate],
	);

	useEffect(() => {
		// Проверяем, есть ли токен в URL
		const token = searchParams?.get("token");
		const emailParam = searchParams?.get("email");

		if (emailParam) {
			setEmail(emailParam);
			setMessage(
				translate({
					ru: `Письмо с подтверждением отправлено на ${emailParam}. Проверьте почту и перейдите по ссылке для активации аккаунта.`,
					en: `A confirmation email has been sent to ${emailParam}. Check your inbox and follow the link to activate your account.`,
				}),
			);
		}

		// Автоматически верифицируем email, если есть токен
		if (token && !isVerified && !isVerifying) {
			handleVerifyEmail(token);
		}
	}, [
		searchParams,
		isVerified,
		isVerifying,
		handleVerifyEmail,
	]);

	const handleResendEmail = async () => {
		if (!email) return;

		try {
			const apiUrl =
				typeof window !== "undefined"
					? `${window.location.protocol}//${window.location.host}/api`
					: process.env.NEXT_PUBLIC_API_URL ||
					  "https://visionoftrading.com/api";

			const response = await fetch(
				`${apiUrl}/auth/resend-verification`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email }),
				},
			);

			if (response.ok) {
				setMessage(
					translate({
						ru: "Письмо с подтверждением отправлено повторно.",
						en: "A confirmation email has been resent.",
					}),
				);
				setError("");
			} else {
				const data = await response.json();
				setError(
					data.detail ||
						translate({
							ru: "Ошибка отправки письма",
							en: "Failed to send email",
						}),
				);
			}
		} catch (err) {
			setError(
				translate({
					ru: "Ошибка соединения",
					en: "Connection error",
				}),
			);
		}
	};

	// Показываем загрузку во время верификации
	if (isVerifying) {
		return (
			<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
				<div className="max-w-md w-full">
					<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
						<div className="text-center">
							<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
							<p className="text-white text-sm">
								{translate({
									ru: "Подтверждение email...",
									en: "Verifying email...",
								})}
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center px-6">
			<div className="max-w-md w-full">
				<div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
							{isVerified ? (
								<svg
									className="w-8 h-8 text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							) : (
								<svg
									className="w-8 h-8 text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							)}
						</div>
						<h1 className="text-2xl font-light text-white mb-2">
							{isVerified
								? translate({
										ru: "Email подтверждён!",
										en: "Email verified!",
								  })
								: translate({
										ru: "Подтверждение email",
										en: "Email verification",
								  })}
						</h1>
						<p className="text-white/60 text-sm">
							{isVerified
								? translate({
										ru: "Перенаправление на страницу входа...",
										en: "Redirecting to login...",
								  })
								: translate({
										ru: "Проверьте почту, чтобы завершить регистрацию",
										en: "Check your email to finish registration",
								  })}
						</p>
					</div>

					{message && (
						<div
							className={`border rounded-lg p-4 mb-6 ${
								isVerified
									? "bg-green-500/10 border-green-500/20"
									: "bg-blue-500/10 border-blue-500/20"
							}`}
						>
							<p
								className={`text-sm ${
									isVerified
										? "text-green-300"
										: "text-blue-300"
								}`}
							>
								{message}
							</p>
						</div>
					)}

					{error && (
						<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
							<p className="text-red-300 text-sm">
								{error}
							</p>
						</div>
					)}

					{!isVerified && (
						<div className="space-y-4">
							{email && (
								<button
									onClick={handleResendEmail}
									className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 py-3 px-4 rounded-lg transition-colors text-sm"
								>
									{translate({
										ru: "Отправить письмо повторно",
										en: "Resend email",
									})}
								</button>
							)}

							<Link
								href="/auth/login"
								className="block w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg transition-colors text-center text-sm"
							>
								{translate({
									ru: "Вернуться к входу",
									en: "Return to login",
								})}
							</Link>
						</div>
					)}

					<div className="mt-8 pt-6 border-t border-white/10">
						<p className="text-white/40 text-xs text-center">
							{translate({
								ru: "После подтверждения email вы сможете войти в систему и настроить Pocket Option",
								en: "After verifying your email you can sign in and configure Pocket Option",
							})}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<LanguageProvider>
			<VerifyEmailPageContent />
		</LanguageProvider>
	);
}

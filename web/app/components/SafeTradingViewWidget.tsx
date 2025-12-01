"use client";

import {
	useEffect,
	useRef,
	memo,
	useState,
	useCallback,
	useMemo,
} from "react";
import { useLanguage } from "./LanguageSwitcher";

interface SafeTradingViewWidgetProps {
	symbol: string;
	timeframe?: string;
	className?: string;
}

function SafeTradingViewWidget({
	symbol,
	timeframe = "5",
	className = "",
}: SafeTradingViewWidgetProps) {
	const container = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<
		string | null
	>(null);
	const [widgetLoaded, setWidgetLoaded] =
		useState(false);
	const widgetInstanceRef = useRef<any>(null);
	const { translate } = useLanguage();

	const errorMessage = useMemo(() => {
		if (!error) return null;

		const messages: Record<
			string,
			{ ru: string; en: string }
		> = {
			load_failed: {
				ru: "Не удалось загрузить виджет TradingView.",
				en: "Failed to load the TradingView widget.",
			},
			create_error: {
				ru: "Ошибка при создании виджета TradingView.",
				en: "Error creating the TradingView widget.",
			},
		};

		return translate(
			messages[error] || { ru: error, en: error },
		);
	}, [error, translate]);

	const loadWidget = useCallback(async () => {
		if (!container.current) return;

		try {
			setIsLoading(true);
			setError(null);
			setWidgetLoaded(false);

			// Очищаем контейнер безопасно
			if (container.current) {
				container.current.innerHTML = "";
			}

			// Проверяем, что контейнер все еще в DOM
			if (
				!container.current ||
				!container.current.parentNode
			) {
				return;
			}

			// Создаем уникальный ID
			const widgetId = `tv_${symbol}_${timeframe}_${Date.now()}`;

			// Создаем контейнер для виджета
			const widgetContainer =
				document.createElement("div");
			widgetContainer.id = widgetId;
			widgetContainer.style.width = "100%";
			widgetContainer.style.height = "100%";

			// Добавляем контейнер
			container.current.appendChild(widgetContainer);

			// Проверяем, что контейнер все еще существует
			if (
				!container.current ||
				!container.current.parentNode
			) {
				return;
			}

			// Проверяем, есть ли уже загруженный скрипт TradingView
			let script = document.querySelector(
				'script[src*="embed-widget-advanced-chart.js"]',
			) as HTMLScriptElement;

			if (!script) {
				script = document.createElement("script");
				script.type = "text/javascript";
				script.src =
					"https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
				script.async = true;
				script.crossOrigin = "anonymous";

				script.onerror = () => {
					setError("load_failed");
					setIsLoading(false);
				};

				script.onload = () => {
					// Ждем немного, чтобы скрипт полностью загрузился
					setTimeout(() => {
						try {
							// Проверяем, что контейнер все еще существует
							if (
								container.current &&
								container.current.parentNode &&
								widgetContainer.parentNode
							) {
								const config = {
									autosize: true,
									symbol: `FX:${symbol}`,
									interval: timeframe,
									timezone: "Etc/UTC",
									theme: "dark",
									style: "1",
									locale: "en",
									enable_publishing: false,
									allow_symbol_change: true,
									support_host:
										"https://www.tradingview.com",
									backgroundColor: "rgba(19, 23, 34, 1)",
									gridColor: "rgba(42, 46, 57, 0.06)",
									hide_top_toolbar: false,
									hide_legend: false,
									save_image: false,
									calendar: false,
									studies: [],
									container_id: widgetId,
								};

								// Используем глобальную функцию TradingView, если она доступна
								if (
									typeof (window as any).TradingView !==
									"undefined"
								) {
									widgetInstanceRef.current = new (
										window as any
									).TradingView.widget(config);
								} else {
									// Fallback - создаем скрипт с конфигурацией
									const configScript =
										document.createElement("script");
									configScript.type = "text/javascript";
									configScript.innerHTML = `new TradingView.widget(${JSON.stringify(
										config,
									)});`;
									widgetContainer.appendChild(
										configScript,
									);
								}

								setWidgetLoaded(true);
								setIsLoading(false);
							}
						} catch (err) {
							console.error(
								"Error creating TradingView widget:",
								err,
							);
							setError("create_error");
							setIsLoading(false);
						}
					}, 500);
				};

				document.head.appendChild(script);
			} else {
				// Скрипт уже загружен, создаем виджет сразу
				setTimeout(() => {
					try {
						if (
							container.current &&
							container.current.parentNode &&
							widgetContainer.parentNode
						) {
							const config = {
								autosize: true,
								symbol: `FX:${symbol}`,
								interval: timeframe,
								timezone: "Etc/UTC",
								theme: "dark",
								style: "1",
								locale: "en",
								enable_publishing: false,
								allow_symbol_change: true,
								support_host:
									"https://www.tradingview.com",
								backgroundColor: "rgba(19, 23, 34, 1)",
								gridColor: "rgba(42, 46, 57, 0.06)",
								hide_top_toolbar: false,
								hide_legend: false,
								save_image: false,
								calendar: false,
								studies: [],
								container_id: widgetId,
							};

							if (
								typeof (window as any).TradingView !==
								"undefined"
							) {
								widgetInstanceRef.current = new (
									window as any
								).TradingView.widget(config);
							} else {
								const configScript =
									document.createElement("script");
								configScript.type = "text/javascript";
								configScript.innerHTML = `new TradingView.widget(${JSON.stringify(
									config,
								)});`;
								widgetContainer.appendChild(configScript);
							}

							setWidgetLoaded(true);
							setIsLoading(false);
						}
					} catch (err) {
						console.error(
							"Error creating TradingView widget:",
							err,
						);
						setError("create_error");
						setIsLoading(false);
					}
				}, 100);
			}
		} catch (err) {
			setError("load_failed");
			setIsLoading(false);
			console.error(
				"TradingView widget error:",
				err,
			);
		}
	}, [symbol, timeframe]);

	const cleanup = useCallback(() => {
		try {
			// Очищаем виджет, если он был создан
			if (
				widgetInstanceRef.current &&
				typeof widgetInstanceRef.current.remove ===
					"function"
			) {
				widgetInstanceRef.current.remove();
			}

			// Очищаем контейнер
			if (container.current) {
				container.current.innerHTML = "";
			}

			widgetInstanceRef.current = null;
		} catch (error) {
			console.error("Cleanup error:", error);
		}
	}, []);

	useEffect(() => {
		loadWidget();
		return cleanup;
	}, [loadWidget, cleanup]);

	if (error) {
		return (
			<div
				className={`tradingview-widget-container ${className}`}
				style={{ height: "100%", width: "100%" }}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						background:
							"linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)",
						border: "1px solid #EF4444",
						borderRadius: "8px",
						color: "#FCA5A5",
						fontFamily: "Inter, system-ui, sans-serif",
					}}
				>
					<div
						style={{
							textAlign: "center",
							padding: "20px",
						}}
					>
						<div
							style={{
								fontSize: "48px",
								marginBottom: "16px",
							}}
						>
							⚠️
						</div>
						<div
							style={{
								fontSize: "18px",
								fontWeight: "500",
								marginBottom: "8px",
								color: "#FCA5A5",
							}}
						>
							{translate({
								ru: "Ошибка графика",
								en: "Chart Error",
							})}
						</div>
						<div
							style={{
								fontSize: "14px",
								marginBottom: "16px",
							}}
						>
							{errorMessage}
						</div>
						<button
							onClick={loadWidget}
							style={{
								padding: "8px 16px",
								background: "#3B82F6",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
								fontSize: "14px",
							}}
						>
							{translate({
								ru: "Повторить",
								en: "Retry",
							})}
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className={`tradingview-widget-container ${className}`}
			style={{ height: "100%", width: "100%" }}
		>
			{(isLoading || !widgetLoaded) && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						background:
							"linear-gradient(135deg, #1a1f2e 0%, #0f1419 100%)",
						border: "1px solid #374151",
						borderRadius: "8px",
						color: "#9CA3AF",
						fontFamily: "Inter, system-ui, sans-serif",
					}}
				>
					<div
						style={{
							textAlign: "center",
							padding: "20px",
						}}
					>
						<div
							style={{
								fontSize: "48px",
								marginBottom: "16px",
							}}
						>
							📊
						</div>
						<div
							style={{
								fontSize: "18px",
								fontWeight: "500",
								marginBottom: "8px",
								color: "#E5E7EB",
							}}
						>
							{translate({
								ru: "График TradingView",
								en: "TradingView Chart",
							})}
						</div>
						<div
							style={{
								fontSize: "14px",
								marginBottom: "4px",
							}}
						>
							{translate({
								ru: "Инструмент",
								en: "Symbol",
							})}
							: {symbol}
						</div>
						<div
							style={{
								fontSize: "14px",
								marginBottom: "16px",
							}}
						>
							{translate({
								ru: "Таймфрейм",
								en: "Timeframe",
							})}
							: {timeframe}m
						</div>
						<div
							style={{ fontSize: "12px", opacity: 0.7 }}
						>
							{translate({
								ru: "Загрузка графика...",
								en: "Loading chart...",
							})}
						</div>
					</div>
				</div>
			)}
			<div
				ref={container}
				style={{
					height: "calc(100% - 32px)",
					width: "100%",
				}}
			/>
			<div
				className="tradingview-widget-copyright"
				style={{
					padding: "8px",
					textAlign: "center",
				}}
			>
				<a
					href="https://www.tradingview.com/"
					rel="noopener nofollow"
					target="_blank"
					style={{
						color: "#3B82F6",
						textDecoration: "none",
						fontSize: "12px",
					}}
				>
					Track all markets on TradingView
				</a>
			</div>
		</div>
	);
}

export default memo(SafeTradingViewWidget);

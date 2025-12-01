"use client";

import {
	useEffect,
	useRef,
	memo,
	useState,
	useMemo,
} from "react";
import { useLanguage } from "./LanguageSwitcher";

interface TradingViewWidgetProps {
	symbol: string;
	timeframe?: string;
	className?: string;
}

function TradingViewWidget({
	symbol,
	timeframe = "5",
	className = "",
}: TradingViewWidgetProps) {
	const container = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<
		string | null
	>(null);
	const { translate } = useLanguage();

	const errorMessage = useMemo(() => {
		if (!error) return null;

		const messages: Record<
			string,
			{ ru: string; en: string }
		> = {
			load_timeout: {
				ru: "Виджет загружается слишком долго. Обновите страницу.",
				en: "The widget is taking too long to load. Please refresh the page.",
			},
			load_failed: {
				ru: "Не удалось загрузить график TradingView.",
				en: "Failed to load the TradingView chart.",
			},
			widget_error: {
				ru: "Ошибка при создании виджета TradingView.",
				en: "Error creating the TradingView widget.",
			},
		};

		return translate(
			messages[error] || { ru: error, en: error },
		);
	}, [error, translate]);

	useEffect(() => {
		if (!container.current) return;

		const loadWidget = () => {
			try {
				setIsLoading(true);
				setError(null);

				// Очищаем контейнер
				if (container.current) {
					container.current.innerHTML = "";
				}

				// Создаем iframe с TradingView
				const iframe =
					document.createElement("iframe");
				iframe.src = `https://www.tradingview.com/widgetembed/?symbol=FX%3A${symbol}&interval=${timeframe}&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en&utmsource=www.tradingview.com&utmmedium=widget_new&utm_campaign=chart&utmterm=FX%3A${symbol}`;
				iframe.style.width = "100%";
				iframe.style.height = "100%";
				iframe.style.border = "none";
				iframe.style.borderRadius = "8px";
				iframe.frameBorder = "0";
				(iframe as any).allowTransparency = true;
				iframe.scrolling = "no";
				iframe.allow = "clipboard-write";

				// Таймаут для загрузки
				const loadTimeout = setTimeout(() => {
					if (isLoading) {
						setError("load_timeout");
						setIsLoading(false);
					}
				}, 10000);

				iframe.onload = () => {
					clearTimeout(loadTimeout);
					setIsLoading(false);
					setError(null);
				};

				iframe.onerror = () => {
					clearTimeout(loadTimeout);
					setError("load_failed");
					setIsLoading(false);
				};

				// Добавляем iframe в контейнер
				if (container.current) {
					container.current.appendChild(iframe);
				}
			} catch (err) {
				setError("widget_error");
				setIsLoading(false);
				console.error(
					"TradingView widget error:",
					err,
				);
			}
		};

		// Задержка для загрузки
		const timeoutId = setTimeout(loadWidget, 100);

		return () => {
			clearTimeout(timeoutId);
			if (container.current) {
				container.current.innerHTML = "";
			}
		};
	}, [symbol, timeframe]);

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
						minHeight: "300px",
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
							onClick={() => window.location.reload()}
							style={{
								padding: "12px 20px",
								background: "#3B82F6",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
								fontSize: "16px",
							}}
						>
							{translate({
								ru: "Перезагрузить страницу",
								en: "Reload Page",
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
			{isLoading && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						minHeight: "300px",
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
								ru: "Загрузка графика TradingView",
								en: "Loading TradingView Chart",
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
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
					</div>
				</div>
			)}
			<div
				ref={container}
				style={{ height: "100%", width: "100%" }}
			/>
		</div>
	);
}

export default memo(TradingViewWidget);

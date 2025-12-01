"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
	ArrowUpIcon,
	ArrowDownIcon,
	ClockIcon,
	CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useLanguage } from "./LanguageSwitcher";

interface Signal {
	id: number;
	symbol: string;
	tf: string;
	direction: "UP" | "DOWN";
	enter_at: string;
	expire_at: string;
	generated_at: string;
	confidence?: number;
}

interface SignalCardProps {
	signal: Signal | null;
	isLoading?: boolean;
}

export default function SignalCard({
	signal,
	isLoading,
}: SignalCardProps) {
	const [timeLeft, setTimeLeft] =
		useState<string>("");
	const [isExpired, setIsExpired] =
		useState(false);
	const { t, translate, language } = useLanguage();

	const formatTime = (date: Date): string => {
		const hours = date
			.getHours()
			.toString()
			.padStart(2, "0");
		const minutes = date
			.getMinutes()
			.toString()
			.padStart(2, "0");
		const seconds = date
			.getSeconds()
			.toString()
			.padStart(2, "0");
		return `${hours}:${minutes}:${seconds}`;
	};

	useEffect(() => {
		if (!signal) return;

		const updateTimer = () => {
			try {
				const now = new Date();
				const expireAt = new Date(signal.expire_at);
				const enterAt = new Date(signal.enter_at);

				// Проверка на валидность дат
				if (
					isNaN(expireAt.getTime()) ||
					isNaN(enterAt.getTime())
				) {
					setIsExpired(true);
					setTimeLeft(
						translate({
							ru: "Некорректная дата",
							en: "Invalid date",
						}),
					);
					return;
				}

				if (now >= expireAt) {
					setIsExpired(true);
					setTimeLeft(
						translate({
							ru: "Сигнал истёк",
							en: "Signal expired",
						}),
					);
					return;
				}

				if (now < enterAt) {
					const timeToEnter =
						enterAt.getTime() - now.getTime();
					const minutes = Math.floor(
						timeToEnter / 60000,
					);
					const seconds = Math.floor(
						(timeToEnter % 60000) / 1000,
					);
					setTimeLeft(
						translate({
							ru: `Старт через ${minutes}:${seconds
								.toString()
								.padStart(2, "0")}`,
							en: `Starts in ${minutes}:${seconds
								.toString()
								.padStart(2, "0")}`,
						}),
					);
				} else {
					const timeToExpire =
						expireAt.getTime() - now.getTime();
					const minutes = Math.floor(
						timeToExpire / 60000,
					);
					const seconds = Math.floor(
						(timeToExpire % 60000) / 1000,
					);
					setTimeLeft(
						translate({
							ru: `${minutes}:${seconds
								.toString()
								.padStart(2, "0")} осталось`,
							en: `${minutes}:${seconds
								.toString()
								.padStart(2, "0")} left`,
						}),
					);
				}
			} catch (error) {
				console.error("Error updating timer:", error);
				setIsExpired(true);
				setTimeLeft(
					translate({
						ru: "Ошибка",
						en: "Error",
					}),
				);
			}
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);

		return () => clearInterval(interval);
	}, [signal, translate]);

	if (isLoading) {
		return (
			<div className="card animate-pulse">
				<div className="flex items-center justify-between mb-4">
					<div className="h-6 bg-gray-200 rounded w-24"></div>
					<div className="h-6 bg-gray-200 rounded w-16"></div>
				</div>
				<div className="space-y-3">
					<div className="h-4 bg-gray-200 rounded w-full"></div>
					<div className="h-4 bg-gray-200 rounded w-3/4"></div>
					<div className="h-4 bg-gray-200 rounded w-1/2"></div>
				</div>
			</div>
		);
	}

	if (!signal) {
		return (
			<div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 p-8 text-center">
				<div className="text-gray-300 mb-4">
					<ClockIcon className="h-12 w-12 mx-auto mb-2 animate-pulse text-gray-400" />
					<p className="text-lg font-medium text-white">
						{t("getting_signal")}
					</p>
					<p className="text-sm text-gray-400">
						{t("loading_data")}
					</p>
				</div>
			</div>
		);
	}

	const isUp = signal.direction === "UP";
	const signalClass = isUp
		? "signal-up"
		: "signal-down";
	const Icon = isUp ? ArrowUpIcon : ArrowDownIcon;

	return (
		<div
			className={`bg-[#0f1419] rounded-xl shadow-2xl border-2 p-6 ${
				isUp
					? "border-green-500/30"
					: "border-red-500/30"
			}`}
		>
			{/* Signal Direction Badge - Психологические цвета */}
			<div className="flex justify-center mb-6">
				<div
					className={`px-8 py-4 rounded-lg font-medium text-white flex items-center gap-3 shadow-lg ${
						isUp
							? "bg-green-600/90 hover:bg-green-600"
							: "bg-red-600/90 hover:bg-red-600"
					} transition-all duration-200`}
				>
					<Icon className="h-7 w-7" />
					<span className="text-xl font-light tracking-wide">
						{signal.direction}
					</span>
				</div>
			</div>

			{/* Symbol and Timeframe */}
			<div className="text-center mb-8">
				<h2 className="text-3xl font-light text-white mb-3 tracking-tight">
					{signal.symbol}
				</h2>
				<div className="inline-block bg-gray-800/50 text-gray-300 px-4 py-1.5 rounded-full text-sm font-light">
					{signal.tf}
				</div>
			</div>

			{/* Signal Details */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				<div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800">
					<div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-light">
						{t("enter_time")}
					</div>
					<div className="font-light text-white text-base">
						{(() => {
							try {
								const date = new Date(signal.enter_at);
								return isNaN(date.getTime())
									? translate({
											ru: "Нет данных",
											en: "N/A",
									  })
									: formatTime(date);
							} catch {
								return translate({
									ru: "Нет данных",
									en: "N/A",
								});
							}
						})()}
					</div>
				</div>
				<div className="bg-[#1a1f2e] rounded-lg p-4 border border-gray-800">
					<div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-light">
						{t("expire_time")}
					</div>
					<div className="font-light text-white text-base">
						{(() => {
							try {
								const date = new Date(signal.expire_at);
								return isNaN(date.getTime())
									? translate({
											ru: "Нет данных",
											en: "N/A",
									  })
									: formatTime(date);
							} catch {
								return translate({
									ru: "Нет данных",
									en: "N/A",
								});
							}
						})()}
					</div>
				</div>
			</div>

			{/* Timer - Психологические цвета */}
			<div
				className={`flex items-center justify-between p-4 rounded-lg text-white border-2 ${
					isExpired
						? "bg-[#1a1f2e] border-gray-700"
						: isUp
						? "bg-[#1a1f2e] border-green-500/40 shadow-lg shadow-green-500/10"
						: "bg-[#1a1f2e] border-red-500/40 shadow-lg shadow-red-500/10"
				}`}
			>
				<div className="flex items-center gap-3">
					{isExpired ? (
						<>
							<CheckCircleIcon className="h-5 w-5 text-gray-500" />
							<span className="text-gray-400 font-light">
								{t("signal_expired")}
							</span>
						</>
					) : (
						<>
							<ClockIcon
								className={`h-5 w-5 ${
									isUp ? "text-green-400" : "text-red-400"
								}`}
							/>
							<span className="text-white font-light text-base">
								{timeLeft}
							</span>
						</>
					)}
				</div>

				{!isExpired && (
					<div
						className={`text-xs font-light uppercase tracking-wider ${
							isUp ? "text-green-400" : "text-red-400"
						}`}
					>
						{new Date(signal.enter_at) <= new Date()
							? t("signal_active")
							: translate({
									ru: "Ожидание",
									en: "Pending",
							  })}
					</div>
				)}
			</div>

			{/* Status Indicator */}
			<div className="mt-4 flex items-center justify-center gap-2">
				<div
					className={`w-2 h-2 rounded-full animate-pulse ${
						isExpired
							? "bg-gray-600"
							: isUp
							? "bg-green-500"
							: "bg-red-500"
					}`}
				></div>
				<span
					className={`text-xs font-light uppercase tracking-wider ${
						isExpired
							? "text-gray-500"
							: isUp
							? "text-green-400"
							: "text-red-400"
					}`}
				>
					{isExpired
						? t("signal_completed")
						: t("signal_active")}
				</span>
			</div>
		</div>
	);
}

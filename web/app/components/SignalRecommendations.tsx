"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "./LanguageSwitcher";

interface Signal {
	direction: "UP" | "DOWN";
	tf: string;
}

interface SignalRecommendationsProps {
	signal: Signal | null;
}

export default function SignalRecommendations({
	signal,
}: SignalRecommendationsProps) {
	const { translate } = useLanguage();

	if (!signal) return null;

	const isUp = signal.direction === "UP";
	const titleText = isUp
		? translate({
				ru: "Сезонный фактор подталкивает цену к росту.",
				en: "Seasonal factor pushes the price upward.",
		  })
		: translate({
				ru: "Сезонный фактор подталкивает цену к падению.",
				en: "Seasonal factor pushes the price downward.",
		  });

	const recommendations = [
		translate({
			ru: "Открывайте сделки только после подтверждения сигнала на графике.",
			en: "Enter trades only after the signal is confirmed on the chart.",
		}),
		translate({
			ru: "Рекомендуемое количество сделок: 1-2 подряд.",
			en: "Recommended number of trades: 1-2 in a row.",
		}),
		translate({
			ru: "Используйте стратегию управления капиталом.",
			en: "Follow your capital management strategy.",
		}),
	];

	return (
		<div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
			<div className="flex items-start gap-3">
				<div className="flex-shrink-0">
					<InformationCircleIcon className="h-6 w-6 text-blue-600" />
				</div>
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-gray-900 mb-3">
						{translate({ ru: "ИНФО", en: "INFO" })}:{" "}
						{titleText}
					</h3>
					<ul className="space-y-2">
						{recommendations.map((rec, index) => (
							<li
								key={index}
								className="text-sm text-gray-700 flex items-start gap-2"
							>
								<span className="text-blue-600 mt-1">
									•
								</span>
								<span>{rec}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}

import { useEffect, useRef } from 'react';
import { Symbol, TimeFrame } from '@/types/signal';

interface TVChartProps {
  symbol: Symbol;
  timeframe: TimeFrame;
}

const TVChart = ({ symbol, timeframe }: TVChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Очищаем контейнер
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && (window as any).TradingView) {
        // Создаем уникальный ID для каждого виджета
        const widgetId = `tradingview_widget_${symbol}_${timeframe}`;
        
        // Создаем контейнер для виджета
        const widgetContainer = document.createElement('div');
        widgetContainer.id = widgetId;
        widgetContainer.style.width = '100%';
        widgetContainer.style.height = '100%';
        containerRef.current.appendChild(widgetContainer);

        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `FX:${symbol}`,
          interval: timeframe.replace('m', ''),
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'ru',
          toolbar_bg: '#1a1d26',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: widgetId,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
        });
      }
    };

    // Удаляем старый скрипт если есть
    const oldScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (oldScript) {
      oldScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, timeframe]);

  return (
    <div className="bg-gradient-card rounded-2xl shadow-card border border-border overflow-hidden">
      <div className="h-[500px] lg:h-[600px]" ref={containerRef}>
      </div>
    </div>
  );
};

export default TVChart;

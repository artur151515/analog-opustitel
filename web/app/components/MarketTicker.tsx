'use client';

import React, { useEffect, useState } from 'react';

const marketData = [
  { symbol: 'EUR/USD', price: '1.0850', change: '+0.0015', trend: 'up' },
  { symbol: 'GBP/JPY', price: '189.23', change: '-0.10', trend: 'down' },
  { symbol: 'USD/CAD', price: '1.3678', change: '+0.0005', trend: 'up' },
  { symbol: 'AUD/NZD', price: '1.0987', change: '-0.0020', trend: 'down' },
  { symbol: 'XAU/USD', price: '2350.10', change: '+5.20', trend: 'up' },
  { symbol: 'BTC/USD', price: '70123.45', change: '+123.45', trend: 'up' },
  { symbol: 'ETH/USD', price: '3890.70', change: '-10.50', trend: 'down' },
];

const MarketTicker: React.FC = () => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const tickerSpeed = 0.5;
    const animationFrame = requestAnimationFrame(function animate() {
      setOffset(prevOffset => {
        const newOffset = prevOffset - tickerSpeed;
        if (newOffset < -1000) return 0;
        return newOffset;
      });
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="relative w-full h-12 overflow-hidden bg-black py-3 z-50">
      <div className="absolute whitespace-nowrap flex items-center h-full" style={{ transform: `translateX(${offset}px)` }}>
        {Array(3).fill(marketData).flat().map((item, index) => (
          <span key={index} className="inline-flex items-center mx-6 bg-white px-8 py-1 rounded-full shadow-xl">
            <span className="font-black mr-4 text-2xl text-black">{item.symbol}</span>
            <span className="mr-4 text-blue-600 text-xl font-bold">{item.price}</span>
            <span className={`${item.trend === 'up' ? 'text-green-600' : 'text-red-600'} font-black text-xl`}>
              {item.change}
            </span>
            {item.trend === 'up' ? (
              <svg className="w-7 h-7 ml-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg className="w-7 h-7 ml-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;

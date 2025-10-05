import { useState, useEffect, useCallback, useRef } from 'react';
import { Signal, Stats } from '@/types/signal';
import { toast } from 'sonner';

const MOCK_SIGNAL: Signal = {
  id: 1,
  symbol: 'CADJPY',
  tf: '5m',
  direction: 'UP',
  confidence: 63.5,
  enter_at: new Date(Date.now() + 60000).toISOString(),
  expire_at: new Date(Date.now() + 360000).toISOString(),
  generated_at: new Date().toISOString(),
};

const MOCK_STATS: Stats = {
  symbol: 'CADJPY',
  tf: '5m',
  winrate_last_n: 58.2,
  n: 200,
  break_even_at: 54.05,
  signals_count: 1247,
  wins: 116,
  losses: 83,
  skips: 1,
};

export const useSignalData = (symbol: string, tf: string, apiUrl?: string) => {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setLoading(true);
      setError(null);

      const baseUrl = apiUrl || 'http://localhost:8000';
      
      const [signalRes, statsRes] = await Promise.all([
        fetch(`${baseUrl}/api/signal?symbol=${symbol}&tf=${tf}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${baseUrl}/api/stats?symbol=${symbol}&tf=${tf}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (signalRes.status === 404 || !signalRes.ok) {
        setSignal(null);
      } else {
        const signalData = await signalRes.json();
        setSignal(signalData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      
      console.error('API Error:', err);
      setError('Ошибка подключения к API');
      // Не показываем демо-данные, оставляем null
      setSignal(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [symbol, tf, apiUrl]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { signal, stats, loading, error, refetch: fetchData };
};

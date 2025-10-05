import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Signal } from '@/types/signal';

interface SignalCardProps {
  signal: Signal | null;
}

const SignalCard = ({ signal }: SignalCardProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!signal) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expire = new Date(signal.expire_at).getTime();
      const enter = new Date(signal.enter_at).getTime();
      const totalDuration = expire - enter;
      const remaining = Math.max(0, expire - now);
      const progressPercent = ((totalDuration - remaining) / totalDuration) * 100;

      setTimeLeft(remaining);
      setProgress(Math.min(100, progressPercent));

      if (remaining <= 0) {
        // Trigger refresh when expired
        window.location.reload();
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [signal]);

  if (!signal) {
    return (
      <div className="bg-gradient-card rounded-2xl p-6 shadow-card border border-border">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">
            Сигнала нет на последнем закрытии
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Ожидайте следующее обновление...
          </p>
        </div>
      </div>
    );
  }

  const isUp = signal.direction === 'UP';
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div
      className={`bg-gradient-card rounded-2xl p-6 shadow-card border-2 transition-all duration-300 ${
        isUp ? 'border-success shadow-glow' : 'border-destructive shadow-glow'
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isUp ? (
            <TrendingUp className="w-8 h-8 text-success" />
          ) : (
            <TrendingDown className="w-8 h-8 text-destructive" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">Направление</p>
            <p
              className={`text-2xl font-bold ${
                isUp ? 'text-success' : 'text-destructive'
              }`}
            >
              {isUp ? 'ВВЕРХ' : 'ВНИЗ'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Уверенность</p>
          <p className="text-2xl font-bold text-foreground">
            {signal.confidence.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Вход</p>
            <p className="text-sm font-medium">
              {new Date(signal.enter_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">Экспирация</p>
            <p className="text-sm font-medium">
              {new Date(signal.expire_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">До экспирации</p>
            <p className="text-lg font-bold text-foreground">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isUp ? 'bg-success' : 'bg-destructive'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;

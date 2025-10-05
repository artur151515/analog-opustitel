import { BarChart3, TrendingUp, Target } from 'lucide-react';
import { Stats } from '@/types/signal';

interface StatsPanelProps {
  stats: Stats | null;
}

const StatsPanel = ({ stats }: StatsPanelProps) => {
  if (!stats) {
    return (
      <div className="bg-gradient-card rounded-2xl p-6 shadow-card border border-border">
        <div className="text-center py-4">
          <p className="text-muted-foreground">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-card rounded-2xl p-6 shadow-card border border-border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Статистика
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <p className="text-xs text-muted-foreground">Winrate</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.winrate_last_n.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            За последние {stats.n} сигналов
          </p>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-warning" />
            <p className="text-xs text-muted-foreground">Break-Even</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.break_even_at.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            При payout 85%
          </p>
        </div>

        <div className="bg-secondary/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Всего сигналов</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.signals_count.toLocaleString('ru-RU')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            С начала работы
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;

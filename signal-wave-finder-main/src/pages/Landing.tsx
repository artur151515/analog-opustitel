import { useNavigate } from 'react-router-dom';
import { ArrowRight, Info, TrendingUp, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WavesBackground from '@/components/ui/waves-background';
import Disclaimer from '@/components/Disclaimer';
import TfSelector from '@/components/TfSelector';
import { useState, useEffect } from 'react';
import { TimeFrame } from '@/types/signal';

const Landing = () => {
  const navigate = useNavigate();
  const [selectedTf, setSelectedTf] = useState<TimeFrame>('5m');

  useEffect(() => {
    const saved = localStorage.getItem('selectedTf');
    if (saved) setSelectedTf(saved as TimeFrame);
  }, []);

  const handleNavigate = () => {
    localStorage.setItem('selectedTf', selectedTf);
    navigate('/signals');
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <WavesBackground />

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-16">
        {/* Header */}
        <header className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-foreground">Opustoshitel</h1>
          <Button variant="outline" size="sm" className="gap-2">
            <Info className="w-4 h-4" />
            Справка
          </Button>
        </header>

        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
            Сигналы, которые{' '}
            <span className="text-transparent bg-clip-text bg-gradient-accent">
              ведут к победе
            </span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Профессиональные торговые сигналы для бинарных опционов. Высокая точность,
            автоматическое обновление каждые 10 секунд.
          </p>

          {/* Timeframe Selector */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">Выберите таймфрейм:</p>
            <TfSelector value={selectedTf} onChange={setSelectedTf} />
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            onClick={handleNavigate}
            className="text-lg px-8 py-6 shadow-glow bg-gradient-accent hover:opacity-90"
          >
            Перейти к сигналам
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 max-w-5xl mx-auto">
          <div className="bg-gradient-card rounded-2xl p-6 shadow-card border border-border">
            <TrendingUp className="w-10 h-10 text-success mb-4" />
            <h3 className="text-xl font-semibold mb-2">Высокий Winrate</h3>
            <p className="text-muted-foreground">
              Точность сигналов более 58% на истории из 200+ сделок
            </p>
          </div>

          <div className="bg-gradient-card rounded-2xl p-6 shadow-card border border-border">
            <Zap className="w-10 h-10 text-warning mb-4" />
            <h3 className="text-xl font-semibold mb-2">Быстрое обновление</h3>
            <p className="text-muted-foreground">
              Автоматическое обновление данных каждые 10 секунд
            </p>
          </div>

          <div className="bg-gradient-card rounded-2xl p-6 shadow-card border border-border">
            <Target className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Точная аналитика</h3>
            <p className="text-muted-foreground">
              Полная статистика и расчёт break-even точки для вашей стратегии
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto mb-8">
          <Disclaimer />
        </div>

        {/* Footer */}
        <footer className="text-center text-muted-foreground text-sm">
          <p>© 2025 Opustoshitel. Все права защищены.</p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;

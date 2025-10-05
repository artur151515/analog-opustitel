import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SignalCard from '@/components/SignalCard';
import StatsPanel from '@/components/StatsPanel';
import TVChart from '@/components/TVChart';
import Disclaimer from '@/components/Disclaimer';
import SymbolSelector from '@/components/SymbolSelector';
import TfSelector from '@/components/TfSelector';
import { Symbol, TimeFrame } from '@/types/signal';
import { useSignalData } from '@/hooks/useSignalData';

const Signals = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [symbol, setSymbol] = useState<Symbol>(
    (searchParams.get('symbol') as Symbol) || 'CADJPY'
  );
  const [tf, setTf] = useState<TimeFrame>(
    (searchParams.get('tf') as TimeFrame) || '5m'
  );

  const { signal, stats, loading, error, refetch } = useSignalData(symbol, tf);

  useEffect(() => {
    const savedSymbol = localStorage.getItem('selectedSymbol') as Symbol;
    const savedTf = localStorage.getItem('selectedTf') as TimeFrame;

    if (savedSymbol && !searchParams.get('symbol')) setSymbol(savedSymbol);
    if (savedTf && !searchParams.get('tf')) setTf(savedTf);
  }, []);

  useEffect(() => {
    setSearchParams({ symbol, tf });
    localStorage.setItem('selectedSymbol', symbol);
    localStorage.setItem('selectedTf', tf);
  }, [symbol, tf, setSearchParams]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Торговые сигналы</h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-card/30 backdrop-blur-sm p-4 rounded-2xl border border-border">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Символ</label>
            <SymbolSelector value={symbol} onChange={setSymbol} />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="text-sm text-muted-foreground">Таймфрейм</label>
            <TfSelector value={tf} onChange={setTf} />
          </div>
        </div>

        {error && (
          <div className="bg-warning/10 border border-warning rounded-2xl p-4 mb-6">
            <p className="text-warning text-sm">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Left Column */}
          <div className="space-y-6">
            <SignalCard signal={signal} />
            <StatsPanel stats={stats} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <TVChart symbol={symbol} timeframe={tf} />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mb-8">
          <Disclaimer />
        </div>
      </div>
    </div>
  );
};

export default Signals;

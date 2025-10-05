import { TimeFrame } from '@/types/signal';

interface TfSelectorProps {
  value: TimeFrame;
  onChange: (value: TimeFrame) => void;
}

const timeframes: TimeFrame[] = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];

const TfSelector = ({ value, onChange }: TfSelectorProps) => {
  return (
    <div className="flex gap-2">
      {timeframes.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            value === tf
              ? 'bg-gradient-accent text-primary-foreground shadow-glow'
              : 'bg-secondary text-foreground hover:bg-secondary/80'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
};

export default TfSelector;

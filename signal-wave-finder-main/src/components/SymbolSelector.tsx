import { Symbol } from '@/types/signal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SymbolSelectorProps {
  value: Symbol;
  onChange: (value: Symbol) => void;
}

const symbols: { value: Symbol; label: string }[] = [
  { value: 'CADJPY', label: 'CAD/JPY' },
  { value: 'GBPJPY', label: 'GBP/JPY' },
  { value: 'EURUSD', label: 'EUR/USD' },
  { value: 'GBPUSD', label: 'GBP/USD' },
  { value: 'USDJPY', label: 'USD/JPY' },
  { value: 'EURJPY', label: 'EUR/JPY' },
];

const SymbolSelector = ({ value, onChange }: SymbolSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px] bg-secondary border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {symbols.map((symbol) => (
          <SelectItem key={symbol.value} value={symbol.value}>
            {symbol.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SymbolSelector;

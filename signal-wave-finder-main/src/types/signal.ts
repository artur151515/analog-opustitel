export interface Signal {
  id: number;
  symbol: string;
  tf: string;
  direction: 'UP' | 'DOWN';
  confidence: number | null;
  enter_at: string;
  expire_at: string;
  generated_at: string;
}

export interface Stats {
  symbol: string;
  tf: string;
  winrate_last_n: number;
  n: number;
  break_even_at: number;
  signals_count: number;
  wins: number;
  losses: number;
  skips: number;
}

export interface SymbolsResponse {
  symbols: string[];
  timeframes: string[];
}

export type TimeFrame = '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d';
export type Symbol = 'CADJPY' | 'GBPJPY' | 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'EURJPY';

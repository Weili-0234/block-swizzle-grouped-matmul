export interface SimState {
  step: number;
  cacheA: number[]; // Array of Row Indices in Cache
  cacheB: number[]; // Array of Col Indices in Cache
  hits: number;
  misses: number;
  history: {m: number, n: number, type: 'hit'|'miss'}[];
}

export type MatrixType = 'A' | 'B' | 'C';


export interface SimState {
  step: number; // 0 to TotalOps (schedule.length * K)
  // Cache stores string IDs like "A-0-0" (A[row][k]) or "B-0-0" (B[k][col])
  lruQueue: string[]; 
  
  // Total aggregates
  hits: number;
  misses: number;

  // Specific aggregates for HUD
  hitsA: number;
  missesA: number;
  hitsB: number;
  missesB: number;
}

export type MatrixType = 'A' | 'B' | 'C';

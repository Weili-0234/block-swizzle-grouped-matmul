import React from 'react';
import { MatrixType } from '../types';

interface MatrixGridProps {
  type: MatrixType;
  rows: number;
  cols: number;
  activeRow?: number;
  activeCol?: number;
  activeCell?: { m: number; n: number };
  cacheItems?: number[]; // Rows for A, Cols for B
  title: string;
  cellSize?: number;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  type,
  rows,
  cols,
  activeRow,
  activeCol,
  activeCell,
  cacheItems = [],
  title,
}) => {
  // Dynamic cell sizing based on grid dimensions to fit on screen
  const getCellClass = (r: number, c: number) => {
    const base = "transition-all duration-200 border border-slate-200 rounded-sm";
    
    // Matrix C Logic (The Output)
    if (type === 'C') {
      if (activeCell && activeCell.m === r && activeCell.n === c) {
        return `${base} bg-blue-600 border-blue-700 shadow-[0_0_10px_rgba(37,99,235,0.5)] z-10 scale-110`;
      }
      // Show completed cells
      if (activeCell) {
         // Assuming linear progress, not strictly correct for grouped but good enough for visual history if we tracked it differently.
         // Instead, let's just highlight the active one strongly.
      }
      return `${base} bg-white`;
    }

    // Matrix A Logic (Rows cached)
    if (type === 'A') {
      const isRowActive = activeRow === r;
      const isRowCached = cacheItems.includes(r);
      
      if (isRowActive) {
        return `${base} bg-emerald-500 border-emerald-600 shadow-md`;
      }
      if (isRowCached) {
        return `${base} bg-emerald-100 border-emerald-200`;
      }
      return `${base} bg-white`;
    }

    // Matrix B Logic (Cols cached)
    if (type === 'B') {
      const isColActive = activeCol === c;
      const isColCached = cacheItems.includes(c);

      if (isColActive) {
        return `${base} bg-amber-500 border-amber-600 shadow-md`;
      }
      if (isColCached) {
        return `${base} bg-amber-100 border-amber-200`;
      }
      return `${base} bg-white`;
    }

    return base;
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="mb-2 text-sm font-semibold text-slate-600 uppercase tracking-wider">{title}</h3>
      <div 
        className="grid gap-0.5 p-1 bg-slate-100 rounded-lg shadow-inner border border-slate-200"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          width: 'fit-content'
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className={`w-6 h-6 sm:w-8 sm:h-8 ${getCellClass(r, c)}`}
            />
          ))
        )}
      </div>
    </div>
  );
};
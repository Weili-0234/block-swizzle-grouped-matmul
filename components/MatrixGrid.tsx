import React from 'react';
import { MatrixType } from '../types';

interface Coordinate {
  r: number;
  c: number;
}

interface ActiveCTile {
  m: number;
  n: number;
  kProgress: number;
}

interface MatrixGridProps {
  type: MatrixType;
  rows: number;
  cols: number;
  
  // Highlighting specific tiles (Changed to arrays for parallel CTAs)
  activeTiles?: Coordinate[]; // For A and B
  activeCTiles?: ActiveCTile[]; // For C
  
  cachedTiles?: string[]; // IDs like "A-0-0"
  
  title: string;
}

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  type,
  rows,
  cols,
  activeTiles = [],
  activeCTiles = [],
  cachedTiles = [],
  title,
}) => {
  const getCellAppearance = (r: number, c: number) => {
    // Base: shorter duration (100ms) for snappy fade-outs
    const base = "border rounded-sm flex items-center justify-center relative overflow-hidden transition-all duration-100";
    
    const tileId = `${type}-${r}-${c}`;
    const isCached = cachedTiles.includes(tileId);

    // Matrix C Logic (The Output)
    if (type === 'C') {
      // Check if this tile is in the active list
      const activeState = activeCTiles.find(t => t.m === r && t.n === c);

      if (activeState) {
        // Computing tile: Instant update
        // Using Indigo (Deep Purple/Blue) for the result.
        const alpha = 0.2 + (activeState.kProgress * 0.8);
        
        return {
            className: `${base} !duration-0 border-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)] z-20 scale-110`,
            style: { backgroundColor: `rgba(79, 70, 229, ${alpha})` }
        };
      }
      return { className: `${base} bg-white border-slate-200`, style: {} };
    }

    // Matrix A & B Logic (Inputs)
    // Check if this tile is being accessed by ANY of the active CTAs
    const isActive = activeTiles.some(t => t.r === r && t.c === c);

    if (isActive) {
        // Active Tile:
        // 1. !duration-0: Change color INSTANTLY.
        // 2. Palette: Cyan (A) / Orange (B)
        if (type === 'A') return { 
            className: `${base} !duration-0 bg-cyan-500 border-cyan-600 shadow-lg scale-110 z-30 text-white`, 
            style: {} 
        };
        if (type === 'B') return { 
            className: `${base} !duration-0 bg-orange-500 border-orange-600 shadow-lg scale-110 z-30 text-white`, 
            style: {} 
        };
    }

    if (isCached) {
      // Cached Tile - lighter versions
      if (type === 'A') return { className: `${base} bg-cyan-100 border-cyan-200`, style: {} };
      if (type === 'B') return { className: `${base} bg-orange-100 border-orange-200`, style: {} };
    }

    // Default Inactive
    return { className: `${base} bg-slate-50 border-slate-200 opacity-60`, style: {} };
  };

  return (
    <div className="flex flex-col items-center w-fit">
      <h3 className="mb-2 text-xs md:text-sm font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">{title}</h3>
      
      <div className="flex">
        {/* Row Indices (Left) */}
        <div className="flex flex-col mr-2 pt-[2px]">
             {/* Spacer for col header */}
             <div className="h-4 sm:h-5 mb-1"></div> 
             <div className="grid gap-0.5 p-1 pt-0 border-transparent">
                {Array.from({ length: rows }).map((_, r) => (
                    <div key={`row-${r}`} className="h-6 sm:h-8 flex items-center justify-end text-[10px] text-slate-400 font-mono leading-none">
                        {r}
                    </div>
                ))}
            </div>
        </div>

        {/* Column Indices (Top) & Grid */}
        <div className="flex flex-col">
            <div className="flex ml-1 pl-[2px] mb-1 gap-0.5">
                {Array.from({ length: cols }).map((_, c) => (
                    <div key={`col-${c}`} className="w-6 sm:w-8 text-center text-[10px] text-slate-400 font-mono leading-none">
                        {c}
                    </div>
                ))}
            </div>

            <div 
                className="grid gap-0.5 p-1 bg-slate-200/50 rounded-lg border border-slate-200"
                style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
            >
                {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                    const { className, style } = getCellAppearance(r, c);
                    return (
                        <div
                        key={`${r}-${c}`}
                        className={`w-6 h-6 sm:w-8 sm:h-8 ${className}`}
                        style={style}
                        />
                    );
                })
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
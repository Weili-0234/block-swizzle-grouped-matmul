import React from 'react';
import { SimState } from '../types';

interface StatsPanelProps {
  simState: SimState;
  totalOps: number;
  cacheSize: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ simState, totalOps, cacheSize }) => {
  const { hits, misses, step } = simState;
  const totalAccesses = hits + misses;
  const hitRate = totalAccesses > 0 ? ((hits / totalAccesses) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Simulation Metrics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs text-slate-500 uppercase font-semibold">Micro-Steps</div>
            <div className="text-2xl font-mono text-slate-700">
              {step} <span className="text-sm text-slate-400">/ {totalOps}</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="text-xs text-slate-500 uppercase font-semibold">L2 Cache Size</div>
            <div className="text-2xl font-mono text-slate-700">{cacheSize} <span className="text-sm">tiles</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-600">DRAM Loads (Misses)</span>
          <span className="text-lg font-bold text-red-600">{misses}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-red-500 h-2 transition-all duration-300" 
            style={{ width: `${totalAccesses > 0 ? (misses / totalAccesses) * 100 : 0}%` }}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-medium text-slate-600">L2 Cache Hits</span>
          <span className="text-lg font-bold text-emerald-600">{hits}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-emerald-500 h-2 transition-all duration-300" 
            style={{ width: `${totalAccesses > 0 ? (hits / totalAccesses) * 100 : 0}%` }}
          />
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-slate-100 mt-2">
          <span className="text-sm font-bold text-slate-700">Hit Rate</span>
          <span className="text-xl font-bold text-blue-600">{hitRate}%</span>
        </div>
      </div>

      <div className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-3 mt-4">
        <strong className="text-slate-600">Inner Loop Detail:</strong><br/>
        Visualizing the K-dimension loop.<br/>
        For each Output Tile C[m,n], we iterate k=0..K:<br/>
        1. Load Tile A[m,k]<br/>
        2. Load Tile B[k,n]<br/>
        3. Accumulate
      </div>
    </div>
  );
};
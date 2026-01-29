import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings2 } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStep: () => void;
  speed: number;
  setSpeed: (s: number) => void;
  
  mode: 'row-major' | 'grouped';
  setMode: (m: 'row-major' | 'grouped') => void;
  
  groupSize: number;
  setGroupSize: (s: number) => void;
  
  numCTAs: number;
  setNumCTAs: (n: number) => void;
  
  cacheSize: number;
  setCacheSize: (s: number) => void;
  
  // Dimensions props needed for limits
  dimM: number; 
  dimN: number;
}

export const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  onPlayPause,
  onReset,
  onStep,
  speed,
  setSpeed,
  mode,
  setMode,
  groupSize,
  setGroupSize,
  numCTAs,
  setNumCTAs,
  cacheSize,
  setCacheSize,
  dimM,
  dimN
}) => {
  const maxCTAs = Math.min(16, dimM * dimN); // Reasonable limit

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-6">
      <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-100">
        <Settings2 size={18} />
        <h2 className="text-base font-bold">Configuration</h2>
      </div>

      <div className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Memory Access Order</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMode('row-major')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === 'row-major' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Row-Major
              </button>
              <button
                onClick={() => setMode('grouped')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  mode === 'grouped' 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Grouped
              </button>
            </div>
          </div>

          {/* Group Size Slider */}
          <div className={`transition-all duration-300 ${mode === 'grouped' ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex justify-between">
              <span>Group Size (M)</span>
              <span className="text-slate-700 font-mono">{groupSize}</span>
            </label>
            <input
              type="range"
              min="2"
              max={dimM}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-[10px] text-slate-400 mt-1">
              Triton `GROUP_SIZE_M`
            </div>
          </div>

          {/* Num CTAs Slider (Parallelism) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex justify-between">
              <span># of CTAs (Parallelism)</span>
              <span className="text-slate-700 font-mono">{numCTAs}</span>
            </label>
            <input
              type="range"
              min="1"
              max={maxCTAs}
              value={numCTAs}
              onChange={(e) => setNumCTAs(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-[10px] text-slate-400 mt-1">
              Simulates parallel SMs processing blocks simultaneously.
            </div>
          </div>

          {/* Cache Size Slider */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex justify-between">
              <span>L2 Cache Size</span>
              <span className="text-slate-700 font-mono">{cacheSize} <span className="text-slate-400 text-[10px]">tiles</span></span>
            </label>
            <input
              type="range"
              min="10"
              max="200"
              step="2"
              value={cacheSize}
              onChange={(e) => setCacheSize(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Playback Control</label>
            <span className="text-xs font-mono text-slate-500">{speed}x</span>
        </div>
        
        <div className="flex items-center gap-3">
           <button
            onClick={onReset}
            className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 transition-all"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onPlayPause}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-white shadow-md transition-all active:scale-95 ${
                isPlaying ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>
          <button
            onClick={onStep}
            className="p-2.5 rounded-lg hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 transition-all"
            title="Step Forward"
          >
            <SkipForward size={18} />
          </button>
        </div>
        
        <div className="mt-3">
           <input
              type="range"
              min="1"
              max="50"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-400"
            />
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { Play, Pause, RotateCcw, FastForward, SkipForward } from 'lucide-react';

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
  gridSize: number;
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
  gridSize
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Memory Access Order</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setMode('row-major')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'row-major' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Row-Major
              </button>
              <button
                onClick={() => setMode('grouped')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'grouped' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Grouped
              </button>
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${mode === 'grouped' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Group Size (M-axis)
              <span className="ml-2 text-xs text-slate-500 font-normal">Triton `GROUP_SIZE_M`</span>
            </label>
            <input
              type="range"
              min="2"
              max={gridSize}
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>2</span>
              <span>{groupSize}</span>
              <span>{gridSize}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Playback</h2>
        <div className="flex items-center gap-2 mb-4">
           <button
            onClick={onReset}
            className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>
          <button
            onClick={onPlayPause}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <button
            onClick={onStep}
            className="p-3 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            title="Step Forward"
          >
            <SkipForward size={20} />
          </button>
        </div>
        
        <div className="space-y-2">
           <label className="flex justify-between text-sm font-medium text-slate-700">
             <span>Speed</span>
             <span>{speed}x</span>
           </label>
           <input
              type="range"
              min="1"
              max="20"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
        </div>
      </div>
    </div>
  );
};
import React from 'react';

interface DimensionControlsProps {
  dimM: number;
  setDimM: (v: number) => void;
  dimN: number;
  setDimN: (v: number) => void;
  dimK: number;
  setDimK: (v: number) => void;
}

export const DimensionControls: React.FC<DimensionControlsProps> = ({
  dimM, setDimM,
  dimN, setDimN,
  dimK, setDimK
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200/60 rounded-xl p-4 w-64 transition-all hover:shadow-xl hover:bg-white">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dimensions</h3>
      <div className="space-y-4">
        {/* M Slider */}
        <div className="group">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>M (Rows)</span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{dimM}</span>
            </div>
            <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={dimM}
                onChange={(e) => setDimM(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 group-hover:bg-slate-300 transition-colors"
            />
        </div>
        
        {/* N Slider */}
        <div className="group">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>N (Cols)</span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{dimN}</span>
            </div>
            <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={dimN}
                onChange={(e) => setDimN(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 group-hover:bg-slate-300 transition-colors"
            />
        </div>

        {/* K Slider */}
        <div className="group">
            <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>K (Inner)</span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{dimK}</span>
            </div>
            <input
                type="range"
                min="4"
                max="16"
                step="1"
                value={dimK}
                onChange={(e) => setDimK(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 group-hover:bg-slate-300 transition-colors"
            />
        </div>
      </div>
    </div>
  );
};
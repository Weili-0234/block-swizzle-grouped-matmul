import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MatrixGrid } from './components/MatrixGrid';
import { Controls } from './components/Controls';
import { DimensionControls } from './components/DimensionControls';
import { StatsPanel } from './components/StatsPanel';
import { generateSchedule } from './utils/scheduler';
import { SimState } from './types';
import { Info, Layers, Activity } from 'lucide-react';

const App: React.FC = () => {
  // Dimension State
  const [dimM, setDimM] = useState<number>(8);
  const [dimN, setDimN] = useState<number>(8);
  const [dimK, setDimK] = useState<number>(6);

  // Config State
  const [mode, setMode] = useState<'row-major' | 'grouped'>('row-major');
  const [groupSize, setGroupSize] = useState<number>(3);
  const [numCTAs, setNumCTAs] = useState<number>(1);
  const [speed, setSpeed] = useState<number>(10);
  
  // Cache Configuration State
  const [cacheSize, setCacheSize] = useState<number>(42);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Simulation State
  const [simState, setSimState] = useState<SimState>({
    step: 0,
    lruQueue: [],
    hits: 0,
    misses: 0,
    hitsA: 0,
    missesA: 0,
    hitsB: 0,
    missesB: 0
  });

  const timerRef = useRef<number | null>(null);

  // Computed Schedule of Output Blocks (C)
  const outputBlockSchedule = useMemo(() => 
    generateSchedule(dimM, dimN, 1, 1, groupSize, mode),
    [dimM, dimN, groupSize, mode]
  );

  // Parallel Logic:
  // Instead of processing 1 block at a time, we process `numCTAs` blocks.
  // We divide the schedule into batches.
  // Total Batches = Ceil(Length / numCTAs)
  // Total Micro Steps = Total Batches * K
  const totalBatches = Math.ceil(outputBlockSchedule.length / numCTAs);
  const totalMicroSteps = totalBatches * dimK;

  const resetSim = () => {
    setSimState({
      step: 0,
      lruQueue: [],
      hits: 0,
      misses: 0,
      hitsA: 0,
      missesA: 0,
      hitsB: 0,
      missesB: 0
    });
    setIsPlaying(false);
  };

  // Reset simulation when ANY config changes
  useEffect(() => {
    resetSim();
  }, [mode, groupSize, numCTAs, cacheSize, dimM, dimN, dimK]);

  // The Core Simulation Logic (Parallel-Aware)
  const runStep = () => {
    setSimState(prev => {
      if (prev.step >= totalMicroSteps) {
        setIsPlaying(false);
        return prev;
      }

      // 1. Determine which Batch and K-step we are on
      const batchIndex = Math.floor(prev.step / dimK);
      const kIndex = prev.step % dimK;
      
      // 2. Identify Active Blocks in this Batch
      const startBlockIdx = batchIndex * numCTAs;
      const endBlockIdx = Math.min(startBlockIdx + numCTAs, outputBlockSchedule.length);
      const activeBlocks = outputBlockSchedule.slice(startBlockIdx, endBlockIdx);
      
      let stepHits = 0;
      let stepMisses = 0;
      let stepHitsA = 0;
      let stepMissesA = 0;
      let stepHitsB = 0;
      let stepMissesB = 0;

      let queue = [...prev.lruQueue];
      
      // Helper to Access Cache
      const accessCache = (id: string, matrixType: 'A' | 'B') => {
          const idx = queue.indexOf(id);
          if (idx !== -1) {
              stepHits++;
              if (matrixType === 'A') stepHitsA++; else stepHitsB++;
              // LRU Update: Move to end
              queue.splice(idx, 1);
              queue.push(id);
          } else {
              stepMisses++;
              if (matrixType === 'A') stepMissesA++; else stepMissesB++;
              queue.push(id);
              if (queue.length > cacheSize) {
                  queue.shift(); // Evict oldest
              }
          }
      };

      // 3. Collect requests for ALL active blocks in the batch
      // We gather all Memory Accesses first, then shuffle them to simulate 
      // concurrent/random execution of loads by parallel CTAs.
      const requests: { id: string; type: 'A' | 'B' }[] = [];
      activeBlocks.forEach(block => {
          const targetA = `A-${block.m}-${kIndex}`;
          const targetB = `B-${kIndex}-${block.n}`;
          requests.push({ id: targetA, type: 'A' });
          requests.push({ id: targetB, type: 'B' });
      });

      // 4. Randomize Request Order (Fisher-Yates Shuffle)
      // This prevents artificial "batching" artifacts where we load all A then all B,
      // which might flush the cache unrealistically.
      for (let i = requests.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [requests[i], requests[j]] = [requests[j], requests[i]];
      }

      // 5. Process Randomize Requests
      requests.forEach(req => {
          accessCache(req.id, req.type);
      });

      return {
        ...prev,
        step: prev.step + 1,
        hits: prev.hits + stepHits,
        misses: prev.misses + stepMisses,
        hitsA: prev.hitsA + stepHitsA,
        missesA: prev.missesA + stepMissesA,
        hitsB: prev.hitsB + stepHitsB,
        missesB: prev.missesB + stepMissesB,
        lruQueue: queue
      };
    });
  };

  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(10, 500 / speed);
      timerRef.current = window.setTimeout(() => {
        runStep();
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, simState.step, speed]);

  // Derived State for Rendering
  const isFinished = simState.step >= totalMicroSteps;
  const currentStepIndex = isFinished ? totalMicroSteps - 1 : simState.step;
  
  const batchIndex = Math.floor(currentStepIndex / dimK);
  const currentK = currentStepIndex % dimK;
  const kProgress = (currentK + 1) / dimK;

  // Get blocks active in the current batch
  const startBlockIdx = batchIndex * numCTAs;
  const endBlockIdx = Math.min(startBlockIdx + numCTAs, outputBlockSchedule.length);
  const activeBlocks = outputBlockSchedule.slice(startBlockIdx, endBlockIdx);

  // Compute Active Tile Arrays for MatrixGrid
  // We use .map to create the arrays of active coordinates
  const activeTilesA = activeBlocks.map(b => ({ r: b.m, c: currentK }));
  const activeTilesB = activeBlocks.map(b => ({ r: currentK, c: b.n }));
  const activeCTiles = activeBlocks.map(b => ({ m: b.m, n: b.n, kProgress }));

  // Helper to check hit status for the FIRST active block (for HUD visualization in Single Mode)
  const primaryBlock = activeBlocks[0];
  const primaryTargetA = primaryBlock ? `A-${primaryBlock.m}-${currentK}` : null;
  const primaryTargetB = primaryBlock ? `B-${currentK}-${primaryBlock.n}` : null;
  
  const isPrimaryAHit = primaryTargetA ? simState.lruQueue.includes(primaryTargetA) : false;
  const isPrimaryBHit = primaryTargetB ? simState.lruQueue.includes(primaryTargetB) : false;

  // Calculate Rates for Multi Mode
  const totalAAccess = simState.hitsA + simState.missesA;
  const rateA = totalAAccess > 0 ? ((simState.hitsA / totalAAccess) * 100).toFixed(1) : '0.0';
  
  const totalBAccess = simState.hitsB + simState.missesB;
  const rateB = totalBAccess > 0 ? ((simState.hitsB / totalBAccess) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-[1600px] mx-auto flex flex-col gap-6 bg-slate-50">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-200 self-start md:self-center shrink-0">
                <Info className="text-white" size={20} />
            </div>
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    How Thread Block Swizzling boosts L2 Cache Hit Rate in Matrix Multiplication
                </h1>
                <div className="text-slate-500 text-sm mt-1.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span>Visualizing L2 Cache Reuse. References:</span>
                    <div className="flex gap-3">
                        <a href="https://nathanchen.me/public/Triton-Matrix-Multiplication.html" 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-blue-600 hover:text-blue-800 font-medium hover:underline decoration-blue-300 underline-offset-2">
                            Nathan Chen's Blog
                        </a>
                        <span className="text-slate-300">•</span>
                        <a href="https://triton-lang.org/main/getting-started/tutorials/03-matrix-multiplication.html" 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-blue-600 hover:text-blue-800 font-medium hover:underline decoration-blue-300 underline-offset-2">
                            Triton Docs
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Controls & Stats */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Controls 
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onReset={resetSim}
            onStep={runStep}
            speed={speed}
            setSpeed={setSpeed}
            mode={mode}
            setMode={setMode}
            groupSize={groupSize}
            setGroupSize={setGroupSize}
            numCTAs={numCTAs}
            setNumCTAs={setNumCTAs}
            cacheSize={cacheSize}
            setCacheSize={setCacheSize}
            dimM={dimM}
            dimN={dimN}
          />
          <StatsPanel 
            simState={simState} 
            totalOps={totalMicroSteps} 
            cacheSize={cacheSize}
          />
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-9 bg-slate-100 rounded-2xl border border-slate-200 relative h-[calc(100vh-140px)] min-h-[600px] flex flex-col overflow-hidden">
            
            {/* Absolute Dimension Controls (Top Left) */}
            <div className="absolute top-4 left-4 z-30">
                <DimensionControls 
                    dimM={dimM} setDimM={setDimM}
                    dimN={dimN} setDimN={setDimN}
                    dimK={dimK} setDimK={setDimK}
                />
            </div>

            {/* Scrollable Container for Matrices */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-12">
                <div className="grid grid-cols-[max-content_max-content] gap-8 items-start scale-90 origin-center">
                    
                    {/* Top Left: Empty */}
                    <div></div>

                    {/* Top Right: Matrix B */}
                    <div className="justify-self-center">
                        <MatrixGrid 
                            type="B"
                            title={`Input B (${dimK}×${dimN})`}
                            rows={dimK}
                            cols={dimN}
                            activeTiles={activeTilesB}
                            cachedTiles={simState.lruQueue}
                        />
                    </div>

                    {/* Bottom Left: Matrix A */}
                    <div className="justify-self-end">
                        <MatrixGrid 
                            type="A"
                            title={`Input A (${dimM}×${dimK})`}
                            rows={dimM}
                            cols={dimK}
                            activeTiles={activeTilesA}
                            cachedTiles={simState.lruQueue}
                        />
                    </div>

                    {/* Bottom Right: Matrix C */}
                    <div className="justify-self-center">
                        <MatrixGrid 
                            type="C"
                            title={`Output C (${dimM}×${dimN})`}
                            rows={dimM}
                            cols={dimN}
                            activeCTiles={activeCTiles}
                        />
                    </div>
                </div>
            </div>
            
            {/* Floating HUD Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[320px] max-w-2xl z-20">
                <div className="bg-white/90 backdrop-blur-md border border-slate-200/50 rounded-2xl p-2 px-4 shadow-xl shadow-slate-200/50 flex items-center gap-6 justify-between">
                     
                     {/* Parallel Status */}
                     <div className="flex items-center gap-3 border-r border-slate-100 pr-6">
                        <div className={`p-1.5 rounded ${numCTAs > 1 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                            {numCTAs > 1 ? <Layers size={16} /> : <Activity size={16} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parallelism</span>
                            <span className="font-mono text-slate-800 font-bold text-base leading-none">
                                {numCTAs > 1 ? activeBlocks.length : '1'} <span className="text-xs font-normal text-slate-500">active CTA{numCTAs > 1 ? 's' : ''}</span>
                            </span>
                        </div>
                     </div>

                     {/* Inner Loop Status */}
                     <div className="flex flex-col border-r border-slate-100 pr-6">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inner Loop</span>
                         <span className="font-mono text-slate-600 font-medium text-sm">k={currentK}</span>
                     </div>

                     {/* Dynamic Cache Status: Single vs Multi CTA */}
                     {primaryBlock ? (
                        numCTAs === 1 ? (
                             /* SINGLE CTA: Show explicit Hit/Miss dots */
                             <div className="flex items-center gap-3 opacity-90">
                                <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-xs font-bold text-cyan-600">A</span>
                                        {isPrimaryAHit ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 ring-2 ring-emerald-100"></div>
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200 ring-2 ring-red-100"></div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-slate-300">|</div>
                                 <div className="flex flex-col items-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        {isPrimaryBHit ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 ring-2 ring-emerald-100"></div>
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200 ring-2 ring-red-100"></div>
                                        )}
                                        <span className="font-mono text-xs font-bold text-orange-500">B</span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-slate-400 italic ml-1">
                                    (Instant)
                                </div>
                             </div>
                        ) : (
                            /* MULTI CTA: Show Accumulative Hit Rates */
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">A Hit Rate</span>
                                    <span className={`font-mono text-sm font-bold ${Number(rateA) > 50 ? 'text-cyan-600' : 'text-slate-600'}`}>
                                        {rateA}%
                                    </span>
                                </div>
                                <div className="h-6 w-px bg-slate-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">B Hit Rate</span>
                                    <span className={`font-mono text-sm font-bold ${Number(rateB) > 50 ? 'text-orange-500' : 'text-slate-600'}`}>
                                        {rateB}%
                                    </span>
                                </div>
                            </div>
                        )
                     ) : (
                        <div className="text-xs text-slate-400 italic">Idle</div>
                     )}
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;
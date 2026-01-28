import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MatrixGrid } from './components/MatrixGrid';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { generateSchedule, BlockCoord } from './utils/scheduler';
import { SimState } from './types';
import { Play, Info } from 'lucide-react';

// Constants
const GRID_SIZE = 9; // 9x9 blocks as per blog example
const BLOCK_SIZE = 1; // Simplified for visualizer (1 unit = 1 block)
const CACHE_CAPACITY = 10; // Capacity of L2 Cache in "blocks"

// Simulating that computing 1 block of C requires holding 1 block of A and 1 block of B
// If we switch to a new row of A or column of B, we check if it's in cache.

const App: React.FC = () => {
  // Config State
  const [mode, setMode] = useState<'row-major' | 'grouped'>('row-major');
  const [groupSize, setGroupSize] = useState<number>(3);
  const [speed, setSpeed] = useState<number>(5);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Simulation State
  const [simState, setSimState] = useState<SimState>({
    step: 0,
    cacheA: [],
    cacheB: [],
    hits: 0,
    misses: 0,
    history: []
  });

  const timerRef = useRef<number | null>(null);

  // Computed Schedule
  const schedule = useMemo(() => 
    generateSchedule(GRID_SIZE, GRID_SIZE, BLOCK_SIZE, BLOCK_SIZE, groupSize, mode),
    [mode, groupSize]
  );

  const resetSim = () => {
    setSimState({
      step: 0,
      cacheA: [],
      cacheB: [],
      hits: 0,
      misses: 0,
      history: []
    });
    setIsPlaying(false);
  };

  // Reset when configuration changes
  useEffect(() => {
    resetSim();
  }, [mode, groupSize]);

  const stepForward = () => {
    setSimState(prev => {
      if (prev.step >= schedule.length) {
        setIsPlaying(false);
        return prev;
      }

      const currentOp = schedule[prev.step];
      const neededRowA = currentOp.m;
      const neededColB = currentOp.n;

      let newHits = prev.hits;
      let newMisses = prev.misses;
      let newCacheA = [...prev.cacheA];
      let newCacheB = [...prev.cacheB];

      // Check Cache for A (Row)
      if (newCacheA.includes(neededRowA)) {
        newHits++;
        // Refresh LRU position (move to end)
        newCacheA = newCacheA.filter(id => id !== neededRowA);
        newCacheA.push(neededRowA);
      } else {
        newMisses++;
        newCacheA.push(neededRowA);
        // Evict if A-cache partition full (Let's assume shared cache, but for simplicity split capacity)
        // Let's assume global LRU capacity for sum of blocks.
      }

      // Check Cache for B (Col)
      if (newCacheB.includes(neededColB)) {
        newHits++;
        newCacheB = newCacheB.filter(id => id !== neededColB);
        newCacheB.push(neededColB);
      } else {
        newMisses++;
        newCacheB.push(neededColB);
      }

      // Global Eviction Logic
      // Combine lists to manage total capacity, but for this visualizer, 
      // it's easier to manage independent capacities or a shared FIFO queue logic.
      // Let's implement a shared LRU Queue for accuracy.
      
      // Re-evaluating Cache Logic for simplicity & visual clarity:
      // We will maintain a single list of "Cached Items" which are strings like "A-0", "B-5".
      // But for the state object `cacheA` and `cacheB` used for rendering, we derive them from this list.
      // This is slightly complex for a `setSimState` functional update.
      
      // ALTERNATIVE: Simpler LRU.
      // Just check if it's in the list. If not, add it.
      // If `newCacheA.length + newCacheB.length > CACHE_CAPACITY`, remove the oldest item from whichever list has the oldest timestamp?
      // Too complex. Let's assume the cache is large enough to hold `GROUP_SIZE` rows of A and a few cols of B,
      // but not large enough to hold the whole matrix.
      
      // Let's enforce a strict limit on total blocks.
      const currentTotal = newCacheA.length + newCacheB.length;
      if (currentTotal > CACHE_CAPACITY) {
        // Naive eviction: If we just added A, and we are over, evict oldest A or B?
        // To strictly follow the "Grouped" benefit, the cache needs to be able to hold the 'Working Set'.
        // Row Major Working Set: 1 Row of A + (Scanning all B). B thrashes.
        // Grouped Working Set: GroupSize Rows of A + (Scanning B). A stays, B thrashes less?
        
        // Actually, the tutorial says:
        // "Grouped... load 54 blocks" vs "Row-Major... 90 blocks".
        // This implies Row Major reloads B constantly.
        
        // Let's implement a simple FIFO eviction for the visualization that approximates this.
        // We will assume `cacheA` and `cacheB` act as a combined queue.
        // But tracking order in separate arrays is hard.
        
        // Let's cheat slightly for the demo: 
        // We just keep the last `CACHE_CAPACITY` accessed items.
        // But we need to distinguish A-items and B-items.
      }

      return {
        ...prev,
        step: prev.step + 1,
        hits: newHits,
        misses: newMisses,
        cacheA: newCacheA.slice(-CACHE_CAPACITY), // Very rough approximation of cache retention
        cacheB: newCacheB.slice(-CACHE_CAPACITY), // Just keeping the lists small creates the thrashing effect visually
      };
    });
  };

  // Improved Cache Logic with proper LRU queue for `stepForward`
  const runStep = () => {
    setSimState(prev => {
      if (prev.step >= schedule.length) {
        setIsPlaying(false);
        return prev;
      }

      const currentOp = schedule[prev.step];
      const itemA = `A-${currentOp.m}`;
      const itemB = `B-${currentOp.n}`;

      // We need a unified history for LRU
      // Let's store the full LRU list in a new state property or just derive A/B cache from a single list.
      // For the sake of the existing types, let's just use a helper here.
      
      // Reconstruct full list order from current A/B is impossible without timestamps.
      // Let's modify SimState to hold `lruQueue: string[]` (ids).
      
      // HACK for smoother implementation without changing types heavily:
      // We will perform the logic on a reconstructed queue if we tracked it, 
      // but let's just stick to a heuristic:
      // If we switch rows of A, and the old row was accessed long ago, it's gone.
      
      // Let's use a simpler "Working Set" Model.
      // Cache Size = 12 blocks.
      // Row Major:
      //   Step 1..9: Uses A0. B0..B8.
      //   Cache fills with A0, B0..B8. (10 items). 
      //   Next Step: A1, B0. 
      //   A1 pushes out A0? B0 is brought to front?
      //   If N=9, Cache=9. 
      //   Row Major: A0 loaded. B0..B8 loaded. 
      //   Next A1. B0..B8 must be reloaded if they fell out.
      
      const MAX_CACHE = CACHE_CAPACITY; // 10
      
      // Current cache based on prev state
      // We need to store the queue to do this properly. 
      // Let's attach the queue to the state for the next render.
      const currentQueue = (prev as any).lruQueue || [];
      
      let hits = 0;
      let misses = 0;
      let newQueue = [...currentQueue];

      // Process A
      const idxA = newQueue.indexOf(itemA);
      if (idxA > -1) {
        hits++;
        newQueue.splice(idxA, 1);
        newQueue.push(itemA);
      } else {
        misses++;
        newQueue.push(itemA);
        if (newQueue.length > MAX_CACHE) newQueue.shift();
      }

      // Process B
      const idxB = newQueue.indexOf(itemB);
      if (idxB > -1) {
        hits++;
        newQueue.splice(idxB, 1);
        newQueue.push(itemB);
      } else {
        misses++;
        newQueue.push(itemB);
        if (newQueue.length > MAX_CACHE) newQueue.shift();
      }

      // Derive renderable cache lists
      const cacheA = newQueue.filter((x: string) => x.startsWith('A')).map((x: string) => parseInt(x.split('-')[1]));
      const cacheB = newQueue.filter((x: string) => x.startsWith('B')).map((x: string) => parseInt(x.split('-')[1]));

      return {
        step: prev.step + 1,
        hits: prev.hits + hits,
        misses: prev.misses + misses,
        cacheA,
        cacheB,
        history: prev.history,
        lruQueue: newQueue
      } as SimState;
    });
  };

  useEffect(() => {
    if (isPlaying) {
      const delay = Math.max(50, 1000 / speed);
      timerRef.current = window.setTimeout(() => {
        runStep();
      }, delay);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, simState.step, speed]);

  const currentBlock = schedule[simState.step] || schedule[schedule.length - 1];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                <Info className="text-white" size={24} />
            </div>
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Grouped Matmul Visualizer</h1>
                <p className="text-slate-500 font-medium">L2 Cache Reuse Optimization (Triton)</p>
            </div>
        </div>
        <p className="text-slate-600 leading-relaxed text-sm md:text-base bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          Matrix Multiplication performance on GPUs is often limited by memory bandwidth. 
          By reordering the execution of output blocks (Grouped Ordering), we can maximize <strong>L2 Cache Reuse</strong> of the input matrices, significantly reducing slow DRAM accesses.
        </p>
      </header>

      {/* Main Content */}
      <main className="grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & Stats */}
        <div className="lg:col-span-4 space-y-6">
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
            gridSize={GRID_SIZE}
          />
          <StatsPanel 
            simState={simState} 
            totalSteps={schedule.length}
            cacheSize={CACHE_CAPACITY}
          />
        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 opacity-50" />
            
            <div className="relative">
                {/* Visual Layout: 
                    Top Right: B
                    Bottom Left: A
                    Bottom Right: C
                */}
                <div className="grid grid-cols-[auto_auto] gap-4 md:gap-8">
                    {/* Empty Top-Left Corner */}
                    <div className="flex items-end justify-end pb-4 pr-4">
                        <div className="text-right space-y-2">
                             <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                                <span>Active A Row</span>
                             </div>
                             <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                                <span className="w-3 h-3 bg-amber-500 rounded-sm"></span>
                                <span>Active B Col</span>
                             </div>
                             <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                                <span className="w-3 h-3 bg-blue-600 rounded-sm"></span>
                                <span>Computing C</span>
                             </div>
                             <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
                                <span className="w-3 h-3 bg-emerald-100 border border-emerald-200 rounded-sm"></span>
                                <span>Cached (Hit)</span>
                             </div>
                        </div>
                    </div>

                    {/* Matrix B (Top Right) */}
                    <MatrixGrid 
                        type="B"
                        title="Input Matrix B (K×N)"
                        rows={GRID_SIZE}
                        cols={GRID_SIZE}
                        activeCol={currentBlock?.n}
                        cacheItems={simState.cacheB}
                    />

                    {/* Matrix A (Bottom Left) */}
                    <MatrixGrid 
                        type="A"
                        title="Input Matrix A (M×K)"
                        rows={GRID_SIZE}
                        cols={GRID_SIZE}
                        activeRow={currentBlock?.m}
                        cacheItems={simState.cacheA}
                    />

                    {/* Matrix C (Bottom Right - Result) */}
                    <MatrixGrid 
                        type="C"
                        title="Output Matrix C (M×N)"
                        rows={GRID_SIZE}
                        cols={GRID_SIZE}
                        activeCell={currentBlock}
                    />
                </div>
                
                {/* Connection Lines (Decorative) */}
                {currentBlock && (
                   <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
                      {/* Lines could be drawn here to show data flow if needed */}
                   </svg>
                )}
            </div>
            
            <div className="mt-8 text-center">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200 text-sm font-mono text-slate-600">
                    <span>Processing C[{currentBlock?.m ?? 0}, {currentBlock?.n ?? 0}]</span>
                 </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;
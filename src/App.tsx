/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Battery, 
  Sun, 
  Zap, 
  Activity, 
  Play, 
  RotateCcw, 
  Info,
  TrendingUp,
  Cpu,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';
import { SmartGridEnv, EnvState } from './lib/env.ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [env] = useState(() => new SmartGridEnv());
  const [state, setState] = useState<EnvState>(env.reset());
  const [history, setHistory] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [totalReward, setTotalReward] = useState(0);
  const [lastAction, setLastAction] = useState<number | null>(null);
  const [lastReward, setLastReward] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simple Heuristic Agent (Simulating RL)
  const getAction = (s: EnvState) => {
    if (s.production > s.demand + 10 && s.batteryLevel < 90) return 1; // Charge
    if (s.demand > s.production && s.batteryLevel > 10) return 2; // Discharge
    return 0; // Idle
  };

  const step = () => {
    const action = getAction(state);
    const { state: nextState, reward, done } = env.step(action);
    
    setLastAction(action);
    setLastReward(reward);
    setTotalReward(prev => prev + reward);
    setState(nextState);
    
    setHistory(prev => {
      const newHistory = [...prev, {
        time: nextState.step,
        demand: Math.round(nextState.demand),
        production: Math.round(nextState.production),
        battery: Math.round(nextState.batteryLevel),
        reward: reward
      }].slice(-24); // Keep last 24 hours
      return newHistory;
    });

    if (done) {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(step, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, state, speed]);

  const reset = () => {
    setIsRunning(false);
    setState(env.reset());
    setHistory([]);
    setTotalReward(0);
    setLastAction(null);
    setLastReward(0);
  };

  const actionLabel = lastAction === 1 ? 'Charging' : lastAction === 2 ? 'Discharging' : 'Idle';
  const actionColor = lastAction === 1 ? 'text-emerald-400' : lastAction === 2 ? 'text-amber-400' : 'text-slate-400';

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-white">OpenEnv <span className="text-emerald-400">SmartGrid</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">RL Training Environment v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-sm font-mono text-emerald-400">{totalReward.toLocaleString()} <span className="text-slate-500 text-[10px]">REWARD</span></span>
            </div>
            <button 
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all active:scale-95",
                isRunning ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20" : "bg-emerald-500 text-black hover:bg-emerald-400"
              )}
            >
              {isRunning ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {isRunning ? "Stop Training" : "Start Agent"}
            </button>
            <button onClick={reset} className="p-2 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
              <RotateCcw className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Stats & Environment */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Environment Status Card */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Cpu className="w-32 h-32 text-white" />
            </div>
            
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Environment State
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Sun className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Production</p>
                    <p className="text-xl font-bold text-white">{Math.round(state.production)} <span className="text-xs font-normal text-slate-500">kW</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Demand</p>
                    <p className="text-xl font-bold text-white">{Math.round(state.demand)} <span className="text-xs font-normal text-slate-500">kW</span></p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Zap className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Battery className="w-3.5 h-3.5" /> Battery Storage
                  </span>
                  <span className="text-white">{Math.round(state.batteryLevel)}%</span>
                </div>
                <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${state.batteryLevel}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      state.batteryLevel > 20 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" : "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                    )}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Agent Decision</p>
                  <p className={cn("text-lg font-bold transition-colors", actionColor)}>
                    {actionLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Step Reward</p>
                  <p className={cn("text-lg font-mono font-bold", lastReward >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {lastReward > 0 ? `+${lastReward}` : lastReward}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Training Controls */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Simulation Config</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400">Training Speed</span>
                  <span className="text-white">{speed}ms</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="50"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-white/10 rounded-lg h-1.5 appearance-none cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Time</p>
                  <p className="text-lg font-bold text-white">{state.timeOfDay}:00</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Steps</p>
                  <p className="text-lg font-bold text-white">{state.step}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Analytics */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Chart */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Energy Dynamics (Live)
              </h2>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1.5 text-amber-400"><div className="w-2 h-2 rounded-full bg-amber-400" /> Production</span>
                <span className="flex items-center gap-1.5 text-blue-400"><div className="w-2 h-2 rounded-full bg-blue-400" /> Demand</span>
                <span className="flex items-center gap-1.5 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Battery</span>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#475569" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => `${val % 24}h`}
                  />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Area type="monotone" dataKey="production" stroke="#fbbf24" fillOpacity={1} fill="url(#colorProd)" strokeWidth={2} />
                  <Area type="monotone" dataKey="demand" stroke="#60a5fa" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={2} />
                  <Line type="monotone" dataKey="battery" stroke="#10b981" strokeWidth={3} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Info Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> RL Objective
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                The agent must learn to balance <span className="text-white font-medium">intermittent renewable production</span> with fluctuating consumer demand. 
                It receives high penalties for grid instability (blackouts) and small rewards for efficient storage utilization.
              </p>
            </section>
            
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Reward Function
              </h3>
              <ul className="text-xs space-y-2 text-slate-400">
                <li className="flex justify-between"><span>Stability (Net Zero)</span> <span className="text-emerald-400">+10</span></li>
                <li className="flex justify-between"><span>Battery Utilization</span> <span className="text-emerald-400">+5</span></li>
                <li className="flex justify-between"><span>Grid Overload</span> <span className="text-rose-400">-5</span></li>
                <li className="flex justify-between"><span>Blackout Event</span> <span className="text-rose-400">-50</span></li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500 font-medium">© 2026 OpenEnv Bootcamp Submission • Round 1</p>
        <div className="flex gap-6">
          <a href="#" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">Documentation</a>
          <a href="#" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">Environment API</a>
          <a href="#" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">Leaderboard</a>
        </div>
      </footer>
    </div>
  );
}

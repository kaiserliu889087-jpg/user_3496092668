
import React from 'react';
import { SimulationPhase, ScenarioStep } from '../types';
import { SCENARIO_STEPS } from '../constants';
import { Mic, Activity, Wind, Radio, Play, RotateCcw, FileText, Cpu, Film, Pause, Volume2, VolumeX } from 'lucide-react';

interface InterfaceProps {
  currentPhase: SimulationPhase;
  audioLevel: number;
  report: string | null;
  isGeneratingReport: boolean;
  isDemoMode: boolean;
  isMuted: boolean;
  onNext: () => void;
  onReset: () => void;
  onGenerateReport: () => void;
  onToggleDemo: () => void;
  onToggleMute: () => void;
}

const Interface: React.FC<InterfaceProps> = ({
  currentPhase,
  audioLevel,
  report,
  isGeneratingReport,
  isDemoMode,
  isMuted,
  onNext,
  onReset,
  onGenerateReport,
  onToggleDemo,
  onToggleMute
}) => {
  const currentStep = SCENARIO_STEPS.find(s => s.phase === currentPhase) || SCENARIO_STEPS[0];
  const progress = (SCENARIO_STEPS.findIndex(s => s.phase === currentPhase) + 1) / SCENARIO_STEPS.length * 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Bar: Status */}
      <div className="flex justify-between items-start">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-lg pointer-events-auto max-w-md shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            {isDemoMode && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
            )}
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2 tracking-tight">
                <Wind className="text-emerald-400" />
                Dandelion Sentinel
            </h1>
            <div className="flex items-center gap-2 mb-4">
                 <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono border border-slate-700 px-1 rounded">Mk-IV System</span>
                 {isDemoMode && (
                     <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                         AUTO DEMO
                     </span>
                 )}
            </div>
            
            <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-300 border-b border-slate-800 pb-1">
                    <span>SYSTEM_STATUS:</span>
                    <span className={`font-bold ${currentPhase === SimulationPhase.TRIGGERED ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {currentPhase}
                    </span>
                </div>
                <div className="flex justify-between text-slate-300">
                    <span>AUDIO_INPUT:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                            <div 
                                className={`h-full transition-all duration-75 ${audioLevel > 0.6 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${audioLevel * 100}%` }}
                            />
                        </div>
                        <Mic size={12} className={audioLevel > 0.6 ? 'text-red-500' : 'text-slate-500'} />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-2 items-end">
            {/* Audio Toggle */}
            <button 
                onClick={onToggleMute}
                className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-full pointer-events-auto text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Gemini Report Box */}
            {(report || currentPhase === SimulationPhase.SENSING || currentPhase === SimulationPhase.LANDING) && (
                <div className="bg-slate-900/90 backdrop-blur-md border-l-2 border-indigo-500 p-4 rounded-r-lg pointer-events-auto w-80 shadow-2xl transition-all">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                        <Cpu size={18} />
                        <h3 className="font-bold text-sm uppercase tracking-wider">Tactical Analysis</h3>
                    </div>
                    {report ? (
                        <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                            {report}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            {isDemoMode ? (
                                <div className="text-xs text-indigo-300 animate-pulse font-mono">_RECEIVING_TELEMETRY...</div>
                            ) : (
                                <button 
                                    onClick={onGenerateReport}
                                    disabled={isGeneratingReport}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 font-mono"
                                >
                                    {isGeneratingReport ? <Activity className="animate-spin" size={14} /> : <FileText size={14} />}
                                    {isGeneratingReport ? 'PROCESSING...' : 'GENERATE REPORT'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Center Notification (for Trigger) */}
      {currentPhase === SimulationPhase.TRIGGERED && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-[120px] font-black text-red-500 animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 w-full text-center select-none">!</div>
              <div className="text-4xl font-black text-white bg-red-600/90 backdrop-blur px-8 py-4 rounded-lg shadow-2xl animate-bounce whitespace-nowrap border-2 border-red-400">
                  THREAT DETECTED
              </div>
          </div>
      )}

      {/* Bottom Bar: Scenario Control */}
      <div className="flex flex-col gap-4">
          <div className="bg-slate-900/90 backdrop-blur-md border-t-2 border-emerald-500 p-6 rounded-lg pointer-events-auto max-w-2xl shadow-2xl relative overflow-hidden">
               {/* Progress Bar Background */}
               <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                   <div 
                    className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                   />
               </div>

              <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-lg border border-slate-700 transition-colors ${
                      isDemoMode ? 'bg-indigo-900/50 text-indigo-400 border-indigo-500/30' : 'bg-slate-800 text-emerald-400'
                  }`}>
                      {currentPhase === SimulationPhase.LISTENING && <Mic size={24} />}
                      {currentPhase === SimulationPhase.TRIGGERED && <Activity className="text-red-500" size={24} />}
                      {currentPhase === SimulationPhase.EJECTION && <Radio size={24} />}
                      {currentPhase === SimulationPhase.CRUISE && <Wind size={24} />}
                      {currentPhase === SimulationPhase.SENSING && <Radio size={24} />}
                      {currentPhase === SimulationPhase.LANDING && <RotateCcw size={24} />}
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-bold text-white tracking-wide">{currentStep.title}</h2>
                        <span className={`text-xs font-mono font-bold ${isDemoMode ? 'text-indigo-400' : 'text-emerald-500'}`}>
                            PHASE {SCENARIO_STEPS.findIndex(s => s.phase === currentPhase) + 1}/{SCENARIO_STEPS.length}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-5 min-h-[40px] font-light">
                          {currentStep.description}
                      </p>
                      
                      <div className="flex gap-3 flex-wrap items-center">
                        {/* Auto Demo Button */}
                        <button 
                            onClick={onToggleDemo}
                            className={`px-5 py-2 rounded font-bold text-sm transition-all flex items-center gap-2 border shadow-lg ${
                                isDemoMode 
                                ? 'bg-indigo-600 border-indigo-400 text-white hover:bg-indigo-500 shadow-indigo-900/40' 
                                : 'bg-slate-800 border-slate-600 text-indigo-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            {isDemoMode ? <Pause size={16} fill="currentColor" /> : <Film size={16} />}
                            {isDemoMode ? 'PAUSE DEMO' : 'AUTO DEMO'}
                        </button>

                        <div className="h-6 w-px bg-slate-700 mx-2" />

                        {/* Manual Controls */}
                        {!isDemoMode && (
                            <>
                                <button 
                                    onClick={onNext}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-bold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 border border-emerald-500"
                                >
                                    <Play size={16} fill="currentColor" />
                                    {currentPhase === SimulationPhase.LANDING ? 'FINISH' : 'NEXT PHASE'}
                                </button>
                                <button 
                                    onClick={onReset}
                                    className="bg-transparent border border-slate-600 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded font-semibold text-sm transition-all flex items-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    RESET
                                </button>
                            </>
                        )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Interface;

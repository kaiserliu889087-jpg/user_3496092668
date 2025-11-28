import React from 'react';
import { SimulationPhase, ScenarioStep } from '../types';
import { SCENARIO_STEPS } from '../constants';
import { Mic, Activity, Wind, Radio, Play, RotateCcw, FileText, Cpu } from 'lucide-react';

interface InterfaceProps {
  currentPhase: SimulationPhase;
  audioLevel: number;
  report: string | null;
  isGeneratingReport: boolean;
  onNext: () => void;
  onReset: () => void;
  onGenerateReport: () => void;
}

const Interface: React.FC<InterfaceProps> = ({
  currentPhase,
  audioLevel,
  report,
  isGeneratingReport,
  onNext,
  onReset,
  onGenerateReport
}) => {
  const currentStep = SCENARIO_STEPS.find(s => s.phase === currentPhase) || SCENARIO_STEPS[0];
  const progress = (SCENARIO_STEPS.findIndex(s => s.phase === currentPhase) + 1) / SCENARIO_STEPS.length * 100;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Top Bar: Status */}
      <div className="flex justify-between items-start">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-lg pointer-events-auto max-w-md shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <Wind className="text-emerald-400" />
                Dandelion Sentinel
            </h1>
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-4">Mimetic Bio-Drone System</div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-300">
                    <span>System Status:</span>
                    <span className={`font-mono font-bold ${currentPhase === SimulationPhase.TRIGGERED ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        {currentPhase}
                    </span>
                </div>
                <div className="flex justify-between text-sm text-slate-300">
                    <span>Audio Input:</span>
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-75 ${audioLevel > 0.6 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${audioLevel * 100}%` }}
                            />
                        </div>
                        <Mic size={14} className={audioLevel > 0.6 ? 'text-red-500' : 'text-slate-500'} />
                    </div>
                </div>
            </div>
        </div>

        {/* Gemini Report Box */}
        {(report || currentPhase === SimulationPhase.SENSING || currentPhase === SimulationPhase.LANDING) && (
            <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/50 p-4 rounded-lg pointer-events-auto w-80 shadow-2xl transition-all">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                    <Cpu size={18} />
                    <h3 className="font-bold text-sm uppercase">AI Tactical Analysis</h3>
                </div>
                {report ? (
                    <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {report}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <button 
                            onClick={onGenerateReport}
                            disabled={isGeneratingReport}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            {isGeneratingReport ? <Activity className="animate-spin" size={14} /> : <FileText size={14} />}
                            {isGeneratingReport ? 'Analyzing...' : 'Generate Mission Report'}
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Center Notification (for Trigger) */}
      {currentPhase === SimulationPhase.TRIGGERED && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-6xl font-black text-red-500 animate-ping absolute opacity-50">!</div>
              <div className="text-4xl font-black text-white bg-red-600 px-6 py-2 rounded shadow-lg animate-bounce">
                  THREAT DETECTED
              </div>
          </div>
      )}

      {/* Bottom Bar: Scenario Control */}
      <div className="flex flex-col gap-4">
          <div className="bg-slate-900/90 backdrop-blur-md border-t-2 border-emerald-500 p-6 rounded-lg pointer-events-auto max-w-2xl shadow-2xl">
              <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-800 rounded-full text-emerald-400 border border-slate-700">
                      {currentPhase === SimulationPhase.LISTENING && <Mic />}
                      {currentPhase === SimulationPhase.TRIGGERED && <Activity className="text-red-500" />}
                      {currentPhase === SimulationPhase.EJECTION && <Radio />}
                      {currentPhase === SimulationPhase.CRUISE && <Wind />}
                      {currentPhase === SimulationPhase.SENSING && <Radio />}
                      {currentPhase === SimulationPhase.LANDING && <RotateCcw />}
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-bold text-white">{currentStep.title}</h2>
                        <span className="text-xs font-mono text-emerald-500">{Math.round(progress)}% COMPLETE</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed mb-4">
                          {currentStep.description}
                      </p>
                      
                      <div className="flex gap-3">
                        <button 
                            onClick={onNext}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded font-semibold text-sm transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                        >
                            <Play size={16} fill="currentColor" />
                            {currentPhase === SimulationPhase.LANDING ? 'Finish' : 'Next Phase'}
                        </button>
                        <button 
                            onClick={onReset}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-semibold text-sm transition-all flex items-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Interface;
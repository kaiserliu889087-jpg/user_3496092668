
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Scene3D from './components/Scene3D';
import Interface from './components/Interface';
import { SimulationPhase, SimulationState } from './types';
import { SCENARIO_STEPS, AUDIO_THRESHOLD } from './constants';
import { generateTacticalReport } from './services/geminiService';
import { audioService } from './services/audioService';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    phase: SimulationPhase.LISTENING,
    audioLevel: 0,
    threatLevel: 0,
    report: null,
    isGeneratingReport: false,
  });

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);

  // Initialize Audio Service on first user interaction or mount
  useEffect(() => {
    const handleInteraction = () => {
        audioService.init();
        window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  // Sync Mute State
  useEffect(() => {
      audioService.setMute(isMuted);
  }, [isMuted]);

  // Audio Reactive FX logic (Trigger Sound Effects)
  useEffect(() => {
    switch (state.phase) {
        case SimulationPhase.TRIGGERED:
            audioService.playTriggerAlarm();
            break;
        case SimulationPhase.EJECTION:
            audioService.playEjection();
            break;
        case SimulationPhase.CRUISE:
            audioService.playCruiseHum();
            break;
        case SimulationPhase.SENSING:
            audioService.playScanData();
            break;
        case SimulationPhase.LANDING:
            audioService.playLanding();
            break;
    }
  }, [state.phase]);

  // Microphone Input Initialization
  useEffect(() => {
    const initMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Provided sampleRate to satisfy strict constructor requirements in some environments
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 44100 });
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        
        const checkAudio = () => {
            if (analyserRef.current && dataArrayRef.current) {
                analyserRef.current.getByteFrequencyData(dataArrayRef.current);
                const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
                const normalized = Math.min(average / 128, 1); // Normalize 0-1
                
                setState(prev => {
                   // Auto Trigger logic (Only in manual mode)
                   if (!isDemoMode && prev.phase === SimulationPhase.LISTENING && normalized > AUDIO_THRESHOLD) {
                       return { ...prev, audioLevel: normalized, phase: SimulationPhase.TRIGGERED };
                   }
                   return { ...prev, audioLevel: normalized };
                });
            }
            rafRef.current = requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (e) {
        console.warn("Microphone access denied or not available. Running in manual mode.");
      }
    };

    initMic();

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [isDemoMode]);

  // Phase Transition Logic
  const nextPhase = useCallback(() => {
    setState(prev => {
        const currentIndex = SCENARIO_STEPS.findIndex(s => s.phase === prev.phase);
        const nextIndex = (currentIndex + 1) % SCENARIO_STEPS.length;
        
        // If looping back to start, clear report
        if (nextIndex === 0) {
            return {
                ...prev,
                phase: SCENARIO_STEPS[nextIndex].phase,
                report: null
            };
        }
        
        return {
            ...prev,
            phase: SCENARIO_STEPS[nextIndex].phase
        };
    });
  }, []);

  const resetSimulation = useCallback(() => {
      setState(prev => ({
          ...prev,
          phase: SimulationPhase.LISTENING,
          report: null
      }));
      setIsDemoMode(false);
  }, []);

  const toggleDemoMode = useCallback(() => {
      setIsDemoMode(prev => {
          if (!prev) {
              setState(s => ({ ...s, phase: SimulationPhase.LISTENING, report: null }));
              audioService.init(); // Ensure audio is ready
          }
          return !prev;
      });
  }, []);

  const toggleMute = useCallback(() => {
      setIsMuted(prev => !prev);
  }, []);

  // Auto-advance logic
  useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;
      
      if (isDemoMode) {
          // Demo Mode Durations
          const delays: Record<string, number> = {
            [SimulationPhase.LISTENING]: 4000,
            [SimulationPhase.TRIGGERED]: 3000,
            [SimulationPhase.EJECTION]: 3500,
            [SimulationPhase.CRUISE]: 6000,
            [SimulationPhase.SENSING]: 7000, 
            [SimulationPhase.LANDING]: 5000,
          };
          
          const delay = delays[state.phase] || 3000;
          
          timeout = setTimeout(() => {
              nextPhase();
          }, delay);

      } else {
          // Manual Mode: Partial auto-advance for physics-based sequences
          if (state.phase === SimulationPhase.TRIGGERED) {
              timeout = setTimeout(() => {
                  setState(prev => ({ ...prev, phase: SimulationPhase.EJECTION }));
              }, 3000);
          } else if (state.phase === SimulationPhase.EJECTION) {
              timeout = setTimeout(() => {
                   setState(prev => ({ ...prev, phase: SimulationPhase.CRUISE }));
              }, 3000);
          }
      }

      return () => clearTimeout(timeout);
  }, [state.phase, isDemoMode, nextPhase]);

  // Auto-generate report in demo mode
  useEffect(() => {
      if (isDemoMode && state.phase === SimulationPhase.SENSING && !state.report && !state.isGeneratingReport) {
          handleGenerateReport();
      }
  }, [isDemoMode, state.phase, state.report]);

  const handleGenerateReport = async () => {
      setState(prev => ({ ...prev, isGeneratingReport: true }));
      
      const reportText = await generateTacticalReport(
          "High-Decibel Impulse (Gunshot/Explosion)", 
          "Urban Sector 7, Humidity 65%, Wind NE 5km/h"
      );
      
      setState(prev => ({ ...prev, report: reportText, isGeneratingReport: false }));
  };

  return (
    <div className="w-full h-screen bg-slate-900 relative overflow-hidden">
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [5, 4, 6], fov: 45 }}>
         <color attach="background" args={['#0f172a']} />
         <fog attach="fog" args={['#0f172a', 5, 20]} />
         <Scene3D phase={state.phase} audioLevel={state.audioLevel} />
         <OrbitControls 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.1}
            autoRotate={state.phase === SimulationPhase.CRUISE || state.phase === SimulationPhase.SENSING || isDemoMode}
            autoRotateSpeed={isDemoMode ? 1.0 : 0.5}
         />
      </Canvas>

      {/* UI Overlay */}
      <Interface 
         currentPhase={state.phase}
         audioLevel={state.audioLevel}
         report={state.report}
         isGeneratingReport={state.isGeneratingReport}
         isDemoMode={isDemoMode}
         isMuted={isMuted}
         onNext={nextPhase}
         onReset={resetSimulation}
         onGenerateReport={handleGenerateReport}
         onToggleDemo={toggleDemoMode}
         onToggleMute={toggleMute}
      />
    </div>
  );
};

export default App;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Scene3D from './components/Scene3D';
import Interface from './components/Interface';
import { SimulationPhase, SimulationState } from './types';
import { SCENARIO_STEPS, AUDIO_THRESHOLD } from './constants';
import { generateTacticalReport } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    phase: SimulationPhase.LISTENING,
    audioLevel: 0,
    threatLevel: 0,
    report: null,
    isGeneratingReport: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number>();

  // Audio Initialization
  useEffect(() => {
    const initAudio = async () => {
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
                   // Auto Trigger logic if simulated loudness is detected
                   if (prev.phase === SimulationPhase.LISTENING && normalized > AUDIO_THRESHOLD) {
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

    initAudio();

    return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

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
  }, []);

  // Auto-advance logic for short phases
  useEffect(() => {
      let timeout: ReturnType<typeof setTimeout>;
      
      if (state.phase === SimulationPhase.TRIGGERED) {
          timeout = setTimeout(() => {
              setState(prev => ({ ...prev, phase: SimulationPhase.EJECTION }));
          }, 3000);
      } else if (state.phase === SimulationPhase.EJECTION) {
          timeout = setTimeout(() => {
               setState(prev => ({ ...prev, phase: SimulationPhase.CRUISE }));
          }, 3000);
      }

      return () => clearTimeout(timeout);
  }, [state.phase]);

  const handleGenerateReport = async () => {
      setState(prev => ({ ...prev, isGeneratingReport: true }));
      
      // Simulate environment data for the prompt
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
         <Scene3D phase={state.phase} />
         <OrbitControls 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.1}
            autoRotate={state.phase === SimulationPhase.CRUISE || state.phase === SimulationPhase.SENSING}
            autoRotateSpeed={0.5}
         />
      </Canvas>

      {/* UI Overlay */}
      <Interface 
         currentPhase={state.phase}
         audioLevel={state.audioLevel}
         report={state.report}
         isGeneratingReport={state.isGeneratingReport}
         onNext={nextPhase}
         onReset={resetSimulation}
         onGenerateReport={handleGenerateReport}
      />
    </div>
  );
};

export default App;
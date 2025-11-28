export enum SimulationPhase {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  TRIGGERED = 'TRIGGERED',
  EJECTION = 'EJECTION',
  CRUISE = 'CRUISE',
  SENSING = 'SENSING',
  LANDING = 'LANDING',
}

export interface ScenarioStep {
  phase: SimulationPhase;
  title: string;
  description: string;
  icon: string;
}

export interface SimulationState {
  phase: SimulationPhase;
  audioLevel: number;
  threatLevel: number;
  report: string | null;
  isGeneratingReport: boolean;
}
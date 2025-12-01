import { SimulationPhase, ScenarioStep } from './types';

export const SCENARIO_STEPS: ScenarioStep[] = [
  {
    phase: SimulationPhase.LISTENING,
    title: "監聽 (Listening)",
    description: "「擬態花托」靜置於城市角落或森林中，持續吸收並監聽環境噪音。此時所有「蒲公英種子」都吸附在花托上充電。",
    icon: "Ear"
  },
  {
    phase: SimulationPhase.TRIGGERED,
    title: "觸發 (Trigger)",
    description: "檢測到異常巨響（如槍聲、非法伐木鋸聲）。系統判斷需要空中確認。",
    icon: "AlertTriangle"
  },
  {
    phase: SimulationPhase.EJECTION,
    title: "噴射 (Ejection)",
    description: "花托對準噪音來源方向，利用壓縮氣體將數枚「蒲公英無人機」彈射至空中。",
    icon: "Rocket"
  },
  {
    phase: SimulationPhase.CRUISE,
    title: "靜音巡航 (Silent Cruise)",
    description: "無人機啟動冠毛上的「等離子風」，產生穩定的分離渦旋環。它們安靜地懸停或滑翔至目標上空，因無機械噪音，目標物完全無法察覺。",
    icon: "Wind"
  },
  {
    phase: SimulationPhase.SENSING,
    title: "感測與回傳 (Sensing)",
    description: "利用極致安靜的飛行特性，錄製清晰的音頻證據並回傳。",
    icon: "Wifi"
  },
  {
    phase: SimulationPhase.LANDING,
    title: "回收或降落 (Landing)",
    description: "任務結束或電力低時，若環境濕度高（或人為加濕），冠毛收縮，快速降落至地面或指定回收網。",
    icon: "Download"
  }
];

export const DRONE_COUNT = 12;
export const AUDIO_THRESHOLD = 0.6; // Threshold to auto-trigger

import { SimulationPhase, ScenarioStep } from './types';

export const SCENARIO_STEPS: ScenarioStep[] = [
  {
    phase: SimulationPhase.LISTENING,
    title: "監聽 (Listening)",
    description: "「擬態花托」靜置於城市角落，持續吸收並監聽環境噪音。蒲公英種子無人機吸附充電中。",
    icon: "Ear"
  },
  {
    phase: SimulationPhase.TRIGGERED,
    title: "觸發 (Trigger)",
    description: "檢測到異常巨響（如槍聲、非法伐木）。系統判定威脅等級上升，準備發射。",
    icon: "AlertTriangle"
  },
  {
    phase: SimulationPhase.EJECTION,
    title: "噴射 (Ejection)",
    description: "花托對準噪音來源，利用壓縮氣體將「蒲公英無人機」彈射至空中。",
    icon: "Rocket"
  },
  {
    phase: SimulationPhase.CRUISE,
    title: "靜音巡航 (Silent Cruise)",
    description: "啟動冠毛「等離子風」，產生穩定分離渦旋環。無人機安靜懸停滑翔至目標上空。",
    icon: "Wind"
  },
  {
    phase: SimulationPhase.SENSING,
    title: "感測與回傳 (Sensing)",
    description: "利用極致安靜特性，錄製清晰音頻與影像證據並實時回傳指揮中心。",
    icon: "Wifi"
  },
  {
    phase: SimulationPhase.LANDING,
    title: "回收 (Landing)",
    description: "任務結束，冠毛收縮，快速降落至地面或指定回收點。",
    icon: "Download"
  }
];

export const DRONE_COUNT = 12;
export const AUDIO_THRESHOLD = 0.6; // Threshold to auto-trigger
import { create } from "zustand";

export type GameState = "ready" | "running" | "battle" | "win" | "lose";
export const GameState = {
  READY: "ready" as GameState,
  RUNNING: "running" as GameState,
  BATTLE: "battle" as GameState,
  WIN: "win" as GameState,
  LOSE: "lose" as GameState,
};

export type GateType = "add" | "subtract" | "multiply" | "divide";
export const GateType = {
  ADD: "add" as GateType,
  SUBTRACT: "subtract" as GateType,
  MULTIPLY: "multiply" as GateType,
  DIVIDE: "divide" as GateType,
};

export type BattleStatus = "none" | "approaching" | "engaged" | "victory" | "defeat";

interface GameStore {
  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  // Level/difficulty
  level: number;
  setLevel: (level: number) => void;

  // Runner properties
  runnerPosition: number; // X position of runner
  setRunnerPosition: (position: number) => void;

  // Crowd properties
  crowdCount: number;
  initialCrowdCount: number;
  setCrowdCount: (count: number) => void;
  updateCrowdCount: (gateType: GateType, value: number) => void;

  // Enemy properties
  enemyCount: number;
  initialEnemyCount: number;
  setEnemyCount: (count: number) => void;
  enemyPosition: number; // Z position of enemy (distance from player)
  setEnemyPosition: (position: number) => void;
  
  // Battle properties
  battleStatus: BattleStatus;
  setBattleStatus: (status: BattleStatus) => void;
  battleDuration: number; // How long battles last (in seconds)
  
  // Game properties
  speed: number;
  setSpeed: (speed: number) => void;
  score: number;
  addScore: (points: number) => void;
  
  // Sound options
  soundEnabled: boolean;
  toggleSound: () => void;

  // Game actions
  startGame: () => void;
  startBattle: () => void;
  endBattle: (won: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Game state
  gameState: GameState.READY,
  setGameState: (state) => set({ gameState: state }),
  
  // Level/difficulty
  level: 1,
  setLevel: (level) => set({ level }),

  // Runner properties
  runnerPosition: 0,
  setRunnerPosition: (position) => set({ runnerPosition: position }),

  // Crowd properties
  crowdCount: 1,
  initialCrowdCount: 1,
  setCrowdCount: (count) => set({ crowdCount: Math.max(0, count) }),
  updateCrowdCount: (gateType, value) =>
    set((state) => {
      let newCount = state.crowdCount;

      switch (gateType) {
        case GateType.ADD:
          newCount = state.crowdCount + value;
          break;
        case GateType.SUBTRACT:
          newCount = Math.max(1, state.crowdCount - value);
          break;
        case GateType.MULTIPLY:
          newCount = state.crowdCount * value;
          break;
        case GateType.DIVIDE:
          newCount = Math.max(1, Math.floor(state.crowdCount / value));
          break;
      }

      return { crowdCount: newCount };
    }),

  // Enemy properties
  enemyCount: 0,
  initialEnemyCount: 50, // Default initial enemy count
  setEnemyCount: (count) => set({ enemyCount: Math.max(0, count) }),
  enemyPosition: 150, // Default starting position
  setEnemyPosition: (position) => set({ enemyPosition: position }),
  
  // Battle properties
  battleStatus: "none",
  setBattleStatus: (status: BattleStatus) => set({ battleStatus: status }),
  battleDuration: 3, // 3 seconds by default
  
  // Game properties
  speed: 5, // Units per second
  setSpeed: (speed) => set({ speed }),
  score: 0,
  addScore: (points) => set((state) => ({ score: state.score + points })),
  
  // Sound options
  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  // Game actions
  startGame: () => set({ 
    gameState: GameState.RUNNING,
    battleStatus: "none",
    score: 0
  }),
  
  startBattle: () => set((state) => ({
    gameState: GameState.BATTLE,
    battleStatus: "engaged",
    initialCrowdCount: state.crowdCount,
    initialEnemyCount: state.enemyCount
  })),
  
  endBattle: (won) => set((state) => {
    // Calculate score from battle
    const scoreChange = won 
      ? Math.floor(state.initialEnemyCount * 10) 
      : 0;
      
    return {
      gameState: won ? GameState.WIN : GameState.LOSE,
      battleStatus: won ? "victory" : "defeat",
      score: state.score + scoreChange
    };
  }),
  
  resetGame: () => set({
    gameState: GameState.READY,
    battleStatus: "none",
    crowdCount: 1,
    initialCrowdCount: 1,
    runnerPosition: 0,
    enemyCount: 0,
    initialEnemyCount: 50,
    enemyPosition: 150,
    speed: 5,
    level: 1,
    score: 0
  }),
}));

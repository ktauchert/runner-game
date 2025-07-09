import { create } from "zustand";

export type GameState = "ready" | "running" | "battle" | "win" | "lose" | "level_complete";
export const GameState = {
  READY: "ready" as GameState,
  RUNNING: "running" as GameState,
  BATTLE: "battle" as GameState,
  WIN: "win" as GameState,
  LOSE: "lose" as GameState,
  LEVEL_COMPLETE: "level_complete" as GameState,
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
  
  // Finish line properties
  finishLinePosition: number;
  setFinishLinePosition: (position: number) => void;
  currentStage: number; // Tracks which enemy group the player is facing (1, 2, etc.)
  advanceStage: () => void;
  
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
  completeLevel: () => void;
  nextLevel: () => void;
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
  
  // Finish line properties
  finishLinePosition: 250, // Position of the finish line (after two enemy battles)
  setFinishLinePosition: (position) => set({ finishLinePosition: position }),
  currentStage: 1, // Start at stage 1
  advanceStage: () => set((state) => ({ 
    currentStage: state.currentStage + 1,
    // Reset enemy position for next stage
    enemyPosition: state.currentStage === 1 ? 100 : state.finishLinePosition
  })),
  
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
    currentStage: 1,
    enemyPosition: 150
  }),
  
  startBattle: () => set((state) => ({
    gameState: GameState.BATTLE,
    battleStatus: "engaged",
    initialCrowdCount: state.crowdCount,
    initialEnemyCount: state.enemyCount
  })),
  
  endBattle: (won) => set((state) => {
    // Calculate battle score
    const scoreChange = won 
      ? Math.floor(state.initialEnemyCount * 5) 
      : 0;
    
    // If the player loses, game over
    if (!won) {
      return {
        gameState: GameState.LOSE,
        battleStatus: "defeat",
        score: state.score + scoreChange
      };
    }
    
    // If player wins and there are more stages to go
    if (state.currentStage < 2) {
      return {
        gameState: GameState.RUNNING,
        battleStatus: "victory",
        score: state.score + scoreChange
      };
    }
    
    // If player wins the final stage, advance to finish line
    return {
      gameState: GameState.RUNNING,
      battleStatus: "victory",
      score: state.score + scoreChange
    };
  }),
  
  completeLevel: () => set((state) => {
    // Calculate finish line bonus based on level difficulty and remaining crowd
    const levelBonus = state.level * state.crowdCount * 10;
    
    return {
      gameState: GameState.LEVEL_COMPLETE,
      score: state.score + levelBonus
    };
  }),
  
  nextLevel: () => set((state) => ({
    gameState: GameState.READY,
    level: state.level + 1,
    currentStage: 1,
    crowdCount: Math.max(1, Math.floor(state.crowdCount / 2)), // Start with half the crowd from previous level
    enemyPosition: 150
  })),
  
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
    score: 0,
    currentStage: 1,
    finishLinePosition: 250
  }),
}));

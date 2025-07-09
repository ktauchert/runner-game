import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";
import { Leva, useControls } from "leva";
import { useGameStore, GameState, GateType } from "./store/useGameStore";
import Runner from "./components/Runner";
import Arena from "./components/Arena";
import Gate from "./components/Gate";
import CrowdManager from "./components/CrowdManager";
import EnemyGroup from "./components/EnemyGroup";
import GameUI from "./components/GameUI";
import ParticleSystem from "./components/ParticleSystem";
import FinishLine from "./components/FinishLine";

// Import sound manager
import { SoundManager } from "./utils/soundManager";

function App() {
  // Game state
  const gameState = useGameStore((state) => state.gameState);
  const crowdCount = useGameStore((state) => state.crowdCount);
  const enemyCount = useGameStore((state) => state.enemyCount);
  const startGame = useGameStore((state) => state.startGame);
  const resetGame = useGameStore((state) => state.resetGame);
  const level = useGameStore((state) => state.level);
  const score = useGameStore((state) => state.score);
  const setEnemyPosition = useGameStore((state) => state.setEnemyPosition);
  const soundEnabled = useGameStore((state) => state.soundEnabled);
  const toggleSound = useGameStore((state) => state.toggleSound);
  const endBattle = useGameStore((state) => state.endBattle);

  // Production controls with debug disabled by default
  const { difficultyMultiplier, gateSpacing } = useControls({
    difficultyMultiplier: {
      value: 1,
      min: 0.5,
      max: 2,
      step: 0.1,
    },
    gateSpacing: {
      value: 20,
      min: 10,
      max: 40,
      step: 1,
    },
  });

  // Gate configuration based on level
  const { numberOfGates, enemyStartingCount } = useMemo(() => {
    return {
      numberOfGates: 10 + Math.min(10, level - 1), // Add more gates per level up to 20
      enemyStartingCount: 10 * Math.pow(1.5, level - 1) * difficultyMultiplier, // Scale enemy count with level
    };
  }, [level, difficultyMultiplier]);

  // Setup gates
  const gates = useMemo(() => {
    const gatesList = [];

    for (let i = 0; i < numberOfGates; i++) {
      const zPosition = (i + 1) * gateSpacing;
      const xPosition = (Math.random() - 0.5) * 8; // Random X position
      
      // Make gates more challenging as game progresses
      const gateTypeWeights = level > 2
        ? [30, 30, 20, 20] // More even distribution in later levels
        : [40, 20, 30, 10]; // More adds/multiplies in early levels
      
      // Weighted random selection of gate type
      let randomValue = Math.random() * 100;
      let gateTypeIndex = 0;
      let accumWeight = 0;
      
      for (let j = 0; j < gateTypeWeights.length; j++) {
        accumWeight += gateTypeWeights[j];
        if (randomValue <= accumWeight) {
          gateTypeIndex = j;
          break;
        }
      }
      
      const gateTypes = [
        GateType.ADD,
        GateType.SUBTRACT,
        GateType.MULTIPLY,
        GateType.DIVIDE,
      ];
      const gateType = gateTypes[gateTypeIndex];

      // Value based on gate type and level
      let value;
      const levelFactor = Math.min(level, 5); // Cap at level 5 for values
      
      switch (gateType) {
        case GateType.ADD:
          value = Math.floor(Math.random() * (10 * levelFactor)) + levelFactor; // +level to +(10*level)
          break;
        case GateType.SUBTRACT:
          value = Math.floor(Math.random() * (4 + levelFactor)) + 1; // -1 to -(4+level)
          break;
        case GateType.MULTIPLY:
          value = Math.floor(Math.random() * 3) + 2; // ×2 to ×4
          break;
        case GateType.DIVIDE:
          value = Math.floor(Math.random() * 2) + 2; // ÷2 or ÷3
          break;
        default:
          value = 1;
      }

      gatesList.push({
        position: [xPosition, 0, zPosition] as [number, number, number],
        type: gateType,
        value,
        id: `gate-${i}`,
      });
    }

    return gatesList;
  }, [gateSpacing, numberOfGates, level]);

  // Track enemy position and update the store
  const enemyPositionRef = useRef<number>(150);
  const [showWarning, setShowWarning] = useState(false);
  const [warningLevel, setWarningLevel] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const currentStage = useGameStore((state) => state.currentStage);
  const finishLinePosition = useGameStore((state) => state.finishLinePosition);
  const advanceStage = useGameStore((state) => state.advanceStage);

  // Reset enemy position when game state changes to READY
  useEffect(() => {
    if (gameState === GameState.READY) {
      enemyPositionRef.current = 150;
      setEnemyPosition(150);
      setWarningLevel(0);
      console.log("Reset enemy position to 150");
    }
  }, [gameState, setEnemyPosition]);

  // Handle stage transitions after battle
  useEffect(() => {
    const setGameState = useGameStore.getState().setGameState;
    
    if (gameState === GameState.WIN && currentStage < 2) {
      // Short delay then advance to next stage with new enemies
      const nextStageTimer = setTimeout(() => {
        advanceStage();
        setGameState(GameState.RUNNING);
        
        // Set new enemy position for next stage
        enemyPositionRef.current = currentStage === 1 ? 100 : finishLinePosition;
        setEnemyPosition(enemyPositionRef.current);
        setWarningLevel(0);
        
        if (soundEnabled) SoundManager.play("buttonClick");
        
      }, 2000);
      
      return () => clearTimeout(nextStageTimer);
    }
  }, [gameState, currentStage, advanceStage, setEnemyPosition, finishLinePosition, soundEnabled]);

  // Sound effects
  useEffect(() => {
    if (!soundEnabled) {
      SoundManager.stopAll();
      return;
    }

    // Play sounds based on game state
    if (gameState === GameState.RUNNING && warningLevel === 3) {
      SoundManager.play("warning");
    } else if (gameState === GameState.BATTLE) {
      SoundManager.play("battleStart");
      SoundManager.play("battleOngoing");
    } else if (gameState === GameState.WIN) {
      SoundManager.stop("battleOngoing");
      SoundManager.play("victory");
    } else if (gameState === GameState.LOSE) {
      SoundManager.stop("battleOngoing");
      SoundManager.play("defeat");
    }

    // Stop sounds when component unmounts
    return () => {
      if (gameState !== GameState.RUNNING && 
          gameState !== GameState.BATTLE) {
        SoundManager.stopAll();
      }
    };
  }, [gameState, warningLevel, soundEnabled]);

  // Position updater component that syncs with the frame rate
  const PositionUpdater = () => {
    useFrame((_, delta) => {
      if (gameState === GameState.RUNNING) {
        // Update enemy position based on frame rate for smooth movement
        const currentSpeed = useGameStore.getState().speed;
        enemyPositionRef.current -= delta * currentSpeed;
        setEnemyPosition(enemyPositionRef.current);

        // Check for finish line collision - this happens in the FinishLine component
        // but we also need to know if we're close to the finish line
        if (currentStage >= 2 && Math.abs(enemyPositionRef.current - finishLinePosition) <= 40 && warningLevel < 1) {
          setWarningLevel(1);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          if (soundEnabled) SoundManager.play("warning");
        }

        // Check for warnings at different distances for enemy encounters
        else if (currentStage < 2 && enemyPositionRef.current <= 100 && warningLevel < 1) {
          setWarningLevel(1);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          if (soundEnabled) SoundManager.play("warning");
        } else if (currentStage < 2 && enemyPositionRef.current <= 70 && warningLevel < 2) {
          setWarningLevel(2);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          if (soundEnabled) SoundManager.play("warning");
        } else if (enemyPositionRef.current <= 50 && warningLevel < 3) {
          setWarningLevel(3);
          setShowWarning(true);
          setShowParticles(true);
          setTimeout(() => setShowWarning(false), 3000);
          if (soundEnabled) SoundManager.play("warning");
        }
      }

      // Handle crowd reduction during battle
      if (gameState === GameState.BATTLE) {
        // Reduce player crowd count during battle based on enemy strength
        const currentEnemyCount = useGameStore.getState().enemyCount;
        const currentCrowdCount = useGameStore.getState().crowdCount;

        if (currentEnemyCount > 0 && currentCrowdCount > 0) {
          // Calculate reduction rate based on enemy count
          const crowdReductionRate = delta * currentEnemyCount * 0.2;
          // Get a reference to setCrowdCount function
          const setCrowdCount = useGameStore.getState().setCrowdCount;
          // Apply the reduction
          const newCrowdCount = Math.max(0, currentCrowdCount - crowdReductionRate);
          // Only update if there's a significant change
          if (Math.abs(newCrowdCount - currentCrowdCount) >= 0.1) {
            setCrowdCount(Math.floor(newCrowdCount));
          }
        }
        
        // Auto-end battle after 5 seconds to prevent endless battles
        if (currentEnemyCount <= 0) {
          endBattle(true); // Victory
        } else if (currentCrowdCount <= 0) {
          endBattle(false); // Defeat
        }
      }
    });

    return null;
  };

  // Custom camera component to ensure correct orientation
  const CameraSetup = () => {
    const { camera } = useThree();
    const cameraRef = useRef<THREE.PerspectiveCamera>(
      camera as THREE.PerspectiveCamera
    );

    useEffect(() => {
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 10, -10);
        cameraRef.current.lookAt(0, 0, 10);

        // Log to confirm camera setup
        console.log("Camera setup complete", {
          position: cameraRef.current.position,
          fov: cameraRef.current.fov,
        });
      }
    }, []);

    useFrame(() => {
      // Make sure camera is always looking at a point ahead of the runner
      if (cameraRef.current) {
        cameraRef.current.lookAt(0, 0, 10);
      }
    });

    return null;
  };

  return (
    <div className="game-container">
      {/* Game UI Component */}
      <GameUI debug={false} />

      {/* Warning display */}
      {showWarning && (
        <div className="warning-message">
          <h2 style={{ color: "white", margin: 0 }}>
            {currentStage >= 2 && warningLevel === 1 && "FINISH LINE AHEAD!"}
            {currentStage < 2 && warningLevel === 1 && "ENEMIES DETECTED AHEAD!"}
            {currentStage < 2 && warningLevel === 2 && "WARNING: ENEMY FORCES APPROACHING!"}
            {currentStage < 2 && warningLevel === 3 && "DANGER! PREPARE FOR BATTLE!"}
          </h2>
          <p style={{ color: "white", marginTop: "10px" }}>
            {currentStage >= 2 && warningLevel === 1 && "Reach the finish line to complete the level!"}
            {currentStage < 2 && warningLevel === 1 && "Enemy crowd spotted in the distance"}
            {currentStage < 2 && warningLevel === 2 && `${enemyCount} enemies approaching fast!`}
            {currentStage < 2 && warningLevel === 3 && "BATTLE IMMINENT!"}
          </p>
        </div>
      )}

      {/* Start screen */}
      {gameState === GameState.READY && (
        <div className="start-screen">
          <div className="start-content">
            <h1 className="game-title">Crowd Runner</h1>
            {level > 1 && (
              <div className="level-display">LEVEL {level}</div>
            )}
            {score > 0 && (
              <div className="score-display">SCORE: {score}</div>
            )}
            <button className="start-button" onClick={startGame}>
              {level === 1 ? "Start Game" : "Continue"}
            </button>
            
            <div className="sound-toggle" onClick={toggleSound}>
              {soundEnabled ? "🔊 Sound ON" : "🔇 Sound OFF"}
            </div>
          </div>
        </div>
      )}

      {/* Win/Lose screen */}
      {(gameState === GameState.WIN || gameState === GameState.LOSE) && (
        <div className="end-screen">
          <div className="end-content">
            <h1 className={gameState === GameState.WIN ? "victory-title" : "defeat-title"}>
              {gameState === GameState.WIN ? "Victory!" : "Defeat!"}
            </h1>
            <div className="battle-stats">
              <div className="battle-stat">
                <span className="label">Your crowd:</span>
                <span className="value">{crowdCount}</span>
              </div>
              <div className="battle-stat">
                <span className="label">Enemy crowd:</span>
                <span className="value">{enemyCount}</span>
              </div>
            </div>
            
            {gameState === GameState.WIN && (
              <div className="score-info">
                <div className="level-complete">LEVEL {level} COMPLETE!</div>
                <div className="score-display">SCORE: {score}</div>
              </div>
            )}
            
            <button className="play-again-button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Level Complete screen */}
      {gameState === GameState.LEVEL_COMPLETE && (
        <div className="end-screen">
          <div className="end-content">
            <h1 className="victory-title">Level Complete!</h1>
            <div className="level-stats">
              <div className="level-stat">
                <span className="label">Level:</span>
                <span className="value">{level}</span>
              </div>
              <div className="level-stat">
                <span className="label">Survivors:</span>
                <span className="value">{crowdCount}</span>
              </div>
              <div className="level-stat">
                <span className="label">Bonus:</span>
                <span className="value">+{level * crowdCount * 10}</span>
              </div>
              <div className="level-stat total-score">
                <span className="label">Total Score:</span>
                <span className="value">{score}</span>
              </div>
            </div>
            
            <button className="next-level-button" onClick={useGameStore((state) => state.nextLevel)}>
              Next Level
            </button>
          </div>
        </div>
      )}

      {/* 3D Game Canvas */}
      <Canvas shadows className="game-canvas">
        {/* Camera */}
        <CameraSetup />
        {/* Position updater for enemy distance */}
        <PositionUpdater />
        
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[10, 15, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[0, 10, 0]} intensity={1} />
        
        {/* Environment */}
        <Sky sunPosition={[10, 5, 10]} />
        
        {/* Game components */}
        <Arena />
        <Runner position={[0, 0, 0]} />
        <CrowdManager />
        
        {/* Particle effects */}
        {showParticles && gameState === GameState.RUNNING && (
          <ParticleSystem 
            position={[0, 2, Math.min(50, enemyPositionRef.current)]}
            color="#ff3333" 
            count={100}
            size={0.2}
            spread={0.5}
            speed={0.5}
            emitting={true}
            event="battle"
          />
        )}
        
        {gameState === GameState.BATTLE && (
          <>
            <ParticleSystem 
              position={[0, 1, 0]}
              color="#ff8888" 
              count={200}
              size={0.15}
              spread={3}
              emitting={true}
              event="battle"
            />
          </>
        )}
        
        {gameState === GameState.WIN && (
          <ParticleSystem 
            position={[0, 1, 0]}
            color="#88ff88" 
            count={300}
            size={0.2}
            spread={5}
            emitting={true}
            event="victory"
          />
        )}
        
        {gameState === GameState.LOSE && (
          <ParticleSystem 
            position={[0, 3, 0]}
            color="#ff4444" 
            count={200}
            size={0.2}
            spread={3}
            emitting={true}
            event="defeat"
          />
        )}
        
        {gameState === GameState.LEVEL_COMPLETE && (
          <ParticleSystem 
            position={[0, 2, 0]}
            color="#ffff00" 
            count={500}
            size={0.15}
            spread={8}
            emitting={true}
            event="victory"
          />
        )}
        
        {/* Gates - show all gates in gameplay */}
        {gameState === GameState.RUNNING &&
          gates.map((gate) => (
            <Gate
              key={gate.id}
              position={gate.position}
              type={gate.type}
              value={gate.value}
            />
          ))}
          
        {/* Enemy group based on stage */}
        {(gameState !== GameState.READY && gameState !== GameState.LEVEL_COMPLETE) && (
          <EnemyGroup
            position={[0, 0, enemyPositionRef.current]}
            enemyCount={Math.floor(currentStage === 1 
              ? enemyStartingCount 
              : enemyStartingCount * 1.5)} // Second stage has more enemies
          />
        )}

        {/* Finish line - only show after defeating the second enemy group */}
        {gameState === GameState.RUNNING && currentStage >= 2 && (
          <FinishLine position={[0, 0, finishLinePosition]} />
        )}
      </Canvas>

      {/* Hide Leva UI completely */}
      <Leva hidden={true} />
    </div>
  );
}

export default App;

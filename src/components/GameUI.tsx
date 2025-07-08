import { useEffect, useState } from 'react';
import '../styles/GameUI.css';
import { useGameStore, GameState } from '../store/useGameStore';

type Props = {
  debug?: boolean;
}

const GameUI = ({ debug = false }: Props) => {
  const gameState = useGameStore(state => state.gameState);
  const crowdCount = useGameStore(state => state.crowdCount);
  const enemyCount = useGameStore(state => state.enemyCount);
  const enemyPosition = useGameStore(state => state.enemyPosition);
  const level = useGameStore(state => state.level);
  const score = useGameStore(state => state.score);
  
  // For battle progress animation
  const [battleProgress, setBattleProgress] = useState(0);
  const [battleResult, setBattleResult] = useState<'pending' | 'victory' | 'defeat'>('pending');
  
  // Start battle animation when battle begins
  useEffect(() => {
    if (gameState === GameState.BATTLE) {
      setBattleProgress(0);
      setBattleResult('pending');
      
      const battleInterval = setInterval(() => {
        setBattleProgress(prev => {
          if (prev >= 100) {
            clearInterval(battleInterval);
            return 100;
          }
          return prev + 1;
        });
      }, 30); // 3 seconds total duration (30ms * 100)
      
      // Determine result near the end of the battle
      const resultTimer = setTimeout(() => {
        if (crowdCount > enemyCount) {
          setBattleResult('victory');
        } else {
          setBattleResult('defeat');
        }
      }, 2700); // Show result slightly before battle ends
      
      return () => {
        clearInterval(battleInterval);
        clearTimeout(resultTimer);
      };
    }
  }, [gameState, crowdCount, enemyCount]);
  
  // Reset progress when game resets
  useEffect(() => {
    if (gameState === GameState.READY) {
      setBattleProgress(0);
      setBattleResult('pending');
    }
  }, [gameState]);
  
  return (
    <div className="game-ui">
      {/* Base UI elements that are always visible during gameplay */}
      {gameState !== GameState.READY && (
        <div className="stats-panel">
          <div className="crowd-count">
            <span className="label">YOUR CROWD:</span>
            <span className="value">{crowdCount}</span>
          </div>
          
          {level > 1 && (
            <div className="level-info">
              <span className="label">LEVEL:</span>
              <span className="value">{level}</span>
            </div>
          )}
          
          {score > 0 && (
            <div className="score-info">
              <span className="label">SCORE:</span>
              <span className="value">{score}</span>
            </div>
          )}
          
          {gameState === GameState.RUNNING && (
            <div className="enemy-distance danger">
              <span className="label">ENEMY DISTANCE:</span>
              <span className="value">{Math.max(0, Math.floor(enemyPosition || 150))} units</span>
            </div>
          )}
          
          {(gameState === GameState.BATTLE || gameState === GameState.WIN || gameState === GameState.LOSE) && (
            <div className="enemy-count danger">
              <span className="label">ENEMY CROWD:</span>
              <span className="value">{enemyCount}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Battle UI overlay */}
      {gameState === GameState.BATTLE && (
        <div className="battle-overlay">
          <div className="battle-header">
            <h2 className="battle-title">BATTLE IN PROGRESS</h2>
          </div>
          
          <div className="battle-progress-container">
            <div className="battle-sides">
              <div className="battle-side player">
                <div className="battle-label">YOUR CROWD</div>
                <div className="battle-value">{crowdCount}</div>
              </div>
              
              <div className="battle-progress">
                <div 
                  className="battle-progress-bar"
                  style={{ width: `${battleProgress}%` }}
                ></div>
              </div>
              
              <div className="battle-side enemy">
                <div className="battle-label">ENEMIES</div>
                <div className="battle-value">{enemyCount}</div>
              </div>
            </div>
          </div>
          
          {battleProgress > 90 && (
            <div className={`battle-result ${battleResult}`}>
              {battleResult === 'victory' ? 'VICTORY IMMINENT!' : 'DEFEAT IMMINENT!'}
            </div>
          )}
        </div>
      )}
      
      {/* Debug info */}
      {debug && (
        <div className="debug-panel">
          <h3>Debug Info</h3>
          <p>Game State: {gameState}</p>
          <p>Crowd Count: {crowdCount}</p>
          <p>Enemy Count: {enemyCount}</p>
          <p>Enemy Position: {Math.floor(enemyPosition || 0)}</p>
          <p>Level: {level}</p>
          <p>Score: {score}</p>
          <p>Battle Progress: {battleProgress}%</p>
          <p>Battle Result: {battleResult}</p>
        </div>
      )}
    </div>
  );
};

export default GameUI;

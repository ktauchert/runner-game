import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore, GameState } from "../store/useGameStore";

type Props = {
  position: [number, number, number];
  enemyCount: number;
};

const EnemyGroup = ({ position, enemyCount }: Props) => {
  // Game state
  const gameState = useGameStore((state) => state.gameState);
  const runnerPosition = useGameStore((state) => state.runnerPosition);
  const speed = useGameStore((state) => state.speed);
  const crowdCount = useGameStore((state) => state.crowdCount);
  const setEnemyCount = useGameStore((state) => state.setEnemyCount);
  const startBattle = useGameStore((state) => state.startBattle);
  const setGameState = useGameStore((state) => state.setGameState);

  // Component state
  const [hasCollided, setHasCollided] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const currentEnemyCount = useRef(enemyCount);

  // Initialize enemy count in game store
  useEffect(() => {
    // Make sure we have a valid number
    const validEnemyCount = Math.max(1, enemyCount || 50);
    setEnemyCount(validEnemyCount);
    currentEnemyCount.current = validEnemyCount;
    console.log("Enemy group initialized with", validEnemyCount, "enemies");
  }, [enemyCount, setEnemyCount]);

  // Battle mechanics
  useEffect(() => {
    if (gameState === GameState.BATTLE) {
      // Start a countdown to determine battle outcome after 3 seconds
      const battleTimer = setTimeout(() => {
        if (crowdCount > currentEnemyCount.current) {
          setGameState(GameState.WIN);
        } else {
          setGameState(GameState.LOSE);
        }
      }, 3000);

      // Clean up timer if component unmounts during battle
      return () => clearTimeout(battleTimer);
    }
  }, [gameState, crowdCount, currentEnemyCount, setGameState]);

  // Move and handle collision like a gate
  useFrame((_, delta) => {
    if (!groupRef.current || hasCollided || gameState !== GameState.RUNNING)
      return;

    // Move the enemy group towards the player
    groupRef.current.position.z -= delta * speed;

    // Check for collision with the runner
    if (
      groupRef.current.position.z < 0.5 &&
      groupRef.current.position.z > -0.5
    ) {
      // Runner is at z=0, so check X position
      const halfWidth = 5; // Half the width of the enemy area
      if (Math.abs(groupRef.current.position.x - runnerPosition) < halfWidth) {
        // Collision detected - start battle!
        setHasCollided(true);
        startBattle();
        console.log("Battle started! Enemy count:", currentEnemyCount.current);
      }
    }

    // Remove enemies that are far behind the player
    if (groupRef.current.position.z < -20) {
      groupRef.current.visible = false;
    }
  });

  // Battle effects
  useFrame((_, delta) => {
    if (gameState === GameState.BATTLE) {
      // Reduce enemy count based on player's crowd size (faster reduction for better feedback)
      const reductionRate = delta * crowdCount * 0.4; // Slightly faster reduction
      const newCount = Math.max(0, currentEnemyCount.current - reductionRate);

      // Only update if there's a significant change (to improve performance)
      if (Math.abs(newCount - currentEnemyCount.current) >= 0.1) {
        currentEnemyCount.current = newCount;
        setEnemyCount(Math.floor(currentEnemyCount.current));
      }
    }
  });

  // Calculate how many enemies to display based on current count
  const visibleEnemyCount = Math.min(Math.floor(currentEnemyCount.current), 25); // Limit to 25 visible enemies max

  // Create a grid of enemy positions based on current enemy count
  const enemyPositions = Array(visibleEnemyCount)
    .fill(0)
    .map((_, i) => {
      // Calculate grid dimensions based on enemy count
      const gridSize = Math.ceil(Math.sqrt(visibleEnemyCount));
      const row = Math.floor(i / gridSize) - Math.floor(gridSize / 2);
      const col = (i % gridSize) - Math.floor(gridSize / 2);
      
      // Base position with tighter spacing for more enemies
      let x = col * 1.5;
      let y = 0.5;
      let z = row * 1.5;
      
      // During battle, animate the enemies
      if (gameState === GameState.BATTLE) {
        // Make enemies move toward the player during battle
        z -= 2;
        
        // Make enemies that are about to be removed "fall down"
        // Enemies that will disappear soon start falling
        if (i > visibleEnemyCount - crowdCount * 0.2) {
          y -= 1.0; // Make them fall down
        }
        
        // Add some randomization to their movement during battle
        const t = Date.now() * 0.001 + i;
        x += Math.sin(t * 3) * 0.2;
        z += Math.cos(t * 3) * 0.2;
      }
      
      return [x, y, z];
    });

  return (
    <group ref={groupRef} position={position}>
      {/* Enemy platform base */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[10, 0.5, 10]} />
        <meshStandardMaterial color="#440000" />
      </mesh>

      {/* Individual enemy capsules */}
      {enemyPositions.map((pos, i) => (
        <mesh
          key={`enemy-${i}`}
          position={pos as [number, number, number]}
          castShadow
        >
          <capsuleGeometry args={[0.5, 1, 8, 8]} />
          <meshStandardMaterial
            color="red"
            emissive="red"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {/* Enemy count display - only show in battle or when close */}
      {(gameState === GameState.BATTLE || gameState === GameState.RUNNING) && (
        <Text
          position={[0, 5, 0]}
          rotation={[0, Math.PI, 0]}
          fontSize={2.5}
          color={gameState === GameState.BATTLE ? "yellow" : "white"}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.2}
          outlineColor="black"
        >
          {`ENEMIES: ${Math.floor(currentEnemyCount.current)}`}
        </Text>
      )}

      {/* Battle status display - only shown during battle */}
      {gameState === GameState.BATTLE && (
        <Text
          position={[0, 7, 0]}
          rotation={[0, Math.PI, 0]}
          fontSize={2}
          color="red"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.2}
          outlineColor="black"
        >
          BATTLE IN PROGRESS
        </Text>
      )}
    </group>
  );
};

export default EnemyGroup;

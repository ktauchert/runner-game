import { useRef, useState } from "react";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore, GameState } from "../store/useGameStore";

type Props = {
  position: [number, number, number];
};

const FinishLine = ({ position }: Props) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hasCollided, setHasCollided] = useState(false);
  
  // Game state
  const runnerPosition = useGameStore((state) => state.runnerPosition);
  const gameState = useGameStore((state) => state.gameState);
  const speed = useGameStore((state) => state.speed);
  const completeLevel = useGameStore((state) => state.completeLevel);
  const level = useGameStore((state) => state.level);

  // Handle collision with runner and movement
  useFrame((_, delta) => {
    if (!meshRef.current || hasCollided || gameState !== GameState.RUNNING) return;

    // Move the finish line towards the player
    meshRef.current.position.z -= delta * speed;

    // Check for collision with the runner
    if (meshRef.current.position.z < 0.5 && meshRef.current.position.z > -0.5) {
      // Runner is at z=0, so check X position
      const halfWidth = 6; // Half the width of the finish line
      if (Math.abs(meshRef.current.position.x - runnerPosition) < halfWidth) {
        // Collision detected!
        setHasCollided(true);
        completeLevel();
        
        // Hide the finish line after collision
        meshRef.current.visible = false;
      }
    }

    // Remove finish line if it's far behind
    if (meshRef.current.position.z < -20) {
      meshRef.current.visible = false;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Finish line arch */}
      <mesh position={[0, 4, 0]} castShadow>
        <boxGeometry args={[12, 0.5, 0.5]} />
        <meshStandardMaterial color="gold" emissive="orange" emissiveIntensity={0.5} />
      </mesh>

      {/* Left pillar */}
      <mesh position={[-6, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial color="gold" emissive="orange" emissiveIntensity={0.5} />
      </mesh>

      {/* Right pillar */}
      <mesh position={[6, 2, 0]} castShadow>
        <boxGeometry args={[0.5, 4, 0.5]} />
        <meshStandardMaterial color="gold" emissive="orange" emissiveIntensity={0.5} />
      </mesh>

      {/* Finish text */}
      <Text
        position={[0, 4, 0]}
        rotation={[0, Math.PI, 0]}
        fontSize={1.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        FINISH
      </Text>

      {/* Level indicator */}
      <Text
        position={[0, 5, 0]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.8}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        LEVEL {level}
      </Text>

      {/* Finish line floor marking */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 2]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Checkered pattern */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh
          key={`check-${i}`}
          position={[i - 5.5, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[1, 2]} />
          <meshStandardMaterial color={i % 2 === 0 ? "white" : "black"} />
        </mesh>
      ))}
    </group>
  );
};

export default FinishLine;

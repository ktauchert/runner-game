import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store/useGameStore";
import * as THREE from "three";
import { useKeyboard } from "../utils/useKeyboard";

type Props = {
  position?: [number, number, number];
};

const Runner = ({ position = [0, 0, 0] }: Props) => {
  const runnerPosition = useGameStore((state) => state.runnerPosition);
  const setRunnerPosition = useGameStore((state) => state.setRunnerPosition);
  const gameState = useGameStore((state) => state.gameState);
  const isGameRunning = gameState === "running" || gameState === "battle";

  // Reference to the mesh
  const meshRef = useRef<THREE.Mesh>(null);

  // Set up keyboard controls
  const keys = useKeyboard();

  // Handle movement
  useFrame((state, delta) => {
    if (!isGameRunning || !meshRef.current) return;

    const moveSpeed = 10;
    let xPosition = runnerPosition;

    // Handle keyboard input
    if (keys.left) xPosition += moveSpeed * delta;
    if (keys.right) xPosition -= moveSpeed * delta;

    // Clamp position to limits (-5 to 5)
    xPosition = Math.max(-5, Math.min(5, xPosition));

    // Update position in store
    if (xPosition !== runnerPosition) {
      setRunnerPosition(xPosition);
    }

    // Update mesh position
    meshRef.current.position.x = xPosition;

    // Add a simple running animation
    if (isGameRunning) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.position.y =
        Math.abs(Math.sin(state.clock.elapsedTime * 10)) * 0.1 + 1;
    }
  });

  return (
    <group
      position={[position[0] + runnerPosition, position[1] + 1, position[2]]}
    >
      {/* Main body */}
      <mesh ref={meshRef} castShadow>
        <capsuleGeometry args={[0.5, 1, 4, 8]} />
        <meshStandardMaterial
          color="blue"
          emissive="skyblue"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="blue"
          emissive="skyblue"
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
};

export default Runner;

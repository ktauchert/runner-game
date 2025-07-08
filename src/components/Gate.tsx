import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { useGameStore, GateType } from "../store/useGameStore";

type Props = {
  position: [number, number, number];
  type: GateType;
  value: number;
  onCollide?: () => void;
};

const Gate = ({ position, type, value, onCollide }: Props) => {
  const meshRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const [hasCollided, setHasCollided] = useState(false);

  // Game state
  const runnerPosition = useGameStore((state) => state.runnerPosition);
  const gameState = useGameStore((state) => state.gameState);
  const speed = useGameStore((state) => state.speed);
  const updateCrowdCount = useGameStore((state) => state.updateCrowdCount);

  // Gate colors based on type
  const getGateColor = () => {
    switch (type) {
      case GateType.ADD:
        return "green";
      case GateType.SUBTRACT:
        return "red";
      case GateType.MULTIPLY:
        return "blue";
      case GateType.DIVIDE:
        return "orange";
      default:
        return "white";
    }
  };

  // Gate text based on type and value
  const getGateText = () => {
    switch (type) {
      case GateType.ADD:
        return `+${value}`;
      case GateType.SUBTRACT:
        return `-${value}`;
      case GateType.MULTIPLY:
        return `×${value}`;
      case GateType.DIVIDE:
        return `÷${value}`;
      default:
        return "";
    }
  };

  useFrame((_, delta) => {
    if (!meshRef.current || hasCollided || gameState !== "running") return;

    // Move the gate towards the player
    meshRef.current.position.z -= delta * speed;

    // Check for collision with the runner
    if (meshRef.current.position.z < 0.5 && meshRef.current.position.z > -0.5) {
      // Runner is at z=0, so check X position
      const gateHalfWidth = 2.5; // Half the width of the gate
      if (
        Math.abs(meshRef.current.position.x - runnerPosition) < gateHalfWidth
      ) {
        // Collision detected!
        setHasCollided(true);
        updateCrowdCount(type, value);
        if (onCollide) onCollide();

        // Hide the gate after collision
        meshRef.current.visible = false;
      }
    }

    // Remove gates that are behind the player
    if (meshRef.current.position.z < -10) {
      meshRef.current.visible = false;
    }
  });

  return (
    <group ref={meshRef} position={position}>
      {/* Gate arch */}
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[6, 0.5, 0.5]} />
        <meshStandardMaterial color={getGateColor()} />
      </mesh>

      {/* Left pillar */}
      <mesh position={[-2.75, 1, 0]} castShadow>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshStandardMaterial color={getGateColor()} />
      </mesh>

      {/* Right pillar */}
      <mesh position={[2.75, 1, 0]} castShadow>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshStandardMaterial color={getGateColor()} />
      </mesh>

      {/* Gate text */}
      <Text
        ref={textRef}
        position={[0, 2, 0]}
        rotation={[0, Math.PI, 0]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {getGateText()}
      </Text>
    </group>
  );
};

export default Gate;

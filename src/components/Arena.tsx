import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store/useGameStore";
import * as THREE from "three";

type Props = {
  length?: number; // Length of the arena (Z-axis)
  width?: number; // Width of the arena (X-axis)
  segments?: number; // Number of segments to create the illusion of movement
};

const Arena = ({ length = 100, width = 12, segments = 20 }: Props) => {
  const arenaRef = useRef<THREE.Group>(null);
  const gameState = useGameStore((state) => state.gameState);
  const speed = useGameStore((state) => state.speed);
  const isGameRunning = gameState === "running" || gameState === "battle";

  // Keep track of how far the arena has moved for looping
  const offsetRef = useRef(0);

  // Create segments for the repeating floor
  const segmentLength = length / segments;
  const segmentRefs = useRef<THREE.Mesh[]>([]);

  useFrame((_, delta) => {
    if (!isGameRunning || !arenaRef.current) return;

    // Move the arena backward to create the illusion of forward movement
    offsetRef.current += delta * speed;

    // If we've moved a full segment, reset the offset to create a continuous loop
    if (offsetRef.current > segmentLength) {
      offsetRef.current = 0;

      // Move the first segment to the end
      if (segmentRefs.current.length > 0) {
        const firstSegment = segmentRefs.current.shift();
        if (firstSegment) {
          firstSegment.position.z -= segmentLength * segments;
          segmentRefs.current.push(firstSegment);
        }
      }
    }

    // Update position of all segments
    segmentRefs.current.forEach((segment, i) => {
      segment.position.z = i * segmentLength - offsetRef.current;
    });
  });

  return (
    <group ref={arenaRef}>
      {/* Create floor segments */}
      {Array.from({ length: segments }).map((_, i) => (
        <mesh
          key={`segment-${i}`}
          ref={(el) => {
            if (el) segmentRefs.current[i] = el;
          }}
          position={[0, 0, i * segmentLength]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[width, segmentLength]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? "#555555" : "#777777"}
            roughness={0.8}
            metalness={0.2}
          />
        </mesh>
      ))}

      {/* Side walls */}
      <mesh
        position={[width / 2 + 0.5, 1, length / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 2, length]} />
        <meshStandardMaterial color="#666" />
      </mesh>

      <mesh
        position={[-width / 2 - 0.5, 1, length / 2]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[1, 2, length]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    </group>
  );
};

export default Arena;

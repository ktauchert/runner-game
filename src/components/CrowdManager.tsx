import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGameStore, GameState } from "../store/useGameStore";
import * as THREE from "three";
import { InstancedMesh } from "three";

type Props = {
  offset?: [number, number, number];
};

const CrowdManager = ({ offset = [0, 0, -2] }: Props) => {
  // Game state
  const crowdCount = useGameStore((state) => state.crowdCount);
  const runnerPosition = useGameStore((state) => state.runnerPosition);
  const gameState = useGameStore((state) => state.gameState);

  // Refs for the instanced mesh
  const instancedMeshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Maximum number of followers (for optimization)
  const MAX_INSTANCES = 1000;

  // Calculate grid formation based on crowd count
  const getGridPositions = (count: number) => {
    const positions: [number, number, number][] = [];
    const rows = Math.ceil(Math.sqrt(count));
    const cols = Math.ceil(count / rows);

    const spacing = 1;
    const offsetX = ((cols - 1) * spacing) / 2;
    const offsetZ = ((rows - 1) * spacing) / 2;

    let index = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (index < count) {
          positions.push([col * spacing - offsetX, 0, row * spacing - offsetZ]);
          index++;
        }
      }
    }

    return positions;
  };

  // Update follower positions
  useFrame((_, delta) => {
    if (!instancedMeshRef.current) return;

    const isBattle = gameState === GameState.BATTLE;
    const positions = getGridPositions(Math.min(crowdCount, MAX_INSTANCES));

    // Update each instance
    positions.forEach((pos, i) => {
      // Base position of the follower
      let x = pos[0] + offset[0] + runnerPosition;
      let y = pos[1] + offset[1];
      let z = pos[2] + offset[2];

      // Add some animation
      const t = Date.now() * 0.001 + i * 0.1;
      const bounce = Math.sin(t * 5) * 0.05;

      // During battle, animate crowd movement and disappearance
      if (isBattle) {
        // Make figures move forward during battle
        const battleProgress = Math.min(5, (Date.now() * 0.001) % 10);
        z += battleProgress;
        
        // Animate "dying" crowd members by making them fall during battle
        // Make the last figures (those that will disappear soon) start falling
        const enemyCount = useGameStore.getState().enemyCount;
        if (i > crowdCount - enemyCount * 0.3 * delta) {
          y -= 0.5; // Make them fall down
        }
      }

      // Update instance matrix
      dummy.position.set(x, y + bounce, z);
      dummy.rotation.y = Math.sin(t) * 0.1;
      dummy.updateMatrix();
      if (instancedMeshRef.current) {
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    if (instancedMeshRef.current) {
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Hide unused instances
    for (let i = positions.length; i < MAX_INSTANCES; i++) {
      dummy.position.set(0, -100, 0); // Move far away
      dummy.updateMatrix();
      if (instancedMeshRef.current) {
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
  });

  return (
    <group>
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, MAX_INSTANCES]}
        castShadow
      >
        {/* Follower body */}
        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
        <meshStandardMaterial color="#ff9999" />
      </instancedMesh>
    </group>
  );
};

export default CrowdManager;

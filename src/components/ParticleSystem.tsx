import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, GameState } from '../store/useGameStore';

type Props = {
  position?: [number, number, number];
  color?: string;
  count?: number;
  size?: number;
  spread?: number;
  lifetime?: number;
  speed?: number;
  emitting?: boolean;
  event?: 'battle' | 'gate' | 'victory' | 'defeat';
}

const ParticleSystem = ({
  position = [0, 1, 0],
  color = '#ffffff',
  count = 50,
  size = 0.1,
  spread = 2,
  lifetime = 2,
  speed = 1,
  emitting = false,
  event = 'battle'
}: Props) => {
  const particles = useRef<THREE.Points>(null);
  const geometry = useRef<THREE.BufferGeometry>(null);
  const gameState = useGameStore(state => state.gameState);
  
  // Create particle attributes
  const particleCount = count;
  const positions = new Float32Array(particleCount * 3);
  const velocities = useRef<Float32Array>(new Float32Array(particleCount * 3));
  const lifetimes = useRef<Float32Array>(new Float32Array(particleCount));
  const startTimes = useRef<Float32Array>(new Float32Array(particleCount));
  
  // Initialize particles
  useEffect(() => {
    if (!geometry.current) return;

    for (let i = 0; i < particleCount; i++) {
      // Set all particles to start at the emitter position
      positions[i * 3] = position[0];
      positions[i * 3 + 1] = position[1];
      positions[i * 3 + 2] = position[2];
      
      // Random velocities
      velocities.current[i * 3] = (Math.random() - 0.5) * spread * speed;
      velocities.current[i * 3 + 1] = Math.random() * spread * speed;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * spread * speed;
      
      // Stagger start times for continuous emission
      startTimes.current[i] = -Math.random() * lifetime;
      lifetimes.current[i] = Math.random() * lifetime + lifetime * 0.5;
    }
    
    // Set positions attribute for buffer geometry
    geometry.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  }, [geometry, position, particleCount, spread, speed, lifetime]);
  
  // Update particles on each frame
  useFrame(({ clock }, delta) => {
    if (!geometry.current || !particles.current) return;
    
    const time = clock.getElapsedTime();
    const positionAttribute = geometry.current.getAttribute('position');
    
    // Determine if we should emit particles based on game state and event type
    let shouldEmit = emitting;
    if (event === 'battle' && gameState === GameState.BATTLE) {
      shouldEmit = true;
    } else if (event === 'victory' && gameState === GameState.WIN) {
      shouldEmit = true;
    } else if (event === 'defeat' && gameState === GameState.LOSE) {
      shouldEmit = true;
    }
    
    // Update each particle
    for (let i = 0; i < particleCount; i++) {
      // Calculate particle age
      const age = time - startTimes.current[i];
      
      // Reset dead particles or initialize new ones when emitting
      if (age > lifetimes.current[i]) {
        if (shouldEmit) {
          // Emit from position
          positionAttribute.setXYZ(i, position[0], position[1], position[2]);
          
          // Update velocity for dynamic effects based on event
          if (event === 'battle') {
            // Battle particles shoot in all directions
            velocities.current[i * 3] = (Math.random() - 0.5) * spread * speed;
            velocities.current[i * 3 + 1] = Math.abs(Math.random()) * spread * speed;
            velocities.current[i * 3 + 2] = (Math.random() - 0.5) * spread * speed;
          } else if (event === 'victory') {
            // Victory particles shoot upward
            velocities.current[i * 3] = (Math.random() - 0.5) * spread * speed;
            velocities.current[i * 3 + 1] = Math.abs(Math.random() + 0.5) * spread * speed;
            velocities.current[i * 3 + 2] = (Math.random() - 0.5) * spread * speed;
          } else if (event === 'defeat') {
            // Defeat particles fall down
            velocities.current[i * 3] = (Math.random() - 0.5) * spread * speed * 0.5;
            velocities.current[i * 3 + 1] = -Math.random() * spread * speed;
            velocities.current[i * 3 + 2] = (Math.random() - 0.5) * spread * speed * 0.5;
          }
          
          // Reset lifetime and start time
          startTimes.current[i] = time;
          lifetimes.current[i] = Math.random() * lifetime + lifetime * 0.5;
        } else {
          // If not emitting, hide by moving far away
          positionAttribute.setXYZ(i, 0, -1000, 0);
        }
      } else if (shouldEmit || age > 0) {
        // Update position based on velocity and age
        const x = positionAttribute.getX(i) + velocities.current[i * 3] * delta;
        const y = positionAttribute.getY(i) + velocities.current[i * 3 + 1] * delta;
        const z = positionAttribute.getZ(i) + velocities.current[i * 3 + 2] * delta;
        
        // Apply some drag
        velocities.current[i * 3] *= 0.98;
        velocities.current[i * 3 + 1] *= 0.98;
        velocities.current[i * 3 + 2] *= 0.98;
        
        // Apply gravity
        velocities.current[i * 3 + 1] -= 0.1 * delta;
        
        // Update position
        positionAttribute.setXYZ(i, x, y, z);
      }
    }
    
    // Update the geometry
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={particles}>
      <bufferGeometry ref={geometry} />
      <pointsMaterial
        color={color}
        size={size}
        transparent={true}
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors={false}
      />
    </points>
  );
};

export default ParticleSystem;

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Grid, Text, Sparkles, Environment as DreiEnv } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationPhase } from '../types';
import { DRONE_COUNT } from '../constants';

interface Scene3DProps {
  phase: SimulationPhase;
}

interface DroneProps {
  index: number;
  phase: SimulationPhase;
  basePosition: THREE.Vector3;
}

const Drone: React.FC<DroneProps> = ({ index, phase, basePosition }) => {
  const ref = useRef<THREE.Group>(null);
  
  // Random offsets for cruise variance
  const randomOffset = useMemo(() => new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), []);
  const cruiseSpeed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  
  // Pappus hair generation (The fluffy part)
  const pappusHairs = useMemo(() => {
      return Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const lean = Math.PI / 4 + (Math.random() * 0.2); 
        return { angle, lean };
      });
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();

    let targetPos = new THREE.Vector3();
    let targetRot = new THREE.Euler(0, 0, 0);
    
    switch (phase) {
      case SimulationPhase.IDLE:
      case SimulationPhase.LISTENING:
      case SimulationPhase.TRIGGERED:
        // Attached to base in a ring
        const angle = (index / DRONE_COUNT) * Math.PI * 2;
        const radius = 0.4; // Tighter cluster on the receptacle
        targetPos.set(
          Math.cos(angle) * radius,
          1.1 + Math.sin(time * 2 + index) * 0.01, // Sits on top of receptacle (y=1.1)
          Math.sin(angle) * radius
        );
        
        // Tilt outwards like a natural dandelion clock
        targetRot.set(0, -angle + Math.PI/2, Math.PI/6);
        break;

      case SimulationPhase.EJECTION:
        // Shooting up
        const ejectAngle = (index / DRONE_COUNT) * Math.PI * 2;
        const ejectRadius = 2 + Math.random();
        targetPos.set(
          Math.cos(ejectAngle) * ejectRadius,
          4 + Math.random() * 2,
          Math.sin(ejectAngle) * ejectRadius
        );
        targetRot.set(0, 0, 0); // Upright during launch
        break;

      case SimulationPhase.CRUISE:
      case SimulationPhase.SENSING:
        // Orbiting / Floating
        const cruiseAngle = (time * cruiseSpeed) + (index / DRONE_COUNT) * Math.PI * 2;
        const cruiseR = 3;
        targetPos.set(
          Math.cos(cruiseAngle) * cruiseR + randomOffset.x,
          3.5 + Math.sin(time + index) * 0.5 + randomOffset.y,
          Math.sin(cruiseAngle) * cruiseR + randomOffset.z
        );
        
        // Face movement direction and sway
        targetRot.set(0, -cruiseAngle, Math.sin(time * 3) * 0.1);
        break;

      case SimulationPhase.LANDING:
        // Return to ground near base
        const landAngle = (index / DRONE_COUNT) * Math.PI * 2;
        const landR = 1.5;
        targetPos.set(
          Math.cos(landAngle) * landR,
          0.15, // Sit on ground
          Math.sin(landAngle) * landR
        );
        targetRot.set(0, 0, 0);
        break;
    }

    // Interpolation Logic
    if (phase !== SimulationPhase.LISTENING && phase !== SimulationPhase.TRIGGERED && phase !== SimulationPhase.IDLE) {
        ref.current.position.lerp(targetPos, 0.05);
        // Smooth rotation for flying
        ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRot.x, 0.05);
        ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot.y, 0.05);
        ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRot.z, 0.05);
    } else {
        // Snappier for docked state to maintain formation structure
        ref.current.position.lerp(targetPos, 0.1);
        ref.current.rotation.x = targetRot.x;
        ref.current.rotation.y = targetRot.y;
        ref.current.rotation.z = targetRot.z;
    }
  });

  const isTriggered = phase === SimulationPhase.TRIGGERED;
  const isSensing = phase === SimulationPhase.SENSING;

  return (
    <group ref={ref}>
      {/* 
          Dandelion Anatomy Implementation:
          1. Achene (瘦果) - The Seed Body (Bottom)
          2. Beak (喙) - The Stem (Middle)
          3. Pappus (冠毛) - The Parachute (Top)
      */}

      {/* 1. ACHENE (瘦果) */}
      <mesh position={[0, 0, 0]} scale={[0.6, 1.8, 0.6]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial 
          color={isTriggered ? "#ef4444" : "#b8860b"} // Golden/Ochre color naturally, Red if triggered
          emissive={isSensing ? "#3b82f6" : (isTriggered ? "#ef4444" : "#000000")}
          emissiveIntensity={isSensing ? 1 : (isTriggered ? 0.5 : 0)}
          roughness={0.6}
        />
      </mesh>

      {/* 2. BEAK (喙) */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.5, 6]} />
        <meshStandardMaterial color="#8b5a2b" /> {/* Tan/Brown stem */}
      </mesh>

      {/* 3. PAPPUS (冠毛) */}
      <group position={[0, 0.55, 0]}>
         {/* Central Hub */}
         <mesh>
             <sphereGeometry args={[0.012, 8, 8]} />
             <meshStandardMaterial color="#cbd5e1" />
         </mesh>
         
         {/* Filaments */}
         {pappusHairs.map((hair, i) => (
             <group key={i} rotation={[0, hair.angle, hair.lean]}>
                 <mesh position={[0, 0.2, 0]}> 
                     <cylinderGeometry args={[0.001, 0.002, 0.4, 4]} />
                     <meshBasicMaterial color="#ffffff" opacity={0.5} transparent depthWrite={false} side={THREE.DoubleSide} />
                 </mesh>
             </group>
         ))}
      </group>

      {/* Plasma Effect (Only active during flight) */}
      {(phase === SimulationPhase.CRUISE || phase === SimulationPhase.SENSING) && (
        <pointLight position={[0, 0.55, 0]} distance={1.5} intensity={1} color="#60a5fa" />
      )}
    </group>
  );
};

const Receptacle = ({ phase }: { phase: SimulationPhase }) => {
    const isTriggered = phase === SimulationPhase.TRIGGERED;
    return (
        <group position={[0, 0, 0]}>
             {/* Main Stalk/Stand */}
            <Cylinder args={[0.1, 0.2, 1, 16]} position={[0, 0.5, 0]}>
                <meshStandardMaterial color="#334155" />
            </Cylinder>
             {/* The "Flower" Base (Involucre) */}
             <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.45, 0.1, 0.3, 32]} />
                <meshStandardMaterial color="#1e293b" />
             </mesh>
             {/* Core Light / Power Source */}
            <mesh position={[0, 1.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                 <circleGeometry args={[0.3, 32]} />
                 <meshStandardMaterial 
                    color={isTriggered ? "#ef4444" : "#10b981"} 
                    emissive={isTriggered ? "#ef4444" : "#10b981"}
                    emissiveIntensity={1}
                 />
            </mesh>
            {/* Alert Pulse */}
            {isTriggered && <pointLight position={[0, 1.5, 0]} color="red" intensity={2} distance={5} decay={2} />}
        </group>
    )
}

const Environment = () => {
    return (
        <group>
            <Grid infiniteGrid fadeDistance={30} sectionColor="#475569" cellColor="#1e293b" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial color="#020617" />
            </mesh>
            <Sparkles count={50} scale={10} size={2} speed={0.4} opacity={0.5} color="#64748b" />
        </group>
    )
}

const Scene3D: React.FC<Scene3DProps> = ({ phase }) => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <Environment />
      
      <Receptacle phase={phase} />
      
      {Array.from({ length: DRONE_COUNT }).map((_, i) => (
        <Drone key={i} index={i} phase={phase} basePosition={new THREE.Vector3(0,0,0)} />
      ))}
      
      <DreiEnv preset="city" />
      
      {/* Target Marker for Sensing Phase */}
      {phase === SimulationPhase.SENSING && (
          <group position={[3, 0.1, 0]}>
              <mesh rotation={[-Math.PI/2, 0, 0]}>
                  <ringGeometry args={[0.5, 0.6, 32]} />
                  <meshBasicMaterial color="#ef4444" />
              </mesh>
              <Text position={[0, 1, 0]} fontSize={0.3} color="#ef4444">
                  Anomaly Detected
              </Text>
          </group>
      )}
    </>
  );
};

export default Scene3D;
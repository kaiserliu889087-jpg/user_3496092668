
import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Cylinder, Sphere, Environment as DreiEnv, ContactShadows, Cloud, Float, Sparkles, Trail, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationPhase } from '../types';
import { DRONE_COUNT } from '../constants';

interface Scene3DProps {
  phase: SimulationPhase;
  audioLevel: number;
}

interface DroneProps {
  index: number;
  phase: SimulationPhase;
}

const Drone: React.FC<DroneProps> = ({ index, phase }) => {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Mesh>(null);
  
  // Stable target for the spotlight to track relative to the drone
  const [lightTarget] = useState(() => new THREE.Object3D());
  
  // Random offsets for organic movement
  const cruiseSpeed = useMemo(() => 0.5 + Math.random() * 0.5, []);
  
  // High-fidelity Pappus generation (Ionic Filaments)
  const pappusFilaments = useMemo(() => {
      const count = 64; // Increased density for realistic look
      return Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const lean = 0.6 + Math.random() * 0.15; // Parabolic spread
        return { angle, lean };
      });
  }, []);
  
  // Track filament refs for landing animation
  const filamentRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();

    let targetPos = new THREE.Vector3();
    let targetRot = new THREE.Euler(0, 0, 0);
    
    switch (phase) {
      case SimulationPhase.IDLE:
      case SimulationPhase.LISTENING:
      case SimulationPhase.TRIGGERED:
        // Docked on the hemisphere
        const ringAngle = (index / DRONE_COUNT) * Math.PI * 2;
        const ringR = 0.85;
        
        targetPos.set(
          Math.cos(ringAngle) * ringR,
          0.6 + Math.sin(ringAngle * 3) * 0.1, // Organic height variation
          Math.sin(ringAngle) * ringR
        );
        
        // Orient outward from center (Normal to surface)
        const lookAtPos = new THREE.Vector3(0, -0.8, 0);
        const direction = targetPos.clone().sub(lookAtPos).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        const euler = new THREE.Euler().setFromQuaternion(quaternion);
        
        targetRot.copy(euler);
        
        // Breathing animation in Listening mode
        if (phase === SimulationPhase.LISTENING) {
            targetPos.y += Math.sin(time * 2 + index) * 0.01;
        }
        break;

      case SimulationPhase.EJECTION:
        // Explosive launch upwards and outwards
        const ejAngle = (index / DRONE_COUNT) * Math.PI * 2;
        const ejR = 1.5 + Math.random();
        targetPos.set(
          Math.cos(ejAngle) * ejR,
          5 + Math.random() * 3,
          Math.sin(ejAngle) * ejR
        );
        targetRot.set(Math.random() * 0.5, 0, Math.random() * 0.5);
        break;

      case SimulationPhase.CRUISE:
      case SimulationPhase.SENSING:
        // Float in a cloud
        const cAngle = (time * cruiseSpeed * 0.2) + (index / DRONE_COUNT) * Math.PI * 2;
        const cRadius = 4;
        
        targetPos.set(
          Math.cos(cAngle) * cRadius + Math.sin(time * 0.5 + index) * 1,
          4.5 + Math.sin(time * 0.8 + index) * 1.5,
          Math.sin(cAngle) * cRadius + Math.cos(time * 0.5 + index) * 1
        );
        
        // Tilt towards movement
        targetRot.set(
            Math.sin(time + index) * 0.2 + 0.2, // Slight forward tilt
            -cAngle + Math.PI/2, 
            Math.cos(time + index) * 0.2
        );
        break;

      case SimulationPhase.LANDING:
        const lAngle = (index / DRONE_COUNT) * Math.PI * 2;
        const lRadius = 4.0; // Matched to Sensing radius (4.0) to land on the marked spot
        // Landing flat on the ground
        targetPos.set(
            Math.cos(lAngle) * lRadius,
            0.25, // Height based on achene size 
            Math.sin(lAngle) * lRadius
        );
        // Upright orientation (Pappus up)
        targetRot.set(0, lAngle, 0);
        break;
    }

    // Smooth physics-like interpolation
    const lerpSpeed = (phase === SimulationPhase.EJECTION || phase === SimulationPhase.LANDING) ? 0.05 : 0.02;
    ref.current.position.lerp(targetPos, lerpSpeed);
    
    // Rotation interpolation
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRot.x, 0.05);
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot.y, 0.05);
    ref.current.rotation.z = THREE.MathUtils.lerp(ref.current.rotation.z, targetRot.z, 0.05);

    // Dynamic Glow Animation
    if (glowRef.current) {
        // Create a more dynamic pulse based on time and index for variety
        const t = state.clock.getElapsedTime();
        const pulseSpeed = 3;
        const pulse = Math.sin(t * pulseSpeed + index) * 0.5 + 0.5; // 0 to 1
        // Pulse between intensity 2 and 5 for a dynamic "alive" feel
        (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 2 + pulse * 3;
    }

    // Projection Light Logic (SENSING & LANDING)
    const isLightActive = phase === SimulationPhase.SENSING || phase === SimulationPhase.LANDING;
    if (isLightActive && beamRef.current && markerRef.current && spotLightRef.current) {
        const altitude = ref.current.position.y;
        const distToGround = Math.max(0.1, altitude); // Avoid 0 scale
        
        // 1. Scale Beam: Stretch cylinder from drone (0) to ground (-altitude)
        // Cylinder geometry height is 1, so we scale Y to match distance
        beamRef.current.scale.set(1, distToGround, 1);
        // Position beam center halfway down
        beamRef.current.position.y = -distToGround / 2;

        // 2. Position Marker: Lock to world Y=0 (approx). 
        // Relative to drone at `altitude`, ground is at `-altitude`.
        markerRef.current.position.y = -altitude + 0.02; // +0.02 to avoid z-fighting with grid

        // 3. Fade Logic for Soft Landing
        if (phase === SimulationPhase.LANDING) {
             // Fade spotlight intensity but keep marker visible longer for "Location" effect
             const landingProgress = THREE.MathUtils.clamp((altitude - 0.5) * 2, 0, 1);
             
             spotLightRef.current.intensity = THREE.MathUtils.lerp(0, 20, landingProgress);
             (beamRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0, 0.15, landingProgress);
             
             // Keep marker visible until very end
             (markerRef.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp(0.5, 0.2, landingProgress);
        } else {
             spotLightRef.current.intensity = 20;
             (beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15;
             (markerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2;
        }
    }

    // LANDING Animation: Fold Pappus filaments
    if (phase === SimulationPhase.LANDING) {
        filamentRefs.current.forEach((mesh, i) => {
            if (mesh) {
                 // Fold inwards (increase Z rotation towards center)
                 const targetFold = 0.5; // Fold angle
                 mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, pappusFilaments[i].lean + targetFold, 0.05);
            }
        });
    } else {
        // Unfold / Reset
        filamentRefs.current.forEach((mesh, i) => {
            if (mesh) {
                 mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, pappusFilaments[i].lean, 0.05);
            }
        });
    }
  });

  const isActive = phase === SimulationPhase.CRUISE || phase === SimulationPhase.SENSING || phase === SimulationPhase.EJECTION;
  const isTriggered = phase === SimulationPhase.TRIGGERED;
  const isSensing = phase === SimulationPhase.SENSING;
  const isLanding = phase === SimulationPhase.LANDING;
  
  // Show spotlight during SENSING and LANDING
  const isLightOn = isSensing || isLanding;

  return (
    <group>
        {/* Trail Effect for motion */}
        {isActive && (
            <Trail
                width={0.2} 
                length={4} 
                color={new THREE.Color("#60a5fa")} 
                attenuation={(t) => t * t}
                target={ref}
            />
        )}
        <group ref={ref}>
        {/* --- Figure 1 Accurate Design: Silent Spore System --- */}
        
        {/* 1. ACHENE (Core): Streamlined Payload */}
        <group position={[0, -0.5, 0]}>
            {/* Main Body - Tapered Dart Shape */}
            <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
                {/* Tapers from thin connection (top) to thick body (bottom) */}
                <cylinderGeometry args={[0.005, 0.02, 0.25, 32]} />
                <meshPhysicalMaterial 
                    color="#cbd5e1" 
                    metalness={0.9} 
                    roughness={0.3} 
                    clearcoat={0.8}
                    clearcoatRoughness={0.2}
                />
            </mesh>
            
            {/* Sensor Dome (Bottom Tip) */}
            <mesh position={[0, 0, 0]}>
                <sphereGeometry args={[0.02, 32, 16]} />
                <meshStandardMaterial 
                    color={isTriggered ? "#ef4444" : "#0f172a"} 
                    emissive={isTriggered ? "#7f1d1d" : "#000000"}
                    emissiveIntensity={2}
                />
            </mesh>

            {/* Electronics Status Ring */}
            <mesh ref={glowRef} position={[0, 0.18, 0]}>
                 <torusGeometry args={[0.012, 0.002, 16, 32]} />
                 <meshBasicMaterial color={isTriggered ? "#ef4444" : "#3b82f6"} toneMapped={false} />
            </mesh>
        </group>

        {/* 2. BEAK (Stem): Elongated thin connector */}
        <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.75, 8]} />
            <meshStandardMaterial color="#64748b" roughness={0.8} />
        </mesh>

        {/* 3. PAPPUS (Crown): Ionic filaments */}
        <group position={[0, 0.4, 0]}>
            {/* Central Hub (Joint) */}
            <mesh>
                <sphereGeometry args={[0.008, 16, 16]} />
                <meshStandardMaterial color="#e2e8f0" />
            </mesh>

            {/* Filaments */}
            {pappusFilaments.map((f, i) => (
                <mesh 
                    key={i} 
                    ref={(el) => { if(el) filamentRefs.current[i] = el; }}
                    rotation={[0, f.angle, f.lean]} 
                    position={[0, 0, 0]}
                >
                    {/* Pivot point is at 0,0,0, so we translate geometry up to start from pivot */}
                    <cylinderGeometry args={[0.0002, 0.0002, 0.45, 4]} />
                    <meshBasicMaterial 
                        color={isActive ? "#bfdbfe" : "#ffffff"} 
                        transparent 
                        opacity={0.5} 
                    />
                    {/* Tip Glow - Ionic Emitter */}
                    <mesh position={[0, 0.225, 0]}>
                        <sphereGeometry args={[0.0015, 4, 4]} />
                        <meshBasicMaterial color={isActive ? "#60a5fa" : "#ffffff"} toneMapped={false} />
                    </mesh>
                </mesh>
            ))}
            
            {/* Ionic Vortex Ring Effect (Propulsion Visualization) */}
            {isActive && (
                <mesh position={[0, 0.35, 0]} rotation={[Math.PI/2, 0, 0]}>
                    <ringGeometry args={[0.2, 0.28, 32]} />
                    <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
                </mesh>
            )}
        </group>

        {/* 4. SENSING PROJECTION LIGHT: Red light projected onto ground */}
        {isLightOn && (
            <group position={[0, -0.5, 0]}>
                {/* Invisible target for the spotlight to point at (straight down) */}
                <primitive object={lightTarget} position={[0, -5, 0]} />
                
                {/* The actual Spotlight */}
                <spotLight
                    ref={spotLightRef}
                    target={lightTarget}
                    color="#ef4444"
                    intensity={20}
                    distance={10}
                    angle={0.6}
                    penumbra={0.5}
                    castShadow
                />

                {/* Volumetric Beam Visualization (Cone) */}
                {/* Initial args: radiusTop 0.02, radiusBottom 1.0, height 1.0 */}
                <mesh ref={beamRef} position={[0, -0.5, 0]}>
                    <cylinderGeometry args={[0.02, 1.0, 1.0, 32, 1, true]} />
                    <meshBasicMaterial 
                        color="#ef4444" 
                        transparent 
                        opacity={0.15} 
                        side={THREE.DoubleSide} 
                        blending={THREE.AdditiveBlending} 
                        depthWrite={false} 
                    />
                </mesh>
                
                {/* Floor Hit Effect / Target Marker (Locate on Map) */}
                <mesh ref={markerRef} position={[0, -4.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
                     <ringGeometry args={[0.5, 1.5, 32]} />
                     <meshBasicMaterial 
                        color="#ef4444" 
                        transparent 
                        opacity={0.3} 
                        side={THREE.DoubleSide} 
                        blending={THREE.AdditiveBlending} 
                     />
                </mesh>
            </group>
        )}

        </group>
    </group>
  );
};

// Visualizes sound waves on the receptacle
const AudioRipple = ({ audioLevel }: { audioLevel: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!ref.current) return;
        const scale = 1 + audioLevel * 0.5;
        ref.current.scale.set(scale, scale, scale);
        ref.current.rotation.y += 0.01;
    });

    if (audioLevel < 0.05) return null;

    return (
        <group ref={ref} position={[0, 0.5, 0]}>
             <mesh rotation={[-Math.PI/2, 0, 0]}>
                 <ringGeometry args={[1.3, 1.35, 64]} />
                 <meshBasicMaterial color="#3b82f6" transparent opacity={audioLevel} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
             </mesh>
             <mesh rotation={[-Math.PI/2, 0, 0]}>
                 <ringGeometry args={[1.5, 1.52, 64]} />
                 <meshBasicMaterial color="#3b82f6" transparent opacity={audioLevel * 0.5} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
             </mesh>
        </group>
    )
}

const BioReceptacle = ({ phase, audioLevel }: { phase: SimulationPhase, audioLevel: number }) => {
    const isTriggered = phase === SimulationPhase.TRIGGERED;
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        // Subtle pulsation based on audio
        const pulse = 1 + audioLevel * 0.02;
        meshRef.current.scale.set(pulse, pulse, pulse);
    });
    
    return (
        <group position={[0, -0.1, 0]}>
            {/* The Dome (Hemisphere) - Porous organic material */}
            <mesh ref={meshRef} position={[0, 0, 0]} receiveShadow castShadow>
                <sphereGeometry args={[1.2, 128, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
                {/* Stone-like porous material */}
                <meshStandardMaterial 
                    color="#475569" // Slate grey
                    roughness={0.9}
                    metalness={0.1}
                    flatShading={false}
                />
            </mesh>
            
            {/* Pores - Darker indentations simulated with spheres for depth */}
            {Array.from({ length: 60 }).map((_, i) => {
                const phi = Math.acos( -1 + ( 2 * i ) / 60 );
                const theta = Math.sqrt( 60 * Math.PI ) * phi;
                const r = 1.18;
                const x = r * Math.sin(phi) * Math.cos(theta);
                const y = Math.abs(r * Math.cos(phi)) * 0.8; // Flatten slightly
                const z = r * Math.sin(phi) * Math.sin(theta);
                
                return (
                    <mesh key={i} position={[x, y, z]}>
                        <sphereGeometry args={[0.07, 12, 12]} />
                        <meshStandardMaterial color="#1e293b" roughness={1} />
                    </mesh>
                )
            })}
            
            {/* Audio Reactive Ripple */}
            <AudioRipple audioLevel={audioLevel} />

            {/* Core Glow (Internal Electronics) */}
            {isTriggered && (
                <pointLight position={[0, 0.5, 0]} color="#ef4444" intensity={3} distance={5} decay={2} />
            )}
        </group>
    );
};

const Scene3D: React.FC<Scene3DProps> = ({ phase, audioLevel }) => {
  return (
    <>
      {/* --- Realistic Lighting Setup --- */}
      {/* Sunset/Dawn Environment for the "Golden Hour" look described in scenario */}
      <DreiEnv preset="sunset" background={false} blur={0.7} />
      
      {/* Main directional light (Sun) */}
      <directionalLight 
        position={[10, 8, 5]} 
        intensity={2.5} 
        castShadow 
        shadow-bias={-0.0001}
        color="#fff7ed" 
      />
      {/* Fill light from sky */}
      <ambientLight intensity={0.4} color="#bae6fd" />

      {/* --- Environment Objects --- */}
      
      {/* Ground Plane: Textured look via material settings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
      </mesh>
      
      {/* Tactical Map Grid - Enhanced for "Locate on Map" request */}
      <Grid 
        position={[0, 0.01, 0]} 
        args={[20, 20]} 
        cellColor="#64748b" 
        sectionColor="#94a3b8" 
        fadeDistance={25}
        infiniteGrid 
      />
      
      {/* Soft Contact Shadows for grounding */}
      <ContactShadows opacity={0.6} scale={20} blur={2.5} far={4} resolution={512} color="#000000" />
      
      {/* Environmental Particles (Pollen/Dust/Noise) */}
      <Sparkles 
        count={300} 
        scale={20} 
        size={3} 
        speed={0.4} 
        opacity={0.4} 
        color="#fbbf24" // Golden pollen
        noise={0.5}
      />
      
      {/* Volumetric Clouds for Atmosphere */}
      <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
         <Cloud opacity={0.15} speed={0.4} bounds={[15, 4, 4]} segments={20} position={[-8, 6, -10]} color="#94a3b8" />
         <Cloud opacity={0.15} speed={0.4} bounds={[15, 4, 4]} segments={20} position={[8, 8, -12]} color="#cbd5e1" />
      </Float>

      {/* --- Main Actors --- */}
      <BioReceptacle phase={phase} audioLevel={audioLevel} />
      
      {Array.from({ length: DRONE_COUNT }).map((_, i) => (
        <Drone key={i} index={i} phase={phase} />
      ))}
    </>
  );
};

export default Scene3D;

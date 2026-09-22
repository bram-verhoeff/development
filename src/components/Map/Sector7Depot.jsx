import React, { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { getProceduralPBRTextures } from '../../textures/ProceduralTextures';
import {
  ShippingContainer,
  IndustrialForklift,
  MunitionsPallet,
  FuelStorageSilo,
  Helipad,
  TacticalAPC,
  IndustrialGenerator,
  GuardWatchtower,
  ConcreteBarrier,
} from './Sector7Props';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';

class ReflectorErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('MeshReflectorMaterial failed on this hardware, falling back to standard PBR tarmac:', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function Sector7Depot({ enableReflections = true, graphicsQuality = 'high' }) {
  const textures = useMemo(() => getProceduralPBRTextures(), []);
  const isLow = graphicsQuality === 'low';

  // Industrial materials
  const mats = useMemo(() => {
    if (isLow) {
      return {
        tarmac: new THREE.MeshLambertMaterial({
          map: textures.road.map,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        }),
        concreteSlab: new THREE.MeshLambertMaterial({
          color: '#475569',
          polygonOffset: true,
          polygonOffsetFactor: -1.5,
          polygonOffsetUnits: -1.5,
        }),
        hangarWall: new THREE.MeshLambertMaterial({
          color: '#334155',
        }),
        corrugatedSteel: new THREE.MeshLambertMaterial({
          color: '#1e293b',
        }),
        steelCatwalk: new THREE.MeshLambertMaterial({
          color: '#1e293b',
        }),
        yellowHazard: new THREE.MeshBasicMaterial({
          color: '#eab308',
        }),
        serverGlow: new THREE.MeshBasicMaterial({
          color: '#00ffcc',
        }),
        serverRed: new THREE.MeshBasicMaterial({
          color: '#ef4444',
        }),
      };
    }

    return {
      tarmac: new THREE.MeshStandardMaterial({
        map: textures.road.map,
        normalMap: textures.road.normalMap,
        roughnessMap: textures.road.roughnessMap,
        roughness: 0.78,
        metalness: 0.15,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
      concreteSlab: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.82,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -1.5,
        polygonOffsetUnits: -1.5,
      }),
      hangarWall: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.7,
        metalness: 0.3,
      }),
      corrugatedSteel: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.5,
        metalness: 0.8,
      }),
      steelCatwalk: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.6,
        metalness: 0.85,
      }),
      yellowHazard: new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.4,
      }),
      serverGlow: new THREE.MeshBasicMaterial({
        color: '#00ffcc',
      }),
      serverRed: new THREE.MeshBasicMaterial({
        color: '#ef4444',
      }),
    };
  }, [textures, isLow]);

  return (
    <group>
      {/* ------------------------------------------------------------- */}
      {/* 1. CONTINUOUS SOLID GROUND PHYSICS BED (Y = 0.000 Surface) */}
      {/* ------------------------------------------------------------- */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[90, 2.0, 90]} position={[0, -2.0, 0]} friction={0.0} restitution={0.0} />
      </RigidBody>

      {/* Base Outer Desert Sand */}
      <mesh position={[0, -0.005, 0]} receiveShadow={!isLow}>
        <boxGeometry args={[160, 0.01, 160]} />
        <meshStandardMaterial
          map={textures.sand.map}
          normalMap={isLow ? null : textures.sand.normalMap}
          roughness={0.95}
        />
      </mesh>

      {/* Main Industrial Tarmac Apron (100m x 100m, Y Top = 0.030) */}
      <mesh position={[0, 0.015, 0]} material={mats.tarmac} receiveShadow={!isLow}>
        <boxGeometry args={[100, 0.03, 100]} />
      </mesh>

      {/* Real-time Planar Reflections (Toggled on/off via settings; bypassed on LOW for max FPS) */}
      {enableReflections && !isLow && (
        <ReflectorErrorBoundary>
          <mesh position={[0, 0.0305, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={!isLow}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
              blur={graphicsQuality === 'ultra' ? [50, 25] : [30, 15]}
              resolution={graphicsQuality === 'ultra' ? 512 : (graphicsQuality === 'high' ? 256 : 128)}
              mirror={0.35}
              mixBlur={0.7}
              mixStrength={1.5}
              roughness={0.65}
              depthScale={0}
              minDepthThreshold={0.9}
              maxDepthThreshold={1}
              color="#2a333d"
              metalness={0.25}
            />
          </mesh>
        </ReflectorErrorBoundary>
      )}

      {/* Tarmac Safety Line Markings */}
      <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 80]} />
        <meshBasicMaterial color="#eab308" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <mesh position={[-20, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 80]} />
        <meshBasicMaterial color="#eab308" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <mesh position={[20, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 80]} />
        <meshBasicMaterial color="#eab308" polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>

      {/* ------------------------------------------------------------- */}
      {/* 2. NORTH SECTOR: HIGH-TECH OPERATIONS HANGAR FACILITY */}
      {/* ------------------------------------------------------------- */}
      <group position={[0, 0, -32]}>
        {/* Hangar Polished Concrete Foundation */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.05, 0]} material={mats.concreteSlab} receiveShadow>
            <boxGeometry args={[32, 0.1, 20]} />
          </mesh>
        </RigidBody>

        {/* Rear Wall */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 4.0, -10]} material={mats.hangarWall} castShadow receiveShadow>
            <boxGeometry args={[32, 8.0, 0.8]} />
          </mesh>
        </RigidBody>

        {/* West Side Wall */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[-16, 4.0, 0]} material={mats.hangarWall} castShadow receiveShadow>
            <boxGeometry args={[0.8, 8.0, 20]} />
          </mesh>
        </RigidBody>

        {/* East Side Wall */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[16, 4.0, 0]} material={mats.hangarWall} castShadow receiveShadow>
            <boxGeometry args={[0.8, 8.0, 20]} />
          </mesh>
        </RigidBody>

        {/* Front Wall (Flanking Left & Right of 16m Central Hangar Bay Opening) */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[-12, 4.0, 10]} material={mats.hangarWall} castShadow receiveShadow>
            <boxGeometry args={[8, 8.0, 0.8]} />
          </mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[12, 4.0, 10]} material={mats.hangarWall} castShadow receiveShadow>
            <boxGeometry args={[8, 8.0, 0.8]} />
          </mesh>
        </RigidBody>
        {/* Hangar Bay Door Header Lintel */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 6.8, 10]} material={mats.corrugatedSteel} castShadow>
            <boxGeometry args={[16, 2.4, 0.8]} />
          </mesh>
        </RigidBody>

        {/* Slanted Industrial Roof with Skylights */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 8.3, 0]} material={mats.corrugatedSteel} castShadow>
            <boxGeometry args={[33, 0.6, 21]} />
          </mesh>
        </RigidBody>

        {/* Elevated 2nd-Floor Steel Catwalk / Sniper Gantry (Y = 3.6m) */}
        <RigidBody type="fixed" colliders="cuboid">
          {/* Main Catwalk Platform along Back Wall */}
          <mesh position={[0, 3.6, -7.5]} material={mats.steelCatwalk} castShadow receiveShadow>
            <boxGeometry args={[28, 0.25, 3.2]} />
          </mesh>
          {/* Catwalk Safety Railing */}
          <mesh position={[0, 4.3, -5.9]} material={mats.corrugatedSteel}>
            <boxGeometry args={[28, 1.1, 0.1]} />
          </mesh>
          {/* Stairs to Catwalk */}
          <mesh position={[-12, 1.8, -4.5]} rotation={[0.55, 0, 0]} material={mats.steelCatwalk}>
            <boxGeometry args={[2.2, 0.2, 5.8]} />
          </mesh>
        </RigidBody>

        {/* Mainframe Server Racks inside Hangar with Status LEDs */}
        {[-8, -5, 5, 8].map((x, idx) => (
          <group key={`server-${idx}`} position={[x, 0, -8]}>
            <RigidBody type="fixed" colliders="cuboid">
              <mesh position={[0, 1.5, 0]} material={mats.corrugatedSteel} castShadow>
                <boxGeometry args={[1.4, 3.0, 1.0]} />
              </mesh>
            </RigidBody>
            {/* Blinking Status Lights */}
            <mesh position={[0, 1.8, 0.52]} material={mats.serverGlow}>
              <planeGeometry args={[0.8, 0.08]} />
            </mesh>
            <mesh position={[0, 2.2, 0.52]} material={mats.serverRed}>
              <planeGeometry args={[0.8, 0.08]} />
            </mesh>
          </group>
        ))}

        {/* Tactical Hologram Briefing Table in Center of Hangar */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.5, 0]} material={mats.corrugatedSteel} castShadow={!isLow}>
            <cylinderGeometry args={[2.2, 2.4, 1.0, 16]} />
          </mesh>
        </RigidBody>
        {!isLow && <pointLight position={[0, 1.4, 0]} color="#00ffcc" intensity={2.2} distance={8} />}
      </group>

      {/* ------------------------------------------------------------- */}
      {/* 3. CENTRAL SECTOR: SHIPPING CONTAINER CARGO MAZE (3 LANES) */}
      {/* ------------------------------------------------------------- */}
      {/* WEST LANE (CQB Alley) */}
      {/* Ground Container 1: Maersk Navy Blue 40ft */}
      <ShippingContainer position={[-18, 0, -12]} rotation={[0, 0, 0]} length={12} color="#1e3a8a" isLow={isLow} />
      {/* Ground Container 2: Industrial Safety Orange 40ft */}
      <ShippingContainer position={[-18, 0, 2]} rotation={[0, 0, 0]} length={12} color="#c2410c" isLow={isLow} />
      {/* Stacked 2nd Story Container: Weathered Crimson */}
      <ShippingContainer position={[-18, 3.0, -5]} rotation={[0, 0, 0]} length={12} color="#991b1b" isLow={isLow} />
      {/* Munitions pallets providing low cover */}
      <MunitionsPallet position={[-12, 0, -8]} rotation={[0, 0.4, 0]} isLow={isLow} />
      <MunitionsPallet position={[-12, 0, 4]} rotation={[0, -0.2, 0]} isLow={isLow} />

      {/* CENTER CHOKEPOINT (Tactical Hub) */}
      {/* Diagonal Evergreen Container 40ft */}
      <ShippingContainer position={[-4, 0, -6]} rotation={[0, 0.48, 0]} length={12} color="#166534" isLow={isLow} />
      {/* Diagonal Navy Blue Container 40ft creating angled chokepoint */}
      <ShippingContainer position={[6, 0, 4]} rotation={[0, -0.42, 0]} length={12} color="#1e40af" isLow={isLow} />
      {/* Central Industrial Yellow Forklift */}
      <IndustrialForklift position={[2, 0, -8]} rotation={[0, -1.8, 0]} isLow={isLow} />
      <MunitionsPallet position={[-2, 0, 6]} rotation={[0, 0.8, 0]} isLow={isLow} />

      {/* EAST LANE (Flank & Sniper Ramp) */}
      {/* Ground Container 40ft: Slate Grey */}
      <ShippingContainer position={[18, 0, -12]} rotation={[0, 0, 0]} length={12} color="#334155" isLow={isLow} />
      {/* Ground Container 40ft: Industrial Orange */}
      <ShippingContainer position={[18, 0, 2]} rotation={[0, 0, 0]} length={12} color="#ea580c" isLow={isLow} />
      {/* Stacked 2nd Story Container: Forest Green */}
      <ShippingContainer position={[18, 3.0, -5]} rotation={[0, 0, 0]} length={12} color="#14532d" isLow={isLow} />
      {/* Walkable Access Ramp to Container Roof */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[18, 1.5, 12]} rotation={[0.42, 0, 0]} material={mats.steelCatwalk}>
          <boxGeometry args={[3.2, 0.2, 7.8]} />
        </mesh>
      </RigidBody>
      <MunitionsPallet position={[12, 0, -2]} rotation={[0, 0.3, 0]} isLow={isLow} />

      {/* Concrete Jersey Barriers for Tactical Mid-Range Cover */}
      <ConcreteBarrier position={[-8, 0, -16]} length={4.0} isLow={isLow} />
      <ConcreteBarrier position={[8, 0, -16]} length={4.0} isLow={isLow} />
      <ConcreteBarrier position={[-8, 0, 12]} length={4.0} isLow={isLow} />
      <ConcreteBarrier position={[8, 0, 12]} length={4.0} isLow={isLow} />

      {/* ------------------------------------------------------------- */}
      {/* 4. SOUTH SECTOR: HELIPAD, FUEL DEPOT & CHECKPOINT */}
      {/* ------------------------------------------------------------- */}
      {/* Raised Concrete Helipad with glowing beacons */}
      <Helipad position={[24, 0, 26]} radius={8.5} isLow={isLow} />

      {/* Dual Massive Cylindrical Fuel Storage Silos */}
      <FuelStorageSilo position={[-24, 0, 28]} radius={3.5} height={9.0} isLow={isLow} />
      <FuelStorageSilo position={[-15, 0, 32]} radius={3.2} height={8.0} isLow={isLow} />

      {/* Heavy High-Voltage Diesel Generator Station */}
      <IndustrialGenerator position={[-4, 0, 30]} rotation={[0, 0.2, 0]} isLow={isLow} />

      {/* Armored Tactical APC / MRAP Checkpoint Vehicle */}
      <TacticalAPC position={[8, 0, 28]} rotation={[0, -0.35, 0]} isLow={isLow} />

      {/* Sandbag / Concrete Barrier Perimeter Checkpoint */}
      <ConcreteBarrier position={[3, 0, 24]} rotation={[0, Math.PI / 2, 0]} length={5.0} isLow={isLow} />
      <ConcreteBarrier position={[13, 0, 24]} rotation={[0, Math.PI / 2, 0]} length={5.0} isLow={isLow} />
      <MunitionsPallet position={[4, 0, 32]} rotation={[0, 0.5, 0]} isLow={isLow} />

      {/* ------------------------------------------------------------- */}
      {/* 5. PERIMETER: 4 CORNER GUARD WATCHTOWERS & BLAST WALLS */}
      {/* ------------------------------------------------------------- */}
      {/* 4 Guard Floodlight Watchtowers */}
      <GuardWatchtower position={[-38, 0, -38]} height={10.0} isLow={isLow} />
      <GuardWatchtower position={[38, 0, -38]} height={10.0} isLow={isLow} />
      <GuardWatchtower position={[-38, 0, 38]} height={10.0} isLow={isLow} />
      <GuardWatchtower position={[38, 0, 38]} height={10.0} isLow={isLow} />

      {/* Perimeter Blast Walls (North, South, East, West boundaries) */}
      <RigidBody type="fixed" colliders="cuboid">
        {/* North Boundary Wall */}
        <mesh position={[0, 4.0, -48]} material={mats.hangarWall}>
          <boxGeometry args={[96, 8.0, 1.2]} />
        </mesh>
        {/* South Boundary Wall */}
        <mesh position={[0, 4.0, 48]} material={mats.hangarWall}>
          <boxGeometry args={[96, 8.0, 1.2]} />
        </mesh>
        {/* West Boundary Wall */}
        <mesh position={[-48, 4.0, 0]} material={mats.hangarWall}>
          <boxGeometry args={[1.2, 8.0, 96]} />
        </mesh>
        {/* East Boundary Wall */}
        <mesh position={[48, 4.0, 0]} material={mats.hangarWall}>
          <boxGeometry args={[1.2, 8.0, 96]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// -------------------------------------------------------------
// 1. MODULAR ISO SHIPPING CONTAINER (20ft & 40ft)
// -------------------------------------------------------------
export function ShippingContainer({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  length = 12, // 12m ~ 40ft, 6m ~ 20ft
  color = '#1e3a8a', // Default navy blue
  rustLevel = 0.4,
  isLow = false,
}) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        body: new THREE.MeshLambertMaterial({ color }),
        frame: new THREE.MeshLambertMaterial({ color: '#1e293b' }),
      };
    }
    return {
      body: new THREE.MeshStandardMaterial({
        color,
        roughness: 0.65,
        metalness: 0.35,
      }),
      frame: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.7,
        metalness: 0.8,
      }),
      hazard: new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.5,
      }),
    };
  }, [color, isLow]);

  const width = 3.2;
  const height = 3.0;

  if (isLow) {
    return (
      <group position={position} rotation={rotation}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, height / 2, 0]} material={materials.body}>
            <boxGeometry args={[width, height, length]} />
          </mesh>
        </RigidBody>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      {/* Physics Collider for Container */}
      <RigidBody type="fixed" colliders="cuboid">
        {/* Main Corrugated Container Box */}
        <mesh position={[0, height / 2, 0]} material={materials.body} castShadow receiveShadow>
          <boxGeometry args={[width, height, length]} />
        </mesh>
      </RigidBody>

      {/* Structural Corner Posts */}
      {[-width / 2 + 0.1, width / 2 - 0.1].map((x, xi) =>
        [-length / 2 + 0.1, length / 2 - 0.1].map((z, zi) => (
          <mesh key={`post-${xi}-${zi}`} position={[x, height / 2, z]} material={materials.frame} castShadow>
            <boxGeometry args={[0.22, height, 0.22]} />
          </mesh>
        ))
      )}

      {/* Door End Details (Locking rods and hinges) */}
      <mesh position={[0, height / 2, length / 2 + 0.02]} material={materials.frame}>
        <boxGeometry args={[width - 0.2, height - 0.2, 0.04]} />
      </mesh>
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={`rod-${i}`} position={[x, height / 2, length / 2 + 0.05]} material={materials.frame}>
          <cylinderGeometry args={[0.02, 0.02, height - 0.4, 8]} />
        </mesh>
      ))}

      {/* Roof Corner Casting Blocks */}
      {[-width / 2 + 0.1, width / 2 - 0.1].map((x, xi) =>
        [-length / 2 + 0.1, length / 2 - 0.1].map((z, zi) => (
          <mesh key={`cast-${xi}-${zi}`} position={[x, height - 0.1, z]} material={materials.frame}>
            <boxGeometry args={[0.26, 0.22, 0.26]} />
          </mesh>
        ))
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 2. INDUSTRIAL FORKLIFT TRUCK
// -------------------------------------------------------------
export function IndustrialForklift({ position = [0, 0, 0], rotation = [0, 0, 0], isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        yellow: new THREE.MeshLambertMaterial({ color: '#eab308' }),
        black: new THREE.MeshLambertMaterial({ color: '#18181b' }),
        cage: new THREE.MeshLambertMaterial({ color: '#27272a' }),
        tire: new THREE.MeshLambertMaterial({ color: '#111315' }),
      };
    }
    return {
      yellow: new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.45,
        metalness: 0.3,
      }),
      black: new THREE.MeshStandardMaterial({
        color: '#18181b',
        roughness: 0.7,
        metalness: 0.6,
      }),
      cage: new THREE.MeshStandardMaterial({
        color: '#27272a',
        roughness: 0.5,
        metalness: 0.8,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: '#111315',
        roughness: 0.9,
      }),
    };
  }, [isLow]);

  if (isLow) {
    return (
      <group position={position} rotation={rotation}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.65, 0]} material={materials.yellow}>
            <boxGeometry args={[1.5, 0.8, 2.6]} />
          </mesh>
          <mesh position={[0, 1.4, -1.35]} material={materials.black}>
            <boxGeometry args={[0.9, 2.4, 0.2]} />
          </mesh>
        </RigidBody>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Main Chassis */}
        <mesh position={[0, 0.65, 0]} material={materials.yellow} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.8, 2.6]} />
        </mesh>
        {/* Rear Counterweight */}
        <mesh position={[0, 0.75, 1.2]} material={materials.black} castShadow>
          <boxGeometry args={[1.48, 0.9, 0.6]} />
        </mesh>
        {/* Driver Overhead Safety Roll Cage */}
        <mesh position={[0, 1.7, 0.1]} material={materials.cage} castShadow>
          <boxGeometry args={[1.3, 1.3, 1.5]} />
        </mesh>
        {/* Vertical Lift Mast */}
        <mesh position={[0, 1.4, -1.35]} material={materials.black} castShadow>
          <boxGeometry args={[0.9, 2.4, 0.2]} />
        </mesh>
        {/* Steel Lifting Forks */}
        <mesh position={[-0.25, 0.12, -2.0]} material={materials.black}>
          <boxGeometry args={[0.12, 0.05, 1.2]} />
        </mesh>
        <mesh position={[0.25, 0.12, -2.0]} material={materials.black}>
          <boxGeometry args={[0.12, 0.05, 1.2]} />
        </mesh>
      </RigidBody>

      {/* 4 Heavy Rubber Tires */}
      {[-0.8, 0.8].map((x, xi) =>
        [-0.9, 0.9].map((z, zi) => (
          <mesh key={`tire-${xi}-${zi}`} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.28, 16]} />
            <primitive object={materials.tire} attach="material" />
          </mesh>
        ))
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 3. PALLET OF TACTICAL MUNITIONS / CARGO
// -------------------------------------------------------------
export function MunitionsPallet({ position = [0, 0, 0], rotation = [0, 0, 0], isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        wood: new THREE.MeshLambertMaterial({ color: '#a16207' }),
        crate: new THREE.MeshLambertMaterial({ color: '#365314' }),
      };
    }
    return {
      wood: new THREE.MeshStandardMaterial({
        color: '#a16207',
        roughness: 0.85,
      }),
      crate: new THREE.MeshStandardMaterial({
        color: '#365314', // Olive drab military crate
        roughness: 0.6,
        metalness: 0.2,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.4,
        metalness: 0.8,
      }),
    };
  }, [isLow]);

  if (isLow) {
    return (
      <group position={position} rotation={rotation}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.45, 0]} material={materials.crate}>
            <boxGeometry args={[1.4, 0.9, 1.4]} />
          </mesh>
        </RigidBody>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Wood Pallet Base */}
        <mesh position={[0, 0.08, 0]} material={materials.wood} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.16, 1.4]} />
        </mesh>
        {/* Stack of Military Supply Crates */}
        <mesh position={[-0.32, 0.42, -0.32]} material={materials.crate} castShadow>
          <boxGeometry args={[0.65, 0.52, 0.65]} />
        </mesh>
        <mesh position={[0.32, 0.42, -0.32]} material={materials.crate} castShadow>
          <boxGeometry args={[0.65, 0.52, 0.65]} />
        </mesh>
        <mesh position={[-0.32, 0.42, 0.32]} material={materials.crate} castShadow>
          <boxGeometry args={[0.65, 0.52, 0.65]} />
        </mesh>
        <mesh position={[0.32, 0.42, 0.32]} material={materials.crate} castShadow>
          <boxGeometry args={[0.65, 0.52, 0.65]} />
        </mesh>
        {/* Top Centered Crate */}
        <mesh position={[0, 0.94, 0]} material={materials.crate} castShadow>
          <boxGeometry args={[0.7, 0.52, 0.7]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

// -------------------------------------------------------------
// 4. VERTICAL INDUSTRIAL FUEL STORAGE SILO
// -------------------------------------------------------------
export function FuelStorageSilo({ position = [0, 0, 0], radius = 3.5, height = 9.0, isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        steel: new THREE.MeshLambertMaterial({ color: '#cbd5e1' }),
        bands: new THREE.MeshLambertMaterial({ color: '#0284c7' }),
      };
    }
    return {
      steel: new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        roughness: 0.35,
        metalness: 0.75,
      }),
      bands: new THREE.MeshStandardMaterial({
        color: '#0284c7', // Cyan safety stripe
        roughness: 0.4,
        metalness: 0.6,
      }),
      ladder: new THREE.MeshStandardMaterial({
        color: '#eab308', // Safety yellow
        roughness: 0.5,
        metalness: 0.7,
      }),
    };
  }, [isLow]);

  if (isLow) {
    return (
      <group position={position}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, height / 2, 0]} material={materials.steel}>
            <cylinderGeometry args={[radius, radius, height, 16]} />
          </mesh>
        </RigidBody>
      </group>
    );
  }

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Silo Cylinder */}
        <mesh position={[0, height / 2, 0]} material={materials.steel} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 24]} />
        </mesh>
        {/* Domed Roof */}
        <mesh position={[0, height + 0.6, 0]} material={materials.steel}>
          <sphereGeometry args={[radius, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.3]} />
        </mesh>
        {/* Structural Safety Rings */}
        {[height * 0.3, height * 0.6, height * 0.9].map((y, i) => (
          <mesh key={`band-${i}`} position={[0, y, 0]} material={materials.bands}>
            <cylinderGeometry args={[radius + 0.05, radius + 0.05, 0.4, 24]} />
          </mesh>
        ))}
        {/* Vertical Cage Safety Ladder */}
        <mesh position={[radius + 0.2, height / 2, 0]} material={materials.ladder}>
          <boxGeometry args={[0.4, height, 0.2]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

// -------------------------------------------------------------
// 5. HELIPAD WITH GLOWING TAXIWAY BEACONS
// -------------------------------------------------------------
export function Helipad({ position = [0, 0, 0], radius = 9.0, isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        concrete: new THREE.MeshLambertMaterial({
          color: '#334155',
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        }),
        chevron: new THREE.MeshBasicMaterial({
          color: '#eab308',
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
        }),
        markingWhite: new THREE.MeshBasicMaterial({
          color: '#f8fafc',
          polygonOffset: true,
          polygonOffsetFactor: -4,
          polygonOffsetUnits: -4,
        }),
        beaconGlass: new THREE.MeshBasicMaterial({
          color: '#38bdf8',
        }),
      };
    }
    return {
      concrete: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.8,
        metalness: 0.1,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
      chevron: new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3,
      }),
      markingWhite: new THREE.MeshBasicMaterial({
        color: '#f8fafc',
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4,
      }),
      beaconGlass: new THREE.MeshBasicMaterial({
        color: '#38bdf8',
        toneMapped: false,
      }),
    };
  }, [isLow]);

  return (
    <group position={position}>
      {/* Octagonal Raised Concrete Landing Pad */}
      <mesh position={[0, 0.06, 0]} material={materials.concrete} receiveShadow={!isLow}>
        <cylinderGeometry args={[radius, radius, 0.12, 8]} />
      </mesh>

      {/* Yellow Perimeter Circle Marking */}
      <mesh position={[0, 0.125, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.78, radius * 0.82, isLow ? 16 : 32]} />
        <primitive object={materials.chevron} attach="material" />
      </mesh>

      {/* Giant White "H" Landing Marking */}
      <group position={[0, 0.13, 0]}>
        {/* Left vertical bar */}
        <mesh position={[-1.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 4.4]} />
          <primitive object={materials.markingWhite} attach="material" />
        </mesh>
        {/* Right vertical bar */}
        <mesh position={[1.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 4.4]} />
          <primitive object={materials.markingWhite} attach="material" />
        </mesh>
        {/* Crossbar */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 0.7]} />
          <primitive object={materials.markingWhite} attach="material" />
        </mesh>
      </group>

      {/* Perimeter Taxiway Beacons: Mesh-only on Low (no dynamic point lights) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI) / 4;
        const x = Math.cos(angle) * (radius - 0.4);
        const z = Math.sin(angle) * (radius - 0.4);
        return (
          <group key={`beacon-${i}`} position={[x, 0.14, z]}>
            <mesh material={materials.beaconGlass}>
              <cylinderGeometry args={[0.08, 0.08, 0.16, 6]} />
            </mesh>
            {!isLow && <pointLight color="#38bdf8" intensity={0.8} distance={3.5} decay={2} />}
          </group>
        );
      })}
    </group>
  );
}

// -------------------------------------------------------------
// 6. ARMORED TACTICAL PATROL VEHICLE (MRAP / APC)
// -------------------------------------------------------------
export function TacticalAPC({ position = [0, 0, 0], rotation = [0, 0, 0], isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        armor: new THREE.MeshLambertMaterial({ color: '#1e293b' }),
        tires: new THREE.MeshLambertMaterial({ color: '#0f172a' }),
      };
    }
    return {
      armor: new THREE.MeshStandardMaterial({
        color: '#1e293b', // Matte tactical navy / charcoal
        roughness: 0.65,
        metalness: 0.45,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: '#0284c7',
        roughness: 0.1,
        metalness: 0.9,
      }),
      tires: new THREE.MeshStandardMaterial({
        color: '#0f172a',
        roughness: 0.9,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.5,
      }),
    };
  }, [isLow]);

  if (isLow) {
    return (
      <group position={position} rotation={rotation}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 1.2, 0]} material={materials.armor}>
            <boxGeometry args={[2.8, 1.8, 6.2]} />
          </mesh>
        </RigidBody>
      </group>
    );
  }

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Armored Lower Hull */}
        <mesh position={[0, 0.9, 0]} material={materials.armor} castShadow receiveShadow>
          <boxGeometry args={[2.8, 1.1, 6.2]} />
        </mesh>
        {/* Slanted Armored Cab & Roof */}
        <mesh position={[0, 1.8, 0.2]} material={materials.armor} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.9, 4.4]} />
        </mesh>
        {/* Front Slanted Engine Hood */}
        <mesh position={[0, 1.25, -2.2]} rotation={[0.2, 0, 0]} material={materials.armor} castShadow>
          <boxGeometry args={[2.5, 0.5, 1.8]} />
        </mesh>
        {/* Roof Gunner Turret Shield */}
        <mesh position={[0, 2.5, -0.4]} material={materials.armor} castShadow>
          <cylinderGeometry args={[0.7, 0.8, 0.6, 8]} />
        </mesh>
        {/* Heavy Caliber Machine Gun Barrel */}
        <mesh position={[0, 2.65, -1.2]} rotation={[Math.PI / 2, 0, 0]} material={materials.armor}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 12]} />
        </mesh>
      </RigidBody>

      {/* 4 Heavy Off-Road All-Terrain Wheels */}
      {[-1.5, 1.5].map((x, xi) =>
        [-1.8, 1.8].map((z, zi) => (
          <mesh key={`wheel-${xi}-${zi}`} position={[x, 0.55, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.55, 0.55, 0.42, 16]} />
            <primitive object={materials.tires} attach="material" />
          </mesh>
        ))
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 7. HIGH-VOLTAGE DIESEL GENERATOR STATION
// -------------------------------------------------------------
export function IndustrialGenerator({ position = [0, 0, 0], rotation = [0, 0, 0], isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        housing: new THREE.MeshLambertMaterial({ color: '#475569' }),
      };
    }
    return {
      housing: new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.6,
        metalness: 0.4,
      }),
      grill: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.8,
        metalness: 0.8,
      }),
      hazard: new THREE.MeshStandardMaterial({
        color: '#eab308',
        roughness: 0.4,
      }),
    };
  }, [isLow]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* Main Generator Housing */}
        <mesh position={[0, 1.1, 0]} material={materials.housing} castShadow={!isLow} receiveShadow={!isLow}>
          <boxGeometry args={[2.2, 2.2, 3.8]} />
        </mesh>
        {!isLow && (
          <>
            <mesh position={[0, 1.1, -1.92]} material={materials.grill}>
              <boxGeometry args={[1.8, 1.8, 0.06]} />
            </mesh>
            <mesh position={[0.5, 2.6, 0.4]} material={materials.grill}>
              <cylinderGeometry args={[0.1, 0.1, 0.8, 12]} />
            </mesh>
          </>
        )}
      </RigidBody>
    </group>
  );
}

// -------------------------------------------------------------
// 8. TACTICAL GUARD WATCHTOWER WITH FLOODLIGHTS
// -------------------------------------------------------------
export function GuardWatchtower({ position = [0, 0, 0], height = 10.0, isLow = false }) {
  const materials = useMemo(() => {
    if (isLow) {
      return {
        steel: new THREE.MeshLambertMaterial({ color: '#334155' }),
        platform: new THREE.MeshLambertMaterial({ color: '#1e293b' }),
        light: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
      };
    }
    return {
      steel: new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.7,
        metalness: 0.8,
      }),
      platform: new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.8,
      }),
      light: new THREE.MeshBasicMaterial({
        color: '#fef08a',
        toneMapped: false,
      }),
    };
  }, [isLow]);

  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* 4 Structural Leg Columns */}
        {[-1.8, 1.8].map((x, xi) =>
          [-1.8, 1.8].map((z, zi) => (
            <mesh key={`tower-leg-${xi}-${zi}`} position={[x, height / 2, z]} material={materials.steel} castShadow={!isLow}>
              <boxGeometry args={[0.25, height, 0.25]} />
            </mesh>
          ))
        )}
        {/* Sniper / Sentry Observation Platform */}
        <mesh position={[0, height, 0]} material={materials.platform} castShadow={!isLow} receiveShadow={!isLow}>
          <boxGeometry args={[4.4, 0.3, 4.4]} />
        </mesh>
        {/* Guard Railings */}
        <mesh position={[0, height + 0.6, -2.1]} material={materials.steel}>
          <boxGeometry args={[4.4, 1.0, 0.1]} />
        </mesh>
        <mesh position={[0, height + 0.6, 2.1]} material={materials.steel}>
          <boxGeometry args={[4.4, 1.0, 0.1]} />
        </mesh>
        <mesh position={[-2.1, height + 0.6, 0]} material={materials.steel}>
          <boxGeometry args={[0.1, 1.0, 4.4]} />
        </mesh>
        <mesh position={[2.1, height + 0.6, 0]} material={materials.steel}>
          <boxGeometry args={[0.1, 1.0, 4.4]} />
        </mesh>
      </RigidBody>

      {/* Floodlight: Mesh only on Low (Spotlight shadow omitted on Low to preserve 300+ FPS) */}
      <group position={[0, height + 1.2, 0]}>
        <mesh material={materials.light}>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
        </mesh>
        {!isLow && (
          <spotLight
            color="#fef08a"
            intensity={5.0}
            distance={55}
            angle={Math.PI / 4}
            penumbra={0.4}
            castShadow
          />
        )}
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// 9. CONCRETE JERSEY BLAST BARRIER
// -------------------------------------------------------------
export function ConcreteBarrier({ position = [0, 0, 0], rotation = [0, 0, 0], length = 3.2, isLow = false }) {
  const mat = useMemo(() => {
    return isLow
      ? new THREE.MeshLambertMaterial({ color: '#64748b' })
      : new THREE.MeshStandardMaterial({
          color: '#64748b',
          roughness: 0.9,
          metalness: 0.05,
        });
  }, [isLow]);

  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.45, 0]} material={mat} castShadow={!isLow} receiveShadow={!isLow}>
          <boxGeometry args={[0.55, 0.9, length]} />
        </mesh>
      </RigidBody>
    </group>
  );
}

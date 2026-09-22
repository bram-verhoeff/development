import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';

export const WEAPON_SKINS = [
  {
    id: 'cyber-void',
    name: 'NEO-CYBER // VOID',
    tag: 'CYBER-TECH',
    bodyColor: '#121518',
    bodyMetalness: 0.92,
    bodyRoughness: 0.22,
    accentColor: '#00ffcc',
    accentEmissive: '#00ffcc',
    accentEmissiveIntensity: 0.9,
    shroudColor: '#0a0d10',
    barrelColor: '#ffd700', // Gold TiN match barrel
    reticleColor: '#00ffcc',
    glassColor: '#00ffcc',
    gripColor: '#0d1012',
  },
  {
    id: 'dragonfire',
    name: 'DRAGONFIRE // ASHE',
    tag: 'LEGENDARY',
    bodyColor: '#201616',
    bodyMetalness: 0.88,
    bodyRoughness: 0.28,
    accentColor: '#ff4400',
    accentEmissive: '#ff3300',
    accentEmissiveIntensity: 1.1,
    shroudColor: '#2e1c1c',
    barrelColor: '#ff7700',
    reticleColor: '#ff2200',
    glassColor: '#ff9955',
    gripColor: '#181212',
  },
  {
    id: 'covert-fde',
    name: 'TACTICAL COVERT // ARID',
    tag: 'MIL-SPEC',
    bodyColor: '#2b2d30',
    bodyMetalness: 0.65,
    bodyRoughness: 0.45,
    accentColor: '#968160', // Magpul FDE Cerakote
    accentEmissive: '#000000',
    accentEmissiveIntensity: 0.0,
    shroudColor: '#a38d68',
    barrelColor: '#181a1c',
    reticleColor: '#33ff66', // NVG Green reticle
    glassColor: '#88ffaa',
    gripColor: '#1c1e20',
  },
  {
    id: 'arctic-specops',
    name: 'ARCTIC // SPEC-OPS',
    tag: 'WINTER CAMO',
    bodyColor: '#e2e8f0',
    bodyMetalness: 0.55,
    bodyRoughness: 0.25,
    accentColor: '#3b82f6',
    accentEmissive: '#00bfff',
    accentEmissiveIntensity: 0.6,
    shroudColor: '#cbd5e1',
    barrelColor: '#64748b',
    reticleColor: '#00d4ff',
    glassColor: '#a5f3fc',
    gripColor: '#334155',
  },
  {
    id: 'gold-carbon',
    name: 'DAMASCUS // 24K GOLD',
    tag: 'MASTERWORK',
    bodyColor: '#0c0d10',
    bodyMetalness: 0.96,
    bodyRoughness: 0.16,
    accentColor: '#ffc83b', // 24K Mirror Gold
    accentEmissive: '#ffaa00',
    accentEmissiveIntensity: 0.35,
    shroudColor: '#16181f',
    barrelColor: '#ffc83b',
    reticleColor: '#ffcc00',
    glassColor: '#ffe599',
    gripColor: '#101216',
  }
];

export const WEAPON_CLASSES = [
  {
    id: 'mk18',
    name: 'MK-18 MOD 1',
    category: 'ASSAULT RIFLE',
    caliber: '5.56x45mm NATO',
    rpm: 580,
    magSize: 30,
    reserveAmmo: 120,
    damage: 28,
    headshotMult: 2.3,
    recoilKick: 0.045,
    recoilPitch: 0.05,
    adsFOV: 52,
    adsPos: [0.0, -0.110, -0.26],
    spread: 0.015,
    sound: 'rifle',
    stats: { damage: 72, fireRate: 68, range: 75, accuracy: 80, mobility: 70 },
  },
  {
    id: 'vector',
    name: 'KRISS VECTOR .45',
    category: 'SUBMACHINE GUN',
    caliber: '.45 ACP Super V',
    rpm: 950,
    magSize: 35,
    reserveAmmo: 140,
    damage: 19,
    headshotMult: 2.1,
    recoilKick: 0.030,
    recoilPitch: 0.035,
    adsFOV: 54,
    adsPos: [0.0, -0.110, -0.24],
    spread: 0.022,
    sound: 'smg',
    stats: { damage: 55, fireRate: 98, range: 45, accuracy: 65, mobility: 95 },
  },
  {
    id: 'ax50',
    name: 'AX-50 ANTI-MATERIEL',
    category: 'SNIPER RIFLE',
    caliber: '.50 BMG Match',
    rpm: 48,
    magSize: 5,
    reserveAmmo: 25,
    damage: 95,
    headshotMult: 3.5, // 1-shot kill anywhere on head/torso
    recoilKick: 0.12,
    recoilPitch: 0.16,
    adsFOV: 20, // Crisp 8.0x Zoom
    adsPos: [0.0, -0.110, -0.22],
    spread: 0.002,
    sound: 'sniper',
    stats: { damage: 100, fireRate: 20, range: 98, accuracy: 96, mobility: 35 },
  },
  {
    id: 'spas12',
    name: 'SPAS-12 TACTICAL',
    category: 'COMBAT SHOTGUN',
    caliber: '12-Gauge 00 Buck',
    rpm: 130,
    magSize: 8,
    reserveAmmo: 32,
    damage: 15, // 8 pellets = 120 total max damage
    pellets: 8,
    headshotMult: 1.8,
    recoilKick: 0.08,
    recoilPitch: 0.10,
    adsFOV: 56,
    adsPos: [0.0, -0.110, -0.26],
    spread: 0.055,
    sound: 'shotgun',
    stats: { damage: 92, fireRate: 35, range: 30, accuracy: 40, mobility: 78 },
  },
  {
    id: 'glock19',
    name: 'G-19 COMBAT TAC',
    category: 'TACTICAL PISTOL',
    caliber: '9x19mm Parabellum',
    rpm: 420,
    magSize: 15,
    reserveAmmo: 60,
    damage: 24,
    headshotMult: 2.2,
    recoilKick: 0.030,
    recoilPitch: 0.038,
    adsFOV: 58,
    adsPos: [0.0, -0.110, -0.26],
    spread: 0.018,
    sound: 'pistol',
    stats: { damage: 48, fireRate: 65, range: 40, accuracy: 72, mobility: 100 },
  },
];

// Generate carbon fiber texture
function getCarbonFiberTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#111315';
  ctx.fillRect(0, 0, 64, 64);

  // Weave pattern
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      const isAlt = ((x / 8) % 2 === 0) !== ((y / 8) % 2 === 0);
      ctx.fillStyle = isAlt ? '#22262a' : '#181a1d';
      ctx.fillRect(x, y, 8, 8);

      // Weave thread highlight
      ctx.strokeStyle = isAlt ? '#30363c' : '#1e2124';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 8, 8);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

export function ProceduralRifle({
  weaponId = 'mk18',
  skinIndex = 0,
  muzzleFlashVisible = false,
  isAiming = false,
}) {
  const activeSkin = WEAPON_SKINS[skinIndex] || WEAPON_SKINS[0];
  const carbonTexture = useMemo(() => getCarbonFiberTexture(), []);

  // Tactical PBR Materials
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({
        color: activeSkin.bodyColor,
        roughness: activeSkin.bodyRoughness,
        metalness: activeSkin.bodyMetalness,
        bumpScale: 0.04,
      }),
      carbon: new THREE.MeshStandardMaterial({
        map: carbonTexture,
        roughness: 0.35,
        metalness: 0.45,
      }),
      shroud: new THREE.MeshStandardMaterial({
        color: activeSkin.shroudColor,
        roughness: 0.45,
        metalness: 0.85,
      }),
      barrel: new THREE.MeshStandardMaterial({
        color: activeSkin.barrelColor,
        roughness: 0.25,
        metalness: 0.95,
      }),
      polymer: new THREE.MeshStandardMaterial({
        color: activeSkin.gripColor,
        roughness: 0.85,
        metalness: 0.05,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: activeSkin.accentColor,
        emissive: activeSkin.accentEmissive,
        emissiveIntensity: activeSkin.accentEmissiveIntensity,
        roughness: 0.28,
        metalness: 0.85,
      }),
      sightHousing: new THREE.MeshStandardMaterial({
        color: '#121417',
        roughness: 0.4,
        metalness: 0.8,
      }),
      reticle: new THREE.MeshBasicMaterial({
        color: activeSkin.reticleColor,
        toneMapped: false,
        transparent: true,
        opacity: 0.98,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      // Crystal clear optical lens with subtle anti-reflective coating
      glass: new THREE.MeshBasicMaterial({
        color: activeSkin.glassColor,
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
      }),
      flash: new THREE.MeshBasicMaterial({
        color: '#ffbb44',
        toneMapped: false,
      }),
    };
  }, [activeSkin, carbonTexture]);

  return (
    <group
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={[1.1, 1.1, 1.1]}
      visible={!(weaponId === 'ax50' && isAiming)} // Hide 3D sniper rifle during 8.0x fullscreen scope overlay
    >
      {/* Viewmodel Fill Light to illuminate weapon model in first-person */}
      <pointLight position={[0.25, 0.2, -0.15]} intensity={1.6} distance={2.5} color="#f0f6ff" />
      <pointLight position={[-0.15, 0.1, -0.3]} intensity={0.8} distance={2.0} color="#a0c8f0" />

      {/* Render Model based on weaponId */}
      {weaponId === 'vector' && (
        <VectorModel materials={materials} muzzleFlashVisible={muzzleFlashVisible} />
      )}
      {weaponId === 'ax50' && (
        <AX50Model materials={materials} muzzleFlashVisible={muzzleFlashVisible} />
      )}
      {weaponId === 'spas12' && (
        <SPAS12Model materials={materials} muzzleFlashVisible={muzzleFlashVisible} />
      )}
      {weaponId === 'glock19' && (
        <Glock19Model materials={materials} muzzleFlashVisible={muzzleFlashVisible} />
      )}
      {(weaponId === 'mk18' || !['vector', 'ax50', 'spas12', 'glock19'].includes(weaponId)) && (
        <MK18Model materials={materials} muzzleFlashVisible={muzzleFlashVisible} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 1. MK-18 ASSAULT RIFLE MODEL
// -------------------------------------------------------------
function MK18Model({ materials, muzzleFlashVisible }) {
  return (
    <group>
      {/* Upper & Lower Receiver */}
      <mesh material={materials.body} position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.046, 0.085, 0.28]} />
      </mesh>
      {/* Brass Deflector & Forward Assist */}
      <mesh material={materials.shroud} position={[0.026, 0.015, -0.02]}>
        <boxGeometry args={[0.018, 0.035, 0.04]} />
      </mesh>
      {/* Free-Float M-LOK Rail Handguard */}
      <mesh material={materials.shroud} position={[0, 0.005, -0.25]} castShadow>
        <boxGeometry args={[0.048, 0.065, 0.24]} />
      </mesh>
      {/* Top Picatinny Rail */}
      <mesh material={materials.shroud} position={[0, 0.048, -0.12]}>
        <boxGeometry args={[0.024, 0.012, 0.44]} />
      </mesh>
      {/* Match Grade Barrel */}
      <mesh material={materials.barrel} position={[0, 0.008, -0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.16, 16]} />
      </mesh>
      {/* Four-Prong Flash Hider */}
      <mesh material={materials.accent} position={[0, 0.008, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.019, 0.016, 0.055, 16]} />
      </mesh>
      {/* Curved 30-Round PMAG Magazine */}
      <mesh material={materials.polymer} position={[0, -0.12, -0.06]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.032, 0.17, 0.068]} />
      </mesh>
      {/* Ergonomic Pistol Grip */}
      <mesh material={materials.polymer} position={[0, -0.10, 0.09]} rotation={[-0.45, 0, 0]}>
        <boxGeometry args={[0.034, 0.14, 0.055]} />
      </mesh>
      {/* Tactical Crane Stock */}
      <mesh material={materials.polymer} position={[0, 0.005, 0.22]}>
        <boxGeometry args={[0.042, 0.08, 0.18]} />
      </mesh>

      {/* Reflex Holographic Optic (Reticle at Y = 0.075 + 0.025 = 0.100) */}
      <ReflexSight materials={materials} position={[0, 0.075, -0.06]} />

      {/* Muzzle Flash Effect */}
      {muzzleFlashVisible && (
        <MuzzleFlash position={[0, 0.008, -0.56]} scale={1.2} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 2. KRISS VECTOR .45 SMG MODEL
// -------------------------------------------------------------
function VectorModel({ materials, muzzleFlashVisible }) {
  return (
    <group>
      {/* Iconic Slanted Super-V Recoil Main Receiver */}
      <mesh material={materials.body} position={[0, 0.01, 0.02]} castShadow>
        <boxGeometry args={[0.048, 0.11, 0.22]} />
      </mesh>
      {/* Forward Slanted Magazine Well Housing */}
      <mesh material={materials.body} position={[0, -0.06, -0.08]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.044, 0.12, 0.07]} />
      </mesh>
      {/* Extended 35-Rnd Stick Magazine */}
      <mesh material={materials.polymer} position={[0, -0.15, -0.09]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.030, 0.18, 0.045]} />
      </mesh>
      {/* Short CQB Barrel Shroud & Integrated Handguard */}
      <mesh material={materials.shroud} position={[0, 0.01, -0.16]} castShadow>
        <boxGeometry args={[0.046, 0.075, 0.14]} />
      </mesh>
      {/* Compact Barrel */}
      <mesh material={materials.barrel} position={[0, 0.01, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.08, 16]} />
      </mesh>
      {/* Compact Linear Compensator */}
      <mesh material={materials.accent} position={[0, 0.01, -0.31]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.016, 0.045, 16]} />
      </mesh>
      {/* Top Full-Length Rail */}
      <mesh material={materials.shroud} position={[0, 0.062, -0.06]}>
        <boxGeometry args={[0.024, 0.010, 0.32]} />
      </mesh>
      {/* Vertical CQB Foregrip */}
      <mesh material={materials.polymer} position={[0, -0.075, -0.18]}>
        <cylinderGeometry args={[0.016, 0.015, 0.10, 12]} />
      </mesh>
      {/* Ergonomic Textured Pistol Grip */}
      <mesh material={materials.polymer} position={[0, -0.09, 0.08]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.032, 0.13, 0.05]} />
      </mesh>
      {/* Skeletonized Folding Stock */}
      <mesh material={materials.accent} position={[0, 0.02, 0.19]}>
        <boxGeometry args={[0.028, 0.06, 0.16]} />
      </mesh>

      {/* Reflex Sight (Mounted at identical optical height Y = 0.075 + 0.025 = 0.100) */}
      <ReflexSight materials={materials} position={[0, 0.075, -0.06]} />

      {/* Muzzle Flash Effect */}
      {muzzleFlashVisible && (
        <MuzzleFlash position={[0, 0.01, -0.34]} scale={0.9} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 3. AX-50 HEAVY .50 BMG SNIPER RIFLE MODEL
// -------------------------------------------------------------
function AX50Model({ materials, muzzleFlashVisible }) {
  return (
    <group>
      {/* Long Heavy Billet Steel Receiver */}
      <mesh material={materials.body} position={[0, 0.01, 0.02]} castShadow>
        <boxGeometry args={[0.052, 0.095, 0.38]} />
      </mesh>
      {/* Bolt Handle */}
      <mesh material={materials.accent} position={[0.036, 0.04, 0.02]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.007, 0.007, 0.06, 12]} />
      </mesh>
      <mesh material={materials.polymer} position={[0.055, 0.055, 0.02]}>
        <sphereGeometry args={[0.014, 12, 12]} />
      </mesh>
      {/* Elongated Octagonal Sniper Chassis Handguard */}
      <mesh material={materials.shroud} position={[0, 0.01, -0.32]} castShadow>
        <boxGeometry args={[0.052, 0.075, 0.34]} />
      </mesh>
      {/* Massive 29-Inch Fluted Heavy Barrel */}
      <mesh material={materials.barrel} position={[0, 0.015, -0.62]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.32, 16]} />
      </mesh>
      {/* Monster Tank-Brake .50 BMG Muzzle Compensator */}
      <mesh material={materials.accent} position={[0, 0.015, -0.80]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.046, 0.07, 0.035]} />
      </mesh>
      {/* Folded Bipod Under Barrel */}
      <mesh material={materials.body} position={[0, -0.04, -0.44]}>
        <boxGeometry args={[0.035, 0.025, 0.16]} />
      </mesh>
      {/* Heavy 5-Round Steel Box Magazine */}
      <mesh material={materials.polymer} position={[0, -0.10, -0.04]}>
        <boxGeometry args={[0.038, 0.13, 0.10]} />
      </mesh>
      {/* Precision Sniper Stock with Adjustable Cheek Rest */}
      <mesh material={materials.polymer} position={[0, 0.01, 0.30]}>
        <boxGeometry args={[0.046, 0.09, 0.22]} />
      </mesh>
      <mesh material={materials.accent} position={[0, 0.065, 0.26]}>
        <boxGeometry args={[0.034, 0.025, 0.10]} />
      </mesh>
      {/* Vertical Target Pistol Grip */}
      <mesh material={materials.polymer} position={[0, -0.10, 0.12]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.034, 0.13, 0.05]} />
      </mesh>

      {/* 8x Telescopic Sniper Scope */}
      <SniperScope materials={materials} position={[0, 0.085, -0.06]} />

      {/* Massive Concussive Muzzle Blast */}
      {muzzleFlashVisible && (
        <MuzzleFlash position={[0, 0.015, -0.85]} scale={2.4} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 4. SPAS-12 TACTICAL COMBAT SHOTGUN MODEL
// -------------------------------------------------------------
function SPAS12Model({ materials, muzzleFlashVisible }) {
  return (
    <group>
      {/* Boxy Steel Receiver */}
      <mesh material={materials.body} position={[0, 0.01, 0.04]} castShadow>
        <boxGeometry args={[0.048, 0.095, 0.28]} />
      </mesh>
      {/* Heat Shield Perforated Upper Barrel */}
      <mesh material={materials.shroud} position={[0, 0.03, -0.28]} castShadow>
        <boxGeometry args={[0.042, 0.04, 0.40]} />
      </mesh>
      {/* Heavy 12GA Shotgun Barrel */}
      <mesh material={materials.barrel} position={[0, 0.025, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.016, 0.016, 0.46, 16]} />
      </mesh>
      {/* Under-Barrel Extended 8-Round Magazine Tube */}
      <mesh material={materials.barrel} position={[0, -0.01, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.44, 16]} />
      </mesh>
      {/* Ribbed Ergonomic Pump Forend */}
      <mesh material={materials.polymer} position={[0, -0.01, -0.24]}>
        <boxGeometry args={[0.052, 0.055, 0.18]} />
      </mesh>
      {/* Pistol Grip & Receiver Buffer */}
      <mesh material={materials.polymer} position={[0, -0.09, 0.12]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.034, 0.13, 0.05]} />
      </mesh>

      {/* Top Folding Stock (Positioned neatly so it NEVER blocks the optic line) */}
      <mesh material={materials.accent} position={[0, 0.036, 0.15]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.036, 0.014, 0.20]} />
      </mesh>

      {/* Raised Picatinny Optic Mount */}
      <mesh material={materials.sightHousing} position={[0, 0.054, -0.06]}>
        <boxGeometry args={[0.026, 0.014, 0.12]} />
      </mesh>

      {/* Reflex Sight (Optical height Y = 0.075 + 0.025 = 0.100) */}
      <ReflexSight materials={materials} position={[0, 0.075, -0.06]} />

      {/* Shotgun Concussion Muzzle Flash */}
      {muzzleFlashVisible && (
        <MuzzleFlash position={[0, 0.025, -0.58]} scale={1.8} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 5. GLOCK-19 TACTICAL PISTOL MODEL
// -------------------------------------------------------------
function Glock19Model({ materials, muzzleFlashVisible }) {
  return (
    // Centered at X = 0 so ADS is 100% aligned with crosshair
    <group position={[0, 0.025, 0.05]}>
      {/* Polymer Lower Frame & Beavertail */}
      <mesh material={materials.polymer} position={[0, -0.01, -0.02]} castShadow>
        <boxGeometry args={[0.034, 0.05, 0.16]} />
      </mesh>
      {/* Reciprocating Steel Slide */}
      <mesh material={materials.body} position={[0, 0.035, -0.03]} castShadow>
        <boxGeometry args={[0.036, 0.042, 0.19]} />
      </mesh>
      {/* Front Slide Serrations */}
      <mesh material={materials.accent} position={[0.019, 0.035, -0.09]}>
        <boxGeometry args={[0.003, 0.03, 0.04]} />
      </mesh>
      <mesh material={materials.accent} position={[-0.019, 0.035, -0.09]}>
        <boxGeometry args={[0.003, 0.03, 0.04]} />
      </mesh>
      {/* Match Grade Barrel & Mini Compensator */}
      <mesh material={materials.barrel} position={[0, 0.038, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.011, 0.011, 0.05, 14]} />
      </mesh>
      <mesh material={materials.accent} position={[0, 0.038, -0.17]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.025, 14]} />
      </mesh>
      {/* Ergonomic Molded Pistol Grip */}
      <mesh material={materials.polymer} position={[0, -0.08, 0.02]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.032, 0.12, 0.048]} />
      </mesh>
      {/* Magazine Baseplate */}
      <mesh material={materials.accent} position={[0, -0.14, 0.04]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[0.034, 0.015, 0.052]} />
      </mesh>
      {/* Under-Barrel Tactical Weaponlight */}
      <mesh material={materials.body} position={[0, -0.01, -0.08]}>
        <boxGeometry args={[0.028, 0.03, 0.07]} />
      </mesh>

      {/* Slide-Mounted Micro RMR Sight (Optical center Y = 0.075 + 0.025 = 0.100) */}
      <ReflexSight materials={materials} position={[0, 0.075, -0.04]} scale={0.88} />

      {/* Muzzle Flash */}
      {muzzleFlashVisible && (
        <MuzzleFlash position={[0, 0.038, -0.19]} scale={0.8} />
      )}
    </group>
  );
}

// -------------------------------------------------------------
// HIGH-FIDELITY REFLEX OPTIC (CRYSTAL CLEAR HOLLOW FRAME)
// -------------------------------------------------------------
function ReflexSight({ materials, position = [0, 0, 0], scale = 1.0 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Picatinny Clamp Base */}
      <mesh material={materials.sightHousing} position={[0, -0.012, 0]}>
        <boxGeometry args={[0.038, 0.014, 0.065]} />
      </mesh>

      {/* Ultra-Thin Bezel Hollow Frame */}
      {/* Bottom Frame Lip */}
      <mesh material={materials.sightHousing} position={[0, 0.002, 0]}>
        <boxGeometry args={[0.046, 0.006, 0.045]} />
      </mesh>
      {/* Left Bezel Pillar */}
      <mesh material={materials.sightHousing} position={[-0.021, 0.025, 0]}>
        <boxGeometry args={[0.004, 0.044, 0.045]} />
      </mesh>
      {/* Right Bezel Pillar */}
      <mesh material={materials.sightHousing} position={[0.021, 0.025, 0]}>
        <boxGeometry args={[0.004, 0.044, 0.045]} />
      </mesh>
      {/* Top Protective Hood */}
      <mesh material={materials.sightHousing} position={[0, 0.048, 0]}>
        <boxGeometry args={[0.046, 0.005, 0.045]} />
      </mesh>

      {/* Crystal Clear Coated Glass Lens (Transparent, zero black-block artifacts) */}
      <mesh material={materials.glass} position={[0, 0.025, 0]}>
        <boxGeometry args={[0.038, 0.042, 0.002]} />
      </mesh>

      {/* Military Holographic Reticle (EOTech Style: Center Dot + Circle + Stadia Ticks) */}
      <group position={[0, 0.025, 0.002]}>
        {/* Center Precision Aiming Dot */}
        <mesh material={materials.reticle}>
          <circleGeometry args={[0.0011, 16]} />
        </mesh>
        {/* 68 MOA Outer Holographic Ring */}
        <mesh material={materials.reticle}>
          <ringGeometry args={[0.0070, 0.0082, 32]} />
        </mesh>
        {/* Left Stadia Hashmark */}
        <mesh material={materials.reticle} position={[-0.010, 0, 0]}>
          <planeGeometry args={[0.0035, 0.0008]} />
        </mesh>
        {/* Right Stadia Hashmark */}
        <mesh material={materials.reticle} position={[0.010, 0, 0]}>
          <planeGeometry args={[0.0035, 0.0008]} />
        </mesh>
        {/* Bottom Range Tick */}
        <mesh material={materials.reticle} position={[0, -0.010, 0]}>
          <planeGeometry args={[0.0008, 0.0035]} />
        </mesh>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// TELESCOPIC 8X SNIPER SCOPE MODEL (AX-50)
// -------------------------------------------------------------
function SniperScope({ materials, position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Cantilever Scope Mount */}
      <mesh material={materials.sightHousing} position={[0, -0.015, 0]}>
        <boxGeometry args={[0.032, 0.018, 0.12]} />
      </mesh>
      {/* Dual Mounting Rings */}
      <mesh material={materials.sightHousing} position={[0, 0.015, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.024, 16]} />
      </mesh>
      <mesh material={materials.sightHousing} position={[0, 0.015, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.024, 16]} />
      </mesh>
      {/* 34mm Outer Scope Tube (With hollow interior) */}
      <mesh material={materials.sightHousing} position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.020, 0.020, 0.22, 16, 1, true]} />
      </mesh>
      {/* Front 56mm Objective Bell & Sunshade */}
      <mesh material={materials.sightHousing} position={[0, 0.015, -0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.030, 0.022, 0.08, 16, 1, true]} />
      </mesh>
      {/* Rear Ocular Eyepiece with Rubber Ring */}
      <mesh material={materials.polymer} position={[0, 0.015, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.05, 16, 1, true]} />
      </mesh>
      {/* Elevation & Windage Turrets */}
      <mesh material={materials.accent} position={[0, 0.042, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.022, 12]} />
      </mesh>
      <mesh material={materials.accent} position={[0.028, 0.015, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.022, 12]} />
      </mesh>

      {/* Clear Optical Glass Lens at Ocular and Objective */}
      <mesh material={materials.glass} position={[0, 0.015, 0.11]}>
        <circleGeometry args={[0.022, 32]} />
      </mesh>
      <mesh material={materials.glass} position={[0, 0.015, -0.16]}>
        <circleGeometry args={[0.027, 32]} />
      </mesh>

      {/* Fine Mil-Dot Crosshairs */}
      <mesh material={materials.reticle} position={[0, 0.015, 0.111]}>
        <planeGeometry args={[0.038, 0.0008]} />
      </mesh>
      <mesh material={materials.reticle} position={[0, 0.015, 0.111]}>
        <planeGeometry args={[0.0008, 0.038]} />
      </mesh>
    </group>
  );
}

// -------------------------------------------------------------
// DYNAMIC PROCEDURAL MUZZLE FLASH
// -------------------------------------------------------------
function MuzzleFlash({ position, scale = 1.0 }) {
  const flashMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#ffbb44',
    toneMapped: false,
  }), []);

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <pointLight color="#ff8822" intensity={4.5} distance={12} decay={2} />
      <mesh material={flashMat} rotation={[0, 0, Math.random() * Math.PI]}>
        <coneGeometry args={[0.05, 0.22, 8]} />
      </mesh>
      <mesh material={flashMat} rotation={[0, 0, Math.random() * Math.PI + Math.PI / 2]}>
        <coneGeometry args={[0.035, 0.16, 8]} />
      </mesh>
    </group>
  );
}

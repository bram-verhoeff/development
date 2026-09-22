import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const OPERATIVE_SKINS = [
  {
    id: 'ghost-specops',
    name: 'GHOST // SPEC-OPS',
    theme: 'TACTICAL SHADOW',
    helmetColor: '#1a1d20',
    vestColor: '#282b30',
    fatiguesColor: '#1e2124',
    bootsColor: '#121416',
    armorPlateColor: '#30343a',
    visorColor: '#eab308',
    visorEmissive: '#ca8a04',
    visorEmissiveIntensity: 0.6,
    accentColor: '#3b82f6',
    skullMask: true,
  },
  {
    id: 'cyber-ronin',
    name: 'CYBER // RONIN',
    theme: 'NEO-TOKYO CYBER',
    helmetColor: '#0f172a',
    vestColor: '#1e293b',
    fatiguesColor: '#090d16',
    bootsColor: '#020617',
    armorPlateColor: '#0284c7',
    visorColor: '#00ffcc',
    visorEmissive: '#00ffcc',
    visorEmissiveIntensity: 1.2,
    accentColor: '#00ffcc',
    skullMask: false,
  },
  {
    id: 'desert-viper',
    name: 'DESERT // VIPER',
    theme: 'MOJAVE RECON',
    helmetColor: '#8c7653',
    vestColor: '#a8906c',
    fatiguesColor: '#6e5d42',
    bootsColor: '#4a3d2b',
    armorPlateColor: '#786547',
    visorColor: '#f97316',
    visorEmissive: '#c2410c',
    visorEmissiveIntensity: 0.5,
    accentColor: '#ea580c',
    skullMask: false,
  },
  {
    id: 'toxic-hazard',
    name: 'TOXIC // HAZARD',
    theme: 'CBRN OPERATIVE',
    helmetColor: '#eab308',
    vestColor: '#1f2937',
    fatiguesColor: '#374151',
    bootsColor: '#111827',
    armorPlateColor: '#ca8a04',
    visorColor: '#22c55e',
    visorEmissive: '#16a34a',
    visorEmissiveIntensity: 1.0,
    accentColor: '#eab308',
    skullMask: false,
  },
  {
    id: 'shadow-stealth',
    name: 'SHADOW // NIGHTFALL',
    theme: 'COVERT INFILTRATOR',
    helmetColor: '#090a0c',
    vestColor: '#121418',
    fatiguesColor: '#0d0f12',
    bootsColor: '#050607',
    armorPlateColor: '#1e2229',
    visorColor: '#ef4444',
    visorEmissive: '#dc2626',
    visorEmissiveIntensity: 1.2,
    accentColor: '#ef4444',
    skullMask: false,
  }
];

export function RealisticOperative({
  skinId = 'ghost-specops',
  targetId = 'player-dummy',
  isMoving = false,
  isSprinting = false,
  isSliding = false,
  isAiming = false,
  isFiring = false,
  pitch = 0,
}) {
  const headRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const torsoRef = useRef();
  const weaponRef = useRef();

  const skin = useMemo(() => {
    return OPERATIVE_SKINS.find((s) => s.id === skinId) || OPERATIVE_SKINS[0];
  }, [skinId]);

  // High-fidelity PBR Materials
  const mats = useMemo(() => {
    return {
      helmet: new THREE.MeshStandardMaterial({
        color: skin.helmetColor,
        roughness: 0.6,
        metalness: 0.25,
      }),
      vest: new THREE.MeshStandardMaterial({
        color: skin.vestColor,
        roughness: 0.8,
        metalness: 0.15,
      }),
      fatigues: new THREE.MeshStandardMaterial({
        color: skin.fatiguesColor,
        roughness: 0.85,
        metalness: 0.08,
      }),
      armorPlate: new THREE.MeshStandardMaterial({
        color: skin.armorPlateColor,
        roughness: 0.35,
        metalness: 0.8,
      }),
      boots: new THREE.MeshStandardMaterial({
        color: skin.bootsColor,
        roughness: 0.7,
        metalness: 0.2,
      }),
      visor: new THREE.MeshPhysicalMaterial({
        color: skin.visorColor,
        emissive: skin.visorEmissive,
        emissiveIntensity: skin.visorEmissiveIntensity,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.9,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: skin.accentColor,
        roughness: 0.4,
        metalness: 0.6,
      }),
      pouches: new THREE.MeshStandardMaterial({
        color: '#2b2d30',
        roughness: 0.9,
        metalness: 0.05,
      }),
      skinFace: new THREE.MeshStandardMaterial({
        color: '#26282b', // Tactical balaclava
        roughness: 0.9,
      }),
      weapon: new THREE.MeshStandardMaterial({
        color: '#15171a',
        roughness: 0.35,
        metalness: 0.85,
      }),
      flash: new THREE.MeshBasicMaterial({
        color: '#ffaa33',
        toneMapped: false,
      }),
      hitboxMat: new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
      }),
    };
  }, [skin]);

  // Procedural Walking / Running / Sliding Animation Loop
  useFrame((_, delta) => {
    const time = performance.now() * 0.001;

    // Head Pitch Tracking
    if (headRef.current) {
      headRef.current.rotation.x = pitch;
    }

    // Dynamic Sliding Posture
    if (isSliding) {
      if (torsoRef.current) {
        torsoRef.current.position.y = -0.42;
        torsoRef.current.rotation.x = 0.35;
        torsoRef.current.rotation.z = -0.15;
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = -1.1; // Extended slide leg
        leftLegRef.current.position.y = 0.2;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = 0.8; // Tucked knee
        rightLegRef.current.position.y = 0.1;
      }
    } else {
      // Normal Standing / Walking / Running
      if (torsoRef.current) {
        torsoRef.current.position.y = 0;
        torsoRef.current.rotation.x = 0;
        torsoRef.current.rotation.z = 0;
      }

      if (isMoving) {
        const speedMultiplier = isSprinting ? 14 : 9;
        const stride = Math.sin(time * speedMultiplier) * (isSprinting ? 0.65 : 0.4);

        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = stride;
        }
        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = -stride;
        }
        if (torsoRef.current) {
          torsoRef.current.position.y = Math.abs(Math.sin(time * speedMultiplier)) * 0.04;
          torsoRef.current.rotation.z = Math.sin(time * (speedMultiplier * 0.5)) * 0.03;
        }
      } else {
        // Subtle Breathing Idle
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (torsoRef.current) {
          torsoRef.current.position.y = Math.sin(time * 2.0) * 0.012;
        }
      }
    }
  });

  return (
    <group position={[0, 0, 0]} userData={{ targetId }}>
      {/* ------------------------------------------------------------- */}
      {/* 0. DEDICATED FULL-BODY HITBOXES (HEAD, CHEST, LEGS)           */}
      {/* ------------------------------------------------------------- */}
      {/* Head Hitbox (Covering balaclava, helmet, NVGs, headset) */}
      <mesh
        position={[0, 1.54, 0]}
        material={mats.hitboxMat}
        userData={{ isHitbox: true, type: 'head', targetId }}
      >
        <sphereGeometry args={[0.22, 12, 12]} />
      </mesh>

      {/* Torso & Arms Hitbox (Covering chest plate, pouches, shoulders, arms) */}
      <mesh
        position={[0, 1.05, 0]}
        material={mats.hitboxMat}
        userData={{ isHitbox: true, type: 'body', targetId }}
      >
        <boxGeometry args={[0.55, 0.62, 0.38]} />
      </mesh>

      {/* Pelvis & Legs Hitbox (Covering belt, thighs, knees, shins, boots) */}
      <mesh
        position={[0, 0.37, 0]}
        material={mats.hitboxMat}
        userData={{ isHitbox: true, type: 'body', targetId }}
      >
        <boxGeometry args={[0.46, 0.74, 0.32]} />
      </mesh>

      {/* ------------------------------------------------------------- */}
      {/* 1. LEGS & COMBAT BOOTS */}
      {/* ------------------------------------------------------------- */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.13, 0.72, 0]}>
        {/* Thigh */}
        <mesh material={mats.fatigues} position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.065, 0.36, 12]} />
        </mesh>
        {/* Molded Hard Kneepad */}
        <mesh material={mats.armorPlate} position={[0, -0.36, 0.06]} castShadow>
          <boxGeometry args={[0.09, 0.10, 0.05]} />
        </mesh>
        {/* Calf / Shin */}
        <mesh material={mats.fatigues} position={[0, -0.48, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.055, 0.32, 12]} />
        </mesh>
        {/* Tactical Assault Boot */}
        <mesh material={mats.boots} position={[0, -0.68, 0.04]} castShadow>
          <boxGeometry args={[0.095, 0.12, 0.20]} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.13, 0.72, 0]}>
        {/* Thigh */}
        <mesh material={mats.fatigues} position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.065, 0.36, 12]} />
        </mesh>
        {/* Drop-Leg Tactical Holster with Sidearm */}
        <mesh material={mats.pouches} position={[0.08, -0.18, 0]}>
          <boxGeometry args={[0.04, 0.14, 0.08]} />
        </mesh>
        <mesh material={mats.weapon} position={[0.08, -0.12, 0.02]} rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.025, 0.05, 0.09]} />
        </mesh>
        {/* Molded Hard Kneepad */}
        <mesh material={mats.armorPlate} position={[0, -0.36, 0.06]} castShadow>
          <boxGeometry args={[0.09, 0.10, 0.05]} />
        </mesh>
        {/* Calf / Shin */}
        <mesh material={mats.fatigues} position={[0, -0.48, 0]} castShadow>
          <cylinderGeometry args={[0.062, 0.055, 0.32, 12]} />
        </mesh>
        {/* Tactical Assault Boot */}
        <mesh material={mats.boots} position={[0, -0.68, 0.04]} castShadow>
          <boxGeometry args={[0.095, 0.12, 0.20]} />
        </mesh>
      </group>

      {/* ------------------------------------------------------------- */}
      {/* 2. TORSO, PLATE CARRIER & GEAR */}
      {/* ------------------------------------------------------------- */}
      <group ref={torsoRef} position={[0, 0, 0]}>
        {/* Tactical Battle Belt */}
        <group position={[0, 0.74, 0]}>
          <mesh material={mats.vest} castShadow>
            <boxGeometry args={[0.38, 0.12, 0.24]} />
          </mesh>
          {/* IFAK Med-kit Pouch on Right Hip */}
          <mesh material={mats.pouches} position={[0.18, 0, 0]}>
            <boxGeometry args={[0.05, 0.09, 0.10]} />
          </mesh>
          {/* Dump Pouch on Back */}
          <mesh material={mats.pouches} position={[0, -0.02, -0.13]}>
            <boxGeometry args={[0.16, 0.12, 0.05]} />
          </mesh>
        </group>

        {/* Torso & Tactical Plate Carrier with Body Hitbox */}
        <group position={[0, 1.08, 0]}>
          {/* Main Body Hitbox Box */}
          <mesh
            material={mats.vest}
            castShadow
            userData={{ isHitbox: true, type: 'body', targetId }}
          >
            <boxGeometry args={[0.42, 0.52, 0.28]} />
          </mesh>

          {/* Front Ballistic Plate Carrier */}
          <mesh material={mats.armorPlate} position={[0, 0.02, 0.14]} castShadow>
            <boxGeometry args={[0.30, 0.36, 0.05]} />
          </mesh>

          {/* Triple 5.56 Magazine Pouches on Chest */}
          {[-0.09, 0, 0.09].map((x, i) => (
            <mesh key={`pouch-${i}`} material={mats.pouches} position={[x, -0.06, 0.17]}>
              <boxGeometry args={[0.07, 0.13, 0.04]} />
            </mesh>
          ))}

          {/* Tactical PRC-152 Radio with Whip Antenna on Left Shoulder */}
          <mesh material={mats.pouches} position={[-0.16, 0.16, 0.08]}>
            <boxGeometry args={[0.045, 0.12, 0.05]} />
          </mesh>
          <mesh material={mats.armorPlate} position={[-0.16, 0.27, 0.08]}>
            <cylinderGeometry args={[0.003, 0.003, 0.18, 8]} />
          </mesh>

          {/* Combat Knife in Sheath Angled Across Chest */}
          <mesh material={mats.armorPlate} position={[0.08, 0.15, 0.16]} rotation={[0, 0, -0.7]}>
            <boxGeometry args={[0.03, 0.14, 0.02]} />
          </mesh>
        </group>

        {/* ------------------------------------------------------------- */}
        {/* 3. ARMS & TACTICAL FIREARM */}
        {/* ------------------------------------------------------------- */}
        {/* Left Arm (Guiding Handguard) */}
        <group position={[-0.24, 1.25, 0]}>
          {/* Shoulder Pad */}
          <mesh material={mats.armorPlate} position={[-0.02, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.12]} />
          </mesh>
          {/* Bicep */}
          <mesh material={mats.fatigues} position={[0.02, -0.15, 0.08]} rotation={[0.7, -0.3, 0.3]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 10]} />
          </mesh>
          {/* Forearm & Mechanix Glove */}
          <mesh material={mats.fatigues} position={[0.12, -0.22, 0.28]} rotation={[1.3, -0.2, 0.6]} castShadow>
            <cylinderGeometry args={[0.046, 0.042, 0.28, 10]} />
          </mesh>
          <mesh material={mats.armorPlate} position={[0.22, -0.21, 0.40]}>
            <sphereGeometry args={[0.045, 10, 10]} />
          </mesh>
        </group>

        {/* Right Arm (Trigger Hand) */}
        <group position={[0.24, 1.25, 0]}>
          {/* Shoulder Pad */}
          <mesh material={mats.armorPlate} position={[0.02, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.12, 0.12]} />
          </mesh>
          {/* Bicep */}
          <mesh material={mats.fatigues} position={[-0.02, -0.14, 0.08]} rotation={[0.8, 0.2, -0.3]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 10]} />
          </mesh>
          {/* Forearm & Mechanix Glove on Pistol Grip */}
          <mesh material={mats.fatigues} position={[-0.08, -0.20, 0.24]} rotation={[1.1, 0.2, -0.4]} castShadow>
            <cylinderGeometry args={[0.046, 0.042, 0.28, 10]} />
          </mesh>
          <mesh material={mats.armorPlate} position={[-0.12, -0.22, 0.34]}>
            <sphereGeometry args={[0.045, 10, 10]} />
          </mesh>
        </group>

        {/* Tactical Carbine Held at High-Ready */}
        <group ref={weaponRef} position={[0.06, 1.05, 0.42]} rotation={[0.1, -0.05, 0]}>
          {/* Receiver */}
          <mesh material={mats.weapon} castShadow>
            <boxGeometry args={[0.045, 0.08, 0.26]} />
          </mesh>
          {/* Barrel & M-LOK Handguard */}
          <mesh material={mats.weapon} position={[0, 0.01, 0.22]}>
            <boxGeometry args={[0.042, 0.055, 0.22]} />
          </mesh>
          <mesh material={mats.armorPlate} position={[0, 0.015, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.14, 12]} />
          </mesh>
          {/* Muzzle Compensator */}
          <mesh material={mats.accent} position={[0, 0.015, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.016, 0.04, 12]} />
          </mesh>
          {/* Magazine */}
          <mesh material={mats.pouches} position={[0, -0.09, 0.04]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.03, 0.14, 0.06]} />
          </mesh>
          {/* Holographic Optic */}
          <mesh material={mats.weapon} position={[0, 0.065, 0.02]}>
            <boxGeometry args={[0.038, 0.045, 0.07]} />
          </mesh>
          <mesh material={mats.visor} position={[0, 0.065, 0.05]}>
            <planeGeometry args={[0.028, 0.028]} />
          </mesh>

          {/* Muzzle Flash if Firing */}
          {isFiring && (
            <group position={[0, 0.015, 0.48]}>
              <pointLight color="#ffaa33" intensity={3.5} distance={6} decay={2} />
              <mesh material={mats.flash} rotation={[0, 0, Math.random() * Math.PI]}>
                <coneGeometry args={[0.04, 0.18, 8]} />
              </mesh>
            </group>
          )}
        </group>

        {/* ------------------------------------------------------------- */}
        {/* 4. HEAD, HELMET, HEADSET & HEADSHOT HITBOX */}
        {/* ------------------------------------------------------------- */}
        <group ref={headRef} position={[0, 1.50, 0]}>
          {/* Balaclava Head Base with Headshot Hitbox */}
          <mesh
            material={mats.skinFace}
            castShadow
            userData={{ isHitbox: true, type: 'head', targetId }}
          >
            <sphereGeometry args={[0.155, 16, 16]} />
          </mesh>

          {/* FAST High-Cut Ballistic Helmet */}
          <mesh material={mats.helmet} position={[0, 0.04, -0.015]} castShadow>
            <sphereGeometry args={[0.172, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          </mesh>
          {/* Front NVG Shroud Bracket */}
          <mesh material={mats.armorPlate} position={[0, 0.07, 0.16]}>
            <boxGeometry args={[0.06, 0.05, 0.02]} />
          </mesh>
          {/* Flip-up Dual Tube Night Vision Goggles (NVGs) */}
          <mesh material={mats.pouches} position={[0, 0.13, 0.17]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[0.12, 0.04, 0.06]} />
          </mesh>
          <mesh material={mats.visor} position={[-0.04, 0.13, 0.20]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 12]} />
          </mesh>
          <mesh material={mats.visor} position={[0.04, 0.13, 0.20]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 12]} />
          </mesh>

          {/* Tactical Communications Headset with Earcups */}
          <mesh material={mats.pouches} position={[-0.165, 0.01, 0]}>
            <boxGeometry args={[0.025, 0.08, 0.06]} />
          </mesh>
          <mesh material={mats.pouches} position={[0.165, 0.01, 0]}>
            <boxGeometry args={[0.025, 0.08, 0.06]} />
          </mesh>
          {/* Boom Mic */}
          <mesh material={mats.armorPlate} position={[-0.14, -0.05, 0.10]} rotation={[0.3, 0.3, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 0.10, 8]} />
          </mesh>

          {/* Tactical Tinted Visor / Protective Ballistic Goggles */}
          <mesh material={mats.visor} position={[0, 0.02, 0.145]}>
            <boxGeometry args={[0.21, 0.068, 0.04]} />
          </mesh>

          {/* Ghost Skull Mask Motif (if enabled) */}
          {skin.skullMask && (
            <mesh position={[0, -0.06, 0.145]}>
              <planeGeometry args={[0.11, 0.09]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.85} depthWrite={false} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

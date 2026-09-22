import React, { useRef } from 'react';
import { Environment, Sky } from '@react-three/drei';

export function Lighting({ shadows = true, shadowMapSize = 2048, isLowQuality = false }) {
  const dirLightRef = useRef();

  return (
    <>
      {/* Warm Nevada Desert Test Site Atmospheric Fog (Omitted on Low for zero shader math) */}
      {!isLowQuality && <fog attach="fog" args={['#dccbb0', 50, 150]} />}

      {/* Warm Golden Mojave Desert Sunlight with Dynamic Quality Scaled Shadows */}
      <directionalLight
        ref={dirLightRef}
        position={[40, 55, 30]}
        intensity={isLowQuality ? 1.9 : 1.75}
        color="#fff4e0"
        castShadow={shadows}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={160}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.00015}
      />

      {/* Sky Blue / Desert Ground Ambient Contrast Fill (Boosted on Low for clean competitive visibility) */}
      <hemisphereLight
        args={['#a8c7ed', '#cfb491', isLowQuality ? 0.75 : 0.55]}
      />

      {/* Subtle Fill Light for Soft Shadows (Disabled on Low to minimize draw calls) */}
      {!isLowQuality && (
        <directionalLight
          position={[-30, 20, -25]}
          intensity={0.4}
          color="#8aa8cf"
        />
      )}

      {/* Fast Flat Sky on Low (0ms cost) vs Atmospheric Scattering Sky on High */}
      {isLowQuality ? (
        <color attach="background" args={['#7faedc']} />
      ) : (
        <Sky
          distance={450000}
          sunPosition={[40, 55, 30]}
          inclination={0.58}
          azimuth={0.22}
          turbidity={5}
          rayleigh={0.55}
          mieCoefficient={0.005}
          mieDirectionalG={0.8}
        />
      )}

      {/* HDRI Environment for realistic specular highlights (Omitted on Low for zero-overhead max FPS) */}
      {!isLowQuality && <Environment preset="city" />}
    </>
  );
}

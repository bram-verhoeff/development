import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function ImpactParticles({ impacts: propImpacts }) {
  const [localImpacts, setLocalImpacts] = useState([]);

  useEffect(() => {
    const handleSpawn = (e) => {
      if (!e.detail) return;
      const { point, normal, isBlood } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setLocalImpacts((prev) => [
        ...prev.slice(-15),
        { id, point, normal, isBlood, createdAt: performance.now(), lifetime: 500 },
      ]);
    };
    window.addEventListener('fps-spawn-impact', handleSpawn);
    return () => window.removeEventListener('fps-spawn-impact', handleSpawn);
  }, []);

  useFrame(() => {
    const now = performance.now();
    setLocalImpacts((prev) => {
      if (prev.length === 0) return prev;
      const active = prev.filter((imp) => now - imp.createdAt <= imp.lifetime);
      if (active.length === prev.length) return prev;
      return active;
    });
  });

  const activeImpacts = propImpacts || localImpacts;

  return (
    <group>
      {activeImpacts.map((imp) => (
        <SingleImpactEffect key={imp.id} impact={imp} />
      ))}
    </group>
  );
}

function SingleImpactEffect({ impact }) {
  if (!impact || !impact.point) return null;
  const pt = Array.isArray(impact.point)
    ? impact.point
    : [impact.point.x || 0, impact.point.y || 0, impact.point.z || 0];
  const n = impact.normal
    ? (Array.isArray(impact.normal) ? impact.normal : [impact.normal.x || 0, impact.normal.y || 1, impact.normal.z || 0])
    : [0, 1, 0];

  const particleCount = impact.isBlood ? 12 : 18;

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = [];
    const col = new Float32Array(particleCount * 3);

    const normal = new THREE.Vector3(...n);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = pt[0];
      pos[i * 3 + 1] = pt[1];
      pos[i * 3 + 2] = pt[2];

      const spread = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize().multiplyScalar(0.7);

      const v = normal.clone().add(spread).normalize().multiplyScalar(
        impact.isBlood ? (1.5 + Math.random() * 2.5) : (3.0 + Math.random() * 5.0)
      );
      vel.push(v);

      if (impact.isBlood) {
        col[i * 3] = 0.85 + Math.random() * 0.15;
        col[i * 3 + 1] = 0.05;
        col[i * 3 + 2] = 0.05;
      } else {
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        col[i * 3 + 2] = 0.1;
      }
    }

    return { positions: pos, velocities: vel, colors: col };
  }, [impact, particleCount]);

  const geometryRef = useRef();

  // Dispose buffer geometry when unmounted to prevent WebGL memory leak
  useEffect(() => {
    return () => {
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
    };
  }, []);

  useFrame((_, delta) => {
    if (!geometryRef.current) return;
    const posAttr = geometryRef.current.attributes.position;
    if (!posAttr) return;

    const gravity = impact.isBlood ? 9.8 : 14.0;

    for (let i = 0; i < particleCount; i++) {
      const v = velocities[i];
      v.y -= gravity * delta;

      posAttr.array[i * 3] += v.x * delta;
      posAttr.array[i * 3 + 1] += v.y * delta;
      posAttr.array[i * 3 + 2] += v.z * delta;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={impact.isBlood ? 0.045 : 0.035}
        vertexColors
        transparent
        opacity={0.9}
        toneMapped={false}
      />
    </points>
  );
}

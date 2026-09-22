import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function TracerManager({ tracers: propTracers }) {
  const groupRef = useRef();
  const [localTracers, setLocalTracers] = useState([]);

  // Shared single reusable unit cylinder geometry (never leaks VRAM buffers)
  const sharedGeometry = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 1, 6), []);

  const tracerMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#ffbb44',
      toneMapped: false,
      transparent: true,
      opacity: 0.95,
    });
  }, []);

  useEffect(() => {
    const handleSpawn = (e) => {
      if (!e.detail) return;
      const { start, end } = e.detail;
      const id = Math.random().toString(36).substring(2, 9);
      setLocalTracers((prev) => [
        ...prev.slice(-20),
        { id, start, end, createdAt: performance.now(), lifetime: 140 },
      ]);
    };
    window.addEventListener('fps-spawn-tracer', handleSpawn);
    return () => window.removeEventListener('fps-spawn-tracer', handleSpawn);
  }, []);

  useFrame(() => {
    const now = performance.now();
    setLocalTracers((prev) => {
      if (prev.length === 0) return prev;
      const active = prev.filter((t) => now - t.createdAt <= t.lifetime);
      if (active.length === prev.length) return prev;
      return active;
    });
  });

  const activeTracers = propTracers || localTracers;

  return (
    <group ref={groupRef}>
      {activeTracers.map((t) => {
        if (!t || !t.start || !t.end) return null;
        const start = Array.isArray(t.start)
          ? new THREE.Vector3(...t.start)
          : (t.start.isVector3 ? t.start : new THREE.Vector3(t.start.x || 0, t.start.y || 0, t.start.z || 0));
        const end = Array.isArray(t.end)
          ? new THREE.Vector3(...t.end)
          : (t.end.isVector3 ? t.end : new THREE.Vector3(t.end.x || 0, t.end.y || 0, t.end.z || 0));
        const distance = start.distanceTo(end);
        if (distance < 0.05) return null;
        const mid = start.clone().add(end).multiplyScalar(0.5);

        const direction = end.clone().sub(start).normalize();
        const orientation = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction
        );

        return (
          <mesh
            key={t.id}
            position={mid}
            quaternion={orientation}
            scale={[1, distance, 1]}
            geometry={sharedGeometry}
            material={tracerMaterial}
          />
        );
      })}
    </group>
  );
}

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticOperative, OPERATIVE_SKINS } from '../Character/RealisticOperative';

export function RemotePlayer({ id, data }) {
  const rootRef = useRef();
  const targetPos = useRef(new THREE.Vector3(...(data.pos || [0, 0, 0])));
  const targetYaw = useRef(data.rot ? data.rot[0] : 0);
  const targetPitch = useRef(data.rot ? data.rot[1] : 0);

  // Pick deterministic skin based on peer ID
  const skinIndex = Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % OPERATIVE_SKINS.length;
  const skinId = OPERATIVE_SKINS[skinIndex].id;

  // Update target when data changes
  useEffect(() => {
    if (data.pos) {
      targetPos.current.set(data.pos[0], data.pos[1], data.pos[2]);
    }
    if (data.rot) {
      targetYaw.current = data.rot[0];
      targetPitch.current = data.rot[1];
    }
  }, [data.pos, data.rot]);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    // Smooth dead reckoning interpolation
    const lerpSpeed = 14.0 * delta;
    rootRef.current.position.lerp(targetPos.current, Math.min(1, lerpSpeed));

    // Yaw rotation of the whole body
    const curYaw = rootRef.current.rotation.y;
    let diffYaw = (targetYaw.current - curYaw) % (Math.PI * 2);
    if (diffYaw < -Math.PI) diffYaw += Math.PI * 2;
    if (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
    rootRef.current.rotation.y += diffYaw * Math.min(1, lerpSpeed);
  });

  const health = data.health !== undefined ? data.health : 100;
  const isDead = health <= 0;

  if (isDead) {
    return (
      <group position={targetPos.current.toArray()}>
        <Html position={[0, 1.2, 0]} center>
          <div style={{
            fontSize: '11px',
            color: '#ff3344',
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 800,
            textShadow: '0 0 8px rgba(255,50,50,0.8)',
            letterSpacing: '1px',
          }}>
            RESPAWNING...
          </div>
        </Html>
      </group>
    );
  }

  const isMoving = !!(data.state?.isMoving || data.state?.isSprinting);
  const isSprinting = !!data.state?.isSprinting;
  const isSliding = !!data.state?.isSliding;
  const isAiming = !!data.state?.isAiming;

  return (
    <group ref={rootRef} position={targetPos.current.toArray()}>
      {/* Tactical Floating Nameplate and Health Bar */}
      <Html position={[0, 2.15, 0]} center distanceFactor={15}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <div style={{
            fontSize: '11px',
            color: '#00ffcc',
            textShadow: '0 0 5px rgba(0,255,204,0.8)',
            letterSpacing: '1px',
            fontWeight: 700,
            marginBottom: '3px'
          }}>
            OPERATIVE-{id.substring(0, 4).toUpperCase()}
          </div>
          <div style={{
            width: '60px',
            height: '5px',
            background: 'rgba(10, 15, 20, 0.85)',
            border: '1px solid rgba(0, 255, 204, 0.4)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${health}%`,
              height: '100%',
              background: health > 35 ? '#00ffcc' : '#ff3344',
              transition: 'width 0.2s ease',
              boxShadow: health > 35 ? '0 0 5px #00ffcc' : '0 0 5px #ff3344',
            }} />
          </div>
        </div>
      </Html>

      {/* Realistic Operative Character Model */}
      <RealisticOperative
        skinId={skinId}
        targetId={id}
        isMoving={isMoving}
        isSprinting={isSprinting}
        isSliding={isSliding}
        isAiming={isAiming}
        pitch={targetPitch.current}
      />
    </group>
  );
}

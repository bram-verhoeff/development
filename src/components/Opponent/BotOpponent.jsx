import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RealisticOperative } from '../Character/RealisticOperative';
import { BOT_DIFFICULTIES } from '../../config/botConfig';
import { sounds } from '../../audio/SoundEngine';

// ---------------------------------------------------------------------------
// Sector-7 Physical Obstacle Bounds (Exact 2D Colliders for Bot Navigation & LOS)
// ---------------------------------------------------------------------------
const OBSTACLE_BOXES = [
  // 1. North Hangar Walls & Door Frame (Door opening is X: -7.8 to 7.8 at Z: -22)
  { minX: -16.2, maxX: 16.2, minZ: -42.8, maxZ: -41.2 }, // Back wall
  { minX: -16.8, maxX: -15.2, minZ: -42.2, maxZ: -21.8 }, // West wall
  { minX: 15.2, maxX: 16.8, minZ: -42.2, maxZ: -21.8 },  // East wall
  { minX: -16.5, maxX: -7.8, minZ: -22.6, maxZ: -21.4 }, // Front west wall
  { minX: 7.8, maxX: 16.5, minZ: -22.6, maxZ: -21.4 },   // Front east wall

  // 2. West Lane Shipping Containers (X: -18, length 12)
  { minX: -19.9, maxX: -16.1, minZ: -18.2, maxZ: -5.8 },
  { minX: -19.9, maxX: -16.1, minZ: -4.2, maxZ: 8.2 },

  // 3. Center Chokepoint Angled Containers
  { minX: -8.8, maxX: 0.6, minZ: -11.8, maxZ: -0.2 }, // Green container [-4, 0, -6]
  { minX: 0.4, maxX: 11.6, minZ: -1.8, maxZ: 9.8 },   // Blue container [6, 0, 4]

  // 4. East Lane Shipping Containers & Catwalk Ramp (X: 18, length 12)
  { minX: 16.1, maxX: 19.9, minZ: -18.2, maxZ: -5.8 },
  { minX: 16.1, maxX: 19.9, minZ: -4.2, maxZ: 8.2 },
  { minX: 16.1, maxX: 19.9, minZ: 7.9, maxZ: 16.1 },  // Ramp

  // 5. Concrete Jersey Barriers
  { minX: -10.3, maxX: -5.7, minZ: -16.7, maxZ: -15.3 }, // North West Barrier
  { minX: 5.7, maxX: 10.3, minZ: -16.7, maxZ: -15.3 },   // North East Barrier
  { minX: -10.3, maxX: -5.7, minZ: 11.3, maxZ: 12.7 },   // Mid West Barrier
  { minX: 5.7, maxX: 10.3, minZ: 11.3, maxZ: 12.7 },    // Mid East Barrier
  { minX: 2.3, maxX: 3.7, minZ: 21.2, maxZ: 26.8 },     // Checkpoint West Barrier
  { minX: 12.3, maxX: 13.7, minZ: 21.2, maxZ: 26.8 },   // Checkpoint East Barrier

  // 6. South Sector Tactical APC
  { minX: 5.0, maxX: 11.0, minZ: 24.0, maxZ: 32.0 },
];

const OBSTACLE_CIRCLES = [
  // Hangar interior
  { x: 0, z: -32, r: 2.6 },   // Briefing Table
  { x: -8, z: -40, r: 1.3 },  // Server Rack 1
  { x: -5, z: -40, r: 1.3 },  // Server Rack 2
  { x: 5, z: -40, r: 1.3 },   // Server Rack 3
  { x: 8, z: -40, r: 1.3 },   // Server Rack 4

  // Central sector props
  { x: 2, z: -8, r: 2.4 },    // Industrial Forklift
  { x: -12, z: -8, r: 1.6 },  // Pallet West 1
  { x: -12, z: 4, r: 1.6 },   // Pallet West 2
  { x: 12, z: -2, r: 1.6 },   // Pallet East
  { x: -2, z: 6, r: 1.6 },    // Pallet Center

  // South sector fuel storage silos & generator
  { x: -24, z: 28, r: 4.0 },  // Silo 1
  { x: -15, z: 32, r: 3.8 },  // Silo 2
  { x: -4, z: 30, r: 2.4 },   // Generator
  { x: 4, z: 32, r: 1.6 },    // Pallet South

  // Perimeter watchtowers
  { x: -38, z: -38, r: 3.0 },
  { x: 38, z: -38, r: 3.0 },
  { x: -38, z: 38, r: 3.0 },
  { x: 38, z: 38, r: 3.0 },
];

// Check if a point hits any obstacle (used by whisker sensors)
function isObstacleHit(x, z, margin = 0.5) {
  if (x < -46.0 || x > 46.0 || z < -46.0 || z > 46.0) return true;

  for (let i = 0; i < OBSTACLE_BOXES.length; i++) {
    const b = OBSTACLE_BOXES[i];
    if (
      x >= b.minX - margin &&
      x <= b.maxX + margin &&
      z >= b.minZ - margin &&
      z <= b.maxZ + margin
    ) {
      return true;
    }
  }

  for (let i = 0; i < OBSTACLE_CIRCLES.length; i++) {
    const c = OBSTACLE_CIRCLES[i];
    const dx = x - c.x;
    const dz = z - c.z;
    const minDist = c.r + margin;
    if (dx * dx + dz * dz < minDist * minDist) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 2D Line-Of-Sight (LOS) Raycast (Slab Intersection)
// ---------------------------------------------------------------------------
function lineIntersectsBox(x1, z1, x2, z2, box) {
  let tmin = 0;
  let tmax = 1;
  const dx = x2 - x1;
  const dz = z2 - z1;

  if (Math.abs(dx) > 1e-6) {
    let t1 = (box.minX - x1) / dx;
    let t2 = (box.maxX - x1) / dx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  } else {
    if (x1 < box.minX || x1 > box.maxX) return false;
  }

  if (Math.abs(dz) > 1e-6) {
    let t1 = (box.minZ - z1) / dz;
    let t2 = (box.maxZ - z1) / dz;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  } else {
    if (z1 < box.minZ || z1 > box.maxZ) return false;
  }

  return true;
}

function lineIntersectsCircle(x1, z1, x2, z2, circle) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return false;

  const t = Math.max(0, Math.min(1, ((circle.x - x1) * dx + (circle.z - z1) * dz) / lenSq));
  const projX = x1 + t * dx;
  const projZ = z1 + t * dz;

  const distX = circle.x - projX;
  const distZ = circle.z - projZ;
  return (distX * distX + distZ * distZ) <= (circle.r * circle.r);
}

function hasLineOfSight(bx, bz, px, pz) {
  for (let i = 0; i < OBSTACLE_BOXES.length; i++) {
    if (lineIntersectsBox(bx, bz, px, pz, OBSTACLE_BOXES[i])) {
      return false;
    }
  }
  for (let i = 0; i < OBSTACLE_CIRCLES.length; i++) {
    if (lineIntersectsCircle(bx, bz, px, pz, OBSTACLE_CIRCLES[i])) {
      return false;
    }
  }
  return true;
}

// Push out of any intersecting obstacle (continuous collision solver)
function resolveObstacleCollisions(px, pz, radius = 0.55) {
  let x = px;
  let z = pz;

  // 1. Solve circle collisions
  for (let i = 0; i < OBSTACLE_CIRCLES.length; i++) {
    const c = OBSTACLE_CIRCLES[i];
    const dx = x - c.x;
    const dz = z - c.z;
    const minDist = c.r + radius;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.001;
      const penetration = minDist - dist;
      x += (dx / dist) * penetration;
      z += (dz / dist) * penetration;
    }
  }

  // 2. Solve box collisions (clamp to closest box point and push out)
  for (let i = 0; i < OBSTACLE_BOXES.length; i++) {
    const b = OBSTACLE_BOXES[i];
    const cx = Math.max(b.minX, Math.min(x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(z, b.maxZ));

    const dx = x - cx;
    const dz = z - cz;
    const distSq = dx * dx + dz * dz;

    if (distSq < radius * radius) {
      if (distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const penetration = radius - dist;
        x += (dx / dist) * penetration;
        z += (dz / dist) * penetration;
      } else {
        const dLeft = Math.abs(x - b.minX);
        const dRight = Math.abs(b.maxX - x);
        const dTop = Math.abs(z - b.minZ);
        const dBottom = Math.abs(b.maxZ - z);
        const minEdge = Math.min(dLeft, dRight, dTop, dBottom);

        if (minEdge === dLeft) x = b.minX - radius;
        else if (minEdge === dRight) x = b.maxX + radius;
        else if (minEdge === dTop) z = b.minZ - radius;
        else z = b.maxZ + radius;
      }
    }
  }

  x = Math.max(-46.0 + radius, Math.min(46.0 - radius, x));
  z = Math.max(-46.0 + radius, Math.min(46.0 - radius, z));

  return { x, z };
}

// ---------------------------------------------------------------------------
// Bot Component with State Machine, Multi-Instance Support & Combat AI
// ---------------------------------------------------------------------------
export function BotOpponent({
  id = 'bot-alpha',
  name = 'CYBER-MERC // ALPHA',
  skinId = 'cyber-ronin',
  wpOffset = 0,
  difficultyId = 'regular',
  playerPos,
  isPlayerDead = false,
  botRegistryRef,
  onBotHit,
  onBotKilled,
  onBotShoot,
}) {
  const modelRef = useRef();

  const [health, setHealth] = useState(100);
  const [isDead, setIsDead] = useState(false);
  const [isShooting, setIsShooting] = useState(false);
  const [isEngaging, setIsEngaging] = useState(false);

  // Active Difficulty Profile
  const difficulty = useMemo(() => {
    return BOT_DIFFICULTIES.find((d) => d.id === difficultyId) || BOT_DIFFICULTIES[1];
  }, [difficultyId]);

  // Sector 7 Tactical Patrol Route (100% barrier-free corridors)
  const patrolWaypoints = useMemo(
    () => [
      new THREE.Vector3(0, 0.03, -21),     // 1. Center North Apron
      new THREE.Vector3(14.2, 0.03, -21),  // 2. North-East Apron Turn
      new THREE.Vector3(14.2, 0.03, -8),   // 3. East Lane North
      new THREE.Vector3(14.2, 0.03, 4),    // 4. East Lane Mid
      new THREE.Vector3(14.2, 0.03, 17),   // 5. South-East Turn
      new THREE.Vector3(0, 0.03, 17),      // 6. Center South Plaza
      new THREE.Vector3(-14.2, 0.03, 17),  // 7. South-West Turn
      new THREE.Vector3(-14.2, 0.03, 4),   // 8. West Lane Mid
      new THREE.Vector3(-14.2, 0.03, -8),  // 9. West Lane North
      new THREE.Vector3(-14.2, 0.03, -21), // 10. North-West Apron Turn
    ],
    []
  );

  // Initial Staggered Spawn Point based on wpOffset
  const initialIndex = wpOffset % patrolWaypoints.length;
  const initialPos = patrolWaypoints[initialIndex];

  const currentWpIndex = useRef(initialIndex);
  const pos = useRef(new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z));
  const currentYaw = useRef(0);
  const stuckTimer = useRef(0);
  const lastSamplePos = useRef(new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z));

  // Combat AI Timers & State
  const reactionTimer = useRef(0);
  const burstTimer = useRef(0);
  const burstCountRemaining = useRef(0);
  const shotIntervalTimer = useRef(0);
  const targetScanTimer = useRef(Math.random() * 0.08);
  const cachedTarget = useRef(null);
  const cachedToTarget = useRef({ x: 0, z: 0 });

  // Register in shared bot registry for bot-vs-bot combat
  useEffect(() => {
    if (botRegistryRef?.current) {
      botRegistryRef.current[id] = {
        id,
        name,
        pos: pos.current,
        isDead: false,
        health: 100,
      };
    }
    return () => {
      if (botRegistryRef?.current) {
        delete botRegistryRef.current[id];
      }
    };
  }, [id, name, botRegistryRef]);

  // Sync health and isDead state to registry
  useEffect(() => {
    if (botRegistryRef?.current && botRegistryRef.current[id]) {
      botRegistryRef.current[id].isDead = isDead;
      botRegistryRef.current[id].health = health;
    }
  }, [id, isDead, health, botRegistryRef]);

  // Damage event listener
  useEffect(() => {
    const handleDamage = (e) => {
      if (e.detail?.targetId === id) {
        const dmg = e.detail.amount;
        const attackerId = e.detail?.attackerId;
        const attackerName = e.detail?.attackerName;
        const isHeadshot = !!e.detail?.isHeadshot;

        setHealth((prev) => {
          const next = Math.max(0, prev - dmg);
          if (next <= 0 && !isDead) {
            setIsDead(true);
            setIsEngaging(false);
            setIsShooting(false);
            if (botRegistryRef?.current && botRegistryRef.current[id]) {
              botRegistryRef.current[id].isDead = true;
              botRegistryRef.current[id].health = 0;
            }
            if (onBotKilled) onBotKilled(id, name, attackerId, attackerName, isHeadshot);
            setTimeout(() => {
              pos.current.set(initialPos.x, initialPos.y, initialPos.z);
              currentWpIndex.current = initialIndex;
              setHealth(100);
              setIsDead(false);
              if (botRegistryRef?.current && botRegistryRef.current[id]) {
                botRegistryRef.current[id].isDead = false;
                botRegistryRef.current[id].health = 100;
              }
            }, 3500);
          }
          return next;
        });

        // Instant Combat Alert: If bot is damaged, immediately turn towards attacker!
        reactionTimer.current = difficulty.reactionTime;
        if (onBotHit) onBotHit(e.detail);
      }
    };

    window.addEventListener('fps-damage-event', handleDamage);
    return () => window.removeEventListener('fps-damage-event', handleDamage);
  }, [id, name, isDead, initialIndex, initialPos, difficulty, onBotHit, onBotKilled, botRegistryRef]);

  // AI Navigation, Combat Decision & Firing Loop
  useFrame((_, delta) => {
    if (isDead || !modelRef.current) return;

    const dt = Math.min(delta, 0.1);
    const curX = pos.current.x;
    const curZ = pos.current.z;

    // Keep registry position up to date
    if (botRegistryRef?.current && botRegistryRef.current[id]) {
      botRegistryRef.current[id].pos = pos.current;
    }

    // -------------------------------------------------------------
    // 1. COMBAT DETECTION: Scan for Closest Visible Target (Staggered 12Hz Scan for 300+ FPS)
    // -------------------------------------------------------------
    targetScanTimer.current += dt;
    if (targetScanTimer.current >= 0.075) {
      targetScanTimer.current = 0;
      let bestTarget = null;
      let closestDistSq = difficulty.detectRange * difficulty.detectRange;
      let toX = 0;
      let toZ = 0;

      // A. Check Local Player Candidate
      if (playerPos && !isPlayerDead) {
        const px = playerPos.x - curX;
        const pz = playerPos.z - curZ;
        const dSq = px * px + pz * pz;
        if (dSq <= closestDistSq && hasLineOfSight(curX, curZ, playerPos.x, playerPos.z)) {
          closestDistSq = dSq;
          bestTarget = {
            id: 'local-player',
            name: 'YOU',
            pos: playerPos,
          };
          toX = px;
          toZ = pz;
        }
      }

      // B. Check Other Active Bots Candidates (Free-For-All Combat!)
      if (botRegistryRef?.current) {
        for (const otherId in botRegistryRef.current) {
          if (otherId === id) continue; // Don't target self
          const other = botRegistryRef.current[otherId];
          if (!other || other.isDead || other.health <= 0 || !other.pos) continue;

          const bx = other.pos.x - curX;
          const bz = other.pos.z - curZ;
          const dSq = bx * bx + bz * bz;

          if (dSq <= closestDistSq && hasLineOfSight(curX, curZ, other.pos.x, other.pos.z)) {
            closestDistSq = dSq;
            bestTarget = {
              id: other.id,
              name: other.name,
              pos: other.pos,
            };
            toX = bx;
            toZ = bz;
          }
        }
      }

      cachedTarget.current = bestTarget;
      cachedToTarget.current = { x: toX, z: toZ };
    }

    const activeTarget = cachedTarget.current;
    let toTargetX = cachedToTarget.current.x;
    let toTargetZ = cachedToTarget.current.z;
    if (activeTarget && activeTarget.pos) {
      toTargetX = activeTarget.pos.x - curX;
      toTargetZ = activeTarget.pos.z - curZ;
    }

    // -------------------------------------------------------------
    // 2. COMBAT STATE MACHINE & ATTACK BEHAVIOR
    // -------------------------------------------------------------
    if (activeTarget) {
      setIsEngaging(true);

      // Smoothly rotate yaw towards the target
      const aimAngle = Math.atan2(toTargetX, toTargetZ);
      let diff = (aimAngle - currentYaw.current) % (Math.PI * 2);
      if (diff < -Math.PI) diff += Math.PI * 2;
      if (diff > Math.PI) diff -= Math.PI * 2;
      currentYaw.current += diff * dt * 9.0;
      modelRef.current.rotation.y = currentYaw.current;

      // Reaction Delay Timer (Simulate human perception)
      if (reactionTimer.current < difficulty.reactionTime) {
        reactionTimer.current += dt;
      } else {
        // Ready to engage! Manage Burst Fire
        burstTimer.current += dt;

        if (burstCountRemaining.current > 0) {
          shotIntervalTimer.current += dt;
          if (shotIntervalTimer.current >= 0.12) {
            shotIntervalTimer.current = 0;
            burstCountRemaining.current -= 1;

            // FIRE SHOT!
            setIsShooting(true);
            setTimeout(() => setIsShooting(false), 55);

            // Audio & Muzzle Flash
            sounds.playSMGFire();

            // Calculate trajectory
            const botMuzzle = [curX, 1.25, curZ];
            const isHit = Math.random() < difficulty.accuracy;
            const targetY = activeTarget.pos.y ? activeTarget.pos.y - 0.4 : 1.2;
            const targetPos = isHit
              ? [activeTarget.pos.x, targetY, activeTarget.pos.z]
              : [
                  activeTarget.pos.x + (Math.random() - 0.5) * 3.5,
                  targetY + (Math.random() - 0.5) * 1.5,
                  activeTarget.pos.z + (Math.random() - 0.5) * 3.5,
                ];

            // Notify App to render red enemy bullet tracer
            if (onBotShoot) {
              onBotShoot({
                start: botMuzzle,
                end: targetPos,
                isBlood: isHit,
              });
            }

            // If bullet hits the target (player or another bot), dispatch damage!
            if (isHit) {
              window.dispatchEvent(
                new CustomEvent('fps-damage-event', {
                  detail: {
                    targetId: activeTarget.id,
                    attackerId: id,
                    attackerName: name,
                    amount: difficulty.damage,
                    isHeadshot: Math.random() < 0.20,
                  },
                })
              );
            }
          }
        } else if (burstTimer.current >= difficulty.burstInterval) {
          // Trigger a new burst
          burstTimer.current = 0;
          burstCountRemaining.current = difficulty.burstCount;
          shotIntervalTimer.current = 0.12; // Fire immediately on burst start
        }
      }

      // If far from target (e.g. > 14m), advance slightly while firing
      const distToTarget = Math.hypot(toTargetX, toTargetZ) || 1;
      if (distToTarget > 14.0) {
        const advSpeed = 1.4;
        let nextX = curX + (toTargetX / distToTarget) * advSpeed * dt;
        let nextZ = curZ + (toTargetZ / distToTarget) * advSpeed * dt;
        const resolved = resolveObstacleCollisions(nextX, nextZ, 0.55);
        pos.current.x = resolved.x;
        pos.current.z = resolved.z;
        modelRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);
      }

      return; // Stop patrol locomotion while engaging!
    } else {
      setIsEngaging(false);
      reactionTimer.current = 0;
      burstCountRemaining.current = 0;
    }

    // -------------------------------------------------------------
    // 3. PATROL LOCOMOTION & NAVIGATION LOOP
    // -------------------------------------------------------------
    const targetWp = patrolWaypoints[currentWpIndex.current];
    const dx = targetWp.x - curX;
    const dz = targetWp.z - curZ;
    const distToWp = Math.sqrt(dx * dx + dz * dz);

    // Waypoint reached? Advance to next
    if (distToWp < 1.8) {
      currentWpIndex.current = (currentWpIndex.current + 1) % patrolWaypoints.length;
      stuckTimer.current = 0;
      return;
    }

    // Stuck Watchdog: If bot doesn't make progress in 0.9s, auto-advance and nudge
    const distFromLast = pos.current.distanceTo(lastSamplePos.current);
    if (distFromLast < 0.22) {
      stuckTimer.current += dt;
      if (stuckTimer.current > 0.9) {
        currentWpIndex.current = (currentWpIndex.current + 1) % patrolWaypoints.length;
        stuckTimer.current = 0;
        const nextTarget = patrolWaypoints[currentWpIndex.current];
        const nx = nextTarget.x - pos.current.x;
        const nz = nextTarget.z - pos.current.z;
        const nlen = Math.sqrt(nx * nx + nz * nz) || 1;
        pos.current.x += (nx / nlen) * 0.45;
        pos.current.z += (nz / nlen) * 0.45;
        return;
      }
    } else {
      stuckTimer.current = 0;
      lastSamplePos.current.copy(pos.current);
    }

    // Desired movement direction
    let dirX = dx / (distToWp || 1);
    let dirZ = dz / (distToWp || 1);

    // Whisker Obstacle Avoidance Sensors
    const lookAheadDist = 2.2;
    const whiskerAngle = 0.55;

    const fwdProbeX = curX + dirX * lookAheadDist;
    const fwdProbeZ = curZ + dirZ * lookAheadDist;
    const hitFwd = isObstacleHit(fwdProbeX, fwdProbeZ, 0.4);

    if (hitFwd) {
      const cosA = Math.cos(whiskerAngle);
      const sinA = Math.sin(whiskerAngle);
      const leftDirX = dirX * cosA - dirZ * sinA;
      const leftDirZ = dirX * sinA + dirZ * cosA;
      const hitLeft = isObstacleHit(curX + leftDirX * 1.8, curZ + leftDirZ * 1.8, 0.4);

      const cosB = Math.cos(-whiskerAngle);
      const sinB = Math.sin(-whiskerAngle);
      const rightDirX = dirX * cosB - dirZ * sinB;
      const rightDirZ = dirX * sinB + dirZ * cosB;
      const hitRight = isObstacleHit(curX + rightDirX * 1.8, curZ + rightDirZ * 1.8, 0.4);

      if (!hitLeft && hitRight) {
        dirX = leftDirX;
        dirZ = leftDirZ;
      } else if (!hitRight && hitLeft) {
        dirX = rightDirX;
        dirZ = rightDirZ;
      } else {
        const tempX = dirX;
        dirX = -dirZ;
        dirZ = tempX;
      }
    }

    // Normalize final move vector
    const moveLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
    dirX /= moveLen;
    dirZ /= moveLen;

    const speed = difficulty.patrolSpeed || 4.2;
    let nextX = curX + dirX * speed * dt;
    let nextZ = curZ + dirZ * speed * dt;

    // Hard obstacle collision solver
    const resolved = resolveObstacleCollisions(nextX, nextZ, 0.55);
    pos.current.x = resolved.x;
    pos.current.z = resolved.z;
    pos.current.y = 0.03;

    // Apply position to Three.js model
    modelRef.current.position.set(pos.current.x, pos.current.y, pos.current.z);

    // Smooth model yaw rotation towards movement direction
    const targetAngle = Math.atan2(dirX, dirZ);
    let diff = (targetAngle - currentYaw.current) % (Math.PI * 2);
    if (diff < -Math.PI) diff += Math.PI * 2;
    if (diff > Math.PI) diff -= Math.PI * 2;
    currentYaw.current += diff * dt * 8.0;
    modelRef.current.rotation.y = currentYaw.current;
  });

  return (
    <group ref={modelRef} position={[pos.current.x, pos.current.y, pos.current.z]}>
      {/* State: Respawning Indicator */}
      {isDead && (
        <Html position={[0, 1.4, 0]} center>
          <div
            style={{
              fontSize: '12px',
              color: '#ff3344',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              textShadow: '0 0 10px rgba(255,50,50,0.9)',
              letterSpacing: '1px',
              background: 'rgba(10,12,16,0.88)',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #ff3344',
              whiteSpace: 'nowrap',
              boxShadow: '0 0 15px rgba(255,51,68,0.3)',
            }}
          >
            {name} // RESPAWNING...
          </div>
        </Html>
      )}

      {/* State: Active Operative */}
      {!isDead && (
        <>
          {/* Floating Tactical Health & Status Plate */}
          <Html position={[0, 2.15, 0]} center distanceFactor={16}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
                userSelect: 'none',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: isEngaging ? '#ff3344' : difficulty.color,
                  textShadow: `0 0 6px ${isEngaging ? 'rgba(255,51,68,0.8)' : 'rgba(0,255,204,0.6)'}`,
                  letterSpacing: '1px',
                  fontWeight: 800,
                  marginBottom: '2px',
                }}
              >
                {name} {isEngaging && '⚠️ [ENGAGING]'}
              </div>
              <div
                style={{
                  width: '64px',
                  height: '5px',
                  background: 'rgba(10, 15, 20, 0.9)',
                  border: `1px solid ${isEngaging ? 'rgba(255,51,68,0.6)' : 'rgba(0, 255, 204, 0.4)'}`,
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${health}%`,
                    height: '100%',
                    background: health > 35 ? difficulty.color : '#ff3344',
                    transition: 'width 0.2s ease',
                    boxShadow: `0 0 6px ${health > 35 ? difficulty.color : '#ff3344'}`,
                  }}
                />
              </div>
            </div>
          </Html>

          {/* High-Fidelity Realistic Operative Model with Head & Torso Hitboxes */}
          <RealisticOperative
            skinId={skinId}
            targetId={id}
            isMoving={!isEngaging}
            isSprinting={false}
            isFiring={isShooting}
            isAiming={isEngaging}
          />
        </>
      )}
    </group>
  );
}

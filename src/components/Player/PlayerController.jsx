import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { RigidBody, CapsuleCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { ProceduralRifle, WEAPON_SKINS, WEAPON_CLASSES } from '../Weapon/ProceduralRifle';
import { sounds } from '../../audio/SoundEngine';

const TACTICAL_SPAWN_POINTS = [
  { x: 0, y: 1.8, z: 14 },
  { x: -20, y: 1.8, z: -24 },
  { x: 22, y: 1.8, z: 20 },
  { x: 18, y: 1.8, z: -20 },
  { x: -18, y: 1.8, z: 18 },
];

export function PlayerController({
  peerManager,
  onShoot,
  hudState,
  setHudState,
  isLocked,
  isDead = false,
  loadoutWeaponId = 'mk18',
  perkId = 'lightweight',
  onOpenLoadout,
  playerPosRef,
}) {
  const { camera, scene } = useThree();
  const rbRef = useRef();
  const weaponRigRef = useRef();
  const staminaRef = useRef(100);
  const lastStaminaSync = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());

  // Weapon Skin State
  const [skinIndex, setSkinIndex] = useState(0);

  // Weapon Slot State (1 = Primary, 2 = Secondary)
  const [activeSlot, setActiveSlot] = useState(1);

  // Active Weapon Object
  const activeWeaponId = activeSlot === 1 ? loadoutWeaponId : 'glock19';
  const activeWeapon = useMemo(() => {
    return WEAPON_CLASSES.find((w) => w.id === activeWeaponId) || WEAPON_CLASSES[0];
  }, [activeWeaponId]);

  // Sync active weapon and perks to HUD state
  useEffect(() => {
    setHudState((s) => ({
      ...s,
      weaponId: activeWeapon.id,
      weaponName: activeWeapon.name,
      weaponCaliber: activeWeapon.caliber,
      weaponCategory: activeWeapon.category,
      ammo: activeWeapon.magSize,
      magCapacity: activeWeapon.magSize,
      reserveAmmo: activeWeapon.reserveAmmo,
      perkId: perkId,
      maxHealth: perkId === 'flak-jacket' ? 150 : 100,
      health: Math.min(s.health || 100, perkId === 'flak-jacket' ? 150 : 100),
    }));
  }, [activeWeapon, perkId, setHudState]);

  const cycleWeaponSkin = useCallback(() => {
    setSkinIndex((prev) => {
      const next = (prev + 1) % WEAPON_SKINS.length;
      sounds.playMechanicalClick(2200, 0.04, 0.4);
      setHudState((s) => ({
        ...s,
        skinIndex: next,
        skinName: WEAPON_SKINS[next].name,
        skinTag: WEAPON_SKINS[next].tag,
        skinColor: WEAPON_SKINS[next].accentColor,
      }));
      return next;
    });
  }, [setHudState]);

  // Expose initial skin state and window event listener
  useEffect(() => {
    setHudState((s) => ({
      ...s,
      skinIndex: 0,
      skinName: WEAPON_SKINS[0].name,
      skinTag: WEAPON_SKINS[0].tag,
      skinColor: WEAPON_SKINS[0].accentColor,
    }));

    const handleCycleEvent = () => cycleWeaponSkin();
    window.addEventListener('fps-cycle-skin', handleCycleEvent);

    // Initial safe spawn positioning
    const spawnTimer = setTimeout(() => {
      if (rbRef.current) {
        rbRef.current.setTranslation({ x: 0, y: 1.8, z: 14 }, true);
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }, 60);

    return () => {
      window.removeEventListener('fps-cycle-skin', handleCycleEvent);
      clearTimeout(spawnTimer);
    };
  }, [cycleWeaponSkin, setHudState]);

  // Safe Respawn / Unstuck function targeting tactical spawn points
  const respawnPlayer = useCallback((forcedPoint = null) => {
    if (!rbRef.current) return;
    const pt = forcedPoint || TACTICAL_SPAWN_POINTS[Math.floor(Math.random() * TACTICAL_SPAWN_POINTS.length)];
    rbRef.current.setTranslation({ x: pt.x, y: pt.y, z: pt.z }, true);
    rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    cameraRoll.current = 0;
    currentEyeHeight.current = 1.6;
    euler.current.x = -0.06;
    isSliding.current = false;
    isAimingDownSights.current = false;
    isMouseDown.current = false;
    sounds.playRespawn();
  }, []);

  // Listen for external respawn events
  useEffect(() => {
    const handleRespawnEvent = (e) => {
      respawnPlayer(e.detail?.spawnPoint);
    };
    window.addEventListener('fps-respawn-player', handleRespawnEvent);
    return () => window.removeEventListener('fps-respawn-player', handleRespawnEvent);
  }, [respawnPlayer]);

  // Trigger respawn whenever isDead transitions from true to false
  const prevDeadRef = useRef(false);
  useEffect(() => {
    if (prevDeadRef.current && !isDead) {
      respawnPlayer();
    }
    prevDeadRef.current = isDead;
  }, [isDead, respawnPlayer]);

  // Make sure camera is added to scene so that children inside camera render properly
  useEffect(() => {
    scene.add(camera);
    return () => {
      scene.remove(camera);
    };
  }, [scene, camera]);

  // Input states
  const keys = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false,
  });

  // Slide state
  const isSliding = useRef(false);
  const slideTimer = useRef(0);
  const slideSpeed = useRef(0);
  const slideDir = useRef(new THREE.Vector3());
  const slideCooldown = useRef(0);

  // Aiming, mouse deltas and rotation
  const mouseDelta = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(-0.06, 0, 0, 'YXZ'));
  const cameraRoll = useRef(0);
  const currentEyeHeight = useRef(1.6);
  const isMouseDown = useRef(false);
  const isAimingDownSights = useRef(false);
  const [muzzleFlash, setMuzzleFlash] = useState(false);

  // Weapon recoil & sway state
  const recoilOffset = useRef(new THREE.Vector3(0, 0, 0));
  const recoilRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const swayOffset = useRef(new THREE.Vector2(0, 0));

  // Head bobbing & footstep timer
  const bobTimer = useRef(0);
  const footstepAccumulator = useRef(0);
  const lastFireTime = useRef(0);
  const isReloading = useRef(false);

  // Input event listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLocked || isDead) return;
      sounds.ensureContext();

      switch (e.code) {
        case 'KeyW':
          keys.current.forward = true;
          break;
        case 'KeyS':
          keys.current.backward = true;
          break;
        case 'KeyA':
          keys.current.left = true;
          break;
        case 'KeyD':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = true;
          break;
        case 'KeyC':
        case 'ControlLeft':
        case 'ControlRight':
          keys.current.crouch = true;
          triggerSlideOrCrouch();
          break;
        case 'KeyR':
          handleReload();
          break;
        case 'KeyT':
          cycleWeaponSkin();
          break;
        case 'KeyB':
          if (onOpenLoadout) {
            document.exitPointerLock?.();
            onOpenLoadout();
          }
          break;
        case 'Digit1':
          setActiveSlot(1);
          sounds.playWeaponSwap();
          break;
        case 'Digit2':
          setActiveSlot(2);
          sounds.playWeaponSwap();
          break;
        case 'KeyK':
          respawnPlayer();
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = false;
          break;
        case 'KeyS':
          keys.current.backward = false;
          break;
        case 'KeyA':
          keys.current.left = false;
          break;
        case 'KeyD':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = false;
          break;
        case 'KeyC':
        case 'ControlLeft':
        case 'ControlRight':
          keys.current.crouch = false;
          break;
        default:
          break;
      }
    };

    const handleMouseMove = (e) => {
      if (!isLocked || isDead) return;
      const sensitivity = isAimingDownSights.current ? 0.0011 : 0.0022;
      const dx = e.movementX || 0;
      const dy = e.movementY || 0;

      euler.current.y -= dx * sensitivity;
      euler.current.x -= dy * sensitivity;

      // Pitch clamping [-85 deg, +85 deg]
      euler.current.x = Math.max(-Math.PI * 0.47, Math.min(Math.PI * 0.47, euler.current.x));

      // Sway accumulation
      mouseDelta.current.x += dx * 0.0006;
      mouseDelta.current.y += dy * 0.0006;
    };

    const handleMouseDown = (e) => {
      if (!isLocked || isDead) return;
      sounds.ensureContext();
      if (e.button === 0) {
        isMouseDown.current = true;
        executeShot();
      } else if (e.button === 2) {
        isAimingDownSights.current = true;
        setHudState((prev) => ({ ...prev, isAiming: true }));
      }
    };

    const handleMouseUp = (e) => {
      if (e.button === 0) {
        isMouseDown.current = false;
      } else if (e.button === 2) {
        isAimingDownSights.current = false;
        setHudState((prev) => ({ ...prev, isAiming: false }));
      }
    };

    const handleContextMenu = (e) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isLocked, isDead, cycleWeaponSkin, onOpenLoadout, respawnPlayer]);

  // Tactical Slide Trigger
  const triggerSlideOrCrouch = () => {
    if (!rbRef.current) return;
    const linvel = rbRef.current.linvel();
    const horizontalSpeed = Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z);

    // If moving fast or sprinting, execute tactical slide!
    if ((keys.current.sprint || horizontalSpeed > 5.0) && !isSliding.current && slideCooldown.current <= 0) {
      isSliding.current = true;
      slideTimer.current = perkId === 'lightweight' ? 1.05 : 0.85;
      slideSpeed.current = perkId === 'lightweight' ? 17.5 : 14.8;
      slideCooldown.current = 1.0;

      // Set slide direction along forward camera vector
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.current.y);
      slideDir.current.copy(forward).normalize();

      // Audio feedback
      sounds.playSlide();

      // Drain stamina
      setHudState((prev) => ({
        ...prev,
        isSliding: true,
        stamina: Math.max(0, prev.stamina - 15),
      }));
    }
  };

  // Handle Reload
  const handleReload = () => {
    if (isReloading.current) return;
    if (hudState.ammo >= activeWeapon.magSize || hudState.reserveAmmo <= 0) return;

    isReloading.current = true;
    sounds.playReload();
    setHudState((prev) => ({ ...prev, isReloading: true }));

    const reloadDuration = perkId === 'quickdraw' ? 750 : 1500;

    setTimeout(() => {
      setHudState((prev) => {
        const needed = activeWeapon.magSize - prev.ammo;
        const toAdd = Math.min(needed, prev.reserveAmmo);
        return {
          ...prev,
          ammo: prev.ammo + toAdd,
          reserveAmmo: prev.reserveAmmo - toAdd,
          isReloading: false,
        };
      });
      isReloading.current = false;
    }, reloadDuration);
  };

  // Perform Raycast Shot
  const executeShot = () => {
    const now = performance.now();
    const minFireInterval = 60000 / activeWeapon.rpm;
    if (now - lastFireTime.current < minFireInterval) return;
    lastFireTime.current = now;

    if (isReloading.current) return;

    if (hudState.ammo <= 0) {
      sounds.playDryFire();
      handleReload();
      return;
    }

    // Decrement ammo
    setHudState((prev) => ({ ...prev, ammo: prev.ammo - 1 }));

    // Sound based on weapon type
    if (activeWeapon.sound === 'smg') {
      sounds.playSMGFire();
    } else if (activeWeapon.sound === 'sniper') {
      sounds.playSniperFire();
    } else if (activeWeapon.sound === 'shotgun') {
      sounds.playShotgunFire();
    } else if (activeWeapon.sound === 'pistol') {
      sounds.playPistolFire();
    } else {
      sounds.playGunshot();
    }

    // Muzzle Flash
    setMuzzleFlash(true);
    setTimeout(() => setMuzzleFlash(false), activeWeapon.sound === 'sniper' ? 85 : 50);

    // Apply Recoil Kickback
    const kickMult = isAimingDownSights.current ? 0.45 : 1.0;
    recoilOffset.current.z += activeWeapon.recoilKick * kickMult;
    recoilRotation.current.x += activeWeapon.recoilPitch * kickMult;
    euler.current.x += activeWeapon.recoilPitch * kickMult * 0.35;

    // Shotgun fires 8 pellets, others fire 1 projectile
    const pelletsCount = activeWeapon.pellets || 1;
    const baseDamage = activeWeapon.damage;
    const headshotMult = activeWeapon.headshotMult || 2.0;

    for (let p = 0; p < pelletsCount; p++) {
      const raycaster = raycasterRef.current;
      const center = new THREE.Vector2(0, 0);

      // Pellet spread or weapon spread
      const baseSpread = activeWeapon.spread || 0.015;
      const spreadFactor = isAimingDownSights.current ? baseSpread * 0.3 : baseSpread;
      const motionSpread = isSliding.current ? 0.025 : 0;

      center.x += (Math.random() - 0.5) * (spreadFactor + motionSpread);
      center.y += (Math.random() - 0.5) * (spreadFactor + motionSpread);

      raycaster.setFromCamera(center, camera);

      const muzzleWorldPos = new THREE.Vector3();
      camera.getWorldPosition(muzzleWorldPos);

      const intersects = raycaster.intersectObjects(scene.children, true);
      let hitPoint = null;
      let hitNormal = null;
      let hitTarget = null;

      for (const hit of intersects) {
        if (hit.object.isLine || hit.object.type === 'Points' || hit.distance < 0.6) continue;

        // 1. Direct Hitbox volume match
        if (hit.object.userData?.isHitbox) {
          hitPoint = hit.point;
          hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
          hitTarget = hit.object.userData;
          break;
        }

        // 2. Hierarchical Operative target match (if bullet struck helmet, pouch, armor, limbs, or weapon)
        let curr = hit.object;
        let foundTarget = null;
        let depth = 0;
        while (curr && curr !== scene && depth++ < 15) {
          if (curr.userData?.targetId) {
            const worldPos = new THREE.Vector3();
            curr.getWorldPosition(worldPos);
            const isHead = (hit.point.y - worldPos.y) > 1.30;
            foundTarget = {
              targetId: curr.userData.targetId,
              type: isHead ? 'head' : 'body',
            };
            break;
          }
          curr = curr.parent;
        }

        if (foundTarget) {
          hitPoint = hit.point;
          hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
          hitTarget = foundTarget;
          break;
        }

        // 3. Otherwise solid map geometry (walls, floor, barriers, containers)
        hitPoint = hit.point;
        hitNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 1, 0);
        break;
      }

      const endPoint = hitPoint || raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(75));

      onShoot({
        start: [muzzleWorldPos.x, muzzleWorldPos.y - 0.1, muzzleWorldPos.z],
        end: [endPoint.x, endPoint.y, endPoint.z],
        hitPoint: hitPoint ? [hitPoint.x, hitPoint.y, hitPoint.z] : null,
        normal: hitNormal ? [hitNormal.x, hitNormal.y, hitNormal.z] : [0, 1, 0],
        isBlood: !!hitTarget,
      });

      if (hitTarget) {
        const isHeadshot = hitTarget.type === 'head';
        const damageAmount = Math.round(isHeadshot ? baseDamage * headshotMult : baseDamage);

        sounds.playHitmarker(isHeadshot);
        setHudState((prev) => ({
          ...prev,
          hitmarkerVisible: true,
          hitmarkerHeadshot: isHeadshot,
        }));
        setTimeout(() => {
          setHudState((prev) => ({ ...prev, hitmarkerVisible: false }));
        }, 120);

        if (peerManager) {
          peerManager.sendDamage(hitTarget.targetId, damageAmount, isHeadshot);
        }

        window.dispatchEvent(
          new CustomEvent('fps-damage-event', {
            detail: {
              targetId: hitTarget.targetId,
              attackerId: 'local-player',
              attackerName: 'YOU',
              amount: damageAmount,
              isHeadshot,
            },
          })
        );

        // For shotguns, don't trigger 8 redundant damage events on first hit
        if (pelletsCount > 1) break;
      }
    }
  };

  // Main Frame Loop
  useFrame((state, delta) => {
    if (!rbRef.current) return;

    // 0. If player is dead, smoothly drop camera into ragdoll death view and stop horizontal velocity
    if (isDead) {
      const curLinvel = rbRef.current.linvel();
      const deadPos = rbRef.current.translation();
      rbRef.current.setLinvel({ x: 0, y: Math.max(-10, curLinvel.y), z: 0 }, true);

      currentEyeHeight.current = THREE.MathUtils.lerp(currentEyeHeight.current, 0.28, delta * 3.5);
      cameraRoll.current = THREE.MathUtils.lerp(cameraRoll.current, 0.42, delta * 3.0);
      euler.current.x = THREE.MathUtils.lerp(euler.current.x, 0.28, delta * 2.5);

      camera.quaternion.setFromEuler(
        new THREE.Euler(euler.current.x, euler.current.y, cameraRoll.current, 'YXZ')
      );
      camera.position.set(deadPos.x, deadPos.y + currentEyeHeight.current, deadPos.z);
      return;
    }

    if (slideCooldown.current > 0) {
      slideCooldown.current -= delta;
    }

    // 1. Continuous firing
    if (isMouseDown.current && isLocked) {
      executeShot();
    }

    // 2. Physics & Locomotion
    const linvel = rbRef.current.linvel();
    const curPos = rbRef.current.translation();

    // Continuously update live player position for Combat AI bots
    if (playerPosRef?.current) {
      playerPosRef.current.set(curPos.x, curPos.y, curPos.z);
    }

    // Void recovery failsafe (only triggers if genuinely falling off the map into the void)
    if (curPos.y < -4.0 || isNaN(curPos.y)) {
      rbRef.current.setTranslation({ x: 0, y: 1.8, z: 12 }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const isGrounded = Math.abs(linvel.y) < 0.6;

    // Movement directions
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.current.y);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.current.y);

    let moveX = 0;
    let moveZ = 0;
    let targetEyeY = 1.6;

    // 3. Tactical Slide Handling
    if (isSliding.current) {
      slideTimer.current -= delta;
      // Exponential slide deceleration
      slideSpeed.current = THREE.MathUtils.lerp(slideSpeed.current, 5.0, delta * 3.5);

      moveX = slideDir.current.x * slideSpeed.current;
      moveZ = slideDir.current.z * slideSpeed.current;

      // Drop camera height to sliding level
      targetEyeY = 0.75;
      cameraRoll.current = THREE.MathUtils.lerp(cameraRoll.current, -0.07, delta * 10);

      // Slide Jump (Cancel slide into momentum jump!)
      if (keys.current.jump && isGrounded) {
        isSliding.current = false;
        setHudState((prev) => (prev.isSliding ? { ...prev, isSliding: false } : prev));
        rbRef.current.setLinvel(
          {
            x: moveX * 1.1,
            y: 8.5,
            z: moveZ * 1.1,
          },
          true
        );
      } else if (slideTimer.current <= 0) {
        isSliding.current = false;
        setHudState((prev) => (prev.isSliding ? { ...prev, isSliding: false } : prev));
      }
    } else {
      // Standard Walking / Sprinting / Crouching
      cameraRoll.current = THREE.MathUtils.lerp(cameraRoll.current, 0, delta * 8);

      const moveDir = new THREE.Vector3();
      if (keys.current.forward) moveDir.add(forward);
      if (keys.current.backward) moveDir.sub(forward);
      if (keys.current.right) moveDir.add(right);
      if (keys.current.left) moveDir.sub(right);

      const isMoving = moveDir.lengthSq() > 0.01;
      if (isMoving) moveDir.normalize();

      let speed = 6.0;
      const isCrouching = keys.current.crouch && !keys.current.sprint;

      if (isCrouching) {
        speed = 3.4;
        targetEyeY = 1.05;
      } else if (keys.current.sprint && isMoving && keys.current.forward && !isAimingDownSights.current && staminaRef.current > 5) {
        speed = perkId === 'lightweight' ? 12.5 : 10.5;
        targetEyeY = 1.6;
        staminaRef.current = Math.max(0, staminaRef.current - delta * 22);
      } else if (staminaRef.current < 100) {
        staminaRef.current = Math.min(100, staminaRef.current + delta * 16);
      }

      // Sync stamina to HUD at 15Hz (66ms) only if rounded integer actually changed
      const nowMs = performance.now();
      if (nowMs - lastStaminaSync.current > 66) {
        lastStaminaSync.current = nowMs;
        const currentInt = Math.round(staminaRef.current);
        setHudState((prev) => {
          if (prev.stamina === currentInt) return prev;
          return { ...prev, stamina: currentInt };
        });
      }

      moveX = moveDir.x * speed;
      moveZ = moveDir.z * speed;
    }

    // Set linear velocity
    if (!isSliding.current || !keys.current.jump) {
      rbRef.current.setLinvel(
        {
          x: moveX,
          y: keys.current.jump && isGrounded ? 8.2 : linvel.y,
          z: moveZ,
        },
        true
      );
    }

    // Smooth eye height interpolation (smooth crouch/slide drop and rise)
    currentEyeHeight.current = THREE.MathUtils.lerp(currentEyeHeight.current, targetEyeY, delta * 14);

    // 4. Head Bobbing & Footsteps
    let bobX = 0;
    let bobY = 0;
    const isMovingH = Math.abs(moveX) > 0.5 || Math.abs(moveZ) > 0.5;

    if (isMovingH && isGrounded && !isSliding.current) {
      const isSprinting = keys.current.sprint && hudState.stamina > 5;
      const bobFreq = isSprinting ? 14.0 : 9.5;
      const bobAmp = isSprinting ? 0.055 : 0.032;
      bobTimer.current += delta * bobFreq;

      bobY = Math.sin(bobTimer.current * 2) * bobAmp;
      bobX = Math.cos(bobTimer.current) * (bobAmp * 0.5);

      footstepAccumulator.current += delta * (isSprinting ? 2.6 : 1.8);
      if (footstepAccumulator.current >= 1.0) {
        footstepAccumulator.current = 0;
        sounds.playFootstep(isSprinting);
      }
    } else {
      bobTimer.current = 0;
    }

    // 5. Camera Transform
    camera.quaternion.setFromEuler(
      new THREE.Euler(euler.current.x, euler.current.y, cameraRoll.current, 'YXZ')
    );
    camera.position.set(curPos.x + bobX, curPos.y + currentEyeHeight.current + bobY, curPos.z);

    // 6. Weapon Specific ADS FOV
    const baseAdsFOV = activeWeapon.adsFOV || 52;
    const targetFOV = isAimingDownSights.current ? baseAdsFOV : (isSliding.current ? 80 : 75);
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, delta * 14);
    camera.updateProjectionMatrix();

    // 7. Weapon Sway and Recoil Recovery
    swayOffset.current.x = THREE.MathUtils.lerp(swayOffset.current.x, -mouseDelta.current.x * 0.35, delta * 12);
    swayOffset.current.y = THREE.MathUtils.lerp(swayOffset.current.y, mouseDelta.current.y * 0.35, delta * 12);
    mouseDelta.current.x = THREE.MathUtils.lerp(mouseDelta.current.x, 0, delta * 16);
    mouseDelta.current.y = THREE.MathUtils.lerp(mouseDelta.current.y, 0, delta * 16);

    recoilOffset.current.lerp(new THREE.Vector3(0, 0, 0), delta * 18);
    recoilRotation.current.x = THREE.MathUtils.lerp(recoilRotation.current.x, 0, delta * 20);

    // 8. Align Weapon Rig with Camera + Sway + ADS + Recoil + Slide Tilt
    if (weaponRigRef.current) {
      // Resting position (hip fire) vs ADS position
      const adsCoords = activeWeapon.adsPos || [0.0, -0.110, -0.26];
      const adsTargetPos = isAimingDownSights.current
        ? new THREE.Vector3(...adsCoords)
        : (isSliding.current
          ? new THREE.Vector3(0.14, -0.18, -0.32)
          : new THREE.Vector3(0.16, -0.14, -0.34));

      // Damped sway in ADS: reticle stays firmly planted in the center of the screen
      const swayMult = isAimingDownSights.current ? 0.05 : 1.0;
      const targetPos = adsTargetPos.clone()
        .add(new THREE.Vector3(swayOffset.current.x * swayMult, swayOffset.current.y * swayMult, 0))
        .add(recoilOffset.current);

      weaponRigRef.current.position.lerp(targetPos, delta * 24);

      // Rotation angles with tactical slide cant
      const slideCantZ = isSliding.current ? 0.28 : 0;
      const baseRotationX = isAimingDownSights.current ? 0 : 0.02;
      const baseRotationY = isAimingDownSights.current ? 0 : -0.04;

      const rotSwayMult = isAimingDownSights.current ? 0.04 : 1.0;
      weaponRigRef.current.rotation.x = baseRotationX + recoilRotation.current.x + swayOffset.current.y * 0.4 * rotSwayMult;
      weaponRigRef.current.rotation.y = baseRotationY + swayOffset.current.x * 0.6 * rotSwayMult;
      weaponRigRef.current.rotation.z = slideCantZ - swayOffset.current.x * 0.4 * rotSwayMult;
    }

    // 9. Network state transmission at ~35 Hz
    if (peerManager && Math.random() < 0.6) {
      peerManager.sendState({
        pos: [curPos.x, curPos.y, curPos.z],
        rot: [euler.current.y, euler.current.x],
        state: {
          isMoving: isMovingH,
          isSprinting: keys.current.sprint,
          isSliding: isSliding.current,
          isAiming: isAimingDownSights.current,
        },
        health: hudState.health,
      });
    }
  });

  return (
    <>
      {/* Dynamic Player Capsule in Rapier Physics World */}
      <RigidBody
        ref={rbRef}
        colliders={false}
        type="dynamic"
        position={[0, 1.8, 12]}
        enabledRotations={[false, false, false]}
        friction={0.0}
        restitution={0.0}
        ccd={true}
        canSleep={false}
      >
        <CapsuleCollider args={[0.65, 0.35]} position={[0, 1.0, 0]} friction={0.0} restitution={0.0} />
      </RigidBody>

      {/* First Person Weapon Rig Attached Directly to Camera via createPortal */}
      {createPortal(
        <group ref={weaponRigRef} position={[0.16, -0.14, -0.34]} visible={!isDead}>
          <ProceduralRifle
            weaponId={activeWeapon.id}
            skinIndex={skinIndex}
            isFiring={isMouseDown.current}
            isAiming={isAimingDownSights.current}
            muzzleFlashVisible={muzzleFlash}
          />
        </group>,
        camera
      )}
    </>
  );
}

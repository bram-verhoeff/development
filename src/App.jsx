import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';

import { Lighting } from './components/Map/Lighting';
import { Sector7Depot } from './components/Map/Sector7Depot';
import { PlayerController } from './components/Player/PlayerController';
import { RemotePlayer } from './components/Opponent/RemotePlayer';
import { BotOpponent } from './components/Opponent/BotOpponent';
import { TracerManager } from './components/Effects/TracerManager';
import { ImpactParticles } from './components/Effects/ImpactParticles';
import { PostPipeline } from './components/Canvas/PostPipeline';

import { TacticalHUD } from './components/UI/TacticalHUD';
import { DamageOverlay } from './components/UI/DamageOverlay';
import { DeathOverlay } from './components/UI/DeathOverlay';
import { LeaderboardModal } from './components/UI/LeaderboardModal';
import { RoomModal } from './components/UI/RoomModal';
import { LoadoutModal } from './components/UI/LoadoutModal';
import { ErrorBoundary } from './components/UI/ErrorBoundary';

import { PeerManager } from './network/PeerManager';
import { sounds } from './audio/SoundEngine';
import { BOT_ROSTER } from './config/botConfig';
import { GRAPHICS_PRESETS } from './config/graphicsConfig';

export function App() {
  const [isLocked, setIsLocked] = useState(false);
  const [roomId, setRoomId] = useState('sector7-alpha');
  const [statusText, setStatusText] = useState('Standby');
  const [remotePeers, setRemotePeers] = useState({});
  const [killfeed, setKillfeed] = useState([
    { id: 1, killer: 'SYS_ADMIN', victim: 'SECTOR-7 INIT', isHeadshot: false },
  ]);

  // Loadout Selection State
  const [isLoadoutOpen, setIsLoadoutOpen] = useState(false);
  const [selectedWeaponId, setSelectedWeaponId] = useState('mk18');
  const [selectedSkinId, setSelectedSkinId] = useState('ghost-specops');
  const [selectedPerkId, setSelectedPerkId] = useState('lightweight');

  // Configurable Bot Simulation State
  const [botCount, setBotCount] = useState(2); // 0 to 6 bots
  const [botDifficulty, setBotDifficulty] = useState('regular'); // 'recruit' | 'regular' | 'veteran' | 'specops'

  // Graphics & Reflections Quality State with LocalStorage Persistence
  const [graphicsQuality, setGraphicsQuality] = useState(() => {
    try {
      return localStorage.getItem('fps_graphics_quality') || 'high';
    } catch {
      return 'high';
    }
  });

  const [enableReflections, setEnableReflections] = useState(() => {
    try {
      const saved = localStorage.getItem('fps_enable_reflections');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [showFps, setShowFps] = useState(() => {
    try {
      const saved = localStorage.getItem('fps_show_counter');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const handleSelectGraphicsQuality = useCallback((quality) => {
    setGraphicsQuality(quality);
    try {
      localStorage.setItem('fps_graphics_quality', quality);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  const handleToggleReflections = useCallback((enabled) => {
    setEnableReflections(enabled);
    try {
      localStorage.setItem('fps_enable_reflections', String(enabled));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  const handleToggleFps = useCallback((enabled) => {
    setShowFps(enabled);
    try {
      localStorage.setItem('fps_show_counter', String(enabled));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, []);

  const activeGraphics = useMemo(() => {
    return GRAPHICS_PRESETS.find((p) => p.id === graphicsQuality) || GRAPHICS_PRESETS[2];
  }, [graphicsQuality]);

  // Combat Stats: Kills, Deaths, Score, Headshots
  const [combatStats, setCombatStats] = useState({
    kills: 0,
    deaths: 0,
    score: 0,
    headshots: 0,
  });

  // Participant Scores Dictionary (for Leaderboard)
  const [participantScores, setParticipantScores] = useState({
    'local-player': { kills: 0, deaths: 0, score: 0 },
  });

  // Death & Respawn State
  const [isDead, setIsDead] = useState(false);
  const [deathInfo, setDeathInfo] = useState({
    killer: 'BOT ALPHA',
    isHeadshot: false,
    respawnTimer: 3,
  });

  // Leaderboard Modal State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Dynamic In-Game Kill Notification Popup
  const [killNotification, setKillNotification] = useState(null);

  const [hudState, setHudState] = useState({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    ammo: 30,
    reserveAmmo: 120,
    isAiming: false,
    isMoving: false,
    isReloading: false,
    hitmarkerVisible: false,
    hitmarkerHeadshot: false,
    weaponId: 'mk18',
    weaponName: 'MK-18 MOD 1',
    weaponCaliber: '5.56x45mm NATO',
    weaponCategory: 'ASSAULT RIFLE',
    perkId: 'lightweight',
  });

  const peerManagerRef = useRef(null);
  const playerPosRef = useRef(new THREE.Vector3(0, 1.8, 14));
  const botRegistryRef = useRef({});

  // Handle pointer lock change
  useEffect(() => {
    const handleLockChange = () => {
      const locked = !!document.pointerLockElement;
      setIsLocked(locked);
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    return () => document.removeEventListener('pointerlockchange', handleLockChange);
  }, []);

  const requestLock = () => {
    if (isDead) return;
    try {
      document.body.requestPointerLock();
    } catch (e) {
      console.warn('Pointer lock request error:', e);
    }
  };

  // Global key listener for 'B' (Loadout) and 'Tab' (Leaderboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'KeyB') {
        setIsLoadoutOpen((prev) => {
          if (!prev) document.exitPointerLock?.();
          return !prev;
        });
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        setIsLeaderboardOpen((prev) => {
          if (!prev) document.exitPointerLock?.();
          return !prev;
        });
      }

      if (e.code === 'Escape') {
        setIsLeaderboardOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Player Death & Respawn Sequence Trigger
  const triggerPlayerDeath = useCallback((attacker = 'ENEMY BOT', isHeadshot = false, attackerId = null) => {
    setIsDead(true);
    sounds.playPlayerDeath();

    // 1. Update local combat stats
    setCombatStats((prev) => ({
      ...prev,
      deaths: prev.deaths + 1,
    }));

    // 2. Update participant scores
    setParticipantScores((prev) => {
      const killerId = attackerId || 'bot-killer';
      return {
        ...prev,
        'local-player': {
          kills: prev['local-player']?.kills || 0,
          deaths: (prev['local-player']?.deaths || 0) + 1,
          score: prev['local-player']?.score || 0,
        },
        [killerId]: {
          kills: (prev[killerId]?.kills || 0) + 1,
          deaths: prev[killerId]?.deaths || 0,
          score: (prev[killerId]?.score || 0) + 100,
        },
      };
    });

    // 3. Add to Killfeed
    setKillfeed((k) => [
      ...k,
      { id: Date.now(), killer: attacker, victim: 'YOU', isHeadshot },
    ]);

    // 4. Initial Death Info with 3-second countdown
    setDeathInfo({ killer: attacker, isHeadshot, respawnTimer: 3 });

    setTimeout(() => {
      setDeathInfo((prev) => ({ ...prev, respawnTimer: 2 }));
    }, 1000);

    setTimeout(() => {
      setDeathInfo((prev) => ({ ...prev, respawnTimer: 1 }));
    }, 2000);

    setTimeout(() => {
      // Clean Respawn!
      setIsDead(false);
      setHudState((s) => ({
        ...s,
        health: s.maxHealth || 100,
        ammo: s.magCapacity || 30,
      }));
      window.dispatchEvent(new CustomEvent('fps-respawn-player'));
    }, 3000);
  }, []);

  // Listen for local player damage (from Combat AI bots or weapons)
  useEffect(() => {
    const handleFpsDamage = (e) => {
      if (e.detail?.targetId === 'local-player') {
        const dmg = e.detail.amount || 15;
        const attacker = e.detail.attackerName || 'CYBER-MERC';
        const isHeadshot = !!e.detail.isHeadshot;

        sounds.playMechanicalClick(1400, 0.05, 0.4);

        setHudState((prev) => {
          const nextHealth = Math.max(0, prev.health - dmg);
          if (nextHealth <= 0 && prev.health > 0) {
            triggerPlayerDeath(attacker, isHeadshot);
          }
          return { ...prev, health: nextHealth };
        });
      }
    };

    window.addEventListener('fps-damage-event', handleFpsDamage);
    return () => window.removeEventListener('fps-damage-event', handleFpsDamage);
  }, [triggerPlayerDeath]);

  // Initialize WebRTC / PeerJS Networking
  useEffect(() => {
    const manager = new PeerManager({
      onPeerJoin: (peerId) => {
        setRemotePeers((prev) => ({
          ...prev,
          [peerId]: { pos: [0, 0, 0], rot: [0, 0], health: 100, state: {} },
        }));
        setKillfeed((prev) => [
          ...prev,
          { id: Date.now(), killer: `OPERATIVE-${peerId.substring(0, 4)}`, victim: 'DEPLOYED', isHeadshot: false },
        ]);
      },
      onPeerLeave: (peerId) => {
        setRemotePeers((prev) => {
          const next = { ...prev };
          delete next[peerId];
          return next;
        });
      },
      onPeerUpdate: (peerId, payload) => {
        setRemotePeers((prev) => ({
          ...prev,
          [peerId]: {
            ...prev[peerId],
            ...payload,
          },
        }));
      },
      onShootEvent: (shootData) => {
        addTracer(shootData.start, shootData.end);
        if (shootData.hitPoint) {
          addImpact(shootData.hitPoint, shootData.normal, shootData.isBlood);
        }
      },
      onDamageEvent: ({ targetId, attackerId, amount, isHeadshot }) => {
        if (targetId === manager.myId) {
          setHudState((prev) => {
            const nextHealth = Math.max(0, prev.health - amount);
            if (nextHealth <= 0 && prev.health > 0) {
              triggerPlayerDeath(`OPERATIVE-${attackerId.substring(0, 4)}`, isHeadshot, attackerId);
            }
            return { ...prev, health: nextHealth };
          });
        } else {
          setRemotePeers((prev) => {
            if (!prev[targetId]) return prev;
            return {
              ...prev,
              [targetId]: {
                ...prev[targetId],
                health: Math.max(0, (prev[targetId].health || 100) - amount),
              },
            };
          });
        }
      },
      onStatusChange: (status) => {
        setStatusText(status);
      },
    });

    manager.init();
    peerManagerRef.current = manager;
    setRoomId(manager.roomId || 'sector7-alpha');

    return () => {
      manager.destroy();
    };
  }, [triggerPlayerDeath]);

  // Tracers and Impact Particles Event Dispatchers (Zero root component re-renders!)
  const addTracer = useCallback((start, end) => {
    window.dispatchEvent(new CustomEvent('fps-spawn-tracer', { detail: { start, end } }));
  }, []);

  const addImpact = useCallback((point, normal, isBlood) => {
    window.dispatchEvent(new CustomEvent('fps-spawn-impact', { detail: { point, normal, isBlood } }));
  }, []);

  // Handle local shoot callback from PlayerController
  const handleLocalShoot = useCallback((shootData) => {
    addTracer(shootData.start, shootData.end);
    if (shootData.hitPoint) {
      addImpact(shootData.hitPoint, shootData.normal, shootData.isBlood);
    }
    if (peerManagerRef.current) {
      peerManagerRef.current.sendShoot(shootData);
    }
  }, [addTracer, addImpact]);

  // Handle Bot Shooting (Spawn red enemy tracer)
  const handleBotShoot = useCallback((shootData) => {
    addTracer(shootData.start, shootData.end);
  }, [addTracer]);

  // Handle Bot Elimination (by Player or another Bot)
  const handleBotKilled = useCallback((victimId, victimName, attackerId, attackerName, isHeadshot = false) => {
    sounds.playElimination();

    const isPlayerKiller = attackerId === 'local-player' || attackerName === 'YOU';
    const killerDisplayName = isPlayerKiller ? 'YOU' : (attackerName ? `BOT ${attackerName}` : 'BOT AI');

    // 1. If player was the killer, award kills, score & show kill banner popup!
    if (isPlayerKiller) {
      setCombatStats((prev) => ({
        ...prev,
        kills: prev.kills + 1,
        score: prev.score + (isHeadshot ? 150 : 100),
        headshots: prev.headshots + (isHeadshot ? 1 : 0),
      }));

      // Trigger In-Game Kill Notification Popup
      setKillNotification({
        id: Date.now(),
        victim: victimName ? `BOT ${victimName}` : 'COMBAT BOT',
        isHeadshot,
      });
      setTimeout(() => setKillNotification(null), 2400);
    }

    // 2. Update Participant Scores for Leaderboard
    setParticipantScores((prev) => {
      const kId = attackerId || 'unknown-killer';
      return {
        ...prev,
        [kId]: {
          kills: (prev[kId]?.kills || 0) + 1,
          deaths: prev[kId]?.deaths || 0,
          score: (prev[kId]?.score || 0) + (isHeadshot ? 150 : 100),
        },
        [victimId]: {
          kills: prev[victimId]?.kills || 0,
          deaths: (prev[victimId]?.deaths || 0) + 1,
          score: prev[victimId]?.score || 0,
        },
      };
    });

    // 3. Killfeed entry (e.g. BOT ALPHA ➔ ELIMINATED ➔ BOT BRAVO)
    setKillfeed((prev) => [
      ...prev,
      { id: Date.now(), killer: killerDisplayName, victim: victimName ? `BOT ${victimName}` : 'CYBER-MERC', isHeadshot },
    ]);
  }, []);

  // Compile Dynamic Scoreboard Roster for Leaderboard Modal
  const scoreboardData = useMemo(() => {
    const list = [];

    // Local player
    list.push({
      id: 'local-player',
      name: 'YOU (OPERATIVE)',
      isLocal: true,
      kills: combatStats.kills,
      deaths: combatStats.deaths,
      score: combatStats.score,
      status: isDead ? 'K.I.A.' : 'ACTIVE',
      isDead: isDead,
      ping: '10ms',
    });

    // Active bots
    BOT_ROSTER.slice(0, botCount).forEach((bot) => {
      const bScore = participantScores[bot.id] || { kills: 0, deaths: 0, score: 0 };
      list.push({
        id: bot.id,
        name: `BOT ${bot.name}`,
        isBot: true,
        kills: bScore.kills,
        deaths: bScore.deaths,
        score: bScore.score,
        status: 'ACTIVE',
        ping: 'BOT',
      });
    });

    // Connected peers
    Object.entries(remotePeers).forEach(([peerId, data]) => {
      const pScore = participantScores[peerId] || { kills: 0, deaths: 0, score: 0 };
      list.push({
        id: peerId,
        name: `OPERATIVE-${peerId.substring(0, 4)}`,
        isPeer: true,
        kills: pScore.kills,
        deaths: pScore.deaths,
        score: pScore.score,
        status: (data.health || 100) > 0 ? 'ACTIVE' : 'K.I.A.',
        isDead: (data.health || 100) <= 0,
        ping: '32ms',
      });
    });

    return list;
  }, [combatStats, isDead, botCount, participantScores, remotePeers]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  const peerCount = Object.keys(remotePeers).length;

  return (
    <ErrorBoundary>
      <div className="game-viewport" onClick={() => !isLocked && !isLoadoutOpen && !isLeaderboardOpen && !isDead && requestLock()}>
        {/* 3D WebGL Canvas with Scaled Quality Preset */}
        <Canvas
          shadows={activeGraphics.shadows}
          dpr={activeGraphics.dpr}
          camera={{ fov: 75, near: 0.08, far: 200, position: [0, 1.8, 14] }}
          gl={{
            alpha: true,
            depth: true,
            stencil: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            antialias: graphicsQuality !== 'low',
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            if (activeGraphics.shadows) {
              gl.shadowMap.type = graphicsQuality === 'ultra' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
            }
          }}
        >
          {/* Quality Scaled Lighting and Environment */}
          <Lighting
            shadows={activeGraphics.shadows}
            shadowMapSize={activeGraphics.shadowMapSize}
            isLowQuality={graphicsQuality === 'low'}
          />

          {/* Rapier Physics World: Default vary timeStep steps once per frame, zero while loop freeze risk */}
          <Physics gravity={[0, -22, 0]}>
            {/* New Competitive Sector-7 Map with Optional Real-Time Planar Reflections */}
            <Sector7Depot
              enableReflections={enableReflections}
              graphicsQuality={graphicsQuality}
            />

            {/* Local Player Controller with Loadout & Position Sync */}
            <PlayerController
              peerManager={peerManagerRef.current}
              onShoot={handleLocalShoot}
              hudState={hudState}
              setHudState={setHudState}
              isLocked={isLocked}
              isDead={isDead}
              loadoutWeaponId={selectedWeaponId}
              perkId={selectedPerkId}
              onOpenLoadout={() => {
                document.exitPointerLock?.();
                setIsLoadoutOpen(true);
              }}
              playerPosRef={playerPosRef}
            />

            {/* Configurable Multi-Bot Combat AI Squad */}
            {BOT_ROSTER.slice(0, botCount).map((bot) => (
              <BotOpponent
                key={bot.id}
                id={bot.id}
                name={bot.name}
                skinId={bot.skinId}
                wpOffset={bot.wpOffset}
                difficultyId={botDifficulty}
                playerPos={playerPosRef.current}
                isPlayerDead={isDead}
                botRegistryRef={botRegistryRef}
                onBotKilled={handleBotKilled}
                onBotShoot={handleBotShoot}
              />
            ))}

            {/* Remote Multiplayer Opponents */}
            {Object.entries(remotePeers).map(([peerId, data]) => (
              <RemotePlayer
                key={peerId}
                id={peerId}
                data={data}
              />
            ))}
          </Physics>

          {/* Self-contained Ballistic Bullet Tracers (Zero App Re-renders) */}
          <TracerManager />

          {/* Self-contained Impact Sparks and Blood Particles (Zero App Re-renders) */}
          <ImpactParticles />

          {/* Quality Scaled Cinematic Post-Processing Pipeline */}
          <PostPipeline
            isAiming={hudState.isAiming}
            enabled={activeGraphics.enablePostProcessing}
            bloomIntensity={activeGraphics.bloomIntensity}
            chromaticAberration={activeGraphics.chromaticAberration}
            vignette={activeGraphics.vignette}
          />
        </Canvas>

        {/* Minimalist Tactical HUD with Kill Counter, Death Counter & Score */}
        <TacticalHUD
          hudState={hudState}
          roomId={roomId}
          peerCount={peerCount}
          statusText={statusText}
          killfeed={killfeed}
          onCopyLink={handleCopyLink}
          isLocked={isLocked}
          onOpenLoadout={() => {
            document.exitPointerLock?.();
            setIsLoadoutOpen(true);
          }}
          combatStats={combatStats}
          onToggleLeaderboard={() => {
            document.exitPointerLock?.();
            setIsLeaderboardOpen((prev) => !prev);
          }}
          killNotification={killNotification}
          graphicsQuality={graphicsQuality}
          enableReflections={enableReflections}
          showFps={showFps}
        />

        {/* Low-Health Damage Screen Overlay */}
        <DamageOverlay health={hudState.health} />

        {/* K.I.A. Death & Respawn Screen Overlay */}
        <DeathOverlay
          isDead={isDead}
          deathInfo={deathInfo}
          combatStats={combatStats}
        />

        {/* Interactive Tactical Scoreboard & Leaderboard Modal */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          onClose={() => {
            setIsLeaderboardOpen(false);
            if (!isDead && !isLoadoutOpen) requestLock();
          }}
          scoreboardData={scoreboardData}
          botDifficulty={botDifficulty}
          roomId={roomId}
        />

        {/* Deploy & Room Modal Overlay (Shown when pointer is unlocked, loadout & leaderboard closed, and alive) */}
        {!isLocked && !isLoadoutOpen && !isLeaderboardOpen && !isDead && (
          <RoomModal
            roomId={roomId}
            peerCount={peerCount}
            onDeploy={requestLock}
            onOpenLoadout={() => setIsLoadoutOpen(true)}
            botCount={botCount}
            onSelectBotCount={setBotCount}
            botDifficulty={botDifficulty}
            onSelectBotDifficulty={setBotDifficulty}
            graphicsQuality={graphicsQuality}
            onSelectGraphicsQuality={handleSelectGraphicsQuality}
            enableReflections={enableReflections}
            onToggleReflections={handleToggleReflections}
            showFps={showFps}
            onToggleFps={handleToggleFps}
          />
        )}

        {/* Interactive Tactical Loadout, Bot AI Settings & Graphics Modal */}
        <LoadoutModal
          isOpen={isLoadoutOpen}
          onClose={() => {
            setIsLoadoutOpen(false);
            if (!isDead) requestLock();
          }}
          selectedWeaponId={selectedWeaponId}
          onSelectWeapon={setSelectedWeaponId}
          selectedSkinId={selectedSkinId}
          onSelectSkin={setSelectedSkinId}
          selectedPerkId={selectedPerkId}
          onSelectPerk={setSelectedPerkId}
          botCount={botCount}
          onSelectBotCount={setBotCount}
          botDifficulty={botDifficulty}
          onSelectBotDifficulty={setBotDifficulty}
          graphicsQuality={graphicsQuality}
          onSelectGraphicsQuality={handleSelectGraphicsQuality}
          enableReflections={enableReflections}
          onToggleReflections={handleToggleReflections}
          showFps={showFps}
          onToggleFps={handleToggleFps}
        />
      </div>
    </ErrorBoundary>
  );
}

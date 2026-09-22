import React, { useState } from 'react';
import { Shield, Zap, Crosshair, Users, Copy, Check, Radio, Briefcase, Award, Trophy, Skull, Activity } from 'lucide-react';
import { useFps } from '../../hooks/useFps';

export function TacticalHUD({
  hudState,
  roomId,
  peerCount,
  statusText,
  killfeed,
  onCopyLink,
  isLocked,
  onOpenLoadout,
  combatStats = { kills: 0, deaths: 0, score: 0 },
  onToggleLeaderboard,
  killNotification = null,
  graphicsQuality = 'high',
  enableReflections = true,
  showFps = true,
}) {
  const [copied, setCopied] = useState(false);
  const { fps, frametime } = useFps();

  const handleCopy = () => {
    onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const {
    health = 100,
    maxHealth = 100,
    stamina = 100,
    ammo = 30,
    reserveAmmo = 120,
    isAiming = false,
    isReloading = false,
    hitmarkerVisible = false,
    hitmarkerHeadshot = false,
    weaponName = 'MK-18 MOD 1',
    weaponCaliber = '5.56x45mm NATO',
    weaponCategory = 'ASSAULT RIFLE',
    weaponId = 'mk18',
    perkId = 'lightweight',
  } = hudState;

  const kills = combatStats?.kills ?? 0;
  const deaths = combatStats?.deaths ?? 0;
  const score = combatStats?.score ?? 0;
  const kd = (kills / Math.max(1, deaths)).toFixed(2);

  // Crosshair spread calculation
  const spread = isAiming ? 4 : (hudState.isMoving ? 18 : 10);
  const isSniperADS = isAiming && weaponId === 'ax50';

  return (
    <div className="tactical-hud-root">
      {/* 1. Fullscreen Telescopic Sniper Scope Overlay when ADS on AX-50 */}
      {isSniperADS ? (
        <div className="sniper-scope-fullscreen">
          <div className="scope-vignette-outer" />
          <div className="scope-lens-circle">
            <div className="scope-crosshair-h" />
            <div className="scope-crosshair-v" />
            <div className="scope-mildot d1" />
            <div className="scope-mildot d2" />
            <div className="scope-mildot d3" />
            <div className="scope-mildot d4" />
            <div className="scope-range-label">8.0X // .50 BMG MATCH</div>
          </div>
          {hitmarkerVisible && (
            <div className={`hitmarker-chevron ${hitmarkerHeadshot ? 'headshot' : ''}`}>
              <div className="hit-tick tick-tl" />
              <div className="hit-tick tick-tr" />
              <div className="hit-tick tick-bl" />
              <div className="hit-tick tick-br" />
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Tactical Crosshair & Hitmarker */
        !isAiming ? (
          <div className="crosshair-container">
            <div className="crosshair-dot" />
            <div className="crosshair-line top" style={{ transform: `translateY(-${spread}px)` }} />
            <div className="crosshair-line bottom" style={{ transform: `translateY(${spread}px)` }} />
            <div className="crosshair-line left" style={{ transform: `translateX(-${spread}px)` }} />
            <div className="crosshair-line right" style={{ transform: `translateX(${spread}px)` }} />

            {/* Hitmarker Confirmation Chevron */}
            {hitmarkerVisible && (
              <div className={`hitmarker-chevron ${hitmarkerHeadshot ? 'headshot' : ''}`}>
                <div className="hit-tick tick-tl" />
                <div className="hit-tick tick-tr" />
                <div className="hit-tick tick-bl" />
                <div className="hit-tick tick-br" />
              </div>
            )}
          </div>
        ) : (
          /* When ADS through Reflex Optics: Clean sight picture with hitmarker feedback only */
          hitmarkerVisible && (
            <div className="crosshair-container ads">
              <div className={`hitmarker-chevron ${hitmarkerHeadshot ? 'headshot' : ''}`}>
                <div className="hit-tick tick-tl" />
                <div className="hit-tick tick-tr" />
                <div className="hit-tick tick-bl" />
                <div className="hit-tick tick-br" />
              </div>
            </div>
          )
        )
      )}

      {/* 2. Top Header: Room Network Status, Combat Counters, & Actions */}
      <header className="hud-top-bar">
        {/* Left: Sector & Network Status */}
        <div className="hud-badge tactical-room-badge">
          <Radio size={14} className="hud-pulse-icon" />
          <span className="room-id">SECTOR-7 // {roomId.toUpperCase()}</span>
          <span className="divider">|</span>
          <Users size={14} />
          <span>{peerCount + 1} ACTIVE</span>
          <span className="status-label">{statusText}</span>
        </div>

        {/* Center: Realtime Kill Counter & Death Counter Widget */}
        <div className="hud-combat-stats-widget">
          <div className="stat-pill kills">
            <Crosshair size={13} color="#00ffcc" />
            <span className="lbl">KILLS</span>
            <span className="val kill-count-val">{kills}</span>
          </div>
          <div className="stat-pill deaths">
            <Skull size={13} color="#ff3344" />
            <span className="lbl">DEATHS</span>
            <span className="val death-count-val">{deaths}</span>
          </div>
          <div className="stat-pill kd">
            <span className="lbl">K/D</span>
            <span className={`val ${Number(kd) >= 1 ? 'kd-pos' : 'kd-neg'}`}>{kd}</span>
          </div>
          <div className="stat-pill score">
            <Trophy size={13} color="#f59e0b" />
            <span className="lbl">SCORE</span>
            <span className="val score-val">{score}</span>
          </div>
        </div>

        {/* Right: Leaderboard, Loadout & Invite */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="hud-button leaderboard-trigger-btn"
            onClick={onToggleLeaderboard}
            title="View Match Leaderboard & Scoreboard [TAB]"
          >
            <Trophy size={14} color="#f59e0b" />
            <span>LEADERBOARD [TAB]</span>
          </button>

          <button
            className="hud-button loadout-trigger-btn"
            onClick={onOpenLoadout}
            title="Open Loadout & Weapons Menu [B]"
          >
            <Briefcase size={14} color="#00ffcc" />
            <span>LOADOUT [B]</span>
          </button>

          <button
            className="hud-button copy-link-btn"
            onClick={handleCopy}
            title="Share room link to play multiplayer with another player"
          >
            {copied ? <Check size={14} color="#00ffcc" /> : <Copy size={14} />}
            <span>{copied ? 'LINK COPIED!' : 'INVITE PEER'}</span>
          </button>

          {/* Real-time FPS & Frametime Performance readout */}
          {showFps && (
            <div
              className={`hud-badge fps-counter-badge ${
                fps >= 240 ? 'fps-ultra-high' : fps >= 55 ? 'fps-good' : fps >= 30 ? 'fps-medium' : 'fps-low'
              }`}
              title={`Framerate: ${fps} FPS | Frametime: ${frametime} ms ${fps >= 300 ? '⚡ 300+ FPS ESPORTS MODE' : ''}`}
            >
              <Activity size={13} className="fps-icon" />
              <span className="fps-val">{fps}</span>
              <span className="fps-unit">FPS</span>
              <span className="fps-divider">/</span>
              <span className="fps-frametime">{frametime}ms</span>
            </div>
          )}

          <div
            className="hud-badge gfx-hud-badge"
            onClick={onOpenLoadout}
            style={{ cursor: 'pointer' }}
            title="Graphics Preset & Reflection Status - Click to Change [B]"
          >
            <span className="gfx-hud-tag">{graphicsQuality.toUpperCase()}</span>
            {enableReflections && <span className="gfx-hud-rt">✦ RT</span>}
          </div>
        </div>
      </header>

      {/* 3. Killfeed / Combat Events */}
      <div className="hud-killfeed">
        {killfeed.slice(-4).map((item) => (
          <div key={item.id} className="killfeed-item">
            <span className="killer">{item.killer}</span>
            <span className="action">ELIMINATED</span>
            <span className="victim">{item.victim}</span>
            {item.isHeadshot && <span className="headshot-badge">HEADSHOT</span>}
          </div>
        ))}
      </div>

      {/* Dynamic In-Game Kill Notification Popup */}
      {killNotification && (
        <div className={`hud-kill-notification ${killNotification.isHeadshot ? 'headshot-kill' : ''}`}>
          <div className="kill-notif-title">
            {killNotification.isHeadshot ? '+150 HEADSHOT ELIMINATION' : '+100 ENEMY ELIMINATED'}
          </div>
          <div className="kill-notif-sub">{killNotification.victim}</div>
        </div>
      )}

      {/* 4. Bottom Left: Health, Armor & Tactical Perk */}
      <div className="hud-bottom-left">
        {/* Health Plate */}
        <div className="hud-stat-box">
          <div className="stat-label-row">
            <div className="stat-title">
              <Shield size={14} color={health > 35 ? '#00ffcc' : '#ff3344'} />
              <span>VITALITY // HP</span>
            </div>
            <span className="stat-value">{Math.round(health)} / {maxHealth}</span>
          </div>
          <div className="stat-bar-track">
            <div
              className={`stat-bar-fill health ${health <= 35 ? 'critical' : ''}`}
              style={{ width: `${(Math.max(0, health) / maxHealth) * 100}%` }}
            />
          </div>
        </div>

        {/* Stamina Meter */}
        <div className="hud-stat-box">
          <div className="stat-label-row">
            <div className="stat-title">
              <Zap size={14} color="#f59e0b" />
              <span>STAMINA</span>
            </div>
            <span className="stat-value">{Math.round(stamina)}%</span>
          </div>
          <div className="stat-bar-track small">
            <div
              className="stat-bar-fill stamina"
              style={{ width: `${Math.max(0, stamina)}%` }}
            />
          </div>
        </div>

        {/* Active Tactical Perk Badge */}
        <div className="hud-perk-badge">
          <Award size={13} color="#00ffcc" />
          <span>PERK: {perkId.toUpperCase().replace('-', ' ')}</span>
        </div>
      </div>

      {/* 5. Bottom Right: Tactical Weapon & Ammo Display */}
      <div className="hud-bottom-right">
        <div className="weapon-card">
          <div className="weapon-header-row">
            <div className="weapon-name">{weaponName}</div>
            <button
              className="hud-skin-tag-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('fps-cycle-skin'))}
              title="Click or press [T] to switch weapon skin"
            >
              <span>{hudState.skinTag || 'CYBER-TECH'}</span>
            </button>
          </div>

          <div
            className="hud-skin-name-label"
            style={{ color: hudState.skinColor || '#00ffcc' }}
          >
            {hudState.skinName || 'NEO-CYBER // VOID'}
          </div>

          <div className="weapon-caliber">{weaponCaliber} // [T] SKIN</div>

          <div className="ammo-display">
            <div className={`current-ammo ${ammo <= 5 ? 'empty' : ''}`}>
              {isReloading ? '--' : ammo.toString().padStart(2, '0')}
            </div>
            <div className="ammo-divider">/</div>
            <div className="reserve-ammo">{reserveAmmo}</div>
          </div>

          {/* Tactical Bullet Pips */}
          <div className="bullet-pips">
            {Array.from({ length: Math.min(35, hudState.magCapacity || 30) }).map((_, i) => (
              <div
                key={i}
                className={`bullet-pip ${i < ammo ? 'loaded' : 'spent'}`}
              />
            ))}
          </div>

          {/* Reload Prompt */}
          {ammo <= 5 && !isReloading && (
            <div className="reload-prompt blink">PRESS [R] TO RELOAD</div>
          )}
          {/* Slide Indicator */}
          {hudState.isSliding && (
            <div className="hud-slide-badge">TACTICAL SLIDE</div>
          )}
        </div>
      </div>

      {/* 6. Controls Reminder Overlay (Bottom Center) */}
      <div className="hud-controls-helper">
        <span>[TAB] SCOREBOARD</span>
        <span>[B] LOADOUT</span>
        <span>[1] PRIMARY</span>
        <span>[2] SECONDARY</span>
        <span>[WASD] MOVE</span>
        <span>[SHIFT] SPRINT</span>
        <span>[C] SLIDE</span>
        <span>[SPACE] JUMP</span>
        <span>[L-CLICK] FIRE</span>
        <span>[R-CLICK] ADS</span>
        <span>[R] RELOAD</span>
        <span>[T] SKIN</span>
        <span>[K] RESPAWN</span>
      </div>
    </div>
  );
}

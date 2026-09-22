import React from 'react';
import { Skull, AlertTriangle, ShieldAlert } from 'lucide-react';

export function DeathOverlay({ isDead, deathInfo, combatStats }) {
  if (!isDead) return null;

  const killer = deathInfo?.killer || 'ENEMY COMBATANT';
  const respawnTimer = deathInfo?.respawnTimer ?? 3;
  const isHeadshot = !!deathInfo?.isHeadshot;

  const kills = combatStats?.kills || 0;
  const deaths = combatStats?.deaths || 0;
  const kd = (kills / Math.max(1, deaths)).toFixed(2);
  const score = combatStats?.score || 0;

  return (
    <div className="death-overlay-root">
      {/* Red Blood & Dark Vignette */}
      <div className="death-vignette" />
      <div className="death-scanlines" />

      <div className="death-content-card">
        {/* Warning Icon & Tag */}
        <div className="death-header-badge">
          <Skull size={28} className="skull-icon" />
          <span className="death-status-text">K.I.A. // ELIMINATED</span>
        </div>

        {/* Killer Callout */}
        <div className="death-killer-box">
          <div className="killer-label">ELIMINATED BY</div>
          <div className="killer-name">{killer}</div>
          {isHeadshot && <div className="death-headshot-tag">LETHAL HEADSHOT</div>}
        </div>

        {/* Dynamic Respawn Countdown Bar */}
        <div className="death-respawn-section">
          <div className="respawn-timer-label">
            RESPAWNING IN <span className="timer-number">{respawnTimer}</span>S
          </div>
          <div className="respawn-progress-track">
            <div
              className="respawn-progress-fill"
              style={{
                width: `${((3 - respawnTimer) / 3) * 100}%`,
                transition: 'width 1s linear',
              }}
            />
          </div>
        </div>

        {/* Match Snapshot Stats */}
        <div className="death-stats-grid">
          <div className="death-stat-col">
            <span className="stat-sub">KILLS</span>
            <span className="stat-num">{kills}</span>
          </div>
          <div className="death-stat-col">
            <span className="stat-sub">DEATHS</span>
            <span className="stat-num death-val">{deaths}</span>
          </div>
          <div className="death-stat-col">
            <span className="stat-sub">K/D</span>
            <span className="stat-num">{kd}</span>
          </div>
          <div className="death-stat-col">
            <span className="stat-sub">SCORE</span>
            <span className="stat-num score-val">{score}</span>
          </div>
        </div>

        {/* Tactical Tip */}
        <div className="death-tip">
          <AlertTriangle size={13} color="#f59e0b" />
          <span>TACTICAL TIP: Use [C] to slide between concrete barriers and flank enemy bots.</span>
        </div>
      </div>
    </div>
  );
}

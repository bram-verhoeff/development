import React, { useState } from 'react';
import { Play, Copy, Check, Crosshair, ShieldCheck, Wifi, Briefcase, Users, Target, Monitor, Sparkles, Activity } from 'lucide-react';
import { sounds } from '../../audio/SoundEngine';
import { BOT_DIFFICULTIES } from '../../config/botConfig';
import { GRAPHICS_PRESETS } from '../../config/graphicsConfig';

export function RoomModal({
  roomId,
  peerCount,
  onDeploy,
  onOpenLoadout,
  botCount = 2,
  onSelectBotCount,
  botDifficulty = 'regular',
  onSelectBotDifficulty,
  graphicsQuality = 'high',
  onSelectGraphicsQuality,
  enableReflections = true,
  onToggleReflections,
  showFps = true,
  onToggleFps,
}) {
  const [copied, setCopied] = useState(false);

  const roomUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeployClick = () => {
    sounds.ensureContext();
    onDeploy();
  };

  return (
    <div className="modal-backdrop">
      <div className="deploy-modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="system-tag">// SECTOR-7 TACTICAL DEPOT v3.5</div>
          <h1 className="modal-title">HIGH-FIDELITY COMBAT ZONE</h1>
          <p className="modal-subtitle">Competitive Industrial Hangar & Cargo Yard with Rapier Physics & Combat AI Opponents</p>
        </div>

        {/* Room Info */}
        <div className="modal-room-box">
          <div className="room-info-row">
            <span className="room-label">
              <Wifi size={14} className="icon-pulse" /> NETWORK SECTOR:
            </span>
            <span className="room-code">{roomId.toUpperCase()}</span>
          </div>

          <div className="room-actions-row">
            <input
              type="text"
              readOnly
              value={roomUrl}
              className="room-input"
            />
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? <Check size={14} color="#00ffcc" /> : <Copy size={14} />}
              <span>{copied ? 'COPIED' : 'COPY LINK'}</span>
            </button>
          </div>
          <div className="room-hint">
            Share this link to invite peers, or battle against the integrated Combat AI bot squad below!
          </div>
        </div>

        {/* Tactical Bot Simulation Quick Controls */}
        <div className="deploy-bot-panel">
          <div className="bot-panel-row">
            <div className="panel-label">
              <Users size={14} color="#00ffcc" />
              <span>ACTIVE BOTS:</span>
            </div>
            <div className="panel-bot-counts">
              {[0, 1, 2, 3, 4, 5, 6].map((count) => {
                const isSelected = botCount === count;
                return (
                  <button
                    key={count}
                    className={`deploy-count-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      sounds.playMechanicalClick(2000, 0.03, 0.3);
                      if (onSelectBotCount) onSelectBotCount(count);
                    }}
                  >
                    {count === 0 ? '0 (SOLO)' : count}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bot-panel-row">
            <div className="panel-label">
              <Target size={14} color="#ff3344" />
              <span>DIFFICULTY:</span>
            </div>
            <div className="panel-difficulties">
              {BOT_DIFFICULTIES.map((diff) => {
                const isSelected = botDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    className={`deploy-diff-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      borderColor: isSelected ? diff.color : 'rgba(255, 255, 255, 0.12)',
                      color: isSelected ? diff.color : '#94a3b8',
                    }}
                    onClick={() => {
                      sounds.playMechanicalClick(1800, 0.04, 0.35);
                      if (onSelectBotDifficulty) onSelectBotDifficulty(diff.id);
                    }}
                  >
                    <span>{diff.name}</span>
                    {isSelected && <span className="active-dot" style={{ background: diff.color }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Graphics Quality & Reflections Quick Controls */}
        <div className="deploy-graphics-panel">
          <div className="graphics-panel-row">
            <div className="panel-label">
              <Monitor size={14} color="#00ffcc" />
              <span>GRAPHICS:</span>
            </div>
            <div className="panel-graphics-tiers">
              {GRAPHICS_PRESETS.map((preset) => {
                const isSelected = graphicsQuality === preset.id;
                return (
                  <button
                    key={preset.id}
                    className={`deploy-diff-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      borderColor: isSelected ? preset.color : 'rgba(255, 255, 255, 0.12)',
                      color: isSelected ? preset.color : '#94a3b8',
                    }}
                    title={preset.description}
                    onClick={() => {
                      sounds.playMechanicalClick(2000, 0.03, 0.3);
                      if (onSelectGraphicsQuality) onSelectGraphicsQuality(preset.id);
                    }}
                  >
                    <span>{preset.name}</span>
                    {isSelected && <span className="active-dot" style={{ background: preset.color }} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="graphics-panel-row">
            <div className="panel-label">
              <Sparkles size={14} color="#f59e0b" />
              <span>REFLECTIONS:</span>
            </div>
            <button
              className={`deploy-reflection-toggle-btn ${enableReflections ? 'active' : ''}`}
              onClick={() => {
                sounds.playMechanicalClick(2200, 0.03, 0.35);
                if (onToggleReflections) onToggleReflections(!enableReflections);
              }}
            >
              <span className="reflection-switch-track">
                <span className={`reflection-switch-thumb ${enableReflections ? 'on' : 'off'}`} />
              </span>
              <span>{enableReflections ? 'REAL-TIME REFLECTIONS: ON' : 'REFLECTIONS: OFF (MAX FPS)'}</span>
            </button>
          </div>

          <div className="graphics-panel-row">
            <div className="panel-label">
              <Activity size={14} color="#00ffcc" />
              <span>FPS COUNTER:</span>
            </div>
            <button
              className={`deploy-reflection-toggle-btn ${showFps ? 'active' : ''}`}
              style={showFps ? { borderColor: '#00ffcc', color: '#00ffcc' } : {}}
              onClick={() => {
                sounds.playMechanicalClick(2200, 0.03, 0.35);
                if (onToggleFps) onToggleFps(!showFps);
              }}
            >
              <span className="reflection-switch-track" style={showFps ? { background: '#00ffcc' } : {}}>
                <span className={`reflection-switch-thumb ${showFps ? 'on' : 'off'}`} />
              </span>
              <span>{showFps ? 'FPS COUNTER: ON' : 'FPS COUNTER: OFF'}</span>
            </button>
          </div>
        </div>

        {/* Tactical Keybindings Guide */}
        <div className="keybindings-grid">
          <div className="key-item">
            <kbd>WASD</kbd>
            <span>Movement</span>
          </div>
          <div className="key-item">
            <kbd>SHIFT</kbd>
            <span>Sprint</span>
          </div>
          <div className="key-item">
            <kbd>C / CTRL</kbd>
            <span>Slide / Crouch</span>
          </div>
          <div className="key-item">
            <kbd>SPACE</kbd>
            <span>Jump</span>
          </div>
          <div className="key-item">
            <kbd>B</kbd>
            <span>Loadout & AI Menu</span>
          </div>
          <div className="key-item">
            <kbd>1 / 2</kbd>
            <span>Primary / Pistol</span>
          </div>
          <div className="key-item">
            <kbd>L-CLICK</kbd>
            <span>Fire Weapon</span>
          </div>
          <div className="key-item">
            <kbd>R-CLICK</kbd>
            <span>Aim Sights (ADS)</span>
          </div>
          <div className="key-item">
            <kbd>R</kbd>
            <span>Reload</span>
          </div>
          <div className="key-item">
            <kbd>T</kbd>
            <span>Cycle Camos</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {onOpenLoadout && (
            <button
              className="copy-btn"
              style={{ padding: '16px 20px', fontSize: '13px' }}
              onClick={() => {
                sounds.playMechanicalClick(1800, 0.04, 0.4);
                onOpenLoadout();
              }}
            >
              <Briefcase size={16} />
              <span>LOADOUT & ARSENAL [B]</span>
            </button>
          )}

          <button className="deploy-btn" style={{ flex: 1 }} onClick={handleDeployClick}>
            <Crosshair size={18} />
            <span>DEPLOY OPERATIVE</span>
          </button>
        </div>

        <div className="modal-footer-note">
          <ShieldCheck size={12} />
          <span>ZERO-SERVER PEER-TO-PEER WEBRTC MESH // HARDWARE-ACCELERATED RAPIER 3D // COMBAT AI V3.5</span>
        </div>
      </div>
    </div>
  );
}

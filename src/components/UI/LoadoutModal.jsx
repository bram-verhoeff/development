import React, { useState } from 'react';
import { WEAPON_CLASSES, WEAPON_SKINS } from '../Weapon/ProceduralRifle';
import { OPERATIVE_SKINS } from '../Character/RealisticOperative';
import { BOT_DIFFICULTIES } from '../../config/botConfig';
import { sounds } from '../../audio/SoundEngine';
import { Shield, Zap, Crosshair, Award, Check, X, Flame, Users, Skull, Activity, Target, Monitor, Sparkles } from 'lucide-react';
import { GRAPHICS_PRESETS } from '../../config/graphicsConfig';

const PERK_OPTIONS = [
  {
    id: 'lightweight',
    name: 'LIGHTWEIGHT',
    desc: '+15% Sprint Speed & Longer Tactical Slide Distance',
    icon: Zap,
    color: '#00ffcc',
  },
  {
    id: 'quickdraw',
    name: 'QUICKDRAW',
    desc: '+50% Faster Tactical Reload & Fast Weapon Swap',
    icon: Crosshair,
    color: '#f59e0b',
  },
  {
    id: 'flak-jacket',
    name: 'FLAK JACKET',
    desc: 'Heavy Kevlar Armor Plating (150 Max Health)',
    icon: Shield,
    color: '#3b82f6',
  },
];

export function LoadoutModal({
  isOpen,
  onClose,
  selectedWeaponId = 'mk18',
  onSelectWeapon,
  selectedSkinId = 'ghost-specops',
  onSelectSkin,
  selectedPerkId = 'lightweight',
  onSelectPerk,
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
  const [activeTab, setActiveTab] = useState('weapons'); // 'weapons' | 'skins' | 'perks' | 'bots' | 'graphics'

  if (!isOpen) return null;

  const currentWeapon = WEAPON_CLASSES.find((w) => w.id === selectedWeaponId) || WEAPON_CLASSES[0];

  return (
    <div className="loadout-modal-backdrop" onClick={onClose}>
      <div className="loadout-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="loadout-modal-header">
          <div className="loadout-header-title">
            <span className="loadout-tag">TACTICAL ARSENAL & SIMULATION</span>
            <h2>LOADOUT & BOT CONFIG // SECTOR-7</h2>
          </div>
          <button className="loadout-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="loadout-nav-tabs">
          <button
            className={`loadout-tab-btn ${activeTab === 'weapons' ? 'active' : ''}`}
            onClick={() => {
              sounds.playMechanicalClick(1800, 0.03, 0.3);
              setActiveTab('weapons');
            }}
          >
            <Crosshair size={16} /> PRIMARY WEAPON
          </button>
          <button
            className={`loadout-tab-btn ${activeTab === 'skins' ? 'active' : ''}`}
            onClick={() => {
              sounds.playMechanicalClick(1800, 0.03, 0.3);
              setActiveTab('skins');
            }}
          >
            <Flame size={16} /> OPERATIVE SKINS
          </button>
          <button
            className={`loadout-tab-btn ${activeTab === 'perks' ? 'active' : ''}`}
            onClick={() => {
              sounds.playMechanicalClick(1800, 0.03, 0.3);
              setActiveTab('perks');
            }}
          >
            <Award size={16} /> TACTICAL PERKS
          </button>
          <button
            className={`loadout-tab-btn ${activeTab === 'bots' ? 'active' : ''}`}
            onClick={() => {
              sounds.playMechanicalClick(1800, 0.03, 0.3);
              setActiveTab('bots');
            }}
          >
            <Users size={16} /> BOTS & COMBAT AI
          </button>
          <button
            className={`loadout-tab-btn ${activeTab === 'graphics' ? 'active' : ''}`}
            onClick={() => {
              sounds.playMechanicalClick(1800, 0.03, 0.3);
              setActiveTab('graphics');
            }}
          >
            <Monitor size={16} /> GRAPHICS & DISPLAY
          </button>
        </div>

        {/* Tab 1: Weapon Selection */}
        {activeTab === 'weapons' && (
          <div className="loadout-weapons-view">
            <div className="loadout-weapon-list">
              {WEAPON_CLASSES.map((w) => {
                const isSelected = w.id === selectedWeaponId;
                return (
                  <div
                    key={w.id}
                    className={`loadout-weapon-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      sounds.playWeaponSwap();
                      onSelectWeapon(w.id);
                    }}
                  >
                    <div className="card-top-row">
                      <span className="weapon-cat-badge">{w.category}</span>
                      {isSelected && <span className="equipped-badge"><Check size={14} /> EQUIPPED</span>}
                    </div>
                    <div className="weapon-card-name">{w.name}</div>
                    <div className="weapon-caliber">{w.caliber}</div>
                    <div className="weapon-card-meta">
                      <span>{w.rpm} RPM</span>
                      <span>{w.magSize} RNDS</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Weapon Detail Inspector */}
            <div className="loadout-weapon-detail">
              <div className="detail-tag">// WEAPON SPECIFICATIONS</div>
              <h3 className="detail-title">{currentWeapon.name}</h3>
              <p className="detail-caliber">{currentWeapon.caliber} • {currentWeapon.category}</p>

              <div className="stats-bars-container">
                <div className="stat-row">
                  <span className="stat-name">DAMAGE</span>
                  <div className="stat-track">
                    <div className="stat-fill damage" style={{ width: `${currentWeapon.stats.damage}%` }} />
                  </div>
                  <span className="stat-num">{currentWeapon.stats.damage}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">FIRE RATE</span>
                  <div className="stat-track">
                    <div className="stat-fill firerate" style={{ width: `${currentWeapon.stats.fireRate}%` }} />
                  </div>
                  <span className="stat-num">{currentWeapon.rpm} RPM</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">RANGE</span>
                  <div className="stat-track">
                    <div className="stat-fill range" style={{ width: `${currentWeapon.stats.range}%` }} />
                  </div>
                  <span className="stat-num">{currentWeapon.stats.range}m</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">ACCURACY</span>
                  <div className="stat-track">
                    <div className="stat-fill accuracy" style={{ width: `${currentWeapon.stats.accuracy}%` }} />
                  </div>
                  <span className="stat-num">{currentWeapon.stats.accuracy}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-name">MOBILITY</span>
                  <div className="stat-track">
                    <div className="stat-fill mobility" style={{ width: `${currentWeapon.stats.mobility}%` }} />
                  </div>
                  <span className="stat-num">{currentWeapon.stats.mobility}%</span>
                </div>
              </div>

              <div className="optic-badge-row">
                <span className="optic-info">OPTIC: MIL-SPEC CRYSTAL REFLEX / 8.0X TELESCOPIC</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Operative Skins */}
        {activeTab === 'skins' && (
          <div className="loadout-skins-grid">
            {OPERATIVE_SKINS.map((skin) => {
              const isSelected = skin.id === selectedSkinId;
              return (
                <div
                  key={skin.id}
                  className={`skin-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    sounds.playMechanicalClick(2000, 0.04, 0.3);
                    onSelectSkin(skin.id);
                  }}
                >
                  <div className="skin-card-header">
                    <span className="skin-theme-tag" style={{ color: skin.accentColor }}>{skin.theme}</span>
                    {isSelected && <span className="equipped-badge"><Check size={14} /> ACTIVE</span>}
                  </div>
                  <div className="skin-card-name">{skin.name}</div>
                  <div className="skin-color-preview-bar">
                    <div className="swatch" style={{ background: skin.helmetColor }} title="Helmet" />
                    <div className="swatch" style={{ background: skin.vestColor }} title="Plate Carrier" />
                    <div className="swatch" style={{ background: skin.armorPlateColor }} title="Armor" />
                    <div className="swatch" style={{ background: skin.visorColor }} title="Visor" />
                    <div className="swatch" style={{ background: skin.accentColor }} title="Accent" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Tactical Perks */}
        {activeTab === 'perks' && (
          <div className="loadout-perks-grid">
            {PERK_OPTIONS.map((p) => {
              const isSelected = p.id === selectedPerkId;
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  className={`perk-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    sounds.playMechanicalClick(1900, 0.04, 0.4);
                    onSelectPerk(p.id);
                  }}
                >
                  <div className="perk-icon-box" style={{ color: p.color, borderColor: p.color }}>
                    <Icon size={26} />
                  </div>
                  <div className="perk-text">
                    <div className="perk-name" style={{ color: isSelected ? p.color : '#fff' }}>
                      {p.name}
                    </div>
                    <div className="perk-desc">{p.desc}</div>
                  </div>
                  {isSelected && (
                    <div className="perk-selected-badge" style={{ color: p.color }}>
                      <Check size={18} /> ACTIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Bots & Combat AI Settings */}
        {activeTab === 'bots' && (
          <div className="loadout-bots-view">
            {/* Section 1: Squad Size */}
            <div className="bot-settings-block">
              <div className="block-header">
                <Users size={16} color="#00ffcc" />
                <span className="block-title">SIMULATION SQUAD SIZE // ACTIVE BOTS</span>
              </div>
              <p className="block-desc">
                Select the number of AI-controlled cyber-operatives deployed on Sector-7. Bots actively hunt, track, and shoot you with realistic weapon bursts.
              </p>
              <div className="bot-count-selector">
                {[0, 1, 2, 3, 4, 5, 6].map((count) => {
                  const isCurrent = botCount === count;
                  return (
                    <button
                      key={count}
                      className={`bot-count-pill ${isCurrent ? 'active' : ''}`}
                      onClick={() => {
                        sounds.playMechanicalClick(2100, 0.03, 0.35);
                        if (onSelectBotCount) onSelectBotCount(count);
                      }}
                    >
                      <span className="pill-number">{count}</span>
                      <span className="pill-label">{count === 0 ? 'SOLO' : count === 1 ? 'BOT' : 'BOTS'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: AI Difficulty */}
            <div className="bot-settings-block">
              <div className="block-header">
                <Target size={16} color="#ff3344" />
                <span className="block-title">TACTICAL AI DIFFICULTY // COMBAT LETHALITY</span>
              </div>
              <p className="block-desc">
                Adjusts bot perception speed, accuracy rolls, burst fire density, and bullet damage delivered to your operative.
              </p>
              <div className="bot-difficulty-grid">
                {BOT_DIFFICULTIES.map((diff) => {
                  const isSelected = botDifficulty === diff.id;
                  const Icon = diff.icon;
                  return (
                    <div
                      key={diff.id}
                      className={`difficulty-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? diff.color : 'rgba(255, 255, 255, 0.1)',
                      }}
                      onClick={() => {
                        sounds.playMechanicalClick(1900, 0.04, 0.4);
                        if (onSelectBotDifficulty) onSelectBotDifficulty(diff.id);
                      }}
                    >
                      <div className="diff-card-top">
                        <div className="diff-badge" style={{ color: diff.color, borderColor: diff.color }}>
                          <Icon size={14} />
                          <span>{diff.name}</span>
                        </div>
                        {isSelected && (
                          <span className="equipped-badge" style={{ color: diff.color }}>
                            <Check size={14} /> ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="diff-tag">{diff.tag}</div>
                      <p className="diff-desc">{diff.desc}</p>
                      <div className="diff-stats-row">
                        <div className="mini-stat">
                          <span className="stat-k">REACTION:</span>
                          <span className="stat-v" style={{ color: diff.color }}>{diff.reactionTime}s</span>
                        </div>
                        <div className="mini-stat">
                          <span className="stat-k">ACCURACY:</span>
                          <span className="stat-v" style={{ color: diff.color }}>{Math.round(diff.accuracy * 100)}%</span>
                        </div>
                        <div className="mini-stat">
                          <span className="stat-k">DAMAGE:</span>
                          <span className="stat-v" style={{ color: diff.color }}>{diff.damage} HP</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Graphics & Display Settings */}
        {activeTab === 'graphics' && (
          <div className="loadout-graphics-view">
            {/* 1. Quality Presets */}
            <div className="settings-section">
              <div className="section-title-row">
                <Monitor size={18} color="#00ffcc" />
                <h3>GRAPHICS PRESET // RENDERING FIDELITY</h3>
              </div>
              <p className="section-desc">
                Select your rendering quality tier. Affects resolution scale (DPR), shadow resolution, and post-processing passes.
              </p>

              <div className="graphics-preset-grid">
                {GRAPHICS_PRESETS.map((preset) => {
                  const isSelected = graphicsQuality === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`graphics-card ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? preset.color : 'rgba(255, 255, 255, 0.1)',
                      }}
                      onClick={() => {
                        sounds.playMechanicalClick(2000, 0.03, 0.35);
                        if (onSelectGraphicsQuality) onSelectGraphicsQuality(preset.id);
                      }}
                    >
                      <div className="card-top-row">
                        <span className="preset-name" style={{ color: isSelected ? preset.color : '#f8fafc' }}>
                          {preset.name}
                        </span>
                        <span className="preset-badge" style={{ background: `${preset.color}22`, color: preset.color, borderColor: `${preset.color}66` }}>
                          {preset.badge}
                        </span>
                      </div>

                      <div className="preset-specs">{preset.specs}</div>
                      <div className="preset-desc">{preset.description}</div>

                      {isSelected && (
                        <div className="preset-active-status" style={{ color: preset.color }}>
                          <Check size={14} /> ACTIVE PRESET
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Real-Time Planar Reflections */}
            <div className="settings-section reflections-section">
              <div className="reflections-toggle-box">
                <div className="reflections-info">
                  <div className="reflections-title-row">
                    <Sparkles size={18} color="#f59e0b" />
                    <h4>REAL-TIME PLANAR TARMAC REFLECTIONS</h4>
                  </div>
                  <p>
                    Enables real-time PBR planar reflections on the Sector-7 tarmac apron and hangar concrete. Reflects the Mojave sky, storage containers, MRAP tactical vehicles, and moving combatants.
                  </p>
                  <div className="performance-note">
                    {graphicsQuality === 'low'
                      ? 'Status: Automatisch uitgeschakeld in LOW preset (voor extreme 240Hz+ framerates)'
                      : enableReflections
                      ? 'Status: Actief (Stabiele PBR Ray Tracing reflecties 60+ FPS)'
                      : 'Status: Uitgeschakeld (Geen render-target overhead / Maximaal FPS)'}
                  </div>
                </div>

                <button
                  className={`reflections-master-switch ${enableReflections ? 'enabled' : 'disabled'}`}
                  onClick={() => {
                    sounds.playMechanicalClick(2200, 0.04, 0.4);
                    if (onToggleReflections) onToggleReflections(!enableReflections);
                  }}
                >
                  <div className="switch-track">
                    <div className="switch-handle" />
                  </div>
                  <span className="switch-text">{enableReflections ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>
            </div>

            {/* 3. Real-Time Performance HUD (FPS Counter) */}
            <div className="settings-section reflections-section">
              <div className="reflections-toggle-box">
                <div className="reflections-info">
                  <div className="reflections-title-row">
                    <Activity size={18} color="#00ffcc" />
                    <h4>REAL-TIME PERFORMANCE HUD (FPS COUNTER)</h4>
                  </div>
                  <p>
                    Displays high-precision frames-per-second (FPS) and frametime (ms) directly on the tactical top bar. Throttled at 300ms intervals with green/amber/crimson performance health indicators.
                  </p>
                  <div className="performance-note">
                    {showFps
                      ? 'Status: Active on Tactical Top Bar'
                      : 'Status: Disabled (Hidden)'}
                  </div>
                </div>

                <button
                  className={`reflections-master-switch ${showFps ? 'enabled' : 'disabled'}`}
                  style={showFps ? { borderColor: '#00ffcc', background: 'rgba(0, 255, 204, 0.12)', boxShadow: '0 0 15px rgba(0, 255, 204, 0.3)' } : {}}
                  onClick={() => {
                    sounds.playMechanicalClick(2200, 0.04, 0.4);
                    if (onToggleFps) onToggleFps(!showFps);
                  }}
                >
                  <div className="switch-track" style={showFps ? { background: '#00ffcc' } : {}}>
                    <div className="switch-handle" />
                  </div>
                  <span className="switch-text" style={showFps ? { color: '#00ffcc' } : {}}>{showFps ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="loadout-modal-footer">
          <div className="footer-hotkeys">
            <span>[B] TOGGLE MENU</span>
            <span>[1] PRIMARY</span>
            <span>[2] SECONDARY</span>
            <span>[T] CAMO SKIN</span>
          </div>
          <button
            className="equip-confirm-btn"
            onClick={() => {
              sounds.playMechanicalClick(1400, 0.05, 0.5);
              onClose();
            }}
          >
            CONFIRM & DEPLOY
          </button>
        </div>
      </div>
    </div>
  );
}

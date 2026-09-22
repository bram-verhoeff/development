import { Zap, Shield, Crosshair, Skull } from 'lucide-react';

export const BOT_DIFFICULTIES = [
  {
    id: 'recruit',
    name: 'RECRUIT',
    tag: 'CADET AI',
    desc: 'Slow reaction time, low accuracy. Recommended for target practice.',
    reactionTime: 0.95, // seconds before firing when player is in sight
    accuracy: 0.35,     // 35% chance to hit player
    damage: 8,          // Damage per shot
    burstCount: 3,      // 3 rounds per burst
    burstInterval: 1.4, // seconds between bursts
    detectRange: 26,    // meters
    patrolSpeed: 3.5,
    icon: Zap,
    color: '#22c55e',   // Green
  },
  {
    id: 'regular',
    name: 'REGULAR',
    tag: 'STANDARD MIL-SPEC',
    desc: 'Standard tactical AI with balanced aim and military burst fire.',
    reactionTime: 0.55,
    accuracy: 0.55,
    damage: 14,
    burstCount: 4,
    burstInterval: 1.0,
    detectRange: 38,
    patrolSpeed: 4.2,
    icon: Shield,
    color: '#00ffcc',   // Cyan (Default)
  },
  {
    id: 'veteran',
    name: 'VETERAN',
    tag: 'ELITE MERCENARY',
    desc: 'Quick reflexes, high accuracy, aggressive engagement.',
    reactionTime: 0.32,
    accuracy: 0.75,
    damage: 20,
    burstCount: 5,
    burstInterval: 0.7,
    detectRange: 48,
    patrolSpeed: 4.8,
    icon: Crosshair,
    color: '#f59e0b',   // Amber
  },
  {
    id: 'specops',
    name: 'SPEC-OPS',
    tag: 'CYBER-OPERATIVE',
    desc: 'Near-instant target acquisition and deadly pinpoint accuracy. Lethal.',
    reactionTime: 0.18,
    accuracy: 0.88,
    damage: 26,
    burstCount: 6,
    burstInterval: 0.5,
    detectRange: 58,
    patrolSpeed: 5.4,
    icon: Skull,
    color: '#ef4444',   // Red
  },
];

export const BOT_ROSTER = [
  { id: 'bot-alpha', name: 'CYBER-MERC // ALPHA', skinId: 'cyber-ronin', wpOffset: 0 },
  { id: 'bot-bravo', name: 'GHOST // BRAVO', skinId: 'ghost-specops', wpOffset: 5 },
  { id: 'bot-charlie', name: 'VIPER // CHARLIE', skinId: 'desert-viper', wpOffset: 2 },
  { id: 'bot-delta', name: 'HAZARD // DELTA', skinId: 'toxic-hazard', wpOffset: 7 },
  { id: 'bot-echo', name: 'SHADOW // ECHO', skinId: 'shadow-stealth', wpOffset: 4 },
  { id: 'bot-foxtrot', name: 'SPECTRE // FOXTROT', skinId: 'ghost-specops', wpOffset: 8 },
];

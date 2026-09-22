import React from 'react';

export function DamageOverlay({ health }) {
  if (health >= 100) return null;

  // Vignette intensity increases as health drops below 50
  const damageFactor = Math.max(0, (50 - health) / 50);
  const isCritical = health < 25;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
        boxShadow: `inset 0 0 ${damageFactor * 120}px rgba(220, 20, 40, ${damageFactor * 0.75})`,
        animation: isCritical ? 'pulseHeartbeat 1.0s infinite ease-in-out' : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Low Health Blood Splatters & Static */}
      {isCritical && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle, transparent 40%, rgba(180, 0, 0, 0.4) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
      )}
    </div>
  );
}

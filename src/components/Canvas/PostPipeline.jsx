import React, { Component } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing';
import * as THREE from 'three';

class PostErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    console.warn('PostPipeline encountered a WebGL/shader error, gracefully falling back to standard rendering:', error);
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn('PostPipeline error info:', error, info);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function PostPipeline({
  isAiming,
  enabled = true,
  bloomIntensity = 0.85,
  chromaticAberration = true,
  vignette = true,
}) {
  if (!enabled) return null;

  return (
    <PostErrorBoundary>
      <EffectComposer disableNormalPass multisampling={0}>
        {/* Bloom tuned for glowing reticles, muzzle flash, and tracers */}
        {bloomIntensity > 0 && (
          <Bloom
            luminanceThreshold={1.0}
            luminanceSmoothing={0.15}
            intensity={bloomIntensity}
            mipmapBlur
          />
        )}

        {/* Subtle Chromatic Aberration at periphery for tactical camera realism */}
        {chromaticAberration && (
          <ChromaticAberration
            offset={new THREE.Vector2(0.0006, 0.0006)}
            radialModulation={true}
            modulationOffset={0.25}
          />
        )}

        {/* Tactical Vignette */}
        {vignette && (
          <Vignette
            eskil={false}
            offset={0.2}
            darkness={0.65}
          />
        )}
      </EffectComposer>
    </PostErrorBoundary>
  );
}

// No-op VisualEffects to avoid external dependency errors.
// To enable postprocessing, install:
//   npm i @react-three/postprocessing postprocessing
// and replace this component with one importing EffectComposer, Bloom, etc.
import React from 'react';
import { useStore } from '../../store/store';

export const VisualEffects: React.FC = () => {
  const ui = useStore((s) => s.ui);
  // Keep signature and gating consistent; render nothing for now.
  if (ui.lowPower || ui.reducedMotion || !ui.visualFX) return null;
  return null;
};
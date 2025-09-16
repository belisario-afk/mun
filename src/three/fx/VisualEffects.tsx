import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/store';
import { useFps } from '../../utils/fps';

type PPExports = {
  EffectComposer: any;
  Bloom: any;
  Noise: any;
  Vignette: any;
  SMAA: any;
  ChromaticAberration: any;
  BlendFunction: any;
};

const dynamicImport = (m: string) =>
  (Function('m', 'return import(m)') as (m: string) => Promise<any>)(m);

export const VisualEffects: React.FC = () => {
  const ui = useStore((s) => s.ui);
  const fps = useFps();
  const [pp, setPp] = useState<PPExports | null>(null);

  const level = useMemo(() => {
    if (fps <= 0) return 'good';
    if (fps < 36) return 'poor';
    if (fps < 54) return 'ok';
    return 'good';
  }, [fps]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (ui.lowPower || ui.reducedMotion || !ui.visualFX) {
        setPp(null);
        return;
      }
      try {
        const modA = '@react-three' + '/postprocessing';
        const modB = 'post' + 'processing';
        const [ppMod, postMod] = await Promise.all([dynamicImport(modA), dynamicImport(modB)]);
        if (!mounted) return;
        setPp({
          EffectComposer: ppMod.EffectComposer,
          Bloom: ppMod.Bloom,
          Noise: ppMod.Noise,
          Vignette: ppMod.Vignette,
          SMAA: ppMod.SMAA,
          ChromaticAberration: ppMod.ChromaticAberration,
          BlendFunction: postMod.BlendFunction
        });
      } catch {
        // Libraries not installed -> no-op
        setPp(null);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [ui.lowPower, ui.reducedMotion, ui.visualFX]);

  if (ui.lowPower || ui.reducedMotion || !ui.visualFX || !pp) return null;

  const bloomIntensity = level === 'good' ? 0.38 : level === 'ok' ? 0.26 : 0.15;
  const chroma = level === 'good' ? [0.0007, 0.0006] : level === 'ok' ? [0.0005, 0.0004] : [0.0003, 0.00025];
  const noiseOpacity = level === 'good' ? 0.08 : level === 'ok' ? 0.06 : 0.04;

  const { EffectComposer, Bloom, Noise, Vignette, SMAA, ChromaticAberration, BlendFunction } = pp;

  return (
    <EffectComposer multisampling={0} autoClear={false}>
      <SMAA />
      <Bloom luminanceThreshold={0.15} luminanceSmoothing={0.2} intensity={bloomIntensity} />
      <ChromaticAberration offset={chroma} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={noiseOpacity} />
      <Vignette eskil={false} offset={0.25} darkness={0.5} />
    </EffectComposer>
  );
};
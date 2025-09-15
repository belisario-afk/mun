import { useStore } from '../../store/store';

export interface Intent {
  intent:
    | 'set_source'
    | 'set_theme'
    | 'open_map'
    | 'reduce_particles'
    | 'status_report'
    | 'next_track'
    | 'play_pause'
    | 'noop';
  args: Record<string, any>;
  say: string;
}

export function intentFromText(text: string): Intent {
  const t = text.toLowerCase();
  const st = useStore.getState();
  const say = (s: string): Intent => ({ intent: 'noop', args: {}, say: s });

  if (/switch.*radio|to radio/.test(t)) {
    st.actions.setSource('radio');
    return { intent: 'set_source', args: { source: 'radio' }, say: 'Source switched to Radio.' };
  }
  if (/switch.*local|to local/.test(t)) {
    st.actions.setSource('local');
    return { intent: 'set_source', args: { source: 'local' }, say: 'Source switched to Local.' };
  }
  if (/switch.*spotify|to spotify/.test(t)) {
    st.actions.setSource('spotify');
    return {
      intent: 'set_source',
      args: { source: 'spotify' },
      say: 'Source switched to Spotify. Standing by.'
    };
  }
  if (/set theme.*tactic|tactical/.test(t)) {
    st.actions.setTheme('tacticalStealth');
    return { intent: 'set_theme', args: { theme: 'tacticalStealth' }, say: 'Theme set to tactical.' };
  }
  if (/set theme.*spy|default/.test(t)) {
    st.actions.setTheme('spyTech');
    return { intent: 'set_theme', args: { theme: 'spyTech' }, say: 'Theme set to spy-tech.' };
  }
  if (/open map|map view/.test(t)) {
    return { intent: 'open_map', args: {}, say: 'Map opened.' };
  }
  if (/reduce particles|low power/.test(t)) {
    st.actions.setLowPower(true);
    return { intent: 'reduce_particles', args: { lowPower: true }, say: 'Particle density reduced.' };
  }
  if (/status/.test(t)) {
    const src = st.player.source;
    const speed = st.sensors.speedKmh.toFixed(0);
    return {
      intent: 'status_report',
      args: {},
      say: `Status: source ${src}, speed ${speed} km/h. All systems nominal.`
    };
  }
  if (/next track|skip/.test(t)) {
    return { intent: 'next_track', args: {}, say: 'Skipping to next track.' };
  }
  if (/pause|play/.test(t)) {
    const play = /play/.test(t) && !/pause/.test(t);
    st.actions.setPlayState(play);
    return { intent: 'play_pause', args: { play }, say: play ? 'Playing.' : 'Paused.' };
  }

  return say('Acknowledged.');
}
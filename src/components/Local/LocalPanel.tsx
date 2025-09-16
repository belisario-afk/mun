import React, { useEffect, useRef, useState } from 'react';
import {
  addLocalFiles,
  getCurrentLocal,
  getLocalTracks,
  pauseLocal,
  playSample,
  setCurrentLocal,
  stopLocal
} from '../../audio/local/local';
import { useStore } from '../../store/store';
import { hasUserGestured, waitForFirstGesture } from '../../utils/userGesture';

export const LocalPanel: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const source = useStore((s) => s.player.source);
  const playing = useStore((s) => s.player.playing);
  const [tracks, setTracks] = useState(getLocalTracks());
  const [current, setCurrent] = useState(getCurrentLocal());
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh() {
    setTracks(getLocalTracks());
    setCurrent(getCurrentLocal());
  }

  useEffect(() => {
    refresh();
  }, [source, playing]);

  async function handlePlay() {
    actions.setSource('local');
    if (!hasUserGestured()) await waitForFirstGesture();
    await playSample();
    refresh();
  }

  function handlePause() {
    pauseLocal();
    refresh();
  }

  function handleStop() {
    stopLocal();
    refresh();
  }

  function onFilesChosen(files: FileList | null) {
    if (!files || files.length === 0) return;
    addLocalFiles(files);
    refresh();
  }

  return (
    <div className="absolute left-1/2 bottom-20 translate-x-[220px] w-[360px] bg-black/60 rounded p-3 pointer-events-auto space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">Local</div>
        <div className="text-xs opacity-70">{source === 'local' && playing ? 'Playing' : 'Idle'}</div>
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-2 bg-slate-800 rounded"
          onClick={() => fileInput.current?.click()}
          title="Add local files"
        >
          Add files
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="audio/*"
          className="hidden"
          onChange={(e) => onFilesChosen(e.target.files)}
        />
        <button className="px-3 py-2 bg-slate-800 rounded flex-1" onClick={handlePlay}>
          Play
        </button>
        <button className="px-3 py-2 bg-slate-800 rounded" onClick={handlePause}>
          Pause
        </button>
        <button className="px-3 py-2 bg-slate-800 rounded" onClick={handleStop}>
          Stop
        </button>
      </div>

      <div className="max-h-60 overflow-auto space-y-1 pr-1">
        {tracks.map((t) => (
          <button
            key={t.id}
            className={`w-full text-left px-2 py-2 rounded ${
              current?.id === t.id ? 'bg-emerald-800/70' : 'bg-slate-800/60 hover:bg-slate-700/60'
            }`}
            onClick={() => {
              setCurrentLocal(t.id);
              refresh();
            }}
            title={t.name}
          >
            <div className="text-sm truncate">{t.name}</div>
            <div className="text-[11px] opacity-70 truncate">Local file</div>
          </button>
        ))}
        {tracks.length === 0 && <div className="text-xs opacity-70 px-1 py-2">No local files selected</div>}
      </div>
    </div>
  );
};
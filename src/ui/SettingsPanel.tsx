import { useEffect, useState } from 'react';
import { setSoundSettings, soundSettings } from '../audio/sound';
import { exportCode, importCode } from '../game/save';
import type { SaveData } from '../game/types';
import type { Updater } from './App';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

/** Sound switches, install-as-app, and moving a save between devices. */
export function SettingsPanel({ save, update }: { save: SaveData; update: Updater }) {
  const [sound, setSound] = useState(soundSettings);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const toggle = (key: 'music' | 'sfx') => {
    const next = { ...sound, [key]: !sound[key] };
    setSound(next);
    setSoundSettings(next);
  };

  const copy = async () => {
    const text = exportCode(save);
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Save code copied. Paste it on your other device.');
    } catch {
      setMessage('Copy the code below and paste it on your other device.');
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(save)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'dragonvision-save.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const load = (text: string) => {
    let next: SaveData;
    try {
      next = importCode(text);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read that save.');
      return;
    }
    if (!window.confirm('Replace your current progress with this save? This cannot be undone.')) return;
    update(() => next);
    setCode('');
    setMessage('Save loaded!');
  };

  return (
    <section className="panel settings">
      <h3>Settings</h3>
      <div className="button-row">
        <button className={`btn small ${sound.music ? 'primary' : ''}`} onClick={() => toggle('music')}>
          Music {sound.music ? 'ON' : 'OFF'}
        </button>
        <button className={`btn small ${sound.sfx ? 'primary' : ''}`} onClick={() => toggle('sfx')}>
          Sound effects {sound.sfx ? 'ON' : 'OFF'}
        </button>
        {install && (
          <button
            className="btn small primary"
            onClick={async () => {
              await install.prompt();
              setInstall(null);
            }}
          >
            Install app
          </button>
        )}
      </div>
      {!install && (
        <p className="muted small-text">
          To play like an app: on a phone, use your browser's "Add to Home Screen". It works offline once installed.
        </p>
      )}

      <h3>Move your save</h3>
      <p className="muted small-text">
        Saves live on this device. To continue on another phone or computer, copy your save code (or download the file) and load
        it there.
      </p>
      <div className="button-row">
        <button className="btn small" onClick={copy}>
          Copy save code
        </button>
        <button className="btn small" onClick={download}>
          Download save file
        </button>
        <label className="btn small file-btn">
          Load save file
          <input
            type="file"
            accept="application/json,.json,.txt"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) load(await file.text());
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <textarea
        className="save-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Paste a save code here to load it"
        rows={3}
      />
      <div className="button-row">
        <button className="btn small primary" disabled={!code.trim()} onClick={() => load(code)}>
          Load pasted code
        </button>
      </div>
      {message && <p className="small-text">{message}</p>}
    </section>
  );
}

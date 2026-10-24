import { useState } from 'react';
import { loadPreset, presetTeam, renamePreset, savePreset, teamPresets } from '../game/presets';
import { unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';

interface Props {
  save: SaveData;
  update: Updater;
  toast: (message: string) => void;
}

export function TeamPresets({ save, update, toast }: Props) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const presets = teamPresets(save);

  const load = (i: number) => {
    const { skipped } = presetTeam(save, i);
    if (update((s) => loadPreset(s, i))) {
      toast(skipped > 0 ? `Loaded ${presets[i].name} (${skipped} fighter${skipped === 1 ? '' : 's'} unavailable)` : `Loaded ${presets[i].name}`);
    }
  };

  const commitName = (i: number) => {
    if (update((s) => renamePreset(s, i, draft))) setEditing(null);
  };

  return (
    <section className="panel team-presets">
      <span className="fx-eyebrow">QUICK SWAP</span>
      <h3>Team presets</h3>
      <div className="preset-list">
        {presets.map((p, i) => {
          const members = p.team.flatMap((uid) => {
            const u = uid ? save.units.find((x) => x.uid === uid) : undefined;
            return u ? [unitName(u)] : [];
          });
          return (
            <div key={i} className="preset-row">
              {editing === i ? (
                <form
                  className="preset-name"
                  onSubmit={(e) => {
                    e.preventDefault();
                    commitName(i);
                  }}
                >
                  <input value={draft} maxLength={20} autoFocus aria-label="Preset name" onChange={(e) => setDraft(e.target.value)} />
                  <button className="btn small" type="submit">OK</button>
                </form>
              ) : (
                <button
                  className="btn ghost small preset-name"
                  title="Rename"
                  onClick={() => {
                    setDraft(p.name);
                    setEditing(i);
                  }}
                >
                  {p.name} ✎
                </button>
              )}
              <span className="muted small-text preset-members">{members.length ? members.join(', ') : 'Empty'}</span>
              <div className="button-row">
                <button className="btn small" onClick={() => update((s) => savePreset(s, i)) && toast(`Saved current team as ${p.name}`)}>
                  Save
                </button>
                <button className="btn small primary" disabled={members.length === 0} onClick={() => load(i)}>
                  Load
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

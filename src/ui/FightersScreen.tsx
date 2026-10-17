import { useState } from 'react';
import { MAX_TEAM_SIZE } from '../game/balance';
import { checkEvolve, power, teamUnits, toggleTeamMember, unitName } from '../game/progression';
import { getFamily } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  toast: (message: string) => void;
  onOpen: (uid: string) => void;
}

type Sort = 'power' | 'level' | 'star' | 'name';

export function FightersScreen({ save, update, toast, onOpen }: Props) {
  const [sort, setSort] = useState<Sort>('power');
  const team = teamUnits(save);

  const units = [...save.units].sort((a, b) => {
    if (sort === 'name') return unitName(a).localeCompare(unitName(b)) || b.level - a.level;
    if (sort === 'level') return b.level - a.level;
    if (sort === 'star') return b.star - a.star || b.level - a.level;
    return power(b.familyId, b.star, b.level) - power(a.familyId, a.star, a.level);
  });

  const toggle = (uid: string) => {
    const result = toggleTeamMember(save, uid);
    if (result.ok) update(() => result.save);
    else toast(result.reason);
  };

  return (
    <div className="fighters">
      <section className="panel">
        <div className="section-head">
          <h2>
            Team {team.length}/{MAX_TEAM_SIZE}
          </h2>
          <span className="muted">One version per fighter</span>
        </div>
        <div className="team-row">
          {Array.from({ length: MAX_TEAM_SIZE }, (_, i) => team[i]).map((u, i) =>
            u ? (
              <button key={u.uid} className="team-slot filled" onClick={() => onOpen(u.uid)}>
                <Sprite familyId={u.familyId} star={u.star} size={56} />
                <span>{unitName(u)}</span>
                <small>
                  Lv {u.level} <Stars star={u.star} />
                </small>
              </button>
            ) : (
              <div key={`empty-${i}`} className="team-slot">
                empty
              </div>
            ),
          )}
        </div>
      </section>

      <div className="section-head">
        <h2>Collection ({save.units.length})</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort fighters">
          <option value="power">Power</option>
          <option value="level">Level</option>
          <option value="star">Stars</option>
          <option value="name">Name</option>
        </select>
      </div>

      <div className="unit-grid">
        {units.map((u) => {
          const inTeam = save.team.includes(u.uid);
          const canEvolve = checkEvolve(save, u.uid).ok;
          return (
            <div key={u.uid} className={`unit-card ${inTeam ? 'in-team' : ''}`}>
              <button className="unit-open" onClick={() => onOpen(u.uid)}>
                <Sprite familyId={u.familyId} star={u.star} size={64} />
                <div className="unit-name">{unitName(u)}</div>
                <div className="unit-meta">
                  Lv {u.level} <Stars star={u.star} />
                </div>
                <div className="unit-family">{getFamily(u.familyId).title}</div>
                {canEvolve && <span className="badge">EVOLVE</span>}
              </button>
              <button className={`btn small ${inTeam ? '' : 'primary'}`} onClick={() => toggle(u.uid)}>
                {inTeam ? 'Remove' : 'Add to team'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

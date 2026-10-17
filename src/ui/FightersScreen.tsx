import { useState } from 'react';
import { checkEvolve, moveTeamMember, power, toggleTeamMember, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { FighterCard } from './FighterCard';
import { TeamArena } from './TeamArena';

interface Props {
  save: SaveData;
  update: Updater;
  toast: (message: string) => void;
  onOpen: (uid: string) => void;
}

type Sort = 'power' | 'level' | 'star' | 'name';

export function FightersScreen({ save, update, toast, onOpen }: Props) {
  const [sort, setSort] = useState<Sort>('power');

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
      <TeamArena save={save} onOpen={onOpen} onMove={(from, to) => update((s) => moveTeamMember(s, from, to))} />

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
          return (
            <FighterCard
              key={u.uid}
              familyId={u.familyId}
              star={u.star}
              level={u.level}
              highlight={inTeam}
              badge={checkEvolve(save, u.uid).ok ? 'EVOLVE' : undefined}
              onClick={() => onOpen(u.uid)}
            >
              <button className={`btn small card-action ${inTeam ? '' : 'primary'}`} onClick={() => toggle(u.uid)}>
                {inTeam ? 'Remove' : 'Add to team'}
              </button>
            </FighterCard>
          );
        })}
      </div>
    </div>
  );
}

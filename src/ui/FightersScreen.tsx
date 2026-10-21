import { useState } from 'react';
import { checkEvolve, evolveUnit, moveTeamMember, power, toggleTeamMember, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { FighterCard } from './FighterCard';
import { TeamArena } from './TeamArena';
import { collectionCap } from '../game/upgrades';

interface Props {
  save: SaveData;
  update: Updater;
  toast: (message: string) => void;
  onOpen: (uid: string) => void;
}

type Sort = 'power' | 'level' | 'star' | 'name';

const INITIAL_SHOWN = 10;

/** Gear equipped to a unit: any slot is non-null. */
function hasGearEquipped(unit: { gear?: Partial<Record<string, string>> }): boolean {
  return unit.gear ? Object.values(unit.gear).some(Boolean) : false;
}

/** Any unequipped gear in inventory that could go to this unit. */
function canEquipGear(save: SaveData, unitUid: string): boolean {
  const unit = save.units.find((u) => u.uid === unitUid);
  if (!unit) return false;
  const equippedIds = new Set(
    save.units.flatMap((u) => Object.values(u.gear ?? {})).filter(Boolean) as string[],
  );
  return save.items.some((item) => !equippedIds.has(item.id));
}

/** Has unspent awakening points: any awakened node array is shorter than available nodes. */
function hasAwakeningPoints(save: SaveData, uid: string): boolean {
  const unit = save.units.find((u) => u.uid === uid);
  if (!unit) return false;
  // If awakened length is 0 and star > 1, there may be available nodes.
  return (unit.awakened?.length ?? 0) === 0 && unit.star > 1;
}

export type NotifierColor = 'red' | 'gold' | 'blue' | null;

export function notifierDot(save: SaveData, uid: string): NotifierColor {
  const inTeam = save.team.includes(uid);
  if (inTeam && checkEvolve(save, uid).ok) return 'red';
  if (canEquipGear(save, uid)) return 'gold';
  if (hasAwakeningPoints(save, uid)) return 'blue';
  return null;
}

export function FightersScreen({ save, update, toast, onOpen }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<Sort>('power');

  const cap = collectionCap(save);

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

  const evolveAll = () => {
    let count = 0;
    update((s) => {
      let current = s;
      for (const u of current.units) {
        const inTeam = current.team.includes(u.uid);
        const geared = hasGearEquipped(u);
        if (!inTeam && !geared && checkEvolve(current, u.uid).ok) {
          try {
            current = evolveUnit(current, u.uid);
            count++;
          } catch {
            // skip if requirements changed mid-loop
          }
        }
      }
      if (count === 0) throw new Error('No fighters can be evolved right now');
      return current;
    });
    if (count > 0) toast(`Evolved ${count} fighter${count === 1 ? '' : 's'}`);
  };

  const shown = showAll ? units : units.slice(0, INITIAL_SHOWN);

  return (
    <div className="fighters">
      <TeamArena save={save} onOpen={onOpen} onMove={(from, to) => update((s) => moveTeamMember(s, from, to))} />

      <div className="section-head">
        <h2>Collection ({save.units.length}/{cap})</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn small" onClick={evolveAll}>Evolve All</button>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort fighters">
            <option value="power">Power</option>
            <option value="level">Level</option>
            <option value="star">Stars</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>
      {save.units.length >= cap && (
        <p className="muted" style={{ padding: '0 16px 8px', color: '#ff8866' }}>
          Collection full ({cap}/{cap}) — upgrade the Upgrades House or manage fighters.
        </p>
      )}

      <div className="unit-grid">
        {shown.map((u) => {
          const inTeam = save.team.includes(u.uid);
          const dot = notifierDot(save, u.uid);
          return (
            <FighterCard
              key={u.uid}
              familyId={u.familyId}
              star={u.star}
              level={u.level}
              highlight={inTeam}
              badge={checkEvolve(save, u.uid).ok ? 'EVOLVE' : undefined}
              notifierDot={dot}
              onClick={() => onOpen(u.uid)}
            >
              <button className={`btn small card-action ${inTeam ? '' : 'primary'}`} onClick={() => toggle(u.uid)}>
                {inTeam ? 'Remove' : 'Add to team'}
              </button>
            </FighterCard>
          );
        })}
      </div>
      <div className="collection-more">
        <p className="muted">Showing {shown.length} of {units.length} fighters</p>
        {units.length > INITIAL_SHOWN && (
          <button className="btn primary" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer' : `Show all ${units.length} fighters`}
          </button>
        )}
      </div>
    </div>
  );
}

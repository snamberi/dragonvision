import { useEffect, useState } from 'react';
import { checkEvolve, moveTeamMember, power, toggleTeamMember, unitName } from '../game/progression';
import { type EvolvePreview, type LevelPlan, applyTeamLevels, autoFillTeam, planTeamLevels, previewEvolveAll, toggleLock } from '../game/teamTools';
import { type Role, getFamily, roleFor } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { FighterCard } from './FighterCard';
import { TeamArena } from './TeamArena';
import { TeamPresets } from './TeamPresets';
import { masteryAuraClass } from '../game/mastery';
import { collectionCap } from '../game/upgrades';
import { levelCap } from '../game/balance';

interface Props {
  save: SaveData;
  update: Updater;
  toast: (message: string) => void;
  onOpen: (uid: string) => void;
}

type Sort = 'power' | 'level' | 'star' | 'name';

interface Filters {
  roles: Role[];
  minStar: number;
  canEvolve: boolean;
  hasGear: boolean;
  notOnTeam: boolean;
  search: string;
}

const NO_FILTERS: Filters = { roles: [], minStar: 1, canEvolve: false, hasGear: false, notOnTeam: false, search: '' };
const ROLES: Role[] = ['Tank', 'Assassin', 'Blaster', 'Drainer', 'Support'];
const STAR_STEPS = [1, 3, 5, 10, 15, 20];
const FILTER_KEY = 'dragonvision.fighterFilters';
const UNDO_MS = 10_000;

function loadFilters(): Filters {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    return raw ? { ...NO_FILTERS, ...JSON.parse(raw) } : NO_FILTERS;
  } catch {
    return NO_FILTERS;
  }
}

const INITIAL_SHOWN = 10;

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
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const [evolvePlan, setEvolvePlan] = useState<EvolvePreview | null>(null);
  const [levelPlan, setLevelPlan] = useState<LevelPlan | null>(null);
  const [undo, setUndo] = useState<{ before: SaveData; label: string } | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_KEY, JSON.stringify(filters));
    } catch {
      // storage can be unavailable; filters still work for this visit
    }
  }, [filters]);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(id);
  }, [undo]);

  const cap = collectionCap(save);
  const setFilter = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const filtersOn = JSON.stringify(filters) !== JSON.stringify(NO_FILTERS);

  const matches = (u: SaveData['units'][number]) => {
    const inTeam = save.team.includes(u.uid);
    if (filters.roles.length && !filters.roles.includes(roleFor(getFamily(u.familyId)))) return false;
    if (u.star < filters.minStar) return false;
    if (filters.canEvolve && !checkEvolve(save, u.uid).ok) return false;
    if (filters.hasGear && !Object.values(u.gear ?? {}).some(Boolean)) return false;
    if (filters.notOnTeam && inTeam) return false;
    const q = filters.search.trim().toLowerCase();
    return !q || unitName(u).toLowerCase().includes(q);
  };

  // Team fighters stay pinned on top in pad order, whatever the sort.
  const teamOrder = (uid: string) => { const i = save.team.indexOf(uid); return i < 0 ? Infinity : i; };
  const units = save.units.filter(matches).sort((a, b) => {
    const pinned = teamOrder(a.uid) - teamOrder(b.uid);
    if (pinned) return pinned;
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

  const autoFill = () => {
    const result = autoFillTeam(save);
    if (result.added === 0) {
      toast('No free fighters to add — the team is full or everyone is busy.');
      return;
    }
    update(() => result.save);
    toast(`Added ${result.added} fighter${result.added === 1 ? '' : 's'} to the team`);
  };

  const openLevelPlan = () => {
    const plan = planTeamLevels(save);
    if (plan.cost === 0) {
      toast('Nothing to level: the team is at its level walls or coins are short.');
      return;
    }
    setLevelPlan(plan);
  };

  const confirmLevels = () => {
    if (!levelPlan) return;
    const before = save;
    update((s) => applyTeamLevels(s, levelPlan));
    setUndo({ before, label: `Spent ${levelPlan.cost.toLocaleString()} coins on levels` });
    setLevelPlan(null);
  };

  const openEvolvePlan = () => {
    const plan = previewEvolveAll(save);
    if (plan.count === 0) {
      toast('No fighters can be evolved right now');
      return;
    }
    setEvolvePlan(plan);
  };

  const confirmEvolve = () => {
    if (!evolvePlan) return;
    const before = save;
    const plan = previewEvolveAll(save);
    update(() => plan.after);
    setUndo({ before, label: `Evolved ${plan.count} time${plan.count === 1 ? '' : 's'}` });
    setEvolvePlan(null);
  };

  const shown = showAll ? units : units.slice(0, INITIAL_SHOWN);

  return (
    <div className="fighters">
      <TeamArena save={save} onOpen={onOpen} onMove={(from, to) => update((s) => moveTeamMember(s, from, to))} onRemove={toggle} />
      <div className="team-tools">
        <button className="btn small" onClick={autoFill}>Auto-fill team</button>
        <button className="btn small" onClick={openLevelPlan}>Level team to cap</button>
      </div>
      <TeamPresets save={save} update={update} toast={toast} />

      <div className="section-head">
        <h2>Collection ({save.units.length}/{cap})</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn small" onClick={openEvolvePlan}>Evolve All</button>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort fighters">
            <option value="power">Power</option>
            <option value="level">Level</option>
            <option value="star">Stars</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="collection-filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Search by name"
          aria-label="Search fighters by name"
          value={filters.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <div className="filter-chips" role="group" aria-label="Filter by class">
          {ROLES.map((r) => {
            const on = filters.roles.includes(r);
            return (
              <button key={r} className={`chip-btn ${on ? 'on' : ''}`} aria-pressed={on}
                onClick={() => setFilter({ roles: on ? filters.roles.filter((x) => x !== r) : [...filters.roles, r] })}>
                {r}
              </button>
            );
          })}
        </div>
        <div className="filter-chips">
          <select value={filters.minStar} onChange={(e) => setFilter({ minStar: Number(e.target.value) })} aria-label="Minimum stars">
            {STAR_STEPS.map((n) => <option key={n} value={n}>{n === 1 ? 'Any ★' : `${n}★+`}</option>)}
          </select>
          {([['canEvolve', 'Can evolve'], ['hasGear', 'Has gear'], ['notOnTeam', 'Not on team']] as const).map(([key, label]) => (
            <button key={key} className={`chip-btn ${filters[key] ? 'on' : ''}`} aria-pressed={filters[key]} onClick={() => setFilter({ [key]: !filters[key] })}>
              {label}
            </button>
          ))}
          {filtersOn && <button className="chip-btn clear" onClick={() => setFilters(NO_FILTERS)}>Clear</button>}
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
              className={masteryAuraClass(u)}
              badge={checkEvolve(save, u.uid).ok ? 'EVOLVE' : undefined}
              notifierDot={dot}
              onClick={() => onOpen(u.uid)}
            >
              <div className="card-actions">
                <button className={`btn small card-action ${inTeam ? '' : 'primary'}`} onClick={() => toggle(u.uid)}>
                  {inTeam ? 'Remove' : 'Add to team'}
                </button>
                <button
                  className={`btn small card-lock ${u.locked ? 'on' : ''}`}
                  aria-pressed={Boolean(u.locked)}
                  aria-label={u.locked ? `Unlock ${unitName(u)}` : `Lock ${unitName(u)}`}
                  title={u.locked ? 'Locked: never used as a copy or sold' : 'Lock'}
                  onClick={() => update((s) => toggleLock(s, u.uid))}
                >
                  {u.locked ? '🔒' : '🔓'}
                </button>
              </div>
            </FighterCard>
          );
        })}
      </div>
      <div className="collection-more">
        <p className="muted">Showing {shown.length} of {units.length} fighters{filtersOn ? ` (filtered from ${save.units.length})` : ''}</p>
        {units.length > INITIAL_SHOWN && (
          <button className="btn primary" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show fewer' : `Show all ${units.length} fighters`}
          </button>
        )}
      </div>

      {evolvePlan && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Evolve All preview" onClick={() => setEvolvePlan(null)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            <h3>Evolve All</h3>
            <p className="muted">
              {evolvePlan.count} evolution{evolvePlan.count === 1 ? '' : 's'} · uses {evolvePlan.copiesUsed} cop{evolvePlan.copiesUsed === 1 ? 'y' : 'ies'}
              {evolvePlan.shardsUsed > 0 ? ` and ${evolvePlan.shardsUsed} shard${evolvePlan.shardsUsed === 1 ? '' : 's'}` : ''}. Team, geared and locked fighters are never used up.
            </p>
            <ul className="plan-list">
              {evolvePlan.steps.map((st) => (
                <li key={st.uid}>
                  {unitName({ familyId: st.familyId, star: st.to })}: {st.from}★ → {st.to}★{save.team.includes(st.uid) ? ' · team' : ''}
                </li>
              ))}
            </ul>
            <div className="button-row">
              <button className="btn" onClick={() => setEvolvePlan(null)}>Cancel</button>
              <button className="btn primary" onClick={confirmEvolve}>Evolve</button>
            </div>
          </div>
        </div>
      )}

      {levelPlan && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Level team preview" onClick={() => setLevelPlan(null)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            <h3>Level team to cap</h3>
            <p className="muted">Costs {levelPlan.cost.toLocaleString()} coins of your {save.coins.toLocaleString()}.</p>
            <ul className="plan-list">
              {Object.entries(levelPlan.levels).map(([uid, level]) => {
                const u = save.units.find((x) => x.uid === uid)!;
                return (
                  <li key={uid}>
                    {unitName(u)}: Lv {u.level} → {level}{level >= levelCap(u.star) ? ' (cap)' : ''}
                  </li>
                );
              })}
            </ul>
            <div className="button-row">
              <button className="btn" onClick={() => setLevelPlan(null)}>Cancel</button>
              <button className="btn primary" onClick={confirmLevels}>Level up</button>
            </div>
          </div>
        </div>
      )}

      {undo && (
        <div className="undo-bar" role="status">
          <span>{undo.label}</span>
          <button className="btn small" onClick={() => { update(() => undo.before); setUndo(null); }}>Undo</button>
        </div>
      )}
    </div>
  );
}

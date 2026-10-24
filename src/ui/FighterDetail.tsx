import { PixelIcon } from './PixelIcon';
import { toggleLock } from '../game/teamTools';
import { equipSkin, equippedSkin, skinsFor } from '../game/skins';
import { useState } from 'react';
import { MAX_LEVEL, MAX_STARS, RESET_GEM_COST, levelCap, starMilestoneBonus } from '../game/balance';
import { type Bonus, describeBonus } from '../game/bonus';
import { MAX_MASTERY, masteryAuraClass, masteryBonus, masteryProgress } from '../game/mastery';
import {
  affordableLevels,
  canReset,
  checkEvolve,
  evolveUnit,
  freeLevel,
  isTraining,
  power,
  purchasedLevels,
  resetUnit,
  statsFor,
  unitName,
  upgradeCost,
  upgradeUnit,
} from '../game/progression';
import { BEATS, combosWith, formForStar, getFamily, roleFor } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { AwakeningTree } from './AwakeningTree';
import { GearSlots } from './GearSlots';
import { Sprite, Stars } from './Sprite';
import { describeSpecial } from './specialText';

/** Highest star that unlocks a new passive. */
const LAST_PASSIVE_STAR = 10;

function nextStarPassive(star: number): { star: number; gain: Partial<Bonus> } | null {
  const current = starMilestoneBonus(star);
  const next = Array.from({ length: LAST_PASSIVE_STAR }, (_, i) => i + 1).find(
    (s) => s > star && Object.keys(starMilestoneBonus(s)).length > Object.keys(current).length,
  );
  if (!next) return null;
  const gain = Object.fromEntries(Object.entries(starMilestoneBonus(next)).filter(([k]) => !(k in current)));
  return { star: next, gain };
}

interface Props {
  save: SaveData;
  uid: string;
  update: Updater;
  toast: (message: string) => void;
  onBack: () => void;
}

export function FighterDetail({ save, uid, update, toast, onBack }: Props) {
  const [confirmEvolve, setConfirmEvolve] = useState(false);
  const unit = save.units.find((u) => u.uid === uid);
  if (!unit) {
    return (
      <div className="panel">
        <p>This fighter is gone (used for an evolution).</p>
        <button className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const family = getFamily(unit.familyId);
  const stats = statsFor(unit.familyId, unit.star, unit.level);
  const evolve = checkEvolve(save, uid);
  const cap = levelCap(unit.star);
  const maxBuy = affordableLevels(unit.level, save.coins, Math.max(0, cap - unit.level));
  const purchased = purchasedLevels(unit);
  const nextForm = unit.star < MAX_STARS ? formForStar(family, unit.star + 1).name : null;

  const buy = (count: number) => update((s) => upgradeUnit(s, uid, count));

  const doEvolve = () => {
    if (update((s) => evolveUnit(s, uid))) {
      setConfirmEvolve(false);
      toast(`Evolved into ${unitName({ familyId: unit.familyId, star: unit.star + 1 })}!`);
    }
  };

  const startEvolve = () => {
    if (evolve.investedDuplicates.length > 0) setConfirmEvolve(true);
    else doEvolve();
  };

  const levelButtons = [1, 10, 50].filter((n) => unit.level + n <= cap);
  const atWall = unit.level >= cap && unit.level < MAX_LEVEL;
  const passives = describeBonus(starMilestoneBonus(unit.star));
  const nextPassive = nextStarPassive(unit.star);
  const mastery = masteryProgress(unit.mastery ?? 0);

  return (
    <div className="detail fx fx-detail">
      <button className="btn ghost" onClick={onBack}>
        ← Fighters
      </button>

      <section className="panel detail-hero">
        <Sprite familyId={unit.familyId} star={unit.star} skinId={equippedSkin(save, unit.familyId)} size={128} className={`idle ${masteryAuraClass(unit)}`} />
        <div className="detail-info">
          <div className="eyebrow">{family.title}</div>
          <h2>{unitName(unit)}</h2>
          <div className="big-meta">
            Lv {unit.level} <Stars star={unit.star} />
            {save.team.includes(uid) && <span className="tag">ON TEAM</span>}
            {isTraining(save, uid) && <span className="tag">IN DOJO</span>}
            <button
              className={`btn small lock-toggle ${unit.locked ? 'on' : ''}`}
              aria-pressed={Boolean(unit.locked)}
              title={unit.locked ? 'Locked: never used as an evolution copy or sold' : 'Lock this fighter'}
              onClick={() => update((s) => toggleLock(s, uid))}
            >
              {unit.locked ? '🔒 Locked' : '🔓 Lock'}
            </button>
          </div>
          <div className="stat-grid">
            <span>HP {stats.hp.toLocaleString()}</span>
            <span>ATK {stats.atk.toLocaleString()}</span>
            <span>DEF {stats.def.toLocaleString()}</span>
            <span>SPD {stats.spd}</span>
            <span>Power {power(unit.familyId, unit.star, unit.level).toLocaleString()}</span>
            <span>
              Class: {roleFor(family)} · beats {BEATS[roleFor(family)]} · weak to{' '}
              {(Object.keys(BEATS) as (keyof typeof BEATS)[]).find((r) => BEATS[r] === roleFor(family))}
            </span>
          </div>
          {combosWith(unit.familyId).map((c) => (
            <div key={c.name} className="muted small-text">
              ★★ Combo <b>{c.name}</b> with {getFamily(c.parts[0] === unit.familyId ? c.parts[1] : c.parts[0]).name} when both specials are full
            </div>
          ))}
          <div className="special-box">
            <strong>{family.special.name}</strong> · charges in {family.special.charge} moves
            <div className="muted small-text">{describeSpecial(family.special)}</div>
          </div>
          <div className="muted small-text">
            Summoned at Lv {unit.baseLevel}
            {(unit.trainedLevels ?? 0) > 0 && ` · ${unit.trainedLevels} trained in the Dojo`} · {purchased} purchased level{purchased === 1 ? '' : 's'} ({unit.coinsSpent.toLocaleString()} coins)
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Star passives</h3>
        <p className={passives ? '' : 'muted'}>{passives || 'No star passive yet: evolve to 2★ to unlock the first one.'}</p>
        {nextPassive && (
          <p className="muted small-text">
            Next at {nextPassive.star}★: {describeBonus(nextPassive.gain)}
          </p>
        )}
      </section>

      {skinsFor(save, unit.familyId).length > 0 && (
        <section className="panel">
          <h3>Skins</h3>
          <div className="skin-picker">
            <button className={`btn small ${equippedSkin(save, unit.familyId) ? '' : 'active'}`} onClick={() => update((s) => equipSkin(s, unit.familyId, null))}>
              Default
            </button>
            {skinsFor(save, unit.familyId).map((skin) => (
              <button key={skin.id} className={`btn small ${equippedSkin(save, unit.familyId) === skin.id ? 'active' : ''}`} onClick={() => update((s) => equipSkin(s, unit.familyId, skin.id))}>
                {skin.name}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h3>
          Mastery <span className="muted">· level {mastery.level}/{MAX_MASTERY}</span>
        </h3>
        {mastery.need === null ? (
          <p>Fully mastered. {describeBonus(masteryBonus(mastery.level))}</p>
        ) : (
          <>
            <div className="mastery-bar" role="progressbar" aria-label="Mastery progress" aria-valuemin={0} aria-valuemax={mastery.need} aria-valuenow={mastery.into}>
              <i style={{ width: `${(mastery.into / mastery.need) * 100}%` }} />
            </div>
            <p className="muted small-text">
              {mastery.into}/{mastery.need} team wins to level {mastery.level + 1}: {describeBonus(masteryBonus(mastery.level + 1))}
            </p>
          </>
        )}
      </section>

      <GearSlots save={save} unit={unit} update={update} />
      <AwakeningTree save={save} unit={unit} update={update} />

      <section className="panel">
        <h3>
          Level up <span className="muted">· cap Lv {cap}</span>
        </h3>
        {unit.level >= MAX_LEVEL ? (
          <p className="muted">Max level reached.</p>
        ) : atWall ? (
          <div className="level-wall">
            <p>
              Level wall: {unit.star}★ fighters stop at Lv {cap}.
            </p>
            <button className={`btn primary ${evolve.ok ? 'glow' : ''}`} disabled={!evolve.ok} onClick={startEvolve}>
              Evolve to raise cap (Lv {cap} → {levelCap(unit.star + 1)})
            </button>
            {!evolve.ok && <p className="muted small-text">Needs 2 more {unit.star}★ copies or shards (see Evolve below).</p>}
          </div>
        ) : (
          <div className="button-row">
            {levelButtons.map((n) => {
              const cost = upgradeCost(unit.level, n);
              return (
                <button key={n} className="btn" disabled={cost > save.coins} onClick={() => buy(n)}>
                  +{n} <small><PixelIcon kind="coin" /> {cost.toLocaleString()}</small>
                </button>
              );
            })}
            <button className="btn primary" disabled={maxBuy === 0} onClick={() => buy(maxBuy)}>
              Max +{maxBuy} <small><PixelIcon kind="coin" /> {upgradeCost(unit.level, maxBuy).toLocaleString()}</small>
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Evolve {nextForm && <span className="muted">→ {nextForm} {unit.star + 1}★</span>}</h3>
        {evolve.maxed ? (
          <p className="muted">This fighter has reached the final star.</p>
        ) : (
          <>
            <ul className="req-list">
              <li className={evolve.duplicatesMet ? 'met' : ''}>
                2 more copies of {unitName(unit)} {unit.star}★ ({evolve.duplicates.length + evolve.shardsUsed}/2) — any level
                {evolve.shardsUsed > 0 && ` (${evolve.shardsUsed} from shards)`}
              </li>
            </ul>
            {evolve.duplicates.length > 0 && (
              <div className="dupe-row">
                {evolve.duplicates.map((d) => (
                  <div key={d.uid} className="dupe">
                    <Sprite familyId={d.familyId} star={d.star} size={40} />
                    <span>Lv {d.level}</span>
                  </div>
                ))}
              </div>
            )}
            <button className={`btn primary ${evolve.ok && atWall ? 'glow' : ''}`} disabled={!evolve.ok} onClick={startEvolve}>
              Evolve
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <h3>Reset purchased levels</h3>
        <p className="muted small-text">
          Returns to Lv {freeLevel(unit)} and refunds {unit.coinsSpent.toLocaleString()} coins. Summoned levels stay. Costs{' '}
          {RESET_GEM_COST} gems.
        </p>
        <button className="btn" disabled={!canReset(save, unit)} onClick={() => update((s) => resetUnit(s, uid))}>
          Reset for ◆ {RESET_GEM_COST}
        </button>
      </section>

      {confirmEvolve && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal panel">
            <h3>Upgraded copies will be used</h3>
            <p>These copies have purchased levels. Evolving uses them up and those coins are lost unless you reset them first.</p>
            {evolve.investedDuplicates.map((d) => (
              <div key={d.uid} className="modal-row">
                <Sprite familyId={d.familyId} star={d.star} size={40} />
                <span>
                  Lv {d.level} · {d.coinsSpent.toLocaleString()} coins invested
                </span>
                <button className="btn small" disabled={!canReset(save, d)} onClick={() => update((s) => resetUnit(s, d.uid))}>
                  Refund ◆ {RESET_GEM_COST}
                </button>
              </div>
            ))}
            <div className="button-row">
              <button className="btn ghost" onClick={() => setConfirmEvolve(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={doEvolve}>
                Evolve now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

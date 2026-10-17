import { PixelIcon } from './PixelIcon';
import { useState } from 'react';
import { MAX_LEVEL, MAX_STARS, RESET_GEM_COST, levelCap } from '../game/balance';
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
import { BEATS, formForStar, getFamily, roleFor } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { AwakeningTree } from './AwakeningTree';
import { GearSlots } from './GearSlots';
import { Sprite, Stars } from './Sprite';
import { describeSpecial } from './specialText';

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

  return (
    <div className="detail">
      <button className="btn ghost" onClick={onBack}>
        ← Fighters
      </button>

      <section className="panel detail-hero">
        <Sprite familyId={unit.familyId} star={unit.star} size={128} className="idle" />
        <div className="detail-info">
          <div className="eyebrow">{family.title}</div>
          <h2>{unitName(unit)}</h2>
          <div className="big-meta">
            Lv {unit.level} <Stars star={unit.star} />
            {save.team.includes(uid) && <span className="tag">ON TEAM</span>}
            {isTraining(save, uid) && <span className="tag">IN DOJO</span>}
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

      <GearSlots save={save} unit={unit} update={update} />
      <AwakeningTree save={save} unit={unit} update={update} />

      <section className="panel">
        <h3>
          Level up <span className="muted">· cap Lv {cap}</span>
        </h3>
        {unit.level >= MAX_LEVEL ? (
          <p className="muted">Max level reached.</p>
        ) : unit.level >= cap ? (
          <p className="level-wall">
            Level wall: {unit.star}★ fighters stop at Lv {cap}. Evolve to {unit.star + 1}★ to raise the cap to Lv {levelCap(unit.star + 1)}.
          </p>
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
              <li className={evolve.levelMet ? 'met' : ''}>
                Reach level {evolve.levelNeeded} ({unit.level}/{evolve.levelNeeded})
              </li>
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
            <button className="btn primary" disabled={!evolve.ok} onClick={startEvolve}>
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

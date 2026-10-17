import { AWAKEN_FROM_STAR, RESPEC_GEMS, awaken, awakenPoints, awakeningTree, canAwaken, nodeCost, respecAwakening, spentPoints } from '../game/awakening';
import { describeBonus } from '../game/bonus';
import { getFamily } from '../game/roster';
import type { SaveData, Unit } from '../game/types';
import type { Updater } from './App';

/** This character's own awakening tree: three tiers of two nodes. */
export function AwakeningTree({ save, unit, update }: { save: SaveData; unit: Unit; update: Updater }) {
  const tree = awakeningTree(unit.familyId);
  const points = awakenPoints(unit);
  const left = points - spentPoints(unit);
  const owned = new Set(unit.awakened ?? []);
  return (
    <section className="panel awakening">
      <div className="section-head">
        <h3>{getFamily(unit.familyId).name}'s Awakening</h3>
        <span className="muted">
          {points === 0 ? `Unlocks at ${AWAKEN_FROM_STAR}★` : `${left} of ${points} points left`}
        </span>
      </div>
      <div className="awaken-tiers">
        {[3, 2, 1].map((tier) => (
          <div key={tier} className="awaken-tier">
            {tree
              .filter((n) => n.tier === tier)
              .map((node) => {
                const check = canAwaken(unit, node);
                const has = owned.has(node.id);
                return (
                  <button
                    key={node.id}
                    className={`awaken-node tier-${tier} ${has ? 'owned' : check.ok ? 'open' : 'locked'}`}
                    disabled={!check.ok}
                    title={check.reason}
                    onClick={() => update((s) => awaken(s, unit.uid, node.id))}
                  >
                    <b>{node.name}</b>
                    <span>{describeBonus(node.effect)}</span>
                    <small>{has ? 'AWAKENED' : `${nodeCost(node)} pt${nodeCost(node) === 1 ? '' : 's'}`}</small>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
      {owned.size > 0 && (
        <button
          className="btn small"
          disabled={save.materials.respecScroll === 0 && save.gems < RESPEC_GEMS}
          onClick={() => update((s) => respecAwakening(s, unit.uid))}
        >
          {save.materials.respecScroll > 0 ? `Reset points (scroll, ${save.materials.respecScroll} left)` : `Reset points ◆ ${RESPEC_GEMS}`}
        </button>
      )}
    </section>
  );
}

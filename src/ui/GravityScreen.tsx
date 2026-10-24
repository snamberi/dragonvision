import { ActivityScene } from './ActivityScene';
import { useActionFeedback } from './useActionFeedback';
import type { CSSProperties } from 'react';
import { GRAVITY_MAX_LEVEL, GRAVITY_PER_LEVEL, gravityCost } from '../game/balance';
import { ROLES, gravityLevel, upgradeGravity } from '../game/gravity';
import { FAMILIES, GOLDEN_FAMILIES, roleFor } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader, districtStyle } from './BuildingHeader';
import { ROLE_COLORS } from './rarity';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function GravityScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  return (
    <div className="gravity area-polished bld bld-training" style={districtStyle("Gravity Chamber")}>{feedback}
      <BuildingHeader title="Gravity Chamber" onBack={onBack}>
        <p className="muted">
          Train under heavy gravity. Each level gives every fighter of that role +{Math.round(GRAVITY_PER_LEVEL * 100)}% HP,
          attack and defense in battle, forever. Up to level {GRAVITY_MAX_LEVEL}.
        </p>
      </BuildingHeader>
      <ActivityScene kind="gravity" status={'Permanent training for every fighter role'} active={false}/>
      <div className="gravity-grid">
        {ROLES.map((role) => {
          const level = gravityLevel(save, role);
          const maxed = level >= GRAVITY_MAX_LEVEL;
          const cost = gravityCost(level);
          const members = [...FAMILIES, ...GOLDEN_FAMILIES].filter((f) => roleFor(f) === role).map((f) => f.name);
          return (
            <section key={role} className="panel gravity-card" style={{ '--role': ROLE_COLORS[role] } as CSSProperties}>
              <span className="role-tag">{role}</span>
              <div key={level} className="gravity-level upgrade-reveal">
                Lv {level}
                <small>/{GRAVITY_MAX_LEVEL}</small>
              </div>
              <span className="bar xp">
                <i style={{ width: `${(level / GRAVITY_MAX_LEVEL) * 100}%` }} />
              </span>
              <div className="muted small-text">
                +{Math.round(level * GRAVITY_PER_LEVEL * 100)}% stats · {members.join(', ')}
              </div>
              <button className="btn small primary" disabled={maxed || save.coins < cost} onClick={() => update((s) => upgradeGravity(s, role), `${role} training upgraded`)}>
                {maxed ? 'Maxed' : `Train ● ${cost.toLocaleString()}`}
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}

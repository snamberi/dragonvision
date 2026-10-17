import type { CSSProperties } from 'react';
import { MAX_TEAM_SIZE } from '../game/balance';
import { power, statsFor, teamUnits, unitName } from '../game/progression';
import { getFamily, roleFor } from '../game/roster';
import type { SaveData } from '../game/types';
import { ROLE_COLORS, tierFor } from './rarity';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  onOpen?: (uid: string) => void;
  title?: string;
}

/** The team standing on numbered pads in a pixel arena; even slots stand in the back row. */
export function TeamArena({ save, onOpen, title = 'Your Team' }: Props) {
  const team = teamUnits(save);
  const slots = Array.from({ length: MAX_TEAM_SIZE }, (_, i) => team[i]);
  const teamPower = team.reduce((sum, u) => sum + power(u.familyId, u.star, u.level), 0);

  return (
    <section className="team-arena">
      <div className="arena-head">
        <h2>{title}</h2>
        <span className="arena-power">
          {team.length}/{MAX_TEAM_SIZE} · Power {teamPower.toLocaleString()}
        </span>
      </div>

      <div className="arena-stage">
        {slots.map((u, i) => {
          const back = i % 2 === 1;
          if (!u) {
            return (
              <div key={`empty-${i}`} className={`arena-slot empty ${back ? 'back' : ''}`}>
                <span className="arena-ghost" aria-hidden="true" />
                <span className="arena-pad">{i + 1}</span>
              </div>
            );
          }
          const tier = tierFor(u.star);
          return (
            <button
              key={u.uid}
              className={`arena-slot ${back ? 'back' : ''} tier-${tier.id}`}
              style={{ '--tier': tier.color } as CSSProperties}
              onClick={onOpen ? () => onOpen(u.uid) : undefined}
              disabled={!onOpen}
              aria-label={`Position ${i + 1}: ${unitName(u)}`}
            >
              <Sprite familyId={u.familyId} star={u.star} size={72} className="idle" />
              <span className="arena-pad">{i + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="arena-hud">
        {slots.map((u, i) => {
          if (!u) {
            return (
              <div key={`hud-${i}`} className="hud-card empty">
                <span className="hud-name">Empty</span>
                <span className="muted">Slot {i + 1}</span>
              </div>
            );
          }
          const role = roleFor(getFamily(u.familyId));
          const hp = statsFor(u.familyId, u.star, u.level).hp;
          return (
            <div key={`hud-${u.uid}`} className="hud-card" style={{ '--tier': tierFor(u.star).color } as CSSProperties}>
              <span className="hud-name">{unitName(u)}</span>
              <span className="hud-meta">
                Lv {u.level} <Stars star={u.star} />
              </span>
              <span className="role-tag" style={{ '--role': ROLE_COLORS[role] } as CSSProperties}>
                {role}
              </span>
              <span className="hud-hp">
                <span className="bar hp">
                  <i style={{ width: '100%' }} />
                </span>
                HP {hp.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

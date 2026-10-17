import { type CSSProperties, useState } from 'react';
import { MAX_TEAM_SIZE } from '../game/balance';
import { isBackRow, power, statsFor, teamSlots, teamUnits, unitName } from '../game/progression';
import { getFamily, roleFor } from '../game/roster';
import type { SaveData } from '../game/types';
import { ROLE_COLORS, tierFor } from './rarity';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  onOpen?: (uid: string) => void;
  /** When set, fighters can be dragged (or tapped, then tapped again) onto another pad. */
  onMove?: (from: number, to: number) => void;
  title?: string;
}

/** The team standing on its five formation pads; pads 2 and 4 are the back row. */
export function TeamArena({ save, onOpen, onMove, title = 'Your Team' }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const slots = teamSlots(save);
  const teamPower = teamUnits(save).reduce((sum, u) => sum + power(u.familyId, u.star, u.level), 0);
  const count = slots.filter(Boolean).length;

  const tapPad = (i: number) => {
    if (!onMove) {
      const u = slots[i];
      if (u && onOpen) onOpen(u.uid);
      return;
    }
    if (selected === null) {
      if (slots[i]) setSelected(i);
      return;
    }
    if (selected !== i) onMove(selected, i);
    setSelected(null);
  };

  const dropOn = (i: number) => {
    if (onMove && dragFrom !== null && dragFrom !== i) onMove(dragFrom, i);
    setDragFrom(null);
    setSelected(null);
  };

  const interactive = Boolean(onMove || onOpen);

  return (
    <section className="team-arena">
      <div className="arena-head">
        <h2>{title}</h2>
        <span className="arena-power">
          {count}/{MAX_TEAM_SIZE} · Power {teamPower.toLocaleString()}
        </span>
      </div>
      {onMove && (
        <p className="arena-help">
          {selected !== null
            ? 'Now tap the pad to move to.'
            : 'Drag or tap a fighter, then tap another pad to move. Front row (1, 3, 5) protects the back row (2, 4).'}
        </p>
      )}

      <div className="arena-stage">
        {slots.map((u, i) => {
          const back = isBackRow(i);
          const tier = u ? tierFor(u.star) : null;
          const classes = [
            'arena-slot',
            back ? 'back' : '',
            u ? `tier-${tier!.id}` : 'empty',
            selected === i ? 'selected' : '',
            selected !== null && selected !== i ? 'drop-ok' : '',
          ].join(' ');
          return (
            <button
              key={i}
              className={classes}
              style={tier ? ({ '--tier': tier.color } as CSSProperties) : undefined}
              onClick={() => tapPad(i)}
              disabled={!interactive || (!u && selected === null && dragFrom === null)}
              draggable={Boolean(onMove && u)}
              onDragStart={() => setDragFrom(i)}
              onDragEnd={() => setDragFrom(null)}
              onDragOver={(e) => onMove && dragFrom !== null && e.preventDefault()}
              onDrop={() => dropOn(i)}
              aria-label={`Pad ${i + 1}, ${back ? 'back' : 'front'} row: ${u ? unitName(u) : 'empty'}`}
            >
              {u ? (
                <Sprite familyId={u.familyId} star={u.star} size={72} className="idle" />
              ) : (
                <span className="arena-ghost" aria-hidden="true" />
              )}
              <span className="arena-pad">{i + 1}</span>
              <span className="arena-row-label">{back ? 'BACK' : 'FRONT'}</span>
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
                <span className="muted">Pad {i + 1}</span>
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
              {onMove && onOpen && (
                <button className="btn small hud-info" onClick={() => onOpen(u.uid)}>
                  Info
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

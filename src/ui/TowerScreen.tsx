import { useEffect, useRef } from 'react';
import { TOWER_FLOORS } from '../game/balance';
import { power, teamUnits } from '../game/progression';
import { RULE_TEXT, towerRewards, towerStage } from '../game/tower';
import type { SaveData } from '../game/types';
import { BuildingHeader } from './BuildingHeader';
import { Portrait, Stars } from './Sprite';
import { orbs } from './format';

const BIOME_LAVA_FLOOR = 10;
const BIOME_ICE_FLOOR = 20;
const BIOME_SHADOW_FLOOR = 30;
const BIOME_LABELS: Record<string, string> = { lava: '🌋 Volcanic', ice: '❄ Frozen', shadow: '🌑 Shadow' };

function biomeFor(floor: number): string {
  if (floor >= BIOME_SHADOW_FLOOR) return 'shadow';
  if (floor >= BIOME_ICE_FLOOR) return 'ice';
  if (floor >= BIOME_LAVA_FLOOR) return 'lava';
  return '';
}

interface Props {
  save: SaveData;
  onBack: () => void;
  onChallenge: (floor: number) => void;
}

export function TowerScreen({ save, onBack, onChallenge }: Props) {
  const next = Math.min(TOWER_FLOORS, save.towerFloor + 1);
  const done = save.towerFloor >= TOWER_FLOORS;
  const teamPower = teamUnits(save).reduce((sum, u) => sum + power(u.familyId, u.star, u.level), 0);
  const floors = Array.from({ length: TOWER_FLOORS }, (_, i) => TOWER_FLOORS - i);
  const nextRef = useRef<HTMLElement>(null);
  // Floors are listed top-down, so bring the floor to play into view. Braces matter: newer browsers return a
  // promise from scrollIntoView, and React would call whatever the effect returns when the screen closes.
  useEffect(() => {
    nextRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="tower">
      <BuildingHeader title="Rival Tower" onBack={onBack}>
        <p className="muted">
          {TOWER_FLOORS} floors of rival squads, each with a twist rule. Every floor pays once: coins and 2 Spin Orbs, plus gems and an
          evolution shard every 5th floor. Your team power: {teamPower.toLocaleString()}.
        </p>
      </BuildingHeader>
      {done && <p className="the-end">You conquered the Rival Tower!</p>}
      <div className="floor-list">
        {floors.map((floor) => {
          const stage = towerStage(floor);
          const r = towerRewards(floor);
          const cleared = floor <= save.towerFloor;
          const isNext = floor === next && !done;
          const enemyPower = stage.enemies.reduce((sum, e) => sum + power(e.familyId, e.star, e.level), 0);
          const biome = biomeFor(floor);
          return (
            <section key={floor} ref={isNext ? nextRef : undefined} className={`panel floor ${cleared ? 'cleared' : ''} ${isNext ? 'next' : ''} ${floor > next ? 'locked' : ''} ${biome ? `biome-${biome}` : ''}`}>
              <div className="floor-num">
                {floor}F{stage.kind !== 'normal' && <span className={`tag ${stage.kind === 'boss' ? 'boss' : 'mini'}`}>{stage.kind === 'boss' ? 'BOSS' : 'MINI'}</span>}
                {biome && <span className="biome-tag">{BIOME_LABELS[biome]}</span>}
              </div>
              <div className="floor-body">
                <b>{stage.chapterName}</b>
                <span className="floor-squad">
                  {stage.enemies.map((e, i) => (
                    <Portrait key={i} familyId={e.familyId} star={e.star} size={26} />
                  ))}
                  <span className="muted small-text">
                    Lv {stage.enemies[0].level} <Stars star={stage.enemies[0].star} /> · power {enemyPower.toLocaleString()}
                  </span>
                </span>
                {stage.rule && <span className="rule">⚠ {RULE_TEXT[stage.rule]}</span>}
                <span className="muted small-text">
                  ● {r.coins.toLocaleString()} · {orbs(r.spins)}
                  {r.gems > 0 && ` · ◆ ${r.gems}`}
                  {r.shardStar && ` · ◇ ${r.shardStar}★ shard`}
                </span>
              </div>
              {isNext ? (
                <button className="btn primary" onClick={() => onChallenge(floor)}>
                  Challenge
                </button>
              ) : (
                <span className="muted">{cleared ? 'Cleared' : 'Locked'}</span>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

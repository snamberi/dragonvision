import { TOWER_FLOORS } from '../game/balance';
import { power, teamUnits } from '../game/progression';
import { RULE_TEXT, towerRewards, towerStage } from '../game/tower';
import type { SaveData } from '../game/types';
import { towerUrl } from '../art/buildings';
import { QPanel, QuarterScene } from './QuarterScene';
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
  // The floor to play comes first, then the climb above it; cleared floors sit below, newest first.
  const ahead = done ? [] : Array.from({ length: TOWER_FLOORS - next + 1 }, (_, i) => next + i);
  const clearedFloors = Array.from({ length: save.towerFloor }, (_, i) => save.towerFloor - i);

  return (
    <div className="tower qscreen">
      <QuarterScene
        quarter="arena"
        title="Rival Tower"
        art={towerUrl()}
        onBack={onBack}
        line={`${TOWER_FLOORS} floors of rival squads, each with a twist rule. Every floor pays once, with gems and a shard every 5th floor.`}
        status={{ label: done ? 'Conquered' : 'Next floor', value: done ? `${TOWER_FLOORS}F ✓` : `${next}F · power ${teamPower.toLocaleString()}` }}
      />
      <QPanel eyebrow={done ? 'THE SUMMIT' : 'THE CLIMB'} title={done ? 'You conquered the Rival Tower!' : `${TOWER_FLOORS - save.towerFloor} floors to go`} aside={<span className="qtag">{save.towerFloor}/{TOWER_FLOORS}</span>}>
        <div className="floor-list">{ahead.map(renderFloor)}</div>
        {clearedFloors.length > 0 && (
          <details className="floor-cleared" open={done}>
            <summary>Cleared floors ({clearedFloors.length})</summary>
            <div className="floor-list">{clearedFloors.map(renderFloor)}</div>
          </details>
        )}
      </QPanel>
    </div>
  );

  function renderFloor(floor: number) {
    const stage = towerStage(floor);
    const r = towerRewards(floor);
    const cleared = floor <= save.towerFloor;
    const isNext = floor === next && !done;
    const enemyPower = stage.enemies.reduce((sum, e) => sum + power(e.familyId, e.star, e.level), 0);
    const biome = biomeFor(floor);
    return (
      <section key={floor} className={`panel floor ${cleared ? 'cleared' : ''} ${isNext ? 'next' : ''} ${floor > next ? 'locked' : ''} ${biome ? `biome-${biome}` : ''}`}>
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
  }
}

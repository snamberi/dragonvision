import { canAttemptDungeon, clearDungeon, dailyDungeonRule, dungeonRewards, startDungeon, DUNGEON_DAILY_ATTEMPTS } from '../game/dungeon';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { useActionFeedback } from './useActionFeedback';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function DungeonScreen({ save, update: commit, onBack }: Props) {
  const { update, feedback } = useActionFeedback(commit);
  const day = dayKey();
  const rule = dailyDungeonRule(day);
  const state = save.dungeon;
  const isToday = state?.day === day;
  const attempts = isToday ? (state?.attempts ?? 0) : 0;
  const cleared = isToday && (state?.cleared ?? false);
  const canAttempt = canAttemptDungeon(save, day);
  const keys = save.materials.dungeonKey;
  const active = isToday && !cleared && (state?.attempts ?? 0) > 0;

  return (
    <div className="dungeon area-polished">{feedback}
      <BuildingHeader title="Daily Dungeon" onBack={onBack}>
        <p className="muted">A key-gated gauntlet with a new rule each day. Clear it once for gems and relic shards.</p>
      </BuildingHeader>

      <section className="panel">
        <div className="section-head">
          <h3>Today&apos;s Dungeon</h3>
          <span className="chip">{rule}</span>
        </div>
        <p className="muted">Rule: <strong>{rule}</strong></p>
        <p className="muted">Attempts today: {attempts} / {DUNGEON_DAILY_ATTEMPTS}</p>
        <p className="muted">Dungeon Keys: {keys}</p>
        {cleared && <p className="success">Dungeon cleared today! Come back tomorrow.</p>}
        {!cleared && (
          <div className="row gap-sm mt-sm">
            <button
              className="btn primary"
              disabled={!canAttempt}
              onClick={() => update((s) => startDungeon(s, day), 'Dungeon run started!')}
            >
              {active ? 'Continue Run' : 'Challenge'} (costs 1 key)
            </button>
            {active && (
              <button
                className="btn success"
                onClick={() => update((s) => clearDungeon(s, day), `Dungeon cleared! +${dungeonRewards.gems} gems, +${dungeonRewards.relicShard} Relic Shard`)}
              >
                Clear Run
              </button>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Rewards</h3>
        <p className="muted">◆ {dungeonRewards.gems} gems</p>
        <p className="muted">+ {dungeonRewards.relicShard} Relic Shard</p>
        <p className="muted small-text">Relic Shards combine into Artifact Relics in the Armory.</p>
      </section>
    </div>
  );
}

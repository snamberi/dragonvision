import {
  DUNGEON_DAILY_ATTEMPTS,
  DUNGEON_RULE_TEXT,
  canAttemptDungeon,
  dailyDungeonRule,
  dungeonRewards,
  dungeonSquad,
  startDungeon,
} from '../game/dungeon';
import { DUNGEON_KEYS_PER_LOGIN } from '../game/login';
import { teamSlots } from '../game/progression';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { useActionFeedback } from './useActionFeedback';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
  onFight: () => void;
}

export function DungeonScreen({ save, update: commit, onBack, onFight }: Props) {
  const { update, feedback } = useActionFeedback(commit);
  const day = dayKey();
  const rule = dailyDungeonRule(day);
  const state = save.dungeon;
  const isToday = state?.day === day;
  const attempts = isToday ? (state?.attempts ?? 0) : 0;
  const cleared = isToday && (state?.cleared ?? false);
  const keys = save.materials.dungeonKey;
  const squad = dungeonSquad(teamSlots(save), rule).filter(Boolean);
  const canAttempt = canAttemptDungeon(save, day) && squad.length > 0;
  const challenge = () => {
    if (update((s) => startDungeon(s, day))) onFight();
  };

  return (
    <div className="dungeon area-polished">{feedback}
      <BuildingHeader title="Daily Dungeon" onBack={onBack}>
        <p className="muted">A key-gated battle with a new rule each day. Win once for gems and a Relic Shard.</p>
      </BuildingHeader>

      <section className="panel">
        <div className="section-head">
          <h3>Today&apos;s Dungeon</h3>
          <span className="chip">{rule}</span>
        </div>
        <p className="muted"><strong>{rule}:</strong> {DUNGEON_RULE_TEXT[rule]}</p>
        <p className="muted">Attempts today: {attempts} / {DUNGEON_DAILY_ATTEMPTS}</p>
        <p className="muted">Dungeon Keys: {keys} <span className="small-text">(+{DUNGEON_KEYS_PER_LOGIN} with every daily login claim)</span></p>
        {cleared && <p className="success">Dungeon cleared today! Come back tomorrow.</p>}
        {!cleared && squad.length === 0 && (
          <p className="muted small-text">None of your team fighters can enter today. Put a Support or Drainer on your team.</p>
        )}
        {!cleared && keys <= 0 && <p className="muted small-text">No keys left. Claim your daily login reward for another.</p>}
        {!cleared && (
          <div className="row gap-sm mt-sm">
            <button className="btn primary" disabled={!canAttempt} onClick={challenge}>
              Challenge (costs 1 key)
            </button>
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

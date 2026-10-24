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
import { dungeonUrl } from '../art/buildings';
import { QPanel, QuarterScene } from './QuarterScene';
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
    <div className="dungeon qscreen">{feedback}
      <QuarterScene
        quarter="harbor"
        title="Daily Dungeon"
        art={dungeonUrl()}
        onBack={onBack}
        line="A key-gated battle with a new rule each day. Win once for gems and a Relic Shard."
        status={{ label: "Today's rule", value: rule }}
      />

      <QPanel eyebrow="TODAY'S DEPTHS" title={rule} aside={<span className={`qtag ${cleared ? 'done' : ''}`}>{cleared ? '✓ CLEARED' : `${keys} KEY${keys === 1 ? '' : 'S'}`}</span>}>
        <p>{DUNGEON_RULE_TEXT[rule]}</p>
        <div className="qstats">
          <span className="qstat"><small>Attempts</small><b>{attempts} / {DUNGEON_DAILY_ATTEMPTS}</b></span>
          <span className="qstat"><small>Dungeon keys</small><b>{keys}</b></span>
          <span className="qstat"><small>Per login</small><b>+{DUNGEON_KEYS_PER_LOGIN} key</b></span>
        </div>
        {cleared && <p className="success">Dungeon cleared today! Come back tomorrow.</p>}
        {!cleared && squad.length === 0 && <p>None of your team fighters can enter today. Put a Support or Drainer on your team.</p>}
        {!cleared && keys <= 0 && <p>No keys left. Claim your daily login reward for another.</p>}
        {!cleared && (
          <button className="btn primary big" disabled={!canAttempt} onClick={challenge}>
            Challenge (costs 1 key)
          </button>
        )}
      </QPanel>

      <QPanel eyebrow="WHAT LIES BELOW" title="Rewards">
        <div className="qstats">
          <span className="qstat"><small>Gems</small><b>◆ {dungeonRewards.gems}</b></span>
          <span className="qstat"><small>Relic Shard</small><b>+{dungeonRewards.relicShard}</b></span>
        </div>
        <p>Relic Shards combine into Artifact Relics in the Armory.</p>
      </QPanel>
    </div>
  );
}

import { PixelIcon } from './PixelIcon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { recordForms } from '../game/achievements';
import { syncBounties } from '../game/bounty';
import { syncWorldBoss } from '../game/worldBoss';
import { loadSave, writeSave } from '../game/save';
import type { SaveData } from '../game/types';
import { BattleScreen } from './BattleScreen';
import { type Building, CityScreen } from './CityScreen';
import { ArmoryScreen } from './ArmoryScreen';
import { ColosseumScreen } from './ColosseumScreen';
import { HallScreen } from './HallScreen';
import { SurvivalScreen } from './SurvivalScreen';
import { BountyScreen } from './BountyScreen';
import { DojoScreen } from './DojoScreen';
import { FortuneScreen } from './FortuneScreen';
import { GravityScreen } from './GravityScreen';
import { PortScreen } from './PortScreen';
import { TowerScreen } from './TowerScreen';
import { FusionScreen } from './FusionScreen';
import { FighterDetail } from './FighterDetail';
import { FightersScreen } from './FightersScreen';
import { HomeScreen } from './HomeScreen';
import { InventoryScreen } from './InventoryScreen';
import { StagesScreen } from './StagesScreen';
import { SummonScreen } from './SummonScreen';
import { type Run, newRun } from './run';

export type Tab = 'home' | 'city' | 'inventory' | 'stages' | 'fighters';

const TAB_LABELS: Record<Tab, string> = {
  home: 'Home',
  city: 'City',
  inventory: 'Inventory',
  stages: 'Stages',
  fighters: 'Fighters',
};

type View =
  | { kind: 'tab'; tab: Tab }
  | { kind: 'battle'; stage: number; run: Run; seq: number; towerFloor?: number; mode?: 'boss' | 'survival' }
  | { kind: 'fighter'; uid: string }
  | { kind: 'building'; building: Building };

export type Updater = (change: (save: SaveData) => SaveData) => boolean;

export function App() {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [view, setView] = useState<View>({ kind: 'tab', tab: 'home' });
  const [toast, setToast] = useState<string | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => writeSave(save), [save]);

  // Every new screen starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Start new bounty days and weeks on launch and while the game stays open.
  useEffect(() => {
    const sync = () => setSave((s) => syncWorldBoss(syncBounties(recordForms(s))));
    sync();
    const id = setInterval(sync, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  /** Applies a rule change; rule errors become a toast instead of a crash. */
  const update: Updater = useCallback((change) => {
    try {
      // Every change also updates the collection log of forms ever owned.
      const next = recordForms(change(saveRef.current));
      saveRef.current = next;
      setSave(next);
      return true;
    } catch (error) {
      setToast(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, []);

  const tab: Tab =
    view.kind === 'tab' ? view.tab : view.kind === 'fighter' ? 'fighters' : view.kind === 'building' ? 'city' : 'stages';
  const openSummon = () => setView({ kind: 'building', building: 'summon' });
  const toCity = () => setView({ kind: 'tab', tab: 'city' });
  const continueRun = useCallback(
    (stage: number, run: Run) => setView((v) => ({ kind: 'battle', stage, run, seq: (v.kind === 'battle' ? v.seq : 0) + 1 })),
    [],
  );

  return (
    <div className={`app ${view.kind === 'tab' && view.tab === 'city' ? 'city-view' : ''}`}>
      <header className="topbar">
        <div className="logo">
          DRAGON<span>VISION</span>
        </div>
        <div className="wallet">
          <span className="coin" title="Coins"><PixelIcon kind="coin" /> {save.coins.toLocaleString()}</span>
          <span className="gem" title="Gems"><PixelIcon kind="gem" /> {save.gems}</span>
          <span className="spin" title="Summon spins"><PixelIcon kind="spin" /> {save.spins}</span>
        </div>
      </header>

      <main className="screen">
        {view.kind === 'battle' ? (
          <BattleScreen
            key={view.seq}
            save={save}
            stageNumber={view.stage}
            towerFloor={view.towerFloor}
            mode={view.mode}
            run={view.run}
            update={update}
            onExit={() =>
              setView(
                view.towerFloor
                  ? { kind: 'building', building: 'tower' }
                  : view.mode === 'boss'
                    ? { kind: 'building', building: 'colosseum' }
                    : view.mode === 'survival'
                      ? { kind: 'building', building: 'gate' }
                      : { kind: 'tab', tab: 'stages' },
              )
            }
            onContinue={continueRun}
          />
        ) : view.kind === 'fighter' ? (
          <FighterDetail
            save={save}
            uid={view.uid}
            update={update}
            toast={setToast}
            onBack={() => setView({ kind: 'tab', tab: 'fighters' })}
          />
        ) : view.kind === 'building' ? (
          view.building === 'summon' ? (
            <SummonScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'dojo' ? (
            <DojoScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'fusion' ? (
            <FusionScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'gravity' ? (
            <GravityScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'port' ? (
            <PortScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'bounty' ? (
            <BountyScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'colosseum' ? (
            <ColosseumScreen
              save={save}
              update={update}
              onBack={toCity}
              onFight={() => setView({ kind: 'battle', stage: 0, mode: 'boss', run: newRun('single'), seq: Date.now() })}
            />
          ) : view.building === 'gate' ? (
            <SurvivalScreen
              save={save}
              onBack={toCity}
              onStart={() => setView({ kind: 'battle', stage: 0, mode: 'survival', run: newRun('single'), seq: Date.now() })}
            />
          ) : view.building === 'hall' ? (
            <HallScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'armory' ? (
            <ArmoryScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'fortune' ? (
            <FortuneScreen save={save} update={update} onBack={toCity} />
          ) : (
            <TowerScreen
              save={save}
              onBack={toCity}
              onChallenge={(floor) => setView({ kind: 'battle', stage: 0, towerFloor: floor, run: newRun('single'), seq: Date.now() })}
            />
          )
        ) : view.tab === 'home' ? (
          <HomeScreen save={save} update={update} onNavigate={(t) => setView({ kind: 'tab', tab: t })} onOpenSummon={openSummon} />
        ) : view.tab === 'city' ? (
          <CityScreen save={save} onOpen={(building) => setView({ kind: 'building', building })} />
        ) : view.tab === 'inventory' ? (
          <InventoryScreen save={save} />
        ) : view.tab === 'stages' ? (
          <StagesScreen save={save} update={update} onPlay={(stage, run = newRun('single')) => setView({ kind: 'battle', stage, run, seq: Date.now() })} />
        ) : (
          <FightersScreen save={save} update={update} toast={setToast} onOpen={(uid) => setView({ kind: 'fighter', uid })} />
        )}
      </main>

      {view.kind !== 'battle' && (
        <nav className="tabs">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button key={t} className={t === tab ? 'active' : ''} onClick={() => setView({ kind: 'tab', tab: t })}>
              <PixelIcon kind={t} size={22} />{TAB_LABELS[t]}
              {t === 'city' && save.spins > 0 && <span className="tab-count">{save.spins}</span>}
            </button>
          ))}
        </nav>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

import { PixelBackdrop } from './PixelBackdrop';
import { PixelIcon } from './PixelIcon';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playMusic, unlockAudio } from '../audio/sound';
import { recordForms } from '../game/achievements';
import { syncBounties } from '../game/bounty';
import { syncWorldBoss } from '../game/worldBoss';
import { loadSave, writeSave } from '../game/save';
import { loginReady } from '../game/login';
import type { SaveData } from '../game/types';
import { BattleScreen } from './BattleScreen';
import { type SideMode, SIDE_MODE_HOME, isSideMode } from '../game/sideModes';
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
import { UpgradesHouseScreen } from './UpgradesHouseScreen';
import { FusionScreen } from './FusionScreen';
import { FighterDetail } from './FighterDetail';
import { FightersScreen } from './FightersScreen';
import { HomeScreen } from './HomeScreen';
import { InventoryScreen } from './InventoryScreen';
import { StagesScreen } from './StagesScreen';
import { SummonScreen } from './SummonScreen';
import { ShopScreen } from './ShopScreen';
import { DungeonScreen } from './DungeonScreen';
import { RaidScreen } from './RaidScreen';
import { ClimbScreen } from './ClimbScreen';
import { JournalScreen } from './JournalScreen';
import { EventScreen } from './EventScreen';
import { Modal } from './Modal';
import { SettingsPanel } from './SettingsPanel';
import { WhatsNew } from './WhatsNew';
import { LoginPopup } from './LoginPopup';
import { type Run, newRun } from './run';

export type Tab = 'home' | 'city' | 'inventory' | 'stages' | 'fighters';

const TAB_LABELS: Record<Tab, string> = {
  home: 'Home',
  city: 'City',
  stages: 'PLAY',
  inventory: 'Inventory',
  fighters: 'Fighters',
};

// Narrow phones have no room for the longer labels.
const TAB_SHORT: Partial<Record<Tab, string>> = { inventory: 'Items' };

type View =
  | { kind: 'tab'; tab: Tab }
  | { kind: 'battle'; stage: number; run: Run; seq: number; towerFloor?: number; mode?: 'boss' | 'survival' | SideMode }
  | { kind: 'fighter'; uid: string }
  | { kind: 'building'; building: Building };

export type Updater = (change: (save: SaveData) => SaveData) => boolean;

type Popup = 'updates' | 'login' | 'settings' | null;

export function App() {
  const [save, setSave] = useState<SaveData>(loadSave);
  // New letters and daily supplies wait in the yard, keeping the welcome unobstructed.
  const [popup, setPopup] = useState<Popup>(null);
  const closePopup = useCallback(() => setPopup(null), []);
  const [view, setView] = useState<View>({ kind: 'tab', tab: 'home' });
  const [toast, setToast] = useState<string | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    writeSave(save);
  }, [save]);

  // Every new screen starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Sync view state → URL hash so users can bookmark / share #/city etc.
  useEffect(() => {
    let hash = '';
    if (view.kind === 'tab') hash = `#/${view.tab}`;
    else if (view.kind === 'building') hash = `#/city/${view.building}`;
    else if (view.kind === 'fighter') hash = `#/fighters/${view.uid}`;
    else hash = '#/stages';
    if (window.location.hash !== hash) history.replaceState(null, '', hash);
  }, [view]);

  // Read hash on first load and handle browser back/forward.
  useEffect(() => {
    const parseHash = (hash: string): View => {
      // Strips leading "#/" from hash. Matches: "#/city/summon" → "city/summon". Rejects: "city" (no change). https://regex101.com/r/aG8eK1/1
      const parts = hash.replace(/^#\//, '').split('/');
      if (parts[0] === 'city' && parts[1]) return { kind: 'building', building: parts[1] as Building };
      if (parts[0] === 'fighters' && parts[1]) return { kind: 'fighter', uid: parts[1] };
      const tabMap: Record<string, Tab> = { home: 'home', city: 'city', stages: 'stages', inventory: 'inventory', fighters: 'fighters' };
      return { kind: 'tab', tab: tabMap[parts[0]] ?? 'home' };
    };
    if (window.location.hash && window.location.hash !== '#/') {
      setView(parseHash(window.location.hash));
    }
    const onPop = () => setView(parseHash(window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Battle music in fights, the city theme everywhere else.
  useEffect(() => {
    playMusic(view.kind === 'battle' ? 'battle' : 'city');
  }, [view.kind]);

  // Sound can only start after the first tap.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

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
  const toCity = () => setView({ kind: 'tab', tab: 'city' });
  const continueRun = useCallback(
    (stage: number, run: Run) => setView((v) => ({ kind: 'battle', stage, run, seq: (v.kind === 'battle' ? v.seq : 0) + 1 })),
    [],
  );

  return (
    <div className={`app ${view.kind === 'tab' && view.tab === 'city' ? 'city-view' : ''} ${view.kind === 'tab' && view.tab === 'home' ? 'home-view' : ''}`}>
      <header className="topbar">
        <h1 className="logo">
          <img className="logo-full" src={`${import.meta.env.BASE_URL}brand/logo-alt-light-transparent.png`} alt="Dragon Vision" />
          <img className="logo-mark" src={`${import.meta.env.BASE_URL}brand/logo-icon-light-transparent.png`} alt="Dragon Vision" />
        </h1>
        <div className="wallet">
          <span className="coin" title="Coins"><PixelIcon kind="coin" size={16} /> {compact(save.coins)}</span>
          <span className="gem" title="Gems"><PixelIcon kind="gem" size={16} /> {compact(save.gems)}</span>
        </div>
        <div className="corner-buttons">
          {loginReady(save) && (
            <button className="corner-btn alert" onClick={() => setPopup('login')} aria-label="Daily login reward" title="Daily login reward">
              <PixelIcon kind="gem" size={18} />
            </button>
          )}
          <button className="corner-btn" onClick={() => setPopup('updates')} aria-label="Updates" title="Updates">
            <PixelIcon kind="news" size={18} />
          </button>
          <button className="corner-btn" onClick={() => setPopup('settings')} aria-label="Settings" title="Settings">
            <PixelIcon kind="settings" size={18} />
          </button>
        </div>
      </header>

      <main className="screen">{!(view.kind === 'tab' && ['home', 'city'].includes(view.tab)) && <div className="screen-pixel-backdrop"><PixelBackdrop/></div>}
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
                isSideMode(view.mode)
                  ? { kind: 'building', building: SIDE_MODE_HOME[view.mode] }
                  : view.towerFloor
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
          view.building === 'shop' ? (
            <ShopScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'summon' ? (
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
              onStreak={() => setView({ kind: 'battle', stage: 0, mode: 'streak', run: newRun('single'), seq: Date.now() })}
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
          ) : view.building === 'upgrades' ? (
            <UpgradesHouseScreen save={save} update={update} onBack={toCity} />
          ) : view.building === 'dungeon' ? (
            <DungeonScreen save={save} update={update} onBack={toCity} onFight={() => setView({ kind: 'battle', stage: 0, mode: 'dungeon', run: newRun('single'), seq: Date.now() })} />
          ) : view.building === 'raid' ? (
            <RaidScreen save={save} onBack={toCity} onFight={() => setView({ kind: 'battle', stage: 0, mode: 'raid', run: newRun('single'), seq: Date.now() })} />
          ) : view.building === 'climb' ? (
            <ClimbScreen
              save={save}
              update={update}
              onBack={toCity}
              onChallenge={(floor) => setView({ kind: 'battle', stage: floor, mode: 'climb', run: newRun('single'), seq: Date.now() })}
            />
          ) : view.building === 'event' ? (
            <EventScreen save={save} update={update} onBack={toCity} onFight={(n) => setView({ kind: 'battle', stage: n, mode: 'event', run: newRun('single'), seq: Date.now() })} />
          ) : view.building === 'journal' ? (
            <JournalScreen save={save} update={update} onBack={toCity} />
          ) : (
            <TowerScreen
              save={save}
              onBack={toCity}
              onChallenge={(floor) => setView({ kind: 'battle', stage: 0, towerFloor: floor, run: newRun('single'), seq: Date.now() })}
            />
          )
        ) : view.tab === 'home' ? (
          <HomeScreen save={save} update={update} onTravel={tab=>setView({kind:'tab',tab})} onUpdates={()=>setPopup('updates')} onEvent={()=>setView({kind:'building',building:'event'})}/>
        ) : view.tab === 'city' ? (
          <CityScreen save={save} onOpen={(building) => setView({ kind: 'building', building })} />
        ) : view.tab === 'inventory' ? (
          <InventoryScreen save={save} update={update} />
        ) : view.tab === 'stages' ? (
          <StagesScreen save={save} update={update} onPlay={(stage, run = newRun('single')) => setView({ kind: 'battle', stage, run, seq: Date.now() })} />
        ) : (
          <FightersScreen save={save} update={update} toast={setToast} onOpen={(uid) => setView({ kind: 'fighter', uid })} />
        )}
      </main>

      {view.kind !== 'battle' && (
        <nav className="tabs">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button key={t} className={`${t === tab ? 'active' : ''} ${t === 'stages' ? 'play-tab' : ''}`} onClick={() => setView({ kind: 'tab', tab: t })}>
              <PixelIcon kind={t} size={22} />
              <span className="tab-long">{TAB_LABELS[t]}</span>
              <span className="tab-short">{TAB_SHORT[t] ?? TAB_LABELS[t]}</span>
            </button>
          ))}
        </nav>
      )}

      {popup === 'updates' && <WhatsNew onClose={closePopup} />}
      {popup === 'login' && <LoginPopup save={save} update={update} onClose={closePopup} />}
      {popup === 'settings' && (
        <Modal title="Settings" onClose={closePopup}>
          <SettingsPanel save={save} update={update} />
        </Modal>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/** 1,234,567 → 1.23M so the top bar stays small. */
function compact(n: number): string {
  if (n < 100_000) return n.toLocaleString();
  if (n < 1_000_000) return `${Math.floor(n / 1000)}K`;
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 2 : 1)}M`;
  return `${(n / 1_000_000_000).toFixed(2)}B`;
}

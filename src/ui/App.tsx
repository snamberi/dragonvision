import { useCallback, useEffect, useRef, useState } from 'react';
import { loadSave, writeSave } from '../game/save';
import type { SaveData } from '../game/types';
import { BattleScreen } from './BattleScreen';
import { CityScreen } from './CityScreen';
import { FighterDetail } from './FighterDetail';
import { FightersScreen } from './FightersScreen';
import { HomeScreen } from './HomeScreen';
import { InventoryScreen } from './InventoryScreen';
import { StagesScreen } from './StagesScreen';
import { SummonScreen } from './SummonScreen';

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
  | { kind: 'battle'; stage: number }
  | { kind: 'fighter'; uid: string }
  | { kind: 'summon' };

export type Updater = (change: (save: SaveData) => SaveData) => boolean;

export function App() {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [view, setView] = useState<View>({ kind: 'tab', tab: 'home' });
  const [toast, setToast] = useState<string | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => writeSave(save), [save]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  /** Applies a rule change; rule errors become a toast instead of a crash. */
  const update: Updater = useCallback((change) => {
    try {
      const next = change(saveRef.current);
      saveRef.current = next;
      setSave(next);
      return true;
    } catch (error) {
      setToast(error instanceof Error ? error.message : String(error));
      return false;
    }
  }, []);

  const tab: Tab =
    view.kind === 'tab' ? view.tab : view.kind === 'fighter' ? 'fighters' : view.kind === 'summon' ? 'city' : 'stages';
  const openSummon = () => setView({ kind: 'summon' });

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">
          DRAGON<span>VISION</span>
        </div>
        <div className="wallet">
          <span className="coin" title="Coins">● {save.coins.toLocaleString()}</span>
          <span className="gem" title="Gems">◆ {save.gems}</span>
          <span className="spin" title="Summon spins">✦ {save.spins}</span>
        </div>
      </header>

      <main className="screen">
        {view.kind === 'battle' ? (
          <BattleScreen save={save} stageNumber={view.stage} update={update} onExit={() => setView({ kind: 'tab', tab: 'stages' })} />
        ) : view.kind === 'fighter' ? (
          <FighterDetail
            save={save}
            uid={view.uid}
            update={update}
            toast={setToast}
            onBack={() => setView({ kind: 'tab', tab: 'fighters' })}
          />
        ) : view.kind === 'summon' ? (
          <SummonScreen save={save} update={update} onBack={() => setView({ kind: 'tab', tab: 'city' })} />
        ) : view.tab === 'home' ? (
          <HomeScreen save={save} onNavigate={(t) => setView({ kind: 'tab', tab: t })} onOpenSummon={openSummon} />
        ) : view.tab === 'city' ? (
          <CityScreen save={save} onOpenSummon={openSummon} />
        ) : view.tab === 'inventory' ? (
          <InventoryScreen save={save} />
        ) : view.tab === 'stages' ? (
          <StagesScreen save={save} onPlay={(stage) => setView({ kind: 'battle', stage })} />
        ) : (
          <FightersScreen save={save} update={update} toast={setToast} onOpen={(uid) => setView({ kind: 'fighter', uid })} />
        )}
      </main>

      {view.kind !== 'battle' && (
        <nav className="tabs">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button key={t} className={t === tab ? 'active' : ''} onClick={() => setView({ kind: 'tab', tab: t })}>
              {TAB_LABELS[t]}
              {t === 'city' && save.spins > 0 && <span className="tab-count">{save.spins}</span>}
            </button>
          ))}
        </nav>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

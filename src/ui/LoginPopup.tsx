import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { DailyChestPanel } from './HomePanels';

/** The top-bar reward shortcut shares the porch chest's design and claim rules. */
export function LoginPopup(props: { save: SaveData; update: Updater; onClose: () => void }) {
  return <DailyChestPanel {...props}/>;
}

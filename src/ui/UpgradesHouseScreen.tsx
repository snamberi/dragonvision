import { BuildingInterior } from './BuildingInterior';
import { PixelIcon } from './PixelIcon';
import {
  BASE_COLLECTION_CAP,
  BASE_GEAR_SLOTS,
  COLLECTION_SLOTS_PER_UPGRADE,
  GEAR_SLOTS_PER_UPGRADE,
  MAX_COLLECTION_UPGRADES,
  MAX_STORAGE_UPGRADES,
  UPGRADE_COLLECTION_COST,
  UPGRADE_STORAGE_COST,
} from '../game/balance';
import { buyCollectionUpgrade, buyStorageUpgrade, collectionCap, gearStorageSize } from '../game/upgrades';
import type { SaveData } from '../game/types';
import type { Updater } from './App';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function UpgradesHouseScreen({ save, update, onBack }: Props) {
  const collLevel = save.upgrades?.collectionCap ?? 0;
  const storLevel = save.upgrades?.storageLevel ?? 0;
  const currentCap = collectionCap(save);
  const currentStorage = gearStorageSize(save);

  return (
    <div className="upgrades-house">
      <button className="btn ghost summon-back" onClick={onBack}>
        ← City
      </button>
      <section className="panel summon-main">
        <BuildingInterior kind="upgrades" />
        <div className="summon-content">
          <div className="eyebrow">Vision City</div>
          <h2>Upgrades House</h2>
          <p className="muted">Expand your collection and gear storage to hold more fighters and equipment.</p>

          <div className="upgrade-cards">
            <div className="upgrade-card panel">
              <h3>Fighter Collection</h3>
              <p className="muted small-text">
                Current cap: <b>{currentCap}</b> fighters
                {collLevel > 0 && <> ({BASE_COLLECTION_CAP} base + {collLevel}×{COLLECTION_SLOTS_PER_UPGRADE})</>}
              </p>
              <p className="muted small-text">Level {collLevel} / {MAX_COLLECTION_UPGRADES}</p>
              {collLevel < MAX_COLLECTION_UPGRADES ? (
                <>
                  <p className="muted small-text">
                    Next level: +{COLLECTION_SLOTS_PER_UPGRADE} fighter slots → {currentCap + COLLECTION_SLOTS_PER_UPGRADE} total
                  </p>
                  <div className="button-row">
                    <button
                      className="btn primary"
                      disabled={save.coins < UPGRADE_COLLECTION_COST}
                      onClick={() => update(buyCollectionUpgrade)}
                    >
                      Upgrade · <PixelIcon kind="coin" size={14} /> {UPGRADE_COLLECTION_COST.toLocaleString()} coins
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted small-text">Max level reached.</p>
              )}
            </div>

            <div className="upgrade-card panel">
              <h3>Gear Storage</h3>
              <p className="muted small-text">
                Current storage: <b>{currentStorage}</b> gear slots
                {storLevel > 0 && <> ({BASE_GEAR_SLOTS} base + {storLevel}×{GEAR_SLOTS_PER_UPGRADE})</>}
              </p>
              <p className="muted small-text">Level {storLevel} / {MAX_STORAGE_UPGRADES}</p>
              {storLevel < MAX_STORAGE_UPGRADES ? (
                <>
                  <p className="muted small-text">
                    Next level: +{GEAR_SLOTS_PER_UPGRADE} gear slots → {currentStorage + GEAR_SLOTS_PER_UPGRADE} total
                  </p>
                  <div className="button-row">
                    <button
                      className="btn primary"
                      disabled={save.coins < UPGRADE_STORAGE_COST}
                      onClick={() => update(buyStorageUpgrade)}
                    >
                      Upgrade · <PixelIcon kind="coin" size={14} /> {UPGRADE_STORAGE_COST.toLocaleString()} coins
                    </button>
                  </div>
                </>
              ) : (
                <p className="muted small-text">Max level reached.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

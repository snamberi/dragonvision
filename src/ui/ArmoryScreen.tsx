import { useState } from 'react';
import { useActionFeedback } from './useActionFeedback';
import { autoEquipTeam, benchWouldHelp, salvageCandidates, salvageFiltered } from '../game/gearTools';
import { BOSS_GEAR_SETS, RARITIES, RARITY_LABEL, type Rarity, SHOP_REFRESH_GEMS, SETS, buyOffer, refreshShop, sellItem, sellValueOf, shopStock, syncShop, wearer } from '../game/gear';
import { REROLL_COST, duplicateItems, dustFor, forgeDust, rerollSub, salvageDuplicates, salvageItem } from '../game/forge';
import { describeBonus } from '../game/bonus';
import { RUNE_FRAG_COST, RUNE_TEMPLATES, craftRune } from '../game/rune';
import { RELIC_CRAFT_COST, RELIC_TEMPLATES, craftRelic, equipRelic, equippedRelicTemplate, unequipRelic } from '../game/relic';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader, districtStyle } from './BuildingHeader';
import { GearCard, SetBonusText } from './GearCard';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function ArmoryScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const today = syncShop(save, dayKey());
  const stock = shopStock(today);
  const loose = save.items.filter((i) => !wearer(save, i.id));
  const spares = duplicateItems(save);
  const spareDust = spares.reduce((sum, i) => sum + dustFor(i), 0);
  const dust = forgeDust(save);
  const rollable = save.items.filter((i) => (i.subs ?? []).length > 0);
  const [maxRarity, setMaxRarity] = useState<Rarity>('uncommon');
  const [withBoss, setWithBoss] = useState(false);
  const [openReroll, setOpenReroll] = useState<string | null>(null);
  const bulk = salvageCandidates(save, { maxRarity, includeBossSets: withBoss });
  const bulkDust = bulk.reduce((sum, i) => sum + dustFor(i), 0);
  const team = save.team.filter((t): t is string => Boolean(t));

  const salvageBulk = () => {
    const ok = window.confirm(`Salvage ${bulk.length} unworn piece${bulk.length === 1 ? '' : 's'} (${RARITY_LABEL[maxRarity]} and below) for ${bulkDust} Forge Dust?`);
    if (ok) update((s) => salvageFiltered(s, { maxRarity, includeBossSets: withBoss }).save, `Salvaged ${bulk.length} pieces for ${bulkDust} Forge Dust`);
  };

  const gearUpTeam = () => {
    const bench = benchWouldHelp(save, team) && window.confirm('Better gear is on fighters who are off the team. Take it from the bench?');
    const result = autoEquipTeam(save, bench);
    if (result.changed === 0) update((s) => s, 'Your team already wears its best gear');
    else update(() => result.save, `Equipped ${result.changed} piece${result.changed === 1 ? '' : 's'} across your team`);
  };

  return (
    <div className="armory area-polished bld bld-market" style={districtStyle("Armory")}>{feedback}
      <BuildingHeader title="Armory" onBack={onBack}>
        <p className="muted">
          Weapons, armor and accessories. Each fighter wears 1 weapon, 1 armor and 2 accessories. New stock every day; better
          rarities show up as you go deeper into the story. Wear 2 or 4 pieces of one set for its bonus.
        </p>
      </BuildingHeader>

      <section className="panel">
        <div className="section-head">
          <h3>Quick gear</h3>
          <button className="btn small primary" disabled={team.length === 0} onClick={gearUpTeam}>
            Gear up team
          </button>
        </div>
        <p className="muted small-text">Puts the best free gear on every team fighter, finishing set bonuses where it can. Team fighters never lose gear to each other.</p>
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Today's stock</h3>
          <button
            className="btn small"
            disabled={save.materials.refreshTicket === 0 && save.gems < SHOP_REFRESH_GEMS}
            onClick={() => update((s) => refreshShop(s))}
          >
            {save.materials.refreshTicket > 0 ? `New stock (ticket, ${save.materials.refreshTicket} left)` : `New stock ◆ ${SHOP_REFRESH_GEMS}`}
          </button>
        </div>
        <div className="gear-grid">
          {stock.map((offer, i) => {
            const sold = today.shop.bought.includes(i);
            const affordable = save.coins >= offer.coins && save.gems >= offer.gems;
            return (
              <GearCard key={i} item={offer}>
                <button className="btn small primary" disabled={sold || !affordable} onClick={() => update((s) => buyOffer(s, i), 'Equipment added to Inventory')}>
                  {sold ? 'Sold out' : `● ${offer.coins.toLocaleString()}${offer.gems ? ` + ◆ ${offer.gems}` : ''}`}
                </button>
              </GearCard>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Boss sets</h3>
        <p className="muted small-text">
          Wall bosses and raid bosses drop their own sets. Wall pieces drop on every first clear and on 25% of replays, so farm the wall
          that drops what you need. 4 pieces change how a fighter fights.
        </p>
        <div className="set-list">
          {BOSS_GEAR_SETS.map((set) => (
            <SetBonusText key={set.id} setId={set.id} />
          ))}
        </div>
        <h3>Armory sets</h3>
        <div className="set-list">
          {SETS.map((set) => (
            <SetBonusText key={set.id} setId={set.id} />
          ))}
        </div>
      </section>

      <section className="panel forge">
        <div className="section-head">
          <h3>Forge</h3>
          <span className="muted small-text">✧ {dust.toLocaleString()} Forge Dust</span>
        </div>
        <p className="muted small-text">
          Salvage spare gear into Forge Dust, then spend it to reroll one rolled stat on a piece. Boss set pieces salvage for double.
        </p>
        <button
          className="btn small primary"
          disabled={spares.length === 0}
          onClick={() => update((s) => salvageDuplicates(s).save, `Salvaged ${spares.length} spare piece${spares.length === 1 ? '' : 's'} for ${spareDust} Forge Dust`)}
        >
          {spares.length === 0 ? 'No spare copies' : `Salvage ${spares.length} spare cop${spares.length === 1 ? 'y' : 'ies'} (+${spareDust} ✧)`}
        </button>
        <div className="salvage-filter mt-sm">
          <label className="small-text">
            Salvage unworn up to{' '}
            <select value={maxRarity} onChange={(e) => setMaxRarity(e.target.value as Rarity)} aria-label="Highest rarity to salvage">
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {RARITY_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="small-text">
            <input type="checkbox" checked={withBoss} onChange={(e) => setWithBoss(e.target.checked)} /> include boss set pieces
          </label>
          <button className="btn small" disabled={bulk.length === 0} onClick={salvageBulk}>
            {bulk.length === 0 ? 'Nothing matches' : `Salvage ${bulk.length} (+${bulkDust} ✧)`}
          </button>
        </div>
        {rollable.length > 0 && (
          <div className="gear-grid mt-sm">
            {rollable.map((item) => (
              <GearCard key={item.id} save={save} item={item} onClick={() => setOpenReroll(openReroll === item.id ? null : item.id)}>
                {openReroll !== item.id ? (
                  <button className="btn small ghost" onClick={() => setOpenReroll(item.id)}>Reroll stats ▾</button>
                ) : (item.subs ?? []).map((sub, idx) => (
                  <button
                    key={idx}
                    className="btn small"
                    disabled={dust < REROLL_COST[item.rarity]}
                    onClick={() => update((s) => rerollSub(s, item.id, idx), 'Stat rerolled')}
                  >
                    Reroll {describeBonus({ [sub.stat]: sub.value })} · ✧ {REROLL_COST[item.rarity]}
                  </button>
                ))}
              </GearCard>
            ))}
          </div>
        )}
      </section>

      <section className="panel rune-forge">
        <div className="section-head">
          <h3>Rune Forge</h3>
          <span className="muted small-text">◇ {save.runeFragments ?? 0} fragments · {RUNE_FRAG_COST} per rune</span>
        </div>
        <p className="muted small-text">Craft runes and equip them on fighters (2 slots each). Runes boost ATK, DEF or HP.</p>
        <div className="rune-grid">
          {RUNE_TEMPLATES.map((tmpl, i) => {
            const canCraft = (save.runeFragments ?? 0) >= RUNE_FRAG_COST;
            return (
              <div key={i} className={`rune-card ${tmpl.slot}`}>
                <span className="rune-name">{tmpl.name}</span>
                <span className="rune-slot-tag">{tmpl.slot}</span>
                <span className="rune-effect muted small-text">{tmpl.effect}</span>
                <button className="btn small" disabled={!canCraft} onClick={() => update((s) => craftRune(s, i), `${tmpl.name} crafted`)}>
                  Craft ◇ {RUNE_FRAG_COST}
                </button>
              </div>
            );
          })}
        </div>
        {(save.runes ?? []).length > 0 && (
          <div className="rune-inventory">
            <h4>Your runes ({save.runes?.length ?? 0})</h4>
            <div className="rune-grid">
              {(save.runes ?? []).map((r) => (
                <div key={r.id} className={`rune-card owned ${r.slot}`}>
                  <span className="rune-name">{r.name}</span>
                  <span className="rune-effect muted small-text">{r.effect}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-head">
          <h3>Artifact Relics</h3>
          <span className="muted small-text">◇ {save.materials.relicShard} shards · {RELIC_CRAFT_COST} to craft</span>
        </div>
        {(() => {
          const active = equippedRelicTemplate(save);
          return (
            <>
              {active && (
                <div className="rune-card owned" style={{ marginBottom: 8 }}>
                  <span className="rune-name">Equipped: {active.name}</span>
                  <span className="rune-effect muted small-text">{active.effect}</span>
                  <button className="btn small" onClick={() => update(unequipRelic, 'Relic unequipped')}>Unequip</button>
                </div>
              )}
              <button className="btn small primary" disabled={save.materials.relicShard < RELIC_CRAFT_COST} onClick={() => update(craftRelic, 'Relic crafted!')}>
                Craft Relic ◇ {RELIC_CRAFT_COST}
              </button>
              {(save.relics ?? []).length > 0 && (
                <div className="rune-grid" style={{ marginTop: 8 }}>
                  {(save.relics ?? []).map((r) => {
                    const tmpl = RELIC_TEMPLATES.find((t) => t.id === r.templateId);
                    const equipped = save.equippedRelic === r.id;
                    return (
                      <div key={r.id} className={`rune-card ${equipped ? 'owned' : ''}`}>
                        <span className="rune-name">{tmpl?.name ?? r.templateId}</span>
                        <span className="rune-effect muted small-text">{r.effect}</span>
                        {!equipped && <button className="btn small" onClick={() => update((s) => equipRelic(s, r.id), 'Relic equipped')}>Equip</button>}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </section>

      <section className="panel">
        <h3>Sell or salvage unworn gear ({loose.length})</h3>
        {loose.length === 0 ? (
          <p className="muted">Nothing to sell. Gear someone is wearing stays safe.</p>
        ) : (
          <div className="gear-grid">
            {loose.map((item) => (
              <GearCard key={item.id} save={save} item={item}>
                <button className="btn small" onClick={() => update((s) => sellItem(s, item.id))}>
                  Sell ● {sellValueOf(item).toLocaleString()}
                </button>
                <button className="btn small" onClick={() => update((s) => salvageItem(s, item.id))}>
                  Salvage ✧ {dustFor(item)}
                </button>
              </GearCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

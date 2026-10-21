import {describe,it,expect} from 'vitest';
import {newSave} from '../game/progression';
import {buyGoldenOrbs,summonGolden,summon,goldenSummonOdds,summonOdds,summonStarCap} from '../game/summon';
import {FAMILIES,GOLDEN_FAMILIES,getFamily} from '../game/roster';
import {exportCode,importCode} from '../game/save';
import {awakeningTree} from '../game/awakening';
import {paintFighter} from '../art/sprite';
import {identityFor} from '../art/identity';
describe('Golden shrine',()=>{
 it('adds 10 exclusive and 10 normal families with complete playable data',()=>{
  expect(FAMILIES).toHaveLength(28);expect(GOLDEN_FAMILIES).toHaveLength(10);
  const all=[...FAMILIES,...GOLDEN_FAMILIES];expect(new Set(all.map(f=>f.id)).size).toBe(38);
  const art=new Set<string>();
  for(const f of all){expect(getFamily(f.id)).toBe(f);expect(awakeningTree(f.id)).toHaveLength(6);expect(identityFor(f.id)).toBeDefined();art.add(JSON.stringify(paintFighter(f.forms[0].look,f.id)))}
  expect(art.size).toBe(all.length);
 });
 it('charges exactly 60 gems per orb and rejects invalid or unaffordable purchases',()=>{
  const s={...newSave(),gems:600};const next=buyGoldenOrbs(s,10);
  expect(next.gems).toBe(0);expect(next.goldenOrbs).toBe(10);expect(next.spins).toBe(s.spins);expect(s.gems).toBe(600);
  for(const n of [0,-1,1.5,NaN,Infinity])expect(()=>buyGoldenOrbs(s,n)).toThrow();expect(()=>buyGoldenOrbs(s,11)).toThrow();
 });
 it('keeps pools and wallets separate and normal odds normalized',()=>{
  const s={...newSave(),spins:3,goldenOrbs:10,gems:120};const pull=summonGolden(s,10,()=>.5);
  expect(pull.units).toHaveLength(10);expect(pull.save.goldenOrbs).toBe(0);expect(pull.save.spins).toBe(s.spins);expect(pull.save.gems).toBe(s.gems);
  expect(pull.units.every(u=>GOLDEN_FAMILIES.some(f=>f.id===u.familyId))).toBe(true);
  const normal=summon(s,()=>.5);expect(FAMILIES.some(f=>f.id===normal.unit.familyId)).toBe(true);expect(normal.save.goldenOrbs).toBe(10);
  expect(summonOdds(s).reduce((a,b)=>a+b.chance,0)).toBeCloseTo(1);expect(goldenSummonOdds(s).reduce((a,b)=>a+b.chance,0)).toBeCloseTo(1);
  for(const f of GOLDEN_FAMILIES)expect(goldenSummonOdds(s).filter(r=>r.familyId===f.id).reduce((a,b)=>a+b.chance,0)).toBeCloseTo(.1);
 });
 it('enforces ownership star caps and insufficient balances',()=>{
  const s={...newSave(),goldenOrbs:1};const pull=summonGolden(s,1,()=>.999);
  expect(pull.units[0].star).toBe(1);expect(summonStarCap(pull.save,pull.units[0].familyId)).toBe(2);expect(()=>summonGolden(s,10)).toThrow();expect(()=>summonGolden(newSave())).toThrow();
 });
 it('round-trips Golden fighters/currency and migrates older saves',()=>{
  const s=summonGolden({...newSave(),goldenOrbs:2},1,()=>0).save;
  const copy=importCode(exportCode(s));expect(copy.goldenOrbs).toBe(1);expect(copy.units.at(-1)?.familyId).toBe(GOLDEN_FAMILIES[0].id);
  const old=newSave();delete old.goldenOrbs;expect(importCode(exportCode(old)).goldenOrbs).toBe(0);
 });
});

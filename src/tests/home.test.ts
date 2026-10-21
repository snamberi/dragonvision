import { describe, expect, it } from 'vitest';
import { HOME_LETTERS } from '../content/mail';
import { claimHomeLetter, homeFor, personalizeHome, readHomeLetter } from '../game/home';
import { addUnit, newSave } from '../game/progression';
import { exportCode, importCode } from '../game/save';

describe('personal sanctuary save compatibility and rewards', () => {
  it('opens old saves without changing their currency or roster', () => {
    const old = newSave(), before = JSON.stringify(old);
    expect(homeFor(old)).toMatchObject({ name:'Traveler',residentUid:'u1',palette:'ember',readMail:[],claimedMail:[] });
    expect(JSON.stringify(old)).toBe(before);
  });
  it('keeps cosmetics, resident and gift receipts when moving a save to another device', () => {
    const extra = addUnit(newSave(),{familyId:'mei',star:3,level:40,baseLevel:40,coinsSpent:0});
    let save = personalizeHome(extra.save,{name:'snambz',palette:'jade',banner:'moon',residentUid:extra.unit.uid});
    save = claimHomeLetter(save,'housewarming-1');
    const moved = importCode(exportCode(save));
    expect(homeFor(moved)).toEqual(homeFor(save));
    expect(moved.spins).toBe(extra.save.spins+2);
    expect(()=>claimHomeLetter(moved,'housewarming-1')).toThrow(/already/);
  });
  it('reading a parcel does not collect its contents, and collection pays exactly once', () => {
    const save = readHomeLetter(newSave(),'housewarming-1');
    expect(homeFor(save).readMail).toContain('housewarming-1');
    expect(homeFor(save).claimedMail).toEqual([]);
    const paid = claimHomeLetter(save,'housewarming-1');
    expect(paid.spins).toBe(save.spins+2);
    expect(()=>claimHomeLetter(paid,'housewarming-1')).toThrow();
    expect(()=>claimHomeLetter(paid,HOME_LETTERS[1].id)).toThrow(/no gift/);
    expect(()=>claimHomeLetter(paid,'made-up-letter')).toThrow(/no gift/);
  });
  it('falls back to an owned resident when the selected duplicate has been fused or sold', () => {
    const added = addUnit(newSave(),{familyId:'mei',star:1,level:1,baseLevel:1,coinsSpent:0});
    const save = personalizeHome(added.save,{residentUid:added.unit.uid});
    const afterFusion = {...save,units:save.units.filter(u=>u.uid!==added.unit.uid)};
    expect(homeFor(afterFusion).residentUid).toBe('u1');
    expect(()=>personalizeHome(afterFusion,{residentUid:added.unit.uid})).toThrow(/own/);
  });
  it('cosmetic edits preserve all reward receipts and combat data', () => {
    const claimed = claimHomeLetter(newSave(),'housewarming-1');
    const changed = personalizeHome(claimed,{name:'  New name  ',palette:'violet',banner:'leaf'});
    expect(changed.home?.name).toBe('New name');
    expect(changed.home?.claimedMail).toEqual(claimed.home?.claimedMail);
    const {home:_old,...oldGame}=claimed, {home:_new,...newGame}=changed;
    expect(newGame).toEqual(oldGame);
  });
});

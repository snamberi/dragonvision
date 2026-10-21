import { HOME_LETTERS } from '../content/mail';
import type { HomeData, SaveData } from './types';

/** Old saves need no reset. A removed or fused resident falls back to an owned fighter. */
export function homeFor(save: SaveData): HomeData {
  const raw = save.home;
  const strings = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === 'string'))] : [];
  const resident = save.units.find(u => u.uid === raw?.residentUid)
    ?? save.units.find(u => u.uid === save.team.find(Boolean)) ?? save.units[0];
  return {
    name: typeof raw?.name === 'string' ? raw.name.trim().slice(0, 24) || 'Traveler' : 'Traveler',
    residentUid: resident?.uid ?? null,
    palette: raw?.palette === 'jade' || raw?.palette === 'violet' ? raw.palette : 'ember',
    banner: raw?.banner === 'moon' || raw?.banner === 'leaf' ? raw.banner : 'sun',
    readMail: strings(raw?.readMail), claimedMail: strings(raw?.claimedMail),
  };
}

export function personalizeHome(save: SaveData, changes: Partial<Pick<HomeData, 'name' | 'residentUid' | 'palette' | 'banner'>>): SaveData {
  if (changes.residentUid && !save.units.some(u => u.uid === changes.residentUid)) throw new Error('Choose a fighter you own.');
  const next = { ...save, home: { ...homeFor(save), ...changes } };
  return { ...next, home: homeFor(next) };
}

export function readHomeLetter(save: SaveData, id: string): SaveData {
  if (!HOME_LETTERS.some(letter => letter.id === id)) throw new Error('That letter is unavailable.');
  const home = homeFor(save);
  if (home.readMail.includes(id)) return save;
  return { ...save, home: { ...home, readMail: [...home.readMail, id] } };
}

export function claimHomeLetter(save: SaveData, id: string): SaveData {
  const letter = HOME_LETTERS.find(item => item.id === id);
  if (!letter?.gift) throw new Error('There is no gift in this letter.');
  const home = homeFor(save);
  if (home.claimedMail.includes(id)) throw new Error('This parcel has already been collected.');
  return {
    ...save, spins: save.spins + letter.gift.spins,
    home: { ...home, readMail: [...new Set([...home.readMail, id])], claimedMail: [...home.claimedMail, id] },
  };
}

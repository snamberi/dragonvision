import { RELEASES } from './changelog';

export interface HomeLetter {
  id: string;
  sender: string;
  title: string;
  tag: string;
  paragraphs: string[];
  gift?: { spins: number };
}

/** Offline game letters. Receipts live in the save, including exported saves. */
export const HOME_LETTERS: HomeLetter[] = [
  {
    id: 'housewarming-1', sender: 'The Sanctuary Keeper', title: 'A little place of your own', tag: 'WELCOME GIFT',
    paragraphs: [
      'Every great journey needs a place to come home to. The key is yours, the lanterns are lit, and there is room for your favorite fighter.',
      'Make the house your own, collect your daily supply chest, and practice a signature move out in the yard. Your trophies will find a home here as your story grows.',
      'A small housewarming gift is enclosed. See you in Vision City.',
    ],
    gift: { spins: 2 },
  },
  ...RELEASES.slice(0, 3).map(r => ({ id: `release-${r.id}`, sender: 'DragonVision', title: r.title, tag: `UPDATE ${r.id}`, paragraphs: r.items })),
];

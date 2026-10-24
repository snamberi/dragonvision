// Ninefold accounts: one login shared by every NineFoldVision game (the Court Vision Supabase project).
// The URL and publishable key are public by design; row level security protects the data.
export const SUPABASE_URL = 'https://bqqgzfkpydmdfrszauvb.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_EQHq7G1Qss1pb6_QRwGSQQ_C3v7j6Lx';
/** Where the session is kept, apart from the game save so exported saves never carry it. */
export const AUTH_STORAGE_KEY = 'dragonvision-auth';
/** This game's rows in the shared tables. */
export const GAME = 'dragonvision';
// TODO: must match the NineFoldVision site's real domain.
export const NINEFOLD_SITE = 'https://ninefoldvision.com';
export const profileUrl = (username: string) => `${NINEFOLD_SITE}/profile.html?u=${encodeURIComponent(username)}`;
/** Same rule as the database and Court Vision. */
export const USERNAME_RULE = /^[A-Za-z0-9_]{3,18}$/;

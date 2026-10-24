import { isWallStage } from '../game/balance';

export type SocialId = 'discord' | 'tiktok' | 'youtube' | 'reddit';

export interface SocialLink {
  id: SocialId;
  label: string;
  /** Null hides the link until the community account exists. */
  url: string | null;
}

export const DISCORD_URL = 'https://discord.gg/5uGK5HDS8e';

export const SOCIAL_LINKS: SocialLink[] = [
  { id: 'discord', label: 'Discord', url: DISCORD_URL },
  { id: 'tiktok', label: 'TikTok', url: null },
  { id: 'youtube', label: 'YouTube', url: null },
  { id: 'reddit', label: 'Reddit', url: null },
];

export const activeSocials = (): SocialLink[] => SOCIAL_LINKS.filter((l) => l.url);

/** The first chapter boss and every wall are big enough moments to invite players to the Discord. */
const FIRST_BOSS_STAGE = 10;

export function inviteMilestone(stage: number, firstClear: boolean): string | null {
  if (!firstClear) return null;
  if (isWallStage(stage)) return `wall-${stage}`;
  if (stage === FIRST_BOSS_STAGE) return `boss-${stage}`;
  return null;
}

export function shouldInvite(milestone: string | null, shown: readonly string[]): boolean {
  return milestone !== null && !shown.includes(milestone);
}

const SHOWN_KEY = 'dragonvision.discordInvites';
const PENDING_KEY = 'dragonvision.discordInvitePending';

function readShown(): string[] {
  try {
    const raw = localStorage.getItem(SHOWN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Remembers a milestone to invite about once the player leaves battle. */
export function queueInvite(stage: number, firstClear: boolean): void {
  const milestone = inviteMilestone(stage, firstClear);
  if (!shouldInvite(milestone, readShown())) return;
  try {
    localStorage.setItem(PENDING_KEY, milestone!);
  } catch {
    // Storage blocked: skip the invite.
  }
}

/** The milestone waiting to be shown, marking it shown so it never appears twice. */
export function takeInvite(): string | null {
  try {
    const pending = localStorage.getItem(PENDING_KEY);
    if (!pending) return null;
    localStorage.removeItem(PENDING_KEY);
    const shown = readShown();
    if (shown.includes(pending)) return null;
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, pending]));
    return pending;
  } catch {
    return null;
  }
}

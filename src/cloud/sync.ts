// Dragon Vision's own rows in the shared Ninefold tables. Never touches Court Vision's data
// (profiles.level/xp/stats, public.progress, user_achievements).
import { parseSave } from '../game/save';
import type { SaveData } from '../game/types';
import { currentUserId, getAccount, setAccount, supa } from './account';
import { GAME } from './config';
import { activityBetween, buildSummary, mergeDecision, saveHash, trophyIds } from './summary';

interface Bridge {
  getSave: () => SaveData;
  replaceSave: (save: SaveData) => void;
}
let bridge: Bridge | null = null;
/** The App hands over its save so sign-in can upload it or bring the cloud copy in. */
export function connectCloud(b: Bridge) {
  bridge = b;
  // Leaving the page uploads what's pending, so the next device starts from the latest progress.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && timer) void flushNow();
  });
}

const SYNC_MARK_KEY = 'dragonvision-cloud-sync';
function readMark(userId: string): string | null {
  try {
    const mark = JSON.parse(localStorage.getItem(SYNC_MARK_KEY) ?? 'null') as { userId: string; hash: string } | null;
    return mark?.userId === userId ? mark.hash : null;
  } catch {
    return null;
  }
}
function writeMark(userId: string, save: SaveData) {
  try {
    localStorage.setItem(SYNC_MARK_KEY, JSON.stringify({ userId, hash: saveHash(save) }));
  } catch {
    // Storage blocked: the next sign-in simply asks.
  }
}

const UPLOAD_DELAY_MS = 8000;
/** Same kind of activity line at most once in this long. */
const ACTIVITY_COOLDOWN_MS = 10 * 60_000;

let ready = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastSynced: SaveData | null = null;
let cloudConflict: SaveData | null = null;
const sentTrophies = new Set<string>();
const lastActivity = new Map<string, number>();

/** Called on every save change; uploads a little later so a burst of changes becomes one write. */
export function noteSaveChanged(save: SaveData) {
  if (!ready || !currentUserId() || getAccount().conflict) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void push(save), UPLOAD_DELAY_MS);
}

export async function flushNow() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (ready && bridge && currentUserId() && !getAccount().conflict) await push(bridge.getSave());
}

async function push(save: SaveData) {
  const userId = currentUserId();
  if (!userId) return;
  setAccount({ sync: { ...getAccount().sync, state: 'syncing' } });
  try {
    const client = await supa();
    const now = new Date().toISOString();
    const json = JSON.stringify(save);
    const saved = await client.from('game_saves').upsert({ user_id: userId, game: GAME, data: save, size: json.length, updated_at: now });
    if (saved.error) throw saved.error;
    const summary = await client.from('game_summaries').upsert({ user_id: userId, game: GAME, summary: buildSummary(save), updated_at: now });
    if (summary.error) throw summary.error;
    const fresh = trophyIds(save).filter((id) => !sentTrophies.has(id));
    if (fresh.length) {
      const { error } = await client
        .from('game_trophies')
        .upsert(fresh.map((trophy_id) => ({ user_id: userId, game: GAME, trophy_id })), { onConflict: 'user_id,game,trophy_id', ignoreDuplicates: true });
      if (!error) fresh.forEach((id) => sentTrophies.add(id));
    }
    if (lastSynced) {
      const t = Date.now();
      const lines = activityBetween(lastSynced, save).filter((l) => t - (lastActivity.get(l.kind) ?? 0) > ACTIVITY_COOLDOWN_MS);
      if (lines.length) {
        const { error } = await client.from('activity').insert(lines.map((l) => ({ user_id: userId, game: GAME, kind: l.kind, text: l.text })));
        if (!error) lines.forEach((l) => lastActivity.set(l.kind, t));
      }
    }
    lastSynced = save;
    writeMark(userId, save);
    setAccount({ sync: { state: 'ok', at: Date.now(), message: null } });
  } catch (e) {
    setAccount({ sync: { state: 'error', at: getAccount().sync.at, message: e instanceof Error ? e.message : String(e) } });
  }
}

/** After sign-in: compare this device with the cloud copy. Real progress is never overwritten without asking. */
export async function reconcile() {
  const userId = currentUserId();
  if (!userId || !bridge) return;
  ready = false;
  try {
    const client = await supa();
    const { data, error } = await client.from('game_saves').select('data').eq('user_id', userId).eq('game', GAME).maybeSingle();
    if (error) throw error;
    const cloud = data ? parseSave((data as { data: unknown }).data) : null;
    const local = bridge.getSave();
    const decision = mergeDecision(local, cloud, readMark(userId));
    if (decision === 'ask' && cloud) {
      cloudConflict = cloud;
      setAccount({ conflict: { local: buildSummary(local), cloud: buildSummary(cloud) } });
      return;
    }
    if (decision === 'download' && cloud) bridge.replaceSave(cloud);
    const chosen = decision === 'download' && cloud ? cloud : local;
    lastSynced = chosen;
    ready = true;
    if (decision === 'upload') await push(chosen);
    else {
      writeMark(userId, chosen);
      setAccount({ sync: { state: 'ok', at: Date.now(), message: null } });
    }
  } catch (e) {
    setAccount({ sync: { state: 'error', at: null, message: e instanceof Error ? e.message : String(e) } });
  }
}

/** The player's answer to "which progress do you keep?". */
export async function resolveConflict(keep: 'local' | 'cloud') {
  if (!bridge) return;
  const chosen = keep === 'cloud' && cloudConflict ? cloudConflict : bridge.getSave();
  if (keep === 'cloud' && cloudConflict) bridge.replaceSave(cloudConflict);
  cloudConflict = null;
  lastSynced = chosen;
  ready = true;
  setAccount({ conflict: null });
  await push(chosen);
}

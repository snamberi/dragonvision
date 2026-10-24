// Ninefold accounts (sign in with Discord or Google through Supabase). Optional: everything works signed out.
// The Supabase library loads only when needed (a stored session, a sign-in coming back, or the player signing in).
import { useSyncExternalStore } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { AUTH_STORAGE_KEY, SUPABASE_KEY, SUPABASE_URL, USERNAME_RULE } from './config';
import type { DragonSummary } from './summary';

export interface NinefoldProfile {
  id: string;
  username: string | null;
  title: string | null;
  icon?: string | null;
  color?: string | null;
  avatar?: string | null;
}
export interface Conflict {
  local: DragonSummary;
  cloud: DragonSummary;
}
export interface AccountState {
  status: 'idle' | 'loading' | 'signedOut' | 'signedIn';
  userId: string | null;
  provider: string | null;
  profile: NinefoldProfile | null;
  sync: { state: 'idle' | 'syncing' | 'ok' | 'error'; at: number | null; message: string | null };
  conflict: Conflict | null;
  error: string | null;
}

let state: AccountState = {
  status: 'idle',
  userId: null,
  provider: null,
  profile: null,
  sync: { state: 'idle', at: null, message: null },
  conflict: null,
  error: null,
};
const listeners = new Set<() => void>();
export function setAccount(patch: Partial<AccountState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export const getAccount = () => state;
export const useAccount = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getAccount,
    getAccount,
  );

let clientPromise: Promise<SupabaseClient> | null = null;
let session: Session | null = null;
export const currentUserId = () => session?.user.id ?? null;

export function supa(): Promise<SupabaseClient> {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_STORAGE_KEY },
    });
    client.auth.onAuthStateChange((_event, s) => {
      void applySession(client, s);
    });
    return client;
  });
  return clientPromise;
}

async function applySession(client: SupabaseClient, s: Session | null) {
  const before = session?.user.id;
  session = s;
  if (!s) {
    setAccount({ status: 'signedOut', userId: null, provider: null, profile: null, conflict: null, sync: { state: 'idle', at: null, message: null } });
    return;
  }
  setAccount({ status: 'signedIn', userId: s.user.id, provider: (s.user.app_metadata?.provider as string | undefined) ?? null });
  if (before !== s.user.id || !state.profile) await refreshProfile(client);
  if (before !== s.user.id) {
    const { reconcile } = await import('./sync');
    await reconcile();
  }
}

export async function refreshProfile(client?: SupabaseClient): Promise<NinefoldProfile | null> {
  const c = client ?? (await supa());
  if (!session) return null;
  const { data } = await c.from('profiles').select('id, username, title, icon, color, avatar').eq('id', session.user.id).maybeSingle();
  const profile = (data as NinefoldProfile | null) ?? null;
  setAccount({ profile });
  return profile;
}

/** A sign-in error in words a player can act on. */
export function explainAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (/code verifier|flow state|pkce/.test(m)) return 'Sign-in started in another tab or on another address. Press sign in again here and finish it in this tab.';
  if (/access_denied|cancel/.test(m)) return 'Sign-in was cancelled. Try again whenever you like.';
  if (/disallowed_useragent|webview/.test(m)) return 'Google does not allow signing in from inside this app. Open the site in Chrome, Safari or Edge.';
  if (/fetch|network|load failed/.test(m)) return 'The connection dropped while signing in. Check your internet and try again.';
  return `Sign-in didn't finish: ${raw}. Please try again.`;
}

/** On start: restore a stored session, or finish a sign-in that just came back. Loads nothing otherwise. */
export async function startAccounts(): Promise<void> {
  let stored = false;
  try {
    stored = !!localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage blocked: stay signed out.
  }
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const failed = params.get('error_description') ?? params.get('error');
  if (!stored && !code && !failed) {
    setAccount({ status: 'signedOut' });
    return;
  }
  setAccount({ status: 'loading' });
  // Drop ?code=… straight away so a reload never tries to use it twice.
  if (code || failed) history.replaceState(history.state, '', location.pathname + location.hash);
  try {
    const client = await supa();
    if (failed) setAccount({ error: explainAuthError(failed) });
    else if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (error) setAccount({ error: explainAuthError(error.message) });
    }
    const { data } = await client.auth.getSession();
    await applySession(client, data.session);
    if (data.session) setAccount({ error: null });
  } catch (e) {
    setAccount({ status: 'signedOut', error: code || failed ? explainAuthError(e instanceof Error ? e.message : String(e)) : null });
  }
}

export type Provider = 'discord' | 'google';

export async function signInWith(provider: Provider): Promise<void> {
  setAccount({ error: null });
  const client = await supa();
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${location.origin}/`, ...(provider === 'google' ? { queryParams: { prompt: 'select_account' } } : {}) },
  });
  if (error) setAccount({ error: explainAuthError(error.message) });
}

/** Signs out after one last upload, so nothing done on this device is left behind. */
export async function signOut(): Promise<void> {
  const client = await supa();
  try {
    const { flushNow } = await import('./sync');
    await flushNow();
  } catch {
    // Sign out anyway.
  }
  await client.auth.signOut();
}

/** The universal Ninefold username: the only profile field Dragon Vision writes. */
export async function setUsername(name: string): Promise<string | null> {
  if (!USERNAME_RULE.test(name)) return 'Use 3-18 letters, numbers or underscores.';
  const client = await supa();
  if (!session) return 'Sign in first.';
  const { error } = await client.from('profiles').update({ username: name, updated_at: new Date().toISOString() }).eq('id', session.user.id);
  if (error) return error.code === '23505' ? 'That name is taken.' : error.code === '23514' ? 'Use 3-18 letters, numbers or underscores.' : error.message;
  await refreshProfile(client);
  return null;
}

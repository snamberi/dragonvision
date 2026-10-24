import { useState } from 'react';
import { type Provider, setUsername, signInWith, signOut, useAccount } from '../cloud/account';
import { USERNAME_RULE, profileUrl } from '../cloud/config';
import type { DragonSummary } from '../cloud/summary';
import { resolveConflict } from '../cloud/sync';
import { Modal } from './Modal';
import { SocialIcon } from './SocialLinks';

function ago(at: number | null): string {
  if (!at) return 'not yet';
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
}

/** Settings: sign in to a Ninefold account, pick the universal username, see cloud save status. */
export function AccountSection() {
  const account = useAccount();
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signIn = async (provider: Provider) => {
    setBusy(true);
    await signInWith(provider);
    setBusy(false);
  };
  const saveName = async () => {
    setBusy(true);
    const problem = await setUsername(name.trim());
    setBusy(false);
    setMessage(problem ?? 'Username saved.');
    if (!problem) setName('');
  };

  if (account.status === 'idle' || account.status === 'loading') {
    return (
      <div className="account-box">
        <p className="muted small-text">Checking your Ninefold account…</p>
      </div>
    );
  }

  if (account.status === 'signedOut') {
    return (
      <div className="account-box">
        <p className="small-text">
          One Ninefold account for every NineFoldVision game. Your Dragon Vision progress is backed up and shows on your Ninefold profile; it
          stays separate from Court Vision's.
        </p>
        <div className="button-row">
          <button className="btn small primary account-provider" disabled={busy} onClick={() => signIn('discord')}>
            <SocialIcon id="discord" size={16} /> Sign in with Discord
          </button>
          <button className="btn small account-provider" disabled={busy} onClick={() => signIn('google')}>
            <span className="google-g" aria-hidden="true">G</span> Sign in with Google
          </button>
        </div>
        {account.error && <p className="account-error small-text">{account.error}</p>}
        <p className="muted small-text">Signing in is optional. The game works fully without an account.</p>
      </div>
    );
  }

  const username = account.profile?.username ?? null;
  const sync = account.sync;
  const syncText =
    sync.state === 'syncing' ? 'Saving to the cloud…' : sync.state === 'error' ? `Cloud save failed: ${sync.message ?? 'unknown error'}` : `Cloud save: ${ago(sync.at)}`;
  return (
    <div className="account-box">
      <p className="small-text">
        Signed in{account.provider ? ` with ${account.provider === 'discord' ? 'Discord' : account.provider === 'google' ? 'Google' : account.provider}` : ''} as{' '}
        <b>{username ?? 'a new player'}</b>
      </p>
      <p className={`small-text ${sync.state === 'error' ? 'account-error' : 'muted'}`}>{syncText}</p>
      <label className="account-name">
        <span className="small-text">{username ? 'Change your Ninefold username' : 'Choose your Ninefold username'}</span>
        <span className="account-name-row">
          <input
            value={name}
            maxLength={18}
            placeholder={username ?? 'YourName'}
            onChange={(e) => {
              setName(e.target.value);
              setMessage(null);
            }}
            aria-label="Ninefold username"
          />
          <button className="btn small" disabled={busy || !USERNAME_RULE.test(name.trim())} onClick={saveName}>
            Save
          </button>
        </span>
      </label>
      <p className="muted small-text">3-18 letters, numbers or underscores. The same name shows in every NineFoldVision game.</p>
      {message && <p className="small-text">{message}</p>}
      <div className="button-row">
        {username && (
          <a className="btn small primary" href={profileUrl(username)} target="_blank" rel="noopener noreferrer">
            View your Ninefold profile ↗
          </a>
        )}
        <button className="btn small" disabled={busy} onClick={() => void signOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}

/** Top bar: a small chip showing who is signed in (hidden when signed out). */
export function AccountChip({ onOpen }: { onOpen: () => void }) {
  const account = useAccount();
  if (account.status !== 'signedIn') return null;
  const name = account.profile?.username ?? 'Account';
  const failed = account.sync.state === 'error';
  return (
    <button
      className={`account-chip ${failed ? 'sync-error' : ''}`}
      onClick={onOpen}
      title={failed ? 'Cloud save failed: open Settings' : `Signed in as ${name}`}
      aria-label={`Ninefold account: ${name}${failed ? ', cloud save failed' : ''}`}
    >
      <span className="account-dot" aria-hidden="true" />
      <span className="account-chip-name">{name}</span>
    </button>
  );
}

function SummaryCard({ title, s }: { title: string; s: DragonSummary }) {
  return (
    <div className="conflict-card">
      <b>{title}</b>
      <span>Stage {s.highestStage} cleared</span>
      <span>{s.fighters} fighters · team power {s.teamPower.toLocaleString()}</span>
      <span>Rival Tower floor {s.towerFloor}</span>
      {s.strongest[0] && (
        <span>
          Strongest: {s.strongest[0].name} {s.strongest[0].star}★ Lv {s.strongest[0].level}
        </span>
      )}
    </div>
  );
}

/** Both this device and the cloud have different progress: the player chooses which to keep. */
export function CloudConflictDialog() {
  const { conflict } = useAccount();
  const [busy, setBusy] = useState(false);
  if (!conflict) return null;
  const keep = async (choice: 'local' | 'cloud') => {
    if (!window.confirm(choice === 'cloud' ? 'Replace this device\'s progress with the cloud save?' : 'Replace the cloud save with this device\'s progress?')) return;
    setBusy(true);
    await resolveConflict(choice);
    setBusy(false);
  };
  return (
    <Modal title="Which progress do you keep?" onClose={() => undefined} className="cloud-conflict">
      <p className="small-text">This device and your Ninefold account have different Dragon Vision progress. Pick one; the other is replaced.</p>
      <div className="conflict-cards">
        <SummaryCard title="This device" s={conflict.local} />
        <SummaryCard title="Cloud save" s={conflict.cloud} />
      </div>
      <div className="button-row">
        <button className="btn primary" disabled={busy} onClick={() => keep('local')}>
          Keep this device
        </button>
        <button className="btn" disabled={busy} onClick={() => keep('cloud')}>
          Keep the cloud save
        </button>
      </div>
    </Modal>
  );
}

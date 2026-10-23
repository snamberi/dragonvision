import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { HOME_LETTERS } from '../content/mail';
import { ACHIEVEMENTS, achievementState, claimAchievement, setTitle, unlockedTitles } from '../game/achievements';
import { homeFor, personalizeHome, readHomeLetter, claimHomeLetter } from '../game/home';
import { LOGIN_TRACK, claimLogin, loginIndex, loginReady } from '../game/login';
import { unitName } from '../game/progression';
import { getFamily } from '../game/roster';
import type { HomeData, SaveData, Unit } from '../game/types';
import { identityFor } from '../art/identity';
import { SignaturePreview } from './AttackEffect';
import type { Updater } from './App';
import { HomeDialog } from './HomeDialog';
import { HOME_COLORS, HomeEmblem, HomeProp, HouseArt } from './HomeArt';
import { ItemIcon } from './ItemIcon';
import { PixelIcon } from './PixelIcon';
import { Sprite } from './Sprite';
import { describeSpecial } from './specialText';

interface Props { save: SaveData; update: Updater; onClose: () => void }
const rich = (text: string) => text.split(/(\*\*[^*]+\*\*)/).map((part,i) => part.startsWith('**') ? <b key={i}>{part.slice(2,-2)}</b> : part);

export function HousePanel({ save, update, onClose, selectResident = false }: Props & { selectResident?: boolean }) {
  const home = homeFor(save), resident = save.units.find(u => u.uid === home.residentUid)!;
  const [tab, setTab] = useState(selectResident ? 'resident' : 'profile');
  const [name, setName] = useState(home.name);
  const [palette, setPalette] = useState(home.palette);
  const [banner, setBanner] = useState(home.banner);
  const titles = unlockedTitles(save);
  const [title, chooseTitle] = useState(titles.includes(save.title ?? '') ? save.title ?? '' : '');
  const [message, setMessage] = useState('');
  const saveHome = () => {
    if (update(s => setTitle(personalizeHome(s, { name, palette, banner }), title || null))) setMessage('Your sanctuary is saved. Welcome home.');
  };
  return <HomeDialog title="Make yourself at home" eyebrow="YOUR HOUSE · PERSONAL SANCTUARY" onClose={onClose} className="house-panel">
    <div className="home-panel-tabs" role="group" aria-label="House sections">
      <button aria-pressed={tab==='profile'} onClick={()=>setTab('profile')}><PixelIcon kind="home" size={20}/> Profile & decor</button>
      <button aria-pressed={tab==='resident'} onClick={()=>setTab('resident')}><PixelIcon kind="fighters" size={20}/> Your resident</button>
    </div>
    {tab==='profile' ? <>
      <div className="home-profile-grid">
        <aside className="home-resident-card" style={{'--resident-color':identityFor(resident.familyId).color} as CSSProperties}>
          <span className="home-eyebrow">HOME SWEET HOME</span>
          <div className="home-resident-portrait"><Sprite familyId={resident.familyId} star={resident.star} size={190}/></div>
          <h3>{unitName(resident)}</h3><span className="home-rank">{save.title || 'A new adventure'} · {resident.star}★</span>
          <button className="home-link" onClick={()=>setTab('resident')}>Change resident →</button>
          <div className="home-profile-stats"><div><strong>{save.clearedStage}</strong><span>Stages cleared</span></div><div><strong>{save.counters.wins}</strong><span>Battles won</span></div><div><strong>{new Set(save.units.map(u=>u.familyId)).size}</strong><span>Fighters found</span></div></div>
        </aside>
        <div className="home-customize">
          <label className="home-field">Your name<input value={name} maxLength={24} onChange={e=>{setName(e.target.value);setMessage('');}} placeholder="Traveler" autoComplete="off"/></label>
          <label className="home-field">Your title<select value={title} onChange={e=>{chooseTitle(e.target.value);setMessage('');}}><option value="">No title</option>{titles.map(t=><option key={t}>{t}</option>)}</select></label>
          <fieldset className="home-choice-group"><legend>Roof color</legend><div className="home-color-options">{(Object.keys(HOME_COLORS) as HomeData['palette'][]).map(key=><button key={key} aria-pressed={palette===key} onClick={()=>{setPalette(key);setMessage('');}}><span className="home-roof-swatch" style={{background:HOME_COLORS[key].roof,borderTopColor:HOME_COLORS[key].light}}/>{HOME_COLORS[key].name}</button>)}</div></fieldset>
          <fieldset className="home-choice-group"><legend>House banner</legend><div className="home-banner-options">{(['sun','moon','leaf'] as const).map(key=><button key={key} aria-pressed={banner===key} onClick={()=>{setBanner(key);setMessage('');}}><HomeEmblem kind={key}/>{key==='sun'?'Sun':key==='moon'?'Moon':'Leaf'}</button>)}</div></fieldset>
          <div className="home-miniature"><HouseArt palette={palette} banner={banner}/><div><span className="home-eyebrow">YOUR NEW LOOK</span><strong>{name.trim() || 'Traveler'}’s place</strong><span>{HOME_COLORS[palette].name} roof · {banner} banner</span></div></div>
        </div>
      </div>
      <footer className="home-dialog-footer"><span role="status">{message || 'A little place that feels like you.'}</span><button className="btn primary" onClick={saveHome}>Save home</button></footer>
    </> : <div className="home-resident-picker">
      <div className="home-section-intro"><div><h3>Who’s staying home?</h3><p>Your resident appears in the yard and demonstrates their signature move.</p></div><span className="home-count">{save.units.length} owned</span></div>
      <div className="resident-options">{[...save.units].sort((a,b)=>b.star-a.star||b.level-a.level).map(u=><button key={u.uid} aria-pressed={home.residentUid===u.uid} onClick={()=>{if(update(s=>personalizeHome(s,{residentUid:u.uid})))setMessage(`${unitName(u)} is now your resident.`);}} style={{'--resident-color':identityFor(u.familyId).color} as CSSProperties}>
        <span className="resident-chosen">{home.residentUid===u.uid?'AT HOME':'SELECT'}</span><Sprite familyId={u.familyId} star={u.star} size={112}/><strong>{unitName(u)}</strong><span>Level {u.level} <b>{u.star}★</b></span>
      </button>)}</div><p className="home-inline-status" role="status">{message || 'Choose any fighter you own, including evolved forms.'}</p>
    </div>}
  </HomeDialog>;
}

export function MailboxPanel({ save, update, onClose, onUpdates }: Props & {onUpdates:()=>void}) {
  const home = homeFor(save);
  const [selected, setSelected] = useState(() => HOME_LETTERS.find(l=>!home.readMail.includes(l.id))?.id ?? HOME_LETTERS[0].id);
  const [filter,setFilter] = useState<'all'|'unread'|'gifts'>('all');
  const letter = HOME_LETTERS.find(l=>l.id===selected)!;
  useEffect(()=>{update(s=>readHomeLetter(s,selected));},[selected,update]);
  const letters=HOME_LETTERS.filter(l=>filter==='all'||(filter==='gifts'?!!l.gift:!home.readMail.includes(l.id)));
  const claimed=home.claimedMail.includes(letter.id);
  return <HomeDialog title="A letter for you" eyebrow="SANCTUARY POST · MAILBOX" onClose={onClose} className="mail-panel">
    <div className="home-panel-tabs" role="group" aria-label="Mail filter">{(['all','unread','gifts'] as const).map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f==='all'?'All letters':f==='unread'?'Unread':'Parcels'}{f==='unread'&&<span className="home-tab-count">{HOME_LETTERS.filter(l=>!home.readMail.includes(l.id)).length}</span>}</button>)}</div>
    <div className="home-mail-grid">
      <aside className="home-letter-list">{letters.length?letters.map(l=><button key={l.id} className={l.id===selected?'selected':''} onClick={()=>setSelected(l.id)}>
        <span className="mail-envelope" aria-hidden="true">{l.gift?'◇':'✉'}</span><span><small>{l.tag}</small><strong>{l.title}</strong><span>{l.sender}</span></span>{!home.readMail.includes(l.id)&&<i className="mail-unread" aria-label="Unread"/>}
      </button>):<div className="home-mail-empty"><HomeProp kind="mail"/><strong>All caught up.</strong><p>New letters will wait right here.</p></div>}<button className="home-link mail-archive" onClick={onUpdates}>View all update notes →</button></aside>
      <article className="home-letter-paper">
        <div className="home-letter-heading"><div><span>{letter.tag}</span><p>From {letter.sender}</p></div><div className="home-postage"><HomeEmblem/><small>VISION POST</small></div></div>
        <h3>{letter.title}</h3>{letter.paragraphs.map((p,i)=><p key={i}>{rich(p)}</p>)}
        <div className="home-letter-signoff">Until the next adventure,<br/><b>{letter.sender}</b></div>
        {letter.gift&&<div className={`home-mail-parcel ${claimed?'collected':''}`}><ItemIcon icon="spinOrb" size={54}/><div><small>ENCLOSED PARCEL</small><strong>{letter.gift.spins} Spin Orbs</strong><span>{claimed?'Safely added to your Inventory.':'A small gift to start your next adventure.'}</span></div><button className="btn primary" disabled={claimed} onClick={()=>update(s=>claimHomeLetter(s,letter.id))}>{claimed?'Collected ✓':'Collect gift'}</button></div>}
      </article>
    </div>
  </HomeDialog>;
}

function DailyRewardIcon({ day }: {day:number}) {
  return day===1||day===4?<ItemIcon icon="spinOrb" size={42}/>:day===5?<PixelIcon kind="guard" size={34}/>:day===6?<ItemIcon icon="shard" size={42}/>:<PixelIcon kind={day===3?'gem':'coin'} size={34}/>;
}

export function DailyChestPanel({save,update,onClose}:Props) {
  const [received,setReceived]=useState<string|null>(null),ready=loginReady(save);
  const current=ready?loginIndex(save):(loginIndex(save)+6)%7;
  const claim=()=>{const label=LOGIN_TRACK[loginIndex(save)].label;if(update(s=>claimLogin(s)))setReceived(label);};
  return <HomeDialog title="Your daily supplies" eyebrow="THE PORCH · DAILY REWARD" onClose={onClose} className="daily-chest-panel">
    <div className={`home-reward-hero ${!ready?'opened':''}`}><div className="home-chest-halo"><HomeProp kind="chest" active={ready} open={!ready}/></div><div><span className="home-eyebrow">DAY {current+1} OF 7</span><h3>{received?'A little boost for the journey.':ready?'Something good is waiting.':'Supplies collected.'}</h3><p>{received?`You received ${received}.`:ready?`Today’s reward: ${LOGIN_TRACK[current].label}`:'Your next delivery arrives tomorrow.'}</p></div></div>
    <div className="home-reward-track">{LOGIN_TRACK.map((r,i)=>{const done=i<current||i===current&&!ready;return <div key={i} className={`${i===current?'current':''} ${done?'claimed':''} ${i===6?'final-day':''}`}><span>DAY {i+1}</span><DailyRewardIcon day={i}/><strong>{r.label}</strong><small>{done?'COLLECTED':i===current?'TODAY':i===current+1?'NEXT':'UPCOMING'}</small></div>;})}</div>
    <footer className="home-dialog-footer"><span role="status">{received?`Added to your inventory: ${received}.`:`One delivery each day, plus a Dungeon Key. Login streak: ${save.login.streak ?? 0} day${(save.login.streak ?? 0) === 1 ? '' : 's'}; every 7th day in a row unlocks the Streak Boss at the Colosseum.`}</span><button className={`btn ${ready?'primary':''}`} onClick={ready?claim:onClose}>{ready?`Claim day ${current+1}`:'Back to the yard'}</button></footer>
  </HomeDialog>;
}

export function TrophyPanel({save,update,onClose}:Props) {
  const [filter,setFilter]=useState<'all'|'earned'|'ready'>('all');
  const states=ACHIEVEMENTS.map(a=>({a,...achievementState(save,a)}));
  const earned=states.filter(s=>s.claimed).length, ready=states.filter(s=>s.complete&&!s.claimed).length;
  const shown=states.filter(s=>filter==='all'||(filter==='earned'?s.claimed:s.complete&&!s.claimed)).sort((a,b)=>Number(b.complete&&!b.claimed)-Number(a.complete&&!a.claimed));
  return <HomeDialog title="Every trophy tells a story" eyebrow="YOUR JOURNEY · TROPHY SHELF" onClose={onClose} className="trophy-panel">
    <div className="home-trophy-hero"><HomeProp kind="trophy" count={Math.min(earned,3)}/><div><span className="home-eyebrow">THE COLLECTION</span><strong>{earned}<small> / {ACHIEVEMENTS.length}</small></strong><p>{earned?'A shelf filled by your adventures.':'Your first trophy is waiting to be earned.'}</p></div><span className="home-count">{ready} ready to collect</span></div>
    <div className="home-panel-tabs" role="group" aria-label="Trophy filter">{(['all','earned','ready'] as const).map(f=><button key={f} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f==='all'?'All milestones':f==='earned'?'On your shelf':'Ready to collect'}</button>)}</div>
    <div className="home-trophy-grid">{shown.length?shown.map(({a,done,complete,claimed})=><article key={a.id} className={`home-trophy-card ${claimed?'earned':complete?'ready':'locked'}`}><div className="home-trophy-medal"><HomeProp kind="trophy" count={claimed||complete?3:0}/></div><div className="home-trophy-details"><span className="home-eyebrow">{claimed?'ON YOUR SHELF':complete?'MILESTONE COMPLETE':'IN PROGRESS'}</span><h3>{a.name}</h3><p>{a.text}</p><div className="home-progress" role="progressbar" aria-label={a.name} aria-valuemin={0} aria-valuemax={a.goal} aria-valuenow={done}><i style={{width:`${done/a.goal*100}%`}}/></div><div className="home-trophy-meta"><span>{done}/{a.goal}</span><span>{a.reward.gems?`${a.reward.gems} gems`:''}{a.reward.spins?`${a.reward.spins} Spin Orbs`:''}</span></div>{a.title&&<span className="home-title-reward">Title: {a.title}</span>}<button className="btn small" disabled={!complete||claimed} onClick={()=>update(s=>claimAchievement(s,a.id))}>{claimed?'Displayed ✓':complete?'Collect & display':'Keep adventuring'}</button></div></article>):<div className="home-trophy-empty"><HomeProp kind="trophy"/><h3>{filter==='earned'?'A fresh start. An empty shelf.':'No rewards waiting right now.'}</h3><p>{filter==='earned'?'Complete a milestone and collect it to display your first trophy.':'Keep exploring, summoning, and winning battles to earn the next one.'}</p><button className="btn" onClick={()=>setFilter('all')}>See all milestones</button></div>}</div>
  </HomeDialog>;
}

export function TrainingPanel({resident,onClose,onChoose}:{resident:Unit;onClose:()=>void;onChoose:()=>void}) {
  const family=getFamily(resident.familyId),identity=identityFor(resident.familyId);
  const [phase,setPhase]=useState<'idle'|'charge'|'release'|'recover'>('idle');
  const [played,setPlayed]=useState(false),busy=useRef(false),timers=useRef<ReturnType<typeof setTimeout>[]>([]);
  const support=['heal','revive','shield','rally'].includes(family.special.kind);
  useEffect(()=>()=>{timers.current.forEach(clearTimeout);},[]);
  const play=()=>{
    if(busy.current)return;
    busy.current=true;setPlayed(true);
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPhase(reduced?'release':'charge');
    if(!reduced)timers.current.push(setTimeout(()=>setPhase('release'),500));
    timers.current.push(setTimeout(()=>setPhase('recover'),reduced?1000:1600),setTimeout(()=>{setPhase('idle');busy.current=false;},reduced?1300:2100));
  };
  return <HomeDialog title="A little practice goes a long way" eyebrow="THE TRAINING YARD · SIGNATURE PREVIEW" onClose={onClose} className="training-panel">
    <div className="home-training-intro"><div><h3>{unitName(resident)}</h3><p>Level {resident.level} · {resident.star}★ · {family.title}</p></div><button className="btn small" onClick={onChoose}>Change fighter</button></div>
    <div className={`home-training-stage training-${phase}`} style={{'--resident-color':identity.color} as CSSProperties}>
      <svg className="home-training-ground" viewBox="0 0 1000 350" preserveAspectRatio="none" aria-hidden="true" shapeRendering="crispEdges"><path d="M0 0H1000V350H0Z" fill="#4e7165"/><path d="M0 0H1000V85L860 66L650 90L420 65L220 96L0 72Z" fill="#344f50"/><path d="M0 150H1000M0 185H1000" stroke="#acb08c" strokeWidth="10"/>{Array.from({length:15},(_,i)=><path key={i} d={`M${i*76} 128h9v85h-9Z`} fill="#d4c5a0"/>)}<path d="M80 247H930V325H80Z" fill="#65756b"/><path d="M95 254H915V314H95Z" fill="#b3aa8d"/>{[160,300,440,580,720,860].map(x=><path key={x} d={`M${x} 254V314`} stroke="#96967d" strokeWidth="3"/>)}<path d="M95 282H915" stroke="#96967d" strokeWidth="3"/></svg>
      <div className="training-resident"><Sprite familyId={resident.familyId} star={resident.star} size={156} pose={phase==='charge'?'charge':phase==='release'?'punch':phase==='recover'?'victory':'idle'}/></div>
      <div className={`training-target ${phase==='release'&&!support?'hit':''}`}><HomeProp kind="dummy"/></div>
      {phase==='release'&&<SignaturePreview familyId={resident.familyId} kind={family.special.kind} duration={1100}/>}
      <span className="training-stage-caption" role="status">{phase==='charge'?'Gathering energy…':phase==='release'?family.special.name:phase==='recover'?'Nicely done.':played?'Ready to go again.':'Your signature. Your style.'}</span>
    </div>
    <div className="home-move-card"><span className="home-move-icon"><PixelIcon kind={support?'guard':'charge'} size={36}/></span><div><span className="home-eyebrow">SIGNATURE MOVE</span><h3>{family.special.name}</h3><p>{describeSpecial(family.special)}</p></div></div>
    <footer className="home-dialog-footer"><span>Free practice. No Ki or items used.</span><button className="btn primary" disabled={phase!=='idle'} onClick={play}>{phase!=='idle'?'Practicing…':played?'Try it again':'Show signature'}</button></footer>
  </HomeDialog>;
}

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ACHIEVEMENTS, achievementState } from '../game/achievements';
import { homeFor } from '../game/home';
import { loginReady } from '../game/login';
import { unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import { HOME_LETTERS } from '../content/mail';
import type { Tab, Updater } from './App';
import { HOME_PLACES, HomeLandscape, HomeProp, HouseArt } from './HomeArt';
import { DailyChestPanel, HousePanel, MailboxPanel, TrainingPanel, TrophyPanel } from './HomePanels';
import { PixelIcon } from './PixelIcon';
import { Sprite } from './Sprite';

type Panel='house'|'resident'|'mail'|'daily'|'training'|'trophies'|null;
interface Props { save:SaveData;update:Updater;onTravel:(tab:Tab)=>void;onUpdates:()=>void }

export function HomeScreen({save,update,onTravel,onUpdates}:Props) {
  const [panel,setPanel]=useState<Panel>(null);
  const [compact,setCompact]=useState(()=>window.matchMedia('(max-width:700px)').matches);
  const [,tick]=useState(0);
  useEffect(()=>{
    const media=window.matchMedia('(max-width:700px)'),change=()=>setCompact(media.matches);
    media.addEventListener('change',change);
    change();
    const timer=setInterval(()=>tick(v=>v+1),30_000);
    return()=>{media.removeEventListener('change',change);clearInterval(timer);};
  },[]);
  const home=homeFor(save),resident=save.units.find(u=>u.uid===home.residentUid)!;
  const layout=HOME_PLACES[compact?'tall':'wide'];
  const unread=HOME_LETTERS.filter(l=>!home.readMail.includes(l.id)).length;
  const parcel=HOME_LETTERS.some(l=>l.gift&&!home.claimedMail.includes(l.id));
  const daily=loginReady(save);
  const trophies=ACHIEVEMENTS.filter(a=>achievementState(save,a).claimed).length;
  const trophyReady=ACHIEVEMENTS.filter(a=>{const st=achievementState(save,a);return st.complete&&!st.claimed;}).length;
  const close=()=>setPanel(null);
  const spot=(key:'house'|'mail'|'chest'|'resident'|'dummy'|'trophy'|'sign',label:string,art:ReactNode,action:()=>void,badge?:string)=>{
    const [x,y]=layout[key];
    return <button className={`home-spot home-spot-${key} ${badge?'has-notice':''}`} aria-label={label} style={{left:`${x/layout.w*100}%`,top:`${y/layout.h*100}%`} as CSSProperties} onClick={action}>
      {badge&&<span className="home-spot-badge">{badge}</span>}{art}<span className="home-spot-label">{key==='house'?`${home.name}’s home`:key==='resident'?unitName(resident):label}<i aria-hidden="true">↗</i></span>
    </button>;
  };
  return <div className="homestead">
    <section className={`home-map ${compact?'compact':''}`} aria-label="Your sanctuary">
      <HomeLandscape compact={compact}/>
      <header className="home-welcome"><div><span className="home-eyebrow">YOUR LITTLE CORNER OF THE WORLD</span><h2>Welcome home, {home.name}.</h2><p>{save.title || 'Every adventure starts somewhere.'}</p></div><button className="home-journey" onClick={()=>onTravel('stages')}><PixelIcon kind="stages" size={25}/><span><small>YOUR NEXT ADVENTURE</small><strong>{save.clearedStage>=380?'Revisit the journey':`Stage ${save.clearedStage+1}`}</strong></span><b>→</b></button></header>
      {spot('house','Open your house',<HouseArt palette={home.palette} banner={home.banner}/>,()=>setPanel('house'))}
      {spot('mail','Mailbox',<HomeProp kind="mail" active={unread>0||parcel}/>,()=>setPanel('mail'),unread?`${unread} NEW`:parcel?'PARCEL':undefined)}
      {spot('chest','Daily supplies',<HomeProp kind="chest" active={daily} open={!daily}/>,()=>setPanel('daily'),daily?'READY':undefined)}
      {spot('resident','Choose your resident',<div className="home-yard-resident"><Sprite familyId={resident.familyId} star={resident.star} size={compact?90:115}/><span className="home-resident-shadow"/></div>,()=>setPanel('resident'))}
      {spot('dummy','Training yard',<HomeProp kind="dummy"/>,()=>setPanel('training'))}
      {spot('trophy','Trophy shelf',<HomeProp kind="trophy" count={Math.min(trophies,3)}/>,()=>setPanel('trophies'),trophyReady?`${trophyReady} EARNED`:undefined)}
      {spot('sign','Vision City',<HomeProp kind="sign"/>,()=>onTravel('city'))}
      <div className="home-map-note"><span aria-hidden="true">✦</span> A place to rest. A world to explore.</div>
    </section>
    {(panel==='house'||panel==='resident')&&<HousePanel save={save} update={update} onClose={close} selectResident={panel==='resident'}/>}
    {panel==='mail'&&<MailboxPanel save={save} update={update} onClose={close} onUpdates={()=>{close();onUpdates();}}/>}
    {panel==='daily'&&<DailyChestPanel save={save} update={update} onClose={close}/>}
    {panel==='trophies'&&<TrophyPanel save={save} update={update} onClose={close}/>}
    {panel==='training'&&<TrainingPanel resident={resident} onClose={close} onChoose={()=>setPanel('resident')}/>}
  </div>;
}

import { useEffect, useRef, useState } from 'react';
import type { Updater } from './App';
/** Visual feedback follows a successful commit; it never delays or repeats a mutation. */
export function useActionFeedback(commit: Updater) {
 const [notice,setNotice]=useState<{id:number;text:string}|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const serial=useRef(0);
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
 const update=(change:Parameters<Updater>[0],message='Changes saved')=>{
  const success=commit(change);
  if(success){if(timer.current)clearTimeout(timer.current);setNotice({id:++serial.current,text:message});timer.current=setTimeout(()=>setNotice(null),2600)}
  return success;
 };
 const feedback=<div className="activity-feedback" role="status" aria-live="polite" aria-atomic="true">{notice&&<span key={notice.id}><b aria-hidden="true">✦</b>{notice.text}</span>}</div>;
 return {update,feedback};
}

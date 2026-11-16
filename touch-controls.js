// Pointer ownership lets one thumb move while the other activates an action.
export function stickVector(dx,dy,radius=42,dead=.12){
  const distance=Math.hypot(dx,dy),amount=Math.min(1,distance/radius);
  if(amount<=dead)return {x:0,y:0};
  const scale=(amount-dead)/(1-dead)/distance;return {x:dx*scale,y:dy*scale};
}
export function createTouchControls({enabled,onAction}){
  const root=document.documentElement,stick=document.getElementById('move-stick'),knob=document.getElementById('stick-knob'),action=document.getElementById('touch-action'),menu=document.getElementById('touch-menu');
  let pointer=null,vector={x:0,y:0};
  const coarse=matchMedia('(any-pointer: coarse)');
  const reveal=()=>{if(coarse.matches||navigator.maxTouchPoints>0)root.classList.add('touch-ui');};reveal();coarse.addEventListener('change',reveal);
  function closeMenu(){root.classList.remove('mobile-menu-open');menu.setAttribute('aria-expanded','false');}
  function reset(){const id=pointer;pointer=null;vector={x:0,y:0};knob.style.transform='translate(0px,0px)';if(id!==null&&stick.hasPointerCapture(id))stick.releasePointerCapture(id);}
  function position(e){const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,radius=r.width*.32,n=Math.hypot(dx,dy)||1,k=Math.min(1,radius/n);vector=stickVector(dx,dy,radius);knob.style.transform=`translate(${dx*k}px,${dy*k}px)`;}
  stick.addEventListener('pointerdown',e=>{if(pointer!==null||!enabled()||e.button!==0)return;e.preventDefault();closeMenu();pointer=e.pointerId;stick.setPointerCapture(pointer);position(e);});
  stick.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();if(!enabled()){reset();return;}position(e);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(name,e=>{if(e.pointerId===pointer)reset();});
  const activate=()=>{reset();closeMenu();onAction();};
  action.addEventListener('pointerdown',e=>{if(e.button!==0||action.disabled)return;e.preventDefault();activate();});
  // A second finger does not reliably generate click in mobile browsers.
  // Keep synthetic/keyboard activation, without replaying the pointer action.
  action.addEventListener('click',e=>{if(e.detail===0)activate();});
  menu.addEventListener('click',()=>{reset();const open=root.classList.toggle('mobile-menu-open');menu.setAttribute('aria-expanded',String(open));});
  document.querySelector('.facade-actions').addEventListener('click',closeMenu);
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')root.classList.add('touch-ui');});
  window.addEventListener('resize',reset);window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  return {read:()=>vector,reset,setAction(label,available){if(action.textContent!==label){action.textContent=label;action.setAttribute('aria-label',label);}action.disabled=!available;},setPaused(paused){document.getElementById('touch-controls').inert=paused;if(paused){reset();closeMenu();}}};
}

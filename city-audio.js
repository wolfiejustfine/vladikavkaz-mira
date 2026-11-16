import {createTramAudio} from './tram-audio.js';
// Original procedural ambience: distant traffic, air and occasional birds.
// No recording, network request or microphone access. One quiet ambience bus.
const STORAGE='vladikavkaz.city-sound.v1';
export function makeCitySamples(rate=22050,seconds=24){
  const samples=new Float32Array(rate*seconds);let seed=71513,low=0;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;};
  for(let i=0;i<samples.length;i++){
    const t=i/rate,noise=random();low=.995*low+.005*noise;
    const traffic=.6+.4*Math.sin(Math.PI*t/seconds)**2;
    let sample=low*1.9*traffic+noise*.012;
    for(const start of [3.7,11.3,19.6]){const u=t-start;if(u>0&&u<.65)sample+=Math.sin(2*Math.PI*(1700*u+550*u*u))*.016*Math.sin(Math.PI*u/.65)**2;}
    const edge=Math.min(1,t/.8,(seconds-t)/.8);samples[i]=sample*edge;
  }
  return samples;
}
export function createCityAudio(button){
  const tramAudio=createTramAudio();
  let context,bus,source,enabled=true,failed=false,quiet=false,target=0;
  try{enabled=localStorage.getItem(STORAGE)!=='off';}catch{}
  const supported=!!(window.AudioContext||window.webkitAudioContext);
  function label(){button.setAttribute('aria-pressed',String(enabled&&supported&&!failed));button.textContent=!supported||failed?'Звук недоступен':enabled?'♫ Звуки города: вкл.':'♫ Город: без звука';button.title='Городской фон и звуки трамвая. Включить или выключить';button.disabled=!supported||failed;}
  function mix(){tramAudio.setQuiet(!enabled||quiet);const next=enabled&&!quiet?.18:0;if(bus&&next!==target){bus.gain.setTargetAtTime(next,context.currentTime,.2);target=next;}}
  async function unlock(){
    if(!enabled||!supported||failed)return;
    try{
      if(!context){
        context=new (window.AudioContext||window.webkitAudioContext)();bus=context.createGain();bus.gain.value=0;bus.connect(context.destination);tramAudio.attach(context);
        const data=makeCitySamples(),buffer=context.createBuffer(1,data.length,22050);buffer.copyToChannel(data,0);
        source=context.createBufferSource();source.buffer=buffer;source.loop=true;
        const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3200;source.connect(filter);filter.connect(bus);source.start();
      }
      if(context.state==='suspended')await context.resume();mix();
    }catch{failed=true;label();}
  }
  button.addEventListener('click',()=>{enabled=!enabled;try{localStorage.setItem(STORAGE,enabled?'on':'off');}catch{}label();mix();void unlock();});
  window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);
  label();
  return {updateTrams(listener,fleet,time){tramAudio.update(listener,fleet,time);},setQuiet(value){quiet=value;mix();},snapshot:()=>({trams:tramAudio.snapshot(),enabled,supported,failed,state:context?.state||'locked',gain:bus?.gain.value||0,target}),dispose(){window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);source?.stop();tramAudio.dispose();void context?.close();}};
}

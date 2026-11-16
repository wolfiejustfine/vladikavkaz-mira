// Original synthesized effects; shared AudioContext with the city ambience.
const RATE=22050;
export function tramDistanceGain(distance){
  const d=Math.max(0,distance),fade=Math.max(0,Math.min(1,(110-d)/40));
  return fade*fade*(3-2*fade)/(1+(d/18)**2);
}
export function tramSoundEvents(previous,current){
  if(!previous||current.phase!=='stopped')return [];
  const same=previous.phase==='stopped'&&previous.stop?.id===current.stop?.id;
  const events=[];
  if(current.doors>0&&(!same||previous.doors===0))events.push('doors');
  if(same&&previous.remaining>1.4&&current.remaining<=1.4)events.push('bell');
  return events;
}
export function makeTramSamples(kind,rate=RATE){
  const seconds={rolling:.8,bell:1.6,doors:1.1}[kind];
  if(!seconds)throw new Error('Unknown tram sound');
  const out=new Float32Array(Math.round(rate*seconds));let seed=485,low=0;
  const noise=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;};
  for(let i=0;i<out.length;i++){
    const t=i/rate,n=noise();low=low*.97+n*.03;let value=0;
    if(kind==='rolling'){
      value=.15*low+.016*Math.sin(2*Math.PI*70*t);
      for(const hit of [.06,.22,.46,.62]){const u=t-hit;if(u>=0&&u<.13)value+=(Math.sin(2*Math.PI*125*u)*.24+n*.12)*Math.exp(-u*45)*Math.min(1,u/.003);}
    }else if(kind==='bell'){
      for(const hit of [0,.22]){const u=t-hit;if(u>=0)value+=.17*(Math.sin(2*Math.PI*830*u)+.43*Math.sin(2*Math.PI*1831*u)+.2*Math.sin(2*Math.PI*2703*u))*Math.exp(-u*4.5)*Math.min(1,u/.004);}
    }else{
      const envelope=Math.sin(Math.PI*t/seconds)**2;
      value=(n*.09+low*.32+Math.sin(2*Math.PI*(180*t+45*t*t))*.025)*envelope;
      if(t>.94){const u=t-.94;value+=Math.sin(2*Math.PI*100*u)*.15*Math.exp(-u*60)*Math.min(1,u/.003);}
    }
    const edge=Math.min(1,t/.006,(seconds-t)/.018);out[i]=value*edge;
  }
  return out;
}
export function createTramAudio(){
  let context,bus,quiet=true,lastTime=null;
  const buffers=new Map(),cars=new Map(),previous=new Map(),counts={bell:0,doors:0};
  function attach(ctx){
    context=ctx;bus=ctx.createGain();bus.gain.value=quiet?0:10**(-6/20);bus.connect(ctx.destination);
    for(const kind of ['rolling','bell','doors']){const data=makeTramSamples(kind),buffer=ctx.createBuffer(1,data.length,RATE);buffer.copyToChannel(data,0);buffers.set(kind,buffer);}
  }
  function carFor(id){
    if(cars.has(id))return cars.get(id);
    const spatial=context.createGain(),rolling=context.createGain(),loop=context.createBufferSource();
    spatial.gain.value=0;rolling.gain.value=0;spatial.connect(bus);rolling.connect(spatial);
    loop.buffer=buffers.get('rolling');loop.loop=true;loop.connect(rolling);loop.start();
    const car={spatial,rolling,loop,shots:new Set(),distance:0,gain:0,speed:0};cars.set(id,car);return car;
  }
  function stopShots(){for(const car of cars.values())for(const shot of [...car.shots]){shot.stop();shot.disconnect();car.shots.delete(shot);}}
  function setQuiet(value){
    if(quiet===value)return;quiet=value;
    if(bus)bus.gain.setTargetAtTime(quiet?0:10**(-6/20),context.currentTime,.04);
    if(quiet)stopShots();
  }
  function update(listener,fleet,time){
    const reset=lastTime!==null&&time<lastTime;if(reset){previous.clear();stopShots();}lastTime=time;
    for(const tram of fleet){
      const id=tram.direction,old=previous.get(id),events=tramSoundEvents(old,tram);
      previous.set(id,tram);
      if(!context)continue;
      const car=carFor(id),distance=Math.hypot(listener.x-tram.x,listener.y-tram.y),gain=tramDistanceGain(distance)*tram.opacity;
      car.distance=distance;car.gain=gain;car.speed=tram.speed;
      car.spatial.gain.setTargetAtTime(gain,context.currentTime,.08);
      car.rolling.gain.setTargetAtTime(tram.speed>.03?Math.min(1,tram.speed/5.5)*.65:0,context.currentTime,.06);
      car.loop.playbackRate.setTargetAtTime(Math.max(.12,tram.speed/5.5),context.currentTime,.08);
      if(quiet||context.state!=='running'||gain<.001||reset)continue;
      for(const kind of events){
        const shot=context.createBufferSource();shot.buffer=buffers.get(kind);shot.connect(car.spatial);car.shots.add(shot);
        shot.onended=()=>{shot.disconnect();car.shots.delete(shot);};shot.start();counts[kind]++;
      }
    }
  }
  return {attach,update,setQuiet,snapshot:()=>({quiet,busGain:bus?.gain.value||0,counts:{...counts},cars:[...cars].map(([direction,c])=>({direction,distance:c.distance,gain:c.gain,speed:c.speed,rollingGain:c.rolling.gain.value,activeShots:c.shots.size}))}),dispose(){stopShots();for(const car of cars.values()){car.loop.stop();car.loop.disconnect();car.spatial.disconnect();car.rolling.disconnect();}bus?.disconnect();}};
}

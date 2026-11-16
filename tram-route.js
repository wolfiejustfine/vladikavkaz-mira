// Shared stop locations from the existing 2GIS-led layout. Timings are gameplay,
// not a real timetable. This module has no rendering or landscape dependencies.
export const TRAM={width:2.5,length:16.5,height:3.5,pantographHeight:5.4,track:1,maxSpeed:5.5,acceleration:1.2,dwell:10};
export const TRAM_STOPS=[
  {id:'stop-0',track:0,y:-408,name:'Кирова',variant:0},
  {id:'stop-1',track:1,y:-398,name:'Кирова',variant:0},
  {id:'stop-2',track:0,y:-174,name:'Джанаева',variant:1},
  {id:'stop-3',track:1,y:-212,name:'Джанаева',variant:1},
  {id:'stop-4',track:0,y:36,name:'Театральная площадь',variant:2},
  {id:'stop-5',track:1,y:46,name:'Театральная площадь',variant:2},
];
function schedule(direction){
  const phases=[];let elapsed=0,previous=direction===1?-428:136;
  const stops=TRAM_STOPS.filter(s=>s.track===(direction===1?1:0)).sort((a,b)=>direction*(a.y-b.y));
  for(const stop of [...stops,null]){
    const target=stop?stop.y-direction*5.2:direction===1?136:-428,distance=Math.abs(target-previous);
    const ramp=Math.min(TRAM.maxSpeed/TRAM.acceleration,Math.sqrt(distance/TRAM.acceleration));
    const speed=TRAM.acceleration*ramp,cruise=Math.max(0,(distance-speed*ramp)/speed),duration=2*ramp+cruise;
    phases.push({kind:'move',start:elapsed,duration,from:previous,to:target,ramp,cruise,speed,stop});elapsed+=duration;
    if(stop){phases.push({kind:'stop',start:elapsed,duration:TRAM.dwell,y:target,stop});elapsed+=TRAM.dwell;}previous=target;
  }
  return {phases,cycle:elapsed,start:phases.find(p=>p.kind==='stop'&&p.stop.variant===2).start+2};
}
const south=schedule(1),north=schedule(-1);
export const TRAM_PHASES=south.phases,TRAM_CYCLE=south.cycle,TRAM_START=south.start;
export const NORTH_PHASES=north.phases,NORTH_CYCLE=north.cycle,NORTH_START=north.start;
export function tramAtTime(time,direction=1){
  const schedule=direction===1?south:north,track=direction===1?1:0;
  const t=(Math.max(0,Number.isFinite(time)?time:0)+schedule.start)%schedule.cycle;
  const p=schedule.phases.find(p=>t<p.start+p.duration)||schedule.phases.at(-1),u=t-p.start;
  if(p.kind==='stop')return{direction,track,terminal:p.stop.variant===(direction===1?2:0),y:p.y,speed:0,doors:Math.max(0,Math.min(1,u-.5,p.duration-u-1)),stop:p.stop,phase:'stopped',opacity:1,remaining:Math.max(0,p.duration-u)};
  let distance,speed;
  if(u<p.ramp){speed=TRAM.acceleration*u;distance=.5*TRAM.acceleration*u*u;}
  else if(u<p.ramp+p.cruise){speed=p.speed;distance=.5*p.speed*p.ramp+p.speed*(u-p.ramp);}
  else{const left=p.duration-u;speed=TRAM.acceleration*left;distance=Math.abs(p.to-p.from)-.5*TRAM.acceleration*left*left;}
  const y=p.from+direction*distance;
  return{direction,track,terminal:false,y,speed,doors:0,stop:p.stop,phase:u<p.ramp?'accelerating':u<p.ramp+p.cruise?'moving':'braking',opacity:Math.max(0,Math.min(1,(y+428)/8,(136-y)/8)),remaining:0};
}

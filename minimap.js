import {AVENUE,PARKS,CROSS_STREETS,avenueSamples,trackCenterX} from './avenue.js';
import {PATHS,SQUARE,SQUARE_BEDS,SQUARE_FLOWERS,MONUMENT_FOOTPRINT,FOUNTAIN,FOUNTAIN_WALK,ALLEY_FLOWERS,ALLEY_STOPS,ribbon,circle} from './landscape.js';
export const MAP_DIAMETER_METRES=260;
export function minimapPoint(x,y,player,size){const scale=size/MAP_DIAMETER_METRES;return{x:size/2+(x-player.x)*scale,y:size/2+(y-player.y)*scale};}

// Fixed north-up projection. Distant destinations stay visible at the rim.
export function minimapTarget(target,player,size){
  if(!target)return null;
  const p=minimapPoint(target.x,target.y,player,size),dx=p.x-size/2,dy=p.y-size/2,d=Math.hypot(dx,dy),radius=Math.max(0,size/2-12),ratio=d>radius?radius/d:1;
  return {id:target.id,x:size/2+dx*ratio,y:size/2+dy*ratio,offscreen:d>radius,angle:Math.atan2(dy,dx),distance:Math.hypot(target.x-player.x,target.y-player.y)};
}
export function createMinimap(canvas,label,{buildings,pois}){
  const c=canvas.getContext('2d'),samples=avenueSamples();let last=0,signature='',paintCount=0,lastTarget=null;
  const path=(ring,close=true)=>{ring.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(close)c.closePath();};
  function draw(player,visited,now,target=null){
    const size=canvas.clientWidth,dpr=Math.min(devicePixelRatio||1,2);
    const next=[player.x.toFixed(2),player.y.toFixed(2),player.heading.toFixed(3),visited.size,size,dpr,target?.id||'',target?.x,target?.y].join(':');
    if(!size||next===signature||now-last<100)return;
    last=now;signature=next;paintCount++;
    const pixels=Math.round(size*dpr);if(canvas.width!==pixels){canvas.width=pixels;canvas.height=pixels;}
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,size,size);c.save();
    c.beginPath();c.arc(size/2,size/2,size/2-1,0,Math.PI*2);c.clip();
    c.fillStyle='#e9e3ce';c.fillRect(0,0,size,size);
    const scale=size/MAP_DIAMETER_METRES;
    c.translate(size/2-player.x*scale,size/2-player.y*scale);c.scale(scale,scale);
    for(const street of CROSS_STREETS){c.beginPath();path(ribbon(street.points,street.width));c.fillStyle='#bfc2b1';c.fill();}
    for(const park of PARKS){c.beginPath();path(park.polygon);c.fillStyle='#a4bc83';c.fill();}
    for(let track=0;track<2;track++){
      c.beginPath();path(samples.map(y=>[trackCenterX(y,track),y]),false);c.strokeStyle='#b1b8a5';c.lineWidth=AVENUE.trackHalfWidth*2;c.stroke();
      c.strokeStyle='#6f8275';c.lineWidth=.65/scale;c.stroke();
    }
    c.beginPath();path(SQUARE);c.fillStyle='#f1e9d2';c.fill();
    for(const p of PATHS){c.beginPath();path(ribbon(p.points,p.width));c.fillStyle='#f1e9d2';c.fill();}
    for(const bed of ALLEY_FLOWERS){c.beginPath();path(bed.polygon);c.fillStyle='#bd9b69';c.fill();}
    for(const stop of ALLEY_STOPS){c.fillStyle='#578698';c.fillRect(stop.x-1,stop.y-1,2,2);}
    for(const bed of SQUARE_BEDS){c.beginPath();path(bed);c.fillStyle='#9eb77d';c.fill();}
    for(const bed of SQUARE_FLOWERS){c.beginPath();path(bed);c.fillStyle='#c39465';c.fill();}
    c.beginPath();path(MONUMENT_FOOTPRINT);c.fillStyle='#6c7970';c.fill();
    c.beginPath();path(FOUNTAIN_WALK);c.strokeStyle='#b7aa92';c.lineWidth=.6/scale;c.stroke();
    c.beginPath();path(circle(FOUNTAIN.x,FOUNTAIN.y,FOUNTAIN.radius));c.fillStyle='#6999a6';c.fill();
    for(const b of buildings){
      c.beginPath();path(b.polygon);for(const hole of b.holes||[])path(hole);
      c.fillStyle=b.id==='hotel'?'#b69762':b.role==='context'?'#c5bda7':'#809586';c.fill('evenodd');c.strokeStyle='#f6efdb';c.lineWidth=.6/scale;c.stroke();
    }
    c.setTransform(dpr,0,0,dpr,0,0);
    for(const poi of pois){
      const p=minimapPoint(poi.x,poi.y,player,size);if(Math.hypot(p.x-size/2,p.y-size/2)>size/2-13)continue;
      c.beginPath();c.arc(p.x,p.y,poi.npc?4:2.7,0,Math.PI*2);c.fillStyle=poi.npc?'#487b83':visited.has(poi.id)?'#577443':'#faf4dd';c.fill();c.strokeStyle='#4f6c52';c.lineWidth=.8;c.stroke();
    }
    lastTarget=minimapTarget(target,player,size);
    if(lastTarget){
      const p=lastTarget;c.save();c.translate(p.x,p.y);c.fillStyle='#d3a343';c.strokeStyle='#fff8df';c.lineWidth=2;
      if(p.offscreen){c.rotate(p.angle);c.beginPath();c.moveTo(8,0);c.lineTo(-5,-6);c.lineTo(-3,0);c.lineTo(-5,6);c.closePath();c.fill();c.stroke();}
      else{c.beginPath();c.arc(0,0,6,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#36584e';c.font='bold 10px Arial';c.textAlign='center';c.fillText('!',0,3);}
      c.restore();
    }
    c.save();c.translate(size/2,size/2);c.rotate(player.heading);
    c.beginPath();c.moveTo(0,-8);c.lineTo(5.5,6);c.lineTo(0,3);c.lineTo(-5.5,6);c.closePath();c.fillStyle='#bc8833';c.fill();c.strokeStyle='#fff8df';c.lineWidth=1.7;c.stroke();c.restore();
    const bar=50*scale,x=(size-bar)/2,y=size-25;
    c.fillStyle='#f9f5e6d9';c.fillRect(x-7,y-4,bar+14,19);c.strokeStyle='#4b6551';c.lineWidth=1;c.beginPath();c.moveTo(x,y);c.lineTo(x,y+4);c.lineTo(x+bar,y+4);c.lineTo(x+bar,y);c.stroke();
    c.font='9px Arial';c.textAlign='center';c.fillStyle='#3c5945';c.fillText('50 м',size/2,y+13);c.restore();
    const text=player.y<-320?'Улица Кирова':player.y<-22?'Проспект Мира':'Площадь Ленина';if(label.textContent!==text)label.textContent=text;
  }
  return {draw,snapshot:()=>({paintCount,target:lastTarget,diameterMetres:MAP_DIAMETER_METRES,northUp:true})};
}

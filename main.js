import {createTouchControls} from './touch-controls.js';
import {rotateTramPoint,tramRenderYaw,TRAM_CACHE_LIMIT} from './tram-geometry.js';
import {PLAYER_SPEED,PLAYER_SPAWN,canBoard,doorsOpen,landingPoint,shouldExit} from './passenger.js';
import {createCityAudio} from './city-audio.js';
import {TRAM} from './tram-route.js';
import {createMinimap} from './minimap.js';
import {WALK_LIMITS,project,rect,bounds,clamp,moveCircle,screenDirection,depthCompare,setView,getView} from './math.js';
import {buildingSprite,pineSprite,alleyTreeSprite,shrubSprite,benchSprite,alleyLampSprite,squareBenchSprite,hedgeSprite,lampSprite,monumentSprite,fountainSprite,stopSprite,tramSprite,groundSprite,drawPerson} from './art.js';
import {facadeSprite,frontFrame,facadeView} from './facades.js';
import {createFacadeEditor} from './facade-editor.js';
import {tramPosition} from './avenue.js';
import {LANDSCAPE_PROPS,MONUMENT,MONUMENT_FOOTPRINT,FOUNTAIN,SQUARE_WALKER_ROUTE,promenadeX} from './landscape.js';

const $=id=>document.getElementById(id),canvas=$('city'),ctx=canvas.getContext('2d',{alpha:false});
const startedAt=performance.now(),keys=new Set(),visited=new Set();
const SPAWN=PLAYER_SPAWN,LIMITS=WALK_LIMITS;
const state={x:SPAWN.x,y:SPAWN.y,time:0,walking:false,facing:1,heading:0,zoom:1,paused:false,ready:false};
const camera={x:SPAWN.x-10,y:SPAWN.y-22};
const entities=[],colliders=[],sprites=new Set(),poiHits=[],drawTimes=[],intervals=[];
let width=0,height=0,dpr=1,ppm=11,frame=0,lastTime=0,hint=null,toastTimer,readyMs=0;
let ground,hotel,tram,nearest=null,district,editor,minimap;
let northHeading=null,ride=null,boardable=null,mobile=null;
mobile=createTouchControls({enabled:()=>state.ready&&!state.paused&&!ride,onAction:interact});
const cityAudio=createCityAudio($('city-sound'));
const fleet=()=>[tramPosition(state.time,-1),tramPosition(state.time,1)];
const hotelViews=new Map(),facadeDefinitions=new Map();
setView(1);
const POIS=[
  {id:'alexandrovsky',x:-5,y:22,height:2,title:'«Александровский»',eyebrow:'ПРОСПЕКТ МИРА, 29',radius:8,
    text:'Высокие арочные окна, тонкие переплёты, широкие карнизы и скруглённый угол — характерные детали гостиницы у площади Ленина.',
    observe:'Обойдите угол и сравните два фасада. Заметьте, как карнизы объединяют их в одно здание.',source:'https://www.openstreetmap.org/way/165504111'},
  {id:'monument',x:10.15,y:61,height:1.6,title:'Памятник Ленину',eyebrow:'ПЛОЩАДЬ ЛЕНИНА',radius:7,
    text:'Бронзовая фигура в длинном пальто стоит на тёмном цилиндрическом постаменте. Ступенчатая площадка, цветочная кайма и высокие ели обрамляют памятник со стороны театра.',
    observe:'Рассмотрите ступени, цветники и ели вокруг памятника. Найдите скамейку для следующей остановки.',source:'https://commons.wikimedia.org/wiki/File:Памятник_Ленина_во_Владикавказе.jpg'},
  {id:'fountain',x:FOUNTAIN.x+6.4,y:FOUNTAIN.y,height:1.6,radius:5,title:'Танцующий Сослан',eyebrow:'ФОНТАН НА ПЛОЩАДИ ЛЕНИНА',
    text:'В центре круглого фонтана — нарт Сослан, танцующий на чаше Уацамонга. Вокруг фигурного основания расположены скульптурные водомёты. Зелёная патина бронзы контрастирует с красноватым камнем борта.',
    observe:'Обойдите фонтан по круговой дорожке. Рассмотрите поднятое колено Сослана, орнамент чаши и изгибы водомётов. В игре формы стилизованы, размеры оценочные.',source:'https://commons.wikimedia.org/wiki/File:Vladikavkaz_Pamiatnik_David-Soslan.JPG'},
  {id:'guide',x:25,y:64,height:3.4,title:'Поговорить с Азаматом',eyebrow:'ЗНАКОМСТВО С ПЛОЩАДЬЮ',radius:6,
    text:'«Привет! Давай начнём с гостиницы. Найди большие арочные окна, потом пройдём к памятнику. Здесь интереснее гулять, если замечать детали».\n\nАзамат — вымышленный персонаж нашей прогулки.',
    observe:'Клавиши WASD или стрелки двигают героя относительно экрана. Колесо мыши меняет масштаб.'}
];
function makeEntity(id,x,y,sprite,polygon,solid=true,holes=[]) {
  const e={id,x,y,sprite,polygon,bounds:bounds(polygon)};entities.push(e);sprites.add(sprite);
  if(solid)colliders.push({polygon,holes,bounds:e.bounds});return e;
}
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ppm=(width<700?6.2:width<1100?9.1:11)*state.zoom;}
function toScreen(x,y,z=0){const p=project(x-camera.x,y-camera.y,z);return{x:width*.52+p.x*ppm,y:height*.57+p.y*ppm};}
function spriteRect(e){const p=toScreen(e.x,e.y),s=ppm/e.sprite.ppm;return{x:p.x-e.sprite.anchor[0]*s,y:p.y-e.sprite.anchor[1]*s,w:e.sprite.image.width*s,h:e.sprite.image.height*s};}
function drawSprite(e,alpha=1){const b=spriteRect(e);if(b.x+b.w<0||b.x>width||b.y+b.h<0||b.y>height)return;ctx.globalAlpha=alpha;ctx.drawImage(e.sprite.image,b.x,b.y,b.w,b.h);ctx.globalAlpha=1;}
function drawShadow(e){const p=toScreen(e.x,e.y);ctx.fillStyle='#3d594629';ctx.beginPath();ctx.ellipse(p.x+ppm*.7,p.y+ppm*.25,ppm*(e.id.startsWith('tree')?2.5:1.3),ppm*.65,-.2,0,Math.PI*2);ctx.fill();}
function showToast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2700);}
function zoomBy(value){state.zoom=clamp(Math.round((state.zoom+value)*100)/100,.7,1.65);resize();$('zoom-label').value=Math.round(state.zoom*100)+'%';$('zoom-in').disabled=state.zoom>=1.65;$('zoom-out').disabled=state.zoom<=.7;}
function clearInput(){keys.clear();mobile?.reset();state.walking=false;}
function updateDiscovery(){
  $('discovery-count').textContent=`Открыто ${visited.size} из ${POIS.length} мест`;
  $('discovery-title').textContent=visited.size===POIS.length?'Вы познакомились с площадью':'Арки, сквер и городские истории';
}
function reset(){clearInput();ride=null;state.time=0;state.x=SPAWN.x;state.y=SPAWN.y;state.heading=0;camera.x=SPAWN.x-10;camera.y=SPAWN.y-22;showToast('Вы снова на площади Ленина');}
function pause(){if(!state.ready||$('place-dialog').open||$('pause-dialog').open||$('facade-dialog').open)return;clearInput();state.paused=true;$('pause-dialog').showModal();}
function resume(){clearInput();state.paused=false;canvas.focus({preventScroll:true});}
function openPlace(poi){
  if(state.paused||!state.ready)return;
  if(ride){showToast('Сначала выйдите из трамвая на остановке');return;}
  if(Math.hypot(state.x-poi.x,state.y-poi.y)>poi.radius){showToast('Подойдите ближе к отмеченному месту');return;}
  clearInput();state.paused=true;visited.add(poi.id);updateDiscovery();
  $('card-title').textContent=poi.title;$('card-eyebrow').textContent=poi.eyebrow;$('card-body').textContent=poi.text;$('card-observe').textContent=poi.observe;
  $('card-source').hidden=!poi.source;if(poi.source)$('card-source').href=poi.source;
  $('place-dialog').showModal();
}
function closePlace(){$('place-dialog').close();}
function followTarget(){
  // The square frames the hotel to the left; farther north, frame the new row
  // around the player. Blend gradually so walking never snaps the camera.
  const north=clamp((-state.y-5)/25,0,1),offset=-14*getView();
  return {x:clamp(state.x+(-10+(offset+10)*north)/state.zoom,-15,75),y:clamp(state.y-(22-8*north)/state.zoom,LIMITS.minY-30,100)};
}
function update(dt){
  if(state.paused)return;
  state.time+=dt;
  if(ride){
    const travel=tramPosition(state.time,ride.direction);
    state.x=travel.x;state.y=travel.y;state.heading=travel.direction===-1?-travel.yaw:Math.PI-travel.yaw;state.walking=false;
    if(shouldExit(ride,travel))exitTram(travel);
  }else{
    let h=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
    let v=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
    if(!h&&!v){const stick=mobile.read();h=stick.x;v=stick.y;}
    const strength=Math.min(1,Math.hypot(h,v));
    const dir=screenDirection(h,v),speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?PLAYER_SPEED.run:PLAYER_SPEED.walk;
    const next=moveCircle(state,dir.x*speed*strength*dt,dir.y*speed*strength*dt,.48,colliders,LIMITS);
    const distance=Math.hypot(next.x-state.x,next.y-state.y);state.walking=distance>.0001;
    if(distance>.0001)state.heading=Math.atan2(next.x-state.x,state.y-next.y);
    state.x=next.x;state.y=next.y;if(h)state.facing=Math.sign(h);
  }
  const t=1-Math.exp(-dt*3.5),target=followTarget();camera.x+=(target.x-camera.x)*t;camera.y+=(target.y-camera.y)*t;
  const north=state.y<-22;
  if(north!==northHeading){northHeading=north;$('title').textContent=north?'Проспект Мира':'Площадь Ленина';document.querySelector('.place-heading>span').textContent=north?'Две стороны проспекта · фасады и истории':'Знакомый город. Новый ракурс.';}
  nearest=POIS.filter(p=>Math.hypot(state.x-p.x,state.y-p.y)<=p.radius).sort((a,b)=>Math.hypot(state.x-a.x,state.y-a.y)-Math.hypot(state.x-b.x,state.y-b.y))[0]||null;
  if(nearest!==hint){hint=nearest;if(nearest)$('interact-title').textContent=nearest.title;}
  updateTransit();
}
function interact(){if(!state.ready||state.paused)return;if(!transitAction()&&nearest)openPlace(nearest);}
function exitTram(travel){
  const point=landingPoint(travel,colliders);if(!point)return false;
  ride=null;clearInput();Object.assign(state,point);showToast('Остановка «'+travel.stop.name+'». Приятной прогулки!');return true;
}
function transitAction(){
  if(!state.ready||state.paused)return false;
  if(ride){
    const travel=tramPosition(state.time,ride.direction);
    if(doorsOpen(travel))exitTram(travel);
    else {ride.exitRequested=!ride.exitRequested;showToast(ride.exitRequested?'Выход на следующей остановке заказан':'Продолжаем поездку');}
    updateTransit();return true;
  }
  const travel=fleet().find(t=>canBoard(state,t,colliders));if(!travel)return false;
  ride={direction:travel.direction,boardedStop:travel.stop.id,exitRequested:false};clearInput();state.x=travel.x;state.y=travel.y;
  showToast(document.documentElement.classList.contains('touch-ui')?'Вы в трамвае. Кнопка справа — выход на остановке':'Вы в трамвае. E — выйти или заказать следующую остановку');updateTransit();return true;
}
function updateTransit(){
  boardable=ride?null:fleet().find(t=>canBoard(state,t,colliders));
  $('tram-panel').hidden=!ride&&!boardable;$('interact').hidden=!!ride||!!boardable||!nearest;
  let status='',action='';
  if(ride){const t=tramPosition(state.time,ride.direction),open=doorsOpen(t);
    status=t.phase==='stopped'?'Остановка: '+t.stop.name:'Следующая: '+(t.stop?.name||'конечная');
    action=open?'Выйти из трамвая':ride.exitRequested?'Выход заказан · отменить':'Выйти на следующей';
  }else if(boardable){status=boardable.stop.name+' · '+(boardable.direction===-1?'в сторону Кирова':'к площади Ленина');action='Сесть в трамвай';}
  if($('tram-status').textContent!==status)$('tram-status').textContent=status;
  if($('tram-action-label').textContent!==action)$('tram-action-label').textContent=action;
  mobile.setAction(ride?(doorsOpen(tramPosition(state.time,ride.direction))?'Выйти':ride.exitRequested?'Отменить выход':'Следующая остановка'):boardable?'Сесть':nearest?'Осмотреть':'Подойдите ближе',!!ride||!!boardable||!!nearest);
}
function personEntity(id,x,y,color,time,moving=false,facing=1){return{id,x,y,bounds:bounds(rect(x,y,.7,.7)),person:{color,time,moving,facing}};}
function drawPersonEntity(e,ghost=false){const p=toScreen(e.x,e.y);ctx.globalAlpha=ghost?.58:1;drawPerson(ctx,p.x,p.y,ppm*1.12,e.person.time,e.person.moving,e.person.color,e.person.facing,ghost);ctx.globalAlpha=1;}
function render(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#e7ecde';ctx.fillRect(0,0,width,height);
  drawSprite({x:0,y:0,sprite:ground});
  for(const e of entities)if(e.id.startsWith('tree')||e.id.startsWith('lamp'))drawShadow(e);
  const hero=personEntity('player',state.x,state.y,'#c99a43',state.time,state.walking,state.facing);
  const [wa,wb]=SQUARE_WALKER_ROUTE,wt=(Math.sin(state.time*.13)+1)/2;
  const pedestrians=[personEntity('guide',25,64,'#617f8c',0),personEntity('walker',wa[0]+(wb[0]-wa[0])*wt,wa[1]+(wb[1]-wa[1])*wt,'#ac6a53',state.time,true,Math.cos(state.time*.13)>0?1:-1)];
  const vehicles=fleet().map(travel=>{
    const yaw=tramRenderYaw(travel.yaw),footprint=rect(0,0,TRAM.width,TRAM.length).map(p=>{const [x,y]=rotateTramPoint(p,yaw);return [x+travel.x,y+travel.y];});
    return {id:'tram-'+travel.direction,x:travel.x,y:travel.y,bounds:bounds(footprint),sprite:vehicleSprite(travel,yaw),opacity:travel.opacity,travel};
  });
  const sorted=[...entities,...(ride?[]:[hero]),...pedestrians,...vehicles].sort(depthCompare);
  let passedHero=false,covered=false;
  const hp=toScreen(state.x,state.y,2.2);
  for(const e of sorted){
    if(e===hero){passedHero=true;drawPersonEntity(e);continue;}
    if(e.person){drawPersonEntity(e);continue;}
    drawSprite(e,e.opacity??1);
    if(passedHero&&(e.opacity??1)>.2){const r=spriteRect(e);if(hp.x>r.x&&hp.x<r.x+r.w&&hp.y>r.y&&hp.y<r.y+r.h){
      // Sample the cached alpha mask, not the framebuffer: transparent roof corners do not hide the player.
      if(e.sprite.mask){const px=Math.floor((hp.x-r.x)/r.w*e.sprite.image.width),py=Math.floor((hp.y-r.y)/r.h*e.sprite.image.height);if(e.sprite.mask[py*e.sprite.image.width+px]>100)covered=true;}
      else covered=true;
    }}
  }
  if(covered)drawPersonEntity(hero,true);
  const p=toScreen(state.x,state.y);
  if(!ride){ctx.strokeStyle=covered?'#fff1b9':'#f4edc8';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y+1,ppm*.8,ppm*.35,0,0,Math.PI*2);ctx.stroke();}
  ctx.font='700 9px Arial';ctx.textAlign='center';ctx.fillStyle='#fff8e2';ctx.shadowColor='#244536';ctx.shadowBlur=3;if(!ride||tramPosition(state.time,ride.direction).phase!=='stopped')ctx.fillText(ride?'ВЫ В ТРАМВАЕ':'ВЫ',p.x,p.y-ppm*(ride?6.5:3.9));ctx.shadowBlur=0;
  poiHits.length=0;
  for(const poi of POIS){
    const q=toScreen(poi.x,poi.y,poi.height+.3),near=poi===nearest;
    const bob=Math.sin(state.time*2+poi.x)*1.7;
    ctx.fillStyle=visited.has(poi.id)?'#75945f':near?'#c39d56':'#f6f0da';ctx.strokeStyle=near?'#faf2d4':'#729075';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(q.x,q.y+bob,near?13:10,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=visited.has(poi.id)||near?'#fff8df':'#4d7057';ctx.font='bold 12px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(visited.has(poi.id)?'✓':poi.id==='guide'?'…':'i',q.x,q.y+bob);ctx.textBaseline='alphabetic';
    poiHits.push({poi,x:q.x,y:q.y+bob,r:18});
  }
  for(const {travel,x:tx,y:ty} of vehicles)if(travel.phase==='stopped'&&Math.hypot(state.x-tx,state.y-ty)<65){
    const p=toScreen(tx,ty,6);ctx.font='600 11px Arial';ctx.textAlign='center';const label=(ride?.direction===travel.direction?'ВЫ · ':'')+travel.stop.name+' · остановка';
    const w=ctx.measureText(label).width+18;ctx.fillStyle='#36584ee8';ctx.fillRect(p.x-w/2,p.y-15,w,23);ctx.fillStyle='#fff0cc';ctx.fillText(label,p.x,p.y);
  }
  // A subtle edge veil keeps the prototype boundary out of the central composition.
  const fade=ctx.createLinearGradient(0,height-140,0,height);fade.addColorStop(0,'#e7ecde00');fade.addColorStop(1,'#e7ecde7a');ctx.fillStyle=fade;ctx.fillRect(0,height-140,width,140);
  return {covered,drawables:sorted.length};
}
let lastRender={covered:false,drawables:0};
function tick(now){
  const delta=lastTime?now-lastTime:16.67;lastTime=now;
  if(delta<150){intervals.push(delta);if(intervals.length>180)intervals.shift();}
  update(Math.min(delta/1000,.04));mobile.setPaused(state.paused);cityAudio.setQuiet(state.paused||document.hidden);cityAudio.updateTrams(state,fleet(),state.time);
  const before=performance.now();lastRender=render();minimap?.draw(state,visited,now);drawTimes.push(performance.now()-before);if(drawTimes.length>180)drawTimes.shift();
  if(++frame%30===0&&!$('diagnostics').hidden){const s=snapshot();$('diagnostics').textContent=`Canvas 2D · один участок\n${s.fps} FPS · рисование p95 ${s.drawMsP95} мс\nОбъектов ${s.drawables} · спрайтов ${s.spriteCount}\nРастр + маски ≈ ${s.rasterMiB} МиБ\nx ${s.player.x} / y ${s.player.y}\nF3 — скрыть`;}
  requestAnimationFrame(tick);
}
function snapshot(){
  const ordered=[...drawTimes].sort((a,b)=>a-b),rasterBytes=[...new Set([...sprites,...hotelViews.values()])].reduce((s,a)=>s+a.image.width*a.image.height*4+(a.mask?.byteLength||0),0);
  return {tramCacheSize:tram?.size||0,ride:ride?{...ride}:null,boardable:boardable?.stop.id||null,audio:cityAudio.snapshot(),trams:fleet(),tram:tramPosition(state.time),minimap:minimap?.snapshot(),heading:state.heading,view:getView()===-1?'southwest':'southeast',facades:editor?.configs(),ready:state.ready,paused:state.paused,player:{x:+state.x.toFixed(3),y:+state.y.toFixed(3),walking:state.walking},camera:{...camera},zoom:state.zoom,nearest:nearest?.id??null,visited:[...visited],covered:lastRender.covered,drawables:lastRender.drawables,spriteCount:sprites.size,rasterMiB:+(rasterBytes/1048576).toFixed(1),readyMs:Math.round(readyMs),fps:intervals.length?Math.round(1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length)):0,drawMsP95:+(ordered[Math.floor(ordered.length*.95)]||0).toFixed(2),resources:performance.getEntriesByType('resource').map(r=>({name:r.name.split('/').slice(-2).join('/'),bytes:r.encodedBodySize}))};
}
window.__iso2dDebug=Object.freeze({snapshot,project:(x,y,z=0)=>toScreen(x,y,z),pois:()=>POIS.map(p=>({id:p.id,x:p.x,y:p.y,radius:p.radius})),colliders:()=>colliders.map(c=>({polygon:c.polygon,holes:c.holes}))});

function alphaMask(sprite){
  const c=document.createElement('canvas');c.width=sprite.image.width;c.height=sprite.image.height;
  const m=c.getContext('2d',{willReadFrequently:true});m.drawImage(sprite.image,0,0);const rgba=m.getImageData(0,0,c.width,c.height).data;
  sprite.mask=new Uint8Array(c.width*c.height);for(let i=0;i<sprite.mask.length;i++)sprite.mask[i]=rgba[i*4+3];c.width=c.height=1;
}
function releaseSprite(sprite){sprite.mask=null;if(sprite.image instanceof HTMLCanvasElement)sprite.image.width=sprite.image.height=1;}
function bakeScene(){
  for(const sprite of sprites)releaseSprite(sprite);
  entities.length=colliders.length=0;sprites.clear();hotel=hotelViews.get(getView());
  ground=groundSprite();sprites.add(ground);
  [...(district.contextBuildings||[]),...district.buildings].forEach((b,i)=>{
    const B=bounds(b.polygon);b.x=(B.minX+B.maxX)/2;b.y=(B.minY+B.maxY)/2;
    if(b.id==='hotel')makeEntity('hotel',0,0,hotel,b.polygon);
    else makeEntity(b.id,b.x,b.y,facadeDefinitions.has(b.id)?facadeSprite(b,facadeDefinitions.get(b.id),editor.get(b.id)):buildingSprite(b,i),b.polygon,true,b.holes);
  });
  makeEntity('monument',MONUMENT.x,MONUMENT.y,monumentSprite(),MONUMENT_FOOTPRINT);
  const propSprites=new Map();
  const spriteFor=p=>{
    const key=[p.kind,p.variant,p.w,p.d].join(':');if(propSprites.has(key))return propSprites.get(key);
    const sprite=p.kind==='alleyTree'?alleyTreeSprite(p.variant):p.kind==='shrub'?shrubSprite(p.variant):
      p.kind==='pine'?pineSprite(p.variant,[.76,.88,.68][p.variant]):p.kind==='avenueBench'?benchSprite(p.variant):
      p.kind==='squareBench'?squareBenchSprite(p.variant):p.kind==='hedge'?hedgeSprite(p.w,p.d):p.kind==='bench'?benchSprite():p.kind==='alleyLamp'?alleyLampSprite():p.kind==='lamp'?lampSprite():p.kind==='stop'?stopSprite(p.variant):fountainSprite();
    propSprites.set(key,sprite);return sprite;
  };
  for(const p of LANDSCAPE_PROPS)makeEntity(p.id,p.x,p.y,spriteFor(p),p.polygon);
  tram=new Map();
  for(const sprite of sprites)if(sprite!==ground)alphaMask(sprite);
}
// Only the encountered angle/door combinations are baked. LRU eviction releases
// both the canvas and alpha mask, so following bends cannot grow memory forever.
function vehicleSprite(travel,yaw){
  const door=Math.round(travel.doors*4),key=[travel.direction,yaw,door].join(':');
  if(tram.has(key)){const cached=tram.get(key);tram.delete(key);tram.set(key,cached);return cached;}
  const sprite=tramSprite(door/4,travel.direction,yaw);alphaMask(sprite);sprites.add(sprite);tram.set(key,sprite);
  if(tram.size>TRAM_CACHE_LIMIT){const first=tram.keys().next().value,old=tram.get(first);tram.delete(first);sprites.delete(old);releaseSprite(old);}
  return sprite;
}
function changeView(sign){
  if(getView()===sign)return;
  clearInput();setView(sign);bakeScene();updateViewLabel();
  showToast(sign===-1?'Вид к фасадам чётной стороны проспекта':'Вид к нечётной стороне: «Александровский» и дома №31–55');
}
function updateViewLabel(){$('view-label').textContent=getView()===-1?'К нечётной стороне':'К чётной стороне';}
function applyFacades(configs,selected){
  changeView(facadeView(district.buildings.find(b=>b.id===selected),facadeDefinitions.get(selected)));
  const prepared=Object.entries(configs).map(([id,config])=>{const e=entities.find(e=>e.id===id),b=district.buildings.find(b=>b.id===id),sprite=facadeSprite(b,facadeDefinitions.get(id),config);alphaMask(sprite);return {e,sprite};});
  for(const {e,sprite} of prepared){sprites.delete(e.sprite);releaseSprite(e.sprite);e.sprite=sprite;sprites.add(sprite);}
  focusHouse(selected);
  showToast('Фасады обновлены. '+facadeDefinitions.get(selected).title);
}
function focusHouse(id){
  const poi=POIS.find(p=>p.id===id);if(!poi)return;
  clearInput();state.x=poi.x;state.y=poi.y;Object.assign(camera,followTarget());
}
async function boot(){
  if(!ctx)throw new Error('Этот браузер не поддерживает Canvas 2D.');
  const fetchJson=async name=>{const r=await fetch(new URL(name,import.meta.url));if(!r.ok)throw new Error(`Не удалось загрузить ${name}`);return r.json();};
  const [data,catalog,...metas]=await Promise.all(['district.json','facades.json','alexandrovsky.json','alexandrovsky-sw.json'].map(fetchJson));
  district=data;
  await Promise.all(metas.map(async (meta,i)=>{const image=new Image();image.src=new URL(meta.file,import.meta.url).href;await image.decode();hotelViews.set(i===0?1:-1,{image,ppm:meta.pixelsPerMeter,anchor:meta.anchor});}));
  for(const b of district.buildings){const B=bounds(b.polygon);b.x=(B.minX+B.maxX)/2;b.y=(B.minY+B.maxY)/2;}
  for(const definition of catalog.buildings){
    facadeDefinitions.set(definition.id,definition);
    const building=district.buildings.find(b=>b.id===definition.id),f=frontFrame(building,definition),point=f.point(f.length*.5,0,7);
    POIS.push({id:definition.id,x:point[0],y:point[1],height:1.5,radius:7,title:definition.title,eyebrow:definition.eyebrow||'ФАСАДЫ ПРОСПЕКТА МИРА',text:definition.note,observe:definition.subtitle+'. Откройте «Конструктор фасадов», чтобы рассмотреть и изменить детали.',source:definition.sources[0].url});
  }
  editor=createFacadeEditor({catalog:catalog.buildings,buildings:district.buildings,onApply:applyFacades,onOpen(){clearInput();state.paused=true;},onClose(note){resume();if(note)showToast(note);}});
  $('open-facades').onclick=()=>{if(ride){showToast('Конструктор доступен после выхода из трамвая');return;}if(state.ready&&!state.paused)editor.open(nearest?.id);};
  $('view-toggle').onclick=()=>{if(state.ready&&!state.paused)changeView(-getView());};
  minimap=createMinimap($('minimap-canvas'),$('minimap-location'),{buildings:[...(district.contextBuildings||[]),...district.buildings],pois:POIS});
  bakeScene();updateViewLabel();updateDiscovery();
  const requestedHouse=new URLSearchParams(location.search).get('house');
  if(facadeDefinitions.has(requestedHouse)){changeView(facadeView(district.buildings.find(b=>b.id===requestedHouse),facadeDefinitions.get(requestedHouse)));focusHouse(requestedHouse);}
  const requestedPlace=new URLSearchParams(location.search).get('place');
  if(!facadeDefinitions.has(requestedHouse)&&['monument','fountain'].includes(requestedPlace)){changeView(1);focusHouse(requestedPlace);}
  if(!facadeDefinitions.has(requestedHouse)&&requestedPlace==='alley'){changeView(1);state.x=promenadeX(-265);state.y=-265;Object.assign(camera,followTarget());}
  if(!facadeDefinitions.has(requestedHouse)&&new URLSearchParams(location.search).get('preview')==='tram'){changeView(1);Object.assign(state,landingPoint(tramPosition(0,-1),colliders));Object.assign(camera,followTarget());}
  resize();state.ready=true;readyMs=performance.now()-startedAt;$('loading').hidden=true;canvas.focus({preventScroll:true});requestAnimationFrame(tick);
}
window.addEventListener('resize',resize);
window.addEventListener('keydown',e=>{
  if(!state.ready)return;
  if(e.code==='F3'){e.preventDefault();if(!e.repeat)$('diagnostics').hidden=!$('diagnostics').hidden;return;}
  if($('place-dialog').open||$('pause-dialog').open||$('facade-dialog').open)return;
  const controlled=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight','KeyE','KeyR','KeyQ','Escape','Equal','Minus'];
  if(!controlled.includes(e.code))return;e.preventDefault();keys.add(e.code);if(e.repeat)return;
  if(e.code==='KeyE')interact();
  if(e.code==='KeyQ')changeView(-getView());if(e.code==='KeyR')reset();if(e.code==='Escape')pause();if(e.code==='Equal')zoomBy(.1);if(e.code==='Minus')zoomBy(-.1);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();pause();cityAudio.setQuiet(true);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();pause();cityAudio.setQuiet(true);}});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(state.ready&&!state.paused)zoomBy(e.deltaY>0?-.08:.08);},{passive:false});
canvas.addEventListener('pointermove',e=>{canvas.style.cursor=poiHits.some(p=>Math.hypot(p.x-e.clientX,p.y-e.clientY)<p.r)?'pointer':'default';});
canvas.addEventListener('click',e=>{if(!state.ready||state.paused)return;canvas.focus({preventScroll:true});const hit=poiHits.find(p=>Math.hypot(p.x-e.clientX,p.y-e.clientY)<p.r);if(hit)openPlace(hit.poi);});
$('zoom-in').onclick=()=>zoomBy(.1);$('zoom-out').onclick=()=>zoomBy(-.1);$('reset').onclick=reset;$('pause').onclick=pause;
$('card-close').onclick=closePlace;$('card-x').onclick=closePlace;$('place-dialog').addEventListener('close',resume);
$('resume').onclick=()=>$('pause-dialog').close();$('pause-reset').onclick=()=>{reset();$('pause-dialog').close();};$('pause-dialog').addEventListener('close',resume);
$('tram-action').onclick=transitAction;
$('retry').onclick=()=>location.reload();
boot().catch(error=>{console.error(error);$('loading').querySelector('strong').textContent='Не удалось открыть площадь';$('loading').querySelector('p').textContent=error.message;$('loading').querySelector('.spinner').hidden=true;$('retry').hidden=false;});

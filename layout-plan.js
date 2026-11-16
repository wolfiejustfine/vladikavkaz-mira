import {CROSS_STREETS,PARKS,avenueSamples,trackCenterX,AVENUE} from './avenue.js';
import {PATHS,SQUARE,SQUARE_BEDS,SQUARE_FLOWERS,MONUMENT_FOOTPRINT,FOUNTAIN,FOUNTAIN_WALK,ALLEY_FLOWERS,ALLEY_STOPS,circle,ribbon} from './landscape.js';
import {bounds} from './math.js';
import {layoutInventory,footprintArea,measureDistance} from './layout-metrics.js';
import {restoreFacadeConfigs,STORAGE_KEY} from './facade-model.js';
import {facadeElevationSummary,genericElevation,storeysEvidence} from './elevation.js';
const $=id=>document.getElementById(id),svg=$('plan'),ns='http://www.w3.org/2000/svg';
const el=(tag,attrs,parent=svg,text)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
const d=ring=>'M'+ring.map(p=>p.join(',')).join('L')+'Z';
const fill=(ring,color,parent=svg)=>el('path',{d:d(ring),fill:color},parent);
const original={x:-140,y:-470,w:295,h:625};let view={...original},ruler=false,marks=[],drag=null,buildings=[],inventory=[],shapes=new Map(),rulerLayer,definitions=new Map(),configs={};
const fmt=v=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(v);
function updateView(){
  svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);
  const scale=svg.getScreenCTM()?.a||1;
  svg.querySelectorAll('text').forEach(t=>t.setAttribute('font-size',(t.classList.contains('house-number')?10:10)/scale));
}
const point=e=>{const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());return[p.x,p.y];};
function zoom(factor,at=[view.x+view.w/2,view.y+view.h/2]){
  const f=Math.max(75,Math.min(original.w*1.3,view.w*factor))/view.w;
  view={x:at[0]-(at[0]-view.x)*f,y:at[1]-(at[1]-view.y)*f,w:view.w*f,h:view.h*f};updateView();
}
function select(id){
  const b=buildings.find(b=>b.id===id);if(!b){
    shapes.forEach(n=>n.classList.remove('selected'));$('plan-title').textContent='Планировка кварталов';$('plan-description').textContent='Выберите дом, чтобы проверить его контур и размеры.';$('plan-metrics').replaceChildren();$('plan-source').hidden=$('plan-walk').hidden=true;return;
  }
  shapes.forEach((n,key)=>n.classList.toggle('selected',key===id));$('plan-building').value=id;
  const row=inventory.find(r=>r.id===id),title=row?.title||b.address||'Дворовой корпус';
  $('plan-title').textContent=title;
  $('plan-description').textContent=b.role==='context'?'Соседний корпус: контур взят из карты. В прогулке его высота и фасад показаны приблизительно.':b.placement?.method==='estimated-subdivision'?'Этот фасад выделен из общего контура. Линия разделения домов оценочная; внешний периметр сохранён.':'Основание здания и его положение сохранены по картографическому контуру. Высота и декор в прогулке приблизительные.';
  const rows=[['Площадь основания',fmt(footprintArea(b))+' м²']];
  if(row?.frontage){rows.unshift([definitions.get(id)?.frontLabel||'Фасад со стороны проспекта',fmt(row.frontage.length)+' м'],['Глубина контура от фасада',fmt(row.frontage.depth)+' м']);}
  if(row?.northNeighbour)rows.push([`Просвет до фасада №${row.northNeighbour.slice(4)}`,fmt(row.gapNorth)+' м']);
  const definition=definitions.get(id);
  if(definition){
    const e=facadeElevationSummary(definition,configs[id]);
    rows.push([e.evidence,e.storeys],['Карниз модели (оценка)','≈ '+e.height]);
    $('plan-description').textContent+=' '+definition.elevation.note+' Высота в метрах не измерена; показан карниз текущей модели без башенок и аттиков.';
  }else if(b.id!=='hotel'){
    const e=genericElevation(b);
    rows.push([storeysEvidence(e.storeysStatus),String(e.storeys)],['Высота корпуса (оценка)','≈ '+fmt(e.cornice)+' м']);
    if(e.note)$('plan-description').textContent+=' '+e.note;
  }
  $('plan-metrics').replaceChildren();for(const [label,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('plan-metrics').append(dt,dd);}
  if(definition){const dt=document.createElement('dt'),dd=document.createElement('dd'),a=document.createElement('a');dt.textContent='Фото для сверки';a.textContent=definition.sources[0].title+' ↗';a.href=definition.sources[0].url;a.target='_blank';a.rel='noopener noreferrer';dd.append(a);$('plan-metrics').append(dt,dd);}
  else if(b.elevation?.sourceUrl){const dt=document.createElement('dt'),dd=document.createElement('dd'),a=document.createElement('a');dt.textContent='Источник этажности';a.textContent='Обследование здания · 2024 ↗';a.href=b.elevation.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';dd.append(a);$('plan-metrics').append(dt,dd);}
  if(row?.northNeighbour){const note=document.createElement('p');note.className='note';note.textContent='Просвет — кратчайшее расстояние между отрезками фасадов. Он может включать тротуары, улицу или угловой корпус; это не ширина проезжей части.';$('plan-metrics').append(note);}
  $('plan-source').href=b.sourceUrl;$('plan-source').hidden=false;
  $('plan-walk').hidden=!row?.frontage&&b.id!=='hotel';$('plan-walk').href=`./index.html${row?.frontage?'?house='+encodeURIComponent(id):''}`;
}
function paintRuler(){
  rulerLayer.replaceChildren();for(const p of marks)el('circle',{cx:p[0],cy:p[1],r:2,fill:'#a96d2d',stroke:'#fff9df','stroke-width':1},rulerLayer);
  if(marks.length===2){el('path',{d:'M'+marks.map(p=>p.join(',')).join('L'),stroke:'#a96d2d','stroke-width':2,'vector-effect':'non-scaling-stroke','stroke-dasharray':'5 3',fill:'none'},rulerLayer);$('plan-status').textContent=`${fmt(measureDistance(...marks))} м по прямой · нажмите, чтобы начать новый замер`;}
  else $('plan-status').textContent=marks.length?'Выберите вторую точку':'Выберите две точки на карте';
}
async function boot(){
  const json=async name=>{const r=await fetch(new URL(name,import.meta.url));if(!r.ok)throw new Error(name);return r.json();};
  const [district,catalog]=await Promise.all([json('district.json'),json('facades.json')]);
  definitions=new Map(catalog.buildings.map(d=>[d.id,d]));
  try{configs=restoreFacadeConfigs(catalog.buildings,localStorage.getItem(STORAGE_KEY)).configs;}
  catch{configs=restoreFacadeConfigs(catalog.buildings,null).configs;}
  inventory=layoutInventory(district,catalog);buildings=[...district.buildings,...(district.contextBuildings||[])];
  for(const street of CROSS_STREETS)fill(ribbon(street.points,street.width+4),'#e2dcc8');
  for(const street of CROSS_STREETS)fill(ribbon(street.points,street.width),'#b8bcae');
  for(const park of PARKS)fill(park.polygon,'#b1c28d');
  for(const track of [0,1]){const pts=avenueSamples().map(y=>[trackCenterX(y,track),y]);fill(ribbon(pts,AVENUE.trackHalfWidth*2),'#bbc1ad');el('path',{d:'M'+pts.map(p=>p.join(',')).join('L'),fill:'none',stroke:'#78918b','stroke-width':.7});}
  fill(SQUARE,'#f4edd7');for(const path of PATHS)fill(ribbon(path.points,path.width),'#f4edd7');
  for(const bed of ALLEY_FLOWERS)fill(bed.polygon,'#bd9b69');
  for(const stop of ALLEY_STOPS){const n=el('circle',{cx:stop.x,cy:stop.y,r:1.2,fill:'#578698'});el('title',{},n,stop.name);}
  for(const bed of SQUARE_BEDS)fill(bed,'#a5bb88');for(const bed of SQUARE_FLOWERS)fill(bed,'#c39465');fill(MONUMENT_FOOTPRINT,'#6c7970');fill(circle(FOUNTAIN.x,FOUNTAIN.y,FOUNTAIN.radius),'#75a1a7');
  el('path',{d:d(FOUNTAIN_WALK),fill:'none',stroke:'#b7aa92','stroke-width':.4});
  for(const b of [...buildings].sort((a,b)=>(b.role==='context')-(a.role==='context'))){
    const estimated=b.placement?.method==='estimated-subdivision',n=el('path',{d:[b.polygon,...(b.holes||[])].map(d).join(' '),'fill-rule':'evenodd',fill:b.id==='hotel'?'#bea87f':b.role==='context'?'#cbbda1':'#90aa94',class:'building'+(estimated?' estimated':''),'data-building':b.id});
    el('title',{},n,inventory.find(r=>r.id===b.id)?.title||b.address||'Дворовой корпус');shapes.set(b.id,n);
  }
  for(const b of district.buildings){const B=bounds(b.polygon),name=b.id.startsWith('mira')?b.id.slice(4):{hotel:'29',theatre:'Театр',officers:'Дом офицеров',annex:'Корпус'}[b.id]||b.name;
    el('text',{x:(B.minX+B.maxX)/2,y:(B.minY+B.maxY)/2,'text-anchor':'middle','dominant-baseline':'middle',class:'house-number'},svg,name);}
  for(const id of ['way/239439289','way/181050999','way/35078470','way/769775909','way/91619735','way/91619737','way/35073256']){
    const street=CROSS_STREETS.find(s=>s.osmId===id),a=street.points[0],b=street.points.at(-1),target=street.points.every(p=>p[0]>0)?90:-75,t=Math.max(0,Math.min(1,(target-a[0])/(b[0]-a[0]))),x=a[0]+t*(b[0]-a[0]),y=a[1]+t*(b[1]-a[1]);
    el('text',{x,y:y-3,'text-anchor':'middle',class:'street-name'},svg,street.name.replace('улица ','').replace('переулок','пер.'));
  }
  el('path',{d:'M-120,138h50m-50,-3v6m50,-6v6',stroke:'#526e59','stroke-width':1,fill:'none'});el('text',{x:-95,y:132,'text-anchor':'middle',class:'street-name'},svg,'50 м');
  rulerLayer=el('g',{id:'ruler-layer'});
  const selector=$('plan-building');selector.replaceChildren();const option=document.createElement('option');option.value='';option.textContent='Выберите на плане или в списке';selector.append(option);
  for(const b of buildings){const o=document.createElement('option');o.value=b.id;o.textContent=inventory.find(r=>r.id===b.id)?.title||b.address||'Дворовой корпус';selector.append(o);}
  selector.onchange=()=>select(selector.value);$('plan-status').textContent='Выберите здание · размеры по координатам карты';updateView();
}
$('plan-plus').onclick=()=>zoom(.75);$('plan-minus').onclick=()=>zoom(1/.75);$('plan-reset').onclick=()=>{view={...original};updateView();};
$('plan-ruler').onclick=()=>{ruler=!ruler;marks=[];svg.classList.toggle('measuring',ruler);$('plan-ruler').setAttribute('aria-pressed',String(ruler));if(rulerLayer)rulerLayer.replaceChildren();$('plan-status').textContent=ruler?'Выберите две точки на карте':'Выберите здание на плане';};
svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:1/1.15,point(e));},{passive:false});
svg.onpointerdown=e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,p:point(e),view:{...view},id:e.target.dataset.building,moved:false};svg.setPointerCapture(e.pointerId);};
svg.onpointermove=e=>{if(!drag||ruler)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;const p=point(e);view.x+=drag.p[0]-p[0];view.y+=drag.p[1]-p[1];updateView();};
svg.onpointerup=e=>{if(!drag)return;const last=drag;drag=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);if(last.moved||!rulerLayer)return;if(ruler){if(marks.length===2)marks=[];marks.push(point(e));paintRuler();}else if(last.id)select(last.id);};
svg.onpointercancel=()=>drag=null;addEventListener('resize',updateView);
boot().catch(e=>{$('plan-status').textContent='Не удалось загрузить план. Обновите страницу.';console.error(e);});

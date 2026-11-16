// The constructor's portable, bounded data contract. No DOM or drawing dependencies.
export const SCHEMA_VERSION=1;
export const STORAGE_KEY='vladikavkaz.facades.v1';
export const TEMPLATES=['arcade-wing','rosette-palace','shopfront-row','arched-row','library-mansion','panelled-row','glazed-bays','corner-turret','stepped-gable','five-attics','oculus-corners','paired-frontages','three-storey-balconies','brick-shop-corner','brick-white-frames','stucco-niches','rose-shop-attics','rusticated-balcony','twin-oculus','canopied-balcony','brick-portals','brick-canopy','ribbon-modern','arched-bow-balconies','ochre-archway','cinema-pinnacles','grand-hotel','brick-drum'];
TEMPLATES.push('theatre-clock','officers-assembly');
export const ROW_TEMPLATES=['shopfront-row','arched-row','panelled-row'];
// The assembly's tall front occupies only the eastern part of its long outline.
// This division and metre heights are visual estimates, not surveyed geometry.
export const OFFICERS_FRONT_SHARE=.22;
const COLORS=['wall','trim','accent','roof'];
const FLAGS=['balconies','awnings','parapet','ornament','rustication','shutters','turret'];
const FIELDS=['schemaVersion','buildingId','template','floorHeight','wingBays','windowWidth','windowShape','colors','details'];
function object(value,label){if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(`${label}: нужен объект`);}
function keysOnly(value,allowed,label){object(value,label);for(const k of Object.keys(value))if(!allowed.includes(k))throw new Error(`${label}: неизвестное поле «${k}»`);}
function number(value,min,max,label,integer=false){if(!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isInteger(value)))throw new Error(`${label}: значение от ${min} до ${max}`);return value;}
export function validateFacade(raw,allowedIds){
  keysOnly(raw,FIELDS,'Фасад');
  if(raw.schemaVersion!==SCHEMA_VERSION)throw new Error('Неподдерживаемая версия фасада');
  if(typeof raw.buildingId!=='string'||!allowedIds.includes(raw.buildingId))throw new Error('В этом участке нет такого здания');
  if(!TEMPLATES.includes(raw.template))throw new Error('Неизвестный тип фасада');
  if(!['arch','rect','segmental'].includes(raw.windowShape))throw new Error('Неизвестная форма окна');
  keysOnly(raw.colors,COLORS,'Палитра');keysOnly(raw.details,FLAGS,'Детали');
  const colors={},details={};
  for(const key of COLORS){if(!/^#[0-9a-f]{6}$/i.test(raw.colors[key]??''))throw new Error('Цвет должен иметь формат #RRGGBB');colors[key]=raw.colors[key].toLowerCase();}
  for(const key of FLAGS){
    // Additive v1 field: old exports and browser saves keep all their settings.
    if(['shutters','turret'].includes(key)&&raw.details[key]===undefined){details[key]=false;continue;}
    if(typeof raw.details[key]!=='boolean')throw new Error('Переключатели деталей должны быть true / false');details[key]=raw.details[key];
  }
  return {schemaVersion:SCHEMA_VERSION,buildingId:raw.buildingId,template:raw.template,
    floorHeight:number(raw.floorHeight,3.2,5.2,'Высота этажа'),wingBays:number(raw.wingBays,3,12,'Количество окон',true),
    windowWidth:number(raw.windowWidth,.42,.78,'Ширина окон'),windowShape:raw.windowShape,colors,details};
}
export function parseFacade(text,ids){if(typeof text!=='string'||text.length>16000)throw new Error('Файл фасада слишком большой (максимум 16 КБ)');return validateFacade(JSON.parse(text),ids);}
export function serializeFacade(config,ids){return JSON.stringify(validateFacade(config,ids),null,2)+'\n';}
// Only untouched historical presets follow corrected defaults. A changed colour,
// detail or height makes the whole saved design user-owned; imports are never migrated.
export function restoreFacadeConfigs(catalog,text){
  const ids=catalog.map(d=>d.id),configs=Object.fromEntries(catalog.map(d=>[d.id,validateFacade(d.config,ids)])),updated=[];
  if(!text)return {configs,updated};
  if(typeof text!=='string'||text.length>40000)throw new Error('storage size');
  const stored=JSON.parse(text);if(!Array.isArray(stored))throw new Error('storage shape');
  for(const raw of stored){
    const c=validateFacade(raw,ids),d=catalog.find(d=>d.id===c.buildingId);
    const old=(d.previousDefaults||[]).some(p=>JSON.stringify(validateFacade(p,ids))===JSON.stringify(c));
    if(old)updated.push(c.buildingId);else configs[c.buildingId]=c;
  }
  return {configs,updated};
}
export const MANSION_TOP_STOREY_RATIO=.75;
export function facadeStoreys(config){
  if(config.template==='theatre-clock')return [2,3,2];
  if(config.template==='officers-assembly')return [3,2];
  if(config.template==='library-mansion')return [2,3,2];
  if(config.template==='three-storey-balconies')return [3];
  if(config.template==='ribbon-modern')return [5];
  if(config.template==='brick-shop-corner')return [1];
  return [2];
}
export function facadeCornices(config){if(config.template==='officers-assembly')return [2.5*config.floorHeight,3*config.floorHeight];return [...new Set(facadeSections(config).map(s=>s.height))].sort((a,b)=>a-b);}
export function facadeSections(config){
  const f=config.floorHeight;
  if(config.template==='officers-assembly')return [{start:0,end:1,span:1,bays:config.wingBays,height:3*f,roof:'flat'}];
  if(config.template==='theatre-clock')return [
    {start:0,end:.12,span:.12,bays:1,height:2*f,roof:'flat'},
    {start:.12,end:.88,span:.76,bays:config.wingBays+2,height:2.72*f,roof:'flat'},
    {start:.88,end:1,span:.12,bays:1,height:2*f,roof:'flat'}];
  if(['ochre-archway','cinema-pinnacles','grand-hotel','brick-drum'].includes(config.template))return [{start:0,end:1,span:1,bays:config.wingBays,height:2*f,shape:config.windowShape,frontStyle:config.template,roof:'flat'}];
  if(['ribbon-modern','arched-bow-balconies'].includes(config.template))return [{start:0,end:1,span:1,bays:config.wingBays,height:(config.template==='ribbon-modern'?5:2)*f,shape:config.windowShape,frontStyle:config.template,roof:'flat'}];
  if(['three-storey-balconies','brick-shop-corner'].includes(config.template))return [{start:0,end:1,span:1,bays:config.wingBays,height:config.template==='three-storey-balconies'?3*f:f+1.1,shape:config.windowShape,frontStyle:config.template,roof:'flat'}];
  if(['rose-shop-attics','rusticated-balcony','twin-oculus','canopied-balcony','brick-portals','brick-canopy','brick-white-frames','stucco-niches','glazed-bays','corner-turret','stepped-gable','five-attics','oculus-corners','paired-frontages'].includes(config.template))return [{start:0,end:1,span:1,bays:config.wingBays,height:2*f+(config.template==='glazed-bays'?.9:0),shape:config.windowShape,frontStyle:config.template,roof:'flat'}];
  if(ROW_TEMPLATES.includes(config.template))return [{start:0,end:1,span:1,bays:config.wingBays,height:2*f,
    shape:config.windowShape,groundShape:'row',frontStyle:config.template,roof:'flat'}];
  // Each section uses the same window, cornice, balcony, railing and attic modules.
  const specs=config.template==='library-mansion'
    ?[{span:.27,bays:config.wingBays,height:2*f,shape:config.windowShape,frontStyle:'mansion-wing',pediment:true},
      {span:.46,bays:5,height:(2+MANSION_TOP_STOREY_RATIO)*f,shape:config.windowShape,frontStyle:'mansion-center',pediment:true},
      {span:.27,bays:config.wingBays,height:2*f,shape:config.windowShape,frontStyle:'mansion-wing',pediment:true,canopy:true}]
    :config.template==='arcade-wing'
    ?[{span:.43,bays:3,height:2*f+1,shape:config.windowShape,groundShape:'arch',pediments:true,balcony:[1],canopy:true},
      {span:.57,bays:config.wingBays,height:2*f,shape:'rect',groundShape:'arch',awning:true,roof:'hipped'}]
    :[{span:.44,bays:config.wingBays,height:2*f,shape:config.windowShape,groundShape:'rect',balcony:[Math.floor(config.wingBays*.35)]},
      {span:.12,bays:1,height:2*f,shape:'triple',groundShape:'door',attic:true},
      {span:.44,bays:config.wingBays,height:2*f,shape:config.windowShape,groundShape:'rect',balcony:[Math.floor(config.wingBays*.6)]}];
  let start=0;return specs.map(s=>{const result={...s,start,end:start+s.span};start+=s.span;return result;});
}
export function facadeHeight(config){if(config.template==='theatre-clock')return 2.72*config.floorHeight+2.5;if(config.template==='officers-assembly')return 3*config.floorHeight+1.7;if(['ochre-archway','cinema-pinnacles','grand-hotel','brick-drum'].includes(config.template))return 2*config.floorHeight+({ 'ochre-archway':1,'cinema-pinnacles':5.5,'grand-hotel':1.8,'brick-drum':4.7}[config.template]);if(config.template==='ribbon-modern')return 5*config.floorHeight+1; if(config.template==='arched-bow-balconies')return 2*config.floorHeight+4.6;return Math.max(...facadeSections(config).map(s=>s.height))+(['rose-shop-attics','rusticated-balcony','twin-oculus','canopied-balcony','brick-portals','brick-canopy'].includes(config.template)?2.4:config.template==='stucco-niches'?2.5:config.template==='brick-shop-corner'?2.2:['oculus-corners','paired-frontages'].includes(config.template)?2.6:['stepped-gable','five-attics'].includes(config.template)?4.3:config.template==='corner-turret'&&config.details.turret?4.5:['glazed-bays','corner-turret'].includes(config.template)?2.4:config.template==='rosette-palace'&&config.details.ornament?2.3:config.template==='library-mansion'?1.8:1.2);}
export function glazedBays(config){
  // Two broad projecting shop bays flank a narrow central entrance.
  return [{u:.06,width:.085,columns:1,end:true},{u:.28,width:.26,columns:config.wingBays},
    {u:.5,width:.12,columns:2,entrance:true},{u:.72,width:.26,columns:config.wingBays},{u:.94,width:.085,columns:1,end:true}];
}
export function rowGroundOpenings(config){
  if(config.template==='shopfront-row'){
    // Measured proportions from the reference, independent of the upper row.
    const centres=[.065,.165,.28,.415,.55,.65,.755,.9],widths=[.095,.045,.115,.115,.052,.1,.048,.132];
    return centres.map((u,i)=>({u,width:widths[i],door:[1,4,6].includes(i),shutter:i!==4,headTrim:i<4}));
  }
  if(config.template==='arched-row')return Array.from({length:config.wingBays},(_,i)=>({u:(i+.5)/config.wingBays,width:config.windowWidth/config.wingBays,door:i===config.wingBays-1,shutter:i>0,headTrim:false}));
  if(config.template==='panelled-row'){
    // The nine upper windows do not dictate the shops and the broad carriage gate.
    const centres=[.055,.135,.225,.35,.45,.555,.71,.865,.96],widths=[.075,.045,.105,.12,.055,.05,.18,.11,.045];
    return centres.map((u,i)=>({u,width:widths[i],door:[1,4,5,8].includes(i),shutter:[3,4].includes(i),headTrim:i<5,gate:i===6}));
  }
  return [];
}

export function westUpperBays(config){
  return Array.from({length:config.wingBays},(_,i)=>({u:(i+.5)/config.wingBays,width:config.windowWidth/config.wingBays}));
}
export function atticBays(config){
  // Roof silhouettes belong to the composition, independent of edited window count.
  if(config.template==='stepped-gable')return [{u:.56,width:.24,height:3.3}];
  if(config.template==='five-attics')return [.1,.3,.5,.7,.9].map((u,i)=>({u,width:i===2?.19:i%2?.14:.18,height:i===2?3.8:i%2?2.55:2.85,central:i===2,small:i%2===1}));
  return [];
}

export function pairedFrontages(config){
  const windows=[];
  for(const [start,span,count,wing] of [[0,.27,3,true],[.27,.46,config.wingBays,false],[.73,.27,3,true]]){
    for(let i=0;i<count;i++)windows.push({u:start+(i+.5)*span/count,width:config.windowWidth*span/count,wing});
  }
  const pairs=[];
  for(let i=0;i<config.wingBays;i++)for(const offset of [.28,.72])pairs.push({u:(i+offset)/config.wingBays,width:config.windowWidth*.5/config.wingBays});
  return [{start:0,end:.54,style:'white',windows},{start:.54,end:1,style:'coral',windows:pairs}];
}
export function northwestGroundOpenings(config){
  if(config.template==='oculus-corners')return [.05,.15,.24,.33,.42,.5,.58,.67,.76,.85,.95].map((u,i)=>({u,width:i===0?.055:.065,door:[0,5].includes(i),canopy:i!==0}));
  if(config.template==='paired-frontages'){
    const south=Array.from({length:9},(_,i)=>({u:(i+.5)/9*.54,width:.065*.54,door:i===6,section:'white'}));
    const north=[{u:.13,width:.17,shutter:true},{u:.33,width:.14},{u:.53,width:.15,door:true},{u:.73,width:.14},{u:.94,width:.07,door:true}].map(o=>({...o,u:.54+o.u*.46,width:o.width*.46,section:'coral'}));
    return [...south,...north];
  }
  return [];
}

export function residentialBays(config){
  return Array.from({length:config.wingBays*2},(_,i)=>({u:(i+.5)/(config.wingBays*2),width:config.windowWidth/(config.wingBays*2),balcony:i%config.wingBays===Math.floor(config.wingBays/2),entrance:i%5===2}));
}
export function brickBays(config,role='front'){
  if(role==='corner')return [{u:.5,width:.72}];
  const count=role==='return'?config.wingBays:Math.max(2,Math.round(config.wingBays/2));
  return Array.from({length:count},(_,i)=>({u:(i+.5)/count,width:config.windowWidth/count,shutter:role==='return'&&i===Math.floor(count/2)}));
}

// These two rows have separate photographic rhythms upstairs and at shop level.
export function artisanUpperBays(config,role='front'){
  if(role==='corner')return [{u:.5,width:.46,ornate:true}];
  return Array.from({length:config.wingBays},(_,i)=>({u:(i+.5)/config.wingBays,width:config.windowWidth/config.wingBays,ornate:config.template==='stucco-niches'&&i%3===1}));
}
export function artisanGroundBays(config,role='front'){
  if(role==='corner')return [{u:.5,width:.48,door:true}];
  const brick=config.template==='brick-white-frames',count=brick?8:12;
  return Array.from({length:count},(_,i)=>({u:(i+.5)/count,width:(brick?.67:.67)/count,
    door:brick?[2,5].includes(i):[2,5,6,8,9,11].includes(i),niche:!brick&&i%3===1,shutter:!brick&&i%3!==1}));
}


export function nikitinaUpperBays(config,role='front'){
  if(role==='corner')return [{u:.5,width:.42,pediment:false}];
  return Array.from({length:config.wingBays},(_,i)=>({u:(i+.5)/config.wingBays,width:config.windowWidth/config.wingBays,
    pediment:config.template==='rusticated-balcony'&&[Math.floor(config.wingBays/4),Math.floor(config.wingBays*.6)].includes(i)}));
}
export function nikitinaGroundBays(config,role='front'){
  if(role==='corner')return [{u:.5,width:.54,door:false,columns:1}];
  const rose=config.template==='rose-shop-attics',count=rose?4:6;
  return Array.from({length:count},(_,i)=>({u:(i+.5)/count,width:(rose?.71:.38)/count,door:rose?i%2===0:i===4,columns:rose?3:1}));
}
export function nikitinaAttics(config,role='front'){
  if(config.template==='rose-shop-attics')return role==='corner'?[]:[{u:.17,width:.28,rise:1.2},{u:.83,width:.28,rise:1.2}];
  return role==='corner'?[{u:.5,width:.8,rise:1.7}]:[];
}

// Upper windows and independent ground-storey openings of the eastern row.
export function eastUpperBays(config){
  if(config.template==='twin-oculus'){
    const bays=[];
    for(const [start,span,count,end] of [[.025,.21,3,true],[.265,.47,config.wingBays,false],[.765,.21,3,true]])
      for(let i=0;i<count;i++)bays.push({u:start+(i+.5)*span/count,width:config.windowWidth*span/count,end});
    return bays;
  }
  return Array.from({length:config.wingBays},(_,i)=>({u:(i+.5)/config.wingBays,width:config.windowWidth/config.wingBays}));
}
export function eastGroundBays(config){
  if(config.template==='twin-oculus')return [.06,.13,.205,.31,.43,.55,.67,.79,.865,.94].map((u,i)=>({u,width:i===2?.045:.048,door:i===2}));
  if(config.template==='canopied-balcony')return Array.from({length:9},(_,i)=>({u:(i+.5)/9,width:.063,door:[3,4,8].includes(i),shutter:[3,4].includes(i)}));
  if(config.template==='brick-portals')return [{u:.06,width:.075},{u:.1875,width:.072,door:true},{u:.37,width:.18},{u:.61,width:.18},{u:.85,width:.18}];
  if(config.template==='brick-canopy')return Array.from({length:4},(_,i)=>({u:(i+.5)/4,width:.19,door:false}));
  return [];
}

export function petrovskyUpperBays(config,role='front'){
  if(config.template==='ribbon-modern'){
    const count=role==='return'?Math.max(2,Math.round(config.wingBays/4)):config.wingBays*3;
    return Array.from({length:count},(_,i)=>({index:i,u:(i+.5)/count,width:(role==='return'?config.windowWidth*.65:.7+config.windowWidth*.34)/count}));
  }
  if(role==='corner')return [{index:0,u:.5,width:.6,rect:false}];
  const count=role==='return'?Math.max(3,config.wingBays-2):config.wingBays;
  return Array.from({length:count},(_,i)=>({index:i,u:(i+.5)/count,width:config.windowWidth/count,rect:role==='return'?i===0: i>0&&i<Math.floor(count*.45)}));
}
export function petrovskyGroundBays(config,role='front'){
  if(config.template==='ribbon-modern')return Array.from({length:5},(_,i)=>({u:.025+(i+.5)*.785/5,width:.13,door:i===0}));
  if(role==='corner')return [{u:.5,width:.65,door:true}];
  if(role==='return')return [.07,.22,.36,.5,.65,.79,.93].map((u,i)=>({u,width:i===1?.09:.085,door:[4,6].includes(i),niche:i===1,shutter:i===3}));
  return [.055,.18,.3,.42,.55,.675,.8,.925].map((u,i)=>({u,width:[0,5].includes(i)?.095:.059,door:[1,3,6,7].includes(i)}));
}

export function kirovaBays(config,role='front'){
  const corner=role.startsWith('corner'),count=corner?1:role==='return'?Math.max(3,config.wingBays-1):config.wingBays;
  return Array.from({length:count},(_,i)=>({index:i,u:(i+.5)/count,width:config.windowWidth/count,arch:config.template==='cinema-pinnacles'&&role==='front'&&[Math.floor((count-1)/2),Math.ceil((count-1)/2)].includes(i)}));
}

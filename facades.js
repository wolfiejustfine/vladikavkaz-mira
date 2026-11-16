import {drawKirovaFacade,drawKirovaRoof} from './facade-kirova.js';
import {drawSquareFacade,drawSquareRoof} from './facade-square.js';
import {project,bounds,getView,withView} from './math.js';
import {polygon,line,makeSprite,extentFor,tint} from './art.js';
import {facadeSections,facadeHeight,rowGroundOpenings,OFFICERS_FRONT_SHARE} from './facade-model.js';
import {drawPetrovskyFacade,drawPetrovskyRoof} from './facade-petrovsky.js';
import {drawEastNorthFacade} from './facade-east-north.js';
import {drawNikitinaFacade} from './facade-nikitina.js';
import {drawArtisanFacade} from './facade-artisan.js';
import {drawDzhanaevaFacade} from './facade-dzhanaeva.js';
import {drawNorthwestFacade} from './facade-northwest.js';
import {drawWestFacade} from './facade-west.js';
import {drawLandmarkFacade,drawCornerTurret} from './facade-landmarks.js';

export function frontFrame(building,definition){
  const a=building.polygon[definition.frontEdge[0]],b=building.polygon[definition.frontEdge[1]];
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  if(length<2)throw new Error('Слишком короткий фасад');
  const B=bounds(building.polygon),cx=(B.minX+B.maxX)/2,cy=(B.minY+B.maxY)/2;
  let nx=-dy/length,ny=dx/length;
  if(nx*((a[0]+b[0])/2-cx)+ny*((a[1]+b[1])/2-cy)<0){nx=-nx;ny=-ny;}
  return {a,b,length,nx,ny,point:(u,z=0,off=0)=>[a[0]+dx*u/length+nx*off,a[1]+dy*u/length+ny*off,z],
    along:p=>((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(length*length)};
}
export function facadeView(building,definition){const f=frontFrame(building,definition);return f.nx>=0?1:-1;}
export function facadeFrames(building,definition,config){
  const faces=[{frontEdge:definition.frontEdge,role:'front',label:definition.frontLabel||'Проспект Мира'},...(['theatre-clock','officers-assembly','grand-hotel','brick-drum','ribbon-modern','arched-bow-balconies','brick-shop-corner','stucco-niches','rose-shop-attics','rusticated-balcony'].includes(config.template)?definition.secondaryFaces||[]:[])];
  return faces.map(face=>({...frontFrame(building,face),role:face.role,label:face.label}));
}
// Slice the original footprint for a stepped roof, never the collision polygon.
function clip(poly,frame,limit,keepAbove){
  const result=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],da=frame.along(a)-limit,db=frame.along(b)-limit;
    const ina=keepAbove?da>=-1e-7:da<=1e-7,inb=keepAbove?db>=-1e-7:db<=1e-7;
    if(ina)result.push(a);
    if(ina!==inb){const t=da/(da-db);result.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }return result;
}
export function facadeVolumes(building,definition,config){
  const front=frontFrame(building,definition),f=config.floorHeight;
  let frame=front,specs=facadeSections(config);
  if(config.template==='officers-assembly'){
    const depth=p=>-((p[0]-front.a[0])*front.nx+(p[1]-front.a[1])*front.ny);
    const maxDepth=Math.max(...building.polygon.map(depth));
    frame={along:p=>depth(p)/maxDepth};
    specs=[{start:0,end:OFFICERS_FRONT_SHARE,height:3*f,bands:[.86*f,2.06*f]},
      {start:OFFICERS_FRONT_SHARE,end:1,height:2.5*f,bands:[f]}];
  }
  // Rear wings can extend beyond either end of the selected front edge.
  // The outside sections must include these extensions, not trim the footprint.
  const slice=(ring,s)=>{const lower=s.start===0?ring:clip(ring,frame,s.start,true);return s.end===1?lower:clip(lower,frame,s.end,false);};
  return specs.map(s=>({...s,poly:slice(building.polygon,s),holes:(building.holes||[]).map(r=>slice(r,s)).filter(r=>r.length>2)})).filter(s=>s.poly.length>2);
}
function block(c,poly,h,config,roof='flat',holes=[],storeyBands=null){
  let points=[...poly];if(points.reduce((s,p,i)=>s+p[0]*points[(i+1)%points.length][1]-points[(i+1)%points.length][0]*p[1],0)<0)points.reverse();
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1];
    if(getView()*dy-dx<=0)continue;
    const quad=(z0,z1,color)=>polygon(c,[[...a,z0],[...b,z0],[...b,z1],[...a,z1]],color);
    quad(0,h,tint(config.colors.wall,dy<0?1:.83));quad(0,.5,'#9b9e90');
    const bands=[h-.32];
    if(storeyBands)bands.push(...storeyBands);else for(let z=config.floorHeight;z<h-.5;z+=config.floorHeight)bands.push(z);
    for(const z of bands)quad(z,z+.18,config.colors.trim);
  }
  // Preserve enclosed courtyards. The roof and its seams use the same compound path.
  const roofPath=()=>{c.beginPath();for(const ring of [points,...holes]){ring.forEach(([x,y],i)=>{const v=project(x,y,h);i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y);});c.closePath();}};
  for(const hole of holes){
    c.save();polygon(c,hole.map(p=>[...p,h]),null);c.clip();
    polygon(c,hole.map(p=>[...p,h]),'#c5c0aa');
    for(let i=0;i<hole.length;i++){const a=hole[i],b=hole[(i+1)%hole.length];polygon(c,[[...a,0],[...b,0],[...b,h],[...a,h]],tint(config.colors.wall,.72),config.colors.trim,.05);}
    c.restore();
  }
  roofPath();c.fillStyle=config.colors.roof;c.fill('evenodd');c.strokeStyle=config.colors.trim;c.lineWidth=.14;c.stroke();
  const B=bounds(points);c.save();roofPath();c.clip('evenodd');
  for(let x=B.minX;x<B.maxX;x+=1.4)line(c,[[x,B.minY,h+.02],[x,B.maxY,h+.02]],tint(config.colors.roof,1.12),.035);
  c.restore();
  if(roof==='hipped'&&!holes.length){
    const cx=(B.minX+B.maxX)/2,cy=(B.minY+B.maxY)/2;
    const inner=points.map(([x,y])=>[cx+(x-cx)*.66,cy+(y-cy)*.66,h+1.05]);
    for(let i=0;i<points.length;i++){
      const j=(i+1)%points.length;
      polygon(c,[[...points[i],h],inner[i],inner[j],[...points[j],h]],tint(config.colors.roof,.84+i%3*.08),tint(config.colors.roof,1.13),.035);
    }
    polygon(c,inner,config.colors.roof,tint(config.colors.roof,1.13),.035);
  }
}

// q converts local facade metres (horizontal, height, outward depth) to pixels
// or projected metres. The same modules draw an elevation and a city sprite.
function drawFacade(c,q,length,config,role='front'){
  const {wall,trim,accent}=config.colors,f=config.floorHeight,sections=facadeSections(config);
  const iron='#485b53',glass='#3b5c60',wood='#575348';
  function layer(off,draw){const o=q(0,0,off),x=q(1,0,off),y=q(0,-1,off);c.save();c.transform(x.x-o.x,x.y-o.y,y.x-o.x,y.y-o.y,o.x,o.y);draw();c.restore();}
  function quad(points,fill,stroke=null,lw=.045){c.beginPath();points.forEach(([u,z,d=0],i)=>{const p=q(u,z,d);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
  function pathWindow(x,bottom,w,h,shape){
    const top=-bottom-h;c.beginPath();
    if(shape==='arch'){const r=w/2;c.moveTo(x-w/2,-bottom);c.lineTo(x-w/2,top+r);c.arc(x,top+r,r,Math.PI,Math.PI*2);c.lineTo(x+w/2,-bottom);c.closePath();}
    else if(shape==='segmental'){const rise=Math.min(.24,w*.18);c.moveTo(x-w/2,-bottom);c.lineTo(x-w/2,top+rise);c.ellipse(x,top+rise,w/2,rise,0,Math.PI,Math.PI*2);c.lineTo(x+w/2,-bottom);c.closePath();}
    else c.rect(x-w/2,top,w,h);
  }
  function window(x,bottom,w,h,shape,door=false,pediment=false,style={}){
    layer(.07,()=>{
      pathWindow(x,bottom-.13,w+.32,h+.3,shape);c.fillStyle=style.thin?accent:trim;c.fill();
      pathWindow(x,bottom-.03,w+.15,h+.14,shape);c.fillStyle=accent;c.fill();
      pathWindow(x,bottom,w,h,shape);c.fillStyle=door?wood:glass;c.fill();
      c.save();c.clip();c.fillStyle=door?'#6e6754':'#72908c';c.globalAlpha=.55;c.fillRect(x-w*.43,-bottom-h+.12,w*.36,h-.18);c.globalAlpha=1;
      c.strokeStyle=style.mullion||(door?'#b4aa88':trim);c.lineWidth=.055;c.beginPath();c.moveTo(x,-bottom);c.lineTo(x,-bottom-h);c.moveTo(x-w/2,-bottom-h*.69);c.lineTo(x+w/2,-bottom-h*.69);c.stroke();
      if(door){c.strokeStyle='#373f37';c.lineWidth=.08;for(const s of [-1,1]){c.strokeRect(x+s*w*.24-w*.15,-bottom-h*.64,w*.3,h*.5);c.fillStyle='#d3bd77';c.fillRect(x+s*.11,-bottom-1.2,.06,.18);}}
      c.restore();c.fillStyle=trim;c.fillRect(x-w/2-.2,-bottom+.02,w+.4,.15);
      if(pediment){c.fillRect(x-w/2-.3,-bottom-h-.3,w+.6,.14);c.beginPath();c.moveTo(x-w/2-.33,-bottom-h-.35);c.lineTo(x,-bottom-h-.88);c.lineTo(x+w/2+.33,-bottom-h-.35);c.closePath();c.fill();c.strokeStyle=accent;c.lineWidth=.045;c.beginPath();c.moveTo(x-w*.45,-bottom-h-.42);c.lineTo(x,-bottom-h-.68);c.lineTo(x+w*.45,-bottom-h-.42);c.stroke();}
    });
  }
  function architrave(x,bottom,w,h,shape){
    layer(.14,()=>{
      const top=bottom+h,outer=w/2+.34;c.fillStyle=trim;
      for(const side of [-1,1]){c.fillRect(x+side*outer-.08,-top,.16,h+.15);c.fillRect(x+side*outer-.14,-bottom-.08,.28,.16);}
      c.fillRect(x-outer-.12,-top-.22,outer*2+.24,.18);c.fillRect(x-outer-.18,-top-.34,outer*2+.36,.12);
      if(shape==='arch'){c.fillStyle=accent;for(const sign of [-1,1]){c.beginPath();c.moveTo(x+sign*(outer-.08),-top+.13);c.lineTo(x+sign*(w*.13),-top+.13);c.lineTo(x+sign*(outer-.08),-top+h*.23);c.fill();}}
    });
  }
  function shutter(x,bottom,w,h,headTrim){
    layer(.08,()=>{
      c.fillStyle=accent;c.fillRect(x-w/2-.1,-bottom-h-.08,w+.2,h+.16);
      c.fillStyle='#a5ada6';c.fillRect(x-w/2,-bottom-h,w,h);
      c.strokeStyle='#89988f';c.lineWidth=.024;c.beginPath();
      for(let z=bottom+.06;z<bottom+h;z+=.075){c.moveTo(x-w/2,-z);c.lineTo(x+w/2,-z);}c.stroke();
      c.fillStyle='#c0c5b9';for(const side of [-1,1])c.fillRect(x+side*w/2-.045,-bottom-h,.09,h);
      c.fillStyle='#6e8074';c.fillRect(x-.11,-bottom-.19,.22,.055);
      if(headTrim){c.fillStyle=trim;c.fillRect(x-w/2-.2,-bottom-h-.24,w+.4,.16);for(const side of [-1,1])c.fillRect(x+side*(w/2+.12)-.06,-bottom-h-.1,.12,.45);}
    });
  }
  function rowUpperWindow(s,n,a,bay,h){
    const x=a+(n+.5)*bay,ww=Math.min(bay*config.windowWidth,2.6),bottom=f+.55,wh=h-bottom-1.05;
    const ornate=s.frontStyle==='arched-row',panelled=s.frontStyle==='panelled-row',edge=n===0||n===s.bays-1;
    // Spandrel decoration sits behind the arch opening, never over its glazing.
    if(ornate&&config.details.ornament)architrave(x,bottom,ww,wh,s.shape);
    window(x,bottom,ww,wh,s.shape,false,false,{thin:!ornate&&!panelled&&!edge,mullion:panelled?trim:ornate?(n>=s.bays-2?trim:wood):([4,5].includes(n)?trim:wood)});
    if(config.details.ornament){
      if(!ornate&&!panelled&&edge)layer(.14,()=>{c.fillStyle=trim;c.fillRect(x-ww/2-.22,-bottom-wh-.18,ww+.44,.14);c.fillRect(x-ww/2-.3,-bottom-wh-.3,ww+.6,.12);});
      layer(.035,()=>{c.fillStyle=accent;c.fillRect(x-ww/2-.1,-f-.28,ww+.2,.24);c.fillStyle=wall;c.fillRect(x-ww/2-.03,-f-.22,ww+.06,.12);});
    }
  }
  function rail(x0,x1,z,off,height=.72,color=iron,lattice=false){
    layer(off,()=>{
      c.strokeStyle=color;c.lineWidth=.055;c.beginPath();for(const h of [0,height*.78,height]){c.moveTo(x0,-z-h);c.lineTo(x1,-z-h);}
      for(let x=x0;x<=x1+.01;x+=.25){c.moveTo(x,-z);c.lineTo(x,-z-height);}c.stroke();
      c.lineWidth=.025;for(let x=x0+.25;x<x1-.15;x+=.5){c.beginPath();c.ellipse(x,-z-height*.43,.16,height*.31,0,0,Math.PI*2);c.stroke();}
      if(lattice){c.lineWidth=.035;for(let x=x0;x<x1-.4;x+=.4){c.beginPath();c.moveTo(x,-z);c.lineTo(x+.4,-z-height);c.moveTo(x,-z-height);c.lineTo(x+.4,-z);c.stroke();}}
    });
  }
  function balcony(x,width,z,canopy,painted=false){
    const a=x-width/2,b=x+width/2,d=1;
    quad([[a,z,0],[b,z,0],[b,z,d],[a,z,d]],trim);
    quad([[a,z,d],[b,z,d],[b,z-.19,d],[a,z-.19,d]],'#b8b6a3');
    rail(a,b,z,d,.9,painted?trim:iron,painted);
    for(const u of [a,b])quad([[u,z,.05],[u,z,d],[u,z+.9,d],[u,z+.9,.05]],null,iron,.045);
    if(canopy){
      const top=z+2.45;
      for(const u of [a,b])quad([[u,z+.85,d],[u,top,d]],null,iron,.045);
      quad([[a-.15,top,1.15],[x,top+.6,1.15],[x,top+.6,0],[a-.15,top,0]],'#8b8472',iron);
      quad([[x,top+.6,1.15],[b+.15,top,1.15],[b+.15,top,0],[x,top+.6,0]],'#5e6c61',iron);
      quad([[a-.15,top,1.15],[x,top+.6,1.15],[b+.15,top,1.15]],null,iron,.065);
    }
  }
  function awning(a,b,z){
    for(let x=a;x<b;x+=.24){const right=Math.min(b,x+.24),color=Math.round((x-a)/.24)%2?'#f9edce':'#b86250';quad([[x,z,.06],[right,z,.06],[right,z-.52,1.25],[x,z-.52,1.25]],color);quad([[x,z-.52,1.25],[right,z-.52,1.25],[right,z-.73,1.25],[x,z-.73,1.25]],color);}
  }
  function pediment(x,width,z,rise,shield=true){
    layer(.18,()=>{
      c.fillStyle=trim;c.strokeStyle=accent;c.lineWidth=.065;
      c.beginPath();c.moveTo(x-width/2,-z);c.lineTo(x,-z-rise);c.lineTo(x+width/2,-z);c.closePath();c.fill();c.stroke();
      c.beginPath();c.moveTo(x-width*.38,-z-.16);c.lineTo(x,-z-rise+.22);c.lineTo(x+width*.38,-z-.16);c.stroke();
      if(shield){c.fillStyle=trim;c.fillRect(x-.48,-z-rise-.32,.96,.75);c.fillRect(x-.58,-z-rise-.38,1.16,.14);
        c.fillStyle=accent;c.beginPath();c.moveTo(x-.26,-z-rise-.12);c.lineTo(x+.26,-z-rise-.12);c.lineTo(x+.23,-z-rise+.35);c.quadraticCurveTo(x,-z-rise+.58,x-.23,-z-rise+.35);c.closePath();c.fill();}
    });
  }
  function medallion(x,z,r=.18){
    layer(.15,()=>{c.fillStyle=trim;c.beginPath();c.arc(x,-z,r,0,Math.PI*2);c.fill();c.strokeStyle=accent;c.lineWidth=.035;c.beginPath();c.arc(x,-z,r*.6,0,Math.PI*2);c.stroke();});
  }
  function addressPlate(x){
    const number=config.buildingId.replace(/^mira/,'');
    layer(.16,()=>{c.fillStyle='#d6c59d';c.fillRect(x-.2,-2.4,.4,.32);c.fillStyle='#665d4a';c.font='bold .22px Arial';c.textAlign='center';c.fillText(number,x,-2.15);});
  }
  function mansionSection(s,a,b,bay){
    const centre=s.frontStyle==='mansion-center',h=s.height,upperBottom=f+.65,wh=f-1.3;
    for(let n=0;n<s.bays;n++){
      const x=a+(n+.5)*bay,ww=Math.min(bay*config.windowWidth,2.35),middle=n===Math.floor(s.bays/2);
      const entrance=centre?middle:(s.canopy?n===s.bays-1:n===0);
      window(x,entrance?.15:.65,ww,entrance?f-.8:f-1.3,'rect',entrance);
      window(x,upperBottom,ww,wh,s.shape);
      if(centre)window(x,2*f+.5,ww*.9,h-2*f-1.05,s.shape);
      if(config.details.ornament){
        medallion(x,f+.3,.17);
        layer(.13,()=>{
          c.strokeStyle=trim;c.lineWidth=.07;
          const top=upperBottom+wh;
          c.beginPath();c.moveTo(x-ww/2-.2,-top+.35);c.quadraticCurveTo(x,-top-.45,x+ww/2+.2,-top+.35);c.stroke();
          c.fillStyle=trim;c.fillRect(x-.09,-top-.12,.18,.27);
          if(n<s.bays-1){const u=x+bay*.5;c.strokeRect(u-.18,-f*2+.9,.36,f-1.5);c.beginPath();c.moveTo(u,-f*2+1.1);c.lineTo(u+.12,-f*2+1.25);c.lineTo(u,-f*2+1.4);c.lineTo(u-.12,-f*2+1.25);c.closePath();c.stroke();}
        });
      }
      if(config.details.balconies&&((centre&&middle)||(s.canopy&&n===s.bays-1)))balcony(x,Math.min(bay*1.55,4.2),f+.35,!!s.canopy,centre);
    }
    layer(.13,()=>{
      // Rusticated piers and the intermediate cornice make the raised centre legible.
      for(const x of [a+.2,b-.2]){
        c.fillStyle=trim;c.fillRect(x-.16,-h+.3,.32,h-.8);
        for(let z=.65;z<2*f-.7;z+=.48){c.fillStyle=trim;c.fillRect(x-.27,-z,.54,.34);c.fillStyle=accent;c.fillRect(x-.27,-z+.3,.54,.04);}
        if(centre){c.fillStyle=trim;c.fillRect(x-.23,-h+.6,.46,.24);}
      }
      if(centre){c.fillStyle=trim;for(const [z,t] of [[2*f,.22],[2*f+.27,.12]])c.fillRect(a-.12,-z,b-a+.24,t);}
      c.fillStyle=trim;for(let x=a+.35;x<b-.2;x+=.42)c.fillRect(x-.06,-h+.28,.12,.19);
    });
    if(config.details.ornament)pediment((a+b)/2,(b-a)*(centre?.86:.65),h,centre?1.1:.6);
    if(centre)addressPlate((a+b)/2+bay*.43);
  }
  function carriageGate(x,w,h){
    window(x,.06,w,h,'rect',true,false,{thin:true});
    layer(.16,()=>{
      c.fillStyle='#384643';c.fillRect(x-w/2,-h-.06,w,.62);c.strokeStyle='#9b9d89';c.lineWidth=.025;
      for(let u=x-w/2+.15;u<x+w/2;u+=.3){c.beginPath();c.moveTo(u,-h+.55);c.lineTo(u+.13,-h+.27);c.lineTo(u,-h);c.stroke();}
      c.strokeStyle='#a5a38c';c.lineWidth=.045;c.strokeRect(x-w*.37,-1.95,w*.25,1.84);
    });
  }
  if(drawSquareFacade(c,{q,layer,quad,window,balcony},length,config,role))return;
  if(drawKirovaFacade(c,{q,layer,quad,window,balcony,shutter,rail,addressPlate},length,config,role))return;
  if(drawPetrovskyFacade(c,{q,layer,quad,window,shutter,rail,addressPlate},length,config,role))return;
  if(drawEastNorthFacade(c,{layer,quad,window,rail,balcony,shutter,pediment,addressPlate},length,config))return;
  if(drawNikitinaFacade(c,{layer,quad,window,rail,balcony,pediment,addressPlate},length,config,role))return;
  if(drawArtisanFacade(c,{layer,quad,window,rail,shutter,pediment,addressPlate},length,config,role))return;
  if(drawDzhanaevaFacade(c,{q,layer,quad,window,rail,balcony,shutter,addressPlate},length,config,role))return;
  if(drawNorthwestFacade(c,{q,layer,quad,window,rail,balcony,shutter,pediment,addressPlate,awning},length,config))return;
  if(drawWestFacade(c,{q,layer,quad,window,rail,balcony,medallion,shutter,pediment,addressPlate},length,config))return;
  if(drawLandmarkFacade(c,{q,layer,quad,window,rail,balcony,medallion,shutter,pediment,addressPlate},length,config))return;
  for(const s of sections){
    const a=s.start*length,b=s.end*length,w=b-a,bay=w/s.bays,h=s.height;
    layer(.025,()=>{
      c.fillStyle=wall;c.fillRect(a,-h,w,h);c.fillStyle='#9da293';c.fillRect(a,-.48,w,.48);
      if(s.frontStyle==='panelled-row'){
        c.fillStyle=tint(wall,1.08);c.fillRect(a,-h,w*5/9,h);
        c.fillStyle='#737f77';c.fillRect(a,-.95,w*5/9,.95);c.fillStyle='#4c5a53';c.fillRect(a+w*5/9,-.95,w*4/9,.95);
        if(config.details.ornament){
          c.fillStyle=accent;
          for(let n=0;n<s.bays;n++){const x=a+(n+.5)*bay;c.fillRect(x-bay*.37,-h+.34,bay*.74,.38);c.fillRect(x-bay*.37,-f+.06,bay*.74,.38);if(n<s.bays-1)c.fillRect(x+bay*.35,-h+1.4,bay*.28,f-1.6);}
        }
      }
      if(config.details.rustication){c.fillStyle=trim;for(let z=.65;z<f-.1;z+=.43)c.fillRect(a,-z,w,.065);}
      c.fillStyle=trim;for(const [z,t] of [[f,.22],[f+.28,.11],[h,.18],[h-.28,.13],[h-.52,.07]])c.fillRect(a-.09,-z,w+.18,t);
      for(const u of [a+.16,b-.16]){c.fillStyle=trim;c.fillRect(u-.12,-h+.4,.24,h-.9);c.fillRect(u-.23,-h+.65,.46,.18);}
      if(s.frontStyle==='arched-row'){for(const u of [a+.22,b-.22]){c.fillStyle=trim;c.fillRect(u-.18,-h+.3,.36,h-.75);c.fillRect(u-.26,-h+.62,.52,.16);}}
      if(config.template==='rosette-palace'&&config.details.ornament){for(let x=a+.3;x<b-.2;x+=.37){c.fillStyle=accent;c.beginPath();c.arc(x,-h+.72,.12,Math.PI,0);c.lineTo(x+.12,-h+.93);c.lineTo(x-.12,-h+.93);c.fill();}}
    });
    if(s.frontStyle?.startsWith('mansion-')){mansionSection(s,a,b,bay);if(config.details.parapet)rail(a+.2,b-.2,h+.1,.05,.55);continue;}
    for(let n=0;n<s.bays;n++){
      if(s.frontStyle){rowUpperWindow(s,n,a,bay,h);continue;}
      const x=a+(n+.5)*bay,ww=Math.min(bay*config.windowWidth,2.6),upperBottom=f+.58,wh=h-upperBottom-(s.pediments?1.55:1.15);
      if(s.shape==='triple'){
        for(const k of [-1,0,1])window(x+k*bay*.25,upperBottom,bay*.17,wh,'rect');
        window(x,.23,bay*.7,f-.55,'rect',true);
        if(config.details.ornament){layer(.15,()=>{c.fillStyle=trim;c.beginPath();c.moveTo(x-bay*.5,-f-.2);c.quadraticCurveTo(x,-f-1,x+bay*.5,-f-.2);c.closePath();c.fill();});}
      }else{
        window(x,upperBottom,ww,Math.max(1.9,wh),s.shape,false,s.pediments&&config.details.ornament);
        window(x,.55,ww,f-.94,s.groundShape,config.template==='arcade-wing'&&n===Math.floor(s.bays/2));
      }
      if(config.details.ornament&&s.shape!=='triple')layer(.14,()=>{
        c.fillStyle=trim;c.fillRect(x-bay*.44,-h+.6,.12,h-f-.8);
        if(config.details.rustication){c.beginPath();c.moveTo(x-.15,-f+.27);c.lineTo(x+.15,-f+.27);c.lineTo(x+.23,-f+.66);c.lineTo(x-.23,-f+.66);c.closePath();c.fill();}
      });
      if(config.details.balconies&&s.balcony?.includes(n))balcony(x,Math.min(bay*(s.canopy?.9:2.05),w*.72),f+.38,s.canopy);
    }
    if(s.frontStyle){
      for(const opening of rowGroundOpenings(config)){
        const x=a+opening.u*w,ww=opening.width*w,bottom=opening.door?.13:.55,wh=f-.62-bottom;
        if(opening.gate)carriageGate(x,ww,f-.62);
        else if(config.details.shutters&&opening.shutter)shutter(x,bottom,ww,wh,opening.headTrim);
        else window(x,bottom,ww,wh,'rect',opening.door,false,{thin:s.frontStyle==='arched-row',mullion:wood});
      }
      // Roof edge and downpipes are independent modules, not painted photographs.
      layer(.1,()=>{
        c.strokeStyle='#839186';c.lineWidth=.09;c.beginPath();
        for(const u of [a+.07,b-.07]){c.moveTo(u,-h+.12);c.lineTo(u,-.45);c.lineTo(u+.12,-.3);}c.stroke();
        c.fillStyle=tint(config.colors.roof,.7);c.fillRect(a-.1,-h-.06,w+.2,.08);
      });
      if(s.frontStyle==='panelled-row'){
        layer(.11,()=>{c.strokeStyle='#b3b9aa';c.lineWidth=.12;c.beginPath();c.moveTo(a+w*5/9,-h);c.lineTo(a+w*5/9,-.25);c.stroke();});
        // Small entrance hoods, without reproducing commercial signs or tenants.
        for(const [u,ww] of [[.555,.075],[.92,.15]])quad([[a+w*(u-ww/2),f-.38,.1],[a+w*(u+ww/2),f-.38,.1],[a+w*(u+ww/2),f-.55,.75],[a+w*(u-ww/2),f-.55,.75]],'#717e71',accent);
        addressPlate(a+w*.71);
      }
    }
    if(config.details.awnings&&s.awning){const middle=(a+b)/2;awning(a+.25,middle-.16,f-.35);awning(middle+.16,b-.25,f-.35);}
    if(config.details.parapet&&!s.awning){
      rail(a+.2,b-.2,h+.18,.05,.65);
      layer(.12,()=>{for(let x=a+.18;x<b;x+=Math.max(2.6,w/4)){c.fillStyle=trim;c.fillRect(x-.2,-h-.95,.4,.9);c.fillRect(x-.26,-h-.98,.52,.13);}});
    }
    if(s.attic&&config.details.ornament)layer(.22,()=>{
      const x=(a+b)/2,r=w*.58,z=h+.35;
      c.fillStyle=trim;c.strokeStyle=accent;c.lineWidth=.07;c.beginPath();c.moveTo(x-r,-h+.15);c.lineTo(x-r,-z);c.arc(x,-z,r,Math.PI,Math.PI*2);c.lineTo(x+r,-h+.15);c.closePath();c.fill();c.stroke();
      c.fillStyle=accent;c.beginPath();c.arc(x,-z-.15,r*.63,0,Math.PI*2);c.fill();
      c.strokeStyle=trim;c.lineWidth=.11;for(let i=0;i<12;i++){const t=i*Math.PI/6;c.beginPath();c.moveTo(x+Math.cos(t)*r*.34,-z-.15+Math.sin(t)*r*.34);c.lineTo(x+Math.cos(t)*r*.67,-z-.15+Math.sin(t)*r*.67);c.stroke();}
      c.beginPath();c.arc(x,-z-.15,r*.32,0,Math.PI*2);c.stroke();
    });
  }
}

export function facadeSprite(building,definition,config,view=getView()){
  return withView(view,()=>{
    const points=building.polygon.map(([x,y])=>[x-building.x,y-building.y]);
    const holes=(building.holes||[]).map(r=>r.map(([x,y])=>[x-building.x,y-building.y]));
    const local={...building,polygon:points,holes},frame=frontFrame(local,definition);
    return makeSprite(extentFor(points,facadeHeight(config),2),c=>{
      const sections=facadeVolumes(local,definition,config);
      sections.sort((a,b)=>{const mid=s=>s.poly.reduce((n,p)=>n+getView()*p[0]+p[1],0)/s.poly.length;return mid(a)-mid(b);});
      const frontVisible=frame.nx*getView()+frame.ny>0;
      // In the reverse view the roof must occlude the far corner's lower turret.
      if(!frontVisible&&config.template==='corner-turret'&&config.details.turret)drawCornerTurret(c,(u,z,d)=>project(...frame.point(u,z,d)),config);
      if(config.template==='arched-bow-balconies')for(const face of facadeFrames(local,definition,config).filter(f=>f.nx*getView()+f.ny<=0))drawPetrovskyRoof(c,(u,z,d)=>project(...face.point(u,z,d)),face.length,config,face.role);
      for(const face of facadeFrames(local,definition,config).filter(f=>f.nx*getView()+f.ny<=0))drawKirovaRoof(c,(u,z,d)=>project(...face.point(u,z,d)),face.length,config,face.role);
      for(const face of facadeFrames(local,definition,config).filter(f=>f.nx*getView()+f.ny<=0))drawSquareRoof(c,(u,z,d)=>project(...face.point(u,z,d)),face.length,config,face.role);
      if(sections.length===1)block(c,points,sections[0].height,config,sections[0].roof,holes);
      else if(config.template==='rosette-palace')block(c,points,2*config.floorHeight,config,'flat',holes);
      else for(const s of sections)block(c,s.poly,s.height,config,s.roof,s.holes,s.bands);
      const faces=facadeFrames(local,definition,config).filter(f=>f.nx*getView()+f.ny>0);
      faces.sort((a,b)=>project(...a.point(a.length/2)).y-project(...b.point(b.length/2)).y);
      for(const face of faces)drawFacade(c,(u,z,d)=>project(...face.point(u,z,d)),face.length,config,face.role);
    },26);
  });
}
export function drawElevation(canvas,building,definition,config,role='front'){
  const frame=facadeFrames(building,definition,config).find(f=>f.role===role)||frontFrame(building,definition),h=facadeHeight(config),c=canvas.getContext('2d');
  const scale=Math.min((canvas.width-70)/frame.length,(canvas.height-65)/h);
  c.clearRect(0,0,canvas.width,canvas.height);c.save();c.translate((canvas.width-frame.length*scale)/2,canvas.height-28);c.scale(scale,scale);
  drawFacade(c,(u,z,d)=>({x:u,y:-z+d*.12}),frame.length,config,role);c.restore();
}

// Compositions for 35 and the two photographed frontages of 37.
// No tenant signs or photo textures; all details use the shared facade painter.
import {tint} from './art.js';
import {pairedFrontages,northwestGroundOpenings} from './facade-model.js';

export function drawNorthwestFacade(c,p,length,config){
  if(!['oculus-corners','paired-frontages'].includes(config.template))return false;
  const {layer,quad,window,rail,balcony,shutter,pediment,addressPlate,awning}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=2*f;
  const house35=config.template==='oculus-corners';
  const band=(a,b,z,t,color=trim)=>layer(.14,()=>{c.fillStyle=color;c.fillRect(a,-z,b-a,t);});
  const line=(points,color=trim,w=.075)=>quad(points,null,color,w);
  function panel(x,z,w,hh,color=accent){layer(.15,()=>{c.fillStyle=color;c.fillRect(x-w/2,-z-hh,w,hh);c.strokeStyle=trim;c.lineWidth=.065;c.strokeRect(x-w/2,-z-hh,w,hh);});}
  function pilaster(x,w,base=.45,top=h){
    layer(.19,()=>{c.fillStyle=trim;c.fillRect(x-w/2,-top,w,top-base);c.fillRect(x-w*.8,-top+.15,w*1.6,.22);
      if(config.details.rustication)for(let z=base+.3;z<top-.3;z+=.42){c.fillStyle=accent;c.fillRect(x-w/2,-z,w,.035);}});
  }
  function cornice(a,b){
    for(const [z,t] of [[f,.2],[f+.26,.11],[h,.18],[h-.3,.14],[h-.66,.1]])band(a,b,z,t);
    if(config.details.ornament)layer(.18,()=>{c.fillStyle=trim;for(let x=a+.1;x<b-.08;x+=.28)c.fillRect(x,-h+.18,.105,.2);});
  }
  function oculusCrown(x,w,z,height,open=true){
    const outline=[[x-w/2,z],[x-w/2,z+height*.28],[x-w*.3,z+height*.28],[x-w*.16,z+height*.58],
      [x-w*.16,z+height*.83],[x+w*.16,z+height*.83],[x+w*.16,z+height*.58],[x+w*.3,z+height*.28],[x+w/2,z+height*.28],[x+w/2,z]];
    quad(outline,wall,accent);line(outline.slice(1,-1),trim,.12);
    band(x-w*.2,x+w*.2,z+height*.83,.1,roof);
    layer(.23,()=>{const r=Math.min(w*.16,.36),cy=-z-height*.35;c.beginPath();c.arc(x,cy,r+.1,0,Math.PI*2);c.fillStyle=trim;c.fill();c.beginPath();c.arc(x,cy,r,0,Math.PI*2);c.fillStyle=open?'#354b4c':accent;c.fill();});
  }
  function roundedAttic(x,w,z,height,color=wall){
    layer(.18,()=>{c.fillStyle=color;c.strokeStyle=trim;c.lineWidth=.12;c.beginPath();c.moveTo(x-w/2,-z);c.lineTo(x-w/2,-z-height*.58);c.quadraticCurveTo(x,-z-height*1.25,x+w/2,-z-height*.58);c.lineTo(x+w/2,-z);c.closePath();c.fill();c.stroke();
      if(config.details.ornament){c.strokeStyle=accent;c.lineWidth=.065;c.strokeRect(x-w*.3,-z-height*.48,w*.6,height*.32);}});
  }
  layer(.025,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);c.fillStyle='#8e8f85';c.fillRect(0,-.45,length,.45);});

  if(house35){
    const bay=length/config.wingBays,centre=Math.floor(config.wingBays/2);
    if(config.details.rustication)layer(.08,()=>{c.fillStyle=accent;for(let z=.65;z<f-.25;z+=.43)c.fillRect(0,-z,length,.045);});
    cornice(0,length);
    for(let i=0;i<config.wingBays;i++){
      const x=(i+.5)*bay,w=bay*config.windowWidth,bottom=f+.5,wh=f-1.55,edge=i===0||i===config.wingBays-1;
      window(x,bottom,w,wh,config.windowShape);
      if(config.details.ornament){
        if(edge){
          const z=bottom+wh+.22;
          line([[x-w*.7,z],[x,z+.75],[x+w*.7,z]],trim,.13);
          line([[x-w*.48,z],[x,z+.48],[x+w*.48,z]],accent,.06);
        }else{
          for(const u of [x-bay*.43,x+bay*.43])pilaster(u,.12,f+.45,h-.82);
          layer(.14,()=>{c.fillStyle=trim;for(const side of [-1,1]){const u=x+side*w*.28;c.beginPath();c.moveTo(u-.1,-f-.22);c.lineTo(u,-f-.38);c.lineTo(u+.1,-f-.22);c.lineTo(u,-f-.08);c.closePath();c.fill();}});
        }
      }
    }
    for(const u of [.015,.13,.35,.65,.87,.985])pilaster(length*u,.23);
    for(const o of northwestGroundOpenings(config)){
      const x=o.u*length,w=o.width*length,bottom=o.door?.08:.5;
      window(x,bottom,w,f-.65-bottom,'rect',o.door);
      if(config.details.awnings&&o.canopy)awning(x-w*.62,x+w*.62,f-.28);
    }
    if(config.details.balconies)balcony((centre+.5)*bay,Math.min(2.3,bay*1.2),f+.42,false);
    for(const u of [.065,.935])oculusCrown(length*u,Math.min(length*.16,3),h,2.35);
    band(length*.34,length*.66,h+1.06,1.06,wall);band(length*.33,length*.67,h+1.12,.15);
    for(const u of [.34,.66])pilaster(length*u,.24,h,h+1.2);
    if(config.details.ornament)panel(length*.5,h+.25,length*.25,.42,wall);
    if(config.details.parapet)for(const [a,b] of [[.15,.32],[.68,.85]])rail(length*a,length*b,h+.1,.03,.55);
    addressPlate(length*.975);
  }else{
    // The white southern frontage and coral northern frontage share the source
    // footprint. Their relative width is estimated; no new collision boundary.
    const sections=pairedFrontages(config);
    for(const section of sections){
      const a=section.start*length,b=section.end*length,w=b-a,white=section.style==='white',whiteWall=tint(trim,.88);
      layer(.04,()=>{c.fillStyle=white?whiteWall:wall;c.fillRect(a,-h,w,h);c.fillStyle=white?accent:'#ab7d70';c.fillRect(a,-.4,w,.4);if(!white){c.fillStyle=tint(trim,.92);c.fillRect(a,-h,w,h-f-.15);}});
      cornice(a,b);
      const centres=section.windows;
      for(let i=0;i<centres.length;i++){
        const o=centres[i],x=a+o.u*w,ww=o.width*w,base=f+.52,wh=f-1.5;
        window(x,base,ww,wh,white&&o.wing?'arch':config.windowShape);
        if(config.details.ornament){
          if(white&&o.wing)pediment(x,ww+.35,base+wh+.16,.28,false);
          else line([[x-ww*.65,base+wh+.12],[x,base+wh+.29],[x+ww*.65,base+wh+.12]],trim,.1);
          if(!white)panel(x,f+.17,ww,.22,wall);
        }
      }
      const divisions=white?[.015,.27,.73,.985]:Array.from({length:config.wingBays+1},(_,i)=>i/config.wingBays);
      for(const t of divisions)pilaster(a+t*w,.27,f+.22,h-.6);
      for(const o of northwestGroundOpenings(config).filter(o=>o.section===section.style)){
        const x=o.u*length,ww=o.width*length,base=o.door?.08:.45,hh=f-.75-base;
        if(config.details.shutters&&o.shutter)shutter(x,base,ww,hh,false);else window(x,base,ww,hh,'rect',o.door);
      }
      if(!white)for(const u of [.02,.245,.435,.635,.835]){
        const x=a+w*u;if(config.details.ornament)panel(x,.72,w*.025,f-1.9,wall);
      }
      if(config.details.balconies)balcony(a+w*.5,Math.min(4.6,w*.22),f+.4,false,!white);
      if(white){
        for(const u of [.13,.87]){band(a+w*(u-.115),a+w*(u+.115),h+.85,.85,whiteWall);band(a+w*(u-.12),a+w*(u+.12),h+.87,.13);roundedAttic(a+w*u,w*.075,h,1.4,whiteWall);}
        roundedAttic(a+w*.5,w*.17,h,2.05,whiteWall);
      }else{
        for(const u of [.1,.9]){
          band(a+w*(u-.09),a+w*(u+.09),h+.75,.75,wall);
          roundedAttic(a+w*u,w*.07,h+.1,1.3);
        }
        // Separate residential entrance canopy at the northern end.
        quad([[b-w*.12,f-.1,0],[b-w*.015,f-.1,0],[b-w*.015,f-.25,.8],[b-w*.12,f-.25,.8]],roof,accent);
        addressPlate(b-w*.11);
      }
      if(config.details.parapet)rail(a+.2,b-.2,h+.1,.04,.55);
    }
  }
  layer(.26,()=>{c.strokeStyle=accent;c.lineWidth=.08;c.beginPath();for(const u of [.06,length-.06]){c.moveTo(u,-h);c.lineTo(u,-.18);}c.stroke();});
  return true;
}

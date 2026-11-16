// Mira 50/52: the modern ribbon-window building and the historic corner house.
// Original Canvas elevations, informed by the dated references in the catalog.
import {petrovskyUpperBays,petrovskyGroundBays} from './facade-model.js';
import {tint} from './art.js';

export function drawPetrovskyFacade(c,p,length,config,role='front'){
  if(!['ribbon-modern','arched-bow-balconies'].includes(config.template))return false;
  const {layer,quad,window,shutter,rail,addressPlate}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight;
  const modern=config.template==='ribbon-modern',corner=role==='corner',side=role==='return',h=(modern?5:2)*f;
  const iron='#394943',glass='#41646b';
  const edge=(points,color=iron,lw=.045)=>quad(points,null,color,lw);
  const band=(z,t,color=trim)=>layer(.1,()=>{c.fillStyle=color;c.fillRect(0,-z,length,t);});
  layer(.025,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);c.fillStyle=tint(accent,.8);c.fillRect(0,-.4,length,.4);});

  function steps(x,w){
    for(let n=3;n>=0;n--){const d=.3+n*.2,z=.28-n*.06;quad([[x-w/2,z,0],[x+w/2,z,0],[x+w/2,z,d],[x-w/2,z,d]],tint(trim,.7+n*.055));}
  }
  if(modern){
    if(config.details.rustication)layer(.03,()=>{
      c.strokeStyle=tint(wall,.93);c.lineWidth=.018;c.beginPath();
      for(let z=.5;z<h;z+=.53){c.moveTo(0,-z);c.lineTo(length,-z);}
      for(let x=.3;x<length;x+=1.35){c.moveTo(x,-h);c.lineTo(x,-.5);}c.stroke();
    });
    if(!side){
      const a=length*.025,b=length*.81,w=b-a;
      // Four continuous ribbons above the shop floor; concrete bands separate them.
      for(let floor=1;floor<5;floor++){
        const bottom=floor*f+.35,hh=f-.97,bays=petrovskyUpperBays(config);
        layer(.04,()=>{c.fillStyle='#34474b';c.fillRect(a-.08,-bottom-hh-.1,w+.16,hh+.2);});
        for(const bay of bays){
          const x=a+bay.u*w,bw=bay.width*w;
          layer(.08,()=>{
            c.fillStyle=floor===4?'#698d9d':glass;c.fillRect(x-bw/2,-bottom-hh,bw,hh);
            c.fillStyle=floor===4?'#8babb1':'#6a8684';c.globalAlpha=.52;c.fillRect(x-bw/2+.035,-bottom-hh+.06,bw*.4,hh-.12);c.globalAlpha=1;
            c.strokeStyle=floor===4?trim:accent;c.lineWidth=.035;c.strokeRect(x-bw/2,-bottom-hh,bw,hh);
            c.beginPath();c.moveTo(x-bw/2,-bottom-hh*.78);c.lineTo(x+bw/2,-bottom-hh*.78);c.stroke();
            if(floor<4&&config.details.ornament&&bay.index%9===4){c.strokeStyle=trim;c.lineWidth=.045;c.strokeRect(x-bw/2+.04,-bottom+.02-hh*.7,bw-.08,hh*.7-.06);}
          });
        }
        layer(.09,()=>{c.fillStyle=tint(wall,.77);c.fillRect(a-.06,-bottom+.02,w+.12,.08);});
      }
      for(const b of petrovskyGroundBays(config)){
        const x=b.u*length,w=b.width*length;
        window(x,b.door?.25:.4,w,f-.95,'rect',b.door,false,{thin:true,mullion:accent});
        if(b.door){steps(x,w*1.15);rail(x-w*.6,x-w*.6+.75,.2,.8,.7,trim);}
      }
      if(config.details.ornament&&config.buildingId==='mira50')layer(.1,()=>{
        const x=length*.905,w=length*.16;c.fillStyle=tint(accent,.68);c.textAlign='center';
        c.font='1.7px Georgia';c.fillText('ДОМ',x,-h*.54,w);
        c.font='italic 1.45px Georgia';c.fillText('Моды',x,-h*.45,w);
      });
    }else{
      // The southern end is visible in the reference: individual windows, no ribbon.
      for(let floor=0;floor<5;floor++)for(const b of petrovskyUpperBays(config,role)){
        const door=floor===0&&b.index===1;
        window(b.u*length,door?.15:floor*f+.6,b.width*length,door?f-.65:f-1.2,'rect',door,false,{thin:true,mullion:accent});
      }
    }
    band(h,.13,roof);if(config.details.parapet)band(h+.55,.55,wall);
    if(!side)addressPlate(length*.97);
    return true;
  }

  function panel(x,z,w,hh){
    layer(.16,()=>{c.fillStyle=trim;c.fillRect(x-w/2,-z-hh,w,hh);c.fillStyle=wall;c.fillRect(x-w/2+.08,-z-hh+.07,w-.16,hh-.14);});
  }
  function pier(u,w=.22){
    layer(.17,()=>{const x=u*length;c.fillStyle=trim;c.fillRect(x-w/2,-h+.2,w,f-.3);for(const z of [f+.3,h-.28,h-.47])c.fillRect(x-w*.85,-z,w*1.7,.13);});
  }
  function stoneBase(){
    layer(.06,()=>{
      c.beginPath();c.rect(0,-.68,length,.68);c.clip();
      c.fillStyle='#8f9482';c.fillRect(0,-.68,length,.68);
      for(let i=0,x=0;x<length;i++,x+=.55){const d=(Math.sin(i*13.7)+1)*.08;c.beginPath();c.moveTo(x+.03,-.08);c.lineTo(x+.48,-.05);c.lineTo(x+.54,-.38-d);c.lineTo(x+.32,-.63);c.lineTo(x+.02,-.5+d);c.closePath();c.fillStyle=['#bcb7a1','#a5a18c','#d1c7ac'][i%3];c.fill();c.strokeStyle='#6e7569';c.lineWidth=.025;c.stroke();}
    });
  }
  function archCrown(x,w,bottom,hh,shape,alternate){
    if(!config.details.ornament)return;
    layer(.16,()=>{
      const top=bottom+hh,r=w/2+.18;
      if(shape==='arch'){
        const cy=-top+w/2;c.strokeStyle=trim;c.lineWidth=.13;c.beginPath();c.arc(x,cy,r,Math.PI,Math.PI*2);c.stroke();
        if(alternate){c.strokeStyle=tint(trim,.93);c.lineWidth=.085;for(let n=0;n<=14;n++){const t=Math.PI+n*Math.PI/14;c.beginPath();c.moveTo(x+Math.cos(t)*(r+.04),cy+Math.sin(t)*(r+.04));c.lineTo(x+Math.cos(t)*(r+.21),cy+Math.sin(t)*(r+.21));c.stroke();}}
        else {c.fillStyle=trim;c.fillRect(x-.14,-top-.28,.28,.3);for(const sign of [-1,1])c.fillRect(x+sign*r-.15,cy-.08,.3,.12);}
      }else {c.fillStyle=trim;c.fillRect(x-w/2-.22,-top-.23,w+.44,.13);}
    });
  }
  function bowBalcony(x,w,z){
    if(!config.details.balconies)return;
    const segments=18;
    const rim=Array.from({length:segments+1},(_,i)=>{const t=i/segments;return [x-w/2+w*t,1+.24*Math.sin(Math.PI*t)];});
    quad([[x-w/2,z,0],...rim.map(([u,d])=>[u,z,d]),[x+w/2,z,0]],trim);
    for(let i=1;i<rim.length;i++){
      const [a,da]=rim[i-1],[b,db]=rim[i];quad([[a,z,da],[b,z,db],[b,z-.18,db],[a,z-.18,da]],tint(trim,.8));
      // The railing flares at its foot, like the bowed ironwork in the photographs.
      edge([[a,z+.1,da],[a,z+.52,da+.13],[a,z+.98,da-.09]],iron,.035);
      edge([[a,z+.98,da-.09],[b,z+.98,db-.09]],iron,.05);
      if(config.details.ornament){edge([[a,z+.17,da],[b,z+.82,db],[a,z+.82,da],[b,z+.17,db]],iron,.022);}
    }
    for(const [u,d] of [rim[0],rim.at(-1)])edge([[u,z,0],[u,z,d],[u,z+1,d-.09],[u,z+1,0]],iron,.045);
    if(config.details.ornament)layer(1.18,()=>{
      c.strokeStyle=iron;c.lineWidth=.023;for(let u=x-w/2+.15;u<x+w/2;u+=.28){c.beginPath();c.ellipse(u,-z-.82,.105,.1,0,0,Math.PI*2);c.stroke();}
    });
    // Small planted pots are architectural accents seen on the 2022 balconies.
    if(config.details.ornament)for(const t of [-.31,.29])layer(1.05,()=>{const u=x+w*t;c.fillStyle='#997d60';c.fillRect(u-.12,-z-.32,.24,.26);c.fillStyle='#778e63';c.beginPath();c.ellipse(u,-z-.43,.19,.17,0,0,Math.PI*2);c.fill();});
  }
  if(config.details.rustication){
    stoneBase();layer(.035,()=>{c.strokeStyle=tint(wall,.92);c.lineWidth=.018;c.beginPath();for(let z=f+.3;z<h-.45;z+=.15){c.moveTo(0,-z);c.lineTo(length,-z);}c.stroke();});
  }
  for(const [z,t] of [[f,.22],[f+.28,.14],[h,.2],[h-.23,.14],[h-.52,.08]])band(z,t);
  band(f-.12,.08,'#796958');band(h+.05,.07,roof);
  for(const b of petrovskyUpperBays(config,role)){
    const x=b.u*length,w=Math.min(b.width*length,(f-1.2)*1.65),bottom=f+.55,hh=f-1.2,shape=b.rect?'rect':config.windowShape;
    window(x,bottom,w,hh,shape,false,false,{mullion:trim});archCrown(x,w,bottom,hh,shape,b.index%3===2);
    if(config.details.ornament){panel(x,f+.1,w+.2,.3);if(b.index%3===1)layer(.17,()=>{c.fillStyle=trim;for(let u=x-w*.35;u<x+w*.4;u+=.2)c.fillRect(u,-f-.34,.09,.18);});}
  }
  for(const b of petrovskyGroundBays(config,role)){
    const x=b.u*length,w=b.width*length,bottom=b.door?.15:.65,hh=f-bottom-.55;
    if(b.niche){panel(x,bottom,w,hh);continue;}
    if(b.shutter&&config.details.shutters)shutter(x,bottom,w,hh,false);
    else window(x,bottom,w,hh,'rect',b.door,false,{mullion:trim});
    if(b.door)steps(x,w*1.05);
  }
  for(const u of corner?[.05,.95]:side?[.025,.25,.75,.975]:[.02,.42,.57,.975])pier(u);
  if(corner){
    bowBalcony(length*.5,length*.96,f+.08);
  }else if(side){
    bowBalcony(length*.875,length*.18,f+.08);

  }else{
    bowBalcony(length*.445,length*.22,f+.08);
    addressPlate(length*.97);
  }
  drawPetrovskyRoof(c,p.q,length,config,role);
  if(config.details.ornament)layer(.17,()=>{c.fillStyle=trim;for(let x=.15;x<length;x+=.3)c.fillRect(x,-h+.17,.09,.17);});
  if(config.details.parapet&&!corner)rail(.2,length-.2,h+.1,.03,.55);
  layer(.22,()=>{c.strokeStyle='#7e887c';c.lineWidth=.09;c.beginPath();for(const u of [.025,.975]){c.moveTo(u*length,-h);c.lineTo(u*length,-.2);}c.stroke();});
  return true;
}

// Roof silhouettes remain visible above the far facade in the reverse camera.
// Draw hidden-face roofs before the building, so its roof occludes their bases.
export function drawPetrovskyRoof(c,q,length,config,role='front'){
  if(config.template!=='arched-bow-balconies')return;
  const {wall,trim,roof}=config.colors,h=2*config.floorHeight,corner=role==='corner';
  function layer(off,draw){const o=q(0,0,off),x=q(1,0,off),y=q(0,-1,off);c.save();c.transform(x.x-o.x,x.y-o.y,y.x-o.x,y.y-o.y,o.x,o.y);draw();c.restore();}
  function quad(points,fill,stroke=null,lw=.04){c.beginPath();points.forEach(([u,z,d=0],i)=>{const v=q(u,z,d);i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y);});c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
  const edge=(points,color,lw=.045)=>quad(points,null,color,lw);
  function gable(u,span,rise,cap){
    const x=u*length,w=length*span,z=h-.1;
    if(cap&&config.details.turret){
      const base=z+rise*.77,capHeight=corner?2.15:1.5;
      // A tall hipped cap above the front gable, not a mirrored copy on the rear.
      quad([[x-w*.52,h-.08,-.22],[x+w*.52,h-.08,-.22],[x+w*.52,base,-.22],[x-w*.52,base,-.22]],wall,trim,.09);
      quad([[x-w*.58,base-.13,-.2],[x+w*.58,base-.13,-.2],[x+w*.58,base+.04,-.2],[x-w*.58,base+.04,-.2]],trim);
      quad([[x-w*.57,base,-.22],[x-w*.32,base+capHeight,-.22],[x+w*.32,base+capHeight,-.22],[x+w*.57,base,-.22]],tint(roof,1.12),trim,.1);
      quad([[x+w*.57,base,-.22],[x+w*.32,base+capHeight,-.22],[x+w*.25,base+capHeight,-.9],[x+w*.48,base,-.9]],tint(roof,.85),trim,.08);
      layer(.02,()=>{c.fillStyle=wall;c.fillRect(x-w*.19,-base-capHeight-.55,w*.38,.67);c.fillStyle=trim;c.fillRect(x-w*.27,-base-capHeight-.65,w*.54,.16);c.fillRect(x-w*.23,-base-capHeight-.36,w*.46,.12);c.fillRect(x-.09,-base-capHeight-.5,.18,capHeight+.5);});
      edge([[x-w*.45,base,-.18],[x-w*.25,base+capHeight,-.18]],trim,.07);
    }
    quad([[x-w/2,z],[x-w/2,z+.25],[x,z+rise],[x+w/2,z+.25],[x+w/2,z]],wall,trim,.12);
    if(config.details.ornament)layer(.17,()=>{c.beginPath();c.arc(x,-z-rise*.56,Math.min(.27,w*.14),0,Math.PI*2);c.fillStyle='#46564d';c.fill();c.strokeStyle=trim;c.lineWidth=.1;c.stroke();});
  }
  if(corner)gable(.5,1.05,1.4,true);
  else if(role==='front')gable(.5,.15,1.1,true);
  else{
    // A lower round-headed attic marks the Petrovsky elevation.
    layer(.12,()=>{const x=length*.5,w=length*.26;c.fillStyle=wall;c.strokeStyle=trim;c.lineWidth=.12;c.beginPath();c.moveTo(x-w/2,-h);c.lineTo(x-w/2,-h-.5);c.lineTo(x-.55,-h-.5);c.quadraticCurveTo(x,-h-1.35,x+.55,-h-.5);c.lineTo(x+w/2,-h-.5);c.lineTo(x+w/2,-h);c.closePath();c.fill();c.stroke();});
  }
}

// The east row, Mira 42–48. Original drawings using shared constructor modules.
// Photos document street elevations; heights and hidden walls are estimates.
import {eastUpperBays,eastGroundBays} from './facade-model.js';
import {tint} from './art.js';

export function drawEastNorthFacade(c,p,length,config){
  if(!['twin-oculus','canopied-balcony','brick-portals','brick-canopy'].includes(config.template))return false;
  const {layer,quad,window,rail,balcony,pediment,addressPlate}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=2*f;
  const twin=config.template==='twin-oculus',plaster=config.template==='canopied-balcony',brick=!twin&&!plaster,portal=config.template==='brick-portals';
  const iron='#3d4845',brickTrim=tint(wall,1.13);
  const band=(z,t,color=trim,off=.12)=>layer(off,()=>{c.fillStyle=color;c.fillRect(0,-z,length,t);});
  const edge=(points,color=iron,lw=.05)=>quad(points,null,color,lw);
  function panel(x,z,w,hh,color=trim){
    layer(.16,()=>{c.fillStyle=color;c.fillRect(x-w/2,-z-hh,w,hh);c.fillStyle=wall;c.fillRect(x-w/2+.09,-z-hh+.08,w-.18,hh-.16);});
  }
  function pilaster(u,w,z0,z1,color=trim){
    const x=u*length;
    layer(.16,()=>{c.fillStyle=color;c.fillRect(x-w/2,-z1,w,z1-z0);for(const z of [z0+.14,z1-.08,z1-.3])c.fillRect(x-w*.8,-z,w*1.6,.13);});
  }
  function roundedAttic(u,span,rise,oculus){
    const x=u*length,w=length*span,r=Math.min(w*.25,.95),base=h+.55;
    layer(.1,()=>{
      c.beginPath();c.moveTo(x-w/2,-h);c.lineTo(x-w/2,-base);c.lineTo(x-r,-base);c.ellipse(x,-base,r,rise,0,Math.PI,Math.PI*2);c.lineTo(x+w/2,-base);c.lineTo(x+w/2,-h);c.closePath();c.fillStyle=wall;c.fill();c.strokeStyle=brick?brickTrim:trim;c.lineWidth=.16;c.stroke();
      c.beginPath();c.moveTo(x-w/2,-base-.13);c.lineTo(x-r,-base-.13);c.ellipse(x,-base-.13,r,rise,0,Math.PI,Math.PI*2);c.lineTo(x+w/2,-base-.13);c.strokeStyle=roof;c.lineWidth=.12;c.stroke();
      if(config.details.ornament){c.strokeStyle=brick?accent:trim;c.lineWidth=.07;c.beginPath();c.ellipse(x,-base,r*.72,rise*.73,0,Math.PI,Math.PI*2);c.stroke();}
      if(oculus){c.beginPath();c.arc(x,-base-.23,.34,0,Math.PI*2);c.fillStyle=accent;c.fill();c.strokeStyle=trim;c.lineWidth=.13;c.stroke();}
    });
  }
  function coveredBalcony(u,span){
    if(!config.details.balconies)return;
    const x=u*length,w=span*length,z=f+.12,depth=1.25,top=h-.7,rise=.48;
    balcony(x,w,z,false);rail(x-w/2,x+w/2,z,1,.88,iron,config.details.ornament);
    if(!config.details.awnings)return;
    for(const sign of [-1,1]){
      quad([[x,top+rise,0],[x+sign*w*.54,top,0],[x+sign*w*.54,top,depth],[x,top+rise,depth]],tint(roof,sign===1?.7:.85),iron,.045);
      edge([[x+sign*w/2,z+.82,1],[x+sign*w/2,top,depth]],iron,.075);
    }
    edge([[x-w*.54,top,depth],[x,top+rise,depth],[x+w*.54,top,depth]],iron,.08);
    if(config.details.ornament)layer(depth,()=>{
      c.strokeStyle=iron;c.lineWidth=.035;
      for(let u=x-w/2+.22;u<x+w/2;u+=.36){c.beginPath();c.ellipse(u,-top+.05,.14,.15,0,0,Math.PI*2);c.stroke();}
      for(const sign of [-1,1]){c.beginPath();c.ellipse(x+sign*(w/2-.2),-top+.35,.17,.3,sign*.35,0,Math.PI*2);c.stroke();}
    });
  }
  function shop(x,w,bottom,wh,door){
    window(x,bottom,w,wh,'rect',door,false,{thin:brick,mullion:brick?trim:accent});
    if(!door&&brick)layer(.1,()=>{c.strokeStyle=trim;c.lineWidth=.07;c.beginPath();for(const sign of [-1,1]){c.moveTo(x+sign*w*.26,-bottom);c.lineTo(x+sign*w*.26,-bottom-wh);}c.stroke();});
    if(door)for(let n=2;n>=0;n--){const d=.35+n*.21,z=.21-n*.055;quad([[x-w*.62,z,0],[x+w*.62,z,0],[x+w*.62,z,d],[x-w*.62,z,d]],tint(trim,.78+n*.05));}
  }

  layer(.02,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);if(twin){c.fillStyle='#abb8a6';c.fillRect(0,-f,length,f);}c.fillStyle=brick?'#b7b4a2':'#92998b';c.fillRect(0,-.43,length,.43);});
  if(brick&&config.details.rustication)layer(.04,()=>{
    // Fine horizontal mortar and staggered joints, baked once into the sprite.
    c.strokeStyle=tint(wall,.79);c.lineWidth=.023;c.beginPath();
    for(let row=0,z=.5;z<h;z+=.13,row++){
      c.moveTo(0,-z);c.lineTo(length,-z);
      for(let x=(row%2)*.21;x<length;x+=.42){c.moveTo(x,-z);c.lineTo(x,-z-.13);}
    }c.stroke();
  });
  if(!brick&&config.details.rustication)layer(.055,()=>{
    c.strokeStyle=tint(wall,.77);c.lineWidth=.035;c.beginPath();for(let z=.7;z<f;z+=.43){c.moveTo(0,-z);c.lineTo(length,-z);}c.stroke();
    if(plaster){c.fillStyle=trim;for(let u=.025;u<1;u+=1/9)for(let z=.6;z<f-.2;z+=.68)c.fillRect(u*length-.25,-z,.5,.36);}
  });
  for(const [z,t] of [[f,.22],[f+.3,.12],[h,.18],[h-.23,.12],[h-.55,.1]])band(z,t,brick?brickTrim:trim);
  if(brick)band(h-.12,.12,trim);
  band(h+.04,.07,roof);

  const bays=eastUpperBays(config);
  for(const b of bays){
    const x=b.u*length,w=b.width*length,bottom=f+.52,wh=f-1.32;
    if(brick&&config.details.ornament){
      // Brick hood moulds and recessed panels stay distinct from white frames.
      layer(.12,()=>{c.strokeStyle=brickTrim;c.lineWidth=.18;c.beginPath();c.moveTo(x-w/2-.25,-bottom-wh+.1);c.quadraticCurveTo(x,-bottom-wh-.55,x+w/2+.25,-bottom-wh+.1);c.stroke();});
      panel(x,f+.08,w+.25,.28,brickTrim);
    }
    window(x,bottom,w,wh,config.windowShape,false,false,{mullion:brick?trim:accent});
    if(!brick&&config.details.ornament){
      panel(x,f+.08,w+.25,.29);
      if(plaster){panel(x,h-.48,w+.3,.24);pilaster(Math.max(.015,b.u-.5/config.wingBays),.17,f+.35,h-.4);}
      if(twin){
        layer(.15,()=>{c.fillStyle=trim;c.fillRect(x-w/2-.11,-bottom-wh-.24,w+.22,.12);});
        if(b.end)pilaster(Math.max(.015,b.u-.041),.15,f+.25,h-.55);
      }
    }
  }
  for(const b of eastGroundBays(config)){
    const x=b.u*length,w=b.width*length,bottom=b.door?.12:brick?.45:.65,wh=f-bottom-.65;
    if(b.shutter&&config.details.shutters)p.shutter(x,bottom,w,wh,false);else shop(x,w,bottom,wh,b.door);
  }

  if(twin){
    for(const u of [.015,.25,.75,.985])pilaster(u,.3,f+.12,h,trim);
    for(const u of [.13,.87]){roundedAttic(u,.25,.98,true);if(config.details.ornament)pediment(u*length,length*.15,h-.78,.43,false);}
    if(config.details.ornament)layer(.2,()=>{c.fillStyle=trim;for(let x=.14;x<length;x+=.38)c.fillRect(x,-f+.03,.13,.24);for(let x=length*.28;x<length*.74;x+=.65)c.fillRect(x,-h+.25,.12,.3);});
    if(config.details.balconies)balcony(length*.13,length*.14,f+.1,false);
  }else if(plaster){
    coveredBalcony(.66,.34);
  }else if(portal){
    const u=.1875,w=length*.115;
    for(const side of [-1,1]){
      const x=u+side*.071;pilaster(x,.47,.45,h+.6,brickTrim);
      layer(.2,()=>{c.fillStyle=brickTrim;c.fillRect(length*x-.42,-h-.8,.84,.3);c.strokeStyle=accent;c.lineWidth=.045;c.strokeRect(length*x-.24,-h-.42,.48,.42);});
    }
    if(config.details.ornament){pediment(length*u,w*1.13,h-.65,.45,false);for(let x=.3;x<length;x+=.47)panel(x,h-.45,.3,.18,brickTrim);}
  }else{
    for(const u of [.125,.875])roundedAttic(u,.23,.52,false);
    coveredBalcony(.625,.31);
    if(config.details.awnings){const x=length*.625,w=length*.25;quad([[x-w/2,f-.3,0],[x+w/2,f-.3,0],[x+w/2,f-.85,1.1],[x-w/2,f-.85,1.1]],'#79535a',trim,.045);}
  }
  if(brick&&config.details.ornament)layer(.14,()=>{c.strokeStyle=accent;c.lineWidth=.06;c.beginPath();for(let x=.2;x<length-.2;x+=.42){c.moveTo(x,-h+.55);c.lineTo(x,-h+.75);c.lineTo(x+.27,-h+.75);c.lineTo(x+.27,-h+.55);}c.stroke();});
  if(config.details.parapet)rail(.2,length-.2,h+.07,.04,.55);
  // Drainpipes and a small address plate are unbranded reusable street details.
  layer(.21,()=>{c.strokeStyle=brick?'#795b50':accent;c.lineWidth=.075;c.beginPath();for(const u of [.02,.98]){c.moveTo(u*length,-h);c.lineTo(u*length,-.2);}c.stroke();});
  addressPlate(length*.045);
  return true;
}

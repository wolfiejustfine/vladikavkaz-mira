// Photo-led Mira 43/45 compositions. Reuse the constructor's projected modules;
// no photographs or tenant branding are embedded in the game.
import {artisanUpperBays,artisanGroundBays} from './facade-model.js';
import {tint} from './art.js';

export function drawArtisanFacade(c,p,length,config,role='front'){
  if(!['brick-white-frames','stucco-niches'].includes(config.template))return false;
  const {layer,quad,window,rail,shutter,pediment,addressPlate}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=2*f;
  const brick=config.template==='brick-white-frames',corner=role==='corner';
  const band=(z,t,color=trim)=>layer(.14,()=>{c.fillStyle=color;c.fillRect(0,-z,length,t);});
  const edge=(points,color=trim,w=.06)=>quad(points,null,color,w);
  const upper=artisanUpperBays(config,role),ground=artisanGroundBays(config,role);
  layer(.025,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);if(!brick){c.fillStyle=accent;c.fillRect(0,-f,length,f);}c.fillStyle='#747a6c';c.fillRect(0,-.4,length,.4);});

  // Brick courses on 43; shallow stucco joints on 45's upper storey.
  if(config.details.rustication)layer(.045,()=>{
    c.strokeStyle=tint(wall,brick?.78:.83);c.lineWidth=brick?.022:.032;c.beginPath();
    const step=brick?.17:.4;
    for(let row=0;row<h/step;row++){
      const z=.4+row*step;if(z>h-.15||(!brick&&z<f+.18))continue;
      c.moveTo(0,-z);c.lineTo(length,-z);
      if(brick)for(let x=(row%2)*.25;x<length;x+=.5){c.moveTo(x,-z);c.lineTo(x,-Math.min(h,z+step));}
    }c.stroke();
  });
  for(const [z,t] of [[f,.17],[f+.3,.09],[h,.16],[h-.25,.12]])band(z,t,brick?tint(wall,1.14):trim);
  band(h-.36,.065,trim);band(h+.045,.08,roof);
  if(config.details.ornament)layer(.18,()=>{c.fillStyle=trim;for(let x=.1;x<length-.1;x+=brick?.32:.23)c.fillRect(x,-h+.23,brick?.13:.09,.15);});

  function pier(x,w,z0,z1,color=trim){
    layer(.17,()=>{
      c.fillStyle=color;c.fillRect(x-w/2,-z1,w,z1-z0);
      for(const [z,t] of [[z0+.12,.12],[z1,.16],[z1-.23,.1]])c.fillRect(x-w*.7,-z,w*1.4,t);
      if(config.details.rustication){c.fillStyle=tint(color,.8);for(let z=z0+.45;z<z1-.3;z+=.4)c.fillRect(x-w/2,-z,w,.03);}
    });
  }
  function floralPanel(x,z,w,hh){
    layer(.19,()=>{
      c.fillStyle=tint(wall,.82);c.fillRect(x-w/2,-z-hh,w,hh);c.strokeStyle=trim;c.lineWidth=.045;c.strokeRect(x-w/2,-z-hh,w,hh);
      c.beginPath();c.ellipse(x,-z-hh*.49,w*.12,hh*.28,0,0,Math.PI*2);c.stroke();
      for(const side of [-1,1])for(const shift of [0,.17]){
        c.beginPath();c.moveTo(x,-z-hh*.2);c.bezierCurveTo(x+side*w*.53,-z-hh*(.12+shift),x+side*w*.45,-z-hh*(.94-shift),x+side*w*.15,-z-hh*.67);c.stroke();
      }
    });
  }
  for(const bay of upper){
    const x=bay.u*length,bw=corner?length*.74:length/config.wingBays,w=bay.width*length;
    const bottom=f+(brick?.65:.78),wh=f-(brick?1.55:1.85),top=bottom+wh;
    window(x,bottom,w,wh,config.windowShape,false,false,{thin:!brick});
    if(brick){
      // Tall white architraves and straight layered heads contrast with brick.
      layer(.18,()=>{
        c.fillStyle=trim;for(const s of [-1,1]){c.fillRect(x+s*(w/2+.16)-.075,-top,.15,wh+.14);c.fillRect(x+s*(w/2+.16)-.14,-top+.12,.28,.26);}
        for(const [z,t,width] of [[top+.16,.18,w+.5],[top+.34,.13,w+.67]])c.fillRect(x-width/2,-z,width,t);
        if(config.details.ornament){
          c.fillStyle=tint(trim,.84);c.fillRect(x-w*.47,-top-.09,w*.94,.25);c.fillStyle=trim;
          for(let u=x-w*.48;u<x+w*.5;u+=.16)c.fillRect(u,-top-.27,.065,.08);
        }
      });
      if(config.details.ornament)layer(.12,()=>{c.strokeStyle=tint(wall,.76);c.lineWidth=.06;c.strokeRect(x-w*.47,-f-.35,w*.94,.23);});
    }else{
      const pw=Math.min(bw*.17,.23),panelWidth=Math.min(w+.05,bw*.72);
      for(const u of [x-bw*.43,x+bw*.43])pier(u,pw,f+.25,h-.77);
      if(config.details.ornament){
        floralPanel(x,top+.18,panelWidth,.38);
        if(bay.ornate)pediment(x,bw*.9,h-.65,.32,false);
        else{
          edge([[x-bw*.44,top+.68],[x+bw*.44,top+.68]],trim,.12);
          for(const side of [-1,1])edge([[x+side*bw*.37,top+.68],[x+side*bw*.32,top+.3]],trim,.09);
        }
        // Crossed panels under the windows remain visible at street scale.
        layer(.18,()=>{c.strokeStyle=trim;c.lineWidth=.07;c.strokeRect(x-w*.55,-f-.48,w*1.1,.24);c.beginPath();c.moveTo(x-w*.5,-f-.25);c.lineTo(x,-f-.46);c.lineTo(x+w*.5,-f-.25);c.stroke();});
      }
    }
  }

  for(const bay of ground){
    const x=bay.u*length,w=bay.width*length,z=bay.door?.12:.6,wh=f-z-.7;
    if(bay.niche){
      // Simple sculpted silhouettes stand in for the decorative figures in the
      // photo; they are recessed architectural reliefs, not gameplay NPCs.
      layer(.08,()=>{
        const nw=w*.87,nh=f-1.3,base=.68,top=base+nh;
        c.fillStyle=tint(trim,.85);c.beginPath();c.moveTo(x-nw/2,-base);c.lineTo(x-nw/2,-top+nw*.5);c.arc(x,-top+nw*.5,nw/2,Math.PI,Math.PI*2);c.lineTo(x+nw/2,-base);c.closePath();c.fill();
        if(config.details.ornament){
          c.fillStyle=tint(trim,.68);c.fillRect(x-.11,-base-.18,.22,.18);
          c.fillStyle=trim;c.beginPath();c.ellipse(x,-base-nh*.65,nw*.12,nh*.09,0,0,Math.PI*2);c.fill();
          c.beginPath();c.moveTo(x-nw*.13,-base-nh*.54);c.lineTo(x+nw*.13,-base-nh*.54);c.lineTo(x+nw*.22,-base-.23);c.quadraticCurveTo(x,-base-.12,x-nw*.2,-base-.23);c.closePath();c.fill();
          c.strokeStyle=tint(trim,.75);c.lineWidth=.03;for(const s of [-1,1]){c.beginPath();c.moveTo(x+s*nw*.07,-base-nh*.49);c.lineTo(x+s*nw*.12,-base-.25);c.stroke();}
        }
      });
      rail(x-w*.46,x+w*.46,.6,.12,.45,'#485951');
    }else{
      window(x,z,w,wh,'rect',bay.door,false,{thin:!brick});
      if(config.details.shutters&&bay.shutter){
        shutter(x,z+wh*.36,w,wh*.64,false);
        layer(.09,()=>{c.fillStyle='rgba(23,34,30,.72)';c.fillRect(x-w/2,-z-wh,w,wh*.64);});
      }
      if(bay.door){
        quad([[x-w*.6,.12,.02],[x+w*.6,.12,.02],[x+w*.6,.12,.65],[x-w*.6,.12,.65]],'#c7c4ae');
        quad([[x-w*.6,.12,.65],[x+w*.6,.12,.65],[x+w*.6,0,.65],[x-w*.6,0,.65]],'#959a88');
      }
      if(!brick&&config.details.awnings){
        const a=x-w*.57,b=x+w*.57,z=f-.55;
        quad([[a,z,.04],[b,z,.04],[b,z-.16,.35],[a,z-.16,.35]],'#b7a96c',accent);
        for(const u of [a,b])edge([[u,z-.16,.35],[u,z-.48,.35]],'#d7c68e',.1);
      }
    }
  }

  if(brick){
    for(const u of [.015,Math.round(config.wingBays*.375)/config.wingBays,Math.round(config.wingBays*.625)/config.wingBays,.985])pier(length*u,.28,.4,h-.38,tint(wall,.92));
  }else{
    for(const u of [.018,.982])pier(length*u,.22,f+.2,h-.36);
    if(corner){
      // The photographed south end has a raised shield; the hidden return is
      // intentionally undecorated. The mapped chamfer is kept as its own face.
      const x=length/2,w=length*.58;
      layer(.17,()=>{c.fillStyle=wall;c.strokeStyle=trim;c.lineWidth=.1;c.fillRect(x-w/2,-h-1.6,w,1.6);c.strokeRect(x-w/2,-h-1.6,w,1.6);});
      pediment(x,w+.22,h+1.6,.46,false);
      if(config.details.ornament)floralPanel(x,h+.35,w*.62,.86);
    }
  }
  if(config.details.parapet)rail(.16,length-.16,h+.06,.04,.55);
  layer(.24,()=>{c.strokeStyle=tint(roof,.85);c.lineWidth=.075;c.beginPath();for(const u of [.035,length-.035]){c.moveTo(u,-h);c.lineTo(u,-.25);}c.stroke();});
  if(!corner)addressPlate(length*.97);
  return true;
}

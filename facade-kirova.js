// Northern end: original elevations from dated Commons references in facades.json.
import {kirovaBays} from './facade-model.js';
import {tint} from './art.js';

export function drawKirovaFacade(c,p,length,config,role='front'){
  if(!['ochre-archway','cinema-pinnacles','grand-hotel','brick-drum'].includes(config.template))return false;
  const {layer,quad,window,balcony,rail,addressPlate,shutter}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=2*f;
  const cinema=config.template==='cinema-pinnacles',ochre=config.template==='ochre-archway',grand=config.template==='grand-hotel',brick=cinema||config.template==='brick-drum';
  const corner=role.startsWith('corner'),side=role==='return',mould=brick?tint(wall,1.18):trim;
  const band=(z,thick=.12,color=mould)=>layer(.14,()=>{c.fillStyle=color;c.fillRect(0,-z,length,thick);});
  function panel(x,z,w,hh){layer(.15,()=>{c.fillStyle=mould;c.fillRect(x-w/2,-z-hh,w,hh);c.fillStyle=wall;c.fillRect(x-w/2+.07,-z-hh+.06,Math.max(.02,w-.14),Math.max(.02,hh-.12));});}
  function pier(u,w){layer(.19,()=>{const x=u*length;c.fillStyle=mould;c.fillRect(x-w/2,-h,w,h-.45);for(let z=.5;z<h;z+=.52){c.fillStyle=brick?tint(wall,.83):accent;c.fillRect(x-w/2,-z,w,.035);}for(const z of [h-.1,h-.3,f+.2,f]){c.fillStyle=mould;c.fillRect(x-w*.7,-z,w*1.4,.12);}});}
  function ornateBalcony(u,span,z=f+.1){
    if(!config.details.balconies)return;
    const x=u*length,w=span*length;balcony(x,w,z,false);
    if(config.details.ornament)layer(1.01,()=>{c.strokeStyle='#485149';c.lineWidth=.025;for(let xx=x-w/2+.2;xx<x+w/2;xx+=.3){c.beginPath();c.ellipse(xx,-z-.45,.12,.27,0,0,Math.PI*2);c.stroke();}});
  }
  function steps(x,w){for(let n=2;n>=0;n--){const d=.26+n*.22,z=.22-n*.05;quad([[x-w/2,z,0],[x+w/2,z,0],[x+w/2,z,d],[x-w/2,z,d]],tint(trim,.8+n*.04));}}
  layer(.02,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);c.fillStyle='#818578';c.fillRect(0,-.42,length,.42);});
  if(config.details.rustication)layer(.035,()=>{
    c.strokeStyle=tint(wall,brick?.77:.85);c.lineWidth=brick?.022:.04;c.beginPath();
    for(let i=0,z=.48;z<h;z+=brick?.14:.48,i++){
      if(!brick&&z>f)continue;c.moveTo(0,-z);c.lineTo(length,-z);
      for(let x=(i%2)*.23;x<length;x+=brick?.46:1.15){c.moveTo(x,-z);c.lineTo(x,-z+(brick?.14:.48));}
    }c.stroke();
  });
  for(const [z,t] of [[f,.22],[f+.3,.12],[h,.2],[h-.23,.12],[h-.58,.1]])band(z,t);
  band(h+.06,.07,roof);
  const bays=kirovaBays(config,role),wh=f-1.25;
  for(const b of bays){
    const x=b.u*length,w=Math.min(b.width*length,wh*1.6),bottom=f+.5,shape=b.arch?'arch':config.windowShape;
    window(x,bottom,w,wh,shape,false,false,{mullion:trim,thin:brick});
    if(config.details.ornament){
      panel(x,f+.08,w+.22,.27);
      layer(.16,()=>{
        c.fillStyle=mould;c.fillRect(x-w/2-.17,-h+.63,w+.34,.12);
        if(brick){c.strokeStyle=mould;c.lineWidth=.12;c.beginPath();c.moveTo(x-w/2-.2,-bottom-wh+.12);c.quadraticCurveTo(x,-bottom-wh-.45,x+w/2+.2,-bottom-wh+.12);c.stroke();}
        else if(ochre&&b.index%3===1){c.strokeStyle=trim;c.lineWidth=.16;c.beginPath();c.moveTo(x-w/2-.15,-bottom-wh-.25);c.lineTo(x-.3,-bottom-wh-.25);c.quadraticCurveTo(x,-bottom-wh-.7,x+.3,-bottom-wh-.25);c.lineTo(x+w/2+.15,-bottom-wh-.25);c.stroke();}
        else {c.fillRect(x-w/2-.23,-bottom-wh-.25,w+.46,.13);c.fillRect(x-w/2-.1,-bottom+.03,.14,.28);c.fillRect(x+w/2-.04,-bottom+.03,.14,.28);}
      });
    }
  }
  // Shop and passage openings stay independent from the editable upper window count.
  const lower=kirovaBays({...config,wingBays:ochre?10:cinema?10:grand?12:9},role);
  for(const b of lower){
    const x=b.u*length,w=Math.min(b.width*length*(brick?1.24:1.08),3.6),door=corner||b.index%4===1;
    if(ochre&&!side&&!corner&&b.u>.43&&b.u<.7)continue;
    if(config.details.shutters&&b.index===2)shutter(x,.45,w,f-1.0,false);
    else window(x,door?.16:.65,w,door?f-.65:f-1.15,'rect',door,false,{thin:brick,mullion:trim});
    if(door)steps(x,w*1.1);
  }
  if(ochre){
    for(const u of [.02,.34,.79,.98])pier(u,.45);
    const x=length*.58,w=length*.13;
    window(x,.1,w,f-.45,'segmental',true,false,{mullion:accent});
    layer(.13,()=>{c.fillStyle='#283c35';c.fillRect(x-w*.42,-f+.9,w*.84,f-.98);c.strokeStyle='#596958';c.lineWidth=.06;for(let u=x-w*.35;u<x+w*.4;u+=.25){c.beginPath();c.moveTo(u,-.12);c.lineTo(u,-f+1);c.stroke();}});
    ornateBalcony(.58,.19);
    if(config.details.awnings){const top=h-.1;quad([[x-w*.85,top,0],[x+w*.85,top,0],[x+w*.85,top-.2,1.6],[x-w*.85,top-.2,1.6]],roof,accent,.07);for(const sign of [-1,1])quad([[x+sign*w*.8,f+.95,1.25],[x+sign*w*.8,top-.2,1.6]],null,accent,.06);}
  }else if(cinema){
    for(const u of [.02,.39,.61,.98])pier(u,.32);
    ornateBalcony(.5,.28);
    if(config.details.balconies)for(const u of [.365,.635]){
      const x=length*u;quad([[x,.15,1.4],[x,f,1.4]],null,trim,.14);
      for(const z of [.18,.5,f-.1])quad([[x-.15,z,1.4],[x+.15,z,1.4]],null,trim,.13);
    }
  }else if(grand){
    for(const u of corner?[.08,.92]:[.015,.48,.58,.985])pier(u,.3);
    if(corner)ornateBalcony(.5,.94);else for(const u of side?[.25,.53]:[.53])ornateBalcony(u,side?.13:.16);
    if(config.details.ornament)for(const b of bays){panel(b.u*length,h-.46,Math.min(b.width*length+.25,3),.23);}
  }else{
    for(const u of corner?[.08,.92]:[.015,.3,.65,.985])pier(u,.3);
    if(corner)ornateBalcony(.5,.94);else for(const u of side?[.35]:[.17,.62,.93])ornateBalcony(u,u===.93?.16:.13);
  }
  if(config.details.ornament)layer(.18,()=>{c.fillStyle=mould;for(let x=.12;x<length;x+=.27)c.fillRect(x,-h+.2,.1,.2);});
  if(config.details.parapet)rail(.2,length-.2,h+.08,.04,.55);
  drawKirovaRoof(c,p.q,length,config,role);
  if(role==='front')addressPlate(length*.08);
  return true;
}

export function drawKirovaRoof(c,q,length,config,role='front'){
  if(!['cinema-pinnacles','grand-hotel','brick-drum'].includes(config.template))return;
  const {wall,trim,accent,roof}=config.colors,h=config.floorHeight*2,grand=config.template==='grand-hotel';
  function layer(off,draw){const o=q(0,0,off),x=q(1,0,off),y=q(0,-1,off);c.save();c.transform(x.x-o.x,x.y-o.y,y.x-o.x,y.y-o.y,o.x,o.y);draw();c.restore();}
  function attic(u,span,rise,spire=false){
    const x=u*length,w=span*length;
    layer(.12,()=>{
      c.beginPath();c.moveTo(x-w/2,-h+.1);c.lineTo(x-w/2,-h-.3);c.lineTo(x-w*.34,-h-.5);c.lineTo(x-w*.34,-h-rise*.65);c.quadraticCurveTo(x-w*.12,-h-rise*.78,x,-h-rise);c.quadraticCurveTo(x+w*.12,-h-rise*.78,x+w*.34,-h-rise*.65);c.lineTo(x+w*.34,-h-.5);c.lineTo(x+w/2,-h-.3);c.lineTo(x+w/2,-h+.1);c.closePath();c.fillStyle=wall;c.fill();c.strokeStyle=grand?trim:tint(wall,1.22);c.lineWidth=.15;c.stroke();
      if(config.details.ornament){c.strokeStyle=grand?accent:tint(wall,.8);c.lineWidth=.06;c.strokeRect(x-w*.23,-h-.75,w*.46,.45);c.beginPath();c.ellipse(x,-h-rise*.69,Math.min(w*.17,.34),rise*.14,0,0,Math.PI*2);c.stroke();}
      if(spire&&config.details.turret){c.fillStyle=roof;c.beginPath();c.moveTo(x-.22,-h-rise+.05);c.lineTo(x,-h-rise-.9);c.lineTo(x+.22,-h-rise+.05);c.fill();c.strokeStyle=trim;c.lineWidth=.045;c.stroke();}
    });
  }
  if(config.template==='cinema-pinnacles'&&role==='front'){
    for(const [u,span,rise] of [[.035,.12,2.8],[.34,.11,2.2],[.5,.17,4.25],[.66,.11,2.2],[.965,.12,2.8]])attic(u,span,rise,true);
  }else if(grand){
    for(const u of role.startsWith('corner')?[.5]:role==='return'?[.25,.53,.97]:[.035,.53,.97])attic(u,role.startsWith('corner')?.95:.13,1.18);
  }else if(config.template==='brick-drum'&&role==='front'&&config.details.turret){
    // The photographed rounded corner has an oculus below a two-window attic drum.
    const x=length*.925,w=Math.min(length*.22,6);
    // A shallow polygonal drum gives the attic visible depth instead of a flat sign.
    const ring=[[x-w/2,-.28],[x-w*.38,-1.8],[x+w*.38,-1.8],[x+w/2,-.28]];
    const poly=(vertices,fill)=>{c.beginPath();vertices.forEach(([u,z,d],i)=>{const v=q(u,z,d);i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y);});c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=tint(wall,1.23);c.lineWidth=.1;c.stroke();};
    for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1];poly([[a[0],h,a[1]],[b[0],h,b[1]],[b[0],h+3.7,b[1]],[a[0],h+3.7,a[1]]],tint(wall,.83+i*.06));}
    poly(ring.map(([u,d])=>[u,h+3.7,d]),roof);
    layer(-.28,()=>{
      c.beginPath();c.moveTo(x-w/2,-h+.15);c.lineTo(x-w/2,-h-3.7);c.quadraticCurveTo(x,-h-4.35,x+w/2,-h-3.7);c.lineTo(x+w/2,-h+.15);c.closePath();c.fillStyle=wall;c.fill();c.strokeStyle=tint(wall,1.23);c.lineWidth=.13;c.stroke();
      c.beginPath();c.moveTo(x-w/2,-h-3.7);c.quadraticCurveTo(x,-h-4.35,x+w/2,-h-3.7);c.stroke();
      c.fillStyle=accent;c.beginPath();c.arc(x,-h-.85,.48,0,Math.PI*2);c.fill();c.strokeStyle=trim;c.lineWidth=.15;c.stroke();
      for(const sign of [-1,1]){const xx=x+sign*w*.24,ww=w*.34,base=-h-2,top=base-1.4;c.beginPath();c.moveTo(xx-ww/2,base);c.lineTo(xx-ww/2,top+.55);c.quadraticCurveTo(xx,top-.45,xx+ww/2,top+.55);c.lineTo(xx+ww/2,base);c.closePath();c.fillStyle='#718887';c.fill();c.strokeStyle=trim;c.lineWidth=.12;c.stroke();c.beginPath();c.moveTo(xx,base);c.lineTo(xx,top+.2);c.stroke();}
      c.fillStyle=tint(wall,1.15);c.fillRect(x-w*.55,-h-1.65,w*1.1,.18);
    });
  }
}

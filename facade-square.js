// Original Canvas elevations, informed by the dated references in facades.json.
// No photographic textures. The assembly is a labelled restored interpretation.
import {tint} from './art.js';
import {OFFICERS_FRONT_SHARE} from './facade-model.js';

function plane(c,q,off,draw){
  const o=q(0,0,off),x=q(1,0,off),y=q(0,-1,off);
  c.save();c.transform(x.x-o.x,x.y-o.y,y.x-o.x,y.y-o.y,o.x,o.y);draw();c.restore();
}

// Roof silhouettes are also drawn before the body when the main face is hidden.
export function drawSquareRoof(c,q,length,config,role='front'){
  if(role!=='front'||!['theatre-clock','officers-assembly'].includes(config.template))return;
  const theatre=config.template==='theatre-clock',f=config.floorHeight,h=(theatre?2.72:3)*f;
  const {wall,trim,accent,roof}=config.colors;
  plane(c,q,.16,()=>{
    function crown(u,span,rise,curved){
      const x=u*length,w=span*length;
      c.beginPath();c.moveTo(x-w/2,-h+.1);c.lineTo(x-w/2,-h-.16);
      if(curved)c.quadraticCurveTo(x,-h-rise*1.7,x+w/2,-h-.16);
      else{c.lineTo(x-w*.25,-h-.16);c.lineTo(x,-h-rise);c.lineTo(x+w*.25,-h-.16);c.lineTo(x+w/2,-h-.16);}
      c.lineTo(x+w/2,-h+.1);c.closePath();c.fillStyle=wall;c.fill();c.strokeStyle=trim;c.lineWidth=.16;c.stroke();
      c.beginPath();c.moveTo(x-w/2,-h-.13);
      if(curved)c.quadraticCurveTo(x,-h-rise*1.7,x+w/2,-h-.13);
      else{c.lineTo(x-w*.25,-h-.13);c.lineTo(x,-h-rise);c.lineTo(x+w*.25,-h-.13);c.lineTo(x+w/2,-h-.13);}
      c.strokeStyle=roof;c.lineWidth=.07;c.stroke();
    }
    if(theatre){
      crown(.5,.4,1.55,true);crown(.2,.18,.78,false);crown(.8,.18,.78,false);
      if(config.details.ornament)for(const u of [.2,.8]){
        const x=u*length,z=h+1.02;
        c.fillStyle=trim;c.fillRect(x-.18,-z,.36,.42);c.fillRect(x-.32,-z,.64,.14);c.strokeStyle=accent;c.lineWidth=.13;
        c.beginPath();c.moveTo(x-.3,-z-1.05);c.bezierCurveTo(x-.65,-z-.1,x+.65,-z-.1,x+.3,-z-1.05);c.stroke();
        c.beginPath();c.moveTo(x-.31,-z-.86);c.lineTo(x+.31,-z-.86);c.stroke();
        c.lineWidth=.035;for(const d of [-.13,0,.13]){c.beginPath();c.moveTo(x+d,-z-.85);c.lineTo(x+d,-z-.26);c.stroke();}
      }
    }else if(config.details.parapet){
      c.fillStyle=wall;c.fillRect(0,-h-.3,length,.35);
      for(const [u,w,r] of [[.12,.18,.72],[.5,.26,.95],[.88,.18,.72]])crown(u,w,r,false);
      if(config.details.ornament){c.strokeStyle=accent;c.lineWidth=.07;for(const u of [.12,.5,.88])c.strokeRect(u*length-1.2,-h-.3,2.4,.25);}
    }
  });
}

export function drawSquareFacade(c,p,length,config,role='front'){
  if(!['theatre-clock','officers-assembly'].includes(config.template))return false;
  const {layer,quad,window,balcony}=p,{wall,trim,accent,roof}=config.colors,f=config.floorHeight;
  const theatre=config.template==='theatre-clock',front=role==='front',h=(theatre?2.72:3)*f;
  const band=(a,b,z,t=.12,color=trim)=>layer(.14,()=>{c.fillStyle=color;c.fillRect(a,-z,b-a,t);});
  function body(a,b,z,color=wall){layer(.015,()=>{c.fillStyle=color;c.fillRect(a,-z,b-a,z);c.fillStyle='#91958a';c.fillRect(a,-.42,b-a,.42);});}
  function pier(x,z,w=.4){layer(.19,()=>{
    c.fillStyle=trim;c.fillRect(x-w/2,-z,w,z-.42);
    c.fillStyle=tint(trim,.86);c.fillRect(x+w*.27,-z,w*.23,z-.42);
    for(const [top,thick] of [[z,.17],[!theatre&&front?.86*f:f,.18],[.55,.17]]){c.fillStyle=trim;c.fillRect(x-w*.8,-top,w*1.6,thick);}
  });}
  function joints(a,b,z,brick=false){if(!config.details.rustication)return;layer(.04,()=>{
    c.strokeStyle=tint(wall,brick?.77:.85);c.lineWidth=brick?.022:.035;c.beginPath();
    const step=brick?.16:.45;
    for(let n=0,y=.5;y<z;y+=step,n++){
      c.moveTo(a,-y);c.lineTo(b,-y);
      if(brick)for(let x=a+(n%2)*.25;x<b;x+=.5){c.moveTo(x,-y);c.lineTo(x,-y+step);}
    }c.stroke();
  });}
  function plaque(x,z,text){layer(.18,()=>{c.fillStyle='#66594f';c.fillRect(x-.4,-z,.8,.9);c.fillStyle=trim;c.font='.14px Arial';c.textAlign='center';c.fillText(text,x,-z+.25);for(let y=.4;y<.75;y+=.12)c.fillRect(x-.25,-z+y,.5,.025);});}
  function stairs(x,w){for(let n=2;n>=0;n--){const d=.3+n*.23,z=.24-n*.06;quad([[x-w/2,z,0],[x+w/2,z,0],[x+w/2,z,d],[x-w/2,z,d]],tint(trim,.76+n*.05));}}

  if(theatre&&front){
    // Two low lateral wings; three window tiers belong only to the raised centre.
    body(0,length*.12,2*f);body(length*.12,length*.88,h,accent);body(length*.88,length,2*f);
    body(length*.28,length*.72,2.1*f,wall);
    for(const [a,b] of [[0,.12],[.88,1]]){
      const x=(a+b)*length/2;
      joints(a*length,b*length,2*f);
      window(x,.7,Math.min(1.25,length*.055),f-1.3,'rect');
      window(x,f+.65,Math.min(1.25,length*.055),f-1.4,config.windowShape);
      band(a*length,b*length,2*f,.2);band(a*length,b*length,f,.18);
    }
    for(const u of [.2,.8]){
      const x=u*length,w=Math.min(length*.08,2.2)*config.windowWidth/.6;
      window(x,.7,w*.8,f-1.35,'segmental');
      window(x,f+.65,w,f-.9,config.windowShape);
      window(x,2.2*f,w*.84,.43*f,config.windowShape);
      if(config.details.ornament)layer(.17,()=>{
        c.fillStyle=trim;c.fillRect(x-w*.68,-2.04*f,w*1.36,.16);
        c.fillRect(x-w*.59,-2.04*f,w*.18,.35);c.fillRect(x+w*.41,-2.04*f,w*.18,.35);
        c.fillRect(x-w*.32,-2.04*f-.28,w*.64,.32);
      });
    }
    // Three photographed entrance doors stay fixed when editing the upper rhythm.
    for(const u of [.36,.5,.64]){
      const x=u*length,w=Math.min(length*.085,2.25);
      window(x,.18,w,f-.75,'rect',true);
      // Clipped upper corners on the theatre entrance surrounds.
      layer(.15,()=>{c.strokeStyle=accent;c.lineWidth=.16;c.beginPath();c.moveTo(x-w/2-.12,-f+.93);c.lineTo(x-w*.3,-f+.62);c.lineTo(x+w*.3,-f+.62);c.lineTo(x+w/2+.12,-f+.93);c.stroke();});
      stairs(x,w*1.15);
    }
    for(let i=0;i<config.wingBays;i++){
      const bay=length*.42/config.wingBays,x=length*.29+(i+.5)*bay,w=Math.min(2.15,bay*config.windowWidth);
      window(x,f+.56,w,f-.85,config.windowShape);
      if(config.details.ornament)layer(.17,()=>{c.fillStyle=trim;c.fillRect(x-w*.65,-2.04*f,w*1.3,.32);c.fillRect(x-w*.23,-2.04*f-.14,w*.46,.43);});
    }
    for(const u of [.12,.28,.72,.88])pier(u*length,h,.42);
    for(const u of [.425,.575])pier(u*length,2.08*f,.24);
    band(length*.12,length*.88,f,.22);band(length*.28,length*.72,2.1*f,.24);
    band(length*.12,length*.88,h,.19);
    if(config.details.balconies){
      balcony(length*.5,length*.45,f+.16,false);
      layer(1.01,()=>{c.strokeStyle='#4b5652';c.lineWidth=.026;for(let x=length*.285;x<length*.72;x+=.5){c.beginPath();c.ellipse(x,-f-.68,.2,.25,0,0,Math.PI*2);c.stroke();}});
    }
    // Arched clerestory and clock are not a fourth floor.
    for(const u of [.395,.605])window(u*length,2.2*f,length*.082,.47*f,'rect');
    drawSquareRoof(c,p.q,length,config,role);
    if(config.details.ornament)layer(.21,()=>{
      const x=length*.5,z=2.47*f,r=.72;
      c.fillStyle=trim;c.fillRect(x-.9,-z-.9,1.8,1.8);c.fillStyle='#edf0df';c.beginPath();c.arc(x,-z,r,0,Math.PI*2);c.fill();
      c.strokeStyle='#4e5f5b';c.lineWidth=.06;c.stroke();c.lineWidth=.035;
      for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(x+Math.sin(a)*r*.78,-z-Math.cos(a)*r*.78);c.lineTo(x+Math.sin(a)*r*.94,-z-Math.cos(a)*r*.94);c.stroke();}
      c.lineWidth=.075;c.beginPath();c.moveTo(x-.25,-z-.28);c.lineTo(x,-z);c.lineTo(x+.13,-z-.48);c.stroke();
    });
    layer(.2,()=>{c.fillStyle=trim;c.font='bold .38px Georgia';c.textAlign='center';c.fillText('РУССКИЙ ТЕАТР',length*.5,-2.08*f+.46,length*.41);});
    plaque(length*.315,3.1,'АФИША');plaque(length*.685,3.1,'АФИША');
  }else if(theatre){
    // Long southern return: two tiers. Details behind the front are approximate.
    const top=2*f;body(0,length,top);joints(0,length,top);
    const count=role==='stage'?4:config.wingBays+3;
    for(let i=0;i<count;i++){
      const x=(i+.5)*length/count,w=Math.min(1.55,length/count*config.windowWidth);
      window(x,.7,w,f-1.3,'rect');window(x,f+.7,w,f-1.4,config.windowShape);
    }
    band(0,length,f,.18);band(0,length,top,.2);
  }else if(front){
    body(0,length,h);joints(0,length,f);
    const count=config.wingBays,bay=length/count,lower=.86*f,topBase=2.06*f;
    for(let i=0;i<count;i++){
      const x=(i+.5)*bay,w=Math.min(1.9,bay*config.windowWidth),entry=i===Math.floor(count/2)||i===Math.floor(count/2)-1;
      window(x,entry?.18:.65,w,entry?lower-.65:lower-1.3,'rect',entry);
      window(x,lower+.5,w,1.2*f-1.05,config.windowShape);
      window(x,topBase+.45,w*.88,.94*f-1,config.windowShape);
      if(config.details.ornament){
        band(x-w*.65,x+w*.65,topBase+.16,.15);
        band(x-w*.62,x+w*.62,topBase-.35,.13);
        layer(.16,()=>{c.strokeStyle=trim;c.lineWidth=.09;c.strokeRect(x-w*.55,-lower+.05,w*1.1,.35);});
      }
    }
    for(const u of [.02,.37,.63,.98])pier(u*length,h,.42);
    for(const z of [lower,topBase,h-.25,h])band(0,length,z,z===h?.23:.14);
    if(config.details.balconies){
      balcony(length*.5,length*.29,lower+.12,false);
      layer(1.01,()=>{c.strokeStyle='#47554f';c.lineWidth=.035;for(let x=length*.36;x<length*.64;x+=.65){c.beginPath();c.moveTo(x,-lower-.2);c.lineTo(x+.55,-lower-1);c.moveTo(x,-lower-1);c.lineTo(x+.55,-lower-.2);c.stroke();}});
    }
    stairs(length*.5,length*.26);drawSquareRoof(c,p.q,length,config,role);
    plaque(length*.35,2.8,'1');
  }else{
    const cut=length*(1-OFFICERS_FRONT_SHARE),top=2.5*f;
    // Tall second-floor hall windows, not three repeated storeys along the wing.
    body(0,cut,top);body(cut,length,h);joints(0,cut,top,true);joints(cut,length,f);
    const count=config.wingBays+4,bay=cut/count;
    for(let i=0;i<count;i++){
      const x=(i+.5)*bay,w=Math.min(2,bay*config.windowWidth);
      window(x,.65,w,f-1.3,'segmental');window(x,f+.5,w,1.5*f-1.1,'segmental');
      if(config.details.ornament)layer(.17,()=>{
        c.strokeStyle=trim;c.lineWidth=.1;c.strokeRect(x-w*.62,-top+.35,w*1.24,1.5*f-.8);
        c.beginPath();c.arc(x,-top+.27,.13,Math.PI,2*Math.PI);c.stroke();
      });
      if(i%3===0)pier(Math.max(.25,i*bay),top,.3);
    }
    for(let i=0;i<3;i++)for(const [bottom,hh] of [[.6,.86*f-1.2],[.86*f+.5,1.2*f-1.05],[2.06*f+.45,.94*f-1]]){
      const x=cut+(i+.5)*(length-cut)/3;window(x,bottom,Math.min(1.65,(length-cut)/3*config.windowWidth),hh,config.windowShape);
    }
    for(const z of [f,top])band(0,cut,z,.18);
    for(const z of [.86*f,2.06*f,h])band(cut,length,z,.18);
    pier(cut,h,.42);
  }
  return true;
}

// Additional compositions use the same window, railing and projection modules.
// Photos inform proportions; no image textures or third-party drawing code.
import {tint} from './art.js';
import {glazedBays} from './facade-model.js';

export function drawLandmarkFacade(c,p,length,config){
  if(!['glazed-bays','corner-turret'].includes(config.template))return false;
  const {layer,quad,window,rail,balcony,medallion,shutter,pediment,addressPlate}=p;
  const {wall,trim,accent}=config.colors,f=config.floorHeight,h=2*f+(config.template==='glazed-bays'?.9:0);
  function band(z,t,color=trim){layer(.08,()=>{c.fillStyle=color;c.fillRect(-.05,-z,length+.1,t);});}
  function line(points,color,width=.055){c.beginPath();points.forEach(([u,z,d=0],i)=>{const v=p.q(u,z,d);i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y);});c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function pilaster(x,wide=.38){
    layer(.14,()=>{c.fillStyle=trim;c.fillRect(x-wide/2,-h,wide,h-.4);c.fillRect(x-wide*.85,-h+.14,wide*1.7,.3);c.fillRect(x-wide*.7,-f-.05,wide*1.4,.28);
      if(config.details.rustication)for(let z=.65;z<f-.2;z+=.43){c.fillStyle=accent;c.fillRect(x-wide/2,-z,wide,.045);}});
  }
  function swag(x0,x1,z,drop){
    layer(.2,()=>{c.strokeStyle=accent;c.lineWidth=.11;c.beginPath();c.moveTo(x0,-z);c.quadraticCurveTo((x0+x1)/2,-z+drop*2,x1,-z);c.stroke();
      for(let t=0;t<=1;t+=.07){const x=x0+(x1-x0)*t,y=-z+4*drop*t*(1-t);c.fillStyle=trim;c.beginPath();c.ellipse(x,y,.085,.13,-.55,0,Math.PI*2);c.fill();}});
    medallion(x0,z,.16);medallion(x1,z,.16);
  }
  function metalCanopy(x,w,z){
    const profile=[[0,z+.15],[.22,z+.42],[.65,z+.34],[.9,z]],metal='#7e9198';
    for(let j=1;j<profile.length;j++){
      const [d0,z0]=profile[j-1],[d1,z1]=profile[j];
      quad([[x-w/2,z0,d0],[x+w/2,z0,d0],[x+w/2,z1,d1],[x-w/2,z1,d1]],tint(metal,1.12-j*.1));
      for(let u=x-w/2+.1;u<x+w/2;u+=.32)line([[u,z0,d0],[u,z1,d1]],'#c0cbd0',.035);
    }
    line([[x-w/2,z,.9],[x+w/2,z,.9]],'#4f6570',.08);
  }
  function glazing(x,w,bottom,height,columns,off){
    // Window width changes the glazing within a fixed structural opening.
    const inner=w*(.65+config.windowWidth*.4);
    layer(off,()=>{c.fillStyle='#71868a';c.fillRect(x-w/2,-bottom-height,w,height);c.fillStyle='#416367';c.fillRect(x-inner/2,-bottom-height+.1,inner,height-.2);
      c.fillStyle='#91aaa2';c.globalAlpha=.45;c.fillRect(x-inner/2+.1,-bottom-height+.18,inner*.27,height-.4);c.globalAlpha=1;
      c.strokeStyle='#c6d0c7';c.lineWidth=.07;c.strokeRect(x-inner/2,-bottom-height+.1,inner,height-.2);c.beginPath();
      for(let n=1;n<columns;n++){const u=x-inner/2+inner*n/columns;c.moveTo(u,-bottom);c.lineTo(u,-bottom-height);}
      const transom=bottom+height*.8;c.moveTo(x-inner/2,-transom);c.lineTo(x+inner/2,-transom);
      for(let n=0;n<columns;n++){const u=x-inner/2+inner*(n+.5)/columns;c.moveTo(u,-transom);c.lineTo(u,-bottom-height);}c.stroke();});
  }
  layer(.025,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);c.fillStyle='#969e90';c.fillRect(0,-.5,length,.5);
    if(config.details.rustication){c.fillStyle=trim;for(let z=.7;z<f;z+=.44)c.fillRect(0,-z,length,.055);}});

  if(config.template==='glazed-bays'){
    // Stepped attic with three garlands, separate from the metal bay roofs.
    const outline=[[0,h],[length*.12,h],[length*.12,h+.12],[length*.36,h+1.05],[length*.36,h+1.4],
      [length*.41,h+1.4],[length*.41,h+1.8],[length*.59,h+1.8],[length*.59,h+1.4],
      [length*.64,h+1.4],[length*.64,h+1.05],[length*.88,h+.12],[length,h+.12],[length,h],[0,h]];
    quad(outline,wall,accent,.08);line(outline.slice(1,-2),trim,.13);
    for(const x of [length*.12,length*.88])pilaster(x,.55);
    for(const end of [0,1]){
      const a=end?length*.89:0,b=end?length:length*.11;
      layer(.13,()=>{c.fillStyle=trim;c.fillRect(a,-h-.24,b-a,.25);for(let x=a+.2;x<b;x+=.35)c.fillRect(x,-h+.05,.11,.2);});
    }
    for(const bay of glazedBays(config)){
      const x=bay.u*length,w=bay.width*length;
      if(bay.end){
        window(x,f+.4,w*.63,f-.95,config.windowShape);window(x,.4,w*.7,f-.85,'rect',true);
        if(config.details.ornament){medallion(x,h-.7,.25);swag(x-w*.38,x+w*.38,h-.35,.22);}
      }else{
        glazing(x,w,f+.3,f-.8,bay.columns,.45);
        if(bay.entrance&&config.details.shutters)shutter(x,.13,w*.86,f-.45,false);
        else glazing(x,w*.98,.4,f-.7,bay.entrance?2:bay.columns,.08);
        metalCanopy(x,w+.18,2*f-.5);
        if(bay.entrance)metalCanopy(x,w+.45,f-.03);
        else {quad([[x-w/2,f+.3,.5],[x+w/2,f+.3,.5],[x+w/2,f-.25,.5],[x-w/2,f-.25,.5]],'#829397');rail(x-w/2,x+w/2,f+.3,.55,.65);}
      }
    }
    if(config.details.ornament){
      swag(length*.365,length*.435,h+1.03,.37);swag(length*.435,length*.565,h+1.36,.65);swag(length*.565,length*.635,h+1.03,.37);
      layer(.2,()=>{const x=length*.5;c.strokeStyle=accent;c.lineWidth=.09;c.beginPath();c.ellipse(x,-h-1.12,.66,.38,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x-.43,-h-1.1);c.lineTo(x,-h-1.35);c.lineTo(x+.43,-h-1.1);c.lineTo(x,-h-.86);c.closePath();c.stroke();});
    }
    if(config.details.parapet)rail(.2,length-.2,h+.15,.03,.55);
    addressPlate(length*.885);
  }else{
    const a=3.3,b=length-.5,bay=(b-a)/config.wingBays,middle=Math.floor(config.wingBays/2),centre=a+(middle+.5)*bay;
    for(const [z,t] of [[f,.24],[f+.32,.12],[h,.22],[h-.28,.14],[h-1,.12]])band(z,t);
    for(let n=0;n<config.wingBays;n++){
      const x=a+(n+.5)*bay,ww=Math.min(bay*config.windowWidth,2.6),bottom=f+.4,wh=f-1.45;
      const central=Math.abs(n-middle)<=1;
      if(config.details.ornament){
        layer(.16,()=>{c.fillStyle=trim;c.fillRect(x-ww/2-.2,-bottom-wh-.15,ww+.4,.12);c.strokeStyle=trim;c.lineWidth=.1;c.beginPath();c.moveTo(x-ww/2-.24,-bottom-wh-.2);c.quadraticCurveTo(x,-bottom-wh-(central?.75:.45),x+ww/2+.24,-bottom-wh-.2);c.stroke();});
        if(!central)medallion(x,bottom+wh+.22,.2);
      }
      window(x,bottom,ww,wh,config.windowShape);
      window(x,n===middle?.16:.65,Math.min(bay*.76,3.4),n===middle?f-.65:f-1.15,'rect',n===middle);
      if(config.details.ornament){
        layer(.14,()=>{c.strokeStyle=trim;c.lineWidth=.07;c.strokeRect(x-ww/2-.13,-f-.32,ww+.26,.26);});
        for(const u of [x-bay*.48,x+bay*.48])pilaster(u,.23);
      }
    }
    if(config.details.ornament){
      layer(.15,()=>{c.fillStyle=trim;for(let x=a;x<b;x+=.24)c.fillRect(x,-h+.3,.09,.21);
        const w=Math.min((b-a)*.53,15);c.fillRect(centre-w/2,-h-1.05,w,1.05);c.fillStyle=wall;
        for(let x=centre-w/2+.4;x<centre+w/2-.2;x+=.48){c.beginPath();c.roundRect(x,-h-.85,.26,.6,[.13,.13,0,0]);c.fill();}
      });
      quad([[centre-.6,h],[centre-.6,h+1.55],[centre+.6,h+1.55],[centre+.6,h]],trim,accent);
      window(centre,h+.25,.62,1,'arch');pediment(centre,1.65,h+1.5,.45,false);
    }
    if(config.details.balconies)balcony(centre,Math.min(bay*1.45,5),f+.35,false);
    if(config.details.parapet)rail(a,b,h+.16,.05,.65);
    window(1.2,.14,1.3,f-.7,'rect',true);addressPlate(2.5);
    if(config.details.turret)drawCornerTurret(c,p.q,config);
  }
  return true;
}

export function drawCornerTurret(c,q,config){
  const f=config.floorHeight,h=2*f,u0=1.2,r=1.65,segments=24;
  const surface=(u,z,d)=>q(u0+u,z,d);
  const poly=(points,color,stroke)=>{c.beginPath();points.forEach(([u,z,d],i)=>{const p=surface(u,z,d);i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y);});c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.025;c.stroke();}};
  const ring=(radius,z,t)=>[Math.sin(t)*radius,z,Math.cos(t)*radius];
  const faces=Array.from({length:segments},(_,i)=>({a:i*2*Math.PI/segments,b:(i+1)*2*Math.PI/segments}));
  faces.sort((a,b)=>surface(...ring(r,0,(a.a+a.b)/2)).y-surface(...ring(r,0,(b.a+b.b)/2)).y);
  function shell(z0,z1,r0,r1,color,seams=false){
    for(const face of faces){const t=(face.a+face.b)/2,shade=.91+.1*Math.cos(t+.7);poly([ring(r0,z0,face.a),ring(r0,z0,face.b),ring(r1,z1,face.b),ring(r1,z1,face.a)],tint(color,shade),seams?'#7a8984':null);}
  }
  shell(f+.22,h+1,r,r,config.colors.wall);
  const origin=surface(0,0,0);
  for(const t of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    if(surface(Math.sin(t),0,Math.cos(t)).y<=origin.y)continue;
    const tangent=(s,z,d)=>[Math.sin(t)*(r+d)+Math.cos(t)*s,z,Math.cos(t)*(r+d)-Math.sin(t)*s];
    const bottom=f+.95,top=h-.45;
    poly([tangent(-.52,bottom-.1,.02),tangent(.52,bottom-.1,.02),tangent(.52,top+.14,.02),tangent(-.52,top+.14,.02)],config.colors.trim);
    poly([tangent(-.4,bottom,.04),tangent(.4,bottom,.04),tangent(.4,top,.04),tangent(-.4,top,.04)],'#42656a');
    poly([tangent(-.4,top-.6,.05),tangent(.4,top-.6,.05),tangent(.4,top-.66,.05),tangent(-.4,top-.66,.05)],config.colors.trim);
  }
  shell(f+.16,f+.3,r+.18,r+.18,config.colors.trim);
  shell(h+.85,h+1.03,r+.12,r+.12,config.colors.trim);
  shell(h+1.03,h+1.23,r+.25,r+.25,config.colors.trim);
  // Two bulb-shaped roof stages and a finial, drawn as shaded Canvas strips.
  const profile=[[1.23,1.85],[1.38,1.85],[1.65,1.68],[1.95,1.36],[2.15,.95],[2.2,.88],[2.28,1.08],[2.4,1.03],[2.65,.84],[2.9,.53],[3.1,.17],[3.35,.08],[4.15,.015]];
  for(let i=1;i<profile.length;i++)shell(h+profile[i-1][0],h+profile[i][0],profile[i-1][1],profile[i][1],config.colors.roof,true);
}

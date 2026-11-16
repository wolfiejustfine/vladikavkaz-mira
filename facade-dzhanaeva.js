// Photo-led compositions at the northern end of this prototype.
// Geometry/face assignments are trusted catalog data, never imported user JSON.
import {facadeSections,residentialBays,brickBays} from './facade-model.js';
import {tint} from './art.js';

export function drawDzhanaevaFacade(c,p,length,config,role='front'){
  if(!['three-storey-balconies','brick-shop-corner'].includes(config.template))return false;
  const {layer,quad,window,rail,balcony,shutter,addressPlate}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=facadeSections(config)[0].height;
  const band=(z,t,color=trim)=>layer(.13,()=>{c.fillStyle=color;c.fillRect(0,-z,length,t);});
  const edge=(points,color=trim,w=.07)=>quad(points,null,color,w);
  layer(.025,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);});

  if(config.template==='three-storey-balconies'){
    // Three floors, with a dark shop base and two five-bay residential halves.
    layer(.04,()=>{c.fillStyle=accent;c.fillRect(0,-f,length,f);});
    for(const z of [f,h-.16,h])band(z,.14);
    for(const bay of residentialBays(config)){
      const x=bay.u*length,w=Math.min(bay.width*length,3.5),bw=length/(2*config.wingBays);
      for(const floor of [1,2]){
        const bottom=floor*f+.5,wh=f-1.02;
        window(x,bottom,w,wh,config.windowShape);
        if(config.details.ornament)layer(.16,()=>{c.fillStyle=trim;c.fillRect(x-w/2-.2,-bottom+.08,w+.4,.12);});
        if(config.details.balconies&&bay.balcony)balcony(x,Math.min(bw*1.35,4.5),floor*f+.36,floor===2,true);
      }
    }
    for(const bay of residentialBays({...config,wingBays:5})){
      const x=bay.u*length,bw=length/10;
      window(x,bay.entrance?.08:.48,Math.min(bw*.72,3.3),f-(bay.entrance?.48:.88),'rect',bay.entrance);
    }
    layer(.18,()=>{
      c.fillStyle=trim;for(const u of [.02,.5,.98]){c.fillRect(length*u-.1,-h,.2,h-f);c.fillRect(length*u-.21,-h+.16,.42,.18);}
      if(config.details.rustication){c.strokeStyle=tint(wall,.83);c.lineWidth=.03;for(let z=f+.25;z<h-.3;z+=.42){c.beginPath();c.moveTo(0,-z);c.lineTo(length,-z);c.stroke();}}
      c.strokeStyle='#a5aaa1';c.lineWidth=.085;c.beginPath();c.moveTo(length*.51,-h);c.lineTo(length*.51,-.2);c.stroke();
    });
    if(config.details.parapet)rail(.2,length-.2,h+.07,.03,.6);
    addressPlate(length*.94);
    return true;
  }

  // One-storey brick shop; each street elevation and the chamfered entrance is
  // drawn on its actual footprint edge. Back walls stay deliberately simple.
  layer(.035,()=>{
    c.fillStyle='#b5b0a0';c.fillRect(0,-.35,length,.35);
    if(config.details.rustication){
      c.strokeStyle=tint(accent,1.1);c.lineWidth=.025;c.beginPath();
      for(let row=0;row<Math.ceil(h/.19);row++){
        const z=.35+row*.19;if(z>=h)break;c.moveTo(0,-z);c.lineTo(length,-z);
        for(let x=(row%2)*.3;x<length;x+=.6){c.moveTo(x,-z);c.lineTo(x,-Math.min(h,z+.19));}
      }c.stroke();
    }
  });
  for(const [z,t] of [[f+.08,.16],[h-.18,.18],[h-.55,.12],[h,.14]])band(z,t);
  function lights(a,b,z){
    if(!config.details.ornament)return;
    layer(.2,()=>{c.fillStyle='#eddbab';for(let x=a+.08;x<b;x+=.29){c.beginPath();c.arc(x,-z,.038,0,Math.PI*2);c.fill();}});
  }
  function pier(x,w){
    layer(.12,()=>{c.fillStyle=tint(wall,.9);c.fillRect(x-w/2,-f,w,f-.35);c.fillStyle=trim;
      for(let z=.55;z<f;z+=.5)c.fillRect(x-w/2-.04,-z,w+.08,.08);
      c.fillRect(x-w*.75,-f-.02,w*1.5,.15);});
    if(config.details.ornament)for(const s of [-1,1])layer(.22,()=>{c.fillStyle='#e7cda6';for(let z=.5;z<f;z+=.27){c.beginPath();c.arc(x+s*w*.42,-z,.035,0,Math.PI*2);c.fill();}});
  }
  function blackCanopy(x,w,z){
    quad([[x-w/2,z,.08],[x+w/2,z,.08],[x+w/2,z-.33,.82],[x-w/2,z-.33,.82]],'#34403e',accent);
    quad([[x-w/2,z-.33,.82],[x+w/2,z-.33,.82],[x+w/2,z-.53,.82],[x-w/2,z-.53,.82]],'#222f2f');
    for(let u=x-w/2+.1;u<x+w/2;u+=.28)edge([[u,z-.52,.83],[u+.09,z-.58,.83],[u+.18,z-.52,.83]],'#222f2f',.1);
  }
  function crest(x,w,rise,oculus){
    layer(.16,()=>{
      c.fillStyle=wall;c.strokeStyle=trim;c.lineWidth=.1;c.beginPath();c.moveTo(x-w/2,-h);c.lineTo(x-w/2,-h-rise*.66);c.lineTo(x-w*.25,-h-rise*.66);
      c.quadraticCurveTo(x,-h-rise*1.3,x+w*.25,-h-rise*.66);c.lineTo(x+w/2,-h-rise*.66);c.lineTo(x+w/2,-h);c.closePath();c.fill();c.stroke();
      if(config.details.ornament){c.strokeStyle=accent;c.lineWidth=.07;for(const s of [-1,1])c.strokeRect(x+s*w*.34-w*.09,-h-rise*.55,w*.18,rise*.34);}
      if(oculus){c.fillStyle=trim;c.beginPath();c.arc(x,-h-rise*.43,.34,0,Math.PI*2);c.fill();c.fillStyle='#283c3c';c.beginPath();c.arc(x,-h-rise*.43,.23,0,Math.PI*2);c.fill();}
    });
  }
  const bays=brickBays(config,role);
  for(const bay of bays){
    const x=bay.u*length,w=bay.width*length,z=.48,wh=f-.7;
    window(x,z,w,wh,config.windowShape);
    if(config.details.shutters&&bay.shutter){
      shutter(x,z,w,wh,false);
      layer(.1,()=>{c.fillStyle='rgba(14,26,27,.65)';c.fillRect(x-w/2,-z-wh,w,wh);});
    }
    if(config.details.awnings)blackCanopy(x,w+.28,f+.02);
    for(const u of [x-w/2-.22,x+w/2+.22])pier(u,.3);
    lights(x-w/2,x+w/2,z-.08);
  }
  if(role==='corner'){
    // Recessed black-glass entrance, on the existing diagonal edge.
    const x=length/2,w=length*.72;
    quad([[x-w/2,.36,.02],[x+w/2,.36,.02],[x+w/2,.36,.65],[x-w/2,.36,.65]],'#a49e8a');
    quad([[x-w/2,.36,.65],[x+w/2,.36,.65],[x+w/2,.14,.65],[x-w/2,.14,.65]],'#7c7d70');
    crest(x,length*.94,1.8,true);
  }else{
    crest(length*.5,Math.min(length*.5,10),1.45,false);
    for(const u of [.025,.975]){band(h,.1);layer(.14,()=>{c.fillStyle=wall;c.fillRect(length*u-.35,-h-.7,.7,.7);c.strokeStyle=trim;c.lineWidth=.075;c.strokeRect(length*u-.35,-h-.7,.7,.7);});}
    if(role==='front')addressPlate(length*.95);
  }
  if(config.details.ornament)layer(.17,()=>{
    // Recessed brick panels and paired corbels below the projecting cornice.
    c.strokeStyle=accent;c.lineWidth=.055;
    for(let u=.35;u<length-.7;u+=1.7){
      c.strokeRect(u,-h+.72,1.08,.27);
      for(const x of [u-.13,u+1.21]){c.fillStyle=trim;c.fillRect(x,-h+.55,.12,.28);c.fillStyle=accent;c.fillRect(x+.025,-h+.65,.065,.25);}
    }
    c.fillStyle=trim;for(let u=.15;u<length;u+=.34)c.fillRect(u,-h+.27,.13,.17);
  });
  for(const z of [h-.04,f+.1,h-.57])lights(0,length,z);
  if(config.details.parapet)rail(.1,length-.1,h+.1,.05,.5);
  return true;
}

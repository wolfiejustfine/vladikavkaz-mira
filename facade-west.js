// West-side compositions, drawn from the street left-to-right (south to north).
// Shared facade primitives keep the editor and the street rendering identical.
import {westUpperBays,atticBays} from './facade-model.js';

export function drawWestFacade(c,p,length,config){
  if(!['stepped-gable','five-attics'].includes(config.template))return false;
  const {layer,quad,window,rail,balcony,shutter,addressPlate}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=2*f;
  const green=config.template==='stepped-gable';
  const band=(z,t,color=trim)=>layer(.12,()=>{c.fillStyle=color;c.fillRect(-.04,-z,length+.08,t);});
  const outline=(points,color=trim,width=.09)=>quad(points,null,color,width);
  layer(.025,()=>{
    c.fillStyle=wall;c.fillRect(0,-h,length,h);c.fillStyle=green?'#354b48':'#b6b3a4';c.fillRect(0,-.48,length,.48);
    if(green){c.fillStyle='#3c5350';c.fillRect(0,-f+.3,length,f-.8);}
    if(config.details.rustication){c.fillStyle=accent;for(let z=.85;z<h-.75;z+=.47)c.fillRect(0,-z,length,.035);}
  });
  for(const [z,t] of [[f-.1,.16],[f+.28,.2],[h,.2],[h-.32,.14],[h-.83,.1]])band(z,t);
  const bays=westUpperBays(config);
  for(let i=0;i<bays.length;i++){
    const bay=bays[i],x=bay.u*length,w=bay.width*length,base=f+.5,wh=f-1.65;
    layer(.16,()=>{
      const u=x-length/config.wingBays*.46;
      c.fillStyle=trim;c.fillRect(u,-h+.94,.18,h-f-1.02);
      if(config.details.ornament){
        c.fillRect(x-w/2-.22,-base-wh-.22,w+.44,.13);
        c.fillRect(x-w/2-.1,-f-.35,w+.2,.17);
        for(const z of [f-.28,h-.12]){c.fillRect(u-.04,-z,.27,.22);}
      }
    });
    window(x,base,w,wh,config.windowShape);
    if(!green&&config.details.shutters)shutter(x,base+wh*.55,w,wh*.45,false);
    if(config.details.balconies){
      if(green&&i===0)balcony(x,Math.min(length*.19,3.4),f+.36,true);
      if(!green)balcony(x,Math.min(length/config.wingBays*.94,3.8),f+.32,false);
    }
  }
  // Independent shop-door rhythm; changing upper windows never moves entrances.
  const ground=green?[[.085,.095,true],[.32,.16,false],[.59,.18,true],[.845,.17,false]]
    :[[.075,.105,true],[.285,.16,false],[.5,.125,true],[.715,.16,false],[.92,.11,false]];
  for(const [u,ww,door] of ground){
    const x=u*length,w=ww*length,bottom=door?.08:.55,wh=f-.5-bottom;
    if(green&&config.details.shutters&&!door)shutter(x,bottom,w,wh,false);
    else window(x,bottom,w,wh,'rect',door);
  }
  if(green){
    const x=length*.59,w=length*.25,z=f-.22;
    quad([[x-w/2,z,0],[x,z+.4,0],[x+w/2,z,0],[x+w/2,z-.2,.75],[x-w/2,z-.2,.75]],roof,accent);
  }else if(config.details.balconies){
    // The middle balcony projects beyond the four smaller ones.
    const x=length*.5,w=length*.25,z=f+.32,d=1.45;
    quad([[x-w/2,z,0],[x+w/2,z,0],[x+w/2,z,d],[x-w/2,z,d]],trim);
    quad([[x-w/2,z,d],[x+w/2,z,d],[x+w/2,z-.23,d],[x-w/2,z-.23,d]],accent);
    rail(x-w/2,x+w/2,z,d,.95,'#46544e',true);
    for(const u of [x-w/2,x+w/2])quad([[u,z,.1],[u,z,d],[u,z+.95,d],[u,z+.95,.1]],null,'#46544e',.055);
  }
  if(config.details.ornament)layer(.16,()=>{
    c.fillStyle=trim;for(let x=.12;x<length;x+=green?.58:.35)c.fillRect(x,-h+.22,.13,.24);
    c.strokeStyle=accent;c.lineWidth=.06;
    for(const bay of bays)c.strokeRect(bay.u*length-.32,-h+.48,.64,.22);
  });
  if(config.details.parapet)rail(.15,length-.15,h+.12,.04,.55);
  for(const attic of atticBays(config)){
    const x=attic.u*length,w=attic.width*length,z=h+.08,H=attic.height;
    if(green){
      const shape=[[x-w/2,z],[x-w/2,z+H*.45],[x-w*.36,z+H*.45],[x,z+H*.85],[x+w*.36,z+H*.45],[x+w/2,z+H*.45],[x+w/2,z]];
      quad(shape,wall,accent,.07);outline(shape.slice(1,-1),trim,.14);
      quad([[x-.42,z+.1],[x-.42,z+H*.4],[x,z+H*.62],[x+.42,z+H*.4],[x+.42,z+.1]],'#253d3d');
      for(const [u,top] of [[x-w/2,H*.58],[x,H],[x+w/2,H*.58]]){
        layer(.2,()=>{c.fillStyle=trim;c.fillRect(u-.14,-z-top,.28,top);c.fillStyle=accent;c.fillRect(u-.22,-z-top,.44,.12);});
      }
    }else{
      const centre=attic.central,small=attic.small;
      const shape=[[x-w/2,z],[x-w*.5,z+H*.18],[x-w*.36,z+H*.4],[x-w*.47,z+H*.65],[x-w*.28,z+H*.65],
        [x,z+H*.83],[x+w*.28,z+H*.65],[x+w*.47,z+H*.65],[x+w*.36,z+H*.4],[x+w*.5,z+H*.18],[x+w/2,z]];
      quad(shape,wall,accent,.055);outline(shape.slice(1,-1),trim,.13);
      if(centre){
        for(const dx of [-w*.18,w*.18])window(x+dx,z+.12,w*.19,H*.36,'arch');
        layer(.2,()=>{c.fillStyle=trim;c.beginPath();c.arc(x,-z-H*.61,.29,0,Math.PI*2);c.fill();c.fillStyle='#3e5352';c.beginPath();c.arc(x,-z-H*.61,.17,0,Math.PI*2);c.fill();});
      }else window(x,z+.14,w*.27,H*.28,'rect');
      quad([[x-.2,z+H*.81],[x,z+H],[x+.2,z+H*.81]],roof,accent,.04);
      if(config.details.ornament&&!small)layer(.22,()=>{c.fillStyle=trim;for(const side of [-1,1]){c.fillRect(x+side*w*.35-.08,-z-H*.53,.16,H*.4);c.fillRect(x+side*w*.35-.15,-z-.15,.3,.15);}});
    }
  }
  layer(.24,()=>{c.strokeStyle=green?'#8c9990':'#9b8272';c.lineWidth=.08;c.beginPath();for(const u of [.07,length-.07]){c.moveTo(u,-h);c.lineTo(u,-.2);}c.stroke();});
  addressPlate(length*.96);
  return true;
}

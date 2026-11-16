// Mira 47/49: shared Canvas modules, separate photographic compositions.
// Catalog face geometry is trusted; portable v1 settings contain decoration only.
import {nikitinaUpperBays,nikitinaGroundBays,nikitinaAttics} from './facade-model.js';
import {tint} from './art.js';

export function drawNikitinaFacade(c,p,length,config,role='front'){
  if(!['rose-shop-attics','rusticated-balcony'].includes(config.template))return false;
  const {layer,quad,window,rail,balcony,pediment,addressPlate}=p;
  const {wall,trim,accent,roof}=config.colors,f=config.floorHeight,h=2*f;
  const rose=config.template==='rose-shop-attics',corner=role==='corner',iron='#3e493f';
  const band=(z,t,color=trim)=>layer(.13,()=>{c.fillStyle=color;c.fillRect(0,-z,length,t);});
  const edge=(points,color=iron,lw=.055)=>quad(points,null,color,lw);
  layer(.025,()=>{c.fillStyle=wall;c.fillRect(0,-h,length,h);c.fillStyle=rose?tint(trim,.94):tint(trim,.91);c.fillRect(0,-f,length,f);c.fillStyle='#8f9180';c.fillRect(0,-.38,length,.38);});
  for(const [z,t] of [[f,.19],[f+.26,.12],[h,.15],[h-.2,.13],[h-.45,.18],[h-.67,.06]])band(z,t);
  band(h+.06,.075,roof);

  function panel(x,z,w,hh){
    layer(.16,()=>{c.fillStyle=trim;c.fillRect(x-w/2,-z-hh,w,hh);if(config.details.ornament){c.strokeStyle=tint(wall,.86);c.lineWidth=.045;c.strokeRect(x-w/2+.09,-z-hh+.07,w-.18,hh-.14);}});
  }
  function pier(x,w,z0,z1){
    layer(.18,()=>{c.fillStyle=trim;c.fillRect(x-w/2,-z1,w,z1-z0);for(const [z,t] of [[z0+.12,.12],[z1,.16],[z1-.24,.1]])c.fillRect(x-w*.8,-z,w*1.6,t);});
  }
  function grille(x,z,w,hh){
    if(!config.details.ornament)return;
    layer(.16,()=>{
      c.strokeStyle=iron;c.lineWidth=.026;c.beginPath();
      for(let u=x-w/2+.08;u<x+w/2;u+=.14){c.moveTo(u,-z);c.lineTo(u,-z-hh);}
      for(const v of [.12,.5,.86]){c.moveTo(x-w/2,-z-hh*v);c.lineTo(x+w/2,-z-hh*v);}c.stroke();
      c.lineWidth=.019;for(let u=x-w/2+.17;u<x+w/2-.08;u+=.28){c.beginPath();c.ellipse(u,-z-hh*.84,.06,.15,0,0,Math.PI*2);c.stroke();}
    });
  }
  function steps(x,w,level=.18,depth=.72){
    for(let n=2;n>=0;n--){const d=depth*(n+1)/3,z=level*(3-n)/3;
      quad([[x-w/2,z,0],[x+w/2,z,0],[x+w/2,z,d],[x-w/2,z,d]],'#c6c0a8');
      quad([[x-w/2,z,d],[x+w/2,z,d],[x+w/2,z-.07,d],[x-w/2,z-.07,d]],'#969d8a');
    }
  }
  // The shallow barrel canopy has projected ribs and scroll brackets. At 47
  // the upper canopy belongs to its balcony; the lower one shades the glazing.
  function canopy(x,w,z,depth=1.05,rise=.42){
    const parts=10,pts=Array.from({length:parts+1},(_,i)=>{const t=i/parts;return [x-w/2+t*w,z+rise*Math.sin(t*Math.PI)];});
    for(let i=0;i<parts;i++){
      const a=pts[i],b=pts[i+1];quad([[...a,.05],[...b,.05],[...b,depth],[...a,depth]],tint(roof,.67+i%2*.08),iron,.035);
    }
    edge(pts.map(([u,v])=>[u,v,depth]),iron,.075);
    for(const u of [x-w/2,x+w/2]){
      edge([[u,z,.04],[u,z,depth],[u,z-.5,.04]],iron,.055);
      if(config.details.ornament)layer(.15,()=>{c.strokeStyle=iron;c.lineWidth=.035;c.beginPath();c.ellipse(u,-z+.24,.12,.21,0,0,Math.PI*2);c.stroke();});
    }
    if(config.details.ornament)layer(depth,()=>{
      c.strokeStyle=iron;c.lineWidth=.03;for(let u=x-w/2+.13;u<x+w/2-.08;u+=.24){c.beginPath();c.ellipse(u,-z-.08,.1,.09,0,0,Math.PI*2);c.stroke();}
    });
  }

  if(!rose&&config.details.rustication)layer(.045,()=>{
    c.strokeStyle=tint(wall,.79);c.lineWidth=.045;c.beginPath();for(let z=.58;z<f-.15;z+=.4){c.moveTo(0,-z);c.lineTo(length,-z);}c.stroke();
  });
  for(const bay of nikitinaUpperBays(config,role)){
    const x=bay.u*length,w=bay.width*length,bottom=corner?f+.16:f+.67,wh=corner?f-1.03:f-1.55;
    window(x,bottom,w,wh,config.windowShape,false,false,{thin:!rose,mullion:corner&&rose?trim:accent});
    if(!rose)grille(x,bottom,w,wh);
    if(!corner&&config.details.ornament){
      if(rose)panel(x,f+.18,w*.95,.23);
      else if(bay.pediment)pediment(x,w+.5,bottom+wh+.12,.49,false);
    }
  }

  if(rose){
    const divisions=corner?[.04,.96]:[.025,...[1,2,3].map(i=>Math.round(config.wingBays*i/4)/config.wingBays),.975];
    for(const u of divisions)pier(length*u,.19,f+.25,h-.45);
    for(const bay of nikitinaGroundBays(config,role)){
      const x=bay.u*length,w=bay.width*length,bottom=bay.door?.12:.42,wh=f-bottom-.7;
      window(x,bottom,w,wh,'rect',false,false,{thin:true,mullion:accent});
      // Four wide shop bays stay independent of edited upper windows. Their
      // timber frames have three panes, with a glazed door in bays one and three.
      layer(.1,()=>{
        c.fillStyle='#365052';c.fillRect(x-w/2,-bottom-wh,w,wh);
        const pane=w/bay.columns;
        for(let i=0;i<bay.columns;i++){
          const a=x-w/2+i*pane;c.fillStyle=i%2?'#46625d':'#60776b';c.fillRect(a+.08,-bottom-wh+.09,pane*.6,wh-.18);
          c.strokeStyle=accent;c.lineWidth=.075;c.strokeRect(a,-bottom-wh,pane,wh);c.beginPath();c.moveTo(a,-bottom-wh*.7);c.lineTo(a+pane,-bottom-wh*.7);c.stroke();
          if(bay.door&&i===1){c.lineWidth=.055;c.strokeRect(a+.1,-bottom-wh*.65,pane-.2,wh*.58);c.fillStyle=trim;c.fillRect(a+pane-.2,-1.2,.045,.28);}
        }
      });
      if(bay.door)steps(x,w*.8);
    }
    if(!corner){
      for(let i=0;i<=4;i++)pier(length*(.025+.95*i/4),.27,.4,f-.25);
      layer(.22,()=>{c.strokeStyle=accent;c.lineWidth=.09;c.beginPath();c.moveTo(length/2,-h);c.lineTo(length/2,-.2);c.stroke();});
    }
    if(config.details.rustication)for(const u of [.01,.99])layer(.2,()=>{c.fillStyle=tint(trim,.8);for(let z=.6;z<f-.4;z+=.44)c.fillRect(length*u-.1,-z,.2,.035);});
  }else{
    // Small framed panels and alternating hanging blocks form the frieze above
    // the rusticated ground floor, distinct from the restrained upper plaster.
    if(config.details.ornament){
      for(let x=.45;x<length-.3;x+=1.25)panel(x,f+.08,.82,.34);
      layer(.16,()=>{c.fillStyle=trim;for(let x=.12;x<length;x+=.56)c.fillRect(x,-f+.11,.2,.36);});
    }
    for(const bay of nikitinaGroundBays(config,role)){
      const x=bay.u*length,w=bay.width*length,bottom=bay.door?.18:.85,wh=f-bottom-.7;
      window(x,bottom,w,wh,'rect',bay.door,false,{thin:true,mullion:accent});
      if(!bay.door)grille(x,bottom,w,wh);
      if(bay.door){steps(x,w*1.55,.28,1.05);if(config.details.awnings)canopy(x,w*1.65,f-.5,.95,.38);}
    }
  }

  if(corner){
    if(config.details.balconies){
      const x=length/2,w=length*.82,z=f+.15;
      balcony(x,w,z,false);
      if(rose&&config.details.ornament)rail(x-w/2,x+w/2,z,1,.9,iron,true);
      if(rose&&config.details.awnings){
        const top=h-.66;canopy(x,w+.2,top,1.12,.34);
        for(const u of [x-w/2,x+w/2])edge([[u,z+.85,1],[u,top,1.05]],iron,.05);
      }
    }
    if(rose&&config.details.awnings)canopy(length/2,length*.95,f-.48,1.22,.48);
  }
  for(const attic of nikitinaAttics(config,role)){
    const x=length*attic.u,w=length*attic.width,rise=attic.rise;
    if(rose){
      const points=[[x-w/2,h],[x-w/2,h+rise*.28],[x-w*.34,h+rise*.28],[x-w*.34,h+rise*.52],[x-w*.13,h+rise*.52],[x-w*.13,h+rise],[x+w*.13,h+rise],[x+w*.13,h+rise*.52],[x+w*.34,h+rise*.52],[x+w*.34,h+rise*.28],[x+w/2,h+rise*.28],[x+w/2,h]];
      quad(points,wall,trim,.1);
      if(config.details.ornament)edge(points.slice(1,-1).map(([u,z])=>[x+(u-x)*.9,z-.13,.1]),tint(wall,.75),.045);
    }else{
      layer(.15,()=>{c.fillStyle=wall;c.strokeStyle=trim;c.lineWidth=.12;c.fillRect(x-w/2,-h-rise,w,rise);c.strokeRect(x-w/2,-h-rise,w,rise);c.fillStyle=trim;c.fillRect(x-w*.56,-h-rise-.12,w*1.12,.15);
        c.fillStyle=accent;c.fillRect(x-w*.35,-h-rise+.34,w*.7,rise-.58);});
      if(config.details.ornament)rail(x-w*.34,x+w*.34,h+.22,.17,rise-.58,iron);
    }
  }
  if(config.details.parapet&&!corner)rail(.15,length-.15,h+.08,.05,.58);
  layer(.24,()=>{c.strokeStyle=accent;c.lineWidth=.08;c.beginPath();for(const u of [.04,length-.04]){c.moveTo(u,-h);c.lineTo(u,-.25);}c.stroke();});
  if(!corner)addressPlate(length*.975);
  return true;
}

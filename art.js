import {rotateTramPoint} from './tram-geometry.js';
import {TRAM} from './tram-route.js';
import {drawTram} from './tram-art.js';
import {project, rect, bounds, getView} from './math.js';
import {AVENUE,TRACK_OFFSETS,roadEdgeX,trackCenterX,avenueSamples,PARKS,CROSS_STREETS} from './avenue.js';
import {PATHS,PROMENADE,ribbon,SQUARE,SQUARE_BEDS,SQUARE_FLOWERS,MONUMENT_SIZE,FOUNTAIN,FOUNTAIN_HEIGHT,FOUNTAIN_WALK,ALLEY_FLOWERS,ALLEY_BENCH_PADS,ALLEY_STOPS,circle} from './landscape.js';
import {genericElevation} from './elevation.js';
import {drawMonument,drawFountain,drawSquareBench} from './square-art.js';
const squareArt={polygon,line,box,tint};
const P=22;
export const palette={stone:'#d8d5bf', paving:'#e2ddc9', trim:'#f4ebd4', green:'#719663', dark:'#294a43', gold:'#c99849'};
const rnd=(n)=>{const a=Math.sin(n*127.1+311.7)*43758.5453;return a-Math.floor(a);};
export function tint(hex,k){return '#'+hex.slice(1).match(/../g).map(v=>Math.min(255,Math.max(0,Math.round(parseInt(v,16)*k))).toString(16).padStart(2,'0')).join('');}
export function polygon(c,points,fill,stroke=null,width=.04) {
  c.beginPath();points.forEach((p,i)=>{const q=project(...p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.closePath();
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
}
export function line(c,points,color,width=.05) {
  c.beginPath();points.forEach((p,i)=>{const q=project(...p);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();
}
export function box(c,x,y,w,d,h,color,z=0) {
  polygon(c,[[x-w/2,y+d/2,z],[x+w/2,y+d/2,z],[x+w/2,y+d/2,z+h],[x-w/2,y+d/2,z+h]],tint(color,.88));
  const side=x+getView()*w/2;
  polygon(c,[[side,y-d/2,z],[side,y+d/2,z],[side,y+d/2,z+h],[side,y-d/2,z+h]],tint(color,getView()===1?.72:.94));
  polygon(c,rect(x,y,w,d).map(p=>[...p,z+h]),color);
}
export function makeSprite(extent,draw,ppm=P) {
  const [minX,minY,maxX,maxY]=extent,pad=3;
  const canvas=document.createElement('canvas');canvas.width=Math.ceil((maxX-minX)*ppm)+pad*2;canvas.height=Math.ceil((maxY-minY)*ppm)+pad*2;
  const c=canvas.getContext('2d');c.translate(pad-minX*ppm,pad-minY*ppm);c.scale(ppm,ppm);draw(c);
  return {image:canvas,ppm,anchor:[pad-minX*ppm,pad-minY*ppm]};
}
export function extentFor(poly,height,margin=1){
  const pts=poly.flatMap(p=>[project(...p),project(...p,height)]);
  return [Math.min(...pts.map(p=>p.x))-margin,Math.min(...pts.map(p=>p.y))-margin,Math.max(...pts.map(p=>p.x))+margin,Math.max(...pts.map(p=>p.y))+margin];
}
export function buildingSprite(building,index) {
  const context=building.role==='context';
  let points=building.polygon.map(([x,y])=>[x-building.x,y-building.y]);
  const signed=points.reduce((s,p,i)=>s+p[0]*points[(i+1)%points.length][1]-points[(i+1)%points.length][0]*p[1],0);
  if(signed<0)points.reverse();
  const elevation=genericElevation(building),h=elevation.cornice,colors=context?['#d2cfbc','#dad5c2','#c9ccbb']:['#d9c7ae','#e2d9c3','#c9b29a','#d5d7c1','#d9b9a1'];
  const wall=colors[index%colors.length],trim='#f1e8d3',roof=index%2?'#647c77':'#907568';
  return makeSprite(extentFor(points,h+2),c=>{
    for(let i=0;i<points.length;i++) {
      const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
      if(getView()*dy-dx<=0||len<.5)continue;
      const face=(u,z,offset=0)=>[a[0]+dx*u+dy/len*offset,a[1]+dy*u-dx/len*offset,z];
      const quad=(u0,u1,z0,z1,color,offset=.02)=>polygon(c,[face(u0,z0,offset),face(u1,z0,offset),face(u1,z1,offset),face(u0,z1,offset)],color);
      quad(0,1,0,h,tint(wall,dy>0?.82:1),0);
      quad(0,1,0,.65,tint(wall,.68));
      const floors=elevation.storeys,fh=h/floors,bays=Math.max(1,Math.floor(len/3.1));
      for(let floor=0;floor<floors;floor++) {
        quad(0,1,floor*fh+.12,floor*fh+.28,trim,.12);
        for(let n=0;n<bays;n++) {
          const u=(n+.5)/bays,half=Math.min(1,len/bays*.26)/len,z=floor*fh+.85,wh=fh*.61;
          quad(u-half-.09/len,u+half+.09/len,z-.1,z+wh+.1,trim,.1);
          quad(u-half,u+half,z,z+wh,'#46676b',.11);
          quad(u-half,u-half*.15,z+.12,z+wh-.12,'#6d8b87',.12);
          quad(u-.035/len,u+.035/len,z,z+wh,trim,.14);
          quad(u-half,u+half,z+wh*.65,z+wh*.65+.055,trim,.15);
          quad(u-half-.2/len,u+half+.2/len,z-.18,z-.05,trim,.28);
          if(!context && floor===floors-1 && n%2===0) {
            polygon(c,[face(u-half-.2/len,z+wh+.18,.15),face(u,z+wh+.6,.15),face(u+half+.2/len,z+wh+.18,.15)],trim);
          }
        }
      }
      for(const u of [.08/len,1-.08/len])quad(u-.14/len,u+.14/len,.6,h,trim,.16);
      const door=.5,half=.8/len;
      quad(door-half-.15/len,door+half+.15/len,.05,2.7,trim,.25);
      quad(door-half,door+half,.05,2.5,'#34574e',.27);
      line(c,[face(door,.1,.29),face(door,2.4,.29)],'#b5b599',.06);
      if(len>7){
        polygon(c,[face(door-half-.3/len,2.65,.1),face(door+half+.3/len,2.65,.1),face(door+half+.3/len,2.65,1.3),face(door-half-.3/len,2.65,1.3)],index%2?'#947058':'#4b7263');
        quad(0,1,h-.3,h,trim,.3);
      }
    }
    polygon(c,points.map(p=>[...p,h+.1]),roof,'#d2ceba',.16);
    // Restrained stylised roof seams; roof shapes are not claimed as surveyed.
    const B=bounds(points);
    c.save();const projected=points.map(p=>project(...p,h+.1));c.beginPath();projected.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();
    for(let x=B.minX;x<B.maxX;x+=2)line(c,[[x,B.minY,h+.11],[x,B.maxY,h+.11]],tint(roof,1.14),.06);
    c.restore();
    const cx=(B.minX+B.maxX)/2,cy=(B.minY+B.maxY)/2;
    box(c,cx,cy,1.1,1,1.4,'#b7a58a',h+.1);box(c,cx,cy,1.4,1.3,.16,'#d4c7ad',h+1.5);
  },context?11:22);
}
export function pineSprite(seed=0,scale=1) {
  return makeSprite([-4,-12,4,2].map(v=>v*scale),c=>{c.scale(scale,scale);
    line(c,[[0,0,0],[0,0,11]],'#6c6851',.32);
    for(let tier=0;tier<11;tier++) {
      const z=1+tier*.84,w=3.1*(1-tier/12),p=project(0,0,z);
      c.beginPath();c.moveTo(p.x,p.y-2.1);
      for(let n=0;n<15;n++)c.lineTo(p.x+w-n*w/7,p.y+.2+Math.sin(n*2.4+seed)*.2);
      c.closePath();c.fillStyle=['#426c54','#537d5e','#628d68'][(tier+seed)%3];c.fill();
      c.beginPath();c.moveTo(p.x,p.y-1.8);c.lineTo(p.x-w*.8,p.y+.1);c.lineTo(p.x-.2,p.y-.12);c.closePath();c.fillStyle='#709c70';c.globalAlpha=.5;c.fill();c.globalAlpha=1;
    }
  });
}
export function leafySprite(seed=0) {
  return makeSprite([-4,-9,4,2],c=>{
    line(c,[[0,0,0],[0,0,6]],'#7d7050',.38);
    const colors=['#779653','#8eaa60','#a0b771','#6b8c50'];
    for(let i=0;i<26;i++){
      const x=(rnd(i+seed*53)-.5)*4.4,y=-4.5-rnd(i*2+4+seed)*2.7;
      c.beginPath();c.ellipse(x,y,1.0+rnd(i+2),.7+rnd(i*3),0,0,Math.PI*2);c.fillStyle=colors[i%4];c.fill();
    }
  });
}
export function benchSprite(facing=0){return makeSprite(extentFor(rect(0,0,3,3),1.25,.3),c=>{
  const pt=([x,y,z])=>facing?[-facing*y,facing*x,z]:[x,y,z];
  const rail=(ps,color,w)=>line(c,ps.map(pt),color,w),metal='#344f48';
  for(const x of [-1.05,1.05]){
    rail([[x,.34,.03],[x,.25,.24],[x,.1,.47],[x,-.28,.47],[x,-.4,.04]],metal,.12);
    rail([[x,-.28,.46],[x,-.44,.84],[x,-.35,1.1]],metal,.1);
    rail(Array.from({length:20},(_,i)=>{const t=i/19*Math.PI*1.6;return[x,.06+Math.cos(t)*.3,.65+Math.sin(t)*.19];}),metal,.065);
  }
  for(let i=0;i<10;i++){
    const y=i<5?.32-i*.12:-.28-(i-5)*.028,z=i<5?.49:.6+(i-5)*.105;
    polygon(c,[[-1.3,y,z],[1.3,y,z],[1.3,y-.085,z+.03],[-1.3,y-.085,z+.03]].map(pt),'#bd9b63','#e2c291',.02);
  }
});}
export function alleyTreeSprite(variant=0){
  const [h,w,base]=[[9.2,2.7,'#779467'],[10.5,2.2,'#65855f'],[7.4,2.35,'#9ca66b'],[8.5,2.7,'#879d67']][variant];
  return makeSprite([-w-1,-h-1,w+1,1],c=>{
    line(c,[[0,0,0],[.12,0,h*.78]],'#6b6b53',.4);
    line(c,[[-.05,0,.08],[-.02,0,1.35]],'#dddac3',.41);
    for(let i=0;i<7;i++){
      const side=i%2?1:-1,z=h*.29+i*h*.037;
      line(c,[[0,0,z],[side*w*.4,.1,z+h*.11],[side*w*.7,.2,z+h*.19]],'#6b6b53',.13);
    }
    const centre=project(0,0,h*.72);
    for(let i=0;i<55;i++){
      const angle=i*2.4,rr=Math.sqrt(rnd(i+variant*31)),x=Math.cos(angle)*rr*w*.73,y=centre.y+Math.sin(angle)*rr*h*.19;
      c.beginPath();c.ellipse(x,y,w*(.22+rnd(i+11)*.12),h*.075,0,0,Math.PI*2);c.fillStyle=tint(base,.83+rnd(i+8)*.34);c.fill();
      for(let j=0;j<4;j++){c.beginPath();c.ellipse(x+(rnd(i*7+j)-.5)*.8,y+(rnd(i*3+j)-.5)*.5,.12,.07,0,0,Math.PI*2);c.fillStyle=tint(base,1.15);c.fill();}
    }
  });
}
export function alleyLampSprite(){return makeSprite([-1,-6.6,1,.5],c=>{
  box(c,0,0,.48,.48,.18,'#4a5d50');box(c,0,0,.3,.3,.65,'#3e5148',.18);
  line(c,[[0,0,.65],[0,0,5.45]],'#31493f',.13);
  for(const z of [.85,1.1,4.7,5.25])box(c,0,0,.24,.24,.09,'#667768',z);
  polygon(c,[[-.22,0,5.28],[.22,0,5.28],[.36,0,6.03],[-.36,0,6.03]],'#ede3b8','#344c43',.07);
  for(const x of [-.28,0,.28])line(c,[[x*.6,0,5.3],[x,0,6]],'#344c43',.045);
  polygon(c,[[-.45,0,6.04],[0,0,6.3],[.45,0,6.04]],'#3c5146');line(c,[[0,0,6.25],[0,0,6.48]],'#344c43',.07);
});}
export function shrubSprite(variant=0){return makeSprite(extentFor(rect(0,0,.85,.85),.9,.3),c=>{
  box(c,0,0,.8,.8,.15,'#b6b99b');box(c,0,0,.72,.72,.62,variant?'#788e59':'#638353',.15);
  for(let i=0;i<22;i++){const p=project((rnd(i)-.5)*.74,(rnd(i+15)-.5)*.74,.78);c.fillStyle=i%2?'#97a974':'#77985d';c.beginPath();c.ellipse(p.x,p.y,.09,.05,0,0,Math.PI*2);c.fill();}
});}
export function stopSprite(variant=0){return makeSprite([-2.4,-4,2.4,.5],c=>{
  box(c,0,0,.35,.35,.18,'#a9ad9b');line(c,[[0,0,.15],[0,0,3.4]],'#647a71',.09);
  const p=project(0,0,3);c.fillStyle='#47798a';c.fillRect(p.x-.48,p.y-.55,.96,1.05);
  c.strokeStyle='#edeedb';c.lineWidth=.055;c.strokeRect(p.x-.48,p.y-.55,.96,1.05);
  c.fillStyle='#f5efdc';c.fillRect(p.x-.26,p.y-.34,.52,.42);c.fillStyle='#47798a';c.fillRect(p.x-.18,p.y-.27,.36,.2);
  line(c,[[0,0,2.58],[0,0,2.58]],'#f5efdc',.06);
  c.fillStyle='#f4eedc';c.fillRect(p.x-1.65,p.y+.6,3.3,.38);c.fillStyle='#3f5f55';c.font='bold .20px Arial';c.textAlign='center';c.fillText(['КИРОВА','ДЖАНАЕВА','ТЕАТРАЛЬНАЯ ПЛ.'][variant],p.x,p.y+.86);
  c.fillStyle='#e9e6d3';c.fillRect(p.x-.24,p.y+1.15,.48,.65);c.fillStyle='#668477';for(let i=0;i<4;i++)c.fillRect(p.x-.16,p.y+1.25+i*.12,.32,.025);
});}
export function fountainSprite(){return makeSprite(extentFor(circle(0,0,FOUNTAIN.radius+.1),FOUNTAIN_HEIGHT,.5),c=>drawFountain(c,squareArt));}
export function squareBenchSprite(turn=0){return makeSprite(extentFor(rect(0,0,3,3),1.1,.3),c=>drawSquareBench(c,squareArt,turn));}
export function lampSprite(){return makeSprite([-2,-7,2,1],c=>{
  box(c,0,0,.6,.6,.6,'#839484');line(c,[[0,0,.6],[0,0,6.5]],'#5a7365',.12);
  for(const sign of [-1,1]){line(c,[[0,0,5.6],[sign*.7,0,6.3],[sign*1.3,0,6.1]],'#5a7365',.08);box(c,sign*1.3,0,.42,.42,.65,'#ecdfaa',5.4);box(c,sign*1.3,0,.55,.55,.12,'#4d6659',6.05);}
});}
export function monumentSprite(){return makeSprite(extentFor(rect(0,0,MONUMENT_SIZE.width,MONUMENT_SIZE.depth),MONUMENT_SIZE.height,.4),c=>drawMonument(c,squareArt));}
export function hedgeSprite(w,d){return makeSprite(extentFor(rect(0,0,w,d),1.25,.4),c=>{
  box(c,0,0,w+.3,d+.3,.18,'#c6c4aa');box(c,0,0,w,d,.85,'#6c9256',.18);
  for(let i=0;i<w*d*5;i++){const p=project((rnd(i)-.5)*w,(rnd(i+88)-.5)*d,1.04);c.fillStyle=i%2?'#8ca966':'#587e49';c.beginPath();c.ellipse(p.x,p.y,.16,.09,0,0,Math.PI*2);c.fill();}
});}
export function tramSprite(doors=0,direction=1,yaw=0){return makeSprite(extentFor(rect(0,0,TRAM.width+.3,TRAM.length+.3).map(p=>rotateTramPoint(p,yaw).slice(0,2)),TRAM.pantographHeight,.5),c=>drawTram(c,{box,polygon,line,tint},doors,direction,yaw));}
export function groundSprite(){
  const {north,south,trackEnd,halfGauge,sleeperHalfWidth}=AVENUE;
  const land=rect(5,(north+south-30)/2,290,south-north+70),samples=avenueSamples(north,south);
  const east=y=>roadEdgeX(y,1);
  return makeSprite(extentFor(land,0,4),c=>{
    polygon(c,land.map(p=>[...p,0]),'#c6d0b0');
    // Shared OSM-derived alignments: a green boulevard lies between the tracks.
    polygon(c,land.map(p=>[...p,.001]),'#dedbc6');
    for(const street of CROSS_STREETS)polygon(c,ribbon(street.points,street.width+4).map(p=>[...p,.002]),'#e5deca');
    for(const street of CROSS_STREETS)polygon(c,ribbon(street.points,street.width).map(p=>[...p,.003]),'#b7b8a9','#d2cfbc',.08);
    for(const park of PARKS){polygon(c,park.polygon.map(p=>[...p,.006]),'#9eaf79','#b7c394',.28);}
    for(let track=0;track<2;track++){
      const edge=side=>samples.map(y=>[trackCenterX(y,track)+side*AVENUE.trackHalfWidth,y,.008]);
      polygon(c,[...edge(-1),...edge(1).reverse()],'#b6b7a5');
      for(const side of [-1,1])line(c,edge(side).map(([x,y])=>[x,y,.02]),'#eee5cf',.2);
    }
    for(let y=north;y<10;y+=2)line(c,[[east(y)+.3,y,.02],[east(y)+6,y,.02]],'#cec6b3',.035);
    const pave=ring=>{
      polygon(c,ring.map(p=>[...p,.035]),'#e6e0cb','#f4edd7',.15);
      c.save();c.clip();const b=bounds(ring);
      for(let y=b.minY;y<b.maxY;y+=.65)line(c,[[b.minX,y,.04],[b.maxX,y,.04]],'#ccc9b4',.035);
      for(let x=b.minX;x<b.maxX;x+=.65)line(c,[[x,b.minY,.04],[x,b.maxY,.04]],'#d1ccba',.035);
      c.restore();
    };
    pave(SQUARE);
    for(const path of PATHS)pave(ribbon(path.points,path.width));
    for(const pad of ALLEY_BENCH_PADS)pave(pad);
    for(const {polygon:bed,variant} of ALLEY_FLOWERS){
      polygon(c,bed.map(p=>[...p,.1]),'#71875a','#c0c5a5',.12);
      const b=bounds(bed);
      for(let i=0;i<100;i++){const p=project(b.minX+.1+rnd(i+9)*(b.maxX-b.minX-.2),b.minY+.15+rnd(i+67)*(b.maxY-b.minY-.3),.16);c.fillStyle=['#d1ad65','#bc7f72','#e1c69a'][(i+variant)%3];c.beginPath();c.ellipse(p.x,p.y,.09,.055,0,0,Math.PI*2);c.fill();}
    }
    for(const stop of ALLEY_STOPS){
      polygon(c,rect(stop.x,stop.y,1.3,2.8).map(p=>[...p,.035]),'#d9d5bd','#ece5cc',.08);
      for(let j=0;j<7;j++)line(c,[[stop.x-.5,stop.y-.95+j*.3,.04],[stop.x+.5,stop.y-.95+j*.3,.04]],'#b9ae80',.06);
    }
    // A restrained paving border follows the same footway centre as all props.
    for(const side of [-1,1])line(c,PROMENADE.points.map(([x,y])=>[x+side*PROMENADE.width/2,y,.05]),'#c2baa0',.09);
    // Smaller running-bond pavers are baked once, without extra runtime draw calls.
    polygon(c,SQUARE.map(p=>[...p,.04]),'#dbd6c4');
    c.save();c.clip();const sb=bounds(SQUARE);
    for(let y=sb.minY,row=0;y<sb.maxY;y+=.42,row++){
      line(c,[[sb.minX,y,.041],[sb.maxX,y,.041]],'#c3c0b0',.023);
      for(let x=sb.minX+(row%2)*.42;x<sb.maxX;x+=.84)line(c,[[x,y,.042],[x,y+.42,.042]],'#c7c3b2',.022);
    }
    for(const side of [-1,1])line(c,[[7.567+(36-53.3)*.11284+side*19,36,.045],[7.567+(118-53.3)*.11284+side*19,118,.045]],'#b59983',.26);
    c.restore();
    for(const bed of SQUARE_BEDS)polygon(c,bed.map(p=>[...p,.12]),'#96ad78','#cbd0b3',.22);
    line(c,FOUNTAIN_WALK.map(p=>[...p,.05]),'#b7aa92',.23);
    for(const radius of [4.45,4.85,5.25])line(c,[...circle(FOUNTAIN.x,FOUNTAIN.y,radius,64),[FOUNTAIN.x+radius,FOUNTAIN.y]].map(p=>[...p,.05]),'#b49c87',.17);
    for(let i=0;i<64;i++){
      const a=i*Math.PI/32;
      line(c,[4.25,5.45].map(r=>[FOUNTAIN.x+Math.cos(a)*r,FOUNTAIN.y+Math.sin(a)*r,.05]),'#c1b39b',.025);
    }
    for(const bed of SQUARE_FLOWERS){
      polygon(c,bed.map(p=>[...p,.13]),'#6a844f','#b4b794',.09);
      c.save();c.clip();const b=bounds(bed),count=Math.ceil((b.maxX-b.minX)*(b.maxY-b.minY)*16);
      for(let i=0;i<count;i++){
        const q=project(b.minX+rnd(i+5)*(b.maxX-b.minX),b.minY+rnd(i+77)*(b.maxY-b.minY),.18);
        c.fillStyle=['#d4a243','#c7754e','#e8bd65','#b86e66'][i%4];c.beginPath();c.ellipse(q.x,q.y,.085,.055,0,0,Math.PI*2);c.fill();
      }
      c.restore();
    }
    // Two tracks aligned along the avenue. Sleepers and rails are baked once.
    for(let track=0;track<TRACK_OFFSETS.length;track++){
      for(let y=north;y<trackEnd;y+=1.15){const x=trackCenterX(y,track);line(c,[[x-sleeperHalfWidth,y,.01],[x+sleeperHalfWidth,y,.01]],'#8e9282',.15);}
      for(const side of [-halfGauge,halfGauge])for(const [z,color,width] of [[.02,'#656f65',.15],[.03,'#d1d2be',.045]])line(c,avenueSamples().map(y=>[trackCenterX(y,track)+side,y,z]),color,width);
    }
  },11);
}
export function drawPerson(c,x,y,scale,time,moving,color='#c99742',facing=1,ghost=false) {
  c.save();c.translate(x,y);c.scale(scale,scale);const step=moving?Math.sin(time*10)*.17:0,bob=moving?Math.abs(Math.sin(time*10))*.065:0;
  if(!ghost){c.fillStyle='#264e452b';c.beginPath();c.ellipse(0,0,.7,.28,0,0,Math.PI*2);c.fill();}
  c.translate(0,-bob);c.lineCap='round';c.lineJoin='round';
  c.strokeStyle=ghost?'#e6c472':'#314c4b';c.lineWidth=.29;
  c.beginPath();c.moveTo(-.23,-.92);c.lineTo(-.25-step,-.12);c.moveTo(.23,-.92);c.lineTo(.25+step,-.12);c.stroke();
  c.strokeStyle=ghost?'#fff3c9':'#f4e9cf';c.lineWidth=.17;c.beginPath();c.moveTo(-.25-step,-.09);c.lineTo(-.08-step,-.08);c.moveTo(.25+step,-.09);c.lineTo(.43+step,-.08);c.stroke();
  c.fillStyle=ghost?'#efd28b':color;c.beginPath();c.roundRect(-.48,-2.04,.96,1.22,.18);c.fill();
  c.strokeStyle=ghost?'#efd28b':color;c.lineWidth=.24;c.beginPath();c.moveTo(-.42,-1.9);c.lineTo(-.62,-1.16+step);c.moveTo(.42,-1.9);c.lineTo(.6,-1.16-step);c.stroke();
  c.fillStyle=ghost?'#fff0b9':'#edc59a';c.beginPath();c.roundRect(-.39,-2.82,.78,.8,.25);c.fill();
  c.fillStyle=ghost?'#c49f50':'#41473b';c.beginPath();c.roundRect(-.42,-2.92,.84,.35,.17);c.fill();c.fillRect(-.42,-2.7,.16,.3);
  if(!ghost){c.fillStyle='#2e4943';c.fillRect(facing*.17-.04,-2.5,.075,.085);c.fillStyle='#497e73';c.beginPath();c.roundRect(facing>0?-.55:.22,-1.96,.32,.85,.09);c.fill();}
  c.restore();
}

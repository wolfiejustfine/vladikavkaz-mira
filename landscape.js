import {TRAM_STOPS} from './tram-route.js';
import {STREET_DATA} from './avenue-data.js';
import {PARKS,lineXAtY,roadEdgeX,trackCenterX} from './avenue.js';
import {inside,rect,segmentDistanceSquared} from './math.js';

// OSM supplies alignments. Widths, planting and furniture are an authored,
// approximate interpretation of the user's 13 2GIS views; no map imagery is used.
export const promenadeX=y=>lineXAtY(STREET_DATA.promenade.points,y);
export const PROMENADE={width:3.4,north:STREET_DATA.promenade.points[0][1],south:145};
PROMENADE.points=[PROMENADE.north,...STREET_DATA.promenade.points.map(p=>p[1]).filter(y=>y>PROMENADE.north&&y<PROMENADE.south),PROMENADE.south].map(y=>[promenadeX(y),y]);

// A ribbon is measured in world metres, unlike a thick projected Canvas stroke.
export function ribbon(points,width){
  const side=s=>points.map(([x,y],i)=>{
    const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
    return [x+s*dy/len*width/2,y-s*dx/len*width/2];
  });
  return [...side(-1),...side(1).reverse()];
}
const mapped=id=>STREET_DATA.crossPaths.find(p=>p.osmId===id).points;
const extendToX=(a,b,x)=>[x,a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])];
const petrovsky=mapped('way/1303664074'),nekrasova=mapped('way/1303664077');
// Opposite street mouths are offset. Join their mapped footway endpoints;
// only the short connectors across the central lawn are inferred.
export const CROSSINGS=[
  {id:'petrovsky',width:2.6,points:[extendToX(...petrovsky,roadEdgeX(-369,-1)-1),...petrovsky.slice().reverse()],inferred:true},
  {id:'nikitina',width:3,points:[mapped('way/635779728')[0],mapped('way/1303664075')[1]],inferred:true},
  {id:'mayakovskogo',width:3,points:[mapped('way/635779729')[0],mapped('way/1303664076')[0]],inferred:true},
  {id:'dzhanaeva',width:3,points:STREET_DATA.crossStreets.find(p=>p.osmId==='way/769775909').points.filter(p=>p[0]>=2.835&&p[0]<=27.798)},
  {id:'nekrasova',width:2.8,points:[...nekrasova.slice().reverse(),extendToX(...nekrasova,roadEdgeX(-84,1)+1)],inferred:true},
  {id:'square-north',width:3,points:mapped('way/502887663')},
  {id:'square-access',width:3,points:STREET_DATA.crossPaths.find(p=>p.osmId==='way/1303664078').points},
];
export const PATHS=[{id:'promenade',...PROMENADE},...CROSSINGS,...STREET_DATA.crossPaths.map(p=>({id:p.osmId,width:2,points:p.points}))];
export function nearPath(x,y,path,extra=0){
  return path.points.slice(1).some((b,i)=>segmentDistanceSquared(x,y,path.points[i],b)<(path.width/2+extra)**2);
}
const inLawn=(x,y,clearance=.6)=>PARKS.some(p=>inside(x,y,p.polygon)&&p.polygon.every((b,i)=>segmentDistanceSquared(x,y,b,p.polygon[(i+1)%p.polygon.length])>clearance**2));
const freePlanting=(x,y)=>inLawn(x,y)&&!PATHS.some(p=>nearPath(x,y,p,.65));

export const MONUMENT={x:10.15,y:53.3}; // Existing OSM anchor, preserved.
// Model dimensions inferred from photographs, not surveyed measurements.
export const MONUMENT_SIZE={width:10.5,depth:8.6,height:8.85};
export const MONUMENT_FOOTPRINT=rect(MONUMENT.x,MONUMENT.y,MONUMENT_SIZE.width,MONUMENT_SIZE.depth);
export const SQUARE=STREET_DATA.square.polygon;
// The square's centreline is slightly west of the monument anchor.
export const squarePoint=(u,y)=>[7.567+(y-MONUMENT.y)*.11284+u,y];
const bed=(u0,u1,y0,y1)=>[[u0,y0],[u1,y0],[u1,y1],[u0,y1]].map(([u,y])=>squarePoint(u,y));
const f=STREET_DATA.fountainWalk.points;
// Basin centre inferred from the mapped circular path; basin radius is estimated.
export const FOUNTAIN={x:(Math.min(...f.map(p=>p[0]))+Math.max(...f.map(p=>p[0])))/2,y:(Math.min(...f.map(p=>p[1]))+Math.max(...f.map(p=>p[1])))/2,radius:4.1};
export const FOUNTAIN_HEIGHT=6.65;
export const FOUNTAIN_WALK=f;
export const circle=(x,y,r,n=32)=>Array.from({length:n},(_,i)=>[x+Math.cos(i*2*Math.PI/n)*r,y+Math.sin(i*2*Math.PI/n)*r]);
const localRing=points=>points.map(([u,y])=>squarePoint(u,y));
// Connected planting islands and a curved southern bed, read from 2GIS views
// 02/09/10. The open circulation, OSM boundary and landmark anchors are retained.
export const SQUARE_BEDS=[
  localRing([[-18,36],[18,36],[18,46],[10,46],[10,41],[-10,41],[-10,46],[-18,46]]),
  localRing([[-18,62],[-10,62],[-9,83],[-11,91],[-18,91]]),
  localRing([[18,62],[10,62],[9,83],[11,91],[18,91]]),
  bed(-2.8,2.8,72,88),
  [squarePoint(-17,99),squarePoint(-17,117),squarePoint(17,117),squarePoint(17,99),
    ...Array.from({length:25},(_,i)=>{const a=i*Math.PI/24;return[FOUNTAIN.x+Math.cos(a)*10,FOUNTAIN.y+Math.sin(a)*10];})],
];
export const SQUARE_FLOWERS=[
  ...[[0,-5.3,13,.7],[0,5.3,13,.7],[-6.3,0,.7,10.6],[6.3,0,.7,10.6]].map(([dx,dy,w,d])=>rect(MONUMENT.x+dx,MONUMENT.y+dy,w,d)),
  bed(-2.3,2.3,74,86),
];
// Reserve these routes for players and furniture clearance; all are in metres.
export const SQUARE_ROUTES=[
  {id:'square-spine-east',width:2,points:localRing([[6.7,43],[6.7,45],[10,47],[10,60],[6.7,67],[6.7,90],[9,94]])},
  {id:'square-spine-west',width:2,points:localRing([[-6.7,43],[-8.5,46],[-8.5,60],[-6.7,67],[-6.7,90],[-6,94]])},
  {id:'square-south',width:2,points:[[FOUNTAIN.x,FOUNTAIN.y+4.9],[FOUNTAIN.x,FOUNTAIN.y+8.5]]},
];
export const SQUARE_WALKER_ROUTE=[[0,92],[12,92]];

export const LANDSCAPE_PROPS=[];
const add=(id,kind,x,y,variant=0,w=.55,d=w,polygon=rect(x,y,w,d))=>LANDSCAPE_PROPS.push({id,kind,x,y,variant,polygon});
// A small shared sprite palette; individual positions are stable across rebakes.
for(let i=0,y=-413;y<142;i++,y+=14.5){
  for(const side of [-1,1]){
    const ty=y+(side===1?4.4:0),x=promenadeX(ty)+side*(3.8+(i%3)*.2);
    if(freePlanting(x,ty))add(`tree-alley-${side}-${i}`,'alleyTree',x,ty,(i+(side===1?2:0))%4,.6);
    const sy=ty+7.2,sx=promenadeX(sy)+side*4.25;
    if(freePlanting(sx,sy))add(`shrub-alley-${side}-${i}`,'shrub',sx,sy,i%2,.65);
  }
}
for(let i=0,y=-399;y<140;i++,y+=29){
  for(const side of [-1,1]){
    const x=promenadeX(y)+side*2.4;
    if(inLawn(x,y,.35)&&!CROSSINGS.some(p=>nearPath(x,y,p,3)))add(`bench-alley-${side}-${i}`,'avenueBench',x,y,side,.8,2.6);
  }
}
for(let i=0,y=-410;y<140;i++,y+=36){
  const x=promenadeX(y)+(i%2?-1:1)*2.5;
  if(inLawn(x,y,.3)&&!CROSSINGS.some(p=>nearPath(x,y,p,3))&&!LANDSCAPE_PROPS.some(p=>Math.hypot(p.x-x,p.y-y)<2))add(`lamp-alley-${i}`,'alleyLamp',x,y);
}
for(const [i,u,y] of [[0,-14,38.5],[1,-7,38.5],[2,0,38.5],[3,7,38.5],[4,14,38.5],
  [5,-14,65],[6,14,65],[7,-14,77],[8,14,77],[9,-14,87],[10,14,87],
  [11,-13,110],[12,-6,115],[13,6,115],[14,14,111]]){
  const [x,py]=squarePoint(u,y);add(`tree-square-${i}`,'pine',x,py,i%3,.85);
}
for(const [i,u,y,turn] of [[0,-3.6,42.5,0],[1,3.6,42.5,0],[2,-8.5,73,3],[3,8.5,75,1],[4,-10,98,3],[5,14,98,1]]){
  const [x,py]=squarePoint(u,y);add(`bench-square-${i}`,'squareBench',x,py,turn,turn%2?.85:2.6,turn%2?2.6:.85);
}
// Short, trimmed runs leave all cross paths and the circular walk open.
export const SQUARE_HEDGES=[[-14,44.8,6,.65],[14,44.8,6,.65],
  [-10.6,66,.65,6],[10.6,66,.65,6],[-10.1,79,.65,6],[10.1,79,.65,6],
  [-14,90,6,.65],[14,90,6,.65],[-13,116,5,.65],[12,116,5,.65]]
  .map(([u,y,w,d],i)=>{const [x,py]=squarePoint(u,y);return{id:`hedge-square-${i}`,kind:'hedge',x,y:py,variant:0,w,d,polygon:rect(x,py,w+.3,d+.3)};});
LANDSCAPE_PROPS.push(...SQUARE_HEDGES);
for(const [i,u,y] of [[0,-18,53],[1,18,53],[2,-18,99],[3,18,99]]){
  const [x,py]=squarePoint(u,y);add(`lamp-square-${i}`,'lamp',x,py);
}
for(const {id,track,y,variant} of TRAM_STOPS){
  const x=trackCenterX(y,track)+(track===0?1:-1)*2.8;
  add(id,'stop',x,y,variant,.35);
}
add('fountain','fountain',FOUNTAIN.x,FOUNTAIN.y,0,0,0,circle(FOUNTAIN.x,FOUNTAIN.y,FOUNTAIN.radius));

// Authored details follow the existing mapped lawn; historical photos establish
// the furniture vocabulary, not exact present-day positions of each object.
export const ALLEY_FLOWERS=[];
for(let i=0,y=-409.4;y<142;i++,y+=29){
  for(const side of [-1,1]){
    const py=y+(side===1?4.4:0),x=promenadeX(py)+side*4.35,polygon=rect(x,py,1.35,2.2);
    if(polygon.every(([px,py])=>freePlanting(px,py))&&!LANDSCAPE_PROPS.some(p=>Math.abs(p.x-x)<1.2&&Math.abs(p.y-py)<3))ALLEY_FLOWERS.push({polygon,variant:i%3});
  }
}
export const ALLEY_BENCH_PADS=LANDSCAPE_PROPS.filter(p=>p.kind==='avenueBench').map(p=>rect(p.x,p.y,1.25,3.15));
export const ALLEY_STOPS=LANDSCAPE_PROPS.filter(p=>p.kind==='stop').map(p=>({...p,name:['Кирова','Джанаева','Театральная площадь'][p.variant]}));

import {segmentDistanceSquared} from './math.js';
const ringArea=p=>Math.abs(p.reduce((a,b,i)=>{const c=p[(i+1)%p.length];return a+b[0]*c[1]-c[0]*b[1];},0))/2;
export const footprintArea=b=>ringArea(b.polygon)-(b.holes||[]).reduce((n,h)=>n+ringArea(h),0);
export const measureDistance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
export function frontageMetrics(b,definition){
  if(!definition)return null;
  const [a,c]=definition.frontEdge.map(i=>b.polygon[i]),length=measureDistance(a,c),nx=-(c[1]-a[1])/length,ny=(c[0]-a[0])/length;
  const depths=b.polygon.map(p=>(p[0]-a[0])*nx+(p[1]-a[1])*ny);
  return{length,depth:Math.max(...depths)-Math.min(...depths),edge:[a,c],mid:[(a[0]+c[0])/2,(a[1]+c[1])/2]};
}
export function frontageGap(a,b){
  return Math.sqrt(Math.min(...a.map(p=>segmentDistanceSquared(...p,...b)),...b.map(p=>segmentDistanceSquared(...p,...a))));
}
export function layoutInventory(district,catalog){
  const definitions=new Map(catalog.buildings.map(d=>[d.id,d]));
  const rows=district.buildings.map(b=>({id:b.id,osmId:b.osmId,title:definitions.get(b.id)?.title||b.name,area:footprintArea(b),frontage:frontageMetrics(b,definitions.get(b.id)),method:b.placement?.method||'source-footprint'}));
  for(const parity of [0,1]){
    const side=rows.filter(r=>/^mira\d+$/.test(r.id)&&Number(r.id.slice(4))%2===parity).sort((a,b)=>a.frontage.mid[1]-b.frontage.mid[1]);
    side.forEach((r,i)=>{if(i){r.northNeighbour=side[i-1].id;r.gapNorth=frontageGap(r.frontage.edge,side[i-1].frontage.edge);}});
  }
  return rows;
}

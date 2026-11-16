// Canvas-only geometry. x is east, y is south; one world unit is one metre.
export const WALK_LIMITS=Object.freeze({minX:-65,maxX:90,minY:-465,maxY:130});
export const SX = Math.SQRT1_2, SY = Math.SQRT1_2 / 2, SZ = Math.sqrt(3) / 2;
let viewSign=1;
export const getView=()=>viewSign;
export function setView(sign){if(sign!==1&&sign!==-1)throw new Error('Unknown isometric view');viewSign=sign;}
// Sprite baking is synchronous. Preview projection never leaks into the scene.
export function withView(sign,draw){const before=viewSign;setView(sign);try{return draw();}finally{setView(before);}}
export const project=(x,y,z=0,sign=viewSign)=>({x:(x-sign*y)*SX,y:(sign*x+y)*SY-z*SZ});
export const unproject=(x,y,sign=viewSign)=>({x:(x/SX+sign*y/SY)/2,y:(y/SY-sign*x/SX)/2});
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rect = (x, y, w, h) => [[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]];
export function bounds(polygon) {
  return { minX: Math.min(...polygon.map(p=>p[0])), maxX: Math.max(...polygon.map(p=>p[0])), minY: Math.min(...polygon.map(p=>p[1])), maxY: Math.max(...polygon.map(p=>p[1])) };
}
export function inside(x, y, polygon) {
  let hit=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,ay]=polygon[i],[bx,by]=polygon[j];
    if((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
  }
  return hit;
}
export function segmentDistanceSquared(x,y,a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  const t=den?clamp(((x-a[0])*dx+(y-a[1])*dy)/den,0,1):0;
  return (x-a[0]-t*dx)**2+(y-a[1]-t*dy)**2;
}
export function blocked(x,y,r,colliders) {
  for(const c of colliders) {
    const b=c.bounds;
    if(x+r<b.minX||x-r>b.maxX||y+r<b.minY||y-r>b.maxY)continue;
    if(inside(x,y,c.polygon)&&!(c.holes||[]).some(h=>inside(x,y,h)))return true;
    for(const ring of [c.polygon,...(c.holes||[])])for(let i=0;i<ring.length;i++)if(segmentDistanceSquared(x,y,ring[i],ring[(i+1)%ring.length])<r*r)return true;
  }
  return false;
}
export function moveCircle(position,dx,dy,r,colliders,limits) {
  let x=position.x,y=position.y;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/Math.max(.15,r*.6)));
  for(let i=0;i<steps;i++) {
    const nx=clamp(x+dx/steps,limits.minX+r,limits.maxX-r),ny=clamp(y+dy/steps,limits.minY+r,limits.maxY-r);
    if(!blocked(nx,ny,r,colliders)){x=nx;y=ny;continue;}
    if(!blocked(nx,y,r,colliders))x=nx;
    if(!blocked(x,ny,r,colliders))y=ny;
  }
  return {x,y};
}
export function screenDirection(horizontal,vertical,sign=viewSign) {
  const n=Math.hypot(horizontal,vertical)||1;
  return {x:(horizontal+sign*vertical)*SX/n,y:(vertical-sign*horizontal)*SX/n};
}
// Disjoint footprints that share rows/columns must be ordered on the other axis.
// Diagonal, unrelated entities can safely fall back to their ground anchors.
export function depthCompare(a,b,sign=viewSign) {
  const viewBounds=o=>sign===1?o.bounds:{...o.bounds,minX:-o.bounds.maxX,maxX:-o.bounds.minX};
  const A=viewBounds(a),B=viewBounds(b);
  const overlapX=A.maxX>B.minX+.001&&B.maxX>A.minX+.001;
  const overlapY=A.maxY>B.minY+.001&&B.maxY>A.minY+.001;
  if(overlapY){if(A.maxX<=B.minX+.001)return -1;if(B.maxX<=A.minX+.001)return 1;}
  if(overlapX){if(A.maxY<=B.minY+.001)return -1;if(B.maxY<=A.minY+.001)return 1;}
  return (sign*a.x+a.y)-(sign*b.x+b.y) || String(a.id).localeCompare(String(b.id));
}

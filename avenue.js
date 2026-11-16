import {tramAtTime,TRAM} from './tram-route.js';
import {STREET_DATA} from './avenue-data.js';
// Source track alignments are shared by paving, rail drawing, tram and minimap.
export const AVENUE=Object.freeze({north:-440,south:150,trackEnd:145,trackHalfWidth:2.2,halfGauge:.72,sleeperHalfWidth:.95});
export const TRACK_OFFSETS=Object.freeze([0,1]); // Track indices retained for render loops.
export const PARKS=STREET_DATA.parks;
export const CROSS_STREETS=STREET_DATA.crossStreets;
export function lineXAtY(points,y){
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    if(y>=Math.min(a[1],b[1])&&y<=Math.max(a[1],b[1])&&a[1]!==b[1])return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);
  }
  const p=points.reduce((a,b)=>Math.abs(a[1]-y)<Math.abs(b[1]-y)?a:b);return p[0];
}
export const trackCenterX=(y,track=1)=>lineXAtY(STREET_DATA.rails[track].points,y);
export const avenueCenterX=y=>(trackCenterX(y,0)+trackCenterX(y,1))/2;
export const roadEdgeX=(y,side)=>trackCenterX(y,side<0?0:1)+side*AVENUE.trackHalfWidth;
export const avenueSamples=(start=AVENUE.north,end=AVENUE.trackEnd)=>{
  const values=new Set([start,end]);
  for(const rail of STREET_DATA.rails)for(const [,y] of rail.points)if(y>start&&y<end)values.add(y);
  return [...values].sort((a,b)=>a-b);
};
// The chord between bogies smooths the small bends in the source polyline.
export function trackYaw(y,track=1){
  const halfWheelbase=5.2;
  return Math.atan2(trackCenterX(y+halfWheelbase,track)-trackCenterX(y-halfWheelbase,track),2*halfWheelbase);
}
export function tramPosition(time,direction=1){
  const state=tramAtTime(time,direction);return {...state,x:trackCenterX(state.y,state.track),yaw:trackYaw(state.y,state.track)};
}

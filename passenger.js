import {blocked,WALK_LIMITS} from './math.js';
import {trackCenterX} from './avenue.js';
export const PLAYER_SPEED=Object.freeze({walk:9.6,run:16});
export const PLAYER_SPAWN=Object.freeze({x:10.15,y:61});
export function doorsOpen(tram){return tram.phase==='stopped'&&tram.doors>=.8&&tram.remaining>1.5;}
// Exit on the alley side, clear of the stop pole, trees and street furniture.
export function landingPoint(tram,colliders){
  if(!tram.stop)return null;
  const side=tram.track===0?1:-1;
  for(const offset of [3.9,4.7,5.5])for(const dy of [0,1.5,-1.5,3,-3]){
    const y=tram.stop.y+dy,x=trackCenterX(y,tram.track)+side*offset;
    if(x>WALK_LIMITS.minX+.48&&x<WALK_LIMITS.maxX-.48&&y>WALK_LIMITS.minY+.48&&y<WALK_LIMITS.maxY-.48&&!blocked(x,y,.48,colliders))return {x,y};
  }
  return null;
}
export function canBoard(player,tram,colliders){
  if(!doorsOpen(tram)||tram.terminal)return false;
  const landing=landingPoint(tram,colliders),side=tram.track===0?1:-1;
  return !!landing&&Math.hypot(player.x-landing.x,player.y-landing.y)<=4.5&&(player.x-tram.x)*side>TRAM_HALF_WIDTH;
}
const TRAM_HALF_WIDTH=1.25;
export function shouldExit(ride,tram){return !!ride&&doorsOpen(tram)&&tram.stop.id!==ride.boardedStop&&(ride.exitRequested||tram.terminal);}

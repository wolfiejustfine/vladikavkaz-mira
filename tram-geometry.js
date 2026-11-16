// Rotate on the ground plane before isometric projection: verticals stay upright.
export function rotateTramPoint([x,y,z=0],yaw){
  const c=Math.cos(yaw),s=Math.sin(yaw);return [x*c+y*s,y*c-x*s,z];
}
// Quarter-degree sprite steps keep wheel alignment within ~2 cm over half a car.
export function tramRenderYaw(yaw){return Math.round(yaw*180/Math.PI*4)*Math.PI/720;}
export const TRAM_CACHE_LIMIT=40;

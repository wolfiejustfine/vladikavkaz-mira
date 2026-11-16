import {rotateTramPoint} from './tram-geometry.js';
import {getView,project} from './math.js';
// Original simplified drawing after Rartat's 2023 photograph of car 485.
export function drawTram(c,A,doors=0,direction=1,yaw=0){
  const original=A,point=([x,y,z])=>rotateTramPoint([x*direction,y*direction,z],yaw),view=getView()*direction;
  const projectLocal=(...p)=>project(...point(p));
  const rotatedBox=(c,x,y,w,d,h,color,z=0)=>{
    // Boxes used world-facing sides before rotation, independently of travel direction.
    const ring=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>rotateTramPoint([x*direction+u,y*direction+v,z],yaw));
    for(let i=0;i<4;i++){
      const a=ring[i],b=ring[(i+1)%4],dx=b[0]-a[0],dy=b[1]-a[1];
      if(getView()*dy-dx<=0)continue;
      original.polygon(c,[a,b,[b[0],b[1],z+h],[a[0],a[1],z+h]],original.tint(color,Math.abs(dx)>Math.abs(dy)?.88:getView()===1?.72:.94));
    }
    original.polygon(c,ring.map(([u,v])=>[u,v,z+h]),color);
  };
  A={box:rotatedBox,polygon:(c,ps,...rest)=>original.polygon(c,ps.map(point),...rest),line:(c,ps,...rest)=>original.line(c,ps.map(point),...rest)};
  const {box,polygon,line}=A,side=view*1.255,blue='#28548b',red='#cf5147',glass='#29464e',cream='#e4e7dc';
  const face=(y,z)=>[side,y,z];
  const panel=(y0,y1,z0,z1,color)=>polygon(c,[face(y0,z0),face(y1,z0),face(y1,z1),face(y0,z1)],color);
  box(c,0,0,2.05,14.8,.4,'#384b4a',.18);
  for(const y of [-5.2,5.2])for(const offset of [-.65,.65]){
    polygon(c,Array.from({length:24},(_,i)=>[side,y+offset+Math.cos(i*Math.PI/12)*.36,.4+Math.sin(i*Math.PI/12)*.36]),'#243b3c');
    polygon(c,Array.from({length:16},(_,i)=>[side+.015*view,y+offset+Math.cos(i*Math.PI/8)*.18,.4+Math.sin(i*Math.PI/8)*.18]),'#778781');
  }
  box(c,0,0,2.5,15.5,.68,blue,.43);box(c,0,0,2.5,15.5,1.94,blue,1.11);
  panel(-7.75,7.75,1.35,2.94,glass);panel(-7.75,7.75,.88,1.09,red);
  polygon(c,[face(-3.1,.45),face(3.2,.45),face(3.6,1.09),face(-3.6,1.09)],red);
  const doorCentres=[-5.35,0,5.2];
  for(let i=0;i<10;i++){
    const y=-7.35+i*1.46;if(view===-1&&doorCentres.some(d=>Math.abs(y+.48-d)<1.05))continue;
    panel(y,y+1.17,1.49,2.78,'#45676a');panel(y+.06,y+.43,1.57,2.7,'#6f8782');
    panel(y+.52,y+.56,1.49,2.78,'#abb9ad');panel(y,y+1.17,2.43,2.47,'#a1b1a5');
    // Restrained seat silhouettes behind glazing.
    panel(y+.17,y+.42,1.5,1.77,'#78866c');panel(y+.78,y+1.03,1.5,1.77,'#78866c');
  }
  if(view===-1)for(const y of doorCentres){
    panel(y-.76,y+.76,.44,2.92,'#243d40');panel(y-.72,y+.72,.43,.51,'#c6bd83');
    for(const sign of [-1,1]){
      const centre=y+sign*(.37+doors*.57),a=centre-.34,b=centre+.34;
      panel(a,b,.52,2.87,'#234148');panel(a+.06,b-.06,1.14,2.72,'#6b8580');panel(a,b,.6,.95,blue);
      line(c,[face(centre,1.36),face(centre,1.64)],'#d6d4b3',.04);
    }
  }
  if(direction===1){
  // Tapered cab with wraparound dark windscreen; travel is towards +y.
  polygon(c,[[-1.25,7.75,.44],[1.25,7.75,.44],[1.08,8.25,.54],[-1.08,8.25,.54]],blue);
  polygon(c,[[-1.08,8.25,.54],[1.08,8.25,.54],[1.04,8.07,2.96],[-1.04,8.07,2.96]],blue);
  polygon(c,[[side,7.75,.5],[view*1.08,8.25,.54],[view*1.04,8.07,2.96],[side,7.75,2.96]],blue);
  polygon(c,[[-.96,8.22,1.36],[.96,8.22,1.36],[.92,8.08,2.89],[-.92,8.08,2.89]],glass,'#94a99f',.035);
  for(const x of [-.48,.48])line(c,[[x,8.24,1.44],[x-.21,8.17,2.04]],'#172f34',.055);
  polygon(c,[[-.93,8.26,1.32],[.93,8.26,1.32],[.73,8.28,.68],[-.73,8.28,.68]],'#344e59','#829d9f',.035);
  for(const x of [-.8,.8]){
    box(c,x,8.28,.25,.07,.57,'#243d45',.73);
    for(const z of [.86,1.1])polygon(c,Array.from({length:16},(_,i)=>[x+Math.cos(i*Math.PI/8)*.07,8.33,z+Math.sin(i*Math.PI/8)*.07]),'#f1e8c8');
  }
  box(c,0,8.36,.25,.3,.18,'#82938c',.36);
  box(c,0,8.23,1.05,.13,.12,'#334d50',.49);
  }else{polygon(c,[[-1.25,-7.76,.45],[1.25,-7.76,.45],[1.25,-7.76,3.04],[-1.25,-7.76,3.04]],blue);polygon(c,[[-1,-7.78,1.5],[1,-7.78,1.5],[1,-7.78,2.8],[-1,-7.78,2.8]],glass);for(const x of [-.9,.9])box(c,x,-7.8,.16,.06,.22,red,.85);}
  box(c,0,0,2.58,15.65,.22,cream,3.03);box(c,0,-1.8,1.55,2.6,.28,'#b9c8c1',3.25);
  for(let y=-2.8;y<-1;y+=.25)line(c,[[-.65,y,3.54],[.65,y,3.54]],'#7d948b',.045);
  box(c,0,4.2,1.4,1.5,.2,'#c7d2c8',3.25);
  // Red diamond pantograph and contact shoe.
  for(const x of [-.35,.35])line(c,[[x,-2.4,3.48],[x,-4.1,4.42],[x,-2.2,5.26],[x,-.5,4.42],[x,-2.4,3.48]],'#ad514b',.085);
  line(c,[[-.8,-2.2,5.32],[.8,-2.2,5.32]],'#344e4b',.1);
  const text=(label,origin,axis,size,color)=>{
    const p=projectLocal(...origin),q=projectLocal(origin[0]+axis[0],origin[1]+axis[1],origin[2]),r=projectLocal(origin[0],origin[1],origin[2]-1);
    c.save();c.transform(q.x-p.x,q.y-p.y,r.x-p.x,r.y-p.y,p.x,p.y);c.fillStyle=color;c.font=`bold ${size}px Arial`;c.textAlign='center';c.fillText(label,0,0);c.restore();
  };
  text('485',[side+view*.015,2.3,1.05],[0,view,0],.24,'#f2e8cc');
  if(direction===1)text('МИРА',[0,8.11,2.65],[1,0,0],.18,'#e7ce86');
  if(direction===1)text('485',[0,8.3,1.08],[1,0,0],.23,'#dce4d5');
}

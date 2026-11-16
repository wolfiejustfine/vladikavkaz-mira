import {getView,project} from './math.js';
import {FOUNTAIN,MONUMENT_SIZE} from './landscape.js';

// Original Canvas geometry, observed from the reference photos in
// docs/lenina-square.md. No photographic pixels are embedded in the game.
const TAU=Math.PI*2;
const ring=(r,z,n=64)=>Array.from({length:n},(_,i)=>[Math.cos(i*TAU/n)*r,Math.sin(i*TAU/n)*r,z]);
function lathe(c,profile,color,A,cx=0,cy=0){
  const n=64,pt=(r,z,i)=>[cx+Math.cos(i*TAU/n)*r,cy+Math.sin(i*TAU/n)*r,z];
  for(let k=1;k<profile.length;k++){
    const [r0,z0]=profile[k-1],[r1,z1]=profile[k];
    for(let i=0;i<n;i++){
      const a=(i+.5)*TAU/n;
      if(getView()*Math.cos(a)+Math.sin(a)<0&&r1>=r0)continue;
      // Upper-facing sloping mouldings also expose their far side.
      if(getView()*Math.cos(a)+Math.sin(a)<0&&z1>z0&&r1<r0){
        A.polygon(c,[pt(r0,z0,i),pt(r0,z0,i+1),pt(r1,z1,i+1),pt(r1,z1,i)],A.tint(color,1.07));continue;
      }
      A.polygon(c,[pt(r0,z0,i),pt(r0,z0,i+1),pt(r1,z1,i+1),pt(r1,z1,i)],A.tint(color,.78+.21*(Math.cos(a-3.5)+1)/2));
    }
  }
  const [r,z]=profile.at(-1);A.polygon(c,ring(r,z).map(([x,y,h])=>[x+cx,y+cy,h]),A.tint(color,1.13));
}
function relief(c,outline,depth,color,A,z=0){
  // Sculptures face east. The second camera sees their backs, not a mirrored front.
  const face=(u,h,d)=>[d,-u,z+h],back=-depth/2,front=depth/2;
  const surfaces=outline.map((p,i)=>{const q=outline[(i+1)%outline.length];return{points:[face(...p,back),face(...q,back),face(...q,front),face(...p,front)],sort:(p[0]+q[0])/-2};});
  surfaces.sort((a,b)=>a.sort-b.sort).forEach(s=>A.polygon(c,s.points,A.tint(color,.74)));
  A.polygon(c,outline.map(p=>face(...p,getView()===1?front:back)),color,A.tint(color,.64),.025);
  return (u,h,d=front+.015)=>face(u,h,d);
}
function lenin(c,A,z){
  const bronze='#3e5049';
  // Shoes and long coat, straight weight-bearing legs; one hand at the lapel.
  for(const u of [-.27,.28])A.box(c,.11,-u,.62,.29,.18,bronze,z);
  const pt=relief(c,[[-.54,.2],[-.45,.96],[-.42,2.67],[-.25,2.93],[.3,2.94],[.55,2.68],[.43,1.8],[.59,.58],[.46,.26],[.08,.3],[-.03,.73],[-.18,.24]],.43,bronze,A,z);
  lathe(c,[[.11,z+2.85],[.19,z+2.98],[.24,z+3.2],[.2,z+3.42],[.08,z+3.51]],bronze,A,.02,0);
  A.box(c,.24,-.02,.13,.12,.13,bronze,z+3.14); // face profile
  if(getView()===1){
    A.line(c,[pt(-.24,2.87),pt(-.08,2.44),pt(.08,1.83),pt(.05,.76)],'#7a8674',.055);
    A.line(c,[pt(.34,2.77),pt(.53,2.3),pt(.15,2.42)],bronze,.22);
    A.line(c,[pt(.49,2.31),pt(.14,2.43)],'#7c8775',.055);
    A.line(c,[pt(-.42,2.55),pt(-.59,1.99),pt(-.57,1.65)],bronze,.21);
    const cap=Array.from({length:24},(_,i)=>pt(-.57+Math.cos(i*TAU/24)*.23,1.56+Math.sin(i*TAU/24)*.17,.27));
    A.polygon(c,cap,'#293f37','#6f7d6d',.04);
    for(const u of [.18,.28])A.line(c,[pt(u,.35),pt(u*.6,1.5)],'#56675c',.035);
  }else A.line(c,[pt(0,.35,backDepth()),pt(.07,2.65,backDepth())],'#637568',.04);
}
const backDepth=()=>-.24;
export function drawMonument(c,A){
  for(let i=0;i<4;i++)A.box(c,0,0,MONUMENT_SIZE.width-i*.65,MONUMENT_SIZE.depth-i*.65,.15,['#8c9690','#9ca49b','#849087','#939d93'][i],i*.15);
  A.box(c,0,0,4.45,4.2,.18,'#626e67',.6);
  lathe(c,[[1.96,.78],[1.9,.94],[1.6,1.2],[1.6,1.36],[1.48,1.44],[1.42,1.65],[1.25,1.84],[1.2,4.66],
    [1.28,4.73],[1.3,4.82],[1.51,4.94],[1.55,5.08],[1.36,5.18],[1.31,5.29]],'#47524d',A);
  for(const z of [1.43,1.65,2.37,3.1,3.84,4.68,4.85,5.09]){
    const r=z<1.8?1.48:z>4.8?1.5:1.23;
    // Sort angle on the visible half, avoiding a chord through the cylinder.
    const start=getView()===1?-Math.PI/4:Math.PI/4;
    A.line(c,Array.from({length:33},(_,i)=>[Math.cos(start+i*Math.PI/32)*r,Math.sin(start+i*Math.PI/32)*r,z]),'#788279',z>4.7?.055:.025);
  }
  for(const a of [.4,1.8,3.5,5.1])if(getView()*Math.cos(a)+Math.sin(a)>0)A.line(c,[[Math.cos(a)*1.23,Math.sin(a)*1.23,1.88],[Math.cos(a)*1.21,Math.sin(a)*1.21,4.65]],'#3a4842',.022);
  lenin(c,A,5.3);
}
function soslan(c,A){
  const bronze='#4e655b',z=3.85;
  // Raised knee, lifted hand and a transverse dagger, following the fountain photo.
  const pt=relief(c,[[-.28,0],[-.35,.43],[-.35,.94],[-.57,1.34],[-.48,1.65],[-.2,1.8],[.2,1.76],[.36,1.3],[.5,1.07],
    [.94,1.14],[1.07,.95],[.98,.7],[.57,.51],[.24,.68],[.09,.94],[.1,.48],[-.04,0]],.36,bronze,A,z);
  lathe(c,[[.14,z+1.62],[.21,z+1.82],[.18,z+2.02],[.06,z+2.19]],bronze,A,0,.09);
  A.line(c,[pt(.18,1.66),pt(.53,2.07),pt(.44,2.4),pt(.14,2.64)],bronze,.21);
  A.line(c,[pt(-.4,1.6),pt(-.69,1.35),pt(.2,1.27)],bronze,.23);
  A.line(c,[pt(-.6,1.36),pt(.15,1.27)],'#8c9b82',.045);
  A.line(c,[pt(.05,1.27),pt(.87,1.52)],'#95a18a',.075);
  A.line(c,[pt(.49,1.03),pt(.86,.97),pt(.54,.67)],'#81917c',.055);
  A.line(c,[pt(-.24,.08),pt(-.19,.83)],'#8b9982',.04);
  A.line(c,[pt(.44,2.37),pt(.2,2.59)],'#8b9982',.04);
}
export function drawFountain(c,A){
  const r=FOUNTAIN.radius,granite='#8c6c60',bronze='#526b60';
  lathe(c,[[r,0],[r,.43],[r+.02,.49]],granite,A);
  A.polygon(c,ring(r-.3,.35),'#6e9892');
  for(const rr of [1.7,2.2,3.2,3.65])A.line(c,[...ring(rr,.36),[rr,0,.36]],'#b4c9b5',.035);
  const spout=a=>{
    const x=Math.cos(a)*2.98,y=Math.sin(a)*2.98;
    const p=(d,z,t=0)=>[x+Math.cos(a)*d-Math.sin(a)*t,y+Math.sin(a)*d+Math.cos(a)*t,z];
    const curl=Array.from({length:21},(_,i)=>{const t=i/20*Math.PI*1.85;return p(Math.cos(t)*(.28-i*.006),.68+Math.sin(t)*.22);});
    A.line(c,curl,'#344e45',.2);A.line(c,curl,bronze,.14);
    A.line(c,[p(.1,.55),p(.21,.9),p(.14,1.14),p(-.12,1.35),p(-.23,1.2)],bronze,.19);
    A.line(c,[p(.04,1.14),p(.17,1.48)],bronze,.08);
    A.line(c,[p(.06,1.12),p(-.05,1.43)],bronze,.07);
    A.line(c,Array.from({length:25},(_,i)=>{const t=i/24;return p(-.23-t*1.33,1.2+.9*t-1.74*t*t);}), '#d9e4d2',.032);
  };
  const angles=Array.from({length:8},(_,i)=>i*TAU/8+.2),depth=a=>getView()*Math.cos(a)+Math.sin(a);
  angles.filter(a=>depth(a)<0).sort((a,b)=>depth(a)-depth(b)).forEach(spout);
  lathe(c,[[1.38,.36],[1.38,.56],[.99,.94],[.72,1.06],[.38,2.17],[.83,2.91],[.9,3.04]],granite,A);
  for(let i=0;i<8;i++){
    const a=i*TAU/8;
    if(depth(a)<0)continue;
    A.line(c,Array.from({length:19},(_,j)=>{const t=j/18;const rr=.67+Math.sin(t*Math.PI)*.35;return[Math.cos(a)*rr,Math.sin(a)*rr,.9+t*1.15];}),bronze,.19);
    A.line(c,[[Math.cos(a)*.6,Math.sin(a)*.6,.95],[Math.cos(a)*.42,Math.sin(a)*.42,1.9]],'#81917c',.04);
  }
  lathe(c,[[.49,3.04],[.6,3.1],[.78,3.39],[.78,3.65],[.91,3.75],[.88,3.82]],bronze,A);
  for(let i=0;i<14;i++){
    const a=i*TAU/14;if(depth(a)<0)continue;
    const p=(da,z,rr=.79)=>[Math.cos(a+da)*rr,Math.sin(a+da)*rr,z];
    A.line(c,Array.from({length:17},(_,j)=>{const t=j/16*TAU;return p(Math.cos(t)*.11,3.43+Math.sin(t)*.14);}), '#91a18a',.035);
  }
  soslan(c,A);
  for(let i=0;i<8;i++){
    const a=i*TAU/8;
    A.line(c,Array.from({length:33},(_,j)=>{const t=j/32,rr=.88+2.3*t;return[Math.cos(a)*rr,Math.sin(a)*rr,3.02+.6*t-3.23*t*t];}),'#e1e9da',.028);
  }
  angles.filter(a=>depth(a)>=0).sort((a,b)=>depth(a)-depth(b)).forEach(spout);
  // A true annulus leaves the basin and sculpture visible through its opening.
  for(let i=0;i<64;i++){
    const a=i*TAU/64,b=(i+1)*TAU/64,p=(r,t)=>[Math.cos(t)*r,Math.sin(t)*r,.51];
    A.polygon(c,[p(r+.02,a),p(r+.02,b),p(r-.28,b),p(r-.28,a)],'#b49b89');
    if(i%4===0)A.line(c,[p(r+.02,a),p(r-.28,a)],'#6f5b53',.025);
  }
}
export function drawSquareBench(c,A,turn){
  const a=turn*Math.PI/2,pt=([x,y,z])=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a),z];
  const rail=(pts,color,width)=>A.line(c,pts.map(pt),color,width);
  const metal='#3d514c',wood='#aa7656';
  for(const x of [-1.02,1.02]){
    rail([[x,.35,.03],[x,.24,.22],[x,.08,.46],[x,-.26,.42],[x,-.34,.08]],metal,.1);
    rail([[x,-.3,.15],[x,-.34,.91]],metal,.085);
    rail([[x,-.3,.7],[x,-.03,.74],[x,.3,.71],[x,.33,.53]],metal,.08);
  }
  for(let i=0;i<5;i++){
    const y=-.28+i*.13;
    A.polygon(c,[[-1.27,y,.48],[1.27,y,.48],[1.27,y+.095,.48],[-1.27,y+.095,.48]].map(pt),wood,'#d1a278',.018);
  }
  for(let i=0;i<3;i++)A.polygon(c,[[-1.27,-.34,.66+i*.12],[1.27,-.34,.66+i*.12],[1.27,-.36,.75+i*.12],[-1.27,-.36,.75+i*.12]].map(pt),wood,'#d4a782',.02);
  for(const x of [-1.02,1.02])for(const z of [.7,.82,.94]){
    const p=project(...pt([x,-.365,z]));c.fillStyle='#3d514c';c.beginPath();c.arc(p.x,p.y,.025,0,TAU);c.fill();
  }
}

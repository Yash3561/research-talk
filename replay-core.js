/* Display-only kinematics. Geometry follows the authored MuJoCo XML model. */
(() => {
  const project=(p,z0,s)=>[160+s*(.7071*p[0]-.7071*p[1]),94+s*(.2988*p[0]+.2988*p[1]-.9063*(p[2]-z0))];
  const fmt=p=>p.map(v=>v.toFixed(2)).join(',');
  function sample(trace,t){let lo=0,hi=trace.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(trace[mid][0]<=t)lo=mid;else hi=mid-1;}return {row:trace[lo],index:lo,ended:t>trace.at(-1)[0]+.051};}
  function pose(svg,trace,time){
    const {row:q,index}=sample(trace,time),z0=trace[0][3];
    const extent=Math.max(.9,...trace.map(r=>Math.max(Math.abs(r[1]),Math.abs(r[2]),Math.abs(r[3]-z0))));
    const scale=Math.min(115,135/(extent+.45));
    const [w,x,y,z]=q.slice(4,8),rot=p=>[
      (1-2*(y*y+z*z))*p[0]+2*(x*y-z*w)*p[1]+2*(x*z+y*w)*p[2],
      2*(x*y+z*w)*p[0]+(1-2*(x*x+z*z))*p[1]+2*(y*z-x*w)*p[2],
      2*(x*z-y*w)*p[0]+2*(y*z+x*w)*p[1]+(1-2*(x*x+y*y))*p[2]];
    const world=p=>rot(p).map((v,i)=>v+q[i+1]),screen=p=>project(world(p),z0,scale);
    const path=points=>points.map((p,i)=>(i?'L':'M')+fmt(project(p,z0,scale))).join(' ');
    const ring=Array.from({length:49},(_,i)=>[.5*Math.cos(i*Math.PI/24),.5*Math.sin(i*Math.PI/24),z0]);
    let html=`<path class="pose-grid" d="${path([[-1,0,z0],[1,0,z0]])} ${path([[0,-1,z0],[0,1,z0]])}"/><path class="pose-limit" d="${path(ring)}"/><path class="pose-trail" d="${path(trace.slice(0,index+1).map(r=>r.slice(1,4)))}"/>`;
    const verts=[[-.27,-.17,-.08],[.27,-.17,-.08],[.27,.17,-.08],[-.27,.17,-.08],[-.27,-.17,.08],[.27,-.17,.08],[.27,.17,.08],[-.27,.17,.08]];
    const faces=[[0,1,2,3],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]];
    const shapes=faces.map(face=>({points:face.map(i=>verts[i]),kind:'pose-body'}));
    for(let j=0;j<2;j++){
      const armX=j===0?.28:-.28,a=q[8+j];
      const joint=p=>[armX+Math.cos(a)*p[0]+Math.sin(a)*p[2],p[1],-Math.sin(a)*p[0]+Math.cos(a)*p[2]];
      html+=`<path class="pose-arm" d="M${fmt(screen(joint([0,-.3,0])))}L${fmt(screen(joint([0,.3,0])))}"/>`;
      for(const side of [-.3,.3])shapes.push({kind:'pose-rotor',points:Array.from({length:25},(_,i)=>joint([.09*Math.cos(i*Math.PI/12),side+.09*Math.sin(i*Math.PI/12),0]))});
    }
    const depth=p=>{const v=world(p);return .6409*v[0]+.6409*v[1]+.4226*v[2];};
    shapes.sort((a,b)=>a.points.reduce((s,p)=>s+depth(p),0)/a.points.length-b.points.reduce((s,p)=>s+depth(p),0)/b.points.length);
    for(const shape of shapes)html+=`<polygon class="${shape.kind}" points="${shape.points.map(p=>fmt(screen(p))).join(' ')}"/>`;
    svg.innerHTML=html;
    svg.setAttribute('aria-label',`Recorded robot pose at ${q[0].toFixed(2)} seconds; height ${q[3].toFixed(2)} metres, horizontal distance ${q[22].toFixed(2)} metres`);
    return q;
  }
  window.RecordedReplay={sample,pose};
})();

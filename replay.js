(() => {
  'use strict';
  const $=s=>document.querySelector(s),R=window.RecordedReplay;
  const methods=['integral','planner','pd'],names={integral:'Integral feedback',planner:'Predictive planner',pd:'PD feedback'},colors={integral:'#ba613b',planner:'#087e78',pd:'#537fbc'};
  let manifest,data,time=0,playing=false,frameID=null,lastFrame=null,lastTick=-1,loadID=0;
  const cache=new Map();
  const failLabels={attitude:'body tilt',workspace:'workspace',return_not_settled:'return/settling',target_not_held:'target hold',contact:'contact',geometry_clearance:'geometry clearance'};
  function card(m){const v=data.methods[m];return `<article class="robot-card ${m}"><header><h2>${names[m]}</h2></header><svg id="pose-${m}" viewBox="0 0 320 188" role="img" aria-label="Recorded robot pose"></svg><div class="live-values"><div><span>HEIGHT</span><strong id="z-${m}">—</strong></div><div><span>XY DISTANCE</span><strong id="xy-${m}">—</strong></div><div><span>BODY TILT</span><strong id="tilt-${m}">—</strong></div></div><div class="joint-values" id="joint-${m}"></div><details class="motor-details"><summary>Rotor commands · N · 0–30</summary>${[0,1,2,3].map(i=>`<div class="motor-row"><span>${i+1}</span><div class="motor-track"><i id="bar-${m}-${i}"></i></div><output id="motor-${m}-${i}"></output></div>`).join('')}</details><p class="live-screen" id="screen-${m}"></p><p class="recorded-outcome">Final recorded outcome: <strong>${v.success?'COMPLETED':'FAILED'}</strong><span>${v.failures.length?'Failed criteria: '+v.failures.map(f=>failLabels[f]||f).join(', '):'All recorded task criteria passed.'}</span></p></article>`;}
  const charts=[['z',3,'m',null],['xy',22,'m',.5],['tilt',23,'°',30]];
  let domains={};
  function initCharts(){for(const [id,col,unit,limit] of charts){
    const values=methods.flatMap(m=>data.methods[m].trace.map(r=>r[col]));let lo=id==='z'?Math.min(0,...values):0,hi=Math.max(limit||0,...values);hi=Math.max(hi,lo+.1);const pad=(hi-lo)*.12;hi+=pad;if(id==='z')lo-=pad;domains[id]=[lo,hi];
    const y=v=>164-135*(v-lo)/(hi-lo);let html='';for(let i=0;i<4;i++){const value=lo+(hi-lo)*i/3,yy=y(value);html+=`<path class="grid" d="M55 ${yy}H540"/><text x="2" y="${yy+4}">${value.toFixed(1)}${unit}</text>`;}
    html+='<text x="55" y="190">0 s</text><text x="255" y="190">3 s</text><text x="520" y="190">7 s</text>';
    if(limit!==null)html+=`<path class="limit" d="M55 ${y(limit)}H540"/><text x="360" y="${y(limit)-5}">${limit}${unit} limit</text>`;
    for(const m of methods)html+=`<path id="line-${id}-${m}" class="series" stroke="${colors[m]}"/><circle id="dot-${id}-${m}" class="dot" fill="${colors[m]}" r="3.5"/>`;
    $('#chart-'+id).innerHTML=html;
  }}
  function paint(force=false){
    $('#clock').textContent=time.toFixed(2)+' / 7.00 s';$('#scrub').value=Math.round(time*1000);$('#scrub').setAttribute('aria-valuetext',time.toFixed(2)+' seconds');$('#play').textContent=playing?'Pause replay':time>=7?'Replay again':'Play replay';$('#play').setAttribute('aria-pressed',String(playing));
    if(!data)return;const tick=methods.map(m=>R.sample(data.methods[m].trace,time).index).join(',');if(!force&&tick===lastTick)return;lastTick=tick;
    for(const m of methods){const tr=data.methods[m].trace,{row:q,index,ended}=R.sample(tr,time);R.pose($('#pose-'+m),tr,time);
      $('#z-'+m).textContent=q[3].toFixed(2)+' m';$('#xy-'+m).textContent=q[22].toFixed(2)+' m';$('#tilt-'+m).textContent=q[23].toFixed(1)+'°';$('#joint-'+m).textContent=`Rotor joints: ${(q[8]*180/Math.PI).toFixed(1)}° / ${(q[9]*180/Math.PI).toFixed(1)}° · speed ${Math.hypot(...q.slice(10,13)).toFixed(2)} m/s`;
      for(let i=0;i<4;i++){$('#bar-'+m+'-'+i).style.width=(q[18+i]/30*100)+'%';$('#motor-'+m+'-'+i).textContent=q[18+i].toFixed(1);}
      const flags=[];if(q[22]>.5)flags.push('Outside XY boundary');if(q[23]>30)flags.push('Tilt above 30°');if(ended)flags.push('Recording ended; last pose held');$('#screen-'+m).textContent=flags.join(' · ')||'Current sample: within plotted XY and tilt limits';$('#screen-'+m).classList.toggle('exceeded',flags.length>0);
      for(const [id,col] of charts){const [lo,hi]=domains[id],x=t=>55+485*t/7,y=v=>164-135*(v-lo)/(hi-lo);$('#line-'+id+'-'+m).setAttribute('d',tr.slice(0,index+1).map((r,i)=>(i?'L':'M')+x(r[0]).toFixed(2)+','+y(r[col]).toFixed(2)).join(' '));$('#dot-'+id+'-'+m).setAttribute('cx',x(q[0]));$('#dot-'+id+'-'+m).setAttribute('cy',y(q[col]));}
    }
  }
  function sync(){if(!playing||!data||document.hidden){if(frameID!==null)cancelAnimationFrame(frameID);frameID=null;lastFrame=null;return;}if(frameID===null)frameID=requestAnimationFrame(frame);}
  function frame(now){frameID=null;if(!playing||document.hidden){sync();return;}time=Math.min(7,time+(lastFrame===null?0:Math.min(.1,(now-lastFrame)/1000)));lastFrame=now;if(time>=7)playing=false;paint();sync();}
  async function load(id){
    const request=++loadID;playing=false;sync();$('#play').disabled=true;$('#load-status').textContent='Loading recorded states…';
    try{
      let next=cache.get(id);if(!next){const response=await fetch('assets/replays/'+encodeURIComponent(id)+'.json');if(!response.ok)throw new Error('HTTP '+response.status);next=await response.json();cache.set(id,next);if(cache.size>3)cache.delete(cache.keys().next().value);}
      if(request!==loadID)return;data=next;time=0;lastTick=-1;$('#robots').innerHTML=methods.map(card).join('');initCharts();paint(true);$('#play').disabled=false;$('#load-status').textContent='Three audited recordings · synchronized playback';
      const n=manifest.cases.findIndex(c=>c.id===id);$('#case-prev').disabled=n===0;$('#case-next').disabled=n===manifest.cases.length-1;history.replaceState(null,'','?case='+encodeURIComponent(id));
    }catch(error){if(request===loadID)$('#load-status').textContent='Could not load this recording. '+error.message;}
  }
  $('#play').addEventListener('click',()=>{if(!data)return;if(time>=7)time=0;playing=!playing;paint();sync();});
  $('#reset').addEventListener('click',()=>{playing=false;time=0;paint(true);sync();});
  $('#scrub').addEventListener('input',()=>{playing=false;time=Number($('#scrub').value)/1000;paint(true);sync();});
  $('#case-select').addEventListener('change',()=>load($('#case-select').value));
  for(const [id,direction] of [['case-prev',-1],['case-next',1]])$('#'+id).addEventListener('click',()=>{if(!manifest)return;const n=manifest.cases.findIndex(c=>c.id===$('#case-select').value),c=manifest.cases[n+direction];if(c){$('#case-select').value=c.id;load(c.id);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;paint();}sync();});window.addEventListener('pagehide',()=>{playing=false;sync();});
  (async()=>{try{const response=await fetch('assets/replays/index.json');if(!response.ok)throw new Error('HTTP '+response.status);manifest=await response.json();$('#case-select').innerHTML=manifest.cases.map(c=>`<option value="${c.id}">${c.id} · completed: ${methods.filter(m=>c.outcomes[m]).map(m=>m==='planner'?'planner':m==='pd'?'PD':'integral').join(', ')||'none'}</option>`).join('');$('#case-select').disabled=false;const requested=new URLSearchParams(location.search).get('case'),id=manifest.cases.some(c=>c.id===requested)?requested:'fresh-g000-w1-s0';$('#case-select').value=id;await load(id);}catch(error){$('#load-status').textContent='Unable to load case index. '+error.message;}})();
})();

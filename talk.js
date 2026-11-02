(() => {
  'use strict';
  const $ = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)];
  const D = window.TALK_EVIDENCE, slides = all('.slide');
  let chapter=1, playing=false, time=0, frameID=null, lastFrame=null;
  const modal=$('#methods'), reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(n) { if(n>=1 && n<=slides.length) location.hash=String(n); }
  function render() {
    const value=Number(location.hash.slice(1));chapter=Number.isInteger(value)&&value>=1&&value<=6?value:1;
    playing=false;syncReplay();paintTrace();
    slides.forEach((s,i)=>{s.hidden=i!==chapter-1;s.classList.toggle('active',i===chapter-1);});
    all('[data-slide]').forEach(b=>{if(Number(b.dataset.slide)===chapter)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('#page-number').textContent=String(chapter).padStart(2,'0');$('#previous').disabled=chapter===1;$('#next').disabled=chapter===6;
    const title=$('#title-'+chapter).textContent.replace(/\s+/g,' ').trim();
    document.title=title+' — Yash Chaudhary';$('#announcement').textContent=`Chapter ${chapter} of 6: ${title}`;
    window.scrollTo({top:0,behavior:'instant'});
  }
  function geometry() {
    const angle=Number($('#tilt').value),r=angle*Math.PI/180,force=96,scale=1.9;
    const x=120+force*scale*Math.sin(r),y=247-force*scale*Math.cos(r);
    $('#tilt-value').textContent=angle+'°';$('#lift-value').textContent=(force*Math.cos(r)).toFixed(1)+' N';
    $('#total-force').setAttribute('x2',x);$('#total-force').setAttribute('y2',y);$('#vertical-force').setAttribute('y2',y);$('#force-guide').setAttribute('d',`M120 ${y}H${x}`);
  }
  let lastPoseTick=-1;
  function initTrace() { $('#case-id').textContent=D.recorded_case.id; }
  function paintTrace() {
    $('#trace-time').textContent=time.toFixed(2)+' s';$('#scrub').value=Math.round(time*1000);
    $('#scrub').setAttribute('aria-valuetext',time.toFixed(2)+' seconds');
    $('#play').textContent=playing?'Pause replay':time>=7?'Replay again':'Play replay';$('#play').setAttribute('aria-pressed',String(playing));
    const tick=['planner','integral'].map(m=>window.RecordedReplay.sample(D.recorded_case.trajectories[m].pose_trace,time).index).join(',');if(tick===lastPoseTick)return;lastPoseTick=tick;
    for(const method of ['planner','integral']) {
      const tr=D.recorded_case.trajectories[method].trace;
      let end=0;for(let i=1;i<tr.length&&tr[i].t<=time;i++)end=i;
      const visible=tr.slice(0,end+1),q=tr[end],xx=t=>60+550*t/7;
      const path=f=>visible.map((v,i)=>`${i?'L':'M'}${xx(v.t).toFixed(2)},${f(v).toFixed(2)}`).join(' ');
      const xy=v=>125-100*v.xy;
      $('#'+method+'-xy').setAttribute('d',path(xy));
      for(const [name,y] of [['xy',xy(q)]]){$('#'+method+'-'+name+'-dot').setAttribute('cx',xx(q.t));$('#'+method+'-'+name+'-dot').setAttribute('cy',y);}
      window.RecordedReplay.pose($('#pose-'+method),D.recorded_case.trajectories[method].pose_trace,time);
      $('#live-'+method).textContent=`z ${q.z.toFixed(2)} m · XY ${q.xy.toFixed(2)} m · tilt ${q.attitude.toFixed(1)}°`;
    }
  }
  function canPlay(){return playing&&chapter===4&&!document.hidden&&!modal.open;}
  function syncReplay(){
    if(!canPlay()){if(frameID!==null)cancelAnimationFrame(frameID);frameID=null;lastFrame=null;return;}
    if(frameID===null)frameID=requestAnimationFrame(frame);
  }
  function frame(now){
    frameID=null;if(!canPlay()){lastFrame=null;return;}
    const delta=lastFrame===null?0:Math.min(.1,(now-lastFrame)/1000);lastFrame=now;time=Math.min(7,time+delta);
    if(time===7)playing=false;paintTrace();syncReplay();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.slide)go(Number(b.dataset.slide));
    if(b.id==='previous')go(chapter-1);if(b.id==='next')go(chapter+1);
    if(b.id==='methods-open'){modal.showModal();syncReplay();}
    if(b.id==='methods-close')modal.close();
    if(b.id==='play'){if(time>=7)time=0;playing=!playing;paintTrace();syncReplay();}
    if(b.id==='fullscreen'){
      const promise=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
      promise?.catch(()=>{});
    }
  });
  document.addEventListener('input',e=>{
    if(e.target.id==='tilt')geometry();
    if(e.target.id==='scrub'){playing=false;time=Math.max(0,Math.min(7,Number(e.target.value)/1000));paintTrace();syncReplay();}
  });
  document.addEventListener('keydown',e=>{
    if(modal.open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    if(['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End'].includes(e.key))e.preventDefault();
    if(['ArrowRight','PageDown'].includes(e.key))go(chapter+1);if(['ArrowLeft','PageUp'].includes(e.key))go(chapter-1);
    if(e.key==='Home')go(1);if(e.key==='End')go(6);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;paintTrace();}syncReplay();});
  modal.addEventListener('close',syncReplay);
  document.addEventListener('fullscreenchange',()=>{$('#fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen ↗';});
  window.addEventListener('hashchange',render);
  if(reduced)document.documentElement.classList.add('reduced-motion');
  initTrace();geometry();render();
})();

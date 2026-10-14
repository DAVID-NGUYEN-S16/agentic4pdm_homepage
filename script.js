'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const contexts = {
  grs:'Geometry-Stratified Response-Stability (GRS) selects windows to cover diverse observed regimes. Evaluation windows: UO 763, PU 906, and MCC5 1,152. The mean is unweighted across the three public datasets.',
  bfh:'Baseline-Failure Hard (BFH) selects 100 approximately class-balanced windows per public dataset from cases misclassified by a large fraction of the frozen baseline registry. The mean is unweighted across the three datasets.',
  bel:'Bel is the customer’s production-line bearing inspection dataset. All 330 test samples are evaluated, preserving the customer-defined distribution without BFH or GRS selection.'
};
let setting = 'grs', metric = 'f1';
function renderTable() {
  const columns = setting === 'bel' ? ['bel'] : ['uo','pu','mcc5','avg'];
  const label = c => ({uo:'UO',pu:'PU',mcc5:'MCC5',avg:'Mean',bel:'Bel · full set'}[c]);
  const rankColumn = setting === 'bel' ? 'bel' : 'avg';
  const rows = [...window.RESULTS].sort((a,b)=>b.scores[setting][rankColumn][metric]-a.scores[setting][rankColumn][metric]);
  const best = Object.fromEntries(columns.map(c=>[c,Math.max(...rows.map(r=>r.scores[setting][c][metric]))]));
  $('#benchmark-description').textContent = contexts[setting];
  $('#benchmark-caption').textContent = `${setting.toUpperCase()} · ${metric==='f1'?'Macro-F1':'Accuracy'} (%) · standard mode · sorted by ${setting==='bel'?'Bel score':'public-dataset mean'}`;
  $('#benchmark-table').classList.toggle('bel-table',setting==='bel');
  $('#benchmark-table thead').innerHTML = `<tr><th scope="col">Method</th>${columns.map(c=>`<th scope="col">${label(c)}</th>`).join('')}</tr>`;
  $('#benchmark-table tbody').innerHTML = rows.map(r=>`<tr class="${r.name==='Agentic4PDM'?'ours-row':''}"><th scope="row">${esc(r.name)}<span class="group-label">${esc(r.group)}</span></th>${columns.map(c=>{const value=r.scores[setting][c][metric];return `<td class="${value===best[c]?'best':''}" data-dataset="${c}">${value.toFixed(2)}</td>`;}).join('')}</tr>`).join('');
  $$('[data-setting]').forEach(b=>{const active=b.dataset.setting===setting;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});
  $('#benchmark-panel').setAttribute('aria-labelledby',`tab-${setting}`);
}
$$('[data-setting]').forEach(b=>b.addEventListener('click',()=>{setting=b.dataset.setting;renderTable();}));
$('#metric-select').addEventListener('change',e=>{metric=e.target.value;renderTable();});
$('.tabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  const tabs=$$('[data-setting]'),index=tabs.indexOf(document.activeElement);if(index<0)return;e.preventDefault();
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  tabs[next].click();tabs[next].focus();
});
renderTable();
const figureTitles = {'workflow':'Agentic4PDM framework','main-results':'Results across three evaluation settings','prediction-revisions':'Revising fitted-model predictions','adaptivity':'Sample-specific investigation plans'};
const dialog=$('#figure-dialog');let zoom=1;
function setZoom(value){zoom=Math.max(1,Math.min(4,value));$('#dialog-image').style.width=`${zoom*100}%`;$('#zoom-out').disabled=zoom===1;$('#zoom-in').disabled=zoom===4;}
$$('[data-figure]').forEach(b=>b.addEventListener('click',()=>{
  const name=b.dataset.figure;
  $('#figure-dialog-title').textContent=figureTitles[name];
  $('#dialog-image').src=`assets/figures/${name}.png`;$('#dialog-image').alt=b.dataset.caption;
  $('#dialog-caption').textContent=b.dataset.caption;$('#original-figure').href=`assets/figures/${name}.pdf`;
  setZoom(1);dialog.showModal();$('.dialog-image-area').scrollTo(0,0);
}));
$('#close-dialog').addEventListener('click',()=>dialog.close());
$('#zoom-in').addEventListener('click',()=>setZoom(zoom+.5));
$('#zoom-out').addEventListener('click',()=>setZoom(zoom-.5));
$('#figure-dialog').addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#copy-citation').addEventListener('click',async()=>{
  const text=$('#citation-text').textContent;
  try {
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
    else {const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const copied=document.execCommand('copy');area.remove();if(!copied)throw new Error('Copy unavailable');}
    $('#copy-status').textContent='BibTeX copied to clipboard.';$('#copy-citation').textContent='Copied ✓';setTimeout(()=>$('#copy-citation').textContent='Copy',2000);
  }catch{const selection=window.getSelection(),range=document.createRange();range.selectNodeContents($('#citation-text'));selection.removeAllRanges();selection.addRange(range);$('#copy-status').textContent='Citation selected for manual copying.';$('#copy-citation').textContent='Text selected';}
});
function closeMenu(){$('#navigation').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}
$('#menu-toggle').addEventListener('click',()=>{const open=$('#navigation').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
$$('#navigation a').forEach(a=>a.addEventListener('click',closeMenu));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.filter(e=>e.isIntersecting).forEach(e=>{$$('#navigation a').forEach(a=>a.classList.toggle('active',a.hash===`#${e.target.id}`));});},{rootMargin:'-15% 0px -70% 0px'});$$('section[id]').forEach(s=>observer.observe(s));}

// Fetch the demo MP4 only after the visitor presses Play (fast-start file, plays while it downloads).
const demoVideo = $('#demo-video'), demoPlay = $('#demo-play'), demoStatus = $('#demo-status');
function demoFailed(message) {
  demoVideo.pause(); demoVideo.removeAttribute('src'); demoVideo.load(); demoVideo.controls = false;
  demoPlay.hidden = false; demoPlay.disabled = false; demoPlay.querySelector('span').textContent = 'Try again';
  demoStatus.textContent = message;
}
async function startDemo() {
  demoPlay.disabled = true; demoPlay.querySelector('span').textContent = 'Loading…'; demoStatus.textContent = '';
  demoVideo.addEventListener('error', () => demoFailed('The video could not load. Please try again.'), {once:true});
  if (!demoVideo.getAttribute('src')) demoVideo.src = demoVideo.dataset.src;
  demoVideo.controls = true; demoPlay.hidden = true; demoPlay.disabled = false;
  try { await demoVideo.play(); } catch { demoStatus.textContent = 'Press Play in the video controls to start.'; }
}
if (demoPlay) demoPlay.addEventListener('click', startDemo);
// Chapters: start the video if needed, then jump to the chosen chapter.
const demoChapters = $$('.demo-chapters button');
function seekDemo(t) {
  const go = () => { demoVideo.currentTime = t; demoVideo.play().catch(() => {}); };
  if (!demoVideo.getAttribute('src')) { startDemo(); demoVideo.addEventListener('loadedmetadata', go, {once:true}); }
  else if (demoVideo.readyState >= 1) go(); else demoVideo.addEventListener('loadedmetadata', go, {once:true});
}
demoChapters.forEach((b) => b.addEventListener('click', () => seekDemo(Number(b.dataset.t))));
demoVideo.addEventListener('timeupdate', () => {
  let cur = null; demoChapters.forEach((b) => { if (demoVideo.currentTime >= Number(b.dataset.t) - .2) cur = b; });
  demoChapters.forEach((b) => b.classList.toggle('active', b === cur));
});

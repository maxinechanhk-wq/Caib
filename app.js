
const BANK=window.CAIB2_BANK||{flashcards:[],mcq:[],fill:[]};
const $=s=>document.querySelector(s); const $$=s=>Array.from(document.querySelectorAll(s));
const S=JSON.parse(localStorage.caib2Progress||'{"done":{},"wrong":{},"book":{},"score":{"mcq":{"correct":0,"wrong":0},"fill":{"correct":0,"wrong":0},"flash":{"know":0,"dont":0}}}');
S.score=S.score||{mcq:{correct:0,wrong:0},fill:{correct:0,wrong:0},flash:{know:0,dont:0}};
S.score.mcq=S.score.mcq||{correct:0,wrong:0}; S.score.fill=S.score.fill||{correct:0,wrong:0}; S.score.flash=S.score.flash||{know:0,dont:0};
const save=()=>localStorage.caib2Progress=JSON.stringify(S);
const chapters=[...new Set([...BANK.flashcards,...BANK.mcq,...BANK.fill].map(x=>x.chapter||'General'))]; let state={view:'home',chapter:'All',idx:0,show:false,mode:'flash'};
function items(type){let key=type==='flash'?'flashcards':type; return BANK[key].filter(x=>state.chapter==='All'||x.chapter===state.chapter)}
function chapterSelect(){return `<label>Chapter</label><select id="chapter"><option>All</option>${chapters.map(c=>`<option ${state.chapter===c?'selected':''}>${c}</option>`).join('')}</select>`}
function bindChapter(){let c=$('#chapter'); if(c)c.onchange=e=>{state.chapter=e.target.value;state.idx=0;state.show=false;render()}}
function go(v){state.view=v; $$('.view').forEach(x=>x.classList.add('hide')); $('#'+v).classList.remove('hide'); render()} $$('.tab').forEach(b=>b.onclick=()=>go(b.dataset.go));
function mark(id,type,ok=true){
  S.done[id]=(S.done[id]||0)+1;
  if(!ok)S.wrong[id]=(S.wrong[id]||0)+1;
  if(type==='mcq'){ ok?S.score.mcq.correct++:S.score.mcq.wrong++; }
  if(type==='fill'){ ok?S.score.fill.correct++:S.score.fill.wrong++; }
  if(type==='flash'){ ok?S.score.flash.know++:S.score.flash.dont++; }
  save();
}
function scoreLine(type){
  let sc=S.score[type]||{};
  if(type==='mcq'||type==='fill'){
    let c=sc.correct||0,w=sc.wrong||0,t=c+w,p=t?Math.round(c/t*100):0;
    return `<div class="scorebox"><b>Score</b><span>${c}/${t} correct · ${p}%</span></div>`;
  }
  let k=sc.know||0,d=sc.dont||0,t=k+d,p=t?Math.round(k/t*100):0;
  return `<div class="scorebox"><b>Cards</b><span>${k}/${t} know · ${p}%</span></div>`;
}
function home(){let counts={Flashcards:BANK.flashcards.length,MCQ:BANK.mcq.length,Fill:BANK.fill.length,Chapters:chapters.length}; $('#home').innerHTML=`<div class="grid">${Object.entries(counts).map(([k,v])=>`<div class="card tile"><b>${v}</b><span>${k}</span></div>`).join('')}</div><div class="panel" style="margin-top:14px"><b>Ready to study?</b><p class="small">Practice flashcards, MCQ, and fill-in-the-blank questions. Progress is stored on this device.</p><div class="row"><button class="btn" onclick="go('flash')">Start Flashcards</button><button class="btn secondary" onclick="go('mcq')">Practice MCQ</button></div></div>`}
function flash(){let arr=items('flash'), q=arr[state.idx%Math.max(arr.length,1)]; $('#flash').innerHTML=`<div class="panel">${chapterSelect()}${scoreLine('flash')}<div class="row toprow"><span class="pill">${arr.length?state.idx+1:0}/${arr.length}</span><button class="btn secondary" id="shuffle">Shuffle</button></div>${!q?'<p>No cards.</p>':`<div class="card flash" id="flip">${state.show?(q.back||''):(q.front||'')}</div><div class="meta">${q.chapter||''} · ${q.id||''}</div><div class="row"><button class="btn bad" id="dont">Don’t know</button><button class="btn good" id="know">Know</button><button class="btn secondary" id="next">Next</button></div>`}</div>`; bindChapter(); if(q){$('#flip').onclick=()=>{state.show=!state.show;render()}; $('#next').onclick=()=>{state.idx=(state.idx+1)%arr.length;state.show=false;render()}; $('#know').onclick=()=>{mark(q.id,'flash',true);state.idx=(state.idx+1)%arr.length;state.show=false;render()}; $('#dont').onclick=()=>{mark(q.id,'flash',false);state.show=true;render()}; $('#shuffle').onclick=()=>{state.idx=Math.floor(Math.random()*arr.length);state.show=false;render()}}}
function getAnswerIndex(q){
  const opts=q.options||[];
  let a=q.answer;
  if(typeof a==='number') return (a>=1 && a<=opts.length)?a-1:a;
  a=String(a??'').trim();
  if(/^[A-D]$/i.test(a)) return a.toUpperCase().charCodeAt(0)-65;
  const n=parseInt(a,10);
  if(!isNaN(n)) return (n>=1 && n<=opts.length)?n-1:n;
  return opts.findIndex(o=>String(o).trim().toLowerCase()===a.toLowerCase());
}
function mcq(){let arr=items('mcq'), q=arr[state.idx%Math.max(arr.length,1)], answered=false; $('#mcq').innerHTML=`<div class="panel">${chapterSelect()}${scoreLine('mcq')}<div class="row toprow"><span class="pill">${arr.length?state.idx+1:0}/${arr.length}</span><button class="btn secondary" id="random">Random</button></div>${!q?'<p>No MCQ.</p>':`<div class="q">${q.question||''}</div><div id="opts">${(q.options||[]).map((o,i)=>`<button class="option" data-i="${i}">${String.fromCharCode(65+i)}. ${o}</button>`).join('')}</div><div id="ex"></div><div class="meta">${q.chapter||''} · ${q.id||''}</div><button class="btn" id="next">Next</button>`}</div>`; bindChapter(); if(q){let ans=getAnswerIndex(q); $$('.option').forEach(b=>b.onclick=()=>{if(answered)return; answered=true; let i=+b.dataset.i, ok=i===ans; b.classList.add(ok?'correct':'wrong'); if(!ok) $$('.option')[ans]?.classList.add('correct'); $('#ex').innerHTML=`<div class="answer"><b>${ok?'Correct':'Review'}</b><br>${q.explanation||q.answerText||q.options?.[ans]||''}</div>`; mark(q.id,'mcq',ok)}); $('#next').onclick=()=>{state.idx=(state.idx+1)%arr.length;render()}; $('#random').onclick=()=>{state.idx=Math.floor(Math.random()*arr.length);render()}}}
function fill(){let arr=items('fill'), q=arr[state.idx%Math.max(arr.length,1)]; $('#fill').innerHTML=`<div class="panel">${chapterSelect()}${scoreLine('fill')}<div class="row toprow"><span class="pill">${arr.length?state.idx+1:0}/${arr.length}</span><button class="btn secondary" id="random">Random</button></div>${!q?'<p>No fill blanks.</p>':`<div class="q">${q.prompt||q.question||''}</div><input id="ans" placeholder="Type answer"><div id="fb"></div><div class="meta">${q.chapter||''} · ${q.id||''}</div><div class="row"><button class="btn" id="check">Check</button><button class="btn secondary" id="next">Next</button></div>`}</div>`; bindChapter(); if(q){$('#check').onclick=()=>{let a=$('#ans').value.trim().toLowerCase(); let correct=String(q.answer||'').trim().toLowerCase(); let ok=a&&correct&& (a===correct || correct.includes(a)); $('#fb').innerHTML=`<div class="answer"><b>${ok?'Correct':'Answer'}</b><br>${q.answer||''}</div>`; mark(q.id,'fill',ok)}; $('#next').onclick=()=>{state.idx=(state.idx+1)%arr.length;render()}; $('#random').onclick=()=>{state.idx=Math.floor(Math.random()*arr.length);render()}}}
function stats(){let total=BANK.flashcards.length+BANK.mcq.length+BANK.fill.length, done=Object.keys(S.done).length, wrong=Object.keys(S.wrong).length, pct=total?Math.round(done/total*100):0; let mcqT=(S.score.mcq.correct||0)+(S.score.mcq.wrong||0), fillT=(S.score.fill.correct||0)+(S.score.fill.wrong||0), flashT=(S.score.flash.know||0)+(S.score.flash.dont||0); let mcqPct=mcqT?Math.round(S.score.mcq.correct/mcqT*100):0, fillPct=fillT?Math.round(S.score.fill.correct/fillT*100):0, flashPct=flashT?Math.round(S.score.flash.know/flashT*100):0; $('#stats').innerHTML=`<div class="panel"><h2>Progress & Score</h2><p>${done}/${total} items attempted</p><div class="bar"><i style="width:${pct}%"></i></div><div class="scoregrid"><div><b>MCQ</b><span>${S.score.mcq.correct}/${mcqT} · ${mcqPct}%</span></div><div><b>Fill</b><span>${S.score.fill.correct}/${fillT} · ${fillPct}%</span></div><div><b>Cards</b><span>${S.score.flash.know}/${flashT} · ${flashPct}%</span></div><div><b>Wrong Bank</b><span>${wrong} items</span></div></div><button class="btn bad" id="reset">Reset Progress</button></div>`; $('#reset').onclick=()=>{if(confirm('Reset all progress?')){localStorage.removeItem('caib2Progress'); location.reload()}}}
function render(){home(); if(state.view==='flash')flash(); if(state.view==='mcq')mcq(); if(state.view==='fill')fill(); if(state.view==='stats')stats()}
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); render();

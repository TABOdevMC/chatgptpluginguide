const BADGE_CATALOG = [
  {id:'spark',name:'Première étincelle',desc:'Valider ton premier niveau.',type:'spark',test:s=>s.done>=1},
  {id:'climber',name:'Grimpeur',desc:'Atteindre 25 % de la formation.',type:'climb',test:s=>s.pct>=25},
  {id:'half',name:'À mi-chemin',desc:'Atteindre 50 % de la formation.',type:'half',test:s=>s.pct>=50},
  {id:'threequarters',name:'Presque maître',desc:'Atteindre 75 % de la formation.',type:'orbit',test:s=>s.pct>=75},
  {id:'week',name:'Flamme de 7 jours',desc:'Apprendre pendant 7 jours consécutifs.',type:'flame',test:s=>s.streak>=7},
  {id:'fortnight',name:'Rythme de fer',desc:'Apprendre pendant 14 jours consécutifs.',type:'bolt',test:s=>s.streak>=14},
  {id:'month',name:'Habitude forgée',desc:'Apprendre pendant 30 jours consécutifs.',type:'forge',test:s=>s.streak>=30},
  {id:'specialist',name:'Spécialiste Paper',desc:'Terminer un parcours complet.',type:'medal',test:s=>s.finished>=1},
  {id:'architect',name:'Architecte de plugins',desc:'Terminer 3 parcours complets.',type:'castle',test:s=>s.finished>=3},
  {id:'paperdev',name:'Paper Developer',desc:'Terminer tous les parcours.',type:'crown',test:s=>s.finished===s.totalCourses}
];

function badgeIcon(type,locked=false){
  const glow=locked?'#4d5b78':'#9fb8ff';
  const accent=locked?'#66738d':'#c9d7ff';
  const common=`width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"`;
  const lock=locked?`<path d="M24 30v-5a8 8 0 0 1 16 0v5" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><rect x="19" y="29" width="26" height="22" rx="5" fill="${glow}"/><circle cx="32" cy="40" r="2.8" fill="#09111f"/>`:'';
  const body={
    spark:`<path d="M32 7l4.5 14.5L51 26l-14.5 4.5L32 45l-4.5-14.5L13 26l14.5-4.5L32 7Z" fill="${glow}"/><circle cx="49" cy="47" r="4" fill="${accent}"/><circle cx="15" cy="48" r="2.5" fill="${accent}"/>`,
    climb:`<path d="M18 51V14h29v8H27v7h16v8H27v14" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 14l9 9-9 9" stroke="${glow}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    half:`<circle cx="32" cy="32" r="23" stroke="${glow}" stroke-width="6"/><path d="M32 9a23 23 0 0 1 0 46" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><path d="M24 32h16" stroke="${accent}" stroke-width="4" stroke-linecap="round"/>`,
    orbit:`<circle cx="32" cy="32" r="10" fill="${accent}"/><ellipse cx="32" cy="32" rx="25" ry="11" stroke="${glow}" stroke-width="3" transform="rotate(-25 32 32)"/><circle cx="12" cy="42" r="3" fill="${accent}"/>`,
    flame:`<path d="M36 8c3 9-5 10 2 17 5 5 9 10 8 17-1 10-9 16-19 14-10-2-16-10-15-19 1-8 7-12 12-17 4-4 4-8 4-12 3 2 6 6 8 10 2-4 2-6 0-10Z" fill="${glow}"/><path d="M32 29c4 5 7 8 5 13-1 4-4 6-7 5-4-1-6-4-5-8 1-3 4-5 7-10Z" fill="${accent}"/>`,
    bolt:`<path d="M35 5L13 35h14l-3 24 27-33H37l-2-21Z" fill="${glow}"/><path d="M35 8l-5 22" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>`,
    forge:`<path d="M18 41c0-10 7-12 12-16 4-4 4-9 3-14 8 5 14 12 14 20 0 4-1 7-3 10 4 0 7 2 9 5H16c1-3 1-4 2-5Z" fill="${glow}"/><path d="M25 44c0-6 4-8 7-11 3 3 7 6 7 11 0 5-3 8-7 8s-7-3-7-8Z" fill="${accent}"/>`,
    medal:`<circle cx="32" cy="38" r="17" fill="${glow}"/><path d="M24 8h16l-4 15-4-3-4 3-4-15Z" fill="${accent}"/><path d="M32 28l3 6 6 .5-4.5 4 1.5 6-6-3.2-6 3.2 1.5-6-4.5-4 6-.5 3-6Z" fill="#09111f"/>`,
    castle:`<path d="M11 52V25l7 5 7-7 7 7 7-7 7 7 7-5v27H11Z" fill="${glow}"/><path d="M25 52V39h14v13" fill="${accent}"/><path d="M18 18h28v5H18z" fill="${accent}"/><path d="M23 9h18v9H23z" fill="${glow}"/>`,
    crown:`<path d="M9 18l12 10 11-18 11 18 12-10-5 31H14L9 18Z" fill="${glow}"/><path d="M16 44h32" stroke="${accent}" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="10" r="4" fill="${accent}"/><circle cx="9" cy="18" r="3" fill="${accent}"/><circle cx="55" cy="18" r="3" fill="${accent}"/>`
  }; return `<svg ${common}>${locked?lock:body[type]}</svg>`;
}

function dayKey(value){const d=new Date(value);return Number.isNaN(d.getTime())?null:new Intl.DateTimeFormat('en-CA',{timeZone:'UTC'}).format(d)}
function learningStreak(){
  const days=new Set((progress.history||[]).map(x=>dayKey(x.at)).filter(Boolean));
  if(!days.size)return {current:0,active:false,days:[]};
  const sorted=[...days].sort().reverse();
  let streak=1;
  for(let i=0;i<sorted.length-1;i++){
    const a=new Date(sorted[i]+'T00:00:00Z'),b=new Date(sorted[i+1]+'T00:00:00Z');
    if((a-b)/86400000===1)streak++;else break;
  }
  const today=dayKey(new Date().toISOString());
  const active=sorted[0]===today;
  return {current:streak,active,days:sorted};
}
function badgeStats(){
  const courses=Object.values(COURSES),total= courses.reduce((n,c)=>n+c.levels.length,0);
  const done=Object.keys(progress.completed||{}).filter(k=>{const[a,b]=k.split(':');return !!COURSES[a]?.levels?.[Number(b)]}).length;
  const finished=courses.filter(c=>c.levels.every((_,i)=>complete(c.id,i))).length;
  const streak=learningStreak();
  return {total,done,pct:total?Math.round(done/total*100):0,finished,totalCourses:courses.length,streak:streak.current,activeStreak:streak.active};
}
function earnedBadges(){const s=badgeStats();return BADGE_CATALOG.filter(b=>{try{return b.test(s)}catch{return false}})}

function drawBadges(){
  const root=document.querySelector('#badgeGrid');if(!root)return;
  const earned=new Set(earnedBadges().map(b=>b.id));
  root.innerHTML=BADGE_CATALOG.map(b=>`<article class="badge-card-v2 ${earned.has(b.id)?'earned':'locked'}"><div class="badge-art">${badgeIcon(b.type,!earned.has(b.id))}</div><div class="badge-copy"><strong>${esc(b.name)}</strong><p>${esc(b.desc)}</p></div><span class="badge-pill">${earned.has(b.id)?'Débloqué':'Verrouillé'}</span></article>`).join('');
}

function renderProgress(){
  const root=document.querySelector('#progressView');if(!root||root.classList.contains('hidden'))return;
  const s=badgeStats(),p=s.pct,earned=earnedBadges();
  const courses=Object.values(COURSES).map(c=>{const d=c.levels.filter((_,i)=>complete(c.id,i)).length,q=Math.round(d/c.levels.length*100);return `<div class="dash-course"><div class="dash-course-icon">${c.icon}</div><div class="dash-course-info"><div class="dash-course-head"><strong>${esc(c.name)}</strong><span>${d}/${c.levels.length} · ${q}%</span></div><div class="progress"><i style="width:${q}%"></i></div></div></div>`}).join('');
  const history=(progress.history||[]).slice(0,10).map(x=>`<div class="history-row"><span>✓ ${esc(x.course)} — ${esc(x.title)}</span><time>${date(x.at)}</time></div>`).join('');
  root.innerHTML=`<section class="hero compact dashboard-hero"><span class="eyebrow">TABLEAU DE BORD</span><h1>Ta progression Paper.</h1><p>Progresse, garde ta série d’apprentissage et débloque des badges.</p></section><section class="progress-hero card"><div class="progress-hero-main"><div><span class="eyebrow">PROGRESSION GLOBALE</span><div class="big-progress-number">${p}%</div><p class="muted">${s.done} niveaux terminés sur ${s.total}</p></div><div class="progress-circle" style="--pct:${p}%"><span>${p}%</span></div></div><div class="progress"><i style="width:${p}%"></i></div></section><section class="dashboard-stats"><div class="dash-stat card"><span class="dash-stat-icon">📚</span><div><small>Niveaux</small><strong>${s.done}/${s.total}</strong></div></div><div class="dash-stat card"><span class="dash-stat-icon">🔥</span><div><small>Série</small><strong>${s.streak} jour${s.streak>1?'s':''}</strong></div><em>${s.activeStreak?'active':'—'}</em></div><div class="dash-stat card"><span class="dash-stat-icon">🏁</span><div><small>Parcours</small><strong>${s.finished}/${s.totalCourses}</strong></div></div><div class="dash-stat card"><span class="dash-stat-icon">🏅</span><div><small>Badges</small><strong>${earned.length}/${BADGE_CATALOG.length}</strong></div></div></section><section class="dashboard-columns"><div class="card"><div class="section-head"><div><span class="eyebrow">COMPÉTENCES</span><h2>Progression par parcours</h2></div></div>${courses}</div><div class="card"><div class="section-head"><div><span class="eyebrow">SÉRIE</span><h2>${s.activeStreak?'Tu es en feu 🔥':'Reviens demain pour relancer la série'}</h2></div></div><div class="streak-hero"><div class="streak-flame">${badgeIcon('flame',false)}</div><div><strong>${s.streak} jour${s.streak>1?'s':''}</strong><p class="muted">Chaque jour où tu valides au moins un niveau compte dans ta série.</p></div></div><div class="mini-progress"><div class="mini-progress-label"><span>Objectif prochain badge</span><span>${Math.max(0,7-s.streak) || 0} jour${Math.max(0,7-s.streak)>1?'s':''}</span></div><div class="progress"><i style="width:${Math.min(100,s.streak/7*100)}%"></i></div></div></div></section><section class="card badge-section"><div class="section-head"><div><span class="eyebrow">COLLECTION</span><h2>Badges</h2><p class="muted">Une petite collection de récompenses plus rares et plus personnelles.</p></div><span class="badge-count">${earned.length}/${BADGE_CATALOG.length}</span></div><div id="badgeGrid" class="badge-grid-v2"></div></section><section class="card activity-section"><div class="section-head"><div><span class="eyebrow">ACTIVITÉ</span><h2>Dernières validations</h2></div></div>${history||'<p class="muted">Aucune validation pour le moment.</p>'}</section>`;
  drawBadges();
}

function renderBadges(){drawBadges()}

let previousBadgeIds=new Set();
function checkNewBadges(){
  const now=new Set(earnedBadges().map(b=>b.id));
  now.forEach(id=>{if(!previousBadgeIds.has(id)){const b=BADGE_CATALOG.find(x=>x.id===id);if(b&&previousBadgeIds.size>0)toast(`🏅 Badge débloqué : ${b.name}`)}});
  previousBadgeIds=now;
}

previousBadgeIds=new Set(earnedBadges().map(b=>b.id));
setInterval(()=>{checkNewBadges();const v=document.querySelector('#progressView');if(v&&!v.classList.contains('hidden'))renderProgress()},1200);

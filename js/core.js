
let STORAGE_AVAILABLE = true;
function safeStorageGet(key){
try{return window.localStorage ? localStorage.getItem(key) : null;}
catch(e){STORAGE_AVAILABLE=false; console.warn('Storage unavailable:', e && e.message ? e.message : e); return null;}
}
function safeStorageSet(key,value){
try{if(!window.localStorage) return false; localStorage.setItem(key,value); STORAGE_AVAILABLE=true; return true;}
catch(e){STORAGE_AVAILABLE=false; console.warn('Storage save unavailable:', e && e.message ? e.message : e); return false;}
}
function storageNotice(){
return STORAGE_AVAILABLE ? '' : '<div class="item warn"><b>Локальное сохранение недоступно</b><br><span class="small muted">Откройте файл через браузер Safari/Chrome или используйте собранный HTML на хостинге. Сейчас данные работают как временная сессия.</span></div>';
}

function freshProject(title='Новый проект', niche=''){
const id='p_'+Date.now()+'_'+Math.random().toString(16).slice(2);
return {id,title,niche,status:'Бриф',createdAt:today(),updatedAt:today(),briefAnswers:{},services:[],competitors:[],marketUtp:[],usedUtp:[],pains:[],portrait:'',keywords:[],tasks:[],materials:{photo:'',video:'',reviews:'',logo:'',brandbook:'',price:''},kpi:{weeklyBudget:0,desiredOrdersWeek:0,targetLeadCost:0,leadToSale:0,avgCheck:0,margin:0},manual:{utps:'',hypotheses:'',ads:'',analysisNote:''},strategyBlocks:{utps:[],hypotheses:[],ads:[]},files:[],importLog:[]};
}
function today(){return new Date().toISOString().slice(0,10)}
function loadState(){
try{
const raw=safeStorageGet(STORE_KEY);
if(raw){
  const parsed=JSON.parse(raw);
  if(parsed.projects?.length) return migrateState(parsed);
}
for(const key of LEGACY_STORE_KEYS){
  const legacyRaw=safeStorageGet(key);
  if(legacyRaw){
    const legacy=JSON.parse(legacyRaw);
    if(legacy.projects?.length){
      legacy.schemaVersion = SCHEMA_VERSION;
      safeStorageSet(STORE_KEY, JSON.stringify(legacy));
      return migrateState(legacy);
    }
  }
}
}catch(e){console.warn('State load error',e)}
return migrateState({activeProjectId:SAMPLE_PROJECT.id, projects:[SAMPLE_PROJECT], settings:{theme:'hybrid',weights:defaultWeights()}, schemaVersion:SCHEMA_VERSION});
}
function migrateState(data){
data.schemaVersion = SCHEMA_VERSION;
data.settings = data.settings || {};
data.settings.theme = data.settings.theme || 'hybrid';
data.settings.weights = {...defaultWeights(), ...(data.settings.weights||{})};
data.settings.ui = {showProjectIds:true, confirmDelete:true, ...(data.settings.ui||{})};
data.projects = (data.projects||[]).map(p=>({
...freshProject(p.title||'Проект', p.niche||''),
...p,
kpi:{...freshProject().kpi, ...(p.kpi||{})},
materials:{...freshProject().materials, ...(p.materials||{})},
manual:{...freshProject().manual, ...(p.manual||{})},
strategyBlocks:{utps:[],hypotheses:[],ads:[], ...(p.strategyBlocks||{})},
files:p.files||[],
importLog:p.importLog||[]
}));
data.site = normalizeSiteData(data.site);
if(!data.activeProjectId && data.projects[0]) data.activeProjectId=data.projects[0].id;
return data;
}
let saveTimer=null;
function saveState(){
clearTimeout(saveTimer);
saveTimer=setTimeout(()=>safeStorageSet(STORE_KEY, JSON.stringify(state)),250);
}
function saveStateNow(){return safeStorageSet(STORE_KEY, JSON.stringify(state));}
function currentProject(){return state.projects.find(p=>p.id===state.activeProjectId)||state.projects[0];}
function setCurrent(id){state.activeProjectId=id; saveStateNow(); renderAll(); showToast('Проект открыт');}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function nl2br(s){return esc(s).replace(/\n/g,'<br>')}
function number(v){return Number(String(v??'').replace(/[^0-9.,-]/g,'').replace(',','.'))||0;}
function fmt(n){return Math.round(number(n)).toLocaleString('ru-RU')}
function pct(n){return Math.round(number(n))+'%'}
function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n))}
function avg(arr){return arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:0}
function statusPill(status){const map={'Бриф':'gray','Автоанализ':'purple','Запуск':'amber','В работе':'green','Отчет':'green'};return `<span class="pill ${map[status]||'gray'}">${esc(status||'Бриф')}</span>`}
function showToast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function openNewProjectModal(){document.getElementById('projectModal').classList.add('open')}
function createProject(){const title=document.getElementById('newTitle').value.trim()||'Новый проект';const niche=document.getElementById('newNiche').value.trim();const p=freshProject(title,niche);p.status=document.getElementById('newStatus').value;state.projects.unshift(p);state.activeProjectId=p.id;saveStateNow();closeModal('projectModal');renderAll();showToast('Проект создан')}

function navTo(view){
closeMobileNav();activeView=view;document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById('view-'+view).classList.add('active');document.getElementById('pageTitle').textContent=PAGE_META[view][0];document.getElementById('pageSubtitle').textContent=PAGE_META[view][1];const mt=document.getElementById('mobilePageTitle');if(mt)mt.textContent=PAGE_META[view][0];renderTopActions();renderView(view);}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.view)));
function renderAll(){renderTopActions();renderView(activeView)}
function renderView(view){({projects:renderProjects,project:renderProject,brief:renderBrief,import:renderImport,analysis:renderAnalysis,report:renderReport,site:renderSite,settings:renderSettings}[view]||renderProjects)();}

function defaultWeights(){return {demand:35,balance:25,economics:22,client:10,materials:8};}
function ensureState(){
state.settings=state.settings||{};
state.settings.theme=state.settings.theme||'hybrid';
state.settings.weights={...defaultWeights(),...(state.settings.weights||{})};
state.settings.workspaceName=state.settings.workspaceName||'Agency Brief Systems';
state.settings.ui={showProjectIds:true,confirmDelete:true,...(state.settings.ui||{})};
state.settings.defaultProjectStatus=state.settings.defaultProjectStatus||'Бриф';
state.site=normalizeSiteData(state.site);
state.projects=(state.projects||[]).map(p=>{p.materials=p.materials||{photo:'',video:'',reviews:'',logo:'',brandbook:'',price:''};p.kpi=p.kpi||{weeklyBudget:0,desiredOrdersWeek:0,targetLeadCost:0,leadToSale:0,avgCheck:0,margin:0};p.manual=p.manual||{utps:'',hypotheses:'',ads:'',analysisNote:''};p.strategyBlocks=p.strategyBlocks||{utps:[],hypotheses:[],ads:[]};p.files=p.files||[];return p;});
}
function applyTheme(){document.body.setAttribute('data-theme', state.settings?.theme || 'hybrid');}
function setSiteTheme(theme){state.settings=state.settings||{};state.settings.theme=theme;saveState();applyTheme();renderSettings();showToast('Тема сайта изменена');}
function setWeight(key,val){state.settings=state.settings||{};state.settings.weights=state.settings.weights||defaultWeights();state.settings.weights[key]=number(val);saveState();renderSettings();}
function resetWeights(){state.settings=state.settings||{};state.settings.weights=defaultWeights();saveState();renderSettings();showToast('Веса алгоритма сброшены');}
function getWeights(){return {...defaultWeights(),...(state.settings?.weights||{})};}
function renderTopActions(){
const root=document.getElementById('topActions'); if(!root)return;
if(activeView==='projects') root.innerHTML='<button class="btn" onclick="downloadTemplate()">Скачать Excel-шаблон</button><button class="btn primary" onclick="openNewProjectModal()">+ Новый проект</button>';
else if(activeView==='project') root.innerHTML='<button class="btn" onclick="navTo(\'projects\')">← Все проекты</button><button class="btn" onclick="navTo(\'brief\')">Бриф</button><button class="btn primary" onclick="navTo(\'analysis\')">Автоанализ</button>';
else if(activeView==='settings') root.innerHTML='<button class="btn" onclick="navTo(\'project\')">Карточка проекта</button>';
else root.innerHTML='<button class="btn" onclick="navTo(\'project\')">Карточка проекта</button><button class="btn" onclick="navTo(\'projects\')">Все проекты</button>';
}
function setProjectField(k,v){const p=currentProject(); if(!p)return; p[k]=v; p.updatedAt=today(); saveState();}
function setProjectStatus(v){setProjectField('status',v); renderTopActions(); renderProject();}
function briefSectionStats(p){return BRIEF_SECTIONS.map(sec=>{const total=sec.questions.length; const filled=sec.questions.filter(q=>(p.briefAnswers?.[q.id]||'').trim()).length; return {title:sec.title,total,filled,progress:Math.round(filled/total*100)};});}
function nextActions(p){
const actions=[]; const readiness=calcReadiness(p), risks=calcRisks(p), best=bestServices(p);
if(briefStats(p).progress<70) actions.push('Дозаполнить бриф минимум до 70%, чтобы автоанализ был точнее.');
if(!(p.services||[]).length) actions.push('Загрузить статистику спроса и предложения через Excel, чтобы алгоритм приоритизировал услуги.');
if(!number(p.kpi?.margin)||!number(p.kpi?.avgCheck)) actions.push('Уточнить средний чек и маржу: без экономики нельзя принять решение по бюджету и CPL.');
if(!String(p.materials?.photo||'').trim()) actions.push('Получить реальные фото/видео работ: это влияет на доверие и конверсию объявлений.');
if(risks.length) actions.push('Закрыть первые риски: '+risks.slice(0,2).map(r=>r.title.toLowerCase()).join(', ')+'.');
if(best[0]) actions.push('Подготовить тестовую связку по направлению «'+best[0].name+'»: оффер, УТП, объявления, гео и KPI.');
if(readiness.score>75) actions.push('Проект готов к тестовому запуску: можно согласовывать бюджет, объявления и план ведения.');
return actions.slice(0,6);
}
function executiveSummary(p){
const best=bestServices(p), risks=calcRisks(p), kpi=kpiMath(p), stats=briefStats(p), readiness=calcReadiness(p);
const lines=[];
lines.push(`Проект «${p.title||'без названия'}» находится на этапе «${p.status||'Бриф'}». Готовность к запуску рекламы — ${readiness.score}/100, бриф заполнен на ${stats.progress}%.`);
if(best[0]) lines.push(`Главный рекламный приоритет сейчас — «${best[0].name}» (${best[0].score}/100). Это направление нужно проверить первым, потому что по нему лучший баланс спроса, конкуренции и готовности данных.`);
else lines.push('Приоритет услуг пока не рассчитан: нужно загрузить статистику или добавить услуги вручную.');
if(kpi.possibleCpl) lines.push(`По текущей цели ориентир CPL для выполнения плана — около ${fmt(kpi.possibleCpl)} ₽. Это нужно сверить с реальной допустимой ценой лида.`);
if(risks.length) lines.push(`Главные зоны внимания: ${risks.slice(0,3).map(r=>r.title.toLowerCase()).join(', ')}.`);
return lines.join('\n\n');
}

function analysisStrategyText(p){
return buildStrategy(p)+(p.manual?.analysisNote?'\n\nРучная заметка: '+p.manual.analysisNote:'');
}

function materialStatus(v){return String(v||'').trim()?'<span class="pill green">есть</span>':'<span class="pill amber">уточнить</span>';}
function manualLines(p,key){return String(p.manual?.[key]||'').split('\n').map(x=>x.trim()).filter(Boolean);}
function saveManualBlock(key,val){const p=currentProject(); p.manual=p.manual||{}; p.manual[key]=val; p.updatedAt=today(); saveState();}
function combinedUtps(p){return [...manualLines(p,'utps'),...generateUtps(p)].slice(0,10);}
function combinedHypotheses(p){return [...manualLines(p,'hypotheses').map((x,i)=>({name:'Ручная гипотеза '+(i+1),text:x})),...generateHypotheses(p)].slice(0,10);}
function combinedAds(p){return [...manualLines(p,'ads').map((x,i)=>{const [title,...rest]=x.split(' — ');return {title:title||('Ручное объявление '+(i+1)),text:rest.join(' — ')||x};}),...generateAds(p)].slice(0,10);}


function blockId(){return 'b_'+Date.now()+'_'+Math.random().toString(16).slice(2)}
function normalizeBlocksArray(arr){return Array.isArray(arr)?arr.filter(Boolean):[]}
function ensureStrategyBlocks(p){
p.strategyBlocks=p.strategyBlocks||{utps:[],hypotheses:[],ads:[]};
p.strategyBlocks.utps=normalizeBlocksArray(p.strategyBlocks.utps);
p.strategyBlocks.hypotheses=normalizeBlocksArray(p.strategyBlocks.hypotheses);
p.strategyBlocks.ads=normalizeBlocksArray(p.strategyBlocks.ads);
if(!p.strategyBlocks.utps.length){
const manual=manualLines(p,'utps').map(x=>({id:blockId(),title:x,text:'',source:'manual',deleted:false}));
const auto=generateUtps(p).slice(0,7).map(x=>({id:blockId(),title:x,text:'',source:'algorithm',deleted:false}));
p.strategyBlocks.utps=[...manual,...auto];
}
if(!p.strategyBlocks.hypotheses.length){
const manual=manualLines(p,'hypotheses').map((x,i)=>({id:blockId(),title:'Ручная гипотеза '+(i+1),text:x,source:'manual',deleted:false}));
const auto=generateHypotheses(p).slice(0,7).map(x=>({id:blockId(),title:x.name||'Гипотеза',text:x.text||'',source:'algorithm',deleted:false}));
p.strategyBlocks.hypotheses=[...manual,...auto];
}
if(!p.strategyBlocks.ads.length){
const manual=manualLines(p,'ads').map((x,i)=>{const parts=x.split(' — ');return {id:blockId(),title:parts[0]||('Ручное объявление '+(i+1)),text:parts.slice(1).join(' — ')||x,source:'manual',deleted:false};});
const auto=generateAds(p).slice(0,7).map(x=>({id:blockId(),title:x.title||'Объявление',text:x.text||'',source:'algorithm',deleted:false}));
p.strategyBlocks.ads=[...manual,...auto];
}
return p.strategyBlocks;
}
function activeStrategyBlocks(p,type){ensureStrategyBlocks(p);return (p.strategyBlocks[type]||[]).filter(b=>!b.deleted)}
function addStrategyBlock(type){const p=currentProject(); if(!p)return; ensureStrategyBlocks(p); const labels={utps:'Новое УТП',hypotheses:'Новая гипотеза',ads:'Новое объявление'}; p.strategyBlocks[type].unshift({id:blockId(),title:labels[type]||'Новый блок',text:'',source:'manual',deleted:false});p.updatedAt=today();saveState();renderAnalysis();}
function updateStrategyBlock(type,id,field,value){const p=currentProject(); if(!p)return; ensureStrategyBlocks(p); const b=(p.strategyBlocks[type]||[]).find(x=>x.id===id); if(!b)return; b[field]=value; b.source=b.source==='algorithm'?'edited':b.source; p.updatedAt=today();saveState();}
function deleteStrategyBlock(type,id){const p=currentProject(); if(!p)return; ensureStrategyBlocks(p); const b=(p.strategyBlocks[type]||[]).find(x=>x.id===id); if(!b)return; b.deleted=true; p.updatedAt=today();saveState();renderAnalysis();showToast('Блок удален');}
function resetStrategyBlocks(type){const p=currentProject(); if(!p)return; p.strategyBlocks=p.strategyBlocks||{utps:[],hypotheses:[],ads:[]}; p.strategyBlocks[type]=[]; ensureStrategyBlocks(p); p.updatedAt=today();saveState();renderAnalysis();showToast('Блоки пересобраны алгоритмом');}
function renderEditableBlocks(type,title,description){
const p=currentProject(); ensureStrategyBlocks(p); const blocks=activeStrategyBlocks(p,type);
const titleLabel=type==='utps'?'Формулировка':'Название';
const textLabel=type==='utps'?'Расшифровка / комментарий':'Описание';
return `<div class="card"><div class="split"><div><h2>${esc(title)}</h2><p class="muted">${esc(description)}</p></div><div class="actions"><button class="btn" onclick="addStrategyBlock('${type}')">+ Добавить</button><button class="btn" onclick="resetStrategyBlocks('${type}')">Пересобрать</button></div></div><div class="divider"></div><div class="list">${blocks.map(b=>`<div class="editable-block"><div class="block-top"><span class="pill ${b.source==='algorithm'?'purple':b.source==='edited'?'amber':'green'}">${b.source==='algorithm'?'алгоритм':b.source==='edited'?'отредактировано':'вручную'}</span><button class="btn danger" onclick="deleteStrategyBlock('${type}','${b.id}')">Удалить</button></div><div class="field"><label>${titleLabel}</label><input value="${esc(b.title||'')}" oninput="updateStrategyBlock('${type}','${b.id}','title',this.value)"></div><div class="field"><label>${textLabel}</label><textarea oninput="updateStrategyBlock('${type}','${b.id}','text',this.value)" placeholder="Можно дописать детали, условия, сегмент, канал или доказательство">${esc(b.text||'')}</textarea></div></div>`).join('')||'<div class="empty">Блоков пока нет. Нажмите «Добавить» или «Пересобрать».</div>'}</div></div>`;
}
function strategyTextForReport(type){const p=currentProject(); return activeStrategyBlocks(p,type).map(b=>({name:b.title||'',text:b.text||''}));}

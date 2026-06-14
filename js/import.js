function renderImport(){
const p=currentProject();
const root=document.getElementById('view-import');
root.innerHTML=`
<div class="grid cols-2"><div class="card"><div class="split"><div><h2>Импорт данных</h2></div><span class="pill gray">Excel / CSV</span></div><label class="dropzone" id="dropzone"><input id="fileInput" type="file" accept=".xlsx,.xls,.csv"><div style="font-size:42px">⇪</div><h3>Перетащите файл сюда или нажмите для выбора</h3><p class="muted">Поддержка: .xlsx через SheetJS и .csv</p></label><div class="file-help"><div><span class="kbd">Бриф</span> → ответы попадут в отдельную страницу брифа</div><div><span class="kbd">Статистика</span> → спрос, предложение, топ-гео, приоритет услуг</div><div><span class="kbd">Конкуренты и ЦА</span> → конкуренты, УТП, боли, портрет аудитории</div><div><span class="kbd">Чек-лист</span> → план запуска</div></div><div class="divider"></div><div class="actions"><button class="btn primary" onclick="document.getElementById('fileInput').click()">Выбрать файл</button><button class="btn" onclick="downloadTemplate()">Скачать Excel-шаблон</button><button class="btn" onclick="loadDemoProject()">Вернуть демо</button></div></div><div class="card"><h2>Текущий проект</h2><div class="metric"><div><div class="num">${esc(p.title)}</div><div class="label">${esc(p.niche||'ниша не указана')}</div></div>${statusPill(p.status)}</div><div class="grid cols-2" style="margin-top:12px"><div class="item"><b>${BRIEF_SECTIONS.reduce((a,s)=>a+s.questions.length,0)}</b><br><span class="muted small">вопросов в шаблоне брифа</span></div><div class="item"><b>${p.services?.length||0}</b><br><span class="muted small">услуг в анализе</span></div><div class="item"><b>${p.competitors?.length||0}</b><br><span class="muted small">конкурентов</span></div><div class="item"><b>${p.keywords?.length||0}</b><br><span class="muted small">ключевых запросов</span></div></div><h3 style="margin-top:16px">Журнал импорта</h3><div class="list">${(p.importLog||[]).slice(-6).reverse().map(x=>`<div class="item">${esc(x)}</div>`).join('')||'<div class="empty">Пока нет импортов</div>'}</div></div></div>`;
bindDropzone();
}

function bindDropzone(){
const dz=document.getElementById('dropzone'), input=document.getElementById('fileInput'); if(!dz||!input)return;
dz.onclick=e=>{ if(e.target!==input) input.click(); };
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));
dz.addEventListener('drop',e=>handleFile(e.dataTransfer.files[0])); input.addEventListener('change',e=>handleFile(e.target.files[0]));
}

function loadSheetJs(){
if(window.XLSX) return Promise.resolve(window.XLSX);
return new Promise((resolve,reject)=>{
const existing=document.querySelector('script[data-lazy-xlsx="1"]');
if(existing){
  existing.addEventListener('load',()=>resolve(window.XLSX));
  existing.addEventListener('error',()=>reject(new Error('Не удалось загрузить библиотеку Excel')));
  return;
}
const script=document.createElement('script');
script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
script.async=true;
script.defer=true;
script.setAttribute('data-lazy-xlsx','1');
const timer=setTimeout(()=>reject(new Error('Библиотека Excel не загрузилась. Проверьте интернет или используйте CSV.')),8000);
script.onload=()=>{clearTimeout(timer); resolve(window.XLSX);};
script.onerror=()=>{clearTimeout(timer); reject(new Error('Не удалось загрузить библиотеку Excel. Можно загрузить CSV.'));};
document.head.appendChild(script);
});
}

async function handleFile(file){
if(!file)return; const ext=file.name.split('.').pop().toLowerCase();
try{
if(ext==='csv'){const rows=parseCsv(await file.text()); importUnifiedRows(rows,file.name); return;}
if(['xlsx','xls'].includes(ext)){try{await loadSheetJs();}catch(loadErr){showToast(loadErr.message||'Для XLSX нужен интернет. Можно загрузить CSV.');return;} const buf=await file.arrayBuffer(); const wb=XLSX.read(buf,{type:'array'}); importWorkbook(wb,file.name); return;}
showToast('Неподдерживаемый формат файла');
}catch(e){console.error(e); showToast('Ошибка импорта: '+e.message)}
}
function importProjectObject(obj,name){
const p = obj.id? obj : {...freshProject(obj.title||name), ...obj}; p.id=p.id||('p_'+Date.now()); p.updatedAt=today(); p.importLog=p.importLog||[]; p.importLog.push(today()+': импорт JSON '+name); state.projects.unshift(p); state.activeProjectId=p.id; saveStateNow(); renderAll(); showToast('JSON импортирован');
}
function importWorkbook(wb,fileName){
let p=freshProject(fileName.replace(/\.[^.]+$/,''),''); p.importLog.push(today()+': импорт Excel '+fileName);
const sheetNames=wb.SheetNames;
const findSheet = names => sheetNames.find(s=>names.some(n=>s.toLowerCase().includes(n.toLowerCase())));
const briefName=findSheet(['бриф','brief']); if(briefName) parseBriefSheet(wb.Sheets[briefName],p);
const servicesName=findSheet(['услуги','services']); if(servicesName) parseServicesSheet(wb.Sheets[servicesName],p);
const demandName=findSheet(['спрос и конкуренция','спрос','demand']); if(demandName) parseDemandSupplySheet(wb.Sheets[demandName],p);
const statName=findSheet(['статистика','analytics']); if(statName && statName!==demandName) parseStatsSheet(wb.Sheets[statName],p);
const compName=findSheet(['конкуренты','ца','audience']); if(compName) parseCompetitorSheet(wb.Sheets[compName],p);
const semName=findSheet(['семантическое','семантика','ключ']); if(semName) parseSemanticSheet(wb.Sheets[semName],p);
const checkName=findSheet(['чек','план','tasks']); if(checkName) parseChecklistSheet(wb.Sheets[checkName],p);
guessProjectFields(p); p.updatedAt=today(); p.status='Автоанализ'; state.projects.unshift(p); state.activeProjectId=p.id; saveStateNow(); renderAll(); showToast('Excel разобран и добавлен как проект'); navTo('project');
}
function sheetRows(ws){return XLSX.utils.sheet_to_json(ws,{header:1,defval:''});}
function parseBriefSheet(ws,p){
const rows=sheetRows(ws);
const lookup=buildQuestionLookup();
const header=(rows[0]||[]).map(x=>String(x||'').toLowerCase());
const qIdx = header.findIndex(h=>/вопрос|question/.test(h));
const aIdx = header.findIndex(h=>/ответ|answer/.test(h));
rows.slice(header.some(Boolean)?1:0).forEach(row=>{
const questionCell = qIdx>=0 ? row[qIdx] : row[0];
const q=String(questionCell||'').trim();
if(!q || q.startsWith('Цель:') || /^раздел$/i.test(q)) return;
const id=lookup[normalizeQ(q)];
if(id){
  let answer='';
  if(aIdx>=0) answer=String(row[aIdx]||'').trim();
  else answer=row.slice(1,5).filter(Boolean).join('\\n');
  if(answer) p.briefAnswers[id]=answer;
}
});
p.importLog.push('Бриф: импортированы ответы — '+Object.keys(p.briefAnswers).length);
}
function buildQuestionLookup(){const out={}; BRIEF_SECTIONS.forEach(s=>s.questions.forEach(q=>out[normalizeQ(q.text)]=q.id)); return out;}
function normalizeQ(s){return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').replace(/["«»]/g,'').trim();}

function parseServicesSheet(ws,p){
const rows=sheetRows(ws);
if(!rows.length) return;
const header=(rows[0]||[]).map(x=>String(x||'').toLowerCase());
const idx = name => header.findIndex(h=>name.some(n=>h.includes(n)));
const iService=idx(['услуга','направление','service']);
const iCheck=idx(['чек','avg']);
const iMargin=idx(['марж','margin']);
const iGeo=idx(['гео','город']);
const iClient=idx(['приоритет']);
const iSeason=idx(['сезон']);
const existing = new Map((p.services||[]).map(s=>[String(s.name||'').toLowerCase(),s]));
rows.slice(1).forEach(row=>{
const name=String((iService>=0?row[iService]:row[0])||'').trim();
if(!name) return;
const key=name.toLowerCase();
const current=existing.get(key)||{name,demand:0,supply:0,topGeo:[]};
current.avgCheck=number(iCheck>=0?row[iCheck]:current.avgCheck);
current.margin=number(iMargin>=0?row[iMargin]:current.margin);
current.clientPriority=number(iClient>=0?row[iClient]:current.clientPriority)||current.clientPriority||3;
current.season=iSeason>=0?String(row[iSeason]||''):current.season;
const geo=iGeo>=0?String(row[iGeo]||'').trim():'';
if(geo && !current.topGeo?.some(g=>g.city===geo)) current.topGeo=[...(current.topGeo||[]),{city:geo,demand:0,supply:0}];
existing.set(key,current);
});
p.services=[...existing.values()];
p.importLog.push('Услуги: импортировано — '+p.services.length);
}
function parseDemandSupplySheet(ws,p){
const rows=sheetRows(ws);
if(!rows.length) return;
const header=(rows[0]||[]).map(x=>String(x||'').toLowerCase());
const idx = name => header.findIndex(h=>name.some(n=>h.includes(n)));
const iService=idx(['услуга','направление','service']);
const iCity=idx(['город','гео','city']);
const iDemand=idx(['спрос','demand']);
const iSupply=idx(['предлож','supply']);
if(iService<0 || iDemand<0 || iSupply<0) return;
const grouped=new Map((p.services||[]).map(s=>[String(s.name||'').toLowerCase(),{...s,demand:number(s.demand),supply:number(s.supply),topGeo:s.topGeo||[]}]));
rows.slice(1).forEach(row=>{
const name=String(row[iService]||'').trim();
if(!name) return;
const key=name.toLowerCase();
const demand=number(row[iDemand]);
const supply=number(row[iSupply]);
const city=iCity>=0?String(row[iCity]||'').trim():'';
const item=grouped.get(key)||{name,demand:0,supply:0,topGeo:[]};
item.demand+=demand;
item.supply+=supply;
if(city) item.topGeo.push({city,demand,supply});
grouped.set(key,item);
});
p.services=[...grouped.values()].map(s=>({...s,topGeo:(s.topGeo||[]).sort((a,b)=>number(b.demand)-number(a.demand)).slice(0,8)}));
p.importLog.push('Спрос и конкуренция: услуг — '+p.services.length);
}

function parseStatsSheet(ws,p){
const rows=sheetRows(ws); const services=[]; if(rows.length<4)return;
for(let col=1;col<rows[1].length;col+=4){const name=String(rows[1][col]||'').trim(); if(!name)continue; let demand=0,supply=0,geos=[];
for(let r=3;r<rows.length;r++){const city=rows[r][0]; if(!city)continue; const d=number(rows[r][col]); const s=number(rows[r][col+1]); if(d||s){demand+=d;supply+=s;geos.push({city:String(city),demand:d,supply:s,gap:d-s});}}
geos.sort((a,b)=>(b.gap-a.gap)||(b.demand-a.demand)); services.push({name,demand,supply,avgCheck:0,margin:0,clientPriority:3,season:'',materialReady:2,topGeo:geos.slice(0,5)});
}
const map={}; services.forEach(s=>{const k=s.name.toLowerCase(); if(!map[k])map[k]=s; else{map[k].demand+=s.demand; map[k].supply+=s.supply; map[k].topGeo=map[k].topGeo.concat(s.topGeo).slice(0,5);}});
p.services=Object.values(map).sort((a,b)=>serviceScore(b)-serviceScore(a)).slice(0,20); p.importLog.push('Статистика: услуг/запросов — '+p.services.length);
}
function parseCompetitorSheet(ws,p){
const rows=sheetRows(ws); p.competitors=[]; p.marketUtp=[]; p.usedUtp=[]; p.pains=[];
rows.slice(1,8).forEach(row=>{if(row[1]) p.competitors.push({name:String(row[1]),link:String(row[2]||''),ads:String(row[3]||''),utp:String(row[4]||''),reviews:String(row[5]||''),titles:String(row[6]||''),prices:String(row[7]||''),visuals:String(row[8]||''),account:String(row[9]||''),texts:String(row[10]||'')});});
rows.forEach(row=>{if(row[1]&&String(row[1]).length<90&&/гарант|выезд|запах|сертифик|опыт|скид|расср|договор|день|консультац/i.test(String(row[1]))) p.marketUtp.push(String(row[1])); if(row[4]&&String(row[4]).length<120) p.usedUtp.push(String(row[4])); if(row[1]&&/стоимость|запах|полом|участок|срок|качество|вода/i.test(String(row[1]))) p.pains.push(String(row[1])); if(row[4]&&String(row[4]).length>120) p.portrait=String(row[4]);});
p.importLog.push('Конкуренты и ЦА: конкурентов — '+p.competitors.length);
}
function parseSemanticSheet(ws,p){const rows=sheetRows(ws); p.keywords=rows.map(r=>String(r[0]||'').trim()).filter(x=>x&&!/запрос/i.test(x)).slice(0,500); p.importLog.push('Семантика: ключей — '+p.keywords.length);}
function parseChecklistSheet(ws,p){const rows=sheetRows(ws); let stage=''; p.tasks=[]; rows.slice(1).forEach(row=>{if(row[0])stage=String(row[0]); if(row[1])p.tasks.push({stage,task:String(row[1]),owner:String(row[3]||''),status:String(row[4]||'Не начато')});}); p.importLog.push('Чек-лист: задач — '+p.tasks.length);}
function guessProjectFields(p){
const lookup=buildQuestionLookup(); const ans=p.briefAnswers; const find=t=>{const id=lookup[normalizeQ(t)]; return ans[id]||''};
p.title=find('1. Название организации (полностью) и кратко')||p.title; p.niche=find('1. Какой бизнес, какая ниша, какой продукт')?.slice(0,90)||p.niche;
const budget=find('13. На какой бюджет рассчитываете?'); if(budget) p.kpi.weeklyBudget=number(budget);
const orders=find('1. Желаемый объем трафика'); if(orders) p.kpi.desiredOrdersWeek=number(orders);
}
function parseCsv(text){
const rows=[]; let row=[],cell='',q=false;
for(let i=0;i<text.length;i++){const ch=text[i],n=text[i+1]; if(ch==='"'){if(q&&n==='"'){cell+='"';i++;}else q=!q;} else if(ch===','&&!q){row.push(cell);cell='';} else if((ch==='\n'||ch==='\r')&&!q){if(ch==='\r'&&n==='\n')i++; row.push(cell); rows.push(row); row=[]; cell='';} else cell+=ch;}
if(cell||row.length){row.push(cell);rows.push(row)} return rows;
}
function importUnifiedRows(rows,fileName){
const p=freshProject(fileName.replace(/\.[^.]+$/,''),''); const h=rows[0].map(x=>String(x).toLowerCase());
rows.slice(1).forEach(r=>{const type=String(r[0]||'').toLowerCase(); if(type.includes('service')||type.includes('услуг')) p.services.push({name:r[1]||'',demand:number(r[2]),supply:number(r[3]),avgCheck:number(r[4]),margin:number(r[5]),clientPriority:number(r[6])||3,season:r[7]||'',materialReady:number(r[8])||2,topGeo:[]}); if(type.includes('brief')||type.includes('бриф')){const lookup=buildQuestionLookup(); const id=lookup[normalizeQ(r[1])]; if(id)p.briefAnswers[id]=r[2]||'';}});
p.importLog.push(today()+': импорт CSV '+fileName); state.projects.unshift(p); state.activeProjectId=p.id; saveStateNow(); renderAll(); showToast('CSV импортирован'); navTo('analysis');
}
function loadDemoProject(){state.projects.unshift(JSON.parse(JSON.stringify(SAMPLE_PROJECT))); state.activeProjectId=state.projects[0].id; saveStateNow(); renderAll(); showToast('Демо-проект добавлен')}

function demoSiteData(){
return {
config:{
  domain:'https://example.ru',
  siteId:'main-site',
  publicKey:'pk_live_demo_8f3a',
  allowedDomain:'example.ru',
  status:'Демо-режим',
  lastSignal:'2 минуты назад'
},
metrics:{
  visitorsToday:128,
  visitorsWeek:842,
  leadsToday:7,
  leadsWeek:36,
  conversion:5.4,
  avgTime:'2 мин 18 сек',
  bounce:38,
  depth:3.2
},
leads:[
  {id:'lead_001',date:'сегодня 14:28',name:'Иван',phone:'+7 999 123-45-67',service:'Разработка сайта',source:'Яндекс Директ',page:'/services/site',status:'Новая',time:'3 мин 42 сек',path:['Главная','Услуги','Кейсы','Форма'],utm:'utm_source=yandex&utm_campaign=site'},
  {id:'lead_002',date:'сегодня 12:10',name:'Анна',phone:'+7 916 555-11-22',service:'Продвижение',source:'SEO',page:'/services/promotion',status:'В работе',time:'4 мин 05 сек',path:['Статья','Услуги','Форма'],utm:'organic'},
  {id:'lead_003',date:'вчера 18:44',name:'Дмитрий',phone:'+7 925 333-20-19',service:'Комплексный запуск',source:'Telegram',page:'/cases',status:'Созвон',time:'6 мин 11 сек',path:['Кейсы','О нас','Форма'],utm:'utm_source=telegram'},
  {id:'lead_004',date:'вчера 10:02',name:'Мария',phone:'+7 903 777-40-50',service:'Аудит рекламы',source:'VK',page:'/audit',status:'КП отправлено',time:'2 мин 54 сек',path:['Главная','Аудит','Форма'],utm:'utm_source=vk'}
],
pages:[
  {page:'Главная',views:412,avg:'1 мин 12 сек'},
  {page:'Услуги',views:286,avg:'2 мин 04 сек'},
  {page:'Кейсы',views:173,avg:'2 мин 48 сек'},
  {page:'Форма заявки',views:74,avg:'0 мин 52 сек'}
],
funnel:[
  {name:'Зашли на сайт',value:128,percent:100},
  {name:'Открыли услуги',value:64,percent:50},
  {name:'Нажали заявку',value:18,percent:14},
  {name:'Оставили заявку',value:7,percent:5.4},
  {name:'Дошли до созвона',value:3,percent:2.3}
],
sources:[
  {name:'Яндекс Директ',visits:420,leads:18,conv:4.3,cpl:'1 240 ₽',quality:'среднее'},
  {name:'SEO',visits:236,leads:11,conv:4.7,cpl:'—',quality:'хорошее'},
  {name:'VK',visits:118,leads:4,conv:3.4,cpl:'1 780 ₽',quality:'тест'},
  {name:'Telegram',visits:54,leads:3,conv:5.6,cpl:'—',quality:'теплое'},
  {name:'Прямые заходы',visits:96,leads:5,conv:5.2,cpl:'—',quality:'хорошее'}
],
devices:[
  {name:'Мобильные',value:68},
  {name:'Десктоп',value:27},
  {name:'Планшеты',value:5}
],
geo:[
  {city:'Москва',visits:286,leads:12},
  {city:'Санкт-Петербург',visits:144,leads:5},
  {city:'Казань',visits:76,leads:3},
  {city:'Краснодар',visits:61,leads:2}
],
events:{
  formOpens:18,
  formSubmits:7,
  phoneClicks:14,
  messengerClicks:9,
  briefDownloads:3,
  caseViews:173,
  scrollDepth:64,
  newVisitors:72,
  returningVisitors:28
},
utm:[
  {name:'yandex_search',visits:214,leads:9},
  {name:'yandex_rsy',visits:146,leads:5},
  {name:'seo_google',visits:92,leads:4},
  {name:'telegram_post',visits:54,leads:3}
]
};
}

function normalizeSiteData(site){
const base = demoSiteData();
const out = site || {};
out.config = {...base.config, ...(out.config||{})};
out.metrics = {...base.metrics, ...(out.metrics||{})};
out.leads = Array.isArray(out.leads) ? out.leads : base.leads;
out.pages = Array.isArray(out.pages) ? out.pages : base.pages;
out.funnel = Array.isArray(out.funnel) ? out.funnel : base.funnel;
out.sources = Array.isArray(out.sources) ? out.sources : base.sources;
out.devices = Array.isArray(out.devices) ? out.devices : base.devices;
out.geo = Array.isArray(out.geo) ? out.geo : base.geo;
out.utm = Array.isArray(out.utm) ? out.utm : base.utm;
out.events = {...base.events, ...(out.events||{})};
return out;
}

function getSiteData(){
state.site = normalizeSiteData(state.site);
return state.site;
}

function setSiteTab(tab){
const allowed = SITE_TABS.map(t=>t[0]);
activeSiteTab = allowed.includes(tab) ? tab : 'overview';
renderSite();
}

function leadStatusClass(status){
const map = {'Новая':'green','В работе':'amber','Созвон':'purple','КП отправлено':'purple','Отказ':'red','Клиент':'green'};
return map[status] || 'gray';
}

function leadStatusPill(status){
return `<span class="pill ${leadStatusClass(status)}">${esc(status||'Новая')}</span>`;
}

function updateLeadStatus(id,status){
const site = getSiteData();
const lead = site.leads.find(l=>l.id===id);
if(lead){
lead.status = status;
saveStateNow();
renderSite();
showToast('Статус заявки обновлен');
}
}

function renderSiteTabs(){
return `<div class="site-tabs">${SITE_TABS.map(([id,title])=>`<button class="${activeSiteTab===id?'active':''}" onclick="setSiteTab('${id}')">${title}</button>`).join('')}</div>`;
}

function renderSite(){
const root = document.getElementById('view-site');
if(!root) return;
const views = {
overview: renderSiteOverview,
leads: renderSiteLeads,
stats: renderSiteStats,
sources: renderSiteSources,
settings: renderSiteSettings
};
root.innerHTML = `${renderSiteTabs()}${(views[activeSiteTab]||renderSiteOverview)()}`;
}

function renderSiteOverview(){
const s = getSiteData();
const last = s.leads[0];
return `
<div class="site-kpi-grid">
  <div class="metric"><div><div class="num">${fmt(s.metrics.visitorsToday)}</div><div class="label">посетителей сегодня</div></div><span class="pill gray">неделя ${fmt(s.metrics.visitorsWeek)}</span></div>
  <div class="metric"><div><div class="num">${fmt(s.metrics.leadsToday)}</div><div class="label">заявок сегодня</div></div><span class="pill green">неделя ${fmt(s.metrics.leadsWeek)}</span></div>
  <div class="metric"><div><div class="num">${s.metrics.conversion}%</div><div class="label">конверсия в заявку</div></div><span class="pill gray">сайт</span></div>
  <div class="metric"><div><div class="num">${esc(s.metrics.avgTime)}</div><div class="label">среднее время</div></div><span class="pill gray">глубина ${s.metrics.depth}</span></div>
</div>
<div class="site-two" style="margin-top:16px">
  <div class="card">
    <div class="split"><h2>Что происходит сейчас</h2><span class="pill green"><span class="site-status-dot"></span> ${esc(s.config.status)}</span></div>
    <div class="summary-list">
      <div class="item">Сегодня сайт дал <b>${fmt(s.metrics.leadsToday)} заявок</b> при конверсии <b>${s.metrics.conversion}%</b>.</div>
      <div class="item">Лучший текущий источник: <b>${esc(s.sources[0]?.name||'—')}</b> — ${fmt(s.sources[0]?.leads||0)} заявок.</div>
      <div class="item">Последний сигнал от сайта: <b>${esc(s.config.lastSignal)}</b>.</div>
    </div>
  </div>
  <div class="card">
    <h2>Последняя заявка</h2>
    ${last ? `<div class="site-lead-card">
      <div class="split"><b>${esc(last.name)}</b>${leadStatusPill(last.status)}</div>
      <div class="muted">${esc(last.phone)} · ${esc(last.service)}</div>
      <div class="small">Источник: <b>${esc(last.source)}</b><br>Страница: ${esc(last.page)}<br>Время на сайте: ${esc(last.time)}</div>
      <div class="site-path">${(last.path||[]).map(x=>`<span>${esc(x)}</span>`).join('')}</div>
    </div>` : '<div class="empty">Заявок пока нет.</div>'}
  </div>
</div>
<div class="card" style="margin-top:16px">
  <h2>Воронка сайта</h2>
  <p class="muted">Путь пользователя от первого визита до заявки и созвона.</p>
  ${renderSiteFunnelRows(s.funnel)}
</div>`;
}

function renderSiteLeads(){
const s = getSiteData();
const statuses = ['Новая','В работе','Созвон','КП отправлено','Отказ','Клиент'];
return `<div class="card">
<div class="split"><h2>Заявки с сайта</h2><span class="pill gray">${s.leads.length} демо-заявки</span></div>
<div class="table-wrap" style="margin-top:12px">
  <table>
    <thead><tr><th>Дата</th><th>Клиент</th><th>Услуга</th><th>Источник</th><th>Страница</th><th>Статус</th></tr></thead>
    <tbody>${s.leads.map(l=>`<tr class="site-lead-row">
      <td>${esc(l.date)}</td>
      <td><b>${esc(l.name)}</b><div class="small muted">${esc(l.phone)}</div></td>
      <td>${esc(l.service)}<div class="small muted">${esc(l.time)} на сайте</div></td>
      <td>${esc(l.source)}<div class="small muted">${esc(l.utm)}</div></td>
      <td>${esc(l.page)}</td>
      <td><select class="lead-status-select" onchange="updateLeadStatus('${l.id}',this.value)">${statuses.map(st=>`<option ${st===l.status?'selected':''}>${st}</option>`).join('')}</select></td>
    </tr>`).join('')}</tbody>
  </table>
</div>
</div>`;
}

function renderSiteStats(){
const s = getSiteData();
return `
<div class="site-stat-grid">
  <div class="site-stat-card"><div class="value">${fmt(s.metrics.visitorsToday)}</div><div class="label">визитов сегодня</div></div>
  <div class="site-stat-card"><div class="value">${fmt(s.metrics.visitorsWeek)}</div><div class="label">визитов за неделю</div></div>
  <div class="site-stat-card"><div class="value">${s.events.newVisitors}%</div><div class="label">новые посетители</div></div>
  <div class="site-stat-card"><div class="value">${s.events.returningVisitors}%</div><div class="label">вернувшиеся посетители</div></div>
  <div class="site-stat-card"><div class="value">${esc(s.metrics.avgTime)}</div><div class="label">среднее время</div></div>
  <div class="site-stat-card"><div class="value">${s.metrics.depth}</div><div class="label">страницы за визит</div></div>
  <div class="site-stat-card"><div class="value">${s.metrics.bounce}%</div><div class="label">отказы</div></div>
  <div class="site-stat-card"><div class="value">${s.events.scrollDepth}%</div><div class="label">средняя глубина скролла</div></div>
  <div class="site-stat-card"><div class="value">${s.events.formOpens}</div><div class="label">открытий формы</div></div>
  <div class="site-stat-card"><div class="value">${s.events.formSubmits}</div><div class="label">отправок формы</div></div>
  <div class="site-stat-card"><div class="value">${s.events.phoneClicks}</div><div class="label">кликов по телефону</div></div>
  <div class="site-stat-card"><div class="value">${s.events.messengerClicks}</div><div class="label">кликов в мессенджеры</div></div>
</div>
<div class="site-table-grid">
  <div class="card">
    <h2>Популярные страницы</h2>
    <div class="table-wrap"><table><thead><tr><th>Страница</th><th>Просмотры</th><th>Среднее время</th></tr></thead><tbody>${s.pages.map(p=>`<tr><td><b>${esc(p.page)}</b></td><td>${fmt(p.views)}</td><td>${esc(p.avg)}</td></tr>`).join('')}</tbody></table></div>
  </div>
  <div class="card">
    <h2>Устройства</h2>
    <div class="summary-list">${s.devices.map(d=>`<div class="item"><div class="split"><b>${esc(d.name)}</b><span>${d.value}%</span></div><div class="bar"><span style="width:${d.value}%"></span></div></div>`).join('')}</div>
  </div>
  <div class="card">
    <h2>География</h2>
    <div class="table-wrap"><table><thead><tr><th>Город</th><th>Визиты</th><th>Заявки</th></tr></thead><tbody>${s.geo.map(g=>`<tr><td><b>${esc(g.city)}</b></td><td>${fmt(g.visits)}</td><td>${fmt(g.leads)}</td></tr>`).join('')}</tbody></table></div>
  </div>
  <div class="card">
    <h2>UTM-метки</h2>
    <div class="table-wrap"><table><thead><tr><th>Кампания</th><th>Визиты</th><th>Заявки</th></tr></thead><tbody>${s.utm.map(u=>`<tr><td><b>${esc(u.name)}</b></td><td>${fmt(u.visits)}</td><td>${fmt(u.leads)}</td></tr>`).join('')}</tbody></table></div>
  </div>
</div>`;
}

function renderSiteFunnelRows(funnel){
return `<div class="site-funnel">${(funnel||[]).map(f=>`<div class="site-funnel-row">
<div class="site-funnel-name">${esc(f.name)}</div>
<div class="bar"><span style="width:${clamp(f.percent)}%"></span></div>
<div class="nowrap"><b>${fmt(f.value)}</b> · ${f.percent}%</div>
</div>`).join('')}</div>`;
}

function renderSiteSources(){
const s = getSiteData();
return `<div class="site-source-grid">${s.sources.map(src=>`<div class="site-source-card">
<div class="source-top"><b>${esc(src.name)}</b><span class="pill gray">${esc(src.quality)}</span></div>
<div class="grid cols-2">
  <div><div class="tiny muted">Визиты</div><b>${fmt(src.visits)}</b></div>
  <div><div class="tiny muted">Заявки</div><b>${fmt(src.leads)}</b></div>
  <div><div class="tiny muted">Конверсия</div><b>${src.conv}%</b></div>
  <div><div class="tiny muted">CPL</div><b>${esc(src.cpl)}</b></div>
</div>
</div>`).join('')}</div>`;
}

function siteTrackerCode(){
const s = getSiteData();
const cfg = s.config || {};
return '<scr' + 'ipt src="https://cabinet.example.ru/tracker.js" data-site-id="' + esc(cfg.siteId||'') + '" data-key="' + esc(cfg.publicKey||'') + '" async></scr' + 'ipt>';
}

function copySiteTrackerCode(){
copyText(siteTrackerCode());
}

function renderSiteSettings(){
const s = getSiteData();
const code = siteTrackerCode();
return `<div class="grid cols-2">
<div class="card">
  <div class="split"><h2>Подключение внешнего сайта</h2><span class="pill amber">${esc(s.config.status)}</span></div>
  <div class="field"><label>Адрес сайта</label><input value="${esc(s.config.domain)}" oninput="state.site.config.domain=this.value;saveState()"></div>
  <div class="field"><label>Разрешенный домен</label><input value="${esc(s.config.allowedDomain)}" oninput="state.site.config.allowedDomain=this.value;saveState()"></div>
  <div class="field"><label>Код для вставки перед &lt;/body&gt;</label><div class="site-connect-code">${esc(code)}</div></div>
  <div class="actions"><button class="btn" onclick="copySiteTrackerCode()">Скопировать код</button><button class="btn primary" onclick="showToast('В демо-версии проверка подключения не выполняется')">Проверить подключение</button></div>
</div>
<div class="card">
  <h2>Безопасная схема</h2>
  <div class="site-security-list">
    <div class="item"><span>Внутренний кабинет закрыт авторизацией</span><span class="pill green">обязательно</span></div>
    <div class="item"><span>На внешнем сайте только публичный ключ</span><span class="pill green">без доступа</span></div>
    <div class="item"><span>API принимает данные только с разрешенного домена</span><span class="pill green">домен</span></div>
    <div class="item"><span>Заявки и телефоны хранятся на сервере</span><span class="pill amber">будущий этап</span></div>
    <div class="item"><span>Антиспам и ограничение частоты запросов</span><span class="pill amber">будущий этап</span></div>
  </div>
</div>
</div>
<div class="card" style="margin-top:16px">
<h2>Будущая логика обмена</h2>
<div class="site-path"><span>Внешний сайт</span><span>tracker.js</span><span>защищенный API</span><span>база данных</span><span>внутренний кабинет</span></div>
</div>`;
}

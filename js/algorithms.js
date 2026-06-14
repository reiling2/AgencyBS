function serviceScore(s){
const w=getWeights();
const demand=number(s.demand), supply=number(s.supply), check=number(s.avgCheck), margin=number(s.margin), client=number(s.clientPriority)||3, material=number(s.materialReady)||2;
const ratio=demand/(supply+1);
const demandScore=clamp(Math.log10(demand+1)*10,0,w.demand);
const balanceScore=clamp(ratio*14,0,w.balance);
const economicsRaw=(check?Math.log10(check+1)*3.5:0)+(margin?margin*.42:0);
const economicsScore=clamp(economicsRaw,0,w.economics);
const clientScore=clamp(client*2,0,w.client);
const materialScore=clamp(material*1.7,0,w.materials);
const total=Math.round(demandScore+balanceScore+economicsScore+clientScore+materialScore);
return clamp(total);
}
function serviceDecision(score){return score>=78?'Запускать первым':score>=60?'Тестировать в первом спринте':score>=45?'Точечный тест / допродажа':'Не приоритет сейчас'}
function calcReadiness(p){
let score=0, checks=[]; const add=(cond,pts,label)=>{if(cond){score+=pts;checks.push({label,pts,ok:true})}else checks.push({label,pts,ok:false})};
add(p.title,8,'Название проекта'); add(p.niche,8,'Ниша'); add(Object.values(p.briefAnswers||{}).filter(Boolean).length>8,12,'Бриф заполнен'); add((p.services||[]).length>0,12,'Услуги/статистика'); add((p.competitors||[]).length>0,10,'Конкуренты'); add(number(p.kpi?.weeklyBudget)>0,8,'Бюджет'); add(number(p.kpi?.avgCheck)>0,8,'Средний чек'); add(number(p.kpi?.margin)>0,8,'Маржа'); add(number(p.kpi?.targetLeadCost)>0,6,'Целевая цена лида'); add((p.materials?.photo||'').trim(),6,'Фото'); add((p.materials?.reviews||'').trim(),6,'Отзывы'); add((p.tasks||[]).length>0,8,'План запуска'); return {score:clamp(score),checks};
}
function calcRisks(p){
const risks=[]; const b=number(p.kpi?.weeklyBudget), orders=number(p.kpi?.desiredOrdersWeek), leadToSale=number(p.kpi?.leadToSale)||0, target=number(p.kpi?.targetLeadCost), check=number(p.kpi?.avgCheck), margin=number(p.kpi?.margin);
if(!margin) risks.push({level:'high',title:'Не указана маржа',text:'Без маржи нельзя определить допустимую стоимость лида и заказа.'});
if(!target) risks.push({level:'mid',title:'Не указана желаемая цена лида',text:'Алгоритм не может сравнить фактический CPL с ожиданием клиента.'});
if(b&&orders&&leadToSale){const neededLeads=orders/(leadToSale/100); const maxCpl=b/neededLeads; if(maxCpl<500) risks.push({level:'high',title:'Бюджет может не соответствовать цели',text:`При бюджете ${fmt(b)} ₽/нед и цели ${orders} заказов нужен CPL около ${fmt(maxCpl)} ₽. Для дорогой ниши это риск.`});}
if((p.services||[]).some(s=>number(s.supply)>number(s.demand)*2 && number(s.demand)>100)) risks.push({level:'mid',title:'Есть перегретые направления',text:'По части услуг предложение сильно выше спроса. Их нельзя запускать без сильной упаковки.'});
if(!String(p.materials?.photo||'').trim()) risks.push({level:'mid',title:'Нет подтвержденных фото',text:'Для Авито и услуг под ключ реальные фото работ сильно влияют на доверие.'});
if(!String(p.materials?.reviews||'').trim()) risks.push({level:'mid',title:'Не указаны отзывы',text:'Отзывы нужны для снижения страха клиента перед дорогой услугой.'});
const crmAns=Object.values(p.briefAnswers||{}).join(' ').toLowerCase(); if(!/crm|амо|amo|скрипт|менедж/i.test(crmAns)) risks.push({level:'mid',title:'Не описана обработка заявок',text:'Реклама может давать лиды, но продажи будут теряться без скорости ответа и CRM.'});
return risks;
}
function questionsForClient(p){
const qs=[]; const push=(t,why)=>qs.push({t,why}); const vals=Object.values(p.briefAnswers||{}).join(' ');
if(!number(p.kpi?.margin)) push('Какая примерная маржинальность по каждой ключевой услуге?', 'Это нужно, чтобы рассчитать допустимую стоимость заявки и заказа.');
if(!number(p.kpi?.targetLeadCost)) push('Какую стоимость лида клиент считает комфортной и предельной?', 'Это поможет оценивать рекламу не по ощущениям, а по KPI.');
if(!/скор|минут|менедж|crm|амо/i.test(vals)) push('Кто обрабатывает заявки и за сколько минут отвечает?', 'Часть лидов теряется не в рекламе, а в обработке.');
if(!String(p.materials?.photo||'').trim()) push('Есть ли реальные фото и видео выполненных работ?', 'Для доверия в дорогой услуге нужны доказательства.');
if(!String(p.materials?.price||'').trim()) push('Есть ли прайс или хотя бы диапазоны цен по услугам?', 'Без цен сложно фильтровать нецелевые обращения.');
if(!(p.services||[]).some(s=>number(s.avgCheck))) push('Какой средний чек по каждой услуге?', 'Средний чек нужен для приоритизации направлений.');
return qs;
}
function bestServices(p){return [...(p.services||[])].map(s=>({...s,score:serviceScore(s)})).sort((a,b)=>b.score-a.score)}
function buildStrategy(p){
const best=bestServices(p); const first=best[0], second=best[1]; const risks=calcRisks(p); const parts=[];
if(first) parts.push(`Первым приоритетом стоит запускать направление «${first.name}»: по нему рассчитан самый высокий потенциал (${first.score}/100) с учетом спроса, конкуренции и готовности данных.`);
if(second) parts.push(`Вторым направлением можно тестировать «${second.name}», но бюджет лучше распределять после первых заявок и проверки качества лидов.`);
if(risks.length) parts.push(`Перед запуском важно закрыть риски: ${risks.slice(0,3).map(r=>r.title.toLowerCase()).join(', ')}.`);
parts.push('В коммуникации нужно продавать не просто услугу, а снижение риска для клиента: прозрачная смета, договор, гарантия, понятные сроки, фотоотчет и быстрый ответ менеджера.');
return parts.join('\n\n');
}
function generateUtps(p){const src=[...(p.usedUtp||[]),...(p.marketUtp||[])].filter(Boolean); const base=src.length?src.slice(0,8):['Бесплатный выезд специалиста','Договор и гарантия','Фиксированная смета','Монтаж под ключ','Оплата после выполнения']; const best=bestServices(p)[0]?.name||'услуга'; return [...new Set(base)].slice(0,8).map(u=>`${u} — использовать в связке с направлением «${best}» и подтверждать доказательствами: фото, договор, отзывы, смета.`)}
function generateHypotheses(p){const best=bestServices(p); const service=best[0]?.name||'ключевая услуга'; return [
{name:'Доверие и снижение риска',text:`Для направления «${service}» сделать акцент на договоре, гарантии, фиксированной смете и фотоотчете.`},
{name:'Цена без скрытых платежей',text:'Проверить объявления с формулировкой «расчет до выезда / смета до начала работ / без скрытых платежей». '},
{name:'Скорость решения',text:'Запустить вариант с обещанием понятного срока: выезд инженера, расчет, монтаж/выполнение под ключ.'},
{name:'Комплексная продажа',text:'Если услуга дорогая, тестировать пакетное предложение и допродажи: основная услуга + сопутствующие работы.'}
];}
function generateAds(p){const service=bestServices(p)[0]?.name||'услуга под ключ'; const geo=topGeoText(bestServices(p)[0]); return [
{title:`${service} ${geo?`— ${geo}`:''} под ключ`,text:'Бесплатная консультация, расчет сметы, договор и гарантия. Покажем реальные работы и подберем решение под задачу клиента.'},
{title:`${service}: расчет стоимости до начала работ`,text:'Прозрачная смета без скрытых платежей. Объясним этапы, сроки и что входит в работу под ключ.'},
{title:`${service} с гарантией и фотоотчетом`,text:'Работаем аккуратно, фиксируем условия, предоставляем документы и остаемся на связи после выполнения.'}
];}
function topGeoText(s){return s?.topGeo?.[0]?.city?`в ${s.topGeo[0].city.replace('Московская область, ','').replace('Тульская область, ','')}`:''}
function kpiMath(p){const b=number(p.kpi?.weeklyBudget), orders=number(p.kpi?.desiredOrdersWeek), conv=number(p.kpi?.leadToSale), check=number(p.kpi?.avgCheck), margin=number(p.kpi?.margin), target=number(p.kpi?.targetLeadCost); const needLeads=orders&&conv?orders/(conv/100):0; const possibleCpl=needLeads?b/needLeads:0; const revenue=orders*check; const gross=revenue*(margin/100); const profit=gross-b; const romi=b?profit/b*100:0; return {needLeads,possibleCpl,revenue,gross,profit,romi,target};}

function setStrategyType(type){activeStrategyType=type;renderAnalysis();}
function renderStrategyWorkbench(type){
const p=currentProject(); ensureStrategyBlocks(p); const blocks=activeStrategyBlocks(p,type);
const meta={utps:{title:'УТП',desc:'Формулировки ценности, оффера и выгод клиента.'},hypotheses:{title:'Гипотезы',desc:'Идеи для тестов: оффер, сегмент, сообщение, подача.'},ads:{title:'Объявления',desc:'Рабочая база заголовков и текстов для запуска.'}}[type];
return `<div class="card" style="margin-top:16px"><div class="split"><div><h2>${meta.title}</h2><p class="muted">${meta.desc}</p></div><div class="actions"><button class="btn" onclick="addStrategyBlock('${type}')">+ Добавить</button><button class="btn" onclick="resetStrategyBlocks('${type}')">Пересобрать</button></div></div><div class="analysis-tabs">${['utps','hypotheses','ads'].map(t=>`<button class="analysis-tab ${activeStrategyType===t?'active':''}" onclick="setStrategyType('${t}')">${t==='utps'?'УТП':t==='hypotheses'?'Гипотезы':'Объявления'}</button>`).join('')}</div><div class="edit-stack">${blocks.map(b=>`<div class="edit-row"><div class="edit-row-head"><div class="edit-meta"><span class="pill ${b.source==='algorithm'?'purple':b.source==='edited'?'amber':'green'}">${b.source==='algorithm'?'алгоритм':b.source==='edited'?'отредактировано':'вручную'}</span></div><button class="btn danger" onclick="deleteStrategyBlock('${type}','${b.id}')">Удалить</button></div><div class="field"><label>${type==='utps'?'Формулировка':'Название'}</label><input value="${esc(b.title||'')}" oninput="updateStrategyBlock('${type}','${b.id}','title',this.value)"></div><div class="field"><label>${type==='utps'?'Комментарий / доказательство':'Описание'}</label><textarea oninput="updateStrategyBlock('${type}','${b.id}','text',this.value)" placeholder="Дополните формулировку, канал, сегмент, возражение или пояснение">${esc(b.text||'')}</textarea></div></div>`).join('')||'<div class="empty">Блоков пока нет.</div>'}</div></div>`;
}

function setBriefSection(id){activeBriefSectionId=id;renderBrief();}
function renderBrief(){
const p=currentProject(); 
const root=document.getElementById('view-brief'); 
if(!p){root.innerHTML='<div class="empty">Создайте проект</div>';return;}

const stats=briefStats(p);
const sections=briefSectionStats(p);
if(!BRIEF_SECTIONS.some(s=>s.id===activeBriefSectionId)) activeBriefSectionId=BRIEF_SECTIONS[0].id;

const sec=BRIEF_SECTIONS.find(s=>s.id===activeBriefSectionId)||BRIEF_SECTIONS[0];
const secIndex=BRIEF_SECTIONS.findIndex(s=>s.id===sec.id);
const filled=sec.questions.filter(q=>(p.briefAnswers[q.id]||'').trim()).length;
const filteredQuestions=sec.questions.filter(q=>{
const qText=(q.text||'').toLowerCase();
const aText=(p.briefAnswers[q.id]||'').toLowerCase();
const s=(briefSearch||'').toLowerCase();
return !s || qText.includes(s) || aText.includes(s);
});

root.innerHTML=`
<div class="brief-minimal"><div class="card"><div class="brief-minimal-head"><div><h2>Бриф проекта</h2>${briefStatusText(p)}</div><div class="brief-head-right"><div class="brief-progress-clean">${stats.progress}% заполнено · ${stats.filled}/${stats.total}</div><div class="brief-top-actions"><button class="btn" onclick="saveBriefButton()">Сохранить</button><button class="btn primary" onclick="addBriefDocxToProject()">Добавить в проект</button></div></div></div><div class="brief-controls-clean"><select onchange="setBriefSection(this.value)">
        ${BRIEF_SECTIONS.map((s,i)=>`<option value="${s.id}" ${s.id===activeBriefSectionId?'selected':''}>${esc(s.title.replace(/^\d+\.\s*/,''))} · ${sections[i].progress}%</option>`).join('')}
      </select><input placeholder="Поиск по вопросам и ответам" value="${esc(briefSearch)}" oninput="briefSearch=this.value;renderBrief()"><button class="btn" ${secIndex===0?'disabled':''} onclick="setBriefSection('${BRIEF_SECTIONS[Math.max(secIndex-1,0)].id}')">← Назад</button><button class="btn" ${secIndex===BRIEF_SECTIONS.length-1?'disabled':''} onclick="setBriefSection('${BRIEF_SECTIONS[Math.min(secIndex+1,BRIEF_SECTIONS.length-1)].id}')">Дальше →</button></div></div><div class="card brief-section-clean"><div class="brief-section-title"><div class="split"><div><h2>${esc(sec.title)}</h2><p>${esc(sec.goal||'')}</p></div><div class="brief-progress-clean">${filled}/${sec.questions.length}</div></div></div>
    ${filteredQuestions.length
      ? filteredQuestions.map((q,i)=>renderBriefQuestionCard(q,p,i+1)).join('')
      : `<div class="brief-empty-clean">По этому поиску вопросов в разделе не найдено.</div>`}
  </div></div>`;
requestAnimationFrame(autoResizeBriefTextareas);
}
function cleanBriefQuestionText(text){return String(text||'').replace(/^\s*\d+[.)]?\s*/,'').trim();}
function renderBriefQuestionCard(q,p,index){
const value = p.briefAnswers[q.id] || '';
return `<div class="brief-question-clean"><label>${index}. ${esc(cleanBriefQuestionText(q.text))}</label><textarea class="brief-answer" data-qid="${q.id}" rows="1" oninput="updateBriefAnswer('${q.id}',this.value);autoResizeTextarea(this)" placeholder="Ответ клиента, факты, цифры, ссылки, договоренности">${esc(value)}</textarea></div>`
}
function updateBriefAnswer(id,val){const p=currentProject();p.briefAnswers[id]=val;p.updatedAt=today();saveState();}
function autoResizeTextarea(el){
if(!el) return;
el.style.height='auto';
el.style.height=(el.scrollHeight+2)+'px';
}
function autoResizeBriefTextareas(){
document.querySelectorAll('#view-brief textarea.brief-answer').forEach(autoResizeTextarea);
}
function briefStats(p){const qs=BRIEF_SECTIONS.flatMap(s=>s.questions);const filled=qs.filter(q=>(p.briefAnswers[q.id]||'').trim()).length;return {total:qs.length,filled,progress:Math.round(filled/qs.length*100)}}
function missingBriefQuestions(p){return BRIEF_SECTIONS.flatMap(s=>s.questions.map(q=>({...q,section:s.title}))).filter(q=>!(p.briefAnswers[q.id]||'').trim())}
async function fillBriefFromClipboard(){try{const text=await navigator.clipboard.readText(); if(!text){showToast('Буфер пуст');return;} const p=currentProject(); p.briefAnswers['free_notes']=(p.briefAnswers['free_notes']||'')+'\n'+text; saveStateNow(); showToast('Текст добавлен в свободные заметки');}catch(e){showToast('Браузер не дал доступ к буферу')}}
function clearEmptyBrief(){showToast('Пустые поля уже не сохраняются отдельно')}


function briefStatusText(p){
const saved = p?.briefSavedAt ? `Сохранен: ${esc(p.briefSavedAt)}` : 'Бриф еще не сохраняли вручную';
const doc = p?.briefLastDoc?.name ? ` · Документ: ${esc(p.briefLastDoc.name)}` : '';
return `<div class="brief-save-status">${saved}${doc}</div>`;
}
function saveBriefButton(){
const p=currentProject();
if(!p){showToast('Сначала создайте проект');return;}
p.briefSavedAt=new Date().toLocaleString('ru-RU');
p.updatedAt=today();
saveStateNow();
renderBrief();
showToast('Бриф сохранен');
}
function collectFilledBriefSections(p){
return BRIEF_SECTIONS.map(sec=>({
id:sec.id,
title:sec.title,
goal:sec.goal||'',
questions:sec.questions.map(q=>({
  id:q.id,
  row:q.row,
  text:cleanBriefQuestionText(q.text),
  answer:String(p.briefAnswers?.[q.id]||'').trim()
})).filter(q=>q.answer)
})).filter(sec=>sec.questions.length);
}
function briefDocxFileName(p){
return `Бриф_${safeName(p?.title||'проект')}_${today()}.docx`;
}
async function addGeneratedProjectFile(blob,name,typeLabel,type){
const p=currentProject();
if(!p) throw new Error('Проект не найден');
p.files=p.files||[];
const id='f_'+Date.now()+'_'+Math.random().toString(16).slice(2);
await putFileRecord({id,projectId:p.id,name,type:type||blob.type||'application/octet-stream',size:blob.size,date:today(),blob});
p.files.unshift({id,name,type:typeLabel||type||'файл',size:blob.size,date:today()});
p.updatedAt=today();
saveStateNow();
return id;
}
async function addBriefDocxToProject(){
const p=currentProject();
if(!p){showToast('Сначала создайте проект');return;}
const sections=collectFilledBriefSections(p);
if(!sections.length){showToast('В брифе нет заполненных полей');return;}
try{
p.briefSavedAt=new Date().toLocaleString('ru-RU');
const name=briefDocxFileName(p);
const blob=buildBriefDocxBlob(p,sections);
await addGeneratedProjectFile(blob,name,'Word-документ','application/vnd.openxmlformats-officedocument.wordprocessingml.document');
p.briefLastDoc={name,date:p.briefSavedAt,filled:briefStats(p).filled};
p.importLog=p.importLog||[];
p.importLog.push(today()+': сформирован и добавлен в проект Word-бриф '+name);
saveStateNow();
renderBrief();
showToast('Word-бриф добавлен в материалы проекта');
}catch(e){
console.error(e);
showToast('Не удалось сформировать Word: '+(e.message||e));
}
}
function xmlEsc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]));}
function docxTextRun(text,bold=false){
return `<w:r>${bold?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
}
function docxParagraph(text,opt={}){
const size=opt.size?`<w:sz w:val="${opt.size}"/><w:szCs w:val="${opt.size}"/>`:'';
const bold=opt.bold?'<w:b/>':'';
const color=opt.color?`<w:color w:val="${opt.color}"/>`:'';
const spacing=`<w:spacing w:after="${opt.after??120}"/>`;
const indent=opt.indent?`<w:ind w:left="${opt.indent}"/>`:'';
const pPr=`<w:pPr>${spacing}${indent}</w:pPr>`;
const rPr=(bold||size||color)?`<w:rPr>${bold}${size}${color}</w:rPr>`:'';
return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r></w:p>`;
}
function docxMultilineAnswer(text){
return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>docxParagraph(line,{indent:360,after:80})).join('');
}
function buildBriefDocumentXml(p,sections){
const stats=briefStats(p);
const formed=new Date().toLocaleString('ru-RU');
let body='';
body+=docxParagraph('Бриф проекта',{bold:true,size:36,after:240});
body+=docxParagraph(`Проект: ${p.title||'без названия'}`,{bold:true,after:80});
if(p.niche) body+=docxParagraph(`Ниша: ${p.niche}`,{after:80});
body+=docxParagraph(`Статус: ${p.status||'Бриф'}`,{after:80});
body+=docxParagraph(`Дата формирования: ${formed}`,{after:80});
body+=docxParagraph(`Заполнено: ${stats.filled}/${stats.total} (${stats.progress}%)`,{after:240});
sections.forEach(sec=>{
body+=docxParagraph(sec.title,{bold:true,size:28,after:160});
sec.questions.forEach((q,idx)=>{
  body+=docxParagraph(`${idx+1}. ${q.text}`,{bold:true,after:80});
  body+=docxMultilineAnswer(q.answer);
  body+=docxParagraph('',{after:120});
});
});
body+='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>';
return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14"><w:body>${body}</w:body></w:document>`;
}
function buildBriefDocxBlob(p,sections){
const now=new Date().toISOString();
const files={
'[Content_Types].xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
'_rels/.rels':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`,
'docProps/core.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc('Бриф проекта')}</dc:title><dc:subject>${xmlEsc(p.title||'')}</dc:subject><dc:creator>Agency Brief Systems</dc:creator><cp:lastModifiedBy>Agency Brief Systems</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`,
'docProps/app.xml':`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Agency Brief Systems</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>3.9.10</AppVersion></Properties>`,
'word/document.xml':buildBriefDocumentXml(p,sections)
};
return new Blob([makeZipBlobData(files)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function makeZipBlobData(files){
const encoder=new TextEncoder();
const entries=Object.entries(files).map(([name,content])=>({name,data:encoder.encode(content)}));
const chunks=[];
const central=[];
let offset=0;
const crcTable=getCrcTable();
const dosTimeDate=zipDosTimeDate(new Date());
for(const entry of entries){
const nameBytes=encoder.encode(entry.name);
const crc=crc32(entry.data,crcTable);
const local=concatU8([
  u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(dosTimeDate.time),u16(dosTimeDate.date),u32(crc),u32(entry.data.length),u32(entry.data.length),u16(nameBytes.length),u16(0),nameBytes,entry.data
]);
chunks.push(local);
central.push(concatU8([
  u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(dosTimeDate.time),u16(dosTimeDate.date),u32(crc),u32(entry.data.length),u32(entry.data.length),u16(nameBytes.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nameBytes
]));
offset+=local.length;
}
const centralOffset=offset;
const centralData=concatU8(central);
const end=concatU8([u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralData.length),u32(centralOffset),u16(0)]);
return concatU8([...chunks,centralData,end]);
}
function zipDosTimeDate(d){
const time=(d.getHours()<<11)|(d.getMinutes()<<5)|(Math.floor(d.getSeconds()/2));
const date=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
return {time,date};
}
function u16(n){const a=new Uint8Array(2); const v=new DataView(a.buffer); v.setUint16(0,n,true); return a;}
function u32(n){const a=new Uint8Array(4); const v=new DataView(a.buffer); v.setUint32(0,n>>>0,true); return a;}
function concatU8(arrays){const len=arrays.reduce((s,a)=>s+a.length,0); const out=new Uint8Array(len); let p=0; arrays.forEach(a=>{out.set(a,p);p+=a.length;}); return out;}
function getCrcTable(){
if(window.__crcTable) return window.__crcTable;
const table=new Uint32Array(256);
for(let n=0;n<256;n++){
let c=n;
for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
table[n]=c>>>0;
}
window.__crcTable=table;
return table;
}
function crc32(data,table){
let c=0xffffffff;
for(let i=0;i<data.length;i++) c=table[(c^data[i])&0xff]^(c>>>8);
return (c^0xffffffff)>>>0;
}

function humanFileSize(bytes){bytes=Number(bytes)||0; if(bytes<1024)return bytes+' Б'; if(bytes<1024*1024)return Math.round(bytes/1024)+' КБ'; return (bytes/1024/1024).toFixed(1)+' МБ'}
function renderFileList(p){
const files=(p.files||[]).filter(f=>!f.deleted);
return files.map(f=>`<div class="file-card"><div><div class="file-name">${esc(f.name)}</div><div class="file-meta">${esc(f.type||'файл')} · ${humanFileSize(f.size)} · ${esc(f.date||'')}</div></div><div class="actions"><button class="btn" onclick="downloadProjectFile('${f.id}')">Скачать</button><button class="btn danger" onclick="deleteProjectFile('${f.id}')">Удалить</button></div></div>`).join('')||'<div class="empty">Файлы еще не загружены. Можно добавить запись встречи, бриф, презентацию, фото, документы или таблицы.</div>';
}
function openFilesDb(){
return new Promise((resolve,reject)=>{
const req=indexedDB.open('AgencyBriefSystemsFiles',1);
req.onupgradeneeded=e=>{const db=e.target.result; if(!db.objectStoreNames.contains('files')) db.createObjectStore('files',{keyPath:'id'});};
req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
});
}
async function putFileRecord(record){const db=await openFilesDb(); return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite'); tx.objectStore('files').put(record); tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);});}
async function getFileRecord(id){const db=await openFilesDb(); return new Promise((resolve,reject)=>{const tx=db.transaction('files','readonly'); const req=tx.objectStore('files').get(id); req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);});}
async function cleanupOrphanFiles(){
const activeFileIds=new Set(state.projects.flatMap(p=>(p.files||[]).map(f=>f.id)));
const db=await openFilesDb();
return new Promise((resolve,reject)=>{
const tx=db.transaction('files','readwrite');
const store=tx.objectStore('files');
const req=store.openCursor();
let removed=0;
req.onsuccess=e=>{
  const cur=e.target.result;
  if(cur){
    if(!activeFileIds.has(cur.key)){store.delete(cur.key); removed++;}
    cur.continue();
  }
};
tx.oncomplete=()=>resolve(removed);
tx.onerror=()=>reject(tx.error);
});
}
async function removeFileRecord(id){const db=await openFilesDb(); return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite'); tx.objectStore('files').delete(id); tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);});}
async function addProjectFiles(fileList){
const p=currentProject(); if(!p || !fileList?.length)return; p.files=p.files||[];
for(const file of Array.from(fileList)){
const id='f_'+Date.now()+'_'+Math.random().toString(16).slice(2);
await putFileRecord({id,projectId:p.id,name:file.name,type:file.type||'application/octet-stream',size:file.size,date:today(),blob:file});
p.files.unshift({id,name:file.name,type:file.type||'файл',size:file.size,date:today()});
}
p.updatedAt=today(); saveStateNow(); renderProject(); showToast('Файлы добавлены в проект');
}
async function downloadProjectFile(id){
const rec=await getFileRecord(id); if(!rec){showToast('Файл не найден в хранилище браузера');return;}
const a=document.createElement('a'); a.href=URL.createObjectURL(rec.blob); a.download=rec.name||'file'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function deleteProjectFile(id){
if((state.settings.ui?.confirmDelete)!==false && !confirm('Удалить файл из проекта?'))return; const p=currentProject(); if(!p)return; p.files=(p.files||[]).filter(f=>f.id!==id); await removeFileRecord(id); p.updatedAt=today(); saveStateNow(); renderProject(); showToast('Файл удален');
}

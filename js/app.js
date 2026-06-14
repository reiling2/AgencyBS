// #region agent log
window.addEventListener('error',e=>{fetch('http://127.0.0.1:7897/ingest/55c3160c-c4e5-4b8f-ad85-ca588325d327',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fa404'},body:JSON.stringify({sessionId:'0fa404',runId:'pre-fix',hypothesisId:'A',location:'app.js:onerror',message:'window error',data:{msg:String(e.message||''),src:String(e.filename||''),line:e.lineno||0},timestamp:Date.now()})}).catch(()=>{});});
// #endregion
// initial render
try{
renderAll();
// #region agent log
fetch('http://127.0.0.1:7897/ingest/55c3160c-c4e5-4b8f-ad85-ca588325d327',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fa404'},body:JSON.stringify({sessionId:'0fa404',runId:'pre-fix',hypothesisId:'C',location:'app.js:renderAll',message:'initial render ok',data:{activeView:typeof activeView!=='undefined'?activeView:null,projectsViewLen:document.getElementById('view-projects')?.innerHTML?.length??0},timestamp:Date.now()})}).catch(()=>{});
// #endregion
}catch(err){
// #region agent log
fetch('http://127.0.0.1:7897/ingest/55c3160c-c4e5-4b8f-ad85-ca588325d327',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fa404'},body:JSON.stringify({sessionId:'0fa404',runId:'pre-fix',hypothesisId:'C',location:'app.js:renderAll',message:'initial render failed',data:{err:String(err&&err.message||err)},timestamp:Date.now()})}).catch(()=>{});
// #endregion
throw err;
}

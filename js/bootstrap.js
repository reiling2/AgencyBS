// #region agent log
fetch('http://127.0.0.1:7897/ingest/55c3160c-c4e5-4b8f-ad85-ca588325d327',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fa404'},body:JSON.stringify({sessionId:'0fa404',runId:'pre-fix',hypothesisId:'A',location:'bootstrap.js:1',message:'bootstrap start deps',data:{hasLoadState:typeof loadState==='function',hasNormalizeSiteData:typeof normalizeSiteData==='function',hasSiteTabs:typeof SITE_TABS!=='undefined',hasDefaultWeights:typeof defaultWeights==='function'},timestamp:Date.now()})}).catch(()=>{});
// #endregion
let state = loadState();
ensureState();
applyTheme();
// #region agent log
fetch('http://127.0.0.1:7897/ingest/55c3160c-c4e5-4b8f-ad85-ca588325d327',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0fa404'},body:JSON.stringify({sessionId:'0fa404',runId:'pre-fix',hypothesisId:'E',location:'bootstrap.js:8',message:'state loaded',data:{projectCount:state?.projects?.length??0,activeProjectId:state?.activeProjectId||null,theme:state?.settings?.theme||null},timestamp:Date.now()})}).catch(()=>{});
// #endregion
document.addEventListener('DOMContentLoaded',()=>{const bt=document.querySelector('.brand-title'); if(bt) bt.innerHTML=esc((state.settings.workspaceName||'Agency Brief Systems')).replace(/\s+/g,'<br>');});
let activeView = 'projects';
let filter = {q:'', status:'all', niche:'all'};
let briefSearch = '';
let activeBriefSectionId = 's1';
let activeStrategyType = 'utps';
let activeSiteTab = 'overview';

function toggleMobileNav(){
document.body.classList.toggle('mobile-nav-open');
}
function closeMobileNav(){
document.body.classList.remove('mobile-nav-open');
}
window.addEventListener('resize',()=>{if(window.innerWidth>820)closeMobileNav();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});

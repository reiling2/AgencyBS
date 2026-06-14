let state = loadState();
ensureState();
applyTheme();
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

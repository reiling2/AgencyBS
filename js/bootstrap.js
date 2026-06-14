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
const btn=document.querySelector('.mobile-menu-btn');
if(btn) btn.setAttribute('aria-expanded', document.body.classList.contains('mobile-nav-open') ? 'true' : 'false');
}
function closeMobileNav(){
document.body.classList.remove('mobile-nav-open');
const btn=document.querySelector('.mobile-menu-btn');
if(btn) btn.setAttribute('aria-expanded','false');
}
let lastMobileLayout = isMobileLayout();
window.addEventListener('resize',()=>{
const nowMobile = isMobileLayout();
if(window.innerWidth>820) closeMobileNav();
if(nowMobile !== lastMobileLayout){
  lastMobileLayout = nowMobile;
  renderAll();
}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});

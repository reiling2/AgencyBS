let state = loadState();
ensureState();
applyTheme();
document.addEventListener('DOMContentLoaded',()=>{const bt=document.querySelector('.brand-title'); if(bt) bt.innerHTML=esc((state.settings.workspaceName||'Agency Brief Systems')).replace(/\s+/g,'<br>'); updateMobileHeaderMetrics();});
let activeView = 'projects';
let filter = {q:'', status:'all', niche:'all'};
let briefSearch = '';
let activeBriefSectionId = 's1';
let activeStrategyType = 'utps';
let activeSiteTab = 'overview';
let mobileNavScrollY = 0;

function updateMobileHeaderMetrics(){
const header=document.querySelector('.mobile-header');
const h=header ? Math.ceil(header.getBoundingClientRect().height) : 64;
document.documentElement.style.setProperty('--mobile-header-h', (h||64)+'px');
}
function setMobileNavButtonState(open){
const btn=document.querySelector('.mobile-menu-btn');
if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function openMobileNav(){
if(document.body.classList.contains('mobile-nav-open')) return;
updateMobileHeaderMetrics();
mobileNavScrollY = window.scrollY || document.documentElement.scrollTop || 0;
document.documentElement.style.setProperty('--mobile-scroll-y', mobileNavScrollY+'px');
document.body.dataset.mobileScrollY = String(mobileNavScrollY);
document.documentElement.classList.add('mobile-scroll-lock');
document.body.classList.add('mobile-scroll-lock','mobile-nav-open');
setMobileNavButtonState(true);
}
function closeMobileNav(){
const wasOpen=document.body.classList.contains('mobile-nav-open');
const y=Number(document.body.dataset.mobileScrollY || mobileNavScrollY || 0);
document.body.classList.remove('mobile-nav-open','mobile-scroll-lock');
document.documentElement.classList.remove('mobile-scroll-lock');
document.body.dataset.mobileScrollY='';
document.documentElement.style.removeProperty('--mobile-scroll-y');
setMobileNavButtonState(false);
if(wasOpen){
  requestAnimationFrame(()=>window.scrollTo(0,y));
}
}
function toggleMobileNav(){
if(document.body.classList.contains('mobile-nav-open')) closeMobileNav();
else openMobileNav();
}
function blockPageScrollWhenDrawerOpen(e){
if(!document.body.classList.contains('mobile-nav-open')) return;
const sidebar=document.querySelector('.sidebar');
if(sidebar && sidebar.contains(e.target)) return;
e.preventDefault();
}
let lastMobileLayout = isMobileLayout();
window.addEventListener('resize',()=>{
updateMobileHeaderMetrics();
const nowMobile = isMobileLayout();
if(window.innerWidth>820) closeMobileNav();
if(nowMobile !== lastMobileLayout){
  lastMobileLayout = nowMobile;
  renderAll();
}
});
window.addEventListener('orientationchange',()=>setTimeout(updateMobileHeaderMetrics,250));
document.addEventListener('touchmove', blockPageScrollWhenDrawerOpen, {passive:false});
document.addEventListener('wheel', blockPageScrollWhenDrawerOpen, {passive:false});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});

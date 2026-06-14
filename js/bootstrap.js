let state = loadState();
ensureState();
applyTheme();
document.addEventListener('DOMContentLoaded',()=>{
  const bt=document.querySelector('.brand-title');
  if(bt) bt.innerHTML=esc((state.settings.workspaceName||'Agency Brief Systems')).replace(/\s+/g,'<br>');
  updateMobileHeaderMetrics();
  v3922BindMobileMainScroller();
});
let activeView = 'projects';
let filter = {q:'', status:'all', niche:'all'};
let briefSearch = '';
let activeBriefSectionId = 's1';
let activeStrategyType = 'utps';
let activeSiteTab = 'overview';
let mobileNavScrollY = 0;
let mobileNavClosingTimer = 0;
const MOBILE_DRAWER_ANIMATION_MS = 340;

function mobileVisualViewport(){
const vv=window.visualViewport;
return {
  top:0,
  height: vv ? Math.max(320, Math.round(vv.height || window.innerHeight || 640)) : Math.max(320, Math.round(window.innerHeight || 640))
};
}
function syncMobileViewportVars(){
const root=document.documentElement;
const isSmall=window.matchMedia ? window.matchMedia('(max-width:820px)').matches : window.innerWidth<=820;
if(!isSmall) return;
const vv=mobileVisualViewport();
root.style.setProperty('--mobile-vv-top', '0px');
root.style.setProperty('--mobile-vvh', vv.height+'px');
}
function updateMobileHeaderMetrics(){
syncMobileViewportVars();
const header=document.querySelector('.mobile-header');
let h=header ? Math.ceil(header.getBoundingClientRect().height) : (window.innerWidth<=420 ? 60 : 64);
if(!h || h<56 || h>120){ h = window.innerWidth<=420 ? 60 : 64; }
document.documentElement.style.setProperty('--mobile-header-h', h+'px');
}
function setMobileNavButtonState(open){
const btn=document.querySelector('.mobile-menu-btn');
if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function mobilePageScroller(){
return document.querySelector('.main') || document.scrollingElement || document.documentElement;
}
function currentMobileScrollTop(){
const sc=mobilePageScroller();
return sc ? Math.max(0, Math.round(sc.scrollTop || 0)) : Math.max(0, Math.round(window.scrollY || 0));
}
function restoreMobileScrollTop(y){
const sc=mobilePageScroller();
if(sc && typeof sc.scrollTo==='function') sc.scrollTo({top:y,left:0,behavior:'auto'});
else window.scrollTo(0,y);
}
function hardPinMobileDrawer(){
updateMobileHeaderMetrics();
syncMobileViewportVars();
}
function clearHardPinnedMobileDrawer(){
// v3.9.22: drawer positioning is CSS-driven to keep transitions smooth.
}
function keepDrawerPinnedDuringScroll(){
syncMobileViewportVars();
if(document.body.classList.contains('mobile-nav-open')) hardPinMobileDrawer();
}
function openMobileNav(){
if(!isMobileLayout()) return;
if(document.body.classList.contains('mobile-nav-open')) return;
clearTimeout(mobileNavClosingTimer);
updateMobileHeaderMetrics();
mobileNavScrollY = currentMobileScrollTop();
document.body.dataset.mobileScrollY = String(mobileNavScrollY);
document.body.classList.remove('mobile-nav-closing');
document.documentElement.classList.add('mobile-scroll-lock');
document.body.classList.add('mobile-scroll-lock');
setMobileNavButtonState(true);
hardPinMobileDrawer();
requestAnimationFrame(()=>{
  document.body.classList.add('mobile-nav-open');
});
}
function closeMobileNav(){
const wasOpen=document.body.classList.contains('mobile-nav-open');
const wasClosing=document.body.classList.contains('mobile-nav-closing');
if(!wasOpen && !wasClosing) return;
clearTimeout(mobileNavClosingTimer);
const y=Number(document.body.dataset.mobileScrollY || mobileNavScrollY || currentMobileScrollTop() || 0);
document.body.classList.remove('mobile-nav-open');
document.body.classList.add('mobile-nav-closing');
setMobileNavButtonState(false);
mobileNavClosingTimer=setTimeout(()=>{
  document.body.classList.remove('mobile-nav-closing','mobile-scroll-lock');
  document.documentElement.classList.remove('mobile-scroll-lock');
  document.body.dataset.mobileScrollY='';
  document.documentElement.style.removeProperty('--mobile-scroll-y');
  clearHardPinnedMobileDrawer();
  restoreMobileScrollTop(y);
}, MOBILE_DRAWER_ANIMATION_MS);
}
function toggleMobileNav(){
if(document.body.classList.contains('mobile-nav-open') || document.body.classList.contains('mobile-nav-closing')) closeMobileNav();
else openMobileNav();
}
function blockPageScrollWhenDrawerOpen(e){
if(!document.body.classList.contains('mobile-nav-open') && !document.body.classList.contains('mobile-nav-closing')) return;
const nav=e.target && e.target.closest ? e.target.closest('.sidebar .nav') : null;
if(nav) return;
if(e.cancelable) e.preventDefault();
}
function v3922BindMobileMainScroller(){
  const main=document.querySelector('.main');
  if(!main || main.dataset.v3922Bound) return;
  main.dataset.v3922Bound='1';
  main.addEventListener('scroll', keepDrawerPinnedDuringScroll, {passive:true});
}

/* v3.9.21 — mobile document overscroll guard.
   iOS Safari and Telegram in-app browser can move fixed elements during
   rubber-band overscroll at the top/bottom of the document. We block only
   edge drags, so normal page scrolling and form interactions still work. */
let mobileEdgeTouchStartY = 0;
function isEditableMobileTarget(el){
  return !!(el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]'));
}
function isScrollableElement(el){
  if(!el || el === document.body || el === document.documentElement) return false;
  const st = window.getComputedStyle ? getComputedStyle(el) : null;
  const oy = st ? (st.overflowY || st.overflow) : '';
  return /(auto|scroll)/.test(oy) && el.scrollHeight > el.clientHeight + 1;
}
function nearestScrollableElement(el){
  let cur = el;
  while(cur && cur !== document.body && cur !== document.documentElement){
    if(isScrollableElement(cur)) return cur;
    cur = cur.parentElement;
  }
  return null;
}
function preventMobileRubberBandAtDocumentEdges(e){
  if(!isMobileLayout()) return;
  if(document.body.classList.contains('mobile-nav-open')) return;
  if(!e.touches || e.touches.length !== 1) return;
  if(isEditableMobileTarget(e.target)) return;
  const currentY = e.touches[0].clientY;
  const deltaY = currentY - mobileEdgeTouchStartY;
  if(!deltaY) return;

  const innerScroller = nearestScrollableElement(e.target);
  if(innerScroller){
    const atInnerTop = innerScroller.scrollTop <= 0;
    const atInnerBottom = Math.ceil(innerScroller.scrollTop + innerScroller.clientHeight) >= innerScroller.scrollHeight;
    if(!((atInnerTop && deltaY > 0) || (atInnerBottom && deltaY < 0))) return;
  }

  const se = document.scrollingElement || document.documentElement;
  const scrollTop = Math.max(0, window.scrollY || se.scrollTop || document.documentElement.scrollTop || 0);
  const viewportH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const maxScroll = Math.max(0, se.scrollHeight - Math.ceil(viewportH || se.clientHeight || window.innerHeight));
  const atTop = scrollTop <= 0;
  const atBottom = scrollTop >= maxScroll - 2;

  if((atTop && deltaY > 0) || (atBottom && deltaY < 0) || maxScroll <= 0){
    if(e.cancelable) e.preventDefault();
    updateMobileHeaderMetrics();
  }
}
function storeMobileEdgeTouchStart(e){
  if(!e.touches || !e.touches.length) return;
  mobileEdgeTouchStartY = e.touches[0].clientY;
  updateMobileHeaderMetrics();
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
window.addEventListener('orientationchange',()=>setTimeout(()=>{updateMobileHeaderMetrics();keepDrawerPinnedDuringScroll();},250));
window.addEventListener('load',()=>setTimeout(updateMobileHeaderMetrics,50));
window.addEventListener('scroll', keepDrawerPinnedDuringScroll, {passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', ()=>{updateMobileHeaderMetrics();keepDrawerPinnedDuringScroll();});
  window.visualViewport.addEventListener('scroll', ()=>{updateMobileHeaderMetrics();keepDrawerPinnedDuringScroll();});
}
document.addEventListener('touchmove', blockPageScrollWhenDrawerOpen, {passive:false,capture:true});
document.addEventListener('wheel', blockPageScrollWhenDrawerOpen, {passive:false,capture:true});

document.addEventListener('touchstart', storeMobileEdgeTouchStart, {passive:true,capture:true});
document.addEventListener('touchmove', preventMobileRubberBandAtDocumentEdges, {passive:false,capture:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});

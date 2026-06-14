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

function mobileVisualViewport(){
const vv=window.visualViewport;
return {
  top: vv ? Math.max(0, Math.round(vv.offsetTop || 0)) : 0,
  height: vv ? Math.max(320, Math.round(vv.height || window.innerHeight || 640)) : Math.max(320, Math.round(window.innerHeight || 640))
};
}
function syncMobileViewportVars(){
const root=document.documentElement;
const isSmall=window.matchMedia ? window.matchMedia('(max-width:820px)').matches : window.innerWidth<=820;
if(!isSmall) return;
const vv=mobileVisualViewport();
root.style.setProperty('--mobile-vv-top', vv.top+'px');
root.style.setProperty('--mobile-vvh', vv.height+'px');
}
function updateMobileHeaderMetrics(){
syncMobileViewportVars();
const header=document.querySelector('.mobile-header');
let h=header ? Math.ceil(header.getBoundingClientRect().height) : 64;
if(!h || h<56 || h>120){ h = window.innerWidth<=420 ? 60 : 64; }
document.documentElement.style.setProperty('--mobile-header-h', h+'px');
}
function setMobileNavButtonState(open){
const btn=document.querySelector('.mobile-menu-btn');
if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function hardPinMobileDrawer(){
updateMobileHeaderMetrics();
const header=document.querySelector('.mobile-header');
const sidebar=document.querySelector('.sidebar');
const overlay=document.querySelector('.nav-overlay');
const rootStyle=getComputedStyle(document.documentElement);
const h=Math.ceil(Number(rootStyle.getPropertyValue('--mobile-header-h').replace('px',''))||64);
const vv=mobileVisualViewport();
document.documentElement.style.setProperty('--mobile-vv-top', vv.top+'px');
document.documentElement.style.setProperty('--mobile-vvh', vv.height+'px');
if(header){
  Object.assign(header.style,{position:'fixed',top:vv.top+'px',left:'0px',right:'0px',width:'100vw',zIndex:'5200',transform:'translate3d(0,0,0)'});
}
if(overlay){
  Object.assign(overlay.style,{position:'fixed',top:vv.top+'px',left:'0px',right:'0px',bottom:'auto',height:vv.height+'px',zIndex:'5050',transform:'translate3d(0,0,0)'});
}
if(sidebar){
  Object.assign(sidebar.style,{position:'fixed',top:vv.top+'px',left:'0px',bottom:'auto',height:vv.height+'px',minHeight:vv.height+'px',maxHeight:vv.height+'px',paddingTop:(h+14)+'px',overflow:'hidden',zIndex:'5100',transform:'translate3d(0,0,0)'});
}
}
function clearHardPinnedMobileDrawer(){
['.mobile-header','.sidebar','.nav-overlay'].forEach(sel=>{
  const el=document.querySelector(sel);
  if(!el) return;
  ['position','top','left','right','bottom','width','height','minHeight','maxHeight','paddingTop','overflow','zIndex','transform'].forEach(k=>el.style[k]='');
});
}
let drawerPinRaf=0;
function keepDrawerPinnedDuringScroll(){
if(!document.body.classList.contains('mobile-nav-open')){
  syncMobileViewportVars();
  return;
}
if(drawerPinRaf) return;
drawerPinRaf=requestAnimationFrame(()=>{
  drawerPinRaf=0;
  hardPinMobileDrawer();
  if(Math.abs((window.scrollY||0) - (mobileNavScrollY||0))>1){
    window.scrollTo(0, mobileNavScrollY || 0);
  }
});
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
hardPinMobileDrawer();
}
function closeMobileNav(){
const wasOpen=document.body.classList.contains('mobile-nav-open');
const y=Number(document.body.dataset.mobileScrollY || mobileNavScrollY || 0);
document.body.classList.remove('mobile-nav-open','mobile-scroll-lock');
document.documentElement.classList.remove('mobile-scroll-lock');
document.body.dataset.mobileScrollY='';
document.documentElement.style.removeProperty('--mobile-scroll-y');
setMobileNavButtonState(false);
clearHardPinnedMobileDrawer();
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
// Important for iOS/Telegram: while the drawer is open, block every drag.
// Click/tap events still work, but touchmove/wheel cannot move the page or shell.
if(e.cancelable) e.preventDefault();
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

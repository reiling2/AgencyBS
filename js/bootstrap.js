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
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});

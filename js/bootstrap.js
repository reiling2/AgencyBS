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
function hardPinMobileDrawer(){
const header=document.querySelector('.mobile-header');
const sidebar=document.querySelector('.sidebar');
const overlay=document.querySelector('.nav-overlay');
const h=header ? Math.ceil(header.getBoundingClientRect().height) : 64;
document.documentElement.style.setProperty('--mobile-header-h', h+'px');
if(header){
  Object.assign(header.style,{position:'fixed',top:'0px',left:'0px',right:'0px',width:'100%',zIndex:'1700',transform:'translate3d(0,0,0)'});
}
if(overlay){
  Object.assign(overlay.style,{position:'fixed',top:'0px',left:'0px',right:'0px',bottom:'0px',height:'100svh',zIndex:'1500'});
}
if(sidebar){
  Object.assign(sidebar.style,{position:'fixed',top:'0px',left:'0px',bottom:'auto',height:'100svh',minHeight:'100svh',maxHeight:'100svh',paddingTop:(h+14)+'px',overflow:'hidden',zIndex:'1550',transform:'translate3d(0,0,0)'});
}
}
function clearHardPinnedMobileDrawer(){
['.mobile-header','.sidebar','.nav-overlay'].forEach(sel=>{
  const el=document.querySelector(sel);
  if(!el) return;
  ['position','top','left','right','bottom','width','height','minHeight','maxHeight','paddingTop','overflow','zIndex','transform'].forEach(k=>el.style[k]='');
});
}
function keepDrawerPinnedDuringScroll(){
if(!document.body.classList.contains('mobile-nav-open')) return;
hardPinMobileDrawer();
window.scrollTo(0, mobileNavScrollY || 0);
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
// iOS Safari can visually move fixed drawers when touch scrolling is
// allowed inside the off-canvas area. While the drawer is open we
// block touch/wheel scrolling completely; taps on menu buttons still work.
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
window.addEventListener('orientationchange',()=>setTimeout(()=>{updateMobileHeaderMetrics();keepDrawerPinnedDuringScroll();},250));
window.addEventListener('scroll', keepDrawerPinnedDuringScroll, {passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', keepDrawerPinnedDuringScroll);
  window.visualViewport.addEventListener('scroll', keepDrawerPinnedDuringScroll);
}
document.addEventListener('touchmove', blockPageScrollWhenDrawerOpen, {passive:false});
document.addEventListener('wheel', blockPageScrollWhenDrawerOpen, {passive:false});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobileNav();});

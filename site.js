// Load nearby photos first, without changing any original image files.
(() => {
 const photos = [...document.querySelectorAll('img[data-src]')];
 if (!photos.length) return;
 const load = image => {
  image.loading = 'eager';
  image.src = image.dataset.src;
  delete image.dataset.src;
 };
 if (!('IntersectionObserver' in window)) { photos.forEach(load); return; }
 const pending = new Set();
 let active = 0;
 const distance = image => {
  const box = image.getBoundingClientRect();
  return Math.max(0, box.top - window.innerHeight, -box.bottom);
 };
 const drain = () => {
  while (active < 2 && pending.size) {
   const image = [...pending].sort((a, b) => distance(a) - distance(b))[0];
   pending.delete(image);
   observer.unobserve(image);
   active++;
   const finished = () => {
    image.removeEventListener('load', finished);
    image.removeEventListener('error', finished);
    active--;
    drain();
   };
   image.addEventListener('load', finished);
   image.addEventListener('error', finished);
   load(image);
  }
 };
 // The viewport observer also clips against horizontally scrolling galleries.
 const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
   if (entry.isIntersecting) pending.add(entry.target);
   else pending.delete(entry.target);
  });
  drain();
 }, {rootMargin: '600px 0px', threshold: 0});
 photos.forEach(image => observer.observe(image));
})();
// End image loading.

// Keep direct file previews usable; hosted navigation uses extensionless URLs.
if(window.location.protocol==='file:'){
 document.querySelectorAll('a[href^="/"]').forEach(link=>{
  const href=link.getAttribute('href');
  const match=href.match(/^\/([a-z0-9-]*)?(#[^]*)?$/);
  if(match){const page=match[1]||'index';link.setAttribute('href',page+'.html'+(match[2]||''))}
 });
}
// End file preview compatibility.
// Glass navigation follows scroll without changing the header dimensions.
const glassHeader=document.querySelector('.nav-shell');
if(glassHeader){
 let scrollUpdateQueued=false;
 const updateGlassHeader=()=>{glassHeader.classList.toggle('is-scrolled',window.scrollY>40);scrollUpdateQueued=false};
 const queueGlassHeader=()=>{if(!scrollUpdateQueued){scrollUpdateQueued=true;window.requestAnimationFrame(updateGlassHeader)}};
 window.addEventListener('scroll',queueGlassHeader,{passive:true});
 window.addEventListener('pageshow',updateGlassHeader);
 updateGlassHeader();
}
// End glass navigation.
const menu=document.querySelector('.menu');
const nav=document.querySelector('#nav-links');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}});
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const gallery=document.querySelector('.carousel');
document.querySelectorAll('[data-slide]').forEach(button=>button.addEventListener('click',()=>gallery.scrollBy({left:Number(button.dataset.slide)*(gallery.querySelector('figure').getBoundingClientRect().width+24),behavior:reduceMotion.matches?'instant':'smooth'})));
const dialog=document.querySelector('#photo-dialog');
document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{dialog.querySelector('img').src=button.dataset.photo;dialog.querySelector('img').alt=button.dataset.caption;dialog.querySelector('p').textContent=button.dataset.caption;dialog.showModal()}));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
let motion;
function initMotion(){
 if(motion)motion.revert();
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);motion=gsap.matchMedia();
 motion.add('(prefers-reduced-motion: no-preference)',()=>{
  document.querySelectorAll('.reveal-words').forEach(p=>{
   if(!p.querySelector('.word')){const text=p.textContent;p.setAttribute('aria-label',text);p.innerHTML=text.split(' ').map(w=>`<span class="word" aria-hidden="true">${w}</span>`).join(' ')}
   gsap.fromTo(p.querySelectorAll('.word'),{color:'#526780',opacity:1},{color:'#0b2545',opacity:1,stagger:.15,ease:'none',scrollTrigger:{trigger:p,start:'top 85%',end:'bottom 55%',scrub:1}});
  });
 });
 motion.add('(min-width: 821px) and (prefers-reduced-motion: no-preference)',()=>{
  const journal=document.querySelector('.journal');
  if(journal&&!journal.closest('[hidden]'))ScrollTrigger.create({trigger:journal,start:'top 125px',end:()=>'+='+Math.max(0,journal.offsetHeight-journal.querySelector('.journal-heading').offsetHeight-120),pin:journal.querySelector('.journal-heading'),pinSpacing:false,invalidateOnRefresh:true});
 });
}
const tabs=Array.from(document.querySelectorAll('[role="tab"]'));
function selectTab(tab){if(motion)motion.revert();tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected});initMotion();window.ScrollTrigger?.refresh()}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(i+1)%tabs.length;if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n!==undefined){e.preventDefault();selectTab(tabs[n]);tabs[n].focus()}})});
const form=document.querySelector('#contact-form');
form?.addEventListener('submit',e=>{
 e.preventDefault();
 const status=document.querySelector('#form-status');
 const fields=new FormData(form);
 const result=RobotechsForm.validateContact(Object.fromEntries(fields));
 form.querySelectorAll('[aria-invalid]').forEach(field=>field.removeAttribute('aria-invalid'));
 if(!result.ok){
  status.textContent=result.error;
  if(result.field){const field=form.elements.namedItem(result.field);field.setAttribute('aria-invalid','true');field.focus()}
  return;
 }
 if(!form.reportValidity())return;
 const body=`Name: ${result.name}\nEmail: ${result.email}\n\n${result.message}`;
 const gmailUrl=`https://mail.google.com/mail/?view=cm&fs=1&to=robot3chs%40gmail.com&su=${encodeURIComponent('Website enquiry from '+result.name)}&body=${encodeURIComponent(body)}`;
 window.open(gmailUrl,'_blank','noopener,noreferrer');
 status.textContent='Review your draft in the Gmail tab and press Send. If it didn’t open, use the email link below.';
});
// Enable submission only after its handler and validator are ready.
if(form&&typeof RobotechsForm!=='undefined'&&typeof RobotechsForm.validateContact==='function')form.querySelector('[type="submit"]').disabled=false;
const privacyNotice=document.querySelector('.privacy-banner');
const privacyKey='robotechs.privacyNotice.v1';
function noticeWasDismissed(){
 try{const choice=JSON.parse(localStorage.getItem(privacyKey));return choice?.essentialOnly===true&&Number(choice.expires)>Date.now()}catch{return false}
}
if(privacyNotice)privacyNotice.hidden=noticeWasDismissed();
document.querySelector('#privacy-dismiss')?.addEventListener('click',()=>{
 try{localStorage.setItem(privacyKey,JSON.stringify({essentialOnly:true,expires:Date.now()+180*86400000}))}catch{}
 privacyNotice.hidden=true;
});
document.querySelector('.cookie-settings')?.addEventListener('click',()=>{
 try{localStorage.removeItem(privacyKey)}catch{}
 privacyNotice.hidden=false;document.querySelector('#privacy-dismiss').focus();
});
initMotion();
window.addEventListener('load',()=>window.ScrollTrigger?.refresh());

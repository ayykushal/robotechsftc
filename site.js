// Event location links. Let the operating system handle native map links.
(() => {
 const agent = navigator.userAgent || '';
 const apple = /iPhone|iPad|iPod|Macintosh/.test(agent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
 document.querySelectorAll('a[data-map-query]').forEach(link => {
  const query = link.dataset.mapQuery.trim();
  if (!query) return;
  const encoded = encodeURIComponent(query);
  if (/Android/i.test(agent)) link.href = 'geo:0,0?q=' + encoded;
  else if (apple) link.href = 'https://maps.apple.com/?daddr=' + encoded;
  // Other browsers and browsers without JavaScript keep the HTTPS web-map fallback.
 });
})();
// End event location links.

// Load nearby photos first, without changing any original image files.
(() => {
 const photos = [...document.querySelectorAll('img[data-src]')];
 if (!photos.length) return;
 const load = image => {
  image.loading = 'eager';
  image.closest('picture')?.querySelectorAll('source[data-srcset]').forEach(source => {
   source.srcset = source.dataset.srcset;
   delete source.dataset.srcset;
  });
  if (image.dataset.srcset) {
   image.srcset = image.dataset.srcset;
   delete image.dataset.srcset;
  }
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
 let scrollUpdateQueued=false,lastGlassScroll=window.scrollY;
 const updateGlassHeader=()=>{const y=window.scrollY,delta=y-lastGlassScroll;glassHeader.classList.toggle('is-scrolled',y>40);const mobile=matchMedia('(max-width: 820px)').matches;const menuOpen=document.querySelector('.menu')?.getAttribute('aria-expanded')==='true';if(!mobile||menuOpen||y<160)glassHeader.classList.remove('is-away');else if(delta>10)glassHeader.classList.add('is-away');else if(delta<-10)glassHeader.classList.remove('is-away');lastGlassScroll=y;scrollUpdateQueued=false};
 const queueGlassHeader=()=>{if(!scrollUpdateQueued){scrollUpdateQueued=true;window.requestAnimationFrame(updateGlassHeader)}};
 window.addEventListener('scroll',queueGlassHeader,{passive:true});
 window.addEventListener('pageshow',updateGlassHeader);
 updateGlassHeader();
 glassHeader.addEventListener('focusin',()=>glassHeader.classList.remove('is-away'));
}
// End glass navigation.
const menu=document.querySelector('.menu');
const nav=document.querySelector('#nav-links');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}});
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const gallery=document.querySelector('.carousel');
document.querySelectorAll('[data-slide]').forEach(button=>button.addEventListener('click',()=>gallery.scrollBy({left:Number(button.dataset.slide)*(gallery.querySelector('figure').getBoundingClientRect().width+24),behavior:reduceMotion.matches?'instant':'smooth'})));
// Native dialog keeps focus and Escape handling accessible while motion stays in CSS.
const dialog=document.querySelector('#photo-dialog');
if(dialog){
 const image=dialog.querySelector('img');
 const closeButton=dialog.querySelector('.close');
 const toolbar=document.createElement('div');
 toolbar.className='photo-toolbar';
 const control=(label,key,value,...content)=>{
  const button=document.createElement('button');
  button.type='button';
  button.dataset[key]=value;
  button.setAttribute('aria-label',label);
  button.append(...content);
  return button;
 };
 const statusOutput=(label,value='')=>{
  const output=document.createElement('output');
  output.setAttribute('aria-live','polite');
  output.setAttribute('aria-label',label);
  output.textContent=value;
  return output;
 };
 const zoomControls=document.createElement('div');
 zoomControls.className='photo-zoom-controls';
 zoomControls.setAttribute('role','group');
 zoomControls.setAttribute('aria-label','Photo zoom');
 zoomControls.append(control('Zoom out','zoom','out','−'),statusOutput('Zoom level','100%'),control('Zoom in','zoom','in','+'),control('Reset zoom','zoom','fit','Fit'));
 closeButton.setAttribute('autofocus','');
 toolbar.append(zoomControls,closeButton);
 const viewport=document.createElement('div');
 viewport.className='photo-viewport';
 const loading=document.createElement('span');
 loading.className='photo-loading';
 loading.setAttribute('role','status');
 image.draggable=false;
 viewport.append(image,loading);
 const navigation=document.createElement('div');
 navigation.className='photo-navigation';
 const arrow=glyph=>{
  const span=document.createElement('span');
  span.setAttribute('aria-hidden','true');
  span.textContent=glyph;
  return span;
 };
 navigation.append(control('Previous photo','photoStep','-1',arrow('←'),' Previous'),statusOutput('Photo position'),control('Next photo','photoStep','1','Next ',arrow('→')));
 dialog.replaceChildren(toolbar,viewport,navigation);
 dialog.setAttribute('aria-label','Photo viewer');
 const zoomIn=toolbar.querySelector('[data-zoom="in"]');
 const zoomOut=toolbar.querySelector('[data-zoom="out"]');
 const zoomFit=toolbar.querySelector('[data-zoom="fit"]');
 const level=toolbar.querySelector('output');
 let zoom=1,panX=0,panY=0,drag=null,ready=false,closeTimer,photos=[],photoIndex=0;
 const render=()=>{
  const fit=Math.min(viewport.clientWidth/(image.naturalWidth||1),viewport.clientHeight/(image.naturalHeight||1));
  const limitX=Math.max(0,((image.naturalWidth||0)*fit*zoom-viewport.clientWidth)/2);
  const limitY=Math.max(0,((image.naturalHeight||0)*fit*zoom-viewport.clientHeight)/2);
  panX=Math.max(-limitX,Math.min(limitX,panX));
  panY=Math.max(-limitY,Math.min(limitY,panY));
  image.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;
  viewport.classList.toggle('is-zoomed',zoom>1);
  level.value=`${Math.round(zoom*100)}%`;
  zoomOut.disabled=!ready||zoom===1;
  zoomIn.disabled=!ready||zoom===4;
  zoomFit.disabled=!ready||zoom===1;
 };
 const setZoom=value=>{zoom=Math.max(1,Math.min(4,value));if(zoom===1){panX=0;panY=0}render()};
 const finishClose=()=>{clearTimeout(closeTimer);dialog.close()};
 const closePhoto=()=>{
  if(!dialog.open||dialog.classList.contains('is-closing'))return;
  dialog.classList.add('is-closing');
  closeTimer=setTimeout(finishClose,reduceMotion.matches?100:220);
 };
 dialog.addEventListener('transitionend',e=>{if(e.target===dialog&&e.propertyName==='opacity'&&dialog.classList.contains('is-closing'))finishClose()});
 dialog.addEventListener('cancel',e=>{e.preventDefault();closePhoto()});
 closeButton.addEventListener('click',closePhoto);
 dialog.addEventListener('click',e=>{
  if(e.target!==dialog)return;
  const box=dialog.getBoundingClientRect();
  if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)closePhoto();
 });
 dialog.addEventListener('close',()=>{
  clearTimeout(closeTimer);
  dialog.classList.remove('is-closing');
  document.documentElement.classList.remove('photo-viewer-open');
  drag=null;viewport.classList.remove('is-dragging');
 });
 image.addEventListener('load',()=>{ready=true;image.style.visibility='visible';loading.hidden=true;render()});
 image.addEventListener('error',()=>{ready=false;loading.textContent='This photo could not load. Please try again.';loading.hidden=false;render()});
 const showPhoto=button=>{
  clearTimeout(closeTimer);dialog.classList.remove('is-closing');
  ready=false;zoom=1;panX=0;panY=0;drag=null;
  viewport.classList.remove('is-dragging');
  navigation.hidden=photos.length<2;
  navigation.querySelector('output').value=`${photoIndex+1} / ${photos.length}`;
  image.style.visibility='hidden';
  loading.hidden=false;loading.textContent='Loading photo…';
  image.alt=button.dataset.caption||'Event photo';
  image.src=button.dataset.photo;
  if(!dialog.open)dialog.showModal();
  document.documentElement.classList.add('photo-viewer-open');
  if(image.complete&&image.naturalWidth){ready=true;image.style.visibility='visible';loading.hidden=true}
  render();
 };
 document.querySelectorAll('[data-photo]').forEach(button=>button.addEventListener('click',()=>{
  const group=button.closest('.event-gallery,.archive,.journal-items,.event-announcement,.event-flyer-layout')||button.closest('section')||document;
  photos=[...group.querySelectorAll('[data-photo]')].filter(photo=>!photo.closest('[hidden]'));
  photoIndex=photos.indexOf(button);
  showPhoto(button);
 }));
 const stepPhoto=step=>{
  if(photos.length<2)return;
  photoIndex=(photoIndex+step+photos.length)%photos.length;
  showPhoto(photos[photoIndex]);
 };
 navigation.querySelectorAll('[data-photo-step]').forEach(button=>button.addEventListener('click',()=>stepPhoto(Number(button.dataset.photoStep))));
 zoomIn.addEventListener('click',()=>setZoom(zoom+.5));
 zoomOut.addEventListener('click',()=>setZoom(zoom-.5));
 zoomFit.addEventListener('click',()=>setZoom(1));
 dialog.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.key==='ArrowLeft'){e.preventDefault();stepPhoto(-1);return}
  if(e.key==='ArrowRight'){e.preventDefault();stepPhoto(1);return}
  if(!ready)return;
  if(e.key==='+'||e.key==='='){e.preventDefault();setZoom(zoom+.5)}
  if(e.key==='-'){e.preventDefault();setZoom(zoom-.5)}
  if(e.key==='0'){e.preventDefault();setZoom(1)}
 });
 viewport.addEventListener('dblclick',()=>{if(ready)setZoom(zoom>1?1:2)});
 viewport.addEventListener('pointerdown',e=>{
  if(zoom===1||!ready||!e.isPrimary||e.button!==0)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};
  viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');
 });
 viewport.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  panX+=e.clientX-drag.x;panY+=e.clientY-drag.y;
  drag.x=e.clientX;drag.y=e.clientY;render();
 });
 const endDrag=()=>{drag=null;viewport.classList.remove('is-dragging')};
 viewport.addEventListener('pointerup',endDrag);
 viewport.addEventListener('pointercancel',endDrag);
 viewport.addEventListener('lostpointercapture',endDrag);
 if('ResizeObserver' in window)new ResizeObserver(()=>{if(dialog.open)render()}).observe(viewport);
}

let motion;
function initMotion(){
 if(motion)motion.revert();
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);motion=gsap.matchMedia();
 motion.add('(prefers-reduced-motion: no-preference)',()=>{
  document.querySelectorAll('.reveal-words').forEach(p=>{
   if(!p.querySelector('.word')){const text=p.textContent;p.setAttribute('aria-label',text);const words=document.createDocumentFragment();text.split(' ').forEach((word,i)=>{if(i)words.append(document.createTextNode(' '));const span=document.createElement('span');span.className='word';span.setAttribute('aria-hidden','true');span.textContent=word;words.append(span)});p.replaceChildren(words)}
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
 try{const choice=JSON.parse(localStorage.getItem(privacyKey));return typeof choice?.essentialOnly==='boolean'&&Number(choice.expires)>Date.now()}catch{return false}
}
function savePrivacyChoice(essentialOnly){
 try{localStorage.setItem(privacyKey,JSON.stringify({essentialOnly,expires:Date.now()+180*86400000}))}catch{}
 window.dispatchEvent(new CustomEvent('robotechs:privacy-change',{detail:{allowAnalytics:!essentialOnly}}));
 if(privacyNotice)privacyNotice.hidden=true;
}
if(privacyNotice)privacyNotice.hidden=noticeWasDismissed();
document.querySelector('#privacy-dismiss')?.addEventListener('click',()=>savePrivacyChoice(true));
document.querySelector('#privacy-allow')?.addEventListener('click',()=>savePrivacyChoice(false));
document.querySelector('.cookie-settings')?.addEventListener('click',()=>{
 try{localStorage.removeItem(privacyKey)}catch{}
 window.dispatchEvent(new CustomEvent('robotechs:privacy-change',{detail:{allowAnalytics:false}}));
 privacyNotice.hidden=false;document.querySelector('#privacy-dismiss').focus();
});
initMotion();
window.addEventListener('load',()=>window.ScrollTrigger?.refresh());

// Two glass lobes: one on the page you are on, one tracking the pointer.
// They are painted as a single path with a wide, smooth waist, so they read as
// one liquid surface instead of two detached pills.
(() => {
 const group = document.querySelector('.nav #nav-links');
 if (!group) return;
 const links = [...group.querySelectorAll('a')];
 const desktop = matchMedia('(min-width: 821px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
 const solid = matchMedia('(prefers-reduced-transparency: reduce), (prefers-contrast: more)');
 let dispose;
 const sync = () => {
  dispose?.();
  dispose = undefined;
  if (!desktop.matches || solid.matches) return;
  const bubble = document.createElement('div');
  bubble.className = 'nav-link-bubble';
  bubble.setAttribute('aria-hidden', 'true');
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('focusable', 'false');
  const defs = document.createElementNS(ns, 'defs');
  const gradient = (id, x2, stops) => {
   const element = document.createElementNS(ns, 'linearGradient');
   for (const [name, value] of Object.entries({id, x1: '0', y1: '0', x2, y2: '1'})) element.setAttribute(name, value);
   for (const [offset, color, opacity] of stops) {
    const stop = document.createElementNS(ns, 'stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    if (opacity) stop.setAttribute('stop-opacity', opacity);
    element.append(stop);
   }
   defs.append(element);
  };
  gradient('nav-fluid-fill', '.35', [['0', '#ffffff', '.85'], ['.48', '#f2f8ff', '.44'], ['1', '#c9def4', '.56']]);
  gradient('nav-fluid-rim', '0', [['0', '#ffffff'], ['.55', '#ffffff', '.7'], ['1', '#93b3d2', '.6']]);
  svg.append(defs);
  const outline = document.createElementNS(ns, 'path');
  outline.setAttribute('fill', 'url(#nav-fluid-fill)');
  outline.setAttribute('stroke', 'url(#nav-fluid-rim)');
  outline.setAttribute('stroke-width', '1.2');
  svg.append(outline);
  bubble.append(svg);
  group.classList.add('nav-link-glass');
  group.append(bubble);
  const current = links.find(link => link.hasAttribute('aria-current'));
  let frame = 0, last = 0, positioned = false, visible = false;
  let x = 0, width = 100, vx = 0, vw = 0, targetX = 0, targetWidth = 100;
  let tailX = 0, tailWidth = 100, tailVX = 0, tailVW = 0;
  let height = 44, viewBox = '';
  // The leading lobe answers quickly; the trailing one lags, which is what keeps
  // a second lobe sitting on the page title you came from while the pointer moves.
  const omega = 2 * Math.PI / .32, omegaTail = 2 * Math.PI / .52;
  const spring = (position, velocity, target, dt, rate) => {
   const offset = position - target, c = velocity + rate * offset, decay = Math.exp(-rate * dt);
   return [target + (offset + c * dt) * decay, (velocity - rate * c * dt) * decay];
  };
  const round = value => Math.round(value * 100) / 100;
  const setViewBox = () => {
   height = group.offsetHeight || height;
   const next = `0 0 ${round(group.offsetWidth)} ${round(height)}`;
   if (next !== viewBox) { viewBox = next; svg.setAttribute('viewBox', next); }
  };
  const capsule = (left, right, top, bottom, radius) =>
   `M ${round(left + radius)} ${round(top)} L ${round(right - radius)} ${round(top)}`
   + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(right - radius)} ${round(bottom)}`
   + ` L ${round(left + radius)} ${round(bottom)}`
   + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(left + radius)} ${round(top)} Z`;
  const paint = () => {
   const top = .75, bottom = height - .75, centre = (top + bottom) / 2, radius = (bottom - top) / 2;
   if (radius <= 0) return;
   let left = { x: x, w: width }, right = { x: tailX, w: tailWidth };
   if (left.x > right.x) { const swap = left; left = right; right = swap; }
   const leftEdge = left.x, leftRight = left.x + left.w;
   const rightEdge = right.x, rightRight = right.x + right.w;
   if (rightRight - leftEdge < radius * 2 + 2) return;
   const gap = rightEdge - leftRight;
   // Attach points sit above the horizontal midline on each facing cap.
   const attach = radius * Math.cos(.96), lift = radius * Math.sin(.96);
   const bridge = gap + 2 * (radius - attach);
   if (bridge <= 6) {
    outline.setAttribute('d', capsule(leftEdge + .75, rightRight - .75, top, bottom, radius));
    return;
   }
   // Near touching, the waist fills in, so the hand-off to one capsule is seamless.
   const blend = Math.min(1, Math.max(0, (6 - gap) / 18));
   const waist = Math.min(radius * .98, radius * (.46 + .54 * Math.pow(blend, 1.5)));
   const ax = leftRight - radius + attach, bx = rightEdge + radius - attach;
   const span = (bx - ax) * .34, lower = centre + waist, upper = centre - waist;
   outline.setAttribute('d',
    `M ${round(leftEdge)} ${round(centre)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(leftEdge + radius)} ${round(top)}`
    + ` L ${round(leftRight - radius)} ${round(top)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(ax)} ${round(centre - lift)}`
    + ` C ${round(ax + span)} ${round(upper)} ${round(bx - span)} ${round(upper)} ${round(bx)} ${round(centre - lift)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(rightEdge + radius)} ${round(top)}`
    + ` L ${round(rightRight - radius)} ${round(top)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(rightRight - radius)} ${round(bottom)}`
    + ` L ${round(rightEdge + radius)} ${round(bottom)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(bx)} ${round(centre + lift)}`
    + ` C ${round(bx - span)} ${round(lower)} ${round(ax + span)} ${round(lower)} ${round(ax)} ${round(centre + lift)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(leftRight - radius)} ${round(bottom)}`
    + ` L ${round(leftEdge + radius)} ${round(bottom)}`
    + ` A ${round(radius)} ${round(radius)} 0 0 1 ${round(leftEdge)} ${round(centre)} Z`);
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; vx = vw = tailVX = tailVW = 0; };
  const tick = now => {
   frame = 0;
   const dt = Math.min(Math.max((now - last) / 1000, 1 / 240), .032);
   last = now;
   [x, vx] = spring(x, vx, targetX, dt, omega);
   [width, vw] = spring(width, vw, targetWidth, dt, omega);
   [tailX, tailVX] = spring(tailX, tailVX, targetX, dt, omegaTail);
   [tailWidth, tailVW] = spring(tailWidth, tailVW, targetWidth, dt, omegaTail);
   if (Math.abs(x - targetX) < .2 && Math.abs(width - targetWidth) < .2
    && Math.abs(tailX - targetX) < .2 && Math.abs(tailWidth - targetWidth) < .2
    && Math.abs(vx) < .8 && Math.abs(vw) < .8 && Math.abs(tailVX) < .8 && Math.abs(tailVW) < .8) {
    x = tailX = targetX; width = tailWidth = targetWidth; vx = vw = tailVX = tailVW = 0;
   } else frame = requestAnimationFrame(tick);
   paint();
  };
  const anchor = () => links.includes(document.activeElement) ? document.activeElement : current;
  const show = (link, instant = false) => {
   if (!link) { stop(); visible = false; bubble.classList.remove('is-visible'); return; }
   targetX = link.offsetLeft;
   targetWidth = link.offsetWidth;
   if (!visible || instant || !positioned) {
    stop();
    x = tailX = targetX; width = tailWidth = targetWidth;
    setViewBox();
    paint();
   } else if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
   positioned = true;
   visible = true;
   bubble.classList.add('is-visible');
  };
  const rest = () => show(anchor());
  const blurLink = event => show(links.includes(event.relatedTarget) ? event.relatedTarget : current, true);
  const enter = event => { if (event.pointerType === 'mouse') show(event.currentTarget); };
  const focus = event => { if (links.includes(event.target)) show(event.target, true); };
  const resize = () => show(anchor(), true);
  const hide = () => { stop(); visible = false; bubble.classList.remove('is-visible'); positioned = false; };
  const visibility = () => { if (document.hidden) hide(); else resize(); };
  links.forEach(link => link.addEventListener('pointerenter', enter));
  group.addEventListener('pointerleave', rest);
  group.addEventListener('focusin', focus);
  group.addEventListener('focusout', blurLink);
  window.addEventListener('resize', resize);
  window.addEventListener('blur', hide);
  window.addEventListener('focus', resize);
  document.addEventListener('visibilitychange', visibility);
  if (document.fonts) document.fonts.ready.then(() => { if (positioned) resize(); });
  show(current, true);
  dispose = () => {
   stop();
   links.forEach(link => link.removeEventListener('pointerenter', enter));
   group.removeEventListener('pointerleave', rest);
   group.removeEventListener('focusin', focus);
   group.removeEventListener('focusout', blurLink);
   window.removeEventListener('resize', resize);
   window.removeEventListener('blur', hide);
   window.removeEventListener('focus', resize);
   document.removeEventListener('visibilitychange', visibility);
   group.classList.remove('nav-link-glass');
   bubble.remove();
  };
 };
 desktop.addEventListener('change', sync);
 solid.addEventListener('change', sync);
 sync();
})();

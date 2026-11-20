const productionHosts = new Set(['www.robotechsftc.org', 'robotechsftc.org', 'robotechsftc.vercel.app']);
const production = location.protocol === 'https:' && productionHosts.has(location.hostname);
const privacyKey = 'robotechs.privacyNotice.v1';
function savedConsent() {
 try {
  const choice = JSON.parse(localStorage.getItem(privacyKey));
  return choice?.essentialOnly === false && Number(choice.expires) > Date.now();
 } catch { return false; }
}
let allowed = savedConsent();
let sdk;
let pending;
function startAnalytics(trackAgain = false) {
 if (!allowed || !production) return;
 if (sdk) {
  if (trackAgain) sdk.pageview({ path: location.pathname });
  return;
 }
 pending ??= import('/vercel-analytics.mjs').then(client => {
  if (!allowed) return;
  client.inject({
   mode: 'production',
   debug: false,
   beforeSend(event) {
    if (!allowed || event.type !== 'pageview') return null;
    const url = new URL(event.url);
    url.search = '';
    url.hash = '';
    return { ...event, url: url.href };
   }
  });
  sdk = client;
 }).catch(error => console.warn('[Robotechs Analytics] Could not start.', error))
   .finally(() => { pending = undefined; });
}
function afterPageLoad(trackAgain = false) {
 if (!allowed || !production) return;
 if (document.readyState === 'complete') startAnalytics(trackAgain);
 else window.addEventListener('load', () => startAnalytics(trackAgain), { once: true });
}
window.addEventListener('robotechs:privacy-change', event => {
 allowed = event.detail?.allowAnalytics === true;
 afterPageLoad(true);
});
window.addEventListener('storage', event => {
 if (event.key === privacyKey || event.key === null) {
  allowed = savedConsent();
  if (allowed && !sdk) afterPageLoad();
 }
});
afterPageLoad();

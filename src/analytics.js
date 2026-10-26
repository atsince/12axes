import { siteOrigin, routeMetadata } from './views.js';
import { basePath, localeForPath, pagePath, routeKey } from './paths.js';

const measurementId = 'G-7PPSG0RGJ2';
const clarityProjectId = 'z24zihjej1';
const consentKey = '12axes.analytics-consent.v1';
const productionHosts = ['12axespoliticaltest.online', 'www.12axespoliticaltest.online'];
let consent = null;
let previousPage = '';

export function isPrivatePage(path) {
  return ['/test', '/results'].includes(basePath(path));
}

function reportStorageError(error) {
  if (!['SecurityError', 'QuotaExceededError'].includes(error.name)) throw error;
  const message = document.getElementById('analytics-storage-error');
  message.textContent = localeForPath(location.pathname) === 'pt-BR' ? `Não foi possível salvar suas preferências de análise (${error.name}). A análise ficará desativada até que sua escolha possa ser salva.` : `Analytics preferences could not be saved (${error.name}). Analytics stays off until your choice can be saved.`;
  message.hidden = false;
}

function loadAnalyticsScript(url) {
  const script = document.createElement('script');
  script.async = true;
  script.src = url;
  script.referrerPolicy = 'origin';
  script.addEventListener('error', () => console.error(`Analytics script could not load: ${url}`));
  document.head.appendChild(script);
}

function startAnalytics() {
  if (window.gtag || consent !== 'granted' || !productionHosts.includes(location.hostname)) return;
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) throw new Error(`Invalid Google Analytics measurement ID: ${measurementId}`);
  window[`ga-disable-${measurementId}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 31536000,
    page_location: `${siteOrigin}${pagePath(Object.hasOwn(routeMetadata, routeKey(location.pathname)) ? location.pathname : '/404', localeForPath(location.pathname))}`,
    page_referrer: document.referrer ? new URL(document.referrer).origin : ''
  });
  loadAnalyticsScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  trackPageView(routeKey(location.pathname));
  if (!isPrivatePage(location.pathname) && Object.hasOwn(routeMetadata, routeKey(location.pathname)) && !location.search && !location.hash.startsWith('#r=')) {
    window.clarity = function() { (window.clarity.q = window.clarity.q || []).push(arguments); };
    window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
    loadAnalyticsScript(`https://www.clarity.ms/tag/${clarityProjectId}`);
  }
}

export function trackPageView(path) {
  path = routeKey(path);
  if (consent !== 'granted' || !window.gtag || path === previousPage) return;
  const pageRoute = Object.hasOwn(routeMetadata, path) ? path : '/404';
  const pageLocation = `${siteOrigin}${pagePath(pageRoute, localeForPath(path))}`;
  window.gtag('set', { page_location: pageLocation, page_title: document.title });
  window.gtag('event', 'page_view', {
    page_location: pageLocation,
    page_title: document.title,
    page_referrer: previousPage ? `${siteOrigin}${previousPage === '/' ? '/' : `${previousPage}/`}` : document.referrer ? new URL(document.referrer).origin : ''
  });
  previousPage = pageRoute;
}

export function trackConversion(name, mode) {
  if (!['quiz_start', 'quiz_complete', 'result_download', 'result_share'].includes(name)) throw new Error(`Unsupported conversion event: ${name}`);
  if (!['quick', 'full'].includes(mode)) throw new Error(`Unsupported conversion test mode: ${mode}`);
  if (consent !== 'granted' || !window.gtag || !productionHosts.includes(location.hostname)) return;
  window.gtag('event', name, { test_mode: mode, language: localeForPath(location.pathname), transport_type: 'beacon' });
}

function removeAnalyticsCookies() {
  const cookieNames = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
  for (const name of cookieNames.filter(name => /^(_ga(?:_|$)|_clck$|_clsk$)/.test(name))) {
    for (const domain of ['', ...productionHosts]) {
      document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ''} Secure; SameSite=Lax`;
    }
  }
}

export function showAnalyticsPreferences() {
  const dialog = document.getElementById('analytics-dialog');
  if (!dialog.open) dialog.show();
}

export function initializeAnalytics() {
  try { consent = localStorage.getItem(consentKey); } catch (error) { reportStorageError(error); }
  if (consent !== null && !['granted', 'denied'].includes(consent)) throw new Error(`Invalid ${consentKey}: ${consent}`);
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-analytics-consent]');
    if (!button) return;
    const choice = button.dataset.analyticsConsent;
    if (!['granted', 'denied'].includes(choice)) throw new Error(`Invalid analytics consent: ${choice}`);
    try { localStorage.setItem(consentKey, choice); } catch (error) { reportStorageError(error); return; }
    consent = choice;
    document.getElementById('analytics-dialog').close();
    if (choice === 'granted') startAnalytics();
    else {
      window[`ga-disable-${measurementId}`] = true;
      window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.clarity?.('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
      removeAnalyticsCookies();
      if (window.gtag || window.clarity) location.reload();
    }
  });
  if (consent === null && productionHosts.includes(location.hostname)) showAnalyticsPreferences();
  startAnalytics();
}

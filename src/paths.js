const pageRoutes = ['/', '/political-test', '/axes', '/methodology', '/about', '/privacy', '/terms', '/cookies', '/test', '/results'];

export function routeKey(path) {
  return path.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
}

export function localeForPath(path) {
  const route = routeKey(path);
  return route === '/pt-br' || route.startsWith('/pt-br/') ? 'pt-BR' : 'en';
}

export function basePath(path) {
  const route = routeKey(path);
  return localeForPath(route) === 'pt-BR' ? route.slice(6) || '/' : route;
}

export function pagePath(path, locale = 'en') {
  if (!['en', 'pt-BR'].includes(locale)) throw new Error(`Unsupported page language: ${locale}`);
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error(`Expected a local page path: ${path}`);
  const route = basePath(path);
  const suffixIndex = path.search(/[?#]/);
  const suffix = suffixIndex === -1 ? '' : path.slice(suffixIndex);
  return `${locale === 'pt-BR' ? '/pt-br' : ''}${route === '/' ? '/' : `${route}/`}${suffix}`;
}

export function localizeLinks(html, locale) {
  return html.replace(/(<a\b[^>]*\bhref=")([^"\s]+)("[^>]*>)/g, (tag, before, href, after) => {
    if (/\bhreflang=/.test(tag) || !href.startsWith('/') || href.startsWith('//') || !pageRoutes.includes(basePath(href))) return tag;
    return `${before}${pagePath(href, locale)}${after}`;
  });
}

export function languageLinks(path) {
  const locale = localeForPath(path);
  const route = pageRoutes.includes(basePath(path)) ? basePath(path) : '/';
  return `<span class="language-switch" aria-label="${locale === 'pt-BR' ? 'Idioma' : 'Language'}"><a href="${pagePath(route, 'en')}" hreflang="en" lang="en"${locale === 'en' ? ' aria-current="true"' : ''}>EN</a><span aria-hidden="true">/</span><a href="${pagePath(route, 'pt-BR')}" hreflang="pt-BR" lang="pt-BR"${locale === 'pt-BR' ? ' aria-current="true"' : ''}>PT-BR</a></span>`;
}

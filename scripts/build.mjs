import { mkdir, rm, cp, writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { axes, questions } from '../src/content.js';
import { staticPage, header, footer, routeMetadata, siteOrigin } from '../src/views.js';
import { basePath, localeForPath, pagePath, localizeLinks } from '../src/paths.js';
import { dialogs } from '../src/dialogs.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
process.chdir(projectRoot);
for (const filename of await readdir('src')) {
  if (!filename.endsWith('.js')) continue;
  const compile = spawnSync(process.execPath, ['--check', join('src', filename)], { stdio: 'inherit' });
  if (compile.status !== 0) throw new Error(`JavaScript compilation failed: src/${filename}`);
}
if (axes.length !== 12 || new Set(axes.map(axis => axis.id)).size !== 12) throw new Error(`Expected 12 unique axes; received ${axes.length}.`);
if (questions.length !== 72 || new Set(questions.map(question => question.id)).size !== 72) throw new Error(`Expected 72 unique statements; received ${questions.length}.`);
for (const axis of axes) {
  const axisQuestions = questions.filter(question => question.axis === axis.id);
  if (axisQuestions.length !== 6 || axisQuestions.filter(question => question.direction === 1).length !== 3 || axisQuestions.filter(question => question.direction === -1).length !== 3) throw new Error(`Axis ${axis.id} must have six statements, with three in each direction.`);
}
for (const question of questions) {
  if (!axes.some(axis => axis.id === question.axis) || !question.text?.trim()) throw new Error(`Invalid statement ${question.id}: axis=${question.axis}, text=${question.text}`);
}

const assetHash = createHash('sha256');
for (const filename of (await readdir('src')).sort()) assetHash.update(await readFile(join('src', filename)));
const assetsDirectory = `assets/${assetHash.digest('hex').slice(0, 12)}`;

const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function documentHtml(path) {
  const locale = localeForPath(path);
  const route = basePath(path);
  const [title, description] = routeMetadata[path] || (locale === 'pt-BR' ? ['Página não encontrada — 12 Axes', 'Volte ao teste político 12 Axes.'] : ['Page Not Found — 12 Axes', 'Find your way back to the 12 Axes political test.']);
  const canonical = `${siteOrigin}${pagePath(path, locale)}`;
  const noIndex = ['/test', '/results', '/404'].includes(route);
  const alternateLinks = noIndex ? '' : ['en', 'pt-BR', 'x-default'].map(language => `<link rel="alternate" hreflang="${language}" href="${siteOrigin}${pagePath(route, language === 'x-default' ? 'en' : language)}">`).join('\n');
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttribute(title)}</title>
<meta name="description" content="${escapeAttribute(description)}">
<meta name="theme-color" content="#f3cb46">
<meta name="color-scheme" content="light">
<meta name="google-site-verification" content="VG1hmNQWj6TiBfz7E6BG6Z_HTyqrpU2G-FPcc7vFj1o">
<meta name="robots" content="${noIndex ? 'noindex, follow' : 'index, follow'}">
<link rel="canonical" href="${canonical}">
${alternateLinks}
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/${assetsDirectory}/styles.css">
<link rel="stylesheet" href="/${assetsDirectory}/quiz.css">
<link rel="stylesheet" href="/${assetsDirectory}/analytics.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="12 Axes">
<meta property="og:locale" content="${locale === 'pt-BR' ? 'pt_BR' : 'en_US'}">
<meta property="og:title" content="${escapeAttribute(title)}">
<meta property="og:description" content="${escapeAttribute(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
${route === '/' ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: locale === 'pt-BR' ? 'Teste político 12 Axes' : '12 Axes Political Test', description, url: canonical, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', browserRequirements: 'JavaScript enabled for the questionnaire', isAccessibleForFree: true, inLanguage: locale, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })}</script>` : ''}
<script type="module" src="/${assetsDirectory}/app.js"></script>
</head>
<body>
<a href="#main" class="skip-link">${locale === 'pt-BR' ? 'Pular para o conteúdo' : 'Skip to content'}</a>
<div id="site-header">${header(path)}</div>
<main id="main" tabindex="-1">${staticPage(path)}</main>
<div id="site-footer">${footer(locale)}</div>
${localizeLinks(dialogs(locale), locale)}
<noscript><div class="container"><p>${locale === 'pt-BR' ? 'O teste, o progresso e os resultados pessoais precisam de JavaScript. Você ainda pode ler sobre os doze eixos, a metodologia e a política de privacidade.' : 'JavaScript is required to take the test, save progress, and view personal results. You can still read about the twelve axes, methodology, and privacy policy.'}</p></div></noscript>
</body>
</html>`;
}

await rm('dist', { recursive: true, force: true });
await mkdir(join('dist', assetsDirectory), { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('src', join('dist', assetsDirectory), { recursive: true });
for (const path of Object.keys(routeMetadata)) {
  const folder = path === '/' ? 'dist' : join('dist', path);
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, 'index.html'), documentHtml(path));
}
await writeFile('dist/404.html', documentHtml('/404'));
const indexableRoutes = Object.keys(routeMetadata).filter(path => !['/test', '/results'].includes(basePath(path)));
const sitemapEntries = indexableRoutes.map(path => `<url><loc>${siteOrigin}${pagePath(path, localeForPath(path))}</loc>${['en', 'pt-BR', 'x-default'].map(language => `<xhtml:link rel="alternate" hreflang="${language}" href="${siteOrigin}${pagePath(basePath(path), language === 'x-default' ? 'en' : language)}"/>`).join('')}</url>`).join('');
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemapEntries}</urlset>\n`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`);
console.log(`Built ${Object.keys(routeMetadata).length} static routes, 12 axes, and 72 statements into dist/.`);

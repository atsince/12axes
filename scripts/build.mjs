import { mkdir, rm, cp, writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { axes, questions } from '../src/content.js';
import { staticPage, header, footer, routeMetadata, siteOrigin } from '../src/views.js';

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
  const [title, description] = routeMetadata[path] || ['Page Not Found — 12 Axes', 'Find your way back to the 12 Axes political test.'];
  const canonical = `${siteOrigin}${path === '/' ? '/' : path}`;
  const noIndex = ['/test', '/results', '/404'].includes(path);
  return `<!doctype html>
<html lang="en">
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
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/${assetsDirectory}/styles.css">
<link rel="stylesheet" href="/${assetsDirectory}/quiz.css">
<link rel="stylesheet" href="/${assetsDirectory}/analytics.css">
<meta property="og:type" content="website">
<meta property="og:site_name" content="12 Axes">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${escapeAttribute(title)}">
<meta property="og:description" content="${escapeAttribute(description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
${path === '/' ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: '12 Axes Political Test', description, url: `${siteOrigin}/`, applicationCategory: 'EducationalApplication', operatingSystem: 'Any', browserRequirements: 'JavaScript enabled for the questionnaire', isAccessibleForFree: true, inLanguage: 'en', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } })}</script>` : ''}
<script type="module" src="/${assetsDirectory}/app.js"></script>
</head>
<body>
<a href="#main" class="skip-link">Skip to content</a>
<div id="site-header">${header(path)}</div>
<main id="main" tabindex="-1">${staticPage(path)}</main>
<div id="site-footer">${footer()}</div>
<dialog id="analytics-dialog" aria-labelledby="analytics-title"><h2 id="analytics-title">Help improve 12 Axes?</h2><p>Allow Google Analytics to measure visits and Microsoft Clarity to record interactions on public pages. Your answers and personal results are excluded from recordings. Analytics cookies are optional; the test works either way.</p><p><a href="/privacy">Privacy policy</a> · <a href="/cookies">Cookies & storage</a></p><p id="analytics-storage-error" role="alert" hidden></p><div class="dialog-actions"><button class="button button-outline" data-analytics-consent="denied">Reject analytics</button><button class="button" data-analytics-consent="granted">Allow analytics</button><button class="text-button" data-action="close-dialog">Decide later</button></div></dialog>
<div id="notice" class="notice" role="status" aria-live="polite" aria-atomic="true"></div>
<dialog id="clear-dialog" aria-labelledby="clear-dialog-title"><h2 id="clear-dialog-title">Clear your local perspective?</h2><p>This removes saved answers, test progress, and your latest result from this browser. Shared links, downloaded files, and copies on other devices remain available.</p><div class="dialog-actions"><button class="button button-outline" data-action="close-dialog">Keep my data</button><button class="button" data-action="confirm-clear">Clear local data</button></div></dialog>
<dialog id="share-dialog" aria-labelledby="share-dialog-title"><h2 id="share-dialog-title">Your result link</h2><p>Copy this link manually. Anyone with it can view all twelve scores. Individual answers are not included. The link cannot be revoked.</p><label for="share-link" class="eyebrow">Result URL</label><input id="share-link" class="share-input" type="text" readonly><div class="dialog-actions"><button class="button" data-action="close-dialog">Done</button></div></dialog>
<noscript><div class="container"><p>JavaScript is required to take the test, save progress, and view personal results. You can still read about the twelve axes, methodology, and privacy policy.</p></div></noscript>
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
const indexableRoutes = Object.keys(routeMetadata).filter(path => !['/test', '/results'].includes(path));
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexableRoutes.map(path => `<url><loc>${siteOrigin}${path === '/' ? '/' : path}</loc></url>`).join('')}</urlset>\n`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /test\nDisallow: /results\nSitemap: ${siteOrigin}/sitemap.xml\n`);
console.log(`Built ${Object.keys(routeMetadata).length} static routes, 12 axes, and 72 statements into dist/.`);

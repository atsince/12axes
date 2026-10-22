import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

if (!process.argv[2]) await import('./build.mjs');
const root = resolve(process.argv[2] || 'dist');
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid PORT: ${process.env.PORT}`);
const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch (error) {
    if (!(error instanceof URIError) && !(error instanceof TypeError)) throw error;
    response.writeHead(400); response.end('Invalid request path'); return;
  }
  let filename = resolve(root, `.${pathname}`);
  if (filename !== root && !filename.startsWith(root + sep)) { response.writeHead(403); response.end('Forbidden path'); return; }
  let status = 200;
  try {
    if ((await stat(filename)).isDirectory()) filename = resolve(filename, 'index.html');
    const contents = await readFile(filename);
    response.writeHead(status, { 'Content-Type': contentTypes[extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    response.end(contents);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
    status = 404;
    response.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(await readFile(resolve(root, '404.html')));
  }
}).listen(port, '127.0.0.1', () => console.log(`12 Axes: http://localhost:${port}`));

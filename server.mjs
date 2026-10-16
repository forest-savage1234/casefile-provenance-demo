import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jsonld': 'application/ld+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain' };
const server = http.createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Read-only demo');
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.split(/[\\/]/).some(part => part.startsWith('.'))) throw new Error('Invalid path');
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root)) throw new Error('Invalid path');
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': (mime[path.extname(target)] || 'application/octet-stream') + (['.html', '.js', '.css', '.md'].includes(path.extname(target)) ? '; charset=utf-8' : ''), 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Casefile demo: http://127.0.0.1:${port}`));

/**
 * Static server met optionele basispad-prefix (GitHub Pages submap).
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 4173);
const basePath = (process.env.BASE_PATH || '/praktijkannemieke').replace(/\/$/, '');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.rss': 'application/rss+xml',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, '');
  return normalized;
}

function fileForUrl(urlPath) {
  let p = urlPath.split('?')[0];
  if (basePath && p.startsWith(basePath)) {
    p = p.slice(basePath.length) || '/';
  }
  p = safePath(p);
  if (p === '/' || p === '') {
    return path.join(root, 'index.html');
  }
  const trimmed = p.replace(/\/$/, '');
  const asDir = path.join(root, trimmed, 'index.html');
  if (p.endsWith('/') && fs.existsSync(asDir)) return asDir;
  const asFile = path.join(root, trimmed);
  if (fs.existsSync(asFile) && fs.statSync(asFile).isFile()) return asFile;
  if (fs.existsSync(asDir)) return asDir;
  return asFile;
}

const server = http.createServer((req, res) => {
  const file = fileForUrl(req.url || '/');
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }
  const ext = path.extname(file).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${basePath}/`);
});

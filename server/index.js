import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const ENV_FILE = path.resolve(__dirname, '..', '.env');

loadEnvFile(ENV_FILE);
const PORT = process.env.PORT || 5000;
const { proctorApiMiddleware } = await import('./proctorBackend.js');

const contentTypes = {
  '.css': 'text/css',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const rows = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  for (const row of rows) {
    const line = row.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

const server = http.createServer((req, res) => {
  proctorApiMiddleware(req, res, () => {
    serveStatic(req, res);
  });
});

server.listen(PORT, () => {
  console.log(`[i-test] App listening on port ${PORT}`);
});

function serveStatic(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const requestedPath = decodeURIComponent(requestUrl.pathname);
  const filePath = path.normalize(path.join(DIST_DIR, requestedPath === '/' ? 'index.html' : requestedPath));

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  const targetPath = fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    ? filePath
    : path.join(DIST_DIR, 'index.html');

  if (!fs.existsSync(targetPath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Build output not found. Run npm run build first.');
  }

  const ext = path.extname(targetPath);
  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(targetPath).pipe(res);
}

import http from 'http';
import { proctorApiMiddleware } from './proctorBackend.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  proctorApiMiddleware(req, res, () => {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
});

server.listen(PORT, () => {
  console.log(`[Proctor Server] Standalone backend listening on port ${PORT}`);
});

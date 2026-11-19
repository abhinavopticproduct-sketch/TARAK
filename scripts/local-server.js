const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  try {
    let cleanUrl = decodeURIComponent(req.url.split('?')[0]);
    if (cleanUrl === '/' || cleanUrl === '') {
      cleanUrl = '/index.html';
    }

    const safePath = path.normalize(path.join(ROOT_DIR, cleanUrl));

    if (!safePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${cleanUrl}`);
        return;
      }

      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      const range = req.headers.range;
      if (range && ext === '.mp3') {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        const fileStream = fs.createReadStream(safePath, { start, end });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stats.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        fileStream.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stats.size,
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        fs.createReadStream(safePath).pipe(res);
      }
    });
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Jalebi-Fafda Server running at http://localhost:${PORT}/`);
});

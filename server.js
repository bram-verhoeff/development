const http = require('http');
const fs = require('fs');
const path = require('path');

let PORT = parseInt(process.env.PORT, 10) || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const server = http.createServer((req, res) => {
  const reqUrl = req.url.split('?')[0];
  let safePath = path.normalize(reqUrl).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safePath === '/' || safePath === '\\' ? 'index.html' : safePath);

    const serveFile = (target) => {
      const ext = path.extname(target).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(target).pipe(res);
    };

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        return serveFile(filePath);
      }

      // Check clean URL with .html extension
      if (!path.extname(filePath)) {
        const htmlPath = filePath + '.html';
        fs.stat(htmlPath, (err2, stats2) => {
          if (!err2 && stats2.isFile()) {
            return serveFile(htmlPath);
          }
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Niet gevonden: ' + reqUrl);
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Niet gevonden: ' + reqUrl);
    });
  });

function startServer(port) {
  server.listen(port, () => {
    console.log(`Beach House The Coast server gestart op http://localhost:${port}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Poort ${PORT} is bezet, probeer poort ${PORT + 1}...`);
    PORT++;
    startServer(PORT);
  } else {
    console.error('Server fout:', err);
  }
});

startServer(PORT);

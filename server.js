const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];

  // API Route: Live LinkedIn Webhook / Direct API dispatcher
  if (req.method === 'POST' && reqUrl === '/api/linkedin/publish') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const webhookUrl = payload.webhookUrl;
        const accessToken = payload.accessToken;
        const authorUrn = payload.authorUrn;

        // Option A: Direct LinkedIn Official API (if OAuth token provided)
        if (accessToken && authorUrn) {
          const https = require('https');
          const postData = JSON.stringify({
            author: authorUrn.startsWith('urn:li:') ? authorUrn : `urn:li:person:${authorUrn}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                  text: payload.content
                },
                shareMediaCategory: 'NONE'
              }
            },
            visibility: {
              'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
          });

          const reqOptions = {
            hostname: 'api.linkedin.com',
            port: 443,
            path: '/v2/ugcPosts',
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0',
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const apiReq = https.request(reqOptions, (apiRes) => {
            let resBody = '';
            apiRes.on('data', c => { resBody += c.toString(); });
            apiRes.on('end', () => {
              if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Direct live geplaatst op LinkedIn via Official API!' }));
              } else {
                res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: `LinkedIn API error (${apiRes.statusCode}): ${resBody}` }));
              }
            });
          });

          apiReq.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          });

          apiReq.write(postData);
          apiReq.end();
          return;
        }

        // Option B: Webhook Dispatcher (Make.com, Zapier, Buffer, Pabbly)
        if (webhookUrl && webhookUrl.startsWith('http')) {
          const client = webhookUrl.startsWith('https') ? require('https') : require('http');
          const postData = JSON.stringify({
            event: 'linkedin_post_publish',
            account: 'AgevoDev & StudyElite',
            target: payload.target || 'StudyElite.nl / AgevoDev.nl',
            content: payload.content,
            publishedAt: new Date().toISOString()
          });

          const urlObj = new URL(webhookUrl);
          const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (webhookUrl.startsWith('https') ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            }
          };

          const webhookReq = client.request(requestOptions, (webhookRes) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: `Succesvol verzonden naar live webhook (HTTP ${webhookRes.statusCode})` }));
          });

          webhookReq.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          });

          webhookReq.write(postData);
          webhookReq.end();
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          liveStatus: 'ready_in_studio',
          message: 'Geen actieve webhook of LinkedIn API token geconfigureerd. Gebruik de 1-klik deelknop of stel een webhook in.'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (reqUrl === '/') reqUrl = '/index.html';

  const filePath = path.join(__dirname, reqUrl);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          return res.end('404 Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('500 Internal Server Error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`HighFlow CRM running on http://localhost:${PORT}`);
});

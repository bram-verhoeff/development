const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const CONFIG_FILE = path.join(__dirname, 'auth_config.json');

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

// ==========================================
// AUTHENTICATION & SECURITY SYSTEM
// ==========================================
let authConfig = {
  salt: '',
  hash: '',
  updatedAt: ''
};

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function initAuthConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed.salt && parsed.hash) {
        authConfig = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('[Auth] Error reading auth_config.json:', e.message);
  }

  // Pre-hashed default credentials (never store plaintext passwords in source code)
  const salt = '21dc2da76d264703109cff15a492a75e';
  const hash = '7809671d7023be9a688a78aab3efd19dec726b65e75248dede90205fc5ef8923c5ad844ff74c4c4a461e66962559321ac9a36215d0486459ce3b6620576e06ad';
  authConfig = {
    salt,
    hash,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(authConfig, null, 2), 'utf8');
    console.log(`[Auth] Beveiliging geactiveerd. Standaard wachtwoord: ${defaultPassword}`);
  } catch (e) {
    console.error('[Auth] Failed to write auth_config.json:', e);
  }
}

initAuthConfig();

// In-memory active sessions: token -> { createdAt, expiresAt }
const sessions = new Map();

// Rate limiting for login attempts: ip -> { count, lastAttempt }
const loginAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec) return { allowed: true };
  if (now - rec.lastAttempt > 60000) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  if (rec.count >= 5) {
    const remainingSeconds = Math.ceil((60000 - (now - rec.lastAttempt)) / 1000);
    return { allowed: false, remainingSeconds };
  }
  return { allowed: true };
}

function recordLoginAttempt(ip, success) {
  const now = Date.now();
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const rec = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
  rec.count++;
  rec.lastAttempt = now;
  loginAttempts.set(ip, rec);
}

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith('highflow_session=')) {
      return decodeURIComponent(c.substring('highflow_session='.length));
    }
  }
  return null;
}

function isSessionValid(req) {
  const token = getSessionToken(req);
  if (!token) return false;
  const session = sessions.get(token);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// ==========================================
// HTTP REQUEST HANDLER
// ==========================================
const server = http.createServer(async (req, res) => {
  let reqUrl = req.url.split('?')[0];
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const authenticated = isSessionValid(req);

  // ------------------------------------------
  // AUTH API ENDPOINTS
  // ------------------------------------------
  if (reqUrl === '/api/auth/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ authenticated }));
  }

  if (reqUrl === '/api/auth/login' && req.method === 'POST') {
    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ 
        success: false, 
        error: `Te veel mislukte pogingen. Wacht nog ${rateCheck.remainingSeconds} seconden.` 
      }));
    }

    try {
      const { password, rememberMe } = await parseJsonBody(req);
      if (!password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Voer een wachtwoord in.' }));
      }

      const inputHash = hashPassword(password, authConfig.salt);
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(inputHash, 'hex'),
        Buffer.from(authConfig.hash, 'hex')
      );

      if (!isMatch) {
        recordLoginAttempt(clientIp, false);
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          success: false, 
          error: 'Onjuist wachtwoord. Probeer het opnieuw.' 
        }));
      }

      // Successful login
      recordLoginAttempt(clientIp, true);
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const maxAgeSeconds = rememberMe ? 30 * 86400 : 24 * 3600; // 30 days or 24 hours
      const expiresAt = Date.now() + (maxAgeSeconds * 1000);

      sessions.set(sessionToken, {
        createdAt: Date.now(),
        expiresAt: expiresAt
      });

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `highflow_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
      });
      return res.end(JSON.stringify({ success: true, message: 'Succesvol ingelogd!' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  if (reqUrl === '/api/auth/logout' && req.method === 'POST') {
    const token = getSessionToken(req);
    if (token) sessions.delete(token);

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Set-Cookie': 'highflow_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    });
    return res.end(JSON.stringify({ success: true, message: 'Succesvol uitgelogd.' }));
  }

  if (reqUrl === '/api/auth/change-password' && req.method === 'POST') {
    if (!authenticated) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Niet geautoriseerd.' }));
    }

    try {
      const { currentPassword, newPassword } = await parseJsonBody(req);
      if (!currentPassword || !newPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Vul zowel het huidige als het nieuwe wachtwoord in.' }));
      }

      if (newPassword.length < 4) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Het nieuwe wachtwoord moet minimaal 4 tekens bevatten.' }));
      }

      const currHash = hashPassword(currentPassword, authConfig.salt);
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(currHash, 'hex'),
        Buffer.from(authConfig.hash, 'hex')
      );

      if (!isMatch) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Het huidige wachtwoord is onjuist.' }));
      }

      // Apply new password
      const newSalt = crypto.randomBytes(16).toString('hex');
      const newHash = hashPassword(newPassword, newSalt);
      authConfig = {
        salt: newSalt,
        hash: newHash,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(authConfig, null, 2), 'utf8');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: 'Wachtwoord succesvol bijgewerkt!' }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: e.message }));
    }
  }

  // ------------------------------------------
  // LINKEDIN PUBLISH API (Authenticated Only)
  // ------------------------------------------
  if (req.method === 'POST' && reqUrl === '/api/linkedin/publish') {
    if (!authenticated) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Niet geautoriseerd. Log eerst in.', authenticated: false }));
    }

    try {
      const payload = await parseJsonBody(req);
      const webhookUrl = payload.webhookUrl;
      const accessToken = payload.accessToken;
      const authorUrn = payload.authorUrn;

      // Option A: Direct LinkedIn Official API (if OAuth token provided)
      if (accessToken && authorUrn) {
        const https = require('https');
        const authorFormatted = authorUrn.startsWith('urn:li:') ? authorUrn : `urn:li:person:${authorUrn}`;
        
        const postData = JSON.stringify({
          author: authorFormatted,
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
            'Content-Length': Buffer.byteLength(postData, 'utf8')
          }
        };

        const apiReq = https.request(reqOptions, (apiRes) => {
          let resBody = '';
          apiRes.on('data', c => { resBody += c.toString(); });
          apiRes.on('end', () => {
            if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ success: true, message: 'Direct live geplaatst op LinkedIn via Official API (/v2/ugcPosts)!' }));
            }
            
            // Fallback to versioned /rest/posts for newer LinkedIn Developer Apps (2023+)
            const restPayload = JSON.stringify({
              author: authorFormatted,
              commentary: payload.content,
              visibility: "PUBLIC",
              distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: []
              },
              lifecycleState: "PUBLISHED",
              isReshareDisabledByAuthor: false
            });

            const restOptions = {
              hostname: 'api.linkedin.com',
              port: 443,
              path: '/rest/posts',
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'LinkedIn-Version': '202401',
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(restPayload, 'utf8')
              }
            };

            const fallbackReq = https.request(restOptions, (fallbackRes) => {
              let fbBody = '';
              fallbackRes.on('data', c => { fbBody += c.toString(); });
              fallbackRes.on('end', () => {
                if (fallbackRes.statusCode >= 200 && fallbackRes.statusCode < 300) {
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ success: true, message: 'Direct live geplaatst op LinkedIn via Versioned REST API (/rest/posts)!' }));
                } else {
                  res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ 
                    success: false, 
                    error: `LinkedIn API fout (${apiRes.statusCode}): ${resBody} | Fallback (${fallbackRes.statusCode}): ${fbBody}` 
                  }));
                }
              });
            });

            fallbackReq.on('error', (fbErr) => {
              res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: `LinkedIn API error (${apiRes.statusCode}): ${resBody}` }));
            });

            fallbackReq.write(restPayload);
            fallbackReq.end();
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

      // Option B: Webhook Dispatcher (Make.com, Zapier, n8n, Pabbly)
      if (webhookUrl && webhookUrl.startsWith('http')) {
        const client = webhookUrl.startsWith('https') ? require('https') : require('http');
        const isPersonal = payload.target === 'Bram Verhoeff';
        const postData = JSON.stringify({
          event: 'linkedin_post_publish',
          account: isPersonal ? 'Bram Verhoeff (Persoonlijk)' : 'AgevoDev & StudyElite',
          target: payload.target || (isPersonal ? 'Bram Verhoeff' : 'AgevoDev.nl'),
          authorUrl: 'https://www.linkedin.com/in/bram-verhoeff/',
          content: payload.content,
          text: payload.content,
          message: payload.content,
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
            'Content-Length': Buffer.byteLength(postData, 'utf8')
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
    return;
  }

  // ------------------------------------------
  // PAGE ROUTING & AUTH ENFORCEMENT
  // ------------------------------------------

  // If user is already authenticated and visits /login, redirect to /
  if (authenticated && (reqUrl === '/login' || reqUrl === '/login.html')) {
    res.writeHead(302, { 'Location': '/' });
    return res.end();
  }

  // If user is NOT authenticated:
  if (!authenticated) {
    // Allow login assets (styles, favicons)
    if (reqUrl === '/style.css' || reqUrl === '/favicon.ico' || reqUrl === '/login.html') {
      // Continue to serve static asset
    } else if (reqUrl.startsWith('/api/')) {
      // Block unauthorized API calls
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Niet geautoriseerd. Log eerst in.', authenticated: false }));
    } else if (reqUrl.startsWith('/js/')) {
      // Block unauthorized JS code viewing
      res.writeHead(401, { 'Content-Type': 'text/plain' });
      return res.end('401 Unauthorized');
    } else {
      // For any page request (/ or /index.html or other route), serve the login page!
      reqUrl = '/login.html';
    }
  }

  // Map root to index.html for authenticated users
  if (reqUrl === '/') reqUrl = '/index.html';

  const filePath = path.join(__dirname, reqUrl);

  // Security check: ensure path is within directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing
      const targetFallback = authenticated ? 'index.html' : 'login.html';
      const fallbackPath = path.join(__dirname, targetFallback);
      fs.readFile(fallbackPath, (readErr, content) => {
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
  console.log(`HighFlow CRM (Password Protected) running on http://localhost:${PORT}`);
});

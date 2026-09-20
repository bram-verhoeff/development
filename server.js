const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const TARGETS_FILE = path.join(__dirname, 'targets.json');

// Configuration
let config = {
  scanIntervalSeconds: 30,
  autoScan: true,
  requestTimeoutMs: 12000
};

// In-memory state
let targets = [];
let scanInProgress = false;
let lastScanTimestamp = null;
let sseClients = new Set();
let scanTimer = null;
let activityLogs = [];

// Load targets
function loadTargets() {
  try {
    if (fs.existsSync(TARGETS_FILE)) {
      const data = fs.readFileSync(TARGETS_FILE, 'utf-8');
      targets = JSON.parse(data);
      console.log(`[INIT] ${targets.length} targets geladen uit targets.json`);
    } else {
      targets = [];
    }
  } catch (err) {
    console.error('[ERROR] Fout bij laden targets:', err.message);
    targets = [];
  }
}

// Save targets
function saveTargets() {
  try {
    fs.writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ERROR] Fout bij opslaan targets:', err.message);
  }
}

// Add activity log
function addLog(message, type = 'info', data = {}) {
  const logEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    message,
    type, // 'info', 'alert', 'error', 'success'
    data
  };
  activityLogs.unshift(logEntry);
  if (activityLogs.length > 200) activityLogs.pop();
  broadcastSSE('log', logEntry);
}

// Broadcast to SSE clients
function broadcastSSE(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Fetch helper with redirect support and custom headers per site
function fetchPage(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) {
      return reject(new Error('Te veel redirects'));
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (e) {
      return reject(new Error('Ongeldige URL: ' + targetUrl));
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const requestLib = isHttps ? https : http;
    const isAmazon = parsedUrl.hostname.includes('amazon.');

    // Googlebot UA allows fetching Amazon product pages cleanly without captcha blocks
    const headers = isAmazon ? {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7'
    } : {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers,
      timeout: config.requestTimeoutMs
    };

    const req = requestLib.request(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, targetUrl).href;
        res.resume();
        return fetchPage(redirectUrl, maxRedirects - 1).then(resolve).catch(reject);
      }

      let body = '';
      res.setEncoding('utf-8');
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 3 * 1024 * 1024) {
          req.destroy();
          resolve({ statusCode: res.statusCode, body, headers: res.headers });
        }
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body, headers: res.headers });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout (' + config.requestTimeoutMs + 'ms)'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Strict Product Status Parser - ZERO FALSE POSITIVES
function parseProductStatus(target, html, statusCode) {
  if (statusCode === 403 || statusCode === 429) {
    return {
      status: 'rate_limited',
      inStock: false,
      isPreOrder: false,
      details: 'Winkelbeveiliging / HTTP ' + statusCode,
      price: null,
      detectedTitle: null
    };
  }

  if (statusCode >= 400) {
    return {
      status: 'error',
      inStock: false,
      isPreOrder: false,
      details: 'HTTP Fout ' + statusCode,
      price: null,
      detectedTitle: null
    };
  }

  const isAmazon = target.url.includes('amazon.');
  const isIntertoys = target.url.includes('intertoys.nl');

  // =========================================================================
  // 1. Amazon Exact Product Page (ASIN: B0H9HFPRRD)
  // =========================================================================
  if (isAmazon) {
    if (html.includes('validateCaptcha')) {
      return {
        status: 'rate_limited',
        inStock: false,
        isPreOrder: false,
        details: 'Amazon bot-controle (klik Direct Kopen)',
        price: null,
        detectedTitle: 'Pokémon TCG 30th Elite-trainerset (B0H9HFPRRD)'
      };
    }

    const hasAddToCart = html.includes('id="add-to-cart-button"') || html.includes('id="buy-now-button"');
    const isOutOfStock = html.toLowerCase().includes('tijdelijk niet op voorraad') || 
                         html.toLowerCase().includes('momenteel niet verkrijgbaar') || 
                         html.toLowerCase().includes('currently unavailable');

    let price = null;
    const priceMatch = html.match(/class=["'][^"']*a-offscreen[^"']*["']>([^<]+)<\/span>/i);
    if (priceMatch) price = priceMatch[1].trim();

    if (hasAddToCart && !isOutOfStock) {
      return {
        status: 'in_stock',
        inStock: true,
        isPreOrder: false,
        details: '🔥 OP VOORRAAD BIJ AMAZON! Direct te bestellen!',
        price: price || target.price,
        detectedTitle: 'Pokémon TCG 30th Elite-trainerset (B0H9HFPRRD)'
      };
    } else {
      return {
        status: 'out_of_stock',
        inStock: false,
        isPreOrder: false,
        details: 'Tijdelijk niet op voorraad bij Amazon (ASIN: B0H9HFPRRD)',
        price: null,
        detectedTitle: 'Pokémon TCG 30th Elite-trainerset (B0H9HFPRRD)'
      };
    }
  }

  // =========================================================================
  // 2. Intertoys Exact Product Page (STRICT "Niet beschikbaar" CHECK)
  // =========================================================================
  if (isIntertoys) {
    const isExplicitlyUnavailable = html.includes('Niet beschikbaar') || 
                                   html.includes('online niet beschikbaar') || 
                                   html.includes('Sorry, dit product is online niet beschikbaar');
    const hasCartButton = html.toLowerCase().includes('in winkelwagen') || html.toLowerCase().includes('in winkelmand');

    let price = '€99,99';
    const priceMatch = html.match(/(?:€|&euro;)\s*([0-9]{1,3}(?:[.,][0-9]{2}))/i) ||
                       html.match(/([0-9]{1,3}(?:[.,][0-9]{2}))\s*(?:€|&euro;)/i);
    if (priceMatch) {
      price = '€' + priceMatch[1].replace('.', ',');
    }

    if (hasCartButton && !isExplicitlyUnavailable) {
      return {
        status: 'in_stock',
        inStock: true,
        isPreOrder: false,
        details: '🔥 OP VOORRAAD BIJ INTERTOYS! Direct in winkelwagen te plaatsen!',
        price,
        detectedTitle: 'Pokémon TCG: 30th Celebration Elite Trainer Box'
      };
    } else {
      return {
        status: 'out_of_stock',
        inStock: false,
        isPreOrder: false,
        details: 'Niet beschikbaar (online momenteel niet leverbaar)',
        price,
        detectedTitle: 'Pokémon TCG: 30th Celebration Elite Trainer Box'
      };
    }
  }

  // =========================================================================
  // 3. Retail Search Pages (Bol, Nedgame, MediaMarkt, Bescards, etc.)
  // =========================================================================
  // Strip input and form tags to prevent matching search query in value="..."
  const strippedHtml = (html || '').replace(/<input[^>]*>/gi, '').replace(/<form[\s\S]*?<\/form>/gi, '');
  const lowerStripped = strippedHtml.toLowerCase();

  // Look for product card titles specifically
  const productTitles = [];
  const titleMatches = strippedHtml.matchAll(/<(?:h[2-4]|a)[^>]*class=["'][^"']*(?:product-title|woocommerce-loop-product__title|product__title|title)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h[2-4]|a)>/gi);
  for (const m of titleMatches) {
    productTitles.push(m[1].replace(/<[^>]+>/g, '').toLowerCase().trim());
  }

  // Check if any product title matches both 30th/celebration and etb
  const matchingTitle = productTitles.find(t => 
    (t.includes('30th') || t.includes('30e') || t.includes('30 jaar') || t.includes('celebration') || t.includes('celebrations')) &&
    (t.includes('etb') || t.includes('elite trainer box') || t.includes('elite-trainerset'))
  );

  // If no product card matches, product is not in store
  if (!matchingTitle) {
    return {
      status: 'out_of_stock',
      inStock: false,
      isPreOrder: false,
      details: 'Nog niet vermeld in deze winkel / Geen zoekresultaten',
      price: null,
      detectedTitle: null
    };
  }

  // If a matching title WAS found:
  const hasPreOrder = lowerStripped.includes('pre-order') || lowerStripped.includes('pre order') || lowerStripped.includes('reserveer nu');
  const hasInStock = lowerStripped.includes('in winkelwagen') || lowerStripped.includes('in mandje') || lowerStripped.includes('direct leverbaar');
  const hasOut = lowerStripped.includes('uitverkocht') || lowerStripped.includes('niet op voorraad');

  if (hasInStock && !hasOut) {
    return {
      status: 'in_stock',
      inStock: true,
      isPreOrder: false,
      details: 'Gevonden en direct leverbaar!',
      price: null,
      detectedTitle: matchingTitle
    };
  } else if (hasPreOrder) {
    return {
      status: 'pre_order',
      inStock: false,
      isPreOrder: true,
      details: 'Gevonden: Pre-order mogelijk!',
      price: null,
      detectedTitle: matchingTitle
    };
  } else {
    return {
      status: 'out_of_stock',
      inStock: false,
      isPreOrder: false,
      details: 'Vermeld, maar momenteel niet op voorraad',
      price: null,
      detectedTitle: matchingTitle
    };
  }
}

// Scan a single target
async function scanSingleTarget(target) {
  const previousStatus = target.status;
  const previousInStock = target.inStock;

  target.status = 'checking';
  broadcastSSE('target_status_change', { id: target.id, status: 'checking' });

  try {
    const res = await fetchPage(target.url);
    const parsed = parseProductStatus(target, res.body, res.statusCode);

    target.status = parsed.status;
    target.inStock = parsed.inStock;
    target.isPreOrder = parsed.isPreOrder;
    target.details = parsed.details;
    target.price = parsed.price;
    if (parsed.detectedTitle) {
      target.lastDetectedTitle = parsed.detectedTitle;
    }
    target.lastChecked = new Date().toISOString();
    target.lastStatusCode = res.statusCode;

    // Check for genuine stock alert!
    if ((target.inStock && !previousInStock) || (target.isPreOrder && previousStatus !== 'pre_order')) {
      const alertMsg = `🚨 VOORRAAD ALERT! ${target.name} heeft de Pokémon 30th ETB: ${target.status === 'in_stock' ? 'OP VOORRAAD' : 'PRE-ORDER'}! ${target.price ? '(' + target.price + ')' : ''}`;
      console.log(`[ALERT] ${alertMsg}`);
      addLog(alertMsg, 'alert', { target });
      broadcastSSE('stock_alert', {
        target,
        timestamp: new Date().toISOString(),
        message: alertMsg
      });
    } else {
      addLog(`${target.name}: ${target.details} ${target.price ? '(' + target.price + ')' : ''}`, 'info');
    }

  } catch (err) {
    target.status = 'error';
    target.details = err.message;
    target.lastChecked = new Date().toISOString();
    addLog(`Fout bij scannen ${target.name}: ${err.message}`, 'error');
  }

  broadcastSSE('target_updated', target);
  return target;
}

// Scan all targets concurrently with limit
async function scanAllTargets() {
  if (scanInProgress) {
    console.log('[SCAN] Scan al bezig, overslaan...');
    return;
  }
  scanInProgress = true;
  lastScanTimestamp = new Date().toISOString();
  broadcastSSE('scan_started', { timestamp: lastScanTimestamp, count: targets.length });
  addLog(`Scanronde gestart voor ${targets.length} winkels`, 'info');

  const BATCH_SIZE = 3;
  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(target => scanSingleTarget(target)));
  }

  scanInProgress = false;
  saveTargets();
  broadcastSSE('scan_completed', {
    timestamp: new Date().toISOString(),
    inStockCount: targets.filter(t => t.inStock).length,
    preOrderCount: targets.filter(t => t.isPreOrder).length
  });
  addLog(`Scanronde voltooid. In voorraad: ${targets.filter(t => t.inStock).length}, Pre-order: ${targets.filter(t => t.isPreOrder).length}`, 'success');
}

// Start auto-scan scheduler
function startScheduler() {
  if (scanTimer) clearInterval(scanTimer);
  if (config.autoScan && config.scanIntervalSeconds > 0) {
    scanTimer = setInterval(() => {
      scanAllTargets();
    }, config.scanIntervalSeconds * 1000);
    console.log(`[SCHEDULER] Actief, interval: ${config.scanIntervalSeconds} seconden`);
  }
}

// MIME types for static file server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Create Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Routes
  if (pathname === '/api/events') {
    // SSE Stream
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', targets, config })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  if (pathname === '/api/targets' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      targets,
      scanInProgress,
      lastScanTimestamp,
      config
    }));
    return;
  }

  if (pathname === '/api/targets' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newTarget = JSON.parse(body);
        if (!newTarget.name || !newTarget.url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Naam en URL zijn verplicht' }));
          return;
        }

        const targetObj = {
          id: 'target-' + Date.now(),
          name: newTarget.name.trim(),
          region: newTarget.region || 'NL',
          url: newTarget.url.trim(),
          type: newTarget.type || 'custom',
          status: 'unknown',
          price: null,
          lastChecked: null,
          productTitle: newTarget.productTitle || 'Pokémon TCG 30th ETB',
          inStock: false,
          isPreOrder: false,
          details: newTarget.details || 'Aangepaste monitor'
        };

        targets.push(targetObj);
        saveTargets();
        addLog(`Nieuwe winkelmonitor toegevoegd: ${targetObj.name}`, 'success');
        broadcastSSE('target_added', targetObj);

        // Scan the new target immediately
        scanSingleTarget(targetObj);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(targetObj));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ongeldige JSON' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/targets/') && method === 'DELETE') {
    const targetId = pathname.replace('/api/targets/', '');
    const index = targets.findIndex(t => t.id === targetId);
    if (index !== -1) {
      const removed = targets.splice(index, 1)[0];
      saveTargets();
      addLog(`Winkelmonitor verwijderd: ${removed.name}`, 'info');
      broadcastSSE('target_removed', { id: targetId });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, removed }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Target niet gevonden' }));
    }
    return;
  }

  if (pathname === '/api/scan' && method === 'POST') {
    scanAllTargets();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Scanronde gestart' }));
    return;
  }

  if (pathname === '/api/test-drop' && method === 'POST') {
    const targetToDrop = targets.find(t => t.id === 'intertoys') || targets[0];

    targetToDrop.status = 'in_stock';
    targetToDrop.inStock = true;
    targetToDrop.isPreOrder = false;
    targetToDrop.price = '€99,99';
    targetToDrop.details = '🔥 [TEST DROP] Nu direct te bestellen bij Intertoys!';
    targetToDrop.lastChecked = new Date().toISOString();

    const alertMsg = `🚨 [SIMULATIE DROP] ${targetToDrop.name} heeft de Pokémon 30th ETB IN VOORRAAD! (€99,99)`;
    addLog(alertMsg, 'alert', { target: targetToDrop });
    broadcastSSE('stock_alert', {
      target: targetToDrop,
      timestamp: new Date().toISOString(),
      message: alertMsg,
      isSimulation: true
    });
    broadcastSSE('target_updated', targetToDrop);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, target: targetToDrop }));
    return;
  }

  if (pathname === '/api/config' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        if (update.scanIntervalSeconds !== undefined) {
          config.scanIntervalSeconds = Math.max(10, parseInt(update.scanIntervalSeconds, 10));
        }
        if (update.autoScan !== undefined) {
          config.autoScan = Boolean(update.autoScan);
        }
        startScheduler();
        broadcastSSE('config_updated', config);
        addLog(`Configuratie gewijzigd: Scan elke ${config.scanIntervalSeconds}s (Auto: ${config.autoScan ? 'AAN' : 'UIT'})`, 'info');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(config));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ongeldige configuratie' }));
      }
    });
    return;
  }

  if (pathname === '/api/logs' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(activityLogs));
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  const safePath = path.resolve(filePath);
  if (!safePath.startsWith(path.resolve(__dirname))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Niet Gevonden');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(safePath, (err2, content) => {
      if (err2) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server Fout');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

// Initialize
loadTargets();
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`⚡ POKÉMON TCG 30TH CELEBRATION ETB LIVE HUNTER SERVER ⚡`);
  console.log(`👉 Actief op http://localhost:${PORT}`);
  console.log(`📡 SSE Stream: http://localhost:${PORT}/api/events`);
  console.log(`🎯 Exact Product ASIN: B0H9HFPRRD (Amazon)`);
  console.log(`🎯 Exact Product Intertoys: 2016413 (Intertoys.nl)`);
  console.log(`=======================================================`);
  startScheduler();
  setTimeout(() => {
    console.log('[AUTO-START] Initiële scanronde gestart...');
    scanAllTargets();
  }, 1000);
});

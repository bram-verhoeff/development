const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const PORT = 3000;
const ROOT_DIR = __dirname;
const BRANCHES_DIR = path.join(ROOT_DIR, 'branches');
const START_TIME = Date.now();

// Ensure branches directory exists
if (!fs.existsSync(BRANCHES_DIR)) {
  fs.mkdirSync(BRANCHES_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

function scanGitBranches() {
  const branchList = [];
  try {
    const raw = execSync(
      'git for-each-ref --format="%(refname:short)|%(authordate:iso)|%(authordate:relative)|%(subject)|%(objectname:short)" refs/heads refs/remotes/origin',
      { cwd: ROOT_DIR, encoding: 'utf8' }
    ).trim();

    if (!raw) return [];

    const lines = raw.split('\n');
    const seen = new Set();
    const uniqueBranches = [];

    for (const line of lines) {
      const parts = line.trim().split('|');
      if (parts.length < 5) continue;

      let [rawName, dateIso, dateRel, subject, commitHash] = parts;
      let branchName = rawName.replace(/^origin\//, '');
      if (branchName === 'HEAD' || branchName === 'gh-pages' || branchName === 'origin' || !branchName) continue;
      if (seen.has(branchName)) continue;
      seen.add(branchName);

      uniqueBranches.push({ branchName, dateIso, dateRel, subject, commitHash });
    }

    for (const { branchName, dateIso, dateRel, subject, commitHash } of uniqueBranches) {
      const worktreePath = path.join(BRANCHES_DIR, branchName);

      if (branchName !== 'main') {
        if (!fs.existsSync(worktreePath)) {
          try {
            execSync(`git worktree add --detach "branches/${branchName}" "${branchName}"`, { cwd: ROOT_DIR, stdio: 'ignore' });
          } catch (e) {}
        } else {
          try {
            execSync(`git -C "branches/${branchName}" checkout --detach "${branchName}"`, { cwd: ROOT_DIR, stdio: 'ignore' });
          } catch (e) {}
        }
      }

      const targetDir = (branchName === 'main') ? ROOT_DIR : worktreePath;
      const indexPath = path.join(targetDir, 'index.html');
      let title = `Branch: ${branchName}`;
      let description = subject || `Git branch commit ${commitHash}`;
      let hasIndex = fs.existsSync(indexPath);

      if (hasIndex) {
        try {
          const htmlContent = fs.readFileSync(indexPath, 'utf8');
          const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) title = titleMatch[1].trim();
          const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
          if (descMatch && descMatch[1]) description = descMatch[1].trim();
        } catch (e) {}
      }

      branchList.push({
        branch: branchName,
        commit: commitHash,
        subject: subject,
        dateIso: dateIso,
        dateRelative: dateRel,
        title: title,
        description: description,
        hasIndex: hasIndex,
        isMain: branchName === 'main',
        url: branchName === 'main' ? './' : `./branches/${branchName}/`,
        status: hasIndex ? 'ONLINE' : 'NO_INDEX'
      });
    }

    // Automatisch branches.json synchroniseren zodat statische weergave altijd klopt
    try {
      const branchesData = { branches: branchList.filter(b => !b.isMain) };
      const jsonPath = path.join(ROOT_DIR, 'branches.json');
      const currentJson = fs.existsSync(jsonPath) ? fs.readFileSync(jsonPath, 'utf8') : '';
      const newJson = JSON.stringify(branchesData, null, 2) + '\n';
      if (currentJson !== newJson) {
        fs.writeFileSync(jsonPath, newJson, 'utf8');
      }
    } catch (e) {}
  } catch (err) {
    console.error('[Agevo Dev Server] Error running git branch:', err.message);
  }

  return branchList;
}

const server = http.createServer((req, res) => {
  const reqUrl = req.url.split('?')[0];

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (reqUrl === '/api/branches' || reqUrl === '/api/projects') {
    const branches = scanGitBranches();
    const branchProducts = branches.filter(b => !b.isMain);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      count: branchProducts.length,
      allCount: branches.length,
      branches: branchProducts,
      allBranches: branches
    }, null, 2));
    return;
  }

  if (reqUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }, null, 2));
    return;
  }

  // Handle both /branch/<name> and /branches/<name>
  let safeUrl = decodeURIComponent(reqUrl);
  if (safeUrl.startsWith('/branch/')) {
    safeUrl = '/branches/' + safeUrl.slice('/branch/'.length);
  }

  let filePath = path.join(ROOT_DIR, safeUrl === '/' ? 'index.html' : safeUrl);

  // Check if directory
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      if (!reqUrl.endsWith('/')) {
        res.writeHead(301, { 'Location': reqUrl + '/' });
        res.end();
        return;
      }
      filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (err2, stats2) => {
      if (err2 || !stats2.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html lang="nl">
          <head><meta charset="utf-8"><title>404</title><style>body{font-family:sans-serif;background:#090c15;color:#fff;padding:2rem;text-align:center;}a{color:#6366f1;}</style></head>
          <body>
            <h2>404 - Niet gevonden</h2>
            <p>Het bestand of de branch bestaat niet: <code>${reqUrl}</code></p>
            <p><a href="/">&larr; Terug naar Agevo</a></p>
          </body>
          </html>
        `);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`[AGEVO GIT BRANCH SERVER] Online op http://localhost:${port}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const fallbackPort = 3001;
    console.log(`Poort ${PORT} is bezet, probeer poort ${fallbackPort}...`);
    setTimeout(() => {
      startServer(fallbackPort);
    }, 200);
  } else {
    console.error('[AGEVO GIT BRANCH SERVER] Fout:', err);
  }
});

startServer(PORT);


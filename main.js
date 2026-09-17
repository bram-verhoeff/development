/**
 * AGEVO // Bram Verhoeff
 * Git Branch Launcher (Ondersteunt zowel Localhost als GitHub Pages)
 */

document.addEventListener('DOMContentLoaded', () => {
  loadBranches();
});

async function loadBranches() {
  const container = document.getElementById('branches-container');
  if (!container) return;

  let branches = [];

  // 1. Probeer lokale testserver API (Node.js)
  try {
    const res = await fetch('/api/branches');
    if (res.ok) {
      const data = await res.json();
      if (data.branches && data.branches.length > 0) {
        branches = data.branches;
      }
    }
  } catch (e) {
    // Geen lokale Node server, we draaien waarschijnlijk op GitHub Pages
  }

  // 2. Fallback voor GitHub Pages: laad statische branches.json
  if (branches.length === 0) {
    try {
      const resStatic = await fetch('./branches.json');
      if (resStatic.ok) {
        const dataStatic = await resStatic.json();
        branches = dataStatic.branches || [];
      }
    } catch (e) {
      // Fallback naar embedded data
      branches = [
        {
          branch: "CRMSYSTEM",
          title: "HighFlow CRM | GoHighLevel Automation & Sales Platform",
          description: "All-in-one GoHighLevel alternatief met een visuele workflow builder, sales pipelines, omnichannel inbox, LinkedIn AI Studio en contactbeheer.",
          url: "./branches/CRMSYSTEM/",
          status: "ONLINE"
        },
        {
          branch: "thecoast",
          title: "Beach House The Coast | Strandpaviljoen op Palen in Monster",
          description: "Welkom bij Beach House The Coast aan strandopgang Molenslag in Monster. 360° uitzicht over zee, verse vis en seizoensgerechten, jaarrond geopend.",
          url: "./branches/thecoast/",
          status: "ONLINE"
        }
      ];
    }
  }

  // Render branches
  if (branches.length === 0) {
    container.innerHTML = `
      <div class="loading">Geen test branches gevonden.</div>
    `;
    return;
  }

  container.innerHTML = branches.map(b => {
    // Zorg voor relatief pad voor GitHub Pages compatibiliteit
    let targetUrl = b.url;
    if (targetUrl.startsWith('/branch/')) {
      targetUrl = '.' + targetUrl.replace('/branch/', '/branches/');
    }

    return `
      <a href="${targetUrl}" class="branch-card">
        <div class="branch-info">
          <span class="branch-tag">⎇ branch: ${escapeHtml(b.branch)}</span>
          <h2 class="branch-title">${escapeHtml(b.title)}</h2>
          <p class="branch-desc">${escapeHtml(b.description)}</p>
        </div>

        <div class="branch-btn">
          <span>Open Branch</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M7 17L17 7"></path>
            <path d="M7 7h10v10"></path>
          </svg>
        </div>
      </a>
    `;
  }).join('');
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

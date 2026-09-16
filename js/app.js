// HighFlow CRM - Main Orchestrator & View Controller

class HighFlowApp {
  constructor() {
    this.currentView = 'automations'; // Start on automations as requested by user ("waarin ik automations kan maken")
  }

  init() {
    this.bindNavigation();
    this.bindGlobalSearch();
    this.bindGlobalActions();
    this.bindSettings();
    this.navigateTo(this.currentView);
  }

  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.dataset.view;
        const tab = item.dataset.tab;
        if (view === 'automations') {
          if (window.automationsEngine) {
            window.automationsEngine.activeTab = tab || 'workflows';
          }
        }
        if (view) this.navigateTo(view, tab);
      });
    });
  }

  navigateTo(viewName, targetTab = null) {
    this.currentView = viewName;

    // Update nav classes
    document.querySelectorAll('.nav-item').forEach(item => {
      let isMatch = false;
      if (targetTab) {
        isMatch = item.dataset.tab === targetTab;
      } else {
        isMatch = !item.dataset.tab && item.dataset.view === viewName;
      }
      if (isMatch) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Toggle view containers
    document.querySelectorAll('.view-pane').forEach(pane => {
      if (pane.id === `${viewName}-view`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Trigger module render if needed
    switch (viewName) {
      case 'dashboard':
        window.dashboardModule?.init();
        break;
      case 'contacts':
        window.contactsModule?.init();
        break;
      case 'automations':
        if (targetTab && window.automationsEngine) {
          window.automationsEngine.activeTab = targetTab;
        }
        window.automationsEngine?.init();
        break;
      case 'pipeline':
        window.pipelineModule?.init();
        break;
      case 'conversations':
        window.conversationsModule?.init();
        break;
      case 'calendar':
        window.calendarModule?.init();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  // ==========================================
  // GLOBAL SEARCH & COMMAND PALETTE (CTRL+K)
  // ==========================================
  bindGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const searchModal = document.getElementById('command-palette-modal');
    const searchResults = document.getElementById('palette-results');

    const openPalette = () => {
      searchModal?.classList.add('active');
      const pInput = document.getElementById('palette-input');
      if (pInput) {
        pInput.value = '';
        pInput.focus();
        this.runGlobalSearch('', searchResults);
      }
    };

    const closePalette = () => {
      searchModal?.classList.remove('active');
    };

    if (searchInput) {
      searchInput.addEventListener('click', openPalette);
      searchInput.addEventListener('focus', openPalette);
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape') {
        closePalette();
      }
    });

    document.getElementById('palette-close')?.addEventListener('click', closePalette);

    const paletteInput = document.getElementById('palette-input');
    if (paletteInput) {
      paletteInput.addEventListener('input', (e) => {
        this.runGlobalSearch(e.target.value.trim().toLowerCase(), searchResults);
      });
    }
  }

  runGlobalSearch(query, resultsContainer) {
    if (!resultsContainer) return;

    const contacts = window.crmState.getContacts();
    const automations = window.crmState.getAutomations();
    const deals = window.crmState.getDeals();

    const matchedContacts = contacts.filter(c => !query || c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query));
    const matchedWfs = automations.filter(w => !query || w.name.toLowerCase().includes(query));
    const matchedDeals = deals.filter(d => !query || d.title.toLowerCase().includes(query) || d.company.toLowerCase().includes(query));

    resultsContainer.innerHTML = `
      ${matchedContacts.length ? `
        <div class="palette-group-title">👥 Contacten</div>
        ${matchedContacts.slice(0, 3).map(c => `
          <div class="palette-item" onclick="window.highflowApp.selectSearchResult('contact', '${c.id}')">
            <img src="${c.avatar}" class="avatar-xs" alt="">
            <span><strong>${c.name}</strong> - ${c.company || c.email}</span>
          </div>
        `).join('')}
      ` : ''}

      ${matchedWfs.length ? `
        <div class="palette-group-title">🚀 Workflows & Automations</div>
        ${matchedWfs.slice(0, 3).map(w => `
          <div class="palette-item" onclick="window.highflowApp.selectSearchResult('workflow', '${w.id}')">
            <span>⚡ <strong>${w.name}</strong> (${w.category})</span>
          </div>
        `).join('')}
      ` : ''}

      ${matchedDeals.length ? `
        <div class="palette-group-title">📈 Pipeline Opportunities</div>
        ${matchedDeals.slice(0, 3).map(d => `
          <div class="palette-item" onclick="window.highflowApp.selectSearchResult('deal', '${d.id}')">
            <span>💼 <strong>${d.title}</strong> - € ${d.value.toLocaleString()}</span>
          </div>
        `).join('')}
      ` : ''}
    `;
  }

  selectSearchResult(type, id) {
    document.getElementById('command-palette-modal')?.classList.remove('active');
    if (type === 'contact') {
      this.navigateTo('contacts');
      setTimeout(() => window.contactsModule?.openDrawer(id), 200);
    } else if (type === 'workflow') {
      this.navigateTo('automations');
      setTimeout(() => window.automationsEngine?.openBuilder(id), 200);
    } else if (type === 'deal') {
      this.navigateTo('pipeline');
    }
  }

  // ==========================================
  // QUICK ACTIONS "+ NIEUW"
  // ==========================================
  bindGlobalActions() {
    const quickBtn = document.getElementById('btn-global-quick-add');
    const quickDropdown = document.getElementById('quick-add-menu');

    if (quickBtn && quickDropdown) {
      quickBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        quickDropdown.classList.toggle('active');
      });

      document.addEventListener('click', () => {
        quickDropdown.classList.remove('active');
      });
    }

    document.getElementById('action-add-contact')?.addEventListener('click', () => {
      this.navigateTo('contacts');
      setTimeout(() => document.getElementById('add-contact-modal')?.classList.add('active'), 200);
    });

    document.getElementById('action-add-wf')?.addEventListener('click', () => {
      this.navigateTo('automations');
      setTimeout(() => window.automationsEngine?.createNewWorkflow(), 200);
    });

    document.getElementById('action-add-deal')?.addEventListener('click', () => {
      this.navigateTo('pipeline');
      setTimeout(() => document.getElementById('add-deal-modal')?.classList.add('active'), 200);
    });

    document.getElementById('action-add-app')?.addEventListener('click', () => {
      this.navigateTo('calendar');
      setTimeout(() => document.getElementById('book-appointment-modal')?.classList.add('active'), 200);
    });

    // Reset Demo Data
    document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
      if (confirm('Weet je zeker dat je alle data wilt herstellen naar de originele GoHighLevel demo set?')) {
        window.crmState.resetDemo();
        this.showToast('Demo data hersteld!', 'info');
        this.navigateTo(this.currentView);
      }
    });

    // Logout & Lock Handlers
    const doLogout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {}
      localStorage.removeItem('highflow_auth_session');
      window.location.href = 'login.html';
    };

    document.getElementById('btn-sidebar-logout')?.addEventListener('click', () => {
      if (confirm('Wil je het dashboard nu vergrendelen en uitloggen?')) {
        doLogout();
      }
    });

    document.getElementById('btn-sidebar-lock')?.addEventListener('click', () => {
      doLogout();
    });

    document.getElementById('btn-topbar-lock')?.addEventListener('click', () => {
      doLogout();
    });
  }

  // ==========================================
  // SETTINGS VIEW
  // ==========================================
  renderSettings() {
    const container = document.getElementById('settings-view');
    if (!container) return;

    const s = window.crmState.data.settings;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Instellingen & Integraties</h1>
          <p class="view-subtitle">Configureer sub-accounts, SMS/E-mail providers, Webhooks en API keys.</p>
        </div>
      </div>

      <div class="settings-grid">
        <div class="settings-card">
          <div class="settings-card-header">
            <h3>🏢 Sub-Account Configuratie</h3>
            <span class="badge badge-success">Actief</span>
          </div>
          <div class="form-group">
            <label>Bedrijfsnaam Sub-Account:</label>
            <input type="text" id="setting-account-name" class="form-control" value="${s.accountName}">
          </div>
          <div class="form-group">
            <label>Valuta:</label>
            <input type="text" id="setting-currency" class="form-control" value="${s.currency}">
          </div>
          <button class="btn btn-primary btn-sm" id="btn-save-general-settings">Opslaan</button>
        </div>

        <div class="settings-card">
          <div class="settings-card-header">
            <h3>💬 SMS & Telefonie (Twilio Simulatie)</h3>
            <span class="badge badge-primary">Verbonden</span>
          </div>
          <div class="form-group">
            <label>Twilio Account SID:</label>
            <input type="text" class="form-control font-mono" value="${s.twilioSid}">
          </div>
          <div class="form-group">
            <label>Automatische SMS Reacties Simuleren:</label>
            <div class="toggle-wrap">
              <input type="checkbox" id="setting-auto-replies" ${s.enableAutoReplies ? 'checked' : ''}>
              <label for="setting-auto-replies">Klant antwoordt automatisch na 1.5s</label>
            </div>
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-card-header">
            <h3>✉️ E-mail Server (SendGrid / Mailgun)</h3>
            <span class="badge badge-primary">Verbonden</span>
          </div>
          <div class="form-group">
            <label>SendGrid API Key:</label>
            <input type="password" class="form-control font-mono" value="${s.sendgridKey}">
          </div>
          <div class="form-group">
            <label>Standaard Afzender:</label>
            <input type="email" class="form-control" value="noreply@highflowcrm.com">
          </div>
        </div>

        <div class="settings-card">
          <div class="settings-card-header">
            <h3>🌐 Algemene Webhook (Zapier / Make Inkomend)</h3>
            <span class="badge badge-secondary">Webhook Live</span>
          </div>
          <div class="form-group">
            <label>Inkomende Webhook URL:</label>
            <input type="text" class="form-control font-mono" readonly value="${s.webhookEndpoint}">
          </div>
          <button class="btn btn-outline btn-sm" onclick="navigator.clipboard.writeText('${s.webhookEndpoint}'); window.highflowApp.showToast('Webhook URL gekopieerd!', 'info');">
            Kopieer URL
          </button>
        </div>

        <div class="settings-card" style="grid-column: 1 / -1;">
          <div class="settings-card-header">
            <h3>💼 LinkedIn Autopilot Koppeling (StudyElite & AgevoDev)</h3>
            <span class="badge ${s.linkedinWebhookUrl || s.linkedinAccessToken ? 'badge-success' : 'badge-warning'}">
              ${s.linkedinWebhookUrl || s.linkedinAccessToken ? '● Verbonden' : '● Niet Verbonden'}
            </span>
          </div>
          <p class="text-muted" style="margin-bottom: 14px;">
            Koppel je account om gegenereerde posts automatisch 24/7 op je LinkedIn profiel of bedrijfspagina te publiceren.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
            <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 600; font-size: 13px;">Optie 1: Make.com / Zapier Webhook (Aanbevolen)</label>
                <span class="badge badge-success" style="font-size: 10px;">2 min • 100% Gratis</span>
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                Maak in Make.com een scenario (Webhook ➔ LinkedIn Create Share) en plak hier de URL:
              </p>
              <input type="url" id="setting-linkedin-webhook" class="form-control font-mono" placeholder="https://hook.eu1.make.com/..." value="${s.linkedinWebhookUrl || ''}" style="margin-bottom: 8px;">
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary btn-sm" id="btn-save-setting-webhook">Webhook Opslaan</button>
                <button class="btn btn-secondary btn-sm" id="btn-test-setting-webhook">Test Webhook</button>
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-weight: 600; font-size: 13px;">Optie 2: Directe LinkedIn Developer OAuth Token</label>
                <span class="badge badge-secondary" style="font-size: 10px;">Developer App</span>
              </div>
              <input type="password" id="setting-linkedin-token" class="form-control font-mono" placeholder="LinkedIn Access Token (Bearer)" value="${s.linkedinAccessToken || ''}" style="margin-bottom: 8px;">
              <input type="text" id="setting-linkedin-urn" class="form-control font-mono" placeholder="Author URN (urn:li:person:xyz)" value="${s.linkedinAuthorUrn || ''}" style="margin-bottom: 8px;">
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary btn-sm" id="btn-save-setting-token">API Gegevens Opslaan</button>
                <button class="btn btn-secondary btn-sm" id="btn-test-setting-token">Test Directe API</button>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-card" style="grid-column: 1 / -1; border-color: rgba(99, 102, 241, 0.4);">
          <div class="settings-card-header">
            <h3>🔐 Toegangsbeveiliging &amp; Wachtwoord (Bram Verhoeff)</h3>
            <span class="badge badge-success">● Sessie Actief Beveiligd</span>
          </div>
          <p class="text-muted" style="margin-bottom: 14px;">
            HighFlow CRM is vergrendeld met een server-side wachtwoord. Niemand zonder wachtwoord kan meekijken of posts publiceren.
          </p>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
            <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <h4 style="margin: 0 0 10px 0; font-size: 13px;">Wachtwoord Wijzigen</h4>
              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 12px;">Huidig Wachtwoord:</label>
                <input type="password" id="input-curr-pwd" class="form-control" placeholder="Huidig wachtwoord...">
              </div>
              <div class="form-group" style="margin-bottom: 10px;">
                <label style="font-size: 12px;">Nieuw Wachtwoord:</label>
                <input type="password" id="input-new-pwd" class="form-control" placeholder="Minimaal 4 tekens...">
              </div>
              <div class="form-group" style="margin-bottom: 12px;">
                <label style="font-size: 12px;">Herhaal Nieuw Wachtwoord:</label>
                <input type="password" id="input-confirm-pwd" class="form-control" placeholder="Herhaal nieuw wachtwoord...">
              </div>
              <button class="btn btn-primary btn-sm" id="btn-save-new-password">Wachtwoord Opslaan</button>
            </div>

            <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <h4 style="margin: 0 0 8px 0; font-size: 13px;">Direct Dashboard Vergrendelen</h4>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                  Wil je weglopen van je computer of de browser afsluiten en direct zeker weten dat niemand kan meekijken?
                </p>
                <div style="background: rgba(99, 102, 241, 0.1); border-radius: 6px; padding: 10px; font-size: 12px; color: #c7d2fe; margin-bottom: 14px;">
                  🔒 Na vergrendeling is het wachtwoord direct vereist om het dashboard, contacten en LinkedIn Studio te heropenen.
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-settings-lock-now" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">
                🔒 Nu Vergrendelen &amp; Uitloggen
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#btn-save-general-settings')?.addEventListener('click', () => {
      s.accountName = document.getElementById('setting-account-name').value;
      s.currency = document.getElementById('setting-currency').value;
      s.enableAutoReplies = document.getElementById('setting-auto-replies').checked;
      window.crmState.saveState();
      this.showToast('Instellingen opgeslagen!', 'success');
      const brandSub = document.getElementById('topbar-subaccount-label');
      if (brandSub) brandSub.textContent = s.accountName;
    });

    container.querySelector('#btn-save-setting-webhook')?.addEventListener('click', () => {
      const url = document.getElementById('setting-linkedin-webhook')?.value.trim();
      s.linkedinWebhookUrl = url;
      window.crmState.saveState();
      this.showToast('LinkedIn Webhook URL opgeslagen!', 'success');
      this.renderSettings();
    });

    container.querySelector('#btn-test-setting-webhook')?.addEventListener('click', async () => {
      const url = document.getElementById('setting-linkedin-webhook')?.value.trim();
      if (!url) {
        alert('Vul eerst een Webhook URL in!');
        return;
      }
      this.showToast('Test post verzenden naar webhook...', 'info');
      try {
        const res = await fetch('/api/linkedin/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: url,
            target: 'StudyElite.nl & AgevoDev.nl',
            content: '🚀 Test post vanaf HighFlow CRM Automations voor AgevoDev.nl & StudyElite.nl!'
          })
        });
        const data = await res.json();
        if (data.success) {
          this.showToast('✓ Test post succesvol afgeleverd bij je webhook!', 'success');
        } else {
          this.showToast('Fout: ' + (data.error || 'Onbekend'), 'warning');
        }
      } catch (e) {
        this.showToast('Netwerkfout: ' + e.message, 'warning');
      }
    });

    container.querySelector('#btn-save-setting-token')?.addEventListener('click', () => {
      s.linkedinAccessToken = document.getElementById('setting-linkedin-token')?.value.trim();
      s.linkedinAuthorUrn = document.getElementById('setting-linkedin-urn')?.value.trim();
      window.crmState.saveState();
      this.showToast('LinkedIn API gegevens opgeslagen!', 'success');
      this.renderSettings();
    });

    container.querySelector('#btn-test-setting-token')?.addEventListener('click', async () => {
      const token = document.getElementById('setting-linkedin-token')?.value.trim();
      const urn = document.getElementById('setting-linkedin-urn')?.value.trim();
      if (!token || !urn) {
        alert('Vul eerst zowel een Access Token als Author URN in!');
        return;
      }
      this.showToast('Test post verzenden naar officiële LinkedIn API...', 'info');
      try {
        const res = await fetch('/api/linkedin/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: token,
            authorUrn: urn,
            target: 'StudyElite.nl & AgevoDev.nl',
            content: '🚀 Test post direct via officiële LinkedIn API vanaf HighFlow CRM!'
          })
        });
        const data = await res.json();
        if (data.success) {
          this.showToast('✓ Test post direct live geplaatst op LinkedIn!', 'success');
        } else {
          this.showToast('Fout bij LinkedIn API: ' + (data.error || 'Onbekend'), 'warning');
        }
      } catch (e) {
        this.showToast('Netwerkfout: ' + e.message, 'warning');
      }
    });

    container.querySelector('#btn-save-new-password')?.addEventListener('click', async () => {
      const curr = document.getElementById('input-curr-pwd')?.value;
      const newP = document.getElementById('input-new-pwd')?.value;
      const confirmP = document.getElementById('input-confirm-pwd')?.value;

      if (!curr || !newP) {
        alert('Vul zowel het huidige als het nieuwe wachtwoord in.');
        return;
      }
      if (newP !== confirmP) {
        alert('Het nieuwe wachtwoord en de herhaling komen niet overeen.');
        return;
      }

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: curr, newPassword: newP })
        });
        const data = await res.json();
        if (data.success) {
          try {
            const buffer = new TextEncoder().encode(newP);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            localStorage.setItem('highflow_custom_hash', newHash);
          } catch (e) {}
          this.showToast('✓ Wachtwoord succesvol gewijzigd!', 'success');
          document.getElementById('input-curr-pwd').value = '';
          document.getElementById('input-new-pwd').value = '';
          document.getElementById('input-confirm-pwd').value = '';
        } else {
          this.showToast('Fout: ' + (data.error || 'Onbekend'), 'warning');
        }
      } catch (err) {
        this.showToast('Netwerkfout: ' + err.message, 'warning');
      }
    });

    container.querySelector('#btn-settings-lock-now')?.addEventListener('click', () => {
      doLogout();
    });
  }

  bindSettings() {}

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '✕';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.highflowApp = new HighFlowApp();
  window.highflowApp.init();
});

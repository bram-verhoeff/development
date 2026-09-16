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
        if (view) this.navigateTo(view);
      });
    });
  }

  navigateTo(viewName) {
    this.currentView = viewName;

    // Update nav classes
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.view === viewName) {
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
            <h3>🌐 Webhook & Zapier / Make Koppeling</h3>
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
      </div>
    `;

    container.querySelector('#btn-save-general-settings')?.addEventListener('click', () => {
      s.accountName = document.getElementById('setting-account-name').value;
      s.currency = document.getElementById('setting-currency').value;
      s.enableAutoReplies = document.getElementById('setting-auto-replies').checked;
      window.crmState.saveState();
      this.showToast('Instellingen opgeslagen!', 'success');
      // Update subaccount label in topbar
      const brandSub = document.getElementById('topbar-subaccount-label');
      if (brandSub) brandSub.textContent = s.accountName;
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

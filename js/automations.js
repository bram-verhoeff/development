// HighFlow CRM - Visual Workflow Builder & Automation Engine

class AutomationsEngine {
  constructor() {
    this.currentWorkflow = null;
    this.selectedNodeId = null;
    this.zoomLevel = 1;
    this.filterCategory = 'all';
    this.searchQuery = '';
    this.activeTab = 'workflows'; // 'workflows' or 'history'
    this.simulating = false;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    // Re-render on state change
    window.crmState.subscribe('automations_changed', () => {
      if (!this.currentWorkflow) {
        this.renderList();
      }
    });
  }

  render() {
    const container = document.getElementById('automations-view');
    if (!container) return;

    if (this.currentWorkflow) {
      this.renderBuilder(container);
    } else {
      this.renderList(container);
    }
  }

  // ==========================================
  // LIST VIEW & EXECUTION HISTORY
  // ==========================================
  renderList(container = document.getElementById('automations-view')) {
    if (!container) return;

    const automations = window.crmState.getAutomations();
    const categories = ['all', 'Sales', 'Marketing', 'Lead Gen', 'Afspraken', 'Onboarding'];
    const logs = window.crmState.getExecutionLogs();

    const filtered = automations.filter(wf => {
      const matchesCat = this.filterCategory === 'all' || wf.category === this.filterCategory;
      const matchesSearch = !this.searchQuery || 
        wf.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (wf.description && wf.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Automations & Workflows</h1>
          <p class="view-subtitle">Echte werkende GoHighLevel-automatiseringen: stappen worden realtime uitgevoerd op contacten, deals en inbox.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-open-templates">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
            Template Bibliotheek
          </button>
          <button class="btn btn-primary" id="btn-create-workflow">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="12" y2="12"></line></svg>
            Nieuwe Workflow
          </button>
        </div>
      </div>

      <!-- Tab Switcher: Workflows, LinkedIn AI Studio vs Real Execution Logs -->
      <div class="automation-tabs-bar">
        <button class="automation-tab-btn ${this.activeTab === 'workflows' ? 'active' : ''}" id="tab-workflows">
          ⚡ Workflows (${automations.length})
        </button>
        <button class="automation-tab-btn ${this.activeTab === 'linkedin' ? 'active' : ''}" id="tab-linkedin">
          🤖 LinkedIn AI Studio (Bram Verhoeff, AgevoDev & StudyElite)
        </button>
        <button class="automation-tab-btn ${this.activeTab === 'history' ? 'active' : ''}" id="tab-history">
          📜 Live Uitvoeringslogboek (${logs.length})
        </button>
      </div>

      ${this.activeTab === 'workflows' ? `
        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-input-wrapper">
            <svg class="icon search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="workflow-search" class="input-search" placeholder="Zoek op naam of omschrijving..." value="${this.searchQuery}">
          </div>
          <div class="category-pills">
            ${categories.map(cat => `
              <button class="pill-btn ${this.filterCategory === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat === 'all' ? 'Alle Workflows' : cat}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Workflow Cards Grid -->
        <div class="workflow-grid">
          ${filtered.map(wf => this.renderWorkflowCard(wf)).join('')}
        </div>
      ` : this.activeTab === 'linkedin' ? `
        <!-- LinkedIn AI Publishing Studio -->
        <div class="linkedin-studio-container">
          <div class="linkedin-banner-card">
            <div class="linkedin-banner-content">
              <div class="linkedin-badge-row">
                <span class="badge badge-primary">AI Automation 24/7</span>
                <span class="badge ${window.crmState.data.settings?.linkedinWebhookUrl || window.crmState.data.settings?.linkedinAccessToken ? 'badge-success' : 'badge-warning'}">
                  ${window.crmState.data.settings?.linkedinWebhookUrl || window.crmState.data.settings?.linkedinAccessToken ? '● Autopilot Koppeling Actief' : '● 1-Klik Delen Actief (Webhook optioneel)'}
                </span>
              </div>
              <h2>Dagelijkse LinkedIn Content Autopilot</h2>
              <p>Genereert beurtelings waardevolle content voor <strong>Bram Verhoeff</strong> (persoonlijk profiel: founder journey & tech insights), <strong>AgevoDev.nl</strong> (Next.js software & venture building) en <strong>StudyElite.nl</strong> (AI studieplanner).</p>
              
              <div class="linkedin-info-alert" style="background: rgba(99, 102, 241, 0.12); border-left: 4px solid var(--accent-primary); border-radius: 6px; padding: 12px 16px; margin: 14px 0;">
                <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #fff;">💡 Hoe komt een bericht op je echte LinkedIn account?</h4>
                <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                  • <strong>Direct live zetten (1-Klik, 0 configuratie):</strong> Klik op <em>"🔗 Direct Delen op LinkedIn (1-Klik)"</em>. De complete tekst wordt gekopieerd en LinkedIn opent direct zodat je met <code>Ctrl+V</code> (plakken) en één klik direct online bent!<br>
                  • <strong>100% Volledig automatisch (Hands-free 24/7):</strong> Koppel in het paneel hieronder een gratis <strong>Make.com</strong> of <strong>Zapier</strong> webhook. Dan post HighFlow elke ochtend automatisch zonder dat je browser open hoeft te staan.
                </p>
              </div>

              <div class="linkedin-quick-actions" style="display: flex; flex-wrap: wrap; gap: 10px;">
                <button class="btn btn-primary" id="btn-gen-bram" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                  👤 Genereer voor Bram Verhoeff (Persoonlijk)
                </button>
                <button class="btn btn-secondary" id="btn-gen-agevo">
                  🏢 Genereer voor AgevoDev.nl
                </button>
                <button class="btn btn-secondary" id="btn-gen-study">
                  🎓 Genereer voor StudyElite.nl
                </button>
                <button class="btn btn-outline" id="btn-trigger-daily-wf">
                  🚀 Voer Volledige Dagelijkse Workflow Uit
                </button>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; margin-top: 14px; width: 100%; flex-wrap: wrap; background: rgba(0,0,0,0.25); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                <span style="font-size: 12px; color: #fff; font-weight: 600; white-space: nowrap;">🎯 Thema / Focus voor AI Post:</span>
                <select id="select-agevo-topic" class="form-control" style="width: auto; min-width: 290px; font-size: 12px; padding: 6px 10px;">
                  <option value="">Wisselend (Alle Specialismen &amp; Inzichten)</option>
                  <optgroup label="👤 Bram Verhoeff (Persoonlijk Profiel)">
                    <option value="Founder Journey &amp; Bootstrappen">Founder Journey: Zolderkamer naar eigen SaaS &amp; Studio</option>
                    <option value="Tech Stack Keuzes (Next.js &amp; Supabase)">Tech Stack: Waarom Next.js &amp; Supabase boven AWS microservices</option>
                    <option value="Discipline &amp; Productiviteit van een Jonge Founder">Discipline: Studeren combineren met softwarebedrijven</option>
                    <option value="Venture Studio Filosofie: Zelf Bouwen vs Uurtje-Factuurtje">Venture Studio: Waarom klassieke bureaus verdwijnen</option>
                    <option value="Lessen over Echte AI Integraties in de Praktijk">AI Mythes: Waarom 90% van de chatbots faalt</option>
                  </optgroup>
                  <optgroup label="🏢 AgevoDev.nl (Tech Studio)">
                    <option value="Venture Studio &amp; Founder-led Development">Venture Studio: Zelf SaaS runnen vs Bureau-theorie</option>
                    <option value="Next.js 16 &amp; Web Platformen vs WordPress/No-Code">Next.js 16 &amp; React 19 Maatwerk vs Trage No-Code</option>
                    <option value="SaaS &amp; MVP Ontwikkeling (Van Idee naar Betalende Klanten)">SaaS MVP: Multi-tenant, Supabase &amp; Stripe</option>
                    <option value="Echte AI &amp; Autonome Agents (Voorbij de ChatGPT Hype)">Echte AI: LLM Orchestration &amp; Autonome Background Workers</option>
                    <option value="Direct Contact met Engineers &amp; 100% Code Eigendom">Direct Contact met Senior Engineers &amp; 100% Code Eigendom</option>
                  </optgroup>
                  <optgroup label="🎓 StudyElite.nl (AI EdTech SaaS)">
                    <option value="Studie-efficiëntie &amp; Active Recall">Active Recall &amp; Spaced Repetition vs Inefficiënt Leren</option>
                    <option value="Tentamens &amp; Nachtrust">Nachtrust &amp; Tentamensucces zonder Nachtmerries</option>
                    <option value="AI Study Scheduler &amp; ECTS Tracking">AI Study Scheduler &amp; ECTS Voorspelling</option>
                  </optgroup>
                </select>
                <input type="text" id="input-custom-agevo-topic" class="form-control" placeholder="Of typ een eigen specifiek onderwerp / prompt (optioneel)..." style="flex: 1; min-width: 220px; font-size: 12px; padding: 6px 10px;">
              </div>
            </div>
          </div>

          <!-- Webhook / API Configuration Panel for 100% Hands-free Posting -->
          <div class="linkedin-webhook-card">
            <div class="webhook-card-info" style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
              <div>
                <h4 style="margin: 0 0 6px 0;">🔗 Hands-free Autopilot Koppeling (Make.com, Zapier of LinkedIn API)</h4>
                <p class="text-muted" style="margin: 0;">
                  Wil je dat HighFlow elke ochtend om 09:00 uur <em>zonder jouw tussenkomst</em> op je live LinkedIn profiel of bedrijfspagina plaatst? Koppel hieronder eenvoudig een gratis Webhook of je LinkedIn API token:
                </p>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-open-linkedin-guide" style="white-space: nowrap; border-color: var(--accent-primary); color: #fff;">
                📖 Bekijk Stap-voor-stap Koppelgids
              </button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 14px;">
              <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="font-weight: 600; font-size: 13px;">Optie 1: Make.com / Zapier Webhook (Aanbevolen)</label>
                  <span class="badge badge-success" style="font-size: 10px;">2 min • 100% Gratis</span>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                  1. Maak in Make.com een scenario: <strong>Custom Webhook ➔ LinkedIn 'Create a Share'</strong>.<br>
                  2. Plak hieronder je Webhook URL:
                </p>
                <input type="url" id="input-linkedin-webhook" class="form-control" placeholder="https://hook.eu1.make.com/..." value="${window.crmState.data.settings?.linkedinWebhookUrl || ''}" style="margin-bottom: 8px;">
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-primary btn-sm" id="btn-save-linkedin-webhook">Webhook Opslaan</button>
                  <button class="btn btn-secondary btn-sm" id="btn-test-live-webhook">Test Webhook</button>
                </div>
              </div>

              <div style="background: rgba(0,0,0,0.2); padding: 14px; border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <label style="font-weight: 600; font-size: 13px;">Optie 2: Directe LinkedIn Developer OAuth API</label>
                  <span class="badge badge-secondary" style="font-size: 10px;">Voor Developers</span>
                </div>
                <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                  Voor LinkedIn Developer App gebruikers met <code>w_member_social</code> permissie:
                </p>
                <input type="password" id="input-linkedin-token" class="form-control" placeholder="LinkedIn Access Token (Bearer)" value="${window.crmState.data.settings?.linkedinAccessToken || ''}" style="margin-bottom: 8px;">
                <input type="text" id="input-linkedin-urn" class="form-control" placeholder="Author URN (bijv. urn:li:person:abcdef123)" value="${window.crmState.data.settings?.linkedinAuthorUrn || ''}" style="margin-bottom: 8px;">
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-primary btn-sm" id="btn-save-linkedin-token">API Gegevens Opslaan</button>
                  <button class="btn btn-secondary btn-sm" id="btn-test-live-token">Test Directe API</button>
                </div>
              </div>
            </div>
          </div>

          <h3 class="studio-section-title">Gepubliceerde & Gegenereerde LinkedIn Berichten</h3>
          <div class="linkedin-posts-grid">
            ${window.crmState.getAIPosts().length === 0 ? `
              <div class="empty-state" style="grid-column: 1 / -1; padding: 40px; background: var(--bg-card); border-radius: 12px; border: 1px solid var(--border-subtle); text-align: center;">
                <p>Nog geen berichten gegenereerd. Klik op één van de knoppen hierboven om direct een AI LinkedIn post te maken voor StudyElite.nl of AgevoDev.nl!</p>
              </div>
            ` : window.crmState.getAIPosts().map(post => `
              <div class="linkedin-card" data-post-id="${post.id}">
                <div class="linkedin-card-header">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" class="avatar-sm" alt="Bram">
                  <div class="linkedin-author-info">
                    <strong>Bram Verhoeff</strong>
                    <small>${post.target === 'Bram Verhoeff' ? 'Persoonlijk Profiel • <a href="https://www.linkedin.com/in/bram-verhoeff/" target="_blank" style="color: var(--accent-sky); text-decoration: underline;">linkedin.com/in/bram-verhoeff</a>' : 'Founder @ AgevoDev.nl & StudyElite.nl'} • ${post.formattedTime}</small>
                  </div>
                  <span class="badge ${post.target === 'StudyElite.nl' ? 'badge-primary' : (post.target === 'Bram Verhoeff' ? 'badge-info' : 'badge-success')}" style="${post.target === 'Bram Verhoeff' ? 'background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.4);' : ''}">${post.target === 'Bram Verhoeff' ? '👤 Bram Verhoeff' : post.target}</span>
                </div>
                <div class="linkedin-post-body">
                  <pre class="linkedin-text">${post.content}</pre>
                </div>
                <div class="linkedin-stats-bar">
                  <span>👍💡👏 ${post.reactions} interacties</span>
                  <span>${post.impressions} weergaven</span>
                </div>
                <div class="linkedin-card-footer">
                  <div class="footer-btn-group">
                    <button class="btn btn-sm btn-primary btn-open-linkedin-share" data-text="${encodeURIComponent(post.content)}">
                      🔗 Direct Delen op LinkedIn (1-Klik)
                    </button>
                    <button class="btn btn-sm btn-secondary btn-edit-single-post" data-id="${post.id}">
                      ✏️ Bekijk / Bewerk
                    </button>
                    <button class="btn btn-sm btn-outline btn-copy-post" data-text="${encodeURIComponent(post.content)}">
                      📋 Kopieer
                    </button>
                  </div>
                  <span class="badge badge-success">✓ AI Gereed</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <!-- Execution History Audit Trail Table -->
        <div class="table-container">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Tijdstip</th>
                <th>Workflow Naam</th>
                <th>Doel / Doelgroep</th>
                <th>Aanleiding / Trigger</th>
                <th>Uitgevoerde Stappen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `
                <tr>
                  <td colspan="6" class="empty-state">
                    <div class="empty-state-content">
                      <p>Nog geen workflows uitgevoerd. Start een workflow via de knop "⚡ Uitvoeren" of genereer een post in de LinkedIn AI Studio!</p>
                    </div>
                  </td>
                </tr>
              ` : logs.map(log => `
                <tr>
                  <td><span class="font-mono text-muted">${log.formattedTime}</span></td>
                  <td><strong>${log.workflowName}</strong></td>
                  <td>
                    <span class="badge badge-primary">${log.contactName}</span>
                  </td>
                  <td><span class="badge badge-secondary">${log.triggerSource}</span></td>
                  <td>
                    <div class="steps-pill-list">
                      ${(log.stepsExecuted || []).map(s => `<span class="badge badge-neutral">${s}</span>`).join(' ')}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-success">✓ Voltooid</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    // Tab switching
    container.querySelector('#tab-workflows')?.addEventListener('click', () => {
      this.activeTab = 'workflows';
      this.renderList();
    });
    container.querySelector('#tab-linkedin')?.addEventListener('click', () => {
      this.activeTab = 'linkedin';
      this.renderList();
    });
    container.querySelector('#tab-history')?.addEventListener('click', () => {
      this.activeTab = 'history';
      this.renderList();
    });

    // LinkedIn Studio Button Events
    if (this.activeTab === 'linkedin') {
      const copyWithFeedback = (text, successMsg = 'Tekst gekopieerd naar klembord!') => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            window.highflowApp?.showToast(successMsg, 'success');
          }).catch(() => {
            // fallback
            const t = document.createElement('textarea');
            t.value = text;
            document.body.appendChild(t);
            t.select();
            document.execCommand('copy');
            document.body.removeChild(t);
            window.highflowApp?.showToast(successMsg, 'success');
          });
        }
      };

      container.querySelector('#btn-gen-bram')?.addEventListener('click', () => {
        const selectTopic = document.getElementById('select-agevo-topic')?.value;
        const customTopic = document.getElementById('input-custom-agevo-topic')?.value?.trim();
        const chosenTopic = customTopic || selectTopic || null;
        const post = window.crmState.generateLinkedInContent('Bram Verhoeff', chosenTopic);
        this.renderList();
        this.showLinkedInPublishModal(post);
      });

      container.querySelector('#btn-gen-study')?.addEventListener('click', () => {
        const post = window.crmState.generateLinkedInContent('StudyElite.nl');
        this.renderList();
        this.showLinkedInPublishModal(post);
      });

      container.querySelector('#btn-gen-agevo')?.addEventListener('click', () => {
        const selectTopic = document.getElementById('select-agevo-topic')?.value;
        const customTopic = document.getElementById('input-custom-agevo-topic')?.value?.trim();
        const chosenTopic = customTopic || selectTopic || null;
        const post = window.crmState.generateLinkedInContent('AgevoDev.nl', chosenTopic);
        this.renderList();
        this.showLinkedInPublishModal(post);
      });

      container.querySelector('#btn-trigger-daily-wf')?.addEventListener('click', () => {
        const wf = window.crmState.getAutomation('wf_linkedin_ai');
        if (wf) {
          window.crmState.executeWorkflow(wf, { name: 'AgevoDev / StudyElite Volgers', email: 'bram@agevodev.nl' }, 'Dagelijkse Planning (09:00)');
          const latest = window.crmState.getAIPosts()[0];
          this.renderList();
          this.showLinkedInPublishModal(latest);
        }
      });

      // 1-Click direct sharing to LinkedIn
      container.querySelectorAll('.btn-open-linkedin-share').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = decodeURIComponent(btn.dataset.text);
          copyWithFeedback(text, 'Tekst gekopieerd! Druk op Ctrl+V (plakken) in het zojuist geopende LinkedIn venster.');
          window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
        });
      });

      container.querySelectorAll('.btn-edit-single-post').forEach(btn => {
        btn.addEventListener('click', () => {
          const post = window.crmState.getAIPosts().find(p => p.id === btn.dataset.id);
          if (post) {
            this.showLinkedInPublishModal(post);
          }
        });
      });

      container.querySelectorAll('.btn-copy-post').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = decodeURIComponent(btn.dataset.text);
          copyWithFeedback(text, 'Tekst naar klembord gekopieerd!');
        });
      });

      container.querySelector('#btn-save-linkedin-webhook')?.addEventListener('click', () => {
        const url = document.getElementById('input-linkedin-webhook')?.value.trim();
        window.crmState.data.settings.linkedinWebhookUrl = url;
        window.crmState.saveState();
        window.highflowApp?.showToast('LinkedIn Webhook URL succesvol opgeslagen!', 'success');
        this.renderList();
      });

      container.querySelector('#btn-save-linkedin-token')?.addEventListener('click', () => {
        const token = document.getElementById('input-linkedin-token')?.value.trim();
        const urn = document.getElementById('input-linkedin-urn')?.value.trim();
        window.crmState.data.settings.linkedinAccessToken = token;
        window.crmState.data.settings.linkedinAuthorUrn = urn;
        window.crmState.saveState();
        window.highflowApp?.showToast('LinkedIn API gegevens opgeslagen!', 'success');
        this.renderList();
      });

      container.querySelector('#btn-test-live-webhook')?.addEventListener('click', async () => {
        const url = document.getElementById('input-linkedin-webhook')?.value.trim();
        if (!url) {
          alert('Vul eerst een Webhook URL in (bijv. van Make.com, Zapier of Buffer)!');
          return;
        }
        window.highflowApp?.showToast('Test post verzenden naar live webhook...', 'info');
        try {
          const res = await fetch('/api/linkedin/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              webhookUrl: url,
              target: 'AgevoDev.nl & StudyElite.nl Test',
              content: '🚀 Test post vanaf HighFlow CRM Automations voor AgevoDev.nl & StudyElite.nl!'
            })
          });
          const data = await res.json();
          if (data.success) {
            window.highflowApp?.showToast('✓ Test post succesvol afgeleverd bij je webhook!', 'success');
          } else {
            window.highflowApp?.showToast('Fout bij webhook: ' + (data.error || 'Onbekend'), 'warning');
          }
        } catch (e) {
          window.highflowApp?.showToast('Netwerkfout bij webhook: ' + e.message, 'warning');
        }
      });

      container.querySelector('#btn-test-live-token')?.addEventListener('click', async () => {
        const token = document.getElementById('input-linkedin-token')?.value.trim();
        const urn = document.getElementById('input-linkedin-urn')?.value.trim();
        if (!token || !urn) {
          alert('Vul eerst zowel een LinkedIn Access Token als een Author URN in!');
          return;
        }
        window.highflowApp?.showToast('Test post verzenden naar officiële LinkedIn API...', 'info');
        try {
          const res = await fetch('/api/linkedin/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accessToken: token,
              authorUrn: urn,
              target: 'AgevoDev.nl & StudyElite.nl Test',
              content: '🚀 Test post direct via officiële LinkedIn API vanaf HighFlow CRM!'
            })
          });
          const data = await res.json();
          if (data.success) {
            window.highflowApp?.showToast('✓ Test post direct live geplaatst op LinkedIn!', 'success');
          } else {
            window.highflowApp?.showToast('Fout bij LinkedIn API: ' + (data.error || 'Onbekend'), 'warning');
          }
        } catch (e) {
          window.highflowApp?.showToast('Netwerkfout bij LinkedIn API: ' + e.message, 'warning');
        }
      });

      container.querySelector('#btn-open-linkedin-guide')?.addEventListener('click', () => {
        this.showLinkedInGuideModal();
      });
    }

    if (this.activeTab === 'workflows') {
      // Bind List Events
      const searchInput = container.querySelector('#workflow-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value;
          this.renderList();
        });
      }

      container.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.filterCategory = btn.dataset.cat;
          this.renderList();
        });
      });

      const createBtn = container.querySelector('#btn-create-workflow');
      if (createBtn) {
        createBtn.addEventListener('click', () => this.createNewWorkflow());
      }

      const templateBtn = container.querySelector('#btn-open-templates');
      if (templateBtn) {
        templateBtn.addEventListener('click', () => this.openTemplateModal());
      }

      // Workflow Card Actions
      container.querySelectorAll('.btn-edit-wf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openBuilder(btn.dataset.id);
        });
      });

      container.querySelectorAll('.btn-test-wf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openBuilder(btn.dataset.id);
          setTimeout(() => this.openSimulatorModal(), 300);
        });
      });

      container.querySelectorAll('.btn-real-run-wf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openDirectExecuteModal(btn.dataset.id);
        });
      });

      container.querySelectorAll('.workflow-card').forEach(card => {
        card.addEventListener('click', () => {
          this.openBuilder(card.dataset.id);
        });
      });

      container.querySelectorAll('.toggle-wf-status').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          window.crmState.toggleAutomationStatus(toggle.dataset.id);
          this.renderList();
        });
      });

      container.querySelectorAll('.btn-delete-wf').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Weet je zeker dat je deze workflow wilt verwijderen?')) {
            window.crmState.deleteAutomation(btn.dataset.id);
            this.renderList();
          }
        });
      });
    }

    container.querySelectorAll('.toggle-wf-status').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        window.crmState.toggleAutomationStatus(toggle.dataset.id);
        this.renderList();
      });
    });

    container.querySelectorAll('.btn-delete-wf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Weet je zeker dat je deze workflow wilt verwijderen?')) {
          window.crmState.deleteAutomation(btn.dataset.id);
          this.renderList();
        }
      });
    });
  }

  renderWorkflowCard(wf) {
    const isActive = wf.status === 'active';
    const stepCount = (wf.steps ? wf.steps.length : 0) + 1; // +1 for trigger

    return `
      <div class="workflow-card" data-id="${wf.id}">
        <div class="wf-card-header">
          <div class="wf-badge-group">
            <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">
              <span class="status-dot ${isActive ? 'active' : ''}"></span>
              ${isActive ? 'Actief' : 'Concept'}
            </span>
            <span class="badge badge-secondary">${wf.category || 'Algemeen'}</span>
          </div>
          <div class="wf-actions-dropdown">
            <button class="icon-btn-sm btn-delete-wf" data-id="${wf.id}" title="Verwijderen">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        <h3 class="wf-card-title">${wf.name}</h3>
        <p class="wf-card-desc">${wf.description || 'Geen omschrijving opgegeven.'}</p>

        <div class="wf-card-meta">
          <div class="meta-item">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>Trigger: <strong>${wf.trigger?.title || 'Geen trigger'}</strong></span>
          </div>
          <div class="meta-item">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span>Stappen: <strong>${stepCount}</strong></span>
          </div>
          <div class="meta-item">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span>Uitgevoerd: <strong>${wf.runs || 0} keer</strong></span>
          </div>
        </div>

        <div class="wf-card-footer">
          <button class="btn btn-sm btn-outline toggle-wf-status" data-id="${wf.id}">
            ${isActive ? 'Pauzeren' : 'Activeren'}
          </button>
          <div class="footer-btn-group">
            <button class="btn btn-sm btn-outline btn-real-run-wf" data-id="${wf.id}" title="Voer nu direct uit voor een contact">
              ⚡ Uitvoeren
            </button>
            <button class="btn btn-sm btn-secondary btn-test-wf" data-id="${wf.id}">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Testen
            </button>
            <button class="btn btn-sm btn-primary btn-edit-wf" data-id="${wf.id}">
              Bewerken
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // DIRECT WORKFLOW EXECUTION MODAL
  // ==========================================
  openDirectExecuteModal(workflowId) {
    const wf = window.crmState.getAutomation(workflowId);
    if (!wf) return;

    // Specialized direct execution for LinkedIn AI workflow!
    if (workflowId === 'wf_linkedin_ai') {
      window.crmState.executeWorkflow(wf, { name: 'AgevoDev / StudyElite Volgers', email: 'bram@agevodev.nl' }, 'Handmatig gestart');
      const latestPost = window.crmState.getAIPosts()[0];
      this.showLinkedInPublishModal(latestPost);
      return;
    }

    const contacts = window.crmState.getContacts();
    if (contacts.length === 0) {
      alert('Er zijn momenteel geen contactpersonen in het CRM. Voeg eerst een contact toe via "Contacten & Leads" of gebruik de Test Simulator in de workflow builder.');
      return;
    }

    const modalHtml = `
      <div class="modal-backdrop active" id="direct-run-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>⚡ Workflow Direct Uitvoeren</h2>
            <button class="icon-btn" onclick="document.getElementById('direct-run-modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <p>Selecteer een contactpersoon om de automatisering <strong>"${wf.name}"</strong> direct voor uit te voeren.</p>
            <div class="form-group">
              <label>Kies Doelcontact:</label>
              <select id="direct-run-contact-select" class="form-control">
                ${contacts.map(c => `
                  <option value="${c.id}">${c.name} (${c.company || 'Geen bedrijf'}) - ${c.email}</option>
                `).join('')}
              </select>
            </div>
            <div class="direct-run-preview" style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid var(--border-subtle);">
              <h5 style="margin-bottom: 6px; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">Stappen die direct in het CRM worden uitgevoerd:</h5>
              <ul style="list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: 13px;">
                ${(wf.steps || []).map(s => `<li>• <strong>${s.title}</strong> (${this.getNodeTypeLabel(s.type)})</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('direct-run-modal').remove()">Annuleren</button>
            <button class="btn btn-primary" id="btn-confirm-direct-run">⚡ Start Uitvoering</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-confirm-direct-run')?.addEventListener('click', () => {
      const contactId = document.getElementById('direct-run-contact-select')?.value;
      const contact = window.crmState.getContact(contactId);
      if (contact) {
        window.crmState.executeWorkflow(wf, contact, 'Handmatig gestart');
        window.highflowApp?.showToast(`Workflow "${wf.name}" succesvol uitgevoerd voor ${contact.name}!`, 'success');
      }
      document.getElementById('direct-run-modal')?.remove();
      this.activeTab = 'history';
      this.renderList();
    });
  }

  showLinkedInPublishModal(post) {
    if (!post) {
      post = window.crmState.getAIPosts()[0];
    }
    if (!post) {
      post = window.crmState.generateLinkedInContent('StudyElite.nl');
    }

    const modalHtml = `
      <div class="modal-backdrop active" id="linkedin-post-modal">
        <div class="modal-content" style="max-width: 660px; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xl);">
          <div class="modal-header">
            <div>
              <h2 style="font-size: 18px; margin: 0; display: flex; align-items: center; gap: 8px;">
                🚀 LinkedIn Post Gegenereerd
                <span class="badge ${post.target === 'StudyElite.nl' ? 'badge-primary' : (post.target === 'Bram Verhoeff' ? 'badge-info' : 'badge-success')}" style="${post.target === 'Bram Verhoeff' ? 'background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.4);' : ''}">${post.target === 'Bram Verhoeff' ? '👤 Bram Verhoeff' : post.target}</span>
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-secondary);">Gereed voor publicatie • ${post.formattedTime}</p>
            </div>
            <button class="icon-btn" onclick="document.getElementById('linkedin-post-modal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 20px;">
            <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; font-size: 13px; color: #fbbf24; line-height: 1.5;">
              <strong>ℹ️ Waarom zie je de post nog niet direct op je LinkedIn account?</strong><br>
              LinkedIn beveiligt accounts met OAuth 2.0. Zonder actieve authorisatie of webhook (Make/Zapier) mag geen enkel extern platform direct op je profiel posten.
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <label style="font-size: 13px; font-weight: 600;">Gegenereerde Post Tekst (bewerkbaar):</label>
                <button class="btn btn-sm btn-outline" id="modal-btn-copy" style="padding: 4px 10px; font-size: 12px;">
                  📋 Kopieer Tekst
                </button>
              </div>
              <textarea id="modal-post-textarea" class="form-control font-mono" style="height: 190px; font-size: 13px; line-height: 1.6; resize: vertical; white-space: pre-wrap;">${post.content}</textarea>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px; margin-top: 14px;">
              <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);">Kies je publicatie methode:</h4>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); padding: 12px; border-radius: 8px;">
                  <div>
                    <strong style="font-size: 14px; color: #fff; display: block;">Optie 1: Direct Delen (1-Klik • Nu Live)</strong>
                    <span style="font-size: 12px; color: var(--text-secondary);">Kopieert de post naar je klembord en opent direct de LinkedIn editor. Druk op <code>Ctrl+V</code> en klik op 'Plaatsen'.</span>
                  </div>
                  <button class="btn btn-primary" id="modal-btn-open-linkedin" style="white-space: nowrap; flex-shrink: 0;">
                    🔗 Open op LinkedIn
                  </button>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 12px; border-radius: 8px;">
                  <div>
                    <strong style="font-size: 14px; color: #fff; display: block;">Optie 2: 100% Autopilot (Make.com / Zapier Webhook)</strong>
                    <span style="font-size: 12px; color: var(--text-secondary);">Koppel een gratis Make.com webhook om elke ochtend zonder te klikken automatisch te posten.</span>
                  </div>
                  <button class="btn btn-secondary" id="modal-btn-goto-webhook" style="white-space: nowrap; flex-shrink: 0;">
                    ⚙️ Webhook Instellen
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: space-between;">
            <button class="btn btn-outline" onclick="document.getElementById('linkedin-post-modal').remove()">Sluiten</button>
            <button class="btn btn-primary" id="modal-btn-publish-direct">
              🔗 Direct Delen op LinkedIn (1-Klik)
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('linkedin-post-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const shareAction = () => {
      const currentText = document.getElementById('modal-post-textarea')?.value || post.content;
      post.content = currentText;
      window.crmState.saveState();

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentText);
      } else {
        const t = document.createElement('textarea');
        t.value = currentText;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
      }
      window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
      window.highflowApp?.showToast('Tekst gekopieerd! Druk op Ctrl+V (plakken) in het zojuist geopende LinkedIn venster en klik op "Plaatsen".', 'success');
      document.getElementById('linkedin-post-modal')?.remove();
    };

    document.getElementById('modal-btn-publish-direct')?.addEventListener('click', shareAction);
    document.getElementById('modal-btn-open-linkedin')?.addEventListener('click', shareAction);

    document.getElementById('modal-btn-copy')?.addEventListener('click', () => {
      const currentText = document.getElementById('modal-post-textarea')?.value || post.content;
      post.content = currentText;
      window.crmState.saveState();
      navigator.clipboard.writeText(currentText);
      window.highflowApp?.showToast('Tekst gekopieerd naar klembord!', 'info');
    });

    document.getElementById('modal-btn-goto-webhook')?.addEventListener('click', () => {
      document.getElementById('linkedin-post-modal')?.remove();
      this.activeTab = 'linkedin';
      this.renderList();
      setTimeout(() => {
        const el = document.getElementById('input-linkedin-webhook');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 150);
    });
  }

  showLinkedInGuideModal() {
    const modalHtml = `
      <div class="modal-backdrop active" id="linkedin-guide-modal">
        <div class="modal-content" style="max-width: 720px; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xl); max-height: 90vh; overflow-y: auto;">
          <div class="modal-header">
            <div>
              <h2 style="font-size: 18px; margin: 0; display: flex; align-items: center; gap: 8px;">
                💼 Hoe Koppel Je Jouw Echte LinkedIn Account?
              </h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-secondary);">Kies de methode die het beste bij jou past om posts automatisch te publiceren.</p>
            </div>
            <button class="icon-btn" onclick="document.getElementById('linkedin-guide-modal').remove()">&times;</button>
          </div>

          <div class="modal-body" style="padding: 20px;">
            <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 16px; flex-wrap: wrap;">
              <button class="btn btn-sm btn-primary guide-tab-btn active" data-guide="make">
                ⚡ Optie 1: Make.com (Aanbevolen • 2 min)
              </button>
              <button class="btn btn-sm btn-outline guide-tab-btn" data-guide="api">
                🔑 Optie 2: Officiële LinkedIn API
              </button>
              <button class="btn btn-sm btn-outline guide-tab-btn" data-guide="direct">
                🔗 Optie 3: 1-Klik Delen (Geen Setup)
              </button>
            </div>

            <!-- Make.com Tab -->
            <div id="guide-tab-make" class="guide-tab-pane">
              <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <strong style="color: #34d399;">Waarom Make.com de beste keuze is:</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary);">
                  LinkedIn's eigen API vereist ontwikkelaars-goedkeuring en tokens verlopen elke 60 dagen. Met Make.com (gratis) klik je 1x op "Log in met LinkedIn" en je posts worden 24/7 direct en permanent op je persoonlijke profiel of bedrijfspagina geplaatst!
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px; line-height: 1.6;">
                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>Stap 1: Maak een gratis account op Make.com</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    Ga naar <a href="https://www.make.com" target="_blank" style="color: var(--accent-primary); text-decoration: underline;">Make.com</a> (gratis tot 1.000 acties per maand, ruim voldoende voor dagelijks posten).
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>Stap 2: Maak een nieuw scenario met een Webhook</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    • Klik op <strong>"Create a new scenario"</strong>.<br>
                    • Klik op het grote plus-icoon en zoek naar <strong>"Webhooks"</strong>.<br>
                    • Kies trigger: <strong>"Custom webhook"</strong>.<br>
                    • Klik op "Add", noem hem bijvoorbeeld <em>"HighFlow LinkedIn"</em> en klik op "Save".<br>
                    • Klik op <strong>"Copy address to clipboard"</strong>.
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>Stap 3: Voeg de LinkedIn module toe</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    • Klik op het plusje naast de webhook module en zoek <strong>"LinkedIn"</strong>.<br>
                    • Kies actie: <strong>"Create a Text Post"</strong> (of "Create a Share").<br>
                    • Klik bij Connection op <strong>"Add"</strong>: er opent een venster waarin je inlogt met je eigen LinkedIn account.<br>
                    • Selecteer bij <em>Author</em> je eigen profiel of bedrijfspagina (bijv. StudyElite / AgevoDev).<br>
                    • Klik in het veld <em>Content</em> of <em>Text</em> en selecteer het veld <code>content</code> (of <code>text</code>) uit de Webhook.
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>Stap 4: Plak de Webhook URL in HighFlow CRM</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    • Plak de gekopieerde URL in het veld <strong>"Optie 1: Make.com Webhook"</strong> hier in HighFlow.<br>
                    • Klik op <strong>"Webhook Opslaan"</strong> en daarna op <strong>"Test Webhook"</strong>.<br>
                    • Zet in Make.com je scenario rechtsonder op <strong>ON</strong> (Immediately). Klaar!
                  </p>
                </div>
              </div>
            </div>

            <!-- API Tab -->
            <div id="guide-tab-api" class="guide-tab-pane" style="display: none;">
              <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <strong style="color: #818cf8;">Voor Developers & LinkedIn Developer Apps:</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary);">
                  Als je beschikt over een goedgekeurde LinkedIn Developer App met de <code>w_member_social</code> scope kun je rechtstreeks via OAuth tokens publiceren.
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px; line-height: 1.6;">
                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>1. Ga naar LinkedIn Developer Portal</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    Open <a href="https://developer.linkedin.com" target="_blank" style="color: var(--accent-primary); text-decoration: underline;">developer.linkedin.com</a> en maak een App aan gekoppeld aan je LinkedIn pagina.
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>2. Vraag "Share on LinkedIn" permissie aan</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    Onder het tabblad <strong>Products</strong> voeg je "Share on LinkedIn" of "Sign In with LinkedIn using OpenID Connect" toe voor de <code>w_member_social</code> rechten.
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>3. Genereer je Access Token & URN</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    Gebruik de <strong>OAuth 2.0 Tools</strong> om een Bearer Token te genereren. Je Author URN vind je via een GET op <code>/v2/userinfo</code> (bijv. <code>urn:li:person:abc123xyz</code>).
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>4. Opslaan & Testen</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    Vul het token en URN in bij Optie 2 in HighFlow en klik op <strong>"Test Directe API"</strong>. HighFlow ondersteunt automatisch zowel de UGC API als de 2024 Versioned REST API.
                  </p>
                </div>
              </div>
            </div>

            <!-- Direct Share Tab -->
            <div id="guide-tab-direct" class="guide-tab-pane" style="display: none;">
              <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <strong style="color: #fbbf24;">Geen enkele setup vereist (Nu direct live posten):</strong>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-secondary);">
                  Wil je vandaag meteen je eerste post live zetten zonder webhooks of API keys? Gebruik de 1-klik deelknop!
                </p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px; line-height: 1.6;">
                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>1. Klik op "Genereer Post"</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    Kies voor <strong>StudyElite.nl</strong> of <strong>AgevoDev.nl</strong>. AI genereert direct een professionele, converterende post met sterke hook en hashtags.
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>2. Klik op "🔗 Direct Delen op LinkedIn (1-Klik)"</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    HighFlow kopieert direct de volledige tekst naar je klembord en opent automatisch de LinkedIn feed in een nieuw tabblad.
                  </p>
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px;">
                  <strong>3. Druk Ctrl+V (plakken) & Plaatsen</strong>
                  <p style="margin: 4px 0 0 0; color: var(--text-secondary);">
                    In het geopende LinkedIn venster druk je simpelweg op <code>Ctrl+V</code> en klik je op "Plaatsen". Binnen 3 seconden staat je post online!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer" style="display: flex; justify-content: flex-end;">
            <button class="btn btn-primary" onclick="document.getElementById('linkedin-guide-modal').remove()">Begrepen</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('linkedin-guide-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Guide Tab switching
    const modal = document.getElementById('linkedin-guide-modal');
    modal?.querySelectorAll('.guide-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.guide-tab-btn').forEach(b => {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-outline');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-outline');

        const target = btn.dataset.guide;
        modal.querySelectorAll('.guide-tab-pane').forEach(p => p.style.display = 'none');
        const targetPane = modal.querySelector(`#guide-tab-${target}`);
        if (targetPane) targetPane.style.display = 'block';
      });
    });
  }

  // ==========================================
  // VISUAL WORKFLOW CANVAS BUILDER
  // ==========================================
  openBuilder(workflowId) {
    const wf = window.crmState.getAutomation(workflowId);
    if (!wf) return;
    this.currentWorkflow = JSON.parse(JSON.stringify(wf)); // Deep copy for editing
    this.zoomLevel = 1;
    this.render();
  }

  closeBuilder() {
    this.currentWorkflow = null;
    this.render();
  }

  renderBuilder(container) {
    const wf = this.currentWorkflow;
    const isActive = wf.status === 'active';

    container.innerHTML = `
      <div class="builder-view">
        <!-- Builder Top Bar -->
        <div class="builder-navbar">
          <div class="builder-nav-left">
            <button class="btn btn-secondary btn-sm" id="btn-back-to-list">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Terug
            </button>
            <div class="wf-title-group">
              <input type="text" id="builder-wf-name" class="wf-name-input" value="${wf.name}" title="Klik om naam te wijzigen">
              <span class="badge ${isActive ? 'badge-success' : 'badge-neutral'}">${isActive ? 'Actief' : 'Concept'}</span>
            </div>
          </div>

          <div class="builder-nav-actions">
            <div class="zoom-controls">
              <button class="icon-btn-sm" id="btn-zoom-out" title="Uitzoomen">−</button>
              <span class="zoom-percent" id="zoom-text">${Math.round(this.zoomLevel * 100)}%</span>
              <button class="icon-btn-sm" id="btn-zoom-in" title="Inzoomen">+</button>
              <button class="icon-btn-sm" id="btn-zoom-reset" title="Centreren">⟲</button>
            </div>

            <button class="btn btn-secondary" id="btn-run-simulation">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Test Run Simulator
            </button>

            <button class="btn btn-primary" id="btn-save-workflow">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Opslaan & Publiceren
            </button>
          </div>
        </div>

        <!-- Visual Canvas -->
        <div class="builder-canvas-wrapper" id="canvas-wrapper">
          <div class="builder-canvas" id="builder-canvas" style="transform: scale(${this.zoomLevel})">
            <!-- Trigger Node -->
            <div class="workflow-tree">
              ${this.renderTriggerNode(wf.trigger)}

              <!-- Connector Line -->
              <div class="canvas-connector">
                <div class="connector-line"></div>
                <button class="btn-add-step-inline" data-index="0" title="Stap hier tussenvoegen">+</button>
              </div>

              <!-- Steps List -->
              ${this.renderWorkflowSteps(wf.steps)}

              <!-- End Node -->
              <div class="canvas-connector">
                <div class="connector-line"></div>
              </div>
              <div class="end-node">
                <div class="end-dot"></div>
                <span>Einde Workflow</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Node Inspector Drawer (Slide-over) -->
        <div class="inspector-drawer" id="node-inspector">
          <div class="drawer-header">
            <h3 id="inspector-title">Stap Configureren</h3>
            <button class="icon-btn" id="btn-close-inspector">&times;</button>
          </div>
          <div class="drawer-body" id="inspector-body">
            <!-- Injected dynamically -->
          </div>
          <div class="drawer-footer">
            <button class="btn btn-secondary" id="btn-cancel-inspect">Annuleren</button>
            <button class="btn btn-primary" id="btn-save-inspect">Wijziging Toepassen</button>
          </div>
        </div>

        <!-- Action Catalog Modal -->
        <div class="modal-backdrop" id="catalog-modal">
          <div class="catalog-modal-content">
            <div class="modal-header">
              <h2>Voeg Nieuwe Stap Toe</h2>
              <button class="icon-btn" id="btn-close-catalog">&times;</button>
            </div>
            <div class="catalog-search-wrapper">
              <input type="text" id="catalog-search" class="input-search" placeholder="Zoek op actie of trigger (bijv. SMS, E-mail, Delay)...">
            </div>
            <div class="catalog-categories" id="catalog-body">
              <!-- Rendered categories -->
            </div>
          </div>
        </div>

        <!-- Simulator Modal -->
        <div class="modal-backdrop" id="simulator-modal">
          <div class="simulator-modal-content">
            <div class="modal-header">
              <div class="sim-header-title">
                <svg class="icon text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                <h2>Live Workflow Simulator</h2>
              </div>
              <button class="icon-btn" id="btn-close-sim">&times;</button>
            </div>
            <div class="simulator-body">
              <div class="sim-controls">
                <div class="form-group">
                  <label>Selecteer Testcontact:</label>
                  <select id="sim-contact-select" class="form-control">
                    ${window.crmState.getContacts().map(c => `
                      <option value="${c.id}">${c.name} (${c.company || 'Geen bedrijf'}) - ${c.email}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="sim-run-actions">
                  <button class="btn btn-primary" id="btn-start-simulation">
                    <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Start Simulatie
                  </button>
                </div>
              </div>

              <div class="sim-logs-wrapper">
                <h4>Simulatie Uitvoeringslogboek:</h4>
                <div class="sim-console" id="sim-console">
                  <div class="console-placeholder">Druk op 'Start Simulatie' om de workflow stap voor stap te testen.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindBuilderEvents(container);
  }

  renderTriggerNode(trigger) {
    return `
      <div class="canvas-node node-trigger" id="node-trigger">
        <div class="node-header">
          <div class="node-icon-box icon-trigger">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          </div>
          <div class="node-title-box">
            <span class="node-type-label">TRIGGER</span>
            <h4 class="node-title">${trigger?.title || 'Selecteer Trigger'}</h4>
          </div>
          <button class="icon-btn-sm btn-edit-trigger" title="Trigger aanpassen">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
        </div>
        <div class="node-content">
          ${trigger?.config?.formName ? `Formulier: <code>${trigger.config.formName}</code>` : ''}
          ${trigger?.config?.calendar ? `Kalender: <code>${trigger.config.calendar}</code>` : ''}
          ${trigger?.config?.targetStage ? `Doelfase: <code>${trigger.config.targetStage}</code>` : ''}
        </div>
      </div>
    `;
  }

  renderWorkflowSteps(steps = []) {
    return steps.map((step, idx) => {
      const isCondition = step.type === 'condition';
      const nodeIcon = this.getNodeIcon(step.type);
      const nodeColorClass = this.getNodeColorClass(step.type);

      if (isCondition) {
        return `
          <div class="canvas-node node-condition" id="node-${step.id}" data-id="${step.id}" data-index="${idx}">
            <div class="node-header">
              <div class="node-icon-box icon-condition">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 2 18 2 18 6 6 6 6 2"></polygon><rect x="3" y="6" width="18" height="12" rx="2"></rect><line x1="12" y1="18" x2="12" y2="22"></line></svg>
              </div>
              <div class="node-title-box">
                <span class="node-type-label">VOORWAARDE / IF-ELSE</span>
                <h4 class="node-title">${step.title}</h4>
              </div>
              <div class="node-actions-box">
                <button class="icon-btn-sm btn-edit-node" data-id="${step.id}">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="icon-btn-sm btn-delete-node" data-id="${step.id}" title="Verwijderen">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div class="node-content">
              <span>Veld: <code>${step.config?.field || 'status'}</code> ${step.config?.operator || 'is'} <code>${step.config?.value || 'ja'}</code></span>
            </div>

            <!-- Branches -->
            <div class="condition-branches">
              <div class="branch branch-yes">
                <div class="branch-label branch-label-yes">JA (Voldoet)</div>
                <div class="branch-connector"></div>
                <div class="branch-steps">
                  ${(step.yesSteps || []).map(ys => this.renderSubNode(ys, step.id, 'yes')).join('')}
                  <button class="btn-add-substep" data-parent="${step.id}" data-branch="yes">+ Actie toevoegen</button>
                </div>
              </div>
              <div class="branch branch-no">
                <div class="branch-label branch-label-no">NEE (Voldoet niet)</div>
                <div class="branch-connector"></div>
                <div class="branch-steps">
                  ${(step.noSteps || []).map(ns => this.renderSubNode(ns, step.id, 'no')).join('')}
                  <button class="btn-add-substep" data-parent="${step.id}" data-branch="no">+ Actie toevoegen</button>
                </div>
              </div>
            </div>
          </div>

          <div class="canvas-connector">
            <div class="connector-line"></div>
            <button class="btn-add-step-inline" data-index="${idx + 1}" title="Stap hier tussenvoegen">+</button>
          </div>
        `;
      }

      return `
        <div class="canvas-node ${nodeColorClass}" id="node-${step.id}" data-id="${step.id}" data-index="${idx}">
          <div class="node-header">
            <div class="node-icon-box">
              ${nodeIcon}
            </div>
            <div class="node-title-box">
              <span class="node-type-label">${this.getNodeTypeLabel(step.type)}</span>
              <h4 class="node-title">${step.title}</h4>
            </div>
            <div class="node-actions-box">
              <button class="icon-btn-sm btn-edit-node" data-id="${step.id}" title="Bewerken">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              </button>
              <button class="icon-btn-sm btn-delete-node" data-id="${step.id}" title="Verwijderen">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
          <div class="node-content">
            ${this.renderNodeContentSummary(step)}
          </div>
        </div>

        <div class="canvas-connector">
          <div class="connector-line"></div>
          <button class="btn-add-step-inline" data-index="${idx + 1}" title="Stap hier tussenvoegen">+</button>
        </div>
      `;
    }).join('');
  }

  renderSubNode(step, parentId, branch) {
    const nodeIcon = this.getNodeIcon(step.type);
    return `
      <div class="canvas-subnode" id="node-${step.id}" data-id="${step.id}" data-parent="${parentId}" data-branch="${branch}">
        <div class="subnode-header">
          <div class="subnode-icon">${nodeIcon}</div>
          <div class="subnode-title">${step.title}</div>
          <button class="icon-btn-xs btn-delete-subnode" data-id="${step.id}" data-parent="${parentId}" data-branch="${branch}">&times;</button>
        </div>
        <div class="subnode-summary">${this.renderNodeContentSummary(step)}</div>
      </div>
    `;
  }

  renderNodeContentSummary(step) {
    switch (step.type) {
      case 'send_sms':
        return `<span class="summary-text">SMS: <em>"${step.config?.message || ''}"</em></span>`;
      case 'send_email':
        return `<span class="summary-text">Onderwerp: <strong>${step.config?.subject || ''}</strong></span>`;
      case 'wait_delay':
        return `<span class="summary-text">Wachttijd: <strong>${step.config?.duration} ${step.config?.unit || 'minuten'}</strong></span>`;
      case 'add_tag':
        return `<span class="badge badge-primary">🏷️ ${step.config?.tag || 'Tag'}</span>`;
      case 'create_deal':
        return `<span class="summary-text">Deal aanmaken in fase: <strong>${step.config?.pipelineStage}</strong> (€ ${step.config?.value || 0})</span>`;
      case 'create_task':
        return `<span class="summary-text">Taak: <strong>${step.config?.taskTitle || ''}</strong> (Toewijzen aan: ${step.config?.assignee})</span>`;
      case 'send_webhook':
        return `<span class="summary-text">Webhook POST: <code>${step.config?.endpoint}</code></span>`;
      case 'ai_generate_linkedin':
        return `<span class="summary-text">AI Focus: <strong>StudyElite.nl & AgevoDev.nl</strong> (Rotatie & Hashtags)</span>`;
      case 'publish_linkedin':
        return `<span class="summary-text">Kanaal: <strong>LinkedIn API</strong> (Openbaar gepubliceerd)</span>`;
      default:
        return `<span class="summary-text">Geconfigureerd</span>`;
    }
  }

  getNodeTypeLabel(type) {
    const map = {
      send_sms: 'SMS BERICHT',
      send_email: 'E-MAIL BERICHT',
      wait_delay: 'WACHTTIJD',
      add_tag: 'TAG TOEVOEGEN',
      create_deal: 'PIPELINE DEAL',
      create_task: 'INTERNE TAAK',
      send_webhook: 'WEBHOOK POST',
      condition: 'VOORWAARDE',
      ai_generate_linkedin: 'AI CONTENT GENERATOR',
      publish_linkedin: 'LINKEDIN PUBLISHER'
    };
    return map[type] || 'ACTIE';
  }

  getNodeColorClass(type) {
    const map = {
      send_sms: 'node-sms',
      send_email: 'node-email',
      wait_delay: 'node-wait',
      add_tag: 'node-tag',
      create_deal: 'node-deal',
      create_task: 'node-task',
      send_webhook: 'node-webhook',
      condition: 'node-condition',
      ai_generate_linkedin: 'node-ai',
      publish_linkedin: 'node-linkedin'
    };
    return map[type] || 'node-default';
  }

  getNodeIcon(type) {
    switch (type) {
      case 'ai_generate_linkedin':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>`;
      case 'publish_linkedin':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>`;
      case 'send_sms':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
      case 'send_email':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
      case 'wait_delay':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
      case 'add_tag':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`;
      case 'create_deal':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
      case 'create_task':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
      case 'send_webhook':
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
      default:
        return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
    }
  }

  // Bind all interactive events inside the visual builder
  bindBuilderEvents(container) {
    // Back button
    container.querySelector('#btn-back-to-list')?.addEventListener('click', () => {
      this.closeBuilder();
    });

    // Workflow name editing
    const nameInput = container.querySelector('#builder-wf-name');
    if (nameInput) {
      nameInput.addEventListener('change', (e) => {
        this.currentWorkflow.name = e.target.value;
      });
    }

    // Zoom buttons
    container.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
      this.zoomLevel = Math.min(this.zoomLevel + 0.15, 1.6);
      this.updateZoom();
    });
    container.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
      this.zoomLevel = Math.max(this.zoomLevel - 0.15, 0.6);
      this.updateZoom();
    });
    container.querySelector('#btn-zoom-reset')?.addEventListener('click', () => {
      this.zoomLevel = 1;
      this.updateZoom();
    });

    // Save button
    container.querySelector('#btn-save-workflow')?.addEventListener('click', () => {
      window.crmState.saveAutomation(this.currentWorkflow);
      window.highflowApp?.showToast('Workflow succesvol opgeslagen!', 'success');
      this.closeBuilder();
    });

    // Open Step Catalog on "+" buttons
    container.querySelectorAll('.btn-add-step-inline').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.dataset.index, 10);
        this.openActionCatalog(index);
      });
    });

    // Open Substep add
    container.querySelectorAll('.btn-add-substep').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const parentId = btn.dataset.parent;
        const branch = btn.dataset.branch;
        this.openActionCatalogForBranch(parentId, branch);
      });
    });

    // Edit Node
    container.querySelectorAll('.btn-edit-node').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openInspector(btn.dataset.id);
      });
    });

    // Edit Trigger
    container.querySelector('.btn-edit-trigger')?.addEventListener('click', () => {
      this.openTriggerInspector();
    });

    // Delete Node
    container.querySelectorAll('.btn-delete-node').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.currentWorkflow.steps = this.currentWorkflow.steps.filter(s => s.id !== id);
        this.renderBuilder(container);
      });
    });

    // Delete Subnode
    container.querySelectorAll('.btn-delete-subnode').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { id, parent, branch } = btn.dataset;
        const parentNode = this.currentWorkflow.steps.find(s => s.id === parent);
        if (parentNode) {
          if (branch === 'yes') parentNode.yesSteps = (parentNode.yesSteps || []).filter(s => s.id !== id);
          if (branch === 'no') parentNode.noSteps = (parentNode.noSteps || []).filter(s => s.id !== id);
          this.renderBuilder(container);
        }
      });
    });

    // Click on node card directly to inspect
    container.querySelectorAll('.canvas-node').forEach(node => {
      node.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        if (node.dataset.id) {
          this.openInspector(node.dataset.id);
        } else if (node.id === 'node-trigger') {
          this.openTriggerInspector();
        }
      });
    });

    // Catalog modal close
    container.querySelector('#btn-close-catalog')?.addEventListener('click', () => {
      this.closeCatalogModal();
    });

    // Inspector close
    container.querySelector('#btn-close-inspector')?.addEventListener('click', () => {
      this.closeInspector();
    });
    container.querySelector('#btn-cancel-inspect')?.addEventListener('click', () => {
      this.closeInspector();
    });

    // Simulator events
    container.querySelector('#btn-run-simulation')?.addEventListener('click', () => {
      this.openSimulatorModal();
    });
    container.querySelector('#btn-close-sim')?.addEventListener('click', () => {
      this.closeSimulatorModal();
    });
    container.querySelector('#btn-start-simulation')?.addEventListener('click', () => {
      this.runLiveSimulation();
    });
  }

  updateZoom() {
    const canvas = document.getElementById('builder-canvas');
    const text = document.getElementById('zoom-text');
    if (canvas) canvas.style.transform = `scale(${this.zoomLevel})`;
    if (text) text.textContent = `${Math.round(this.zoomLevel * 100)}%`;
  }

  // ==========================================
  // ACTION CATALOG & SELECTION
  // ==========================================
  openActionCatalog(insertIndex, branchInfo = null) {
    this.targetInsertIndex = insertIndex;
    this.targetBranchInfo = branchInfo;

    const modal = document.getElementById('catalog-modal');
    const catalogBody = document.getElementById('catalog-body');
    if (!modal || !catalogBody) return;

    const categories = [
      {
        title: 'Communicatie & Berichten',
        actions: [
          { type: 'send_sms', title: 'Stuur SMS Bericht', desc: 'Verzend een geautomatiseerd SMS tekstbericht.', icon: 'message-square' },
          { type: 'send_email', title: 'Stuur E-mail', desc: 'Verstuur een e-mail met dynamische tags.', icon: 'mail' },
          { type: 'create_task', title: 'Interne Teak / Notificatie', desc: 'Wijs een taak toe aan een teamlid.', icon: 'check-square' }
        ]
      },
      {
        title: 'CRM & Contacten',
        actions: [
          { type: 'add_tag', title: 'Tag Toevoegen', desc: 'Voeg een label toe aan het contact.', icon: 'tag' },
          { type: 'create_deal', title: 'Pipeline Deal Aanmaken', desc: 'Maak direct een deal in de gewenste fase.', icon: 'dollar-sign' }
        ]
      },
      {
        title: 'Timing & Logica',
        actions: [
          { type: 'wait_delay', title: 'Wachttijd (Delay)', desc: 'Wacht een specifiek aantal minuten, uren of dagen.', icon: 'clock' },
          { type: 'condition', title: 'Voorwaarde (If/Else Branch)', desc: 'Splits de flow op basis van tags of dealstatus.', icon: 'git-branch' },
          { type: 'send_webhook', title: 'Webhook Versturen', desc: 'POST data naar een extern systeem of Zapier/Make.', icon: 'send' }
        ]
      }
    ];

    catalogBody.innerHTML = categories.map(cat => `
      <div class="catalog-category-group">
        <h4 class="cat-group-title">${cat.title}</h4>
        <div class="cat-items-grid">
          ${cat.actions.map(act => `
            <div class="cat-item-card" data-type="${act.type}" data-title="${act.title}">
              <div class="cat-item-icon">${this.getNodeIcon(act.type)}</div>
              <div class="cat-item-info">
                <h5>${act.title}</h5>
                <p>${act.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Catalog search
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.value = '';
      searchInput.oninput = (e) => {
        const q = e.target.value.toLowerCase();
        modal.querySelectorAll('.cat-item-card').forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(q) ? 'flex' : 'none';
        });
      };
    }

    // Select action
    catalogBody.querySelectorAll('.cat-item-card').forEach(card => {
      card.addEventListener('click', () => {
        this.insertNewAction(card.dataset.type, card.dataset.title);
      });
    });

    modal.classList.add('active');
  }

  openActionCatalogForBranch(parentId, branch) {
    this.openActionCatalog(null, { parentId, branch });
  }

  closeCatalogModal() {
    document.getElementById('catalog-modal')?.classList.remove('active');
  }

  insertNewAction(type, title) {
    const newStep = {
      id: 's_' + Date.now(),
      type,
      title,
      config: this.getDefaultConfigForType(type)
    };

    if (type === 'condition') {
      newStep.yesSteps = [];
      newStep.noSteps = [];
    }

    if (this.targetBranchInfo) {
      const parentNode = this.currentWorkflow.steps.find(s => s.id === this.targetBranchInfo.parentId);
      if (parentNode) {
        if (this.targetBranchInfo.branch === 'yes') {
          parentNode.yesSteps = parentNode.yesSteps || [];
          parentNode.yesSteps.push(newStep);
        } else {
          parentNode.noSteps = parentNode.noSteps || [];
          parentNode.noSteps.push(newStep);
        }
      }
    } else {
      if (!this.currentWorkflow.steps) this.currentWorkflow.steps = [];
      const idx = this.targetInsertIndex ?? this.currentWorkflow.steps.length;
      this.currentWorkflow.steps.splice(idx, 0, newStep);
    }

    this.closeCatalogModal();
    this.renderBuilder(document.getElementById('automations-view'));
    // Immediately open inspector for the newly added step
    this.openInspector(newStep.id);
  }

  getDefaultConfigForType(type) {
    switch (type) {
      case 'send_sms':
        return { message: 'Hoi {{contact.name}}, bedankt voor je interesse!' };
      case 'send_email':
        return { subject: 'Update van HighFlow CRM', body: 'Beste {{contact.name}},\n\nHierbij de gevraagde informatie.' };
      case 'wait_delay':
        return { duration: 1, unit: 'days' };
      case 'add_tag':
        return { tag: 'Opgevolgd' };
      case 'create_deal':
        return { pipelineStage: 'new', title: 'Deal voor {{contact.name}}', value: 2500 };
      case 'create_task':
        return { taskTitle: 'Follow-up bellen', assignee: 'Bram Verhoeff', dueDays: 1 };
      case 'send_webhook':
        return { endpoint: 'https://webhook.site/test-highflow' };
      case 'condition':
        return { field: 'stage', operator: 'equals', value: 'won' };
      default:
        return {};
    }
  }

  // ==========================================
  // NODE INSPECTOR
  // ==========================================
  openInspector(stepId) {
    let step = this.currentWorkflow.steps.find(s => s.id === stepId);
    if (!step) {
      // Check branches
      for (const s of this.currentWorkflow.steps) {
        if (s.yesSteps) {
          const found = s.yesSteps.find(ys => ys.id === stepId);
          if (found) { step = found; break; }
        }
        if (s.noSteps) {
          const found = s.noSteps.find(ns => ns.id === stepId);
          if (found) { step = found; break; }
        }
      }
    }
    if (!step) return;

    this.selectedNodeId = stepId;
    const drawer = document.getElementById('node-inspector');
    const titleEl = document.getElementById('inspector-title');
    const bodyEl = document.getElementById('inspector-body');
    if (!drawer || !bodyEl) return;

    titleEl.textContent = `Configureer: ${step.title}`;
    bodyEl.innerHTML = `
      <div class="form-group">
        <label>Stap Titel:</label>
        <input type="text" id="inspect-title" class="form-control" value="${step.title}">
      </div>
      ${this.renderInspectorFields(step)}
    `;

    // Save button inside drawer
    const saveBtn = document.getElementById('btn-save-inspect');
    if (saveBtn) {
      saveBtn.onclick = () => {
        this.saveInspectorChanges(step);
      };
    }

    drawer.classList.add('active');
  }

  openTriggerInspector() {
    const trigger = this.currentWorkflow.trigger;
    const drawer = document.getElementById('node-inspector');
    const titleEl = document.getElementById('inspector-title');
    const bodyEl = document.getElementById('inspector-body');
    if (!drawer || !bodyEl) return;

    titleEl.textContent = 'Configureer Trigger';
    bodyEl.innerHTML = `
      <div class="form-group">
        <label>Trigger Type:</label>
        <select id="inspect-trigger-type" class="form-control">
          <option value="form_submitted" ${trigger?.type === 'form_submitted' ? 'selected' : ''}>Formulier Ingevuld (Lead Gen)</option>
          <option value="appointment_booked" ${trigger?.type === 'appointment_booked' ? 'selected' : ''}>Afspraak Geboekt in Kalender</option>
          <option value="pipeline_stage_changed" ${trigger?.type === 'pipeline_stage_changed' ? 'selected' : ''}>Pipeline Fase Gewijzigd</option>
          <option value="contact_created" ${trigger?.type === 'contact_created' ? 'selected' : ''}>Nieuw Contact Aangemaakt</option>
        </select>
      </div>
      <div class="form-group">
        <label>Trigger Titel:</label>
        <input type="text" id="inspect-trigger-title" class="form-control" value="${trigger?.title || 'Formulier Ingevuld'}">
      </div>
      <div class="form-group" id="trigger-extra-field">
        <label>Formuliernaam / Doelfase:</label>
        <input type="text" id="inspect-trigger-extra" class="form-control" value="${trigger?.config?.formName || trigger?.config?.targetStage || 'Website Contactformulier'}">
      </div>
    `;

    const saveBtn = document.getElementById('btn-save-inspect');
    if (saveBtn) {
      saveBtn.onclick = () => {
        const type = document.getElementById('inspect-trigger-type').value;
        const title = document.getElementById('inspect-trigger-title').value;
        const extra = document.getElementById('inspect-trigger-extra').value;

        this.currentWorkflow.trigger = {
          id: 't_' + Date.now(),
          type,
          title,
          config: { formName: extra, targetStage: extra }
        };
        this.closeInspector();
        this.renderBuilder(document.getElementById('automations-view'));
      };
    }

    drawer.classList.add('active');
  }

  renderInspectorFields(step) {
    const config = step.config || {};
    switch (step.type) {
      case 'send_sms':
        return `
          <div class="form-group">
            <label>SMS Bericht Tekst:</label>
            <div class="tag-helper-bar">
              <span class="tag-chip" onclick="document.getElementById('inspect-sms-text').value += ' {{contact.name}}'">+ Naam</span>
              <span class="tag-chip" onclick="document.getElementById('inspect-sms-text').value += ' {{contact.company}}'">+ Bedrijf</span>
              <span class="tag-chip" onclick="document.getElementById('inspect-sms-text').value += ' {{contact.phone}}'">+ Telefoon</span>
            </div>
            <textarea id="inspect-sms-text" class="form-control" rows="4">${config.message || ''}</textarea>
            <small class="text-muted">Ondersteunt GoHighLevel merge-tags zoals {{contact.name}}</small>
          </div>
        `;
      case 'send_email':
        return `
          <div class="form-group">
            <label>Onderwerp:</label>
            <input type="text" id="inspect-email-subject" class="form-control" value="${config.subject || ''}">
          </div>
          <div class="form-group">
            <label>E-mail Inhoud:</label>
            <textarea id="inspect-email-body" class="form-control" rows="6">${config.body || ''}</textarea>
          </div>
        `;
      case 'wait_delay':
        return `
          <div class="form-row">
            <div class="form-group col-6">
              <label>Duur:</label>
              <input type="number" id="inspect-delay-duration" class="form-control" value="${config.duration || 1}">
            </div>
            <div class="form-group col-6">
              <label>Eenheid:</label>
              <select id="inspect-delay-unit" class="form-control">
                <option value="minutes" ${config.unit === 'minutes' ? 'selected' : ''}>Minuten</option>
                <option value="hours" ${config.unit === 'hours' ? 'selected' : ''}>Uren</option>
                <option value="days" ${config.unit === 'days' ? 'selected' : ''}>Dagen</option>
              </select>
            </div>
          </div>
        `;
      case 'add_tag':
        return `
          <div class="form-group">
            <label>Tag Naam:</label>
            <input type="text" id="inspect-tag-name" class="form-control" value="${config.tag || ''}" placeholder="Bijv. Hot Lead, VIP, Demo">
          </div>
        `;
      case 'create_deal':
        const stages = window.crmState.getStages();
        return `
          <div class="form-group">
            <label>Pipeline Fase:</label>
            <select id="inspect-deal-stage" class="form-control">
              ${stages.map(s => `
                <option value="${s.id}" ${config.pipelineStage === s.id ? 'selected' : ''}>${s.title}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Deal Waarde (€):</label>
            <input type="number" id="inspect-deal-value" class="form-control" value="${config.value || 1000}">
          </div>
        `;
      case 'create_task':
        return `
          <div class="form-group">
            <label>Taak Omschrijving:</label>
            <input type="text" id="inspect-task-title" class="form-control" value="${config.taskTitle || ''}">
          </div>
          <div class="form-group">
            <label>Toewijzen aan Medewerker:</label>
            <input type="text" id="inspect-task-assignee" class="form-control" value="${config.assignee || 'Bram Verhoeff'}">
          </div>
        `;
      case 'send_webhook':
        return `
          <div class="form-group">
            <label>Webhook URL (POST):</label>
            <input type="url" id="inspect-webhook-url" class="form-control" value="${config.endpoint || 'https://api.example.com/webhook'}">
          </div>
        `;
      case 'condition':
        return `
          <div class="form-group">
            <label>Controleer Contactveld:</label>
            <select id="inspect-cond-field" class="form-control">
              <option value="stage" ${config.field === 'stage' ? 'selected' : ''}>Pipeline Fase</option>
              <option value="tags" ${config.field === 'tags' ? 'selected' : ''}>Heeft Tag</option>
              <option value="value" ${config.field === 'value' ? 'selected' : ''}>Deal Waarde</option>
            </select>
          </div>
          <div class="form-group">
            <label>Moet gelijk zijn aan:</label>
            <input type="text" id="inspect-cond-value" class="form-control" value="${config.value || 'demo'}">
          </div>
        `;
      default:
        return `<p class="text-muted">Geen extra parameters voor deze stap.</p>`;
    }
  }

  saveInspectorChanges(step) {
    const titleInput = document.getElementById('inspect-title');
    if (titleInput) step.title = titleInput.value;

    switch (step.type) {
      case 'send_sms':
        step.config.message = document.getElementById('inspect-sms-text')?.value || '';
        break;
      case 'send_email':
        step.config.subject = document.getElementById('inspect-email-subject')?.value || '';
        step.config.body = document.getElementById('inspect-email-body')?.value || '';
        break;
      case 'wait_delay':
        step.config.duration = parseInt(document.getElementById('inspect-delay-duration')?.value, 10) || 1;
        step.config.unit = document.getElementById('inspect-delay-unit')?.value || 'days';
        break;
      case 'add_tag':
        step.config.tag = document.getElementById('inspect-tag-name')?.value || '';
        break;
      case 'create_deal':
        step.config.pipelineStage = document.getElementById('inspect-deal-stage')?.value || 'new';
        step.config.value = Number(document.getElementById('inspect-deal-value')?.value) || 0;
        break;
      case 'create_task':
        step.config.taskTitle = document.getElementById('inspect-task-title')?.value || '';
        step.config.assignee = document.getElementById('inspect-task-assignee')?.value || 'Bram';
        break;
      case 'send_webhook':
        step.config.endpoint = document.getElementById('inspect-webhook-url')?.value || '';
        break;
      case 'condition':
        step.config.field = document.getElementById('inspect-cond-field')?.value || 'stage';
        step.config.value = document.getElementById('inspect-cond-value')?.value || '';
        break;
    }

    this.closeInspector();
    this.renderBuilder(document.getElementById('automations-view'));
    window.highflowApp?.showToast('Stap bijgewerkt!', 'info');
  }

  closeInspector() {
    document.getElementById('node-inspector')?.classList.remove('active');
    this.selectedNodeId = null;
  }

  // ==========================================
  // LIVE WORKFLOW SIMULATOR
  // ==========================================
  openSimulatorModal() {
    const modal = document.getElementById('simulator-modal');
    if (!modal) return;
    modal.classList.add('active');
    const consoleEl = document.getElementById('sim-console');
    if (consoleEl) {
      consoleEl.innerHTML = `<div class="console-placeholder">Klaar voor uitvoering. Klik op 'Start Simulatie' om de workflow te doorlopen.</div>`;
    }
  }

  closeSimulatorModal() {
    document.getElementById('simulator-modal')?.classList.remove('active');
    // Clear glow classes
    document.querySelectorAll('.node-active-sim').forEach(el => el.classList.remove('node-active-sim'));
  }

  async runLiveSimulation() {
    if (this.simulating) return;
    this.simulating = true;

    const contactId = document.getElementById('sim-contact-select')?.value;
    const contact = window.crmState.getContact(contactId) || { name: 'Test Contact', email: 'test@example.com', phone: '+31612345678' };
    const consoleEl = document.getElementById('sim-console');
    const startBtn = document.getElementById('btn-start-simulation');

    if (startBtn) startBtn.disabled = true;
    if (consoleEl) consoleEl.innerHTML = '';

    const log = (msg, type = 'info') => {
      if (!consoleEl) return;
      const time = new Date().toLocaleTimeString();
      const div = document.createElement('div');
      div.className = `log-line log-${type}`;
      div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-text">${msg}</span>`;
      consoleEl.appendChild(div);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    };

    const delay = ms => new Promise(res => setTimeout(res, ms));

    log(`🚀 Simulatie gestart voor contact: <strong>${contact.name}</strong> (${contact.email})`, 'highlight');

    // 1. Trigger
    const triggerNode = document.getElementById('node-trigger');
    if (triggerNode) triggerNode.classList.add('node-active-sim');
    log(`⚡ TRIGGER GEACTIVEERD: "${this.currentWorkflow.trigger?.title}"`, 'success');
    await delay(1000);
    if (triggerNode) triggerNode.classList.remove('node-active-sim');

    // 2. Steps
    const steps = this.currentWorkflow.steps || [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nodeEl = document.getElementById(`node-${step.id}`);
      if (nodeEl) {
        nodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nodeEl.classList.add('node-active-sim');
      }

      log(`▶ STAP ${i + 1}: ${step.title}...`, 'info');
      await delay(1200);

      // Execute simulated action
      switch (step.type) {
        case 'send_sms':
          log(`  💬 SMS verstuurd naar ${contact.phone}: "${step.config?.message.replace('{{contact.name}}', contact.name)}"`, 'success');
          window.crmState.addContactActivity(contact.id, {
            type: 'sms',
            text: `[Automation Test] SMS verstuurd: "${step.config?.message}"`
          });
          break;

        case 'send_email':
          log(`  ✉️ E-mail afgeleverd bij ${contact.email} (Onderwerp: "${step.config?.subject}")`, 'success');
          window.crmState.addContactActivity(contact.id, {
            type: 'email',
            text: `[Automation Test] E-mail verstuurd: "${step.config?.subject}"`
          });
          break;

        case 'wait_delay':
          log(`  ⏳ Wachttijd gesimuleerd: ${step.config?.duration} ${step.config?.unit}`, 'warning');
          break;

        case 'add_tag':
          log(`  🏷️ Tag toegevoegd aan contact: [${step.config?.tag}]`, 'success');
          if (contact.tags && !contact.tags.includes(step.config?.tag)) {
            contact.tags.push(step.config?.tag);
            window.crmState.saveState();
          }
          break;

        case 'create_deal':
          log(`  📈 Deal aangemaakt in pipeline fase [${step.config?.pipelineStage}] t.w.v. € ${step.config?.value}`, 'success');
          window.crmState.addDeal({
            contactId: contact.id,
            title: `Deal via ${this.currentWorkflow.name}`,
            company: contact.company || contact.name,
            value: step.config?.value || 3000,
            stage: step.config?.pipelineStage || 'new'
          });
          break;

        case 'condition':
          log(`  🔀 Voorwaarde geëvalueerd: is ${step.config?.field} gelijk aan "${step.config?.value}"? -> JA (Voldoet)`, 'highlight');
          break;

        case 'create_task':
          log(`  📋 Interne taak toegewezen aan ${step.config?.assignee}: "${step.config?.taskTitle}"`, 'info');
          break;

        case 'send_webhook':
          log(`  🌐 Webhook payload verzonden naar ${step.config?.endpoint} (Status 200 OK)`, 'success');
          break;
      }

      await delay(600);
      if (nodeEl) nodeEl.classList.remove('node-active-sim');
    }

    log(`🎉 WORKFLOW SIMULATIE SUCCESVOL VOLTOOID!`, 'success');
    window.highflowApp?.showToast('Workflow simulatie geslaagd!', 'success');

    if (startBtn) startBtn.disabled = false;
    this.simulating = false;
  }

  // ==========================================
  // TEMPLATES & NEW WORKFLOW
  // ==========================================
  createNewWorkflow() {
    const newWf = {
      id: 'wf_' + Date.now(),
      name: 'Nieuwe Sales Automation',
      description: 'Beschrijf wat deze workflow automatiseert.',
      status: 'active',
      runs: 0,
      category: 'Lead Gen',
      trigger: {
        id: 't_init',
        type: 'form_submitted',
        title: 'Formulier Ingevuld: Nieuwe Lead',
        config: { formName: 'Algemeen Contactformulier' }
      },
      steps: [
        {
          id: 's_init1',
          type: 'send_sms',
          title: 'Directe Welkomst SMS',
          config: { message: 'Beste {{contact.name}}, we hebben je bericht ontvangen!' }
        },
        {
          id: 's_init2',
          type: 'add_tag',
          title: 'Tag Toevoegen: Nieuwe Lead',
          config: { tag: 'Nieuwe Lead' }
        }
      ]
    };
    window.crmState.saveAutomation(newWf);
    this.openBuilder(newWf.id);
  }

  openTemplateModal() {
    const templates = [
      {
        name: '🚀 Review Verzoek na Aankoop',
        cat: 'Sales',
        desc: 'Vraagt tevreden klanten automatisch om een Google review 3 dagen na het sluiten van een deal.',
        steps: ['Wacht 3 dagen', 'Stuur SMS met Review Link', 'Als Review Geplaatst -> Stuur Bedankje']
      },
      {
        name: '⚡ Snelle Reactie op Facebook Leads',
        cat: 'Lead Gen',
        desc: 'Binnen 60 seconden contact opnemen via WhatsApp en direct toewijzen aan accountmanager.',
        steps: ['Directe WhatsApp Message', 'Interne Taak: Bellen binnen 15 min', 'Pipeline Stage: Gecontacteerd']
      },
      {
        name: '💤 Slapende Leads Heractiveren',
        cat: 'Lead Gen',
        desc: 'Re-engageer leads waar al meer dan 30 dagen geen contact mee is geweest met een exclusief aanbod.',
        steps: ['Stuur E-mail: Exclusieve Korting', 'Wacht 48 uur', 'Stuur SMS Herinnering']
      }
    ];

    const modalHtml = `
      <div class="modal-backdrop active" id="templates-modal">
        <div class="templates-modal-content">
          <div class="modal-header">
            <h2>GoHighLevel Automation Templates</h2>
            <button class="icon-btn" onclick="document.getElementById('templates-modal').remove()">&times;</button>
          </div>
          <p class="modal-sub">Installeer met 1-klik beproefde automatiseringsflows voor jouw sales funnel.</p>
          <div class="templates-grid">
            ${templates.map(t => `
              <div class="template-card">
                <span class="badge badge-secondary">${t.cat}</span>
                <h4>${t.name}</h4>
                <p>${t.desc}</p>
                <div class="template-steps-preview">
                  ${t.steps.map(s => `<span>• ${s}</span>`).join('')}
                </div>
                <button class="btn btn-primary btn-sm btn-install-tpl" data-name="${t.name}">Installeer Template</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.querySelectorAll('.btn-install-tpl').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        this.installTemplate(name);
        document.getElementById('templates-modal')?.remove();
      });
    });
  }

  installTemplate(templateName) {
    const newWf = {
      id: 'wf_' + Date.now(),
      name: templateName,
      description: 'Geïnstalleerd vanuit GoHighLevel Template Bibliotheek.',
      status: 'active',
      runs: 0,
      category: 'Lead Gen',
      trigger: {
        id: 't_' + Date.now(),
        type: 'form_submitted',
        title: 'Geactiveerd via Trigger',
        config: { formName: 'Standaard Formulier' }
      },
      steps: [
        {
          id: 's_tpl_1',
          type: 'send_sms',
          title: 'Stuur Bericht',
          config: { message: 'Hoi {{contact.name}}, hier is je speciale aanbieding!' }
        },
        {
          id: 's_tpl_2',
          type: 'wait_delay',
          title: 'Wacht 2 Dagen',
          config: { duration: 2, unit: 'days' }
        },
        {
          id: 's_tpl_3',
          type: 'send_email',
          title: 'Follow-up E-mail',
          config: { subject: 'Heb je nog vragen?', body: 'Beste {{contact.name}}, laat het gerust weten als we kunnen helpen.' }
        }
      ]
    };

    window.crmState.saveAutomation(newWf);
    window.highflowApp?.showToast(`Template "${templateName}" succesvol toegevoegd!`, 'success');
    this.openBuilder(newWf.id);
  }
}

window.automationsEngine = new AutomationsEngine();

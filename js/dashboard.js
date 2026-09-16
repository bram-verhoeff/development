// HighFlow CRM - Dashboard & Analytics Overview

class DashboardModule {
  init() {
    this.render();
    window.crmState.subscribe('change', () => this.render());
  }

  render() {
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const contacts = window.crmState.getContacts();
    const deals = window.crmState.getDeals();
    const automations = window.crmState.getAutomations();
    const activities = window.crmState.getActivities();

    const totalPipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
    const wonDeals = deals.filter(d => d.stage === 'won');
    const wonRevenue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);
    const totalAutomationRuns = automations.reduce((s, a) => s + (a.runs || 0), 0);
    const winRate = deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Dashboard & KPI Overzicht</h1>
          <p class="view-subtitle">Live prestaties van je marketing- en salesautomations in één oogopslag.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-quick-new-contact">
            + Contact
          </button>
          <button class="btn btn-primary" id="btn-quick-new-wf">
            🚀 Nieuwe Workflow
          </button>
        </div>
      </div>

      <!-- Main KPI Stat Cards -->
      <div class="dashboard-stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Totale Pipeline Waarde</span>
            <div class="stat-icon-wrap bg-indigo">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <div class="stat-value">€ ${totalPipeline.toLocaleString()}</div>
          <div class="stat-change positive">
            <span>↑ 18.4%</span> vs vorige maand
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Gewonnen Omzet</span>
            <div class="stat-icon-wrap bg-emerald">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
          </div>
          <div class="stat-value">€ ${wonRevenue.toLocaleString()}</div>
          <div class="stat-change positive">
            <span>↑ 24.1%</span> conversie: ${winRate}%
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Actieve Contacten</span>
            <div class="stat-icon-wrap bg-sky">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            </div>
          </div>
          <div class="stat-value">${contacts.length}</div>
          <div class="stat-change neutral">
            <span>● 100%</span> lead opvolging
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Workflow Executies</span>
            <div class="stat-icon-wrap bg-amber">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            </div>
          </div>
          <div class="stat-value">${totalAutomationRuns}</div>
          <div class="stat-change positive">
            <span>⚡ ${automations.filter(a => a.status === 'active').length} actief</span> draait 24/7
          </div>
        </div>
      </div>

      <!-- Charts & Visual Section -->
      <div class="dashboard-grid-2">
        <!-- Sales Funnel Visualization -->
        <div class="dash-card">
          <div class="dash-card-header">
            <h3>Sales & Conversie Funnel</h3>
            <span class="badge badge-secondary">Real-time</span>
          </div>
          <p class="text-muted">Doorstroom van contacten per fase in de verkoopcyclus:</p>

          <div class="funnel-container">
            ${this.renderFunnelStep('Nieuwe Leads', deals.filter(d => d.stage === 'new').length, 100, '#6366f1')}
            ${this.renderFunnelStep('Gecontacteerd', deals.filter(d => d.stage === 'contacted').length, 80, '#0ea5e9')}
            ${this.renderFunnelStep('Demo Gepland', deals.filter(d => d.stage === 'demo').length, 60, '#f59e0b')}
            ${this.renderFunnelStep('Voorstel Verzonden', deals.filter(d => d.stage === 'proposal').length, 45, '#8b5cf6')}
            ${this.renderFunnelStep('Deal Gewonnen 🎉', deals.filter(d => d.stage === 'won').length, 30, '#10b981')}
          </div>
        </div>

        <!-- Lead Sources Breakdown -->
        <div class="dash-card">
          <div class="dash-card-header">
            <h3>Lead Bronnen & Attributie</h3>
            <span class="badge badge-secondary">Top Kanalen</span>
          </div>
          <p class="text-muted">Waar komen je waardevolste leads vandaan?</p>

          <div class="source-bars">
            <div class="source-item">
              <div class="source-header">
                <span>🌐 Website Formulieren & Funnels</span>
                <strong>45% (38 leads)</strong>
              </div>
              <div class="progress-bar-bg"><div class="progress-fill" style="width: 45%; background: #6366f1;"></div></div>
            </div>

            <div class="source-item">
              <div class="source-header">
                <span>💼 LinkedIn Inbound & Outreach</span>
                <strong>28% (24 leads)</strong>
              </div>
              <div class="progress-bar-bg"><div class="progress-fill" style="width: 28%; background: #0ea5e9;"></div></div>
            </div>

            <div class="source-item">
              <div class="source-header">
                <span>🎥 On-demand Webinar & Video Tours</span>
                <strong>18% (15 leads)</strong>
              </div>
              <div class="progress-bar-bg"><div class="progress-fill" style="width: 18%; background: #8b5cf6;"></div></div>
            </div>

            <div class="source-item">
              <div class="source-header">
                <span>⭐ Aanbevelingen / Direct Network</span>
                <strong>9% (8 leads)</strong>
              </div>
              <div class="progress-bar-bg"><div class="progress-fill" style="width: 9%; background: #10b981;"></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Live Activity Stream -->
      <div class="dash-card mt-4">
        <div class="dash-card-header">
          <h3>Real-time Activiteitenfeed</h3>
          <span class="badge badge-primary">Live Logs</span>
        </div>
        <div class="activity-feed-list">
          ${activities.slice(0, 6).map(act => `
            <div class="feed-item">
              <div class="feed-icon-box">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <div class="feed-content">
                <div class="feed-title-row">
                  <strong>${act.title}</strong>
                  <span class="feed-time">${act.time}</span>
                </div>
                <div class="feed-desc">${act.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind dashboard quick buttons
    container.querySelector('#btn-quick-new-contact')?.addEventListener('click', () => {
      window.highflowApp?.navigateTo('contacts');
      setTimeout(() => {
        document.getElementById('add-contact-modal')?.classList.add('active');
      }, 200);
    });

    container.querySelector('#btn-quick-new-wf')?.addEventListener('click', () => {
      window.highflowApp?.navigateTo('automations');
      setTimeout(() => {
        window.automationsEngine?.createNewWorkflow();
      }, 200);
    });
  }

  renderFunnelStep(name, count, percentWidth, color) {
    return `
      <div class="funnel-step-row">
        <div class="funnel-label-col">
          <span>${name}</span>
          <span class="funnel-count">${count} deals</span>
        </div>
        <div class="funnel-bar-wrapper">
          <div class="funnel-bar" style="width: ${percentWidth}%; background-color: ${color};"></div>
        </div>
      </div>
    `;
  }
}

window.dashboardModule = new DashboardModule();

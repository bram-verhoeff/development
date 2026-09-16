// HighFlow CRM - Sales Pipeline & Opportunities (Kanban Board)

class PipelineModule {
  constructor() {
    this.draggedDealId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.crmState.subscribe('deals_changed', () => this.render());
  }

  render() {
    const container = document.getElementById('pipeline-view');
    if (!container) return;

    const deals = window.crmState.getDeals();
    const stages = window.crmState.getStages();
    const contacts = window.crmState.getContacts();

    // Summary calculations
    const totalPipelineValue = deals
      .filter(d => d.stage !== 'lost')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const wonValue = deals
      .filter(d => d.stage === 'won')
      .reduce((sum, d) => sum + (d.value || 0), 0);

    const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100) : 0;

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Opportunities & Sales Pipeline</h1>
          <p class="view-subtitle">Versleep deals tussen fases. Verplaatsingen kunnen automatisch workflows activeren.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-add-deal-modal">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="12" y2="12"></line></svg>
            Nieuwe Opportunity
          </button>
        </div>
      </div>

      <!-- Pipeline Metrics Bar -->
      <div class="metrics-row">
        <div class="metric-card">
          <div class="metric-icon-box bg-indigo">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
          </div>
          <div class="metric-content">
            <span class="metric-label">Totale Pipeline Waarde</span>
            <span class="metric-value">€ ${totalPipelineValue.toLocaleString()}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-emerald">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="metric-content">
            <span class="metric-label">Gewonnen Omzet</span>
            <span class="metric-value">€ ${wonValue.toLocaleString()}</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-amber">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
          </div>
          <div class="metric-content">
            <span class="metric-label">Conversieratio</span>
            <span class="metric-value">${winRate}%</span>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon-box bg-sky">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div class="metric-content">
            <span class="metric-label">Actieve Deals</span>
            <span class="metric-value">${deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').length}</span>
          </div>
        </div>
      </div>

      <!-- Kanban Board Columns -->
      <div class="kanban-board" id="kanban-board">
        ${stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((s, d) => s + (d.value || 0), 0);

          return `
            <div class="kanban-column" data-stage="${stage.id}">
              <div class="column-header" style="border-top: 3px solid ${stage.color}">
                <div class="column-title-box">
                  <span class="column-title">${stage.title}</span>
                  <span class="column-count">${stageDeals.length}</span>
                </div>
                <div class="column-value">€ ${stageTotal.toLocaleString()}</div>
              </div>

              <div class="column-cards-container" data-stage="${stage.id}">
                ${stageDeals.map(deal => this.renderDealCard(deal)).join('')}
                ${stageDeals.length === 0 ? `
                  <div class="kanban-drop-placeholder">Sleep deals hierheen</div>
                ` : ''}
              </div>

              <button class="btn-add-deal-col" data-stage="${stage.id}">+ Deal Toevoegen</button>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Add Deal Modal -->
      <div class="modal-backdrop" id="add-deal-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nieuwe Deal Toevoegen</h2>
            <button class="icon-btn" id="btn-close-deal-modal">&times;</button>
          </div>
          <form id="form-new-deal" class="modal-body">
            <div class="form-group">
              <label>Deal Titel *</label>
              <input type="text" id="new-deal-title" class="form-control" required placeholder="bijv. Licentie Marketing Automation">
            </div>
            <div class="form-row">
              <div class="form-group col-6">
                <label>Gekoppeld Contact</label>
                <select id="new-deal-contact" class="form-control">
                  <option value="">-- Kies Contact --</option>
                  ${contacts.map(c => `<option value="${c.id}">${c.name} (${c.company || 'Geen bedrijf'})</option>`).join('')}
                </select>
              </div>
              <div class="form-group col-6">
                <label>Bedrijfsnaam</label>
                <input type="text" id="new-deal-company" class="form-control" placeholder="bijv. Van Dijk BV">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-6">
                <label>Waarde (€) *</label>
                <input type="number" id="new-deal-value" class="form-control" required placeholder="5000">
              </div>
              <div class="form-group col-6">
                <label>Start Fase</label>
                <select id="new-deal-stage" class="form-control">
                  ${stages.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-6">
                <label>Prioriteit</label>
                <select id="new-deal-priority" class="form-control">
                  <option value="high">Hoog (Urgent)</option>
                  <option value="medium" selected>Normaal</option>
                  <option value="low">Laag</option>
                </select>
              </div>
              <div class="form-group col-6">
                <label>Verwachte Sluitingsdatum</label>
                <input type="date" id="new-deal-close" class="form-control">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-deal">Annuleren</button>
              <button type="submit" class="btn btn-primary">Deal Aanmaken</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindKanbanEvents(container);
  }

  renderDealCard(deal) {
    const contact = window.crmState.getContact(deal.contactId);
    const priorityClass = `priority-${deal.priority || 'medium'}`;

    return `
      <div class="deal-card" draggable="true" data-id="${deal.id}">
        <div class="deal-card-header">
          <span class="deal-company">${deal.company || 'Geen bedrijf'}</span>
          <span class="badge ${priorityClass}">${deal.priority || 'normaal'}</span>
        </div>
        <h4 class="deal-title">${deal.title}</h4>
        
        <div class="deal-value-row">
          <span class="deal-value">€ ${(deal.value || 0).toLocaleString()}</span>
          ${deal.expectedClose ? `<span class="deal-date"><svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg> ${deal.expectedClose}</span>` : ''}
        </div>

        <div class="deal-card-footer">
          <div class="deal-contact">
            ${contact ? `
              <img src="${contact.avatar}" class="avatar-xs" alt="${contact.name}">
              <span class="contact-name-xs">${contact.name}</span>
            ` : `<span class="contact-name-xs text-muted">Geen contact gekoppeld</span>`}
          </div>
          <button class="icon-btn-xs btn-delete-deal" data-id="${deal.id}" title="Verwijderen">
            &times;
          </button>
        </div>
      </div>
    `;
  }

  bindKanbanEvents(container) {
    // Add Deal Modal trigger
    const modal = container.querySelector('#add-deal-modal');
    container.querySelector('#btn-add-deal-modal')?.addEventListener('click', () => {
      modal?.classList.add('active');
    });
    container.querySelector('#btn-close-deal-modal')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });
    container.querySelector('#btn-cancel-deal')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    // Per-column "+ Deal Toevoegen"
    container.querySelectorAll('.btn-add-deal-col').forEach(btn => {
      btn.addEventListener('click', () => {
        const stage = btn.dataset.stage;
        const stageSelect = document.getElementById('new-deal-stage');
        if (stageSelect) stageSelect.value = stage;
        modal?.classList.add('active');
      });
    });

    // Form submit
    container.querySelector('#form-new-deal')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const contactId = document.getElementById('new-deal-contact').value;
      const contact = window.crmState.getContact(contactId);

      const deal = {
        title: document.getElementById('new-deal-title').value,
        contactId: contactId || null,
        company: document.getElementById('new-deal-company').value || (contact ? contact.company : ''),
        value: Number(document.getElementById('new-deal-value').value) || 0,
        stage: document.getElementById('new-deal-stage').value,
        priority: document.getElementById('new-deal-priority').value,
        expectedClose: document.getElementById('new-deal-close').value
      };

      window.crmState.addDeal(deal);
      modal?.classList.remove('active');
      window.highflowApp?.showToast('Opportunity aangemaakt!', 'success');
      this.render();
    });

    // Delete deal
    container.querySelectorAll('.btn-delete-deal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Deal verwijderen?')) {
          window.crmState.deleteDeal(btn.dataset.id);
          window.highflowApp?.showToast('Deal verwijderd.', 'info');
        }
      });
    });

    // ==========================================
    // HTML5 DRAG & DROP
    // ==========================================
    const cards = container.querySelectorAll('.deal-card');
    const columns = container.querySelectorAll('.column-cards-container');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedDealId = card.dataset.id;
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.draggedDealId = null;
        document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
      });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.closest('.kanban-column')?.classList.add('drag-over');
      });

      col.addEventListener('dragleave', () => {
        col.closest('.kanban-column')?.classList.remove('drag-over');
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.closest('.kanban-column')?.classList.remove('drag-over');
        const dealId = e.dataTransfer.getData('text/plain') || this.draggedDealId;
        const targetStage = col.dataset.stage;

        if (dealId && targetStage) {
          window.crmState.updateDealStage(dealId, targetStage);
          window.highflowApp?.showToast(`Deal verplaatst naar fase "${targetStage}"!`, 'success');
          this.render();
        }
      });
    });
  }
}

window.pipelineModule = new PipelineModule();

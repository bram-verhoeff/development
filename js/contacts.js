// HighFlow CRM - Contacts & Customer Management

class ContactsModule {
  constructor() {
    this.searchQuery = '';
    this.selectedTag = 'all';
    this.selectedStage = 'all';
    this.activeContactId = null;
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.crmState.subscribe('contacts_changed', () => {
      this.render();
      if (this.activeContactId) {
        this.renderDrawer(this.activeContactId);
      }
    });
  }

  render() {
    const container = document.getElementById('contacts-view');
    if (!container) return;

    const contacts = window.crmState.getContacts();
    const stages = window.crmState.getStages();

    const badge = document.getElementById('contacts-count-badge');
    if (badge) badge.textContent = contacts.length;

    // Extract all unique tags
    const allTags = new Set();
    contacts.forEach(c => (c.tags || []).forEach(t => allTags.add(t)));

    // Filter contacts
    const filtered = contacts.filter(c => {
      const matchesSearch = !this.searchQuery ||
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        c.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.phone.includes(this.searchQuery);

      const matchesTag = this.selectedTag === 'all' || (c.tags && c.tags.includes(this.selectedTag));
      const matchesStage = this.selectedStage === 'all' || c.stage === this.selectedStage;

      return matchesSearch && matchesTag && matchesStage;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Contacten & Klanten (CRM)</h1>
          <p class="view-subtitle">Beheer leads, communicatiehistorie en automatische inschrijvingen in flows.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" id="btn-export-contacts">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Exporteer CSV
          </button>
          <button class="btn btn-primary" id="btn-add-contact">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nieuw Contact
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="search-input-wrapper">
          <svg class="icon search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="contact-search-input" class="input-search" placeholder="Zoek op naam, e-mail, bedrijf of telefoon..." value="${this.searchQuery}">
        </div>

        <div class="filter-controls">
          <select id="contact-stage-filter" class="form-control-sm">
            <option value="all">Alle Fases</option>
            ${stages.map(s => `<option value="${s.id}" ${this.selectedStage === s.id ? 'selected' : ''}>${s.title}</option>`).join('')}
          </select>

          <select id="contact-tag-filter" class="form-control-sm">
            <option value="all">Alle Labels / Tags</option>
            ${Array.from(allTags).map(t => `<option value="${t}" ${this.selectedTag === t ? 'selected' : ''}>🏷️ ${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- Contacts Table -->
      <div class="table-container">
        <table class="crm-table">
          <thead>
            <tr>
              <th width="40"><input type="checkbox" id="check-all-contacts"></th>
              <th>Contact & Bedrijf</th>
              <th>E-mail & Telefoon</th>
              <th>Labels</th>
              <th>Pipeline Fase</th>
              <th>Waarde</th>
              <th width="100">Acties</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.length === 0 ? `
              <tr>
                <td colspan="7" class="empty-state">
                  <div class="empty-state-content">
                    <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    <h4>Geen contacten gevonden</h4>
                    <p>Probeer een andere zoekterm of voeg een nieuw contact toe.</p>
                  </div>
                </td>
              </tr>
            ` : filtered.map(c => this.renderContactRow(c)).join('')}
          </tbody>
        </table>
      </div>

      <!-- Contact Drawer Container -->
      <div class="contact-drawer" id="contact-drawer"></div>

      <!-- Add Contact Modal -->
      <div class="modal-backdrop" id="add-contact-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nieuw Contact Toevoegen</h2>
            <button class="icon-btn" id="btn-close-add-modal">&times;</button>
          </div>
          <form id="form-new-contact" class="modal-body">
            <div class="form-row">
              <div class="form-group col-6">
                <label>Volledige Naam *</label>
                <input type="text" id="new-contact-name" class="form-control" required placeholder="bijv. Lisa Jansen">
              </div>
              <div class="form-group col-6">
                <label>Bedrijfsnaam</label>
                <input type="text" id="new-contact-company" class="form-control" placeholder="bijv. Jansen Media B.V.">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-6">
                <label>E-mailadres *</label>
                <input type="email" id="new-contact-email" class="form-control" required placeholder="lisa@jansen.nl">
              </div>
              <div class="form-group col-6">
                <label>Telefoonnummer</label>
                <input type="tel" id="new-contact-phone" class="form-control" placeholder="+31 6 1234 5678">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group col-6">
                <label>Pipeline Fase</label>
                <select id="new-contact-stage" class="form-control">
                  ${stages.map(s => `<option value="${s.id}">${s.title}</option>`).join('')}
                </select>
              </div>
              <div class="form-group col-6">
                <label>Geschatte Waarde (€)</label>
                <input type="number" id="new-contact-value" class="form-control" placeholder="3500">
              </div>
            </div>
            <div class="form-group">
              <label>Labels (door komma gescheiden)</label>
              <input type="text" id="new-contact-tags" class="form-control" placeholder="Hot Lead, Website Form">
            </div>
            <div class="form-group">
              <label>Notities</label>
              <textarea id="new-contact-notes" class="form-control" rows="3" placeholder="Aanvullende achtergrondinformatie..."></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-new-contact">Annuleren</button>
              <button type="submit" class="btn btn-primary">Contact Opslaan</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindTableEvents(container);
  }

  renderContactRow(c) {
    const stage = window.crmState.getStages().find(s => s.id === c.stage) || { title: c.stage, color: '#6366f1' };

    return `
      <tr class="contact-row" data-id="${c.id}">
        <td onclick="event.stopPropagation()"><input type="checkbox" class="contact-checkbox" value="${c.id}"></td>
        <td>
          <div class="contact-cell">
            <img src="${c.avatar}" class="avatar-img" alt="${c.name}">
            <div>
              <strong class="contact-name">${c.name}</strong>
              <div class="contact-sub">${c.company || 'Particulier'}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="contact-contact-info">
            <span>${c.email}</span>
            <small class="text-muted">${c.phone}</small>
          </div>
        </td>
        <td>
          <div class="tags-list">
            ${(c.tags || []).map(t => `<span class="badge badge-secondary">🏷️ ${t}</span>`).join('')}
          </div>
        </td>
        <td>
          <span class="stage-pill" style="border-left: 3px solid ${stage.color}">${stage.title}</span>
        </td>
        <td>
          <strong>€ ${(c.value || 0).toLocaleString()}</strong>
        </td>
        <td onclick="event.stopPropagation()">
          <div class="row-actions">
            <button class="icon-btn-sm btn-quick-msg" data-id="${c.id}" title="Stuur Bericht">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button class="icon-btn-sm btn-view-contact" data-id="${c.id}" title="Profiel Bekijken">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            </button>
            <button class="icon-btn-sm btn-del-contact" data-id="${c.id}" title="Verwijderen">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  bindTableEvents(container) {
    // Search input
    container.querySelector('#contact-search-input')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.render();
    });

    // Stage filter
    container.querySelector('#contact-stage-filter')?.addEventListener('change', (e) => {
      this.selectedStage = e.target.value;
      this.render();
    });

    // Tag filter
    container.querySelector('#contact-tag-filter')?.addEventListener('change', (e) => {
      this.selectedTag = e.target.value;
      this.render();
    });

    // Export CSV
    container.querySelector('#btn-export-contacts')?.addEventListener('click', () => {
      this.exportCSV();
    });

    // Add contact modal
    const addModal = container.querySelector('#add-contact-modal');
    container.querySelector('#btn-add-contact')?.addEventListener('click', () => {
      addModal?.classList.add('active');
    });
    container.querySelector('#btn-close-add-modal')?.addEventListener('click', () => {
      addModal?.classList.remove('active');
    });
    container.querySelector('#btn-cancel-new-contact')?.addEventListener('click', () => {
      addModal?.classList.remove('active');
    });

    // Form submit
    container.querySelector('#form-new-contact')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const tags = (document.getElementById('new-contact-tags').value || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const contact = {
        name: document.getElementById('new-contact-name').value,
        company: document.getElementById('new-contact-company').value,
        email: document.getElementById('new-contact-email').value,
        phone: document.getElementById('new-contact-phone').value,
        stage: document.getElementById('new-contact-stage').value,
        value: Number(document.getElementById('new-contact-value').value) || 0,
        tags: tags.length ? tags : ['Nieuwe Lead'],
        notes: document.getElementById('new-contact-notes').value
      };

      window.crmState.addContact(contact);
      addModal?.classList.remove('active');
      window.highflowApp?.showToast('Contact succesvol toegevoegd!', 'success');
      this.render();
    });

    // Row clicks -> open drawer
    container.querySelectorAll('.contact-row').forEach(row => {
      row.addEventListener('click', () => {
        this.openDrawer(row.dataset.id);
      });
    });

    container.querySelectorAll('.btn-view-contact').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openDrawer(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-quick-msg').forEach(btn => {
      btn.addEventListener('click', () => {
        window.highflowApp?.navigateTo('conversations');
      });
    });

    container.querySelectorAll('.btn-del-contact').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Weet je zeker dat je dit contact wilt verwijderen?')) {
          window.crmState.deleteContact(btn.dataset.id);
          this.closeDrawer();
          window.highflowApp?.showToast('Contact verwijderd.', 'info');
        }
      });
    });
  }

  // ==========================================
  // CONTACT DETAIL DRAWER
  // ==========================================
  openDrawer(contactId) {
    this.activeContactId = contactId;
    this.renderDrawer(contactId);
  }

  closeDrawer() {
    this.activeContactId = null;
    const drawer = document.getElementById('contact-drawer');
    if (drawer) drawer.classList.remove('active');
  }

  renderDrawer(contactId) {
    const contact = window.crmState.getContact(contactId);
    const drawer = document.getElementById('contact-drawer');
    if (!contact || !drawer) return;

    const automations = window.crmState.getAutomations();
    const stages = window.crmState.getStages();

    drawer.innerHTML = `
      <div class="drawer-header">
        <div class="contact-header-info">
          <img src="${contact.avatar}" class="avatar-lg" alt="${contact.name}">
          <div>
            <h2>${contact.name}</h2>
            <div class="text-muted">${contact.company || 'Particulier'}</div>
          </div>
        </div>
        <button class="icon-btn" id="btn-close-contact-drawer">&times;</button>
      </div>

      <!-- Quick Actions Bar -->
      <div class="drawer-action-buttons">
        <button class="btn btn-secondary btn-sm" id="btn-drawer-send-sms">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          SMS
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-drawer-send-email">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          E-mail
        </button>
        <button class="btn btn-secondary btn-sm" id="btn-drawer-book-call">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Afspraak
        </button>
        <button class="btn btn-primary btn-sm" id="btn-drawer-enroll-wf">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Start Flow
        </button>
      </div>

      <div class="drawer-body">
        <!-- Contact Information Section -->
        <div class="drawer-section">
          <h4>Contactgegevens</h4>
          <div class="info-list">
            <div class="info-row">
              <span class="label">E-mail:</span>
              <span class="value"><a href="mailto:${contact.email}">${contact.email}</a></span>
            </div>
            <div class="info-row">
              <span class="label">Telefoon:</span>
              <span class="value"><a href="tel:${contact.phone}">${contact.phone}</a></span>
            </div>
            <div class="info-row">
              <span class="label">Pipeline Fase:</span>
              <span class="value">
                <select id="drawer-contact-stage" class="form-control-sm">
                  ${stages.map(s => `<option value="${s.id}" ${contact.stage === s.id ? 'selected' : ''}>${s.title}</option>`).join('')}
                </select>
              </span>
            </div>
            <div class="info-row">
              <span class="label">Deal Waarde:</span>
              <span class="value"><strong>€ ${(contact.value || 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <!-- Tags Management -->
        <div class="drawer-section">
          <h4>Labels & Tags</h4>
          <div class="tags-container">
            ${(contact.tags || []).map(tag => `
              <span class="badge badge-primary tag-removable">
                🏷️ ${tag}
                <span class="btn-remove-tag" data-tag="${tag}">&times;</span>
              </span>
            `).join('')}
          </div>
          <div class="add-tag-wrapper">
            <input type="text" id="new-tag-input" class="form-control-sm" placeholder="Nieuwe tag...">
            <button class="btn btn-sm btn-secondary" id="btn-add-tag-submit">+ Voeg toe</button>
          </div>
        </div>

        <!-- Notes -->
        <div class="drawer-section">
          <h4>Interne Notities</h4>
          <textarea id="drawer-contact-notes" class="form-control" rows="3">${contact.notes || ''}</textarea>
          <button class="btn btn-sm btn-secondary mt-2" id="btn-save-notes">Notitie Opslaan</button>
        </div>

        <!-- Activity Timeline -->
        <div class="drawer-section">
          <h4>Activiteiten Tijdlijn</h4>
          <div class="activity-timeline">
            ${(contact.activities || []).map(act => `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <p class="timeline-text">${act.text}</p>
                  <span class="timeline-date">${new Date(act.date).toLocaleString('nl-NL')}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    drawer.classList.add('active');

    // Bind drawer events
    drawer.querySelector('#btn-close-contact-drawer')?.addEventListener('click', () => {
      this.closeDrawer();
    });

    drawer.querySelector('#drawer-contact-stage')?.addEventListener('change', (e) => {
      window.crmState.updateContact(contact.id, { stage: e.target.value });
      window.highflowApp?.showToast('Fase bijgewerkt!', 'info');
    });

    drawer.querySelector('#btn-save-notes')?.addEventListener('click', () => {
      const notes = document.getElementById('drawer-contact-notes').value;
      window.crmState.updateContact(contact.id, { notes });
      window.highflowApp?.showToast('Notitie opgeslagen!', 'success');
    });

    // Add Tag
    drawer.querySelector('#btn-add-tag-submit')?.addEventListener('click', () => {
      const input = document.getElementById('new-tag-input');
      const val = input.value.trim();
      if (val && (!contact.tags || !contact.tags.includes(val))) {
        contact.tags = contact.tags || [];
        contact.tags.push(val);
        window.crmState.saveState();
        input.value = '';
        this.renderDrawer(contact.id);
      }
    });

    // Remove Tag
    drawer.querySelectorAll('.btn-remove-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        contact.tags = (contact.tags || []).filter(t => t !== tag);
        window.crmState.saveState();
        this.renderDrawer(contact.id);
      });
    });

    // Enroll in automation quick modal
    drawer.querySelector('#btn-drawer-enroll-wf')?.addEventListener('click', () => {
      this.openEnrollModal(contact);
    });

    // Direct SMS/Email
    drawer.querySelector('#btn-drawer-send-sms')?.addEventListener('click', () => {
      const msg = prompt(`Stuur SMS naar ${contact.name} (${contact.phone}):`);
      if (msg) {
        window.crmState.addContactActivity(contact.id, {
          type: 'sms',
          text: `Directe SMS verstuurd: "${msg}"`
        });
        window.highflowApp?.showToast('SMS succesvol verzonden!', 'success');
        this.renderDrawer(contact.id);
      }
    });

    drawer.querySelector('#btn-drawer-send-email')?.addEventListener('click', () => {
      const subject = prompt(`Onderwerp van de e-mail voor ${contact.name}:`);
      if (subject) {
        window.crmState.addContactActivity(contact.id, {
          type: 'email',
          text: `E-mail verzonden: "${subject}"`
        });
        window.highflowApp?.showToast('E-mail verzonden!', 'success');
        this.renderDrawer(contact.id);
      }
    });
  }

  openEnrollModal(contact) {
    const automations = window.crmState.getAutomations();
    const modalHtml = `
      <div class="modal-backdrop active" id="enroll-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Start Workflow voor ${contact.name}</h2>
            <button class="icon-btn" onclick="document.getElementById('enroll-modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <p>Selecteer de gewenste automatiseringsflow om direct te activeren voor dit contact:</p>
            <div class="form-group">
              <select id="select-enroll-wf" class="form-control">
                ${automations.map(wf => `<option value="${wf.id}">${wf.name} (${wf.category})</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('enroll-modal').remove()">Annuleren</button>
            <button class="btn btn-primary" id="btn-confirm-enroll">Activeer Workflow Nu</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-confirm-enroll')?.addEventListener('click', () => {
      const wfId = document.getElementById('select-enroll-wf').value;
      const wf = window.crmState.getAutomation(wfId);
      if (wf) {
        wf.runs = (wf.runs || 0) + 1;
        window.crmState.addContactActivity(contact.id, {
          type: 'automation',
          text: `Ingeschreven in workflow: "${wf.name}"`
        });
        window.crmState.addActivity('zap', 'Handmatige Workflow Start', `${wf.name} geactiveerd voor ${contact.name}`);
        window.crmState.saveState();
        window.highflowApp?.showToast(`Workflow "${wf.name}" gestart!`, 'success');
      }
      document.getElementById('enroll-modal')?.remove();
      this.renderDrawer(contact.id);
    });
  }

  exportCSV() {
    const contacts = window.crmState.getContacts();
    let csv = 'Naam,Bedrijf,Email,Telefoon,Fase,Waarde,Labels\n';
    contacts.forEach(c => {
      csv += `"${c.name}","${c.company || ''}","${c.email}","${c.phone}","${c.stage}","${c.value || 0}","${(c.tags || []).join(';')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `HighFlow_Contacten_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.highflowApp?.showToast('CSV export gedownload!', 'success');
  }
}

window.contactsModule = new ContactsModule();

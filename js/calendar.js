// HighFlow CRM - Calendar & Appointments Module

class CalendarModule {
  constructor() {
    this.filterType = 'all';
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.crmState.subscribe('appointments_changed', () => this.render());
  }

  render() {
    const container = document.getElementById('calendar-view');
    if (!container) return;

    const appointments = window.crmState.getAppointments();
    const contacts = window.crmState.getContacts();

    const filtered = appointments.filter(a => {
      if (this.filterType === 'all') return true;
      return a.type === this.filterType;
    });

    container.innerHTML = `
      <div class="view-header">
        <div>
          <h1 class="view-title">Kalender & Afspraken</h1>
          <p class="view-subtitle">Beheer videocalls en adviesgesprekken. Geboekte afspraken triggeren direct herinneringsflows.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" id="btn-open-book-modal">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Afspraak Inplannen
          </button>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="category-pills">
          <button class="pill-btn ${this.filterType === 'all' ? 'active' : ''}" data-type="all">Alle Afspraken</button>
          <button class="pill-btn ${this.filterType === 'Demo Call' ? 'active' : ''}" data-type="Demo Call">Demo Calls</button>
          <button class="pill-btn ${this.filterType === 'Discovery' ? 'active' : ''}" data-type="Discovery">Discovery Calls</button>
          <button class="pill-btn ${this.filterType === 'Onboarding' ? 'active' : ''}" data-type="Onboarding">Onboarding</button>
        </div>
      </div>

      <!-- Appointments Grid -->
      <div class="appointments-grid">
        ${filtered.map(app => {
          const contact = window.crmState.getContact(app.contactId);
          return `
            <div class="appointment-card">
              <div class="app-card-header">
                <span class="badge badge-primary">${app.type}</span>
                <span class="badge ${app.status === 'confirmed' ? 'badge-success' : 'badge-neutral'}">
                  ${app.status === 'confirmed' ? 'Bevestigd' : 'In afwachting'}
                </span>
              </div>

              <h3 class="app-title">${app.title}</h3>

              <div class="app-time-row">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span><strong>${app.date}</strong> om ${app.time}</span>
              </div>

              <div class="app-contact-row">
                ${contact ? `
                  <img src="${contact.avatar}" class="avatar-sm" alt="${contact.name}">
                  <div>
                    <div class="contact-name-sm">${contact.name}</div>
                    <small class="text-muted">${contact.company || contact.email}</small>
                  </div>
                ` : `<span>${app.contactName || 'Gast'}</span>`}
              </div>

              <div class="app-card-actions">
                <button class="btn btn-sm btn-secondary btn-join-meet">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                  Deelnemen aan Call
                </button>
                <button class="btn btn-sm btn-outline btn-cancel-app" data-id="${app.id}">Annuleren</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Book Appointment Modal -->
      <div class="modal-backdrop" id="book-appointment-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Nieuwe Afspraak Inplannen</h2>
            <button class="icon-btn" id="btn-close-app-modal">&times;</button>
          </div>
          <form id="form-new-appointment" class="modal-body">
            <div class="form-group">
              <label>Selecteer Contact *</label>
              <select id="app-contact-select" class="form-control" required>
                ${contacts.map(c => `<option value="${c.id}">${c.name} (${c.company || c.email})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Onderwerp / Titel *</label>
              <input type="text" id="app-title-input" class="form-control" required placeholder="bijv. Strategie & Demo Sessie">
            </div>
            <div class="form-row">
              <div class="form-group col-6">
                <label>Datum *</label>
                <input type="date" id="app-date-input" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
              </div>
              <div class="form-group col-6">
                <label>Tijdslot *</label>
                <select id="app-time-select" class="form-control">
                  <option value="09:00 - 09:30">09:00 - 09:30</option>
                  <option value="11:00 - 11:45">11:00 - 11:45</option>
                  <option value="14:00 - 14:45" selected>14:00 - 14:45</option>
                  <option value="16:00 - 16:30">16:00 - 16:30</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Type Gesprek</label>
              <select id="app-type-select" class="form-control">
                <option value="Demo Call">Demo Call</option>
                <option value="Discovery">Discovery Kennismaking</option>
                <option value="Onboarding">Onboarding Sessie</option>
              </select>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-app-modal">Annuleren</button>
              <button type="submit" class="btn btn-primary">Afspraak Vastleggen</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.bindCalendarEvents(container);
  }

  bindCalendarEvents(container) {
    // Filter pills
    container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterType = btn.dataset.type;
        this.render();
      });
    });

    // Modal triggers
    const modal = container.querySelector('#book-appointment-modal');
    container.querySelector('#btn-open-book-modal')?.addEventListener('click', () => {
      modal?.classList.add('active');
    });
    container.querySelector('#btn-close-app-modal')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });
    container.querySelector('#btn-cancel-app-modal')?.addEventListener('click', () => {
      modal?.classList.remove('active');
    });

    // Form submit
    container.querySelector('#form-new-appointment')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const contactId = document.getElementById('app-contact-select').value;
      const contact = window.crmState.getContact(contactId);

      const app = {
        contactId,
        contactName: contact ? contact.name : 'Klant',
        title: document.getElementById('app-title-input').value,
        date: document.getElementById('app-date-input').value,
        time: document.getElementById('app-time-select').value,
        type: document.getElementById('app-type-select').value
      };

      window.crmState.addAppointment(app);
      modal?.classList.remove('active');
      window.highflowApp?.showToast('Afspraak vastgelegd! Herinneringsflow getriggerd.', 'success');
      this.render();
    });

    // Cancel appointment
    container.querySelectorAll('.btn-cancel-app').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        window.crmState.data.appointments = window.crmState.data.appointments.filter(a => a.id !== id);
        window.crmState.saveState();
        window.highflowApp?.showToast('Afspraak geannuleerd.', 'info');
        this.render();
      });
    });

    // Join meet
    container.querySelectorAll('.btn-join-meet').forEach(btn => {
      btn.addEventListener('click', () => {
        alert('Google Meet link wordt geopend: https://meet.google.com/hfw-demo-live');
      });
    });
  }
}

window.calendarModule = new CalendarModule();

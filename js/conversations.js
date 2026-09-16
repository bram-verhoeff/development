// HighFlow CRM - Unified Conversations (SMS, Email, WhatsApp)

class ConversationsModule {
  constructor() {
    this.activeConvId = 'conv1';
    this.channelFilter = 'all';
    this.activeInputChannel = 'sms';
  }

  init() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    window.crmState.subscribe('conversations_changed', () => {
      this.render();
    });
  }

  render() {
    const container = document.getElementById('conversations-view');
    if (!container) return;

    const conversations = window.crmState.getConversations();
    const activeConv = window.crmState.getConversation(this.activeConvId) || conversations[0];
    if (activeConv) this.activeConvId = activeConv.id;

    const filtered = conversations.filter(c => {
      if (this.channelFilter === 'all') return true;
      return c.channel === this.channelFilter;
    });

    const activeContact = activeConv ? window.crmState.getContact(activeConv.contactId) : null;

    container.innerHTML = `
      <div class="inbox-container">
        <!-- Left: Conversations Threads List -->
        <div class="inbox-sidebar">
          <div class="inbox-sidebar-header">
            <h2 class="sidebar-title">Gesprekken</h2>
            <div class="channel-filter-pills">
              <button class="chan-pill ${this.channelFilter === 'all' ? 'active' : ''}" data-chan="all">Alles</button>
              <button class="chan-pill ${this.channelFilter === 'sms' ? 'active' : ''}" data-chan="sms">SMS</button>
              <button class="chan-pill ${this.channelFilter === 'whatsapp' ? 'active' : ''}" data-chan="whatsapp">WhatsApp</button>
              <button class="chan-pill ${this.channelFilter === 'email' ? 'active' : ''}" data-chan="email">E-mail</button>
            </div>
          </div>

          <div class="conv-list">
            ${filtered.map(conv => {
              const isSelected = conv.id === this.activeConvId;
              const chanIcon = this.getChannelIcon(conv.channel);

              return `
                <div class="conv-item ${isSelected ? 'active' : ''} ${conv.unread ? 'unread' : ''}" data-id="${conv.id}">
                  <div class="conv-avatar-box">
                    <img src="${conv.avatar}" class="avatar-md" alt="${conv.contactName}">
                    <span class="conv-chan-badge chan-${conv.channel}">${chanIcon}</span>
                  </div>
                  <div class="conv-info">
                    <div class="conv-top-row">
                      <strong class="conv-name">${conv.contactName}</strong>
                      <span class="conv-time">${conv.lastMessageTime || ''}</span>
                    </div>
                    <p class="conv-preview">${conv.lastMessage || 'Geen berichten'}</p>
                  </div>
                  ${conv.unread ? `<span class="unread-dot"></span>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Center: Active Chat Stream -->
        <div class="inbox-chat-area">
          ${activeConv ? `
            <div class="chat-header">
              <div class="chat-header-contact">
                <img src="${activeConv.avatar}" class="avatar-md" alt="${activeConv.contactName}">
                <div>
                  <h3 class="chat-contact-name">${activeConv.contactName}</h3>
                  <div class="chat-contact-sub">
                    <span class="status-indicator online"></span>
                    <span>Actief via ${activeConv.channel.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div class="chat-header-actions">
                <button class="btn btn-sm btn-secondary" id="btn-view-crm-profile" data-id="${activeConv.contactId}">
                  Bekijk CRM Profiel
                </button>
              </div>
            </div>

            <!-- Messages Stream -->
            <div class="chat-messages" id="chat-messages-container">
              ${(activeConv.messages || []).map(msg => this.renderMessageBubble(msg)).join('')}
            </div>

            <!-- Chat Input Footer -->
            <div class="chat-input-box">
              <div class="input-toolbar">
                <div class="channel-switch-buttons">
                  <button class="switch-btn ${this.activeInputChannel === 'sms' ? 'active' : ''}" data-chan="sms">
                    💬 SMS
                  </button>
                  <button class="switch-btn ${this.activeInputChannel === 'whatsapp' ? 'active' : ''}" data-chan="whatsapp">
                    🟢 WhatsApp
                  </button>
                  <button class="switch-btn ${this.activeInputChannel === 'email' ? 'active' : ''}" data-chan="email">
                    ✉️ E-mail
                  </button>
                </div>

                <div class="snippets-dropdown">
                  <select id="select-snippet" class="form-control-sm">
                    <option value="">⚡ Snelle Reacties (Canned Snippets)...</option>
                    <option value="Hoi {{contact.name}}, wanneer schikt een korte telefonische kennismaking?">Afspraak voorstellen</option>
                    <option value="Bedankt voor je aanvraag! De offerte is zojuist verzonden naar je e-mail.">Offerte verzonden</option>
                    <option value="Super! De afspraak staat vast in onze agenda. Tot dan!">Afspraak bevestiging</option>
                  </select>
                </div>
              </div>

              <div class="message-composer">
                <textarea id="chat-input-field" placeholder="Typ je antwoord via ${this.activeInputChannel.toUpperCase()}... (Druk op Enter om te verzenden)" rows="2"></textarea>
                <button class="btn btn-primary" id="btn-send-message">
                  <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  Verzenden
                </button>
              </div>
            </div>
          ` : `
            <div class="empty-state-chat">
              <p>Selecteer een gesprek uit de lijst aan de linkerkant.</p>
            </div>
          `}
        </div>

        <!-- Right: Contact Quick Info Sidebar -->
        ${activeContact ? `
          <div class="inbox-contact-pane">
            <div class="pane-header">
              <h4>Klantgegevens</h4>
            </div>
            <div class="pane-contact-profile">
              <img src="${activeContact.avatar}" class="avatar-xl" alt="${activeContact.name}">
              <h3>${activeContact.name}</h3>
              <p class="text-muted">${activeContact.company || 'Geen bedrijf'}</p>
            </div>

            <div class="pane-details-list">
              <div class="pane-row">
                <span class="label">Telefoon:</span>
                <span class="val">${activeContact.phone}</span>
              </div>
              <div class="pane-row">
                <span class="label">E-mail:</span>
                <span class="val">${activeContact.email}</span>
              </div>
              <div class="pane-row">
                <span class="label">Deal Waarde:</span>
                <span class="val font-weight-bold">€ ${(activeContact.value || 0).toLocaleString()}</span>
              </div>
            </div>

            <div class="pane-tags-section">
              <h5>Actieve Labels:</h5>
              <div class="tags-list">
                ${(activeContact.tags || []).map(t => `<span class="badge badge-secondary">🏷️ ${t}</span>`).join('')}
              </div>
            </div>

            <div class="pane-actions-box">
              <button class="btn btn-secondary btn-block btn-sm" id="btn-pane-open-workflow">
                🚀 Start Workflow
              </button>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.bindInboxEvents(container);

    // Scroll chat to bottom
    const msgsEl = container.querySelector('#chat-messages-container');
    if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  renderMessageBubble(msg) {
    if (msg.sender === 'system') {
      return `
        <div class="system-message-row">
          <div class="system-message-bubble">
            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>${msg.text}</span>
            <span class="msg-time">${msg.time}</span>
          </div>
        </div>
      `;
    }

    const isUser = msg.sender === 'user';
    return `
      <div class="chat-bubble-row ${isUser ? 'chat-row-user' : 'chat-row-contact'}">
        <div class="chat-bubble ${isUser ? 'bubble-user' : 'bubble-contact'}">
          <div class="bubble-text">${msg.text}</div>
          <div class="bubble-meta">
            <span class="bubble-channel">${(msg.channel || 'sms').toUpperCase()}</span>
            <span class="bubble-time">${msg.time}</span>
            ${isUser ? `<span class="bubble-check">✓✓</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  getChannelIcon(chan) {
    switch (chan) {
      case 'sms': return '💬';
      case 'whatsapp': return '🟢';
      case 'email': return '✉️';
      default: return '💬';
    }
  }

  bindInboxEvents(container) {
    // Select conversation
    container.querySelectorAll('.conv-item').forEach(item => {
      item.addEventListener('click', () => {
        this.activeConvId = item.dataset.id;
        const conv = window.crmState.getConversation(this.activeConvId);
        if (conv) conv.unread = false;
        this.render();
      });
    });

    // Channel filter pills
    container.querySelectorAll('.chan-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        this.channelFilter = btn.dataset.chan;
        this.render();
      });
    });

    // Channel switch in composer
    container.querySelectorAll('.switch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeInputChannel = btn.dataset.chan;
        this.render();
      });
    });

    // Canned response snippets
    const snippetSelect = container.querySelector('#select-snippet');
    const inputField = container.querySelector('#chat-input-field');
    if (snippetSelect && inputField) {
      snippetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          const conv = window.crmState.getConversation(this.activeConvId);
          let text = e.target.value;
          if (conv) text = text.replace('{{contact.name}}', conv.contactName);
          inputField.value = text;
          inputField.focus();
        }
      });
    }

    // Send message
    const sendBtn = container.querySelector('#btn-send-message');
    const handleSend = () => {
      if (!inputField) return;
      const text = inputField.value.trim();
      if (!text) return;

      window.crmState.sendMessage(this.activeConvId, text, this.activeInputChannel);
      inputField.value = '';
      window.highflowApp?.showToast('Bericht verzonden!', 'success');
      this.render();
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (inputField) {
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }

    // View CRM profile
    container.querySelector('#btn-view-crm-profile')?.addEventListener('click', (e) => {
      const contactId = e.currentTarget.dataset.id;
      window.highflowApp?.navigateTo('contacts');
      setTimeout(() => {
        window.contactsModule?.openDrawer(contactId);
      }, 200);
    });

    // Open workflow for active contact
    container.querySelector('#btn-pane-open-workflow')?.addEventListener('click', () => {
      const conv = window.crmState.getConversation(this.activeConvId);
      if (conv && conv.contactId) {
        const contact = window.crmState.getContact(conv.contactId);
        if (contact) window.contactsModule?.openEnrollModal(contact);
      }
    });
  }
}

window.conversationsModule = new ConversationsModule();

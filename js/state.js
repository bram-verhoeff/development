// HighFlow CRM - Central State Management & Persistence

const STORAGE_KEY = 'highflow_crm_state_v2';

const INITIAL_DATA = {
  contacts: [],
  deals: [],
  pipelineStages: [
    { id: 'new', title: 'Nieuwe Leads', color: '#6366f1' },
    { id: 'contacted', title: 'Gecontacteerd', color: '#0ea5e9' },
    { id: 'demo', title: 'Demo Gepland', color: '#f59e0b' },
    { id: 'proposal', title: 'Voorstel Verzonden', color: '#8b5cf6' },
    { id: 'won', title: 'Deal Gewonnen 🎉', color: '#10b981' },
    { id: 'lost', title: 'Verloren', color: '#ef4444' }
  ],
  automations: [
    {
      id: 'wf_linkedin_ai',
      name: '🤖 Dagelijkse LinkedIn AI Content Generator (Bram Verhoeff, StudyElite & AgevoDev)',
      description: 'Genereert elke ochtend automatisch boeiende LinkedIn berichten voor het persoonlijke profiel van Bram Verhoeff, StudyElite.nl en AgevoDev.nl.',
      status: 'active',
      runs: 0,
      category: 'Marketing',
      trigger: {
        id: 't_sched',
        type: 'schedule_recurring',
        title: 'Dagelijks om 09:00 uur (Ma-Vr)',
        config: { time: '09:00', frequency: 'daily', timezone: 'Europe/Amsterdam' }
      },
      steps: [
        {
          id: 's_ai_1',
          type: 'ai_generate_linkedin',
          title: 'AI Genereert LinkedIn Post',
          config: {
            targets: ['Bram Verhoeff', 'AgevoDev.nl', 'StudyElite.nl'],
            tone: 'Inspirerend, B2B en data-driven',
            includeHashtags: true,
            includeCTA: true
          }
        },
        {
          id: 's_ai_2',
          type: 'publish_linkedin',
          title: 'Publiceer op LinkedIn Pagina',
          config: {
            channel: 'LinkedIn API',
            account: 'AgevoDev / StudyElite Official',
            visibility: 'PUBLIC'
          }
        },
        {
          id: 's_ai_3',
          type: 'create_task',
          title: 'Interne Taak: Engagement & Reacties Monitoren',
          config: {
            taskTitle: 'Monitor comments en netwerk-interactie op de nieuwe LinkedIn post',
            assignee: 'Bram Verhoeff',
            dueDays: 1
          }
        },
        {
          id: 's_ai_4',
          type: 'send_webhook',
          title: 'Notificatie naar Team Slack / Discord',
          config: {
            endpoint: 'https://hooks.slack.com/services/AGEVODEV/LINKEDIN_POSTS',
            payloadFormat: 'JSON'
          }
        }
      ]
    }
  ],
  conversations: [],
  appointments: [],
  activities: [],
  executionLogs: [],
  aiPosts: [],
  settings: {
    accountName: 'AgevoDev & StudyElite BV',
    currency: 'EUR (€)',
    twilioSid: 'AC_live_configured',
    sendgridKey: 'SG.live_configured',
    linkedinStatus: '1-Klik & Webhook Gereed',
    linkedinWebhookUrl: '',
    linkedinAccessToken: '',
    linkedinAuthorUrn: '',
    webhookEndpoint: 'https://api.agevodev.nl/v1/webhook/incoming',
    enableAutoReplies: true
  }
};

class StateManager {
  constructor() {
    this.listeners = {};
    this.data = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.settings) parsed.settings = {};
        if (!parsed.settings.linkedinWebhookUrl) parsed.settings.linkedinWebhookUrl = '';
        if (!parsed.settings.linkedinAccessToken) parsed.settings.linkedinAccessToken = '';
        if (!parsed.settings.linkedinAuthorUrn) parsed.settings.linkedinAuthorUrn = '';
        if (!parsed.aiPosts) parsed.aiPosts = [];
        // Clean out legacy misaligned CRM posts for AgevoDev
        parsed.aiPosts = parsed.aiPosts.filter(p => 
          !p.content.includes('CRM-automatiseringen') && 
          !p.content.includes('GoHighLevel') && 
          !p.content.includes('administratie en copy-paste')
        );
        return parsed;
      }
    } catch (e) {
      console.warn('Could not load from localStorage, using initial data', e);
    }
    this.saveState(INITIAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }

  saveState(newData) {
    if (newData) this.data = newData;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.emit('change', this.data);
  }

  resetDemo() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveState();
    this.emit('reset', this.data);
    return this.data;
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(payload); } catch (err) { console.error('Listener error:', err); }
      });
    }
  }

  // --- Contacts ---
  getContacts() { return this.data.contacts; }
  getContact(id) { return this.data.contacts.find(c => c.id === id); }
  
  addContact(contact) {
    const newContact = {
      id: 'c_' + Date.now(),
      createdAt: new Date().toISOString(),
      avatar: contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contact.name || 'New')}`,
      tags: contact.tags || ['Nieuwe Lead'],
      stage: contact.stage || 'new',
      value: Number(contact.value) || 0,
      activities: [
        { id: 'act_' + Date.now(), type: 'contact', text: 'Contact handmatig toegevoegd', date: new Date().toISOString() }
      ],
      ...contact
    };
    this.data.contacts.unshift(newContact);
    this.addActivity('user-plus', 'Nieuw Contact Aangemaakt', `${newContact.name} (${newContact.company || 'Geen bedrijf'})`);
    this.saveState();
    this.emit('contacts_changed', this.data.contacts);
    
    // Check if any workflow triggers on "contact_created"
    this.triggerAutomationsForEvent('contact_created', newContact);
    return newContact;
  }

  updateContact(id, updates) {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.contacts[idx] = { ...this.data.contacts[idx], ...updates };
      this.saveState();
      this.emit('contacts_changed', this.data.contacts);
      return this.data.contacts[idx];
    }
    return null;
  }

  deleteContact(id) {
    this.data.contacts = this.data.contacts.filter(c => c.id !== id);
    this.data.deals = this.data.deals.filter(d => d.contactId !== id);
    this.saveState();
    this.emit('contacts_changed', this.data.contacts);
    this.emit('deals_changed', this.data.deals);
  }

  addContactActivity(contactId, activity) {
    const contact = this.getContact(contactId);
    if (contact) {
      if (!contact.activities) contact.activities = [];
      contact.activities.unshift({
        id: 'act_' + Date.now(),
        date: new Date().toISOString(),
        ...activity
      });
      this.saveState();
      this.emit('contacts_changed', this.data.contacts);
    }
  }

  // --- Deals / Pipeline ---
  getDeals() { return this.data.deals; }
  getStages() { return this.data.pipelineStages; }

  addDeal(deal) {
    const newDeal = {
      id: 'd_' + Date.now(),
      priority: deal.priority || 'medium',
      stage: deal.stage || 'new',
      value: Number(deal.value) || 0,
      expectedClose: deal.expectedClose || new Date(Date.now() + 14*86400000).toISOString().split('T')[0],
      ...deal
    };
    this.data.deals.push(newDeal);
    this.addActivity('dollar-sign', 'Nieuwe Deal Aangemaakt', `${newDeal.title} (€ ${newDeal.value.toLocaleString()})`);
    this.saveState();
    this.emit('deals_changed', this.data.deals);
    return newDeal;
  }

  updateDealStage(dealId, newStageId) {
    const deal = this.data.deals.find(d => d.id === dealId);
    if (deal && deal.stage !== newStageId) {
      const oldStage = deal.stage;
      deal.stage = newStageId;

      // Update contact stage as well if exists
      if (deal.contactId) {
        this.updateContact(deal.contactId, { stage: newStageId });
        const stageObj = this.data.pipelineStages.find(s => s.id === newStageId);
        this.addContactActivity(deal.contactId, {
          type: 'deal',
          text: `Pipeline deal "${deal.title}" verplaatst naar fase: ${stageObj ? stageObj.title : newStageId}`
        });
      }

      this.addActivity('arrow-right-circle', 'Deal Fase Gewijzigd', `${deal.title} -> ${newStageId}`);
      this.saveState();
      this.emit('deals_changed', this.data.deals);

      // Trigger automations for stage changed
      this.triggerAutomationsForEvent('pipeline_stage_changed', { deal, newStage: newStageId, oldStage });
    }
  }

  deleteDeal(dealId) {
    this.data.deals = this.data.deals.filter(d => d.id !== dealId);
    this.saveState();
    this.emit('deals_changed', this.data.deals);
  }

  // --- Automations / Workflows ---
  getAutomations() { return this.data.automations; }
  getAutomation(id) { return this.data.automations.find(a => a.id === id); }

  saveAutomation(automation) {
    const idx = this.data.automations.findIndex(a => a.id === automation.id);
    if (idx !== -1) {
      this.data.automations[idx] = { ...this.data.automations[idx], ...automation };
    } else {
      this.data.automations.unshift({
        id: 'wf_' + Date.now(),
        runs: 0,
        status: 'active',
        ...automation
      });
    }
    this.saveState();
    this.emit('automations_changed', this.data.automations);
  }

  deleteAutomation(id) {
    this.data.automations = this.data.automations.filter(a => a.id !== id);
    this.saveState();
    this.emit('automations_changed', this.data.automations);
  }

  toggleAutomationStatus(id) {
    const wf = this.getAutomation(id);
    if (wf) {
      wf.status = wf.status === 'active' ? 'draft' : 'active';
      this.saveState();
      this.emit('automations_changed', this.data.automations);
    }
  }

  // --- Conversations ---
  getConversations() { return this.data.conversations; }
  getConversation(id) { return this.data.conversations.find(c => c.id === id); }

  sendMessage(convId, text, channel = 'sms') {
    const conv = this.getConversation(convId);
    if (!conv) return;

    const newMsg = {
      id: 'm_' + Date.now(),
      sender: 'user',
      channel,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    conv.messages.push(newMsg);
    conv.lastMessage = text;
    conv.lastMessageTime = newMsg.time;
    conv.channel = channel;

    // Add activity to contact
    if (conv.contactId) {
      this.addContactActivity(conv.contactId, {
        type: channel,
        text: `Uitgaand ${channel.toUpperCase()}: "${text.length > 40 ? text.slice(0, 40) + '...' : text}"`
      });
    }

    this.saveState();
    this.emit('conversations_changed', this.data.conversations);

    // Simulate contact replying after 1.5 seconds if auto-replies enabled
    if (this.data.settings.enableAutoReplies) {
      setTimeout(() => {
        const replies = [
          'Duidelijk, dank voor het snelle antwoord!',
          'Top, we gaan ermee aan de slag.',
          'Super, ik zal het doorgeven aan mijn collega.',
          'Ontvangen! Tot sprekens.'
        ];
        const replyText = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg = {
          id: 'm_reply_' + Date.now(),
          sender: 'contact',
          channel,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        conv.messages.push(replyMsg);
        conv.lastMessage = replyText;
        conv.lastMessageTime = replyMsg.time;
        conv.unread = true;

        if (conv.contactId) {
          this.addContactActivity(conv.contactId, {
            type: channel,
            text: `Inkomend ${channel.toUpperCase()}: "${replyText}"`
          });
        }

        this.addActivity('message-circle', `Inkomend bericht van ${conv.contactName}`, replyText);
        this.saveState();
        this.emit('conversations_changed', this.data.conversations);
      }, 1500);
    }
  }

  // --- Appointments ---
  getAppointments() { return this.data.appointments; }

  addAppointment(app) {
    const newApp = {
      id: 'app_' + Date.now(),
      status: 'confirmed',
      ...app
    };
    this.data.appointments.push(newApp);

    if (newApp.contactId) {
      this.addContactActivity(newApp.contactId, {
        type: 'calendar',
        text: `Afspraak geboekt: "${newApp.title}" op ${newApp.date} (${newApp.time})`
      });
    }

    this.addActivity('calendar', 'Nieuwe Afspraak Ingepland', `${newApp.title} (${newApp.contactName})`);
    this.saveState();
    this.emit('appointments_changed', this.data.appointments);

    // Trigger workflow event
    this.triggerAutomationsForEvent('appointment_booked', newApp);
    return newApp;
  }

  // --- Activities ---
  getActivities() { return this.data.activities; }

  addActivity(icon, title, desc) {
    this.data.activities.unshift({
      id: 'act_' + Date.now(),
      icon,
      title,
      desc,
      time: 'Zojuist'
    });
    if (this.data.activities.length > 30) this.data.activities.pop();
    this.saveState();
    this.emit('activities_changed', this.data.activities);
  }

  // --- Automated Workflow Triggering & Execution Engine ---
  getExecutionLogs() {
    return this.data.executionLogs || [];
  }

  triggerAutomationsForEvent(eventType, payload) {
    const activeWorkflows = (this.data.automations || []).filter(wf => wf.status === 'active');
    
    activeWorkflows.forEach(wf => {
      let shouldTrigger = false;
      let targetContact = null;

      if (!wf.trigger) return;

      if (eventType === 'contact_created' || eventType === 'form_submitted') {
        if (wf.trigger.type === 'contact_created' || wf.trigger.type === 'form_submitted') {
          shouldTrigger = true;
          targetContact = payload;
        }
      } else if (eventType === 'pipeline_stage_changed' && wf.trigger.type === 'pipeline_stage_changed') {
        if (!wf.trigger.config?.targetStage || wf.trigger.config.targetStage === payload.newStage) {
          shouldTrigger = true;
          targetContact = this.getContact(payload.deal?.contactId);
        }
      } else if (eventType === 'appointment_booked' && wf.trigger.type === 'appointment_booked') {
        shouldTrigger = true;
        targetContact = this.getContact(payload.contactId);
      }

      if (shouldTrigger && targetContact) {
        this.executeWorkflow(wf, targetContact, `Trigger: ${wf.trigger.title}`);
      }
    });
  }

  executeWorkflow(workflow, contact, triggerSource = 'Handmatig geactiveerd') {
    if (!workflow) return;
    workflow.runs = (workflow.runs || 0) + 1;

    const contactName = contact?.name || 'Onbekend contact';
    const contactId = contact?.id;

    console.log(`[HighFlow Automation Engine] ▶ Start uitvoering "${workflow.name}" voor ${contactName}`);
    
    const executionRecord = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      workflowId: workflow.id,
      workflowName: workflow.name,
      contactId: contactId,
      contactName: contactName,
      triggerSource: triggerSource,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      stepsExecuted: [],
      status: 'success'
    };

    if (!this.data.executionLogs) this.data.executionLogs = [];
    let lastGeneratedAIPost = null;

    // Helper to replace GoHighLevel merge tags
    const parseTags = (text) => {
      if (!text) return '';
      return text
        .replace(/{{contact\.name}}/g, contact?.name || 'klant')
        .replace(/{{contact\.company}}/g, contact?.company || '')
        .replace(/{{contact\.email}}/g, contact?.email || '')
        .replace(/{{contact\.phone}}/g, contact?.phone || '')
        .replace(/{{appointment\.date}}/g, new Date().toLocaleDateString('nl-NL'));
    };

    // Sequentially execute steps
    const executeStep = (step) => {
      if (!step) return;

      switch (step.type) {
        case 'send_sms': {
          const smsText = parseTags(step.config?.message || 'Bedankt voor je bericht!');
          
          // Add to real conversation
          let conv = this.data.conversations.find(c => c.contactId === contactId);
          if (!conv && contactId) {
            conv = {
              id: 'conv_' + Date.now(),
              contactId: contactId,
              contactName: contactName,
              avatar: contact.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(contactName)}`,
              channel: 'sms',
              lastMessage: smsText,
              lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: false,
              messages: []
            };
            this.data.conversations.unshift(conv);
          }

          if (conv) {
            conv.messages.push({
              id: 'm_auto_' + Date.now(),
              sender: 'system',
              channel: 'sms',
              text: smsText,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            conv.lastMessage = smsText;
            conv.lastMessageTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          if (contactId) {
            this.addContactActivity(contactId, {
              type: 'sms',
              text: `[Automation: ${workflow.name}] SMS verstuurd: "${smsText.slice(0, 45)}..."`
            });
          }

          executionRecord.stepsExecuted.push(`💬 SMS verstuurd naar ${contact?.phone || 'telefoon'}`);
          if (window.highflowApp?.showToast) {
            window.highflowApp.showToast(`💬 SMS verzonden via workflow naar ${contactName}`, 'info');
          }
          break;
        }

        case 'send_email': {
          const subject = parseTags(step.config?.subject || 'Belangrijke update');
          const body = parseTags(step.config?.body || '');

          let conv = this.data.conversations.find(c => c.contactId === contactId);
          if (conv) {
            conv.messages.push({
              id: 'm_email_' + Date.now(),
              sender: 'system',
              channel: 'email',
              text: `Onderwerp: ${subject}\n\n${body}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }

          if (contactId) {
            this.addContactActivity(contactId, {
              type: 'email',
              text: `[Automation: ${workflow.name}] E-mail verstuurd: "${subject}"`
            });
          }

          executionRecord.stepsExecuted.push(`✉️ E-mail verstuurd: "${subject}"`);
          if (window.highflowApp?.showToast) {
            window.highflowApp.showToast(`✉️ E-mail verzonden via workflow naar ${contactName}`, 'info');
          }
          break;
        }

        case 'add_tag': {
          const tagToAdd = step.config?.tag;
          if (tagToAdd && contact) {
            if (!contact.tags) contact.tags = [];
            if (!contact.tags.includes(tagToAdd)) {
              contact.tags.push(tagToAdd);
              this.addContactActivity(contactId, {
                type: 'tag',
                text: `[Automation: ${workflow.name}] Label "${tagToAdd}" automatisch toegevoegd`
              });
            }
          }
          executionRecord.stepsExecuted.push(`🏷️ Tag toegevoegd: [${tagToAdd}]`);
          break;
        }

        case 'create_deal': {
          const dealTitle = parseTags(step.config?.title || `Deal via ${workflow.name}`);
          const newDeal = {
            id: 'd_auto_' + Date.now() + Math.floor(Math.random() * 100),
            contactId: contactId,
            title: dealTitle,
            company: contact?.company || contactName,
            value: Number(step.config?.value) || 2500,
            stage: step.config?.pipelineStage || 'new',
            priority: 'medium',
            expectedClose: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
          };
          this.data.deals.push(newDeal);
          if (contact) contact.stage = newDeal.stage;

          if (contactId) {
            this.addContactActivity(contactId, {
              type: 'deal',
              text: `[Automation: ${workflow.name}] Deal aangemaakt: "${dealTitle}" (€ ${newDeal.value.toLocaleString()})`
            });
          }

          executionRecord.stepsExecuted.push(`📈 Deal aangemaakt in pipeline [${newDeal.stage}] (€ ${newDeal.value})`);
          if (window.highflowApp?.showToast) {
            window.highflowApp.showToast(`📈 Nieuwe deal (€ ${newDeal.value}) aangemaakt via automation!`, 'success');
          }
          break;
        }

        case 'wait_delay': {
          executionRecord.stepsExecuted.push(`⏳ Wachttijd geregistreerd: ${step.config?.duration || 1} ${step.config?.unit || 'dagen'}`);
          break;
        }

        case 'create_task': {
          const taskTitle = parseTags(step.config?.taskTitle || 'Follow-up taak');
          this.addActivity('check-square', `Taak via Workflow: ${taskTitle}`, `Toegewezen aan: ${step.config?.assignee || 'Team'}`);
          executionRecord.stepsExecuted.push(`📋 Taak aangemaakt: "${taskTitle}"`);
          break;
        }

        case 'send_webhook': {
          const url = step.config?.endpoint;
          executionRecord.stepsExecuted.push(`🌐 Webhook payload verstuurd naar: ${url}`);
          // Simulated non-blocking fetch
          try {
            if (url && url.startsWith('http')) {
              fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: 'automation_trigger', workflow: workflow.name, contact })
              }).catch(() => {});
            }
          } catch (e) {}
          break;
        }

        case 'ai_generate_linkedin': {
          const targets = step.config?.targets || ['Bram Verhoeff', 'AgevoDev.nl', 'StudyElite.nl'];
          const target = targets[Math.floor(Math.random() * targets.length)];
          const post = this.generateLinkedInContent(target);
          lastGeneratedAIPost = post;
          executionRecord.stepsExecuted.push(`🤖 AI Post gegenereerd voor ${target}: "${post.title.slice(0, 40)}..."`);
          if (window.highflowApp?.showToast) {
            window.highflowApp.showToast(`🤖 AI heeft een LinkedIn post gegenereerd over ${target}!`, 'info');
          }
          break;
        }

        case 'publish_linkedin': {
          const webhookUrl = this.data.settings?.linkedinWebhookUrl;
          const accessToken = this.data.settings?.linkedinAccessToken;
          const authorUrn = this.data.settings?.linkedinAuthorUrn;
          const postToPublish = lastGeneratedAIPost || (this.data.aiPosts && this.data.aiPosts[0]);

          if ((webhookUrl && webhookUrl.startsWith('http')) || (accessToken && authorUrn)) {
            // Live dispatch via backend server
            fetch('/api/linkedin/publish', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                webhookUrl: webhookUrl,
                accessToken: accessToken,
                authorUrn: authorUrn,
                target: postToPublish?.target || 'StudyElite.nl / AgevoDev.nl',
                content: postToPublish?.content || ''
              })
            }).then(r => r.json()).then(data => {
              if (data.success) {
                console.log('[LinkedIn Live Publish] Success:', data.message);
              }
            }).catch(err => {
              console.warn('[LinkedIn Live Publish] Error:', err);
            });

            executionRecord.stepsExecuted.push(`🌐 Live verzonden naar ${webhookUrl ? 'LinkedIn Webhook' : 'LinkedIn Official API'}`);
            if (window.highflowApp?.showToast) {
              window.highflowApp.showToast(`🚀 Post automatisch verzonden naar je live LinkedIn webhook/API!`, 'success');
            }
          } else {
            // Not connected to live webhook yet - staged for 1-click sharing
            executionRecord.stepsExecuted.push(`📋 Klaargezet in LinkedIn Studio (1-Klik delen gereed • Koppel Make.com/Zapier voor hands-free)`);
            if (window.highflowApp?.showToast) {
              window.highflowApp.showToast(`📋 Post klaargezet in de LinkedIn AI Studio! Gebruik de 1-klik deelknop om direct op LinkedIn te plaatsen.`, 'info');
            }
          }
          break;
        }

        case 'condition': {
          const field = step.config?.field || 'stage';
          const expectedVal = String(step.config?.value || '').toLowerCase();
          let conditionMet = false;

          if (contact) {
            if (field === 'stage') conditionMet = String(contact.stage || '').toLowerCase() === expectedVal;
            else if (field === 'tags') conditionMet = (contact.tags || []).some(t => t.toLowerCase() === expectedVal);
            else if (field === 'value') conditionMet = Number(contact.value || 0) >= Number(expectedVal);
          }

          if (conditionMet) {
            executionRecord.stepsExecuted.push(`🔀 Voorwaarde (${field} = ${expectedVal}) -> JA`);
            (step.yesSteps || []).forEach(ys => executeStep(ys));
          } else {
            executionRecord.stepsExecuted.push(`🔀 Voorwaarde (${field} = ${expectedVal}) -> NEE`);
            (step.noSteps || []).forEach(ns => executeStep(ns));
          }
          break;
        }

        default:
          executionRecord.stepsExecuted.push(`✓ Stap voltooid: ${step.title}`);
          break;
      }
    };

    // Run all steps
    (workflow.steps || []).forEach(s => executeStep(s));

    // Save execution record
    this.data.executionLogs.unshift(executionRecord);
    if (this.data.executionLogs.length > 50) this.data.executionLogs.pop();

    this.addActivity('zap', `Workflow Uitgevoerd: ${workflow.name}`, `Voor: ${contactName}`);
    
    this.saveState();
    this.emit('automations_changed', this.data.automations);
    this.emit('contacts_changed', this.data.contacts);
    this.emit('deals_changed', this.data.deals);
    this.emit('conversations_changed', this.data.conversations);
    this.emit('activities_changed', this.data.activities);

    return executionRecord;
  }

  // --- AI LinkedIn Content Generator Engine ---
  getAIPosts() {
    return this.data.aiPosts || [];
  }

  generateLinkedInContent(specificTarget, specificTopic = null) {
    const targets = ['Bram Verhoeff', 'AgevoDev.nl', 'StudyElite.nl'];
    const target = specificTarget || targets[Math.floor(Math.random() * targets.length)];

    const templatesData = {
      'Bram Verhoeff': [
        {
          topic: 'Founder Journey & Bootstrappen',
          hook: '3 jaar geleden begon ik met coderen vanuit een zolderkamer. Vandaag runnen we onze eigen AI SaaS en bouwen we software voor ambitieuze bedrijven 🚀',
          body: 'Toen ik begon met StudyElite.nl had ik één doel: bewijzen dat je met de juiste tech stack en focus een echt probleem kunt oplossen.\n\nWat ik onderweg heb geleerd als jonge founder:\n1. Perfectie is de vijand van tractie: Bouw snel een MVP, praat met echte gebruikers en itereer wekelijks.\n2. Eigenaarschap boven alles: Wij bouwen bij AgevoDev software alsof het onze eigen startup is. Geen corporate bureaucratie, maar directe impact.\n3. Bouw wat je zelf begrijpt: StudyElite ontstond uit mijn eigen frustratie met inefficiënt studeren. Die passie voelen gebruikers direct in het product.\n\nOndernemen in tech is een marathon. Maar elke dag bouwen aan producten waar duizenden mensen waarde uit halen verveelt nooit.',
          cta: 'Volg mijn reis hier op LinkedIn of connect als je ook bouwt in tech! Connecten mag altijd 👉 https://www.linkedin.com/in/bram-verhoeff/',
          tags: '#BramVerhoeff #FounderJourney #BuildingInPublic #SaaS #Ondernemerschap #TechFounder #AgevoDev #StudyElite'
        },
        {
          topic: 'Tech Stack Keuzes (Next.js & Supabase)',
          hook: 'De grootste fout die ik technische founders zie maken bij het bouwen van hun eerste SaaS 🛠️',
          body: 'Ze besteden 3 maanden aan het ontwerpen van een \'perfecte\' microservice-architectuur op AWS... nog voordat ze 1 betalende klant hebben.\n\nToen ik StudyElite.nl en later projecten voor klanten bij AgevoDev opzette, koos ik bewust voor radicale eenvoud en executiekracht:\n• Next.js 16 App Router: Frontend & backend in één type-safe TypeScript codebase\n• Supabase (PostgreSQL): Direct ingebouwde auth, row-level security en database zonder DevOps hoofdpijn\n• Vercel Edge: Zero-maintenance serverless deployment met sub-100ms laadtijden wereldwijd\n\nResultaat? Binnen 4 weken van een leeg git-repo naar een live, schaalbare SaaS met betalende gebruikers.\n\nTech moet je business versnellen, niet vertragen.',
          cta: 'Aan welke stack bouw jij momenteel? Deel het in de reacties 👇 | Connect met mij op https://www.linkedin.com/in/bram-verhoeff/',
          tags: '#SoftwareEngineering #Nextjs #Supabase #WebDev #TypeScript #SaaSArchitecture #BramVerhoeff #DevCommunity'
        },
        {
          topic: 'Discipline & Productiviteit van een Jonge Founder',
          hook: '"Hoe combineer je studeren met het runnen van een softwarebedrijf?" is de vraag die ik het vaakst krijg 👇',
          body: 'Mijn eerlijke antwoord: niet met 80-urige werkweken of \'grind culture\', maar met meedogenloze systemen en focus.\n\n3 gewoontes die mijn productiviteit verdrievoudigd hebben:\n1. Time-blocking: Mijn ochtenden zijn heilig voor Deep Work (complexe features coderen of strategische keuzes). Geen notificaties, geen mail.\n2. Eet je eigen dogfood: Ik gebruik StudyElite.nl zelf dagelijks om studiestof en deadlines strak te plannen.\n3. Zeg 9 van de 10 keer \'nee\': Focus alleen op de 20% taken die 80% van de klantwaarde en omzet opleveren.\n\nAls jonge ondernemer dwingt tijdsdruk je juist om de slimste en meest efficiënte route te kiezen.',
          cta: 'Herkenbaar voor andere founders of studenten? Hoe bescherm jij je focus? Laat het weten in de comments!',
          tags: '#Productiviteit #Mindset #StudentFounder #DeepWork #Ondernemen #Focus #BramVerhoeff #StudyElite'
        },
        {
          topic: 'Venture Studio Filosofie: Zelf Bouwen vs Uurtje-Factuurtje',
          hook: 'Waarom traditionele softwarebureaus over 5 jaar niet meer bestaan in hun huidige vorm 📉',
          body: 'De meeste traditionele softwarebureaus verkopen uren. Zoveel mogelijk declarabele uren maken op een klantproject, ongeacht of de software converteert of aanslaat.\n\nToen ik AgevoDev oprichtte, wilde ik het tegenovergestelde:\nEen Tech Studio én Venture Builder.\n\nOmdat we zelf eigen SaaS-ventures zoals StudyElite.nl bouwen en opschalen, weten we precies hoe pijnlijk churn is, hoe belangrijk een intuïtieve onboarding is en waarom seconden laadtijd conversie kosten.\n\nAls we voor een klant bouwen, denken we als investeerder en mede-ondernemer mee, niet als uurtje-factuurtje programmeurs. Dat verschil voel je in elke regel code.',
          cta: 'Heb je een tof software-concept of wil je sparren? Mijn DM staat altijd open 👉 https://www.linkedin.com/in/bram-verhoeff/',
          tags: '#AgevoDev #VentureStudio #SoftwareDevelopment #AgencyLife #SaaSFounders #BramVerhoeff #TechNL'
        },
        {
          topic: 'Lessen over Echte AI Integraties in de Praktijk',
          hook: 'De 3 grootste mythes over AI die ik als developer dagelijks tegenkom 🤖',
          body: 'Sinds de opkomst van LLM\'s wil elk bedrijf \'iets met AI\'. Maar 90% van de implementaties die ik voorbij zie komen zijn gimmick-chatbots die na 2 weken vergeten worden.\n\nWat we in de praktijk bij StudyElite en AgevoDev hebben geleerd over echte AI-waarde:\n1. Context is koning: RAG (Retrieval-Augmented Generation) en vector embeddings maken het verschil tussen onzin en pure magie.\n2. Betrouwbaarheid > Creativiteit: In zakelijke software wil je gestructureerde, gevalideerde JSON-outputs en fallbacks, geen hallucinerende essays.\n3. AI moet handelingen overnemen, niet alleen praten: De echte revolutie zit in autonome background workers die data verwerken terwijl jij slaapt.\n\nAI is geen vervanging van goede software-architectuur; het is een hefboom voor goede software-architectuur.',
          cta: 'Hoe zet jij AI momenteel in binnen jouw projecten? Connect met mij op 👉 https://www.linkedin.com/in/bram-verhoeff/',
          tags: '#ArtificialIntelligence #LLM #AIAgents #TechInsights #OpenAI #BramVerhoeff #AgevoDev #Innovation'
        }
      ],
      'StudyElite.nl': [
        {
          topic: 'Studie-efficiëntie & Active Recall',
          hook: 'Studenten besteden gemiddeld 4 uur per dag aan inefficiënt studeren. Dat kan anders 👇',
          body: 'We zien het keer op keer: urenlang markeren in dikke studieboeken en eindeloos samenvattingen overschrijven. Het voelt productief, maar wetenschappelijk onderzoek toont aan dat active recall en spaced repetition tot 3x effectiever zijn voor tentamensucces.\n\nMet StudyElite.nl (onze AI-gedreven educatieve SaaS) helpen we studenten om:\n1. Binnen seconden scherpe samenvattingen en oefenvragen te genereren uit colleges en PDF\'s\n2. Moeilijke concepten direct visueel te begrijpen via de StudyElite AI Copilot\n3. Een dynamisch dag-tot-dag studieschema te volgen dat automatisch meebeweegt wanneer je planning verandert',
          cta: 'Klaar om slimmer te studeren en stressvrij tentamens te halen? Ontdek het platform op 👉 https://studyelite.nl',
          tags: '#StudyElite #EdTech #Studietips #ActiveRecall #Examentips #AIInEducation #StudentLife #Productiviteit'
        },
        {
          topic: 'Tentamens & Nachtrust',
          hook: 'Waarom blokken tot 03:00 uur \'s nachts je tentamencijfer gegarandeerd saboteert 🧠',
          body: 'Slaaptekort verlaagt je geheugenretentie met meer dan 40%. De studenten die tienen halen, werken niet met nachtelijke panieksessies, maar met een geautomatiseerd studiesysteem en een strakke planning.\n\nStudyElite.nl combineert AI-studieassistentie met geavanceerde leermethodologieën (zoals spaced repetition en actieve recall), zodat je in de helft van de tijd klaar bent met je voorbereiding en vol zelfvertrouwen je examenzaal inloopt.',
          cta: 'Bespaar jezelf de tentamennachtmerries. Bekijk hoe het werkt via 👉 https://studyelite.nl',
          tags: '#StudyElite #Studeren #Tentamens #Mindset #HighPerformance #LerenLeren #StudentenNL #EdTech'
        },
        {
          topic: 'AI Study Scheduler & ECTS Tracking',
          hook: 'Nooit meer stress over je ECTS: Hoe onze AI Study Scheduler studenten op koers houdt 📊',
          body: 'Deadlines die tegelijk vallen, onoverzichtelijke syllabi en geen idee waar je moet beginnen. Het overkomt 80% van de studenten in het hoger onderwijs.\n\nOnze AI Scheduler berekent op basis van je tentamendata, pagina-aantallen en eerdere quizresultaten precies wat je vandaag moet doen. Inclusief realtime voorspelling van je slagingskansen.\n\nGebouwd vanuit de praktijk door de engineers van AgevoDev om studeren écht overzichtelijk te maken.',
          cta: 'Probeer het vandaag nog uit via 👉 https://studyelite.nl',
          tags: '#StudyElite #AIPlanner #ECTS #Universiteit #Hogeschool #Studenten #StudySmart #AgevoDev'
        }
      ],
      'AgevoDev.nl': [
        {
          topic: 'Venture Studio & Founder-led Development',
          hook: 'De meeste traditionele softwarebureaus bouwen vanuit theorie. Wij bouwen vanuit de praktijk als SaaS-founders. 👇',
          body: 'Het klassieke softwarebureau-model rammelt:\nJe pitcht een ambitieus idee, een accountmanager schrijft een offerte van 40 pagina\'s, en junior developers bouwen een project dat ze zelf nooit hoeven te onderhouden of te verkopen.\n\nBij AgevoDev (Tech Studio & Venture Builder) pakken we het fundamenteel anders aan:\nWij bouwen niet alleen voor ambitieuze organisaties, we runnen en schalen onze eigen SaaS-bedrijven — zoals ons educatieve AI-platform StudyElite.nl.\n\nWat betekent dat voor de bedrijven die met ons bouwen?\n1. Ondernemersmentaliteit: Code is slechts een middel. We denken proactief mee over je businessmodel, conversie en retentie.\n2. 0% ruis: Direct sparren met senior full-stack engineers, zonder tussenlagen.\n3. Productie-geteste tech stack: Geen trage experimenten, maar beproefde Next.js, Supabase en AI-infrastructuur die pieken moeiteloos aankan.\n\nSoftware moet gebouwd worden alsof het je eigen startup is: snel, robuust en ontworpen voor maximale impact.',
          cta: 'Heb je een concreet SaaS-concept of wil je sparren over schaalbare maatwerk software? Bekijk onze werkwijze via 👉 https://agevodev.nl',
          tags: '#AgevoDev #TechStudio #VentureBuilder #SaaS #SoftwareDevelopment #Nextjs #StartupFounder #StudyElite'
        },
        {
          topic: 'Next.js 16 & Web Platformen vs WordPress/No-Code',
          hook: 'Waarom serieuze digitale platformen WordPress en trage no-code tools achter zich laten ⚡',
          body: 'In de prototypefase is no-code verleidelijk. Maar zodra je serieuze gebruikersaantallen en bedrijfsprocessen moet ondersteunen, loop je tegen de muur:\n❌ Vendor lock-in en onbetaalbare maandelijkse plugin-kosten\n❌ Trage laadtijden die je Google SEO en Core Web Vitals slopen\n❌ Beperkingen in complexe business-logica, multi-tenant auth en maatwerk databases\n\nBij AgevoDev bouwen we 100% maatwerk webplatformen op de modernste enterprise stack van dit moment:\n• Next.js 16 App Router & React 19 met Server-Side Rendering (SSR)\n• Sub-100ms TTFB dankzij slimme Edge caching\n• 100/100 Core Web Vitals voor maximale organische vindbaarheid\n• 100% jouw intellectueel eigendom en schone, modulaire TypeScript code\n\nGeen spaghetti-code of logge templates. Alleen pure, schaalbare software.',
          cta: 'Wil je weten hoe een high-performance Next.js applicatie jouw time-to-market versnelt? Kijk op 👉 https://agevodev.nl',
          tags: '#AgevoDev #Nextjs #React19 #TypeScript #WebDevelopment #Performance #CleanCode #FullStack #TechStudio'
        },
        {
          topic: 'SaaS & MVP Ontwikkeling (Van Idee naar Betalende Klanten)',
          hook: 'Van idee naar een marktklare SaaS met abonnementsmodel in weken in plaats van maanden 🚀',
          body: 'Als makers van StudyElite.nl hebben we de complete SaaS-funnel van A tot Z zelf doorleefd en geoptimaliseerd.\n\nVeel ondernemers met een geniaal software-idee stranden in een ontwikkeltraject van 9+ maanden. Tegen de tijd dat versie 1.0 live staat, is het budget op en de markt veranderd.\n\nBij AgevoDev bouwen we jouw SaaS-MVP direct op enterprise-niveau:\n🔒 Multi-tenant authenticatie met PostgreSQL Row Level Security (RLS) via Supabase\n💳 Geautomatiseerde Stripe & Mollie abonnementsstromen en facturatie\n📊 Realtime analytics dashboards en conversie-funnels\n⚡ Schaalbare serverless hosting op Vercel Edge met 99.98% uptime SLA\n\nZo lanceer je binnen no-time een robuust product waarmee je direct betalende gebruikers kunt onboarden.',
          cta: 'Heb jij een software-idee dat klaar is voor de markt? Plan een vrijblijvende kennismaking via 👉 https://agevodev.nl',
          tags: '#AgevoDev #SaaSDevelopment #MVP #Supabase #Stripe #StartupNL #MicroSaaS #SoftwareBuilder #Nextjs'
        },
        {
          topic: 'Echte AI & Autonome Agents (Voorbij de ChatGPT Hype)',
          hook: 'Stop met simpele chatbots. Dit is hoe échte AI-automatisering er in 2026 uitziet 🧠',
          body: 'Veel bedrijven denken bij AI nog steeds aan een standaard ChatGPT widget op de homepage. Maar de echte bedrijfswaarde zit vele malen dieper:\n\nBij AgevoDev integreren we autonome AI-agents en slimme LLM orchestration (OpenAI & Anthropic Claude) rechtstreeks in je core databases en workflows:\n\n✓ Intelligente Document Analyse: Inkomende documenten, facturen of aanvragen automatisch extraheren, valideren en synchroniseren met je database.\n✓ Vector Embeddings & Semantisch Zoeken: Complexe kennisbanken direct doorzoekbaar maken met vlijmscherpe context.\n✓ Autonome Background Workers: Processen die 24/7 op de achtergrond draaien zonder menselijke frictie of vertraging.\n\nZo transformeer je handmatige, foutgevoelige processen in een zelfsturend digitaal fundament.',
          cta: 'Klaar om te ontdekken welke processen binnen jouw organisatie geoptimaliseerd kunnen worden met AI? Neem contact op 👉 https://agevodev.nl',
          tags: '#AgevoDev #AIInBusiness #AIAgents #MachineLearning #OpenAI #Claude #Automation #EnterpriseTech'
        },
        {
          topic: 'Direct Contact met Engineers & 100% Code Eigendom',
          hook: 'Waarom wij bij AgevoDev bewust géén accountmanagers hebben aangenomen 🤝',
          body: 'Iedereen die wel eens software heeft laten ontwikkelen kent de frustratie:\nJe legt je visie uit aan een accountmanager, die vertaalt het naar een projectmanager, en tegen de tijd dat het bij de programmeur aankomt, is de helft verloren gegaan in ruis.\n\nBij AgevoDev hanteren we één glasheldere regel:\n👉 Je zit direct aan tafel met de senior full-stack engineers die jouw software ontwerpen en programmeren.\n\nDat betekent:\n• 0% ruis op de lijn en razendsnelle iteraties\n• Eerlijk technisch advies: we vertellen je ook wanneer een eenvoudigere oplossing beter en voordeliger is\n• 100% eigendom: alle broncode, datamodellen en intellectueel eigendom worden volledig jouw eigendom (incl. NDA vooraf)\n\nMomenteel hebben we capaciteit voor 1 nieuw maatwerktraject.',
          cta: 'Benieuwd wat we voor jouw platform kunnen betekenen? Plan direct een afspraak in via 👉 https://agevodev.nl',
          tags: '#AgevoDev #SoftwareStudio #FullStackEngineering #Ondernemerschap #Transparantie #NextjsDevelopers'
        }
      ]
    };

    const templates = templatesData[target] || templatesData['Bram Verhoeff'] || templatesData['AgevoDev.nl'];
    let selected;

    if (specificTopic && specificTopic.trim()) {
      const topicLower = specificTopic.toLowerCase();
      const matched = templates.find(t => 
        t.topic.toLowerCase().includes(topicLower) || 
        t.hook.toLowerCase().includes(topicLower) || 
        t.body.toLowerCase().includes(topicLower)
      );

      if (matched) {
        selected = matched;
      } else {
        // Custom topic dynamically drafted in personal or company brand voice
        if (target === 'Bram Verhoeff') {
          selected = {
            topic: specificTopic,
            hook: `Mijn visie als software engineer en founder op ${specificTopic} 👇`,
            body: `In de afgelopen jaren waarin we StudyElite.nl hebben opgeschaald en bij AgevoDev maatwerk platformen hebben gebouwd, zie ik één patroon telkens terugkomen rondom ${specificTopic}:\n\nDe bedrijven die winnen, kiezen niet voor de meeste code of de grootste teams, maar voor de slimste architectuur en meedogenloze focus op gebruikerswaarde.\n\n3 lessen die ik hieruit meeneem:\n1. Focus op impact: codeer alleen wat direct waarde toevoegt.\n2. Bouw modulair met Next.js en Supabase voor maximale wendbaarheid.\n3. Blijf continu in gesprek met je eindgebruikers.\n\nOndernemen in tech blijft elke dag een geweldige leerschool.`,
            cta: `Hoe kijk jij aan tegen ${specificTopic}? Ik hoor graag je gedachten in de reacties of connect via 👉 https://www.linkedin.com/in/bram-verhoeff/`,
            tags: '#BramVerhoeff #FounderLife #SoftwareEngineering #BuildingInPublic #TechFounder #Ondernemen'
          };
        } else if (target === 'AgevoDev.nl') {
          selected = {
            topic: specificTopic,
            hook: `Waarom ${specificTopic} het verschil maakt voor moderne digitale platformen 🚀`,
            body: `In het huidige softwarelandschap winnen de bedrijven die technologische voorsprong omzetten in klantervaring en snelheid.\n\nAls Tech Studio & Venture Builder (en makers van StudyElite.nl) zien we dagelijks hoe ${specificTopic} doorslaggevend is voor schaalbaarheid, performance en conversie.\n\nOnze aanpak bij AgevoDev:\n• 100% maatwerk architectuur in Next.js 16, TypeScript en PostgreSQL/Supabase\n• Geen trage templates of no-code concessies\n• Direct contact met de engineers die de code schrijven\n\nSoftware gebouwd vanuit praktijkervaring als founders, niet vanuit theorie.`,
            cta: `Wil je sparren over ${specificTopic} of een maatwerktraject starten? Neem contact op via 👉 https://agevodev.nl`,
            tags: '#AgevoDev #SoftwareDevelopment #TechStudio #VentureBuilder #Nextjs #SaaS #Innovation'
          };
        } else {
          selected = {
            topic: specificTopic,
            hook: `Hoe studenten met ${specificTopic} tot 3x effectiever studeren 📚`,
            body: `Traditioneel studeren kost bakken met tijd en levert vaak onnodige stress op. Met StudyElite.nl zetten we moderne technologie en AI in rondom ${specificTopic}.\n\nZo houd je grip op je tentamenplanning, verhoog je je retentie en haal je met vertrouwen je ECTS.`,
            cta: `Ervaar het zelf op 👉 https://studyelite.nl`,
            tags: '#StudyElite #Studeren #EdTech #StudyTips #StudentenNL #AI'
          };
        }
      }
    } else {
      selected = templates[Math.floor(Math.random() * templates.length)];
    }

    const fullText = `${selected.hook}\n\n${selected.body}\n\n${selected.cta}\n\n${selected.tags}`;

    const newPost = {
      id: 'post_' + Date.now(),
      target: target,
      topic: selected.topic,
      title: `${target} - ${selected.hook.slice(0, 45)}...`,
      content: fullText,
      status: 'published',
      publishedAt: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: Math.floor(Math.random() * 24) + 8,
      impressions: Math.floor(Math.random() * 450) + 150
    };

    if (!this.data.aiPosts) this.data.aiPosts = [];
    this.data.aiPosts.unshift(newPost);
    if (this.data.aiPosts.length > 30) this.data.aiPosts.pop();

    this.addActivity('share-2', `LinkedIn Post Gepubliceerd (${target})`, selected.hook.slice(0, 50) + '...');
    this.saveState();
    this.emit('ai_posts_changed', this.data.aiPosts);

    return newPost;
  }
}

// Export singleton instance
window.crmState = new StateManager();

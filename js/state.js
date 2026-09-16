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
      name: '🤖 Dagelijkse LinkedIn AI Content Generator (StudyElite.nl & AgevoDev.nl)',
      description: 'Genereert elke ochtend automatisch boeiende LinkedIn berichten met AI over StudyElite.nl en AgevoDev.nl en publiceert deze direct.',
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
            targets: ['StudyElite.nl', 'AgevoDev.nl'],
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
          const targets = step.config?.targets || ['StudyElite.nl', 'AgevoDev.nl'];
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

  generateLinkedInContent(specificTarget) {
    const targets = ['StudyElite.nl', 'AgevoDev.nl'];
    const target = specificTarget || targets[Math.floor(Math.random() * targets.length)];

    const templatesData = {
      'StudyElite.nl': [
        {
          hook: 'Studenten besteden gemiddeld 4 uur per dag aan inefficiënt studeren. Dat kan anders 👇',
          body: 'We zien het keer op keer: urenlang markeren in dikke studieboeken en eindeloos samenvattingen overschrijven. Het voelt productief, maar wetenschappelijk onderzoek toont aan dat active recall en slimme herhaling tot 3x effectiever zijn.\n\nMet StudyElite.nl helpen we studenten om:\n1. Binnen minuten gestructureerde samenvattingen en examenvragen te genereren\n2. Moeilijke concepten direct visueel te begrijpen\n3. Meer tijd over te houden voor ontspanning zonder studiestress',
          cta: 'Klaar om slimmer te leren en betere cijfers te halen? Neem een kijkje op 👉 https://studyelite.nl',
          tags: '#StudyElite #Studietips #Examentips #Onderwijs #Productiviteit #StudentLife #ActiveRecall'
        },
        {
          hook: 'Waarom blokken tot 03:00 uur \'s nachts je tentamencijfer saboteert 🧠',
          body: 'Slaaptekort verlaagt je geheugenretentie met meer dan 40%. De studenten die tienen halen, werken met een geautomatiseerd studiesysteem en een strakke planning.\n\nStudyElite.nl combineert slimme AI-studieassistentie met beproefde leermethodes, zodat je in de helft van de tijd klaar bent met je voorbereiding.',
          cta: 'Bespaar jezelf de tentamennachtmerries. Ontdek het platform op 👉 https://studyelite.nl',
          tags: '#StudyElite #Studenten #Studeren #Tentamens #Mindset #HighPerformance #LerenLeren'
        }
      ],
      'AgevoDev.nl': [
        {
          hook: 'Verliest jouw team nog steeds uren per week aan handmatige administratie en copy-paste werk? 🚀',
          body: 'Veel groeiende bedrijven lopen vast op verouderde software of 10 verschillende losse tools die niet met elkaar communiceren. Het resultaat: dubbel werk, gemiste leads en gefrustreerde medewerkers.\n\nBij AgevoDev.nl bouwen we:\n• Maatwerk CRM- & workflow automatiseringssystemen\n• Schaalbare web- en mobiele applicaties\n• Slimme AI-koppelingen die je bedrijfsprocessen 24/7 laten draaien',
          cta: 'Wil je ontdekken hoeveel uur jouw team kan besparen met maatwerk software? Plan een vrijblijvend adviesgesprek via 👉 https://agevodev.nl',
          tags: '#AgevoDev #SoftwareDevelopment #Automatisering #SaaS #AIInBusiness #WebApps #DigitalScaling'
        },
        {
          hook: '3 CRM-automatiseringen die onze klanten direct 12+ uur per week besparen ⏱️',
          body: '1. Instant Lead Follow-up: Binnen 60 seconden contact opnemen via SMS en e-mail zodra een formulier binnenkomt.\n2. No-show Preventie: Automatische herinneringen voor afspraken met slimme rescheduling links.\n3. Klant-onboarding Drip: Facturatie, welkomstmail en taaktoewijzing volledig hands-free zodra een deal gesloten is.\n\nSoftware moet vóór je werken, niet tegen je.',
          cta: 'Klaar om jouw verkoopcyclus te versnellen? Bekijk onze cases op 👉 https://agevodev.nl',
          tags: '#AgevoDev #WorkflowAutomation #CRM #GoHighLevel #BusinessAutomation #CustomSoftware #Agency'
        }
      ]
    };

    const templates = templatesData[target] || templatesData['AgevoDev.nl'];
    const selected = templates[Math.floor(Math.random() * templates.length)];
    const fullText = `${selected.hook}\n\n${selected.body}\n\n${selected.cta}\n\n${selected.tags}`;

    const newPost = {
      id: 'post_' + Date.now(),
      target: target,
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

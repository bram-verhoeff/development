/* ==========================================================================
   POKÉMON TCG 30TH CELEBRATION ETB LIVE HUNTER - CLIENT CONTROLLER
   Author: Bram Verhoeff
   ========================================================================== */

(function () {
  'use strict';

  // State
  let targets = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let soundEnabled = true;
  let notificationsEnabled = false;
  let scanIntervalSeconds = 30;
  let countdownTimer = null;
  let countdownRemaining = 30;
  let eventSource = null;
  let audioCtx = null;

  // DOM Elements
  const storesContainer = document.getElementById('stores-container');
  const activityLogList = document.getElementById('activity-log-list');
  const statTotalStores = document.getElementById('stat-total-stores');
  const statInStock = document.getElementById('stat-in-stock');
  const statPreOrders = document.getElementById('stat-pre-orders');
  const statCountdown = document.getElementById('stat-countdown');
  const statLastScan = document.getElementById('stat-last-scan');
  const scanIndicatorText = document.getElementById('scan-indicator-text');
  const scanBtnText = document.getElementById('scan-btn-text');
  const btnManualScan = document.getElementById('btn-manual-scan');
  const btnTestDrop = document.getElementById('btn-test-drop');
  const btnAddTarget = document.getElementById('btn-add-target');
  const intervalSelect = document.getElementById('interval-select');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnTestSound = document.getElementById('btn-test-sound');
  const btnToggleNotifications = document.getElementById('btn-toggle-notifications');
  const btnClearLogs = document.getElementById('btn-clear-logs');
  const searchInput = document.getElementById('search-input');
  const filterPills = document.querySelectorAll('.pill-btn');

  // Counts
  const filterCountAll = document.getElementById('filter-count-all');
  const filterCountInStock = document.getElementById('filter-count-instock');
  const filterCountPreOrder = document.getElementById('filter-count-preorder');
  const filterCountOutOfStock = document.getElementById('filter-count-outofstock');

  // Modal Elements
  const modalAddTarget = document.getElementById('modal-add-target');
  const formAddTarget = document.getElementById('form-add-target');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');

  // Drop Alert Banner
  const dropAlertBanner = document.getElementById('drop-alert-banner');
  const dropBannerTitle = document.getElementById('drop-banner-title');
  const dropBannerDesc = document.getElementById('drop-banner-desc');
  const dropBannerLink = document.getElementById('drop-banner-link');
  const dropBannerDismiss = document.getElementById('drop-banner-dismiss');

  // =========================================================================
  // Web Audio Synthesizer (Fanfare / Drop Chime)
  // =========================================================================
  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playAlertSound() {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const now = audioCtx.currentTime;
      // High-energy 8-bit / modern fanfare melody: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
      const notes = [
        { freq: 523.25, time: now + 0.00, dur: 0.12 },
        { freq: 659.25, time: now + 0.12, dur: 0.12 },
        { freq: 783.99, time: now + 0.24, dur: 0.12 },
        { freq: 1046.50, time: now + 0.36, dur: 0.35 }
      ];

      notes.forEach(n => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, n.time);

        gain.gain.setValueAtTime(0.3, n.time);
        gain.gain.exponentialRampToValueAtTime(0.001, n.time + n.dur);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(n.time);
        osc.stop(n.time + n.dur);
      });
    } catch (e) {
      console.warn('[AUDIO] Kan geluid niet afspelen:', e);
    }
  }

  // =========================================================================
  // Desktop Push Notifications
  // =========================================================================
  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      alert('Deze browser ondersteunt geen bureaubladnotificaties.');
      return;
    }
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationsEnabled = true;
        updateNotificationUI();
        showNotification('Meldingen Geactiveerd!', {
          body: 'Je ontvangt nu direct een melding wanneer de Pokémon 30th ETB online komt!'
        });
      } else {
        notificationsEnabled = false;
        updateNotificationUI();
      }
    });
  }

  function showNotification(title, options) {
    if (!notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    try {
      new Notification(title, {
        icon: 'assets/logo.png',
        badge: 'assets/logo.png',
        ...options
      });
    } catch (e) {
      console.warn('[NOTIF] Notificatie tonen mislukt:', e);
    }
  }

  function updateNotificationUI() {
    if (notificationsEnabled) {
      btnToggleNotifications.classList.add('active');
      document.getElementById('notif-icon').textContent = '🔔';
    } else {
      btnToggleNotifications.classList.remove('active');
      document.getElementById('notif-icon').textContent = '🔕';
    }
  }

  // =========================================================================
  // SSE Connection & Live Stream
  // =========================================================================
  function setupSSE() {
    if (eventSource) {
      eventSource.close();
    }

    eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      scanIndicatorText.textContent = 'Verbonden met live server stream';
      scanIndicatorText.style.color = 'var(--text-muted)';
    };

    eventSource.onerror = (err) => {
      scanIndicatorText.textContent = 'Verbinding herstellen...';
      scanIndicatorText.style.color = 'var(--warning-amber)';
    };

    // Message handler for initial connection
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') {
          targets = data.targets || [];
          if (data.config && data.config.scanIntervalSeconds) {
            scanIntervalSeconds = data.config.scanIntervalSeconds;
            intervalSelect.value = scanIntervalSeconds;
            countdownRemaining = scanIntervalSeconds;
          }
          render();
        }
      } catch (err) {}
    };

    // Specific SSE Events
    eventSource.addEventListener('target_updated', (e) => {
      const updatedTarget = JSON.parse(e.data);
      const index = targets.findIndex(t => t.id === updatedTarget.id);
      if (index !== -1) {
        targets[index] = updatedTarget;
      } else {
        targets.push(updatedTarget);
      }
      render();
    });

    eventSource.addEventListener('target_status_change', (e) => {
      const data = JSON.parse(e.data);
      const target = targets.find(t => t.id === data.id);
      if (target) {
        target.status = data.status;
        render();
      }
    });

    eventSource.addEventListener('target_added', (e) => {
      const target = JSON.parse(e.data);
      if (!targets.some(t => t.id === target.id)) {
        targets.push(target);
      }
      render();
    });

    eventSource.addEventListener('target_removed', (e) => {
      const data = JSON.parse(e.data);
      targets = targets.filter(t => t.id !== data.id);
      render();
    });

    eventSource.addEventListener('stock_alert', (e) => {
      const alertData = JSON.parse(e.data);
      handleStockAlert(alertData);
    });

    eventSource.addEventListener('scan_started', (e) => {
      scanBtnText.textContent = 'Scannen...';
      btnManualScan.classList.add('loading');
      scanIndicatorText.textContent = 'Scanronde actief...';
    });

    eventSource.addEventListener('scan_completed', (e) => {
      const data = JSON.parse(e.data);
      scanBtnText.textContent = 'Scan Nu';
      btnManualScan.classList.remove('loading');
      scanIndicatorText.textContent = `Laatste ronde voltooid om ${new Date().toLocaleTimeString('nl-NL')}`;
      statLastScan.textContent = `Laatste scan: ${new Date().toLocaleTimeString('nl-NL')}`;
      countdownRemaining = scanIntervalSeconds;
      render();
    });

    eventSource.addEventListener('log', (e) => {
      const logEntry = JSON.parse(e.data);
      addLogItem(logEntry);
    });
  }

  // =========================================================================
  // Stock Alert Handler (Banner, Sound, Notification)
  // =========================================================================
  function handleStockAlert(alertData) {
    const target = alertData.target;
    const isSim = alertData.isSimulation;

    // 1. Play Sound
    playAlertSound();

    // 2. Show Banner
    dropBannerTitle.textContent = isSim ? `🔥 [SIMULATIE] ${target.name}: IN VOORRAAD!` : `🚨 ${target.name}: DIRECT LEVERBAAR!`;
    dropBannerDesc.textContent = `${target.productTitle || 'Pokémon TCG 30th ETB'} ${target.price ? '(' + target.price + ')' : ''} - Grijp je kans voor het weg is!`;
    dropBannerLink.href = target.url;
    dropAlertBanner.classList.remove('hidden');

    // 3. Desktop Notification
    showNotification(`🚨 Pokémon 30th ETB Beschikbaar bij ${target.name}!`, {
      body: `Prijs: ${target.price || 'Onbekend'}. Klik direct om te bestellen!`,
      data: { url: target.url }
    });
  }

  // =========================================================================
  // Activity Log Renderer
  // =========================================================================
  function addLogItem(log) {
    if (activityLogList.querySelector('.log-empty')) {
      activityLogList.innerHTML = '';
    }

    const item = document.createElement('div');
    item.className = `log-item log-${log.type}`;

    const time = new Date(log.timestamp).toLocaleTimeString('nl-NL');
    item.innerHTML = `
      <span class="log-time">${time}</span>
      <span class="log-msg">${escapeHtml(log.message)}</span>
    `;

    activityLogList.insertBefore(item, activityLogList.firstChild);

    // Keep max 80 elements in DOM
    while (activityLogList.children.length > 80) {
      activityLogList.removeChild(activityLogList.lastChild);
    }
  }

  // =========================================================================
  // Countdown Timer
  // =========================================================================
  function startCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      countdownRemaining--;
      if (countdownRemaining <= 0) {
        countdownRemaining = scanIntervalSeconds;
        statCountdown.textContent = 'Scant...';
      } else {
        statCountdown.textContent = `${countdownRemaining}s`;
      }
    }, 1000);
  }

  // =========================================================================
  // Rendering
  // =========================================================================
  function render() {
    updateStats();
    renderStores();
  }

  function updateStats() {
    const total = targets.length;
    const inStock = targets.filter(t => t.inStock).length;
    const preOrder = targets.filter(t => t.isPreOrder).length;
    const outOfStock = targets.filter(t => !t.inStock && !t.isPreOrder).length;

    statTotalStores.textContent = total;
    statInStock.textContent = inStock;
    statPreOrders.textContent = preOrder;

    filterCountAll.textContent = total;
    filterCountInStock.textContent = inStock;
    filterCountPreOrder.textContent = preOrder;
    filterCountOutOfStock.textContent = outOfStock;
  }

  function renderStores() {
    if (!storesContainer) return;

    // Filter targets
    let filtered = targets.filter(t => {
      // Filter pills
      if (currentFilter === 'in_stock' && !t.inStock) return false;
      if (currentFilter === 'pre_order' && !t.isPreOrder) return false;
      if (currentFilter === 'out_of_stock' && (t.inStock || t.isPreOrder)) return false;

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = t.name.toLowerCase().includes(q);
        const matchTitle = (t.productTitle || '').toLowerCase().includes(q);
        const matchRegion = (t.region || '').toLowerCase().includes(q);
        if (!matchName && !matchTitle && !matchRegion) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      storesContainer.innerHTML = `
        <div class="loading-state">
          <p>Geen winkels gevonden die voldoen aan het huidige filter.</p>
        </div>
      `;
      return;
    }

    // Sort: In Stock first, then Pre-order, then by Name
    filtered.sort((a, b) => {
      if (a.inStock && !b.inStock) return -1;
      if (!a.inStock && b.inStock) return 1;
      if (a.isPreOrder && !b.isPreOrder) return -1;
      if (!a.isPreOrder && b.isPreOrder) return 1;
      return a.name.localeCompare(b.name);
    });

    storesContainer.innerHTML = filtered.map(t => createStoreCardHtml(t)).join('');

    // Attach event listeners to card buttons
    attachCardListeners();
  }

  function createStoreCardHtml(target) {
    const statusMap = {
      'in_stock': { label: 'In Voorraad', class: 'badge-in_stock' },
      'pre_order': { label: 'Pre-order', class: 'badge-pre_order' },
      'out_of_stock': { label: 'Uitverkocht', class: 'badge-out_of_stock' },
      'checking': { label: 'Scannen...', class: 'badge-checking' },
      'rate_limited': { label: 'Bot-Check', class: 'badge-rate_limited' },
      'error': { label: 'Fout', class: 'badge-error' },
      'unknown': { label: 'Onbekend', class: 'badge-unknown' }
    };

    const statusInfo = statusMap[target.status] || statusMap['unknown'];
    const lastCheckStr = target.lastChecked ? formatTimeAgo(new Date(target.lastChecked)) : 'Nog niet gescand';

    return `
      <div class="store-card status-${target.status}" data-id="${target.id}">
        <div>
          <div class="card-top">
            <div class="store-info">
              <div class="store-name-row">
                <span class="store-name">${escapeHtml(target.name)}</span>
                <span class="region-pill">${escapeHtml(target.region || 'NL')}</span>
              </div>
              <span class="product-label">${escapeHtml(target.productTitle || 'Pokémon 30th ETB')}</span>
            </div>
            <div class="status-badge ${statusInfo.class}">
              <span class="status-badge-dot"></span>
              <span>${statusInfo.label}</span>
            </div>
          </div>

          <div class="card-body">
            <div class="price-row">
              ${target.price ? `<span class="price-val">${escapeHtml(target.price)}</span>` : `<span class="price-val price-unknown">Prijs n.b.</span>`}
            </div>
            <p class="status-details">${escapeHtml(target.details || 'Geen details beschikbaar')}</p>
            <div class="last-checked">Laatste check: ${lastCheckStr}</div>
          </div>
        </div>

        <div class="card-actions">
          <a href="${escapeHtml(target.url)}" target="_blank" rel="noopener noreferrer" class="btn-buy" title="Open winkelpagina">
            <span>Direct Kopen</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>

          <button class="btn-icon-only btn-delete" data-id="${target.id}" title="Winkel verwijderen">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  function attachCardListeners() {
    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const target = targets.find(t => t.id === id);
        if (!target) return;
        if (confirm(`Weet je zeker dat je ${target.name} wilt verwijderen uit de lijst?`)) {
          fetch(`/api/targets/${id}`, { method: 'DELETE' });
        }
      });
    });
  }

  // =========================================================================
  // Helpers
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return 'zojuist';
    if (seconds < 60) return `${seconds}s geleden`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m geleden`;
    return date.toLocaleTimeString('nl-NL');
  }

  // =========================================================================
  // UI Event Listeners
  // =========================================================================
  function initListeners() {
    // Manual Scan Button
    btnManualScan.addEventListener('click', () => {
      fetch('/api/scan', { method: 'POST' });
    });

    // Test Drop Button
    btnTestDrop.addEventListener('click', () => {
      initAudio();
      fetch('/api/test-drop', { method: 'POST' });
    });

    // Sound Toggle & Test
    btnToggleSound.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      btnToggleSound.classList.toggle('active', soundEnabled);
      document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
    });

    btnTestSound.addEventListener('click', () => {
      initAudio();
      playAlertSound();
    });

    // Notifications Toggle
    btnToggleNotifications.addEventListener('click', () => {
      if (!notificationsEnabled) {
        requestNotificationPermission();
      } else {
        notificationsEnabled = false;
        updateNotificationUI();
      }
    });

    // Filter Pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.getAttribute('data-filter');
        renderStores();
      });
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderStores();
    });

    // Scan Interval Select
    intervalSelect.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      scanIntervalSeconds = val;
      countdownRemaining = val;
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanIntervalSeconds: val })
      });
    });

    // Modal Add Target
    btnAddTarget.addEventListener('click', () => {
      modalAddTarget.classList.remove('hidden');
      document.getElementById('input-store-name').focus();
    });

    const closeModal = () => modalAddTarget.classList.add('hidden');
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    formAddTarget.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('input-store-name').value.trim();
      const url = document.getElementById('input-store-url').value.trim();
      const region = document.getElementById('select-store-region').value;
      const productTitle = document.getElementById('input-product-title').value.trim();

      if (!name || !url) return;

      fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url, region, productTitle })
      }).then(res => {
        if (res.ok) {
          formAddTarget.reset();
          closeModal();
        } else {
          alert('Fout bij toevoegen winkel');
        }
      });
    });

    // Drop Banner Dismiss
    dropBannerDismiss.addEventListener('click', () => {
      dropAlertBanner.classList.add('hidden');
    });

    // Clear Logs Button
    btnClearLogs.addEventListener('click', () => {
      activityLogList.innerHTML = '<div class="log-empty">Log gewist</div>';
    });
  }

  // =========================================================================
  // Initial Boot
  // =========================================================================
  function init() {
    initListeners();
    setupSSE();
    startCountdown();

    // Fetch initial targets immediately via REST
    fetch('/api/targets')
      .then(res => res.json())
      .then(data => {
        if (data.targets && data.targets.length) {
          targets = data.targets;
          render();
        }
      })
      .catch(err => console.warn('[INIT] REST fetch error:', err));
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

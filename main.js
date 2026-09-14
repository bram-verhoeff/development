/**
 * Beach House The Coast - Interactive Coastal Web Experience (Ultimate Edition)
 * Includes ambient ocean sound synth, live tides/status, seasonal switcher,
 * instant menu search, dietary filters, event calculator & calendar tickets.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initStickyHeader();
  initMobileNav();
  initHeroSlider();
  initLiveCoastalIntelligence();
  initAmbientOceanSynth();
  initSeasonalSwitcher();
  initMenuSystem();
  initEventCalculator();
  initGalleryLightbox();
  initFaqAccordion();
  initModals();
  initDefaultDates();
});

/* ==========================================================================
   SCROLL PROGRESS BAR
   ========================================================================== */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgressBar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / (docHeight || 1)) * 100;
    bar.style.width = `${progress}%`;
  }, { passive: true });
}

/* ==========================================================================
   STICKY HEADER & SCROLL BEHAVIOR
   ========================================================================== */
function initStickyHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

/* ==========================================================================
   MOBILE NAVIGATION
   ========================================================================== */
function initMobileNav() {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  nav.querySelectorAll('.nav-link, .btn').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ==========================================================================
   IMMERSIVE HERO SLIDER
   Full-screen multi-slide crossfade with Ken Burns zoom, autoplay,
   touch swipe, keyboard navigation & progress synchronization
   ========================================================================== */
function initHeroSlider() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('#heroDots .hero-dot');
  const prevBtn = document.getElementById('heroPrevBtn');
  const nextBtn = document.getElementById('heroNextBtn');

  if (slides.length === 0) return;

  let currentIndex = 0;
  let autoplayTimer = null;
  const slideDuration = 6500; // 6.5 seconds

  function showSlide(index) {
    // Wrap index safely
    if (index < 0) {
      currentIndex = slides.length - 1;
    } else if (index >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }

    // Toggle active slide
    slides.forEach((slide, i) => {
      if (i === currentIndex) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    // Toggle active dot
    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    resetAutoplay();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      showSlide(currentIndex + 1);
    }, slideDuration);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function resetAutoplay() {
    startAutoplay();
  }

  // Arrow Clicks
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      showSlide(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      showSlide(currentIndex + 1);
    });
  }

  // Dot Clicks
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
    });
  });

  // Pause on hover
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);

  // Keyboard navigation when near top of page
  window.addEventListener('keydown', (e) => {
    if (window.scrollY < 600) {
      if (e.key === 'ArrowLeft') {
        showSlide(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        showSlide(currentIndex + 1);
      }
    }
  });

  // Touch Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swiped Left -> Next
      showSlide(currentIndex + 1);
    } else if (touchEndX > touchStartX + swipeThreshold) {
      // Swiped Right -> Prev
      showSlide(currentIndex - 1);
    }
  }

  // Initialize first slide and start timer
  showSlide(0);
}

/* ==========================================================================
   LIVE COASTAL INTELLIGENCE & OPENING HOURS
   ========================================================================== */
function initLiveCoastalIntelligence() {
  const statusText = document.getElementById('liveStatusText');
  const statusDot = document.getElementById('liveStatusDot');
  const greeting = document.getElementById('heroGreeting');
  const hoursList = document.getElementById('openingHoursList');

  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon ...
  const hour = now.getHours();
  const currentMinutes = hour * 60 + now.getMinutes();

  // Dynamic Time-of-Day Greeting
  if (greeting) {
    if (hour >= 5 && hour < 12) {
      greeting.textContent = 'Goedemorgen aan het strand';
    } else if (hour >= 12 && hour < 18) {
      greeting.textContent = 'Goedemiddag aan de kust';
    } else if (hour >= 18 && hour < 23) {
      greeting.textContent = 'Goedenavond bij zonsondergang';
    } else {
      greeting.textContent = 'Goedenacht aan zee';
    }
  }

  // Highlight Today in Footer
  if (hoursList) {
    const todayItem = hoursList.querySelector(`li[data-day="${day}"]`);
    if (todayItem) {
      todayItem.classList.add('today');
      const firstSpan = todayItem.querySelector('span:first-child');
      if (firstSpan && !firstSpan.innerHTML.includes('(Vandaag)')) {
        firstSpan.innerHTML += ' <em>(Vandaag)</em>';
      }
    }
  }

  // Schedule: Mon-Fri: 10:30 (630) - 21:00 (1260), Sat-Sun: 10:00 (600) - 21:00 (1260)
  const isWeekend = (day === 0 || day === 6);
  const openMinutes = isWeekend ? 600 : 630;
  const closeMinutes = 1260;

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    if (statusText) statusText.textContent = 'Nu Geopend tot 21:00';
    if (statusDot) statusDot.classList.remove('closed');
  } else {
    const nextOpen = isWeekend ? '10:00' : '10:30';
    if (statusText) statusText.textContent = `Momenteel Gesloten &bull; Open om ${nextOpen}`;
    if (statusDot) statusDot.classList.add('closed');
  }
}

/* ==========================================================================
   AMBIENT OCEAN SOUND SYNTHESIZER (Web Audio API)
   Synthesizes a relaxing, natural ocean wave swell without audio files
   ========================================================================== */
let audioCtx = null;
let waveGain = null;
let isAudioPlaying = false;
let waveInterval = null;

function initAmbientOceanSynth() {
  const btn = document.getElementById('soundToggleBtn');
  const btnText = document.getElementById('soundBtnText');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!isAudioPlaying) {
      startOceanSound();
      isAudioPlaying = true;
      btn.classList.add('playing');
      if (btnText) btnText.textContent = 'Golven aan';
    } else {
      stopOceanSound();
      isAudioPlaying = false;
      btn.classList.remove('playing');
      if (btnText) btnText.textContent = 'Zeegeluid';
    }
  });
}

function startOceanSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Create Pink Noise Buffer
    const bufferSize = audioCtx.sampleRate * 4;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.04; // Gentle volume
      b6 = white * 0.115926;
    }

    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Lowpass filter for deep ocean rumble
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, audioCtx.currentTime);

    // Dynamic wave swell gain
    waveGain = audioCtx.createGain();
    waveGain.gain.setValueAtTime(0.01, audioCtx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(audioCtx.destination);
    whiteNoise.start();

    // Wave swell rhythm simulation (every 4.5 seconds)
    function swellWave() {
      if (!waveGain) return;
      const t = audioCtx.currentTime;
      waveGain.gain.cancelScheduledValues(t);
      waveGain.gain.setValueAtTime(waveGain.gain.value, t);
      waveGain.gain.exponentialRampToValueAtTime(0.18, t + 2.2);
      waveGain.gain.exponentialRampToValueAtTime(0.02, t + 4.5);
    }

    swellWave();
    waveInterval = setInterval(swellWave, 4600);
  } catch (e) {
    console.warn('Web Audio niet ondersteund in deze browser:', e);
  }
}

function stopOceanSound() {
  if (waveInterval) clearInterval(waveInterval);
  if (waveGain && audioCtx) {
    waveGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  }
}

/* ==========================================================================
   4-SEASONS INTERACTIVE SWITCHER
   ========================================================================== */
const SEASONS_DATA = {
  lente: {
    title: 'Lente: Eerste strandzon & verse seizoensproducten',
    desc: 'Als de zon doorbreekt gaan de puien wagenwijd open. Geniet van de eerste warme terrasdagen, dagverse asperges en verfrissende spritzes met uitzicht op de kitesurfers bij de Zandmotor.',
    img: 'assets/terrace.jpg'
  },
  zomer: {
    title: 'Zomer: Bruisende stranddagen, cocktails & beach barbecues',
    desc: 'De geur van de zee, relaxte loungemuziek en zonsondergangen die de hele lucht goud kleuren. Geniet op ons ruime zonneterras van verse vis, koude bieren en zomerse bites.',
    img: 'assets/sunset-terrace.jpg'
  },
  herfst: {
    title: 'Herfst: Uitwaaien bij de Zandmotor & knus binnen tafelen',
    desc: 'Wandel met je hond over het ruige strand en warm binnen op bij de sfeervolle open haard. Tijd voor stoofgerechten, volle rode wijnen en woeste golven op palen.',
    img: 'assets/exterior-stilts.jpg'
  },
  winter: {
    title: 'Winter: Magische rust, warme chocolademelk & glühwein',
    desc: 'Geniet van het serene winterpanorama over de zee. Binnen zit je behaaglijk warm met ambachtelijk appelgebak, warme dranken en een intiem diner met kaarslicht.',
    img: 'assets/interior.jpg'
  }
};

function initSeasonalSwitcher() {
  const btns = document.querySelectorAll('.season-btn');
  const box = document.getElementById('seasonContent');
  const mainImg = document.getElementById('aboutMainImg');
  if (!box || !btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const seasonKey = btn.getAttribute('data-season');
      const data = SEASONS_DATA[seasonKey];
      if (!data) return;

      box.style.opacity = '0';
      setTimeout(() => {
        box.innerHTML = `<h4>${data.title}</h4><p>${data.desc}</p>`;
        box.style.transition = 'opacity 0.3s ease';
        box.style.opacity = '1';
        if (mainImg) mainImg.src = data.img;
      }, 150);
    });
  });
}

/* ==========================================================================
   MENU SYSTEM: SEARCH, CATEGORIES & DIETARY FILTERS
   ========================================================================== */
function initMenuSystem() {
  const searchInput = document.getElementById('menuSearchInput');
  const categoryBtns = document.querySelectorAll('.menu-tab-btn');
  const dietBtns = document.querySelectorAll('.diet-toggle-btn');
  const cards = document.querySelectorAll('.menu-card');

  let activeCategory = 'all';
  let activeDiet = 'all';
  let searchTerm = '';

  function filterMenu() {
    cards.forEach(card => {
      const cardCat = card.getAttribute('data-category') || '';
      const cardDiet = (card.getAttribute('data-diet') || '').split(/\s+/);
      const title = (card.querySelector('.menu-card-title')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('.menu-card-desc')?.textContent || '').toLowerCase();
      const ingredients = (card.querySelector('.menu-card-ingredients')?.textContent || '').toLowerCase();

      const matchCat = (activeCategory === 'all' || cardCat === activeCategory);
      const matchDiet = (activeDiet === 'all' || cardDiet.includes(activeDiet));
      const matchSearch = (!searchTerm || 
                           title.includes(searchTerm) || 
                           desc.includes(searchTerm) || 
                           ingredients.includes(searchTerm));

      if (matchCat && matchDiet && matchSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Category Tabs
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      filterMenu();
    });
  });

  // Dietary Toggles
  dietBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dietBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDiet = btn.getAttribute('data-diet');
      filterMenu();
    });
  });

  // Search Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.trim().toLowerCase();
      filterMenu();
    });
  }
}

/* ==========================================================================
   EVENT CALCULATOR
   ========================================================================== */
function initEventCalculator() {
  const rangeInput = document.getElementById('calcRangeGuests');
  const guestDisplay = document.getElementById('calcGuestCount');
  const priceDisplay = document.getElementById('calcPricePerPerson');
  const totalDisplay = document.getElementById('calcTotalPrice');

  const optBbq = document.getElementById('calcOptBbq');
  const optBar = document.getElementById('calcOptBar');
  const optCocktails = document.getElementById('calcOptCocktails');
  const optActivity = document.getElementById('calcOptActivity');

  if (!rangeInput || !priceDisplay) return;

  function recalculate() {
    const guests = parseInt(rangeInput.value, 10);
    guestDisplay.textContent = guests;

    let perPerson = 0;
    if (optBbq && optBbq.checked) perPerson += 38.50;
    if (optBar && optBar.checked) perPerson += 26.00;
    if (optCocktails && optCocktails.checked) perPerson += 9.50;
    if (optActivity && optActivity.checked) perPerson += 25.00;

    if (perPerson === 0) perPerson = 25.00;

    const total = Math.round(guests * perPerson);

    priceDisplay.textContent = `€ ${Math.round(perPerson)},-`;
    totalDisplay.textContent = `Totaal indicatie: ca. € ${total.toLocaleString('nl-NL')},-`;
  }

  rangeInput.addEventListener('input', recalculate);
  [optBbq, optBar, optCocktails, optActivity].forEach(cb => {
    if (cb) cb.addEventListener('change', recalculate);
  });

  recalculate();
}

/* ==========================================================================
   GALLERY LIGHTBOX WITH KEYBOARD NAVIGATION
   ========================================================================== */
function initGalleryLightbox() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const items = Array.from(document.querySelectorAll('.gallery-item'));
  const modal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');

  let currentIndex = 0;

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      items.forEach(item => {
        const itemCat = item.getAttribute('data-category');
        item.style.display = (filter === 'all' || itemCat === filter) ? 'block' : 'none';
      });
    });
  });

  function showImage(index) {
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;
    currentIndex = index;

    const item = items[currentIndex];
    const src = item.getAttribute('data-img');
    const caption = item.getAttribute('data-caption') || '';

    if (lightboxImg) lightboxImg.src = src;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (modal) modal.classList.add('active');
  }

  items.forEach((item, idx) => {
    item.addEventListener('click', () => showImage(idx));
  });

  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('active')) return;
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
  });
}

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    if (!header) return;

    header.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      faqItems.forEach(i => i.classList.remove('active'));
      if (!isOpen) item.classList.add('active');
    });
  });
}

/* ==========================================================================
   MODALS (BOOKING, QUOTE, CONFIRMATION TICKET)
   ========================================================================== */
let lastBookingData = null;

function initModals() {
  const bookingModal = document.getElementById('bookingModal');
  const quoteModal = document.getElementById('quoteModal');
  const lightboxModal = document.getElementById('lightboxModal');
  const ticketCloseBtn = document.getElementById('ticketCloseBtn');
  const downloadCalBtn = document.getElementById('downloadCalBtn');

  // Open triggers
  document.querySelectorAll('.open-booking-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      resetBookingModal();
      if (bookingModal) bookingModal.classList.add('active');
    });
  });

  document.querySelectorAll('.open-quote-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (quoteModal) quoteModal.classList.add('active');
    });
  });

  // Close triggers
  const allModals = [bookingModal, quoteModal, lightboxModal];
  allModals.forEach(modal => {
    if (!modal) return;
    const closeBtn = modal.querySelector('.modal-close-btn');
    const backdrop = modal.querySelector('.modal-backdrop');

    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (backdrop) backdrop.addEventListener('click', () => modal.classList.remove('active'));
  });

  if (ticketCloseBtn && bookingModal) {
    ticketCloseBtn.addEventListener('click', () => bookingModal.classList.remove('active'));
  }

  if (downloadCalBtn) {
    downloadCalBtn.addEventListener('click', () => {
      if (lastBookingData) downloadIcsCalendar(lastBookingData);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      allModals.forEach(m => m && m.classList.remove('active'));
    }
  });
}

function resetBookingModal() {
  const formWrap = document.getElementById('bookingFormWrapper');
  const ticketCard = document.getElementById('bookingTicketCard');
  if (formWrap) formWrap.style.display = 'block';
  if (ticketCard) ticketCard.style.display = 'none';
}

/* Set default minimum booking dates */
function initDefaultDates() {
  const today = new Date().toISOString().split('T')[0];
  const bookDate = document.getElementById('bookDate');
  const quoteDate = document.getElementById('quoteDate');

  if (bookDate) {
    bookDate.min = today;
    bookDate.value = today;
  }
  if (quoteDate) quoteDate.min = today;
}

/* ==========================================================================
   FORM SUBMISSIONS & CALENDAR ICS EXPORT
   ========================================================================== */
window.handleBookingSubmit = function(event) {
  event.preventDefault();

  const name = document.getElementById('bookName').value;
  const date = document.getElementById('bookDate').value;
  const time = document.getElementById('bookTime').value;
  const guests = document.getElementById('bookGuests').value;

  lastBookingData = { name, date, time, guests };

  // Show ticket confirmation inside modal
  const formWrap = document.getElementById('bookingFormWrapper');
  const ticketCard = document.getElementById('bookingTicketCard');

  if (formWrap) formWrap.style.display = 'none';
  if (ticketCard) {
    document.getElementById('ticketName').textContent = name;
    document.getElementById('ticketDateTime').textContent = `${date} om ${time} uur`;
    document.getElementById('ticketGuests').textContent = `${guests} personen`;
    ticketCard.style.display = 'block';
  }

  return false;
};

function downloadIcsCalendar(data) {
  const [year, month, day] = data.date.split('-');
  const [hour, min] = data.time.split(':');
  
  const startStr = `${year}${month}${day}T${hour}${min}00`;
  const endHour = String(parseInt(hour, 10) + 2).padStart(2, '0');
  const endStr = `${year}${month}${day}T${endHour}${min}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Coast//Tafelreservering//NL',
    'BEGIN:VEVENT',
    `SUMMARY:Tafelreservering Beach House The Coast (${data.guests} pers)`,
    `DESCRIPTION:Gereserveerd op naam van ${data.name}. Tot ziens aan de strandopgang Molenslag in Monster!`,
    'LOCATION:Beach House The Coast, Molenslag, 2681 VP Monster',
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reservering-the-coast-${data.date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

window.handleQuoteSubmit = function(event) {
  event.preventDefault();

  const name = document.getElementById('quoteName').value;
  const type = document.getElementById('quoteType').value;
  const guests = document.getElementById('quoteGuests').value;

  alert(`Hartelijk dank voor je aanvraag, ${name}!\n\nWe hebben je offerte-aanvraag voor het ${type} (${guests} gasten) in goede orde ontvangen.\n\nOns eventteam van The Coast neemt binnen 1 werkdag contact met je op met een voorstel op maat.`);

  const modal = document.getElementById('quoteModal');
  if (modal) modal.classList.remove('active');
  event.target.reset();
  return false;
};

window.handleRouteSubmit = function(event) {
  event.preventDefault();
  const input = document.getElementById('routeOriginInput');
  if (!input || !input.value.trim()) return false;

  const origin = encodeURIComponent(input.value.trim());
  const dest = encodeURIComponent('Beach House The Coast, Molenslag Monster');
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}`;

  window.open(url, '_blank');
  return false;
};

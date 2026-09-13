/**
 * Whammy Gitaar Services - Zoetermeer
 * Interactive Logic & Calculator System
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initScrollAnimations();
  initTarievenTabs();
  initCalculator();
  initFaqAccordion();
});

/* ==========================================================================
   1. Header Scroll Effect & Active Nav Link Highlighting
   ========================================================================== */
function initHeader() {
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id], footer[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link highlighting
    let currentId = '';
    const scrollPos = window.scrollY + 180;

    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

/* ==========================================================================
   2. Mobile Menu Drawer
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!toggleBtn || !navMenu) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      toggleBtn.setAttribute('aria-expanded', false);
    });
  });
}

/* ==========================================================================
   3. Scroll Reveal Animations (IntersectionObserver)
   ========================================================================== */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in-up');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* ==========================================================================
   4. Tarieven Category Filter Tabs
   ========================================================================== */
function initTarievenTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.price-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(15px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });
}

/* ==========================================================================
   5. Interactive Price & Turnaround Calculator
   ========================================================================== */
const pricingModel = {
  standard: {
    name: 'Elektrisch / Akoestisch / Bas',
    formVal: 'Elektrische gitaar',
    snaren: 15,
    afstellen: 35,
    volledig: 65,
    snarenTime: 'ca. 15 min',
    afstellenTime: 'ca. 1.5 uur',
    volledigTime: 'ca. 3 uur'
  },
  floyd: {
    name: 'Floyd Rose Brug',
    formVal: 'Floyd Rose gitaar',
    snaren: 25,
    afstellen: 45,
    volledig: 75,
    snarenTime: 'ca. 15 min (incl. veren)',
    afstellenTime: 'ca. 1.5 uur',
    volledigTime: 'ca. 3 uur'
  },
  nylon: {
    name: 'Klassiek (Nylon)',
    formVal: 'Klassieke gitaar (Nylon)',
    snaren: 20,
    afstellen: 35,
    volledig: 65,
    snarenTime: 'ca. 15 min',
    afstellenTime: 'ca. 1.5 uur',
    volledigTime: 'ca. 3 uur'
  }
};

let currentGuitar = 'standard';
let selectedServices = new Set(['afstellen']);

function initCalculator() {
  const chips = document.querySelectorAll('#calcGuitarOptions .guitar-chip');
  const serviceItems = document.querySelectorAll('#calcServiceList .service-check-item');
  const transferBtn = document.getElementById('calcTransferBtn');

  // Guitar selection
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      currentGuitar = chip.getAttribute('data-guitar');
      updatePriceTags();
      calculateTotal();
    });
  });

  // Services selection
  serviceItems.forEach(item => {
    item.addEventListener('click', () => {
      const serviceId = item.getAttribute('data-service');
      
      // If user clicks "volledig", uncheck "afstellen" and "snaren" since they are included
      if (serviceId === 'volledig') {
        if (!selectedServices.has('volledig')) {
          selectedServices.add('volledig');
          selectedServices.delete('afstellen');
          selectedServices.delete('snaren');
        } else {
          selectedServices.delete('volledig');
        }
      } else if (serviceId === 'afstellen') {
        if (!selectedServices.has('afstellen')) {
          selectedServices.add('afstellen');
          selectedServices.delete('volledig');
        } else {
          selectedServices.delete('afstellen');
        }
      } else {
        if (selectedServices.has(serviceId)) {
          selectedServices.delete(serviceId);
        } else {
          selectedServices.add(serviceId);
        }
      }

      // Sync checkbox UI states
      serviceItems.forEach(si => {
        const sId = si.getAttribute('data-service');
        if (selectedServices.has(sId)) {
          si.classList.add('checked');
        } else {
          si.classList.remove('checked');
        }
      });

      calculateTotal();
    });
  });

  // Transfer configuration to contact form
  if (transferBtn) {
    transferBtn.addEventListener('click', () => {
      const gConfig = pricingModel[currentGuitar];
      const guitarSelect = document.getElementById('formGuitarType');
      const serviceSelect = document.getElementById('formService');
      const messageArea = document.getElementById('formMessage');

      if (guitarSelect) {
        guitarSelect.value = gConfig.formVal;
      }

      if (serviceSelect) {
        if (selectedServices.has('volledig')) {
          serviceSelect.value = 'Volledige Service';
        } else if (selectedServices.has('afstellen')) {
          serviceSelect.value = 'Gitaar Afstellen';
        } else if (selectedServices.has('snaren')) {
          serviceSelect.value = 'Snaren Vervangen';
        } else if (selectedServices.has('pots')) {
          serviceSelect.value = 'Fix Scratchy Pots';
        } else if (selectedServices.has('clean')) {
          serviceSelect.value = 'Grondige Schoonmaak';
        } else {
          serviceSelect.value = 'Aangepast Pakket';
        }
      }

      if (messageArea) {
        const activeItems = Array.from(selectedServices).join(', ');
        messageArea.value = `Gekozen via Calculator: ${gConfig.name}\nDiensten: ${activeItems}\nGeschatte totaalprijs: ${document.getElementById('calcTotalAmount').innerText}\nGeschatte duur: ${document.getElementById('calcDurationText').innerText}`;
      }

      // Scroll smoothly to contact section
      const contactSec = document.getElementById('ContactId');
      if (contactSec) {
        contactSec.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  updatePriceTags();
  calculateTotal();
}

function updatePriceTags() {
  const g = pricingModel[currentGuitar];
  const pSnaren = document.getElementById('calcPriceSnaren');
  const pAfstellen = document.getElementById('calcPriceAfstellen');
  const pVolledig = document.getElementById('calcPriceVolledig');

  if (pSnaren) pSnaren.innerText = `€${g.snaren}`;
  if (pAfstellen) pAfstellen.innerText = `€${g.afstellen}`;
  if (pVolledig) pVolledig.innerText = `€${g.volledig}`;
}

function calculateTotal() {
  const g = pricingModel[currentGuitar];
  let total = 0;
  let maxDurationHours = 0;
  const summaryList = document.getElementById('calcSummaryList');
  if (!summaryList) return;

  summaryList.innerHTML = '';

  if (selectedServices.size === 0) {
    document.getElementById('calcTotalAmount').innerText = '€0';
    document.getElementById('calcDurationText').innerText = 'Selecteer minimaal één dienst';
    summaryList.innerHTML = '<div style="color:var(--color-text-muted); font-size:0.85rem;">Geen diensten geselecteerd.</div>';
    return;
  }

  selectedServices.forEach(s => {
    let title = '';
    let price = 0;
    let durationH = 0;

    if (s === 'snaren') {
      title = `Snaren Vervangen (${g.name})`;
      price = g.snaren;
      durationH = 0.25;
    } else if (s === 'afstellen') {
      title = `Gitaar Afstellen (${g.name})`;
      price = g.afstellen;
      durationH = 1.5;
    } else if (s === 'volledig') {
      title = `Volledige Service (${g.name})`;
      price = g.volledig;
      durationH = 3.0;
    } else if (s === 'pots') {
      title = 'Fix Scratchy Pots';
      price = 10;
      durationH = 0.5;
    } else if (s === 'clean') {
      title = 'Grondige Schoonmaak';
      price = 20;
      durationH = 0.75;
    }

    total += price;
    if (durationH > maxDurationHours) maxDurationHours = durationH;

    const row = document.createElement('div');
    row.className = 'result-list-item';
    row.innerHTML = `<span>${title}</span><strong>€${price}</strong>`;
    summaryList.appendChild(row);
  });

  document.getElementById('calcTotalAmount').innerText = `€${total}`;
  
  let durStr = 'ca. 15 min';
  if (maxDurationHours >= 3) {
    durStr = 'ca. 3 uur';
  } else if (maxDurationHours >= 1.5) {
    durStr = 'ca. 1.5 uur';
  } else if (maxDurationHours >= 0.5) {
    durStr = 'ca. 30 tot 45 min';
  }
  document.getElementById('calcDurationText').innerText = `Geschatte doorlooptijd: ${durStr}`;
}

/* ==========================================================================
   6. Helper to Select Service in Form From Pricing Cards
   ========================================================================== */
window.selectServiceInForm = function(serviceName) {
  const serviceSelect = document.getElementById('formService');
  if (serviceSelect) {
    for (let i = 0; i < serviceSelect.options.length; i++) {
      if (serviceSelect.options[i].value.includes(serviceName) || serviceName.includes(serviceSelect.options[i].value)) {
        serviceSelect.selectedIndex = i;
        break;
      }
    }
  }
  const contactSec = document.getElementById('ContactId');
  if (contactSec) {
    contactSec.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ==========================================================================
   7. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isActive = item.classList.contains('active');

      // Close other open FAQs
      document.querySelectorAll('.faq-item').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          other.querySelector('.faq-answer').style.maxHeight = null;
        }
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      }
    });
  });
}

/* ==========================================================================
   8. Form Submission Handling
   ========================================================================== */
window.handleFormSubmit = function(e) {
  e.preventDefault();
  const form = document.getElementById('bookingForm');
  const btn = document.getElementById('formSubmitBtn');
  const status = document.getElementById('formSuccess');

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Button loading state
  const originalBtnHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
      <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
    </svg>
    <span>Verzenden...</span>
  `;

  // Inject spin keyframe if needed
  if (!document.getElementById('spinKeyframe')) {
    const style = document.createElement('style');
    style.id = 'spinKeyframe';
    style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  // Simulate network dispatch with realistic feedback
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = originalBtnHTML;
    status.style.display = 'flex';
    status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    form.reset();

    // Auto-hide message after 10s
    setTimeout(() => {
      status.style.display = 'none';
    }, 10000);
  }, 900);
};

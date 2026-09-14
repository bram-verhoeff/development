/**
 * Beach House The Coast - Werken Bij Logic
 * Interactive Job Filters, Modals, Quick Apply & Form Handling
 */

const JOB_DETAILS = {
  keukenbegeleider: {
    title: "Meewerkend Keukenbegeleider Gezocht!",
    hours: "32 - 38 uur per week (Fulltime / Parttime)",
    dept: "Keuken & Begeleiding",
    phone: "06 55 16 05 77",
    waPhone: "31655160577",
    intro: "Heb jij passie voor koken en vind je het leuk om jongeren het vak te leren? Dan zijn wij op zoek naar jou! Bij Beach House The Coast werk je op een toplocatie aan het strand in een gezellig team waar elke dag anders is.",
    tasks: [
      "Zelf meewerken in de keuken tijdens lunch, borrel en diner",
      "Jongeren begeleiden en het vak leren",
      "Gerechten en kwaliteit controleren",
      "Meedenken over gerechten en verbeteringen",
      "Zorgen voor een goede sfeer en structuur"
    ],
    requirements: [
      "Ervaring in de horecakeuken",
      "Leuk vinden om jongeren te begeleiden",
      "Flexibel, sociaal en zelfstandig",
      "Meedenkend en kwaliteitsgericht",
      "Hands-on mentaliteit"
    ],
    benefits: [
      "Werken op een unieke toplocatie direct aan het strand (Monster)",
      "Bovengemiddeld salaris afgestemd op jouw ervaring",
      "Wekelijks meedelen in de royale fooienpot",
      "Gezellig team, goede sfeer en veel collegialiteit",
      "20% personeelskorting op de hele menukaart"
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initStickyHeader();
  initMobileNav();
  initJobFilters();
  initJobModals();
  initApplyButtons();
  initApplyForm();
  initFlyerLightbox();
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

  function closeMenu() {
    nav.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = nav.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('menu-open', isOpen);
  });

  nav.querySelectorAll('.nav-link, .btn').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960 && nav.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* Filter Job Cards by Category */
function initJobFilters() {
  const pills = document.querySelectorAll('.job-filter-pills .filter-pill');
  const cards = document.querySelectorAll('.job-cards-grid .job-card');

  if (!pills.length || !cards.length) return;

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const category = pill.getAttribute('data-category');

      cards.forEach(card => {
        const cardCats = card.getAttribute('data-category') || '';
        if (category === 'all' || cardCats.includes(category)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, 30);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

/* Modal for Job Details */
function initJobModals() {
  const modal = document.getElementById('jobDetailModal');
  const modalContent = document.getElementById('jobModalContent');
  if (!modal || !modalContent) return;

  const closeBtn = modal.querySelector('.modal-close-btn');
  const backdrop = modal.querySelector('.modal-backdrop');

  function closeModal() {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  function openModal() {
    modal.classList.add('active');
    document.body.classList.add('modal-open');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
  });

  document.querySelectorAll('.open-job-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobId = btn.getAttribute('data-job-id');
      const data = JOB_DETAILS[jobId];
      if (!data) return;

      modalContent.innerHTML = `
        <div class="job-modal-header">
          <span class="badge-dept">${data.dept}</span>
          <h2 class="modal-job-title">${data.title}</h2>
          <div class="modal-meta-row">
            <span>⏱️ ${data.hours}</span>
            <span>📍 Monster, aan zee</span>
          </div>
        </div>

        <p class="modal-job-intro">${data.intro}</p>

        <div class="modal-job-section">
          <h4>Wat ga je doen?</h4>
          <ul>
            ${data.tasks.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>

        <div class="modal-job-section">
          <h4>Wat vragen wij?</h4>
          <ul>
            ${data.requirements.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <div class="modal-job-section">
          <h4>Wat bieden wij jou?</h4>
          <ul>
            ${data.benefits.map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>

        <div class="modal-job-actions">
          <a href="#solliciteren" class="btn btn-primary btn-lg apply-from-modal-btn" data-job-title="${data.title}">
            <span>Solliciteer Binnen 1 Minuut</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
          </a>
          <a href="https://wa.me/31850879977?text=Hoi%20The%20Coast!%20Ik%20heb%20interesse%20in%20de%20vacature%20${encodeURIComponent(data.title)}.%20Kunnen%20we%20kennismaken%3F" target="_blank" rel="noopener" class="btn btn-whatsapp-apply">
            <span>Direct Appen over Deze Baan</span>
          </a>
        </div>
      `;

      openModal();

      // Bind modal apply button
      const modalApplyBtn = modalContent.querySelector('.apply-from-modal-btn');
      if (modalApplyBtn) {
        modalApplyBtn.addEventListener('click', (e) => {
          closeModal();
          selectJobInForm(data.title);
        });
      }
    });
  });
}

/* Connect "Solliciteer Nu" buttons to form select */
function initApplyButtons() {
  document.querySelectorAll('.apply-for-job-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const jobTitle = btn.getAttribute('data-job-title');
      if (jobTitle) selectJobInForm(jobTitle);
    });
  });
}

function selectJobInForm(jobTitle) {
  const select = document.getElementById('applyJob');
  if (!select) return;

  const target = (jobTitle || '').toLowerCase();
  for (let i = 0; i < select.options.length; i++) {
    const optVal = select.options[i].value.toLowerCase();
    if (optVal.includes(target) || target.includes(optVal) ||
        (target.includes('keuken') && optVal.includes('keuken')) ||
        (target.includes('open') && optVal.includes('open'))) {
      select.selectedIndex = i;
      break;
    }
  }

  // Visual pulse on form
  const formBox = document.querySelector('.apply-container-box');
  if (formBox) {
    formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formBox.style.boxShadow = '0 0 0 4px rgba(226, 106, 77, 0.4)';
    setTimeout(() => {
      formBox.style.boxShadow = '';
    }, 1200);
  }
}

/* Handle Application Form Submission */
function initApplyForm() {
  const form = document.getElementById('applyForm');
  const successBox = document.getElementById('applySuccessBox');
  if (!form || !successBox) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('applyName')?.value || 'sollicitant';
    const job = document.getElementById('applyJob')?.value || 'een functie';

    // Submit animation
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Versturen...</span>`;
    }

    setTimeout(() => {
      form.style.display = 'none';
      successBox.style.display = 'block';
      successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Update success message personal text
      const p = successBox.querySelector('p');
      if (p) {
        p.innerHTML = `Bedankt <strong>${name}</strong>! We hebben je sollicitatie voor <strong>${job}</strong> ontvangen. Onze bedrijfsleider neemt binnen 24 uur contact met je op via WhatsApp of telefonisch voor een gezellige kennismaking!`;
      }
    }, 600);
  });
}

/* Open Original Flyer in Lightbox */
function initFlyerLightbox() {
  const flyerCard = document.getElementById('openFlyerModalBtn');
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxCaption = document.getElementById('lightboxCaption');
  if (!flyerCard || !lightbox || !lightboxImg) return;

  const closeBtn = lightbox.querySelector('.modal-close-btn');
  const backdrop = lightbox.querySelector('.modal-backdrop');

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.classList.remove('modal-open');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (backdrop) backdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
  });

  flyerCard.addEventListener('click', () => {
    lightboxImg.src = 'assets/vacature-keukenbegeleider.jpg';
    if (lightboxCaption) {
      lightboxCaption.innerHTML = '<strong>Meewerkend Keukenbegeleider Gezocht!</strong> &bull; Beach House The Coast Monster &bull; WhatsApp: 06 55 16 05 77';
    }
    lightbox.classList.add('active');
    document.body.classList.add('modal-open');
  });
}

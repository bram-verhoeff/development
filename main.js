/**
 * Bloeiende Landen - Interactive Functionality
 * Regeneratief Voedselbos & Natuurlandschap Zevenhoven
 */

document.addEventListener('DOMContentLoaded', () => {
  // Current Year
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------------------------
     1. Header Scroll & Mobile Navigation
     -------------------------------------------------------------------------- */
  const header = document.getElementById('siteHeader');
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });

  if (mobileBtn && mainNav) {
    mobileBtn.addEventListener('click', () => {
      const isOpen = mobileBtn.classList.toggle('is-open');
      mainNav.classList.toggle('is-open', isOpen);
      mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileBtn.classList.remove('is-open');
        mainNav.classList.remove('is-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!mainNav.contains(e.target) && !mobileBtn.contains(e.target) && mainNav.classList.contains('is-open')) {
        mobileBtn.classList.remove('is-open');
        mainNav.classList.remove('is-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Active navigation highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  };

  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => navObserver.observe(section));

  /* --------------------------------------------------------------------------
     2. Interactive 7 Layers of a Food Forest
     -------------------------------------------------------------------------- */
  const layersData = {
    canopy: {
      badge: 'Laag 1 van 7',
      title: 'De Kruinlaag (Canopy)',
      role: 'De majestueuze ruggengraat van het voedselbos',
      desc: 'De hoogste bomen vangen het eerste felle zonlicht, breken harde polderwinden en creëren een mild microklimaat voor de onderliggende gewassen. Hun diepe wortels pompen mineralen uit diepere veen- en kleilagen omhoog en voeden het bodemnetwerk.',
      species: [
        '<strong>Tamme Kastanje (Castanea sativa)</strong> &mdash; Voedzame noten, robuust en langlevend',
        '<strong>Walnoot (Juglans regia)</strong> &mdash; Waardevolle noten en insectenwerende aroma\'s',
        '<strong>Zwarte Els (Alnus glutinosa)</strong> &mdash; Inheems aan de poldersloten, bindt stikstof in de veenbodem'
      ],
      heightTag: 'Bovenlaag: 10 - 20 meter',
      barHeight: '95%',
      svgPath: 'M40 70V30M40 30c-15 0-25-10-25-20 10 0 20 5 25 12 5-7 15-12 25-12 0 10-10 20-25 20z'
    },
    subcanopy: {
      badge: 'Laag 2 van 7',
      title: 'De Lage Bomenlaag (Sub-canopy)',
      role: 'Fruitbomen & traditionele rassen in het halflicht',
      desc: 'Net onder de kruinlaag gedijen half- en laagstambomen. Deze bomen vangen het gefilterde zonlicht en leveren de bekende klassieke fruitsoorten. Door diversiteit in rassen is de oogst gespreid en de weerstand tegen ziektes maximaal.',
      species: [
        '<strong>Oude Appelrassen</strong> &mdash; Schone van Boskoop, Notarisappel en Brabantse Bellefleur',
        '<strong>Stoof- en Handperen</strong> &mdash; Gieser Wildeman, Conference en Doyenné du Comice',
        '<strong>Kweeperen & Mispels</strong> &mdash; Karaktervol historisch fruit met een rijk aroma'
      ],
      heightTag: 'Middelhoge bomen: 3 - 9 meter',
      barHeight: '75%',
      svgPath: 'M40 70V40M40 40c-12-2-18-12-16-22 8-2 16 4 16 10 0-6 8-12 16-10 2 10-4 20-16 22z'
    },
    shrub: {
      badge: 'Laag 3 van 7',
      title: 'De Struiklaag (Shrub Layer)',
      role: 'Kleurrijke bessen & notenstruiken in volle bloei',
      desc: 'De struiklaag is het hart van ons plukgedeelte. Hier groeien honderden bessenstruiken die al vroeg in de zomer beginnen te rijpen. Ze trekken ontelbare bestuivers aan en bieden veilige nestplekken voor zangvogels.',
      species: [
        '<strong>Rode & Zwarte Bessen (Ribes)</strong> &mdash; Rijk aan vitamine C en antioxidanten',
        '<strong>Kruisbessen & Jostabessen</strong> &mdash; Sappig handfruit en ideaal voor compote',
        '<strong>Hazelaar (Corylus avellana)</strong> &mdash; Lekkere noten en uitstekend snoeihout voor vlechtwerken'
      ],
      heightTag: 'Struiken: 1 - 3 meter',
      barHeight: '55%',
      svgPath: 'M40 70v-16m-12 16c4-12 10-18 12-24 2 6 8 12 12 24M24 45c-8-6-8-16 0-20 6 6 4 14 0 20zm32 0c8-6 8-16 0-20-6 6-4 14 0 20z'
    },
    herbaceous: {
      badge: 'Laag 4 van 7',
      title: 'De Kruidenlaag (Herbaceous Layer)',
      role: 'Dynamische mineralenpompen & geurende theekruiden',
      desc: 'Niet-verhoute planten die elk jaar opnieuw uitgroeien. Ze bedekken de grond, weren onkruid en trekken nuttige insecten aan. Veel soorten zoals smeerwortel hebben penwortels die diep in de veengrond reiken en voedingsstoffen mobiliseren.',
      species: [
        '<strong>Smeerwortel (Symphytum officinale)</strong> &mdash; Essentiële mineralenpomp en mulchplant',
        '<strong>Daslook (Allium ursinum)</strong> &mdash; Vroege voorjaarspluk met een heerlijke zachte knoflooksmaak',
        '<strong>Citroenmelisse & Munt</strong> &mdash; Aromatische theekruiden voor bezoekers'
      ],
      heightTag: 'Kruiden: tot 1 meter',
      barHeight: '40%',
      svgPath: 'M40 70V50M30 65c-6-10-2-22 10-26-2 10-6 18-10 26zm20 0c6-10 2-22-10-26 2 10 6 18 10 26z'
    },
    groundcover: {
      badge: 'Laag 5 van 7',
      title: 'Bodembedekkers (Ground Cover)',
      role: 'Het levende tapijt dat vocht vasthoudt in de polder',
      desc: 'Kruipende planten die horizontaal over de aarde uitwaaieren. Ze fungeren als een levend isolatiedek, waardoor de veengrond koel blijft in hete zomers en vocht niet verdampt. Dit remt ongewenste grassen en stopt veenoxidatie.',
      species: [
        '<strong>Bosaardbei (Fragaria vesca)</strong> &mdash; Zoete kleine bessen van mei tot de vorst',
        '<strong>Cranberry & Veenbes</strong> &mdash; Liefhebbers van zure, vochtige veenbodems',
        '<strong>Kruipend Tijm & Penningkruid</strong> &mdash; Dichte geurige zoden met nectarrijke bloemetjes'
      ],
      heightTag: 'Bodemlaag: 0 - 15 cm',
      barHeight: '25%',
      svgPath: 'M15 65c15-4 35-4 50 0M25 64c0-8 6-14 15-14s15 6 15 14M35 50c0-6 5-10 10-10'
    },
    rhizosphere: {
      badge: 'Laag 6 van 7',
      title: 'De Wortellaag (Rhizosphere)',
      role: 'Het ondergrondse internet van mycorrhizae & knollen',
      desc: 'Onder het maaiveld bevindt zich minstens zoveel biomassa als erboven. Schimmelnetwerken (mycorrhizae) verbinden bomen met kruiden en wisselen suikers uit tegen mineralen. Hier oogsten we eetbare wortels en knollen.',
      species: [
        '<strong>Aardpeer (Helianthus tuberosus)</strong> &mdash; Knapperige, nootachtige winterknollen',
        '<strong>Mierikswortel</strong> &mdash; Pittige aromatische specerij met antibiotische werking',
        '<strong>Mycorrhizae schimmels</strong> &mdash; Het levensbelangrijke transportsysteem van de bodem'
      ],
      heightTag: 'Ondergronds wortelnetwerk',
      barHeight: '15%',
      svgPath: 'M40 20v25M40 45c-10 8-16 16-20 25M40 45c10 8 16 16 20 25M30 55c-6 5-12 8-18 10M50 55c6 5 12 8 18 10'
    },
    vertical: {
      badge: 'Laag 7 van 7',
      title: 'De Klimlaag (Vertical Layer)',
      role: 'Klimmers & slingeraars die omhoog reiken naar de zon',
      desc: 'Planten die stammen en takken van bomen gebruiken als natuurlijke ladder. Ze benutten verticale ruimtes zonder extra grondoppervlak in te nemen en dragen vruchten op ooghoogte langs paden en hekwerken.',
      species: [
        '<strong>Kiwi-bes (Actinidia arguta)</strong> &mdash; Gladde, zoete minikiwi\'s die met schil gegeten worden',
        '<strong>Wilde Hop (Humulus lupulus)</strong> &mdash; Inheems langs waterkanten, rustgevende thee en bierbrouwen',
        '<strong>Klimdruiven & Kamperfoelie</strong> &mdash; Geurende bloesems en zoete herfsttrossen'
      ],
      heightTag: 'Verticale klimmers: tot boomtop',
      barHeight: '85%',
      svgPath: 'M30 70c0-15 20-20 20-35S30 20 30 10M45 45c6-2 10-8 8-14-6 2-10 8-8 14zM25 25c-6-2-10-8-8-14 6 2 10 8 8 14z'
    }
  };

  const layerTabs = document.querySelectorAll('.layer-tab');
  const layerBadge = document.getElementById('layerBadge');
  const layerTitle = document.getElementById('layerTitle');
  const layerRole = document.getElementById('layerRole');
  const layerDescription = document.getElementById('layerDescription');
  const layerSpecies = document.getElementById('layerSpecies');
  const indicatorTag = document.getElementById('indicatorTag');
  const indicatorBar = document.querySelector('.indicator-bar');
  const layerIconSvg = document.getElementById('layerIconSvg');

  layerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const layerKey = tab.dataset.layer;
      const data = layersData[layerKey];
      if (!data) return;

      // Update tabs UI
      layerTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Update Card content with micro-animation
      const displayCard = document.getElementById('layerDisplayCard');
      displayCard.style.opacity = '0.4';
      displayCard.style.transform = 'translateY(4px)';

      setTimeout(() => {
        layerBadge.textContent = data.badge;
        layerTitle.textContent = data.title;
        layerRole.textContent = data.role;
        layerDescription.textContent = data.desc;

        // Species
        layerSpecies.innerHTML = data.species.map(item => `<li>${item}</li>`).join('');

        // Indicator
        indicatorTag.textContent = data.heightTag;
        if (indicatorBar) indicatorBar.style.height = data.barHeight;

        // Svg
        if (layerIconSvg) {
          layerIconSvg.innerHTML = `<path d="${data.svgPath}" stroke="#2d6a4f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
        }

        displayCard.style.opacity = '1';
        displayCard.style.transform = 'translateY(0)';
      }, 120);
    });
  });

  /* --------------------------------------------------------------------------
     3. Interactive Harvest Calendar (Seizoenen)
     -------------------------------------------------------------------------- */
  const seasonData = {
    lente: {
      title: 'Lente &middot; Het Ontwaken (Maart - Mei)',
      badge: 'Fris & Krachtig',
      desc: 'De sapstromen komen op gang. De kruidenlaag explodeert met verse theekruiden, vroege scheuten en daslook, gevolgd door geurige vlierbloesem en rabarber.',
      harvest: [
        '🌿 Daslookbladeren en vroege wilde kruiden',
        '🌸 Geurige vlierbloesem voor siroop & fermenten',
        '🌱 Jonge brandnetel, munt en citroenmelisse',
        '🍓 Eerste bosaardbeienbloei & lentebloesems'
      ]
    },
    zomer: {
      title: 'Zomer &middot; De Overvloed (Juni - Augustus)',
      badge: 'Bessenfeest',
      desc: 'Het plukgedeelte staat in volle bloei en pracht. Takken buigen door onder het gewicht van bessen en vroeg fruit. Elke week brengt een nieuwe smaakexplosie.',
      harvest: [
        '🫐 Rode, zwarte en witte aalbessen',
        '🍒 Zoete kruisbessen, frambozen en jostabessen',
        '🍎 Vroege zomerappels en wilde kruidenmengsels',
        '🌼 Bloemenhoning en theebladeren in overvloed'
      ]
    },
    herfst: {
      title: 'Herfst &middot; De Oogstpiek (September - November)',
      badge: 'Noten & Fruit',
      desc: 'De klap op de vuurpijl voor de voedselvoorraad. Hoogstambomen laten hun appels, peren en noten vallen. Rijk aan calorieën, vetten en bewaaroogst voor de winter.',
      harvest: [
        '🌰 Tamme kastanjes en verse walnoten',
        '🍏 Sappige herfstappels, peren en kweeperen',
        '🫐 Late herfstbramen, vlierbessen en rozenbottels',
        '🍄 Eetbare paddenstoelen en mycorrhizae activiteit'
      ]
    },
    winter: {
      title: 'Winter &middot; Rust & Wortelkracht (December - Februari)',
      badge: 'Stilte & Verdieping',
      desc: 'De bomen laten hun blad vallen om de veenbodem als een warme deken te bedekken. Ondergronds rust het bos, maar winterknollen en geneeskrachtige schorsen blijven beschikbaar.',
      harvest: [
        '🥔 Zoete aardperen en mierikswortel',
        '🍵 Dennennaalden, gedroogde kruiden en winterthee',
        '🪵 Snoeihout voor takkenrillen en wilgentenen vlechtwerk',
        '🦉 Rust & beschutting voor overwinterende vogels'
      ]
    }
  };

  const seasonButtons = document.querySelectorAll('.season-filter-btn');
  const seasonTitle = document.getElementById('seasonTitle');
  const seasonBadge = document.getElementById('seasonBadge');
  const seasonDescription = document.getElementById('seasonDescription');
  const seasonHarvestList = document.getElementById('seasonHarvestList');

  seasonButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const season = btn.dataset.season;
      const data = seasonData[season];
      if (!data) return;

      seasonButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const card = document.getElementById('seasonCardContent');
      card.style.opacity = '0.3';
      card.style.transform = 'translateY(4px)';

      setTimeout(() => {
        seasonTitle.innerHTML = data.title;
        seasonBadge.textContent = data.badge;
        seasonDescription.textContent = data.desc;
        seasonHarvestList.innerHTML = data.harvest.map(item => `<li>${item}</li>`).join('');

        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 120);
    });
  });

  /* --------------------------------------------------------------------------
     4. FAQ Accordion
     -------------------------------------------------------------------------- */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    if (!questionBtn) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all others
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherBtn = otherItem.querySelector('.faq-question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      // Toggle current
      if (!isActive) {
        item.classList.add('active');
        questionBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* --------------------------------------------------------------------------
     5. Visit / Tour Booking Form Handler
     -------------------------------------------------------------------------- */
  const visitForm = document.getElementById('visitForm');
  const visitFeedback = document.getElementById('visitFeedback');

  if (visitForm) {
    visitForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitVisitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Bezig met versturen...</span>';

      const name = document.getElementById('visitorName').value;
      const interest = document.getElementById('visitorInterest').value;

      setTimeout(() => {
        visitFeedback.className = 'form-feedback success';
        visitFeedback.innerHTML = `Hartelijk dank, <strong>${name}</strong>! We hebben je aanvraag voor <em>${interest}</em> goed ontvangen. Koen de Ridder neemt spoedig per e-mail contact met je op.`;
        visitFeedback.classList.remove('hidden');
        visitForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Aanvraag Verzonden ✓</span>';
      }, 700);
    });
  }

  // Pre-fill interest dropdown if clicked from card buttons
  const visitButtons = document.querySelectorAll('[data-action]');
  visitButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const select = document.getElementById('visitorInterest');
      if (select) {
        if (action === 'book-tour') select.value = 'rondleiding';
        else if (action === 'open-day') select.value = 'open-dag';
        else if (action === 'volunteer') select.value = 'vrijwilliger';
      }
    });
  });

  /* --------------------------------------------------------------------------
     6. Newsletter Form Handler
     -------------------------------------------------------------------------- */
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterMsg = document.getElementById('newsletterMsg');

  if (newsletterForm && newsletterMsg) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput ? emailInput.value : '';

      newsletterMsg.textContent = `Bedankt! ${email} is aangemeld voor de Bodempost & Seizoensupdates.`;
      newsletterMsg.classList.remove('hidden');
      newsletterForm.reset();
    });
  }

  /* --------------------------------------------------------------------------
     7. Direct Contact Form Handler
     -------------------------------------------------------------------------- */
  const directContactForm = document.getElementById('directContactForm');
  const contactFeedback = document.getElementById('contactFeedback');

  if (directContactForm && contactFeedback) {
    directContactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName').value;

      contactFeedback.className = 'form-feedback success';
      contactFeedback.innerHTML = `Bedankt voor je bericht, <strong>${name}</strong>! We reageren zo snel mogelijk.`;
      contactFeedback.classList.remove('hidden');
      directContactForm.reset();
    });
  }
});

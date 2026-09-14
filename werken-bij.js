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
      "Ervaring in de keuken",
      "Leuk vinden om jongeren te begeleiden",
      "Flexibel, sociaal en zelfstandig",
      "Meedenkend en kwaliteitsgericht",
      "Hands-on mentaliteit"
    ],
    benefits: [
      "Werken op een unieke toplocatie op palen direct aan het strand",
      "Bovengemiddeld salaris afgestemd op jouw ervaring",
      "Wekelijks meedelen in de royale fooienpot",
      "Gezellig team, goede sfeer en veel collegialiteit",
      "20% personeelskorting op de hele menukaart"
    ]
  },
  bediening: {
    title: "Bedieningsmedewerker & Gastheer / Gastvrouw",
    hours: "16 - 38 uur per week (Parttime of Fulltime)",
    dept: "Bediening & Terras",
    intro: "Als gastheer of gastvrouw ben jij het stralende gezicht van The Coast. Met een weids uitzicht over de Noordzee serveer je verfrissende drankjes, verse oesters en dinergerechten. Je voelt aan wat gasten wensen en zorgt voor een ontspannen, luxe strandbeleving.",
    tasks: [
      "Warm en gastvrij ontvangen van gasten op het terras of in het paviljoen",
      "Opnemen van bestellingen en adviseren over wijnen, bieren en gerechten",
      "Uitserveren van lunch, borrelplateaus en diner met zorg en finesse",
      "Zorgen voor een opgeruimd, stijlvol restaurant en zonneterras"
    ],
    requirements: [
      "Je bent minimaal 16 of 17 jaar oud",
      "Enthousiaste, zonnige en gastvrije instelling",
      "Beschikbaar voor minimaal één weekenddag of avonddienst",
      "Ervaring is een pré, maar enthousiasme en leergierigheid vinden wij belangrijker!"
    ],
    benefits: [
      "Aantrekkelijk uurloon met wekelijkse fooiverdeling",
      "Flexibele werkuren ideaal te combineren met studie of sport",
      "Gratis personeelseten tijdens lange shifts",
      "Leuke trainingen via The Coast Hospitality Academy",
      "Gezellige nazit met een koud drankje op het mooiste terras van Monster"
    ]
  },
  kok: {
    title: "Zelfstandig Werkend Kok",
    hours: "24 - 38 uur per week (Fulltime / Parttime)",
    dept: "Keuken",
    intro: "Koken met een briesje van de zee! In onze keuken bereiden we smaakvolle gerechten met dagverse ingrediënten, van krokante kibbeling en The Coast burgers tot malse tournedos en fruit de mer.",
    tasks: [
      "Zelfstandig draaien van de koude of warme kant tijdens service",
      "Mise-en-place verzorgen voor lunch, borrel en diner",
      "Nieuwe gerechten uitproberen en creatief meedenken",
      "Schoonhouden van de werkplek en naleven van hygiëneregels"
    ],
    requirements: [
      "Ervaring als zelfstandig werkend kok in een restaurant",
      "Oog voor detail, smaak en mooie presentatie",
      "Flexibel inzetbaar in het weekend en tijdens seizoenspieken",
      "Teamspeler die rust bewaart in de spits"
    ],
    benefits: [
      "Goed salaris passend bij je ervaring en kunde",
      "Wekelijkse fooi gelijkwaardig verdeeld onder keuken en bediening",
      "Reiskostenvergoeding en goede pensioenregeling",
      "20% personeelskorting voor jou en je gezelschap",
      "Fijne werkomgeving met een hecht team van koks"
    ]
  },
  barista: {
    title: "Barista & Cocktail Bartender",
    hours: "16 - 28 uur per week (Parttime & Weekend)",
    dept: "Bar & Lounge",
    intro: "Ben jij een meester in latte art en shake je met gemak de lekkerste spritzes en mojito's? Achter onze royale bar ben jij de spil van alle dranken tijdens zonnige middagen en gouden zonsondergangen.",
    tasks: [
      "Bereiden van kwaliteitskoffies en espresso's met latte art",
      "Tappen van speciaalbieren en bereiden van cocktails en mocktails",
      "Bijhouden van de drankvoorraad, koelingen en barattributen",
      "Sfeervolle interactie met gasten aan de bar"
    ],
    requirements: [
      "Passie voor koffie, cocktails en gastvrijheid",
      "Snel en efficiënt kunnen werken in drukke momenten",
      "Beschikbaar in de weekenden en/of zwoele zomeravonden",
      "Representatief, sociaal en verzorgd"
    ],
    benefits: [
      "Lekker uurloon + wekelijkse fooi",
      "Cocktail- en baristaworkshops",
      "Toffe werkplek met uitzicht over de golven",
      "Flexibele uren en gezellige borrels na sluitingstijd"
    ]
  },
  spoelkeuken: {
    title: "Spoelkeuken Hero & Keukenhulp (Vanaf 15 jaar!)",
    hours: "8 - 20 uur per week (Ideale Bijbaan!)",
    dept: "Spoelkeuken & Keuken",
    intro: "Zonder de afwas staat alles stil! Als Spoelkeuken Hero zorg jij dat koks en bediening altijd schoon servies, pannen en glaswerk hebben. De perfecte eerste horecabaan waarin je goed verdient en kunt doorgroeien!",
    tasks: [
      "Sorteren en machinaal reinigen van borden, bestek en pannen",
      "Netjes opruimen van schoon servies in restaurant en keuken",
      "Koks ondersteunen met eenvoudige snij- en schoonmaaktaken",
      "Muziekje aan en lekker meters maken in een gezellig team"
    ],
    requirements: [
      "Je bent 15 jaar of ouder",
      "Niet bang om de handen uit de mouwen te steken",
      "Beschikbaar in weekenden, vakanties of doordeweekse avonden",
      "Betrouwbaar en enthousiast"
    ],
    benefits: [
      "Goed salaris (boven minimum jeugdloon!)",
      "Eerlijk meedelen in de royale fooienpot — dat tikt lekker aan!",
      "Gratis eten & drinken tijdens je dienst",
      "Doorgroeien naar keukenhulp of bediening als je dat leuk vindt",
      "Heel veel gezelligheid met leeftijdsgenoten"
    ]
  },
  runner: {
    title: "Zomer- & Terrasrunner (Strandseizoen)",
    hours: "Flexibel: 10 - 35 uur per week",
    dept: "Terras & Lounge",
    intro: "Genieten van de zon en ondertussen flink cashen! Als terrasrunner breng je drankjes en bites vliegensvlug naar onze loungebanken en zonneterras. De ultieme zomerbaan voor energieke doeners.",
    tasks: [
      "Borden en drankplateaus uitlopen over het verhoogde zonneterras",
      "Tafels afruimen, schoonmaken en gereedmaken voor nieuwe gasten",
      "Gasten voorzien van extra servetten, sausjes en bestek",
      "Actief meewerken tijdens zonnige stranddagen en evenementen"
    ],
    requirements: [
      "Vanaf 15 of 16 jaar",
      "Fit, energiek en graag buiten in beweging",
      "Stressbestendig en collegiaal",
      "Vakanties en zonnige weekenden beschikbaar"
    ],
    benefits: [
      "Top uurloon + mooie fooi",
      "Werken in de zon met uitzicht op zee",
      "Super flexibele uren via handige rooster-app",
      "Korting op onze menukaart",
      "De leukste zomer van je leven met ons team!"
    ]
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initJobFilters();
  initJobModals();
  initApplyButtons();
  initApplyForm();
  initFlyerLightbox();
});

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

      modal.classList.add('active');

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

  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value.includes(jobTitle) || jobTitle.includes(select.options[i].value)) {
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
  });
}

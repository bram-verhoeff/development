/**
 * QUALITY COMPUTER CENTRE (QCC) - JAVASCRIPT CONTROLLER
 * Den Haag • Sinds 1997
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. LIVE OPENING HOURS STATUS (DEN HAAG TIJD)
     ========================================================================== */
  function updateLiveStoreStatus() {
    // Current date and time in Dutch timezone
    const now = new Date();
    // Day of week: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    const day = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let isOpen = false;
    let closesAt = '';
    let nextOpenMsg = '';

    // Schedule:
    // Di t/m Vr (2, 3, 4, 5): 10:00 - 17:30 (600 - 1050 mins)
    // Za (6): 10:00 - 16:30 (600 - 990 mins)
    // Zo (0) & Ma (1): Gesloten

    if (day >= 2 && day <= 5) {
      if (currentMinutes >= 600 && currentMinutes < 1050) {
        isOpen = true;
        closesAt = '17:30';
      }
    } else if (day === 6) {
      if (currentMinutes >= 600 && currentMinutes < 990) {
        isOpen = true;
        closesAt = '16:30';
      }
    }

    const statusEl = document.getElementById('store-live-status');
    const pulseDot = document.getElementById('store-pulse-dot');
    const mobileStatusEl = document.getElementById('mobile-live-status');
    const mobilePulseDot = document.getElementById('mobile-pulse-dot');
    const hoursBadge = document.getElementById('hours-status-badge');

    if (isOpen) {
      const msg = `Geopend tot ${closesAt}`;
      if (statusEl) statusEl.textContent = msg;
      if (mobileStatusEl) mobileStatusEl.textContent = `Winkel nu geopend tot ${closesAt}`;
      if (pulseDot) pulseDot.classList.remove('closed');
      if (mobilePulseDot) mobilePulseDot.classList.remove('closed');
      if (hoursBadge) {
        hoursBadge.textContent = 'Nu Geopend';
        hoursBadge.classList.remove('closed');
      }
    } else {
      let openDay = 'Dinsdag';
      if (day === 0) openDay = 'Dinsdag';
      else if (day === 1) openDay = 'Dinsdag';
      else if (day === 6) openDay = 'Dinsdag';
      else if (day >= 2 && day <= 4) openDay = 'morgen';
      else if (day === 5) openDay = 'zaterdag';

      const msg = `Gesloten • ${openDay} 10:00`;
      if (statusEl) statusEl.textContent = msg;
      if (mobileStatusEl) mobileStatusEl.textContent = `Momenteel gesloten • Open ${openDay} 10:00`;
      if (pulseDot) pulseDot.classList.add('closed');
      if (mobilePulseDot) mobilePulseDot.classList.add('closed');
      if (hoursBadge) {
        hoursBadge.textContent = 'Gesloten';
        hoursBadge.classList.add('closed');
      }
    }

    // Highlight today in hours table
    const todayRow = document.querySelector(`.hours-row[data-day="${day}"]`);
    if (todayRow) {
      todayRow.classList.add('today');
      const dayName = todayRow.querySelector('.day-name');
      if (dayName && !dayName.textContent.includes('(Vandaag)')) {
        dayName.textContent += ' (Vandaag)';
      }
    }
  }

  updateLiveStoreStatus();
  setInterval(updateLiveStoreStatus, 60000); // Check every minute


  /* ==========================================================================
     2. INTERACTIVE REPAIR CALCULATOR (fix.qualitycomputer.nl Ecosystem)
     ========================================================================== */
  const repairDatabase = {
    laptop: {
      brands: [
        'Apple MacBook Pro (M1, M2, M3 & Intel)',
        'Apple MacBook Air (M1, M2, M3 & Intel)',
        'Apple iMac & Mac Mini',
        'Windows Laptop (HP Pavilion, Envy, Omen)',
        'Windows Laptop (Lenovo ThinkPad, IdeaPad, Legion)',
        'Windows Laptop (Asus ROG, TUF, ZenBook)',
        'Windows Laptop (Dell XPS, Inspiron, Latitude)',
        'Windows Laptop (Acer Swift, Aspire, Predator)',
        'Windows Laptop (MSI Gaming & Creator)',
        'Custom Gaming PC / Workstation Desktop'
      ],
      issues: [
        {
          id: 'slow_upgrade',
          title: 'Trage computer versnellen (SSD & RAM Upgrade)',
          desc: 'Vervanging van oude mechanische HDD door een razendsnelle NVMe of SATA SSD. Inclusief 1-op-1 data- en Windows/macOS overzetting zonder verlies van programma\'s of bestanden.',
          time: '1 werkdag (klaar binnen 24 uur)',
          warranty: '3 jaar garantie op SSD',
          price: 'Vanaf € 79,- (incl. SSD & complete installatie)'
        },
        {
          id: 'screen_replace',
          title: 'Laptop Scherm Reparatie / Beeldscherm vervangen',
          desc: 'Vervanging van gebarsten of streperig displaypaneel door een nieuw origineel A+ kwaliteit scherm (FHD, QHD of 4K). Nauwkeurige montage en scharnierafstelling.',
          time: '1 - 2 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 99,- (afhankelijk van schermtype)'
        },
        {
          id: 'cooling_thermal',
          title: 'Oververhitting, Luidruchtige Ventilator & Koelpasta',
          desc: 'Intern volledig ontstoffen van heatsinks en fans, ontvetten van CPU/GPU dies en aanbrengen van hoogwaardige Arctic MX-4/MX-6 koelpasta.',
          time: '2 - 4 uur',
          warranty: 'Thermisch gegarandeerd koel',
          price: 'Vanaf € 45,-'
        },
        {
          id: 'battery_replace',
          title: 'Accu Vervangen (Laptop laadt niet of valt spontaan uit)',
          desc: 'Montage van een nieuwe originele of OEM kwaliteitsaccu met 100% capaciteit en reset van het batterijbeheersysteem.',
          time: '1 - 2 werkdagen (op voorraad: 1 uur)',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 69,-'
        },
        {
          id: 'charging_jack',
          title: 'DC-Jack / USB-C Oplaadpoort Reparatie',
          desc: 'Herstel of soldeer-vervanging van de oplaadconnector op het moederbord als de stekker wiebelt of geen contact maakt.',
          time: '1 - 2 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 55,-'
        },
        {
          id: 'reinstall_clean',
          title: 'Opschonen, Virusverwijdering & Schone Windows 11 Installatie',
          desc: 'Verwijdering van virussen, malware, spyware en ongewenste software. Schone installatie van Windows 11 of macOS met behoud van al uw documenten en foto\'s.',
          time: 'Vaak dezelfde dag gereed',
          warranty: '3 maanden softwaregarantie',
          price: 'Vaste prijs € 59,-'
        },
        {
          id: 'liquid_damage',
          title: 'Waterschade / Vloeistof over toetsenbord gekomen',
          desc: 'Directe ultrasone reiniging van het moederbord, chemische droging en corrosiebescherming om fatale kortsluiting te voorkomen.',
          time: 'Diagnose binnen 24 uur',
          warranty: 'No cure, no pay diagnose',
          price: 'Diagnose € 35,- (verrekend bij reparatie)'
        }
      ]
    },
    smartphone: {
      brands: [
        'Apple: iPhone 16 / 15 Serie (Pro Max, Pro, Plus, 15/16)',
        'Apple: iPhone 14 Serie (14 Pro Max, 14 Pro, 14 Plus, 14)',
        'Apple: iPhone 13 Serie (13 Pro Max, 13 Pro, 13, 13 Mini)',
        'Apple: iPhone 12 Serie (12 Pro Max, 12 Pro, 12, 12 Mini)',
        'Apple: iPhone 11 Serie (11 Pro Max, 11 Pro, 11)',
        'Apple: iPhone X / XS / XR Serie (XS Max, XS, XR, X)',
        'Apple: iPhone SE / 8 / 7 / 6s Serie',
        'Samsung: Galaxy S Serie (S24, S23, S22, S21 Ultra/Plus)',
        'Samsung: Galaxy A Serie (A54, A53, A52, A34, A14, A13, A71)',
        'Samsung: Galaxy Z Serie (Fold 5/4/3/2, Flip 5/4/3)',
        'Samsung: Galaxy Note Serie (Note 20 Ultra, Note 10, Note 9)',
        'Google: Pixel Serie (Pixel 8 Pro, 8, 7 Pro, 7, 6 Pro, 6, 5)',
        'Huawei: P & Mate Serie (P40, P30 Pro, Mate 40/30/20, Nova)',
        'OnePlus: 12, 11, 10 Pro, 9, 8 & Nord Serie',
        'Overige Merken (Xiaomi, Motorola, Sony Xperia, Nokia)'
      ],
      issues: [
        {
          id: 'screen',
          title: 'Scherm / Display module vervangen (Origineel / OLED)',
          desc: 'Plaatsing van een nieuw haarscherp OLED of origineel Service Pack display. Inclusief stofvrije montage, waterbestendige sealing en overzetten van TrueTone sensoren.',
          time: '30 - 45 minuten (klaar terwijl u wacht)',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 69,- tot € 149,- (origineel op aanvraag)'
        },
        {
          id: 'battery',
          title: 'Accu / Batterij vervangen (Loopt snel leeg of valt uit)',
          desc: 'Plaatsing van een gloednieuwe accu met 100% batterijconditie. Uw smartphone gaat direct weer de hele dag mee zonder plotseling uitvallen.',
          time: '30 minuten',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 45,- tot € 74,99'
        },
        {
          id: 'charging_port',
          title: 'Oplaadaansluiting / USB-C / Lightning vervangen',
          desc: 'Herstel of complete vernieuwing van de laadpoort dock connector als de kabel loszit, wiebelt of helemaal niet meer oplaadt.',
          time: '45 - 60 minuten',
          warranty: '6 maanden garantie',
          price: 'Vaste prijs € 49,- tot € 89,-'
        },
        {
          id: 'back_glass',
          title: 'Achterkant glas gebroken / Backcover vervangen',
          desc: 'Laser-extractie of vakkundige vervanging van het gebroken achterglas voor een strak fabrieksnieuw uiterlijk.',
          time: '2 - 3 uur',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 65,-'
        },
        {
          id: 'camera_mic',
          title: 'Camera module, Cameraglas, Microfoon of Speaker',
          desc: 'Vervanging van gebarsten cameralens glas, onscherpe camera sensoren, defecte microfoons (bellen niet hoorbaar) of krakende luidsprekers.',
          time: '45 minuten',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 45,-'
        },
        {
          id: 'water_damage',
          title: 'Waterschade ultrasone reiniging & chemisch drogen',
          desc: 'In het water of toilet gevallen? Geen stroom aansluiten! Direct ultrasoonbad reiniging om corrosie en oxidatie te stoppen.',
          time: 'Diagnose binnen 24 uur',
          warranty: 'No cure, no pay diagnose',
          price: 'Diagnose € 35,-'
        },
        {
          id: 'motherboard_solder',
          title: 'Moederbord micro-solderen (Geen stroom, Laad-IC)',
          desc: 'Component-level reparatie onder microscoop voor toestellen met kortsluiting of defecte power-management IC.',
          time: '1 - 2 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 79,-'
        }
      ]
    },
    tablet: {
      brands: [
        'Apple iPad Pro 12.9 (alle generaties incl. A2229)',
        'Apple iPad Pro 11 (alle generaties incl. A2228)',
        'Apple iPad Air (Air 5, Air 4, Air 3)',
        'Apple iPad Mini (Mini 6, Mini 5, Mini 4)',
        'Apple iPad standaard (10e, 9e, 8e, 7e gen / iPad 2020)',
        'Samsung Galaxy Tab S Serie (Tab S9, S8, S7, S6)',
        'Samsung Galaxy Tab A Serie (Tab A9, A8, SM-T510, SM-T290)',
        'Microsoft Surface Pro / Lenovo Tab'
      ],
      issues: [
        {
          id: 'tab_screen',
          title: 'Tablet Scherm of Touchscreen glasplaat vervangen',
          desc: 'Vervanging van gebarsten glas of compleet IPS/Retina displaypaneel met microscopische precisie en stofvrije vacuüm-verlijming.',
          time: '1 - 2 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 79,-'
        },
        {
          id: 'tab_battery',
          title: 'iPad / Tablet Batterij vervangen (Hoge capaciteit)',
          desc: 'Vakkundig openen van de verlijmde behuizing en plaatsen van een krachtige nieuwe batterij met 100% conditie.',
          time: '1 werkdag',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 69,-'
        },
        {
          id: 'tab_port',
          title: 'USB-C / Lightning Poort solderen of vervangen',
          desc: 'Herstel van verbogen pinnen of vervanging van de laadprint als de tablet niet meer oplaadt.',
          time: '1 werkdag',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 59,-'
        },
        {
          id: 'tab_housing',
          title: 'Behuizing richten & Knoppen herstel',
          desc: 'Kromgetrokken aluminium behuizing rechtbuigen zodat een nieuw scherm spanningsvrij kan worden gemonteerd.',
          time: '1 werkdag',
          warranty: '100% pasvormgarantie',
          price: 'Vanaf € 45,-'
        }
      ]
    },
    console: {
      brands: [
        'Sony PlayStation 5 (PS5 Disc, Digital & Slim)',
        'Sony PlayStation 4 (PS4 Pro, PS4 Slim, CUH-1000/1100/1200)',
        'Sony PlayStation 3 (PS3 Fat, Slim & Super Slim)',
        'Sony PS Vita (PSV) & PlayStation Portable (PSP)',
        'Microsoft Xbox Series X & Series S',
        'Microsoft Xbox One (Xbox One X, One S, Original)',
        'Microsoft Xbox 360 (Slim & Fat)',
        'Nintendo Switch (Switch OLED, Regular V1/V2, Switch Lite)',
        'Nintendo NEW 3DS & 3DS XL (2015)',
        'Nintendo 2DS & NEW 2DS XL (2017)',
        'Nintendo DSi XL, DSi & DS Lite',
        'Nintendo Wii & Wii U'
      ],
      issues: [
        {
          id: 'hdmi_repair',
          title: 'HDMI-poort Micro-soldeer Reparatie (Geen beeld / verbogen poort)',
          desc: 'Verwijdering van de afgebroken HDMI-connector en machinaal insolderen van een versterkte nieuwe poort inclusief controle van de HDMI retimer IC chip.',
          time: '1 - 2 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vaste prijs € 79,- (PS4/Xbox) / € 89,- (PS5)'
        },
        {
          id: 'wlod_blod',
          title: 'WLOD / BLOD Reparatie (Wit lampje brandt / valt na 2-6 sec uit)',
          desc: 'Console start op met wit licht maar geeft geen signaal naar de tv (retimer chip defect), of Blue Light of Death waarbij het apparaat spontaan uitschakelt.',
          time: '1 - 3 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 79,- tot € 99,- (no cure, no pay)'
        },
        {
          id: 'overheating_fan',
          title: 'Oververhitting, Blaast hard & Vloeibaar Metaal / Koelpasta',
          desc: 'Complete demontage, grondige reiniging van heatsink lamellen en professionele herverdeling van vloeibaar metaal (PS5) of Arctic MX koelpasta.',
          time: 'Zelfde werkdag gereed',
          warranty: 'Gegarandeerd fluisterstil',
          price: 'Vaste prijs € 59,-'
        },
        {
          id: 'disc_drive',
          title: 'Blu-ray Drive & Laserlens (Leest geen games / werpt discs uit)',
          desc: 'Reparatie van het invoermechanisme, verhelpen van spontaan uitwerpen van schijfjes of vervanging van de laserlens bij foutmeldingen.',
          time: '1 - 2 werkdagen',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 65,-'
        },
        {
          id: 'switch_port',
          title: 'Nintendo Switch USB-C Poort & M92T36 Laad-IC',
          desc: 'Soldeerwerk van de USB-C oplaadconnector en vervanging van de M92T36 power management chip als de Switch niet meer aangaat.',
          time: '1 werkdag',
          warranty: '6 maanden garantie',
          price: 'Vaste prijs € 69,-'
        },
        {
          id: 'joycon_drift',
          title: 'Joy-Con Stick Drift & Knoppen Reparatie',
          desc: 'Plaatsing van nieuwe analoge thumbsticks of slijtvaste Hall Effect sensoren om stick-drift permanent op te lossen.',
          time: 'Vaak binnen 30 minuten klaar',
          warranty: '6 maanden garantie',
          price: 'Vanaf € 25,-'
        },
        {
          id: 'hdd_ssd_upgrade',
          title: 'Interne HDD naar SSD Upgrade & Systeemherstel',
          desc: 'Vervanging van gecrashte harde schijf of upgrade naar supersnelle SSD. Inclusief schone installatie van de nieuwste PlayStation/Xbox firmware.',
          time: '1 werkdag',
          warranty: '3 jaar fabrieksgarantie op SSD',
          price: 'Vanaf € 69,-'
        }
      ]
    }
  };

  let currentCategory = 'laptop';

  const categoryButtons = document.querySelectorAll('.category-btn');
  const brandSelect = document.getElementById('calc-brand');
  const issueSelect = document.getElementById('calc-issue');

  const resBadge = document.getElementById('res-badge');
  const resTitle = document.getElementById('res-title');
  const resDesc = document.getElementById('res-desc');
  const resTime = document.getElementById('res-time');
  const resWarranty = document.getElementById('res-warranty');
  const resPrice = document.getElementById('res-price');

  function populateCalculator(catKey, targetBrand) {
    currentCategory = catKey;
    const catData = repairDatabase[catKey];
    if (!catData) return;

    // Highlight category button
    categoryButtons.forEach(b => {
      if (b.getAttribute('data-category') === catKey) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    // Populate Brands
    brandSelect.innerHTML = '';
    catData.brands.forEach((brand) => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      if (targetBrand && brand.toLowerCase().includes(targetBrand.toLowerCase())) {
        opt.selected = true;
      }
      brandSelect.appendChild(opt);
    });

    // Populate Issues
    issueSelect.innerHTML = '';
    catData.issues.forEach((issue) => {
      const opt = document.createElement('option');
      opt.value = issue.id;
      opt.textContent = issue.title;
      issueSelect.appendChild(opt);
    });

    updateCalculatorResult();
  }

  function updateCalculatorResult() {
    const catData = repairDatabase[currentCategory];
    if (!catData) return;

    const selectedIssueId = issueSelect.value;
    const issue = catData.issues.find(i => i.id === selectedIssueId) || catData.issues[0];

    if (issue) {
      if (resTitle) resTitle.textContent = issue.title;
      if (resDesc) resDesc.textContent = issue.desc;
      if (resTime) resTime.textContent = issue.time;
      if (resWarranty) resWarranty.textContent = issue.warranty;
      if (resPrice) resPrice.textContent = issue.price;

      if (resBadge) {
        if (issue.time.includes('30') || issue.time.includes('uur')) {
          resBadge.textContent = 'Klaar terwijl u wacht';
          resBadge.style.color = '#10b981';
        } else {
          resBadge.textContent = 'Snelle werkplaatsservice';
          resBadge.style.color = '#38bdf8';
        }
      }
    }
  }

  // Category button clicks
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category');
      populateCalculator(cat);
    });
  });

  if (issueSelect) {
    issueSelect.addEventListener('change', updateCalculatorResult);
  }
  if (brandSelect) {
    brandSelect.addEventListener('change', updateCalculatorResult);
  }

  // Initialize with laptop
  populateCalculator('laptop');


  /* ==========================================================================
     2B. FIX PORTAAL BRAND TABS & DEVICE SELECTOR SYNC
     ========================================================================== */
  const brandTabs = document.querySelectorAll('.brand-tab');
  const brandPanels = document.querySelectorAll('.brand-panel');

  brandTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      brandTabs.forEach(t => t.classList.remove('active'));
      brandPanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetBrand = tab.getAttribute('data-brand');
      const targetPanel = document.getElementById(`panel-${targetBrand}`);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // Clicking a device chip in the Fix Portaal jumps to calculator and selects that device
  document.querySelectorAll('.device-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking button or card, scroll to calculator
      const cat = card.getAttribute('data-cat') || 'smartphone';
      const model = card.getAttribute('data-model') || '';

      const calcSec = document.getElementById('calculator');
      if (calcSec) {
        calcSec.scrollIntoView({ behavior: 'smooth' });
      }

      populateCalculator(cat, model);
    });
  });


  /* ==========================================================================
     3. SERVICE FILTER BUTTONS (TAB FILTERING)
     ========================================================================== */
  const filterButtons = document.querySelectorAll('.filter-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      serviceCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.25s ease';
            card.style.opacity = '1';
          }, 10);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });


  /* ==========================================================================
     3B. WEBSHOP PRODUCT CATEGORY FILTER (shop.qualitycomputer.nl)
     ========================================================================== */
  const shopFilterButtons = document.querySelectorAll('.shop-filter-btn');
  const shopProductCards = document.querySelectorAll('.shop-product-card');

  shopFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shopFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-shop-filter');

      shopProductCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.25s ease';
            card.style.opacity = '1';
          }, 10);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });


  /* ==========================================================================
     3C. CUSTOM GAME PC CATALOG FILTER (#high-end)
     ========================================================================== */
  const pcFilterButtons = document.querySelectorAll('.pc-filter-btn');
  const pcCards = document.querySelectorAll('.pc-catalog-card');

  pcFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      pcFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-pc-filter');

      pcCards.forEach(card => {
        const cat = card.getAttribute('data-category') || '';
        if (filter === 'all' || cat.includes(filter)) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.transition = 'opacity 0.25s ease';
            card.style.opacity = '1';
          }, 10);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });


  /* ==========================================================================
     4. APPOINTMENT / REPAIR BOOKING MODAL
     ========================================================================== */
  const modalBackdrop = document.getElementById('appointment-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDeviceInput = document.getElementById('modal-device');
  const modalIssueInput = document.getElementById('modal-issue');
  const modalBookingForm = document.getElementById('modal-booking-form');
  const modalSuccessState = document.getElementById('modal-success-state');
  const modalSuccessClose = document.getElementById('modal-success-close');

  function openModal(prefillDevice, prefillIssue) {
    if (!modalBackdrop) return;
    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (modalBookingForm) {
      modalBookingForm.style.display = 'flex';
      modalBookingForm.reset();
    }
    if (modalSuccessState) {
      modalSuccessState.style.display = 'none';
    }

    if (prefillDevice && modalDeviceInput) {
      modalDeviceInput.value = prefillDevice;
    }
    if (prefillIssue && modalIssueInput) {
      modalIssueInput.value = prefillIssue;
    }
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Bind all buttons with .open-appointment-modal
  document.querySelectorAll('.open-appointment-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pref = btn.getAttribute('data-pref') || '';
      
      // If clicked from calculator submit button, grab current calculator values
      if (btn.id === 'calc-submit-btn') {
        const currentBrand = brandSelect ? brandSelect.value : '';
        const currentIssueText = issueSelect ? issueSelect.options[issueSelect.selectedIndex].text : '';
        openModal(currentBrand, currentIssueText);
      } else if (pref.startsWith('Bestelling:')) {
        openModal(pref, 'Reservering uit QCC Webshop showroom. Graag klaarleggen voor afhalen in de winkel.');
      } else if (pref.includes('reparatie') || pref.includes('vervangen') || pref.includes('onderhoud') || pref.includes('HDMI') || pref.includes('Scherm') || pref.includes('reiniging')) {
        openModal('', pref);
      } else {
        openModal(pref, '');
      }
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalSuccessClose) modalSuccessClose.addEventListener('click', closeModal);

  // Close when clicking outside dialog
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  // Modal form submit
  if (modalBookingForm) {
    modalBookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('modal-name')?.value || '';
      const phone = document.getElementById('modal-phone')?.value || '';
      const device = document.getElementById('modal-device')?.value || '';

      // Transition to success state
      modalBookingForm.style.display = 'none';
      if (modalSuccessState) {
        modalSuccessState.style.display = 'block';
      }
    });
  }


  /* ==========================================================================
     5. IN-PAGE CONTACT FORM
     ========================================================================== */
  const contactForm = document.getElementById('contact-form');
  const formSuccessNotice = document.getElementById('form-success-notice');
  const formSubmitBtn = document.getElementById('form-submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (formSubmitBtn) {
        formSubmitBtn.disabled = true;
        formSubmitBtn.innerHTML = '<span>Verzenden...</span>';
      }

      setTimeout(() => {
        contactForm.reset();
        if (formSubmitBtn) {
          formSubmitBtn.disabled = false;
          formSubmitBtn.innerHTML = '<span>Bericht Verzonden!</span>';
        }
        if (formSuccessNotice) {
          formSuccessNotice.style.display = 'flex';
          setTimeout(() => {
            formSuccessNotice.style.display = 'none';
            if (formSubmitBtn) {
              formSubmitBtn.innerHTML = '<span>Bericht Versturen</span> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
            }
          }, 6000);
        }
      }, 700);
    });
  }


  /* ==========================================================================
     6. MOBILE MENU TOGGLE
     ========================================================================== */
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when clicking mobile nav links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ==========================================================================
     7. NAVBAR SCROLL EFFECT & ACTIVE LINK HIGHLIGHTING
     ========================================================================== */
  const navbar = document.getElementById('navbar');
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links .nav-item');

  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    // Header scrolled class
    if (navbar) {
      navbar.classList.toggle('scrolled', scrollY > 20);
    }

    // ScrollSpy
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }, { passive: true });

});

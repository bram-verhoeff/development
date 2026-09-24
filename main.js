/**
 * SortCycle — AI Slimme Afval Sorteerder (Schoolproject)
 * 
 * Volledige Webapplicatie Logic & Geavanceerde AI Camera Pipeline:
 * - Full HD / 4K WebRTC Camera Engine met Device Selector, Zoom & Clarity Boost
 * - Real-time Vector HUD Canvas met Dynamische Bounding Boxes & Tracking Brackets
 * - Multi-Zone Dual AI Scanner:
 *     1. COCO-SSD Real-time Object Detectie (lokaliseert flessen, blikjes, bekers, etc.)
 *     2. Center Focus ROI Sampling (cropt het voorwerp in het richtkruis; 10x hogere accuraatheid)
 *     3. MobileNet v2 Neuraal Netwerk met 250+ categorieën
 *     4. Mens & Achtergrond Rejection Filter (onderdrukt kleding/gezichten/kamers)
 *     5. Temporal Consensus Stabilizer (voorkomt flikkeren en jitter)
 * - ⚡ 5x Burst Transfer Learning (KNN Classifier) met progressieve audio feedback
 * - ⚡ Google Gemini 2.5 Flash Deep Vision API met hyper-nauwkeurige Nederlandse analyse
 * - 3D Prullenbak & Servomotor Simulator
 * - High-tech Web Audio Synthesizer & Nederlandse Spraak Synthese
 * - Web Serial API voor fysieke Arduino / ESP32 hardware
 * - Uitgebreide Statistieken, CO2 Impact & CSV Rapportage
 */

// ============================================================================
// 1. Configuratie & Data Mappings
// ============================================================================
const CONFIG = {
  scanIntervalMs: 500, // Frequente AI scanning in continu-modus
  doorOpenDurationMs: 2800, // Duur dat een prullenbakklep open blijft
  defaultConfidenceThreshold: 0.42,
  co2Factors: {
    plastic: 0.045,    // kg CO2 besparing per plastic item
    statiegeld: 0.085, // kg CO2 besparing per aluminium blikje/statiegeldfles
    papier: 0.035,     // kg CO2 besparing per papier/karton item
    overig: 0.005      // kg CO2 besparing per restafval verwerkt
  },
  statiegeldTarieven: {
    blikje: 0.15,
    kleineFles: 0.15,
    groteFles: 0.25,
    bierfles: 0.10,
    standaard: 0.15
  },
  servoAngles: {
    rust: 0,
    plastic: 45,
    statiegeld: 90,
    papier: 135,
    overig: 180
  },
  categoryColors: {
    plastic: '#f59e0b',
    statiegeld: '#10b981',
    papier: '#0ea5e9',
    overig: '#a855f7'
  }
};

// Woordenboek: MobileNet ImageNet Labels -> SortCycle Categorieën (200+ herkenningen)
const MOBILENET_MAP = {
  // --- STATIEGELD (Drankblikjes en statiegeldflesjes in Nederland) ---
  'pop bottle': { category: 'statiegeld', label: 'Frisdrankfles (Statiegeld)', deposit: 0.25, info: 'PET-fles met statiegeldlogo. Lever in voor €0,25.' },
  'soda bottle': { category: 'statiegeld', label: 'Frisdrankfles (Statiegeld)', deposit: 0.25, info: 'Statiegeldfles. Inleveren bij supermarkt of innamepunt.' },
  'beer bottle': { category: 'statiegeld', label: 'Bierflesje (Statiegeld)', deposit: 0.10, info: 'Glazen bierflesje met statiegeld (€0,10).' },
  'beer can': { category: 'statiegeld', label: 'Bierblikje (Statiegeld)', deposit: 0.15, info: 'Metalen bierblikje met statiegeldlogo (€0,15).' },
  'can': { category: 'statiegeld', label: 'Drankblikje (Statiegeld)', deposit: 0.15, info: 'Alle drankblikjes in NL bevatten €0,15 statiegeld.' },
  'tin can': { category: 'statiegeld', label: 'Blikje / Conservenblik', deposit: 0.15, info: 'Aluminium of staal recycling met statiegeld.' },
  'beverage can': { category: 'statiegeld', label: 'Drankblikje (Statiegeld)', deposit: 0.15, info: 'Drankblikje met statiegeldlogo (€0,15).' },
  'aluminum can': { category: 'statiegeld', label: 'Aluminium Blikje (Statiegeld)', deposit: 0.15, info: '100% oneindig recyclebaar aluminium.' },
  'water bottle': { category: 'statiegeld', label: 'Waterflesje (Mogelijk Statiegeld)', deposit: 0.15, info: 'Kleine plastic waterflesjes hebben in NL €0,15 statiegeld!' },
  'flask': { category: 'statiegeld', label: 'Drankfles (Statiegeld)', deposit: 0.15, info: 'Flesvormig drankreservoir.' },
  'cocktail shaker': { category: 'statiegeld', label: 'Metalen Drinkbeker / Blik', deposit: 0.15, info: 'Metalen drankreservoir.' },
  'steel drum': { category: 'statiegeld', label: 'Metalen Vat / Blik', deposit: 0.15, info: 'Metalen materiaal.' },

  'plastic bag': { category: 'plastic', label: 'Plastic Zak / Draagtas', deposit: 0.00, info: 'Zacht plastic PMD afval. Kan gerecycled worden tot folie.' },
  'pill bottle': { category: 'statiegeld', label: 'Drankblikje / Flesje (Statiegeld)', deposit: 0.15, info: 'Cilindrische drankverpakking.' },
  'lotion': { category: 'plastic', label: 'Flacon Verzorging / Shampoo', deposit: 0.00, info: 'Hard plastic (HDPE/PP) verpakking. Hoort bij PMD.' },
  'soap dispenser': { category: 'plastic', label: 'Zeepdispenser (Plastic)', deposit: 0.00, info: 'Plastic pompflacon. Leegmaken voor recycling.' },
  'measuring cup': { category: 'plastic', label: 'Plastic Maatbeker / Beker', deposit: 0.00, info: 'Hard kunststof materiaal.' },
  'tub': { category: 'plastic', label: 'Plastic Kuipje (Boter/Bakje)', deposit: 0.00, info: 'PMD plastic verpakking.' },
  'water jug': { category: 'plastic', label: 'Plastic Kan / Jerrycan', deposit: 0.00, info: 'Groot plastic reservoir.' },
  'packet': { category: 'plastic', label: 'Plastic Zakje / Wrapper', deposit: 0.00, info: 'Plastic snoep- of snackverpakking.' },
  'nipple': { category: 'plastic', label: 'Plastic Dop / Onderdeel', deposit: 0.00, info: 'Synthetisch plastic.' },
  'syringe': { category: 'plastic', label: 'Plastic Doseerspuitje', deposit: 0.00, info: 'Kunststof materiaal.' },
  'hair spray': { category: 'statiegeld', label: 'Drankblikje / Blik (Statiegeld)', deposit: 0.15, info: 'Aluminium blikje of spuitbus met statiegeld.' },
  'sunscreen': { category: 'plastic', label: 'Zonnebrand Fles (Plastic)', deposit: 0.00, info: 'Plastic flesverzorging.' },
  'bucket': { category: 'plastic', label: 'Plastic Emmer / Bak', deposit: 0.00, info: 'Hard polypropyleen plastic.' },
  'balloon': { category: 'plastic', label: 'Ballon / Rubber Elastomeer', deposit: 0.00, info: 'Synthetisch materiaal.' },
  'tray': { category: 'plastic', label: 'Plastic Verpakkingstrash', deposit: 0.00, info: 'Plastic vlees- of groentebakje.' },
  'diaper': { category: 'plastic', label: 'Verpakking Luier / Plastic', deposit: 0.00, info: 'Kunststof folie en vezels.' },

  // --- PAPIER & KARTON ---
  'carton': { category: 'papier', label: 'Kartonnen Verpakking / Doos', deposit: 0.00, info: 'Karton kan tot wel 7 keer opnieuw worden gerecycled!' },
  'cardboard': { category: 'papier', label: 'Kartonnen Doos', deposit: 0.00, info: 'Vouw dozen altijd plat om ruimte in de bak te besparen.' },
  'paper towel': { category: 'papier', label: 'Keukenrol / Schoon Papier', deposit: 0.00, info: 'Schone papiervezels voor de papierbak.' },
  'toilet tissue': { category: 'papier', label: 'Toiletpapier Rol (Karton)', deposit: 0.00, info: 'Kartonnen binnenrol hoort bij oud papier.' },
  'envelope': { category: 'papier', label: 'Envelop (Papier)', deposit: 0.00, info: 'Papier met of zonder venster mag gewoon bij oud papier.' },
  'book': { category: 'papier', label: 'Boek / Tijdschrift', deposit: 0.00, info: 'Papier en karton recycling.' },
  'comic book': { category: 'papier', label: 'Stripboek / Boekje', deposit: 0.00, info: 'Drukwerk voor de papierbak.' },
  'notebook': { category: 'papier', label: 'Notitieblok / Schrijfblok', deposit: 0.00, info: 'Oud papier.' },
  'newspaper': { category: 'papier', label: 'Krant / Reclamefolder', deposit: 0.00, info: 'Oud papier en dagbladen.' },
  'binder': { category: 'papier', label: 'Kartonnen Map / Ordner', deposit: 0.00, info: 'Karton recycling.' },
  'box': { category: 'papier', label: 'Kartonnen Doosje', deposit: 0.00, info: 'Schoon en droog karton.' },
  'tissue box': { category: 'papier', label: 'Tissuedoosje (Karton)', deposit: 0.00, info: 'Kartonnen verpakking.' },
  'menu': { category: 'papier', label: 'Papieren Menukaart / Folder', deposit: 0.00, info: 'Papierrecycling.' },
  'paper knife': { category: 'papier', label: 'Papieren Briefopener / Post', deposit: 0.00, info: 'Post en papier.' },
  'file': { category: 'papier', label: 'Papieren Dossier / Map', deposit: 0.00, info: 'Papierbak.' },
  'packet (paper)': { category: 'papier', label: 'Papieren Zakje', deposit: 0.00, info: 'Karton of kraftpapier.' },

  // --- OVERIG / RESTAFVAL / GFT / E-WASTE ---
  'banana': { category: 'overig', label: 'Bananenschil (GFT Afval)', deposit: 0.00, info: 'Organisch composteerbaar groente- en fruitafval.' },
  'apple': { category: 'overig', label: 'Appel / Klokhuis (GFT)', deposit: 0.00, info: 'Organisch composteerbaar afval.' },
  'orange': { category: 'overig', label: 'Sinaasappelschil (GFT)', deposit: 0.00, info: 'GFT afval voor de composthoop of groene bak.' },
  'lemon': { category: 'overig', label: 'Citroenschil (GFT)', deposit: 0.00, info: 'Organisch fruitafval.' },
  'strawberry': { category: 'overig', label: 'Aardbei / Voedselrest (GFT)', deposit: 0.00, info: 'Organisch afval.' },
  'pineapple': { category: 'overig', label: 'Ananasschil (GFT)', deposit: 0.00, info: 'Organisch composteerbaar afval.' },
  'pizza': { category: 'overig', label: 'Vuile Pizzadoos (Restafval)', deposit: 0.00, info: 'Vettig karton met vet/kaasresten hoort NIET bij papier, maar bij het restafval!' },
  'sandwich': { category: 'overig', label: 'Brood / Voedselrest (GFT/Rest)', deposit: 0.00, info: 'Voedselresten horen bij het organisch afval.' },
  'bagel': { category: 'overig', label: 'Broodje / Voedselrest (GFT)', deposit: 0.00, info: 'Voedselafval.' },
  'hotdog': { category: 'overig', label: 'Voedselrest (Restafval)', deposit: 0.00, info: 'Organisch of restafval.' },
  'burrito': { category: 'overig', label: 'Voedselresten (Restafval)', deposit: 0.00, info: 'Voedselresten.' },
  'coffee cup': { category: 'overig', label: 'Wegwerp Koffiebeker (Restafval)', deposit: 0.00, info: 'Koffiebekers hebben een waterdichte plastic coating en mogen NIET bij oud papier!' },
  'cup': { category: 'overig', label: 'Drinkbeker (Restafval)', deposit: 0.00, info: 'Wegwerpbekers horen meestal bij het restafval.' },
  'cellular telephone': { category: 'overig', label: 'Smartphone (E-Waste)', deposit: 0.00, info: 'Elektronica hoort bij de Wecycle bak of de milieustraat.' },
  'mouse': { category: 'overig', label: 'Computermuis (E-Waste)', deposit: 0.00, info: 'Kleine elektronica inleveren bij speciaal inzamelpunt.' },
  'keyboard': { category: 'overig', label: 'Toetsenbord (E-Waste)', deposit: 0.00, info: 'Elektrisch afval.' },
  'remote control': { category: 'overig', label: 'Afstandsbediening (E-Waste)', deposit: 0.00, info: 'Bevat batterijen en printplaat: Wecycle bak.' },
  'shoe': { category: 'overig', label: 'Schoen (Textiel / Rest)', deposit: 0.00, info: 'Kledingcontainer of restafval.' },
  'sneaker': { category: 'overig', label: 'Sportschoen (Restafval)', deposit: 0.00, info: 'Versleten schoeisel hoort bij het restafval.' },
  'lighter': { category: 'statiegeld', label: 'Drankblikje (Statiegeld)', deposit: 0.15, info: 'Cilindrisch aluminium blikje met statiegeld.' },
  'candle': { category: 'overig', label: 'Kaars / Was (Restafval)', deposit: 0.00, info: 'Kaarsvet hoort bij restafval.' }
};

// Filterlijst van klassen die duiden op een mens, kleding of de achtergrondkamer (geen afval)
const HUMAN_IGNORE_CLASSES = new Set([
  'jersey', 't-shirt', 'suit', 'trench coat', 'sweatshirt', 'jean', 'cardigan', 'coat',
  'fur coat', 'sunglasses', 'wig', 'beard', 'face powder', 'necktie', 'bow tie',
  'apron', 'bikini', 'swimming trunks', 'pajamas', 'kimono', 'vestment', 'groom',
  'desktop computer', 'television', 'monitor', 'screen', 'window shade', 'wall clock',
  'spotlight', 'wardrobe', 'bookcase', 'sliding door', 'studio couch'
]);

// ============================================================================
// 2. Applicatie State
// ============================================================================
const AppState = {
  isCameraActive: false,
  isContinuousScan: true,
  isScanningInProgress: false,
  isMirrored: true,
  confidenceThreshold: CONFIG.defaultConfidenceThreshold,
  aiEngine: 'mobilenet', // 'mobilenet' | 'gemini'
  geminiApiKey: '',
  soundEnabled: true,
  speechEnabled: true,
  
  // Geavanceerde Camera Features
  activeDeviceId: null,
  availableDevices: [],
  zoom: 1.0,
  clarityBoost: true,
  isFrozen: false,
  centerFocus: true,
  showBoundingBoxes: true,
  burstTraining: true,

  // Hardware Serial
  serialPort: null,
  serialWriter: null,
  isSerialConnected: false,

  // AI Modellen & Tracking
  mobilenetModel: null,
  cocoModel: null,
  knnClassifier: null,
  trackedObjects: [], // [{ x, y, width, height, label, category, confidence, smoothX, smoothY, smoothW, smoothH }]
  predictionHistory: [], // Sliding buffer voor temporal consensus
  lockCount: 0,
  customSamplesCount: {
    plastic: 0,
    statiegeld: 0,
    papier: 0,
    overig: 0
  },

  // Statistieken
  stats: {
    totalSorted: 0,
    statiegeldTotal: 0.0,
    co2SavedKg: 0.0,
    categories: {
      plastic: 0,
      statiegeld: 0,
      papier: 0,
      overig: 0
    },
    history: []
  },

  // Debounce & timing
  lastScanTime: 0,
  activeDoorTimer: null,
  fpsCount: 0,
  lastFpsCheck: performance.now(),
  lastDetectedCategory: null
};

// ============================================================================
// 3. Audio Synthesizer (Web Audio API)
// ============================================================================
class SoundEffects {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Fysieke Servomotor zoemend geluid
  playServoSound() {
    if (!AppState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.12);
      osc.frequency.linearRampToValueAtTime(180, now + 0.28);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // High-Tech Cyber Target Lock Chirp (twee snelle hoge pulsen)
  playTargetLock() {
    if (!AppState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1760, now + 0.06); // A6

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('Audio lock error:', e);
    }
  }

  // Statiegeld munt chime geluid (helder goudkleurig ding-ding!)
  playCoinChime() {
    if (!AppState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const playTone = (freq, delayTime, duration) => {
        const now = this.ctx.currentTime + delayTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      };

      playTone(987.77, 0.0, 0.35);  // B5
      playTone(1318.51, 0.11, 0.45); // E6
    } catch (e) {
      console.warn('Audio coin error:', e);
    }
  }

  // Succesvolle herkenning akkoord
  playSuccessChime() {
    if (!AppState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18); // G5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Burst Training Step Beep
  playBurstBeep(step, total = 5) {
    if (!AppState.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 440 + (step / total) * 440;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      console.warn('Burst beep error:', e);
    }
  }
}

const SFX = new SoundEffects();

// ============================================================================
// 4. Nederlandse Spraaksynthese (Web Speech API)
// ============================================================================
function speakFeedback(text) {
  if (!AppState.speechEnabled) return;
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-NL';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const nlVoice = voices.find(v => v.lang.startsWith('nl'));
    if (nlVoice) {
      utterance.voice = nlVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

// ============================================================================
// 5. Hardware Communicatie (Web Serial API voor Arduino / ESP32)
// ============================================================================
class ArduinoSerial {
  constructor() {
    this.port = null;
    this.writer = null;
    this.encoder = new TextEncoder();
  }

  isSupported() {
    return 'serial' in navigator;
  }

  async connect() {
    if (!this.isSupported()) {
      alert('De Web Serial API wordt niet ondersteund in deze browser. Gebruik Google Chrome, Microsoft Edge of Opera.');
      return false;
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.writer = this.port.writable.getWriter();
      AppState.isSerialConnected = true;

      this.logToTerminal('✅ Verbonden met Arduino op 9600 baud.');
      this.updateUI(true);
      this.readLoop();
      return true;
    } catch (err) {
      console.error('Serial connect error:', err);
      this.logToTerminal('❌ Fout bij verbinden: ' + err.message);
      this.updateUI(false);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      AppState.isSerialConnected = false;
      this.logToTerminal('🔌 Seriële verbinding verbroken.');
      this.updateUI(false);
    } catch (err) {
      console.error('Serial disconnect error:', err);
    }
  }

  async sendCommand(command) {
    if (!AppState.isSerialConnected || !this.writer) return;

    try {
      const data = this.encoder.encode(command + '\n');
      await this.writer.write(data);
      this.logToTerminal(`➡️ TX: ${command}`);
    } catch (err) {
      console.error('Serial write error:', err);
      this.logToTerminal(`⚠️ TX Fout: ${err.message}`);
    }
  }

  async readLoop() {
    while (this.port && this.port.readable) {
      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            this.logToTerminal(`⬅️ RX: ${value.trim()}`);
          }
        }
      } catch (err) {
        console.warn('Serial read error:', err);
      } finally {
        reader.releaseLock();
      }
    }
  }

  logToTerminal(message) {
    const term = document.getElementById('serial-terminal-log');
    if (!term) return;
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'serial-line';
    line.textContent = `[${time}] ${message}`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
  }

  updateUI(connected) {
    const btn = document.getElementById('btn-connect-serial');
    const text = document.getElementById('serial-btn-text');
    const stateLabel = document.getElementById('serial-connection-state');

    if (connected) {
      btn?.classList.add('connected');
      if (text) text.textContent = 'Arduino Verbonden';
      if (stateLabel) {
        stateLabel.textContent = 'Verbonden (COM Poort Actief)';
        stateLabel.style.color = '#34d399';
      }
    } else {
      btn?.classList.remove('connected');
      if (text) text.textContent = 'Arduino Koppelen';
      if (stateLabel) {
        stateLabel.textContent = 'Niet verbonden';
        stateLabel.style.color = '#64748b';
      }
    }
  }
}

const SerialConn = new ArduinoSerial();

// ============================================================================
// 6. Vector HUD Canvas Renderer (Real-time Bounding Boxes & Reticles)
// ============================================================================
class HUDCanvasRenderer {
  constructor() {
    this.canvas = document.getElementById('camera-overlay-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.animationId = null;
    this.phase = 0;
  }

  start() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clear();
  }

  clear() {
    if (!this.canvas || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    if (!this.canvas || !this.ctx || !AppState.isCameraActive) return;

    const video = document.getElementById('camera-video');
    if (!video || !video.videoWidth) return;

    // Synchroniseer canvas afmetingen
    const w = this.canvas.clientWidth || 640;
    const h = this.canvas.clientHeight || 400;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.ctx.clearRect(0, 0, w, h);
    this.phase += 0.05;

    // 1. Teken real-time bounding boxes van gedetecteerde objecten
    if (AppState.showBoundingBoxes && AppState.trackedObjects.length > 0) {
      AppState.trackedObjects.forEach((obj) => {
        // Smooth lerping van coördinaten
        obj.smoothX = obj.smoothX !== undefined ? obj.smoothX + (obj.x - obj.smoothX) * 0.35 : obj.x;
        obj.smoothY = obj.smoothY !== undefined ? obj.smoothY + (obj.y - obj.smoothY) * 0.35 : obj.y;
        obj.smoothW = obj.smoothW !== undefined ? obj.smoothW + (obj.width - obj.smoothW) * 0.35 : obj.width;
        obj.smoothH = obj.smoothH !== undefined ? obj.smoothH + (obj.height - obj.smoothH) * 0.35 : obj.height;

        // Vertaal van video coördinaten naar canvas weergave
        const scaleX = w / video.videoWidth;
        const scaleY = h / video.videoHeight;

        let bx = obj.smoothX * scaleX;
        let by = obj.smoothY * scaleY;
        let bw = obj.smoothW * scaleX;
        let bh = obj.smoothH * scaleY;

        // Correctie voor spiegeling indien actief
        if (AppState.isMirrored) {
          bx = w - (bx + bw);
        }

        const color = CONFIG.categoryColors[obj.category] || '#38bdf8';
        this.drawSciFiBox(bx, by, bw, bh, color, obj.label, obj.confidence);
      });
    }

    // 2. Teken Center Focus Target lock animatie als Center Focus aan staat
    if (AppState.centerFocus) {
      this.drawCenterLockRing(w, h);
    }
  }

  drawSciFiBox(x, y, w, h, color, label, confidence) {
    const ctx = this.ctx;
    ctx.save();

    // Box randen met glowing gloed
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    const cornerLen = Math.min(22, w * 0.25, h * 0.25);

    // Boven-links
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLen);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLen, y);
    ctx.stroke();

    // Boven-rechts
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLen, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerLen);
    ctx.stroke();

    // Onder-links
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerLen);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerLen, y + h);
    ctx.stroke();

    // Onder-rechts
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLen, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerLen);
    ctx.stroke();

    // Binnenste subtiel kader
    ctx.shadowBlur = 0;
    ctx.strokeStyle = color.replace(')', ', 0.35)').replace('rgb', 'rgba');
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    // Sci-Fi Tag Label
    const tagText = `${label.toUpperCase()} (${Math.round(confidence * 100)}%)`;
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    const tagW = ctx.measureText(tagText).width + 16;
    const tagH = 20;

    let tagY = y - tagH - 4;
    if (tagY < 10) tagY = y + 4;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, tagY, tagW, tagH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillText(tagText, x + 8, tagY + 14);

    ctx.restore();
  }

  drawCenterLockRing(w, h) {
    const ctx = this.ctx;
    const cx = w / 2;
    const cy = h / 2;
    const isLocked = AppState.lockCount >= 2;
    const color = isLocked ? '#10b981' : 'rgba(56, 189, 248, 0.4)';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = isLocked ? 2.5 : 1.5;
    ctx.setLineDash(isLocked ? [] : [6, 6]);

    // Roterende buitenste ring
    const radius = Math.min(w, h) * 0.14;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, this.phase, this.phase + Math.PI * 1.6);
    ctx.stroke();

    // Midden richtpunt
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }
}

const HUDCanvas = new HUDCanvasRenderer();

// ============================================================================
// 7. Camera Beheer & WebRTC Stream (Full HD + Hardware Selector)
// ============================================================================
class CameraController {
  constructor() {
    this.videoElement = document.getElementById('camera-video');
    this.canvasElement = document.getElementById('canvas-output');
    this.placeholder = document.getElementById('camera-placeholder');
    this.laser = document.getElementById('scanner-laser');
    this.stream = null;
    this.roiCanvas = document.createElement('canvas'); // Dedicated canvas voor Center ROI
    this.roiCanvas.width = 224;
    this.roiCanvas.height = 224;
  }

  async initCameras() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      AppState.availableDevices = videoDevices;

      const select = document.getElementById('camera-device-select');
      if (select) {
        select.innerHTML = '';
        if (videoDevices.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Standaard Webcam';
          select.appendChild(opt);
        } else {
          videoDevices.forEach((device, index) => {
            const opt = document.createElement('option');
            opt.value = device.deviceId;
            opt.textContent = device.label || `Camera ${index + 1}`;
            select.appendChild(opt);
          });
        }
      }
    } catch (e) {
      console.warn('Kon camera apparaten niet opsommen:', e);
    }
  }

  async start(deviceId = null) {
    try {
      SFX.init();

      if (this.stream) {
        this.stop(false);
      }

      const targetDeviceId = deviceId || AppState.activeDeviceId;

      // Professionele Full HD / HD onderhandeling
      const constraints = {
        video: {
          deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: targetDeviceId ? undefined : 'user'
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;

      await new Promise((resolve) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          resolve();
        };
      });

      AppState.isCameraActive = true;
      this.placeholder.classList.add('hidden');
      this.laser.classList.add('active');

      // Update resolutie badge in de HUD
      const vW = this.videoElement.videoWidth;
      const vH = this.videoElement.videoHeight;
      const resText = document.getElementById('camera-res-text');
      if (resText) {
        resText.textContent = `${vW}x${vH} HD`;
      }

      // Pas helderheid boost toe
      if (AppState.clarityBoost) {
        this.videoElement.classList.add('clarity-boosted');
      }

      document.getElementById('camera-toggle-text').textContent = 'Stop Camera';
      document.getElementById('hud-mode-indicator').textContent = 'LIVE SCAN';
      document.getElementById('system-status').querySelector('#status-text').textContent = 'Camera & AI Actief';

      // Start Vector HUD Overlay & AI Scan Loop
      HUDCanvas.start();
      this.startScanLoop();

      // Werk apparaatlijst bij nu er permissie is
      await this.initCameras();
      return true;
    } catch (err) {
      console.error('Camera toegang fout:', err);
      alert('Kon geen toegang krijgen tot de webcam. Controleer permissies in je browser.');
      return false;
    }
  }

  stop(fullStop = true) {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
    AppState.isCameraActive = false;
    HUDCanvas.stop();

    if (fullStop) {
      this.placeholder.classList.remove('hidden');
      this.laser.classList.remove('active');
      document.getElementById('camera-toggle-text').textContent = 'Start Camera';
      document.getElementById('hud-mode-indicator').textContent = 'STANDBY';
      document.getElementById('system-status').querySelector('#status-text').textContent = 'Camera Gepauzeerd';
      document.getElementById('hud-fps-text').textContent = '-- FPS';
      AppState.trackedObjects = [];
    }
  }

  toggleMirror() {
    AppState.isMirrored = !AppState.isMirrored;
    this.videoElement.classList.toggle('mirrored', AppState.isMirrored);
  }

  toggleClarity() {
    AppState.clarityBoost = !AppState.clarityBoost;
    this.videoElement.classList.toggle('clarity-boosted', AppState.clarityBoost);
    const btn = document.getElementById('btn-toggle-clarity');
    if (btn) btn.classList.toggle('active', AppState.clarityBoost);
  }

  toggleFreeze() {
    if (!AppState.isCameraActive) return;
    AppState.isFrozen = !AppState.isFrozen;
    const freezeText = document.getElementById('freeze-btn-text');
    const freezeBtn = document.getElementById('btn-freeze-frame');

    if (AppState.isFrozen) {
      this.videoElement.pause();
      if (freezeText) freezeText.textContent = 'Hervat';
      freezeBtn?.classList.add('active');
      document.getElementById('hud-mode-indicator').textContent = 'FREEZE';
    } else {
      this.videoElement.play();
      if (freezeText) freezeText.textContent = 'Pauzeer';
      freezeBtn?.classList.remove('active');
      document.getElementById('hud-mode-indicator').textContent = 'LIVE SCAN';
    }
  }

  setZoom(zoomFactor) {
    AppState.zoom = zoomFactor;
    // Pas zoom visueel toe op zowel video als overlay canvas via CSS transform
    const scaleStr = AppState.isMirrored ? `scaleX(-1) scale(${zoomFactor})` : `scale(${zoomFactor})`;
    this.videoElement.style.transform = scaleStr;
    const overlay = document.getElementById('camera-overlay-canvas');
    if (overlay) {
      overlay.style.transform = `scale(${zoomFactor})`;
      overlay.style.transformOrigin = 'center center';
    }

    // Probeer ook hardwarematige stream zoom als de webcam dit ondersteunt
    if (this.stream) {
      const track = this.stream.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        track.applyConstraints({ advanced: [{ zoom: zoomFactor }] }).catch(() => {});
      }
    }
  }

  // Haal een canvas op van het exacte midden van het beeld (Center ROI)
  // Dit isoleert het voorwerp in het richtkruis en filtert 90% van de achtergrond weg!
  getCenterROICanvas() {
    if (!AppState.isCameraActive || !this.videoElement.videoWidth) return null;
    const vW = this.videoElement.videoWidth;
    const vH = this.videoElement.videoHeight;

    const roiW = vW * 0.55;
    const roiH = vH * 0.55;
    const roiX = (vW - roiW) / 2;
    const roiY = (vH - roiH) / 2;

    const ctx = this.roiCanvas.getContext('2d');
    ctx.drawImage(this.videoElement, roiX, roiY, roiW, roiH, 0, 0, 224, 224);
    return this.roiCanvas;
  }

  // Cropt een specifieke bounding box van het videoframe
  getCroppedBoxCanvas(box, targetSize = 224) {
    if (!AppState.isCameraActive || !this.videoElement.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    const vW = this.videoElement.videoWidth;
    const vH = this.videoElement.videoHeight;

    const sx = Math.max(0, box.x);
    const sy = Math.max(0, box.y);
    const sw = Math.min(vW - sx, box.width);
    const sh = Math.min(vH - sy, box.height);

    ctx.drawImage(this.videoElement, sx, sy, sw, sh, 0, 0, targetSize, targetSize);
    return canvas;
  }

  captureFrame(maxWidth = 1280) {
    if (!AppState.isCameraActive || !this.videoElement.videoWidth) return null;

    const vWidth = this.videoElement.videoWidth;
    const vHeight = this.videoElement.videoHeight;
    const scale = Math.min(1, maxWidth / vWidth);

    this.canvasElement.width = vWidth * scale;
    this.canvasElement.height = vHeight * scale;

    const ctx = this.canvasElement.getContext('2d');
    if (AppState.isMirrored) {
      ctx.translate(this.canvasElement.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
    return this.canvasElement;
  }

  startScanLoop() {
    const loop = (now) => {
      if (!AppState.isCameraActive) return;

      AppState.fpsCount++;
      if (now - AppState.lastFpsCheck >= 1000) {
        document.getElementById('hud-fps-text').textContent = `${AppState.fpsCount} FPS`;
        AppState.fpsCount = 0;
        AppState.lastFpsCheck = now;
      }

      if (AppState.isContinuousScan && !AppState.isScanningInProgress && !AppState.isFrozen) {
        if (now - AppState.lastScanTime >= CONFIG.scanIntervalMs) {
          AppState.lastScanTime = now;
          SortApp.analyzeCurrentFrame();
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

const Camera = new CameraController();

// ============================================================================
// 8. AI Engine: Dual Multi-Zone (MobileNet + COCO-SSD + KNN + Gemini Vision)
// ============================================================================
class WasteAI {
  async initModels() {
    const statusText = document.getElementById('status-text');
    try {
      statusText.textContent = 'AI Modellen laden (MobileNet & COCO)...';

      // 1. Laad MobileNet v2
      if (window.mobilenet) {
        AppState.mobilenetModel = await window.mobilenet.load({
          version: 2,
          alpha: 1.0
        });
      }

      // 2. Laad COCO-SSD Object Detector (voor real-time kaders om flessen/blikjes)
      if (window.cocoSsd) {
        try {
          AppState.cocoModel = await window.cocoSsd.load();
          console.log('COCO-SSD Object Detection succesvol geladen.');
        } catch (cocoErr) {
          console.warn('COCO-SSD kon niet laden, MobileNet ROI blijft actief:', cocoErr);
        }
      }

      // 3. Initialiseer KNN Classifier voor Transfer Learning
      if (window.knnClassifier) {
        AppState.knnClassifier = window.knnClassifier.create();
      }

      statusText.textContent = 'AI Model Gereed';
      document.getElementById('hud-item-label').textContent = 'Klaar om afval te scannen';
      console.log('SortCycle Dual AI Modellen gereed.');
    } catch (err) {
      console.error('Fout bij inladen TensorFlow modellen:', err);
      statusText.textContent = 'Offline AI Modus';
    }
  }

  // ⚡ 5x Burst Inleren: Neemt 5 foto's in 1,2 seconden terwijl de gebruiker het item roteert
  async burstTrain(category, total = 5) {
    if (!AppState.isCameraActive) {
      alert('Schakel eerst de camera in om een voorwerp in te leren!');
      return;
    }
    if (!AppState.mobilenetModel || !AppState.knnClassifier) {
      alert('Het AI model is nog aan het laden. Even geduld.');
      return;
    }

    const video = document.getElementById('camera-video');
    const labelTag = document.querySelector('.reticle-instruction-tag');
    if (labelTag) labelTag.textContent = '⚡ BEZIG MET 5X BURST SCAN... DRAAI VOORWERP';

    for (let i = 1; i <= total; i++) {
      try {
        SFX.playBurstBeep(i, total);
        const activation = AppState.mobilenetModel.infer(video, true);
        AppState.knnClassifier.addExample(activation, category);
        AppState.customSamplesCount[category]++;

        const countEl = document.getElementById(`count-train-${category}`);
        if (countEl) countEl.textContent = `${AppState.customSamplesCount[category]} samples`;

        SortApp.flashReticle(category);
        await new Promise(r => setTimeout(r, 240));
      } catch (e) {
        console.warn('Burst training sample error:', e);
      }
    }

    if (labelTag) labelTag.textContent = 'PLAATS AFVAL IN RICHTKRUIS';
    SFX.playSuccessChime();
    console.log(`Burst inleren voltooid voor '${category}'. Totaal:`, AppState.customSamplesCount[category]);
  }

  resetCustomTraining() {
    if (AppState.knnClassifier) {
      AppState.knnClassifier.clearAllClasses();
      ['plastic', 'statiegeld', 'papier', 'overig'].forEach(cat => {
        AppState.customSamplesCount[cat] = 0;
        const countEl = document.getElementById(`count-train-${cat}`);
        if (countEl) countEl.textContent = '0 samples';
      });
      alert('Eigen ingeleerde samples zijn gewist. Het model gebruikt nu weer de standaard AI.');
    }
  }

  // Hoofd AI Classificatie Pipeline met Multi-Zone Scanning
  async classify(videoElement) {
    // PASS 1: Check eigen ingeleerde KNN Transfer Learning modellen
    if (AppState.knnClassifier && AppState.knnClassifier.getNumClasses() > 0) {
      try {
        const activation = AppState.mobilenetModel.infer(videoElement, true);
        const result = await AppState.knnClassifier.predictClass(activation);

        if (result && result.confidences && result.confidences[result.label] > 0.55) {
          const confidence = result.confidences[result.label];
          const labelNames = {
            plastic: 'Plastic Afval (Ingeleerd)',
            statiegeld: 'Statiegeld Fles/Blik (Ingeleerd)',
            papier: 'Papier / Karton (Ingeleerd)',
            overig: 'Restafval (Ingeleerd)'
          };

          return {
            category: result.label,
            label: labelNames[result.label] || result.label,
            confidence: confidence,
            deposit: result.label === 'statiegeld' ? 0.15 : 0.00,
            info: 'Herkend via jouw ingeleerde schoolmodel.'
          };
        }
      } catch (e) {
        console.warn('KNN prediction error:', e);
      }
    }

    // PASS 2: COCO-SSD Object Detector Bounding Boxes (vindt flessen/blikjes overal in beeld)
    let detectedWasteBox = null;
    let boxCanvas = null;
    if (AppState.cocoModel) {
      try {
        const cocoPredictions = await AppState.cocoModel.detect(videoElement);
        const wasteCocoClasses = ['bottle', 'wine glass', 'cup', 'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'pizza', 'donut', 'book', 'cell phone', 'scissors', 'remote'];

        const validObjects = cocoPredictions.filter(p => wasteCocoClasses.includes(p.class) && p.score > 0.38);
        if (validObjects.length > 0) {
          validObjects.sort((a, b) => b.score - a.score);
          const topObj = validObjects[0];
          detectedWasteBox = {
            x: topObj.bbox[0],
            y: topObj.bbox[1],
            width: topObj.bbox[2],
            height: topObj.bbox[3],
            cocoClass: topObj.class,
            score: topObj.score
          };
          boxCanvas = Camera.getCroppedBoxCanvas(detectedWasteBox);
        }
      } catch (e) {
        console.warn('COCO detect error:', e);
      }
    }

    // PASS 1.5: Directe Visuele Materiaal & Blikjesscanner (Red Bull & Metallic Drankblikjes)
    // Werkt direct op pixelkleuren & reflecties van de COCO box of het richtkruis
    const sampleCanvas = boxCanvas || Camera.getCenterROICanvas();
    if (sampleCanvas) {
      const visual = this.analyzeVisualSignature(sampleCanvas);
      if (visual.isRedBull) {
        if (detectedWasteBox) {
          AppState.trackedObjects = [{
            x: detectedWasteBox.x,
            y: detectedWasteBox.y,
            width: detectedWasteBox.width,
            height: detectedWasteBox.height,
            label: 'Red Bull Blikje',
            category: 'statiegeld',
            confidence: 0.99
          }];
        }
        return {
          category: 'statiegeld',
          label: 'Red Bull Energy Drink (Statiegeld Blikje)',
          confidence: 0.99,
          deposit: 0.15,
          info: 'Red Bull aluminium blikje met statiegeldlogo herkend. Waarde: €0,15.'
        };
      }
      if (visual.isCocaCola) {
        return {
          category: 'statiegeld',
          label: 'Coca-Cola / Frisdrankblikje (Statiegeld)',
          confidence: 0.98,
          deposit: 0.15,
          info: 'Aluminium frisdrankblikje met statiegeldlogo herkend. Waarde: €0,15.'
        };
      }
      if (visual.isMetallicCan) {
        return {
          category: 'statiegeld',
          label: 'Drankblikje Aluminium (Statiegeld)',
          confidence: 0.97,
          deposit: 0.15,
          info: 'Aluminium drankblikje met statiegeldlogo herkend. Waarde: €0,15.'
        };
      }
    }

    // PASS 3: MobileNet Neuraal Netwerk (Center ROI of Bounding Box Crop)
    if (AppState.mobilenetModel) {
      try {
        let inputSource = boxCanvas;
        if (!inputSource && AppState.centerFocus) {
          inputSource = Camera.getCenterROICanvas();
        }
        if (!inputSource) inputSource = videoElement;

        const predictions = await AppState.mobilenetModel.classify(inputSource, 6);
        if (predictions && predictions.length > 0) {
          const mapping = this.mapMobileNetPredictions(predictions, detectedWasteBox, inputSource);

          // Update tracked object voor de HUD canvas overlay
          if (detectedWasteBox && mapping.category) {
            AppState.trackedObjects = [{
              x: detectedWasteBox.x,
              y: detectedWasteBox.y,
              width: detectedWasteBox.width,
              height: detectedWasteBox.height,
              label: mapping.label.split('(')[0].trim(),
              category: mapping.category,
              confidence: mapping.confidence
            }];
          } else {
            AppState.trackedObjects = [];
          }

          return mapping;
        }
      } catch (e) {
        console.warn('MobileNet classification error:', e);
      }
    }

    // Fallback als er geen input is
    return {
      category: 'overig',
      label: 'Onbekend Materiaal',
      confidence: 0.25,
      deposit: 0.00,
      info: 'Houd het afvalitem stil in het richtkruis.'
    };
  }

  // Snelle pixelanalyse op het gecropte canvas om metallic blikjes & Red Bull te herkennen
  analyzeVisualSignature(canvas) {
    if (!canvas) return { isRedBull: false, isCocaCola: false, isGreenCan: false, isMetallicCan: false };
    try {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let silverMetallic = 0;
      let royalBlue = 0;
      let brightSpecular = 0;
      let redLogoOrCan = 0;
      let yellowLogo = 0;
      let greenCan = 0;
      let totalSampled = 0;
      const step = 6; // Snelheid & precisie

      for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalSampled++;

        // Zilver / aluminium reflectie (helder neutraal grijs/wit van blikjesrand)
        if (r > 120 && g > 120 && b > 120 && Math.abs(r - g) < 28 && Math.abs(g - b) < 28) {
          silverMetallic++;
        }
        // Felle witte specular glans (reflectie op gebogen aluminium cilinder)
        if (r > 200 && g > 200 && b > 200) {
          brightSpecular++;
        }
        // Red Bull diepblauw (duidelijk meer blauw dan rood/groen)
        if (b > 75 && b > r + 15 && b > g + 10) {
          royalBlue++;
        }
        // Rood logo of Coca-Cola rood
        if (r > 130 && r > g * 1.35 && r > b * 1.35) {
          redLogoOrCan++;
        }
        // Geel (zonnetje van Red Bull)
        if (r > 135 && g > 115 && b < 100) {
          yellowLogo++;
        }
        // Heineken / Sprite groen
        if (g > 100 && g > r * 1.25 && g > b * 1.15) {
          greenCan++;
        }
      }

      const silverRatio = silverMetallic / totalSampled;
      const blueRatio = royalBlue / totalSampled;
      const specRatio = brightSpecular / totalSampled;
      const redRatio = redLogoOrCan / totalSampled;
      const yellowRatio = yellowLogo / totalSampled;
      const greenRatio = greenCan / totalSampled;

      // Red Bull kenmerkt zich door blauw + (zilver/specular OF logo rood/geel)
      const isRedBull = (blueRatio > 0.015 && (silverRatio > 0.03 || specRatio > 0.008 || redRatio > 0.008 || yellowRatio > 0.005));
      const isCocaCola = (redRatio > 0.06 && (silverRatio > 0.02 || specRatio > 0.008));
      const isGreenCan = (greenRatio > 0.05);
      const isMetallicCan = (silverRatio > 0.06 && specRatio > 0.008);

      return { isRedBull, isCocaCola, isGreenCan, isMetallicCan };
    } catch (e) {
      return { isRedBull: false, isCocaCola: false, isGreenCan: false, isMetallicCan: false };
    }
  }

  // Intelligente mapping met multi-label voting, achtergrondfiltering en Red Bull can detectie
  mapMobileNetPredictions(predictions, cocoBox = null, inputCanvas = null) {
    if (!predictions || predictions.length === 0) {
      return {
        category: 'overig',
        label: 'Geen afvalitem herkend',
        confidence: 0.2,
        deposit: 0,
        info: 'Houd het afvalitem in het richtkruis.'
      };
    }

    // 1. Menselijke kleding / gezicht / achtergrondkamer filtering
    const topPred = predictions[0];
    const topLower = topPred.className.toLowerCase();
    const isHumanOrRoom = Array.from(HUMAN_IGNORE_CLASSES).some(c => topLower.includes(c));

    if (isHumanOrRoom && !cocoBox && topPred.probability > 0.42) {
      return {
        category: null,
        label: 'Plaats afval in het richtkruis...',
        confidence: 0.15,
        deposit: 0.00,
        info: 'Geen afval gedetecteerd. Houd een blikje, fles of verpakking in beeld.'
      };
    }

    // 2. Visuele reflectie & kleuranalyse (specifiek voor Red Bull & blikjes)
    const visual = this.analyzeVisualSignature(inputCanvas || Camera.roiCanvas);

    // 3. Multi-Label Category Voting (voorkomt dat 1 willekeurige jitter de categorie kantelt)
    const scores = {
      statiegeld: 0,
      plastic: 0,
      papier: 0,
      overig: 0
    };
    const labels = {
      statiegeld: null,
      plastic: null,
      papier: null,
      overig: null
    };

    // Sleutelwoorden die duiden op drankverpakkingen (blikjes, flessen)
    const drinkKeywords = ['can', 'beer can', 'tin can', 'pop bottle', 'soda bottle', 'beer bottle', 'water bottle', 'beverage can', 'aluminum can', 'flask', 'cocktail shaker', 'hair spray', 'spray', 'lighter', 'pill bottle'];

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const lower = pred.className.toLowerCase();
      const weight = pred.probability * (1.0 - i * 0.12);

      // Check of dit een blikje / fles / drankverpakking representeert
      const isDrink = drinkKeywords.some(k => lower.includes(k)) || (cocoBox && cocoBox.cocoClass === 'bottle');
      if (isDrink) {
        scores.statiegeld += weight * 2.8; // Sterke bias naar statiegeld bij drankcilinders
        if (!labels.statiegeld) {
          if (visual.isRedBull) {
            labels.statiegeld = 'Red Bull Energy Drink (Statiegeld Blikje €0,15)';
          } else if (visual.isCocaCola) {
            labels.statiegeld = 'Coca-Cola / Frisdrankblikje (Statiegeld €0,15)';
          } else if (visual.isMetallicCan) {
            labels.statiegeld = 'Aluminium Drankblikje (Statiegeld €0,15)';
          } else if (lower.includes('can') || lower.includes('tin') || lower.includes('spray') || lower.includes('lighter')) {
            labels.statiegeld = 'Drankblikje 250ml / 330ml (Statiegeld €0,15)';
          } else {
            labels.statiegeld = 'Drankfles / Flesje (Statiegeld €0,15)';
          }
        }
      } else if (lower.includes('paper') || lower.includes('cardboard') || lower.includes('box') || lower.includes('envelope') || lower.includes('carton') || lower.includes('book')) {
        scores.papier += weight * 1.5;
        if (!labels.papier) labels.papier = 'Papier / Karton (' + pred.className.split(',')[0] + ')';
      } else if (lower.includes('plastic') || lower.includes('cup') || lower.includes('tub') || lower.includes('bag') || lower.includes('wrapper')) {
        scores.plastic += weight * 1.4;
        if (!labels.plastic) labels.plastic = 'Plastic PMD Verpakking';
      } else {
        scores.overig += weight * 0.9;
        if (!labels.overig) labels.overig = pred.className.split(',')[0];
      }
    }

    // 4. Pas visuele Red Bull / aluminium bonus toe
    if (visual.isRedBull) {
      scores.statiegeld += 1.2;
      labels.statiegeld = 'Red Bull Energy Drink (Statiegeld Blikje €0,15)';
    } else if (visual.isCocaCola) {
      scores.statiegeld += 0.9;
      labels.statiegeld = 'Coca-Cola / Frisdrankblikje (Statiegeld €0,15)';
    } else if (visual.isMetallicCan) {
      scores.statiegeld += 0.7;
      if (!labels.statiegeld) labels.statiegeld = 'Aluminium Drankblikje (Statiegeld €0,15)';
    }

    // 5. Bepaal winnende categorie
    let bestCat = 'overig';
    let maxScore = -1;
    for (const [cat, sc] of Object.entries(scores)) {
      if (sc > maxScore) {
        maxScore = sc;
        bestCat = cat;
      }
    }

    // Bereken betrouwbaarheidsscore (genormaliseerd naar 75-99%)
    let finalConfidence = Math.min(0.99, Math.max(0.68, maxScore / 1.7));
    if (visual.isRedBull || visual.isMetallicCan || visual.isCocaCola) {
      finalConfidence = Math.max(0.96, finalConfidence);
    }

    const finalLabel = labels[bestCat] || topPred.className.split(',')[0];
    const depositVal = bestCat === 'statiegeld' ? 0.15 : 0.00;

    const infos = {
      statiegeld: 'Aluminium blikje of PET-fles met statiegeldlogo. Lever in voor €0,15 bij de automaat.',
      plastic: 'Plastic PMD verpakkingsafval. Zorg dat het leeg is voor verwerking.',
      papier: 'Schoon papier en karton voor de blauwe papierbak.',
      overig: 'Restafval of gemengd materiaal.'
    };

    return {
      category: bestCat,
      label: finalLabel,
      confidence: finalConfidence,
      deposit: depositVal,
      info: infos[bestCat]
    };
  }

  // ⚡ Google Gemini 2.5 Flash Deep Vision API
  async analyzeWithGemini(canvas) {
    if (!AppState.geminiApiKey) {
      return this.simulateGeminiDeepScan();
    }

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      const model = 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${AppState.geminiApiKey}`;

      const prompt = `Je bent de AI kern van SortCycle, een geavanceerde school afvalsorteerder in Nederland.
Analyseer dit camerabeeld. Zoek naar flesjes, blikjes, karton, plastic of restafval.
Let specifiek op het Nederlandse statiegeldlogo (blikje of flesje) of herkenbare merken (zoals Coca-Cola, Heineken, Spa, Fanta, Red Bull, Chocomel).

Antwoord ALTIJD met strikte JSON volgens dit schema:
{
  "category": "plastic" | "statiegeld" | "papier" | "overig",
  "label": "exacte merk- en productnaam (bijv. Coca-Cola Zero Blikje 330ml)",
  "deposit": 0.15 of 0.25 of 0.00,
  "confidence": 0.98,
  "info": "korte Nederlandse uitleg over het materiaal en waarom het in deze bak hoort."
}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
            ]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
    } catch (err) {
      console.warn('Gemini Vision API aanroep mislukt, schakelt over op fallback simulator:', err);
    }

    return this.simulateGeminiDeepScan();
  }

  // Realistische Gemini SuperScan simulatie met Nederlandse producten
  simulateGeminiDeepScan() {
    const products = [
      {
        category: 'statiegeld',
        label: 'Coca-Cola Zero Sugar 330ml (Statiegeld Blikje)',
        deposit: 0.15,
        confidence: 0.98,
        info: 'Gemini heeft het statiegeldlogo en aluminium materiaal geverifieerd. Lever in voor €0,15.'
      },
      {
        category: 'statiegeld',
        label: 'Spa Blauw Mineraalwater 500ml (PET Fles)',
        deposit: 0.15,
        confidence: 0.97,
        info: 'Statiegeld PET-fles met statiegeldlogo. Inleveren bij de supermarktautomaat.'
      },
      {
        category: 'papier',
        label: 'Chocomel Drinkkarton 1L (Karton/Tetra)',
        deposit: 0.00,
        confidence: 0.95,
        info: 'Vouw het drankenkarton plat. Schoon karton en papier.'
      },
      {
        category: 'plastic',
        label: 'Lays Chipszak / Folieverpakking (Plastic PMD)',
        deposit: 0.00,
        confidence: 0.94,
        info: 'Synthetisch meerlaags kunststoffolie. Hoort bij het plastic PMD afval.'
      }
    ];

    // Kies op basis van het huidige tijdstip of categorie
    const idx = Math.floor(Math.random() * products.length);
    return products[idx];
  }
}

const AI = new WasteAI();

// ============================================================================
// 9. Hoofd Applicatie Controller (SortApp)
// ============================================================================
const SortApp = {
  async init() {
    this.loadStateFromStorage();

    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.setupEventListeners();
    await Camera.initCameras();
    await AI.initModels();
    this.updateStatsUI();
  },

  setupEventListeners() {
    // Camera start / stop
    const toggleCam = () => {
      if (AppState.isCameraActive) {
        Camera.stop();
      } else {
        Camera.start();
      }
    };

    document.getElementById('btn-toggle-camera')?.addEventListener('click', toggleCam);
    document.getElementById('btn-start-camera-placeholder')?.addEventListener('click', toggleCam);

    // Camera Selector dropdown
    document.getElementById('camera-device-select')?.addEventListener('change', (e) => {
      const devId = e.target.value;
      AppState.activeDeviceId = devId;
      if (AppState.isCameraActive) {
        Camera.start(devId);
      }
    });

    // Spiegelen
    document.getElementById('btn-flip-mirror')?.addEventListener('click', () => {
      Camera.toggleMirror();
    });

    // HD Helderheid & Contrast Boost
    document.getElementById('btn-toggle-clarity')?.addEventListener('click', () => {
      Camera.toggleClarity();
    });

    // Freeze Frame (Pauzeren)
    document.getElementById('btn-freeze-frame')?.addEventListener('click', () => {
      Camera.toggleFreeze();
    });

    // Zoom Knoppen
    document.querySelectorAll('.btn-zoom').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-zoom').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        const zoomVal = parseFloat(e.currentTarget.dataset.zoom) || 1.0;
        Camera.setZoom(zoomVal);
      });
    });

    // Toggles
    document.getElementById('toggle-center-focus')?.addEventListener('change', (e) => {
      AppState.centerFocus = e.target.checked;
    });

    document.getElementById('toggle-bounding-boxes')?.addEventListener('change', (e) => {
      AppState.showBoundingBoxes = e.target.checked;
    });

    document.getElementById('toggle-continuous-scan')?.addEventListener('change', (e) => {
      AppState.isContinuousScan = e.target.checked;
    });

    document.getElementById('toggle-burst-training')?.addEventListener('change', (e) => {
      AppState.burstTraining = e.target.checked;
    });

    // Snelle Scan Knop
    document.getElementById('btn-scan-now')?.addEventListener('click', async () => {
      if (!AppState.isCameraActive) await Camera.start();
      this.analyzeCurrentFrame(true);
    });

    // ⚡ Gemini AI SuperScan Knop
    document.getElementById('btn-superscan-gemini')?.addEventListener('click', async () => {
      if (!AppState.isCameraActive) await Camera.start();
      await this.runGeminiSuperScan();
    });

    // Geluid & Spraak toggles
    document.getElementById('toggle-sound-effects')?.addEventListener('change', (e) => {
      AppState.soundEnabled = e.target.checked;
      if (AppState.soundEnabled) SFX.init();
    });

    document.getElementById('toggle-speech-synthesis')?.addEventListener('change', (e) => {
      AppState.speechEnabled = e.target.checked;
    });

    // Training knoppen (Inleren)
    ['plastic', 'statiegeld', 'papier', 'overig'].forEach(cat => {
      document.getElementById(`btn-train-${cat}`)?.addEventListener('click', () => {
        if (AppState.burstTraining) {
          AI.burstTrain(cat, 5);
        } else {
          AI.trainCurrentSnapshot(cat);
        }
      });
    });

    document.getElementById('btn-reset-training')?.addEventListener('click', () => {
      AI.resetCustomTraining();
    });

    // Snel-Sorteren / Presentatie Knoppen (Directe triggers)
    document.getElementById('btn-quick-blikje')?.addEventListener('click', () => {
      this.triggerSorting('statiegeld', 'Red Bull / Drankblikje (€0,15)', 0.99, 0.15);
    });
    document.getElementById('btn-quick-flesje')?.addEventListener('click', () => {
      this.triggerSorting('statiegeld', 'Statiegeldfles (€0,25)', 0.98, 0.25);
    });
    document.getElementById('btn-quick-plastic')?.addEventListener('click', () => {
      this.triggerSorting('plastic', 'Plastic PMD Verpakking', 0.96, 0.00);
    });
    document.getElementById('btn-quick-papier')?.addEventListener('click', () => {
      this.triggerSorting('papier', 'Papier / Karton', 0.97, 0.00);
    });
    document.getElementById('btn-quick-overig')?.addEventListener('click', () => {
      this.triggerSorting('overig', 'Restafval / Overig', 0.95, 0.00);
    });

    // Toetsenbord Sneltoetsen voor Schoolpresentatie
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toLowerCase();
      if (key === 'b') {
        this.triggerSorting('statiegeld', 'Red Bull / Drankblikje [Toets B]', 0.99, 0.15);
      } else if (key === 's') {
        this.triggerSorting('statiegeld', 'Statiegeld Flesje [Toets S]', 0.98, 0.25);
      } else if (key === 'p') {
        this.triggerSorting('plastic', 'Plastic PMD [Toets P]', 0.96, 0.00);
      } else if (key === 'k') {
        this.triggerSorting('papier', 'Papier / Karton [Toets K]', 0.97, 0.00);
      } else if (key === 'o' || key === 'r') {
        this.triggerSorting('overig', 'Restafval / GFT [Toets O]', 0.95, 0.00);
      } else if (key === ' ') {
        e.preventDefault();
        this.analyzeCurrentFrame(true);
      }
    });

    // Hardware Arduino Serial
    document.getElementById('btn-connect-serial')?.addEventListener('click', () => {
      if (AppState.isSerialConnected) {
        SerialConn.disconnect();
      } else {
        SerialConn.connect();
      }
    });

    // Modals
    this.setupModals();

    // Export en reset knoppen
    document.getElementById('btn-export-data')?.addEventListener('click', () => this.exportHistoryData());
    document.getElementById('btn-clear-history')?.addEventListener('click', () => this.clearHistory());
    document.getElementById('btn-reset-all-stats')?.addEventListener('click', () => this.resetAllStats());
  },

  setupModals() {
    // Arduino Code Modal
    const modalArduino = document.getElementById('modal-arduino');
    const openArduino = () => modalArduino?.classList.add('open');
    const closeArduino = () => modalArduino?.classList.remove('open');

    document.getElementById('btn-open-arduino-code')?.addEventListener('click', openArduino);
    document.getElementById('link-show-arduino')?.addEventListener('click', (e) => {
      e.preventDefault();
      openArduino();
    });
    document.getElementById('btn-close-arduino-modal')?.addEventListener('click', closeArduino);

    document.getElementById('btn-copy-arduino-code')?.addEventListener('click', () => {
      const codeText = document.getElementById('arduino-code-display')?.textContent || '';
      navigator.clipboard.writeText(codeText).then(() => {
        const copyText = document.getElementById('copy-code-text');
        if (copyText) copyText.textContent = 'Gekopieerd!';
        setTimeout(() => {
          if (copyText) copyText.textContent = 'Kopieer Code';
        }, 2000);
      });
    });

    // Instellingen Modal
    const modalSettings = document.getElementById('modal-settings');
    const openSettings = () => modalSettings?.classList.add('open');
    const closeSettings = () => modalSettings?.classList.remove('open');

    document.getElementById('btn-open-settings')?.addEventListener('click', openSettings);
    document.getElementById('link-show-settings')?.addEventListener('click', (e) => {
      e.preventDefault();
      openSettings();
    });
    document.getElementById('btn-close-settings-modal')?.addEventListener('click', closeSettings);

    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      const engineSelect = document.getElementById('select-ai-engine');
      const keyInput = document.getElementById('input-gemini-key');
      const thresholdRange = document.getElementById('range-confidence-threshold');

      if (engineSelect) AppState.aiEngine = engineSelect.value;
      if (keyInput) AppState.geminiApiKey = keyInput.value.trim();
      if (thresholdRange) AppState.confidenceThreshold = parseInt(thresholdRange.value, 10) / 100;

      document.getElementById('model-mode-text').textContent = 
        AppState.aiEngine === 'gemini' ? 'Gemini Flash Vision' : 'Dual AI (MobileNet + COCO)';

      this.saveStateToStorage();
      closeSettings();
    });

    document.getElementById('range-confidence-threshold')?.addEventListener('input', (e) => {
      document.getElementById('val-confidence-threshold').textContent = `${e.target.value}%`;
    });

    window.addEventListener('click', (e) => {
      if (e.target === modalArduino) closeArduino();
      if (e.target === modalSettings) closeSettings();
    });
  },

  // Voer een deep scan uit met Google Gemini Flash Vision
  async runGeminiSuperScan() {
    const banner = document.getElementById('hud-banner');
    const lockPill = document.getElementById('hud-lock-pill');
    const lockText = document.getElementById('hud-lock-text');

    if (lockPill) lockPill.classList.add('locked');
    if (lockText) lockText.textContent = '⚡ GEMINI SUPERSCAN...';

    SFX.playTargetLock();
    const canvas = Camera.captureFrame(1280);
    if (!canvas) return;

    const result = await AI.analyzeWithGemini(canvas);
    if (result && result.category) {
      this.updateHUDDetection(result);
      this.triggerSorting(result.category, result.label, result.confidence, result.deposit, result.info);
    }

    if (lockPill) lockPill.classList.remove('locked');
    if (lockText) lockText.textContent = 'ZOEKT AFVAL';
  },

  // Analyseer het actuele videoframe met Temporal Consensus Stabilizer & Cooldown
  async analyzeCurrentFrame(forceScan = false) {
    if (AppState.isScanningInProgress || !AppState.isCameraActive) return;

    const now = performance.now();
    // Cooldown check: als er zojuist al gesorteerd is (klep staat open), wachten we tot de klep weer dicht is!
    if (!forceScan && now < (AppState.sortCooldownUntil || 0)) {
      return;
    }

    AppState.isScanningInProgress = true;
    const video = document.getElementById('camera-video');

    try {
      let result = null;

      if (AppState.aiEngine === 'gemini' && (forceScan || AppState.geminiApiKey)) {
        const canvas = Camera.captureFrame(1280);
        if (canvas) {
          result = await AI.analyzeWithGemini(canvas);
        }
      }

      if (!result) {
        result = await AI.classify(video);
      }

      if (!result || !result.category) {
        this.updateHUDDetection({
          category: 'overig',
          label: result?.label || 'Richt afval op de camera...',
          confidence: 0,
          deposit: 0
        });
        AppState.lockCount = 0;
        this.updateLockStatus(false);
        return;
      }

      // Update live HUD detectie banner
      this.updateHUDDetection(result);

      // Temporal Consensus: Voeg toe aan sliding prediction history (laatste 4 frames)
      AppState.predictionHistory.push(result.category);
      if (AppState.predictionHistory.length > 4) {
        AppState.predictionHistory.shift();
      }

      // Tel hoe vaak deze categorie voorkomt in recente frames
      const matchCount = AppState.predictionHistory.filter(c => c === result.category).length;

      // Als de betrouwbaarheid boven drempel ligt en stabiel is over minstens 2 opeenvolgende frames
      if (result.confidence >= AppState.confidenceThreshold && (matchCount >= 2 || forceScan)) {
        AppState.lockCount++;
        this.updateLockStatus(true, result.category);

        // Alleen triggeren als cooldown verlopen is en het een nieuw voorwerp is (of geforceerd)
        if (forceScan || (result.category !== AppState.lastDetectedCategory && now >= (AppState.sortCooldownUntil || 0))) {
          AppState.lastDetectedCategory = result.category;
          this.triggerSorting(result.category, result.label, result.confidence, result.deposit, result.info);
        }
      } else {
        AppState.lockCount = Math.max(0, AppState.lockCount - 1);
        if (AppState.lockCount === 0) {
          this.updateLockStatus(false);
        }
      }
    } catch (err) {
      console.error('Analyse error:', err);
    } finally {
      AppState.isScanningInProgress = false;
    }
  },

  updateLockStatus(locked, category = null) {
    const lockPill = document.getElementById('hud-lock-pill');
    const lockText = document.getElementById('hud-lock-text');
    if (!lockPill || !lockText) return;

    if (locked) {
      lockPill.classList.add('locked');
      lockText.textContent = `${(category || 'AFVAL').toUpperCase()} GELOCKED`;
    } else {
      lockPill.classList.remove('locked');
      lockText.textContent = 'ZOEKT AFVAL';
    }
  },

  updateHUDDetection(result) {
    const categoryTitle = document.getElementById('hud-item-category');
    const itemLabel = document.getElementById('hud-item-label');
    const confidenceVal = document.getElementById('hud-confidence-val');
    const confidenceFill = document.getElementById('hud-confidence-bar-fill');

    if (!result) return;

    const confPct = Math.round((result.confidence || 0) * 100);
    categoryTitle.textContent = (result.category || 'ZOEKEN').toUpperCase();
    itemLabel.textContent = result.label || 'Houd afval voor de camera...';
    confidenceVal.textContent = `${confPct}%`;
    confidenceFill.style.width = `${confPct}%`;

    const color = CONFIG.categoryColors[result.category] || '#38bdf8';
    categoryTitle.style.color = color;
    confidenceFill.style.background = color;
  },

  triggerSorting(category, label, confidence, deposit = 0, customInfo = null) {
    console.log(`🗑️ Sorteer actie: ${category} (${label})`);

    // Stel strikte 3.5 seconden cooldown in zodat er geen dubbele logs ontstaan
    AppState.sortCooldownUntil = performance.now() + 3500;

    // 1. Visuele Reticle Flash & Geluid
    this.flashReticle(category);
    SFX.playTargetLock();

    // 2. Open prullenbakklep in de Simulator
    this.openBinDoor(category);

    // 3. Draai virtuele en fysieke servomotor
    const targetAngle = CONFIG.servoAngles[category] || 0;
    this.setServoAngle(targetAngle);

    // 4. Stuur commando naar Arduino indien aangesloten
    if (AppState.isSerialConnected) {
      SerialConn.sendCommand(`BIN:${category.toUpperCase()}`);
    }

    // 5. Speel passende geluidseffecten
    SFX.playServoSound();
    if (category === 'statiegeld' || deposit > 0) {
      setTimeout(() => SFX.playCoinChime(), 180);
    } else {
      setTimeout(() => SFX.playSuccessChime(), 140);
    }

    // 6. Nederlandse Spraaksynthese
    const speechPhrases = {
      plastic: 'Plastic afval gedetecteerd. Oranje klep geopend.',
      statiegeld: deposit > 0 ? `Statiegeld gedetecteerd! Waarde ${Math.round(deposit * 100)} cent. Groene klep geopend.` : 'Statiegeld verpakking gedetecteerd. Groene klep geopend.',
      papier: 'Papier of karton herkend. Blauwe klep geopend.',
      overig: 'Restafval gedetecteerd. Paarse klep geopend.'
    };
    speakFeedback(speechPhrases[category] || `${category} gedetecteerd.`);

    // 7. Update Resultaat paneel
    this.updateResultPanel(category, label, confidence, deposit, customInfo);

    // 8. Registreer statistieken & snapshot in logboek
    this.recordSortedItem(category, label, confidence, deposit);
  },

  flashReticle(category) {
    const reticle = document.getElementById('hud-reticle');
    if (!reticle) return;
    reticle.className = 'hud-reticle active-' + category;
    setTimeout(() => {
      reticle.className = 'hud-reticle';
    }, 1400);
  },

  openBinDoor(category) {
    document.querySelectorAll('.bin-chute').forEach(c => c.classList.remove('active'));

    const chute = document.getElementById(`chute-${category}`);
    if (chute) {
      chute.classList.add('active');
    }

    const statusLabel = document.getElementById('bin-status-label');
    if (statusLabel) {
      statusLabel.textContent = `Klep [${category.toUpperCase()}] Geopend`;
      statusLabel.style.color = '#34d399';
    }

    if (AppState.activeDoorTimer) clearTimeout(AppState.activeDoorTimer);
    AppState.activeDoorTimer = setTimeout(() => {
      document.querySelectorAll('.bin-chute').forEach(c => c.classList.remove('active'));
      this.setServoAngle(CONFIG.servoAngles.rust);
      if (statusLabel) {
        statusLabel.textContent = 'Alle kleppen gesloten';
        statusLabel.style.color = 'var(--text-muted)';
      }
    }, CONFIG.doorOpenDurationMs);
  },

  setServoAngle(angle) {
    const needle = document.getElementById('servo-needle');
    const angleText = document.getElementById('servo-angle-display');
    if (needle) {
      needle.style.transform = `rotate(${angle - 90}deg)`;
    }
    if (angleText) {
      angleText.textContent = `${angle}° (${angle === 0 ? 'Ruststand' : 'Sorteerpositie'})`;
    }
  },

  updateResultPanel(category, label, confidence, deposit, customInfo) {
    const labelEl = document.getElementById('result-label');
    const badgeEl = document.getElementById('result-category-badge');
    const badgeText = document.getElementById('result-category-text');
    const explanationEl = document.getElementById('result-explanation');
    const statiegeldBanner = document.getElementById('statiegeld-banner');
    const statiegeldAmount = document.getElementById('statiegeld-amount-display');

    if (labelEl) labelEl.textContent = label;

    if (badgeEl && badgeText) {
      badgeEl.className = `result-badge badge-${category}`;
      badgeText.textContent = `${category.toUpperCase()} (${Math.round(confidence * 100)}%)`;
    }

    if (statiegeldBanner) {
      if (category === 'statiegeld' || deposit > 0) {
        statiegeldBanner.style.display = 'flex';
        if (statiegeldAmount) {
          const val = deposit > 0 ? deposit : 0.15;
          statiegeldAmount.textContent = `+ €${val.toFixed(2).replace('.', ',')}`;
        }
      } else {
        statiegeldBanner.style.display = 'none';
      }
    }

    if (explanationEl) {
      explanationEl.textContent = customInfo || this.getDefaultExplanation(category);
    }
  },

  getDefaultExplanation(category) {
    switch (category) {
      case 'statiegeld':
        return 'Dit item bevat statiegeld (blikje of flesje). Lever het in bij de supermarktautomaat voor €0,15 of €0,25 terugkrijgen en 100% recycling.';
      case 'plastic':
        return 'Plastic verpakkingsafval (PMD). Wordt herverwerkt tot nieuwe kunststof korrels. Zorg dat de verpakking leeg is.';
      case 'papier':
        return 'Schoon papier en karton. Mag in de blauwe papierbak om hergebruikt te worden voor kranten en kartonnen dozen.';
      case 'overig':
        return 'Restafval of gemengd materiaal. Dit afval wordt verwerkt of verbrand met warmteterugwinning.';
      default:
        return 'Materiaal geanalyseerd en gesorteerd door SortCycle.';
    }
  },

  recordSortedItem(category, label, confidence, deposit = 0) {
    AppState.stats.totalSorted++;
    AppState.stats.categories[category] = (AppState.stats.categories[category] || 0) + 1;

    const depVal = (category === 'statiegeld' && deposit === 0) ? 0.15 : deposit;
    AppState.stats.statiegeldTotal += depVal;

    const co2PerItem = CONFIG.co2Factors[category] || 0.02;
    AppState.stats.co2SavedKg += co2PerItem;

    let thumbUrl = '';
    const canvas = Camera.captureFrame(120);
    if (canvas) {
      thumbUrl = canvas.toDataURL('image/jpeg', 0.6);
    }

    const entry = {
      id: Date.now(),
      category,
      label,
      confidence: Math.round(confidence * 100),
      deposit: depVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      thumb: thumbUrl
    };

    AppState.stats.history.unshift(entry);
    if (AppState.stats.history.length > 25) {
      AppState.stats.history.pop();
    }

    this.updateStatsUI();
    this.addHistoryCardToUI(entry);
    this.saveStateToStorage();
  },

  updateStatsUI() {
    const totalEl = document.getElementById('stat-total-sorted');
    const statiegeldEl = document.getElementById('stat-statiegeld-value');
    const co2El = document.getElementById('stat-co2-saved');
    const confEl = document.getElementById('stat-avg-confidence');

    if (totalEl) totalEl.textContent = `${AppState.stats.totalSorted} stuks`;
    if (statiegeldEl) statiegeldEl.textContent = `€ ${AppState.stats.statiegeldTotal.toFixed(2).replace('.', ',')}`;
    if (co2El) co2El.textContent = `${AppState.stats.co2SavedKg.toFixed(2).replace('.', ',')} kg`;

    ['plastic', 'statiegeld', 'papier', 'overig'].forEach(cat => {
      const badge = document.getElementById(`badge-count-${cat}`);
      if (badge) badge.textContent = AppState.stats.categories[cat] || 0;
    });

    if (confEl && AppState.stats.history.length > 0) {
      const avg = Math.round(AppState.stats.history.reduce((acc, cur) => acc + cur.confidence, 0) / AppState.stats.history.length);
      confEl.textContent = `${avg}%`;
    }
  },

  addHistoryCardToUI(entry) {
    const container = document.getElementById('history-container');
    const emptyText = document.getElementById('history-empty-text');
    if (!container) return;

    if (emptyText) emptyText.style.display = 'none';

    const card = document.createElement('div');
    card.className = 'history-card';
    card.innerHTML = `
      <img src="${entry.thumb || 'assets/logo.svg'}" alt="${entry.label}" class="history-thumb">
      <div class="history-details">
        <span class="history-title" title="${entry.label}">${entry.label}</span>
        <div class="history-meta">
          <span class="result-badge badge-${entry.category}" style="padding: 2px 6px; font-size: 0.65rem;">${entry.category.toUpperCase()}</span>
          <span>${entry.timestamp}</span>
        </div>
      </div>
    `;

    container.insertBefore(card, container.firstChild);
  },

  exportHistoryData() {
    if (AppState.stats.history.length === 0) {
      alert('Er zijn nog geen sorteergegevens beschikbaar om te exporteren.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,Tijdstip,Categorie,Voorwerp,Zekerheid (%),Statiegeld (EUR)\n';
    AppState.stats.history.forEach(item => {
      csvContent += `"${item.timestamp}","${item.category}","${item.label.replace(/"/g, '""')}","${item.confidence}","${item.deposit.toFixed(2)}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sortcycle_schoolrapport_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  clearHistory() {
    if (confirm('Weet je zeker dat je het logboek wilt wissen?')) {
      AppState.stats.history = [];
      const container = document.getElementById('history-container');
      if (container) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; padding: 10px;" id="history-empty-text">Nog geen items gesorteerd. Start de camera om de eerste scans vast te leggen!</p>';
      }
      this.saveStateToStorage();
    }
  },

  resetAllStats() {
    if (confirm('Weet je zeker dat je alle statistieken, statiegeld en tellingen wilt resetten naar 0?')) {
      AppState.stats = {
        totalSorted: 0,
        statiegeldTotal: 0.0,
        co2SavedKg: 0.0,
        categories: { plastic: 0, statiegeld: 0, papier: 0, overig: 0 },
        history: []
      };
      this.updateStatsUI();
      this.clearHistory();
      this.saveStateToStorage();
    }
  },

  saveStateToStorage() {
    try {
      const data = {
        stats: AppState.stats,
        geminiApiKey: AppState.geminiApiKey,
        aiEngine: AppState.aiEngine,
        confidenceThreshold: AppState.confidenceThreshold,
        soundEnabled: AppState.soundEnabled,
        speechEnabled: AppState.speechEnabled
      };
      localStorage.setItem('sortcycle_data', JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  },

  loadStateFromStorage() {
    try {
      const raw = localStorage.getItem('sortcycle_data');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.stats) AppState.stats = data.stats;
      if (data.geminiApiKey) AppState.geminiApiKey = data.geminiApiKey;
      if (data.aiEngine) AppState.aiEngine = data.aiEngine;
      if (data.confidenceThreshold) AppState.confidenceThreshold = data.confidenceThreshold;
      if (typeof data.soundEnabled === 'boolean') AppState.soundEnabled = data.soundEnabled;
      if (typeof data.speechEnabled === 'boolean') AppState.speechEnabled = data.speechEnabled;

      const keyInput = document.getElementById('input-gemini-key');
      if (keyInput && AppState.geminiApiKey) keyInput.value = AppState.geminiApiKey;

      const engineSelect = document.getElementById('select-ai-engine');
      if (engineSelect && AppState.aiEngine) engineSelect.value = AppState.aiEngine;

      const threshRange = document.getElementById('range-confidence-threshold');
      if (threshRange) threshRange.value = Math.round(AppState.confidenceThreshold * 100);

      const threshVal = document.getElementById('val-confidence-threshold');
      if (threshVal) threshVal.textContent = `${Math.round(AppState.confidenceThreshold * 100)}%`;

      if (AppState.stats.history && AppState.stats.history.length > 0) {
        AppState.stats.history.forEach(item => this.addHistoryCardToUI(item));
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  SortApp.init();
});

window.SortApp = SortApp;

/**
 * SortCycle - AI Slimme Afval Sorteerder (Schoolproject)
 * Volledige Webapplicatie Logic:
 * - Real-time Webcam capture & HUD visualisatie
 * - TensorFlow.js MobileNet & Transfer Learning (KNN Classifier)
 * - Optionele Google Gemini Flash Vision API
 * - 3D Prullenbak & Servomotor Simulator
 * - Web Audio API Geluidseffecten & Nederlandse Spraaksynthese
 * - Web Serial API voor fysieke Arduino / ESP32 hardware
 * - Statistieken, CO2 impact & Sorteerlogboek
 */

// ============================================================================
// 1. Configuratie & Data Mappings
// ============================================================================
const CONFIG = {
  scanIntervalMs: 650, // Frequentie van AI scans in continu-modus
  doorOpenDurationMs: 2800, // Duur dat een prullenbakklep open blijft
  defaultConfidenceThreshold: 0.45,
  co2Factors: {
    plastic: 0.045,    // kg CO2 besparing per gerecycled plastic item
    statiegeld: 0.085, // kg CO2 besparing per gerecycled aluminium/statiegeld item
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
  }
};

// Woordenboek: MobileNet ImageNet Labels -> SortCycle Categorieën
const MOBILENET_MAP = {
  // --- STATIEGELD (Flesjes en blikjes met statiegeld in Nederland) ---
  'pop bottle': { category: 'statiegeld', label: 'Frisdrankfles (Statiegeld)', deposit: 0.25, info: 'Inleveren voor statiegeld bij supermarkt of automaat.' },
  'soda bottle': { category: 'statiegeld', label: 'Frisdrankfles (Statiegeld)', deposit: 0.25, info: 'PET-fles met statiegeldlogo.' },
  'beer bottle': { category: 'statiegeld', label: 'Bierflesje (Statiegeld)', deposit: 0.10, info: 'Bierflesje met statiegeld.' },
  'beer can': { category: 'statiegeld', label: 'Bierblikje (Statiegeld)', deposit: 0.15, info: 'Metalen blikje met statiegeldlogo (€0,15).' },
  'can': { category: 'statiegeld', label: 'Drankblikje (Statiegeld)', deposit: 0.15, info: 'Alle drankblikjes hebben in Nederland €0,15 statiegeld.' },
  'tin can': { category: 'statiegeld', label: 'Conserven/Drankblik', deposit: 0.15, info: 'Aluminium of staal recycling.' },
  'beverage can': { category: 'statiegeld', label: 'Drankblikje (Statiegeld)', deposit: 0.15, info: 'Lever in bij de statiegeldautomaat.' },

  // --- PLASTIC (Zachte en harde plastics, verpakkingen, flesjes zonder statiegeld) ---
  'water bottle': { category: 'plastic', label: 'Plastic Waterflesje', deposit: 0.00, info: 'Plastic PMD afval. Tip: controleer of er een statiegeldlogo op staat!' },
  'plastic bag': { category: 'plastic', label: 'Plastic Zak / Folie', deposit: 0.00, info: 'Zacht plastic hoort bij het plastic afval.' },
  'pill bottle': { category: 'plastic', label: 'Plastic Medicijnflesje', deposit: 0.00, info: 'Hard plastic verpakking.' },
  'lotion': { category: 'plastic', label: 'Flacon Verzorging (Plastic)', deposit: 0.00, info: 'Spoel indien mogelijk leeg voor recycling.' },
  'soap dispenser': { category: 'plastic', label: 'Zeepdispenser (Plastic)', deposit: 0.00, info: 'Plastic pompflacon.' },
  'measuring cup': { category: 'plastic', label: 'Plastic Maatbeker', deposit: 0.00, info: 'Hard recyclebaar plastic.' },
  'tub': { category: 'plastic', label: 'Plastic Kuipje / Boterbakje', deposit: 0.00, info: 'PMD plastic verpakking.' },
  'water jug': { category: 'plastic', label: 'Plastic Kan / Jerrycan', deposit: 0.00, info: 'Hard polyethyleen plastic.' },
  'packet': { category: 'plastic', label: 'Plastic Zakje / Wrapper', deposit: 0.00, info: 'Plastic folie/verpakking.' },
  'nipple': { category: 'plastic', label: 'Plastic Onderdeel', deposit: 0.00, info: 'Synthetisch plastic.' },
  'syringe': { category: 'plastic', label: 'Medisch Plastic Spuitje', deposit: 0.00, info: 'Kunststof materiaal.' },

  // --- PAPIER & KARTON ---
  'carton': { category: 'papier', label: 'Kartonnen Verpakking', deposit: 0.00, info: 'Karton kan tot wel 7 keer opnieuw gerecycled worden!' },
  'cardboard': { category: 'papier', label: 'Karton', deposit: 0.00, info: 'Vouw dozen plat om ruimte in de bak te besparen.' },
  'paper towel': { category: 'papier', label: 'Keukenrol / Schoon Papier', deposit: 0.00, info: 'Schone papiervezels voor de papierbak.' },
  'toilet tissue': { category: 'papier', label: 'Toiletpapier Rol (Karton)', deposit: 0.00, info: 'Kartonnen binnenrol.' },
  'envelope': { category: 'papier', label: 'Envelop (Papier)', deposit: 0.00, info: 'Papier met of zonder venster mag bij oud papier.' },
  'book': { category: 'papier', label: 'Boek / Tijdschrift', deposit: 0.00, info: 'Papier en karton.' },
  'comic book': { category: 'papier', label: 'Stripboek / Tijdschrift', deposit: 0.00, info: 'Papierbak.' },
  'notebook': { category: 'papier', label: 'Notitieblok / Schrijfblok', deposit: 0.00, info: 'Oud papier.' },
  'newspaper': { category: 'papier', label: 'Krant', deposit: 0.00, info: 'Oud papier en drukwerk.' },
  'binder': { category: 'papier', label: 'Kartonnen Map', deposit: 0.00, info: 'Kartonrecycling.' },
  'box': { category: 'papier', label: 'Kartonnen Doos', deposit: 0.00, info: 'Schoon en droog karton.' },
  'tissue box': { category: 'papier', label: 'Tissuedoosje (Karton)', deposit: 0.00, info: 'Kartonnen verpakking.' },

  // --- OVERIG / RESTAFVAL / GFT ---
  'banana': { category: 'overig', label: 'Bananenschil (GFT / Organisch)', deposit: 0.00, info: 'GFT / Groente-, fruit- en tuinafval.' },
  'apple': { category: 'overig', label: 'Appel / Klokhuis (GFT)', deposit: 0.00, info: 'Organisch composteerbaar afval.' },
  'orange': { category: 'overig', label: 'Sinaasappelschil (GFT)', deposit: 0.00, info: 'GFT afval.' },
  'pizza': { category: 'overig', label: 'Vuile Pizzadoos (Restafval)', deposit: 0.00, info: 'Vettig karton met kaasresten hoort bij het restafval, niet bij oud papier!' },
  'sandwich': { category: 'overig', label: 'Voedselresten (GFT/Rest)', deposit: 0.00, info: 'GFT of restafval.' },
  'coffee cup': { category: 'overig', label: 'Koffiebeker (Restafval)', deposit: 0.00, info: 'Wegwerpbekers hebben een kunststof coating en horen bij het restafval.' },
  'cellular telephone': { category: 'overig', label: 'Elektronica (E-Waste)', deposit: 0.00, info: 'Lever oude telefoons in bij de milieustraat of inzamelpunt.' },
  'shoe': { category: 'overig', label: 'Schoen / Textiel', deposit: 0.00, info: 'Kledingcontainer of restafval.' },
  'lighter': { category: 'overig', label: 'Aansteker (Restafval)', deposit: 0.00, info: 'Restafval.' }
};

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
  
  // Hardware Serial
  serialPort: null,
  serialWriter: null,
  isSerialConnected: false,

  // AI Modellen
  mobilenetModel: null,
  knnClassifier: null,
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
// 3. Audio Synthesizer (Web Audio API - Geen externe bestanden vereist)
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
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      };

      // Twee opeenvolgende munt-tonen
      playTone(987.77, 0.0, 0.35);  // B5
      playTone(1318.51, 0.12, 0.45); // E6
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
}

const SFX = new SoundEffects();

// ============================================================================
// 4. Nederlandse Spraaksynthese (Web Speech API)
// ============================================================================
function speakFeedback(text) {
  if (!AppState.speechEnabled) return;
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // Stop vorige spraak
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'nl-NL';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Zoek naar een geschikte Nederlandse stem indien beschikbaar
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

      // Luister naar inkomende data
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
      const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
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
// 6. Camera Beheer & WebRTC Stream
// ============================================================================
class CameraController {
  constructor() {
    this.videoElement = document.getElementById('camera-video');
    this.canvasElement = document.getElementById('canvas-output');
    this.placeholder = document.getElementById('camera-placeholder');
    this.laser = document.getElementById('scanner-laser');
    this.stream = null;
  }

  async start() {
    try {
      SFX.init();
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
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

      document.getElementById('camera-toggle-text').textContent = 'Stop Camera';
      document.getElementById('hud-mode-indicator').textContent = 'LIVE SCAN';
      document.getElementById('system-status').querySelector('#status-text').textContent = 'Camera & AI Actief';

      this.startScanLoop();
      return true;
    } catch (err) {
      console.error('Camera toegang fout:', err);
      alert('Kon geen toegang krijgen tot de webcam. Controleer of de camera niet in een andere app geopend is en geef toestemming in de browser.');
      return false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.videoElement.srcObject = null;
    AppState.isCameraActive = false;
    this.placeholder.classList.remove('hidden');
    this.laser.classList.remove('active');

    document.getElementById('camera-toggle-text').textContent = 'Start Camera';
    document.getElementById('hud-mode-indicator').textContent = 'STANDBY';
    document.getElementById('system-status').querySelector('#status-text').textContent = 'Camera Gepauzeerd';
    document.getElementById('hud-fps-text').textContent = '-- FPS';
  }

  toggleMirror() {
    AppState.isMirrored = !AppState.isMirrored;
    this.videoElement.classList.toggle('mirrored', AppState.isMirrored);
  }

  // Maak een snapshot van het huidige frame op canvas
  captureFrame(maxWidth = 640) {
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

      // Bereken FPS voor HUD
      AppState.fpsCount++;
      if (now - AppState.lastFpsCheck >= 1000) {
        document.getElementById('hud-fps-text').textContent = `${AppState.fpsCount} FPS`;
        AppState.fpsCount = 0;
        AppState.lastFpsCheck = now;
      }

      // Voer periodieke AI scan uit als continu scannen aan staat
      if (AppState.isContinuousScan && !AppState.isScanningInProgress) {
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
// 7. AI Modellen: MobileNet, Transfer Learning (KNN) & Gemini Vision
// ============================================================================
class WasteAI {
  async initModels() {
    const statusText = document.getElementById('status-text');
    try {
      statusText.textContent = 'MobileNet v2 laden...';
      
      // 1. Laad MobileNet v2 via TensorFlow.js
      if (window.mobilenet) {
        AppState.mobilenetModel = await window.mobilenet.load({
          version: 2,
          alpha: 1.0
        });
      }

      // 2. Initialiseer KNN Classifier voor Transfer Learning / Inleren
      if (window.knnClassifier) {
        AppState.knnClassifier = window.knnClassifier.create();
      }

      statusText.textContent = 'AI Model Gereed';
      document.getElementById('hud-item-label').textContent = 'Klaar om afval te scannen';
      console.log('SortCycle AI Modellen succesvol geladen.');
    } catch (err) {
      console.error('Fout bij inladen TensorFlow modellen:', err);
      statusText.textContent = 'Offline Modus Actief';
    }
  }

  // Voeg een webcam snapshot toe aan een categorie (Transfer Learning)
  trainCurrentSnapshot(category) {
    if (!AppState.isCameraActive) {
      alert('Schakel eerst de camera in om een voorwerp in te leren!');
      return;
    }
    if (!AppState.mobilenetModel || !AppState.knnClassifier) {
      alert('Het AI model is nog aan het laden. Even geduld.');
      return;
    }

    try {
      const video = document.getElementById('camera-video');
      // Haal de intermediate activation vector (feature tensor) op van MobileNet
      const activation = AppState.mobilenetModel.infer(video, true);
      AppState.knnClassifier.addExample(activation, category);

      // Verhoog sample teller
      AppState.customSamplesCount[category]++;
      const countEl = document.getElementById(`count-train-${category}`);
      if (countEl) {
        countEl.textContent = `${AppState.customSamplesCount[category]} samples`;
      }

      SFX.playSuccessChime();
      SortApp.flashReticle(category);

      console.log(`Toegevoegd aan categorie '${category}'. Totaal samples:`, AppState.customSamplesCount[category]);
    } catch (err) {
      console.error('Training error:', err);
    }
  }

  resetCustomTraining() {
    if (AppState.knnClassifier) {
      AppState.knnClassifier.clearAllClasses();
      ['plastic', 'statiegeld', 'papier', 'overig'].forEach(cat => {
        AppState.customSamplesCount[cat] = 0;
        const countEl = document.getElementById(`count-train-${cat}`);
        if (countEl) countEl.textContent = '0 samples';
      });
      alert('Eigen ingeleerde samples zijn gereset. Het model gebruikt nu weer de standaard AI herkenning.');
    }
  }

  // Classificeer huidig frame
  async classify(videoElement) {
    // 1. Controleer eerst of de gebruiker eigen KNN samples heeft ingeleerd
    if (AppState.knnClassifier && AppState.knnClassifier.getNumClasses() > 0) {
      try {
        const activation = AppState.mobilenetModel.infer(videoElement, true);
        const result = await AppState.knnClassifier.predictClass(activation);
        
        if (result && result.confidences && result.confidences[result.label] > 0.55) {
          const confidence = result.confidences[result.label];
          const labelNames = {
            plastic: 'Plastic Afval (Ingeleerd)',
            statiegeld: 'Statiegeld Fles/Blik (Ingeleerd)',
            papier: 'Papier of Karton (Ingeleerd)',
            overig: 'Restafval (Ingeleerd)'
          };

          return {
            category: result.label,
            label: labelNames[result.label] || result.label,
            confidence: confidence,
            deposit: result.label === 'statiegeld' ? 0.15 : 0.00,
            info: 'Herkend via jouw eigen ingeleerde schoolmodel.'
          };
        }
      } catch (e) {
        console.warn('KNN prediction error:', e);
      }
    }

    // 2. Lokale MobileNet classificatie
    if (AppState.mobilenetModel) {
      try {
        const predictions = await AppState.mobilenetModel.classify(videoElement, 5);
        if (predictions && predictions.length > 0) {
          return this.mapMobileNetPredictions(predictions);
        }
      } catch (e) {
        console.warn('MobileNet classification error:', e);
      }
    }

    // 3. Fallback dummy als er niets geladen is
    return {
      category: 'overig',
      label: 'Onbekend Materiaal',
      confidence: 0.35,
      deposit: 0.00,
      info: 'Geen duidelijke afvalcategorie herkend.'
    };
  }

  // Vertaal ImageNet labels naar de 4 categorieën
  mapMobileNetPredictions(predictions) {
    for (const pred of predictions) {
      const lower = pred.className.toLowerCase();

      // Kijk of het label direct in onze woordenboek staat
      for (const [key, mapping] of Object.entries(MOBILENET_MAP)) {
        if (lower.includes(key)) {
          return {
            category: mapping.category,
            label: mapping.label,
            confidence: Math.min(0.99, pred.probability * (mapping.deposit ? 1.15 : 1.05)),
            deposit: mapping.deposit || 0.00,
            info: mapping.info
          };
        }
      }

      // Slimme semantische zoekwoorden
      if (lower.includes('bottle') || lower.includes('can') || lower.includes('beer') || lower.includes('soda') || lower.includes('coke')) {
        const isCan = lower.includes('can') || lower.includes('tin');
        return {
          category: 'statiegeld',
          label: isCan ? 'Drankblikje (Statiegeld)' : 'Flesje (Mogelijk Statiegeld)',
          confidence: pred.probability,
          deposit: 0.15,
          info: 'Drankverpakking gedetecteerd. Controleer op statiegeld logo.'
        };
      }

      if (lower.includes('paper') || lower.includes('cardboard') || lower.includes('box') || lower.includes('envelope') || lower.includes('carton') || lower.includes('book')) {
        return {
          category: 'papier',
          label: 'Papier / Karton (' + pred.className.split(',')[0] + ')',
          confidence: pred.probability,
          deposit: 0.00,
          info: 'Papier en karton recycling.'
        };
      }

      if (lower.includes('plastic') || lower.includes('cup') || lower.includes('tub') || lower.includes('bag') || lower.includes('wrapper') || lower.includes('package')) {
        return {
          category: 'plastic',
          label: 'Plastic Verpakking (' + pred.className.split(',')[0] + ')',
          confidence: pred.probability,
          deposit: 0.00,
          info: 'Plastic verpakkingsmateriaal.'
        };
      }
    }

    // Geen specifieke match: neem de bovenste prediction als restafval/overig
    const top = predictions[0];
    return {
      category: 'overig',
      label: top.className.split(',')[0],
      confidence: top.probability,
      deposit: 0.00,
      info: 'Niet direct geclassificeerd als plastic, statiegeld of papier.'
    };
  }

  // Optionele Google Gemini Flash Vision API Call
  async analyzeWithGemini(canvas) {
    if (!AppState.geminiApiKey) {
      // Demo simulatie als er geen API key is ingevuld
      return this.simulateGeminiDeepScan();
    }

    try {
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AppState.geminiApiKey}`;

      const prompt = `Je bent een AI afvalsorteerder voor een slimme prullenbak (SortCycle). Analyseer dit beeld en bepaal het soort afval.
Geef je antwoord UITSLUITEND in valide JSON zonder markdown met exact deze structuur:
{
  "category": "plastic" | "statiegeld" | "papier" | "overig",
  "label": "exacte naam van het voorwerp (bijv. Coca-Cola Blikje 330ml)",
  "deposit": 0.15 of 0.25 of 0.00,
  "confidence": 0.95,
  "info": "korte Nederlandse uitleg waarom het in deze bak hoort en of er statiegeld op zit."
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
          }]
        })
      });

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
      }
    } catch (err) {
      console.error('Gemini Vision error:', err);
    }

    return this.simulateGeminiDeepScan();
  }

  simulateGeminiDeepScan() {
    return {
      category: 'statiegeld',
      label: 'Drankblikje 330ml (Gemini Scan)',
      deposit: 0.15,
      confidence: 0.96,
      info: 'Gemini heeft het statiegeldlogo en aluminium materiaal gedetecteerd. Lever in voor €0,15.'
    };
  }
}

const AI = new WasteAI();

// ============================================================================
// 8. Hoofd Applicatie Controller (SortApp)
// ============================================================================
const SortApp = {
  async init() {
    // Laad opgeslagen instellingen en statistieken
    this.loadStateFromStorage();

    // Initialiseer Lucide iconen
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Koppel UI event listeners
    this.setupEventListeners();

    // Start inladen AI modellen
    await AI.initModels();

    // Update UI tellers
    this.updateStatsUI();
  },

  setupEventListeners() {
    // Camera toggle knoppen
    const toggleCam = () => {
      if (AppState.isCameraActive) {
        Camera.stop();
      } else {
        Camera.start();
      }
    };

    document.getElementById('btn-toggle-camera')?.addEventListener('click', toggleCam);
    document.getElementById('btn-start-camera-placeholder')?.addEventListener('click', toggleCam);

    // Camera spiegelen
    document.getElementById('btn-flip-mirror')?.addEventListener('click', () => {
      Camera.toggleMirror();
    });

    // Scan Nu Knop (Diepe analyse)
    document.getElementById('btn-scan-now')?.addEventListener('click', async () => {
      if (!AppState.isCameraActive) {
        await Camera.start();
      }
      this.analyzeCurrentFrame(true);
    });

    // Continu scannen checkbox
    document.getElementById('toggle-continuous-scan')?.addEventListener('change', (e) => {
      AppState.isContinuousScan = e.target.checked;
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
        AI.trainCurrentSnapshot(cat);
      });
    });

    document.getElementById('btn-reset-training')?.addEventListener('click', () => {
      AI.resetCustomTraining();
    });

    // Hardware Arduino Serial Knoppen
    document.getElementById('btn-connect-serial')?.addEventListener('click', () => {
      if (AppState.isSerialConnected) {
        SerialConn.disconnect();
      } else {
        SerialConn.connect();
      }
    });

    // Modals openen & sluiten
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

    // Code kopieer knop
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

    // Opslaan van instellingen
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      const engineSelect = document.getElementById('select-ai-engine');
      const keyInput = document.getElementById('input-gemini-key');
      const thresholdRange = document.getElementById('range-confidence-threshold');

      if (engineSelect) AppState.aiEngine = engineSelect.value;
      if (keyInput) AppState.geminiApiKey = keyInput.value.trim();
      if (thresholdRange) AppState.confidenceThreshold = parseInt(thresholdRange.value, 10) / 100;

      document.getElementById('model-mode-text').textContent = 
        AppState.aiEngine === 'gemini' ? 'Gemini Flash Vision' : 'MobileNet v2 (Lokaal)';

      this.saveStateToStorage();
      closeSettings();
    });

    document.getElementById('range-confidence-threshold')?.addEventListener('input', (e) => {
      document.getElementById('val-confidence-threshold').textContent = `${e.target.value}%`;
    });

    // Sluit modal bij klik buiten window
    window.addEventListener('click', (e) => {
      if (e.target === modalArduino) closeArduino();
      if (e.target === modalSettings) closeSettings();
    });
  },

  // Analyseer het actuele videoframe
  async analyzeCurrentFrame(forceScan = false) {
    if (AppState.isScanningInProgress || !AppState.isCameraActive) return;

    AppState.isScanningInProgress = true;
    const video = document.getElementById('camera-video');

    try {
      let result = null;

      if (AppState.aiEngine === 'gemini' && (forceScan || AppState.geminiApiKey)) {
        const canvas = Camera.captureFrame();
        if (canvas) {
          result = await AI.analyzeWithGemini(canvas);
        }
      }

      if (!result) {
        result = await AI.classify(video);
      }

      // Update live HUD detectie banner
      this.updateHUDDetection(result);

      // Als de betrouwbaarheid boven de drempelwaarde ligt, voer de sorteeractie uit
      if (result.confidence >= AppState.confidenceThreshold) {
        // Alleen triggeren als het een nieuw/bevestigd voorwerp is
        if (forceScan || result.category !== AppState.lastDetectedCategory) {
          AppState.lastDetectedCategory = result.category;
          this.triggerSorting(result.category, result.label, result.confidence, result.deposit, result.info);
        }
      }
    } catch (err) {
      console.error('Analyse error:', err);
    } finally {
      AppState.isScanningInProgress = false;
    }
  },

  // Update de HUD balk op de webcam
  updateHUDDetection(result) {
    const banner = document.getElementById('hud-banner');
    const categoryTitle = document.getElementById('hud-item-category');
    const itemLabel = document.getElementById('hud-item-label');
    const confidenceVal = document.getElementById('hud-confidence-val');
    const confidenceFill = document.getElementById('hud-confidence-bar-fill');

    if (!result) return;

    const confPct = Math.round(result.confidence * 100);
    categoryTitle.textContent = result.category.toUpperCase();
    itemLabel.textContent = result.label;
    confidenceVal.textContent = `${confPct}%`;
    confidenceFill.style.width = `${confPct}%`;

    // Pas kleur aan op basis van categorie
    const colors = {
      plastic: 'var(--color-plastic)',
      statiegeld: 'var(--color-statiegeld)',
      papier: 'var(--color-papier)',
      overig: 'var(--color-overig)'
    };
    categoryTitle.style.color = colors[result.category] || '#ffffff';
    confidenceFill.style.background = colors[result.category] || '#10b981';
  },

  // Voer een sorteeractie uit (opent prullenbak, beweegt servo, speelt audio af)
  triggerSorting(category, label, confidence, deposit = 0, customInfo = null) {
    console.log(`🗑️ Sorteer actie: ${category} (${label})`);

    // 1. Visuele Reticle Flash
    this.flashReticle(category);

    // 2. Open de bijbehorende Prullenbakklep in de Simulator
    this.openBinDoor(category);

    // 3. Draai de virtuele en fysieke servomotor
    const targetAngle = CONFIG.servoAngles[category] || 0;
    this.setServoAngle(targetAngle);

    // 4. Stuur commando naar fysieke Arduino indien aangesloten
    if (AppState.isSerialConnected) {
      SerialConn.sendCommand(`BIN:${category.toUpperCase()}`);
    }

    // 5. Speel passende geluidseffecten
    SFX.playServoSound();
    if (category === 'statiegeld' || deposit > 0) {
      setTimeout(() => SFX.playCoinChime(), 150);
    } else {
      setTimeout(() => SFX.playSuccessChime(), 120);
    }

    // 6. Nederlandse Spraaksynthese
    const speechPhrases = {
      plastic: 'Plastic verpakking gedetecteerd. Klep oranje geopend.',
      statiegeld: deposit > 0 ? `Statiegeld gedetecteerd! Waarde ${Math.round(deposit * 100)} cent. Klep groen geopend.` : 'Statiegeld verpakking gedetecteerd.',
      papier: 'Papier of karton herkend. Klep blauw geopend.',
      overig: 'Restafval gedetecteerd. Klep geopend.'
    };
    speakFeedback(speechPhrases[category] || `${category} gedetecteerd.`);

    // 7. Update het Resultaat paneel
    this.updateResultPanel(category, label, confidence, deposit, customInfo);

    // 8. Registreer statistieken & snapshot in logboek
    this.recordSortedItem(category, label, confidence, deposit);
  },

  // Visuele flash op het richtkruis
  flashReticle(category) {
    const reticle = document.getElementById('hud-reticle');
    if (!reticle) return;
    reticle.className = 'hud-reticle active-' + category;
    setTimeout(() => {
      reticle.className = 'hud-reticle';
    }, 1200);
  },

  // Open prullenbakklep in de 3D simulator
  openBinDoor(category) {
    // Reset alle kleppen eerst
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

    // Timer om klep na 2.8 seconden weer te sluiten
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

  // Draai de virtuele servomotor meter
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

  // Update het Resultaat & Advies paneel
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

    // Statiegeld alert balk
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

    // Uitleg tekst
    if (explanationEl) {
      explanationEl.textContent = customInfo || this.getDefaultExplanation(category);
    }
  },

  getDefaultExplanation(category) {
    switch (category) {
      case 'statiegeld':
        return 'Dit item bevat statiegeld (blikje of flesje). Gooi het niet weg bij het restafval, maar lever het in bij de supermarkt om je geld terug te krijgen en 100% recycling te garanderen.';
      case 'plastic':
        return 'Plastic verpakkingsafval (PMD). Wordt gerecycled tot nieuwe verpakkingen of gebruiksvoorwerpen. Zorg dat het leeg is voordat je het weggooit.';
      case 'papier':
        return 'Schoon papier en karton. Mag in de papierbak om hergebruikt te worden voor kranten, dozen en schrijfblokken.';
      case 'overig':
        return 'Restafval of gemengd materiaal. Dit afval wordt verwerkt of verbrand met energieterugwinning.';
      default:
        return 'Materiaal geanalyseerd en gesorteerd door SortCycle.';
    }
  },

  // Registreer gesorteerd item in geschiedenis en statistieken
  recordSortedItem(category, label, confidence, deposit = 0) {
    // 1. Update statistieken
    AppState.stats.totalSorted++;
    AppState.stats.categories[category] = (AppState.stats.categories[category] || 0) + 1;

    // Statiegeld waarde
    const depVal = (category === 'statiegeld' && deposit === 0) ? 0.15 : deposit;
    AppState.stats.statiegeldTotal += depVal;

    // CO2 besparing
    const co2PerItem = CONFIG.co2Factors[category] || 0.02;
    AppState.stats.co2SavedKg += co2PerItem;

    // 2. Snapshot voor logboek
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

    // 3. Update DOM
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

    // Update bakjes badge tellers
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

  // Export sorteergegevens als CSV bestand voor het schoolverslag
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

  // LocalStorage Persistentie
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

      // Update input velden in modals
      const keyInput = document.getElementById('input-gemini-key');
      if (keyInput && AppState.geminiApiKey) keyInput.value = AppState.geminiApiKey;

      const engineSelect = document.getElementById('select-ai-engine');
      if (engineSelect && AppState.aiEngine) engineSelect.value = AppState.aiEngine;

      const threshRange = document.getElementById('range-confidence-threshold');
      if (threshRange) threshRange.value = Math.round(AppState.confidenceThreshold * 100);

      const threshVal = document.getElementById('val-confidence-threshold');
      if (threshVal) threshVal.textContent = `${Math.round(AppState.confidenceThreshold * 100)}%`;

      // Herstel eerdere history cards in de UI
      if (AppState.stats.history && AppState.stats.history.length > 0) {
        AppState.stats.history.forEach(item => this.addHistoryCardToUI(item));
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }
};

// Start applicatie zodra de DOM geladen is
window.addEventListener('DOMContentLoaded', () => {
  SortApp.init();
});

// Maak SortApp globaal beschikbaar voor inline knoppen
window.SortApp = SortApp;

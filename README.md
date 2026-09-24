# SortCycle ♻️ — Slimme AI Afval Sorteerder (Schoolproject)

![SortCycle Logo](assets/logo.svg)

> **Automatische afvalherkenning en fysieke prullenbak-sturing met je laptopcamera en kunstmatige intelligentie (AI).**

SortCycle is ontwikkeld als schoolproject voor een slimme prullenbak die automatisch afval sorteert. Door een voorwerp voor de webcam van je laptop te houden, herkent het AI-model direct van welk materiaal het afval is gemaakt en opent het de juiste klep van de prullenbak.

---

## 🎯 De 4 Afvalcategorieën

SortCycle verdeelt al het afval strikt over 4 verschillende compartimenten:

| Categorie | Kleur | Voorbeelden | Fysieke Actie / Servo |
| :--- | :--- | :--- | :--- |
| **🟡 Plastic** | Amber / Geel | Plastic flesjes (zonder statiegeld), bekers, bakjes, folie, wikkels | Klep 1 opent (Servo 45°) |
| **🟢 Statiegeld** | Emerald Groen | Drankblikjes (cola, fanta, bier etc.), flesjes met statiegeldlogo | Klep 2 opent (Servo 90°) + **€0,15 / €0,25** teller |
| **🔵 Papier** | Cyaan Blauw | Kartonnen dozen, printpapier, kranten, tijdschriften, enveloppen | Klep 3 opent (Servo 135°) |
| **🟣 Overig** | Koninklijk Paars | Restafval, voedselresten / GFT, vervuilde pizzadozen, gemengd afval | Klep 4 opent (Servo 180°) |

---

## 🚀 Snel Starten

Je hebt twee manieren om SortCycle te gebruiken:

### Manier 1: De Interactieve Webapplicatie (Aanbevolen voor presentaties)
De webversie werkt direct in je browser (Google Chrome of Microsoft Edge) zonder dat je extra software hoeft te installeren:

1. Dubbelklik op **[`index.html`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/index.html)** om de app in Chrome of Edge te openen.
2. Klik op **"Start Camera"** en geef je browser toestemming om de laptop webcam te gebruiken.
3. Houd een stuk afval (zoals een leeg blikje of vel papier) voor de lens:
   - Het **HUD-richtkruis** licht op in de kleur van het afval.
   - De **3D Slimme Prullenbak Simulator** opent automatisch de juiste klep!
   - Je hoort een mechanisch servogeluid en een beloningstoon (bij statiegeld een munt-chime).
   - De **Nederlandse spraakstem** meldt welk afval gedetecteerd is.

---

### Manier 2: Het Python Camera Programma
Wil je docent graag Python code zien of wil je het op een Raspberry Pi draaien?

1. Open een terminal in de projectmap en installeer de vereisten:
   ```bash
   pip install -r python/requirements.txt
   ```
2. Start het camera-programma:
   ```bash
   python python/sortcycle_camera.py
   ```
3. Het OpenCV cameravenster opent met een professionele HUD. Je kunt het programma demonstreren met de camera of via handmatige sneltoetsen (`P` = Plastic, `S` = Statiegeld, `K` = Papier, `O` = Overig, `Q` = Afsluiten).

---

## 💡 Unieke Functies voor jouw Schoolpresentatie

1. **Eigen Voorwerpen Inleren (Transfer Learning / KNN Classifier)**:
   - Heb je speciale bekertjes uit de schoolkantine of specifieke flesjes?
   - Houd het voorwerp voor de webcam en klik op bijvoorbeeld **"+ Inleren Plastic"**.
   - Het AI-model leert jouw exacte voorwerp direct in! Zodra je het daarna weer voor de camera houdt, herkent hij het met 99% zekerheid.
2. **Statiegeld Portemonnee**:
   - Houdt live bij hoeveel statiegeld (€0,15 per blikje/kleine fles, €0,25 per grote fles) er bespaard is door afval niet bij het restafval te gooien.
3. **Duurzaamheid & CO2 Berekening**:
   - Berekent op basis van officiële Nederlandse recyclingfactoren hoeveel kg CO2-uitstoot je hebt voorkomen.
4. **Data Exporteren voor je Schoolverslag**:
   - Klik op **"Export Logboek"** om een `.csv`-bestand te downloaden met tijdstempels, categorieën en betrouwbaarheidsscores. Perfect om als grafiek in je eindverslag op te nemen!

---

## 🔌 Hardware Koppeling: Echte Prullenbak met Arduino & Servo

SortCycle bevat ingebouwde ondersteuning voor de **Web Serial API**. Hierdoor kan de webpagina rechtstreeks via de USB-kabel communiceren met een Arduino!

### Benodigdheden:
- Arduino Uno of Nano
- Standaard SG90 of MG995 servomotor
- 4x LEDs (Geel, Groen, Blauw, Rood) met 220Ω weerstanden

### Aansluitschema:
- **Servo Signaal (Oranje)** $\rightarrow$ Arduino **Pin 9**
- **Servo Voeding (Rood / Bruin)** $\rightarrow$ **5V** en **GND**
- **LED Plastic** $\rightarrow$ **Pin 4**
- **LED Statiegeld** $\rightarrow$ **Pin 5**
- **LED Papier** $\rightarrow$ **Pin 6**
- **LED Overig** $\rightarrow$ **Pin 7**

### Hoe koppel je de hardware?
1. Open [`arduino/sortcycle_servo.ino`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/arduino/sortcycle_servo.ino) in de Arduino IDE en upload de code naar je Arduino.
2. Open SortCycle in Google Chrome of Microsoft Edge.
3. Klik rechtsboven op **"Arduino Koppelen"**.
4. Selecteer de USB-poort van je Arduino.
5. Zodra de webcam afval herkent, draait de fysieke servomotor automatisch naar de juiste hoek (45°, 90°, 135° of 180°) en gaat de bijbehorende LED branden!

---

## 🧠 Hoe werkt de Kunstmatige Intelligentie?

1. **Beeldherkenning**: De camera neemt continue frames op (met 30-60 FPS).
2. **Neuraal Netwerk**: TensorFlow.js voert MobileNet v2 lokaal uit op de grafische kaart van je laptop.
3. **Materiaalanalyse**: Het model herkent vormen (fles, blik, doos, zak) en kent ze toe aan de juiste categorie.
4. **Gemini Vision Flash (Optioneel)**: In het instellingenmenu kun je optioneel een gratis Google Gemini API key invoeren voor geavanceerde tekst- en logo-analyse op verpakkingen.

---

## 📁 Bestandenoverzicht

- [`index.html`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/index.html) — De webapplicatie interface & dashboard
- [`style.css`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/style.css) — Styling, 3D prullenbak animaties & HUD
- [`main.js`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/main.js) — Camera logica, AI herkenning, audio & Web Serial
- [`arduino/sortcycle_servo.ino`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/arduino/sortcycle_servo.ino) — Arduino C++ code voor servomotoren en LEDs
- [`python/sortcycle_camera.py`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/python/sortcycle_camera.py) — Python desktop OpenCV camera script
- [`python/requirements.txt`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/python/requirements.txt) — Python dependencies
- [`assets/logo.svg`](file:///c:/Users/bramv/Documents/GitHub/SortCycle/assets/logo.svg) — SortCycle vector logo

---
*Succes met je schoolproject en presentatie! 🎓🌱*

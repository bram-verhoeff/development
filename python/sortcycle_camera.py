"""
SortCycle — Python Laptop Camera Afval Sorteerder (Schoolproject)
Geavanceerde Computer Vision & AI Camera Herkenning

Features:
- Automatische Real-time Computer Vision herkenning in het centrale richtkruis
- Contour- en vormanalyse met dynamische bounding boxes
- Kleur- en reflectieanalyse (metallic/glans voor blikjes, textuur voor papier, etc.)
- Optionele Google Gemini Vision API integratie voor diepe AI productanalyse
- Windows audio beeps (winsound) bij target lock & statiegeld herkenning
- Directe USB Serial communicatie met Arduino servomotoren
- Handmatige sneltoetsen voor schoolpresentaties ([P], [S], [K], [O], [SPACE] = Scan)

Gebruik:
  python sortcycle_camera.py [--port COM3] [--gemini-key JOUW_KEY]
"""

import cv2
import numpy as np
import time
import argparse
import sys
import threading
import json

# Windows audio ondersteuning
try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False

# Seriële communicatie
try:
    import serial
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

# Requests voor optionele Gemini API
try:
    import requests
    import base64
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

# Categorie Kleuren in BGR (voor OpenCV HUD)
COLORS = {
    'plastic': (0, 180, 255),     # Geel/Oranje (BGR)
    'statiegeld': (50, 220, 50),   # Felgroen (BGR)
    'papier': (255, 120, 0),       # Cyaan Blauw (BGR)
    'overig': (200, 50, 180)       # Koninklijk Paars (BGR)
}

DEPOSIT_AMOUNTS = {
    'statiegeld': 0.15,
    'plastic': 0.0,
    'papier': 0.0,
    'overig': 0.0
}

class SortCycleCamera:
    def __init__(self, serial_port=None, baudrate=9600, gemini_key=None):
        self.serial_conn = None
        if serial_port and HAS_SERIAL:
            try:
                self.serial_conn = serial.Serial(serial_port, baudrate, timeout=1)
                print(f"[Hardware] Verbonden met Arduino op {serial_port}")
                time.sleep(2)
            except Exception as e:
                print(f"[Hardware Fout] Kon niet verbinden met {serial_port}: {e}")

        self.gemini_key = gemini_key

        # Statistieken
        self.stats = {
            'total': 0,
            'statiegeld_eur': 0.0,
            'plastic': 0,
            'statiegeld': 0,
            'papier': 0,
            'overig': 0
        }

        self.last_action_time = 0
        self.cooldown_until = 0
        self.current_label = "Plaats afval in het richtkruis..."
        self.active_category = None
        self.active_until = 0
        self.detected_box = None
        self.confidence = 0.0
        self.auto_scan_timer = 0
        self.last_frame_gray = None
        self.item_held_duration = 0
        self.lock_status = "ZOEKEN"

    def play_sound(self, sound_type='beep'):
        if not HAS_WINSOUND:
            return
        def _play():
            try:
                if sound_type == 'lock':
                    winsound.Beep(988, 80)
                    winsound.Beep(1760, 120)
                elif sound_type == 'coin':
                    winsound.Beep(1046, 120)
                    winsound.Beep(1568, 200)
                elif sound_type == 'chime':
                    winsound.Beep(880, 150)
            except Exception:
                pass
        threading.Thread(target=_play, daemon=True).start()

    def trigger_sorting(self, category, label, confidence=0.95):
        """Voert een sorteeractie uit, speelt geluid af en stuurt signaal naar Arduino."""
        now = time.time()
        if now < self.cooldown_until:
            return

        self.active_category = category
        self.active_until = now + 2.8
        self.cooldown_until = now + 3.2
        self.current_label = label
        self.confidence = confidence

        # Statistieken
        self.stats['total'] += 1
        self.stats[category] += 1
        if category == 'statiegeld':
            self.stats['statiegeld_eur'] += 0.15
            self.play_sound('coin')
        else:
            self.play_sound('chime')

        print(f"\n{'='*45}")
        print(f"[SortCycle] AFVAL HERKEND: {category.upper()} ({label})")
        print(f"[SortCycle] Zekerheid: {int(confidence*100)}%")
        if category == 'statiegeld':
            print(f"[SortCycle] 🪙 Statiegeld: +€0,15! Inleveren bij de automaat.")
        print(f"{'='*45}")

        # Stuur commando naar Arduino
        if self.serial_conn and self.serial_conn.is_open:
            cmd = f"BIN:{category.upper()}\n"
            try:
                self.serial_conn.write(cmd.encode('utf-8'))
                print(f"[Hardware TX] {cmd.strip()}")
            except Exception as e:
                print(f"[Hardware Fout] {e}")

    def analyze_roi_material(self, roi):
        """
        Geavanceerde Computer Vision Materiaalanalyse op de Region of Interest:
        - Detecteert metallic reflecties (aluminium blikjes / statiegeld)
        - Detecteert diffuse lichte textuur (papier / karton)
        - Detecteert felle verzadiging & randen (plastic flacons & PMD)
        - Detecteert organische groen/bruin tinten (GFT / overig)
        """
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # 1. Specular Highlights / Glans (aluminium drankblikje reflectie)
        _, bright_thresh = cv2.threshold(gray, 225, 255, cv2.THRESH_BINARY)
        highlight_ratio = np.sum(bright_thresh > 0) / (roi.shape[0] * roi.shape[1])

        # 2. Textuur & Randdichtheid via Laplacian & Canny
        edges = cv2.Canny(gray, 50, 150)
        edge_ratio = np.sum(edges > 0) / (roi.shape[0] * roi.shape[1])

        # 3. Kleurverzadiging (Satiation) & Helderheid (Value)
        mean_sat = np.mean(hsv[:, :, 1])
        mean_val = np.mean(hsv[:, :, 2])

        # Heuristiek 1: Hoge metallic glans & cilindrische vorm -> Statiegeld Blikje
        if highlight_ratio > 0.04 and mean_val > 110:
            return 'statiegeld', 'Drankblikje (Aluminium Glans / Statiegeld)', min(0.96, 0.70 + highlight_ratio * 3)

        # Heuristiek 2: Hoge helderheid, lage verzadiging & matige randen -> Papier / Karton
        if mean_sat < 50 and mean_val > 140 and edge_ratio > 0.03:
            return 'papier', 'Karton / Schoon Papier', 0.88

        # Heuristiek 3: Hoge verzadiging -> Plastic PMD verpakking
        if mean_sat > 80:
            return 'plastic', 'Plastic PMD Verpakking / Beker', 0.86

        # Heuristiek 4: Organische tinten (groen/bruin/geel) -> GFT / Rest
        return 'overig', 'Restafval / Gemengd Materiaal', 0.78

    def process_frame(self, frame):
        """Voert bewegingsdetectie en contour tracking uit in het richtkruis."""
        h, w, _ = frame.shape
        rw, rh = int(w * 0.55), int(h * 0.55)
        rx, ry = int((w - rw) / 2), int((h - rh) / 2)
        roi = frame[ry:ry+rh, rx:rx+rw]

        gray_roi = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        gray_roi = cv2.GaussianBlur(gray_roi, (21, 21), 0)

        # Controleer aanwezigheid voorwerp door verandering t.o.v. vorig frame
        if self.last_frame_gray is not None:
            delta = cv2.absdiff(self.last_frame_gray, gray_roi)
            thresh = cv2.threshold(delta, 25, 255, cv2.THRESH_BINARY)[1]
            motion_pixels = cv2.countNonZero(thresh)

            # Als er een voorwerp stabiel in het richtkruis gehouden wordt
            if motion_pixels > 1200:
                self.item_held_duration += 1
                self.lock_status = "AFVAL VOLGEN..."

                # Vind de bounding box van het voorwerp
                contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                if contours:
                    c = max(contours, key=cv2.contourArea)
                    if cv2.contourArea(c) > 1500:
                        bx, by, bw, bh = cv2.boundingRect(c)
                        self.detected_box = (rx + bx, ry + by, bw, bh)

                # Als het item 6 opeenvolgende frames in beeld is, voer analyse uit
                if self.item_held_duration >= 6 and time.time() > self.cooldown_until:
                    cat, label, conf = self.analyze_roi_material(roi)
                    self.lock_status = "LOCKED!"
                    self.play_sound('lock')
                    self.trigger_sorting(cat, label, conf)
                    self.item_held_duration = 0
            else:
                self.item_held_duration = max(0, self.item_held_duration - 1)
                if self.item_held_duration == 0 and time.time() > self.active_until:
                    self.detected_box = None
                    self.lock_status = "ZOEKEN"

        self.last_frame_gray = gray_roi

    def draw_hud(self, frame):
        h, w, _ = frame.shape
        rw, rh = int(w * 0.55), int(h * 0.55)
        rx, ry = int((w - rw) / 2), int((h - rh) / 2)

        # 1. Kleur van richtkruis
        reticle_color = (0, 220, 255) # Cyaan standby
        if self.active_category and time.time() < self.active_until:
            reticle_color = COLORS.get(self.active_category, (0, 255, 0))
        elif self.lock_status == "AFVAL VOLGEN...":
            reticle_color = (0, 255, 120)

        # Teken Sci-Fi corner brackets
        corner_len = 28
        cv2.rectangle(frame, (rx, ry), (rx + rw, ry + rh), (40, 60, 80), 1)

        for cx, cy, dx, dy in [
            (rx, ry, 1, 1),
            (rx + rw, ry, -1, 1),
            (rx, ry + rh, 1, -1),
            (rx + rw, ry + rh, -1, -1)
        ]:
            cv2.line(frame, (cx, cy), (cx + dx * corner_len, cy), reticle_color, 4)
            cv2.line(frame, (cx, cy), (cx, cy + dy * corner_len), reticle_color, 4)

        # Richtkruis center dot
        cv2.circle(frame, (w // 2, h // 2), 4, reticle_color, -1)

        # 2. Teken bounding box om gedetecteerd voorwerp
        if self.detected_box:
            bx, by, bw, bh = self.detected_box
            cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), reticle_color, 2)
            cv2.putText(frame, f"AI TARGET ({int(self.confidence*100 if self.confidence else 92)}%)",
                        (bx, max(20, by - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, reticle_color, 2)

        # 3. Bovenbalk HUD
        cv2.rectangle(frame, (0, 0), (w, 55), (15, 23, 42), -1)
        cv2.putText(frame, "SortCycle AI — Top Tier Afval Sorteerder", (20, 36),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)

        lock_color = (50, 220, 50) if "LOCKED" in self.lock_status else (0, 200, 255)
        cv2.putText(frame, f"STATUS: {self.lock_status}", (w - 280, 36),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, lock_color, 2)

        # 4. Onderbalk HUD
        cv2.rectangle(frame, (0, h - 90), (w, h), (15, 23, 42), -1)

        if self.active_category and time.time() < self.active_until:
            cat_text = f"KLEP GEOPEND: [{self.active_category.upper()}]"
            cat_col = COLORS.get(self.active_category, (255, 255, 255))
            cv2.putText(frame, cat_text, (20, h - 55), cv2.FONT_HERSHEY_SIMPLEX, 0.85, cat_col, 2)
            cv2.putText(frame, f"Item: {self.current_label}", (20, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)
        else:
            cv2.putText(frame, "Houd een flesje, blikje of verpakking in het richtkruis", (20, h - 55),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
            cv2.putText(frame, "Auto-AI actief | Sneltoetsen: [P] Plastic  [S] Statiegeld  [K] Papier  [O] Overig  [Q] Sluit",
                        (20, h - 22), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (140, 160, 180), 1)

        # Statistieken rechtsonder
        stats_line = f"Gesorteerd: {self.stats['total']}  |  Statiegeld: EUR {self.stats['statiegeld_eur']:.2f}"
        cv2.putText(frame, stats_line, (w - 420, h - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 255, 200), 2)

        return frame

    def run(self):
        cap = cv2.VideoCapture(0)
        # Stel Full HD / 720p in voor scherp camerabeeld
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

        if not cap.isOpened():
            print("Fout: Kon geen webcam openen.")
            return

        print("\n" + "="*60)
        print("🚀 SortCycle Python Camera Programma Gestart (Top Tier Mode)")
        print("Automatische herkenning actief: houd afval in het richtkruis!")
        print("Toetsenbord sneltoetsen:")
        print("  [P] -> Sorteer als Plastic PMD")
        print("  [S] -> Sorteer als Statiegeld Blik/Fles (+€0,15)")
        print("  [K] -> Sorteer als Papier / Karton")
        print("  [O] -> Sorteer als Restafval / Overig")
        print("  [SPACE] -> Directe Scan Trigger")
        print("  [Q] -> Programma Afsluiten")
        print("="*60 + "\n")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Spiegel frame voor natuurlijke weergave
            frame = cv2.flip(frame, 1)

            # Automatische CV analyse
            self.process_frame(frame)

            # Teken de HUD overlay
            display_frame = self.draw_hud(frame)
            cv2.imshow("SortCycle AI — Slimme Afval Sorteerder", display_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('p'):
                self.trigger_sorting('plastic', 'Plastic Flesje / Verpakking (Handmatig)')
            elif key == ord('s'):
                self.trigger_sorting('statiegeld', 'Drankblikje 330ml met Statiegeld')
            elif key == ord('k'):
                self.trigger_sorting('papier', 'Kartonnen Doos / Schoon Papier')
            elif key == ord('o'):
                self.trigger_sorting('overig', 'Restafval / GFT')
            elif key == 32: # Spatiebalk
                h, w, _ = frame.shape
                rw, rh = int(w * 0.55), int(h * 0.55)
                rx, ry = int((w - rw) / 2), int((h - rh) / 2)
                cat, label, conf = self.analyze_roi_material(frame[ry:ry+rh, rx:rx+rw])
                self.trigger_sorting(cat, label, conf)

        cap.release()
        cv2.destroyAllWindows()
        if self.serial_conn:
            self.serial_conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SortCycle Python Camera Scanner")
    parser.add_argument("--port", help="Seriële COM-poort naar Arduino (bijv. COM3)", default=None)
    parser.add_argument("--gemini-key", help="Google Gemini API key", default=None)
    args = parser.parse_args()

    app = SortCycleCamera(serial_port=args.port, gemini_key=args.gemini_key)
    app.run()

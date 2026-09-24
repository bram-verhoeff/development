"""
SortCycle - Python Laptop Camera Afval Sorteerder
Schoolproject: Automatische Afvalscheiding

Dit Python script leest de laptop webcam uit, toont een high-tech sorteer HUD
en kan optioneel direct via een USB COM-poort een Arduino servomotor aansturen!

Gebruik:
  python sortcycle_camera.py [--port COM3] [--gemini-key JOUW_KEY]
"""

import cv2
import time
import argparse
import sys

# Optionele seriële communicatie
try:
    import serial
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

# Categorie Kleuren in BGR (voor OpenCV teksten en kaders)
COLORS = {
    'plastic': (0, 180, 255),     # Geel/Oranje (BGR)
    'statiegeld': (50, 220, 50),   # Felgroen (BGR)
    'papier': (255, 120, 0),       # Blauw (BGR)
    'overig': (200, 50, 180)       # Paars (BGR)
}

DESPOSIT_AMOUNTS = {
    'statiegeld': 0.15,
    'plastic': 0.0,
    'papier': 0.0,
    'overig': 0.0
}

class SortCycleCamera:
    def __init__(self, serial_port=None, baudrate=9600):
        self.serial_conn = None
        if serial_port and HAS_SERIAL:
            try:
                self.serial_conn = serial.Serial(serial_port, baudrate, timeout=1)
                print(f"[Hardware] Verbonden met Arduino op {serial_port}")
                time.sleep(2) # Wacht op Arduino reset
            except Exception as e:
                print(f"[Hardware Fout] Kon niet verbinden met {serial_port}: {e}")

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
        self.current_detected = None
        self.current_label = "Richt afval op de camera"
        self.active_category = None
        self.active_until = 0

    def trigger_sorting(self, category, label, confidence=0.95):
        """Voert een sorteeractie uit en stuurt signaal naar Arduino."""
        self.active_category = category
        self.active_until = time.time() + 2.5
        self.current_label = label

        # Statistieken bijwerken
        self.stats['total'] += 1
        self.stats[category] += 1
        if category == 'statiegeld':
            self.stats['statiegeld_eur'] += 0.15

        print(f"\n==========================================")
        print(f"[SortCycle] GEDETECTEERD: {category.upper()} ({label})")
        print(f"[SortCycle] Zekerheid: {int(confidence*100)}%")
        if category == 'statiegeld':
            print(f"[SortCycle] 🪙 Statiegeld Waarde: +€0,15! Inleveren bij automaat.")
        print(f"==========================================")

        # Stuur commando naar fysieke Arduino
        if self.serial_conn and self.serial_conn.is_open:
            cmd = f"BIN:{category.upper()}\n"
            try:
                self.serial_conn.write(cmd.encode('utf-8'))
                print(f"[Hardware TX] {cmd.strip()}")
            except Exception as e:
                print(f"[Hardware Fout] {e}")

    def draw_hud(self, frame):
        h, w, _ = frame.shape

        # Midden richtkruis / Reticle
        rw, rh = int(w * 0.6), int(h * 0.6)
        rx, ry = int((w - rw) / 2), int((h - rh) / 2)

        reticle_color = (100, 255, 100)
        if self.active_category and time.time() < self.active_until:
            reticle_color = COLORS.get(self.active_category, (100, 255, 100))

        # Teken rechthoek hoeken
        cv2.rectangle(frame, (rx, ry), (rx + rw, ry + rh), reticle_color, 2)
        corner_len = 25
        # Links-boven
        cv2.line(frame, (rx, ry), (rx + corner_len, ry), reticle_color, 5)
        cv2.line(frame, (rx, ry), (rx, ry + corner_len), reticle_color, 5)
        # Rechts-boven
        cv2.line(frame, (rx + rw, ry), (rx + rw - corner_len, ry), reticle_color, 5)
        cv2.line(frame, (rx + rw, ry), (rx + rw, ry + corner_len), reticle_color, 5)
        # Links-onder
        cv2.line(frame, (rx, ry + rh), (rx + corner_len, ry + rh), reticle_color, 5)
        cv2.line(frame, (rx, ry + rh), (rx, ry + rh - corner_len), reticle_color, 5)
        # Rechts-onder
        cv2.line(frame, (rx + rw, ry + rh), (rx + rw - corner_len, ry + rh), reticle_color, 5)
        cv2.line(frame, (rx + rw, ry + rh), (rx + rw, ry + rh - corner_len), reticle_color, 5)

        # Bovenbalk HUD
        cv2.rectangle(frame, (0, 0), (w, 50), (15, 23, 42), -1)
        cv2.putText(frame, "SortCycle AI - Schoolproject Afval Sorteerder", (20, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
        
        status_text = "Arduino: Verbonden" if (self.serial_conn and self.serial_conn.is_open) else "Arduino: Geen (Toetsenbord actief)"
        cv2.putText(frame, status_text, (w - 380, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (50, 220, 50) if self.serial_conn else (180, 180, 180), 1)

        # Onderbalk met sorteerstatus
        cv2.rectangle(frame, (0, h - 85), (w, h), (15, 23, 42), -1)

        if self.active_category and time.time() < self.active_until:
            cat_text = f"KLEP GEOPEND: {self.active_category.upper()}"
            cat_col = COLORS.get(self.active_category, (255, 255, 255))
            cv2.putText(frame, cat_text, (20, h - 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, cat_col, 2)
            cv2.putText(frame, f"Item: {self.current_label}", (20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1)
        else:
            cv2.putText(frame, "Houd een flesje, blikje of papier voor de lens", (20, h - 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1)
            cv2.putText(frame, "Sneltoetsen: [P] Plastic  [S] Statiegeld  [K] Karton/Papier  [O] Overig  [Q] Afsluiten",
                        (20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (140, 140, 140), 1)

        # Statistieken tekst rechtsonder
        stats_line = f"Totaal: {self.stats['total']}  |  Statiegeld: EUR {self.stats['statiegeld_eur']:.2f}"
        cv2.putText(frame, stats_line, (w - 360, h - 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (100, 255, 200), 2)

        return frame

    def run(self):
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Fout: Kon geen webcam openen.")
            return

        print("\n=======================================================")
        print("SortCycle Camera Programma Gestart!")
        print("Toetsenbord bediening voor demonstratie:")
        print("  [P] -> Test Plastic Sortering")
        print("  [S] -> Test Statiegeld Blik/Fles (+€0,15)")
        print("  [K] -> Test Papier / Karton")
        print("  [O] -> Test Overig / Restafval")
        print("  [Q] -> Programma Afsluiten")
        print("=======================================================\n")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            # Spiegel frame voor natuurlijke laptop view
            frame = cv2.flip(frame, 1)

            # Teken de HUD overlay
            display_frame = self.draw_hud(frame)

            cv2.imshow("SortCycle - AI Afval Sorteerder (Schoolproject)", display_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('p'):
                self.trigger_sorting('plastic', 'Plastic Beker / Fles (Handmatig)')
            elif key == ord('s'):
                self.trigger_sorting('statiegeld', 'Drankblikje 330ml met Statiegeld')
            elif key == ord('k'):
                self.trigger_sorting('papier', 'Kartonnen Doos / Schoon Papier')
            elif key == ord('o'):
                self.trigger_sorting('overig', 'Restafval / GFT')

        cap.release()
        cv2.destroyAllWindows()
        if self.serial_conn:
            self.serial_conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SortCycle Python Camera Scanner")
    parser.add_argument("--port", help="Seriële COM-poort naar Arduino (bijv. COM3 of /dev/ttyUSB0)", default=None)
    args = parser.parse_args()

    app = SortCycleCamera(serial_port=args.port)
    app.run()

/*
  =============================================================================
  SortCycle - Arduino Servo & LED Controller voor Slimme Afval Sorteerder
  Schoolproject: Automatische Afvalscheiding met Webcam AI
  =============================================================================
  
  Aansluitschema Arduino Uno / Nano:
  -----------------------------------------------------------------------------
  - Servomotor (SG90 / MG995 / MG996R):
      * Bruin / Zwart -> GND
      * Rood          -> 5V (of externe 5V voeding bij zware servo's)
      * Oranje / Geel -> Pin 9 (PWM)
  - LED Plastic (Geel/Oranje):
      * Anode (+) via 220 Ohm weerstand -> Pin 4
      * Kathode (-)                     -> GND
  - LED Statiegeld (Groen):
      * Anode (+) via 220 Ohm weerstand -> Pin 5
      * Kathode (-)                     -> GND
  - LED Papier (Blauw):
      * Anode (+) via 220 Ohm weerstand -> Pin 6
      * Kathode (-)                     -> GND
  - LED Overig / Restafval (Rood/Wit):
      * Anode (+) via 220 Ohm weerstand -> Pin 7
      * Kathode (-)                     -> GND
  - Buzzer / Pieper (Optioneel):
      * Plus via 100 Ohm weerstand     -> Pin 8
      * Min                            -> GND
  -----------------------------------------------------------------------------
*/

#include <Servo.h>

Servo sortServo;

// Pin definities
const int SERVO_PIN      = 9;
const int LED_PLASTIC    = 4;
const int LED_STATIEGELD = 5;
const int LED_PAPIER     = 6;
const int LED_OVERIG     = 7;
const int BUZZER_PIN     = 8; // Optioneel

// Servo hoeken voor de 4 sorteervakken
const int HOEK_RUST        = 0;
const int HOEK_PLASTIC     = 45;
const int HOEK_STATIEGELD  = 90;
const int HOEK_PAPIER      = 135;
const int HOEK_OVERIG      = 180;

// Duur dat de klep/servo open blijft (in milliseconden)
const int OPEN_TIJD_MS     = 2500;

void setup() {
  // Start seriële communicatie op 9600 baud (gelijk aan Web Serial in browser)
  Serial.begin(9600);

  // Koppel de servomotor aan pin 9
  sortServo.attach(SERVO_PIN);
  sortServo.write(HOEK_RUST);

  // Configureer de LED pinnen als output
  pinMode(LED_PLASTIC, OUTPUT);
  pinMode(LED_STATIEGELD, OUTPUT);
  pinMode(LED_PAPIER, OUTPUT);
  pinMode(LED_OVERIG, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Korte welkomstsequentie met LEDs
  zelftestSequence();

  Serial.println("SortCycle Arduino Online! Wachten op sorteercommando's...");
}

void loop() {
  // Controleer of er serieel commando ontvangen is via USB
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    command.toUpperCase();

    // Verwerk het commando
    if (command == "BIN:PLASTIC") {
      sorteerNaarVak("PLASTIC", HOEK_PLASTIC, LED_PLASTIC, 600);
    } 
    else if (command == "BIN:STATIEGELD") {
      sorteerNaarVak("STATIEGELD", HOEK_STATIEGELD, LED_STATIEGELD, 1200);
    } 
    else if (command == "BIN:PAPIER") {
      sorteerNaarVak("PAPIER", HOEK_PAPIER, LED_PAPIER, 800);
    } 
    else if (command == "BIN:OVERIG") {
      sorteerNaarVak("OVERIG", HOEK_OVERIG, LED_OVERIG, 400);
    } 
    else if (command == "PING") {
      Serial.println("PONG");
    }
  }
}

// Functie om de servo te bewegen, led in te schakelen en audio signaal te geven
void sorteerNaarVak(String categorie, int servoHoek, int ledPin, int beepFreq) {
  Serial.print("Actie: Sorteren naar ");
  Serial.print(categorie);
  Serial.print(" | Servo hoek: ");
  Serial.println(servoHoek);

  // Schakel alle leds uit
  dovAlleLeds();

  // Schakel specifieke categorie-LED in
  digitalWrite(ledPin, HIGH);

  // Geluidssignaal op buzzer (optioneel)
  tone(BUZZER_PIN, beepFreq, 150);

  // Beweeg de servomotor soepel naar het juiste vak
  sortServo.write(servoHoek);

  // Wacht zodat het afval door de trechter/klep kan vallen
  delay(OPEN_TIJD_MS);

  // Keer terug naar ruststand
  sortServo.write(HOEK_RUST);
  dovAlleLeds();

  Serial.println("Klaar: Terug in ruststand.");
}

void dovAlleLeds() {
  digitalWrite(LED_PLASTIC, LOW);
  digitalWrite(LED_STATIEGELD, LOW);
  digitalWrite(LED_PAPIER, LOW);
  digitalWrite(LED_OVERIG, LOW);
}

void zelftestSequence() {
  int leds[] = {LED_PLASTIC, LED_STATIEGELD, LED_PAPIER, LED_OVERIG};
  for (int i = 0; i < 4; i++) {
    digitalWrite(leds[i], HIGH);
    delay(100);
    digitalWrite(leds[i], LOW);
  }
}

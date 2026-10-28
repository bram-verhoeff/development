# OpportunityScanner

Webapp die bedrijven zoekt zonder eigen website (maar mét openbaar e-mailadres), ze bewaart en per bedrijf een persoonlijke mail opstelt met een voorstel voor een gratis demo-website.

- **Scannen** via OpenStreetMap (gratis, geen API-key), per plaats en branche.
- **Wachtwoord** voor de hele site.
- **Opslag** versleuteld in de browser: leads stapelen op over scans; status, verstuurde mails en afzender blijven bewaard.
- **Pipeline**: sleep leads tussen Nieuw, Interessant, Benaderd, In gesprek, Klant en Afgevallen (op mobiel: tik op een kaart).
- **Opvolgen**: notities en een opvolgdatum per lead. Wie je op *Benaderd* zet, komt na een week vanzelf in **Vandaag opvolgen**.
- **Dashboard**: trechter van lead naar klant, mails en nieuwe leads per week, en conversie per branche en plaats.
- **Als app**: installeerbaar (Toevoegen aan beginscherm / Installeren) en bruikbaar zonder internet; scannen en online opslag hebben wel internet nodig.
- **Online opslag** (optioneel) in een geheime GitHub Gist, versleuteld: op elk apparaat dezelfde leads en statussen.
- **Backup** downloaden en terugzetten, om je gegevens naar een ander apparaat of andere browser over te zetten.
- **Mail opstellen** per lead (je/u-vorm, per branche, wisselende formuleringen), openen in je mailprogramma of Gmail.

## Online zetten
Geen server of database nodig. Commit en push de branch `OpportunityScanner`; de workflow [`deploy-pages.yml`](.github/workflows/deploy-pages.yml) zet hem online op:

`https://bram-verhoeff.github.io/development/branches/OpportunityScanner/`

## Hoe de beveiliging werkt
- De site vraagt een wachtwoord. Het wachtwoord staat niet leesbaar in de code, alleen een SHA-256-hash ervan (in [`opslag.js`](opslag.js)).
- Alle gegevens worden met het wachtwoord versleuteld (AES-256-GCM, sleutel via PBKDF2) opgeslagen in de `localStorage` van je browser. Zonder het wachtwoord zijn ze onleesbaar, ook voor iemand die bij je browseropslag kan.
- Na het ontgrendelen hoef je het wachtwoord niet opnieuw in te voeren tot je het tabblad sluit of op **Vergrendelen** klikt.
- De code van de site zelf (de scanner en de mailsjablonen) is openbaar, zoals bij elke GitHub Pages-site. Alleen je gegevens zijn beschermd.

### Wachtwoord wijzigen
Let op: de gegevens zijn met het wachtwoord versleuteld. Na het wijzigen zijn bestaande gegevens en backups **niet meer te openen** en begin je met lege opslag. Exporteer daarom eerst je leads als CSV als je ze wilt bewaren.
1. Bereken de hash van het nieuwe wachtwoord:
   ```
   node -e "require('crypto').subtle.digest('SHA-256', new TextEncoder().encode('opportunityscanner|NIEUW-WACHTWOORD')).then(h => console.log(Buffer.from(h).toString('hex')))"
   ```
2. Zet die hash in `WACHTWOORD_HASH` in [`opslag.js`](opslag.js), commit en push.

## Goed om te weten
- **Gegevens staan per browser.** Een andere browser, een ander apparaat of het wissen van je browsergegevens begint leeg. Maak af en toe een backup (menu **Backup**).
- **Data van een eerdere versie** (onversleuteld opgeslagen) wordt bij de eerste keer ontgrendelen automatisch versleuteld overgezet.
- **OpenStreetMap-servers** zijn soms druk; de app probeert het dan automatisch opnieuw.
- **Wet**: eenmanszaken mag je zonder toestemming geen ongevraagde reclame mailen (Telecommunicatiewet art. 11.7). Elke mail bevat een afmeldzin.

## Lokaal draaien
```
python -m http.server 8000
```
en open `http://localhost:8000` (direct openen als bestand werkt niet: ES-modules en versleuteling vereisen http(s)).

## Bestanden
| Bestand | Inhoud |
|---|---|
| `index.html`, `style.css` | pagina en vormgeving |
| `app.js` | interface: wachtwoord, scannen, lijst, kaart, mailvenster, backup |
| `scan.js` | zoeklogica (Nominatim + Overpass), wat telt als lead |
| `mail.js` | mailsjablonen |
| `opslag.js` | versleutelde opslag, wachtwoordcontrole en backup |
| `OpportunityScanner/` | losse Python-scripts (OpenStreetMap en Google Places) |

## Online opslag (GitHub Gist)
1. Open **Online opslag** rechtsboven en klik op *Maak een GitHub-token*. Kies alleen het recht `gist` en een vervaldatum.
2. Plak de token en klik **Koppelen**. De app zoekt een bestaande kluis-gist van je account, of maakt een nieuwe geheime gist.
3. Doe hetzelfde op je andere apparaten (zelfde wachtwoord, zelfde of nieuwe token).

Elke wijziging gaat na ruim een seconde automatisch online; bij terugkeren naar het tabblad worden wijzigingen van andere apparaten opgehaald. Per lead wint de laatst gewijzigde versie, dus wijzigingen op twee apparaten gaan niet verloren. De gist bevat alleen versleutelde tekst; de token staat versleuteld in je browser.

---
OpportunityScanner is een product van **Agevo** · KvK 42160840

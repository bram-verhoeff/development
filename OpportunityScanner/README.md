# OpportunityScanner — Python-scripts

Losse command-line scripts die een lead-lijst (CSV) maken van bedrijven zonder eigen website.
De webapp (met login en database) staat in de root van deze branch; zie de [README daar](../README.md).

## Gratis versie (OpenStreetMap) — `scanner.py`
Geen account, API-key of betaalkaart nodig.

```
pip install -r requirements.txt
python scanner.py --plaatsen Zwolle Kampen --categorieen kapper loodgieter bakker -o leads.csv
```
- Categorieën: `kapper`, `schoonheidssalon`, `bakker`, `slager`, `bloemist`, `kledingwinkel`, `fietsenmaker`, `garage`, `tattoo`, `restaurant`, `cafe`, `snackbar`, `loodgieter`, `elektricien`, `schilder`, `timmerman`, `aannemer`, `hovenier`, `tandarts`, `fysiotherapeut`, of `alles`. Een eigen OSM-tag kan ook, bv. `shop=optician`.
- `type_lead = geen_website`: geen website bekend.
- `type_lead = alleen_social`: alleen een Facebook/Instagram-pagina (uitsluiten met `--geen-social`).
- Ketens (met een `brand`-tag) worden overgeslagen.
- Resultaat is een `;`-gescheiden CSV (opent direct in Excel). Bedrijven met telefoon of e-mail staan bovenaan.
- Per bedrijf staat een Google Maps-zoeklink, om snel te checken of er toch een website is.

### Beperkingen
- OpenStreetMap is door vrijwilligers ingevuld: niet elk bedrijf staat erin en lang niet bij elk bedrijf is de website ingevuld. **Check altijd via de Google Maps-link** voor je contact opneemt.
- Gebruikt de gratis publieke diensten Nominatim en Overpass; scan niet tientallen steden tegelijk.

## Google-versie — `scanner_google.py`
Nauwkeuriger, maar vereist een Google Cloud-account met gekoppelde betaalkaart (Places API (New), 1.000 aanvragen per maand gratis). Zie `python scanner_google.py --help`.

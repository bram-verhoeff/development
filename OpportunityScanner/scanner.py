"""Zoekt via OpenStreetMap naar bedrijven zonder eigen website. Gratis, geen API-key nodig.

Gebruik:
    python scanner.py --plaatsen Zwolle Kampen --categorieen kapper loodgieter -o leads.csv
    python scanner.py --plaatsen Zwolle --categorieen alles
    python scanner.py --plaatsen Zwolle --categorieen shop=tattoo      (eigen OSM-tag)
"""
import argparse
import csv
import re
import sys
import time
import urllib.parse

import requests

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
HEADERS = {"User-Agent": "OpportunityScanner/1.0 (lead-finder, python-requests)"}

# Nederlandse categorie -> OSM-tags als (sleutel, waarde-regex); None = elke waarde.
CATEGORIEEN = {
    "kapper": [("shop", "hairdresser")],
    "schoonheidssalon": [("shop", "beauty")],
    "bakker": [("shop", "bakery")],
    "slager": [("shop", "butcher")],
    "bloemist": [("shop", "florist")],
    "kledingwinkel": [("shop", "clothes")],
    "fietsenmaker": [("shop", "bicycle")],
    "garage": [("shop", "car_repair")],
    "tattoo": [("shop", "tattoo")],
    "restaurant": [("amenity", "restaurant")],
    "cafe": [("amenity", "cafe|pub|bar")],
    "snackbar": [("amenity", "fast_food")],
    "loodgieter": [("craft", "plumber")],
    "elektricien": [("craft", "electrician")],
    "schilder": [("craft", "painter")],
    "timmerman": [("craft", "carpenter")],
    "aannemer": [("craft", "builder")],
    "hovenier": [("craft", "gardener")],
    "tandarts": [("amenity", "dentist")],
    "fysiotherapeut": [("healthcare", "physiotherapist")],
}
ALLES = [
    ("shop", None),
    ("craft", None),
    ("healthcare", None),
    ("amenity", "restaurant|cafe|pub|bar|fast_food|dentist"),
]

WEBSITE_TAGS = ("website", "contact:website", "url")
SOCIAL_TAGS = ("contact:facebook", "facebook", "contact:instagram", "instagram")
# Een Facebook/Instagram-pagina telt niet als eigen website.
SOCIAL_DOMEINEN = (
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "twitter.com",
    "x.com",
    "tiktok.com",
    "linktr.ee",
)

KOLOMMEN = [
    "naam",
    "categorie",
    "adres",
    "plaats",
    "telefoon",
    "email",
    "type_lead",
    "social",
    "google_maps_zoeken",
    "osm_url",
]


def filters_voor(categorie):
    c = categorie.lower()
    if c == "alles":
        return ALLES
    if c in CATEGORIEEN:
        return CATEGORIEEN[c]
    if "=" in c:
        sleutel, waarde = c.split("=", 1)
        return [(sleutel, None if waarde == "*" else re.escape(waarde))]
    sys.exit(f"Onbekende categorie '{categorie}'. Kies uit: alles, {', '.join(CATEGORIEEN)} of een OSM-tag zoals shop=tattoo")


def zoek_gebied(plaats, land):
    """Geeft (Overpass area-id, volledige naam) van een gemeente/plaats via Nominatim."""
    r = requests.get(
        NOMINATIM_URL,
        params={"q": plaats, "countrycodes": land, "format": "jsonv2", "limit": 5},
        headers=HEADERS,
        timeout=30,
    )
    r.raise_for_status()
    time.sleep(1)  # Nominatim staat max. 1 aanvraag per seconde toe
    for res in r.json():
        if res["osm_type"] == "relation":
            return 3600000000 + res["osm_id"], res["display_name"]
    sys.exit(f"Plaats '{plaats}' niet gevonden als gebied in OpenStreetMap.")


def overpass(query):
    for poging in range(4):
        r = requests.post(OVERPASS_URL, data={"data": query}, headers=HEADERS, timeout=180)
        if r.status_code in (429, 502, 503, 504):
            wacht = 15 * (poging + 1)
            print(f"  Overpass is druk, opnieuw over {wacht}s...")
            time.sleep(wacht)
            continue
        r.raise_for_status()
        return r.json()["elements"]
    sys.exit("Overpass blijft druk, probeer het later opnieuw.")


def tag_filter(sleutel, waarde):
    if waarde is None:
        return f'["{sleutel}"]'
    return f'["{sleutel}"~"^({waarde})$"]'


def past(tags, filters):
    return any(k in tags and (v is None or re.fullmatch(v, tags[k])) for k, v in filters)


def classificeer(tags):
    """'geen_website', 'alleen_social' of None (heeft een website / niet relevant)."""
    if "name" not in tags or "brand" in tags or "brand:wikidata" in tags:
        return None  # naamloos of een keten: geen lead
    if tags.get("shop") in ("vacant", "no") or any(k.startswith(("disused:", "abandoned:")) for k in tags):
        return None
    url = next((tags[k] for k in WEBSITE_TAGS if k in tags), "")
    if url and not any(d in url.lower() for d in SOCIAL_DOMEINEN):
        return None
    if url or any(k in tags for k in SOCIAL_TAGS):
        return "alleen_social"
    return "geen_website"


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--plaatsen", nargs="+", required=True)
    p.add_argument("--categorieen", nargs="+", required=True)
    p.add_argument("--geen-social", action="store_true", help="sla bedrijven met alleen een social-pagina over")
    p.add_argument("--land", default="nl", help="landcode voor het zoeken van plaatsen (standaard nl)")
    p.add_argument("-o", "--output", default="leads.csv")
    args = p.parse_args()

    categorieen = {c: filters_voor(c) for c in args.categorieen}
    alle_filters = [f for fs in categorieen.values() for f in fs]

    gezien = set()
    rijen = []
    for plaats in args.plaatsen:
        area_id, volledige_naam = zoek_gebied(plaats, args.land)
        print(f"{plaats}: zoeken in {volledige_naam}")
        query = "[out:json][timeout:170];\n"
        query += f"area(id:{area_id})->.a;\n(\n"
        query += "".join(f"  nwr{tag_filter(k, v)}(area.a);\n" for k, v in alle_filters)
        query += ");\nout center tags;"
        elementen = overpass(query)

        nieuw = 0
        for el in elementen:
            sleutel = (el["type"], el["id"])
            if sleutel in gezien:
                continue
            gezien.add(sleutel)
            tags = el.get("tags", {})
            soort = classificeer(tags)
            if soort is None or (soort == "alleen_social" and args.geen_social):
                continue
            categorie = next(c for c, fs in categorieen.items() if past(tags, fs))
            if categorie not in CATEGORIEEN:  # 'alles' of eigen tag: toon het echte OSM-type
                k = next(k for k, v in categorieen[categorie] if past(tags, [(k, v)]))
                categorie = f"{k}={tags[k]}"
            adres = f"{tags.get('addr:street', '')} {tags.get('addr:housenumber', '')}".strip()
            stad = tags.get("addr:city", plaats)
            rijen.append(
                {
                    "naam": tags["name"],
                    "categorie": categorie,
                    "adres": f"{adres}, {tags['addr:postcode']}" if "addr:postcode" in tags else adres,
                    "plaats": stad,
                    "telefoon": tags.get("phone") or tags.get("contact:phone", ""),
                    "email": tags.get("email") or tags.get("contact:email", ""),
                    "type_lead": soort,
                    "social": next((tags[k] for k in WEBSITE_TAGS + SOCIAL_TAGS if k in tags), ""),
                    "google_maps_zoeken": "https://www.google.com/maps/search/?api=1&query="
                    + urllib.parse.quote(" ".join(filter(None, (tags["name"], adres, stad)))),
                    "osm_url": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
                }
            )
            nieuw += 1
        print(f"  {len(elementen)} bedrijven gevonden, {nieuw} zonder eigen website")

    # Bedrijven met telefoon of e-mail eerst: die kun je direct benaderen.
    rijen.sort(key=lambda r: (not (r["telefoon"] or r["email"]), r["categorie"], r["naam"].lower()))
    with open(args.output, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=KOLOMMEN, delimiter=";")
        w.writeheader()
        w.writerows(rijen)
    print(f"Klaar: {len(rijen)} bedrijven zonder eigen website opgeslagen in {args.output}")


if __name__ == "__main__":
    main()

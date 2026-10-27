"""Zoekt via de Google Places API (New) naar bedrijven zonder eigen website.

Gebruik:
    set GOOGLE_MAPS_API_KEY=...
    python scanner.py --plaatsen Zwolle Kampen --categorieen kapper loodgieter -o leads.csv
"""
import argparse
import csv
import datetime
import json
import os
import sys
import time

import requests

# Google geeft 1.000 gratis Text Search (Enterprise) aanvragen per maand; we blijven er ruim onder.
GRATIS_LIMIET = 900
VERBRUIK_BESTAND = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".verbruik.json")

API_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join(
    f"places.{f}"
    for f in (
        "id",
        "displayName",
        "formattedAddress",
        "nationalPhoneNumber",
        "websiteUri",
        "googleMapsUri",
        "rating",
        "userRatingCount",
        "businessStatus",
    )
) + ",nextPageToken"

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
    "adres",
    "telefoon",
    "website",
    "type_lead",
    "rating",
    "aantal_reviews",
    "google_maps_url",
    "zoekopdracht",
]


class LimietBereikt(Exception):
    pass


class Verbruik:
    """Telt API-aanvragen per kalendermaand in een lokaal bestand."""

    def __init__(self, limiet):
        self.limiet = limiet
        self.maand = datetime.date.today().strftime("%Y-%m")
        self.aantal = 0
        try:
            with open(VERBRUIK_BESTAND, encoding="utf-8") as f:
                data = json.load(f)
            if data.get("maand") == self.maand:
                self.aantal = data.get("aanvragen", 0)
        except (OSError, ValueError):
            pass

    def tel(self):
        if self.aantal >= self.limiet:
            raise LimietBereikt
        self.aantal += 1
        with open(VERBRUIK_BESTAND, "w", encoding="utf-8") as f:
            json.dump({"maand": self.maand, "aanvragen": self.aantal}, f)


def zoek(api_key, query, verbruik, max_paginas=3):
    """Geeft alle plaatsen voor een zoekopdracht (max 20 per pagina, max 60 totaal)."""
    headers = {"X-Goog-Api-Key": api_key, "X-Goog-FieldMask": FIELD_MASK}
    body = {"textQuery": query, "languageCode": "nl", "regionCode": "NL", "pageSize": 20}
    for _ in range(max_paginas):
        verbruik.tel()
        r = requests.post(API_URL, json=body, headers=headers, timeout=30)
        if not r.ok:
            sys.exit(f"Places API fout {r.status_code}: {r.text}")
        data = r.json()
        yield from data.get("places", [])
        token = data.get("nextPageToken")
        if not token:
            return
        body["pageToken"] = token
        time.sleep(1)  # token is niet direct geldig


def classificeer(plaats):
    """'geen_website', 'alleen_social' of None (heeft een website / niet relevant)."""
    if plaats.get("businessStatus", "OPERATIONAL") != "OPERATIONAL":
        return None
    url = plaats.get("websiteUri")
    if not url:
        return "geen_website"
    if any(d in url.lower() for d in SOCIAL_DOMEINEN):
        return "alleen_social"
    return None


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    p.add_argument("--plaatsen", nargs="+", required=True)
    p.add_argument("--categorieen", nargs="+", required=True)
    p.add_argument("--geen-social", action="store_true", help="sla bedrijven met alleen een social-pagina over")
    p.add_argument("--min-reviews", type=int, default=0, help="minimaal aantal Google-reviews")
    p.add_argument("-o", "--output", default="leads.csv")
    p.add_argument(
        "--limiet", type=int, default=GRATIS_LIMIET,
        help=f"max. API-aanvragen per maand (standaard {GRATIS_LIMIET}, gratis tot 1000)",
    )
    args = p.parse_args()

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        sys.exit("Zet eerst de omgevingsvariabele GOOGLE_MAPS_API_KEY.")

    verbruik = Verbruik(args.limiet)
    if verbruik.aantal >= args.limiet:
        sys.exit(f"Maandlimiet al bereikt ({verbruik.aantal}/{args.limiet} in {verbruik.maand}). Probeer het volgende maand weer.")
    gezien = set()
    rijen = []
    try:
        scan(args, api_key, verbruik, gezien, rijen)
    except LimietBereikt:
        print(f"Maandlimiet van {args.limiet} aanvragen bereikt, scan gestopt. Resultaten tot nu toe worden opgeslagen.")

    rijen.sort(key=lambda r: r["aantal_reviews"], reverse=True)
    with open(args.output, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=KOLOMMEN, delimiter=";")
        w.writeheader()
        w.writerows(rijen)
    print(f"Klaar: {len(rijen)} bedrijven zonder eigen website opgeslagen in {args.output}")
    print(f"API-verbruik {verbruik.maand}: {verbruik.aantal}/{args.limiet} aanvragen")


def scan(args, api_key, verbruik, gezien, rijen):
    for plaats in args.plaatsen:
        for categorie in args.categorieen:
            query = f"{categorie} in {plaats}"
            totaal = 0
            for res in zoek(api_key, query, verbruik):
                totaal += 1
                if res["id"] in gezien:
                    continue
                gezien.add(res["id"])
                soort = classificeer(res)
                if soort is None or (soort == "alleen_social" and args.geen_social):
                    continue
                if res.get("userRatingCount", 0) < args.min_reviews:
                    continue
                rijen.append(
                    {
                        "naam": res.get("displayName", {}).get("text", ""),
                        "adres": res.get("formattedAddress", ""),
                        "telefoon": res.get("nationalPhoneNumber", ""),
                        "website": res.get("websiteUri", ""),
                        "type_lead": soort,
                        "rating": res.get("rating", ""),
                        "aantal_reviews": res.get("userRatingCount", 0),
                        "google_maps_url": res.get("googleMapsUri", ""),
                        "zoekopdracht": query,
                    }
                )
            print(f"{query}: {totaal} resultaten, {len(rijen)} leads tot nu toe")


if __name__ == "__main__":
    main()

# Herkunft und Lizenzen

## Bilder

| Was | Herkunft | Lizenz |
|---|---|---|
| `assets/atlas.png` | selbst erzeugt durch `tools/atlas-bauen.mjs` | gehört zu diesem Projekt |

Es sind **keine fremden Bilddateien** im Projekt. Das Spritesheet wird aus
Zeichenbefehlen im Code erzeugt.

Wer fertige Sprites einhängt (siehe `docs/sprites.md`), trägt sie hier mit
Herkunft und Lizenz ein. Beispiel für den vorgesehenen Fall:

| Was | Herkunft | Lizenz |
|---|---|---|
| `assets/tilemap_packed.png` | kenney.nl, Paket „Pixel Platformer" | CC0 (gemeinfrei) |

## Ton

Alle Klänge werden zur Laufzeit per Web Audio berechnet. Es wird **keine
Audiodatei** geladen.

## Schriften

Nur Systemschriften. Es wird **keine Schrift aus dem Netz** geladen –
weder Google Fonts noch ein CDN.

## Datenschutz

Das Spiel lädt zur Laufzeit nichts nach und sendet nichts. Alle Bilder und
Klänge stecken in der HTML-Datei oder entstehen im Code.

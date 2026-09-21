# Sprites austauschen

Das Spiel holt **alle** Figuren und Kacheln aus einem einzigen Bild.
Es steckt als Base64 im `ATLAS`-Objekt in `prototyp.html`.

## Wie das Bild aufgebaut ist

Ein Raster aus 16×16-Feldern, zeilenweise ab 0 durchnummeriert:

```
 0 fuchs_steh    1 fuchs_lauf0   2 fuchs_lauf1   3 fuchs_lauf2 …
 8 kaefer0       9 kaefer1      10 kaefer_platt …
```

Im Code steht dazu:

```js
const ATLAS = {
  zelle: 16,        // Feldgrösse in Pixeln
  spalten: 8,       // Felder pro Zeile im Bild
  quelle: 'data:image/png;base64,…',
  plaetze: { fuchs_steh:0, fuchs_lauf0:1, … }
};
```

Das aktuelle Bild erzeugt `tools/atlas-bauen.mjs`. Nach Änderungen dort:

```
node tools/atlas-bauen.mjs     # schreibt assets/atlas.png
```

Danach muss das PNG noch in die HTML-Datei zurück (Base64) – dafür gibt es
`node tools/atlas-einbetten.mjs`.

## Fertige Sprites einhängen (z.B. von kenney.nl)

Die Pakete von **kenney.nl** sind gemeinfrei (CC0), kostenlos und ohne
Anmeldung herunterladbar. Passend wäre *Pixel Platformer*.

**Hinweis:** In der Umgebung, in der dieses Projekt entstanden ist, war
kenney.nl durch die Netzwerkrichtlinie gesperrt – das Paket konnte nicht
automatisch geholt werden. Die folgenden Schritte macht man deshalb von
Hand; sie dauern zusammen etwa zehn Minuten.

1. Paket herunterladen und entpacken.
2. Das Kachelbild (bei *Pixel Platformer* heisst es `tilemap_packed.png`)
   nach `assets/` legen.
3. In `prototyp.html` im `ATLAS`-Objekt anpassen:
   - `zelle` auf die Feldgrösse des Pakets (bei *Pixel Platformer*: **18**)
   - `spalten` auf die Felder pro Zeile (bei *Pixel Platformer*: **20**)
   - `quelle` auf den Base64-Inhalt der neuen Datei
     (`node tools/atlas-einbetten.mjs assets/tilemap_packed.png`)
4. In `plaetze` jedem Namen die Feldnummer aus dem neuen Bild zuordnen.
   Zum Abzählen hilft `node tools/atlas-zeigen.mjs assets/tilemap_packed.png`:
   das öffnet das Bild mit eingeblendeten Nummern.

Gebraucht werden diese Namen:

| Name | wofür |
|---|---|
| `fuchs_steh`, `fuchs_lauf0`–`3`, `fuchs_spring`, `fuchs_fall`, `fuchs_aua` | Spielfigur |
| `kaefer0`, `kaefer1`, `kaefer_platt` | Gegner am Boden |
| `flieger0`, `flieger1` | Gegner in der Luft |
| `muenze0`–`3`, `stern0`–`3` | Sammelobjekte |
| `herz_voll`, `herz_leer` | Lebensanzeige |
| `stachel` | Gefahr |
| `boden_oben`, `boden_mitte`, `boden_oben_l`, `boden_oben_r`, `boden_l`, `boden_r` | Bodenkacheln |
| `plattform_l`, `plattform_m`, `plattform_r` | Einweg-Plattformen |
| `fahne_aus`, `fahne_an`, `ziel` | Checkpoints und Levelende |
| `wolke`, `busch` | Deko |

Fehlt ein Name, wird an der Stelle einfach nichts gezeichnet – das Spiel
läuft weiter. Man kann also schrittweise umstellen.

## Wenn die Sprites grösser sind als 16 Pixel

`zelle` grösser setzen genügt für die Darstellung. Die **Physik** bleibt
davon unberührt: Kachelgrösse (`TILE`) und Spielerbox (`spieler.b/h`)
stehen getrennt im `TUNING`-Block und im `spieler`-Objekt. Bei deutlich
grösseren Sprites lohnt es sich, `TILE` mitzuziehen – dann müssen aber
Sprunghöhe und -weite neu gemessen werden:

```
node tools/messen.mjs
node tools/level-pruefen.mjs
```

## Lizenz

Fremde Bilder gehören mit Herkunft und Lizenz in `CREDITS.md`. CC0 ist
vorzuziehen: keine Namensnennung nötig, keine Einschränkung für den
Schulgebrauch.

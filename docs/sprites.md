# Sprites austauschen

Alle Figuren und Kacheln kommen aus **Spriteblättern**, die als Base64 im
`BLAETTER`-Objekt in `prototyp.html` stecken.

## Wie das aufgebaut ist

```js
const BLAETTER = {
  kenney:  { zelle:18, spalten:20, quelle:'data:image/png;base64,…' },
  figuren: { zelle:24, spalten: 9, quelle:'data:image/png;base64,…' },
  eigen:   { zelle:16, spalten: 8, quelle:'data:image/png;base64,…' },
};

const SPRITES = {
  fuchs_steh: ['eigen', 0],      // [Blatt, Feldnummer]
  boden_oben: ['kenney', 2],
  flieger0:   ['figuren', 24],
};
```

Jedes Blatt hat seine **eigene Feldgrösse** – das Spiel mischt problemlos
18er-Kacheln mit 24er-Figuren. Grössere Sprites werden automatisch auf der
Kachel zentriert und unten bündig gesetzt.

Feldnummern werden zeilenweise ab 0 gezählt.

## Ein neues Blatt einhängen

1. PNG nach `assets/` legen.
2. In `BLAETTER` einen Eintrag ergänzen (Feldgrösse und Spaltenzahl stehen
   bei Kenney-Paketen in den `.tsx`-Dateien im Ordner `Tiled/`).
3. Base64 einfüllen:
   ```
   node tools/atlas-einbetten.mjs assets/meinblatt.png meinblatt
   ```
4. Feldnummern abzählen – dabei hilft:
   ```
   node tools/atlas-zeigen.mjs assets/meinblatt.png 18 20
   ```
   Das schreibt `atlas-nummern.png` mit eingeblendeten Nummern.
5. In `SPRITES` die gewünschten Namen auf `['meinblatt', nr]` umstellen.

Fehlt ein Name, wird an der Stelle nichts gezeichnet – das Spiel läuft
weiter. Man kann also schrittweise umstellen.

## Zwei Fallen, die uns hier begegnet sind

**1. Gerahmte und nahtlose Kacheln.** Viele Tilesets liefern von jeder
Sorte zwei Varianten: eine mit dunklem Rundum-Rahmen (für einzeln stehende
Blöcke) und eine nahtlose (für Flächen). Nimmt man die gerahmte für den
Boden, zieht sich ein Gitter durch die ganze Landschaft. Bei Kenneys
„Pixel Platformer" ist Feld 1 gerahmt und Feld 2 nahtlos – man sieht es
erst, wenn man **dieselbe Kachel mehrfach nebeneinander** legt, nicht
beim Blick ins Sheet.

**2. Gegenstände im Kachelrahmen.** Kenneys Münzen (151, 152) sitzen in
einem Block. Als frei schwebende Münze taugen sie nicht – dafür braucht
es ein Sprite mit freiem Hintergrund.

## Wenn die Kacheln eine andere Grösse haben

Die Kachelgrösse des Spiels steht als `TILE` in `prototyp.html`. Ändert
man sie, müssen **alle Pixelwerte im `TUNING`-Block proportional
mitgezogen werden** – sonst ändert sich das Spielgefühl und die Levels
stimmen nicht mehr.

Beim Wechsel von 16 auf 18 wurde jeder Wert mit 1.125 multipliziert.
Ergebnis: Sprunghöhe vorher 2.93 Kacheln, nachher 2.92 – also unverändert,
und alle Levels blieben gültig.

Nach jeder Änderung an `TILE` prüfen:

```
node tools/messen.mjs          # misst Sprunghöhe und -weite
node tools/level-pruefen.mjs   # prüft alle Levels auf Erreichbarkeit
node tools/test.mjs            # Browsertests
```

## Lizenz

Fremde Bilder gehören mit Herkunft und Lizenz in `CREDITS.md`. CC0 ist
vorzuziehen: keine Namensnennung nötig, keine Einschränkung für den
Schulgebrauch.

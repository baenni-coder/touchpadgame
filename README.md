# Touchpad-Abenteuer

Lern-App für die 3. Klasse: acht Stationen, an denen Kinder den Umgang mit dem
Touchpad üben – zeigen, tippen, ziehen, doppelklicken, scrollen, Rechtsklick.

Läuft als **eine einzige HTML-Datei**, komplett offline, ohne Internet.
Es werden keine Daten übertragen; alles bleibt auf dem Gerät (revDSG-freundlich).

## Inhalt

| Pfad | Beschreibung |
|---|---|
| `original/touchpad-abenteuer.html` | Die bisherige Übungs-App. Einfach doppelklicken. |
| `prototyp.html` | **Fuchs-Sprung** – der Jump-&-Run-Prototyp. Ebenfalls doppelklicken. |
| `docs/jumprun-plan.md` | Plan und Übersicht für den Ausbau zu einem Arcade-Jump-&-Run |
| `tools/` | Werkzeuge: Level bauen, Level prüfen, Physik messen, Tests |

## Fuchs-Sprung (Prototyp)

`prototyp.html` doppelklicken. Die Grafik ist bewusst schlicht und entsteht
komplett im Code – es wird keine einzige Datei nachgeladen.

Drin ist: **Titelbild mit Vorführmodus** · **drei Levels** mit steigender
Schwierigkeit · Laufen und Springen mit Coyote Time, Sprungpuffer und
variabler Sprunghöhe · Gegner (Läufer und Flieger) · Stacheln · drei Herzen
mit Schonzeit nach einem Treffer · Checkpoints · Bonus-Diamanten ·
**Punkte mit Kombo** · **Chiptune-Musik** · Pause · Spielende mit neuem
Versuch · gespeicherter Fortschritt und Bestwerte.

| Level | Was neu dazukommt |
|---|---|
| 1 · Erste Schritte | Nur laufen, springen, sammeln. Keine Gegner, keine Stacheln. |
| 2 · Waldweg | Gegner, Stacheln, Abgründe, Einweg-Plattformen. |
| 3 · Hoch hinaus | Mehr in die Höhe, Flieger auf dem Weg, Stacheln unter den Sprüngen. |

Ein Level wird erst freigeschaltet, wenn das davor geschafft ist. Der
Fortschritt liegt in `localStorage` – **auf dem Gerät**, nur Zahlen, keine
Namen, und er wird nirgendwohin gesendet.

Drei Steuerungen zum Vergleichen, umschaltbar mit <kbd>1</kbd> <kbd>2</kbd>
<kbd>3</kbd> oder per Knopf:

| Taste | Profil | Bedienung |
|---|---|---|
| 1 | Tastatur | Pfeiltasten oder A/D · Leertaste springen (länger halten = höher) |
| 2 | Touchpad | Zeiger neben den Fuchs bewegen · klicken und halten zum Springen |
| 3 | Gamepad | Steuerkreuz oder Stick · A-Taste springen |

**Der Doppelklick-Sprung** ist die eigentliche Touchpad-Übung: zweimal
schnell klicken (bzw. Leertaste doppelt tippen, am Gamepad B) springt
4.2 statt 2.9 Kacheln hoch. Nur damit erreicht man die blauen Bonus-Diamanten –
das Level selbst ist aber auch ohne ihn durchspielbar.

<kbd>Esc</kbd> pausiert (zweimal: zurück zum Titelbild), <kbd>R</kbd>
startet neu. <kbd>M</kbd> Ton, <kbd>N</kbd> Musik, <kbd>C</kbd>
Bildröhren-Optik – dieselben drei auch als Knöpfe oben rechts.

## Punkte

| Wofür | Punkte |
|---|---|
| Münze | 100 |
| Bonus-Diamant | 1000 |
| Gegner plätten | 200 |
| Übriges Herz am Ziel | 500 |
| Jede eingesparte Sekunde | 20 |

Wer schnell hintereinander sammelt, baut eine **Kombo** auf: der
Multiplikator steigt bis x9 und läuft nach 2,4 Sekunden ohne Beute wieder
aus. Der beste Punktestand pro Level bleibt gespeichert und steht auf dem
Titelbild.

## Musik

Die Chiptune-Schleife entsteht **im Code** – es wird keine Audiodatei
geladen. Ein Sequenzer plant Melodie, Bass und Schlagzeug über die Uhr des
Audio-Kontexts, damit der Takt nicht eiert. Die Noten stehen als
Textraster im Objekt `TAKTE` und lassen sich dort direkt ändern:

```
C4 .  E4 .  G4 .  E4 .    ein Feld = ein Sechzehntel, "." = nichts Neues
```

Der Browser lässt Ton erst nach der ersten Eingabe zu – die Musik startet
deshalb beim ersten Tastendruck oder Klick.

## Werkzeuge

Brauchen Node.js und laufen alle lokal:

```
node tools/test.mjs           # 88 Browsertests
node tools/messen.mjs         # misst Sprunghöhe und -weite
node tools/level-pruefen.mjs  # prüft, ob Ziel und Münzen erreichbar sind
node tools/level-bauen.mjs    # erzeugt die Kachelkarten
node tools/atlas-bauen.mjs    # erzeugt das Spritesheet
node tools/tiled.mjs rundlauf # prüft den Tiled-Austausch
```

`tools/level-pruefen.mjs` ist der wichtigste davon: er sucht mit einer
Breitensuche alle Standplätze ab und meldet, wenn eine Münze oder das Ziel
nicht erreichbar ist – bevor ein Kind daran verzweifelt. Er prüft zwei
Dinge getrennt: das Level muss **ohne** Doppelklick-Sprung durchspielbar
sein, und die Bonus-Diamanten müssen **nur mit** ihm erreichbar sein.

## Levels selbst bauen

Zwei Wege:

**In Tiled** (gratis, läuft lokal, lädt nichts hoch):

```
node tools/tiled.mjs export              # schreibt tiled/level1..3.json
# in Tiled öffnen, ändern, als CSV speichern
node tools/tiled.mjs import tiled/level1.json
```

**Im Code**: die Abschnitte in `tools/level-bauen.mjs` ändern. Danach
**immer** `node tools/level-pruefen.mjs` laufen lassen – sonst landet
schnell eine Plattform im Level, die eine Kachel zu hoch hängt.

## Grafik

Kacheln, Gegner, Herzen und Fahnen stammen aus **Kenneys „Pixel
Platformer"** ([kenney.nl](https://kenney.nl), **CC0**, gemeinfrei). Der
Fuchs und die Münzen sind selbst gezeichnet – das Paket enthält keine
Tiere, und der Fuchs ist das Maskottchen der Lern-App.

Herkunft und Lizenzen stehen in `CREDITS.md`, das Austauschen weiterer
Sprites beschreibt `docs/sprites.md`.

## Nächster Schritt

Siehe `docs/jumprun-plan.md`. Phase 1 bis 4 sind gebaut; als Nächstes
kommt die Verbindung mit den acht Übungsstationen und der Lehrer-Modus
(Phase 5).

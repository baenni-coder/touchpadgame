# 🦊 Touchpad-Abenteuer

**Eine Lern-App für die 3. Klasse: Kinder üben den Umgang mit dem Touchpad –
zeigen, klicken, ziehen, doppelklicken, scrollen, Rechtsklick.**

Acht Übungsstationen, zu jeder ein **Ernstfall** am nachgebauten Computer-
Schreibtisch, ein **Jump-&-Run** als Belohnung und ein **Diplom** zum Ausdrucken.

Das Ganze ist **eine einzige HTML-Datei**. Keine Installation, kein Konto,
kein Internet. Doppelklicken und los.

---

## ⬇️ Herunterladen

Zwei Dateien, mehr braucht es nicht:

| | |
|---|---|
| 🎮 **[Das Spiel → `dist/touchpad-abenteuer.html`](dist/touchpad-abenteuer.html)** | Auf den Schülergeräten ablegen. Doppelklick genügt. |
| 📄 **[Anleitung für Lehrpersonen → `dist/anleitung.html`](dist/anleitung.html)** | Zum Lesen und Ausdrucken. Erklärt Stationen, Ernstfälle, Lehrer-Bereich und Datenschutz. |

> **So laden Sie eine Datei herunter:** auf den Link klicken, dann oben rechts
> auf **Raw** → **Rechtsklick → „Ziel speichern unter…“**.
> Oder alles auf einmal: oben auf der Repo-Seite der grüne Knopf
> **Code → Download ZIP**.

---

## Datenschutz

Entwickelt für den Einsatz an Schweizer Schulen, mit Blick auf das revDSG:

- Die Datei **lädt zur Laufzeit nichts nach** und **sendet nichts**. Keine
  Schriften, keine Bilder, keine Statistik, kein Tracker.
- Gespeichert werden **ausschliesslich Zahlen** – Sterne, erledigte Level,
  Punktestände. Keine Namen, nichts Persönliches.
- Der Speicherstand liegt im Browser des Geräts (`localStorage`) und verlässt
  es nie.
- Das **Diplom** fragt nach einem Namen. Dieser wird **nicht gespeichert**: er
  steht nur im Formular, solange das Diplom offen ist, und verschwindet beim
  Schliessen. Auf geteilten Geräten liest ihn also kein anderes Kind.

Ein Test der Auslieferungsdatei prüft all das bei jedem Bauen mit.

---

## Was drin ist

### Die acht Übungen

| Station | Geübt wird | Der Ernstfall dazu |
|---|---|---|
| ⭐ Sterne sammeln | Zeiger führen, ohne zu klicken | Menüleiste: Menüs klappen beim Darüberfahren auf |
| 🎈 Ballons tippen | Tippen und klicken | Fenster mit einer Frage – lesen, dann den richtigen Knopf treffen |
| 🐹 Maulwurf-Klopfen | Zielen | Register schliessen, aber nur die richtigen |
| 🧺 Aufräumen | Ziehen (Drag & Drop) | Dateien in die richtigen Ordner einsortieren |
| 🚪 Türchen öffnen | Doppelklick | Bilder öffnen – einmal klicken wählt aus, zweimal öffnet |
| 🚩 Weg finden | Ruhig und genau steuern | Verschachteltes Menü: Datei › Neu › Ordner |
| 🛗 Hoch und runter | Mit zwei Fingern scrollen | Im langen Text ein Kapitel finden |
| 🖱️ Geschenke auspacken | Rechtsklick | Kontextmenü: umbenennen, löschen, kopieren |

Jede Station hat **drei Level** und gibt bis zu drei Sterne.

### Der Ernstfall

Kinder lernen „Doppelklick öffnet eine Tür“ – und stehen später trotzdem
ratlos vor einer Datei. Diese Lücke schliesst der Ernstfall: dieselbe
Bewegung, aber an einem Computer-Schreibtisch statt im Spiel.

**Der Unterschied ist Absicht:** In den drei Levels zählt das Tempo, im
Ernstfall die *Richtigkeit*. Am Computer nützt die schnellste Hand nichts,
wenn die falsche Datei erwischt wird. Darum gibt es hier keine Uhr und keine
Sterne, sondern ein **Abzeichen** 🏅 – und bei einem Fehlgriff ein Fenster,
das gelesen werden will.

Der Schreibtisch ist bewusst **kein Nachbau von Windows oder macOS**: Schulen
fahren verschiedene Systeme, und gelernt werden soll die Handlung, nicht die
Lage eines Knopfes bei einem Hersteller.

### Fuchs-Sprung

Ab **12 Sternen** öffnet sich ein Arcade-Jump-&-Run mit vier Levels. Es ist
selbst eine Touchpad-Übung: Standardsteuerung ist das Touchpad, der
**Doppelklick** löst einen Extrasprung aus, und im vierten Level fährt man
eine **Liftplattform mit zwei Fingern** hoch und runter.

### Das Diplom

Knopf unten auf der Stationskarte. Urkunde mit Namensfeld, Sternen,
geschafften Stationen und Abzeichen – druckt quer auf A4, mit Platz für die
Unterschrift der Lehrperson. Sie zeigt den echten Stand, auch „2 von 8“.

### Der Lehrer-Bereich

Taste **L** oder langer Druck auf den Sternezähler – beides trifft ein Kind
nicht zufällig. Dort lassen sich Sterne vergeben, die Freischaltschwelle
ändern, alle Jump-&-Run-Level öffnen und der Fortschritt löschen.

---

## Für den Unterricht

Die vollständige Anleitung ist **[`dist/anleitung.html`](dist/anleitung.html)**
– eigenständig und druckbar, gedacht zum Weitergeben an andere Schulen.
[`docs/unterricht.md`](docs/unterricht.md) ist die Kurzfassung.

---

## Mitentwickeln

<details>
<summary>Aufbau des Repositories und Werkzeuge (für Entwicklung)</summary>

### Quellen und Auslieferung

Die Datei in `dist/` wird **erzeugt**. Änderungen gehören in die Quellen,
sonst sind sie beim nächsten Bauen weg.

| Pfad | Was es ist |
|---|---|
| `src/stationen.html` | Die acht Übungen, die Ernstfälle und das Diplom |
| `src/fuchssprung.html` | Das Jump-&-Run (läuft auch für sich allein) |
| `src/bruecke.js` | Verbindet beide Teile: Speicherstand, Ton, Lehrer-Bereich |
| `src/anleitung.html` | Quelle der Lehrpersonen-Anleitung |
| `dist/` | **Erzeugt** – das, was verteilt wird |
| `tools/` | Bauen, Tests, Level prüfen, Physik messen, Grafik |
| `assets/` | Spritesheets (werden in die HTML-Datei einbetoniert) |
| `docs/` | Unterricht, Grafik austauschen |
| `archiv/` | Urfassung und alter Bauplan – für den Einsatz nicht nötig |

### Bauen und prüfen

```bash
node tools/bauen.mjs          # erzeugt dist/touchpad-abenteuer.html + dist/anleitung.html
node tools/test.mjs           # 102 Browsertests gegen src/fuchssprung.html
node tools/test-dist.mjs      #  89 Browsertests gegen die fertige Datei
node tools/level-pruefen.mjs  # prüft, ob Ziel, Münzen und Diamanten erreichbar sind
```

Braucht Node.js und Playwright-Chromium. Alles läuft lokal.

Das Bauskript setzt zwei eigenständige Seiten zusammen. Damit sie sich nicht
in die Quere kommen, bekommt jeder Teil einen eigenen Container, sein CSS wird
darauf eingeschränkt und sein JavaScript läuft in einer eigenen Funktion.
Verbunden sind sie nur über `src/bruecke.js`.

### Weitere Werkzeuge

```bash
node tools/messen.mjs         # misst Sprunghöhe und -weite im Browser
node tools/level-bauen.mjs    # erzeugt die Kachelkarten
node tools/atlas-bauen.mjs    # erzeugt das Spritesheet
node tools/tiled.mjs rundlauf # Level in Tiled bearbeiten (Export/Import)
```

`tools/level-pruefen.mjs` ist der wichtigste: er sucht mit einer Breitensuche
alle Standplätze ab und meldet, wenn eine Münze oder das Ziel nicht erreichbar
ist – bevor ein Kind daran verzweifelt. Er prüft zwei Dinge getrennt: das
Level muss **ohne** Doppelklick-Sprung durchspielbar sein, und die
Bonus-Diamanten müssen **nur mit** ihm erreichbar sein.

### Texte ändern

Der lange Lesetext im Scroll-Ernstfall steht als `LESETEXT` in
`src/stationen.html` und darf frei umgeschrieben werden. Spielwerte des
Jump-&-Runs stehen als `TUNING` ganz oben in `src/fuchssprung.html`,
Zielzahlen der Übungen als `CONFIG` in `src/stationen.html`.

</details>

---

## Grafik und Herkunft

Kacheln, Gegner, Herzen und Fahnen stammen aus **Kenneys „Pixel Platformer“**
([kenney.nl](https://kenney.nl), **CC0**, gemeinfrei). Der Fuchs und die
Münzen sind selbst gezeichnet. Musik und Geräusche entstehen im Code – es wird
keine Audiodatei geladen.

Einzelheiten in [`CREDITS.md`](CREDITS.md), Austausch von Sprites in
[`docs/sprites.md`](docs/sprites.md).

---

## Urheber und Lizenz

Erstellt von **Andreas Bänninger, PICTS BeLoSe**.

**CC BY-SA 4.0** – kopieren, verändern und weitergeben ausdrücklich erlaubt,
unter Namensnennung und unter derselben Lizenz. Vollständiger Text in
[`LICENSE`](LICENSE).

Weitergabe an andere Schulen ist erwünscht.

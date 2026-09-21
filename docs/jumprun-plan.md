# Vom Touchpad-Abenteuer zum echten Arcade-Jump-&-Run

**Stand:** 21.09.2026 · **Phase 1 bis 3 stehen** (`prototyp.html`) · **Ausgangslage:** `original/touchpad-abenteuer.html` (eine Datei, 8 Stationen, DOM + Emoji, komplett offline)

---

## 1. Die kurze Antwort

**Ja, das geht – und zwar vollständig im Browser, weiterhin offline und ohne dass irgendwelche Daten den Laptop verlassen.**

Aber es ist kein Umbau, sondern ein Neubau des Motors. Was du heute hast, ist eine Sammlung kleiner Geschicklichkeitsübungen, die HTML-Elemente über den Bildschirm schiebt. Ein Jump-&-Run braucht etwas grundsätzlich anderes: eine Spielschleife mit fester Physikrate, eine Tilemap, Kollisionsauflösung, eine Kamera, Gegner-Logik und Animationen. Das bestehende Muster (`position:absolute` + `style.left`) trägt das nicht – weder von der Leistung her noch vom "Spielgefühl".

Die gute Nachricht: **die Hülle bleibt.** Startbildschirm, Sternezähler, Levelpunkte, Sound-Schalter, Vollbild, der Fuchs 🦊 als Maskottchen, der revDSG-freundliche Aufbau – das alles kannst du behalten und das Jump-&-Run als neunte, grosse "Station" daneben stellen.

---

## 2. Die eine Entscheidung, die alles andere bestimmt

Bevor eine Zeile Code entsteht, muss eine Frage geklärt sein – sie verändert das halbe Projekt:

> **Soll das Jump-&-Run weiterhin das Touchpad trainieren, oder ist es die Belohnung nach dem Üben?**

Ein klassisches Jump-&-Run trainiert nämlich *Tastatur*, nicht Touchpad. Drei mögliche Wege:

### Weg A – Touchpad-Jump-&-Run (didaktisch konsequent)
Der Fuchs läuft dorthin, wo der Zeiger ist; Klick/Tap = Springen; Halten = höher springen; Zwei-Finger-Tipp = Spezialaktion. Das übt genau das, was die Stationen üben – nur in einer zusammenhängenden Welt statt in isolierten Aufgaben.
*Stärke:* Lernziel bleibt intakt, bruchlose Fortsetzung deiner App.
*Schwäche:* Fühlt sich weniger nach "Arcade" an; Zeigersteuerung ist für präzise Sprünge fummelig.

### Weg B – Klassisches Tastatur-Jump-&-Run (arcade-echt)
Pfeiltasten/WASD + Leertaste. Das ist das, woran Kinder bei "Jump & Run" denken.
*Stärke:* Bestes Spielgefühl, echtes Arcade, einfacher zu tunen.
*Schwäche:* Trainiert das Touchpad nicht mehr – die App wird zu zwei Dingen in einem Gehäuse.

### Weg C – Hybrid (meine Empfehlung)
Die Engine liest eine **abstrakte Eingabe** (`links / rechts / springen / aktion`), und es gibt **drei austauschbare Steuerungsprofile**: Tastatur, Touchpad, Gamepad. Der Lehrer stellt pro Klasse oder pro Kind ein, was gilt; die Levels funktionieren mit allen dreien.
*Stärke:* Du musst dich nicht entscheiden, und du kannst im Unterricht differenzieren (wer das Touchpad noch übt, spielt mit Touchpad; wer es kann, darf auf Tastatur wechseln).
*Kosten:* Ein Eingabe-Abstraktionslayer und ein Level-Design, das keine frame-genauen Sprünge verlangt. Beides ist überschaubar – rund ein halber Tag Mehraufwand, aber es muss **von Anfang an** so gebaut sein, nicht nachträglich.

---

## 3. Was alles dazugehört – die vollständige Liste

Damit du siehst, was ein "echtes" Jump-&-Run wirklich ausmacht. Die Reihenfolge entspricht ungefähr der Bauabfolge.

### 3.1 Motor (Engine)

| Baustein | Was das ist | Warum es nötig ist |
|---|---|---|
| **Spielschleife mit festem Zeitschritt** | Physik rechnet z.B. 60× pro Sekunde, Zeichnen so oft wie der Bildschirm kann | Ohne das springt der Fuchs auf einem schnellen Laptop anders weit als auf einem langsamen |
| **Canvas-Rendering statt DOM** | Alles wird auf eine `<canvas>`-Fläche gezeichnet | 200 DOM-Elemente pro Bild bringen ein altes Schul-Notebook zum Ruckeln; Canvas schafft tausende |
| **Eingabe-Abstraktion** | Tastatur/Touchpad/Gamepad → einheitliche Aktionen | Grundlage für Weg C oben; auch nötig für Tastenbelegung ändern |
| **Kollision (AABB gegen Tilemap)** | Rechteck-Prüfung Spieler gegen Kachel-Gitter, getrennt für X und Y | Das Herz jedes Plattformers – hier entstehen die meisten Bugs, wenn man es naiv baut |
| **Kamera** | Folgt dem Spieler mit Totzone, Vorausschau, Level-Begrenzung | Eine Kamera, die starr am Spieler klebt, macht Kindern schnell unwohl |
| **Szenen-Verwaltung** | Titel → Level → Pause → Ergebnis → zurück ins Menü | Sonst wird der Code nach dem dritten Level unwartbar |

### 3.2 Spielgefühl ("Game Feel") – das, was billige von guten Plattformern trennt

Das ist der Teil, den man unterschätzt. Ohne ihn fühlt sich selbst ein technisch korrektes Jump-&-Run "falsch" an:

- **Coyote Time** – man darf noch ~100 ms nach der Plattformkante springen
- **Jump Buffering** – Sprungtaste kurz vor der Landung gedrückt = Sprung wird ausgeführt
- **Variable Sprunghöhe** – Taste kurz = kleiner Hopser, Taste halten = hoher Sprung
- **Asymmetrische Gravitation** – Fallen ist schneller als Steigen
- **Beschleunigung/Reibung** statt harter An/Aus-Bewegung
- **Eckenkorrektur** – ein Sprung, der die Kante um 2 Pixel verfehlt, wird sanft korrigiert
- **Landestaub, Sprungquietschen, kurzer Bildschirm-Rüttler** beim Treffer
- **Unverwundbarkeitsblinken** nach einem Treffer

Gerade für 8-/9-Jährige ist das **kein Luxus, sondern Barrierefreiheit** – diese Mechaniken verzeihen die Ungenauigkeit, die in dem Alter normal ist.

### 3.3 Spielinhalt

- **Spielfigur** mit Animationen: Stehen, Laufen, Springen, Fallen, Treffer, Sieg (je 4–8 Einzelbilder)
- **Tileset** (Kachelsatz): Boden, Wände, Ecken, Plattformen, Deko – typisch 16×16 oder 32×32 Pixel
- **Gegner**, jeweils mit eigenem Verhalten: Läufer (dreht an Kanten um), Springer, Flieger auf Sinuskurve, Projektilwerfer
- **Gefahren**: Stacheln, Wasser/Abgrund, bewegliche Plattformen, bröckelnde Blöcke, Federn
- **Sammelobjekte**: Münzen, Schlüssel, Herzen, die drei Sterne pro Level (passt zu deinem bestehenden Sternsystem!)
- **Level-Ende**: Zielfahne 🚩 – hast du schon als Motiv in der Station "Weg finden"
- **Checkpoints** – unbedingt, sonst wird es für die Zielgruppe frustrierend
- **8–15 Levels** in steigender Schwierigkeit, plus ein reines Tutorial-Level ohne Gegner

### 3.4 Arcade-Anstrich

- Punktezähler mit Kombo-Multiplikator und aufsteigenden Zahlen
- Level-Zeit und Highscore (lokal, pro Kind)
- "Attract Mode" – wenn niemand spielt, läuft eine Demo/Titelanimation
- Pixel-Schrift, Scanline-Filter (abschaltbar), CRT-Rahmen
- Chiptune-Musikschleife + knackige Effekte
- "READY?" / "GO!" / "GAME OVER" / "STAGE CLEAR" Einblendungen
- Leben (3 Herzen) – aber mit Kulanz: unendliche Fortsetzungen am Checkpoint

### 3.5 Drumherum

- **Speicherstand** in `localStorage`: Fortschritt, Sterne, Highscores, Einstellungen – bleibt auf dem Gerät
- **Lehrer-Modus**: Levels freischalten, Schwierigkeit senken, Steuerungsprofil wählen, Fortschritt zurücksetzen
- **Barrierefreiheit**: `prefers-reduced-motion` (hast du schon!), abschaltbares Blinken, farbenblind-taugliche Signale, Tastenbelegung frei wählbar, Ein-Tasten-Modus
- **Pausen-Menü** mit ESC
- **Skalierung**: pixelgenaue Ganzzahl-Skalierung auf jede Bildschirmgrösse, Vollbild
- **Verteilung**: weiterhin **eine** HTML-Datei, die du per USB-Stick oder Netzlaufwerk verteilst

---

## 4. Wer macht was: ich, du, oder ein anderes Werkzeug

### 4.1 Das kann ich hier vollständig erledigen

| Bereich | Konkret |
|---|---|
| **Kompletter Spielcode** | Engine, Physik, Kollision, Kamera, Gegner-KI, Szenen, HUD, Menüs, Speicherstand – alles |
| **Game Feel** | Coyote Time, Jump Buffer, Eckenkorrektur usw. – das ist reine Code-Arbeit und ich kenne die Zahlenwerte, die sich gut anfühlen |
| **Level-Format & Levels** | Levels als JSON/Textkarten. Ich kann sowohl das Format bauen als auch spielbare Levels selbst entwerfen |
| **Tiled-Import** | Ein Parser, der Levels aus dem Editor "Tiled" einliest – damit kannst du (oder die Kinder!) später selbst Levels bauen |
| **Grafik, die aus Code entsteht** | Prozedural gezeichnete Kacheln, Farbverläufe, Parallax-Hintergründe, Partikel, SVG-Figuren, sogar Pixel-Art als Zahlenraster im Code. Sieht sauber und stimmig aus – aber nicht wie handgezeichnete Pixelkunst |
| **Kompletter Sound aus Code** | Deine `beep()`-Funktion ist schon der richtige Ansatz. Ich kann daraus einen echten Chiptune-Sequenzer bauen: mehrstimmige Melodie, Bass, Schlagzeug aus Rauschen – **null Audiodateien, null Downloads** |
| **Build-Schritt** | Ein kleines Skript, das aus sauber getrennten Quelldateien wieder **eine** HTML-Datei baut, Grafiken als Base64 eingebettet |
| **Tests** | Automatisierte Browser-Tests (Playwright): Läuft das Spiel? Ist ein Level durchspielbar? Bricht nichts nach einer Änderung? Inklusive Screenshots |
| **Dokumentation** | Lehrer-Anleitung, Level-Design-Anleitung, Code-Kommentare auf Deutsch – wie in deiner jetzigen Datei |

### 4.2 Das kann ich **nicht** – dafür brauchst du ein anderes Werkzeug

| Was fehlt | Warum ich das nicht kann | Werkzeug-Empfehlung (datenschutzfreundlich) |
|---|---|---|
| **Handgezeichnete Pixel-Art-Sprites** (animierter Fuchs, Gegner, Kachelsatz) | Ich schreibe Text und Code, ich male keine Bilddateien. Ich kann geometrisch gezeichnete Figuren bauen, aber kein charmantes handgemachtes Sprite | **Kenney.nl** – riesige fertige Sprite-Pakete, gemeinfrei (CC0), kostenlos herunterladbar, keine Anmeldung. Das ist mit Abstand der schnellste Weg.<br>Selbst zeichnen: **Aseprite** (läuft lokal, ~20 €) oder **LibreSprite** (gratis, lokal) |
| **Level-Layouts zeichnen statt tippen** | Ich kann Levels als Text schreiben, aber visuell zeichnen ist schneller und macht mehr Spass | **Tiled** – der Standard-Level-Editor, gratis, läuft komplett lokal. Ich baue den Importer dafür |
| **Echte Musik als Audiodatei** | Meine Chiptune-Variante klingt nach NES – das ist für Arcade genau richtig, aber es ist keine "richtige" komponierte Musik | Nur falls du mehr willst: **BeepBox** oder **Bosca Ceoil** (beide gratis, lassen sich offline nutzen). *Achtung:* KI-Musikdienste in der Cloud würde ich für eine Schul-App meiden |
| **Spielbalance bestätigen** | Ich kann einschätzen, was funktioniert – ob Level 4 für deine 3. Klasse zu schwer ist, weiss aber nur die Klasse | **Du + die Kinder.** 20 Minuten Spieltest bringen mehr als drei Tage Feintuning |
| **Optische Gesamtwirkung beurteilen** | Ich kann Screenshots machen und prüfen, dass nichts kaputt ist – ob es *hübsch* ist, entscheidest du | Du. Ich liefere, du sagst "dunkler / grösser / langsamer" |

### 4.3 Die Kurzfassung der Arbeitsteilung

> **Ich baue das ganze Spiel. Du besorgst die Bilder (oder sagst "nimm Kenney") und spielst es mit den Kindern.**

Du kannst sogar **komplett ohne externe Grafik starten**: Ich baue Phase 1 mit Platzhalter-Rechtecken bzw. Emoji-Figuren, damit du das Spielgefühl sofort beurteilen kannst. Die schönen Sprites kommen später obendrauf – der Austausch ist dann eine Sache von Minuten, weil die Grafik sauber vom Code getrennt liegt.

---

## 5. Technische Empfehlungen

### Engine: eigener Code statt Framework
Phaser 3 oder Kaplay wären naheliegend, aber sie bringen 1–4 MB Fremdcode mit, den du weder prüfen noch pflegen kannst – und bei einer Schul-App mit Datenschutz-Anspruch ist "ich weiss, was jede Zeile tut" ein echter Wert. Ein 2D-Plattformer-Motor sind rund 1'500 Zeilen. Das ist überschaubar, bleibt lesbar wie deine jetzige Datei, und es gibt keine CDN-Einbindung, die je nach Hause telefoniert.

### Projektstruktur: getrennte Quellen, eine Auslieferungsdatei
Eine einzige 6'000-Zeilen-HTML-Datei wäre nicht mehr zu pflegen. Vorschlag:

```
src/
  engine/     loop.js, input.js, physics.js, camera.js, renderer.js, audio.js
  game/       player.js, enemies.js, pickups.js, hud.js, scenes/
  levels/     level01.json … level12.json
  assets/     tileset.png, sprites.png   (oder prozedural erzeugt)
build.mjs                   → baut alles zu einer Datei
dist/touchpad-abenteuer.html  ← das verteilst du
original/                     ← deine heutige Fassung, bleibt lauffähig
```

Du bekommst weiterhin **eine Datei**, die per Doppelklick läuft. Nur die Werkstatt dahinter ist aufgeräumt.

### Datenschutz – was ich bewusst einhalte
- Keine CDNs, keine Google Fonts, keine externen Schriften, keine Analytics, kein Netzwerkzugriff zur Laufzeit
- Alle Assets liegen in der Datei, nicht irgendwo online
- `localStorage` bleibt auf dem Gerät und enthält nur Fortschrittszahlen – **keine Namen**, ausser du willst ausdrücklich Spielernamen für den Highscore (dann: Vorname oder Kürzel, lokal, löschbar)
- Herkunft und Lizenz jedes fremden Bildes/Klangs wird in einer `CREDITS.md` dokumentiert
- Gedownloadete Asset-Pakete prüfe ich auf Lizenz (CC0 bevorzugt), bevor sie ins Projekt kommen

---

## 6. Der Plan in Phasen

Die Zeitangaben sind ungefähre Arbeitssitzungen mit mir – nicht deine Zeit; deine Zeit ist Rückmeldung geben und testen.

### Phase 0 · Entscheiden (dein Part, ~15 Min)
Steuerungsweg A/B/C · Umfang (wie viele Levels?) · Grafikquelle (Kenney / selbst zeichnen / erst mal Platzhalter) · Verhältnis zu den 8 Stationen (ersetzen, ergänzen, Hub-Welt?)

### Phase 1 · Motor & Spielgefühl — ✅ **erledigt** (`prototyp.html`)
Spielschleife mit festem Zeitschritt, Kachel-Kollision, Einweg-Plattformen, Kamera, alle Game-Feel-Mechaniken, ein Testlevel, Grafik und Ton komplett aus Code.

**Gemessen** (`tools/messen.mjs`, echter Browser):

| | Wert |
|---|---|
| Sprunghöhe, Taste gehalten | 2.93 Kacheln |
| Sprunghöhe, kurz getippt | 1.28 Kacheln |
| Sprungweite bei Volltempo | 3.93 Kacheln |

Daraus die Level-Regeln: **Stufen höchstens 2 Kacheln, Lücken höchstens 3.**
`tools/level-pruefen.mjs` prüft jede Karte per Breitensuche gegen diese
Grenzen – das Testlevel ist damit nachweislich durchspielbar (15 Münzen und
das Ziel sicher erreichbar, keine Warnungen).

**Entschieden:** Steuerung als Hybrid (drei austauschbare Profile), Sterne
aus den Übungsstationen schalten später die Levels frei.

### Phase 2 · Das Spiel drumherum — ✅ **erledigt**
Zwei Gegnertypen (Läufer, der an Kanten und Wänden umdreht; Flieger auf Sinuskurve), Gegner durch Draufspringen besiegen, Stacheln, drei Herzen mit Schonzeit und Rückstoss, Checkpoints, Bonus-Sterne, HUD mit Herzen, Pause, Spielende, Bildschirm-Rüttler.

**Dazugekommen:** der **Doppelklick-Sprung** als Touchpad-Übung – 4.2 statt
2.9 Kacheln. Die Höhe wird aus der noch fehlenden Resthöhe berechnet statt
als fester Impuls, dadurch ist sie unabhängig vom Timing des zweiten Klicks
(gemessen: 4.23 Kacheln nach 80 ms wie nach 260 ms). Nur damit erreicht man
die Bonus-Sterne; das Level bleibt ohne ihn durchspielbar.

**Ergebnis:** Ein durchspielbares Level mit Anfang, Gefahr und Ende –
96 Kacheln breit, 21 Münzen, 2 Bonus-Sterne, 3 Checkpoints, 4 Gegner.
43 Browsertests, alle grün.

### Phase 3 · Inhalt — ✅ **erledigt**
Spritesheet statt gezeichneter Formen (38 Sprites, Autotiling an Kanten), drei Levels mit Schwierigkeitskurve, Levelauswahl, Fortschritt in `localStorage`, Tiled-Austausch in beide Richtungen.

**Nicht wie geplant:** Die Kenney-Sprites liessen sich hier nicht
beschaffen – `kenney.nl` ist durch die Netzwerkrichtlinie der
Entwicklungsumgebung gesperrt, und auf npm liegt nur ein Hexagon-Paket.
Das Spritesheet wird deshalb vorerst von `tools/atlas-bauen.mjs` erzeugt.
Das Sprite-System ist aber so gebaut, dass ein fremdes Sheet nur noch
eingehängt werden muss; `docs/sprites.md` beschreibt die Schritte samt der
Werte für *Pixel Platformer*. Rechnen mit etwa zehn Minuten Handarbeit.

**Ergebnis:** Ein Spiel mit Welt und Fortschritt. 65 Browsertests, alle grün.

### Phase 4 · Arcade-Politur (~1–2 Sitzungen)
Partikel, Bildschirm-Rüttler, Kombo-Punkte, Chiptune-Musik, Titelbildschirm, Attract Mode, CRT-Optik, Übergänge.
**Ergebnis:** Es sieht und klingt nach Spielhalle.

### Phase 5 · Integration & Schule (~1 Sitzung)
Verbindung mit den 8 Touchpad-Stationen (z.B. Sterne aus den Stationen schalten Levels frei – das motiviert zum Üben!), Lehrer-Modus, Barrierefreiheit, Speicherstand, Build zu einer Datei.
**Ergebnis:** Auslieferbar.

### Phase 6 · Test & Feinschliff (laufend)
Browser-Tests, Spieltest mit der Klasse, Balance nachziehen, Lehrer-Anleitung.

---

## 7. Mein Vorschlag für den Einstieg

Nicht alles auf einmal planen, sondern **Phase 1 sofort bauen** – als eigenständige `prototyp.html`, die du doppelklicken und in fünf Minuten beurteilen kannst. Mit Platzhaltergrafik, mit allen drei Steuerungsprofilen zum Ausprobieren, ein Testlevel.

Danach weisst du aus dem Bauch heraus, welcher Steuerungsweg der richtige ist – und diese Antwort ist mehr wert als jede weitere Seite Planung.

---

## 8. Ehrliche Risiken

- **Zwei Spiele in einem Gehäuse.** Wenn das Jump-&-Run auf Tastatur läuft, hat die App kein gemeinsames Lernziel mehr. Weg C entschärft das, löst es aber nicht ganz.
- **Grafik ist der Engpass, nicht der Code.** Der Code entsteht schnell; ein stimmiger Bildstil dauert. Kenney-Pakete umgehen das – dafür sieht es aus wie viele andere Spiele auch.
- **Level-Design ist echte Arbeit.** Ein gutes Level ist 30–60 Minuten Feinarbeit. Zwölf gute Levels sind ein eigenes Teilprojekt. Plane lieber **6 sehr gute** als 12 mittelmässige.
- **Umfangswachstum.** Ein Jump-&-Run lädt dazu ein, immer noch "eine Sache" hinzuzufügen. Hilfreich ist, ab Phase 3 eine Liste "kommt in Version 2" zu führen.
- **Alte Schul-Notebooks.** Canvas ist zwar schnell, aber mit integrierter Grafik von 2015 sollte man früh testen. Ich baue von Anfang an mit niedriger interner Auflösung und Ganzzahl-Skalierung – das ist sowohl arcade-typisch als auch genügsam.

---

## 9. Übersicht auf einen Blick

| | Heute | Ziel |
|---|---|---|
| Darstellung | DOM-Elemente + Emoji | Canvas 2D, Tilemap, Sprites |
| Bewegung | `style.left` + Timer | Physik mit festem Zeitschritt |
| Welt | Ein fester Bildschirm | Scrollende Levels mit Kamera |
| Gegner | Keine | Mehrere Typen mit Verhalten |
| Struktur | 1 Datei, ~900 Zeilen | ~20 Quelldateien → 1 Auslieferungsdatei |
| Ton | Einzelne Pieptöne | Chiptune-Musik + Effekte (weiterhin aus Code) |
| Speichern | Nur im Arbeitsspeicher | `localStorage`, lokal, löschbar |
| Steuerung | Touchpad | Touchpad / Tastatur / Gamepad umschaltbar |
| Offline | ✅ | ✅ (unverändert) |
| Datenschutz | ✅ | ✅ (unverändert) |

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

Drin ist: Laufen und Springen mit Coyote Time, Sprungpuffer und variabler
Sprunghöhe · Gegner (Läufer und Flieger) · Stacheln · drei Herzen mit
Schonzeit nach einem Treffer · Checkpoints · Bonus-Sterne · Pause ·
Spielende mit neuem Versuch.

Drei Steuerungen zum Vergleichen, umschaltbar mit <kbd>1</kbd> <kbd>2</kbd>
<kbd>3</kbd> oder per Knopf:

| Taste | Profil | Bedienung |
|---|---|---|
| 1 | Tastatur | Pfeiltasten oder A/D · Leertaste springen (länger halten = höher) |
| 2 | Touchpad | Zeiger neben den Fuchs bewegen · klicken und halten zum Springen |
| 3 | Gamepad | Steuerkreuz oder Stick · A-Taste springen |

**Der Doppelklick-Sprung** ist die eigentliche Touchpad-Übung: zweimal
schnell klicken (bzw. Leertaste doppelt tippen, am Gamepad B) springt
4.2 statt 2.9 Kacheln hoch. Nur damit erreicht man die lila Bonus-Sterne –
das Level selbst ist aber auch ohne ihn durchspielbar.

<kbd>Esc</kbd> pausiert, <kbd>R</kbd> startet neu, <kbd>M</kbd> schaltet
den Ton um.

## Werkzeuge

Brauchen Node.js und laufen alle lokal:

```
node tools/test.mjs           # 43 Browsertests
node tools/messen.mjs         # misst Sprunghöhe und -weite
node tools/level-pruefen.mjs  # prüft, ob Ziel und Münzen erreichbar sind
node tools/level-bauen.mjs    # erzeugt die Kachelkarte
```

`tools/level-pruefen.mjs` ist der wichtigste davon: er sucht mit einer
Breitensuche alle Standplätze ab und meldet, wenn eine Münze oder das Ziel
nicht erreichbar ist – bevor ein Kind daran verzweifelt. Er prüft zwei
Dinge getrennt: das Level muss **ohne** Doppelklick-Sprung durchspielbar
sein, und die Bonus-Sterne müssen **nur mit** ihm erreichbar sein.

## Nächster Schritt

Siehe `docs/jumprun-plan.md`. Phase 1 und 2 sind gebaut; als Nächstes
kommen richtige Sprites, mehrere Levels und der Tiled-Import.

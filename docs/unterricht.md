# Für die Lehrperson

> **Die vollständige Anleitung ist `dist/anleitung.html`** – eine
> eigenständige, druckbare Seite, die du zusammen mit dem Spiel an andere
> Schulen weitergeben kannst. Dort stehen die acht Stationen im Detail,
> ein Vorschlag für den Lektionsablauf, der Lehrer-Bereich und die
> Problemlösungen.
>
> Diese Datei hier fasst nur das Nötigste für das Repository zusammen.

## Verteilen

Zwei Dateien, beide eigenständig:

| Datei | wofür |
|---|---|
| `dist/touchpad-abenteuer.html` | das Spiel – doppelklicken, fertig |
| `dist/anleitung.html` | die Anleitung – zum Lesen und Ausdrucken |

Beide entstehen mit `node tools/bauen.mjs`.

## Das Wichtigste in Kürze

- **Acht Übungen** zum Touchpad, je drei Level, bis zu drei Sterne.
- **Ab 12 Sternen** öffnet sich das Jump-&-Run *Fuchs-Sprung* mit vier Leveln.
- **Lehrer-Bereich**: Taste <kbd>L</kbd> oder langer Druck auf den Sternezähler.
  Dort: Schwelle ändern, alle Level öffnen, Sterne vergeben, Fortschritt löschen.
- **Drei Steuerungen** (Touchpad, Tastatur, Gamepad) – zum Differenzieren in
  derselben Klasse. Touchpad ist die Standardeinstellung.

## Datenschutz

Die Datei lädt zur Laufzeit **nichts nach** und **sendet nichts** – ein Test
prüft das bei jedem Bauen mit. Gespeichert werden nur Zahlen (Sterne,
erledigte Level, Punktestände), **keine Namen**. Alles liegt im Browser
dieses einen Geräts und lässt sich im Lehrer-Bereich löschen.

## Urheber und Lizenz

Erstellt von **Andreas Bänninger, PICTS BeLoSe**.
Lizenz: **CC BY-SA 4.0** – Weitergabe und Bearbeitung erlaubt unter
Namensnennung und gleichen Bedingungen. Siehe `LICENSE`.

Die Grafik stammt aus dem Paket *Pixel Platformer* von Kenney (kenney.nl,
CC0). Spielfigur, Münzen, Klänge und Musik sind eigens entstanden.

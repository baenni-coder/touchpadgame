/* ============================================================
   BROWSER-TEST
   Fährt den Prototyp einmal durch und prüft, dass alles
   Wesentliche funktioniert. Meldet sich mit Exit-Code 1,
   wenn etwas kaputt ist.

   Aufruf:  node tools/test.mjs
   ============================================================ */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const fehler = [];
page.on('pageerror', e => fehler.push('JS-Fehler: ' + e.message));
page.on('console', m => { if (m.type() === 'error') fehler.push('Konsole: ' + m.text()); });

await page.goto('file://' + process.cwd() + '/prototyp.html');
await page.waitForTimeout(700);

const lies = () => page.evaluate(() => ({
  x: +spieler.x.toFixed(1), y: +spieler.y.toFixed(1),
  amBoden: spieler.amBoden, tot: spieler.tot,
  punkte, gewonnen, anzahlMuenzen: muenzen.length,
}));

let schlecht = 0;
const pruefe = (name, ok, info = '') => {
  console.log((ok ? '✅ ' : '❌ ') + name + (info ? '   ' + info : ''));
  if (!ok) schlecht++;
};

// 1) Startet er und bleibt er auf dem Boden liegen?
const a = await lies();
pruefe('Spiel startet, Fuchs steht am Boden', a.amBoden && !a.tot, `y=${a.y}`);

// 1b) Steht er WIRKLICH ruhig? (fängt den Flacker-Bug in der Bodenprüfung)
const ruhe = await page.evaluate(() => new Promise(res => {
  spieler.x = 22 * TILE; spieler.y = (levelH-2) * TILE - spieler.h;
  spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
  partikel.length = 0;
  let maxStaub = 0, wechsel = 0, vorher = spieler.amBoden;
  const iv = setInterval(() => {
    maxStaub = Math.max(maxStaub, partikel.length);
    if (spieler.amBoden !== vorher) { wechsel++; vorher = spieler.amBoden; }
  }, 8);
  setTimeout(() => { clearInterval(iv); res({ maxStaub, wechsel }); }, 1500);
}));
pruefe('Steht ruhig: kein Flackern zwischen Boden und Luft',
       ruhe.wechsel === 0 && ruhe.maxStaub === 0,
       `${ruhe.wechsel} Wechsel, ${ruhe.maxStaub} Staubteilchen`);

// Dieser Test hat den Fuchs versetzt -> sauberen Zustand wiederherstellen,
// sonst messen die folgenden Tests an der falschen Stelle.
await page.evaluate(() => levelNeu());
await page.waitForTimeout(250);
const a2 = await lies();

// 2) Läuft er auf Tastendruck?
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(900);
await page.keyboard.up('ArrowRight');
const b = await lies();
pruefe('Läuft nach rechts', b.x > a2.x + 40, `${(b.x - a2.x).toFixed(0)} px in 0.9 s`);

// 3) Springt er, und ist der Sprung ungefähr 3 Kacheln hoch?
await page.waitForTimeout(400);
const hoch = await page.evaluate(() => new Promise(res => {
  const y0 = spieler.y; let min = y0;
  const t = setInterval(() => min = Math.min(min, spieler.y), 8);
  dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), 600);
  setTimeout(() => { clearInterval(t); res(+((y0 - min) / TILE).toFixed(2)); }, 1400);
}));
pruefe('Sprunghöhe zwischen 2.5 und 3.5 Kacheln', hoch > 2.5 && hoch < 3.5, hoch + ' Kacheln');

// 4) Variable Sprunghöhe: kurzer Tipp muss deutlich kleiner sein
await page.waitForTimeout(500);
const kurz = await page.evaluate(() => new Promise(res => {
  const y0 = spieler.y; let min = y0;
  const t = setInterval(() => min = Math.min(min, spieler.y), 8);
  dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), 70);
  setTimeout(() => { clearInterval(t); res(+((y0 - min) / TILE).toFixed(2)); }, 1200);
}));
pruefe('Kurzer Tipp springt deutlich niedriger', kurz < hoch * 0.7, kurz + ' statt ' + hoch);

// 5) Coyote Time: kurz nach der Kante darf noch gesprungen werden
const coyote = await page.evaluate(() => new Promise(res => {
  spieler.x = 24 * TILE; spieler.y = (levelH-3) * TILE - spieler.h; spieler.vx = 60; spieler.vy = 0;
  spieler.amBoden = true;
  setTimeout(() => {
    const inDerLuft = !spieler.amBoden;
    dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    setTimeout(() => {
      dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
      res({ inDerLuft, vy: +spieler.vy.toFixed(0) });
    }, 60);
  }, 70);
}));
pruefe('Coyote Time erlaubt den Sprung nach der Kante', coyote.inDerLuft && coyote.vy < -100, `vy=${coyote.vy}`);

// 6) Münze einsammeln
const m = await page.evaluate(() => new Promise(res => {
  const vorher = punkte;
  const muenze = muenzen.find(m => !m.weg && !m.bonus);
  spieler.x = muenze.x - 5; spieler.y = muenze.y - 7; spieler.vx = 0; spieler.vy = 0;
  setTimeout(() => res({ vorher, nachher: punkte }), 150);
}));
pruefe('Münze wird eingesammelt', m.nachher > m.vorher, `${m.vorher} → ${m.nachher}`);

// Bonus-Sterne zählen getrennt von den Münzen
const bm = await page.evaluate(() => new Promise(res => {
  const vorher = { p: punkte, b: boni };
  const stern = muenzen.find(m => !m.weg && m.bonus);
  spieler.x = stern.x - 5; spieler.y = stern.y - 7; spieler.vx = 0; spieler.vy = 0;
  setTimeout(() => res({ vorher, boni, punkte }), 150);
}));
pruefe('Bonus-Stern zählt getrennt von den Münzen',
       bm.boni === bm.vorher.b + 1 && bm.punkte === bm.vorher.p,
       `Münzen ${bm.punkte}, Sterne ${bm.boni}`);

// 7) Sturz in den Abgrund -> kostet ein Herz, Neustart am Checkpoint
const vorSturz = await page.evaluate(() => {
  levelWechseln(1);
  // einen Checkpoint aktivieren und den Fuchs dann abstürzen lassen
  const cp = checkpoints[0];
  cp.aktiv = true; spieler.respawnX = cp.x + 3; spieler.respawnY = cp.y + 2;
  spieler.y = levelH * TILE + 100;
  return { leben: spieler.leben, cpX: cp.x };
});
await page.waitForTimeout(140);
pruefe('Sturz führt zum Tod', (await lies()).tot);
await page.waitForTimeout(1300);
const nachSturz = await page.evaluate(() => ({
  tot: spieler.tot, leben: spieler.leben, x: +spieler.x.toFixed(0), schonzeit: +spieler.schonzeit.toFixed(2),
}));
pruefe('Sturz kostet genau ein Herz',
       nachSturz.leben === vorSturz.leben - 1, `${vorSturz.leben} → ${nachSturz.leben}`);
pruefe('Neustart erfolgt am Checkpoint, nicht am Levelanfang',
       !nachSturz.tot && Math.abs(nachSturz.x - (vorSturz.cpX + 3)) < 3,
       `x=${nachSturz.x}, Checkpoint bei ${vorSturz.cpX}`);
pruefe('Nach dem Neustart gibt es eine kurze Schonzeit', nachSturz.schonzeit > 0);

// 8) Ziel erreichen
await page.evaluate(() => { spieler.x = zielPos.x + 4; spieler.y = zielPos.y + 2; });
await page.waitForTimeout(300);
pruefe('Ziel löst "Geschafft" aus', (await lies()).gewonnen);

// 9) Alle drei Steuerungsprofile lassen sich wählen
for (const id of ['touchpad', 'gamepad', 'tastatur']) {
  await page.click(`.pbtn[data-id="${id}"]`);
  const p = await page.evaluate(() => profil);
  pruefe('Profil umschaltbar: ' + id, p === id);
}

// 10) Touchpad: der Fuchs läuft dorthin, wo der Zeiger ist
await page.click('.pbtn[data-id="touchpad"]');

// Den Fuchs in die Levelmitte stellen, damit links UND rechts von ihm
// genug Bildfläche bleibt – sonst landet der Zeiger neben dem Canvas.
const messeTouchpad = async (versatz) => {
  const b = await page.evaluate(() => {
    spieler.x = 22 * TILE; spieler.y = (levelH-3) * TILE - spieler.h;
    spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
    kameraSetzen(true);
    const r = document.getElementById('cv').getBoundingClientRect();
    return { rx: r.x, ry: r.y, rw: r.width, rh: r.height, iw: cv.width,
             fuchs: spieler.x + spieler.b / 2 - kamera.x };
  });
  const ziel = b.fuchs + versatz;
  await page.mouse.move(b.rx + ziel / b.iw * b.rw, b.ry + b.rh / 2);
  await page.waitForTimeout(90);
  return page.evaluate(() => +eingabe.x.toFixed(2));
};

const rechts = await messeTouchpad(60);
pruefe('Touchpad: Zeiger rechts -> läuft rechts', rechts > 0, 'eingabe.x = ' + rechts);

const links = await messeTouchpad(-60);
pruefe('Touchpad: Zeiger links -> läuft links', links < 0, 'eingabe.x = ' + links);

const still = await messeTouchpad(0);
pruefe('Touchpad: Zeiger auf dem Fuchs -> steht still (Totzone)', still === 0, 'eingabe.x = ' + still);

// 11) Der gemeldete Fehler: am Levelende klemmt die Kamera, der Fuchs läuft
//     dem Zeiger entgegen – er darf trotzdem nicht stehen bleiben.
const amEnde = async (zeigerVersatz) => {
  const b = await page.evaluate(() => {
    spieler.x = (levelB - 6) * TILE; spieler.y = (levelH-2) * TILE - spieler.h;
    spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
    kameraSetzen(true);
    const r = document.getElementById('cv').getBoundingClientRect();
    const maxK = levelB * TILE - cv.width;
    return { rx: r.x, ry: r.y, rw: r.width, rh: r.height, iw: cv.width,
             fuchs: spieler.x + spieler.b / 2 - kamera.x,
             geklemmt: kamera.x >= maxK - 0.5 };
  });
  await page.mouse.move(b.rx + (b.fuchs + zeigerVersatz) / b.iw * b.rw, b.ry + b.rh / 2);
  await page.waitForTimeout(90);
  const x = await page.evaluate(() => +eingabe.x.toFixed(2));
  return { ...b, eingabeX: x };
};

const e1 = await amEnde(40);
pruefe('Levelende: Kamera klemmt dort tatsächlich', e1.geklemmt);
pruefe('Levelende: Zeiger rechts vom Fuchs -> läuft weiter', e1.eingabeX > 0, 'eingabe.x = ' + e1.eingabeX);

// Zeiger an den äussersten Bildrand: Randzone muss greifen
const e2 = await amEnde(400);   // weit rechts, landet ausserhalb -> wird geklemmt
pruefe('Levelende: Zeiger über den Rand hinaus -> läuft trotzdem weiter',
       e2.eingabeX > 0, 'eingabe.x = ' + e2.eingabeX);

// Zeiger oben auf den Knöpfen: Steuerung soll ruhen, nicht weiterlaufen
const oben = await page.evaluate(async () => {
  spieler.x = 22 * TILE; spieler.y = (levelH-2) * TILE - spieler.h; spieler.vx = 0; kameraSetzen(true);
  return document.getElementById('cv').getBoundingClientRect().y;
});
await page.mouse.move(640, Math.max(2, oben - 60));
await page.waitForTimeout(90);
const ruhig = await page.evaluate(() => ({ x: +eingabe.x.toFixed(2), imBild: maus.imBild }));
pruefe('Zeiger weit über dem Spielfeld -> Steuerung ruht', ruhig.x === 0 && !ruhig.imBild,
       'eingabe.x = ' + ruhig.x);

// 12) Doppelklick-Sprung: höher als normal UND verlässlich gleich hoch
await page.click('.pbtn[data-id="tastatur"]');
const messeSprung = (extraNachMs) => page.evaluate(({ ms }) => new Promise(res => {
  levelNeu();
  setTimeout(() => {
    spieler.x = 8 * TILE; spieler.y = (levelH-2) * TILE - spieler.h;
    spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
    const y0 = spieler.y; let min = y0;
    const t = setInterval(() => min = Math.min(min, spieler.y), 8);
    dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), 40);
    if (ms !== null) {
      setTimeout(() => dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })), ms);
      setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), ms + 40);
    }
    setTimeout(() => { clearInterval(t); res(+((y0 - min) / TILE).toFixed(2)); }, 1600);
  }, 250);
}), { ms: extraNachMs });

const normal = await messeSprung(null);
const doppel80 = await messeSprung(80);
const doppel260 = await messeSprung(260);
pruefe('Doppeltipp springt deutlich höher als ein einzelner Sprung',
       doppel80 > normal + 0.8, `${normal} -> ${doppel80} Kacheln`);
pruefe('Doppeltipp-Höhe hängt nicht vom Timing ab',
       Math.abs(doppel80 - doppel260) < 0.35, `nach 80 ms: ${doppel80} · nach 260 ms: ${doppel260}`);
pruefe('Doppeltipp erreicht die eingestellte Höhe (~4.4 Kacheln)',
       doppel80 > 4.0 && doppel80 < 4.8, doppel80 + ' Kacheln');

// Ein langsamer zweiter Tipp (ausserhalb des Zeitfensters) ist KEIN Doppeltipp
const zuSpaet = await messeSprung(900);
pruefe('Zu langsamer zweiter Tipp löst keinen Extrasprung aus',
       zuSpaet < normal + 0.5, zuSpaet + ' Kacheln');

// ============ Phase 2: Gegner, Gefahren, Leben ============
// Level 1 ist das Tutorial – dort gibt es bewusst weder Gegner noch
// Stacheln. Diese Tests laufen deshalb auf Level 2.
await page.click('.pbtn[data-id="tastatur"]');
await page.evaluate(() => levelWechseln(1));
await page.waitForTimeout(250);

// 13) Von oben auf einen Gegner springen -> Gegner platt, Fuchs prallt ab
const platt = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    const g = gegner.find(g => g.art === 'laeufer');
    g.x = 5 * TILE; g.y = (levelH-2) * TILE - g.h; g.vx = 0;   // flacher Boden, stillgestellt
    spieler.x = g.x; spieler.y = g.y - 13;         // direkt darüber
    spieler.vx = 0; spieler.vy = 120;              // im Fallen
    const leben0 = spieler.leben;
    setTimeout(() => res({ gegnerTot: g.tot, vy: +spieler.vy.toFixed(0),
                           leben0, leben: spieler.leben }), 120);
  }, 250);
}));
pruefe('Von oben draufspringen erledigt den Gegner', platt.gegnerTot);
pruefe('Danach prallt der Fuchs nach oben ab', platt.vy < -80, 'vy = ' + platt.vy);
pruefe('Draufspringen kostet kein Herz', platt.leben === platt.leben0);

// 14) Seitlich in einen Gegner laufen -> ein Herz weg, Schonzeit, Rückstoss
//     Gegner und Fuchs auf eine ruhige, flache Bodenstelle setzen: auf einer
//     schmalen Stufe wandert der Gegner weg und die beiden verfehlen sich.
const seitlich = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    const g = gegner.find(g => g.art === 'laeufer');
    g.x = 5 * TILE; g.y = (levelH-2) * TILE - g.h; g.vx = 0;     // flacher Boden, Abschnitt A
    spieler.x = g.x - 4; spieler.y = g.y;            // überlappt sicher um 6 px
    spieler.vx = 0; spieler.vy = 0;
    const leben0 = spieler.leben;
    const ueberlappt = spieler.x < g.x+g.b && spieler.x+spieler.b > g.x &&
                       spieler.y < g.y+g.h && spieler.y+spieler.h > g.y;
    setTimeout(() => res({ leben0, leben: spieler.leben, ueberlappt,
                           schonzeit: +spieler.schonzeit.toFixed(2),
                           vx: +spieler.vx.toFixed(0), gegnerTot: g.tot }), 120);
  }, 250);
}));
pruefe('Testaufbau: Fuchs und Gegner überlappen wirklich', seitlich.ueberlappt);
pruefe('Seitliche Berührung kostet ein Herz',
       seitlich.leben === seitlich.leben0 - 1, `${seitlich.leben0} → ${seitlich.leben}`);
pruefe('Der Gegner überlebt die seitliche Berührung', !seitlich.gegnerTot);
pruefe('Nach dem Treffer gibt es eine Schonzeit', seitlich.schonzeit > 0.5, seitlich.schonzeit + ' s');
pruefe('Der Treffer stösst den Fuchs weg', seitlich.vx < 0, 'vx = ' + seitlich.vx);

// 15) Die Schonzeit verhindert, dass man sofort noch ein Herz verliert
const doppelt = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    const g = gegner.find(g => g.art === 'laeufer');
    g.x = 5 * TILE; g.y = (levelH-2) * TILE - g.h; g.vx = 0;
    const treffen = () => { spieler.x = g.x; spieler.y = g.y; spieler.vx = 0; spieler.vy = 0; };
    treffen();
    setTimeout(() => { treffen(); }, 60);      // sofort noch einmal hineinlaufen
    setTimeout(() => res({ leben: spieler.leben }), 200);
  }, 250);
}));
pruefe('Zwei Berührungen in Folge kosten nur ein Herz',
       doppelt.leben === 2, 'Herzen übrig: ' + doppelt.leben);

// 16) Stacheln kosten ein Herz
const stachel = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    let ziel = null;
    for (let r = 0; r < levelH && !ziel; r++)
      for (let c = 0; c < levelB; c++)
        if (karte[r][c] === '^') { ziel = { r, c }; break; }
    spieler.x = ziel.c * TILE + 3; spieler.y = ziel.r * TILE + 2;
    spieler.vx = 0; spieler.vy = 0;
    const leben0 = spieler.leben;
    setTimeout(() => res({ leben0, leben: spieler.leben, gefunden: !!ziel }), 130);
  }, 250);
}));
pruefe('Stacheln kosten ein Herz',
       stachel.gefunden && stachel.leben === stachel.leben0 - 1,
       `${stachel.leben0} → ${stachel.leben}`);

// 17) Langzeitlauf: Gegner müssen sich dauerhaft vernünftig verhalten
const dauer = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    const start = gegner.map(g => ({ art: g.art, y: g.y }));
    const anfangs = gegner.length;
    let steckt = 0, raus = 0;
    const iv = setInterval(() => {
      gegner.forEach(g => {
        if (g.x < -20 || g.x > levelB*TILE + 20 || g.y > levelH*TILE + 20) raus++;
        // in einer Wand steckengeblieben?
        const c = Math.floor((g.x + g.b/2)/TILE), r = Math.floor((g.y + g.h/2)/TILE);
        if (karte[r] && karte[r][c] === '#') steckt++;
      });
    }, 50);
    setTimeout(() => {
      clearInterval(iv);
      const gefallen = gegner.filter((g, i) =>
        g.art === 'laeufer' && start[i] && g.y > start[i].y + 40).length;
      res({ gefallen, anfangs, jetzt: gegner.length, steckt, raus });
    }, 8000);
  }, 250);
}));
pruefe('Kein Läufer fällt in einen Abgrund',
       dauer.gefallen === 0, `${dauer.gefallen} von ${dauer.anfangs}`);
pruefe('Nach 8 Sekunden sind alle Gegner noch da',
       dauer.jetzt === dauer.anfangs, `${dauer.anfangs} → ${dauer.jetzt}`);
pruefe('Kein Gegner verlässt das Level', dauer.raus === 0, dauer.raus + ' Ausreisser');
pruefe('Kein Gegner bleibt in einer Wand stecken', dauer.steckt === 0, dauer.steckt + ' Messungen in der Wand');

// 18) Alle Herzen weg -> Game Over
const ende = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    spieler.leben = 1;
    spieler.schonzeit = 0;
    treffer(spieler.x + 40);                   // letzter Treffer
    setTimeout(() => res({ gameOver, leben: spieler.leben }), 120);
  }, 250);
}));
pruefe('Ohne Herzen ist das Spiel zu Ende', ende.gameOver && ende.leben === 0);

// Und ein neuer Versuch lässt sich starten
await page.keyboard.press(' ');
await page.waitForTimeout(250);
const neu2 = await page.evaluate(() => ({ gameOver, leben: spieler.leben }));
pruefe('Leertaste startet einen neuen Versuch',
       !neu2.gameOver && neu2.leben === 3, 'Herzen: ' + neu2.leben);

// 19) Pause hält das Spiel wirklich an
const angehalten = await page.evaluate(() => new Promise(res => {
  levelWechseln(1);
  setTimeout(() => {
    spieler.x = 8 * TILE; spieler.y = (levelH-2) * TILE - spieler.h; spieler.vx = 60;
    pause = true;
    const x0 = spieler.x, z0 = zeit;
    setTimeout(() => res({ bewegt: Math.abs(spieler.x - x0), zeitLief: zeit - z0 }), 500);
  }, 250);
}));
pruefe('In der Pause bewegt sich nichts mehr',
       angehalten.bewegt < 0.5 && angehalten.zeitLief < 0.01,
       `${angehalten.bewegt.toFixed(1)} px bewegt`);
await page.evaluate(() => { pause = false; });

// ============ Phase 3: Levels und Fortschritt ============

// 20) Alle Levels lassen sich laden und haben Start, Ziel und Karte
const levels = await page.evaluate(() => {
  const raus = [];
  for(let i=0;i<LEVELS.length;i++){
    levelWechseln(i);
    raus.push({ nr:i, name:LEVELS[i].name, breite:levelB, hoehe:levelH,
                muenzen:muenzen.length, gegner:gegner.length,
                checkpoints:checkpoints.length,
                startX:startPos.x, zielX:zielPos.x });
  }
  levelWechseln(0);
  return raus;
});
pruefe('Alle drei Levels laden', levels.length === 3, levels.map(l=>l.name).join(', '));
levels.forEach(l => pruefe(`Level ${l.nr+1} hat Start, Ziel und Inhalt`,
  l.zielX > l.startX && l.muenzen > 0 && l.breite > 20,
  `${l.breite} Kacheln, ${l.muenzen} Sammelobjekte, ${l.gegner} Gegner`));
pruefe('Level 1 ist ein Tutorial ohne Gegner', levels[0].gegner === 0);
pruefe('Die späteren Levels haben Gegner', levels[1].gegner > 0 && levels[2].gegner > 0);

// 21) Fortschritt wird gespeichert und übersteht einen Neuladen
await page.evaluate(() => {
  localStorage.removeItem('fuchssprung');
  fortschritt = { frei:0, best:{} };
  levelWechseln(0);
});
const vorher = await page.evaluate(() => ({ frei: fortschritt.frei }));
pruefe('Zu Beginn ist nur Level 1 frei', vorher.frei === 0);

// Level 1 gewinnen
await page.evaluate(() => new Promise(res => {
  spieler.x = zielPos.x + 4; spieler.y = zielPos.y + 2;
  setTimeout(res, 250);
}));
const nachSieg = await page.evaluate(() => ({
  gewonnen, frei: fortschritt.frei, best: fortschritt.best[0],
  gespeichert: localStorage.getItem('fuchssprung'),
}));
pruefe('Ziel schaltet das nächste Level frei', nachSieg.gewonnen && nachSieg.frei === 1,
       'frei bis Level ' + (nachSieg.frei+1));
pruefe('Der Bestwert wird gemerkt', !!nachSieg.best && nachSieg.best.zeit !== null,
       JSON.stringify(nachSieg.best));
pruefe('Der Fortschritt landet im Speicher des Geräts', !!nachSieg.gespeichert);

// Leertaste führt zum nächsten Level
await page.keyboard.press(' ');
await page.waitForTimeout(300);
const weiter = await page.evaluate(() => ({ nr: levelNr, gewonnen }));
pruefe('Leertaste führt ins nächste Level', weiter.nr === 1 && !weiter.gewonnen,
       'jetzt Level ' + (weiter.nr+1));

// Nach dem Neuladen ist der Fortschritt noch da
await page.reload();
await page.waitForTimeout(700);
const nachReload = await page.evaluate(() => ({ frei: fortschritt.frei, best: fortschritt.best[0] }));
pruefe('Fortschritt übersteht das Neuladen',
       nachReload.frei === 1 && !!nachReload.best, 'frei bis Level ' + (nachReload.frei+1));

// 22) Gesperrte Levels sind nicht anklickbar
const knoepfe = await page.evaluate(() =>
  [...document.querySelectorAll('#levels .pbtn')].map(b => ({
    zu: b.classList.contains('zu'), text: b.textContent })));
pruefe('Für jedes Level gibt es einen Knopf', knoepfe.length === 3);
pruefe('Level 3 ist noch gesperrt', knoepfe[2].zu === true);
pruefe('Die freigeschalteten Levels sind offen', !knoepfe[0].zu && !knoepfe[1].zu);

// Aufräumen, damit der nächste Lauf sauber startet
await page.evaluate(() => { try{ localStorage.removeItem('fuchssprung'); }catch(e){} });

pruefe('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
console.log(schlecht ? `\n${schlecht} Test(s) fehlgeschlagen.` : '\nAlle Tests bestanden.');
process.exit(schlecht ? 1 : 0);

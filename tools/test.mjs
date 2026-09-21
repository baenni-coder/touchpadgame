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
  spieler.x = 22 * 16; spieler.y = 12 * 16 - 14;
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
  setTimeout(() => { clearInterval(t); res(+((y0 - min) / 16).toFixed(2)); }, 1400);
}));
pruefe('Sprunghöhe zwischen 2.5 und 3.5 Kacheln', hoch > 2.5 && hoch < 3.5, hoch + ' Kacheln');

// 4) Variable Sprunghöhe: kurzer Tipp muss deutlich kleiner sein
await page.waitForTimeout(500);
const kurz = await page.evaluate(() => new Promise(res => {
  const y0 = spieler.y; let min = y0;
  const t = setInterval(() => min = Math.min(min, spieler.y), 8);
  dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
  setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), 70);
  setTimeout(() => { clearInterval(t); res(+((y0 - min) / 16).toFixed(2)); }, 1200);
}));
pruefe('Kurzer Tipp springt deutlich niedriger', kurz < hoch * 0.7, kurz + ' statt ' + hoch);

// 5) Coyote Time: kurz nach der Kante darf noch gesprungen werden
const coyote = await page.evaluate(() => new Promise(res => {
  spieler.x = 24 * 16; spieler.y = 11 * 16 - 14; spieler.vx = 60; spieler.vy = 0;
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
  const muenze = muenzen.find(m => !m.weg);
  spieler.x = muenze.x - 5; spieler.y = muenze.y - 7; spieler.vx = 0; spieler.vy = 0;
  setTimeout(() => res({ vorher, nachher: punkte }), 150);
}));
pruefe('Münze wird eingesammelt', m.nachher > m.vorher, `${m.vorher} → ${m.nachher}`);

// 7) Sturz in den Abgrund -> Tod -> Neustart
await page.evaluate(() => { spieler.y = levelH * 16 + 100; });
await page.waitForTimeout(120);
pruefe('Sturz führt zum Neustart', (await lies()).tot);
await page.waitForTimeout(1300);
const nach = await lies();
pruefe('Nach dem Neustart steht er wieder am Start', !nach.tot && nach.amBoden && nach.punkte === 0);

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
    spieler.x = 22 * 16; spieler.y = 11 * 16 - 14;
    spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
    kameraSetzen(true);
    const r = document.getElementById('cv').getBoundingClientRect();
    return { rx: r.x, ry: r.y, rw: r.width, rh: r.height,
             fuchs: spieler.x + spieler.b / 2 - kamera.x };
  });
  const ziel = b.fuchs + versatz;
  await page.mouse.move(b.rx + ziel / 320 * b.rw, b.ry + b.rh / 2);
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
    spieler.x = 66 * 16; spieler.y = 12 * 16 - 14;
    spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
    kameraSetzen(true);
    const r = document.getElementById('cv').getBoundingClientRect();
    const maxK = levelB * 16 - 320;
    return { rx: r.x, ry: r.y, rw: r.width, rh: r.height,
             fuchs: spieler.x + spieler.b / 2 - kamera.x,
             geklemmt: kamera.x >= maxK - 0.5 };
  });
  await page.mouse.move(b.rx + (b.fuchs + zeigerVersatz) / 320 * b.rw, b.ry + b.rh / 2);
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
  spieler.x = 22 * 16; spieler.y = 12 * 16 - 14; spieler.vx = 0; kameraSetzen(true);
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
    spieler.x = 8 * 16; spieler.y = 12 * 16 - 14;
    spieler.vx = 0; spieler.vy = 0; spieler.amBoden = true;
    const y0 = spieler.y; let min = y0;
    const t = setInterval(() => min = Math.min(min, spieler.y), 8);
    dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), 40);
    if (ms !== null) {
      setTimeout(() => dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })), ms);
      setTimeout(() => dispatchEvent(new KeyboardEvent('keyup', { key: ' ' })), ms + 40);
    }
    setTimeout(() => { clearInterval(t); res(+((y0 - min) / 16).toFixed(2)); }, 1600);
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

pruefe('Keine JavaScript-Fehler', fehler.length === 0, fehler.join(' | '));

await browser.close();
console.log(schlecht ? `\n${schlecht} Test(s) fehlgeschlagen.` : '\nAlle Tests bestanden.');
process.exit(schlecht ? 1 : 0);

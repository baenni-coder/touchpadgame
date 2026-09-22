/* ============================================================
   TEST DER AUSLIEFERUNGSDATEI
   Prüft dist/touchpad-abenteuer.html – also das, was wirklich
   an die Klasse geht. Der eigentliche Zweck: dass die beiden
   zusammengebauten Teile sich nicht gegenseitig stören.

   Aufruf:  node tools/test-dist.mjs
   ============================================================ */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{ width:1280, height:820 } });
const fehler = [];
page.on('pageerror', e => fehler.push('JS-Fehler: ' + e.message));
page.on('console', m => { if (m.type() === 'error') fehler.push('Konsole: ' + m.text()); });
// Nichts darf nachgeladen werden – die Datei muss für sich allein laufen
const netz = [];
page.on('request', r => { if(!r.url().startsWith('file://') && !r.url().startsWith('data:')) netz.push(r.url()); });

let schlecht = 0;
const pruefe = (name, ok, info='') => {
  console.log((ok ? '✅ ' : '❌ ') + name + (info ? '   ' + info : ''));
  if(!ok) schlecht++;
};

await page.goto('file://' + process.cwd() + '/dist/touchpad-abenteuer.html');
await page.waitForTimeout(900);

// 1) Beide Teile sind da, die Karte ist sichtbar
const start = await page.evaluate(() => ({
  stationen: !document.getElementById('teil-stationen').hidden,
  sprung: !document.getElementById('teil-sprung').hidden,
  kacheln: document.querySelectorAll('#teil-stationen .station').length,
  bruecke: typeof window.BRUECKE === 'object',
}));
pruefe('Die Brücke ist vorhanden', start.bruecke);
pruefe('Das Spiel startet auf der Stationskarte', start.stationen && !start.sprung);
pruefe('Alle acht Übungen plus Fuchs-Sprung sind da', start.kacheln === 9, start.kacheln + ' Kacheln');

// 2) Die Fuchs-Sprung-Kachel ist anfangs gesperrt
const gesperrt = await page.evaluate(() => {
  const k = document.querySelectorAll('#teil-stationen .station')[8];
  return { text: k.textContent, schloss: k.textContent.includes('🔒') };
});
pruefe('Fuchs-Sprung ist ohne Sterne noch zu', gesperrt.schloss);

// Klick darauf darf nichts kaputt machen
await page.evaluate(() => document.querySelectorAll('#teil-stationen .station')[8].click());
await page.waitForTimeout(200);
pruefe('Ein Klick auf die gesperrte Kachel wechselt nicht',
       await page.evaluate(() => !document.getElementById('teil-sprung').hidden) === false);

// 3) Genug Sterne schalten frei
// Über den Lehrer-Weg Sterne vergeben – so, wie es auch im Unterricht ginge
await page.evaluate(() => { BRUECKE.sterneSetzen(12); });
await page.evaluate(() => BRUECKE.zurKarte());
await page.waitForTimeout(250);
const offen = await page.evaluate(() => {
  const k = document.querySelectorAll('#teil-stationen .station')[8];
  return { text: k.textContent, offen: k.textContent.includes('Spielen') };
});
pruefe('Mit genug Sternen öffnet sich der Fuchs-Sprung', offen.offen, offen.text.trim().slice(0,60));

// 4) Hin und zurück wechseln
await page.evaluate(() => document.querySelectorAll('#teil-stationen .station')[8].click());
await page.waitForTimeout(600);
const imSpiel = await page.evaluate(() => ({
  sprung: !document.getElementById('teil-sprung').hidden,
  stationen: !document.getElementById('teil-stationen').hidden,
  knopf: !!document.getElementById('kartenKnopf') &&
         document.getElementById('kartenKnopf').style.display !== 'none',
}));
pruefe('Die Kachel führt ins Jump-&-Run', imSpiel.sprung && !imSpiel.stationen);
pruefe('Im Spiel gibt es einen Weg zurück zur Karte', imSpiel.knopf);

await page.click('#kartenKnopf');
await page.waitForTimeout(400);
pruefe('Der Karten-Knopf führt zurück',
       await page.evaluate(() => !document.getElementById('teil-stationen').hidden));

// 5) Eine Übung spielen und dabei Sterne sammeln
const uebung = await page.evaluate(() => new Promise(res => {
  document.querySelectorAll('#teil-stationen .station')[0].click();   // Sterne sammeln
  setTimeout(() => {
    const sterne = document.querySelectorAll('#teil-stationen .star');
    // alle Sterne "berühren"
    sterne.forEach(s => s.dispatchEvent(new PointerEvent('pointerenter', { bubbles:true })));
    setTimeout(() => res({
      angezeigt: document.getElementById('totalStars').textContent,
      overlay: document.getElementById('overlay').classList.contains('show'),
    }), 400);
  }, 400);
}));
pruefe('Eine Übung lässt sich spielen und schliesst ab', uebung.overlay,
       'Sterne angezeigt: ' + uebung.angezeigt);

// 6) Der gemeinsame Speicherstand übersteht das Neuladen
const vorReload = await page.evaluate(() => {
  const roh = localStorage.getItem('touchpad-abenteuer');
  return roh ? JSON.parse(roh) : null;
});
pruefe('Der Fortschritt wird gespeichert', !!vorReload && vorReload.sterne > 0,
       vorReload ? vorReload.sterne + ' Sterne' : 'nichts gespeichert');
await page.reload();
await page.waitForTimeout(900);
const nachReload = await page.evaluate(() => ({
  angezeigt: document.getElementById('totalStars').textContent,
  kachelOffen: document.querySelectorAll('#teil-stationen .station')[8].textContent.includes('Spielen'),
}));
pruefe('Nach dem Neuladen sind die Sterne noch da',
       +nachReload.angezeigt > 0, nachReload.angezeigt + ' Sterne');
pruefe('Die Freischaltung übersteht das Neuladen', nachReload.kachelOffen);

// 7) Lehrer-Bereich
await page.keyboard.press('l');
await page.waitForTimeout(300);
const lehrer = await page.evaluate(() => {
  const k = document.querySelector('.lehrer-hg');
  return { offen: !!k, knoepfe: k ? k.querySelectorAll('button').length : 0 };
});
pruefe('Die Taste L öffnet den Lehrer-Bereich', lehrer.offen, lehrer.knoepfe + ' Knöpfe');

await page.evaluate(() => document.querySelector('[data-tu="sterne10"]').click());
await page.waitForTimeout(200);
const mehrSterne = await page.evaluate(() => document.getElementById('totalStars').textContent);
pruefe('Die Lehrperson kann Sterne vergeben', +mehrSterne > +nachReload.angezeigt,
       nachReload.angezeigt + ' → ' + mehrSterne);

await page.evaluate(() => document.querySelector('[data-tu="zu"]').click());
await page.waitForTimeout(200);
pruefe('Der Lehrer-Bereich lässt sich schliessen',
       await page.evaluate(() => !document.querySelector('.lehrer-hg')));

// 7b) Die Stationskarte muss scrollbar sein – sonst sind die unteren
//     Kacheln auf kleinen Bildschirmen schlicht nicht erreichbar.
await page.setViewportSize({ width: 1100, height: 600 });
await page.waitForTimeout(400);
const karte = await page.evaluate(() => {
  const d = document.documentElement;
  const kacheln = document.querySelectorAll('#teil-stationen .station');
  const letzte = kacheln[kacheln.length-1];
  return {
    dokHoehe: d.scrollHeight, fenster: innerHeight,
    scrollbar: d.scrollHeight > innerHeight + 4,
    bodyOverflowY: getComputedStyle(document.body).overflowY,
    letzteUnten: Math.round(letzte.getBoundingClientRect().bottom),
  };
});
pruefe('Die Karte ist höher als der Bildschirm', karte.dokHoehe > karte.fenster,
       `${karte.dokHoehe} px Inhalt bei ${karte.fenster} px Fenster`);
pruefe('Die Karte lässt sich scrollen', karte.scrollbar && karte.bodyOverflowY !== 'hidden',
       'overflow-y: ' + karte.bodyOverflowY);

await page.evaluate(() => window.scrollTo(0, 9999));
await page.waitForTimeout(300);
const gescrollt = await page.evaluate(() => {
  const kacheln = document.querySelectorAll('#teil-stationen .station');
  const letzte = kacheln[kacheln.length-1].getBoundingClientRect();
  return { y: window.scrollY, sichtbar: letzte.bottom <= innerHeight + 2 && letzte.top >= -2 };
});
pruefe('Nach unten gescrollt ist die letzte Kachel ganz sichtbar',
       gescrollt.y > 0 && gescrollt.sichtbar, 'scrollY = ' + gescrollt.y);
await page.setViewportSize({ width: 1280, height: 820 });
await page.evaluate(() => window.scrollTo(0,0));
await page.waitForTimeout(300);

// 8) Kein Nachladen aus dem Netz
pruefe('Die Datei lädt nichts nach', netz.length === 0,
       netz.length ? netz.slice(0,3).join(', ') : 'keine externen Anfragen');
pruefe('Keine JavaScript-Fehler', fehler.length === 0, fehler.slice(0,2).join(' | '));

await browser.close();
console.log(schlecht ? `\n${schlecht} Test(s) fehlgeschlagen.` : '\nAlle Tests bestanden.');
process.exit(schlecht ? 1 : 0);

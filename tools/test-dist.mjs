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

// 7c) Urheberangabe und Lizenz müssen in der Datei stehen – sie wird
//     an andere Schulen weitergegeben.
const nennung = await page.evaluate(() => {
  const fuss = document.querySelector('#teil-stationen .foot');
  return {
    fusszeile: fuss ? fuss.textContent : '',
    imQuelltext: document.documentElement.outerHTML.includes('PICTS BeLoSe'),
  };
});
pruefe('Die Stationskarte nennt den Urheber',
       nennung.fusszeile.includes('Andreas Bänninger'), nennung.fusszeile.trim().slice(0,70));
pruefe('Die Lizenz steht dabei', nennung.fusszeile.includes('CC BY-SA'));

// Auch im Lehrer-Bereich
await page.keyboard.press('l');
await page.waitForTimeout(300);
const imLehrer = await page.evaluate(() => {
  const k = document.querySelector('.lehrer-hg');
  const t = k ? k.textContent : '';
  return { urheber: t.includes('Andreas Bänninger'), lizenz: t.includes('BY-SA'),
           kenney: t.includes('Kenney') };
});
pruefe('Der Lehrer-Bereich nennt Urheber und Lizenz',
       imLehrer.urheber && imLehrer.lizenz);
pruefe('Die Herkunft der Grafik ist genannt', imLehrer.kenney);
await page.evaluate(() => document.querySelector('[data-tu="zu"]').click());
await page.waitForTimeout(200);

// Keine Kontaktadresse in der Datei – so war es gewünscht
const keineAdresse = await page.evaluate(() =>
  !/[\w.]+@[\w.]+\.\w+/.test(document.documentElement.outerHTML));
pruefe('Keine E-Mail-Adresse in der Spieldatei', keineAdresse);

// 8) Der Ton-Schalter
//     Gemeldet war: der Knopf wechselt auf durchgestrichen, die Musik
//     läuft aber weiter. Gezählt wird, was der Browser wirklich an
//     Tönen einplant – die Knopfbeschriftung allein sagt zu wenig.
const toeneZaehlen = (ms=1100) => page.evaluate(ms => new Promise(fertig => {
  let z = 0;
  const proto = (window.AudioContext || window.webkitAudioContext).prototype;
  const oszAlt = proto.createOscillator, pufAlt = proto.createBufferSource;
  proto.createOscillator  = function(){ z++; return oszAlt.call(this); };
  proto.createBufferSource = function(){ z++; return pufAlt.call(this); };
  setTimeout(() => {
    proto.createOscillator = oszAlt; proto.createBufferSource = pufAlt;
    fertig(z);
  }, ms);
}), ms);
const echtKlicken = async (i) => {
  const r = await page.locator('#teil-sprung .sbtn').nth(i).boundingBox();
  await page.mouse.click(r.x + r.width/2, r.y + r.height/2);
};
const tonKnopf  = () => echtKlicken(0);
const tonZeigt  = () => page.evaluate(() => {
  const b = document.querySelectorAll('#teil-sprung .sbtn')[0];
  return { aus: b.classList.contains('aus'), zeichen: b.textContent };
});
const insSpiel = async () => {
  await page.evaluate(() => { BRUECKE.sterneSetzen(14); BRUECKE.zumSprung(); });
  await page.waitForTimeout(400);
  await page.mouse.click(640, 400);          // gibt den Ton frei
  await page.waitForTimeout(600);
};

await insSpiel();
const tonAnfang = await toeneZaehlen();
pruefe('Mit Ton an spielt die Musik', tonAnfang > 0, tonAnfang + ' Töne');

await tonKnopf();
await page.waitForTimeout(200);
const nachAus = await toeneZaehlen();
const zeichenAus = await tonZeigt();
pruefe('Der Knopf zeigt "aus"', zeichenAus.aus, zeichenAus.zeichen);
pruefe('Mit Ton aus ist es still', nachAus === 0, nachAus + ' Töne');

// Der eigentliche Fehler: über die Karte zurück ins Spiel
await page.evaluate(() => BRUECKE.zurKarte());
await page.waitForTimeout(400);
const aufKarte = await toeneZaehlen(500);
pruefe('Auf der Karte ist es still', aufKarte === 0, aufKarte + ' Töne');
await insSpiel();
const nachRueckkehr = await toeneZaehlen();
pruefe('Ton aus bleibt aus, auch nach dem Umweg über die Karte',
       nachRueckkehr === 0, nachRueckkehr + ' Töne');

// Auch der Musik-Knopf darf den stummen Ton nicht aushebeln
await echtKlicken(1);
await page.waitForTimeout(200);
const trotzMusikKnopf = await toeneZaehlen();
pruefe('Der Musik-Knopf hebelt "Ton aus" nicht aus', trotzMusikKnopf === 0, trotzMusikKnopf + ' Töne');
await echtKlicken(1);

// Und Sprung-Geräusche ebenso wenig
await page.keyboard.press('Space');
const sprungStumm = await toeneZaehlen(500);
pruefe('Auch Geräusche bleiben stumm', sprungStumm === 0, sprungStumm + ' Töne');

// Die Einstellung übersteht das Neuladen
await page.reload();
await page.waitForTimeout(800);
await insSpiel();
const nachNeuladen = await toeneZaehlen();
pruefe('Ton aus bleibt nach dem Neuladen aus', nachNeuladen === 0, nachNeuladen + ' Töne');

// Wieder einschalten – und es muss wirklich wieder tönen
await tonKnopf();
await page.waitForTimeout(300);
const wiederAn = await toeneZaehlen();
pruefe('Einschalten bringt die Musik zurück', wiederAn > 0, wiederAn + ' Töne');

// 8b) Der Knopf muss nach dem Spielen klickbar bleiben
//     Gemeldet war: nur die Taste M schaltet, der Knopf nicht. Ursache war
//     der Zeigergriff der Spielfläche (setPointerCapture), der nie
//     zurückgegeben wurde. Wer einmal ins Spielfeld geklickt hatte, dessen
//     weitere Klicks landeten dort statt auf dem Knopf.
await page.keyboard.press('Enter');                 // Titelbild verlassen
await page.waitForTimeout(400);
const feld = await page.locator('#teil-sprung #cv').boundingBox();
await page.mouse.click(feld.x + feld.width/2, feld.y + feld.height/2);   // springen
await page.waitForTimeout(250);
const griffFrei = await page.evaluate(() => {
  const cv = document.querySelector('#teil-sprung #cv');
  // über alle plausiblen Zeiger-Nummern prüfen
  for(let id=0; id<6; id++) if(cv.hasPointerCapture(id)) return false;
  return true;
});
pruefe('Die Spielfläche gibt den Zeiger wieder frei', griffFrei);

// Das Sicherheitsnetz gezielt prüfen: Maustaste auf dem Spielfeld halten,
// dann daneben drücken. Chromium löst den Griff beim Loslassen von selbst –
// dieser Test kommt dem zuvor und fällt durch, wenn die Freigabe fehlt.
await page.mouse.move(feld.x + feld.width/2, feld.y + feld.height/2);
await page.mouse.down();
await page.waitForTimeout(80);
const griffProbe = await page.evaluate(() => {
  const cv = document.querySelector('#teil-sprung #cv');
  let id = -1;
  for(let i=0;i<6;i++) if(cv.hasPointerCapture(i)){ id = i; break; }
  if(id < 0) return { gehalten:false };
  // Druck neben dem Spielfeld, mit demselben Zeiger
  document.querySelectorAll('#teil-sprung .sbtn')[0].dispatchEvent(
    new PointerEvent('pointerdown', { pointerId:id, bubbles:true, cancelable:true }));
  return { gehalten:true, id, danachNochGehalten: cv.hasPointerCapture(id) };
});
await page.mouse.up();
pruefe('Ein Druck neben dem Spielfeld löst den Griff sofort',
       griffProbe.gehalten && griffProbe.danachNochGehalten === false,
       griffProbe.gehalten ? ('Zeiger ' + griffProbe.id + ' danach gehalten: '
                              + griffProbe.danachNochGehalten)
                           : 'Griff wurde gar nicht erst gesetzt');

// Und die Freigabe muss im ausgelieferten Code wirklich drinstehen
const quelle = await page.content();
pruefe('Die Auslieferungsdatei gibt den Zeigergriff ausdrücklich zurück',
       /releasePointerCapture/.test(quelle));

const vorKlick = await page.evaluate(() =>
  document.querySelectorAll('#teil-sprung .sbtn')[0].getAttribute('aria-pressed'));
await tonKnopf();
await page.waitForTimeout(250);
const nachKlick = await page.evaluate(() =>
  document.querySelectorAll('#teil-sprung .sbtn')[0].getAttribute('aria-pressed'));
pruefe('Ein echter Mausklick schaltet den Ton auch nach dem Spielen',
       vorKlick !== nachKlick, vorKlick + ' → ' + nachKlick);

// 8c) Der Aus-Zustand muss sichtbar sein, nicht nur am Emoji hängen
const aus = await page.evaluate(() => {
  const b = document.querySelectorAll('#teil-sprung .sbtn')[0];
  const st = getComputedStyle(b, '::after');
  return {
    klasse:  b.classList.contains('aus'),
    gedrueckt: b.getAttribute('aria-pressed'),
    titel:   b.title,
    strich:  st.content !== 'none' && parseFloat(st.height) > 0,
    grund:   getComputedStyle(b).backgroundColor,
  };
});
pruefe('Der ausgeschaltete Knopf ist durchgestrichen', aus.klasse && aus.strich,
       'Strich: ' + aus.strich + ', Hintergrund ' + aus.grund);
pruefe('Der Knopf sagt im Tooltip, was gerade gilt',
       /ist aus/.test(aus.titel), aus.titel);
pruefe('Der Zustand ist auch für Vorlesewerkzeuge lesbar', aus.gedrueckt === 'false');

// 8e) Ein Ton-Schalter für beide Teile
//     Gemeldet war: der Lautsprecher auf der Stationskarte wechselt das
//     Symbol, die Spielmusik läuft weiter. Zwei Ursachen – die Musik ging
//     bei jedem Klick los, auch auf der Karte (tonFreigeben hing am
//     ganzen Fenster), und beide Teile hatten einen eigenen Schalter.
await page.evaluate(() => BRUECKE.zurKarte());
await page.waitForTimeout(500);
const aufDerKarte = await toeneZaehlen(1200);
pruefe('Auf der Stationskarte spielt keine Musik', aufDerKarte <= 2,
       aufDerKarte + ' Töne (Klickgeräusche zählen mit)');

const tonBilder = () => page.evaluate(() => ({
  karte: (()=>{ const b=document.querySelector('#teil-stationen #soundBtn');
                return b.getAttribute('aria-pressed'); })(),
  spiel: (()=>{ const b=document.querySelector('#teil-sprung .sbtn');
                return b.getAttribute('aria-pressed'); })(),
}));
const karteKnopf = async () => {
  const r = await page.locator('#teil-stationen #soundBtn').boundingBox();
  await page.mouse.click(r.x + r.width/2, r.y + r.height/2);
  await page.waitForTimeout(250);
};

// Sicherstellen, dass der Ton an ist
if((await tonBilder()).karte === 'false') await karteKnopf();
await page.evaluate(() => BRUECKE.zumSprung());
await page.waitForTimeout(800);
const musikLaeuft = await toeneZaehlen();
pruefe('Im Spiel läuft die Musik', musikLaeuft > 5, musikLaeuft + ' Töne');

// Über den Karten-Knopf zurück und dort ausschalten
const zurueck = await page.locator('#teil-sprung #kartenKnopf').boundingBox();
await page.mouse.click(zurueck.x + zurueck.width/2, zurueck.y + zurueck.height/2);
await page.waitForTimeout(500);
await karteKnopf();
const beide = await tonBilder();
pruefe('Der Knopf auf der Karte schaltet auch den Spielton aus',
       beide.karte === 'false' && beide.spiel === 'false',
       'Karte ' + beide.karte + ', Spiel ' + beide.spiel);

await page.evaluate(() => BRUECKE.zumSprung());
await page.waitForTimeout(900);
const stillImSpiel = await toeneZaehlen();
pruefe('Danach bleibt das Spiel still', stillImSpiel === 0, stillImSpiel + ' Töne');

// Umgekehrt: im Spiel einschalten, Karte muss folgen
await echtKlicken(0);
await page.waitForTimeout(350);
const wiederAnBeide = await tonBilder();
pruefe('Der Knopf im Spiel stellt auch den Knopf auf der Karte um',
       wiederAnBeide.karte === 'true' && wiederAnBeide.spiel === 'true',
       'Karte ' + wiederAnBeide.karte + ', Spiel ' + wiederAnBeide.spiel);
const wiederMusik = await toeneZaehlen();
pruefe('Und die Musik kommt zurück', wiederMusik > 5, wiederMusik + ' Töne');

// Aus, neu laden – der gemeinsame Zustand bleibt
await echtKlicken(0);
await page.waitForTimeout(250);
await page.reload();
await page.waitForTimeout(900);
const nachNeustart = await tonBilder();
pruefe('Der gemeinsame Schalter übersteht das Neuladen',
       nachNeustart.karte === 'false' && nachNeustart.spiel === 'false',
       'Karte ' + nachNeustart.karte + ', Spiel ' + nachNeustart.spiel);
await karteKnopf();   // für die folgenden Abschnitte wieder an

// 8d) Der Ernstfall – die echte Situation am Computer
await page.evaluate(() => BRUECKE.zurKarte());
await page.waitForTimeout(400);

// Nur Stationen mit Ernstfall bekommen den vierten Punkt
const punkte = await page.evaluate(() => {
  const karten = [...document.querySelectorAll('#teil-stationen .station')];
  return karten.slice(0, 8).map(k => !!k.querySelector('.lp.ernst'));
});
pruefe('Vier Stationen weniger haben den vierten Punkt nicht',
       punkte.filter(Boolean).length === 2, punkte.filter(Boolean).length + ' von 8 mit Ernstfall');

// "Türchen öffnen" (Doppelklick) durchspielen
await page.locator('#teil-stationen .station').nth(4).click();
await page.waitForTimeout(350);
const reihe = await page.evaluate(() =>
  [...document.querySelectorAll('#levelDots .lvl')].map(e => e.textContent).join(' '));
pruefe('Die Punktreihe zeigt den Ernstfall als vierten Schritt',
       reihe === '1 2 3 Ernstfall', reihe);

for(let lvl = 1; lvl <= 3; lvl++){
  for(let n = 0; n < 40; n++){
    const zu = await page.evaluate(() =>
      [...document.querySelectorAll('#arena .door')].findIndex(e => !e._open));
    if(zu < 0) break;
    const r = await page.locator('#arena .door').nth(zu).boundingBox();
    await page.mouse.dblclick(r.x + r.width/2, r.y + r.height/2);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(550);
  if(lvl < 3){
    await page.locator('#ovBtns button', { hasText:'Nächstes Level' }).click();
    await page.waitForTimeout(400);
  }
}
const angebot = await page.evaluate(() =>
  [...document.querySelectorAll('#ovBtns button')].map(b => b.textContent).join(' | '));
pruefe('Nach Level 3 wird der Ernstfall angeboten', /Ernstfall/.test(angebot), angebot);
pruefe('Der Ernstfall ist überspringbar', /Zur Karte/.test(angebot));

const sterneVorErnstfall = await page.evaluate(() =>
  document.querySelector('#totalStars').textContent);
await page.locator('#ovBtns button', { hasText:'Ernstfall' }).click();
await page.waitForTimeout(450);
const szene = await page.evaluate(() => ({
  auftrag: document.querySelector('.ef-auftrag')?.textContent.trim(),
  fenster: document.querySelector('.fenster-titel')?.textContent,
  dateien: document.querySelectorAll('.datei').length,
  bilder:  [...document.querySelectorAll('.datei')].filter(e => e._datei.ziel).length,
  namen:   [...document.querySelectorAll('.datei')].map(e => e._datei.name),
}));
pruefe('Der Schreibtisch steht', !!szene.fenster && szene.dateien === 8,
       szene.dateien + ' Dateien, Fenster "' + szene.fenster + '"');
pruefe('Der Auftrag nennt das Ziel', /Bilder/.test(szene.auftrag||''), szene.auftrag);
pruefe('Es sind echte Dateinamen mit Endung',
       szene.namen.every(n => /\.(jpg|png|docx|pdf|mp3|txt)$/.test(n)), szene.namen.slice(0,3).join(', '));

// Ein einfacher Klick darf nur auswählen, nicht öffnen
const ersteBild = await page.evaluate(() =>
  [...document.querySelectorAll('.datei')].findIndex(e => e._datei.ziel));
let r = await page.locator('.datei').nth(ersteBild).boundingBox();
await page.mouse.click(r.x + r.width/2, r.y + r.height/2);
await page.waitForTimeout(200);
const nachEinfach = await page.evaluate(i => {
  const el = [...document.querySelectorAll('.datei')][i];
  return { gewaehlt: el.classList.contains('gewaehlt'), offen: el.classList.contains('offen') };
}, ersteBild);
pruefe('Ein einfacher Klick wählt nur aus', nachEinfach.gewaehlt && !nachEinfach.offen,
       'gewählt: ' + nachEinfach.gewaehlt + ', offen: ' + nachEinfach.offen);

// Eine falsche Datei doppelklicken -> Hinweis, kein Fortschritt
const keinBild = await page.evaluate(() =>
  [...document.querySelectorAll('.datei')].findIndex(e => !e._datei.ziel));
r = await page.locator('.datei').nth(keinBild).boundingBox();
await page.mouse.dblclick(r.x + r.width/2, r.y + r.height/2);
await page.waitForTimeout(350);
const hinweis = await page.evaluate(() => ({
  da:   !!document.querySelector('.ef-dialog'),
  text: document.querySelector('.ef-dialog .box p')?.textContent || '',
  stand: document.querySelector('.ef-auftrag').textContent,
}));
pruefe('Die falsche Datei bringt einen Hinweis zum Lesen', hinweis.da, hinweis.text.slice(0,48));
pruefe('Sie zählt nicht als Treffer', /0\/4/.test(hinweis.stand), hinweis.stand.trim());
await page.locator('.ef-dialog button').click();
await page.waitForTimeout(250);
pruefe('Der Hinweis lässt sich wegklicken',
       await page.evaluate(() => !document.querySelector('.ef-dialog')));

// Alle Bilder öffnen -> Abzeichen
for(let n = 0; n < 10; n++){
  const i = await page.evaluate(() => [...document.querySelectorAll('.datei')]
      .findIndex(e => e._datei.ziel && !e.classList.contains('offen')));
  if(i < 0) break;
  const bb = await page.locator('.datei').nth(i).boundingBox();
  await page.mouse.dblclick(bb.x + bb.width/2, bb.y + bb.height/2);
  await page.waitForTimeout(180);
}
await page.waitForTimeout(700);
const belohnung = await page.evaluate(() => ({
  titel:  document.querySelector('#ovTitle').textContent,
  sterne: document.querySelector('#totalStars').textContent,
}));
pruefe('Der Ernstfall bringt ein Abzeichen', /Abzeichen/.test(belohnung.titel), belohnung.titel);
pruefe('Er vergibt keine Sterne – die Rechnung bleibt unberührt',
       belohnung.sterne === sterneVorErnstfall,
       sterneVorErnstfall + ' vorher, ' + belohnung.sterne + ' nachher');

await page.locator('#ovBtns button', { hasText:'Zur Karte' }).click();
await page.waitForTimeout(400);
const kachelStand = () => page.evaluate(() => {
  const k = document.querySelectorAll('#teil-stationen .station')[4];
  return { medaille: !!k.querySelector('.abz'), punkt: !!k.querySelector('.lp.ernst.on') };
});
const vorher = await kachelStand();
pruefe('Die Karte zeigt das Abzeichen', vorher.medaille && vorher.punkt);

await page.reload();
await page.waitForTimeout(800);
const nachher = await kachelStand();
pruefe('Das Abzeichen übersteht das Neuladen', nachher.medaille && nachher.punkt);

// Datenschutz: im Speicher stehen nur Zahlen und Stationskürzel
const gespeichert = await page.evaluate(() => localStorage.getItem('touchpad-abenteuer'));
const g = JSON.parse(gespeichert);
const bekannt = ['sterne','stationen','abzeichen','ton','schwelle'];
pruefe('Der Speicher enthält nur die bekannten Felder',
       Object.keys(g).every(k => bekannt.includes(k)), Object.keys(g).join(', '));
pruefe('Im Speicher steht kein Freitext',
       typeof g.sterne === 'number' && Array.isArray(g.abzeichen)
       && g.abzeichen.every(x => /^[a-z]+$/.test(x)), JSON.stringify(g.abzeichen));

// Der zweite Ernstfall: Ziehen
await page.locator('#teil-stationen .station').nth(3).click();
await page.waitForTimeout(350);
pruefe('Auch "Aufräumen" hat einen Ernstfall',
       await page.evaluate(() => [...document.querySelectorAll('#levelDots .lvl')]
         .some(e => e.classList.contains('ernst'))));
await page.evaluate(() => document.querySelector('#backBtn').click());
await page.waitForTimeout(300);

// 9) Nichts heisst mehr "Prototyp"
const beschriftung = await page.evaluate(() => ({
  titel: document.title,
  kopf: document.querySelector('#teil-sprung header').textContent,
}));
pruefe('Im Spielkopf steht kein "Prototyp" mehr',
       !/Prototyp|Phase \d/i.test(beschriftung.kopf), beschriftung.kopf.trim().slice(0,60));
pruefe('Auch der Seitentitel ist sauber',
       !/Prototyp/i.test(beschriftung.titel), beschriftung.titel);

// 10) Kein Nachladen aus dem Netz
pruefe('Die Datei lädt nichts nach', netz.length === 0,
       netz.length ? netz.slice(0,3).join(', ') : 'keine externen Anfragen');
pruefe('Keine JavaScript-Fehler', fehler.length === 0, fehler.slice(0,2).join(' | '));

await browser.close();
console.log(schlecht ? `\n${schlecht} Test(s) fehlgeschlagen.` : '\nAlle Tests bestanden.');
process.exit(schlecht ? 1 : 0);

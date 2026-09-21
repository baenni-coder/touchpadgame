/* ============================================================
   PHYSIK MESSEN
   Ruft den Prototyp im Browser auf und misst, wie hoch und wie
   weit der Fuchs wirklich springt. Diese Zahlen sind die
   Grundlage für jedes Level-Design.

   Aufruf:  node tools/messen.mjs
   ============================================================ */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + process.cwd() + '/prototyp.html');
await page.waitForTimeout(400);

const proben = await page.evaluate(() => {
  // Die Physik direkt schrittweise aufrufen, ohne echte Tasten
  const sim = (vx0, halten) => {
    for (let y = 0; y < levelH; y++) for (let x = 0; x < levelB; x++) karte[y][x] = '.';
    for (let x = 0; x < 2; x++) karte[11][x] = '#';          // nur ein Absprungblock
    spieler.x = 16; spieler.y = 11 * 16 - 14; spieler.vx = vx0; spieler.vy = 0;
    spieler.amBoden = true; spieler.sprungGehalten = false;
    spieler.coyote = TUNING.coyoteZeit; spieler.puffer = TUNING.puffer;

    const x0 = spieler.x, y0 = spieler.y;
    let hoch = 0, n = 0;
    while (n < 300) {
      eingabe.x = vx0 > 0 ? 1 : 0;
      eingabe.sprung = halten && n < 40;
      eingabe.sprungNeu = n === 0;
      spielerSchritt();
      hoch = Math.max(hoch, y0 - spieler.y);
      n++;
      if (n > 5 && spieler.y > y0 + 2) break;                // zurück auf Absprunghöhe
    }
    return {
      hochKacheln: +(hoch / 16).toFixed(2),
      weiteKacheln: +((spieler.x - x0) / 16).toFixed(2),
    };
  };
  return [
    { fall: 'Stand, Taste halten',     ...sim(0, true) },
    { fall: 'Volltempo, Taste halten', ...sim(TUNING.maxLauf, true) },
    { fall: 'Volltempo, kurz tippen',  ...sim(TUNING.maxLauf, false) },
  ];
});

console.table(proben);
console.log('\nDaraus folgen die Level-Regeln:');
const max = proben[1];
console.log(`  Stufe nach oben:  höchstens ${Math.floor(max.hochKacheln) - 1} Kacheln (sicher)`);
console.log(`  Lücke:            höchstens ${Math.floor(max.weiteKacheln) - 1} Kacheln (sicher)`);
await browser.close();

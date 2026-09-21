/* ============================================================
   SPRITEBLATT EINBETTEN
   Schreibt ein PNG als Base64 in eines der Blätter im
   BLAETTER-Objekt in prototyp.html. So bleibt das Spiel eine
   einzige Datei, die ohne Internet und ohne Nebendateien läuft.

   Aufruf:  node tools/atlas-einbetten.mjs [datei.png] [blatt]
            Standard: assets/atlas.png -> Blatt "eigen"

   Beispiele:
     node tools/atlas-einbetten.mjs
     node tools/atlas-einbetten.mjs assets/kenney-kacheln.png kenney
     node tools/atlas-einbetten.mjs assets/kenney-figuren.png figuren
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';

const datei = process.argv[2] || 'assets/atlas.png';
const blatt = process.argv[3] || 'eigen';

const b64  = readFileSync(datei).toString('base64');
const html = readFileSync('prototyp.html', 'utf8');

// Das Blatt mit diesem Namen suchen und nur dessen "quelle" ersetzen.
const muster = new RegExp(`(${blatt}:\\s*\\{[^}]*?quelle:'data:image/png;base64,)[^']*(')`);
if(!muster.test(html)){
  console.error(`Im BLAETTER-Objekt gibt es kein Blatt "${blatt}".`);
  console.error('Vorhanden sind:', [...html.matchAll(/^\s*(\w+):\s*\{\s*zelle:/gm)].map(m=>m[1]).join(', ') || '(keines gefunden)');
  process.exit(1);
}
writeFileSync('prototyp.html', html.replace(muster, `$1${b64}$2`));
console.log(`${datei} als Blatt "${blatt}" eingebettet (${Math.round(b64.length/1024)} KB Base64).`);

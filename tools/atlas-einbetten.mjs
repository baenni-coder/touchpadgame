/* ============================================================
   ATLAS EINBETTEN
   Schreibt ein PNG als Base64 in das ATLAS-Objekt in
   prototyp.html. So bleibt das Spiel eine einzige Datei, die
   ohne Internet und ohne Nebendateien läuft.

   Aufruf:  node tools/atlas-einbetten.mjs [datei.png]
            (ohne Angabe: assets/atlas.png)
   ============================================================ */
import { readFileSync, writeFileSync } from 'node:fs';

const datei = process.argv[2] || 'assets/atlas.png';
const b64 = readFileSync(datei).toString('base64');
const html = readFileSync('prototyp.html', 'utf8');

const muster = /(quelle: 'data:image\/png;base64,)[^']*(')/;
if(!muster.test(html)){
  console.error('Im ATLAS-Objekt wurde kein "quelle"-Eintrag gefunden.');
  process.exit(1);
}
writeFileSync('prototyp.html', html.replace(muster, `$1${b64}$2`));
console.log(`${datei} eingebettet (${Math.round(b64.length/1024)} KB Base64).`);

/* ============================================================
   BAUEN
   Setzt die Auslieferungsdatei zusammen:

     src/stationen.html   die acht Touchpad-Übungen
     prototyp.html        das Jump-&-Run
        ->  dist/touchpad-abenteuer.html

   Beide Teile sind eigenständige Seiten mit eigenem CSS und
   eigenen globalen Namen. Damit sie sich nicht in die Quere
   kommen:
     - jeder Teil bekommt einen eigenen Container im HTML
     - sein CSS wird auf diesen Container eingeschränkt
     - sein JavaScript läuft in einer eigenen Funktion
   Verbunden werden sie nur über das Objekt BRUECKE.

   Aufruf:  node tools/bauen.mjs
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

/* Urheber und Lizenz stehen ausserdem – bewusst sichtbar – in
   src/stationen.html (Fusszeile), src/bruecke.js (Lehrer-Bereich),
   prototyp.html (Titelbild) und src/anleitung.html. Wer sie ändert,
   ändert sie an diesen Stellen. */
const URHEBER = 'Andreas Bänninger, PICTS BeLoSe';
const LIZENZ  = 'CC BY-SA 4.0 – Weitergabe und Bearbeitung erlaubt unter Namensnennung und gleichen Bedingungen';

/* ---------- Teile aus einer HTML-Datei holen ---------- */
function zerlegen(datei){
  const h = readFileSync(datei, 'utf8');
  const stil = [...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
  // Das letzte <script> ist der Programmteil (frühere Treffer können in
  // Kommentaren stehen).
  const sa = h.lastIndexOf('<script>') + 8, sb = h.lastIndexOf('</script>');
  const code = h.slice(sa, sb);
  const ba = h.indexOf('<body>') + 6, bb = h.lastIndexOf('</body>');
  let koerper = h.slice(ba, bb);
  koerper = koerper.replace(/<script>[\s\S]*?<\/script>/g, '').trim();
  return { stil, code, koerper };
}

/* ---------- CSS auf einen Container einschränken ---------- */
// Regeln, die global bleiben müssen oder dürfen.
// "body" gehört NICHT hierher: beide Teile setzen eigene body-Regeln
// (der eine overflow:hidden, der andere touch-action:none). Blieben die
// global, würden sie sich gegenseitig überschreiben – und die
// Stationskarte liesse sich nicht mehr scrollen.
const GLOBAL = /^(:root|\*|html|@font-face)$/;

function cssEinschraenken(css, behaelter){
  let aus = '', i = 0;
  while(i < css.length){
    // Kommentare unverändert übernehmen
    if(css.startsWith('/*', i)){
      const e = css.indexOf('*/', i+2);
      aus += css.slice(i, e<0 ? css.length : e+2);
      i = e<0 ? css.length : e+2;
      continue;
    }
    if(/\s/.test(css[i])){ aus += css[i++]; continue; }

    // Bis zur öffnenden Klammer lesen = Selektor oder @-Regel
    let k = i;
    while(k < css.length && css[k] !== '{') k++;
    if(k >= css.length){ aus += css.slice(i); break; }
    const kopf = css.slice(i, k).trim();

    // Block einlesen (Klammern zählen)
    let tiefe = 0, e = k;
    for(; e < css.length; e++){
      if(css[e] === '{') tiefe++;
      else if(css[e] === '}'){ tiefe--; if(tiefe === 0){ e++; break; } }
    }
    const block = css.slice(k+1, e-1);

    if(kopf.startsWith('@keyframes') || kopf.startsWith('@font-face')){
      aus += kopf + '{' + block + '}';                 // unverändert
    }else if(kopf.startsWith('@media') || kopf.startsWith('@supports')){
      aus += kopf + '{' + cssEinschraenken(block, behaelter) + '}';
    }else{
      const neu = kopf.split(',').map(t=>{
        const sel = t.trim();
        if(!sel) return sel;
        if(GLOBAL.test(sel)) return sel;               // global lassen
        // "body" innerhalb eines Selektors auf den Behälter umbiegen
        if(sel === 'body') return behaelter;
        return behaelter + ' ' + sel;
      }).join(',');
      aus += neu + '{' + block + '}';
    }
    i = e;
  }
  return aus;
}

/* ---------- Bauen ---------- */
const stationen = zerlegen('src/stationen.html');
const sprung    = zerlegen('prototyp.html');

// Im Sprung-Teil steht "body{...}" für den ganzen Bildschirm – als
// Container-Regel gilt das weiter, nur eben innerhalb der Hülle.
const stilStationen = cssEinschraenken(stationen.stil, '#teil-stationen');
const stilSprung    = cssEinschraenken(sprung.stil,    '#teil-sprung');

const bruecke = readFileSync('src/bruecke.js', 'utf8');

const heute = new Date().toISOString().slice(0,10);
const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Touchpad-Abenteuer</title>
<!--
  ============================================================
   TOUCHPAD-ABENTEUER  ·  für die 3. Klasse
   Acht Übungen am Touchpad und ein Jump-&-Run als Belohnung.

   Zusammengebaut am ${heute} von tools/bauen.mjs
   aus src/stationen.html, prototyp.html und src/bruecke.js.
   NICHT von Hand ändern – Änderungen gehören in die Quellen.

   Erstellt von ${URHEBER}
   Lizenz: ${LIZENZ}

   Eine einzige Datei · läuft komplett lokal · kein Internet nötig.
   Es werden keine Daten übertragen; alles bleibt auf dem Gerät.
   Bilder von kenney.nl (CC0), Klänge und Musik entstehen im Code.
  ============================================================
-->
<style>
/* ---------- gemeinsame Grundlage ---------- */
*{box-sizing:border-box;margin:0;padding:0}
/* Nur html auf volle Höhe. Bekäme body ebenfalls height:100%, wäre die
   Seite auf Fensterhöhe gedeckelt und die unteren Kacheln nicht
   erreichbar – sie würden einfach abgeschnitten. */
html{height:100%}
body{
  font-family:"SF Pro Rounded",ui-rounded,"Segoe UI Rounded","Nunito","Baloo 2",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  background:linear-gradient(180deg,#FFF1DC 0%,#BFE3FF 100%);
  background-attachment:fixed;
  -webkit-user-select:none;user-select:none;
  min-height:100%;
}
#teil-stationen,#teil-sprung{min-height:100vh}
/* Die Stationskarte darf länger sein als der Bildschirm und muss sich
   dann scrollen lassen – auch mit zwei Fingern auf dem Touchpad. */
#teil-stationen{overflow:visible;touch-action:pan-y}
/* Das Spielfeld ist immer bildschirmhoch und soll nicht wegscrollen. */
#teil-sprung{overflow:hidden;touch-action:none}
#teil-sprung[hidden],#teil-stationen[hidden]{display:none!important}

/* ---------- die acht Übungen ---------- */
${stilStationen}

/* ---------- das Jump-&-Run ---------- */
${stilSprung}

/* ---------- Lehrer-Bereich ---------- */
.lehrer-hg{position:fixed;inset:0;background:rgba(44,33,64,.55);display:grid;place-items:center;z-index:9999}
.lehrer{background:#fff;border-radius:24px;padding:26px 30px;max-width:460px;width:92%;
  box-shadow:0 20px 50px rgba(0,0,0,.35);font-family:inherit;color:#2C2340}
.lehrer h2{font-size:22px;margin-bottom:4px}
.lehrer p.unter{color:#6B6280;font-weight:600;font-size:13px;margin-bottom:16px}
.lehrer .reihe{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
.lehrer button{border:none;border-radius:14px;padding:11px 16px;font-weight:800;font-size:14px;
  cursor:pointer;font-family:inherit;background:#EFECF6;color:#2C2340}
.lehrer button:hover{filter:brightness(.95)}
.lehrer button.stark{background:#2C2340;color:#fff}
.lehrer button.warn{background:#FFE3E3;color:#C92A2A}
.lehrer .wert{font-weight:800;font-size:15px;padding:11px 4px}
.lehrer .hinweis{font-size:12px;color:#6B6280;font-weight:600;line-height:1.5;margin-top:14px;
  border-top:1px solid #EFECF6;padding-top:12px}
</style>
</head>
<body>

<div id="teil-stationen">
${stationen.koerper}
</div>

<div id="teil-sprung" hidden>
${sprung.koerper}
</div>

<script>
/* ============================================================
   BRÜCKE – verbindet die beiden Teile
   ============================================================ */
${bruecke}
</script>

<script>
/* ============================================================
   DIE ACHT ÜBUNGEN
   ============================================================ */
(function(){
${stationen.code}
})();
</script>

<script>
/* ============================================================
   DAS JUMP-&-RUN
   ============================================================ */
(function(){
${sprung.code}
})();
</script>

<script>BRUECKE.starten();</script>
</body>
</html>
`;

mkdirSync('dist', { recursive:true });
writeFileSync('dist/touchpad-abenteuer.html', html);
const kb = (html.length/1024).toFixed(0);
console.log(`dist/touchpad-abenteuer.html gebaut – ${kb} KB, eine Datei, keine Nebendateien.`);

// Die Anleitung liegt daneben, damit man beides zusammen weitergeben kann.
copyFileSync('src/anleitung.html', 'dist/anleitung.html');
console.log('dist/anleitung.html mitkopiert – die Anleitung für Lehrpersonen.');

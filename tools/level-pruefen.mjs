/* ============================================================
   LEVEL-PRÜFER
   Prüft, ob Ziel und alle Münzen vom Start aus wirklich
   erreichbar sind – bevor ein Kind daran verzweifelt.

   Die Grenzwerte stammen aus echten Messungen im Browser
   (tools/messen.mjs):
     normaler Sprung     2.93 Kacheln hoch, 3.93 weit
     Doppelklick-Sprung  4.23 Kacheln hoch

   Zwei Anforderungen werden getrennt geprüft:
     1. Das Level muss OHNE Doppelklick-Sprung durchspielbar sein.
        (Sonst hängt ein Kind fest, das ihn noch nicht beherrscht.)
     2. Bonus-Münzen (B) sollen NUR mit ihm erreichbar sein –
        sonst sind sie kein Bonus.

   Aufruf:  node tools/level-pruefen.mjs
   ============================================================ */
import { baue } from './level-bauen.mjs';

const k = baue().map(z=>z.split(''));
const H = k.length, Bre = k[0].length;

/* Wie weit darf ein Sprung gehen? dh = Kacheln nach oben. */
const SICHER = { 0:3, 1:3, 2:2 };   // ohne Zittern schaffbar
const KNAPP  = { 0:4, 1:4, 2:3 };   // nur mit vollem Anlauf
const HOCH_NORMAL = 3;              // Münzen bis 3 Kacheln über dem Standplatz
const HOCH_EXTRA  = 4;              // mit Doppelklick-Sprung: 4

// Nur Vollblöcke versperren den Weg. Eine Einweg-Plattform ('=') trägt
// von oben, lässt den Fuchs aber von unten durchspringen – sie ist also frei.
const frei   = (r,c) => r>=0 && r<H && c>=0 && c<Bre && k[r][c]!=='#';
const traegt = (r,c) => r+1<H && c>=0 && c<Bre && (k[r+1][c]==='#' || k[r+1][c]==='=');
// Auf Stacheln kann man nicht stehen bleiben – drüberspringen geht aber.
const steht  = (r,c) => frei(r,c) && frei(r-1,c) && traegt(r,c) && k[r][c]!=='^';

/* Marker einsammeln und aus der Karte nehmen */
let start=null, ziel=null; const muenzen=[], boni=[], checkpoints=[];
for(let r=0;r<H;r++) for(let c=0;c<Bre;c++){
  const z = k[r][c];
  if(z==='P'){ start={r,c}; k[r][c]='.'; }
  if(z==='F'){ ziel ={r,c}; k[r][c]='.'; }
  if(z==='o'){ muenzen.push({r,c}); k[r][c]='.'; }
  if(z==='B'){ boni.push({r,c}); k[r][c]='.'; }
  if(z==='C'){ checkpoints.push({r,c}); k[r][c]='.'; }
  if(z==='L'||z==='V'){ k[r][c]='.'; }        // Gegner bewegen sich, nicht prüfbar
}

/* Breitensuche über alle Standplätze */
const key = (r,c)=>r*Bre+c;
const gesehen = new Map();          // key -> 'sicher' | 'knapp'
const schlange = [];

let sr = start.r; while(sr+1<H && !traegt(sr,start.c)) sr++;
gesehen.set(key(sr,start.c),'sicher'); schlange.push({r:sr,c:start.c,art:'sicher'});

function versuche(r,c,art){
  if(!steht(r,c)) return;
  const alt = gesehen.get(key(r,c));
  if(alt==='sicher' || (alt==='knapp' && art==='knapp')) return;
  gesehen.set(key(r,c),art); schlange.push({r,c,art});
}

while(schlange.length){
  const {r,c,art} = schlange.shift();
  for(const dir of [-1,1]){
    for(let dc=1;dc<=5;dc++){
      const c2 = c+dir*dc;
      if(c2<0||c2>=Bre) break;
      for(let r2=0;r2<H;r2++){
        if(!steht(r2,c2)) continue;
        const dh = r - r2;
        let erlaubt=null;
        if(dh<=0){                                   // gleich hoch oder tiefer
          const tief = -dh;
          if(dc <= 4 + Math.min(3,Math.floor(tief/2))) erlaubt='sicher';
        }else if(dh<=2){
          if(dc <= SICHER[dh]) erlaubt='sicher';
          else if(dc <= KNAPP[dh]) erlaubt='knapp';
        }
        if(!erlaubt) continue;
        let blockiert=false;
        for(let rr=Math.min(r,r2)-1; rr<=Math.min(r,r2); rr++) if(!frei(rr,c)) blockiert=true;
        if(blockiert) continue;
        versuche(r2,c2, (art==='knapp'||erlaubt==='knapp')?'knapp':'sicher');
      }
    }
  }
}

/* Ist eine Stelle von einem erreichten Standplatz aus im Sprung erreichbar? */
function erreichbar(r,c,hoehe,reichweite=2){
  let best=null;
  for(const [kk,art] of gesehen){
    const sr2=Math.floor(kk/Bre), sc2=kk%Bre;
    const dh = sr2 - r;
    if(Math.abs(sc2-c)<=reichweite && dh>=0 && dh<=hoehe){
      if(art==='sicher') return 'sicher';
      best='knapp';
    }
  }
  return best;
}

let fehler=0, warnung=0;
const melde = (ok, gut, schlecht, istFehler=true) => {
  if(ok){ if(gut) console.log(gut); return; }
  console.log(schlecht); istFehler ? fehler++ : warnung++;
};

const zz = erreichbar(ziel.r, ziel.c, 1, 1);
melde(zz==='sicher', '✅ Ziel erreichbar',
      zz==='knapp' ? '⚠️  Ziel nur knapp erreichbar' : `❌ ZIEL NICHT ERREICHBAR (Spalte ${ziel.c})`,
      zz!=='knapp');

checkpoints.forEach(p=>{
  const e = erreichbar(p.r,p.c,1,1);
  melde(!!e, null, `❌ Checkpoint bei Spalte ${p.c} nicht erreichbar`);
});

muenzen.forEach((m,i)=>{
  const e = erreichbar(m.r,m.c,HOCH_NORMAL);
  melde(e==='sicher', null,
        e==='knapp' ? `⚠️  Münze ${i+1} (Zeile ${m.r}, Spalte ${m.c}) nur knapp erreichbar`
                    : `❌ Münze ${i+1} (Zeile ${m.r}, Spalte ${m.c}) NICHT ERREICHBAR`,
        e!=='knapp');
});

boni.forEach((m,i)=>{
  const normal = erreichbar(m.r,m.c,HOCH_NORMAL);
  const extra  = erreichbar(m.r,m.c,HOCH_EXTRA);
  if(normal) melde(false, null,
    `⚠️  Bonus ${i+1} (Zeile ${m.r}, Spalte ${m.c}) ist schon ohne Doppelklick-Sprung erreichbar – das ist kein Bonus`, false);
  else melde(!!extra, null,
    `❌ Bonus ${i+1} (Zeile ${m.r}, Spalte ${m.c}) auch mit Doppelklick-Sprung NICHT erreichbar`);
});

/* Karte mit Markierung */
console.log('\nErreichbarkeit (  * sicher   ? knapp   ! unerreichbarer Standplatz ):');
for(let r=0;r<H;r++){
  let z='';
  for(let c=0;c<Bre;c++){
    const art = gesehen.get(key(r,c));
    if(k[r][c]==='#') z+='#';
    else if(k[r][c]==='=') z+='=';
    else if(k[r][c]==='^') z+='^';
    else if(art==='sicher') z+='*';
    else if(art==='knapp') z+='?';
    else if(steht(r,c)) z+='!';
    else z+=' ';
  }
  console.log(String(r).padStart(2)+' |'+z+'|');
}
console.log(`\n${muenzen.length} Münzen · ${boni.length} Bonus · ${checkpoints.length} Checkpoints`);
console.log(`${fehler} Fehler · ${warnung} Warnungen`);
process.exit(fehler ? 1 : 0);

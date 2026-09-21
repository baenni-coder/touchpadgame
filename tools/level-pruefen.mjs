/* ============================================================
   LEVEL-PRÜFER
   Prüft, ob Ziel und alle Münzen vom Start aus wirklich
   erreichbar sind – bevor ein Kind daran verzweifelt.

   Die Grenzwerte stammen aus einer echten Messung im Browser
   (tools/messen.mjs): 2.93 Kacheln hoch, 3.93 Kacheln weit.

   Aufruf:  node tools/level-pruefen.mjs
   ============================================================ */
import { baue } from './level-bauen.mjs';

const k = baue().map(z=>z.split(''));
const H = k.length, B = k[0].length;

/* Wie weit darf ein Sprung gehen? Abhängig davon, wie viel er
   dabei steigt. dh = Kacheln nach oben. Werte aus der Messung,
   mit einer Kachel Sicherheitsabstand. */
const SICHER = { 0:3, 1:3, 2:2 };   // ohne Zittern schaffbar
const KNAPP  = { 0:4, 1:4, 2:3 };   // nur mit vollem Anlauf

// Nur Vollblöcke versperren den Weg. Eine Einweg-Plattform ('=') trägt
// von oben, lässt den Fuchs aber von unten durchspringen – sie ist also frei.
const frei  = (r,c) => r>=0 && r<H && c>=0 && c<B && k[r][c]!=='#';
const traegt= (r,c) => r+1<H && c>=0 && c<B && (k[r+1][c]==='#' || k[r+1][c]==='=');
// Ein Standplatz: hier passt der Fuchs hin und etwas trägt ihn
const steht = (r,c) => frei(r,c) && frei(r-1,c) && traegt(r,c);

/* Start und Ziel finden */
let start=null, ziel=null; const muenzen=[];
for(let r=0;r<H;r++) for(let c=0;c<B;c++){
  if(k[r][c]==='P'){ start={r,c}; k[r][c]='.'; }
  if(k[r][c]==='F'){ ziel ={r,c}; k[r][c]='.'; }
  if(k[r][c]==='o'){ muenzen.push({r,c}); k[r][c]='.'; }
}

/* BFS über alle Standplätze */
const key = (r,c)=>r*B+c;
const gesehen = new Map();          // key -> 'sicher' | 'knapp'
const schlange = [];

// Der Startpunkt liegt vielleicht in der Luft -> erst fallen lassen
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
    // laufen / kleine Stufe / hinunterfallen
    for(let dc=1;dc<=5;dc++){
      const c2 = c+dir*dc;
      if(c2<0||c2>=B) break;
      for(let r2=0;r2<H;r2++){
        if(!steht(r2,c2)) continue;
        const dh = r - r2;                       // >0 = höher hinauf
        let erlaubt=null;
        if(dh<=0){                               // gleich hoch oder tiefer
          const tief = -dh;
          if(dc <= 4 + Math.min(3,Math.floor(tief/2))) erlaubt='sicher';
        }else if(dh<=2){
          if(dc <= SICHER[dh]) erlaubt='sicher';
          else if(dc <= KNAPP[dh]) erlaubt='knapp';
        }
        if(!erlaubt) continue;
        // Weg nach oben muss frei sein (keine Decke im Weg)
        let blockiert=false;
        for(let rr=Math.min(r,r2)-1; rr<=Math.min(r,r2); rr++) if(!frei(rr,c)) blockiert=true;
        if(blockiert) continue;
        versuche(r2,c2, (art==='knapp'||erlaubt==='knapp')?'knapp':'sicher');
      }
    }
  }
}

/* Auswertung */
function erreichbar(r,c,reichweite=2,hoehe=3){
  let best=null;
  for(const [kk,art] of gesehen){
    const sr2=Math.floor(kk/B), sc2=kk%B;
    const dh = sr2 - r;
    if(Math.abs(sc2-c)<=reichweite && dh>=0 && dh<=hoehe){
      if(art==='sicher') return 'sicher';
      best='knapp';
    }
  }
  return best;
}

let fehler=0, warnung=0;
const zz = erreichbar(ziel.r, ziel.c, 1, 1);
if(zz==='sicher') console.log('✅ Ziel erreichbar');
else if(zz==='knapp'){ console.log('⚠️  Ziel nur knapp erreichbar'); warnung++; }
else { console.log('❌ ZIEL NICHT ERREICHBAR bei Spalte '+ziel.c); fehler++; }

muenzen.forEach((m,i)=>{
  const e = erreichbar(m.r,m.c);
  if(e==='sicher') return;
  if(e==='knapp'){ console.log(`⚠️  Münze ${i+1} (Zeile ${m.r}, Spalte ${m.c}) nur knapp erreichbar`); warnung++; }
  else { console.log(`❌ Münze ${i+1} (Zeile ${m.r}, Spalte ${m.c}) NICHT ERREICHBAR`); fehler++; }
});

/* Karte mit Markierung ausgeben: * = sicher erreichbar, ? = knapp */
console.log('\nErreichbarkeit (  * sicher   ? knapp   ! unerreichbarer Standplatz ):');
for(let r=0;r<H;r++){
  let z='';
  for(let c=0;c<B;c++){
    const art = gesehen.get(key(r,c));
    if(k[r][c]==='#') z+='#';
    else if(k[r][c]==='=') z+='=';
    else if(art==='sicher') z+='*';
    else if(art==='knapp') z+='?';
    else if(steht(r,c)) z+='!';
    else z+=' ';
  }
  console.log(String(r).padStart(2)+' |'+z+'|');
}
console.log(`\n${muenzen.length} Münzen · ${fehler} Fehler · ${warnung} Warnungen`);
process.exit(fehler ? 1 : 0);

/* ============================================================
   LEVEL-PRÜFER
   Prüft für JEDES Level, ob Ziel, Checkpoints und alle Münzen
   vom Start aus wirklich erreichbar sind – bevor ein Kind
   daran verzweifelt.

   Die Grenzwerte stammen aus echten Messungen im Browser
   (tools/messen.mjs):
     normaler Sprung     2.93 Kacheln hoch, 3.93 weit
     Doppelklick-Sprung  4.23 Kacheln hoch

   Zwei Anforderungen werden getrennt geprüft:
     1. Jedes Level muss OHNE Doppelklick-Sprung durchspielbar sein.
        (Sonst hängt ein Kind fest, das ihn noch nicht beherrscht.)
     2. Bonus-Diamanten (B) sollen NUR mit ihm erreichbar sein –
        sonst sind sie kein Bonus.

   Aufruf:  node tools/level-pruefen.mjs [nummer]
   ============================================================ */
import { LEVELS } from './level-bauen.mjs';

const SICHER = { 0:3, 1:3, 2:2 };   // Sprungweite je Höhenunterschied
const KNAPP  = { 0:4, 1:4, 2:3 };   // nur mit vollem Anlauf
const HOCH_NORMAL = 3;              // Münzen bis 3 Kacheln über dem Standplatz
const HOCH_EXTRA  = 4;              // mit Doppelklick-Sprung: 4

function pruefe(zeilen, name){
  const k = zeilen.map(z=>z.split(''));
  const H = k.length, Bre = k[0].length;

  // Nur Vollblöcke versperren den Weg. Eine Einweg-Plattform ('=') trägt
  // von oben, lässt den Fuchs aber von unten durchspringen – sie ist frei.
  const frei   = (r,c) => r>=0 && r<H && c>=0 && c<Bre && k[r][c]!=='#';
  const traegt = (r,c) => r+1<H && c>=0 && c<Bre && (k[r+1][c]==='#' || k[r+1][c]==='=');
  // Auf Stacheln kann man nicht stehen bleiben – drüberspringen geht aber.
  const steht  = (r,c) => frei(r,c) && frei(r-1,c) && traegt(r,c) && k[r][c]!=='^';

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

  const meldungen = [];
  if(!start) meldungen.push('❌ kein Startpunkt (P) gesetzt');
  if(!ziel)  meldungen.push('❌ kein Ziel (F) gesetzt');
  if(!start || !ziel) return { name, fehler:meldungen.length, warnung:0, meldungen, karte:null };

  /* Breitensuche über alle Standplätze */
  const key = (r,c)=>r*Bre+c;
  const gesehen = new Map();
  const schlange = [];
  let sr = start.r; while(sr+1<H && !traegt(sr,start.c)) sr++;
  gesehen.set(key(sr,start.c),'sicher'); schlange.push({r:sr,c:start.c,art:'sicher'});

  const versuche = (r,c,art) => {
    if(!steht(r,c)) return;
    const alt = gesehen.get(key(r,c));
    if(alt==='sicher' || (alt==='knapp' && art==='knapp')) return;
    gesehen.set(key(r,c),art); schlange.push({r,c,art});
  };

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
          if(dh<=0){
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

  const erreichbar = (r,c,hoehe,reichweite=2) => {
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
  };

  let fehler=0, warnung=0;
  const zz = erreichbar(ziel.r, ziel.c, 1, 1);
  if(zz==='knapp'){ meldungen.push('⚠️  Ziel nur knapp erreichbar'); warnung++; }
  else if(!zz){ meldungen.push(`❌ ZIEL NICHT ERREICHBAR (Spalte ${ziel.c})`); fehler++; }

  checkpoints.forEach(p=>{
    if(!erreichbar(p.r,p.c,1,1)){ meldungen.push(`❌ Checkpoint bei Spalte ${p.c} nicht erreichbar`); fehler++; }
  });

  muenzen.forEach((m,i)=>{
    const e = erreichbar(m.r,m.c,HOCH_NORMAL);
    if(e==='knapp'){ meldungen.push(`⚠️  Münze ${i+1} (Zeile ${m.r}, Spalte ${m.c}) nur knapp erreichbar`); warnung++; }
    else if(!e){ meldungen.push(`❌ Münze ${i+1} (Zeile ${m.r}, Spalte ${m.c}) NICHT ERREICHBAR`); fehler++; }
  });

  boni.forEach((m,i)=>{
    const normal = erreichbar(m.r,m.c,HOCH_NORMAL);
    const extra  = erreichbar(m.r,m.c,HOCH_EXTRA);
    if(normal){ meldungen.push(`⚠️  Bonus ${i+1} (Zeile ${m.r}, Spalte ${m.c}) ist schon ohne Doppelklick-Sprung erreichbar – das ist kein Bonus`); warnung++; }
    else if(!extra){ meldungen.push(`❌ Bonus ${i+1} (Zeile ${m.r}, Spalte ${m.c}) auch mit Doppelklick-Sprung NICHT erreichbar`); fehler++; }
  });

  const karte = [];
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
    karte.push(String(r).padStart(2)+' |'+z+'|');
  }

  return { name, fehler, warnung, meldungen, karte,
           zahlen:{ muenzen:muenzen.length, boni:boni.length, checkpoints:checkpoints.length, breite:Bre } };
}

const nur = process.argv[2] ? [+process.argv[2]-1] : LEVELS.map((_,i)=>i);
let fehlerGesamt = 0, warnungGesamt = 0;

nur.forEach(i=>{
  const L = LEVELS[i];
  const e = pruefe(L.baue(), L.name);
  const kopf = `${i+1}. ${e.name}`;
  if(e.fehler===0 && e.warnung===0){
    console.log(`✅ ${kopf}  ·  ${e.zahlen.breite} Kacheln breit, ${e.zahlen.muenzen} Münzen, ${e.zahlen.boni} Bonus, ${e.zahlen.checkpoints} Checkpoints`);
  }else{
    console.log(`\n${e.fehler ? '❌' : '⚠️ '} ${kopf}`);
    e.meldungen.forEach(m=>console.log('   '+m));
    if(e.karte){ console.log(''); e.karte.forEach(z=>console.log('   '+z)); }
    console.log('');
  }
  fehlerGesamt += e.fehler; warnungGesamt += e.warnung;
});

console.log(`\n${fehlerGesamt} Fehler · ${warnungGesamt} Warnungen in ${nur.length} Level(n)`);
process.exit(fehlerGesamt ? 1 : 0);

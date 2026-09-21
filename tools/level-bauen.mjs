/* ============================================================
   LEVEL BAUEN
   Erzeugt alle Levels aus Abschnitten und gibt sie als
   Zeilen-Strings aus. So lassen sich Höhen und Lücken exakt
   setzen, statt in einer Textwüste Punkte zu zählen.

   Zeichen:
     #  Boden          =  Plattform (von unten durchspringbar)
     ^  Stacheln       o  Münze
     B  Bonus-Münze (nur mit dem Doppelklick-Sprung erreichbar)
     L  Läufer (Gegner am Boden)      V  Flieger (Gegner in der Luft)
     C  Checkpoint     P  Start       F  Ziel        .  Luft

   Grenzen aus der Messung (tools/messen.mjs):
     Stufe nach oben:  höchstens 2 Kacheln
     Lücke:            höchstens 3 Kacheln
     Doppelklick-Sprung erreicht 4 Kacheln – nur für Bonus-Sterne

   Aufruf:  node tools/level-bauen.mjs [nummer]
   ============================================================ */

const LUFT_OBEN = 2;   // Leerzeilen über dem Level, damit Sprungziele ins Bild passen

function gitter(breite, hoehe, boden){
  const k = Array.from({length:hoehe}, ()=> Array(breite).fill('.'));
  const box = (r0,c0,r1,c1,z) => { for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++) if(k[r]&&c<breite) k[r][c]=z; };
  const set = (r,c,z) => { if(k[r]&&c<breite) k[r][c]=z; };
  box(boden,0,hoehe-1,breite-1,'#');
  const fertig = () => {
    const leer = '.'.repeat(breite);
    return [...Array(LUFT_OBEN).fill(leer), ...k.map(z=>z.join(''))];
  };
  return { k, box, set, fertig };
}

/* ============================================================
   LEVEL 1 · Erste Schritte
   Zum Ankommen: keine Gegner, keine Stacheln, kein Abgrund.
   Nur laufen, kleine Stufen, ein erster weiter Sprung – und ein
   Bonus-Stern zum Üben des Doppelklicks.
   ============================================================ */
function levelEins(){
  const B=52, H=14, BODEN=12;
  const {box,set,fertig} = gitter(B,H,BODEN);

  set(11,1,'P');
  set(11,5,'o'); set(11,8,'o');            // einfach im Weg liegend

  box(11,12,11,14,'#');                    // erste Stufe, 1 hoch
  set(10,13,'o');
  box(10,17,10,19,'#');                    // zweite Stufe, 2 hoch
  set(9,18,'o');

  box(10,23,10,26,'=');                    // erste Plattform
  set(9,24,'o'); set(9,25,'o');
  set(5,25,'B');                           // Bonus: 4 über der Plattform

  box(BODEN,30,H-1,31,'.');                // erste kleine Lücke, 2 breit
  set(10,30,'o');

  box(10,35,10,38,'=');
  set(9,36,'o');
  set(11,41,'C');                          // Checkpoint kurz vor Schluss
  set(11,44,'o'); set(11,46,'o');
  set(11,49,'F');
  return fertig();
}

/* ============================================================
   LEVEL 2 · Waldweg
   Jetzt kommen Gegner, Stacheln und echte Abgründe dazu.
   ============================================================ */
function levelZwei(){
  const B=96, H=14, BODEN=12;
  const {box,set,fertig} = gitter(B,H,BODEN);

  // A: Laufen (0-11)
  set(11,1,'P');
  set(11,5,'o'); set(11,9,'o');

  // B: kleine Stufen (12-22)
  box(11,13,11,14,'#');
  box(10,16,10,17,'#');
  box(9,19,9,21,'#');
  set(10,13,'o'); set(9,16,'o'); set(8,20,'o');
  set(8,21,'L');

  // C: Lücken und erste Stacheln (23-38)
  box(BODEN,26,H-1,27,'.');
  set(11,31,'^');
  box(BODEN,34,H-1,36,'.');
  set(11,24,'o'); set(10,26,'o'); set(9,31,'o'); set(10,35,'o');

  // D: hohe Plattformen und ein Flieger (39-54)
  box(10,40,10,43,'=');
  box(8,45,8,48,'=');
  set(9,41,'o'); set(7,46,'o'); set(7,47,'o');
  set(3,46,'B');
  set(6,52,'V');
  set(11,50,'o');

  // E: Einweg-Plattformen gestapelt + Checkpoint (55-66)
  set(11,55,'C');
  box(10,56,10,61,'=');
  box(8,57,8,62,'=');
  set(9,58,'o'); set(7,59,'o'); set(7,60,'o');

  // F: Abgrund und ein Läufer (67-78)
  set(11,67,'C');
  box(BODEN,70,H-1,72,'.');
  set(10,71,'o');
  set(11,75,'L');
  set(11,77,'o');

  // G: Stachelfeld mit einer Plattform darüber (79-90)
  set(11,81,'^'); set(11,82,'^');
  box(10,84,10,86,'=');
  set(11,89,'^');
  set(10,80,'o'); set(9,85,'o'); set(10,88,'o');
  set(5,85,'B');
  set(7,90,'V');

  // H: Ziel (91-95)
  set(11,91,'C');
  set(11,93,'F');
  return fertig();
}

/* ============================================================
   LEVEL 3 · Hoch hinaus
   Mehr in die Höhe: gestapelte Plattformen, Flieger auf dem Weg,
   Stacheln unter den Sprüngen. Die Bonus-Sterne liegen hier so,
   dass man den Doppelklick-Sprung sicher beherrschen muss.
   ============================================================ */
function levelDrei(){
  const B=104, H=18, BODEN=16;
  const {box,set,fertig} = gitter(B,H,BODEN);

  // A: Auftakt (0-13)
  set(15,1,'P');
  set(15,4,'o'); set(15,7,'o');
  set(15,10,'^');
  set(14,10,'o');

  // B: Treppe nach oben (14-30)
  // Boden-Standplatz ist Zeile 15. Jede Stufe darf höchstens 2 Kacheln
  // höher liegen, waagerecht höchstens 3 weiter.
  box(15,14,15,16,'#');                     // Standplatz 14
  box(13,18,13,21,'=');                     // Standplatz 12
  box(11,23,11,26,'=');                     // Standplatz 10
  set(14,15,'o'); set(12,19,'o'); set(10,24,'o'); set(10,25,'o');
  set(6,25,'B');                            // Bonus: 4 über Standplatz 10
  set(12,29,'V');

  // C: Über den Dächern (31-48)
  box(11,29,11,32,'=');
  box(11,35,11,38,'=');
  box(13,41,13,44,'=');
  set(10,30,'o'); set(10,36,'o'); set(10,37,'o'); set(12,42,'o');
  set(15,33,'^'); set(15,34,'^');            // Stacheln unter der Lücke
  set(10,40,'V');
  set(15,46,'C');

  // D: Abstieg mit Gegnern (49-66)
  box(BODEN,52,H-1,54,'.');
  set(14,53,'o');
  set(15,58,'L');
  box(14,60,14,63,'=');                      // Standplatz 13, vom Boden 2 hoch
  set(13,61,'o'); set(13,62,'o');
  set(15,65,'L');

  // E: Stachelpfad (67-84)
  set(15,69,'^'); set(15,70,'^');
  box(14,72,14,75,'=');                      // Standplatz 13
  set(13,73,'o'); set(13,74,'o');
  set(9,74,'B');                             // Bonus: 4 über Standplatz 13
  set(15,78,'^'); set(15,79,'^');
  box(BODEN,82,H-1,84,'.');
  set(14,83,'o');
  set(15,81,'C');

  // F: Finale (85-103)
  box(14,87,14,90,'=');
  set(13,88,'o'); set(13,89,'o');
  set(11,92,'V');
  set(15,95,'L');
  set(15,98,'o');
  set(15,100,'C');
  set(15,102,'F');
  return fertig();
}

export const LEVELS = [
  { name:'Erste Schritte', baue: levelEins },
  { name:'Waldweg',        baue: levelZwei },
  { name:'Hoch hinaus',    baue: levelDrei },
];

/* Rückwärtskompatibel: baue() ohne Argument liefert Level 1 */
export function baue(nr=0){ return LEVELS[nr].baue(); }

if(import.meta.url === `file://${process.argv[1]}`){
  const nur = process.argv[2] ? [+process.argv[2]-1] : LEVELS.map((_,i)=>i);
  nur.forEach(i=>{
    console.log(`\n/* --- ${i+1}. ${LEVELS[i].name} --- */`);
    LEVELS[i].baue().forEach(z=>console.log(`    '${z}',`));
  });
}

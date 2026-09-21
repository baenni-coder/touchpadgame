/* ============================================================
   LEVEL BAUEN
   Erzeugt das Testlevel aus Abschnitten und gibt es als
   Zeilen-Strings aus. So lassen sich Höhen und Lücken exakt
   setzen, statt in einer Textwüste Punkte zu zählen.

   Zeichen:
     #  Boden          =  Plattform (von unten durchspringbar)
     ^  Stacheln       o  Münze
     B  Bonus-Münze (nur mit dem Doppelklick-Sprung erreichbar)
     L  Läufer (Gegner am Boden)      V  Flieger (Gegner in der Luft)
     C  Checkpoint     P  Start       F  Ziel        .  Luft

   Aufruf:  node tools/level-bauen.mjs
   ============================================================ */
export const B = 96, H = 14, BODEN = 12;
const LUFT_OBEN = 2;   // Leerzeilen über dem Level, damit Sprungziele ins Bild passen

export function baue(){
  const k = Array.from({length:H}, ()=> Array(B).fill('.'));
  const box = (r0,c0,r1,c1,z) => { for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++) if(k[r]&&c<B) k[r][c]=z; };
  const set = (r,c,z) => { if(k[r]&&c<B) k[r][c]=z; };

  box(BODEN,0,H-1,B-1,'#');                 // Grundboden, zwei Zeilen dick

  // ---- A: Laufen lernen (0-11) – bewusst ohne Gefahr ----
  set(11,1,'P');
  set(11,5,'o'); set(11,9,'o');

  // ---- B: kleine Stufen (12-22), je 1 Kachel höher ----
  box(11,13,11,14,'#');
  box(10,16,10,17,'#');
  box(9,19,9,21,'#');
  set(10,13,'o'); set(9,16,'o'); set(8,20,'o');
  set(8,21,'L');                             // erster Läufer, oben auf der Treppe

  // ---- C: Lücken und erste Stacheln (23-38) ----
  box(BODEN,26,H-1,27,'.');                  // Lücke, 2 breit
  set(11,31,'^');                            // Stachel auf dem Boden
  box(BODEN,34,H-1,36,'.');                  // Lücke, 3 breit
  set(11,24,'o'); set(10,26,'o'); set(9,31,'o'); set(10,35,'o');

  // ---- D: hohe Plattformen und ein Flieger (39-54) ----
  box(10,40,10,43,'=');
  box(8,45,8,48,'=');
  set(9,41,'o'); set(7,46,'o'); set(7,47,'o');
  set(3,46,'B');                             // Bonus: 4 Kacheln über der Plattform
  set(6,52,'V');                             // Flieger
  set(11,50,'o');

  // ---- E: Einweg-Plattformen gestapelt + Checkpoint (55-66) ----
  set(11,55,'C');
  box(10,56,10,61,'=');
  box(8,57,8,62,'=');
  set(9,58,'o'); set(7,59,'o'); set(7,60,'o');

  // ---- F: Abgrund und ein Läufer (67-78) ----
  set(11,67,'C');
  box(BODEN,70,H-1,72,'.');                  // Abgrund, 3 breit
  set(10,71,'o');
  set(11,75,'L');
  set(11,77,'o');

  // ---- G: Stachelfeld mit einer Plattform darüber (79-90) ----
  // Die Stacheln sind 2 breit: der Sprung von Spalte 80 auf 83 ist
  // 3 Kacheln weit und damit gerade noch sicher (gemessen: 3.93).
  set(11,81,'^'); set(11,82,'^');
  box(10,84,10,86,'=');                      // 2 Kacheln über dem Boden -> erreichbar
  set(11,89,'^');
  set(10,80,'o'); set(9,85,'o'); set(10,88,'o');
  set(5,85,'B');                             // Bonus: 4 Kacheln über der Plattform
  set(7,90,'V');                             // zweiter Flieger

  // ---- H: Ziel (91-95) ----
  set(11,91,'C');
  set(11,93,'F');

  // Zwei leere Zeilen oben anhängen: sonst klebt alles, was hoch liegt,
  // am oberen Bildrand und verschwindet hinter der Anzeigeleiste.
  const leer = '.'.repeat(B);
  return [...Array(LUFT_OBEN).fill(leer), ...k.map(z=>z.join(''))];
}

if(import.meta.url === `file://${process.argv[1]}`){
  baue().forEach(z=>console.log(`  '${z}',`));
}

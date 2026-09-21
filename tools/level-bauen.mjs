/* Erzeugt das Testlevel aus Abschnitten und gibt es als Zeilen-Strings aus.
   So lassen sich Höhen und Lücken exakt setzen, statt Punkte zu zählen. */
export const B = 72, H = 14, BODEN = 12;

export function baue(){
  const k = Array.from({length:H}, ()=> Array(B).fill('.'));
  const box = (r0,c0,r1,c1,z) => { for(let r=r0;r<=r1;r++) for(let c=c0;c<=c1;c++) if(k[r]&&c<B) k[r][c]=z; };
  const set = (r,c,z) => { if(k[r]&&c<B) k[r][c]=z; };

  // Grundboden (zwei Zeilen dick)
  box(BODEN,0,H-1,B-1,'#');

  // ---- A: Laufen (0-11) ----
  set(11,1,'P');
  set(11,5,'o'); set(11,9,'o');

  // ---- B: kleine Stufen (12-22), je 1 Kachel höher ----
  box(11,13,11,14,'#');       // Stufe 1
  box(10,16,10,17,'#');       // Stufe 2
  box(9,19,9,21,'#');         // Stufe 3
  set(10,13,'o'); set(9,16,'o'); set(8,20,'o');

  // ---- C: Lücken im Boden (23-35) ----
  box(BODEN,26,H-1,27,'.');   // Lücke 2 breit
  box(BODEN,31,H-1,33,'.');   // Lücke 3 breit (mit Anlauf)
  set(11,24,'o'); set(10,26,'o'); set(10,32,'o');

  // ---- D: hohe Plattformen (36-49), je 2 Kacheln höher ----
  box(10,37,10,40,'=');
  box(8,42,8,45,'=');
  set(9,38,'o'); set(7,43,'o'); set(7,44,'o');

  // ---- E: Einweg-Plattformen gestapelt (50-60) ----
  box(10,51,10,56,'=');
  box(8,52,8,57,'=');
  set(9,53,'o'); set(7,54,'o'); set(7,55,'o');

  // ---- F: Abgrund + Ziel (61-71) ----
  box(BODEN,63,H-1,65,'.');   // 3 breit, ohne Boden darunter -> Sturz
  set(10,64,'o');
  set(11,69,'F');

  return k.map(z=>z.join(''));
}

if(import.meta.url === `file://${process.argv[1]}`){
  baue().forEach(z=>console.log(`  '${z}',`));
}

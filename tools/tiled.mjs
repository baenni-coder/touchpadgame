/* ============================================================
   TILED-AUSTAUSCH
   Übersetzt zwischen den Levelkarten dieses Projekts und dem
   Format des Level-Editors "Tiled" (mapeditor.org, gratis,
   läuft lokal – es wird nichts hochgeladen).

     node tools/tiled.mjs export     schreibt tiled/*.json
     node tools/tiled.mjs import <datei.json>
                                     gibt die Karte als Zeilen aus
     node tools/tiled.mjs rundlauf   prüft Export + Import

   Aufbau der erzeugten Datei: zwei Kachelebenen über demselben
   Tileset (assets/atlas.png).
     "boden"   – Boden, Plattformen, Stacheln
     "sachen"  – Start, Ziel, Checkpoints, Münzen, Gegner
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { LEVELS } from './level-bauen.mjs';

const ZELLE = 16, SPALTEN_IM_ATLAS = 8, ZEILEN_IM_ATLAS = 5;

/* Zeichen -> Feldnummer im Atlas (siehe tools/atlas-bauen.mjs) */
const NACH_FELD = {
  '#': 24,   // boden_oben
  '=': 31,   // plattform_m
  '^': 23,   // stachel
  'o': 13,   // muenze0
  'B': 17,   // stern0
  'L':  8,   // kaefer0
  'V': 11,   // flieger0
  'A': 49,   // Liftplattform (Balken aus dem Kachelsatz)
  'C': 33,   // fahne_aus
  'P':  0,   // fuchs_steh
  'F': 35,   // ziel
};
/* Zurück: mehrere Felder können auf dasselbe Zeichen zeigen,
   weil der Editor auch die Kantenvarianten anbietet. */
const NACH_ZEICHEN = {
  24:'#', 25:'#', 26:'#', 27:'#', 28:'#', 29:'#',
  30:'=', 31:'=', 32:'=',
  23:'^',
  13:'o', 14:'o', 15:'o', 16:'o',
  17:'B', 18:'B', 19:'B', 20:'B',
  8:'L', 9:'L',
  11:'V', 12:'V',
  33:'C', 34:'C',
  49:'A',
  0:'P', 1:'P', 2:'P', 3:'P', 4:'P', 5:'P', 6:'P', 7:'P',
  35:'F',
};
const BODEN_ZEICHEN  = new Set(['#','=','^','A']);

/* ---------- Export: unsere Karte -> Tiled-JSON ---------- */
export function nachTiled(zeilen, name){
  const hoehe = zeilen.length, breite = Math.max(...zeilen.map(z=>z.length));
  const boden = [], sachen = [];
  for(let r=0;r<hoehe;r++){
    const z = (zeilen[r]||'').padEnd(breite,'.');
    for(let c=0;c<breite;c++){
      const zn = z[c];
      const feld = NACH_FELD[zn];
      const gid = feld===undefined ? 0 : feld+1;      // Tiled zählt ab 1
      if(BODEN_ZEICHEN.has(zn)){ boden.push(gid); sachen.push(0); }
      else                     { boden.push(0);   sachen.push(gid); }
    }
  }
  const ebene = (name, data, id) => ({
    id, name, type:'tilelayer', visible:true, opacity:1,
    x:0, y:0, width:breite, height:hoehe, data,
  });
  return {
    compressionlevel:-1, infinite:false, orientation:'orthogonal',
    renderorder:'right-down', tiledversion:'1.10', type:'map', version:'1.10',
    width:breite, height:hoehe, tilewidth:ZELLE, tileheight:ZELLE,
    nextlayerid:3, nextobjectid:1,
    properties:[{ name:'levelname', type:'string', value:name }],
    layers:[ ebene('boden', boden, 1), ebene('sachen', sachen, 2) ],
    tilesets:[{
      firstgid:1, name:'atlas', image:'../assets/atlas.png',
      imagewidth:  SPALTEN_IM_ATLAS*ZELLE,
      imageheight: ZEILEN_IM_ATLAS*ZELLE,
      tilewidth:ZELLE, tileheight:ZELLE, columns:SPALTEN_IM_ATLAS,
      tilecount:SPALTEN_IM_ATLAS*ZEILEN_IM_ATLAS, margin:0, spacing:0,
    }],
  };
}

/* ---------- Import: Tiled-JSON -> unsere Karte ---------- */
export function ausTiled(karte){
  if(karte.infinite) throw new Error('Unendliche Karten werden nicht unterstützt – in Tiled auf "endlich" umstellen.');
  const { width:breite, height:hoehe } = karte;
  const gitter = Array.from({length:hoehe}, ()=> Array(breite).fill('.'));
  const ebenen = karte.layers.filter(l=>l.type==='tilelayer');
  if(!ebenen.length) throw new Error('Keine Kachelebene gefunden.');

  // Erst den Boden, dann die Sachen darüber – so gewinnt ein Gegenstand
  const sortiert = [...ebenen].sort((a,b)=>
    (a.name==='boden'?0:1) - (b.name==='boden'?0:1));

  const unbekannt = new Set();
  for(const e of sortiert){
    const daten = e.data;
    if(!Array.isArray(daten)) throw new Error(`Ebene "${e.name}" ist komprimiert – in Tiled als "CSV" speichern.`);
    for(let i=0;i<daten.length;i++){
      let gid = daten[i];
      if(!gid) continue;
      gid = gid & 0x1FFFFFFF;                  // Spiegel-Bits abstreifen
      const zn = NACH_ZEICHEN[gid-1];
      if(zn===undefined){ unbekannt.add(gid-1); continue; }
      const r = Math.floor(i/breite), c = i%breite;
      gitter[r][c] = zn;
    }
  }
  if(unbekannt.size)
    console.warn(`   Hinweis: ${unbekannt.size} unbekannte Kachel(n) übersprungen (Felder ${[...unbekannt].join(', ')})`);
  return gitter.map(z=>z.join('').replace(/\.+$/,'').padEnd(breite,'.'));
}

/* ---------- Kommandozeile ---------- */
const befehl = process.argv[2];

if(befehl === 'export'){
  mkdirSync('tiled', { recursive:true });
  LEVELS.forEach((L,i)=>{
    const datei = `tiled/level${i+1}.json`;
    writeFileSync(datei, JSON.stringify(nachTiled(L.baue(), L.name), null, 1));
    console.log(`${datei} geschrieben – ${L.name}`);
  });
  console.log('\nIn Tiled öffnen, ändern, speichern. Zurück ins Spiel mit:');
  console.log('  node tools/tiled.mjs import tiled/level1.json');

}else if(befehl === 'import'){
  const datei = process.argv[3];
  if(!datei){ console.error('Bitte eine Datei angeben.'); process.exit(1); }
  const zeilen = ausTiled(JSON.parse(readFileSync(datei,'utf8')));
  zeilen.forEach(z=>console.log(`    '${z}',`));

}else if(befehl === 'rundlauf'){
  // Export und Import müssen sich gegenseitig aufheben.
  let schlecht = 0;
  LEVELS.forEach((L,i)=>{
    const vorher = L.baue();
    const nachher = ausTiled(nachTiled(vorher, L.name));
    const gleich = vorher.length===nachher.length &&
                   vorher.every((z,j)=>z.padEnd(nachher[j].length,'.')===nachher[j]);
    console.log(`${gleich?'✅':'❌'} ${i+1}. ${L.name}`);
    if(!gleich){
      schlecht++;
      vorher.forEach((z,j)=>{
        const n = nachher[j]||'';
        if(z.padEnd(n.length,'.')!==n){
          console.log(`   Zeile ${j} weicht ab:`);
          console.log(`     vorher:  ${z}`);
          console.log(`     nachher: ${n}`);
        }
      });
    }
  });
  console.log(schlecht ? `\n${schlecht} Level weichen ab.` : '\nExport und Import passen zusammen.');
  process.exit(schlecht ? 1 : 0);

}else{
  console.log('Aufruf: node tools/tiled.mjs export | import <datei> | rundlauf');
}

/* ============================================================
   ATLAS BAUEN
   Erzeugt assets/atlas.png – ein Spritesheet mit allen Figuren,
   Kacheln und Gegenständen, je 16x16 Pixel.

   Warum überhaupt ein Atlas, wenn das Spiel auch ohne zeichnen
   kann? Weil damit der Austausch gegen fertige Sprites (z.B. die
   CC0-Pakete von kenney.nl) nur noch ein Datei- und Mapping-
   Wechsel ist – siehe docs/sprites.md.

   Die Sprites werden hier mit Canvas-Befehlen gezeichnet und
   danach auf eine feste Palette quantisiert, damit sie einen
   echten Pixel-Look bekommen statt weicher Vektorkanten.

   Aufruf:  node tools/atlas-bauen.mjs
   ============================================================ */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';

export const ZELLE = 16;
export const SPALTEN = 8;

/* Reihenfolge = Platz im Atlas (zeilenweise) */
export const NAMEN = [
  'fuchs_steh','fuchs_lauf0','fuchs_lauf1','fuchs_lauf2','fuchs_lauf3','fuchs_spring','fuchs_fall','fuchs_aua',
  'kaefer0','kaefer1','kaefer_platt','flieger0','flieger1','muenze0','muenze1','muenze2',
  'muenze3','stern0','stern1','stern2','stern3','herz_voll','herz_leer','stachel',
  'boden_oben','boden_mitte','boden_oben_l','boden_oben_r','boden_l','boden_r','plattform_l','plattform_m',
  'plattform_r','fahne_aus','fahne_an','ziel','wolke','busch','','',
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas id="a"></canvas>');

const daten = await page.evaluate(({ ZELLE, SPALTEN, NAMEN }) => {
  const zeilen = Math.ceil(NAMEN.length / SPALTEN);
  const cv = document.getElementById('a');
  cv.width = SPALTEN*ZELLE; cv.height = zeilen*ZELLE;
  const ctx = cv.getContext('2d');

  /* --- Palette: begrenzt, damit es nach Pixel-Art aussieht --- */
  const P = {
    fuchs:'#FF922B', fuchsD:'#D9711C', fuchsH:'#FFB05C', creme:'#FFF3E2',
    dunkel:'#2C2340', kaefer:'#9775FA', kaeferD:'#6B4FC4',
    flieger:'#E64980', fliegerH:'#F783AC',
    gold:'#FFC93C', goldD:'#E8A317', stern:'#9775FA', sternH:'#C9B6FF',
    erde:'#8B5E34', erdeD:'#6F4A28', gras:'#5FBF7E', grasH:'#8CE0A8',
    holz:'#C89A5B', holzH:'#E0BA80', metall:'#B8C0CC', metallH:'#E8EDF4',
    rot:'#FF6B6B', mint:'#2FC79B', grau:'#6B6280', weiss:'#FFFFFF',
  };

  const zelle = (i) => ({ x:(i%SPALTEN)*ZELLE, y:Math.floor(i/SPALTEN)*ZELLE });
  const px = (x,y,w,h,f) => { ctx.fillStyle=f; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };

  /* ---------- Der Fuchs ----------
     beinVersatz: Laufphase, koerperY: Hüpfen, ohrKnick: Sprung/Fall */
  function fuchs(ox,oy,{bein=0, koerperY=0, schwanz=0, aua=false, luft=0}={}){
    const y = oy + koerperY;
    // Schwanz
    px(ox+0, y+7+schwanz, 3,2, P.fuchsD);
    px(ox+1, y+6+schwanz, 3,3, P.fuchs);
    px(ox+0, y+6+schwanz, 2,2, P.creme);
    // Beine
    if(luft){ px(ox+5,y+12,2,2,P.fuchsD); px(ox+9,y+11,2,3,P.fuchsD); }
    else { px(ox+5-bein, y+12, 2,2, P.fuchsD); px(ox+9+bein, y+12, 2,2, P.fuchsD); }
    // Körper
    px(ox+3, y+7, 9,5, P.fuchs);
    px(ox+4, y+6, 7,1, P.fuchs);
    px(ox+4, y+10, 7,2, P.creme);          // heller Bauch
    px(ox+3, y+7, 9,1, P.fuchsH);          // Lichtkante oben
    // Kopf
    px(ox+8, y+3, 6,5, P.fuchs);
    px(ox+9, y+2, 4,1, P.fuchs);
    px(ox+13, y+5, 2,2, P.creme);          // Schnauze
    px(ox+14, y+5, 1,1, P.dunkel);         // Nase
    // Ohren
    px(ox+8, y+1, 2,2, P.fuchs);  px(ox+9, y+1, 1,1, P.dunkel);
    px(ox+12,y+1, 2,2, P.fuchs);  px(ox+12,y+1, 1,1, P.dunkel);
    // Auge
    if(aua){ px(ox+11,y+4, 2,1, P.dunkel); }
    else   { px(ox+11,y+4, 1,2, P.dunkel); }
  }

  /* ---------- Gegner ---------- */
  function kaefer(ox,oy,phase){
    const t = phase?1:0;
    px(ox+3+t, oy+13, 2,2, P.kaeferD);       // Beine
    px(ox+10-t,oy+13, 2,2, P.kaeferD);
    px(ox+3, oy+6, 10,7, P.kaefer);          // Panzer
    px(ox+4, oy+5, 8,1, P.kaefer);
    px(ox+7, oy+5, 2,8, P.kaeferD);          // Streifen
    px(ox+3, oy+6, 10,1, '#B49BFF');         // Lichtkante
    px(ox+4, oy+3, 1,3, P.kaeferD);          // Fühler
    px(ox+11,oy+3, 1,3, P.kaeferD);
    px(ox+9, oy+8, 3,3, P.weiss);            // Auge
    px(ox+10,oy+9, 2,2, P.dunkel);
  }
  function flieger(ox,oy,phase){
    const f = phase ? 0 : 3;
    px(ox+1, oy+4+f, 5,3, P.fliegerH);       // Flügel
    px(ox+10,oy+4+f, 5,3, P.fliegerH);
    px(ox+4, oy+6, 8,6, P.flieger);          // Körper
    px(ox+5, oy+5, 6,1, P.flieger);
    px(ox+6, oy+6, 4,6, P.fliegerH);         // heller Bauch
    px(ox+9, oy+7, 3,3, P.weiss);            // Auge
    px(ox+10,oy+8, 2,2, P.dunkel);
  }

  /* ---------- Gegenstände ---------- */
  function muenze(ox,oy,phase){
    // Grösser und flacher gedreht als früher: neben den 18er-Kacheln
    // wirkte die alte Münze wie ein dünner Strich.
    const br = [6,4,2.5,4][phase];
    px(ox+8-br, oy+2, br*2, 12, P.goldD);
    px(ox+8-br, oy+3, br*2, 10, P.gold);
    if(br>3){ px(ox+7, oy+5, 2,6, '#FFE9A8'); }
    else    { px(ox+8-br+0.5, oy+5, 1,6, '#FFE9A8'); }
  }
  function stern(ox,oy,phase){
    // Breite pulsiert, damit die Drehung im Spiel auch wirklich auffällt
    const w = [8,6,4,6][phase], g = [0,0,1,0][phase];
    const f = P.stern, h = P.sternH;
    px(ox+7, oy+2+g, 2, 6-g, f);                       // oberer Zacken
    px(ox+8-w/2, oy+6, w, 2, f);                       // waagerechter Balken
    px(ox+7, oy+8, 2, 5-g, f);                         // unterer Zacken
    if(w>5){ px(ox+8-w/2, oy+4, 2,2, f); px(ox+6+w/2, oy+4, 2,2, f);
             px(ox+8-w/2, oy+9, 2,2, f); px(ox+6+w/2, oy+9, 2,2, f); }
    px(ox+7, oy+6, 2,2, h);                            // Glanzpunkt
  }
  function herz(ox,oy,voll){
    // Deckend zeichnen! Halbtransparentes Grau fällt beim harten
    // Alpha-Schalten weiter unten komplett weg – das leere Herz wäre unsichtbar.
    const f = voll ? P.rot : '#7A7490';
    px(ox+4, oy+5, 3,2, f); px(ox+9, oy+5, 3,2, f);
    px(ox+3, oy+7, 10,2, f);
    px(ox+4, oy+9, 8,1, f);
    px(ox+5, oy+10, 6,1, f);
    px(ox+6, oy+11, 4,1, f);
    px(ox+7, oy+12, 2,1, f);
    if(voll) px(ox+5, oy+6, 2,2, '#FFB3B3');
  }

  /* ---------- Kacheln ---------- */
  function erdeGrund(ox,oy){
    px(ox,oy,16,16,P.erde);
    px(ox,oy+13,16,3,P.erdeD);
    px(ox+3,oy+5,2,2,P.erdeD); px(ox+11,oy+9,2,2,P.erdeD);
  }
  function bodenOben(ox,oy,kante){
    erdeGrund(ox,oy);
    px(ox,oy,16,5,P.gras);
    px(ox,oy,16,2,P.grasH);
    px(ox+3,oy+5,2,2,P.gras); px(ox+11,oy+5,2,2,P.gras);
    if(kante==='l'){ px(ox,oy+5,3,11,P.erdeD); px(ox,oy,3,5,'#4BA868'); }
    if(kante==='r'){ px(ox+13,oy+5,3,11,P.erdeD); px(ox+13,oy,3,5,'#4BA868'); }
  }
  function plattform(ox,oy,teil){
    px(ox,oy,16,5,P.holz);
    px(ox,oy,16,2,P.holzH);
    px(ox,oy+5,16,1,'rgba(0,0,0,.18)');
    if(teil==='l'){ px(ox,oy,2,5,P.erdeD); px(ox,oy,2,2,P.holz); }
    if(teil==='r'){ px(ox+14,oy,2,5,P.erdeD); px(ox+14,oy,2,2,P.holz); }
  }
  function stachel(ox,oy){
    for(let i=0;i<3;i++){
      const sx=ox+1+i*5;
      px(sx,   oy+12,5,2,P.metall);
      px(sx+1, oy+8, 3,4, P.metall);
      px(sx+2, oy+4, 1,4, P.metallH);
      px(sx+2, oy+8, 1,4, P.metallH);
    }
    px(ox,oy+14,16,2,'#8892A0');
  }
  function fahne(ox,oy,an){
    px(ox+6,oy+2,2,13,P.grau);
    if(an){ px(ox+8,oy+3,6,2,P.mint); px(ox+8,oy+5,4,2,P.mint); }
    else  { px(ox+8,oy+3,5,2,'rgba(107,98,128,.5)'); px(ox+8,oy+5,3,2,'rgba(107,98,128,.5)'); }
  }
  function ziel(ox,oy){
    px(ox+5,oy+1,2,14,P.grau);
    px(ox+7,oy+2,7,3,P.rot);
    px(ox+7,oy+5,5,3,P.rot);
    px(ox+7,oy+2,7,1,'#FF9999');
  }
  function wolke(ox,oy){
    px(ox+3,oy+6,10,4,P.weiss);
    px(ox+5,oy+4,6,2,P.weiss);
    px(ox+1,oy+8,14,2,P.weiss);
  }
  function busch(ox,oy){
    px(ox+3,oy+8,10,6,P.gras);
    px(ox+5,oy+6,6,3,P.gras);
    px(ox+5,oy+6,6,1,P.grasH);
    px(ox+2,oy+13,12,2,'#4BA868');
  }

  /* ---------- Alles an seinen Platz zeichnen ---------- */
  const z = n => zelle(NAMEN.indexOf(n));
  let p;
  p=z('fuchs_steh');   fuchs(p.x,p.y,{});
  p=z('fuchs_lauf0');  fuchs(p.x,p.y,{bein:0,  koerperY:0, schwanz:0});
  p=z('fuchs_lauf1');  fuchs(p.x,p.y,{bein:2,  koerperY:-1,schwanz:-1});
  p=z('fuchs_lauf2');  fuchs(p.x,p.y,{bein:0,  koerperY:0, schwanz:0});
  p=z('fuchs_lauf3');  fuchs(p.x,p.y,{bein:-2, koerperY:-1,schwanz:1});
  p=z('fuchs_spring'); fuchs(p.x,p.y,{luft:1, koerperY:-1, schwanz:-2});
  p=z('fuchs_fall');   fuchs(p.x,p.y,{luft:1, koerperY:1,  schwanz:2});
  p=z('fuchs_aua');    fuchs(p.x,p.y,{luft:1, aua:true, schwanz:2});
  p=z('kaefer0');      kaefer(p.x,p.y,0);
  p=z('kaefer1');      kaefer(p.x,p.y,1);
  p=z('kaefer_platt'); px(p.x+2,p.y+12,12,3,P.kaefer); px(p.x+4,p.y+11,8,1,P.kaeferD);
  p=z('flieger0');     flieger(p.x,p.y,0);
  p=z('flieger1');     flieger(p.x,p.y,1);
  for(let i=0;i<4;i++){ p=z('muenze'+i); muenze(p.x,p.y,i); }
  for(let i=0;i<4;i++){ p=z('stern'+i);  stern(p.x,p.y,i); }
  p=z('herz_voll');    herz(p.x,p.y,true);
  p=z('herz_leer');    herz(p.x,p.y,false);
  p=z('stachel');      stachel(p.x,p.y);
  p=z('boden_oben');   bodenOben(p.x,p.y);
  p=z('boden_mitte');  erdeGrund(p.x,p.y);
  p=z('boden_oben_l'); bodenOben(p.x,p.y,'l');
  p=z('boden_oben_r'); bodenOben(p.x,p.y,'r');
  p=z('boden_l');      erdeGrund(p.x,p.y); px(p.x,p.y,3,16,P.erdeD);
  p=z('boden_r');      erdeGrund(p.x,p.y); px(p.x+13,p.y,3,16,P.erdeD);
  p=z('plattform_l');  plattform(p.x,p.y,'l');
  p=z('plattform_m');  plattform(p.x,p.y,'m');
  p=z('plattform_r');  plattform(p.x,p.y,'r');
  p=z('fahne_aus');    fahne(p.x,p.y,false);
  p=z('fahne_an');     fahne(p.x,p.y,true);
  p=z('ziel');         ziel(p.x,p.y);
  p=z('wolke');        wolke(p.x,p.y);
  p=z('busch');        busch(p.x,p.y);

  /* Alpha hart schalten: keine weichen Halbtöne, das wirkt sonst matschig */
  const bild = ctx.getImageData(0,0,cv.width,cv.height);
  for(let i=3;i<bild.data.length;i+=4) bild.data[i] = bild.data[i] > 110 ? 255 : 0;
  ctx.putImageData(bild,0,0);

  return { png: cv.toDataURL('image/png'), breite: cv.width, hoehe: cv.height };
}, { ZELLE, SPALTEN, NAMEN });

const roh = Buffer.from(daten.png.split(',')[1], 'base64');
writeFileSync('assets/atlas.png', roh);
console.log(`assets/atlas.png geschrieben: ${daten.breite}x${daten.hoehe} px, ${roh.length} Bytes, ${NAMEN.filter(Boolean).length} Sprites`);
await browser.close();

/* ============================================================
   ATLAS ZEIGEN
   Öffnet ein Spritesheet vergrössert mit eingeblendeten
   Feldnummern – damit man beim Einhängen fremder Sprites die
   richtigen Nummern abzählen kann.

   Aufruf:  node tools/atlas-zeigen.mjs [datei.png] [zelle] [spalten]
   ============================================================ */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { readFileSync } from 'node:fs';

const datei   = process.argv[2] || 'assets/atlas.png';
const zelle   = +(process.argv[3] || 16);
const spalten = +(process.argv[4] || 8);
const b64 = readFileSync(datei).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport:{ width:1100, height:800 } });
await page.setContent(`<body style="margin:0;background:#2C2340;color:#fff;font:11px system-ui">
<canvas id="c" style="image-rendering:pixelated"></canvas>
<script>
const img=new Image(); img.src='data:image/png;base64,${b64}';
img.onload=()=>{
  const f=6, c=document.getElementById('c'), x=c.getContext('2d');
  c.width=img.width*f; c.height=img.height*f;
  x.imageSmoothingEnabled=false;
  x.drawImage(img,0,0,c.width,c.height);
  x.font='bold 11px system-ui'; x.textAlign='center';
  const sp=${spalten}, z=${zelle};
  for(let r=0;r*z<img.height;r++) for(let s=0;s<sp && s*z<img.width;s++){
    x.strokeStyle='rgba(255,255,255,.28)'; x.lineWidth=1;
    x.strokeRect(s*z*f, r*z*f, z*f, z*f);
    const nr=r*sp+s;
    x.fillStyle='rgba(0,0,0,.65)'; x.fillRect(s*z*f+2, r*z*f+2, 22, 13);
    x.fillStyle='#FFC93C'; x.fillText(nr, s*z*f+13, r*z*f+12);
  }
  document.title='fertig';
};
<\/script></body>`);
await page.waitForFunction(()=>document.title==='fertig');
await page.screenshot({ path:'atlas-nummern.png', fullPage:true });
console.log('atlas-nummern.png geschrieben – dort stehen die Feldnummern.');
await browser.close();

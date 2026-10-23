/* ============================================================
   BRÜCKE
   Das Einzige, was die beiden Teile voneinander wissen.

   Aufgaben:
     - gemeinsamer Speicherstand auf diesem Gerät
     - Umschalten zwischen Stationskarte und Jump-&-Run
     - Freischalten des Jump-&-Run über gesammelte Sterne
     - Lehrer-Bereich

   DATENSCHUTZ: Gespeichert werden ausschliesslich Zahlen –
   Sterne, erledigte Level, Punktestände. Keine Namen, nichts
   Persönliches. Es wird nichts gesendet; die Datei lädt zur
   Laufzeit nichts nach.
   ============================================================ */
window.BRUECKE = (function(){
  const SCHLUESSEL = 'touchpad-abenteuer';
  const STERNE_FUER_SPRUNG_STANDARD = 12;   // vier geschaffte Übungslevel

  let stand = {
    sterne: 0,
    stationen: {},          // Stationskürzel -> Liste erledigter Level
    abzeichen: [],          // Stationen, deren Ernstfall geschafft ist
    ton: 1,                 // 1 = Ton an, 0 = aus. Gilt für beide Teile.
    schwelle: STERNE_FUER_SPRUNG_STANDARD,
  };
  let teilStationen = null, teilSprung = null;   // Rückrufe der beiden Teile

  /* ---------- Speichern ---------- */
  function laden(){
    try{
      const roh = localStorage.getItem(SCHLUESSEL);
      if(!roh) return;
      const g = JSON.parse(roh);
      if(typeof g.sterne === 'number') stand.sterne = g.sterne;
      if(g.stationen && typeof g.stationen === 'object') stand.stationen = g.stationen;
      if(Array.isArray(g.abzeichen)) stand.abzeichen = g.abzeichen;
      if(typeof g.ton === 'number') stand.ton = g.ton ? 1 : 0;
      if(typeof g.schwelle === 'number') stand.schwelle = g.schwelle;
    }catch(e){ /* privates Fenster o.ä. – dann eben ohne Speicherstand */ }
  }
  function sichern(){
    try{ localStorage.setItem(SCHLUESSEL, JSON.stringify(stand)); }catch(e){}
  }

  /* Sofort laden, nicht erst in starten(): die beiden Teile fragen den
     Stand schon ab, während sie sich aufbauen – und das ist vor dem
     Aufruf von starten() am Ende der Datei. */
  laden();

  /* ---------- Umschalten ---------- */
  const el = id => document.getElementById(id);
  function zeigen(welcher){
    el('teil-stationen').hidden = welcher !== 'stationen';
    el('teil-sprung').hidden    = welcher !== 'sprung';
    window.scrollTo(0,0);
  }

  /* ---------- Lehrer-Bereich ----------
     Erreichbar über die Taste L oder einen langen Druck auf den
     Sternezähler – absichtlich nichts, was ein Kind zufällig trifft. */
  function lehrerOeffnen(){
    if(document.querySelector('.lehrer-hg')) return;
    const hg = document.createElement('div');
    hg.className = 'lehrer-hg';
    hg.innerHTML = `
      <div class="lehrer">
        <h2>Für die Lehrperson</h2>
        <p class="unter">Diese Einstellungen gelten nur auf diesem Gerät.</p>

        <div class="reihe">
          <span class="wert">Fuchs-Sprung ab</span>
          <button data-tu="weniger">−</button>
          <span class="wert" id="lehrer-schwelle">${stand.schwelle} ⭐</span>
          <button data-tu="mehr">+</button>
        </div>
        <div class="reihe">
          <button data-tu="sprungAuf" class="stark">Alle Jump-&-Run-Level öffnen</button>
        </div>
        <div class="reihe">
          <button data-tu="sterne10">+10 Sterne</button>
          <button data-tu="sterneNull">Sterne zurücksetzen</button>
        </div>
        <div class="reihe">
          <button data-tu="allesLoeschen" class="warn">Ganzen Fortschritt löschen</button>
        </div>

        <p class="hinweis">
          Gespeichert werden nur Zahlen – keine Namen, nichts Persönliches.
          Alles bleibt auf diesem Gerät und wird nirgendwohin gesendet.
          Mit „Ganzen Fortschritt löschen“ ist der Speicher wieder leer,
          etwa bevor das Gerät an ein anderes Kind geht.
        </p>
        <p class="hinweis" style="border-top:none;padding-top:4px">
          <strong>Touchpad-Abenteuer</strong> · Andreas Bänninger, PICTS BeLoSe<br>
          Weitergabe und Bearbeitung erlaubt unter Namensnennung und gleichen Bedingungen (Creative Commons BY-SA 4.0).<br>
          Grafik: Kenney (kenney.nl), gemeinfrei (CC0). Figur, Münzen,
          Klänge und Musik eigens erstellt.
        </p>
        <div class="reihe" style="justify-content:flex-end;margin-top:12px">
          <button data-tu="zu" class="stark">Schliessen</button>
        </div>
      </div>`;
    hg.addEventListener('click', e=>{
      if(e.target === hg){ hg.remove(); return; }
      const tu = e.target.dataset && e.target.dataset.tu;
      if(!tu) return;
      if(tu === 'zu'){ hg.remove(); return; }
      if(tu === 'mehr' || tu === 'weniger'){
        stand.schwelle = Math.max(0, stand.schwelle + (tu==='mehr' ? 3 : -3));
        el('lehrer-schwelle').textContent = stand.schwelle + ' ⭐';
        sichern(); if(teilStationen) teilStationen.renderHome();
        return;
      }
      if(tu === 'sprungAuf'){ if(teilSprung) teilSprung.alleFreischalten(); e.target.textContent = 'Geöffnet ✓'; return; }
      if(tu === 'sterne10' || tu === 'sterneNull'){
        // Immer über den Stationsteil gehen: dort lebt die Zahl.
        const neu = tu === 'sterne10' ? stand.sterne + 10 : 0;
        if(teilStationen) teilStationen.sterneSetzen(neu);
        else { stand.sterne = neu; sichern(); }
        return;
      }
      if(tu === 'allesLoeschen'){
        if(!e.target.dataset.sicher){
          e.target.dataset.sicher = '1';
          e.target.textContent = 'Wirklich alles löschen?';
          return;
        }
        stand = { sterne:0, stationen:{}, abzeichen:[], ton:1,
                  schwelle: STERNE_FUER_SPRUNG_STANDARD };
        try{ localStorage.removeItem(SCHLUESSEL); localStorage.removeItem('fuchssprung'); }catch(err){}
        if(teilSprung) teilSprung.fortschrittLoeschen();
        hg.remove();
        location.reload();
      }
    });
    document.body.appendChild(hg);
  }

  /* Den gemeinsamen Ton-Zustand an beide Teile weitergeben. Die
     Teile melden dabei nicht zurück, sonst drehte sich das im Kreis. */
  function tonVerteilen(){
    const an = stand.ton === 1;
    if(teilStationen && teilStationen.tonSetzen && teilStationen.tonLesen
       && teilStationen.tonLesen() !== an) teilStationen.tonSetzen(an);
    if(teilSprung && teilSprung.tonSetzen && teilSprung.tonLesen
       && teilSprung.tonLesen() !== an) teilSprung.tonSetzen(an);
  }

  /* ---------- Nach aussen ---------- */
  return {
    /* -- vom Stationsteil -- */
    sterneFuerSprung: ()=> stand.schwelle,
    sterneMelden(sterne, levelsDone, abzeichen){
      stand.sterne = sterne;
      if(levelsDone){
        stand.stationen = {};
        Object.keys(levelsDone).forEach(k=>{
          stand.stationen[k] = Array.from(levelsDone[k] || []);
        });
      }
      if(Array.isArray(abzeichen)) stand.abzeichen = abzeichen;
      sichern();
    },
    standUebernehmen(state){
      state.totalStars = stand.sterne;
      Object.keys(stand.stationen).forEach(k=>{
        if(state.levelsDone[k]) stand.stationen[k].forEach(n=>state.levelsDone[k].add(n));
      });
      if(state.abzeichen) stand.abzeichen.forEach(id=>state.abzeichen.add(id));
    },
    stationenBereit(api){ teilStationen = api; tonVerteilen(); },

    /* Ein Schalter für beide Teile. Vorher hatte jeder Teil seinen
       eigenen: der Knopf auf der Karte liess die Spielmusik laufen,
       der Knopf im Spiel die Geräusche der Übungen. */
    tonGemeldet(an){
      stand.ton = an ? 1 : 0;
      sichern();
      tonVerteilen();
    },
    tonLesen: ()=> stand.ton === 1,
    sterneSetzen(n){ if(teilStationen) teilStationen.sterneSetzen(n); else { stand.sterne = n; sichern(); } },
    sterneLesen(){ return teilStationen ? teilStationen.sterneLesen() : stand.sterne; },
    zumSprung(){
      zeigen('sprung');
      if(teilSprung){ teilSprung.zumTitel(); teilSprung.musikStart(); }
    },

    /* -- vom Jump-&-Run -- */
    sprungBereit(api){ teilSprung = api; tonVerteilen(); },
    /* Für das Diplom: wie viele Jump-&-Run-Level sind geschafft? */
    sprungStand(){
      if(!teilSprung || !teilSprung.fortschrittLesen) return null;
      return teilSprung.fortschrittLesen();
    },
    zurKarte(){
      zeigen('stationen');
      if(teilSprung) teilSprung.musikStopp();   // auf der Karte ist es still
      // goHome statt renderHome: räumt ein noch laufendes Übungsspiel
      // auf und schaltet den Stationsteil wirklich auf die Karte.
      if(teilStationen) (teilStationen.goHome || teilStationen.renderHome)();
    },

    /* -- Start -- */
    starten(){
      zeigen('stationen');
      if(teilStationen) teilStationen.renderHome();
      addEventListener('keydown', e=>{
        if((e.key === 'l' || e.key === 'L') && !e.repeat) lehrerOeffnen();
      });
      // Langer Druck auf den Sternezähler öffnet ebenfalls den Lehrer-Bereich
      const zaehler = document.querySelector('#teil-stationen .starcount');
      if(zaehler){
        let t = null;
        const los = ()=>{ t = setTimeout(lehrerOeffnen, 1200); };
        const halt = ()=>{ if(t) clearTimeout(t); t = null; };
        zaehler.addEventListener('pointerdown', los);
        ['pointerup','pointerleave','pointercancel'].forEach(n=>zaehler.addEventListener(n, halt));
      }
    },
    lehrerOeffnen,
  };
})();

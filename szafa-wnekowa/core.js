/* =============================================================
   core.js — czysty model parametryczny.
   Zero DOM, zero THREE. Wszystko poniżej to funkcje danych.
   ============================================================= */

export const FIXED = { t:18, plinth:80, gapBack:10, gapTop:12, beamClear:10, fg:3 };

/** Pomiary z kartki (mm). null = nie zmierzone. */
export const SHEET = {
  A1:935, A2:944, A3:941, A4:913, A5:913, A6:909,
  B1:536, B2:538, B3:532, B4:542, B5:535, B6:527,
  C1:411, C2:421, C3:418, C4:396, C5:385, C6:394,
  C7:392, C8:396, C9:400, C10:385, C11:390, C12:392,
  G1d:172, G1s:168, G1g:163,
  EL1:2422, EL2:2433, EL3:2432, EL4:2443,
  ER1:2438, ER2:2442, ER3:2435, ER4:2439,
  F1:2606, F2:2610,
  G2L:369, G2R:350,
};

/* Decyzje konstrukcyjne – zamknięte. Były suwakami, dopóki wymiary nie były
   pewne; teraz są stałymi, bo pomiary są zrobione i projekt jest zamrożony. */
export const SETTINGS = Object.freeze({
  D_ward:570,      // głębokość korpusu od ściany tylnej
  doorMargin:25,   // margines przy opasce drzwi
  H_LOW:1900,      // wysokość podziału korpusu
  maxDoorW:560,    // maks. szerokość jednego frontu
  slackL:8, slackR:5,
  railGap:50,      // od spodu wieńca górnego do wierzchu drążka (miejsce na haczyk wieszaka)
  shoeShelf:300,   // półka na buty w lewej skrzyni, od spodu korpusu
  nicheN:5,        // półek w niszy
  shelvesR:4,      // półek w prawej dolnej skrzyni – decyzja z 2 października
  beamProj:300,    // wysięg podciągu (G3)
  splitCarc:true,  // korpus dzielony na dolny i górny
});

export const HOLE = {
  hole5 : { d:5,   depth:10, color:'#3a3f45', label:'⌀5×10 – kołki półek (system 32)' },
  conf7 : { d:7,   depth:0,  color:'#b03a2e', label:'⌀7 przelotowy – konfirmat' },
  conf45: { d:4.5, depth:40, color:'#b03a2e', label:'⌀4,5×40 w czole – konfirmat' },
  cup35 : { d:35,  depth:13, color:'#1f5fd6', label:'⌀35×13 – puszka zawiasu' },
  plate : { d:3,   depth:10, color:'#e07b00', label:'⌀3×10 – pilot pod wkręt prowadnika zawiasu' },
};

const num  = (m,k) => typeof m[k] === 'number' ? m[k] : null;
const list = (m,ks) => ks.map(k => num(m,k)).filter(v => v !== null);
const mn = a => a.length ? Math.min(...a) : null;
const mx = a => a.length ? Math.max(...a) : null;
export const r0 = n => Math.round(n);

/* ---------- 1. pomiary → parametry ---------- */
export function derive(meas, set){
  const Af = list(meas,['A1','A2','A3']), Aa = list(meas,['A1','A2','A3','A4','A5','A6']);
  const Bf = list(meas,['B1','B2','B3']), Ba = list(meas,['B1','B2','B3','B4','B5','B6']);
  const Call = list(meas, Array.from({length:12},(_,i)=>'C'+(i+1)));
  const Cstub = list(meas,['C4','C5','C6','C7','C8','C9']);
  const Cwall = list(meas,['C1','C2','C3']);
  const G1 = list(meas,['G1d','G1s','G1g']);
  const EL = list(meas,['EL1','EL2','EL3','EL4']);
  const ER = list(meas,['ER1','ER2','ER3','ER4']);

  const p = { ...FIXED, ...set };
  p.W_L     = mn(Af) ?? 1000;      p.W_L_min = mn(Aa) ?? p.W_L;   p.W_L_max = mx(Af) ?? p.W_L;
  p.W_R_tot = mn(Bf) ?? 800;       p.W_R_min = mn(Ba) ?? p.W_R_tot;
  p.D       = mn(Call) ?? 600;     p.D_max   = mx(Call) ?? p.D;
  p.D_stub  = mx(Cstub) ?? p.D;    p.D_wall_L = mx(Cwall) ?? p.D;
  p.T_S     = mx(G1) ?? 300;       p.T_S_min = mn(G1) ?? p.T_S;
  p.H_C_L   = mn(EL) ?? 2422;      p.H_C_L_max = mx(EL) ?? p.H_C_L;
  p.H_C_R   = mn(ER) ?? 2435;      p.H_C_R_max = mx(ER) ?? p.H_C_R;
  p.BZ_L = num(meas,'BZL') ?? (p.H_C_L_max - (num(meas,'G2L') ?? 360));
  p.BZ_R = num(meas,'BZR') ?? (p.H_C_R_max - (num(meas,'G2R') ?? 360));
  p.BZ   = Math.min(p.BZ_L, p.BZ_R);
  return p;
}

/* ---------- 2. parametry → geometria ---------- */
export function geometry(p){
  const t = p.t;
  const S0 = p.W_L, S1 = S0 + p.T_S, DRt = S1 + p.W_R_tot;
  const wL = p.W_L_min - 2*p.slackL;
  const wR = p.W_R_min - p.doorMargin - 2*p.slackR;
  const carc = { L:[S0 - p.slackL - wL, S0 - p.slackL], R:[S1 + p.slackR, S1 + p.slackR + wR] };
  const dB = p.gapBack, dF = p.D_ward, depth = dF - dB;
  const deep = dF > p.D_stub + 60;
  const zF = Math.min(p.H_C_L, p.H_C_R) - p.gapTop;
  const hc = { L:p.H_C_L, R:p.H_C_R };
  const zTop = k => Math.min(hc[k] - p.gapTop, zF);
  const wallX = S0 - p.W_L_max;
  const sideGap = carc.L[0] - wallX;
  const nx = [carc.L[1], carc.R[0]];
  const nW = nx[1] - nx[0], nD0 = p.D_stub, nD1 = dF, nDep = nD1 - nD0;
  const nTop = Math.min(p.BZ - p.beamClear, zF);
  const X_left  = deep ? carc.L[0] : 0;
  const X_right = deep ? carc.R[1] : DRt - p.doorMargin;
  const topStrip = Math.max(p.H_C_L, p.H_C_R) - zF;
  return { S0,S1,DRt,carc,wL,wR,dB,dF,depth,deep,zF,hc,zTop,wallX,sideGap,
           nx,nW,nD0,nD1,nDep,nTop,X_left,X_right,topStrip, t };
}

/* ---------- 3. geometria → formatki (JEDYNE źródło brył) ---------- */
/* Jedyny parametr poza projektem: sposób mocowania pleców. Liczba półek
   jest już stałą w SETTINGS. */
export const DEFAULT_OPTS = Object.freeze({
  backs: 'nail',    // 'nail' = plecy nakładane na tył, 'groove' = w rowku (zakład musi frezować)
});

/* Otwory pod kołki półek wierci się samemu, tylko tam, gdzie stoi półka.
   Siatka 32 mm i tak zostaje: każda półka ląduje na niej, więc szablon
   systemowy pozwoli kiedyś dowiercić pozycję pośrednią bez liczenia. */
const GRID0 = 41, STEP = 32, PIN = 3;   // oś kołka 3 mm pod spodem półki
const snapHole = x => GRID0 + Math.round((x - GRID0) / STEP) * STEP;

/* Zawiasy. Liczba według tabeli Bluma (wysokość drzwi do ok. 1000 / 1500 /
   2000 / 2500 mm → 2 / 3 / 4 / 5 zawiasów; nasze fronty mają < 500 mm
   szerokości i ok. 10 kg, więc waga niczego nie podnosi). */
const hingeCount = H => H <= 1000 ? 2 : H <= 1500 ? 3 : H <= 2000 ? 4 : 5;
/* Prowadnik krzyżowy siedzi na boku korpusu w linii 37 mm od przodu – tej
   samej, co kołki półek. Oś zawiasu musi być min. HCLR od każdej półki i od
   każdego otworu pod jej kołek (ok. 25 mm to pół prowadnika, reszta zapasu). */
const HCLR = 40, PLATE_DY = 16, PLATE_Y = 37;
/* Rozstaw jest symetryczny względem środka frontu: [e, m, …, H-m, H-e].
   Dzięki temu front nie ma „góry” – zakład nie pomyli, od której krawędzi
   mierzyć puszki. Szukamy e możliwie blisko 100 mm i m blisko równego
   rozstawu, tak żeby żadna oś nie trafiła w strefę półki. */
function placeHinges(H, zBot, keepOut, lim){
  const n = hingeCount(H);
  const ok = a => a - HCLR >= lim[0] && a + HCLR <= lim[1]
    && keepOut.every(([lo,hi]) => a <= lo - HCLR || a >= hi + HCLR);
  const make = (e,m) => ({ 2:[e, H-e], 3:[e, H/2, H-e],
                           4:[e, m, H-m, H-e], 5:[e, m, H/2, H-m, H-e] })[n];
  let best = null;
  for (let e = 80; e <= 140; e++) {
    const ideal = n >= 4 ? e + (H - 2*e)/(n - 1) : null;
    const ms = n >= 4 ? Array.from({length:401}, (_,i) => Math.round(ideal) - 200 + i) : [null];
    for (const m of ms) {
      const xs = make(e, m);
      if (n >= 4 && (m - e < 150 || H - 2*m < 150)) continue;
      if (!xs.every(x => ok(zBot + x))) continue;
      const score = 2*Math.abs(e - 100) + (n >= 4 ? Math.abs(m - ideal) : 0);
      if (!best || score < best.score) best = { xs, score };
    }
  }
  if (!best) throw new Error(`Brak miejsca na zawiasy we froncie ${H} mm`);
  return best.xs;
}

export function buildPanels(p, opts = DEFAULT_OPTS){
  opts = { ...DEFAULT_OPTS, ...opts };
  const layout = { rail:null, bays:{} };
  const g = geometry(p), t = p.t, { carc, dB, dF, depth } = g;
  const panels = [], joints = [], fittings = [], sides = {};
  let uid = 0;
  const add = o => {
    o.id = 'f' + (++uid);
    o.t   ??= t;
    o.mat ??= 'Płyta laminowana 18 mm';
    o.feats ??= [];
    o.qty ??= 1;
    o.inst ??= [o.origin];
    o.stage ??= (o.grp === 'korpus' || o.grp === 'plecy') ? 1 : 2;
    panels.push(o); return o;
  };
  const world = (pn,x,y,z,org) => {
    const o = org ?? pn.origin;
    return [0,1,2].map(i => o[i] + pn.ex[i]*x + pn.ey[i]*y + pn.ez[i]*z);
  };
  
  for (const k of ['L','R']) {
    const nm = k==='L' ? 'lewa' : 'prawa';
    const [x0,x1] = carc[k], wIn = x1 - x0 - 2*t;
    if (x1 - x0 < 150) continue;
    const segs = p.splitCarc
      ? [['dolna', p.plinth, p.H_LOW], ['górna', p.H_LOW, g.zTop(k)]]
      : [['', p.plinth, g.zTop(k)]];

    segs.forEach(([sn,z0,z1]) => {
      if (z1 - z0 < 100) return;
      const h = z1 - z0, lab = sn ? ' ' + sn : '', tag = k + (sn ? sn[0].toUpperCase() : 'X');
      const W = depth, groove = opts.backs === 'groove';

      /* najpierw układ wnętrza – boki dostają otwory tylko pod te półki */
      const hang = k==='L' && sn!=='górna' && depth>=500 && wIn>=520;
      const n = sn==='górna' ? 0 : hang ? 1 : k==='R' ? p.shelvesR : 2;
      const in0 = z0 + t, in1 = z1 - t;
      let nominal = [];
      if (hang) nominal = [z0 + p.shoeShelf];
      else if (n) {
        /* Dolna półka prawej skrzyni stoi na tej samej wysokości co półka na buty
           w lewej (oba korpusy zaczynają się na cokole, więc otwór jest ten sam).
           Pozostałe półki: równy rozstaw w krotności 32 mm nad nią; spośród dwóch
           najbliższych rozstawów wybieramy ten z najmniejszym rozrzutem komór. */
        const ax = snapHole(p.shoeShelf - PIN), a0 = z0 + ax + PIN, m = n - 1;
        const total = in1 - (a0 + t) - m*t, ideal = total/(m+1) + t;
        let best = null;
        for (const S of [Math.floor(ideal/STEP)*STEP, Math.ceil(ideal/STEP)*STEP]) {
          const gs = [a0 - in0, ...Array(m).fill(S - t), in1 - (a0 + m*S + t)];
          const spread = Math.max(...gs) - Math.min(...gs);
          if (gs.at(-1) > 150 && (!best || spread < best.spread)) best = { S, spread };
        }
        for (let i=0;i<n;i++) nominal.push(a0 + i*(best?.S ?? 0)); }
      const holeX = nominal.map(zb => snapHole(zb - z0 - PIN));
      const shelfZ = holeX.map(x => z0 + x + PIN);
      const gaps = []; let prev = in0;
      shelfZ.forEach(zb => { gaps.push(zb - prev); prev = zb + t; });
      if (hang) {
        const top = in1 - p.railGap - 28;
        layout.rail = { z: top + 14, clearBelow: top + 14 - (shelfZ[0] + t) };
      } else gaps.push(in1 - prev);
      layout.bays[tag] = { n: shelfZ.length, gaps, inner: in1 - in0, hang, shelfZ, in0, in1, z0 };

      const side = (which, xFace, dir) => {
        const feats = [];
        [9, h-9].forEach(xc => [50, W/2, W-50].forEach(y => feats.push({ t:'conf7', x:xc, y, face:'B' })));
        [37, W-37].forEach(y => holeX.forEach(x => feats.push({ t:'hole5', x, y, face:'A' })));
        if (groove) feats.push({ t:'groove', x0:0, x1:h, y0:10, y1:14, face:'A', depth:10 });
        return add({ grp:'korpus', code:`${tag}-BOK${which}`, name:`Bok ${which==='L'?'lewy':'prawy'} – skrzynia ${nm}${lab}`,
          Lg:h, Wd:W, edges:{D1:0,D2:2,S1:0,S2:0}, feats,
          faceNote:'lico A (z nawiertami ⌀5) do środka skrzyni',
          origin:[xFace,dB,z0], ex:[0,0,1], ey:[0,1,0], ez:[dir,0,0] });
      };
      const bL = side('L', x0, 1), bP = side('P', x1, -1);
      sides[tag] = { L:bL, P:bP };

      const top = (which, zFace, dir) => {
        const feats = [];
        [0, wIn].forEach(xe => [50, W/2, W-50].forEach(y => feats.push({ t:'conf45', x:xe, y, face:'edge' })));
        if (groove) feats.push({ t:'groove', x0:0, x1:wIn, y0:10, y1:14, face:'A', depth:10 });
        return add({ grp:'korpus', code:`${tag}-W${which[0].toUpperCase()}`, name:`Wieniec ${which} – skrzynia ${nm}${lab}`,
          Lg:wIn, Wd:W, edges:{D1:0,D2:2,S1:0,S2:0}, feats,
          faceNote:'nawierty ⌀4,5 w obu czołach (krawędzie S1 i S2)',
          origin:[x0+t,dB,zFace], ex:[1,0,0], ey:[0,1,0], ez:[0,0,dir] });
      };
      const wD = top('dolny', z0, 1), wG = top('górny', z1, -1);

      [[bL,wD,9],[bL,wG,h-9],[bP,wD,9],[bP,wG,h-9]].forEach(([s,w,xc]) => {
        [50, W/2, W-50].forEach(y => joints.push({
          a: world(s,xc,y,0), b: world(s,xc,y,t+42), pa:s.id, pb:w.id }));
      });

      if (hang) {
        const zr = layout.rail.z - 14, dm = (dB+dF)/2;
        fittings.push({ kind:'rail', x0:x0+t, x1:x1-t, d0:dm-14, d1:dm+14, z0:zr, z1:zr+28 });
      }
      if (shelfZ.length) {
        const inst = shelfZ.map(z => [x0+t, dB, z]);
        add({ grp:'korpus', code:`${tag}-POL`, name:`Półka ${hang ? 'na buty' : 'przestawna'} – skrzynia ${nm}${lab}`,
          Lg:wIn-1, Wd:depth-25, edges:{D1:0,D2:2,S1:0,S2:0}, qty:shelfZ.length, inst, origin:inst[0],
          faceNote:'bez nawiertów – leży na kołkach', ex:[1,0,0], ey:[0,1,0], ez:[0,0,1] });
      }
      add(groove
        ? { grp:'plecy', code:`${tag}-PLE`, name:`Plecy – skrzynia ${nm}${lab}`,
            Lg:h-2*(t-10), Wd:x1-x0-2*(t-10), t:3, mat:'HDF 3 mm biała',
            edges:{D1:0,D2:0,S1:0,S2:0}, faceNote:'wsuwane w rowek 4×10 mm',
            origin:[x0+t-10,dB-3,z0+t-10], ex:[0,0,1], ey:[1,0,0], ez:[0,1,0] }
        : { grp:'plecy', code:`${tag}-PLE`, name:`Plecy – skrzynia ${nm}${lab}`,
            Lg:h-4, Wd:x1-x0-4, t:3, mat:'HDF 3 mm biała',
            edges:{D1:0,D2:0,S1:0,S2:0}, faceNote:'nakładane na tył skrzyni, 2 mm cofnięte od krawędzi; gwoździki lub zszywki co 100–150 mm',
            origin:[x0+2,dB-3,z0+2], ex:[0,0,1], ey:[1,0,0], ez:[0,1,0] });
    });
    fittings.push({ kind:'plinth', x0, x1, d0:dF-45-t, d1:dF-45, z0:0, z1:p.plinth });
  }

  /* nisza */
  if (g.deep && g.nW > 60 && g.nDep > 60) {
    add({ grp:'nisza', code:'NIS-PLE', name:'Nisza – plecy', Lg:g.nTop, Wd:g.nW-4,
      edges:{D1:0,D2:2,S1:0,S2:2}, faceNote:'DRUGI ETAP – zmierz po ustawieniu skrzyń. Słoje pionowo: przy 2064 mm w poprzek arkusza (2070) by się nie zmieściła',
      origin:[g.nx[0]+2,g.nD0,0], ex:[0,0,1], ey:[1,0,0], ez:[0,1,0] });
    const inst = [[g.nx[0], g.nD0+t, p.plinth]];
    for (let i=1;i<=p.nicheN;i++)
      inst.push([g.nx[0], g.nD0+t, p.plinth+t+(g.nTop-p.plinth-t)*i/(p.nicheN+1)]);
    add({ grp:'nisza', code:'NIS-POL', name:'Nisza – półka', Lg:g.nW, Wd:g.nDep-8,
      edges:{D1:0,D2:2,S1:0,S2:0}, qty:p.nicheN+1, inst, origin:inst[0],
      faceNote:'DRUGI ETAP – w I etapie zamów +10 mm i dotnij boki',
      ex:[1,0,0], ey:[0,1,0], ez:[0,0,1] });
    if (g.nTop < g.zF - 20)
      add({ grp:'nisza', code:'NIS-DAS', name:'Nisza – daszek pod podciągiem',
        Lg:g.nW, Wd:g.nDep, edges:{D1:0,D2:2,S1:0,S2:0},
        origin:[g.nx[0],g.nD0+t,g.nTop], ex:[1,0,0], ey:[0,1,0], ez:[0,0,1] });
  }

  /* fronty */
  const fd0 = dF + 2;
  for (const k of ['L','R']) {
    const [x0,x1] = carc[k]; if (x1-x0 < 150) continue;
    const n = Math.max(1, Math.ceil((x1-x0)/p.maxDoorW)), w = (x1-x0)/n;
    const rows = [];
    for (let i=0;i<n;i++) {
      const a = x0+i*w+p.fg/2, b = x0+(i+1)*w-p.fg/2;
      const hinge = (n===1 || i<n/2) ? 'L' : 'P';
      rows.push({ a, b, hinge, low:[p.plinth+p.fg, p.H_LOW-p.fg/2], up:[p.H_LOW+p.fg/2, g.zF] });
    }
    for (const part of ['low','up']) {
      /* Wysokości zawiasów są wspólne dla całego rzędu frontów: liczone
         względem półek obu skrzyń, więc lewe i prawe drzwi mają je równo. */
      const tagOf = kk => kk + (part === 'low' ? 'D' : 'G');
      const bays = ['L','R'].map(tagOf).map(t2 => layout.bays[t2]).filter(Boolean);
      const keepOut = bays.flatMap(b => b.shelfZ.map(zb => [zb - PIN - HOLE.hole5.d/2, zb + t]));
      const lim = [Math.max(...bays.map(b => b.in0)), Math.min(...bays.map(b => b.in1))];
      const byKey = {};
      rows.forEach(r => {
        const [z0,z1] = r[part], key = `${r0(r.b-r.a)}x${r0(z1-z0)}${r.hinge}`;
        (byKey[key] = byKey[key] || []).push({ ...r, z0, z1 });
      });
      Object.values(byKey).forEach(arr => {
        const q = arr[0], W = q.b-q.a, H = q.z1-q.z0;
        const xs = placeHinges(H, q.z0, keepOut, lim);
        (layout.hinges ??= {})[part] = xs.map(x => q.z0 + x);
        /* prowadniki: 2 wkręty na boku korpusu po stronie zawiasów */
        arr.forEach(r => {
          const s = sides[tagOf(k)]?.[r.hinge]; if (!s) return;
          xs.forEach(x => [-PLATE_DY, PLATE_DY].forEach(dy =>
            s.feats.push({ t:'plate', x: r.z0 + x - s.origin[2] + dy, y: s.Wd - PLATE_Y, face:'A' })));
        });
        /* Lg = wysokość: słoje frontu idą pionowo, jak w każdych drzwiach */
        const feats = xs.map(x => ({ t:'cup35', x, y: q.hinge==='L' ? 22.5 : W-22.5, face:'B' }));
        add({ grp:'front', code:`FR-${r0(H)}x${r0(W)}${q.hinge}`,
          name:`Front ${r0(W)} szer. × ${r0(H)} wys. (zawiasy z ${q.hinge==='L'?'lewej':'prawej'})`,
          Lg:H, Wd:W, edges:{D1:2,D2:2,S1:2,S2:2}, qty:arr.length, feats, hinge:q.hinge,
          faceNote:`słoje pionowo; puszki ⌀35 na licu B, oś 22,5 mm od krawędzi ${q.hinge==='L'?'D1':'D2'}; rozstaw symetryczny – można mierzyć od S1 albo od S2`,
          origin:[q.a,fd0,q.z0], inst:arr.map(r => [r.a,fd0,r.z0]),
          ex:[0,0,1], ey:[1,0,0], ez:[0,1,0] });
      });
    }
  }

  /* blendy, listwa, cokół */
  if (g.deep && g.sideGap > 6)
    add({ grp:'blenda', code:'BL-BOK', name:'Bok zamykający szczelinę przy lewej ścianie',
      Lg:g.zF, Wd:g.sideGap+25, edges:{D1:2,D2:0,S1:0,S2:0},
      faceNote:'+25 mm zapasu – krawędź D2 docinasz do ściany',
      origin:[g.wallX,p.D_wall_L-t,0], ex:[0,0,1], ey:[1,0,0], ez:[0,1,0] });
  if (!g.deep) {
    add({ grp:'blenda', code:'BL-LEWA', name:'Blenda lewa (z zapasem)', Lg:g.zF, Wd:carc.L[0]+25,
      edges:{D1:2,D2:0,S1:0,S2:0}, faceNote:'dotnij do ściany na miejscu',
      origin:[0,fd0,0], ex:[0,0,1], ey:[1,0,0], ez:[0,1,0] });
  }
  if (g.topStrip > 6)
    add({ grp:'blenda', code:'BL-GORA', name:'Listwa górna', Lg:g.X_right-g.X_left, Wd:g.topStrip+25,
      edges:{D1:2,D2:0,S1:2,S2:2}, faceNote:'+25 mm zapasu – krawędź D2 docinasz do sufitu',
      origin:[g.X_left,fd0,g.zF+1], ex:[1,0,0], ey:[0,0,1], ez:[0,1,0] });
  add({ grp:'blenda', code:'COK', name:'Cokół', Lg:g.X_right-g.X_left, Wd:p.plinth,
    edges:{D1:0,D2:2,S1:2,S2:2}, faceNote:'D2 = krawędź górna; dolną docinasz do podłogi',
    origin:[g.X_left,fd0-1,0], ex:[1,0,0], ey:[0,0,1], ez:[0,1,0] });

  return { panels, joints, fittings, g, p, layout, opts };
}

/* ---------- 4. pochodne: sumy, ostrzeżenia, teksty ---------- */
export function totals(model){
  const { panels, joints } = model;
  let m18=0, mHdf=0, mb=0, szt=0;
  const holes = { hole5:0, conf7:0, conf45:0, cup35:0, plate:0 };
  for (const q of panels) {
    const A = q.Lg*q.Wd/1e6*q.qty;
    q.mat.includes('HDF') ? mHdf += A : m18 += A;
    const e = q.edges || {};
    mb += ((e.D1?q.Lg:0)+(e.D2?q.Lg:0)+(e.S1?q.Wd:0)+(e.S2?q.Wd:0))/1000*q.qty;
    szt += q.qty;
    for (const f of q.feats) if (holes[f.t] !== undefined) holes[f.t] += q.qty;
  }
  const grooveMb = panels.reduce((a,q) =>
    a + q.feats.filter(f=>f.t==='groove').reduce((s,f)=>s+(f.x1-f.x0),0)/1000*q.qty, 0);
  const drilled = panels.filter(q=>q.feats.length).reduce((a,q)=>a+q.qty,0);
  const SHOP = new Set(SHOP_FEATS);
  const holesSelf = Object.entries(holes).filter(([k])=>!SHOP.has(k)).reduce((a,[,v])=>a+v,0);
  return { m18, mHdf, mb, szt, holes, grooveMb, drilled, holesSelf,
           konfirmaty: joints.length,
           zawiasy: panels.filter(q=>q.grp==='front').reduce((a,q)=>a+q.feats.filter(f=>f.t==='cup35').length*q.qty,0),
           polek: panels.filter(q=>q.code.endsWith('-POL')).reduce((a,q)=>a+q.qty,0),
           polekKorpus: panels.filter(q=>q.grp==='korpus' && q.code.endsWith('-POL')).reduce((a,q)=>a+q.qty,0),
           frontow: panels.filter(q=>q.grp==='front').reduce((a,q)=>a+q.qty,0),
           holesTotal: Object.values(holes).reduce((a,b)=>a+b,0) };
}

export function warnings(model, meas){
  const { p, g } = model, w = [], r = r0;
  const innerD = g.depth - 3;
  if (g.deep) {
    if (g.sideGap > 6) w.push(`Szafa wychodzi ${r(g.depth+p.gapBack-p.D_wall_L)} mm przed lewą ścianę. Przy wylocie wnęki zostaje szczelina ${r(g.sideGap)} mm – zamknij ją deską wstawioną w lico wnęki.`);
    w.push(`Szafa wystaje ${r(g.depth+p.gapBack-p.D_stub)} mm przed czoło występu i zajmie ${r(g.depth+p.gapBack+p.t+2)} mm głębokości pokoju. Sprawdź przejście i czy drzwi obok mają się jak otworzyć.`);
    w.push(`Nisza ${r(g.nW)} mm to wartość przewidywana: czoło występu ${r(p.T_S_min)}–${r(p.T_S)} mm plus luzy ${r(p.slackL)} i ${r(p.slackR)} mm. Węższa niż ${r(p.T_S)} mm nie będzie nigdy, ale ustawienie skrzyń może ją poszerzyć. Półki niszy zmierz po ustawieniu korpusów.`);
  }
  if (g.deep && g.nDep < 120) w.push(`Nisza ma ${r(g.nDep)} mm głębokości – mało na cokolwiek poza kluczami.`);
  for (const k of ['L','R']) {
    const nm = k==='L' ? 'lewy' : 'prawy';
    const segs = p.splitCarc ? [[p.plinth,p.H_LOW],[p.H_LOW,g.zTop(k)]] : [[p.plinth,g.zTop(k)]];
    segs.forEach(([z0,z1]) => {
      const diag = Math.hypot(z1-z0, g.depth);
      if (diag > g.hc[k]-40)
        w.push(`Korpus ${nm} o wysokości ${r(z1-z0)} mm ma przekątną ${r(diag)} mm przy suficie ${r(g.hc[k])} mm – nie podniesiesz go z leżenia. Podziel korpus albo obniż podział.`);
    });
    if (!p.splitCarc) {
      const h=(g.zTop(k)-p.plinth)/1000, ww=(g.carc[k][1]-g.carc[k][0])/1000, dd=g.depth/1000;
      const kg=(2*h*dd+2*ww*dd)*12 + h*ww*3.5;
      if (kg>32) w.push(`Korpus ${nm} w całości waży ok. ${r(kg)} kg – składaj go na miejscu albo stawiaj w dwie osoby.`);
    }
  }
  if (innerD < 520) w.push(`Wnętrze ma ${r(innerD)} mm – na drążek w poprzek potrzeba ok. 520 mm. Pogłęb szafę albo zostań przy półkach.`);
  const bayL = g.carc.L[1]-g.carc.L[0]-2*p.t;
  if (innerD >= 520 && bayL < 520) w.push(`Lewa skrzynia ma ${r(bayL)} mm światła – za mało na wieszaki w poprzek.`);
  const dC = Math.abs(p.H_C_L - p.H_C_R);
  if (dC > 8) w.push(`Sufit różni się o ${r(dC)} mm między stronami – fronty kończą się na niższym, resztę zakrywa listwa górna docinana do sufitu.`);
  if (g.deep && p.beamProj > g.depth+p.gapBack-p.D_stub+30)
    w.push(`Podciąg wystaje ${r(p.beamProj)} mm przed występ, czyli ${r(p.beamProj-(g.depth+p.gapBack-p.D_stub))} mm przed lico szafy. Nad niszą zostanie widoczna belka.`);
  if (g.deep && p.beamProj < g.depth+p.gapBack-p.D_stub)
    w.push(`Podciąg wystaje ${r(p.beamProj)} mm, a nisza sięga ${r(g.depth+p.gapBack-p.D_stub)} mm – nad niszą zostanie ${r(g.depth+p.gapBack-p.D_stub-p.beamProj)} mm otwartej przestrzeni.`);
  ['F1','F2'].forEach(id => {
    const v = meas[id]; if (typeof v !== 'number') return;
    const h = Math.sqrt(Math.max(0, v*v - p.W_L*p.W_L));
    const near = Math.min(Math.abs(p.H_C_L-h), Math.abs(p.H_C_L_max-h));
    if (near > 12) w.push(`Przekątna ${id} (${r(v)} mm) daje wysokość ${r(h)} mm, a zmierzone sufity to ${r(p.H_C_L)}–${r(p.H_C_L_max)} mm. Rozbieżność ${r(near)} mm.`);
  });
  if (Math.abs(p.BZ_L-p.BZ_R) > 10)
    w.push(`Dolna krawędź podciągu wychodzi na różnej wysokości: ${r(p.BZ_L)} po lewej, ${r(p.BZ_R)} po prawej. Liczona jako sufit minus G2, więc kumuluje dwa błędy – zmierz ją raz bezpośrednio od podłogi.`);
  if (p.H_LOW - p.plinth > 2100) w.push('Dolne fronty wyższe niż 2100 mm – ryzyko wypaczenia.');
  const sL = model.layout.bays.LD?.shelfZ[0], sR = model.layout.bays.RD?.shelfZ[0];
  if (sL !== undefined && sR !== undefined && sL !== sR)
    w.push(`Dolna półka prawej skrzyni (${r(sR)} mm) nie jest równo z półką na buty w lewej (${r(sL)} mm).`);
  return w;
}

/* ---------- 5. rozkrój na arkusze ---------- */
/* Zakłady w Łodzi robią tylko cięcie, oklejanie i puszki zawiasów.
   Te nawierty idą do zakładu; reszta (konfirmaty, kołki półek) jest Twoja. */
export const SHOP_FEATS = ['cup35'];

export const SHEET_STD = { L:2800, W:2070, trim:10, kerf:4.4 };

/* Dwuetapowy rozkrój gilotynowy, jak na pile panelowej: arkusz tnie się
   wzdłuż słojów na pasy, pasy w poprzek na formatki. Słoje biegną wzdłuż
   2800 mm i wzdłuż pierwszego wymiaru formatki, więc formatki z płyty
   laminowanej się nie obraca. HDF nie ma kierunku, więc można.
   To heurystyka (FFD z dopasowaniem pasa) – optymalizator w zakładzie
   zwykle zrobi tyle samo albo o arkusz mniej, nigdy więcej. */
export function nest(pieces, S = SHEET_STD){
  const Lu = S.L - 2*S.trim, Wu = S.W - 2*S.trim, k = S.kerf;
  const items = [];
  pieces.forEach(q => { for (let i=0;i<q.qty;i++) {
    let l = q.Lg, w = q.Wd;
    if (q.rot && (w > l && w <= Lu)) [l, w] = [w, l];
    items.push({ code:q.code, l, w });
  }});
  items.sort((a,b) => b.w - a.w || b.l - a.l);
  const strips = [];
  for (const it of items) {
    let best = null;
    for (const s of strips) {
      if (s.w < it.w || s.used + k + it.l > Lu) continue;
      if (s.w - it.w > Math.max(60, s.w*0.35)) continue;   // za dużo straty na szerokości
      if (!best || s.w - it.w < best.w - it.w) best = s;
    }
    if (!best) { best = { w:it.w, used:-k, parts:[] }; strips.push(best); }
    best.parts.push({ ...it, x: best.used + k }); best.used += k + it.l;
  }
  strips.sort((a,b) => b.w - a.w);
  const sheets = [];
  for (const s of strips) {
    let sh = sheets.find(h => h.used + k + s.w <= Wu);
    if (!sh) { sh = { used:-k, strips:[] }; sheets.push(sh); }
    sh.strips.push({ ...s, y: sh.used + k }); sh.used += k + s.w;
  }
  const area = items.reduce((a,i)=>a+i.l*i.w,0)/1e6;
  return { sheets, n: sheets.length, area, util: area / (sheets.length*S.L*S.W/1e6 || 1),
           parts: items.length, S };
}

export function nestAll(model){
  const mats = q => q.mat.includes('HDF') ? 'hdf' : 'p18';
  const out = {};
  for (const stage of [1,2,0]) for (const m of ['p18','hdf']) {
    const sel = model.panels.filter(q => mats(q)===m && (!stage || q.stage===stage))
      .map(q => ({ ...q, rot: m==='hdf' }));
    if (sel.length) out[`${m}_${stage||'all'}`] = nest(sel);
  }
  return out;
}

/* ---------- 6. opisy dla zakładu ---------- */
export const edgeText = pn => {
  const on = Object.entries(pn.edges||{}).filter(([,v])=>v).map(([k])=>k);
  return on.length ? on.join(' + ') : '—';
};
export function drillText(pn){
  const f = pn.feats||[], out = [];
  const uniq = a => [...new Set(a.map(v=>Math.round(v)))].sort((x,y)=>x-y);
  const grp = t => f.filter(q=>q.t===t);
  const h5 = grp('hole5');
  if (h5.length) {
    const xs = uniq(h5.map(q=>q.x)), ys = uniq(h5.map(q=>q.y));
    out.push(`${h5.length} × ⌀5×10 mm pod kołki półek: ${ys.length} rzędy w osi ${ys.map(v => v<pn.Wd/2 ? `${v} mm od D1` : `${pn.Wd-v} mm od D2`).join(' i ')}, na ${xs.join(' / ')} mm od S1 (siatka 32 mm)`);
  }
  const c7 = grp('conf7');
  if (c7.length) out.push(`${c7.length} × ⌀7 przelotowy (konfirmat): 9 mm od S1 i od S2, w osiach ${uniq(c7.map(q=>q.y)).join(' / ')} mm od D1`);
  const c45 = grp('conf45');
  if (c45.length) out.push(`${c45.length} × ⌀4,5×40 mm w czołach S1 i S2, w osiach ${uniq(c45.map(q=>q.y)).join(' / ')} mm od D1`);
  const cu = grp('cup35');
  if (cu.length) out.push(`${cu.length} × puszka ⌀35×13 mm na licu B, oś 22,5 mm od krawędzi ${cu[0].y<pn.Wd/2?'D1':'D2'}, na ${uniq(cu.map(q=>q.x)).join(' / ')} mm od S1`);
  const pl = grp('plate');
  if (pl.length) out.push(`${pl.length} × ⌀3×10 mm pilot pod prowadniki zawiasów (po 2 na prowadnik, co 32 mm): w osi 37 mm od D2, na ${uniq(pl.map(q=>q.x)).join(' / ')} mm od S1`);
  if (grp('groove').length) out.push('rowek 4×10 mm w licu A, 10 mm od krawędzi D1 (pod plecy HDF)');
  return out;
}
export function featBadge(pn){
  const c = {}; (pn.feats||[]).forEach(q => c[q.t] = (c[q.t]||0)+1);
  const m = { hole5:'⌀5', conf7:'⌀7', conf45:'⌀4,5', cup35:'⌀35', plate:'⌀3', groove:'rowek' };
  return Object.entries(c).map(([k,v]) => `${v}×${m[k]||k}`).join(' · ') || '—';
}

/* ---------------------------------------------------------------
   Projekt jest zamknięty: jeden pomiar, jeden zestaw decyzji, jeden
   model. Liczony raz, przy załadowaniu modułu. Ten sam plik działa
   w przeglądarce i w node, więc listę formatek można wygenerować
   bez otwierania strony.
   --------------------------------------------------------------- */
export const P = derive(SHEET, SETTINGS);
const cache = new Map();
/** Pełny model dla wariantu. Liczony raz na wariant. */
export function makeModel(opts = {}){
  const o = { ...DEFAULT_OPTS, ...opts }, key = JSON.stringify(o);
  if (!cache.has(key)) {
    const model = buildPanels(P, o);
    cache.set(key, { model, T: totals(model), warnings: warnings(model, SHEET),
                     nest: nestAll(model) });
  }
  return cache.get(key);
}
export const { model: MODEL, T, warnings: WARNINGS } = makeModel();

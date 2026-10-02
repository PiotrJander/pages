import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'preact/hooks';
import * as core from './core.js';
import { measureDefs, GROUPS, spread } from './measures.js';
import * as S3 from './scene.js';
import { PlanTab } from './plan.js';
import { html, Check, Table, Pad, Dialog } from './widgets.js';

const { P: p, MODEL: model, T, WARNINGS: warns, SHEET: meas, r0 } = core;
const g = model.g;
const DEFS = measureDefs(p).filter(d => typeof meas[d.id] === 'number');

/* ============ ramka podglądu 3D ============ */
function ViewerFrame({ cls, viewerRef, children, overlay, views }) {
  const canvas = useRef(null);
  const [fs, setFs] = useState(false);

  useLayoutEffect(() => {
    const v = S3.makeViewer(canvas.current);
    viewerRef.current = v;
    const ro = new ResizeObserver(() => v.size());
    ro.observe(canvas.current.parentElement);
    return () => { ro.disconnect(); v.dispose(); viewerRef.current = null; };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('fs-on', fs);
    const t = requestAnimationFrame(() => { viewerRef.current?.size(); viewerRef.current?.place(); });
    return () => cancelAnimationFrame(t);
  }, [fs]);

  useEffect(() => {
    const k = e => {
      if (document.querySelector('dialog[open]')) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
      const m = { ArrowUp:[0,1], ArrowDown:[0,-1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
      if (e.key === 'Escape' && fs) { setFs(false); return; }
      if (!m[e.key] && e.key !== 'Home') return;
      e.preventDefault();
      e.key === 'Home' ? viewerRef.current?.recenter() : viewerRef.current?.pan(...m[e.key]);
    };
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  }, [fs]);

  const pan = (a,b) => a === 'c' ? viewerRef.current?.recenter() : viewerRef.current?.pan(a,b);

  return html`
    <div class=${cls + (fs ? ' fs' : '')}>
      <canvas ref=${canvas} />
      ${children}
      ${views && html`<div class="views">${views.map(v => html`
        <button onClick=${() => viewerRef.current?.setView(v.k)}>${v.t}</button>`)}</div>`}
      <${Pad} on=${pan} />
      <button class="fsbtn" title=${fs ? 'Zamknij' : 'Pełny ekran'}
              onClick=${() => setFs(f => !f)}>${fs ? '✕' : '⛶'}</button>
      ${fs && overlay && html`<div class="fsctl">${overlay}</div>`}
    </div>`;
}

/* ============ panele sterowania (jeden komponent, dwa miejsca) ============
   Każdy panel jest pisany raz i renderowany dwa razy: w treści strony i jako
   overlay na pełnym ekranie. Stan jest jeden, więc nie ma czego synchronizować. */
const VIEWS = [{k:'3d',t:'3D'},{k:'front',t:'Przód'},{k:'side',t:'Bok'},{k:'top',t:'Góra'}];

const Sl = ({ label, value, min=0, max=100, onInput }) => html`
  <div class="sl"><span>${label}</span>
    <input type="range" min=${min} max=${max} value=${value}
           onInput=${e => onInput(+e.target.value)} /></div>`;

const ViewControls = ({ view, setView, compact }) => {
  const t = (k, v) => setView(s => ({ ...s, [k]: v }));
  return html`<div class=${compact ? '' : 'toggles'}>
    <${Check} label="ściany"  checked=${view.walls}  onInput=${v => t('walls', v)} />
    <${Check} label="fronty"  checked=${view.fronts} onInput=${v => t('fronts', v)} />
    <${Check} label="wymiary" checked=${view.measOn} onInput=${v => t('measOn', v)} />
    <${Sl} label=${html`otwarcie drzwi <b>${Math.round(view.open*90)}°</b>`}
      value=${view.open*100} onInput=${v => t('open', v/100)} />
  </div>`;
};

const ExplodeControls = ({ view, setView, compact }) => {
  const t = (k, v) => setView(s => ({ ...s, [k]: v }));
  return html`<div class=${compact ? '' : 'toggles'}>
    <${Check} label="nawierty" checked=${view.feats} onInput=${v => t('feats', v)} />
    <${Check} label="osie konfirmatów" checked=${view.joints} onInput=${v => t('joints', v)} />
    <${Sl} label=${html`rozsunięcie <b>${view.explode}%</b>`}
      value=${view.explode} onInput=${v => t('explode', v)} />
  </div>`;
};

/* ============ zakładka MODEL ============ */
function ModelTab({ view, setView }) {
  const viewer = useRef(null);

  useEffect(() => {
    const v = viewer.current; if (!v) return;
    v.clear();
    const root = new S3.THREE.Group();
    root.matrix.copy(S3.SWAP); root.matrixAutoUpdate = false;
    root.add(S3.roomGroup(p, g));
    root.add(S3.wardrobeGroup(model, { fronts:view.fronts, open:view.open }));
    root.add(S3.measureGroup(DEFS, meas, GROUPS, { showTodo:false, shown:view.shown }).group);
    v.scene.add(root);
    v.frame(root, v.camera.aspect > 1.3 ? 1.1 : 1.32);
  }, [view.fronts, view.open, view.shown]);

  useEffect(() => {
    const v = viewer.current; if (!v) return;
    v.scene.traverse(o => {
      if (o.userData?.isWall) o.visible = view.walls;
      if (o.name === 'meas') o.visible = view.measOn;
    });
  }, [view.walls, view.measOn, view.fronts, view.open, view.shown]);

  const chips = view.measOn && html`<div class="chips">${Object.entries(GROUPS).map(([k,gr]) => {
    const on = view.shown[k] !== false;
    return html`<button style=${{color: on ? gr.color : 'var(--todo)', opacity: on ? 1 : .55}}
      title=${gr.name} onClick=${() => setView(s => ({...s, shown:{...s.shown, [k]: !on}}))}>${k}</button>`;
  })}</div>`;

  return html`<${ViewerFrame} cls="stage" viewerRef=${viewer} views=${VIEWS}
      overlay=${html`<${ViewControls} view=${view} setView=${setView} compact />`}>
      ${chips}
    <//>`;
}

/* ============ zakładka ROZSTRZELONY ============ */
function ExplodeTab({ view, setView }) {
  const viewer = useRef(null);
  const items = useRef([]); const jointRefs = useRef([]); const ctr = useRef([0,0,0]);
  const lastK = useRef(0);

  useEffect(() => {
    const v = viewer.current; if (!v) return;
    v.clear();
    const root = new S3.THREE.Group();
    root.matrix.copy(S3.SWAP); root.matrixAutoUpdate = false;
    let mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
    model.panels.forEach(pn => pn.inst.forEach(o => {
      S3.panelCenter(pn,o).forEach((c,i) => { mn[i]=Math.min(mn[i],c); mx[i]=Math.max(mx[i],c); });
    }));
    ctr.current = [0,1,2].map(i => (mn[i]+mx[i])/2);
    items.current = [];
    model.panels.forEach(pn => pn.inst.forEach(o => {
      const gr = new S3.THREE.Group(); gr.matrixAutoUpdate = false;
      const base = S3.panelMatrix(pn, o);
      gr.add(S3.panelMesh(pn, view.feats));
      root.add(gr);
      items.current.push({ g:gr, base, c:S3.panelCenter(pn,o) });
    }));
    const jm = new S3.THREE.LineBasicMaterial({ color:0xb03a2e });
    jointRefs.current = model.joints.map(j => {
      const geo = new S3.THREE.BufferGeometry().setFromPoints([new S3.THREE.Vector3(), new S3.THREE.Vector3()]);
      const ln = new S3.THREE.Line(geo, jm); ln.renderOrder = 5; root.add(ln);
      const pa = model.panels.find(q => q.id === j.pa), pb = model.panels.find(q => q.id === j.pb);
      return { ln, a:j.a, b:j.b, ca:S3.panelCenter(pa), cb:S3.panelCenter(pb) };
    });
    v.scene.add(root);
    v.frame(root, 1.25);
    v.dolly(1 + view.explode/100*1.4);
    lastK.current = view.explode/100*1.4;
  }, [view.feats]);

  useEffect(() => {
    const v = viewer.current;
    const k = view.explode/100*1.4, c = ctr.current;
    if (v) { v.dolly((1+k)/(1+lastK.current)); lastK.current = k; }
    const off = q => [0,1,2].map(i => (q[i]-c[i])*k);
    items.current.forEach(it => {
      const o = off(it.c);
      it.g.matrix.copy(it.base);
      it.g.matrix.setPosition(it.base.elements[12]+o[0], it.base.elements[13]+o[1], it.base.elements[14]+o[2]);
    });
    jointRefs.current.forEach(j => {
      j.ln.visible = view.joints; if (!view.joints) return;
      const oa = off(j.ca), ob = off(j.cb);
      j.ln.geometry.setFromPoints([
        new S3.THREE.Vector3(j.a[0]+oa[0], j.a[1]+oa[1], j.a[2]+oa[2]),
        new S3.THREE.Vector3(j.b[0]+ob[0], j.b[1]+ob[1], j.b[2]+ob[2])]);
      j.ln.geometry.attributes.position.needsUpdate = true;
      j.ln.geometry.computeBoundingSphere();
    });
  }, [view.explode, view.joints, view.feats]);

  return html`<section>
    <h2>Widok rozstrzelony</h2>
    <p class="note">Elementy odsuwają się proporcjonalnie od środka bryły. Czerwone osie pokazują, co jest czym skręcane.</p>
    <${ViewerFrame} cls="expwrap" viewerRef=${viewer} views=${VIEWS}
      overlay=${html`<${ExplodeControls} view=${view} setView=${setView} compact />`} />
    <${ExplodeControls} view=${view} setView=${setView} />
    <div class="leg">${Object.values(core.HOLE).map(hl => html`
      <span><i style=${{background:hl.color}}></i>${hl.label}</span>`)}
      <span><i style=${{background:'#6b6f74'}}></i>rowek 4×10 – plecy HDF</span></div>
  </section>`;
}

/* ============ podgląd pojedynczej formatki ============ */
function PanelDialog({ code, onClose }) {
  const pn = model.panels.find(q => q.code === code);
  const viewer = useRef(null);
  const [face, setFace] = useState('A');
  useEffect(() => {
    if (!pn) return;
    const nB = pn.feats.filter(f => f.face === 'B').length;
    const nA = pn.feats.filter(f => f.face === 'A').length;
    setFace(nB > nA ? 'B' : 'A');
  }, [code]);
  useEffect(() => {
    const v = viewer.current; if (!v || !pn) return;
    v.clear();
    const holder = new S3.THREE.Group(); holder.scale.setScalar(0.001);
    const gm = S3.panelMesh(pn, true);
    gm.position.set(-pn.Lg/2, -pn.Wd/2, -pn.t/2);
    holder.add(gm); v.scene.add(holder);
    requestAnimationFrame(() => { v.size(); v.frame(holder, 1.18); });
  }, [code]);
  useEffect(() => {
    const v = viewer.current; if (!v) return;
    v.state.th = face === 'B' ? Math.PI - 0.22 : -0.22;
    v.state.ph = 1.28; v.place();
  }, [face, code]);
  if (!pn) return null;
  const d = core.drillText(pn);
  return html`<${Dialog} open=${!!code} onClose=${onClose} wide>
    <h2>${pn.code} · ${pn.name}</h2>
    <${ViewerFrame} cls="pvcanvas" viewerRef=${viewer} />
    <p class="note"><b>${r0(pn.Lg)} × ${r0(pn.Wd)} × ${pn.t} mm</b> · ${pn.qty} szt. · ${pn.mat}<br/>
      Obrzeże 2 mm: ${core.edgeText(pn)}
      ${pn.faceNote && html`<br/><span class="dim">${pn.faceNote}</span>`}</p>
    ${d.length ? html`<ul class="bul">${d.map(x => html`<li>${x}</li>`)}</ul>`
               : html`<p class="note">Bez nawiertów.</p>`}
    <div class="seg">
      <button aria-pressed=${face === 'A'} onClick=${() => setFace('A')}>Lico A (do wnętrza)</button>
      <button aria-pressed=${face === 'B'} onClick=${() => setFace('B')}>Lico B (na zewnątrz)</button>
    </div>
    <div class="dlgbar"><button class="pri" onClick=${onClose}>Zamknij</button></div>
  <//>`;
}

/* ============ dane wyliczone raz, poza komponentami ============ */
const FINDINGS = [
  ['Lewa wnęka', ['A1','A2','A3','A4','A5','A6']],
  ['Prawa wnęka', ['B1','B2','B3','B4','B5','B6']],
  ['Głębokość przy lewej ścianie', ['C1','C2','C3']],
  ['Głębokość przy drzwiach', ['C10','C11','C12']],
  ['Czoło występu', ['G1d','G1s','G1g']],
  ['Sufit nad lewą wnęką', ['EL1','EL2','EL3','EL4']],
  ['Sufit nad prawą wnęką', ['ER1','ER2','ER3','ER4']],
].map(([n, ids]) => { const s = spread(meas, ids);
    return s ? `${n}: ${s.min}–${s.max} mm, rozrzut ${s.max-s.min} mm` : null; }).filter(Boolean);
['F1','F2'].forEach(id => { if (typeof meas[id] === 'number')
  FINDINGS.push(`Wysokość z przekątnej ${id}: ${r0(Math.sqrt(Math.max(0, meas[id]**2 - p.W_L**2)))} mm (kontrola pomiaru E)`); });
FINDINGS.push(`Głębokość korpusu ${r0(g.depth+p.gapBack)} mm, wnętrze ${r0(g.depth-3)} mm`);
FINDINGS.push(`Nisza: ${r0(g.nW)} × ${r0(g.nDep)} mm, do wysokości ${r0(g.nTop)} mm`);

const PART_ROWS = (() => {
  const rows = [];
  for (const [k,nm] of [['L','lewy'],['R','prawy']]) {
    const w = g.carc[k][1]-g.carc[k][0], zT = g.zTop(k);
    rows.push([`Korpus ${nm} dolny`, r0(w), r0(p.H_LOW-p.plinth), r0(g.depth)]);
    rows.push([`Korpus ${nm} górny`, r0(w), r0(zT-p.H_LOW), r0(g.depth)]);
  }
  const fr = {};
  model.panels.filter(q => q.grp === 'front').forEach(q => {
    const key = `${r0(q.Lg)} × ${r0(q.Wd)}`; fr[key] = (fr[key]||0)+q.qty; });
  Object.entries(fr).forEach(([k,n]) => { const [a,b] = k.split(' × ');
    rows.push([`Front ×${n}`, a, b, p.t]); });
  return rows;
})();

const MEAS_ROWS = DEFS.map(d => [d.id, d.desc, meas[d.id] + ' mm']);

const TABS = [['model','Model'],['exp','Rozstrzelony'],['plan','Plan i materiały']];

/* ============ aplikacja ============ */
export function App() {
  const [tab, setTab] = useState('model');
  const [view, setView] = useState({ walls:true, fronts:true, measOn:false,
                                     open:0, explode:30, feats:true, joints:true, shown:{} });
  const [dlgPanel, setDlgPanel] = useState(null);

  useEffect(() => { scrollTo({ top:0 }); }, [tab]);

  return html`
    ${tab === 'model' && html`<${ModelTab} view=${view} setView=${setView} />`}
    <main>
      <div class="tabs" role="tablist">
        ${TABS.map(([k,t]) => html`<button role="tab" aria-selected=${tab === k}
          onClick=${() => setTab(k)}>${t}</button>`)}
      </div>

      ${tab === 'model' && html`<section>
        <h1>Szafa wnękowa</h1>
        <p class="sub">Front ${r0(g.X_right-g.X_left)} × ${r0(g.zF)} mm, głębokość ${r0(g.depth+p.gapBack)} mm
          · nisza ${r0(g.nW)} × ${r0(g.nDep)} mm, półki otwarte</p>

        <${ViewControls} view=${view} setView=${setView} />

        <details open><summary>Wnioski z pomiarów</summary>
          <ul class="bul dim">${FINDINGS.map(f => html`<li>${f}</li>`)}</ul></details>

        <details open><summary>Korpusy i fronty</summary>
          ${warns.map(w => html`<p class="warn">${w}</p>`)}
          <${Table} head=${['Element','Szer.','Wys.','Głęb.']} rows=${PART_ROWS} />
        </details>

        <details><summary>Pomiary — protokół</summary>
          <p class="note">Odczyty z lasera, ${MEAS_ROWS.length} pozycji. Projekt jest na nich zamrożony:
            wymiary formatek wynikają z tych liczb i nic ich już nie przelicza.</p>
          <${Table} head=${['Kod','Co mierzone','Odczyt']} rows=${MEAS_ROWS} />
        </details>
      </section>`}

      ${tab === 'exp'  && html`<${ExplodeTab} view=${view} setView=${setView} />`}
      ${tab === 'plan' && html`<${PlanTab} model=${model} T=${T} onPanel=${setDlgPanel} />`}
    </main>

    <${PanelDialog} code=${dlgPanel} onClose=${() => setDlgPanel(null)} />`;
}

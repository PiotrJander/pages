/* scene.js — wszystko, co dotyka THREE. Bryły powstają z formatek z core.js. */
import * as THREE from 'three';
import { HOLE } from './core.js';

/* Jedna konwencja w całym pliku: geometria powstaje w milimetrach, w układzie
   [x = wzdłuż ściany, d = w głąb, z = w górę]. SWAP raz, na korzeniu sceny,
   skaluje mm → m i zamienia osie na trójkowe (x, y=góra, z=w stronę widza). */
export const S = 0.001;
export const SWAP = new THREE.Matrix4().set(S,0,0,0, 0,0,S,0, 0,S,0,0, 0,0,0,1);
export const P = ([x,d,z]) => new THREE.Vector3(x, d, z);

const MAT = {
  wall : new THREE.MeshLambertMaterial({color:0xd4d6d0, transparent:true, opacity:.3, side:THREE.DoubleSide, depthWrite:false}),
  struct:new THREE.MeshLambertMaterial({color:0xa9aca6, transparent:true, opacity:.5, depthWrite:false}),
  floor: new THREE.MeshLambertMaterial({color:0xcfc9bb}),
  korpus:new THREE.MeshLambertMaterial({color:0xe8dcc4, side:THREE.DoubleSide}),
  plecy: new THREE.MeshLambertMaterial({color:0xc9b99a, side:THREE.DoubleSide}),
  nisza: new THREE.MeshLambertMaterial({color:0xefe5d0, side:THREE.DoubleSide}),
  front: new THREE.MeshLambertMaterial({color:0xd8dcd9, side:THREE.DoubleSide}),
  blenda:new THREE.MeshLambertMaterial({color:0xcfd3d0, side:THREE.DoubleSide}),
  band:  new THREE.MeshBasicMaterial({color:0x8a7f66, side:THREE.DoubleSide}),
  rail:  new THREE.MeshLambertMaterial({color:0x9aa3a8}),
  plinth:new THREE.MeshLambertMaterial({color:0x555555}),
  groove:new THREE.MeshLambertMaterial({color:0x6b6f74}),
};
const EDGE = new THREE.LineBasicMaterial({color:0x4a4f55, transparent:true, opacity:.55});

/* ---------- orbitujący podgląd ---------- */
export function makeViewer(canvas){
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a4, .9));
  const sun = new THREE.DirectionalLight(0xffffff, .5); sun.position.set(-1.5, 3, 4); scene.add(sun);
  const st = { th:-0.5, ph:1.3, dist:6, tgt:new THREE.Vector3(), home:new THREE.Vector3() };

  const place = () => {
    camera.position.set(
      st.tgt.x + st.dist*Math.sin(st.ph)*Math.sin(st.th),
      st.tgt.y + st.dist*Math.cos(st.ph),
      st.tgt.z + st.dist*Math.sin(st.ph)*Math.cos(st.th));
    camera.lookAt(st.tgt);
  };
  const size = () => {
    const r = canvas.getBoundingClientRect(); if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  };
  const frame = (obj, pad=1.2) => {
    const box = new THREE.Box3().setFromObject(obj); if (box.isEmpty()) return;
    box.getCenter(st.tgt); st.home.copy(st.tgt);
    const s = box.getSize(new THREE.Vector3()), tv = Math.tan(35*Math.PI/360);
    st.dist = Math.max(s.y/2/tv, Math.max(s.x,s.z)/2/(tv*Math.max(camera.aspect,.5)))*pad
            + Math.max(s.x,s.y,s.z)*.25;
    place();
  };
  const pan = (dx,dy) => {
    const step = st.dist*0.09;
    const r = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0); r.y = 0;
    if (r.lengthSq() < 1e-6) r.set(1,0,0); r.normalize();
    st.tgt.addScaledVector(r, dx*step); st.tgt.y += dy*step; place();
  };
  const recenter = () => { st.tgt.copy(st.home); place(); };
  const setView = (v) => {
    const b = new THREE.Box3().setFromObject(scene);
    if (v==='front'){ st.th=0; st.ph=Math.PI/2; }
    if (v==='side') { st.th=Math.PI/2; st.ph=Math.PI/2; }
    if (v==='top')  { st.th=0; st.ph=0.16; }
    if (v==='3d')   { st.th=-0.5; st.ph=1.3; }
    if (!b.isEmpty()) frame(scene, v==='3d' ? (camera.aspect>1.3?1.06:1.3) : 1.05);
    place();
  };
  /* oddalenie względne – składa się z ręcznym zoomem, więc rozsuwanie
     elementów nie kasuje tego, co użytkownik sam przybliżył */
  const dolly = f => { st.dist = Math.min(Math.max(st.dist*f, .15), 40); place(); };

  /* wskaźnik: obrót jednym palcem, zoom dwoma, kółko myszy */
  const ptrs = new Map(); let pinch=0, d0=0, moved=0, tap=null;
  const onTap = { fn:null };
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if (ptrs.size===1){ moved=0; tap={x:e.clientX,y:e.clientY}; }
    if (ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch=Math.hypot(a.x-b.x,a.y-b.y); d0=st.dist; tap=null; }
  });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    const pr = ptrs.get(e.pointerId), dx = e.clientX-pr.x, dy = e.clientY-pr.y;
    ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY}); moved += Math.abs(dx)+Math.abs(dy);
    if (ptrs.size===1){ st.th -= dx*.008; st.ph = Math.min(Math.max(st.ph-dy*.008,.08), Math.PI-.08); }
    else { const [a,b]=[...ptrs.values()], d=Math.hypot(a.x-b.x,a.y-b.y); if (pinch) st.dist=Math.min(Math.max(d0*pinch/d,.15),40); }
    place();
  });
  const up = e => {
    if (ptrs.size===1 && moved<9 && tap && onTap.fn) onTap.fn(tap.x, tap.y);
    ptrs.delete(e.pointerId); pinch=0; tap=null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); pinch=0; });
  canvas.addEventListener('wheel', e => {
    e.preventDefault(); st.dist = Math.min(Math.max(st.dist*Math.exp(e.deltaY*.001),.15),40); place();
  }, { passive:false });

  let alive = true;
  (function loop(){ if (alive) renderer.render(scene, camera); requestAnimationFrame(loop); })();

  return { scene, camera, renderer, state:st, place, size, frame, pan, recenter, setView, dolly, onTap,
    clear(){ [...scene.children].forEach(o => { if (o.isLight) return; scene.remove(o);
      o.traverse?.(c => c.geometry?.dispose()); }); },
    dispose(){ alive = false; renderer.dispose(); } };
}

/* ---------- bryła formatki (układ lokalny, mm) ---------- */
export function panelMesh(pn, showFeats=true){
  const g = new THREE.Group(), { Lg:L, Wd:W, t } = pn;
  const mat = MAT[pn.grp] || MAT.korpus;
  const bg = new THREE.BoxGeometry(L, W, t);
  const bm = new THREE.Mesh(bg, mat); bm.position.set(L/2, W/2, t/2); g.add(bm);
  bm.add(new THREE.LineSegments(new THREE.EdgesGeometry(bg), EDGE));

  const strip = (w,h,pos,rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), MAT.band);
    m.position.set(...pos); if (rot) m.rotation.set(...rot); g.add(m);
  };
  const e = pn.edges || {};
  if (e.D1) strip(L, t, [L/2, -0.4, t/2], [Math.PI/2,0,0]);
  if (e.D2) strip(L, t, [L/2, W+0.4, t/2], [Math.PI/2,0,0]);
  if (e.S1) strip(t, W, [-0.4, W/2, t/2], [0,Math.PI/2,0]);
  if (e.S2) strip(t, W, [L+0.4, W/2, t/2], [0,Math.PI/2,0]);
  if (!showFeats) return g;

  for (const f of pn.feats || []) {
    if (f.t === 'groove') {
      const m = new THREE.Mesh(new THREE.BoxGeometry(f.x1-f.x0, f.y1-f.y0, f.depth), MAT.groove);
      m.position.set((f.x0+f.x1)/2, (f.y0+f.y1)/2, t - f.depth/2); g.add(m); continue;
    }
    const h = HOLE[f.t]; if (!h) continue;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(h.d/2, 20),
      new THREE.MeshBasicMaterial({ color:h.color, side:THREE.DoubleSide }));
    if (f.face === 'A') disc.position.set(f.x, f.y, t+0.5);
    else if (f.face === 'B') { disc.position.set(f.x, f.y, -0.5); disc.rotation.x = Math.PI; }
    else { const s = f.x < L/2 ? -1 : 1; disc.position.set(f.x + s*0.5, f.y, t/2); disc.rotation.y = s*Math.PI/2; }
    g.add(disc);
    if (f.t === 'conf7') {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(h.d/2,h.d/2,t+1,12), new THREE.MeshBasicMaterial({color:h.color}));
      c.rotation.x = Math.PI/2; c.position.set(f.x, f.y, t/2); g.add(c);
    }
    if (f.t === 'cup35') {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(h.d/2,h.d/2,h.depth,20), new THREE.MeshLambertMaterial({color:0x35507f}));
      c.rotation.x = Math.PI/2; c.position.set(f.x, f.y, h.depth/2); g.add(c);
    }
  }
  return g;
}

export const panelMatrix = (pn, origin) => {
  const [ox,od,oz] = origin ?? pn.origin;
  return new THREE.Matrix4().set(
    pn.ex[0], pn.ey[0], pn.ez[0], ox,
    pn.ex[1], pn.ey[1], pn.ez[1], od,
    pn.ex[2], pn.ey[2], pn.ez[2], oz,
    0,0,0,1);
};
export const panelCenter = (pn, origin) => {
  const o = origin ?? pn.origin;
  return [0,1,2].map(i => o[i] + pn.ex[i]*pn.Lg/2 + pn.ey[i]*pn.Wd/2 + pn.ez[i]*pn.t/2);
};

/* Prostopadłościan w układzie modelu [x, d, z] – jak wszystko w tym pliku.
   Osie prostuje dopiero SWAP na korzeniu sceny. */
const box = (x0,x1,d0,d1,z0,z1,mat,edges=true) => {
  const g = new THREE.BoxGeometry(Math.max(1,x1-x0), Math.max(1,d1-d0), Math.max(1,z1-z0));
  const m = new THREE.Mesh(g, mat);
  m.position.set((x0+x1)/2, (d0+d1)/2, (z0+z1)/2);
  if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), EDGE));
  return m;
};

/* ---------- pomieszczenie ---------- */
export function roomGroup(p, g){
  const room = new THREE.Group(); room.name = 'room';
  const HC = Math.max(p.H_C_L, p.H_C_R) + 40;
  const XE = g.DRt + 1300, DE = g.dF + 1200, W = 120, dx0 = g.DRt + 70, dx1 = dx0 + 800;
  const put = (m) => room.add(m);
  put(box(-W, XE, -10, DE, -30, 0, MAT.floor, false));
  [[-W,dx0,0,HC],[dx1,XE,0,HC],[dx0,dx1,2050,HC]].forEach(([a,b,z0,z1]) =>
    put(box(a,b,-W,0,z0,z1, MAT.wall, false)));
  put(box(-W, 0, 0, p.D_wall_L, 0, HC, MAT.wall, false));
  put(box(g.S0, g.S1, 0, p.D_stub, 0, HC, MAT.struct));
  put(box(g.S0, g.S1, p.D_stub, p.D_stub + p.beamProj, p.BZ, HC, MAT.struct));
  room.children.forEach(m => { if (m.material === MAT.wall) m.userData.isWall = true; });
  return room;
}

/* ---------- złożona szafa ---------- */
export function wardrobeGroup(model, { fronts=true, open=0, explode=0 } = {}){
  const grp = new THREE.Group(); grp.name = 'ward';
  const ang = open * Math.PI/2;
  for (const pn of model.panels) {
    for (const org of pn.inst) {
      const holder = new THREE.Group(); holder.matrixAutoUpdate = false;
      holder.matrix.copy(panelMatrix(pn, org));
      holder.add(panelMesh(pn, false));
      if (pn.grp === 'front') {
        holder.userData.isFront = true; holder.visible = fronts;
        if (ang && pn.hinge) {
          const pivot = new THREE.Group(); pivot.userData.isFront = true; pivot.visible = fronts;
          const wX = Math.abs(pn.ex[0])*pn.Lg + Math.abs(pn.ey[0])*pn.Wd;   // szerokość frontu w osi x
          const hx = pn.hinge === 'L' ? org[0] : org[0] + wX;
          pivot.position.set(hx, org[1], 0);
          holder.matrix.setPosition(org[0]-hx, 0, org[2]);
          /* pion to lokalne z, nie y – osie prostuje dopiero SWAP na korzeniu */
          pivot.rotation.z = (pn.hinge === 'L' ? 1 : -1) * ang;
          pivot.add(holder); grp.add(pivot); continue;
        }
      }
      grp.add(holder);
    }
  }
  for (const f of model.fittings) {
    const m = box(f.x0, f.x1, f.d0, f.d1, f.z0, f.z1, f.kind==='rail' ? MAT.rail : MAT.plinth);
    grp.add(m);
  }
  return grp;
}

/* ---------- linie pomiarowe ---------- */
export function measureGroup(defs, meas, groups, { showTodo=true, shown={} } = {}){
  const g = new THREE.Group(); g.name = 'meas';
  const hits = [];
  const seg = (a,b,color,dashed) => {
    const geo = new THREE.BufferGeometry().setFromPoints([P(a), P(b)]);
    const m = dashed
      ? new THREE.LineDashedMaterial({ color, dashSize:.045, gapSize:.03, depthTest:false })
      : new THREE.LineBasicMaterial({ color, depthTest:false });
    const l = new THREE.Line(geo, m); if (dashed) l.computeLineDistances(); l.renderOrder = 10; return l;
  };
  const cache = {};
  const tag = (txt,pos,color,dim) => {
    const key = txt+color+dim;
    if (!cache[key]) {
      const c = document.createElement('canvas'); c.width=176; c.height=80;
      const x = c.getContext('2d');
      x.fillStyle = dim ? '#ffffffcc' : '#fff'; x.strokeStyle = color; x.lineWidth = 5;
      x.beginPath(); x.roundRect(6,10,164,60,10); x.fill(); x.stroke();
      x.fillStyle = color; x.font = 'bold 34px sans-serif'; x.textAlign='center'; x.textBaseline='middle';
      x.fillText(txt, 88, 41);
      cache[key] = new THREE.CanvasTexture(c);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:cache[key], depthTest:false, opacity:dim?.7:1 }));
    const w = Math.max(130, txt.length*50); s.scale.set(w, w*.42, 1);
    s.position.copy(P(pos)); s.renderOrder = 11; return s;
  };
  for (const d of defs) {
    const done = typeof meas[d.id] === 'number';
    if (!done && !showTodo) continue;
    if (shown[d.g] === false) continue;
    const col = done ? groups[d.g].color : '#9aa1a7';
    g.add(seg(d.a, d.b, new THREE.Color(col).getHex(), !done));
    const f = d.g === 'F' ? .3 : .5;
    g.add(tag(done ? String(meas[d.id]) : d.id, d.a.map((v,i)=>v+(d.b[i]-v)*f), done ? col : '#7b838a', !done));
    const A = P(d.a), B = P(d.b), len = A.distanceTo(B);
    const hit = new THREE.Mesh(new THREE.CylinderGeometry(35,35,Math.max(len,50),6,1,true),
      new THREE.MeshBasicMaterial({ visible:false }));
    hit.position.copy(A.clone().add(B).multiplyScalar(.5));
    hit.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), B.clone().sub(A).normalize());
    hit.userData.mid = d.id; hits.push(hit); g.add(hit);
  }
  return { group:g, hits };
}
export { THREE };

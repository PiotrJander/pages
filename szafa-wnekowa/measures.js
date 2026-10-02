/* measures.js — definicje pomiarów: co, gdzie i jak opisane. */
export const GROUPS = {
  A:{ color:'#d62728', name:'A – szerokość lewej wnęki' },
  B:{ color:'#d62728', name:'B – szerokość prawej wnęki (do linii drzwi)' },
  C:{ color:'#1f5fd6', name:'C – głębokość' },
  E:{ color:'#1a9e3a', name:'E – wysokość podłoga → sufit' },
  F:{ color:'#ff8c00', name:'F – przekątne otworu' },
  G:{ color:'#00898c', name:'G – występ i podciąg' },
};
const AT = ['przy podłodze','w środku','u góry'];

export function measureDefs(p){
  const S0=p.W_L, S1=S0+p.T_S, DRt=S1+p.W_R_tot, D=p.D;
  const z = [100, 1200, Math.max(400, Math.min(p.H_C_L,p.H_C_R)-140)];
  const L = [];
  const add = (id,g,desc,a,b,opt=false) => L.push({ id, g, desc, a, b, opt });

  z.forEach((zz,i) => {
    add('A'+(i+1),'A',`Lewa: szerokość przy froncie, ${AT[i]}`,[0,D-40,zz],[S0,D-40,zz]);
    add('A'+(i+4),'A',`Lewa: szerokość przy ścianie tylnej, ${AT[i]}`,[0,40,zz],[S0,40,zz]);
    add('B'+(i+1),'B',`Prawa: szerokość przy froncie, ${AT[i]}`,[S1,D-40,zz],[DRt,D-40,zz]);
    add('B'+(i+4),'B',`Prawa: szerokość przy ścianie tylnej, ${AT[i]}`,[S1,40,zz],[DRt,40,zz]);
    add('C'+(i+1),'C',`Głębokość przy lewej ścianie, ${AT[i]}`,[30,0,zz],[30,D,zz]);
    add('C'+(i+4),'C',`Głębokość przy występie od lewej, ${AT[i]}`,[S0-30,0,zz],[S0-30,D,zz]);
    add('C'+(i+7),'C',`Głębokość przy występie od prawej, ${AT[i]}`,[S1+30,0,zz],[S1+30,D,zz]);
    add('C'+(i+10),'C',`Głębokość przy linii drzwi, ${AT[i]}`,[DRt-30,0,zz],[DRt-30,D,zz]);
  });
  ['d','s','g'].forEach((k,i) =>
    add('G1'+k,'G',`Szerokość czoła występu, ${AT[i]}`,[S0,D+10,z[i]],[S1,D+10,z[i]]));

  const EC = [[40,60,'tył, przy lewej ścianie'],[S0-40,60,'tył, przy występie'],
              [40,D-60,'przód, przy lewej ścianie'],[S0-40,D-60,'przód, przy występie']];
  EC.forEach(([x,d,n],i) => add('EL'+(i+1),'E',`Lewa wnęka: podłoga → sufit, ${n}`,[x,d,0],[x,d,p.H_C_L]));
  const RC = [[S1+40,60,'tył, przy występie'],[DRt-40,60,'tył, przy drzwiach'],
              [S1+40,D-60,'przód, przy występie'],[DRt-40,D-60,'przód, przy drzwiach']];
  RC.forEach(([x,d,n],i) => add('ER'+(i+1),'E',`Prawa wnęka: podłoga → sufit, ${n}`,[x,d,0],[x,d,p.H_C_R]));

  const bd = D + p.beamProj*0.5;
  add('BZL','G','Lewa: podłoga → spód podciągu (pomiar bezpośredni)',[S0-40,bd,0],[S0-40,bd,p.BZ_L],true);
  add('BZR','G','Prawa: podłoga → spód podciągu (pomiar bezpośredni)',[S1+40,bd,0],[S1+40,bd,p.BZ_R],true);
  add('G2L','G','Lewa: sufit → dolna krawędź podciągu',[S0-40,bd,p.H_C_L],[S0-40,bd,p.BZ_L]);
  add('G2R','G','Prawa: sufit → dolna krawędź podciągu',[S1+40,bd,p.H_C_R],[S1+40,bd,p.BZ_R]);
  add('G3L','G','Lewa: głębokość podciągu (przód → tył)',[S0/2,p.D_stub,p.BZ_L-10],[S0/2,p.D_stub+p.beamProj,p.BZ_L-10],true);

  add('F1','F','Lewa, front: dół przy ścianie → góra przy występie',[0,D,0],[S0,D,p.H_C_L]);
  add('F2','F','Lewa, front: dół przy występie → góra przy ścianie',[S0,D,0],[0,D,p.H_C_L]);
  add('F3','F','Prawa: przekątna otworu (opcjonalna)',[S1,D,0],[DRt,D,p.H_C_R],true);
  add('F4','F','Prawa: przekątna w drugą stronę (opcjonalna)',[DRt,D,0],[S1,D,p.H_C_R],true);
  return L;
}

export function spread(meas, ids){
  const v = ids.map(i=>meas[i]).filter(x=>typeof x==='number');
  return v.length > 1 ? { min:Math.min(...v), max:Math.max(...v), n:v.length } : null;
}

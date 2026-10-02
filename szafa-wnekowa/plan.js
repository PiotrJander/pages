import { r0, edgeText, featBadge, drillText } from './core.js';
import { useState } from 'preact/hooks';
import * as K from './content.js';
import { html, Table as Tbl, CopyBox } from './widgets.js';

const PLN = K.PLN;

const GRP = {
  korpus: 'Korpusy i półki', plecy: 'Plecy HDF', nisza: 'Nisza',
  front: 'Fronty', blenda: 'Blendy, cokół, listwa' };

function CutTable({ panels, stage, onPanel, mode }) {
  return html`${Object.keys(GRP).map(g => {
    const rows = panels.filter(q => q.grp === g && q.stage === stage);
    if (!rows.length) return null;
    return html`<h4>${GRP[g]}</h4>
      <table class="ptbl">
        <tr><th>Kod</th><th>Element</th><th>Dł × Szer</th><th>Szt</th><th>Obrzeże</th><th>Nawierty</th><th></th></tr>
        ${rows.map(q => html`<tr>
          <td>${q.code}</td><td class="a">${q.name}</td>
          <td class="n">${r0(q.Lg)} × ${r0(q.Wd)}</td><td class="n">${q.qty}</td>
          <td class="n">${edgeText(q)}</td><td class="n">${featBadge(mode==='shop' ? K.shopOnly(q) : q)}</td>
          <td class="n"><button class="pbtn" onClick=${() => onPanel(q.code)}>3D</button></td>
        </tr>`)}
      </table>`;
  })}`;
}

/* Arkusz w skali: pasy wzdłuż słojów, formatki w pasach. */
function SheetSvg({ sh, S, i, of }) {
  const k = S.trim;
  return html`<figure class="sheet">
    <svg viewBox="0 0 ${S.L} ${S.W}" role="img" aria-label=${`Arkusz ${i} z ${of}`}>
      <rect x="0" y="0" width=${S.L} height=${S.W} class="sh-bg" />
      ${sh.strips.map(st => st.parts.map(pt => { const fs = Math.min(64, pt.w*0.42, pt.l/(pt.code.length*0.65));
        return html`<g>
        <rect x=${k+pt.x} y=${k+st.y} width=${pt.l} height=${pt.w} class="sh-pt" />
        ${fs >= 24 && html`<text x=${k+pt.x+pt.l/2} y=${k+st.y+pt.w/2}
          font-size=${fs} class="sh-tx">${pt.code}</text>`}
      </g>`; }))}
    </svg>
    <figcaption>Arkusz ${i}/${of} · słoje poziomo, wzdłuż 2800 mm</figcaption>
  </figure>`;
}

function Nesting({ T, nest, together, setTogether }) {
  const key = together ? ['p18_all'] : ['p18_1','p18_2'];
  const zl = (a,b) => Math.round(a) === Math.round(b) ? `${PLN(a)} zł` : `${PLN(a)}–${PLN(b)} zł`;
  return html`
    <div class="seg">
      <button aria-pressed=${together} onClick=${() => setTogether(true)}>Jedno zamówienie</button>
      <button aria-pressed=${!together} onClick=${() => setTogether(false)}>Dwa etapy</button>
    </div>
    <div class="sum">
      <div><span>Płyta 18 mm</span><b>${key.reduce((a,k2)=>a+nest[k2].n,0)} ark.</b></div>
      <div><span>HDF 3 mm</span><b>${nest.hdf_all.n} ark.</b></div>
      <div><span>Wykorzystanie</span><b>${together ? Math.round(nest.p18_all.util*100) : Math.round((nest.p18_1.area+nest.p18_2.area)/((nest.p18_1.n+nest.p18_2.n)*5.796)*100)}%</b></div>
    </div>
    ${key.map(k2 => html`
      ${!together && html`<h4>${k2==='p18_1' ? 'Etap 1 – korpusy' : 'Etap 2 – elementy widoczne'}</h4>`}
      <div class="sheets">${nest[k2].sheets.map((sh,i) =>
        html`<${SheetSvg} sh=${sh} S=${nest[k2].S} i=${i+1} of=${nest[k2].n} />`)}</div>`)}
    <p class="note">Formatki płyty laminowanej się nie obraca (słoje); HDF tak. Odjęte 10 mm obrzynku z każdej krawędzi arkusza i 4,4 mm na rzaz.
      To prosta heurystyka – optymalizator w zakładzie zrobi tyle samo albo lepiej.</p>
    ${!together && (() => { const extra = nest.p18_1.n + nest.p18_2.n - nest.p18_all.n, dec = v => v.toFixed(1).replace('.',',');
      return html`<p class=${extra ? 'warn' : 'note'}>${extra
        ? `Dwa etapy kosztują ${extra === 1 ? 'jeden arkusz' : extra + ' arkusze'} więcej: etap 1 to ${dec(nest.p18_1.area)} m² na ${nest.p18_1.n} ark., a etap 2 – ${dec(nest.p18_2.area)} m² na osobnym arkuszu.`
        : 'Podział na etapy nie zmienia liczby arkuszy.'}</p>`; })()}
    <h4>Wycena według cenników z maili</h4>
    ${K.PRICE.shops.map(shop => { const q = K.quote(T, nest, shop, together);
      return html`<h4 class="shop">${shop.n} · <b>${zl(q.lo, q.hi)}</b></h4>
        <${Tbl} head=${['Pozycja','Koszt']} rows=${[...q.lines.map(l => [l[0], zl(l[1], l[2])])]} />
        <p class="note">${shop.note}</p>`; })}
    <p class="note">Cena arkusza przyjęta ${PLN(K.PRICE.sheet18[0])}–${PLN(K.PRICE.sheet18[1])} zł (biały podstawowy → dekor drewnopodobny),
      HDF ${K.PRICE.sheetHdf[0]}–${K.PRICE.sheetHdf[1]} zł – żaden zakład jej nie podał, zależy od dekoru.</p>`;
}

const polki = n => n === 1 ? 'półka'
  : (n%10 >= 2 && n%10 <= 4 && (n%100 < 12 || n%100 > 14)) ? 'półki' : 'półek';

export function PlanTab({ model, T, nest, onPanel }) {
  const { p, g, panels, layout } = model;
  const [mode, setMode] = useState('shop');
  const [together, setTogether] = useState(true);
  const cnt = s => panels.filter(q => q.stage === s).reduce((a,q) => a+q.qty, 0);
  const zl = (a,b) => `${PLN(a)}–${PLN(b)} zł`;
  const q0 = K.quote(T, nest, K.PRICE.shops[0], together);
  const hw = [700, 1400], tot = [q0.lo + hw[0], q0.hi + hw[1]];
  const selfRows = panels.filter(q => q.stage === 1)
    .map(q => [q.code, drillText({ ...q, feats: q.feats.filter(f => !['cup35','groove'].includes(f.t)) }).join('<br>'), String(q.qty)])
    .filter(r => r[1]);
  const bayL = g.carc.L[1]-g.carc.L[0];

  return html`<section>
    <h2>Plan wykonania</h2>
    <p class="note">Wszystko poniżej przelicza się z pomiarów i ustawień z zakładki Model.</p>

    <details open><summary>1 · Proponowany układ</summary>
      <ul class="bul">
        <li><b>Lewa skrzynia</b> (${r0(bayL)} mm, ${r0(g.depth-3)} mm światła w głąb) to część wieszakowa: drążek w poprzek na ${r0(layout.rail.z)} mm, ${p.railGap} mm pod wieńcem (miejsce na haczyk wieszaka), pod nim ${r0(layout.rail.clearBelow)} mm do półki na buty. Bez półki nad drążkiem – zostawała po niej szpara 89 mm, do niczego.</li>
        <li><b>Prawa skrzynia</b> (${r0(g.carc.R[1]-g.carc.R[0])} mm) zostaje półkowa: ${layout.bays.RD.n} ${polki(layout.bays.RD.n)}, komory ${Math.min(...layout.bays.RD.gaps)}–${Math.max(...layout.bays.RD.gaps)} mm.</li>
        <li><b>Górne skrzynie</b> bez półek – ${layout.bays.LG.inner} mm prześwitu na walizki i pościel.</li>
        <li><b>Nisza między skrzyniami</b>: ${r0(g.nW)} × ${r0(g.nDep)} mm, do ${r0(g.nTop)} mm, gdzie zamyka ją podciąg. Szerokość wyznaczają boki skrzyń, nie ściana, ale to prognoza – zmierz po ustawieniu korpusów.</li>
        <li>Szafa wychodzi <b>${r0(g.depth+p.gapBack-p.D_stub)} mm przed występ</b>. To cena za wieszaki.</li>
      </ul>
    </details>

    <details open><summary>2 · Lista formatek do zamówienia</summary>
      <div class="sum">
        <div><span>Formatek</span><b>${T.szt} szt.</b></div>
        <div><span>Konfirmatów</span><b>${T.konfirmaty} szt.</b></div>
        <div><span>Płyta 18 mm</span><b>≈ ${T.m18.toFixed(1)} m²</b></div>
        <div><span>Obrzeże ABS</span><b>≈ ${Math.ceil(T.mb)} mb</b></div>
      </div>
      <h4>Nagłówek zamówienia — uzupełnij przed wysłaniem</h4>
      <ul class="bul">
        <li><b>Dekor:</b> ……… (producent + kod + struktura). Jedna partia na wszystkie elementy widoczne.</li>
        <li><b>Płyta:</b> wiórowa laminowana 18 mm · <b>Plecy:</b> HDF 3 mm biała</li>
        <li><b>Obrzeże:</b> ABS 2 mm w kolorze płyty, krawędź frezowana przed oklejeniem</li>
        <li><b>Tolerancja:</b> ±0,5 mm, kąt prosty</li>
      </ul>
      <h4>Legenda krawędzi i nawiertów</h4>
      <ul class="bul">
        <li><b>D1, D2</b> – krawędzie o długości równej pierwszemu wymiarowi. <b>S1, S2</b> – drugiemu.</li>
        <li>W elementach korpusu <b>D2 to zawsze krawędź przednia</b>.</li>
        <li><b>Lico A</b> – strona z nawiertami ⌀5, do wnętrza skrzyni. <b>Lico B</b> – zewnętrzna.</li>
      </ul>
      <p class="note">Przycisk <b>3D</b> przy formatce otwiera jej podgląd z nawiertami – to dla Ciebie, nie dla zakładu.</p>

      <h4>Zakres usług w zamówieniu</h4>
      <div class="seg">
        <button aria-pressed=${mode==='shop'} onClick=${() => setMode('shop')}>Cięcie + oklejanie + puszki</button>
        <button aria-pressed=${mode==='full'} onClick=${() => setMode('full')}>Z nawiertami systemowymi</button>
      </div>
      <p class="note">${mode==='shop'
        ? 'Tak pracują FH Drewno i Famero: zakład wierci tylko puszki zawiasów. Konfirmaty i kołki półek wiercisz sam – lista niżej.'
        : 'Wersja dla zakładu, który wierci wszystko. Plecy wtedy możesz zamówić w rowku.'}</p>

      <h3>Etap 1 — korpusy (${cnt(1)} szt.)</h3>
      <p class="note">Zamawiasz teraz, w ciemno. Wymiary wynikają wyłącznie z listy, nie z muru. Partia dekoru nieistotna.</p>
      <${CutTable} panels=${panels} stage=${1} onPanel=${onPanel} mode=${mode} />
      <${CopyBox} text=${K.orderText(model,1,mode)} label="Skopiuj zamówienie — etap 1" rows=6 />
      <${CopyBox} text=${K.orderCSV(model,1,mode)} label="CSV etap 1" rows=4 />

      <h3>Etap 2 — wszystko widoczne (${cnt(2)} szt.)</h3>
      <p class="note">Zamawiasz po ustawieniu i wypoziomowaniu skrzyń. <b>Wszystkie pozycje z jednej partii dekoru.</b></p>
      <${CutTable} panels=${panels} stage=${2} onPanel=${onPanel} mode=${mode} />
      <${CopyBox} text=${K.orderText(model,2,mode)} label="Skopiuj zamówienie — etap 2" rows=6 />
      <${CopyBox} text=${K.orderCSV(model,2,mode)} label="CSV etap 2" rows=4 />

      ${mode==='shop' && html`<h3>Do wywiercenia samemu</h3>
        <p class="note">${T.konfirmaty} par konfirmatowych i ${T.holes.hole5} otworów pod kołki – tylko tam, gdzie stoi półka.
          Pozycje kołków leżą na siatce 32 mm, więc szablon systemowy pozwoli kiedyś dowiercić półkę pośrednią.
          Do tego ${T.holes.plate} pilotów ⌀3 pod prowadniki zawiasów, po dwa na prowadnik, w linii 37 mm od przodu.
          Ich wysokości są dobrane tak, żeby prowadnik omijał każdą półkę (min. 40 mm od osi).
          Konfirmat: oba elementy ściśnięte, wiertło stopniowe przez bok w czoło wieńca za jednym razem.</p>
        <${Tbl} head=${['Kod','Otwory','Szt.']} rows=${selfRows} />`}
    </details>

    <details open><summary>2a · Rozkrój i wycena</summary>
      <${Nesting} T=${T} nest=${nest} together=${together} setTogether=${setTogether} />
      <h4>CSV do optymalizatora rozkroju</h4>
      <p class="note">Długość = wzdłuż słojów, kolumna Grain mówi, czego nie obracać. Wklej do CutList Optimizer, OptiCutter albo konfiguratora zakładu.</p>
      <${CopyBox} text=${K.optimizerCSV(model)} label="Skopiuj CSV (całość)" rows=5 />
    </details>

    <details open><summary>3 · Gdzie to zamówić i jak zapytać</summary>
      <p>Kolejność jest odwrotna, niż się wydaje: <b>najpierw zakład, potem dekor z jego katalogu.</b> Hurtownia jest dealerem jednego do trzech producentów i jej oferta jest twoim realnym ograniczeniem.</p>
      <${Tbl} head=${['Zakład','Adres','Dlaczego']} rows=${K.SUPPLIERS.map(s => [s.n, s.a, s.why])} />
      <h4>Gotowe zapytanie wstępne</h4>
      <p class="note">Liczby przeliczają się z modelu. Bez listy formatek – na tym etapie zakład jej nie potrzebuje.</p>
      <${CopyBox} text=${K.enquiryMail(model)} label="Skopiuj zapytanie" rows=11 />
      <p class="note">Odpowiedzi z września: FH Drewno i Famero sprzedają tylko pełne arkusze i liczą cięcie od arkusza; żaden nie wierci otworów systemowych ani konfirmatów. Quest czeka na listę formatek, MAGO – na wizytę po dekor.</p>
    </details>

    <details open><summary>4 · Okucia i drobnica</summary>
      <${Tbl} head=${['Element','Ilość','Uwagi']} rows=${K.hardware(T)} />
      <p class="note"><b>Nóżki nie wymagają nawiertów w zakładzie.</b> Stopka przykręcana jest czterema wkrętami 4×16 do spodu wieńca; pozycja nie jest krytyczna, więc otwory ⌀2,5 mm wywiercisz sam. Wyjątek to nóżki z trzpieniem w otwór ⌀8×13,5 mm. Stopki trzymaj minimum 60 mm od czoła wieńca, żeby wkręty nie trafiły w nawierty konfirmatowe.</p>
    </details>

    <details><summary>5 · Narzędzia</summary>
      <${Tbl} head=${['Status','Narzędzie','Uwagi']} rows=${K.TOOLS} /></details>

    <details><summary>6 · Budżet orientacyjny</summary>
      <${Tbl} head=${['Pozycja','Koszt']} rows=${[
        [`Formatki z zakładu (${K.PRICE.shops[0].n}, ${together ? 'jedno zamówienie' : 'dwa etapy'})`, zl(q0.lo, q0.hi)],
        ['Okucia i drobnica', zl(...hw)], ['<b>Razem</b>', `<b>${zl(...tot)}</b>`]]} />
      <p class="note">Bez narzędzi do dokupienia (ok. 400–700 zł, w tym szablon 32 mm). Szczegóły w punkcie 2a.</p>
    </details>

    <details open><summary>7 · Pierwszy weekend — same skrzynie</summary>
      <p class="note">Etap 1 od początku do końca. Nic widocznego, nic nieodwracalnego, żadnego docinania.</p>
      <${Tbl} head=${['Kiedy','Co','Ile']} rows=${K.WEEKEND(T)} />
      <h4>Kolejność jednej skrzyni</h4>
      <ol class="bul">${K.BOX_STEPS.map(s => html`<li dangerouslySetInnerHTML=${{__html:s}} />`)}</ol>
      <h4>Co może pójść nie tak</h4>
      <ul class="bul">${K.BOX_RISKS.map(s => html`<li dangerouslySetInnerHTML=${{__html:s}} />`)}</ul>
      <h4>Do obejrzenia przed tym weekendem</h4>
      <${Tbl} head=${['Technika','Frazy']} rows=${K.WEEKEND_YT.map(([t,q]) =>
        [t, q.map(x => `<span class="kw">${x}</span>`).join(' ')])} />
    </details>

    <details><summary>8 · Krok po kroku (cały projekt)</summary>
      ${K.STEPS.map((s,i) => html`<div class="step">
        <div class="sn">${i+1}</div>
        <div class="sc"><h4>${s.t}</h4><p dangerouslySetInnerHTML=${{__html:s.d}} /></div>
      </div>`)}
    </details>

    <details><summary>9 · Czego się nauczyć</summary>
      <${Tbl} head=${['Technika','Frazy']} rows=${K.YT.map(([t,q]) =>
        [t, q.map(x => `<span class="kw">${x}</span>`).join(' ')])} /></details>

    <details open><summary>10 · Podsumowanie</summary>
      <p>Cała precyzja jest po stronie maszyny w zakładzie rozkroju. Twoja robota to skręcanie prostokątnych pudeł, poziomowanie i jedno trudne zadanie: dopasowanie boku zamykającego do krzywej ściany.</p>
      <ol class="bul">
        <li><b>Lista formatek.</b> Sprawdź dwa razy, zanim wyślesz. Wszystko inne da się poprawić, tego nie.</li>
        <li><b>Kwadratowanie korpusów.</b> Równe przekątne przed przykręceniem pleców.</li>
        <li><b>Elementy z zapasem.</b> Ściany masz krzywe o ${r0(p.W_L-p.W_L_min)} mm po lewej, więc bok zamykający musi mieć co strugać.</li>
      </ol>
      <p>Harmonogram: wieczór na zamknięcie etapu 1, 1–2 tygodnie oczekiwania, weekend na korpusy, potem pomiar i etap 2, na koniec weekend na fronty i wykończenie.</p>
    </details>
  </section>`;
}

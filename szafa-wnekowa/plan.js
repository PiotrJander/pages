import { r0, edgeText, featBadge } from './core.js';
import * as K from './content.js';
import { html, Table as Tbl, CopyBox } from './widgets.js';

const PLN = K.PLN;

const GRP = {
  korpus: 'Korpusy i półki', plecy: 'Plecy HDF', nisza: 'Nisza',
  front: 'Fronty', blenda: 'Blendy, cokół, listwa' };

function CutTable({ panels, stage, onPanel }) {
  return html`${Object.keys(GRP).map(g => {
    const rows = panels.filter(q => q.grp === g && q.stage === stage);
    if (!rows.length) return null;
    return html`<h4>${GRP[g]}</h4>
      <table class="ptbl">
        <tr><th>Kod</th><th>Element</th><th>Dł × Szer</th><th>Szt</th><th>Obrzeże</th><th>Nawierty</th><th></th></tr>
        ${rows.map(q => html`<tr>
          <td>${q.code}</td><td class="a">${q.name}</td>
          <td class="n">${r0(q.Lg)} × ${r0(q.Wd)}</td><td class="n">${q.qty}</td>
          <td class="n">${edgeText(q)}</td><td class="n">${featBadge(q)}</td>
          <td class="n"><button class="pbtn" onClick=${() => onPanel(q.code)}>3D</button></td>
        </tr>`)}
      </table>`;
  })}`;
}

export function PlanTab({ model, T, onPanel }) {
  const { p, g, panels } = model;
  const cnt = s => panels.filter(q => q.stage === s).reduce((a,q) => a+q.qty, 0);
  const zl = (a,b) => `${PLN(a)}–${PLN(b)} zł`;
  const cost = {
    p18:[T.m18*95, T.m18*160], hdf:[T.mHdf*35, T.mHdf*55],
    edge:[T.mb*3, T.mb*6], cut:[160,320], hw:[700,1400] };
  const tot = [0,1].map(i => Object.values(cost).reduce((a,c) => a+c[i], 0));
  const bayL = g.carc.L[1]-g.carc.L[0];

  return html`<section>
    <h2>Plan wykonania</h2>
    <p class="note">Wszystko poniżej przelicza się z pomiarów i ustawień z zakładki Model.</p>

    <details open><summary>1 · Proponowany układ</summary>
      <ul class="bul">
        <li><b>Lewa skrzynia</b> (${r0(bayL)} mm, ${r0(g.depth-3)} mm światła w głąb) to część wieszakowa: drążek w poprzek na ${r0(p.railZ)} mm, nad nim półka, niżej półka na buty.</li>
        <li><b>Prawa skrzynia</b> (${r0(g.carc.R[1]-g.carc.R[0])} mm) zostaje półkowa – na wieszaki w poprzek jest za wąska.</li>
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

      <h3>Etap 1 — korpusy (${cnt(1)} szt.)</h3>
      <p class="note">Zamawiasz teraz, w ciemno. Wymiary wynikają wyłącznie z listy, nie z muru. Partia dekoru nieistotna.</p>
      <${CutTable} panels=${panels} stage=${1} onPanel=${onPanel} />
      <${CopyBox} text=${K.orderText(model,1)} label="Skopiuj zamówienie — etap 1" rows=6 />
      <${CopyBox} text=${K.orderCSV(model,1)} label="CSV etap 1" rows=4 />

      <h3>Etap 2 — wszystko widoczne (${cnt(2)} szt.)</h3>
      <p class="note">Zamawiasz po ustawieniu i wypoziomowaniu skrzyń. <b>Wszystkie pozycje z jednej partii dekoru.</b></p>
      <${CutTable} panels=${panels} stage=${2} onPanel=${onPanel} />
      <${CopyBox} text=${K.orderText(model,2)} label="Skopiuj zamówienie — etap 2" rows=6 />
      <${CopyBox} text=${K.orderCSV(model,2)} label="CSV etap 2" rows=4 />
    </details>

    <details open><summary>3 · Gdzie to zamówić i jak zapytać</summary>
      <p>Kolejność jest odwrotna, niż się wydaje: <b>najpierw zakład, potem dekor z jego katalogu.</b> Hurtownia jest dealerem jednego do trzech producentów i jej oferta jest twoim realnym ograniczeniem.</p>
      <${Tbl} head=${['Zakład','Adres','Dlaczego']} rows=${K.SUPPLIERS.map(s => [s.n, s.a, s.why])} />
      <h4>Gotowe zapytanie wstępne</h4>
      <p class="note">Liczby przeliczają się z modelu. Bez listy formatek – na tym etapie zakład jej nie potrzebuje.</p>
      <${CopyBox} text=${K.enquiryMail(model)} label="Skopiuj zapytanie" rows=11 />
      <h4>Czego się spodziewać w wycenie</h4>
      <${Tbl} head=${['Pozycja','Stawka','Przy naszym zamówieniu']} rows=${[
        ['Cięcie','1,3–5 zł/mb','zależy od rozkroju'],
        ['Oklejanie ABS 2 mm','3–6 zł/mb',`${Math.ceil(T.mb)} mb → ${zl(T.mb*3, T.mb*6)}`],
        ['Nawierty <b>za otwór</b>','1–3 zł/szt',`${T.holesTotal} szt. → ${zl(T.holesTotal, T.holesTotal*3)}`],
        ['Nawierty <b>za element</b>','10–20 zł/szt',`${T.drilled} elem. → ${zl(T.drilled*10, T.drilled*20)}`]]} />
      <p class="warn">Te dwa wiersze to ta sama robota wyceniona dwoma modelami. Różnica jest kilkukrotna, więc zapytaj o to wprost, zanim wyślesz listę.</p>
    </details>

    <details open><summary>4 · Okucia i drobnica</summary>
      <${Tbl} head=${['Element','Ilość','Uwagi']} rows=${K.hardware(T)} />
      <p class="note"><b>Nóżki nie wymagają nawiertów w zakładzie.</b> Stopka przykręcana jest czterema wkrętami 4×16 do spodu wieńca; pozycja nie jest krytyczna, więc otwory ⌀2,5 mm wywiercisz sam. Wyjątek to nóżki z trzpieniem w otwór ⌀8×13,5 mm. Stopki trzymaj minimum 60 mm od czoła wieńca, żeby wkręty nie trafiły w nawierty konfirmatowe.</p>
    </details>

    <details><summary>5 · Narzędzia</summary>
      <${Tbl} head=${['Status','Narzędzie','Uwagi']} rows=${K.TOOLS} /></details>

    <details><summary>6 · Budżet orientacyjny</summary>
      <${Tbl} head=${['Pozycja','Koszt']} rows=${[
        ['Płyta 18 mm', zl(...cost.p18)], ['HDF 3 mm', zl(...cost.hdf)],
        ['Obrzeże ABS', zl(...cost.edge)], ['Cięcie, oklejanie, wiercenie', zl(...cost.cut)],
        ['Okucia i drobnica', zl(...cost.hw)], ['<b>Razem</b>', `<b>${zl(...tot)}</b>`]]} />
      <p class="note">Bez narzędzi do dokupienia (ok. 400–700 zł). Wiersz „cięcie, oklejanie, wiercenie” zakłada wycenę nawiertów za element.</p>
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

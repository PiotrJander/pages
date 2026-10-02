/* content.js — treść planu. Dane, nie komponenty. */
import { r0, drillText, edgeText, totals } from './core.js';

export const PLN = n => Math.round(n).toLocaleString('pl-PL');

export const TOOLS = [
  ['Masz już','Pilarka zagłębiarka + szyna','do blend, listwy górnej i cokołu'],
  ['Masz już','Lamelownica','opcjonalnie: łączenie blend w kształt L'],
  ['Masz już','Laser krzyżowy + statyw','poziomowanie korpusów'],
  ['Masz już','Poziomica 120 cm, dalmierz, taśma 5 m',''],
  ['Masz już','Odkurzacz warsztatowy','podłącz do pilarki, płyta pyli bardzo'],
  ['Dokupić','Wiertarko-wkrętarka + bity T20/T25','konfirmaty mają torx'],
  ['Dokupić','Wiertło stopniowe do konfirmatów 4,5/7 mm','ok. 30–50 zł'],
  ['Dokupić','Wiertło ⌀5 mm z ogranicznikiem głębokości','otwory pod półki'],
  ['Dokupić','Szablon do otworów systemowych 32 mm','tylko jeśli nie zamówisz nawiertów'],
  ['Dokupić','Kątownik montażowy / ścisk kątowy (2 szt.)','trzyma korpus pod 90° przy skręcaniu'],
  ['Dokupić','Ściski stolarskie 2 × 300 mm',''],
  ['Dokupić','Cyrkiel traserski (scribe)','do dopasowania blend – kluczowy'],
  ['Dokupić','Tarnik / strug zdzierak + papier ścierny',''],
  ['Dokupić','Wykrywacz przewodów','zanim wywiercisz w ścianie'],
  ['Dokupić','Kątownik stolarski 300 mm, ołówek stolarski',''],
  ['Dokupić','Okulary, maska przeciwpyłowa, rękawice',''],
  ['Przydatne','Kliny montażowe',''],
  ['Przydatne','Kozły lub stół roboczy + płyta ofiarna',''],
];

export const hardware = T => ([
  ['Konfirmat 7×50 mm', `${T.konfirmaty} szt. (kup ${Math.ceil(T.konfirmaty*1.15/50)*50})`, 'tyle wynika z nawiertów w liście formatek'],
  ['Nóżki regulowane 100 mm + klipsy cokołu', '8 szt. + 6 klipsów', 'kup je PRZED zamówieniem cokołu – wysokość cokołu musi być równa wysokości nóżki plus grubość podkładki'],
  ['Podkładki pod nóżki 100×100 mm', '8 szt.', 'sklejka 6–10 mm. Rozkładają nacisk na wykładzinie mniej więcej dziesięciokrotnie. Grubość odejmij od nastawy nóżki.'],
  ['Zawias puszkowy 110° z cichym domykiem + prowadnik', `${T.zawiasy} kpl.`, 'tyle, ile puszek ⌀35 w liście formatek'],
  ['Podpórki półek ⌀5 mm', `${T.polek*4} szt. (+ zapas)`, 'metalowe, nie plastikowe'],
  ['Kątowniki meblowe + kołki 6×40', '8 kompletów', 'kotwienie do ściany'],
  ['Wkręty 4×30 do skręcania korpusów', '8 szt.', 'górna skrzynia w dolną, od środka'],
  ['Gwoździki 1,4×25 albo zszywki do HDF', 'paczka', 'jeśli plecy nakładane zamiast w rowku'],
  ['Drążek owalny stalowy + uchwyty', '1 kpl.', 'lewa skrzynia'],
  ['Uchwyty', `${T.frontow} szt.`, 'albo push-to-open'],
  ['Zderzaki silikonowe', '20 szt.', ''],
  ['Obrzeże ABS 2 mm w kolorze płyty', 'zapas 3 m', 'do poprawek po docięciu blend i półek niszy'],
]);

export const WEEKEND = T => ([
  ['piątek wieczór', 'Rozpakowanie. Zmierz <b>każdą</b> formatkę i porównaj z listą, zanim cokolwiek skręcisz — reklamacja działa tylko przed montażem. Opisz ołówkiem na licu B: kod z listy plus strzałka „dół”.', '45 min'],
  ['sobota rano', 'Stanowisko: karton albo stary koc na podłodze, dwa kozły, odkurzacz przy pile. Rozłóż okucia na kupki po skrzyni.', '30 min'],
  ['sobota', `Skręcanie czterech skrzyń, ${T.konfirmaty} konfirmatów. Pierwsze złącze zajmie 20 minut, dziesiąte pięć. Kolejność w jednej skrzyni: bok + wieniec dolny → drugi bok → wieniec górny → <b>pomiar przekątnych</b> → dopiero wtedy plecy.`, '3–4 h'],
  ['sobota po południu', 'Nóżki, po 4 na skrzynię dolną, plus podkładki 100×100 mm pod każdą (wykładzina).', '45 min'],
  ['niedziela', 'Wstawianie, poziomowanie laserem po górnych krawędziach, górne skrzynie na dolne, kotwienie do ściany.', '3 h'],
  ['niedziela, koniec', 'Pomiar kontrolny do etapu 2: odstęp w niszy na trzech wysokościach, szerokości pod fronty, wysokość do sufitu, szczelina przy lewej ścianie.', '30 min'],
]);

export const BOX_STEPS = [
  'Połóż <b>bok</b> licem A do góry. Przyłóż <b>wieniec dolny</b> czołem do jego krawędzi, wyrównaj kątownikiem, ściśnij ściskiem.',
  'Wkręć 3 konfirmaty. Jeśli zakład nie wiercił: wierć <b>przez bok w czoło wieńca za jednym razem</b>, wiertłem stopniowym, przy ściśniętych elementach. Wtedy otwory nie mogą się rozminąć.',
  'To samo z wieńcem górnym. Masz literę „U”.',
  'Nałóż drugi bok, ściśnij, wkręć 6 konfirmatów.',
  '<b>Zmierz obie przekątne.</b> Różnica ponad 2 mm — popchnij skrzynię po podłodze za róg, aż się zrównają.',
  'Wsuń plecy w rowek (albo przykręć na wierzch). Od tego momentu kąt jest zablokowany na stałe.',
];

export const BOX_RISKS = [
  '<b>Ukręcony wkręt.</b> Wkrętarka na maksymalnym momencie rozerwie płytę od środka. Ustaw sprzęgło nisko i dokręć ostatni obrót ręcznie.',
  '<b>Odprysk laminatu</b> przy wierceniu. Wierć od lica, podłóż odpad pod spód, nie wychodź wiertłem gwałtownie.',
  '<b>Skrzynia w romb.</b> Wykryjesz tylko przekątnymi. Po przykręceniu pleców jest za późno.',
  '<b>Bok odwrócony</b> — lico A z nawiertami musi patrzeć do środka. Stąd strzałka „dół” ołówkiem.',
];

export const WEEKEND_YT = [
  ['Konfirmat od zera', ['montaż na konfirmaty krok po kroku','wiertło stopniowe do konfirmatów jak wiercić','confirmat screw how to']],
  ['Wiercenie bez odprysków', ['wiercenie w płycie laminowanej bez odprysków','jak nie rozerwać płyty wiórowej wkrętem']],
  ['Kwadratowanie korpusu', ['sprawdzanie przekątnych korpusu mebla','squaring a cabinet carcass diagonals']],
  ['Plecy HDF', ['plecy HDF w rowku czy nakładane','cabinet back panel groove vs rebate']],
  ['Nóżki i poziomowanie', ['poziomowanie szafek nóżki regulowane','poziomowanie korpusów laserem krzyżowym']],
  ['Kotwienie do ściany', ['mocowanie szafy do ściany kątowniki kołki','jak sprawdzić rodzaj ściany przed wierceniem','anti tip anchoring tall cabinet']],
];

export const YT = [
  ['Rozkrój i zamówienie', ['rozkrój płyty meblowej program','jak zamówić formatki na wymiar','optymalizacja rozkroju płyty']],
  ['Konstrukcja korpusu', ['montaż korpusu na konfirmaty','wiertło stopniowe konfirmat jak wiercić','plecy HDF w rowku czy na wierzch']],
  ['Otwory pod półki', ['otwory systemowe 32 mm szablon','system 32 jig shelf pin holes','LR32 alternatywa DIY']],
  ['Zabudowa wnęki', ['szafa wnękowa DIY krok po kroku','built-in wardrobe alcove DIY','fitted wardrobe install uneven walls']],
  ['Dopasowanie do krzywej ściany', ['scribing to a wall woodworking','docinanie blendy do krzywej ściany','scribe filler panel cabinet']],
  ['Pilarka zagłębiarka', ['pilarka zagłębiarka szyna prowadząca podstawy','track saw bevel cut technique']],
  ['Zawiasy Blum', ['montaż zawiasów Blum regulacja 3D','Blum Clip top Blumotion adjustment','ustawianie szczelin między frontami']],
  ['Wykończenie', ['obrzeże ABS klejenie żelazkiem','edge banding by hand trim','cokół meblowy montaż klipsy']],
];

export const STEPS = [
  { t:'Zamknij projekt i wypisz listę formatek', d:'Ustal ostatecznie wariant niszy, wysokość podziału i luzy. Sprawdź listę <b>dwa razy</b>: czy od szerokości korpusu odjęto 2 × grubość płyty, czy głębokości półek są mniejsze od głębokości korpusu, czy suma szerokości frontów plus szczeliny daje szerokość korpusu. Błąd w tej tabeli jest najdroższym błędem w całym projekcie.' },
  { t:'Zamów etap 1', d:'Same korpusy. Podaj wymiary <b>gotowe, po oklejeniu</b>, i do każdej formatki napisz, które krawędzie okleić. Zapytaj o model wyceny nawiertów, zanim wyślesz listę.' },
  { t:'Rozpakuj i sprawdź dostawę', d:'Zmierz każdą formatkę zanim cokolwiek skręcisz. Reklamacja jest możliwa tylko przed montażem. Opisz ołówkiem kod i stronę „dół”. Ustaw formatki pionowo, oparte, nie na płask na stosie.' },
  { t:'Skręć korpusy na leżąco', d:'Na podłodze, na kartonie. Boki z wieńcami, potem przekątne, dopiero na końcu plecy.' },
  { t:'Cokół i nóżki', d:'Wkręć nóżki, 4 na korpus, cofnięte o 45 mm od frontu, z podkładkami na wykładzinie. Poziomuj <b>górną krawędź korpusu</b>, a nie podłogę.' },
  { t:'Wstaw korpusy i zakotw je', d:'Lewy dolny, poziom, kotwienie. Prawy dolny tak samo. Potem górne na wierzch, skręcone od środka w dół, i osobno zakotwione do ściany.' },
  { t:'Zmierz i zamów etap 2', d:'Odstęp w niszy na trzech wysokościach, szerokości pod fronty, wysokość do sufitu. Wszystkie pozycje etapu 2 z jednej partii dekoru.' },
  { t:'Zbuduj niszę', d:'Najpierw plecy niszy (zakrywają krzywe czoło występu i wiążą skrzynie ze sobą), potem półki na kołkach. Otwory niszy wierć w innej odległości od krawędzi przedniej niż wewnętrzne, żeby się nie spotkały w 18 mm płycie.' },
  { t:'Dopasuj bok zamykający szczelinę', d:'Najtrudniejszy krok. Przyłóż deskę, ustaw w pionie, rozstaw cyrkiel na największą szczelinę i przeciągnij po ścianie. Tnij zagłębiarką z lekkim podcięciem 2–3°. <b>Przećwicz na odpadzie.</b>' },
  { t:'Powieś fronty', d:'Przykręć prowadniki, wepnij zawiasy. Ustaw najpierw front skrajny, potem resztę — każdy równa się do sąsiada, nie do korpusu.' },
  { t:'Reguluj szczeliny', d:'Cel to równe 3 mm wszędzie. Rób to przy zamkniętych drzwiach, patrząc na całą taflę z odległości.' },
  { t:'Listwa górna i wykończenie', d:'Dotnij listwę do sufitu tą samą metodą co bok. Na końcu półki, uchwyty, zderzaki i akryl na styku ze ścianą.' },
];

export const SUPPLIERS = [
  { n:'MAGO dla Stolarstwa', a:'Kolumny 220A oraz Aleksandrowska 189', why:'Piła panelowa HOMAG, okleiniarka PUR, platforma do wyceny rozkroju online (erozrys.magolodz.pl). Najsilniejszy kandydat.' },
  { n:'Famero', a:'Józefów 21', why:'W nazwie wprost cięcie i oklejanie, centra CNC, Egger. Wysokie oceny przy małej próbie.' },
  { n:'DEKOR-PŁYT', a:'Elektronowa 4', why:'Największa baza opinii w Łodzi. Duża skala zwykle oznacza lepsze ceny.' },
  { n:'Quest – Płyty meblowe Egger', a:'Obywatelska 102/104', why:'Specjalista od jednego producenta. Dobry w doradztwie, sprawdź moce przerobowe.' },
  { n:'Paged Trade', a:'Przybyszewskiego 176/178', why:'Sklejka, nie laminat. Zapisz na wypadek powrotu do wariantu ze sklejką.' },
];

export function enquiryMail(model){
  const T = totals(model), { p, g, panels } = model;
  const st = n => panels.filter(q => q.stage === n);
  const qty = a => a.reduce((x,q)=>x+q.qty, 0);
  const m2 = a => a.filter(q=>!q.mat.includes('HDF')).reduce((x,q)=>x+q.Lg*q.Wd/1e6*q.qty,0);
  const dec = n => n.toFixed(1).replace('.', ',');
  const maxd = Math.max(...panels.map(q => Math.max(q.Lg, q.Wd)));
  return `Temat: Zapytanie o wycenę – formatki do szafy wnękowej (ok. ${T.m18.toFixed(0)} m², osoba prywatna)

Dzień dobry,

planuję samodzielnie złożyć szafę wnękową i szukam zakładu, który przytnie, oklei i nawierci formatki. Zanim wyślę pełną listę, chciałbym wstępnie ustalić zakres i rząd wielkości kosztów.

SKALA ZAMÓWIENIA
· płyta wiórowa laminowana 18 mm: ok. ${dec(T.m18)} m² (${qty(panels.filter(q=>!q.mat.includes('HDF')))} szt. formatek)
· HDF 3 mm na plecy: ok. ${dec(T.mHdf)} m²
· obrzeże ABS 2 mm: ok. ${Math.ceil(T.mb)} mb
· największy element: ${r0(maxd)} mm
· nawierty: ${T.holes.hole5} × ⌀5×10 (system 32), ${T.holes.cup35} × puszka ⌀35×13,
  ${T.holes.conf7} × ⌀7 przelotowy i ${T.holes.conf45} × ⌀4,5×40 w czole (pary konfirmatowe)
· opcjonalnie rowek 4×10 mm pod plecy, ok. ${T.grooveMb.toFixed(0)} mb

Zamówienie chciałbym podzielić na dwa etapy: najpierw korpusy (${qty(st(1))} formatek, ${dec(m2(st(1)))} m²), a po ich zmontowaniu elementy widoczne (${qty(st(2))} formatek, ${dec(m2(st(2)))} m²), które muszą pochodzić z jednej partii dekoru.

PYTANIA
1. Jakich producentów płyt Państwo prowadzą i czy można obejrzeć wzorniki na miejscu albo dostać próbki dekoru?
2. Czy do wybranego dekoru dostępne jest obrzeże ABS 2 mm tego samego producenta?
3. Czy materiał rozliczają Państwo z całego arkusza, czy z wykorzystanych m²?
4. Jaka jest stawka za cięcie i za oklejanie?
5. Nawierty – czy wykonują Państwo otwory systemowe ⌀5×10 co 32 mm, puszki ⌀35×13 oraz pary konfirmatowe? I kluczowe: czy wycena jest za otwór, czy za element? Przy ${T.holes.hole5} otworach systemowych ta różnica decyduje o sensie całego zamówienia.
6. W jakiej formie przyjmują Państwo listę formatek – tabela, CSV, czy wymagany jest plik DXF/DWG?
7. Orientacyjny termin realizacji i czy dowożą Państwo na terenie Łodzi.

Pełną listę formatek z wymiarami, oklejaniem i opisem nawiertów prześlę od razu po wstępnej odpowiedzi.

Pozdrawiam`;
}

export function orderText(model, stage){
  const { panels, joints, g } = model;
  const sel = panels.filter(q => !stage || q.stage === stage);
  const head = [
`ZAMÓWIENIE – SZAFA WNĘKOWA${stage ? ` · ETAP ${stage} (${stage===1?'korpusy':'elementy widoczne'})` : ''}`,
'',
'Materiał: płyta wiórowa laminowana 18 mm — DEKOR DO UZUPEŁNIENIA (producent + kod + struktura)',
'Plecy: HDF 3 mm biała',
'Obrzeże: ABS 2 mm w kolorze płyty, klejone na gorąco, krawędź frezowana przed oklejeniem',
'',
'KONWENCJE',
'· Wszystkie wymiary są GOTOWE, po oklejeniu. Pierwszy wymiar = długość (wzdłuż usłojenia dekoru).',
'· Krawędzie: D1 i D2 mają długość równą pierwszemu wymiarowi; S1 i S2 — drugiemu.',
'· W elementach korpusu D2 jest zawsze krawędzią PRZEDNIĄ (widoczną).',
'· Lico A = strona z nawiertami ⌀5, skierowana do wnętrza skrzyni.',
'· Tolerancja cięcia ±0,5 mm, kąt prosty.',
stage===1 ? '· Ten etap to wnętrze szafy – dopuszczalna inna partia dekoru niż elementy widoczne.' : '',
stage===2 ? '· UWAGA: wszystkie pozycje w tym etapie muszą pochodzić z JEDNEJ PARTII dekoru.' : '',
'', 'FORMATKI'].filter(Boolean).join('\n');
  const body = sel.map((pn,i) => {
    const d = drillText(pn);
    return [`${String(i+1).padStart(2,'0')}. [${pn.code}] ${pn.name}`,
      `    ${r0(pn.Lg)} × ${r0(pn.Wd)} mm · ${pn.qty} szt. · ${pn.mat}`,
      `    Obrzeże 2 mm: ${edgeText(pn)}`,
      d.length ? `    Nawierty: ${d.join('\n               ')}` : '    Nawierty: brak',
      pn.faceNote ? `    Uwaga: ${pn.faceNote}` : ''].filter(Boolean).join('\n');
  }).join('\n\n');
  const tail = `\n\nPODSUMOWANIE\n· formatek: ${sel.reduce((a,q)=>a+q.qty,0)} szt.\n`
    + (stage !== 2 ? `· konfirmatów wynikających z nawiertów: ${joints.length} szt.\n` : '')
    + `· front łącznie: ${r0(g.X_right-g.X_left)} × ${r0(g.zF)} mm, głębokość ${r0(g.depth+model.p.gapBack)} mm`;
  return head + '\n\n' + body + tail;
}

export function orderCSV(model, stage){
  const rows = [['etap','dlugosc_mm','szerokosc_mm','sztuk','material','obrzeze_D1','obrzeze_D2','obrzeze_S1','obrzeze_S2','kod','nazwa','nawierty']];
  model.panels.filter(q => !stage || q.stage === stage).forEach(pn => {
    const e = pn.edges || {};
    rows.push([pn.stage, r0(pn.Lg), r0(pn.Wd), pn.qty, pn.mat,
      e.D1?'2mm ABS':'', e.D2?'2mm ABS':'', e.S1?'2mm ABS':'', e.S2?'2mm ABS':'',
      pn.code, pn.name, drillText(pn).join(' | ') || 'brak']);
  });
  return rows.map(r => r.map(v => {
    const s = String(v); return /[;\n"]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
  }).join(';')).join('\n');
}

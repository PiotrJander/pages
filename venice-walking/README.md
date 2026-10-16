# Wenecja w długim trwaniu

Literacko-historyczny przewodnik po Wenecji: mapa z napoleońskiego katastru z 1808 roku, 48 miejsc z krótkimi esejami w duchu Fernanda Braudela i pisarzy-podróżników, 12 tras na pół dnia z informacją, w które dni mają sens.

Strona jest statyczna (HTML, CSS, JavaScript, bez kroku budowania) i działa z dowolnego serwera plików, w tym z GitHub Pages.

## Publikacja na GitHub Pages

1. Załóż nowe repozytorium na GitHubie, np. `wenecja`. Może być publiczne; na darmowym koncie GitHub Pages działa tylko z publicznych repozytoriów.
2. Wgraj do niego **zawartość** tego folderu tak, żeby `index.html` leżał w głównym katalogu repozytorium (przez „Add file → Upload files” w przeglądarce albo `git push`). Folder `zrodla/` jest opcjonalny.
3. W repozytorium: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, gałąź `main`, folder `/ (root)`, **Save**.
4. Po minucie lub dwóch strona będzie pod adresem `https://<twoja-nazwa>.github.io/wenecja/`.

Na telefonie warto otworzyć stronę raz z Wi-Fi i dodać ją do ekranu początkowego (Safari: Udostępnij → Do ekranu początkowego; Chrome: menu → Dodaj do ekranu głównego). Service worker zapisuje wtedy całą stronę w pamięci telefonu, więc mapa, eseje i trasy działają także bez zasięgu. Jedynym wyjątkiem są kafelki OpenStreetMap (przycisk OSM), które wymagają internetu.

### Lokalizacja

Przycisk z celownikiem używa Geolocation API przeglądarki. Działa tylko na stronie serwowanej przez HTTPS (GitHub Pages to zapewnia); przy pierwszym użyciu przeglądarka zapyta o zgodę. W podglądzie na claude.ai lokalizacja jest zablokowana przez sandbox i strona wyświetla wtedy krótką informację. Gdy lokalizacja jest włączona, lista miejsc sortuje się według odległości.

### Aktualizacja

Po zmianie plików podnieś numer wersji, żeby telefony nie trzymały starej kopii: najprościej uruchom `python3 zrodla/make_site.py . 5` (z nowym numerem), co przepisze `index.html` i `sw.js`. Bez tego możesz ręcznie zmienić `?v=4` na `?v=5` w `index.html` oraz `wenecja-v4` na `wenecja-v5` w `sw.js`. Po wgraniu nowej wersji odśwież stronę dwa razy.

## Jak korzystać

- **Miejsca**: lista wszystkich pinezek z filtrami (oś miasta, głębiej, ślady literackie, Biennale). Dymek na mapie daje krótkie streszczenie i godziny na wybrany dzień; „Czytaj na miejscu” otwiera esej z lekturami. Teksty w domenie publicznej są oznaczone i prowadzą prosto do Project Gutenberg, Internet Archive lub Wikisource.
- **Trasy**: dwanaście tras na pół dnia, pogrupowanych na poranki, popołudnia i dowolną porę. Kropki przy dniach mówią, czy trasa danego dnia ma sens (zielona), ma sens częściowo (pomarańczowa) czy nie (czerwona, zwykle przez zamknięcia). Gwiazdka to dzień sugerowany, nie obowiązkowy. Linia ciągła to marsz, przerywana to vaporetto; strzałki pokazują kierunek.
- **Dni**: przełącznik SOB 17 / ND 18 / PON 19 / WT 20 zmienia godziny otwarcia w dymkach i oznaczenia tras. Podczas wyjazdu strona sama wybiera bieżący dzień.
- **Słuchaj**: przeglądarka czyta esej na głos (polski głos systemowy).
- **OSM**: przełącza podkład z katastru 1808 na dzisiejszą mapę OpenStreetMap i z powrotem.

Na telefonie panel jest wysuwaną kartą: przeciągnij uchwyt w górę, żeby czytać, w dół, żeby zobaczyć mapę.

## Ograniczenia

- Kontury wysp poza historycznym centrum (Giudecca, Lido, Burano, Torcello, San Lazzaro) pochodzą z GSHHG i są przybliżone; zostały wygładzone do rysowania.
- Trasy piesze są wyznaczone po sieci ulic z 1808 roku z ręcznie dodanymi późniejszymi przejściami (most Accademia, Rio Terà Foscarini, Riva dei Sette Martiri, aleje Giardini). Na Lido, Burano i Torcello linie są orientacyjne. Trasy wodne pokazują kierunek, nie dokładny tor linii ACTV.
- Godziny otwarcia to typowe godziny z jesieni 2026 roku. Muzea zmieniają je bez zapowiedzi; przed wyjściem sprawdź stronę instytucji.

## Struktura

```
index.html              strona (GitHub Pages)
sw.js                   service worker (tryb offline)
manifest.webmanifest    instalacja na ekranie telefonu
assets/app.js           logika: mapa, lista, trasy, lokalizacja, czytanie na głos
assets/app.css          wygląd (jasny i ciemny motyw)
assets/basemap.js       rysowanie podkładu 1808 na kafelkach canvas
data/basemap.js         wektory katastru i wysp (zakodowane)
data/places.js          miejsca: eseje, lektury, godziny
data/routes.js          trasy: opisy, dni, geometria
vendor/leaflet.*        Leaflet 1.9.4
zrodla/                 skrypty, którymi wygenerowano dane (opcjonalnie)
```

Drobne poprawki tekstu można robić bezpośrednio w `data/places.js` i `data/routes.js` (to zwykły JSON przypisany do zmiennej). Większe zmiany wygodniej robić w `zrodla/content_places.py` i `zrodla/content_routes.py`, a potem przebudować dane.

## Przebudowa danych (opcjonalnie)

Wymagania: Python 3.10+, `pip install shapely numpy scipy scikit-image pillow`.

1. Pobierz geometrię katastru z repozytorium [epfl-timemachine/venice-1808-landregister](https://github.com/epfl-timemachine/venice-1808-landregister) (plik GeoJSON z geometriami) i zapisz jako `zrodla/dane/venice1808.geojson`. Plik `zrodla/dane/gshhs_lagoon.geojson` (wycinek GSHHG dla laguny) jest dołączony.
2. Uruchom z folderu `zrodla/`:

```
export WENECJA_DANE=dane
python3 build_basemap.py ../data/basemap.js   # podkład; tworzy też geom.pkl
python3 build_routes.py ../data                # miejsca i trasy
LEAFLET_DIST=/ścieżka/do/leaflet/dist python3 make_site.py .. 5
```

`make_site.py` przepisuje `index.html`, `sw.js`, manifest i ikony; plików w `assets/` nie rusza.

## Źródła danych i licencje

- Kataster napoleoński 1808 (Sommarioni): EPFL Time Machine / Venice Time Machine, licencja CC BY 4.0.
- Kontury wysp: GSHHG (Global Self-consistent, Hierarchical, High-resolution Geography Database), P. Wessel i W. H. F. Smith, licencja LGPL.
- Mapa dzisiejsza (opcjonalna): © współtwórcy OpenStreetMap, ODbL; kafelki z tile.openstreetmap.org zgodnie z ich zasadami użycia.
- Leaflet 1.9.4: licencja BSD-2-Clause.
- Kroje pisma: Cardo i Barlow Semi Condensed z Google Fonts (SIL Open Font License).
- Eseje i opisy tras: tekst własny przewodnika. Cytowane i linkowane teksty należą do ich autorów; linki do domeny publicznej prowadzą do Project Gutenberg, Internet Archive i Wikisource.

# -*- coding: utf-8 -*-
"""Places: essays, readings, practical notes. Authored content for 'Wenecja w długim trwaniu'."""
from urllib.parse import quote

def G(n):   return f'https://www.gutenberg.org/ebooks/{n}'
def GS(q):  return 'https://www.gutenberg.org/ebooks/search/?query=' + quote(q)
def IA(i):  return f'https://archive.org/details/{i}'
def IAS(q): return 'https://archive.org/search?query=' + quote(q)
def OL(q):  return 'https://openlibrary.org/search?q=' + quote(q)

# Reusable readings ---------------------------------------------------------
def R(a, w, p, n, u=None, pd=False):
    return dict(a=a, w=w, p=p, n=n, u=u, pd=pd)

RUSKIN1 = G(30754); RUSKIN2 = G(30755); RUSKIN3 = G(30756)
JAMES_IH = G(6354); DICKENS = G(650); BYRON_CH = G(5131); CASANOVA = G(2981)
MANN_DE = G(12108); MANN_EN = G(66073); ROUSSEAU = G(3913); CASSIODORUS = G(18590)
SHAKESPEARE = G(1515); DANTE_IT = G(1012); DANTE_EN = G(1001); POLO = G(10636)
GOETHE = G(2404); SHELLEY = G(4800); ASPERN = G(211)
DANTE_WS = 'https://it.wikisource.org/wiki/Divina_Commedia/Inferno/Canto_XXI'
CORYAT = IAS("Coryat's Crudities")
HOWELLS = IA('venetianlife00howeuoft')
DEBROSSES = IA('lettresfamilir01brosuoft')
ADDISON = IA('remarksonseveral00addi_0')
FABRI = IA('libraryofpalesti07paleuoft')
CASOLA = IAS('Casola pilgrimage Jerusalem 1494 Newett')
GORA = 'https://edizionicafoscari.unive.it/en/edizioni4/riviste/the-venice-journal-of-environmental-humanities/2021/1/on-ice-life-and-lunch-at-mercato-di-rialto/'
EPFL = 'https://github.com/epfl-timemachine/venice-1808-landregister'

BRAUDEL_MED = R('Fernand Braudel', 'Morze Śródziemne i świat śródziemnomorski w epoce Filipa II', 'cz. I (geografia, wyspy i miasta) oraz cz. II (gospodarki)', 'Rama całego przewodnika: geografia, koniunktury, wydarzenia.', OL('Braudel Mediterranean Philip II'))
BRAUDEL_TOW = R('Fernand Braudel', 'Czas świata (Kultura materialna, gospodarka i kapitalizm, t. III)', 'rozdz. o Wenecji jako centrum gospodarki-świata (ok. 1380–1500)', 'Dlaczego to miasto było środkiem świata i jak przestało nim być.', OL('Braudel Perspective of the World'))
BRAUDEL_VEN = R('Fernand Braudel', 'Venise (z fotografiami Folca Quiliciego, 1984)', 'cała, krótka', 'Późny, osobisty esej Braudela o mieście; czyta się jak spacer.', OL('Braudel Venise Quilici'))
LANE = R('Frederic C. Lane', 'Venice: A Maritime Republic (1973)', 'rozdz. o państwie, galerach i Arsenale', 'Najlepsza jednotomowa historia Wenecji jako państwa morskiego.', OL('Lane Venice A Maritime Republic'))
MORRIS = R('Jan Morris', 'Venice (1960)', 'dowolny rozdział', 'Portret miasta jako żywego organizmu: woda, ludzie, łodzie, koty.', OL('Jan Morris Venice'))
BRODSKY = R('Josif Brodski', 'Znak wodny (Watermark, 1992)', 'całość, czytać po kawałku', 'Zimowa Wenecja, mgła, woda i zapach wodorostów.', OL('Brodsky Watermark'))
MCCARTHY = R('Mary McCarthy', 'Venice Observed (1956)', 'rozdziały o placu i turystach', 'Kąśliwe odczarowanie: turysta zawsze przyjeżdża za późno.', OL('Mary McCarthy Venice Observed'))
SCARPA = R('Tiziano Scarpa', 'Venezia è un pesce (2000)', 'rozdziały o nogach, rękach i nosie', 'Wenecjanin uczy chodzić po mieście zmysłami.', OL('Scarpa Venezia è un pesce'))
DEBRAY = R('Régis Debray', 'Contre Venise (1995)', 'całość, krótki pamflet', 'Odtrutka po zachwytach: Wenecja jako narkotyk estetów.', OL('Debray Contre Venise'))
SETTIS = R('Salvatore Settis', 'Se Venezia muore (2014)', 'rozdziały o monokulturze turystyki', 'Miasto, z którego wyprowadzają się mieszkańcy.', OL('Settis Se Venezia muore'))
COLES = R('Polly Coles', 'The Politics of Washing (2013)', 'całość', 'Rok codzienności z czwórką dzieci: zakupy, pranie, szkoła.', OL('Polly Coles Politics of Washing'))
DAVIS = R('Robert C. Davis, Garry Marvin', 'Venice, the Tourist Maze (2004)', 'rozdziały o trasach turystów', 'Antropologia wydeptanych ścieżek i tego, jak z nich zejść.', OL('Davis Marvin Venice Tourist Maze'))
JAMES = lambda p, n: R('Henry James', 'Italian Hours (1909)', p, n, JAMES_IH, True)
RUSKIN = lambda vol, p, n: R('John Ruskin', f'The Stones of Venice, t. {vol}', p, n, {1: RUSKIN1, 2: RUSKIN2, 3: RUSKIN3}[vol], True)
LINKS = R('J.G. Links', 'Venice for Pleasure (1966)', 'spacery po Dorsoduro i Castello', 'Przewodnik spacerowy z przystankami na kawę.', OL('Links Venice for Pleasure'))
NOOTEBOOM = R('Cees Nooteboom', 'Venice: The Lion, the City and the Water', 'dowolny rozdział, wieczorem', 'Kilkadziesiąt lat powrotów, dygresje o malarstwie.', OL('Nooteboom Venice Lion City Water'))
SEBALD = R('W.G. Sebald', 'Zawrót głowy (Schwindel. Gefühle., 1990)', 'część „All\'estero”', 'Wenecja jako niepokój pamięci, z cieniem Casanovy.', OL('Sebald Vertigo'))
MORAND = R('Paul Morand', 'Venises (1971)', 'całość', 'Elegancki esej wspomnieniowy z pół wieku wizyt.', OL('Paul Morand Venises'))
TANNER = R('Tony Tanner', 'Venice Desired (1992)', 'rozdziały o Byronie, Ruskinie i Jamesie', 'Literacki obraz miasta jako przedmiotu pożądania.', OL('Tony Tanner Venice Desired'))
PEMBLE = R('John Pemble', 'Venice Rediscovered (1995)', 'całość', 'Jak XIX wiek wymyślił Wenecję upadku.', OL('Pemble Venice Rediscovered'))
SIMMEL = R('Georg Simmel', 'Venedig (1907)', 'krótki esej', 'Wenecja jako piękna maska, fasada bez wnętrza.', 'https://de.wikisource.org/w/index.php?search=Simmel+Venedig', True)
MURATOV = R('Paweł Muratow', 'Obrazy Włoch (1911–1912)', 'eseje weneckie', 'Rosyjska, bardzo wyrafinowana proza o sztuce i atmosferze.', OL('Muratov Images of Italy'))
DICKENS_R = R('Charles Dickens', 'Pictures from Italy (1846)', 'rozdział „An Italian Dream”', 'Wenecja opisana jak sen, bez jednej nazwy własnej.', DICKENS, True)
GOETHE_R = lambda p, n: R('Johann Wolfgang Goethe', 'Italienische Reise, t. 1', p, n, GOETHE, True)
CORYAT_R = lambda p, n: R('Thomas Coryat', "Coryat's Crudities (1611)", p, n, CORYAT, True)
CASANOVA_R = lambda p, n: R('Giacomo Casanova', 'Histoire de ma vie (przekład A. Machena)', p, n, CASANOVA, True)
BYRON_R = lambda p, n: R('Lord Byron', "Childe Harold's Pilgrimage, pieśń IV", p, n, BYRON_CH, True)
SIMPLE_EPFL = R('EPFL Time Machine', 'Kataster napoleoński Wenecji 1808 (dane otwarte)', 'warstwa działek i budynków', 'Na tych danych zbudowana jest mapa bazowa przewodnika.', EPFL, 'oa')

T = dict(L='Długie trwanie', K='Koniunktura', W='Wydarzenie')

PLACES = [
# ---------------------------------------------------------------- SAN MARCO
dict(id='piazza', name='Plac św. Marka', kind='rdzen', area='San Marco', lat=45.43414, lon=12.33818,
 times=['W', 'K'], year='od IX w.',
 teaser='Salon miasta, skomponowany przez sześć wieków: bizantyjska bazylika, prokuracje, skrzydło Napoleona i dzwonnica odbudowana „jak była, gdzie była”.',
 essay=[
  'Plac nie powstał w jednym projekcie. Wenecjanie dobudowywali go przez sześćset lat: na wschodzie bazylika z XI wieku, po bokach dwa długie budynki Prokuracji, w których urzędowali prokuratorzy św. Marka, czyli powiernicy majątku i skarbu Republiki, a na zachodzie skrzydło dobudowane za Francuzów po 1807 roku, gdy rozebrano kościół San Geminiano. Dzwonnica, którą widzisz, jest kopią: oryginał zawalił się 14 lipca 1902 roku i odbudowano go do 1912 pod hasłem „com\'era, dov\'era”. Z jej szczytu w sierpniu 1609 roku Galileusz pokazywał senatorom swoją lunetę, a kupcy natychmiast zrozumieli, że statek dostrzeżony dwie godziny wcześniej to przewaga na rynku.',
  'U Braudela plac to miejsce, gdzie gospodarka-świat zamieniała się w teatr. Coryat w 1608 roku opisywał tu szarlatanów, sprzedawców leków i tłum obcych języków; Henry James, 270 lat później, widział salon pod gołym niebem. Mary McCarthy dopisała do tego gorzką puentę, że każdy turysta przychodzi tu za późno. Przyjdź więc wcześnie: przed ósmą kamień ma kolor szarego mleka, a jedynymi użytkownikami placu są zamiatacze i mewy.',
 ],
 read=[CORYAT_R('„Observations of Venice”: plac, Merceria i szarlatani', 'Najbarwniejszy opis placu w czasach żywej Republiki.'),
       JAMES('rozdział „Venice” (1882)', 'Plac jako salon i miasto, o którym nie da się już nic powiedzieć.'),
       MCCARTHY, BRAUDEL_VEN],
 info=dict(hours=None, tip='Najlepiej o świcie albo po 19:00. Dzwonnica: kolejka mniejsza tuż po otwarciu.')),

dict(id='piazzetta', name='Piazzetta, kolumny i tetrarchowie', kind='rdzen', area='San Marco', lat=45.43328, lon=12.33988,
 times=['W', 'L'], year='1204',
 teaser='Brama od strony morza. Dwie kolumny z Lwem i Todarem, porfirowi tetrarchowie z Konstantynopola i kamienie, z których ogłaszano prawa.',
 essay=[
  'Tędy wchodziło się do Wenecji, zanim zbudowano most kolejowy: od morza, przez Molo, między dwiema kolumnami. Na jednej stoi Todaro, czyli św. Teodor, pierwszy bizantyjski patron miasta; na drugiej skrzydlaty lew z brązu, prawdopodobnie starożytna wschodnia chimera, której dorobiono skrzydła i księgę. Między kolumnami wykonywano wyroki i do dziś wielu Wenecjan omija ten odcinek. Byron widział tu lwa, który stoi dalej, ale „in mockery of his withered power”, jako kpinę z uschniętej potęgi.',
  'Na rogu bazyliki przy Porta della Carta stoją porfirowi tetrarchowie, czterej cesarze z IV wieku obejmujący się nawzajem; przywieziono ich z Konstantynopola po 1204 roku, a brakującą stopę jednego z nich archeolodzy znaleźli w XX wieku w Stambule. Dwa rzeźbione filary obok, tak zwane pilastri acritani, przez wieki uchodziły za trofeum z Akki po wojnie z Genuą; dziś wiadomo, że pochodzą z konstantynopolitańskiego kościoła św. Polieukta. Tu widać, jak Wenecja pisała swoją historię łupami. Pietra del bando, kikut porfiru przy narożniku, był mównicą, z której ogłaszano prawa; przetrwał nawet upadek dzwonnicy w 1902 roku.',
 ],
 read=[BYRON_R('strofy 1–19 (Wenecja); lew w strofie 11', 'Romantyczna żałoba po Republice, czytana na Molo.'),
       RUSKIN(2, 'rozdz. IV „St. Mark\'s”, początek', 'Słynne podejście do bazyliki od strony uliczek.'),
       R('Felix Fabri', 'Evagatorium / Wanderings (PPTS)', 'pobyt w Wenecji przed rejsem 1483', 'Pielgrzym z Ulm patrzy na Molo, skąd odpływały galery do Jaffy.', FABRI, True),
       LANE],
 info=dict(hours=None, tip='Świt od strony laguny: San Giorgio Maggiore wychodzi z mgły dokładnie naprzeciw.')),

dict(id='basilica', name='Bazylika św. Marka', kind='rdzen', area='San Marco', lat=45.43458, lon=12.33976,
 times=['W', 'K'], year='828 / 1094 / 1204',
 teaser='Bizantyjski kościół w sercu łacińskiej Europy, kaplica doży, nie katedra. Osiem tysięcy metrów kwadratowych złotych mozaik i katalog łupów z 1204 roku.',
 essay=[
  'W 828 roku dwaj kupcy wykradli z Aleksandrii relikwie św. Marka i miasto zyskało ewangelistę, a z nim prestiż równy Rzymowi i Aleksandrii. Obecny kościół zbudowano od 1063 roku na wzór konstantynopolitańskiego kościoła Świętych Apostołów: krzyż grecki i pięć kopuł. Do 1807 roku nie była to katedra, lecz prywatna kaplica doży; patriarcha siedział daleko, w San Pietro di Castello. Państwo trzymało sacrum przy pałacu, nie przy biskupie.',
  'Fasada jest katalogiem czwartej krucjaty: konie z hipodromu (oryginały w muzeum na piętrze, wywiezione przez Napoleona do Paryża i zwrócone w 1815 roku), kolumny i kapitele z całego Wschodu. Pala d\'Oro zamówiono w Konstantynopolu, potem dwukrotnie powiększono, także o emalie zdobyte w 1204 roku. Ruskin kazał podchodzić do bazyliki od ciemnych uliczek, żeby jej fasada wybuchła nagle jak „a long low pyramid of coloured light”. Braudel dopowiedziałby, że to złoto jest zapisem bilansu handlowego z Lewantem.',
 ],
 read=[RUSKIN(2, 'rozdz. IV „St. Mark\'s”', 'Najsłynniejszy opis bazyliki w angielszczyźnie; czytaj przed wejściem.'),
       JAMES('rozdział „Venice”, fragment o wnętrzu San Marco', 'Złota pieczara oglądana oczami Amerykanina.'),
       BRAUDEL_TOW, MORRIS],
 info=dict(hours=dict(sat='9:30–17:15', sun='14:00–17:15 (rano tylko muzeum)', mon='9:30–17:15', tue='9:30–17:15'),
           tip='Bilet online na 9:30. Dokup Pala d\'Oro i muzeum z końmi oraz loggią nad placem.')),

dict(id='palazzo_ducale', name='Pałac Dożów i Most Westchnień', kind='rdzen', area='San Marco', lat=45.43375, lon=12.34031,
 times=['W', 'K'], year='1297 / 1355 / 1577',
 teaser='Architektura republiki, nie księcia: ciężka ściana na lekkich arkadach. W środku Wielka Rada, Tintoretto, skrzynki na donosy i więzienia pod ołowianym dachem.',
 essay=[
  'Pałac stoi „na głowie”: różowo-biała ściana wisi nad dwoma rzędami ażurowych arkad. Takiej budowli nie postawiłby władca, który boi się poddanych; Florencja w tym samym czasie wznosiła Palazzo Vecchio jak twierdzę z wieżą. Ruskin nazwał ten pałac centralnym budynkiem świata. W Sali Wielkiej Rady obradowało ponad tysiąc patrycjuszy, którzy po zamknięciu Rady w 1297 roku stali się dziedziczną kastą; na ścianie wisi „Raj” Tintoretta, ponad dwadzieścia metrów płótna, a w fryzie portretów dożów, w miejscu Marina Falier, ściętego w 1355 roku za próbę zamachu, namalowano czarny całun.',
  'Dla Braudela i Lane\'a pałac jest maszynownią państwa, które działało jak przedsiębiorstwo: rady, komisje, losowania, Rada Dziesięciu powołana po spisku z 1310 roku i skrzynki „bocche di leone” na anonimowe donosy. Przez Most Westchnień, zbudowany około 1600 roku, prowadzono więźniów do Prigioni Nuove; nazwę nadali mu dopiero romantycy, z Byronem na czele. Pod ołowianym dachem były Piombi, z których w noc z 31 października na 1 listopada 1756 roku uciekł Casanova; jego relacja z ucieczki to jedna z najlepszych scen przygodowych XVIII wieku.',
 ],
 read=[RUSKIN(2, 'rozdz. VIII „The Ducal Palace”', 'Ruskin czyta kapitele arkad jak encyklopedię średniowiecza.'),
       BYRON_R('strofa 1', 'Most Westchnień i początek romantycznej Wenecji.'),
       CASANOVA_R('tom o uwięzieniu i ucieczce z Piombi (1755–1756)', 'Czytaj po wizycie w Itinerari Segreti.'),
       LANE],
 info=dict(hours=dict(sat='9:00–19:00', sun='9:00–19:00', mon='9:00–19:00', tue='9:00–19:00'),
           tip='Bilet z godziną (bez godziny wpuszczają od 12:00). Itinerari Segreti: ukryte kancelarie i cele.')),

dict(id='correr', name='Correr i Marciana: mapy świata', kind='glebia', area='San Marco', lat=45.43386, lon=12.33689,
 times=['L', 'K'], year='1450 / 1500',
 teaser='Dwie najbardziej braudelowskie rzeczy w mieście: drzeworyt de\' Barbariego z 1500 roku i mapa świata Fra Mauro. Wejście na bilecie z Pałacu Dożów.',
 essay=[
  'W Museo Correr wisi „Venetie MD” Jacopa de\' Barbari, drzeworyt z sześciu ogromnych klocków z 1500 roku: miasto widziane z lotu ptaka, z każdym kościołem, dźwigiem, ogrodem i łodzią. To portret gospodarki-świata w chwili jej szczytu, dwa lata po tym, jak Vasco da Gama dopłynął do Indii. Widać też, że Wenecja ma kształt ryby, o czym pisze Scarpa. W tym samym muzeum są „Dwie Wenecjanki” Carpaccia; drugą połowę tej deski, z polowaniem na ptactwo w lagunie, ma dziś Getty Museum.',
  'W salach Biblioteki Marciany, którą zaczął kardynał Bessarion, przekazując w 1468 roku Republice greckie rękopisy, zwykle wystawiana jest mapa świata Fra Mauro, mnicha z wyspy San Michele, z około 1450 roku. To wielki krąg z południem na górze, zbudowany z relacji kupców, pielgrzymów i podróżników docierających do Persji, Indii i Etiopii. Braudel twierdził, że centrum świata to miejsce, do którego spływają informacje; tu widać, jak to wyglądało w praktyce.',
 ],
 read=[BRAUDEL_TOW, SCARPA,
       R('Marco Polo / Rustichello', 'Opisanie świata (przekład Yule\'a)', 'prolog', 'Jeden ze źródeł, z których Fra Mauro składał swoją mapę.', POLO, True)],
 info=dict(hours=dict(sat='10:00–18:00', sun='10:00–18:00', mon='10:00–18:00', tue='10:00–18:00'),
           tip='Ten sam bilet co do Pałacu Dożów; wejście do Correr wolno wykorzystać innego dnia.')),

dict(id='orologio', name='Wieża Zegarowa i Mercerie', kind='glebia', area='San Marco', lat=45.43469, lon=12.33893,
 times=['K'], year='1499',
 teaser='Brama z placu do miasta handlu. Pod zegarem zaczyna się Merceria, najstarsza ulica sklepów, która łączyła władzę z rynkiem.',
 essay=[
  'Wieżę zbudowano pod koniec XV wieku; dwaj brązowi „Mori” na dachu wybijają godziny, a zegar pokazuje fazy księżyca i znaki zodiaku, czyli informacje dla żeglarzy i kupców. Pod wieżą zaczynają się Mercerie, ciąg uliczek handlowych z placu do Rialto. W tej geometrii zapisana jest Wenecja: na jednym końcu polityka i państwo, na drugim kantory i targ, a pośrodku kilometr sklepów z jedwabiem, szkłem, książkami i przyprawami.',
  'Coryat, który przeszedł tędy w 1608 roku, zachwycał się Mercerią i jej sklepami. Dziś to najbardziej zatłoczony korytarz w mieście, ale to też dokładnie ta sama funkcja: luksusowy handel detaliczny. Przejdź Mercerie przed dziewiątą, gdy rolety są jeszcze opuszczone, i skręć przy San Salvador w boczne calli, żeby zobaczyć, jak blisko głównej arterii zaczyna się cisza.',
 ],
 read=[CORYAT_R('„Observations of Venice”: Merceria', 'Opis ulicy sklepów z czasów jej świetności.'), BRAUDEL_MED, DAVIS],
 info=dict(hours=None, tip='Mercerie są piękne tylko rano. Po 10:00 lepiej iść równoległymi calli.')),

# ---------------------------------------------------------------- RIALTO / SAN POLO
dict(id='rialto', name='Most Rialto', kind='rdzen', area='San Polo / San Marco', lat=45.43799, lon=12.33590,
 times=['K'], year='1591',
 teaser='Kamienny most z 1591 roku i jedyna przeprawa przez Canal Grande aż do 1854 roku. Ważniejsze od mostu jest to, co jest po jego obu stronach: kantory i targ.',
 essay=[
  'Rialto to „rivo alto”, wysoki brzeg, na którym w IX wieku osiadła władza po ucieczce z Malamocco. Kamienny most z lat 1588–1591 zaprojektował mało znany Antonio da Ponte; w konkursie przegrali, według tradycji, Michał Anioł, Palladio i Sansovino. Wcześniejszy most był drewniany i zwodzony; zobaczysz go na obrazie Carpaccia w Accademii. Aż do 1854 roku nie było innej przeprawy przez Canal Grande, więc całe miasto przechodziło przez to jedno wąskie gardło.',
  'U Shakespeare\'a kupcy pytają się nawzajem: „What news on the Rialto?”. To pytanie o kursy, statki i plotki, czyli o informację, na której stała gospodarka-świat. Braudel opisuje Rialto jako giełdę na długo przed giełdami: banchi di scritta, banki żyrowe przy kościele San Giacomo, księgowały przelewy bez gotówki. Gdy w 1501 roku nadeszły wieści o portugalskim pieprzu z Indii, Priuli zapisał w dzienniku, że to najgorsza wiadomość dla miasta. Most był wtedy jeszcze drewniany.',
 ],
 read=[R('William Shakespeare', 'Kupiec wenecki', 'akt I, scena 3 i akt III, scena 1', 'Rialto jako giełda plotek, kredytu i ryzyka.', SHAKESPEARE, True),
       BRAUDEL_TOW, LANE],
 info=dict(hours=None, tip='Przejdź most przed 8:30 albo po 20:00; za dnia to najwęższy punkt turystycznego labiryntu.')),

dict(id='mercato', name='Targ Rialto: Pescheria i Erbaria', kind='rdzen', area='San Polo', lat=45.43950, lon=12.33390,
 times=['L', 'K'], year='od 1097',
 teaser='Miasto bez ziemi musiało kupować wszystko poza solą i rybą. Targ działa tu od średniowiecza; hala rybna z 1907 roku tylko udaje gotyk.',
 essay=[
  'Dla Braudela pierwsza prawda o Wenecji to jej głód: laguna nie dawała zboża, drewna ani słodkiej wody, więc Republika żyła z importu i miała urzędy pilnujące zapasów, ceny i miar. Tu je widać. Fabbriche Vecchie i Nuove nad Canal Grande mieściły magistratury handlowe; pod arkadami Erbarii przypływały warzywa z Sant\'Erasmo, a do Pescherii ryby z laguny i Adriatyku. Hala rybna z kolumnami i kapitelami z rybami powstała dopiero w 1907 roku, w stylu neogotyckim, ale na miejscu targu, który według tradycji działa tu od 1097 roku.',
  'Antropolożka L. Sasha Gora opisała, jak w tygodniu Wenecjanie zamawiają po cichu, a w sobotę listy zakupów krzyczy się na cały targ. Rozejrzyj się za tablicą z minimalnymi rozmiarami ryb: regulacja połowów to stara weneckia sztuka. Targ się kurczy razem z liczbą mieszkańców; Settis traktuje go jak termometr miasta, które jeszcze żyje dla siebie.',
 ],
 read=[R('L. Sasha Gora', 'On Ice: Life and Lunch at Mercato di Rialto (2021, otwarty dostęp)', 'artykuł', 'Targ jako życie miasta, nie dekoracja.', GORA, 'oa'),
       BRAUDEL_MED, SETTIS, COLES],
 info=dict(hours=dict(sat='ok. 7:30–12:00', sun=None, mon=None, tue='ok. 7:30–12:00'),
           tip='Od wtorku do soboty, najlepiej 7:30–9:30. W niedzielę i poniedziałek ryb nie ma.')),

dict(id='san_giacomo', name='San Giacomo di Rialto', kind='glebia', area='San Polo', lat=45.43822, lon=12.33528,
 times=['K', 'L'], year='421 (legenda)',
 teaser='Według legendy najstarszy kościół miasta. Na absydzie średniowieczny napis każe kupcom ważyć uczciwie.',
 essay=[
  'Tradycja każe założyć tu Wenecję 25 marca 421 roku, w dzień Zwiastowania. To mit, ale kościółek naprawdę jest bardzo stary, a jego położenie mówi wszystko: stoi w środku targu, otoczony przez banki i kantory. Na zewnętrznej ścianie absydy wyryto łacińską przestrogę: „Hoc circa templum sit jus mercantibus aequum, pondera nec vergant nec sit conventio prava”, czyli niech wokół tej świątyni kupców obowiązuje sprawiedliwe prawo, wagi niech nie oszukują, a umowy niech nie będą nieuczciwe.',
  'Pod portykiem urzędowali bankierzy, a naprzeciwko, na kamiennym „Gobbo di Rialto”, przygarbionym człowieczku podtrzymującym schodki, ogłaszano prawa. Złodziej skazany na bieg nago od placu św. Marka pod chłostą kończył karę właśnie tutaj, całując Gobba. Braudel nazwałby to miejsce pierwszym ośrodkiem kapitalizmu w Europie: kredyt, informacja i zaufanie w promieniu stu metrów.',
 ],
 read=[BRAUDEL_TOW, LANE, R('Marino Sanudo', 'Diarii (w wyborze: Venice, Cità Excelentissima)', 'fragmenty o Rialto', 'Kronikarz notujący dzień po dniu życie rynku ok. 1500.', OL('Sanudo Cita Excelentissima'))],
 info=dict(hours=None, tip='Napis jest na absydzie od strony Ruga dei Oresi.')),

dict(id='tedeschi', name='Fondaco dei Tedeschi', kind='glebia', area='San Marco', lat=45.43843, lon=12.33640,
 times=['K'], year='1505–1508',
 teaser='Dom i magazyn kupców niemieckich. Tędy szło srebro z Alp na południe, a pieprz i jedwab na północ; fasady malowali Giorgione i Tycjan.',
 essay=[
  'Wenecja nie pozwalała obcym kupcom handlować dowolnie: musieli mieszkać i składować towar w wyznaczonym fondaco, pod okiem urzędników, którzy liczyli cło. Niemcy, czyli kupcy z Augsburga, Norymbergi i Kolonii, mieli największy z nich, przy samym Rialto. Po pożarze w 1505 roku odbudowano go jako czworobok z dziedzińcem, a fasady pokryto freskami: od strony kanału malował młody Giorgione, od lądu Tycjan. Ich resztki przeniesiono do Ca\' d\'Oro.',
  'To jest oś, o której Braudel pisze najchętniej: z jednej strony alpejskie przełęcze i srebro z kopalń Tyrolu i Saksonii, z drugiej Lewant z przyprawami i jedwabiem. Wenecja była zawiasem między nimi. W tych samych latach, 1505–1507, mieszkał w mieście Albrecht Dürer i malował dla niemieckiej wspólnoty ołtarz Święta Różańcowego do pobliskiego kościoła San Bartolomeo; w listach do przyjaciela narzekał, że weneccy malarze go podrabiają i obmawiają, ale Giovanni Bellini go chwali.',
 ],
 read=[BRAUDEL_TOW, BRAUDEL_MED, R('Albrecht Dürer', 'Listy z Wenecji do Willibalda Pirckheimera (1506)', 'listy', 'Niemiecki malarz w mieście kupców.', IAS('Dürer letters Pirckheimer Venice'), True)],
 info=dict(hours=None, tip='Dziedziniec bywa dostępny; sprawdź na miejscu, co jest teraz w środku.')),

dict(id='milion', name='Corte del Milion i San Giovanni Crisostomo', kind='glebia', area='Cannaregio', lat=45.43880, lon=12.33790,
 times=['W', 'K'], year='1295 / 1298',
 teaser='Tu stał dom Polów. Z przegranej bitwy pod Curzolą i genueńskiego więzienia narodziła się jedna z najsłynniejszych książek średniowiecza.',
 essay=[
  'Marco Polo wrócił do Wenecji w 1295 roku po ponad dwudziestu latach w Azji; rodzinny dom stał przy dwóch podwórkach za kościołem San Giovanni Crisostomo, które do dziś nazywają się Corte del Milion. „Milion” to przydomek, którym Wenecjanie obdarzyli Marka za jego opowieści o milionach. W Corte Seconda zachował się łuk z czasów bizantyjskich. Dom spłonął pod koniec XVI wieku, a na jego miejscu stanął teatr, dziś Malibran.',
  'Według tradycji Polo walczył pod Curzolą w 1298 roku, dostał się do genueńskiej niewoli i tam podyktował wspomnienia Rustichellowi z Pizy. Braudel lubił takie paradoksy: przegrana bitwa w wojnie dwóch handlowych republik dała Europie obraz Azji, z którego korzystał potem Fra Mauro i, przez pośredników, Kolumb. W kościele obok wiszą późny ołtarz Giovanniego Belliniego z 1513 roku i ołtarz Sebastiana del Piombo.',
 ],
 read=[R('Marco Polo / Rustichello', 'Opisanie świata (przekład Yule\'a)', 'prolog o niewoli i powrocie', 'Czytaj na podwórku, na którym wszystko się zaczęło.', POLO, True), BRAUDEL_TOW],
 info=dict(hours=None, tip='Kościół zwykle otwarty rano i po południu; podwórka są zawsze.')),

dict(id='frari', name='Frari', kind='rdzen', area='San Polo', lat=45.43687, lon=12.32624,
 times=['W', 'K'], year='1518',
 teaser='Ogromny ceglany kościół franciszkanów. Tycjan wisi tu tam, gdzie go zamówiono: „Wniebowzięcie” w ołtarzu i „Madonna Pesaro” przy nawie.',
 essay=[
  'Franciszkanie budowali skromnie z założenia, a mimo to Frari stały się panteonem: w środku leżą Tycjan i Monteverdi, Canova ma piramidę, którą sam zaprojektował dla Tycjana, a Donatello zostawił drewnianego Jana Chrzciciela. Najważniejsze jest jednak to, czego nie zobaczysz we Florencji: obrazy wiszą w miejscach, dla których powstały. „Wniebowzięcie” Tycjana z lat 1516–1518 widać przez otwór w chórze już od wejścia, jak finał całej perspektywy.',
  'Obok wisi „Madonna Pesaro”, zamówiona przez Jacopa Pesaro, biskupa i dowódcę floty, który w 1502 roku pokonał Turków; w obrazie jest jeniec w turbanie i chorągiew z herbem. To braudelowskie spotkanie wojny, handlu i dewocji w jednym płótnie. Vasari, Florentczyk, uważał Tycjana za genialnego kolorystę, który nie umie rysować; Frari są najlepszym miejscem, żeby sprawdzić, czy miał rację. W zakrystii poczekaj przy tryptyku Belliniego z 1488 roku, aż oczy przyzwyczają się do półmroku.',
 ],
 read=[R('Giorgio Vasari', 'Żywoty… (Lives), żywot Tycjana', 'żywot Tycjana', 'Florenckie disegno przeciw weneckiemu colorito.', GS('Vasari Lives painters volume 9'), True),
       JAMES('rozdział „Venice”', 'Malarstwo weneckie oglądane in situ.'), BRAUDEL_MED],
 info=dict(hours=dict(sat='9:00–18:00', sun='13:00–18:00', mon='9:00–18:00', tue='9:00–18:00'),
           tip='Bilet na miejscu. Frari nie należą do Chorus Pass.')),

dict(id='san_rocco', name='Scuola Grande di San Rocco', kind='rdzen', area='San Polo', lat=45.43657, lon=12.32529,
 times=['W', 'K'], year='1564–1588',
 teaser='„Sykstyna Wenecji”: cały cykl Tintoretta w jednym budynku bractwa. Ruskin uważał „Ukrzyżowanie” z tej sali za szczyt malarstwa.',
 essay=[
  'Scuole grandi były bractwami bogatych mieszczan, cittadini, którym zamknięcie Wielkiej Rady w 1297 roku odebrało drogę do władzy. Swoje pieniądze i ambicje przelewali w dobroczynność i sztukę. Tintoretto zdobył to zlecenie w 1564 roku sprytem: zamiast szkicu na konkurs przyniósł gotowy obraz, zawiesił go w suficie i podarował bractwu. Potem malował tu przez ponad dwadzieścia lat.',
  'Ruskin pisał o „Ukrzyżowaniu” w Sali dell\'Albergo, że jest ponad wszelką pochwałą, a Henry James wracał do niego jak do najmocniejszego przeżycia w Wenecji. Na stołach leżą lustra: patrz w nie, a nie zadzieraj głowy, żeby zobaczyć sufit. San Rocco był patronem chorych na dżumę, a dżuma z lat 1575–1577 zabrała może jedną czwartą mieszkańców; ten budynek jest także pomnikiem miasta, które co kilkadziesiąt lat traciło swoich ludzi i odbudowywało się z nowych przybyszów.',
 ],
 read=[RUSKIN(3, 'Indeks wenecki, hasło „Rocco, Scuola di San”', 'Ruskin oprowadza po Tintoretcie sala po sali.'),
       JAMES('rozdział „Venice”, fragment o Tintoretcie', 'Najmocniejsze strony Jamesa o malarstwie.'), BRAUDEL_MED],
 info=dict(hours=dict(sat='9:30–17:30', sun='9:30–17:30', mon='9:30–17:30', tue='9:30–17:30'),
           tip='Kasa zamyka się ok. 17:00. Weź lustro ze stołu i oglądaj sufit w odbiciu.')),

dict(id='aldo', name='Drukarnia Aldusa (Rio Terà Secondo)', kind='slad', area='San Polo', lat=45.43880, lon=12.32700,
 times=['K', 'W'], year='1494–1515',
 teaser='Tablica w miejscu drukarni Aldusa Manucjusza. Tu wymyślono kursywę i książkę kieszonkową. Krój, którym złożony jest ten przewodnik, wywodzi się z jego czcionek.',
 essay=[
  'Około 1500 roku Wenecja była stolicą drukarstwa Europy: działały tu setki oficyn, a miasto wydało wtedy więcej książek niż jakiekolwiek inne. Aldus Manucjusz, humanista z Lacjum, założył drukarnię w pobliżu Campo Sant\'Agostin i wydawał greckich klasyków w poprawnych wydaniach. Jego rytownik Francesco Griffo wyciął antykwę do dialogu Bemba „De Aetna” (1495–1496), a potem pierwszą kursywę, w której Aldus wydał Wergiliusza w małym formacie, w 1501 roku. Tak narodziła się książka do noszenia w kieszeni.',
  'Krój Cardo, którym złożone są eseje w tym przewodniku, powstał na wzór czcionki z „De Aetna”. Braudel widziałby w drukarniach przemysł eksportowy jak szkło czy jedwab: papier z terra ferma, kapitał kupiecki, rynek w całej Europie. Erazm z Rotterdamu mieszkał u Aldusa w 1508 roku, przygotowując „Adagia”, i narzekał na kuchnię. Tablica jest mała i łatwo ją minąć; to jedno z tych miejsc, które istnieją tylko dla kogoś, kto wie, czego szuka.',
 ],
 read=[BRAUDEL_TOW, R('Erazm z Rotterdamu', 'Opulentia sordida (Kolokwia)', 'dialog o skąpym gospodarzu', 'Złośliwe wspomnienie pobytu w domu weneckiego drukarza.', GS('Erasmus Colloquies'), True)],
 info=dict(hours=None, tip='Szukaj tablicy przy Rio Terà Secondo, kilka kroków od Campo Sant\'Agostin.')),

dict(id='turchi', name='Fondaco dei Turchi', kind='glebia', area='Santa Croce (z wody)', lat=45.44138, lon=12.32917,
 times=['K'], year='1621–1838',
 teaser='Weneckobizantyjski pałac z XIII wieku, od 1621 roku kantor kupców osmańskich. Najlepiej oglądać z vaporetto linii 1.',
 essay=[
  'Wenecja i Imperium Osmańskie toczyły ze sobą wojny przez trzysta lat, a mimo to handlowały bez przerwy. Od 1621 roku kupcy z Bośni, Albanii i Anatolii mieli w tym pałacu swój fondaco, z łaźnią, magazynami i oknami zamurowanymi od strony ulicy, żeby nikt nie zaglądał. Braudel lubił ten przykład: wydarzenia, czyli bitwy, przechodzą jak piana, a handel, czyli koniunktura, płynie dalej pod spodem.',
  'Budynek z arkadami nad wodą to jeden z najstarszych pałaców miasta, ale to, co widzisz, jest w dużej mierze XIX-wieczną rekonstrukcją. Ruskin patrzył na tę restaurację z rozpaczą jako na zniszczenie autentyku. Dziś mieści się tu Muzeum Historii Naturalnej z dobrym działem o lagunie.',
 ],
 read=[RUSKIN(2, 'rozdz. V „Byzantine Palaces”', 'Ruskin o pałacach weneckobizantyjskich i ich restauracjach.'), BRAUDEL_MED],
 info=dict(hours=None, tip='Patrz z lewej burty linii 1 płynącej w stronę dworca.')),

# ---------------------------------------------------------------- DORSODURO
dict(id='accademia', name='Gallerie dell\'Accademia', kind='rdzen', area='Dorsoduro', lat=45.43112, lon=12.32813,
 times=['W', 'K'], year='1496 / 1573',
 teaser='Malarstwo weneckie od Paola Veneziana po Tiepola. Dwa obrazy pokazują miasto sprzed 500 lat: procesja na placu i drewniany most Rialto.',
 essay=[
  'Galerie mieszczą się w dawnej Scuola della Carità, najstarszym bractwie miasta, i w klasztorze projektu Palladia. W Sala dell\'Albergo wisi „Ofiarowanie Marii” Tycjana tam, gdzie je namalowano, wpasowane w drzwi. Zobacz „Burzę” Giorgionego, której znaczenia nikt nie odgadł, ostatnią „Pietà” Tycjana, dokończoną po jego śmierci przez Palmę Młodszego, i cykl św. Urszuli Carpaccia, w którym Ruskin się zakochał.',
  'Najbardziej braudelowska jest sala z cyklem z Scuola di San Giovanni Evangelista. „Procesja na Placu św. Marka” Gentilego Belliniego z 1496 roku pokazuje plac i bazylikę z dawnymi mozaikami; „Cud relikwii Krzyża” Carpaccia pokazuje drewniany most zwodzony na Rialto, gondole, kominy i kupców w turbanach. To zdjęcia sprzed pięciu wieków, a ty widziałeś te same miejsca rano. Obok wisi „Uczta w domu Lewiego” Veronesego: w 1573 roku Inkwizycja przesłuchiwała malarza za błaznów i Niemców przy stole Ostatniej Wieczerzy, a on po prostu zmienił tytuł.',
 ],
 read=[JAMES('rozdział „Venice”, fragmenty o Carpacciu i Bellinim', 'Najczulsze strony Jamesa o malarstwie weneckim.'),
       R('John Ruskin', "St. Mark's Rest (1877–1884)", 'rozdziały o Carpacciu', 'Ruskin zakochany w św. Urszuli.', GS("St. Mark's Rest Ruskin"), True),
       MURATOV, BRAUDEL_VEN],
 info=dict(hours=dict(sat='9:00–19:00', sun='9:00–19:00', mon=None, tue='9:00–19:00'),
           tip='W poniedziałek zamknięte. Najspokojniej zaraz po otwarciu.')),

dict(id='guggenheim', name='Peggy Guggenheim Collection', kind='glebia', area='Dorsoduro', lat=45.43070, lon=12.33155,
 times=['W', 'K'], year='1949',
 teaser='Niedokończony pałac Venier dei Leoni, w którym zamieszkała Peggy Guggenheim. Klucz do tego, jak Wenecja stała się sceną sztuki nowoczesnej.',
 essay=[
  'Palazzo Venier dei Leoni zaczęto budować w 1749 roku i nigdy nie skończono: stanął tylko parter, stąd jego dziwnie niski profil nad Canal Grande. Peggy Guggenheim kupiła go w 1949 roku, rok po tym, jak jej kolekcja była pokazywana w greckim pawilonie Biennale. Pochowano ją w ogrodzie obok jej psów. Na tarasie od strony kanału stoi „Anioł miasta” Marina Mariniego, jeździec z rozpostartymi ramionami, przodem do przepływających łodzi.',
  'To miejsce opowiada XX-wieczny rozdział koniunktury: amerykański kapitał, europejscy emigranci i nowy rynek sztuki, którego witryną po 1945 roku stało się Biennale. Wenecja, która od 1797 roku nie miała już polityki, stała się giełdą prestiżu. Braudel by powiedział, że centrum przeniosło się do Nowego Jorku, a Wenecja została salonem, w którym się to ogłasza.',
 ],
 read=[R('Peggy Guggenheim', 'Confessions of an Art Addict (1960)', 'rozdziały weneckie', 'Autoironiczne wspomnienia kolekcjonerki.', OL('Peggy Guggenheim Confessions of an Art Addict')), BRAUDEL_TOW],
 info=dict(hours=dict(sat='10:00–18:00', sun='10:00–18:00', mon='10:00–18:00', tue=None),
           tip='We wtorek zamknięte. Bilet online w weekend oszczędza kolejkę.')),

dict(id='dogana', name='Punta della Dogana i Salute', kind='rdzen', area='Dorsoduro', lat=45.43050, lon=12.33620,
 times=['K', 'W'], year='1682 / 1631',
 teaser='Komora celna dla towarów z morza, z Fortuną na złotej kuli, i kościół wotywny po dżumie 1630 roku. Tu gospodarka-świat płaciła cło.',
 essay=[
  'Na cyplu Dorsoduro stała Dogana da Mar, czyli komora celna dla towarów przypływających z morza; tę, którą widzisz, zbudowano w latach 1677–1682. Na wieży dwaj atlasi dźwigają złotą kulę, a na niej Fortuna obraca się z wiatrem jako wiatrowskaz. Dla kupieckiego miasta to symbol idealny: szczęście zmienne jak wiatr i pilnujące wejścia do Canal Grande. Od 2009 roku w magazynach, przebudowanych przez Tadao Andō, mieści się kolekcja Pinault.',
  'Obok stoi Santa Maria della Salute, wotum Republiki po dżumie z lat 1630–1631, która zabrała mniej więcej jedną trzecią mieszkańców. Longhena budował ją przez pół wieku na setkach tysięcy pali. Henry James porównał Salute do wielkiej damy stojącej na progu swojego salonu. Co roku 21 listopada Wenecjanie przechodzą tu po moście z łodzi; Braudel zauważyłby, że epidemie są także koniunkturą, bo co kilka pokoleń zmieniały skład ludności i ceny pracy.',
 ],
 read=[JAMES('rozdział „The Grand Canal” (1892)', 'Salute jako dama na progu salonu.'), BRAUDEL_MED, SIMMEL],
 info=dict(hours=dict(sat='Pinault 10:00–19:00', sun='Pinault 10:00–19:00', mon='Pinault 10:00–19:00', tue=None),
           tip='Cypel najlepszy o niebieskiej godzinie, ok. 18:30–19:00. Pinault zamknięte we wtorek.')),

dict(id='squero', name='Squero di San Trovaso', kind='glebia', area='Dorsoduro', lat=45.43040, lon=12.32560,
 times=['L'], year='XVII w.',
 teaser='Jedna z ostatnich stoczni gondoli, w drewnianych domach jak z Dolomitów. Opowieść o drewnie, bez którego Wenecja nie istnieje.',
 essay=[
  'Squero wygląda jak gospodarstwo z Cadore przeniesione nad kanał, i nie bez powodu: budowali je ludzie z gór, skąd przypływało drewno. Gondola jest asymetryczna, żeby jeden wioślarz z prawej strony mógł płynąć prosto, i składa się z kilkuset elementów z kilku gatunków drewna. Oglądaj z drugiego brzegu rio, nie wchodząc na teren warsztatu.',
  'Braudel zaczyna wiele rozdziałów od materiałów, a dla Wenecji najważniejszym materiałem było drewno. Miasto stoi na palach z modrzewia, dębu i olchy; Arsenał zjadał całe lasy, a Republika chroniła las Cansiglio jako rezerwę na wiosła i wyznaczała urzędników do pilnowania wycinek. Spławiano je Piawą i Brentą do laguny na tratwach, po wenecku zattere, i stąd nazwa nabrzeża, które zaczyna się sto metrów dalej.',
 ],
 read=[BRAUDEL_MED, LINKS, LANE],
 info=dict(hours=None, tip='Patrz z Fondamenta Nani, po drugiej stronie Rio di San Trovaso.')),

dict(id='zattere', name='Zattere i Fondamenta degli Incurabili', kind='slad', area='Dorsoduro', lat=45.42910, lon=12.32990,
 times=['L'], year='1989',
 teaser='Długie nabrzeże od tratw z drewnem. Włoski tytuł „Znaku wodnego” Brodskiego to właśnie „Fondamenta degli Incurabili”.',
 essay=[
  'Zattere to szerokie nabrzeże od strony słońca, z widokiem na Giudeccę i Redentore Palladia. Ospedale degli Incurabili było szpitalem dla chorych na kiłę, a potem jednym z czterech weneckich szpitali, w których sieroty i podopieczne śpiewały i grały tak, że zjeżdżała się na to Europa. Dziś mieści się w nim Akademia Sztuk Pięknych. Ruskin mieszkał w 1877 roku kilka kroków dalej, w pensjonacie La Calcina, na którym wisi jego tablica.',
  'Brodski pisał „Znak wodny” na zamówienie konsorcjum zajmującego się ochroną laguny, a włoski przekład nazwano właśnie od tego nabrzeża. Przyjeżdżał zimą przez siedemnaście lat; w jego książce Wenecja to mgła, woda, chłód i zapach wodorostów, a nie pocztówka. Czytaj go tutaj o zachodzie, gdy po drugiej stronie kanału zapalają się światła Giudekki, a wielkie statki wycieczkowe od 2021 roku już tędy nie pływają.',
 ],
 read=[BRODSKY, RUSKIN(1, 'przedmowa i rozdz. I „The Quarry”', 'Ruskin pisał część tej książki, mieszkając w Wenecji.'), MORAND],
 info=dict(hours=None, tip='Zachód słońca ok. 18:20. Z przystanku Zattere linia 6 płynie prosto na Lido.')),

dict(id='margherita', name='Campo Santa Margherita', kind='glebia', area='Dorsoduro', lat=45.43480, lon=12.32400,
 times=['L'], year='—',
 teaser='Wielkie, nierówne campo studentów i mieszkańców. Tutaj sprawdzisz, czy Wenecja jest jeszcze miastem, a nie tylko scenografią.',
 essay=[
  'Campo to nie piazza: w Wenecji tylko jeden plac ma prawo nazywać się „piazza”, wszystkie inne to „campi”, od pól, którymi kiedyś były. Santa Margherita jest długa, nieregularna, ze studniami, ławkami, targiem rybnym przy wolnostojącym budyneczku i studentami Ca\' Foscari wieczorem. Na końcu stoi Scuola Grande dei Carmini z sufitem Tiepola.',
  'Davis i Marvin pokazali w swojej antropologii, że turyści poruszają się po kilku wydeptanych liniach, a reszta miasta jest dla nich niewidzialna. Tu jesteś już poza tymi liniami. Settis i Coles piszą o tym, ile kosztuje codzienność w mieście, w którym mieszkańców ubywa: piekarnia, szkoła, apteka. Usiądź i policz, ile wózków dziecięcych przejedzie w ciągu kwadransa; to najprostszy wskaźnik demografii.',
 ],
 read=[DAVIS, COLES, SCARPA, SETTIS],
 info=dict(hours=None, tip='Dobra pora: 17:30–19:00, przed kolacją, z kieliszkiem i cicchetti.')),

dict(id='rezzonico', name='Ca\' Rezzonico', kind='glebia', area='Dorsoduro', lat=45.43385, lon=12.32675,
 times=['K'], year='1687 / 1889',
 teaser='Pałac rodu, który kupił sobie patrycjat za 100 tysięcy dukatów. Muzeum XVIII wieku, czyli długiej, złotej jesieni Republiki. Tu zmarł Browning.',
 essay=[
  'Rezzonico byli bogatymi kupcami spoza patrycjatu. Gdy Republika potrzebowała pieniędzy na wojnę z Turcją, sprzedawała tytuł patrycjusza: w 1687 roku ród zapłacił 100 tysięcy dukatów i wszedł do Wielkiej Rady. Pałac zaczął Longhena, skończył Massari, a w 1758 roku jeden z Rezzonico został papieżem Klemensem XIII. Dziś to muzeum weneckiego XVIII wieku: sufity Tiepola, Longhi, Guardi i freski Giandomenica Tiepola z willi w Zianigo, z Pulcinellami.',
  'Braudel opisał ten moment jako jesień: kapitał odpływa z handlu morskiego w ziemię na terra ferma, w wille, w sztukę i w przyjemność. Wenecja traci znaczenie gospodarcze, a zyskuje urok. Robert Browning zmarł w tym pałacu w 1889 roku, w domu syna; na fasadzie jest jego tablica. To dobre miejsce, żeby zapytać, czy złote wieki sztuki nie są raczej zachodami słońca niż świtami.',
 ],
 read=[BRAUDEL_TOW, PEMBLE, TANNER],
 info=dict(hours=dict(sat='10:00–18:00', sun='10:00–18:00', mon='10:00–18:00', tue=None),
           tip='Zamknięte we wtorek. Przystanek linii 1 tuż przed wejściem.')),

# ---------------------------------------------------------------- SAN MARCO (west)
dict(id='barbaro', name='Palazzo Barbaro', kind='slad', area='San Marco', lat=45.43190, lon=12.32935,
 times=['W'], year='1885–1902',
 teaser='Gotycki pałac przy moście Accademia, w którym Henry James mieszkał u bostońskich Curtisów i który przeniósł do „Skrzydeł gołębicy”.',
 essay=[
  'W 1885 roku pałac kupili Daniel i Ariana Curtisowie z Bostonu i zrobili z niego salon anglojęzycznej Wenecji. Bywali tu Sargent, Whistler, Monet i Henry James, który pisał w jednym z pokojów i z którego Palazzo Leporelli w „Skrzydłach gołębicy” jest portretem Barbaro. Sargent namalował w 1898 roku rodzinę Curtisów w salonie; obraz „An Interior in Venice” pokazuje, jak wyglądało to życie od środka.',
  'Pałac jest prywatny, oglądasz go z mostu Accademia albo z vaporetto. To dobre miejsce na rozmowę z Pemble\'em i Tannerem: XIX wiek wymyślił Wenecję jako miasto melancholii i rozkładu, a zamożni cudzoziemcy kupowali pałace po zubożałych rodach. James widział w tym i piękno, i coś niepokojącego; jego bohaterowie przyjeżdżają do Wenecji umierać albo zdradzać.',
 ],
 read=[JAMES('rozdział „Casa Alvisi” i „The Grand Canal”', 'Wenecja Jamesa z pałacowych okien.'),
       R('Henry James', 'The Aspern Papers (1888)', 'całość, nowela', 'Wenecki pałac, stara kobieta i listy poety; czytać na miejscu.', ASPERN, True),
       PEMBLE, TANNER],
 info=dict(hours=None, tip='Najlepszy widok z mostu Accademia, patrząc w stronę Salute.')),

dict(id='casanova', name='Calle Malipiero: dom Casanovy', kind='slad', area='San Marco', lat=45.43400, lon=12.32860,
 times=['W'], year='1725',
 teaser='Tablica w miejscu urodzenia Casanovy, syna aktorów z pobliskiego teatru San Samuele. Teatr widać jeszcze na mapie z 1808 roku.',
 essay=[
  'Giacomo Casanova urodził się 2 kwietnia 1725 roku w rodzinie aktorów; teatr San Samuele, w którym grali jego rodzice, stał kilkadziesiąt metrów stąd i został rozebrany w XIX wieku. Na mapie bazowej tego przewodnika, z katastru z 1808 roku, jeszcze go zobaczysz. Na Calle Malipiero wisi tablica w miejscu, które tradycja wskazuje jako jego dom rodzinny.',
  'Casanova był produktem osiemnastowiecznej gospodarki przyjemności, którą Wenecja zbudowała, gdy handel słabł: opera z biletami, kasyno Ridotto otwarte w 1638 roku, karnawał trwający miesiącami, kurtyzany i maski. W 1755 roku inkwizytorzy państwa zamknęli go w Piombi, a on uciekł przez dach. Wrócił po latach jako ich konfident, potem znów musiał wyjechać. Zmarł w Czechach rok po upadku Republiki, jakby nie umiał bez niej żyć.',
 ],
 read=[CASANOVA_R('tom I (dzieciństwo w Wenecji) i rozdziały o ucieczce', 'Autobiografia jako najlepszy obraz XVIII-wiecznej Wenecji.'), SEBALD, SIMPLE_EPFL],
 info=dict(hours=None, tip='Calle Malipiero odchodzi od Salizada San Samuele; tablica przy numerze 3082.')),

dict(id='mocenigo', name='Palazzo Mocenigo: Wenecja Byrona', kind='slad', area='San Marco (z wody)', lat=45.43480, lon=12.32850,
 times=['W'], year='1818–1819',
 teaser='Tu Byron mieszkał z menażerią i zaczął „Don Juana”. Z Lido do końca Canal Grande przepłynął wpław.',
 essay=[
  'W latach 1818–1819 Byron wynajmował Palazzo Mocenigo nad Canal Grande, z małpami, psami i lisem na schodach, z gondolierami w liberii i z Margheritą Cogni, żoną piekarza, która rządziła domem. Tu zaczął „Don Juana”. Wcześniej napisał „Beppo”, weneckie opowiadanie wierszem o karnawale i mężu, który wraca po latach z Turcji.',
  'Byron uczył się ormiańskiego u mnichów na San Lazzaro i jeździł konno po plaży Lido, a w 1818 roku przepłynął wpław od Lido przez Canal Grande. IV pieśń „Childe Harolda” ustanowiła ton, który trwa do dziś: Wenecja jako piękna ruina dawnej potęgi. Pemble i Tanner opisują, jak ten ton zmienił miasto w cel podróży milionów; Debray proponuje się z niego wyleczyć.',
 ],
 read=[BYRON_R('strofy 1–19', 'Wenecja jako ruina potęgi; tu zaczyna się romantyczny mit.'),
       R('Lord Byron', 'Beppo: A Venetian Story (1818)', 'całość, krótkie', 'Lekki, złośliwy obraz weneckiego karnawału.', IA('beppovenetiansto03byro'), True),
       TANNER, DEBRAY],
 info=dict(hours=None, tip='Pałac widać z linii 1 między San Samuele a Sant\'Angelo.')),

# ---------------------------------------------------------------- CASTELLO
dict(id='san_zaccaria', name='San Zaccaria', kind='glebia', area='Castello', lat=45.43483, lon=12.34354,
 times=['W', 'L'], year='1505',
 teaser='Klasztor arystokratycznych mniszek, groby ośmiu dożów i zalana krypta. Ołtarz Belliniego z 1505 roku świeci jak podłączony do prądu.',
 essay=[
  'Kościół stoi przy klasztorze benedyktynek, do którego patrycjusze oddawali córki, żeby nie płacić posagów. Mniszki były bogate i wpływowe; legenda mówi, że to one oddały Republice część swojego ogrodu, „brolo”, na poszerzenie Piazzetty. Od tego słowa pochodzi „broglio”, spiskowanie: tam patrycjusze załatwiali głosy przed obradami. W pobliżu zamordowano dwóch dożów, w 864 i 1172 roku, a ośmiu pochowano w krypcie, którą woda zalewa przy każdym przypływie.',
  'Wewnątrz ołtarz Giovanniego Belliniego z 1505 roku: Madonna z czterema świętymi, światło jak w ciepłym wieczorze, Bellini miał wtedy ponad siedemdziesiąt lat. Napoleon wywiózł obraz do Paryża, potem wrócił. W kaplicy San Tarasio są freski Florentczyka Andrei del Castagno z 1442 roku, jedne z pierwszych renesansowych malowideł w Wenecji, wcześniejsze niż wenecki renesans.',
 ],
 read=[JAMES('rozdział „Venice”, fragmenty o Bellinim', 'Bellini jako najczystsze światło Wenecji.'), BRAUDEL_VEN],
 info=dict(hours=dict(sat='zwykle 10–12, 16–18', sun='zwykle 16–18', mon='zwykle 10–12, 16–18', tue='zwykle 10–12, 16–18'),
           tip='Godziny bywają zmienne; krypta płatna osobno.')),

dict(id='schiavoni', name='Scuola degli Schiavoni i San Giorgio dei Greci', kind='glebia', area='Castello', lat=45.43639, lon=12.34620,
 times=['K', 'W'], year='1502–1507',
 teaser='Bractwo dalmatyńskich marynarzy z cyklem Carpaccia i, za rogiem, kościół Greków z krzywą dzwonnicą. Morze Śródziemne w jednej dzielnicy.',
 essay=[
  'Schiavoni, czyli Słowianie z Dalmacji, byli marynarzami, wioślarzami i żołnierzami Republiki; od nich wzięła nazwę Riva degli Schiavoni. Ich bractwo zamówiło u Carpaccia w latach 1502–1507 obrazy o patronach: św. Jerzym, Trifonie i Hieronimie. W „Śnie św. Augustyna” uczony siedzi w gabinecie humanisty, a obok czeka biały piesek; w „Walce ze smokiem” pod łapami bestii leżą resztki jej ofiar. Ruskin poświęcił tej sali osobny tekst, „The Shrine of the Slaves”.',
  'Kilkadziesiąt metrów dalej stoi San Giorgio dei Greci, kościół społeczności greckiej, która po upadku Konstantynopola w 1453 roku liczyła w Wenecji kilka tysięcy osób. Dzwonnica wyraźnie się przechyla. Braudel opisał Wenecję jako miasto „nacji”: Greków, Słowian, Niemców, Turków, Ormian i Żydów, każdej z własnym domem, kościołem albo fondaco. Tu widać to w skali kilku uliczek.',
 ],
 read=[R('John Ruskin', "St. Mark's Rest: The Shrine of the Slaves", 'rozdział o Carpacciu w Scuola', 'Ruskin oprowadza po obrazach sala po sali.', GS("St. Mark's Rest Ruskin"), True),
       MURATOV, BRAUDEL_MED],
 info=dict(hours=dict(sat='9:15–13:00, 14:45–18:00', sun='9:15–13:00', mon='14:45–18:00', tue='9:15–13:00, 14:45–18:00'),
           tip='Godziny Scuoli bywają kapryśne; sprawdź na drzwiach dzień wcześniej.')),

dict(id='zanipolo', name='San Zanipolo i Colleoni', kind='rdzen', area='Castello', lat=45.43926, lon=12.34217,
 times=['W', 'K'], year='1430 / 1571',
 teaser='Panteon dożów, urna ze skórą obrońcy Famagusty i najpiękniejszy pomnik konny Italii. Lepanto, czyli zwycięstwo, które niewiele zmieniło.',
 essay=[
  'Dominikański kościół Santi Giovanni e Paolo, po wenecku San Zanipolo, konsekrowano w 1430 roku; pochowano w nim dwudziestu pięciu dożów. W prawej nawie stoi pomnik Marcantonia Bragadina, który w 1571 roku bronił Famagusty na Cyprze; po kapitulacji Turcy obdarli go żywcem ze skóry, a dziewięć lat później Wenecjanin wykradł ją z Konstantynopola. Urna z tą skórą stoi w niszy pomnika.',
  'Kilka miesięcy po Famaguście flota chrześcijańska wygrała pod Lepanto. Braudel zauważył, że to wielkie zwycięstwo niczego trwale nie zmieniło: Cypr przepadł, a Wenecja w 1573 roku zawarła z Turcją osobny pokój, bo handel z Lewantem był ważniejszy od chwały. Na campo stoi Bartolomeo Colleoni Verrocchia. Kondotier zapisał Republice majątek pod warunkiem pomnika przed San Marco; Senat postawił go przed Scuola Grande di San Marco i uznał, że warunek spełniono.',
 ],
 read=[BRAUDEL_MED, LANE, RUSKIN(3, 'Indeks wenecki: groby w SS. Giovanni e Paolo', 'Ruskin czyta grobowce jak historię upadku obyczajów.')],
 info=dict(hours=dict(sat='9:00–17:45', sun='12:00–17:45', mon='9:00–17:45', tue='9:00–17:45'),
           tip='W niedzielę od 12:00.')),

dict(id='mendicanti', name='Mendicanti: śpiew zza krat', kind='slad', area='Castello', lat=45.44128, lon=12.34278,
 times=['W'], year='1743–1744',
 teaser='Dawny szpital Mendicanti, jeden z czterech, w których podopieczne śpiewały za kratami. Rousseau opisał, jak poznał je z bliska.',
 essay=[
  'Cztery weneckie „ospedali”, czyli Pietà, Mendicanti, Incurabili i Ospedaletto, były przytułkami, które zamieniły się w konserwatoria. Dziewczęta śpiewały i grały ukryte za kratami w kościołach, a Europa przyjeżdżała ich słuchać. Dziś Mendicanti są częścią szpitala miejskiego, z fasadą kościoła San Lazzaro dei Mendicanti od strony kanału.',
  'Rousseau, sekretarz francuskiego ambasadora w latach 1743–1744, opisał w księdze VII „Wyznań” niedzielne nieszpory w tych szpitalach i swoje rozczarowanie, gdy wreszcie zobaczył śpiewaczki z bliska. De Brosses kilka lat wcześniej zachwycał się ich grą bez zastrzeżeń. To mała scena, ale mówi coś o mieście, które z dobroczynności zrobiło markę i atrakcję dla cudzoziemców.',
 ],
 read=[R('Jean-Jacques Rousseau', 'Wyznania', 'księga VII (Wenecja 1743–1744)', 'Scena z nieszporami i śpiewaczkami.', ROUSSEAU, True),
       R('Charles de Brosses', 'Lettres familières écrites d\'Italie', 'listy z Wenecji 1739', 'Zachwyt nad muzyką ospedali.', DEBROSSES, True)],
 info=dict(hours=None, tip='Patrz z Fondamenta dei Mendicanti, w drodze z Fondamente Nove do Zanipolo.')),

dict(id='miracoli', name='Santa Maria dei Miracoli', kind='glebia', area='Cannaregio', lat=45.43930, lon=12.33947,
 times=['W'], year='1481–1489',
 teaser='Marmurowa szkatułka Pietra Lombarda, zbudowana dla cudownego obrazu. Wenecki renesans w wersji jubilerskiej.',
 essay=[
  'Kościół zbudowano w latach 1481–1489 dla obrazu Madonny, który wisiał na rogu domu i zaczął czynić cuda; datki pielgrzymów sfinansowały budowę. Pietro Lombardo z synami obłożył go z zewnątrz i wewnątrz barwnym marmurem, porfirem i serpentynem. Legenda mówi, że to resztki marmurów z San Marco, ale ważniejsze jest co innego: Wenecja przyjęła renesans jako materiał luksusowy, a nie jako teorię proporcji.',
  'Simmel pisał, że weneckie fasady są maskami, odciętymi od życia. Miracoli wyglądają jak dowód na jego tezę, a jednak są parafialnym kościołem, w którym biorą śluby Wenecjanie. Zajrzyj o tej porze, gdy słońce wpada przez okna na schody prezbiterium.',
 ],
 read=[SIMMEL, RUSKIN(3, 'Indeks wenecki, hasło „Miracoli”', 'Ruskin z niechęcią i podziwem o renesansowym marmurze.')],
 info=dict(hours=dict(sat='zwykle 10:30–16:30', sun=None, mon='zwykle 10:30–16:30', tue='zwykle 10:30–16:30'),
           tip='Kościół z Chorus Pass; w niedzielę zwykle zamknięty dla zwiedzających.')),

dict(id='arsenale', name='Arsenał: Porta Magna i lwy', kind='rdzen', area='Castello', lat=45.43490, lon=12.34960,
 times=['K', 'L'], year='1104 / 1460 / 1687',
 teaser='Brama państwowej stoczni, która działała jak fabryka. Jeden z lwów przy wejściu ma na bokach runy skandynawskich najemników Bizancjum.',
 essay=[
  'Arsenał był największym zakładem przemysłowym Europy przed rewolucją przemysłową: państwowa stocznia z produkcją seryjną, magazynami gotowych części, linownią i odlewniami. Dante porównał w XXI pieśni „Piekła” kocioł wrzącej smoły do Arsenału zimą, gdy łata się kadłuby: „Quale ne l\'arzanà de\' Viniziani / bolle l\'inverno la tenace pece”. Porta Magna z 1460 roku to pierwsza budowla renesansowa w mieście, łuk triumfalny przed fabryką.',
  'Przed bramą stoją lwy przywiezione przez Francesca Morosiniego z Aten w 1687 roku, tym samym, który podczas oblężenia Akropolu trafił w Partenon. Na bokach wielkiego lwa z Pireusu wyryto w XI wieku runy, zostawione przez skandynawskich najemników gwardii wareskiej. Lane i Braudel widzą tu państwowy kapitalizm Wenecji: galery handlowe budowało państwo, a prawo do ładowni licytowało prywatnym kupcom. W katastrze z 1808 roku Arsenał jest narysowany, ale nie opisany: jako strefa wojskowa nie miał właścicieli do spisania.',
 ],
 read=[R('Dante Alighieri', 'Boska komedia, Piekło', 'pieśń XXI, w. 7–15', 'Najsłynniejsze porównanie do Arsenału.', DANTE_WS, True),
       R('Dante Alighieri', 'Divine Comedy (przekład Longfellowa)', 'Inferno, canto XXI', 'Ten sam fragment po angielsku.', DANTE_EN, True),
       LANE, BRAUDEL_MED],
 info=dict(hours=None, tip='Bramę oglądasz z Campo de l\'Arsenal; wnętrza tylko podczas Biennale.')),

dict(id='pieta', name='Riva degli Schiavoni i Pietà', kind='glebia', area='Castello', lat=45.43419, lon=12.34491,
 times=['K', 'W'], year='1494 / 1703–1740',
 teaser='Nabrzeże dalmatyńskich marynarzy, z którego odpływały galery pielgrzymów. W Pietà Vivaldi uczył osierocone dziewczęta.',
 essay=[
  'Riva degli Schiavoni to nabrzeże, przy którym cumowały statki z Dalmacji i, przez wieki, galery pielgrzymów do Ziemi Świętej. Pietro Casola, kanonik z Mediolanu, czekał tu w 1494 roku tygodniami na odpłynięcie i pisał, że nie da się opisać tego miasta komuś, kto go nie widział. Felix Fabri, dominikanin z Ulm, zostawił kilkanaście lat wcześniej podobnie szczegółowy opis. To byli pierwsi masowi turyści Wenecji.',
  'Kościół Pietà należał do szpitala dla podrzutków; Antonio Vivaldi uczył tu muzyki z przerwami od 1703 do 1740 roku. Obecny kościół, z sufitem Tiepola, zbudowano już po jego śmierci, ale chór dziewcząt był słynny w całej Europie; de Brosses w 1739 roku pisał o nich z zachwytem. Dalej, w Palazzo Dandolo, czyli hotelu Danieli, mieszkali Dickens, Ruskin, George Sand i Musset.',
 ],
 read=[R('Pietro Casola', 'Pilgrimage to Jerusalem in the year 1494 (przekład M. Newett)', 'rozdziały weneckie', 'Mediolańczyk zdumiony miastem kupców.', CASOLA, True),
       R('Charles de Brosses', 'Lettres familières écrites d\'Italie', 'list o muzyce weneckiej', 'Opis koncertów w ospedali.', DEBROSSES, True),
       R('Felix Fabri', 'Evagatorium / Wanderings (PPTS)', 'oczekiwanie na galerę w Wenecji', 'Pielgrzymka jako pierwsza turystyka.', FABRI, True),
       DICKENS_R],
 info=dict(hours=None, tip='O zachodzie światło pada na fasady od strony laguny; w Pietà bywają wieczorne koncerty.')),

dict(id='garibaldi', name='Via Garibaldi i Riva dei Sette Martiri', kind='glebia', area='Castello', lat=45.43280, lon=12.35490,
 times=['W', 'L'], year='1807 / 1497',
 teaser='Kanał zasypany za Napoleona i jedyna prawdziwa „via” w mieście. Na jednym z domów tablica Caboto, który popłynął na Atlantyk dla Anglii.',
 essay=[
  'W 1807 roku Francuzi zasypali kanał i zrobili z niego szeroką ulicę, nazwaną wtedy na cześć wicekróla Eugeniusza; od zjednoczenia Włoch nosi imię Garibaldiego. To najbardziej mieszkalna ulica Wenecji: pranie nad głowami, targ, bary pełne ludzi z Castello. Na jednym z domów tablica przypomina, że mieszkał tu Giovanni Caboto, Wenecjanin z obywatelstwa, który w 1497 roku dopłynął dla angielskiego króla do wybrzeży Ameryki Północnej, prawdopodobnie Nowej Fundlandii.',
  'Dla Braudela to symboliczny adres. Wenecki żeglarz otwiera Atlantyk dla innej korony, a środek świata zaczyna przesuwać się z Morza Śródziemnego na ocean. Riva dei Sette Martiri, zbudowana w latach trzydziestych XX wieku, nosi imię siedmiu więźniów rozstrzelanych tu w 1944 roku. Stąd o zachodzie widać całe Riva, San Marco i Salute pod światło.',
 ],
 read=[BRAUDEL_TOW, SETTIS, COLES, MORRIS],
 info=dict(hours=None, tip='Zachód ok. 18:20; wieczorem na Via Garibaldi gra się w karty w barach.')),

dict(id='san_pietro', name='San Pietro di Castello', kind='glebia', area='Castello', lat=45.43458, lon=12.35981,
 times=['L', 'W'], year='do 1807',
 teaser='Katedra Wenecji aż do 1807 roku, celowo na peryferiach. W środku tron św. Piotra zrobiony z islamskiej steli nagrobnej.',
 essay=[
  'Wyspa Olivolo, na której stoi kościół, należała do najstarszych osad laguny; nazwa Castello pochodzi od dawnego kastrum. Przez tysiąc lat była tu katedra biskupa, a potem patriarchy, czyli celowo z dala od pałacu i placu. Republika trzymała religię na smyczy: najważniejszy kościół miasta był kaplicą doży, a biskup siedział na końcu Castello. Dopiero w 1807 roku Napoleon przeniósł katedrę do San Marco.',
  'W środku stoi „Cattedra di San Pietro”, tron złożony z elementów, wśród których jest islamska stela nagrobna z wersetami Koranu; tradycja wiąże go z Antiochią. Biała dzwonnica z istryjskiego kamienia jest dziełem Codussiego. O zmierzchu na trawie przed kościołem siedzą mieszkańcy z psami, a po drugiej stronie kanału widać doki Arsenału. To jeden z najlepszych przykładów na to, że długie trwanie widać w topografii władzy.',
 ],
 read=[BRAUDEL_MED, MORRIS],
 info=dict(hours=dict(sat='zwykle 10:30–16:30', sun=None, mon='zwykle 10:30–16:30', tue='zwykle 10:30–16:30'),
           tip='Kościół z Chorus Pass; samo campo jest najpiękniejsze o zmierzchu.')),

dict(id='bien_giardini', name='Biennale: Giardini', kind='biennale', area='Castello', lat=45.42900, lon=12.35790,
 times=[], year='od 1895',
 teaser='Pawilony narodowe i pawilon centralny 61. Biennale Arte „In Minor Keys”.',
 essay=['Ogrody urządzono za Napoleona, a od 1895 roku są siedzibą Biennale. Opis wystawy celowo pomijamy: to twoje własne spotkanie.'],
 read=[],
 info=dict(hours=dict(sat='10:00–18:00', sun='10:00–18:00', mon=None, tue='10:00–18:00'),
           tip='Ostatnie wejście 17:45. Bilet 3-dniowy liczy dni otwarcia, więc sobota, niedziela i wtorek.')),

dict(id='bien_arsenale', name='Biennale: Arsenale', kind='biennale', area='Castello', lat=45.43325, lon=12.35200,
 times=[], year='—',
 teaser='Corderie i hale Arsenału z wystawą główną i częścią pawilonów. Wejście od Campo della Tana.',
 essay=['Wystawa w dawnej linowni i halach stoczni. Opis wystawy celowo pomijamy.'],
 read=[],
 info=dict(hours=dict(sat='10:00–18:00', sun='10:00–18:00', mon=None, tue='10:00–18:00'),
           tip='Ostatnie wejście 17:45. Licz 4 godziny na całą trasę.')),

# ---------------------------------------------------------------- CANNAREGIO
dict(id='ghetto', name='Getto', kind='rdzen', area='Cannaregio', lat=45.44470, lon=12.32630,
 times=['W', 'K'], year='1516',
 teaser='Pierwsze getto na świecie, od weneckiego słowa „geto”, czyli odlewnia. Wysokie domy, synagogi „nacji” i Shylock w tle.',
 essay=[
  'W 1516 roku Senat nakazał Żydom zamieszkać na wyspie dawnej odlewni, „geto”, zamykanej na noc bramami, przy których stali chrześcijańscy strażnicy, opłacani przez samą gminę. Z braku miejsca budowano w górę, stąd domy wysokie na siedem i osiem kondygnacji, najwyższe w mieście. Później dołączono Ghetto Vecchio i Ghetto Novissimo. Synagogi, po wenecku „scole”, należały do różnych nacji: niemieckiej, lewantyńskiej, hiszpańskiej, włoskiej.',
  'Braudel podkreślał, że kupcy żydowscy, lewantyńscy i ponentyńscy, byli pośrednikami w handlu z Imperium Osmańskim, a Republika regulowała ich obecność kolejnymi „condotte”. Shakespeare napisał „Kupca weneckiego” około 1596 roku, nie będąc nigdy w Wenecji; Shylock jest postacią z wyobraźni Anglika, ale prawne warunki, o których mówi sztuka, były prawdziwe. Na Campo del Ghetto Novo stoi pomnik deportowanych w latach 1943–1944.',
 ],
 read=[R('William Shakespeare', 'Kupiec wenecki', 'akt I, scena 3', 'Kredyt, prawo i obcy w mieście kupców.', SHAKESPEARE, True), BRAUDEL_MED, MORRIS],
 info=dict(hours=None, tip='Muzeum Żydowskie było w remoncie; sprawdź przed wizytą, czy przyjmuje zwiedzających.')),

dict(id='madonna_orto', name='Madonna dell\'Orto', kind='rdzen', area='Cannaregio', lat=45.44650, lon=12.33260,
 times=['W'], year='1552–1563',
 teaser='Parafia i grób Tintoretta. Dwa płótna wysokie na kilkanaście metrów i pusta kaplica po Bellinim skradzionym w 1993 roku.',
 essay=[
  'Gotycki kościół z ceglaną fasadą był parafią Tintoretta; mieszkał kilka kroków dalej, na Fondamenta dei Mori, i jest tu pochowany z dziećmi. W prezbiterium wiszą dwa jego ogromne płótna, „Sąd Ostateczny” i „Adoracja złotego cielca”, a przy grobie „Ofiarowanie Marii w świątyni” z wysokimi schodami. W jednej z kaplic jest puste miejsce po „Madonnie z Dzieciątkiem” Giovanniego Belliniego, ukradzionej w 1993 roku i nigdy nieodnalezionej.',
  'Obok leży Campo dei Mori z kamiennymi figurami kupców w turbanach. Tradycja mówi, że to bracia z Morei, którzy w XII wieku przybyli tu jako handlarze; jeden z nich ma żelazny nos. Ruskin uważał Tintoretta za największego malarza Wenecji, a Madonna dell\'Orto jest jego galerią w miejscu, gdzie żył, bez kolejki i biletu w muzeum.',
 ],
 read=[RUSKIN(3, 'Indeks wenecki, hasło „Madonna dell\'Orto”', 'Ruskin o Tintoretcie w jego własnej parafii.'), MORRIS],
 info=dict(hours=dict(sat='10:00–17:00', sun='12:00–17:00', mon='10:00–17:00', tue='10:00–17:00'),
           tip='Datki zamiast biletu. Tablica Tintoretta na Fondamenta dei Mori 3399.')),

dict(id='ca_doro', name='Ca\' d\'Oro', kind='glebia', area='Cannaregio (z wody)', lat=45.44062, lon=12.33381,
 times=['W'], year='1421–1440',
 teaser='Najbogatsza gotycka fasada nad Canal Grande, kiedyś pozłacana. Galeria zamknięta do 2027 roku; oglądaj z wody.',
 essay=[
  'Marino Contarini zbudował ten pałac w latach 1421–1440 i kazał pozłocić i pomalować fasadę, stąd nazwa. W XIX wieku tancerka Maria Taglioni dostała go w prezencie i przebudowała tak, że Ruskin patrzył, jak niszczy się dziedziniec i schody. Baron Giorgio Franchetti kupił pałac w 1894 roku, odtworzył go i przekazał państwu z kolekcją, w której są „Święty Sebastian” Mantegni i resztki fresków Giorgionego i Tycjana z Fondaco dei Tedeschi.',
  'Ca\' d\'Oro to także przykład tego, o czym pisze Simmel: fasada jako maska, ażurowa koronka kamienia, za którą życie toczyło się zupełnie inaczej. Galeria jest zamknięta z powodu remontu, otwarcie planowane jest na wiosnę 2027 roku. Najlepiej oglądać ją z vaporetto albo z traghetto przy Santa Sofia.',
 ],
 read=[RUSKIN(2, 'rozdz. VII „Gothic Palaces”', 'Gotyk wenecki i lamenty nad restauracjami.'), SIMMEL],
 info=dict(hours=dict(sat=None, sun=None, mon=None, tue=None), tip='Zamknięte do 2027. Traghetto Santa Sofia przewozi przez kanał tuż obok.')),

dict(id='f_nove', name='Fondamente Nove', kind='baza', area='Cannaregio', lat=45.44230, lon=12.34120,
 times=['L'], year='1589',
 teaser='Nabrzeże północne z widokiem na San Michele, Murano i w pogodne dni Dolomity. Stąd płyną łodzie na wyspy północnej laguny.',
 essay=[
  'Nowe nabrzeża zbudowano pod koniec XVI wieku. W przejrzyste jesienne i zimowe dni widać stąd za laguną łańcuch Alp i Dolomitów. Tycjan mieszkał niedaleko, w Biri Grande, w domu z ogrodem, z którego patrzył na góry Cadore, swoje rodzinne strony. Z tych samych gór spływało drewno, bez którego Wenecja nie miałaby pali, galer ani gondoli.',
  'Braudel zaczyna „Morze Śródziemne” od gór, a nie od morza, i Fondamente Nove są miejscem, gdzie to rozumiesz: miasto na wodzie było zawsze zawieszone między Alpami a Lewantem. Naprzeciwko leży cmentarna wyspa San Michele.',
 ],
 read=[BRAUDEL_MED, BRODSKY],
 info=dict(hours=None, tip='Linie 4.1, 4.2, 5.1, 5.2 i 12 (na Murano, Burano i Torcello).')),

# ---------------------------------------------------------------- ISLANDS
dict(id='san_michele', name='San Michele', kind='slad', area='Laguna', lat=45.44750, lon=12.34630,
 times=['L', 'W'], year='1450 / 1996',
 teaser='Wyspa-cmentarz. Tu w klasztorze kamedułów Fra Mauro zrobił swoją mapę świata. Tu leżą Brodski, Pound, Strawiński i Diagilew.',
 essay=[
  'Cmentarz założono na wyspie z napoleońskiego nakazu, żeby nie grzebać zmarłych w mieście. Kościół San Michele in Isola Codussiego to pierwsza renesansowa świątynia w Wenecji. W tutejszym klasztorze kamedułów w połowie XV wieku pracował Fra Mauro i z relacji kupców i podróżników składał mapę świata, którą dziś ogląda się w Marcianie.',
  'W części ewangelickiej leżą Josif Brodski i Ezra Pound, w prawosławnej Igor Strawiński i Siergiej Diagilew; jest też Luigi Nono. Brodski chciał leżeć w Wenecji, a nie w Petersburgu ani w Nowym Jorku; na jego grobie ludzie zostawiają długopisy i kamyki. Odwiedziny zajmują godzinę; vaporetto z Fondamente Nove płynie kilka minut.',
 ],
 read=[BRODSKY, BRAUDEL_TOW],
 info=dict(hours=dict(sat='ok. 7:30–16:30', sun='ok. 7:30–16:30', mon='ok. 7:30–16:30', tue='ok. 7:30–16:30'),
           tip='Godziny cmentarza zmieniają się z porą roku; sprawdź przy wejściu.')),

dict(id='burano', name='Burano', kind='glebia', area='Laguna północna', lat=45.48431, lon=12.41919,
 times=['L'], year='—',
 teaser='Wyspa rybaków i koronczarek, z kolorowymi domami i krzywą dzwonnicą. Rano jeszcze należy do mieszkańców.',
 essay=[
  'Kolorowe domy Burano to fasady rybaków; mówi się, że kolory pomagały wracać we mgle. Ważniejsza od koloru była koronka: „punto in aria”, szyta igłą, eksportowana na dwory Europy w XVI i XVII wieku. Colbert ściągał koronczarki z Burano do Francji, żeby zbudować własną manufakturę w Alençon. To przemysłowe szpiegostwo w braudelowskim stylu: technika przenosi się tam, gdzie jest kapitał i opieka państwa.',
  'Krzywa dzwonnica San Martino przechyla się wyraźnie; w środku kościoła wisi „Ukrzyżowanie” Tiepola. Przyjedź przed dziesiątą, zanim przypłyną wycieczki, i przejdź na Mazzorbo po drewnianym moście, gdzie są winnice i ogrody laguny.',
 ],
 read=[BRAUDEL_MED, MORRIS],
 info=dict(hours=None, tip='Linia 14 z Lido albo 12 z Fondamente Nove; na Torcello linia 9 (5 minut).')),

dict(id='torcello', name='Torcello', kind='rdzen', area='Laguna północna', lat=45.49844, lon=12.41906,
 times=['L'], year='639',
 teaser='Matka Wenecji. Katedra założona w 639 roku, mozaika Sądu Ostatecznego i wyspa, którą zabiły malaria i muł.',
 essay=[
  'Zanim było Rialto, było Torcello. Uciekinierzy z Altinum osiedlili się tu w VI i VII wieku; inskrypcja z 639 roku w katedrze to najstarszy dokument historii Wenecji. W szczycie mieszkało tu może kilka tysięcy ludzi, a może więcej, z kościołami, pałacami i warzelniami soli. Potem laguna zaczęła się tu zamulać, przyszła malaria i ludzie odeszli do Rialto. Dziś na wyspie mieszka garstka osób.',
  'W katedrze Santa Maria Assunta zachodnią ścianę pokrywa mozaika Sądu Ostatecznego z XI–XII wieku, a w absydzie stoi wysoka, samotna Madonna na złotym tle. Ruskin zaczyna rozdział o Torcello na szczycie dzwonnicy, patrząc na pustą lagunę i zarośnięte barene; przeczytaj go na górze. Kasjodor w VI wieku pisał o mieszkańcach laguny jak o wodnym ptactwie żyjącym z soli. To czyste długie trwanie: geografia, która najpierw daje miastu życie, a potem je odbiera.',
 ],
 read=[RUSKIN(2, 'rozdz. II „Torcello”', 'Czytać na dzwonnicy: laguna jako krajobraz pierwszego miasta.'),
       R('Kasjodor', 'Variae (przekład T. Hodgkina, The Letters of Cassiodorus)', 'list XII.24 do trybunów morskich', 'Najstarszy opis mieszkańców laguny.', CASSIODORUS, True),
       BRAUDEL_MED, MORRIS],
 info=dict(hours=dict(sat='10:00–17:30', sun='10:00–17:30', mon='10:00–17:30', tue='10:00–17:30'),
           tip='Bilet łączony: bazylika, dzwonnica, muzeum. Ponte del Diavolo bez balustrad jest przy fondamenta.')),

dict(id='san_giorgio', name='San Giorgio Maggiore', kind='glebia', area='Laguna', lat=45.42930, lon=12.34330,
 times=['W'], year='1566–1610',
 teaser='Biała fasada Palladia naprzeciw Pałacu Dożów, „Ostatnia Wieczerza” Tintoretta i widok z dzwonnicy bez kolejki.',
 essay=[
  'Benedyktyni mieszkają tu od 982 roku. Kościół zaprojektował Palladio, budowę zaczęto w 1566 roku, a fasadę skończono w 1610, już po jego śmierci. W prezbiterium wiszą późne płótna Tintoretta, „Ostatnia Wieczerza” i „Zbieranie manny”. W refektarzu klasztoru wisiało kiedyś „Wesele w Kanie” Veronesego; Napoleon wywiózł je w 1797 roku do Luwru, a w 2007 roku zawieszono na jego miejscu cyfrową kopię.',
  'W tym klasztorze w latach 1799–1800 zebrało się konklawe, które wybrało papieża Piusa VII, bo Rzym był wtedy w rękach Francuzów. Z dzwonnicy, na którą wjeżdża się windą, widać całe miasto, Lido i, przy dobrej pogodzie, Alpy. Goethe w 1786 roku zachwycał się Palladiem i z tego dystansu łatwo zrozumieć, dlaczego.',
 ],
 read=[GOETHE_R('wpisy weneckie z października 1786', 'Goethe o Palladiu i o pierwszym spotkaniu z miastem.'), MORRIS],
 info=dict(hours=dict(sat='9:00–19:00', sun='9:00–19:00 (przerwa ok. 10:40–12:00)', mon='9:00–19:00', tue='9:00–19:00'),
           tip='Linia 2 z San Zaccaria, jeden przystanek.')),

dict(id='san_lazzaro', name='San Lazzaro degli Armeni', kind='slad', area='Laguna', lat=45.41198, lon=12.36142,
 times=['K'], year='1717 / 1816',
 teaser='Wyspa ormiańskich mnichów mechitarystów, gdzie Byron uczył się ormiańskiego. Drukarnia, rękopisy i egipska mumia.',
 essay=[
  'W 1717 roku Republika oddała dawną wyspę trędowatych ormiańskiemu zakonowi Mechitara z Sebasty. Klasztor stał się ośrodkiem kultury ormiańskiej: drukarnia, słowniki, przekłady, biblioteka rękopisów. Pierwszą książkę po ormiańsku wydrukowano w Wenecji już w 1512 roku. Ormianie byli w świecie Braudela kupcami jedwabiu i karawan, a Wenecja jednym z węzłów ich diaspory.',
  'Byron przypływał tu w latach 1816–1817, uczył się ormiańskiego i pomagał przy gramatyce ormiańsko-angielskiej; pamiątki po nim pokazuje się zwiedzającym. Zwiedza się z przewodnikiem, zwykle po południu, po przypłynięciu linią 20 z San Zaccaria.',
 ],
 read=[R('Lord Byron', 'Listy i dzienniki (Letters and Journals)', 'listy z grudnia 1816', 'Byron o lekcjach ormiańskiego u mnichów.', IAS('Byron letters and journals 1816 Armenian'), True), TANNER],
 info=dict(hours=dict(sat='zwiedzanie po południu', sun='zwiedzanie po południu', mon='zwiedzanie po południu', tue='zwiedzanie po południu'),
           tip='Sprawdź godzinę zwiedzania z przewodnikiem i kurs linii 20.')),

dict(id='sme', name='Lido S.M.E. (twoja baza)', kind='baza', area='Lido', lat=45.41830, lon=12.36930,
 times=['L'], year='—',
 teaser='Przystanek Santa Maria Elisabetta: stąd linie 1, 5.1/5.2, 6 i 14. Lido to wydma, która osłania lagunę przed morzem.',
 essay=[
  'Lido to po włosku „brzeg” i dokładnie tym jest: wąską mierzeją, która oddziela lagunę od Adriatyku. Bez lidi nie byłoby Wenecji, bo morze zalałoby lagunę, a bez kanałów między nimi laguna zamieniłaby się w bagno. Dalej na południe Republika zbudowała w XVIII wieku Murazzi, mury z kamienia istryjskiego, z dumnym napisem, że to dzieło na miarę Rzymian, ale za weneckie pieniądze. Przy wejściu do laguny na północ od przystanku działają dziś zapory MOSE.',
  'Niedaleko na północ od przystanku, przy Riviera San Nicolò, leży stary cmentarz żydowski z 1386 roku; Byron i Shelley jeździli konno właśnie wzdłuż tych brzegów. Rano z przystanku widzisz miasto od strony morza, czyli tak, jak widzieli je przez wieki przybysze.',
 ],
 read=[R('Percy Bysshe Shelley', 'Julian and Maddalo (1818)', 'początek poematu', 'Przejażdżka konna po Lido z Byronem.', SHELLEY, True), BRAUDEL_MED],
 info=dict(hours=None, tip='Linia 1 płynie przez Canal Grande; 5.1 i 14 szybciej do San Zaccaria; 6 do Giardini i Zattere.')),

dict(id='lido_beach', name='Plaża na końcu Gran Viale', kind='slad', area='Lido', lat=45.41270, lon=12.37950,
 times=['L'], year='1786 / 1818',
 teaser='Tu Goethe zbierał morskie stworzenia, Byron codziennie jeździł konno, a Shelley zaczął „Juliana i Maddala”.',
 essay=[
  'W październiku 1786 roku Goethe przypłynął na Lido i nad morzem zachowywał się jak przyrodnik: zbierał muszle i kraby, patrzył, jak fale przesuwają piasek. Kilkadziesiąt lat później Byron trzymał tu konie i galopował po plaży, a Shelley opisał jedną z takich przejażdżek na początku „Juliana i Maddala”: „I rode one evening with Count Maddalo / Upon the bank of land which breaks the flow / Of Adria towards Venice”.',
  'Od strony morza Wenecja znika za horyzontem i zostaje tylko Adriatyk, czyli to, czym Republika żyła. Braudel nazywał Adriatyk „Zatoką Wenecką”, bo przez wieki był jej wewnętrznym morzem. O świcie, około 7:30, plaża jest pusta.',
 ],
 read=[GOETHE_R('wpisy weneckie z października 1786 (wyprawa na Lido)', 'Goethe jako przyrodnik nad Adriatykiem.'),
       R('Percy Bysshe Shelley', 'Julian and Maddalo (1818)', 'pierwsze strofy', 'Czytać na plaży.', SHELLEY, True), BRAUDEL_MED],
 info=dict(hours=None, tip='Gran Viale prowadzi prosto od przystanku do plaży, około 15 minut.')),

dict(id='des_bains', name='Hotel des Bains', kind='slad', area='Lido', lat=45.40650, lon=12.37300,
 times=['W'], year='1911 / 1912',
 teaser='Belle Époque nad morzem i hotel Aschenbacha ze „Śmierci w Wenecji”. Zamknięty od 2010 roku, ale fasada nadal gra swoją rolę.',
 essay=[
  'Grand Hotel des Bains otwarto w 1900 roku, gdy Lido stało się kurortem dla europejskiej elity. Thomas Mann spędził tu urlop wiosną 1911 roku, słysząc plotki o cholerze, i rok później opublikował „Śmierć w Wenecji”: Gustaw von Aschenbach mieszka w tym hotelu i umiera na plaży przed nim. Visconti nakręcił tu film w 1971 roku. Hotel zamknięto w 2010 roku.',
  'Pemble pokazał, jak na przełomie wieków Wenecja stała się symbolem rozkładu i pokusy, a Mann dał temu najczystszą formę. Czytaj nowelę na Lungomare, z widokiem na pustą plażę: to jedno z niewielu miejsc, gdzie literatura i miejsce nakładają się prawie dosłownie.',
 ],
 read=[R('Thomas Mann', 'Der Tod in Venedig (1912)', 'rozdziały III–V', 'Oryginał niemiecki, domena publiczna od 2026 roku w UE.', MANN_DE, True),
       R('Thomas Mann', 'Death in Venice (przekład K. Burke\'a)', 'rozdziały III–V', 'Angielski przekład z 1925 roku.', MANN_EN, True),
       PEMBLE],
 info=dict(hours=None, tip='Wzdłuż Lungomare Marconi; obok Palazzo del Cinema festiwalu filmowego.')),
]

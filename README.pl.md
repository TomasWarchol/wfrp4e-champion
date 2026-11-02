# WFRP4e – Żelazny Mandat: Legenda Szampierza (`wfrp4e-champion`)

[English](README.md) | **Polski**

Moduł do **Foundry VTT v13–v14** i systemu **Warhammer Fantasy Roleplay 4e** dla jednej, wyjątkowej postaci: szampierza, chłopa i wojownika, który buduje swoją legendę. Napisany z myślą o kampanii **Wewnętrzny Wróg**, ale działa w każdej kampanii.

Szampierz nie zbiera punktów, tylko **historie o sobie**. Historie otwierają drzwi, a w świecie, w którym wróg kryje się w środku, ściągają też uwagę.

> **Czyn → Opowieść → Sława → Konsekwencje (szanse i wrogowie) → kolejny czyn**

---

## Zasady przy stole

### Opowieści i Sława
- **Opowieść** to nazwany czyn, który krąży wśród ludzi. Ma:
  - **oblicze**, czyli za kogo ludzie mają szampierza: Obrońca, Pogromca, Buntownik, Honorowy, Okrutnik, Szelma;
  - **krąg**, czyli kto ją opowiada: Gmin, Szlachta, Świątynie, Półświatek, Wojsko;
  - **Wagę**: 1 Plotka (okolica), 2 Opowieść (prowincja), 3 Legenda (całe Imperium).
- **Sława** to suma Wagi. Progi 3 / 7 / 12 / 18 dają Poziomy I–IV.
  - **Rozpoznanie:** obcy z kręgu, w którym krąży legenda, rozpoznaje szampierza przy k10 ≤ 2 × Poziom.
  - **Echo Sławy:** na początku sesji albo po podróży MG rzuca k10. Wynik ≤ Poziom + 1 oznacza, że sława coś ściąga: prośbę, pretendenta, balladę, czarną plotkę, samozwańca, ofertę albo czyjąś uwagę.
- **Przywołanie:** raz na sesję każdą opowieść można przywołać w teście społecznym wobec kogoś, kto mógł ją słyszeć. Premia wynosi +1 PS za punkt Wagi. Jasne opowieści wspierają Charyzmę, Przywództwo i Targowanie, ciemne Zastraszanie. Buntownik jest jasny dla gminu, a ciemny dla szlachty.
- **Kłamstwa:** wrogowie rozsiewają plotki. Kłamstwa nie da się przywołać, ale można je zdementować testem Plotkowania z karą −10 za punkt Wagi.

### Imię
- Gracz **ogłasza Imię**, którym chce być nazywany (np. „Tarcza Ubogich”), i oblicze, do którego dąży.
- **Lud nazywa go po swojemu:** po obliczu, które ma największą Wagę.
- **Wezwanie Imienia** (raz na sesję, gdy szampierz działa tak, jak go widzą ludzie) przywraca 1 Determinację.
- **Imię przyjęte:** oblicze ludu jest takie samo jak deklarowane i ma Wagę ≥ 3. Wtedy Wezwanie daje dodatkowo 1 Szczęście.
- Napięcie bierze się z różnicy między tym, kim gracz chce być, a tym, za kogo mają go ludzie.

### Prośby
- Ludzie przychodzą z prośbami (z Echa Sławy albo od MG). Szampierz może mieć naraz najwyżej **3 obietnice**.
- **Spełniona** prośba to opowieść o Wadze równej stawce, w kręgu proszącego.
- **Zawiedziona** to opowieść „nie dotrzymał słowa” (Szelma, ta sama Waga).
- **Odmowa** w poważnej sprawie albo w sprawie życia i śmierci przygasza najmocniejszą jasną opowieść w tym kręgu.

### Arena: pojedynek w czterech aktach
1. **Wyzwanie.** Warunki: do pierwszej krwi, do poddania się albo na śmierć. Widownia: kameralnie, przed tłumem albo widowisko (1–3). Do tego stawka i zakład. MG ustala Atuty rywala (0–3).
2. **Sekundanci.** Tu gra cała drużyna. Każdy gracz może przejąć jedną rolę i wykonać jeden test swoją postacią:

   | Rola | Test | Sukces |
   |---|---|---|
   | Zwiadowca | Plotkowanie | Atut „Słabość rywala” (PS ≥ 3: dwa) |
   | Herold | Charyzma | Tłum zaczyna od +1 (PS ≥ 3: +2) |
   | Bukmacher | Hazard | Kurs 2:1 (PS ≥ 3: 3:1) |
   | Giermek | Percepcja | Unieważnia Atut rywala (PS ≥ 3: dwa) |
   | Cyrulik | Leczenie | Po walce +1 + PS Żywotności |

3. **Walka.** Obowiązują zwykłe zasady walki WFRP.
   - **Atut szampierza** to +2 PS do jednego testu przeciw rywalowi.
   - **Tłum** ma skalę od −3 do +3. Przy ±2 strona, którą popiera, dostaje +1 Przewagi na początku każdej rundy (automatycznie, gdy pojedynek jest połączony z walką w trackerze).
   - **Gra pod publikę** to test Charyzmy w miejsce akcji.
   - **Brudne zagranie** obniża Tłum o 1 i zmienia oblicze opowieści o zwycięstwie w Szelmę.
4. **Rozstrzygnięcie.** Zwycięstwo rodzi opowieść.
   - **Waga** = widownia, +1 przy Tłumie ≥ 2, −1 przy ≤ −2.
   - **Oblicze** zależy od tego, co szampierz zrobi z pokonanym:
     - oszczędzi go → Honorowy, a rywal zostaje dłużnikiem;
     - upokorzy go → Buntownik wobec możnych, Okrutnik wobec słabszych;
     - zabije go → Pogromca w walce na śmierć, Okrutnik wbrew warunkom.
   - **Porażka** przygasza legendę, chyba że tłum był za szampierzem.

### Rywale
- Rywale pamiętają. Oszczędzony staje się dłużnikiem, a upokorzony poprzysięga zemstę.
- Gdy Echo Sławy wylosuje pretendenta, najpierw wraca rywal z największą urazą.

### Dziedzictwo
- WFRP jest zabójczy. Gdy szampierz zginie, MG przekazuje legendę dziedzicowi:
  - opowieści tracą 1 Wagę;
  - obietnice zmarłego trzeba spełnić;
  - rywale nie zapominają.

### Kronika
- Każda opowieść, obietnica i pojedynek zapisuje się w kronice.
- MG może ją wyeksportować do dziennika.
- Każdy gracz może dopisać „wersję z karczmy” do nowej opowieści (przycisk na czacie).

---

## W Foundry

- **Otwieranie:** ikona księgi w nagłówku karty postaci (gdy MG odblokuje funkcję w Centrum Dodatków), narzędzie na pasku żetonów albo makro:
  ```javascript
  game.champion.openSheet();                                   // zaznaczony żeton albo postać gracza
  game.champion.openSheet(game.actors.getName("Hans Brenner"));
  game.champion.echo(game.actors.getName("Hans Brenner"));     // Echo Sławy (MG)
  game.champion.newSession();                                  // nowa sesja (MG)
  ```
- **Przeciąganie aktorów:**
  - na tablicę próśb dodaje proszącego;
  - na listę rywali dodaje rywala (status społeczny WFRP decyduje, czy jest „możniejszy”);
  - na rękawicę w Arenie od razu tworzy wyzwanie;
  - na miejsce sekundanta przypisuje rolę.
- **Czat:**
  - karta „Sekundanci, do dzieła” ma przycisk dla każdej roli. Gracz klika, zgłasza swoją postać i od razu rzuca testem WFRP. Wynik zapisuje się u MG, więc gracz nie musi mieć praw do postaci szampierza;
  - karta nowej opowieści ma przycisk „Opowiedz w karczmie”.
- **Przyciski MG w nagłówku karty:** Echo Sławy, Nowa sesja (odnawia Przywołania i Wezwanie Imienia) i Dziedzictwo.
- **Ustawienie świata:** „Tłum daje Przewagę” (domyślnie włączone).

## Instalacja

W Foundry: **Dodatki → Zainstaluj moduł**, w polu *Manifest URL* wklej:

```
https://github.com/TomasWarchol/wfrp4e-champion/releases/latest/download/module.json
```

Foundry doinstaluje wymaganą bibliotekę **WFRP4e – Companion Library** (`wfrp4e-companion-lib`). Włącz oba moduły w świecie.

## Wymagania

- Foundry VTT v13–v14 i system WFRP4e 9.0+.
- **WFRP4e – Companion Library** (`wfrp4e-companion-lib`): Centrum Dodatków MG, przyciski na kartach, pasek narzędzi, zapytania do MG, kalendarz.

## Przejście z wersji 1.x

Wersja 2.0 to nowy system. Postawy, katalog manewrów, dwory i suwaki Mandatu nie zostały przeniesione. Stare dane zostają nietknięte we flagach postaci, a legenda zaczyna się od zera.

## Czcionki

Moduł zawiera czcionki **Pirata One**, **Cinzel** i **EB Garamond** na licencji SIL Open Font License 1.1 (pliki licencji w `fonts/`).

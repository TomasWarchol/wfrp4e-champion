# WFRP4e – Żelazny Mandat: Szampierz (Iron Mandate: Champion) (`wfrp4e-champion`)

[English](README.md) | **Polski**

Dedykowany moduł dla **Foundry VTT v13–v14** zintegrowany z systemem **Warhammer Fantasy Roleplay 4th Edition (WFRP4e)**.

Zaprojektowany specjalnie pod kampanię **Wewnętrzny Wróg (The Enemy Within)** – z uwzględnieniem realiów salonów Nuln, karnawałowego Middenheim (*Szara Eminencja*), podziemnej inwazji Skavenów (*Rogaty Szczur*) i wojny domowej (*Imperium w Ruinach*).

---

## 🎲 Główne Funkcje Modułu

### 1. Górny HUD Postaci:
* **Aktywna Postawa Bojowa:** Bieżący podgląd przyjętej postawy i jej premii.
* **Przewagi Aktora (Advantage):** Dynamicznie zsynchronizowane z kartą postaci WFRP4e – z nich opłacane są manewry.
* **Mandat Krwi (-10 Gmin <───> +10 Korona):** Płynny suwak reprezentujący polityczną pozycję Szampiera między zaufaniem pospólstwa a salonami arystokracji.
* **Chłopski Mir (0–100%):** Posłuch u prostych ludzi, strażników miejskich, służących i żołnierzy.

### 2. Zakładka 1: Szkoła Walki i Postawy Bojowe
* **3 Przełączane Postawy Bojowe (Stances):**
  * *Chłopska Barykada (Styl Middenlandzki)* – +10 Krzepa i Parowanie, niewrażliwość na powalenie, darmowe przejmowanie ciosów wymierzonych w sojuszników.
  * *Nulnijski Szermierz (Styl Południowy)* – +10 Inicjatywa i Zwinność, +1 dodatkowa Przewaga za udane parowanie, ataki z zaskoczenia ignorują Pancerz.
  * *Szuler z Zaułka (Brudny Brawler)* – broń improwizowana i lewaki bez kar, Brudne Sztuczki tańsze o 1 Przewagę.
* **Katalog Zbalansowanych Akcji Bojowych:**
  * Każdy manewr wymaga wydania Przewag oraz **zdania testu przeciwstawnego** (brak autowinów!).
  * *Prowokacje:* Zimna Drwina, Pozorna Słabość.
  * *Kontry i Riposty (po udanym parowaniu):* Nulnijska Riposta, Przechwycenie Jelca (Klin), Krok za Plecy.
  * *Chłopskie Brudne Sztuczki:* Piach i Ścieki (Oślepienie), Zdeptanie Ścięgien (Przewrócenie), Cios Głowicą w Zęby (Ogłuszenie).
  * *Finiszery i Pokazy:* Cięcie po Policzku (Trudny strzał celowany -20 z testem Opanowania wroga), Kunsztowne Rozbrojenie (+2 SL w teście przeciwstawnym), Ścięcie Przełamania (Złamanie morale i panika wrogów).

### 3. Zakładka 2: Wpływy na Dworach (Wielodworski System i Przypinanie Aktorów)
* **Wiele Dworów (Nuln, Middenheim, Altdorf itd.):** Niezależne zakładki z suwakami wpływu (0–100%).
* **Przypinanie Aktorów z Foundry (Drag & Drop):**
  * Przeciągnij token lub aktora z paska bocznego Foundry prosto na dany Dwór!
  * Moduł pobiera portret, imię i status społeczny.
  * Oznaczenie relacji: *Protektor / Mecenas*, *Dłużnik Honorowy*, *Zaszachowany / Szantaż*, *Zaciekły Rywal*.
  * Licznik Długów / Przysług [●●●○○] (1–5).
  * Haki i brudne sekrety na danego arystokratę.
  * Przycisk `[Wykorzystaj Wpływ]` – wysyła oficjalne żądanie na czat i pobiera 1 dług.

### 4. Zakładka 3: Rytuał Wyzwania i Studium Rywala
* **3 Skale Starcia:** Osobista (Sąd Boży), Taktyczna (Przełamanie Woli wodza), Wojenna (Pojedynek przed Armiami).
* **Studium Rywala (Zwiad przed pojedynkiem):** Odnotowywanie wykrytych słabości przeciwnika (*Stara kontuzja nogi*, *Porywczy furiat*, *Zatruwa ostrza*, *Zabobonny lęk*, *Sztywny styl*) dających przewagi w walce.
* **Rzut Rękawicy na Czat:** Bogata karta wyzwania ze stawką, warunkami i odkrytymi słabościami wroga.

---

## 📥 Instalacja

W Foundry: **Dodatki → Zainstaluj moduł**, w polu *Manifest URL* wklej:

```
https://github.com/TomasWarchol/wfrp4e-champion/releases/latest/download/module.json
```

Foundry doinstaluje też wymaganą bibliotekę **WFRP4e – Companion Library** (`wfrp4e-companion-lib`). Włącz oba moduły w świecie.

Język interfejsu przełącza się razem z językiem Foundry (polski lub angielski; inne języki dostają angielski).

## 📦 Wymagania

* Foundry VTT v13–v14 i system WFRP4e 9.0+.
* Moduł **WFRP4e – Companion Library** (`wfrp4e-companion-lib`, biblioteka wspólna serii: Centrum Dodatków MG, przyciski na kartach postaci, pasek narzędzi, kalendarz). Musi być zainstalowany i włączony w świecie.

## 🛠️ Uruchomienie i Makra

1. **Z karty postaci:** Kliknij ikonę tarczy z mieczem (`fa-shield-halved`) w nagłówku lub zakładkę **„Szampierz”** w menu karty.
2. **Z paska narzędzi tokenów (lewy pasek MG):** Narzędzie z tarczą i mieczem.
3. **Za pomocą makra:**
   ```javascript
   game.champion.openSheet();
   ```
   lub dla konkretnego aktora:
   ```javascript
   game.champion.openSheet(game.actors.getName("Imię Szampierza"));
   ```

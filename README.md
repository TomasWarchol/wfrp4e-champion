# WFRP4e – Iron Mandate: Champion (`wfrp4e-champion`)

**English** | [Polski](README.pl.md)

A module for **Foundry VTT v13–v14** and the **Warhammer Fantasy Roleplay 4th Edition** system: judicial duels, war challenges, a school of dirty steel and courtly influence for a **Champion** character.

Written with **The Enemy Within** campaign in mind – the salons of Nuln, carnival Middenheim, the Skaven beneath the cities and the civil war.

The interface follows Foundry's language: **English** or **Polish** (any other language falls back to English).

---

## 📥 Installation

In Foundry: **Add-on Modules → Install Module**, paste this into *Manifest URL*:

```
https://github.com/TomasWarchol/wfrp4e-champion/releases/latest/download/module.json
```

Foundry also installs the required **WFRP4e – Companion Library** (`wfrp4e-companion-lib`). Enable both modules in your world.

## 📦 Requirements

* Foundry VTT v13–v14 and the WFRP4e system 9.0+.
* **WFRP4e – Companion Library** (`wfrp4e-companion-lib`).

---

## 🎲 Features

### Character HUD
* **Active stance** and its bonuses.
* **Advantage** synchronised with the WFRP4e character sheet – manoeuvres are paid with it.
* **Blood Mandate** (−10 Commons ↔ +10 Crown): the Champion's political standing between the common folk and the aristocracy.
* **Commons' Regard** (0–100%): standing with simple folk, the city watch, servants and soldiers.

### Tab 1: School of Combat & Stances
* **Three stances**: *Peasant Barricade* (Middenland style), *Nuln Fencer* (southern style), *Alley Cardsharp* (dirty brawler).
* **Manoeuvres** paid with Advantage, each requiring an **opposed test** – provocations, ripostes after a successful parry, dirty tricks and finishers.

### Tab 2: Court Influence
* Several **courts** (Nuln, Middenheim, …) with their own influence sliders.
* **Drag and drop actors** onto a court: portrait, name and status are taken from the actor. Mark the relationship (patron, debtor of honour, blackmailed, bitter rival), count favours owed (1–5) and note hooks and secrets.
* **Use Influence** posts a formal demand to the chat and spends one favour.

### Tab 3: Ritual of Challenge & Rival Study
* **Three scales**: personal (trial by combat), tactical (breaking a warband chief's will), strategic (a duel before the armies).
* **Rival study**: record discovered weaknesses of the opponent (old leg wound, hot-headed, poisons blades, superstitious, rigid style).
* **Throw down the gauntlet**: a chat card with the stakes, conditions and the rival's known weaknesses.

---

## 🛠️ Opening and macros

1. **From the character sheet**: the shield-and-sword icon in the header.
2. **From the token toolbar** (GM): the shield-and-sword tool.
3. **Macro**:
   ```javascript
   game.champion.openSheet();
   game.champion.openSheet(game.actors.getName("Champion's name"));
   ```

The GM enables the module per character in the **Companion Hub** (`/hub`).

---

Unofficial fan content, not affiliated with Games Workshop or Cubicle 7. Code under the [MIT licence](LICENSE).

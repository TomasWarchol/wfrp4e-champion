# WFRP4e – Iron Mandate: Champion's Legend (`wfrp4e-champion`)

**English** | [Polski](README.pl.md)

A **Foundry VTT v13–v14** module for **Warhammer Fantasy Roleplay 4e** for one player: a champion, a peasant and a fighter who builds his legend. Written with **The Enemy Within** campaign in mind.

> **Deed → Tale → Fame → Consequences (opportunities and enemies) → the next deed**

The module adds to the session rather than being a separate game. During play one click is enough, decisions happen after the scene, and a duel is settled in a few rolls. Nothing in it needs the other players.

---

## How the champion uses it during a session

| When | What | How long |
|---|---|---|
| Start of session | The GM rolls the **Echo of Fame**: a petition, a challenger, a rival's move, a ballad, a dark rumour, an impostor, an offer or someone's attention | 1 roll |
| Social scene | **Invoking a tale** in the normal WFRP test dialog: an "Invoke" toggle, +1 SL per point of Weight | 1 click |
| Entering a new place | GM: **Recognition** (d10 ≤ 2 × Fame tier), only the GM sees it | 1 roll |
| Need to hide | **Hood**: nobody recognises him, but his tales stay silent | 1 click |
| Any fight | **Challenge the leader**: an Action, Intimidate or Leadership against the leader's Cool | 2 rolls |
| Something worth a tale | **Record a deed**: one line; after every fight the module asks | 1 line |
| After the scene | **"Who saw it?"**: the witnesses set the tale's Weight | 1 question |
| Formal duel | **Quick duel**: a few exchanges, each one Melee test | 2–5 rolls |
| Between adventures | **Small petitions** are settled as an endeavour | 1 roll |

During play the champion has a **small session panel** at hand (a button on his token, or "Session panel" in the book). The big book of legend is for between sessions.

---

## Rules at the table

### Tales and Fame
- A **tale** is a named deed. It has a **face** (Protector, Slayer, Rebel, Honourable, Brute, Rogue), a **circle** (Commons, Nobility, Temples, Underworld, Soldiery) and a **Weight**: 1 Rumour (locality), 2 Tale (province), 3 Legend (Empire).
- **Fame** is the total Weight. Thresholds 3 / 7 / 12 / 18 give Tiers I–IV.
- **Invoking:** once per session each tale gives +1 SL per point of Weight in a social test against someone who could have heard it. Bright tales work with Charm, Leadership and Haggle, dark ones with Intimidate. The Rebel is bright to the commons and dark to the nobility.
- **Lies** (from the Echo of Fame or a rival) can't be invoked. They can be refuted with a Gossip test at −10 per point of Weight.

### Deeds and witnesses
- During play you record a deed as one line. After the scene the question is **"Who saw it?"**:
  - **nobody:** the deed stays only in the chronicle;
  - **a few:** Rumour;
  - **a crowd or important witnesses:** Tale;
  - **a great event:** Legend.
- The tale's circle is whoever was watching.

### The Name
- The player declares a Name (e.g. "Shield of the Poor") and the face he strives for. The people name him after the face with the highest Weight.
- **Calling the Name** (once per session) restores 1 Resolve. An **accepted Name** (people's face = declared, Weight ≥ 3) also gives 1 Fortune.

### Petitions
- The champion can hold at most **3 promises** at a time.
- A **fulfilled** petition births a tale with the stake's Weight. A **failed** one births a "he broke his word" tale (Rogue).
- **Declining** a serious matter dims the strongest bright tale in the petitioner's circle.
- **Small matters** (stake 1) can be settled off-screen with one test: success is a tale, failure is bad fame. Serious matters stay adventure hooks for the GM.

### Challenge the leader (any fight)
- As an Action the champion challenges the enemy leader: Intimidate or Leadership against the leader's Cool.
- If the champion wins, the GM decides:
  - **the leader refuses:** the champion gains +1 Advantage, and the deed waits to be proclaimed;
  - **the leader accepts:** a quick duel starts at once, in the middle of the battle.

### Quick duel
- **Exchange:** the champion's Melee test (in the WFRP dialog) against the rival's roll. More SL hits. A tie is a clash. A margin of 4+ SL is a double hit.
- **Hits to win:** first blood 1, until one yields 2, to the death 3. A hit champion loses 1 + margin Wounds.
- **Approach:** attack beats feint, feint beats guard, guard beats attack (+20). The rival picks at random. A **dirty trick** always gives +20, but the Crowd drops and a victory gets the Rogue face.
- **Crowd** from −3 to +3: at ±2 the supported side gets +10. Winning by 3+ SL moves the Crowd.
- **Preparations before a formal duel:** at most 2 of 5, each a test by the champion:

  | Preparation | Test | Success |
  |---|---|---|
  | Scouting | Gossip | Edge "Rival's weakness" (+2 SL to one exchange; SL ≥ 3: two) |
  | The crowd | Charm | The Crowd starts at +1 (SL ≥ 3: +2) |
  | Wager | Gamble | Odds 2:1 (SL ≥ 3: 3:1) |
  | Weapons and judges | Perception | Cancels a rival edge (SL ≥ 3: two) |
  | Surgeon | Haggle | After the fight +1 + SL Wounds |

- **Aftermath:** a victory births a tale. Weight is the audience (1–3), +1 with Crowd ≥ 2, −1 at ≤ −2. The face follows the loser's fate: spared gives Honourable, humiliated gives Rebel against the mighty or Brute against the weaker, killed gives Slayer in a fight to the death or Brute against the terms.
- If you prefer, switch the duel to **full combat** in the tracker. Then a Crowd at ±2 gives +1 Advantage each round.

### Rivals and the Echo of Fame
- Rivals remember: a spared rival becomes a debtor; a humiliated one swears revenge.
- A **rival's move** in the Echo of Fame, by a rival with a grudge: slander (a lie in the legend), thugs (a ready encounter for the GM), bribery (an edge in the next duel) or a public insult.

### Inheritance
- When the champion dies, the GM passes the legend to an heir:
  - tales lose 1 Weight;
  - the dead man's promises must be kept;
  - rivals don't forget.

---

## In Foundry

- **Session panel:** the book button on the champion's token HUD, or "Session panel" in the book. It holds:
  - tales at hand;
  - Record a deed, Challenge, Call the Name and the hood;
  - the duel with approaches and an "Exchange!" button;
  - promises;
  - for the GM: Recognition and Echo.
- **WFRP test dialog:** the module gives the character a "Champion's Legend" effect. Every tale that can be invoked shows up in the test dialog's modifiers as a toggle, but only for matching skills. Switching it on adds the SL bonus, and after the roll the tale is marked as invoked.
- **Book of legend:** the icon in the character sheet header (once the GM unlocks the feature in the GM Hub).
- **Macros:**
  ```javascript
  game.champion.openHud();                                     // session panel (selected token or the user's character)
  game.champion.openSheet(game.actors.getName("Hans Brenner"));
  game.champion.echo(game.actors.getName("Hans Brenner"));     // Echo of Fame (GM)
  game.champion.newSession();                                  // new session (GM)
  ```
- **Dragging actors:**
  - onto the petition board adds a petitioner;
  - onto the rivals list adds a rival (his Melee goes into the duel);
  - onto the gauntlet in the Arena starts a challenge at once.
- **Challenge the leader:** target the leader on the map, and his Cool and Melee are read automatically.

## Installation

In Foundry: **Add-on Modules → Install Module**, paste into *Manifest URL*:

```
https://github.com/TomasWarchol/wfrp4e-champion/releases/latest/download/module.json
```

Foundry also installs the required **WFRP4e – Companion Library** (`wfrp4e-companion-lib`). Enable both modules in the world.

## Requirements

- Foundry VTT v13–v14 and the WFRP4e system 9.0+ (the test dialog toggles need the system's effect scripts; without them invoking works from the panel).
- **WFRP4e – Companion Library** (`wfrp4e-companion-lib`).

## Upgrading from 1.x

Version 2.0 is a new system. Stances, the gambit catalogue, courts and the Mandate sliders were not carried over. The old data stays untouched in the character's flags.

## Fonts

The module bundles **Pirata One**, **Cinzel** and **EB Garamond** under the SIL Open Font License 1.1 (licence files in `fonts/`).

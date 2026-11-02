# WFRP4e – Iron Mandate: Champion's Legend (`wfrp4e-champion`)

**English** | [Polski](README.pl.md)

A **Foundry VTT v13–v14** module for **Warhammer Fantasy Roleplay 4e** built around one special character: a champion, a peasant and a fighter who builds his legend. Written with **The Enemy Within** campaign in mind, but works in any campaign.

The champion doesn't collect points. He collects **stories about himself**. Stories open doors, and in a world where the enemy hides within, they also draw attention.

> **Deed → Tale → Fame → Consequences (opportunities and enemies) → the next deed**

---

## Rules at the table

### Tales and Fame
- A **tale** is a named deed that spreads among people. It has:
  - a **face**, meaning who people think the champion is: Protector, Slayer, Rebel, Honourable, Brute, Rogue;
  - a **circle**, meaning who tells it: Commons, Nobility, Temples, Underworld, Soldiery;
  - a **Weight**: 1 Rumour (locality), 2 Tale (province), 3 Legend (the whole Empire).
- **Fame** is the total Weight. Thresholds 3 / 7 / 12 / 18 give Tiers I–IV.
  - **Recognition:** a stranger from a circle where the legend spreads recognises the champion on d10 ≤ 2 × Tier.
  - **Echo of Fame:** at the start of a session or after a journey the GM rolls d10. A result ≤ Tier + 1 means fame draws something in: a petition, a challenger, a ballad, a dark rumour, an impostor, an offer or someone's attention.
- **Invoking:** once per session each tale can be invoked in a social test against someone who could have heard it. The bonus is +1 SL per point of Weight. Bright tales support Charm, Leadership and Haggle, dark ones Intimidate. The Rebel is bright to the commons and dark to the nobility.
- **Lies:** enemies spread rumours. A lie can't be invoked, but it can be refuted with a Gossip test at −10 per point of Weight.

### The Name
- The player **declares the Name** he wants to be called (e.g. "Shield of the Poor") and the face he strives for.
- **The people name him their own way:** after the face with the highest Weight.
- **Calling the Name** (once per session, when the champion acts as people see him) restores 1 Resolve.
- **Name accepted:** the people's face matches the declared one and has Weight ≥ 3. Then Calling the Name also gives 1 Fortune.
- The tension comes from the gap between who the player wants to be and who people think he is.

### Petitions
- People come with petitions (from the Echo of Fame or the GM). The champion can hold at most **3 promises** at a time.
- A **fulfilled** petition becomes a tale with Weight equal to the stake, in the petitioner's circle.
- A **failed** one becomes a "he broke his word" tale (Rogue, same Weight).
- **Declining** a serious or life-and-death matter dims the strongest bright tale in that circle.

### Arena: a duel in four acts
1. **Challenge.** Terms: to first blood, until one yields, or to the death. Audience: private, before a crowd, or spectacle (1–3). Plus stakes and a wager. The GM sets the rival's edges (0–3).
2. **Seconds.** This is where the whole party plays. Each player can take one role and make one test with their own character:

   | Role | Test | Success |
   |---|---|---|
   | Scout | Gossip | Edge "Rival's weakness" (SL ≥ 3: two) |
   | Herald | Charm | The Crowd starts at +1 (SL ≥ 3: +2) |
   | Bookie | Gamble | Odds 2:1 (SL ≥ 3: 3:1) |
   | Squire | Perception | Cancels a rival edge (SL ≥ 3: two) |
   | Surgeon | Heal | After the fight +1 + SL Wounds |

3. **Fight.** Normal WFRP combat rules apply.
   - A **champion's edge** is +2 SL to one test against the rival.
   - The **Crowd** runs from −3 to +3. At ±2 the side it supports gains +1 Advantage at the start of every round (automatic when the duel is linked to a combat in the tracker).
   - **Playing to the crowd** is a Charm test instead of an Action.
   - A **dirty trick** lowers the Crowd by 1 and turns the face of the victory tale into Rogue.
4. **Aftermath.** A victory births a tale.
   - **Weight** = audience, +1 with Crowd ≥ 2, −1 at ≤ −2.
   - **Face** depends on what the champion does with the loser:
     - spares him → Honourable, and the rival becomes a debtor;
     - humiliates him → Rebel against the mighty, Brute against the weaker;
     - kills him → Slayer in a fight to the death, Brute against the terms.
   - A **defeat** dims the legend, unless the crowd was for the champion.

### Rivals
- Rivals remember. A spared rival becomes a debtor; a humiliated one swears revenge.
- When the Echo of Fame rolls a challenger, the rival with the greatest grudge returns first.

### Inheritance
- WFRP is deadly. When the champion dies, the GM passes the legend to an heir:
  - tales lose 1 Weight;
  - the dead man's promises must be kept;
  - rivals don't forget.

### Chronicle
- Every tale, promise and duel writes itself into the chronicle.
- The GM can export it to a journal.
- Any player can add a "tavern version" to a new tale (button in chat).

---

## In Foundry

- **Opening:** the book icon in the character sheet header (once the GM unlocks the feature in the GM Hub), the token toolbar tool, or a macro:
  ```javascript
  game.champion.openSheet();                                   // selected token or the user's character
  game.champion.openSheet(game.actors.getName("Hans Brenner"));
  game.champion.echo(game.actors.getName("Hans Brenner"));     // Echo of Fame (GM)
  game.champion.newSession();                                  // new session (GM)
  ```
- **Dragging actors:**
  - onto the petition board adds a petitioner;
  - onto the rivals list adds a rival (the WFRP social status decides whether he is "mightier");
  - onto the gauntlet in the Arena starts a challenge at once;
  - onto a second's slot assigns the role.
- **Chat:**
  - the "Seconds, to work" card has a button for each role. A player clicks it, volunteers their character and immediately rolls a WFRP test. The result is saved by the GM, so the player needs no rights to the champion's character;
  - the new-tale card has a "Tell it in the tavern" button.
- **GM buttons in the sheet header:** Echo of Fame, New session (refreshes Invocations and Calling the Name) and Inheritance.
- **World setting:** "Crowd grants Advantage" (on by default).

## Installation

In Foundry: **Add-on Modules → Install Module**, paste into *Manifest URL*:

```
https://github.com/TomasWarchol/wfrp4e-champion/releases/latest/download/module.json
```

Foundry also installs the required **WFRP4e – Companion Library** (`wfrp4e-companion-lib`). Enable both modules in the world.

## Requirements

- Foundry VTT v13–v14 and the WFRP4e system 9.0+.
- **WFRP4e – Companion Library** (`wfrp4e-companion-lib`): GM Hub, sheet buttons, toolbar, GM queries, calendar.

## Upgrading from 1.x

Version 2.0 is a new system. Stances, the gambit catalogue, courts and the Mandate sliders were not carried over. The old data stays untouched in the character's flags, and the legend starts from scratch.

## Fonts

The module bundles **Pirata One**, **Cinzel** and **EB Garamond** under the SIL Open Font License 1.1 (licence files in `fonts/`).

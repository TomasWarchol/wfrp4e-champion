/**
 * Akcje przycisków wspólne dla księgi (LegendSheet) i panelu sesji (LegendHud).
 * ApplicationV2 woła je z `this` ustawionym na okno, które ma pole `actor`.
 */

import { MODULE_ID } from "./constants.mjs";
import * as Ops from "./operations.mjs";

/** Akcja przycisku → operacja na szampierzu (z obsługą błędów). */
function action(fn) {
  return async function (event, target) {
    event.preventDefault();
    try {
      await fn.call(this, this.actor, target.dataset, event);
    } catch (err) {
      console.error(`${MODULE_ID} |`, err);
      ui.notifications.error(err.message);
    }
  };
}

/** Wybrane podejście i przełącznik Atutu w bieżącym oknie (radio „lg-approach”). */
function exchangeChoice(app) {
  const approach = app.element?.querySelector('input[name="lg-approach"]:checked')?.value ?? "attack";
  const useEdge = !!app.element?.querySelector('input[name="lg-use-edge"]')?.checked;
  return { approach, useEdge };
}

export const LEGEND_ACTIONS = {
  // Imię, sesja, MG
  declareName: action(a => Ops.declareName(a)),
  callName: action(a => Ops.callName(a)),
  newSession: action(() => Ops.newSession()),
  rollEcho: action(a => Ops.rollEcho(a)),
  recognize: action(a => Ops.recognize(a)),
  toggleHood: action(a => Ops.toggleHood(a)),
  inherit: action(a => Ops.inherit(a)),
  openHud: action(a => game.champion?.openHud(a)),
  openBook: action(a => game.champion?.openSheet(a)),
  openDeeds: action(a => game.champion?.openSheet(a, "deeds")),
  // Opowieści
  addTale: action(a => Ops.addTale(a)),
  editTale: action((a, d) => Ops.editTale(a, d.taleId)),
  deleteTale: action((a, d) => Ops.deleteTale(a, d.taleId)),
  invokeTale: action((a, d) => Ops.invokeTale(a, d.taleId)),
  refuteTale: action((a, d) => Ops.refuteTale(a, d.taleId)),
  // Czyny
  recordDeed: action(a => Ops.recordDeed(a)),
  promoteDeed: action((a, d) => Ops.promoteDeed(a, d.deedId)),
  dismissDeed: action((a, d) => Ops.dismissDeed(a, d.deedId)),
  // Prośby
  addPetition: action(a => Ops.addPetition(a)),
  editPetition: action((a, d) => Ops.editPetition(a, d.petitionId)),
  deletePetition: action((a, d) => Ops.deletePetition(a, d.petitionId)),
  petition: action((a, d) => Ops.petitionAction(a, d.petitionId, d.op)),
  endeavour: action((a, d) => Ops.endeavourPetition(a, d.petitionId)),
  // Arena
  newDuel: action(a => Ops.setupDuel(a)),
  editDuel: action(a => Ops.setupDuel(a, { edit: true })),
  challengeRival: action((a, d) => Ops.setupDuel(a, { rivalId: d.rivalId })),
  challengeLeader: action(a => Ops.challengeLeader(a)),
  postChallenge: action(a => Ops.postChallenge(a)),
  cancelDuel: action(a => Ops.cancelDuel(a)),
  duelStage: action((a, d) => Ops.duelStage(a, Number(d.dir) || 0)),
  duelMode: action((a, d) => Ops.setDuelMode(a, d.mode)),
  rivalEdges: action((a, d) => Ops.shiftRivalEdges(a, Number(d.delta) || 0)),
  doPrep: action((a, d) => Ops.doPrep(a, d.prep)),
  undoPrep: action((a, d) => Ops.undoPrep(a, d.prep)),
  exchange: action(function (a) {
    const { approach, useEdge } = exchangeChoice(this);
    return Ops.exchange(a, approach, { useEdge });
  }),
  yieldDuel: action(a => Ops.yieldDuel(a)),
  useEdge: action((a, d) => Ops.useEdge(a, d.edgeId)),
  crowd: action((a, d) => Ops.shiftCrowd(a, Number(d.delta) || 0)),
  playToCrowd: action(a => Ops.playToCrowd(a)),
  dirtyTrick: action(a => Ops.dirtyTrick(a)),
  linkCombat: action(a => Ops.linkCombat(a)),
  resolveDuel: action(a => Ops.resolveDuel(a)),
  // Rywale
  addRival: action(a => Ops.addRival(a)),
  editRival: action((a, d) => Ops.editRival(a, d.rivalId)),
  deleteRival: action((a, d) => Ops.deleteRival(a, d.rivalId)),
  grudge: action((a, d) => Ops.shiftGrudge(a, d.rivalId, Number(d.delta) || 0)),
  // Kronika
  addNote: action(a => Ops.addNote(a)),
  deleteNote: action((a, d) => Ops.deleteNote(a, d.entryId)),
  exportChronicle: action(a => Ops.exportChronicle(a))
};


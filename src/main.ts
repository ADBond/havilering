import { playUntilHuman } from './interface/api';
import { renderWithDelays } from './interface/render';
import { newGame } from './interface/game';
import { GameConfig } from './game/gamestate';

async function loadGame(config: GameConfig) {
  newGame(config);
  const futureStates = await playUntilHuman();
  // TODO: avoid this duplication
  await renderWithDelays(futureStates);
}

const DEFAULTS: GameConfig = {
  targetScore: 121,
  numPlayers: 4,
};


const button = document.getElementById("new-game-button")!;
const menu = document.getElementById("new-game-menu")!;
const form = document.getElementById("new-game-form") as HTMLFormElement;

function resetValues() {
  (form.querySelector(
    `input[name="targetscore"][value="${DEFAULTS.targetScore}"]`
  ) as HTMLInputElement).checked = true;

  (form.querySelector(
    `input[name="numplayers"][value="${DEFAULTS.numPlayers}"]`
  ) as HTMLInputElement).checked = true;

}

document.addEventListener("DOMContentLoaded", async () => {
  resetValues();
  await loadGame(DEFAULTS);
});

button.addEventListener("click", () => {
  menu.hidden = !menu.hidden;
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const targetScore = formData.get("targetscore") as string;
  const numPlayers = formData.get("numplayers") as string;
  const config: GameConfig = {
    targetScore: parseInt(targetScore),
    numPlayers: parseInt(numPlayers),
  }

  menu.hidden = true;
  resetValues();

  await loadGame(config);
});

document.addEventListener("click", (e) => {
  if (!menu.contains(e.target as Node) && e.target !== button) {
    menu.hidden = true;
  }
});

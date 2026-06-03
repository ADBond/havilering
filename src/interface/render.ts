import { createCardElement } from './ui';
import { GameStateForUI, state } from '../game/gamestate';
import { PlayerName } from '../game/player';
import { onHumanPlay } from './api';


export async function renderState(state: GameStateForUI) {
  console.log(state);
  const n_players = state.playerNameArr.length;
  const handEl = document.getElementById('player-hand')!;
  const playerHand = state.hands.player;
  playerHand.sort(
    (c1, c2) => (
      // 100 big enough to ensure we always sort by suit first
      // TODO: align order with season
      100 * (c1.suit.rankForSorting - c2.suit.rankForSorting) +
      (c1.rank.trickTakingRank - c2.rank.trickTakingRank)
    )
  );
  handEl.innerHTML = '';
  playerHand.forEach(card => {
    handEl.appendChild(
      createCardElement(card.toStringShort(), state.whoseTurn === "player" ? (() => onHumanPlay(card)) : undefined)
    )
  });

  const gameBoard = document.getElementById("game-board")!;
  gameBoard.innerHTML = '';

  state.playerNameArr.forEach(p => {
    const areaEl = document.createElement("div");
    const playedEl = document.createElement("div");
    areaEl.classList.add("player-area");
    areaEl.classList.add(`${p}-${n_players}`);
    playedEl.id = `played-${p}-${n_players}`;
    playedEl.classList.add("played");
    areaEl.appendChild(playedEl);
    gameBoard.appendChild(areaEl);
    if (p === state.dealer) {
      playedEl.classList.add('dealer');
    } else {
      playedEl.classList.remove('dealer');
    }
    const card = state.played[p as PlayerName];
    let el: HTMLElement;
    if (card === 'back') {
      el = createCardElement('back');
    } else {
      el = createCardElement(
        card !== null ? card.toStringShort() : ""
      );
      el.classList.add('played-card');
    }
    playedEl.appendChild(el);
  });

  const prevElContainer = document.getElementById("prev-area")!;
  prevElContainer.innerHTML = '';
  state.playerNameArr.forEach(p => {
    const prevEl = document.createElement("div");
    prevEl.id = `prev-${p}-${n_players}`;
    prevEl.classList.add("prev-slot");
    prevElContainer.appendChild(prevEl);
    const card = state.previous[p as PlayerName];
    const el = createCardElement(card !== null ? card.toStringShort() : "");
    el.classList.add('played-card');
    prevEl.appendChild(el);
  });


  // game status - config
  document.getElementById('config')!.innerText = `playing to ${state.target}`;
  // and current status
  document.getElementById('hand-number')!.innerText = `(hand #${state.handNumber}, trick #${state.trickNumber})`;

  // console.log(state.suits);
  // TODO: rename from trumps for clarity
  const trumpsEl = document.getElementById('trump-holder')!;
  trumpsEl.innerHTML = '';
  state.suits.forEach(suit => {
    const el = createCardElement(`J${suit.toStringShort()}`);
    trumpsEl.appendChild(el);
  });

  const cachetteEl = document.getElementById('cachette')!;
  cachetteEl.innerHTML = '';
  if (state.cachette !== null) {
    state.cachette.forEach(c => {
      const cardEl = createCardElement(c.toStringShort());
      cardEl.classList.add("cachette-card");
      cachetteEl.appendChild(cardEl);
    })
  }

  const scoresTableEl = document.getElementById('scores-table') as HTMLTableElement;
  const breakdownEl = document.getElementById('scores-breakdown') as HTMLSpanElement;

  const scoreCategoriesText = state.scoresAndCategories.filter(
    category => category.points(n_players) !== 0
  ).map(
    category => `${category.points(n_players)} (${category.name})`
  );
  let totalScorePrev: number;
  if (state.scoresAndCategories.length === 0) {
    totalScorePrev = 0;
  } else {
    totalScorePrev = state.scoresAndCategories.map(
      (category) => category.points(n_players)
  ).reduce((l, r) => l + r, 0);
  }
  breakdownEl.textContent = `prev: ${totalScorePrev}: ${scoreCategoriesText.join(' + ')}`;

  const myPartnershipDisplay = n_players === 4 ? 'Player & N' : 'Player & NW & NE';
  const theirPartnershipDisplay = n_players === 4 ? 'E & W' : 'N & SW & SE';
  const nameLookup = {
    comp2: myPartnershipDisplay,
    comp1: theirPartnershipDisplay,
  } as const;

  type Partnership = keyof typeof nameLookup;

  scoresTableEl.replaceChildren();

  const headerRow = document.createElement('tr');
  for (const title of ['Partnership', 'Score', 'Previous']) {
    const th = document.createElement('th');
    th.textContent = title;
    headerRow.appendChild(th);
  }
  scoresTableEl.appendChild(headerRow);

  for (const player of Object.keys(nameLookup) as Partnership[]) {
    const row = document.createElement('tr');

    const nameTd = document.createElement('td');
    nameTd.textContent = nameLookup[player];
    nameTd.classList.add('player-name');

    const scoreTd = document.createElement('td');
    scoreTd.textContent = String(state.scores[player]);

    if (state.prevScores[player] > 0) {
      scoreTd.classList.add('score-up');
    }

    const prevTd = document.createElement('td');
    prevTd.textContent = String(state.prevScores[player]);

    row.append(nameTd, scoreTd, prevTd);
    scoresTableEl.appendChild(row);
  }
  // document.getElementById('debug')!.innerText = `${state.gameState}`;

}

const delayMap: Record<state, number> = {
  game_initialise: 10,
  play_card: 700,
  trick_complete: 1700,
  process_cachette: 3000,
  hand_complete: 3000,
  new_hand: 10,
  game_complete: 10,
}

export async function renderWithDelays(states: GameStateForUI[]) {
  // console.log('rendering');
  for (const state of states) {
    // console.log('render')
    // console.log(state);
    await renderState(state);
    await wait(delayMap[state.gameState]);
  }
}


function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

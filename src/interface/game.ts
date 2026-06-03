import { Game } from "../game/game";
import { GameConfig } from "../game/gamestate";
import { getSeasonalSuitShort } from "../utils/season";

let game: Game;
const opp = 'ismcts1000';

export function newGame(config: GameConfig): void {
    const dateNow = new Date();
    // dateNow.setDate(dateNow.getDate() - 1);
    const seasonalSuitShort = getSeasonalSuitShort(dateNow);
    const players = ['human', ...Array(config.numPlayers - 1).fill(opp)];
    game = new Game(
        players,
        config,
        seasonalSuitShort,
    );
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}

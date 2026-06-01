import { Game } from "../game/game";
import { defaultConfig } from "../game/game";
import { getSeasonalSuitShort } from "../utils/season";

let game: Game;
const opp = 'random';

export function newGame(): void {
    const dateNow = new Date();
    // dateNow.setDate(dateNow.getDate() - 1);
    const seasonalSuitShort = getSeasonalSuitShort(dateNow);
    game = new Game(
        ['human', opp, opp, opp, opp, opp],
        defaultConfig,
        seasonalSuitShort,
    );
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}

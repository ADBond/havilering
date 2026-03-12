import { Game } from "../game/game";
import { defaultConfig } from "../game/game";

let game: Game;

export function newGame(): void {
    game = new Game(
        ['human', 'velvet_swimming', 'velvet_swimming', 'velvet_swimming'],
        defaultConfig,
    );
}

export function getGame(): Game {
    if (!game) console.log("Error getting game! None found!");
    return game;
}

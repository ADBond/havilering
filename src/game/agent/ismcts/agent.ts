import { GameState } from "../../gamestate";
import { ComputerAgent } from "../agent";
import { ismcts } from "./ismcts";

export const ismctsAgent = (iterations: number, agent: ComputerAgent): ComputerAgent => ({
  chooseMove: async (gameState: GameState, legalMoveIndices: number[]) => {
    const [move, _] = ismcts(gameState, agent, iterations)

    return move;
  }
});

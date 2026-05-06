import { Card } from "../../card";
import { randomArrayElement } from "../random";

export class ISMCTSNode {
    private children: {[key: string]: ISMCTSNode} = {};
    private visits: number = 0;
    private availability: number = 0;
    private score: number = 0;
    private hand: Card[] = new Array();

    constructor(
        private playerIndex: number,
        private move: number | null = null,
        private parent: ISMCTSNode | null = null,
    ) {}

    public expand(legalMoves: number[]) {
        // pick a random child node we haven't visited before
        // only legal children
        const untriedNodes = legalMoves.filter(
            (move) => `${move}` in this.children
        ).map(
            (move) => this.children[`${move}`]
        ).filter(
            node => node.visits === 0
        );
        return randomArrayElement(untriedNodes);
    }

    public isFullyExpanded(legalMoves: number[]) {
        // TODO
    }
}

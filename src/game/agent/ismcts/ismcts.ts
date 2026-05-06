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

    private untriedNodes(legalMoves: number[]): ISMCTSNode[] {
        const untriedNodes = legalMoves.filter(
            (move) => `${move}` in this.children
        ).map(
            (move) => this.children[`${move}`]
        ).filter(
            node => node.visits === 0
        );
        return untriedNodes;
    }

    public ensureChildrenExist(playerIndex: number, legalMoves: number[]) {
        legalMoves.forEach(
            move => {
                if (!(`${move}` in this.children)) {
                    const newChild = new ISMCTSNode(playerIndex, move, this);
                    this.children[`${move}`] = newChild;
                }
            }
        );
    }

    public expand(legalMoves: number[]) {
        // pick a random child node we haven't visited before
        // only legal children
        return randomArrayElement(this.untriedNodes(legalMoves));
    }

    public isFullyExpanded(legalMoves: number[]) {
        // all legal children have been visited at least once
        // TODO: do we need this as a separate thing? Seems inefficient
        return this.untriedNodes(legalMoves).length === 0;
    }
}

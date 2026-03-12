import { Card, Rank, Suit } from "./card";

export class scoreCategory {
    constructor(public name: string, public points: number) {}
}

export const categories = {
    flush: new scoreCategory('Flush', 1),
    15: new scoreCategory('15', 1),
    31: new scoreCategory('31', 3),
    jack_havel: new scoreCategory('Jack Havel', 2),
    jack_havel_dealer: new scoreCategory('Jack Havel (dealer won)', 4),
    pair: new scoreCategory('Pair', 2),
    prial: new scoreCategory('Prial', 9),
    double_prial: new scoreCategory('Double prial', 12),
    run_3: new scoreCategory('Run of 3', 3),
    run_4: new scoreCategory('Run of 4', 9),
    run_flush_3: new scoreCategory('Running flush of 3', 4),
    run_flush_4: new scoreCategory('Running flush of 4', 10),
    final_trick: new scoreCategory('Final trick', 2),
}

export type categoryName = keyof typeof categories;

function ranksAtIndices(ranks: Rank[], indices: number[]): Rank[] {
    return indices.map(
        idx => ranks[idx]
    );
}

function valueSum(ranks: Rank[]): number {
    return ranks.map(
        (rank) => rank.count_value
    ).reduce(
        (val_l, val_r) => val_l + val_r
    );
}

function fifteenCount(ranks: Rank[]): number { 
    const possible_index_pairs = [
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
        [0, 1, 2],
        [0, 1, 3],
        [0, 2, 3],
        [1, 2, 3],
        [0, 1, 2, 3],
    ];
    return possible_index_pairs.filter(
        idx_set => valueSum(ranksAtIndices(ranks, idx_set)) === 15
    ).length;
}

export function trickScoreCategories(trick: Card[], seasonal_suit: Suit, dealer_won: boolean, trick_index: number): scoreCategory[] {
    let score_categories: scoreCategory[] = [];
    const trick_ranks = trick.map(card => card.rank);

    // count categories
    if (valueSum(trick_ranks) === 31) {
        score_categories.push(categories['31']);
    }
    for (let i = 0; i < fifteenCount(trick_ranks); i++) {
        score_categories.push(categories['15']);
    }
    // Jack Havel
    // nicer way to get this card, less deconstructed??
    if (trick.filter(card => card.rank.toStringShort() === "J" && Suit.suitEquals(card.suit, seasonal_suit)).length > 0) {
        if (dealer_won) {
            score_categories.push(categories['jack_havel_dealer']);
        } else {
            score_categories.push(categories['jack_havel']);
        }
    }

    return score_categories;
}

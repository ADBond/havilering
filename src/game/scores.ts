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

function value_sum(ranks: Rank[]): number {
    return ranks.map(
        (rank) => rank.count_value
    ).reduce(
        (val_l, val_r) => val_l + val_r
    );
}

export function trickScoreCategories(trick: Card[], seasonal_suit: Suit, dealer_won: boolean, trick_index: number): scoreCategory[] {
    let score_categories: scoreCategory[] = [];
    const trick_ranks = trick.map(card => card.rank);

    if (value_sum(trick_ranks) === 31) {
        score_categories.push(categories['31']);
    }

    return score_categories;
}

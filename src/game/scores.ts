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

function counter(str_arr: string[]): { [key: string]: number } {
    let counter: { [key: string]: number } = {};
    for (let i = 0; i < str_arr.length; i++) {
        const element = str_arr[i];
        if (counter[element]) {
            counter[element]++;
        } else {
            counter[element] = 1;
        }
    }
    return counter;
}

function arraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}

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
    const trick_suits = trick.map(card => card.suit);
    const rank_counter = counter(trick_ranks.map(rank => rank.name));
    const suit_counter = counter(trick_suits.map(suit => suit.name));
    const rank_counts = Object.values(rank_counter).sort();
    const suit_counts = Object.values(suit_counter).sort();

    // n-of-a-rank categories
    if (arraysEqual(rank_counts, [4])) {
        score_categories.push(categories['double_prial']);
    } else if (arraysEqual(rank_counts, [1, 3])) {
        score_categories.push(categories['prial']);
    } else if (arraysEqual(rank_counts, [2, 2])) {
        score_categories.push(categories['pair'], categories['pair']);
    } else if (arraysEqual(rank_counts, [1, 1, 2])) {
        score_categories.push(categories['pair']);
    }

    // TODO: runs / running flushes

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
    // simple flush
    if (arraysEqual(suit_counts, [4])) {
        score_categories.push(categories['flush']);
    }

    // final trick bonus
    // TODO: get number from somewhere?
    if (trick_index === 12) {
        score_categories.push(categories['final_trick']);
    }

    return score_categories;
}

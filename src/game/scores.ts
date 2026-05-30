import { Card, Rank, Suit } from "./card";

export class scoreCategory {
    constructor(public name: string, public points: number) { }
}

export const categories = {
    flush: new scoreCategory('Flush', 1),
    15: new scoreCategory('15', 1),
    31: new scoreCategory('31', 3),
    jack_havel: new scoreCategory('J. Havel', 3),
    jack_havel_dealer: new scoreCategory('J. Havel (d)', 6),
    pair: new scoreCategory('Pair', 2),
    prial: new scoreCategory('Prial', 9),
    double_prial: new scoreCategory('Morny', 12),
    run_3: new scoreCategory('3-run', 3),
    run_4: new scoreCategory('4-run', 9),
    run_flush_3: new scoreCategory('3-ruffle', 4),
    run_flush_4: new scoreCategory('4-ruffle', 10),
    final_trick: new scoreCategory('Last', 2),
}

export type categoryName = keyof typeof categories;

function hasPair(score_categories: scoreCategory[]): boolean {
    // TODO: a bit brittle, as name is not typed beyond string
    return score_categories.filter(
        (category) => category.name === 'Pair'
    ).length > 0;
}

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

function countSubsetsWithSums(countValues: number[], targets: number[]): Map<number, number> {
    const maxTarget = Math.max(...targets);
    const sumCounts = new Array<number>(maxTarget + 1).fill(0);
    sumCounts[0] = 1;

    for (const value of countValues) {
        for (let total = maxTarget; total >= value; total--) {
            sumCounts[total] += sumCounts[total - value];
        }
    }

    return new Map(targets.map(target => [target, sumCounts[target]]));
}

export function countRunsAndRuffles(cards: Card[], maxLength: number): {
    runs: Map<number, number>,
    ruffles: Map<number, number>
} {
    const byValue = new Map<number, Card[]>();
    for (const card of cards) {
        const bucket = byValue.get(card.rank.trickTakingRank) ?? [];
        bucket.push(card);
        byValue.set(card.rank.trickTakingRank, bucket);
    }

    const pointedAt = new Set(cards.map(card => card.rank.ttRankAbove));
    const runStarts = cards.filter(card => !pointedAt.has(card.rank.trickTakingRank));

    const lengths = [...Array(maxLength).keys()].map(i => i + 1);
    const runs = new Map<number, number>(lengths.map(l => [l, 0]));
    const ruffles = new Map<number, number>(lengths.map(l => [l, 0]));

    // DFS from each start, tracking current run length, and if it is suited
    function dfs(card: Card, length: number, singleSuit: Suit | null) {
        const updatedSuit = singleSuit !== null && Suit.suitEquals(singleSuit, card.suit)
        ? singleSuit   // single-suit - potential ruffle
        : null;        // mixed-suit - a run

        const successors = byValue.get(card.rank.ttRankAbove) ?? [];
        if (successors.length === 0) {
            const bucket = updatedSuit !== null ? ruffles : runs;
            bucket.set(length, (bucket.get(length) ?? 0) + 1);

        } else {
            for (const successor of successors) {
                dfs(successor, length + 1, updatedSuit);
            }
        }
    }

    for (const start of runStarts) {
        dfs(start, 1, start.suit);
    }

    return { runs, ruffles };
}

function arraysEqual(arr1: any[], arr2: any[]): boolean {
    // console.log("Comparing arrays");
    // console.log(arr1);
    // console.log(arr2);
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    // console.log("same");
    return true;
}

function valueSum(ranks: Rank[]): number {
    return ranks.map(
        (rank) => rank.count_value
    ).reduce(
        (val_l, val_r) => val_l + val_r
    );
}

export function fifteenCount(ranks: Rank[]): number {
    // only keeping this function for testing + temp compat
    return countSubsetsWithSums(ranks.map(rank => rank.count_value), [15]).get(15)!;
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

    const runAndRuffleCounts = countRunsAndRuffles(trick, trick.length);

    // just stupid way for now while i check
    const run3s = runAndRuffleCounts["runs"].get(3) ?? 0;
    const run4s = runAndRuffleCounts["runs"].get(4) ?? 0;
    const ruffle3s = runAndRuffleCounts["ruffles"].get(3) ?? 0;
    const ruffle4s = runAndRuffleCounts["ruffles"].get(4) ?? 0;

    score_categories.push(...Array(run3s).fill(categories['run_3']));
    score_categories.push(...Array(run4s).fill(categories['run_4']));
    score_categories.push(...Array(ruffle3s).fill(categories['run_flush_3']));
    score_categories.push(...Array(ruffle4s).fill(categories['run_flush_4']));

    // problems (but code changed since - worth testing):
    // 8C 6D 9D TC only scores as 15 (no run3)
    // KC QC AC 2C scores as rf3 + r3 (not rf4)

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

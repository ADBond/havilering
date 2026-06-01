import { Card, Rank, Suit } from "./card";

export class scoreCategory {
    constructor(public name: string, public points_4p: number, public points_6p: number = 0) { }
}

export const categories = {
    flush: new scoreCategory('Flush', 1),
    15: new scoreCategory('15', 1),
    31: new scoreCategory('31', 3),
    jack_havel: new scoreCategory('J. Havel', 3),
    jack_havel_dealer: new scoreCategory('J. Havel (d)', 6),
    n_of_rank_2: new scoreCategory('Pair', 2),
    n_of_rank_3: new scoreCategory('Prial', 9),
    n_of_rank_4: new scoreCategory('Morny', 12),
    run_3: new scoreCategory('3-run', 3),
    run_4: new scoreCategory('4-run', 9),
    run_5: new scoreCategory('5-run', 9),
    run_6: new scoreCategory('6-run', 9),
    run_flush_3: new scoreCategory('3-ruffle', 4),
    run_flush_4: new scoreCategory('4-ruffle', 10),
    run_flush_5: new scoreCategory('5-ruffle', 10),
    run_flush_6: new scoreCategory('6-ruffle', 10),
    final_trick: new scoreCategory('Last', 2),
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

export function countSubsetsWithSums(countValues: number[], targets: number[]): Map<number, number> {
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

export function trickScoreCategories(trick: Card[], seasonal_suit: Suit, dealer_won: boolean, trick_index: number): scoreCategory[] {
    let score_categories: scoreCategory[] = [];
    const trick_ranks = trick.map(card => card.rank);
    const trick_suits = trick.map(card => card.suit);
    const rank_counter = counter(trick_ranks.map(rank => rank.name));
    const suit_counter = counter(trick_suits.map(suit => suit.name));
    const rank_counts = Object.values(rank_counter).sort();
    const suit_counts = Object.values(suit_counter).sort();

    // n-of-a-rank categories
    const rankMatchSizes: (2 | 3 | 4)[] = [2, 3, 4];
    for (const nOfARank of rankMatchSizes) {
        const numberOfCombos = rank_counts.filter(count => count === nOfARank);
        score_categories.push(...Array(numberOfCombos.length).fill(categories[`n_of_rank_${nOfARank}`]));
    }

    const runAndRuffleCounts = countRunsAndRuffles(trick, trick.length);

    const runLengths: (3 | 4 | 5 | 6)[] = [3, 4, 5, 6];
    for (const runRuffleLength of runLengths) {
        const runs = runAndRuffleCounts["runs"].get(runRuffleLength) ?? 0;
        const ruffles = runAndRuffleCounts["ruffles"].get(runRuffleLength) ?? 0;
        score_categories.push(...Array(runs).fill(categories[`run_${runRuffleLength}`]));
        score_categories.push(...Array(ruffles).fill(categories[`run_flush_${runRuffleLength}`]));
    }

    // problems (but code changed since - worth testing):
    // 8C 6D 9D TC only scores as 15 (no run3)
    // KC QC AC 2C scores as rf3 + r3 (not rf4)

    // count categories
    const fifteensAndThirtyones = countSubsetsWithSums(trick_ranks.map(rank => rank.count_value), [15, 31]);
    for (let i = 0; i < fifteensAndThirtyones.get(31)!; i++) {
        score_categories.push(categories['31']);
    }
    for (let i = 0; i < fifteensAndThirtyones.get(15)!; i++) {
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
    if (suit_counts.length === 1) {
        score_categories.push(categories['flush']);
    }

    // final trick bonus
    // TODO: get number from somewhere?
    if (trick_index === 12) {
        score_categories.push(categories['final_trick']);
    }

    return score_categories;
}

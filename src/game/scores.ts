import { Card, Suit } from "./card";

export type categoryName = (
    'Flush' |
    '15' |
    '31' |
    'J. Havel' |
    'J. Havel (d)' |
    'Pair' |
    'Prial' |
    'Morny' |
    '3-run' |
    '4-run' |
    '5-run' |
    '6-run' |
    '3-ruffle' |
    '4-ruffle' |
    '5-ruffle' |
    '6-ruffle' |
    'Last'
)

// TODO: name & display-name should probably be distinct
export class scoreCategory {
    constructor(public name: categoryName, public points_4p: number, public points_6p: number = 0) { }

    public points(n_players: number): number {
        if (n_players === 4) {
            return this.points_4p;
        }
        return this.points_6p;
    }
}

export const categories = {
    flush: new scoreCategory('Flush', 1, 3),
    15: new scoreCategory('15', 1, 1),
    31: new scoreCategory('31', 3, 3),
    jack_havel: new scoreCategory('J. Havel', 3, 10),
    jack_havel_dealer: new scoreCategory('J. Havel (d)', 6, 20),
    n_of_rank_2: new scoreCategory('Pair', 2, 2),
    n_of_rank_3: new scoreCategory('Prial', 9, 10),
    n_of_rank_4: new scoreCategory('Morny', 12, 18),
    run_3: new scoreCategory('3-run', 3, 3),
    run_4: new scoreCategory('4-run', 9, 6),
    run_5: new scoreCategory('5-run', -1, 13),
    run_6: new scoreCategory('6-run', -1, 28),
    run_flush_3: new scoreCategory('3-ruffle', 4, 4),
    run_flush_4: new scoreCategory('4-ruffle', 10, 7),
    run_flush_5: new scoreCategory('5-ruffle', -1, 14),
    run_flush_6: new scoreCategory('6-ruffle', -1, 29),
    final_trick: new scoreCategory('Last', 2, 5),
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

export function trickScoreCategories(trick: Card[], seasonal_suit: Suit, dealer_won: boolean, final_trick: boolean): scoreCategory[] {
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
    if (final_trick) {
        score_categories.push(categories['final_trick']);
    }

    return score_categories;
}

import { describe, it, expect } from "vitest";
import { Rank, makeRanks, makeCards } from "../src/game/card";
import { countSubsetsWithSums, countRunsAndRuffles } from "../src/game/scores";

function fifteenCount(ranks: Rank[]): number {
    return countSubsetsWithSums(ranks.map(rank => rank.count_value), [15]).get(15)!;
}

describe("fifteenCount", () => {
    it("simple 4-card counts", () => {
        const ranksAndCounts: [string[], number][] = [
            [["T", "5", "6", "8"], 1],
            [["T", "5", "2", "3"], 2],
            [["T", "5", "4", "6"], 2],
            [["5", "5", "5", "5"], 4],
            [["7", "8", "7", "8"], 4],
            [["T", "J", "Q", "5"], 3],
            [["K", "A", "4", "5"], 2],
            [["6", "6", "6", "3"], 3],
            [["A", "3", "6", "2"], 0],
            [["A", "3", "6", "4"], 0],
            [["8", "9", "6", "7"], 2],
        ];
        ranksAndCounts.forEach(
            ([trickStrs, expected]) => {
                let trick = makeRanks(trickStrs);
                expect(fifteenCount(trick)).toBe(expected);
            }
        )

    });

    it("simple 6-card counts", () => {
        const ranksAndCounts: [string[], number][] = [
            [["A", "2", "3", "4", "5", "Q"], 4],
            [["2", "4", "6", "8", "T", "K"], 0],
            [["5", "5", "5", "5", "T", "J"], 12],
            [["6", "7", "7", "8", "9", "2"], 5],
            [["4", "A", "J", "T", "7", "3"], 3],
            [["7", "7", "7", "7", "A", "A"], 12],
        ];
        ranksAndCounts.forEach(
            ([trickStrs, expected]) => {
                let trick = makeRanks(trickStrs);
                expect(fifteenCount(trick)).toBe(expected);
            }
        )
    });

});


describe("runs/ruffles direct counts", () => {
    it("check wraparound runs", () => {
        const wraparounds = [
            ["K", "A", "2"],
            ["2", "K", "A"],
            ["A", "2", "3"],
            ["2", "A", "3"],
            ["K", "A", "2", "3"],
            ["3", "A", "K", "2"],
            ["Q", "K", "A", "2"],
            ["J", "Q", "K", "A", "2"],
            ["T", "J", "Q", "K", "A", "2"],
            ["Q", "K", "A", "2", "3", "4"],
            ["3", "2", "A", "K", "4", "Q"],
        ]
        wraparounds.forEach(
            (ranks) => {
                const runLength = ranks.length;
                const counts = countRunsAndRuffles(makeCards(ranks.map(rank => `${rank}S`)), runLength);
                expect(counts["ruffles"].get(runLength)!).toBe(1);
                expect(counts["runs"].get(runLength)!).toBe(0);
            }
        );
    });

    it("Maximal 3-runs", () => {
        const ranksAndCounts: [string[], number][] = [
            [["2", "3", "5", "9"], 0],
            [["2", "3", "4", "9"], 1],
            [["2", "3", "4", "5"], 0],  // part of a 4-run, so no
            [["2", "3", "3", "4"], 2],
            [["2", "3", "3", "3"], 0],
            [["5", "6", "8", "9", "T", "A"], 1],
            [["2", "3", "7", "8", "9", "T"], 0],
            [["5", "6", "8", "9", "T", "J"], 0],
            [["Q", "K", "A", "A", "A", "A"], 4],
            [["Q", "K", "A", "A", "A", "5"], 3],
            [["Q", "K", "A", "A", "A", "2"], 0],
            [["Q", "K", "K", "A", "A", "4"], 4],
            [["K", "K", "A", "A", "2", "2"], 8],
            [["T", "J", "Q", "K", "A", "2"], 0],
            [["4", "5", "5", "6", "6", "6"], 6],
        ]
        ranksAndCounts.forEach(
            ([ranks, expected3Runs]) => {
                const runLength = 3;
                const counts = countRunsAndRuffles(makeCards(ranks.map(rank => `${rank}S`)), runLength);
                expect(counts["ruffles"].get(runLength)!).toBe(expected3Runs);
                expect(counts["runs"].get(runLength)!).toBe(0);
            }
        );
    });

    it("Maximal 4-runs", () => {
        const ranksAndCounts: [string[], number][] = [
            [["2", "3", "5", "9"], 0],
            [["2", "3", "4", "9"], 0],
            [["2", "3", "4", "5"], 1],
            [["2", "3", "3", "4"], 0],
            [["2", "3", "3", "3"], 0],
            [["5", "6", "8", "9", "T", "A"], 0],
            [["2", "3", "7", "8", "9", "T"], 1],
            [["5", "6", "8", "9", "T", "J"], 1],
            [["Q", "K", "A", "A", "A", "A"], 0],
            [["Q", "K", "A", "A", "A", "5"], 0],
            [["Q", "K", "A", "A", "A", "2"], 3],
            [["Q", "K", "K", "A", "A", "4"], 0],
            [["K", "K", "A", "A", "2", "2"], 0],
            [["T", "J", "Q", "K", "A", "2"], 0],
            [["T", "J", "Q", "Q", "K", "5"], 2],
            [["T", "J", "Q", "Q", "K", "K"], 4],
        ]
        ranksAndCounts.forEach(
            ([ranks, expected4Runs]) => {
                const runLength = 4;
                const counts = countRunsAndRuffles(makeCards(ranks.map(rank => `${rank}S`)), runLength);
                expect(counts["ruffles"].get(runLength)!).toBe(expected4Runs);
                expect(counts["runs"].get(runLength)!).toBe(0);
            }
        );
    });

    it("Maximal 5-runs", () => {
        const ranksAndCounts: [string[], number][] = [
            [["5", "6", "7", "8", "9", "A"], 1],
            [["5", "6", "7", "8", "9", "T"], 0],
            [["5", "6", "7", "8", "9", "9"], 2],
            [["5", "6", "7", "8", "8", "9"], 2],
        ]
        ranksAndCounts.forEach(
            ([ranks, expected5Runs]) => {
                const runLength = 5;
                const counts = countRunsAndRuffles(makeCards(ranks.map(rank => `${rank}S`)), runLength);
                expect(counts["ruffles"].get(runLength)!).toBe(expected5Runs);
                expect(counts["runs"].get(runLength)!).toBe(0);
            }
        );
    });


    it("Maximal 6-runs", () => {
        const ranksAndCounts: [string[], number][] = [
            [["5", "6", "7", "8", "9", "A"], 0],
            [["5", "6", "7", "8", "9", "T"], 1],
            [["5", "6", "7", "8", "9", "9"], 0],
            [["5", "6", "7", "8", "8", "9"], 0],
        ]
        ranksAndCounts.forEach(
            ([ranks, expected6Runs]) => {
                const runLength = 6;
                const counts = countRunsAndRuffles(makeCards(ranks.map(rank => `${rank}S`)), runLength);
                expect(counts["ruffles"].get(runLength)!).toBe(expected6Runs);
                expect(counts["runs"].get(runLength)!).toBe(0);
            }
        );
    });
});

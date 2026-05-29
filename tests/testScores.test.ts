import { describe, it, expect } from "vitest";
import { makeRanks } from "../src/game/card";
import { fifteenCount, countRuns } from "../src/game/scores";


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


describe("runs direct counts", () => {
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
                const counts = countRuns(makeRanks(ranks),runLength)
                expect(counts.get(runLength)!).toBe(1);
            }
        );
    });


});

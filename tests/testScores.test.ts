import { describe, it, expect } from "vitest";
import { makeRanks } from "../src/game/card";
import { fifteenCount } from "../src/game/scores";


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
    ];
    ranksAndCounts.forEach(
        ([trickStrs, expected]) => {
            let trick = makeRanks(trickStrs);
            expect(fifteenCount(trick)).toBe(expected);
        }
    )
   
  });

});
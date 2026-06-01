import { describe, it, expect } from "vitest";
import { makeCards, getSuit } from "../src/game/card";
import { trickScoreCategories, categoryName } from "../src/game/scores";

const seasonal = getSuit("S");

describe("4-card trick categories", () => {
    it("simple 4-card counts", () => {
        const tricksAndCats: [string[], categoryName[]][] = [
            [["9S", "TD", "3C", "AS"], []],
            [["9S", "TS", "3S", "AS"], ["Flush"]],
            [["9S", "TD", "TC", "AS"], ["Pair"]],
            [["9S", "TD", "TC", "JD"], ["3-run", "3-run", "Pair"]],
            [["9D", "TD", "TC", "JD"], ["3-ruffle", "3-run", "Pair"]],
            [["9S", "TD", "TC", "9C"], ["Pair", "Pair"]],
            [["9S", "9D", "TC", "9C"], ["Prial"]],
            [["9S", "9D", "9H", "9C"], ["Morny"]],
            [["5S", "5D", "5H", "5C"], ["15", "15", "15", "15", "Morny"]],
            [["5S", "5D", "5H", "JC"], ["15", "15", "15", "15", "Prial"]],
            [["8C", "6D", "9D", "TC"], ["15", "3-run"]],
            [["KC", "QC", "AC", "2C"], ["4-ruffle", "Flush"]],
        ];
        tricksAndCats.forEach(
            ([trickStrs, expectedCats]) => {
                const trick = makeCards(trickStrs);
                const scoreCats = trickScoreCategories(trick, seasonal, false, 0);
                expect(scoreCats.map(cat => cat.name).sort()).toEqual(expectedCats.sort());
            }
        )

    });

});

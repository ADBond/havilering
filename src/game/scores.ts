import { Card, Suit } from "./card";

export class scoreCategory {
    constructor(public name: string, public points: number) {}
}

export const categories = {
    flush: new scoreCategory('Flush', 1),
}

export type categoryName = keyof typeof categories;

export function trickScoreCategories(trick: Card[], seasonal_suit: Suit, dealer_won: boolean, trick_index: number): scoreCategory[] {
    let score_categories: scoreCategory[] = [];

    return score_categories;
}

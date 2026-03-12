import { Card, Suit, getFullPack, shuffle } from "./card";
import { Player, PlayerName, playerNameArr } from "./player";
import { scoreCategory } from "./scores";
import { Agent, AgentName, agentLookup } from "./agent/agent";
import { GameLog } from "./log";

export type GameConfig = {
    targetScore: number,
}

export type state = 'game_initialise' | 'play_card' | 'trick_complete' | 'hand_complete' | 'new_hand' | 'game_complete';

export class GameState {
    public dealerIndex: number;
    public currentPlayerIndex: number;
    public leaderIndex: number | null = null;
    public pack: Card[] = getFullPack();

    public players: Player[] = [];
    public trickIndex: number;
    public trickInProgress: [Card, Player][] = [];

    public handNumber: number = 0;
    public currentState: state = 'game_initialise';

    public previousTrick: [Card, Player][] = [];
    public scoresAndCategories: [scoreCategory, number][] = [];

    constructor(public playerNames: AgentName[], public config: GameConfig) {
        // TODO: more / flexi ??
        const playerConfig: PlayerName[] = ['player', 'comp1', 'comp2', 'comp3'];
        const agents: Agent[] = playerNames.map((name) => agentLookup(name));
        this.players = playerNames.map(
            (name, i) => new Player(
                name,
                playerConfig[i],
                agents[i],
                i,
            )
        )
        // choose a random initial dealer
        this.dealerIndex = Math.floor(Math.random() * playerNames.length);
        // dummy values:
        this.currentPlayerIndex = 0;
        this.trickIndex = 0;
    }

    public async increment(log: GameLog) {
        const state = this.currentState;
        console.log(`Incrementing state - currently: ${state}`);
        switch (state) {
            case 'game_initialise':
                this.dealCards(log);
                break;
            case 'play_card':
                const _moveIndex = await this.computerMove();
                break;
            case 'trick_complete':
                this.resetTrick(log);
                break;
            case 'hand_complete':
                this.dealerIndex = this.getNextPlayerIndex(this.dealerIndex);

                this.completeLog(log);
                // initialise as separate state - keeps from doing too much at once
                this.currentState = 'game_initialise';
                break;
            case 'game_complete':
                this.completeLog(log);
                break;
            default:
            // error!
        }
    }

    get cardsPerHand(): number {
        return 13;
    }

    get trickNumber(): number {
        return this.trickIndex + 1;
    }

    get trickInProgressCards(): Card[] {
        return this.trickInProgress.map(
            ([card, _player]) => card
        );
    }

    get currentLedSuit(): Suit | null {
        const trickInProgressCards = this.trickInProgressCards;
        if (trickInProgressCards.length === 0) {
            return null;
        }
        return trickInProgressCards[0].suit;
    }

    get legalMoveIndices(): number[] {
        let legalCards: Card[];
        const hand = this.currentPlayerHand;
        const ledSuit = this.currentLedSuit;
        if (ledSuit === null) {
            // if there is no card led, anything is legal
            legalCards = hand;
        } else {
            // must follow suit if we can
            legalCards = hand.filter(card => Suit.suitEquals(card.suit, ledSuit));
            if (legalCards.length === 0) {
                // if we have no cards of led suit, anything is legal
                legalCards = hand;
            }
        }
        return legalCards.map(card => card.index);
    }

    getPlayer(name: PlayerName): Player {
        return this.players.filter(
            (player) => player.name === name
        )[0];
    }

    get scores(): number[] {
        return this.players.map(player => player.score);
    }

    private getPlayedCard(name: PlayerName, trick: [Card | null, Player][]): Card | null {
        const playerPlayedCards = trick.filter(
            ([_card, player]) => player.name === name
        );
        const numCards = playerPlayedCards.length;
        if (numCards === 1) {
            return playerPlayedCards[0][0];
        }
        if (numCards > 1) {
            console.log(`getPlayedCard error: ${playerPlayedCards}`);
        }
        return null;
    }

    get played(): Record<PlayerName, Card | null | 'back'> {
        let played;
        played = Object.fromEntries(
            playerNameArr.map((name): [PlayerName, Card | null | 'back'] => [
                name, this.getPlayedCard(name, this.trickInProgress)
            ])
        ) as Record<PlayerName, Card | 'back' | null>;

        return played;
    }

    get previous(): Record<PlayerName, Card | null> {
        let fromArr: [Card | null, Player][];
        fromArr = this.previousTrick;
        return Object.fromEntries(
            playerNameArr.map((name): [PlayerName, Card | 'back' | null] => [
                name,
                this.getPlayedCard(name, fromArr)
            ]
        )
        ) as Record<PlayerName, Card | null>;

    }

    get currentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    get currentPlayerHand(): Card[] {
        return this.currentPlayer.hand;
    }

    get humanHand(): Card[] {
        // TODO: don't fix index of human player, maybe?
        return this.getPlayerHand(0);
    }

    get numPlayers(): number {
        return this.players.length;
    }

    getNextPlayerIndex(playerIndex: number): number {
        return ((playerIndex + 1) % this.numPlayers);
    }

    public trickWinnerPlayer(): Player {
        const winningCardPlay = this.trickInProgress.filter(
            ([card, player]) => Card.cardEquals(card, this.winningCard())
        );
        // TODO: length check?
        const trickWinner = winningCardPlay[0][1];
        return trickWinner;
    }


    public winningCard(): Card {
        let winningCard: Card;
        const suitIndicesPlayed = new Set(this.trickInProgressCards.map(card => card.suit.rankForTrumpPreference));
        const suitIndexSum = [...suitIndicesPlayed].reduce((left, right) => left + right);

        // if only single suit played, or two 'opposite' suits, then highest of led suit
        if (
            (suitIndicesPlayed.size === 1) ||
            ((suitIndicesPlayed.size === 2) && (suitIndexSum % 2 === 0))) {

            const ledSuitCardsPlayed = this.trickInProgressCards.filter(
                (card) => Suit.suitEquals(card.suit, this.currentLedSuit as Suit)
            );
            winningCard = Card.singleHighestCard(ledSuitCardsPlayed);
        } else if (suitIndicesPlayed.size <= 3) {
        // if two consecutive suits, higher is trumps, and highest played wins
        // if three suits, highest when put consecutively wins
            let trumpSuitIndex: number;
            // there is probably a neater way to do this
            if (suitIndicesPlayed.size === 3) {
                switch (suitIndexSum) {
                    case 3:
                        // (0, 1, 2)
                        trumpSuitIndex = 2;
                        break;
                    case 4:
                        // (3, 0, 1)
                        trumpSuitIndex = 1;
                        break;
                    case 5:
                        // (2, 3, 0)
                        trumpSuitIndex = 0;
                        break;
                    case 6:
                        // (1, 2, 3)
                        trumpSuitIndex = 3;
                        break;
                    default:
                        trumpSuitIndex = -1;
                        break;
                }
            } else {
                switch (suitIndexSum) {
                    case 1:
                        // (0, 1)
                        trumpSuitIndex = 1;
                        break;
                    case 5:
                        // (2, 3)
                        trumpSuitIndex = 3;
                        break;
                    case 3:
                        if (Math.max(...suitIndicesPlayed) === 2) {
                            // (1, 2)
                            trumpSuitIndex = 2;
                        } else {
                            // (3, 0)
                            trumpSuitIndex = 0;
                        }
                        break;
                    default:
                        trumpSuitIndex = -1;
                        break;
                }
            }

            const trumpSuitCardsPlayed = this.trickInProgressCards.filter(
                (card) => card.suit.rankForTrumpPreference === trumpSuitIndex
            );
            winningCard = Card.singleHighestCard(trumpSuitCardsPlayed);
        } else {
            // all four - highest of all, with ties to latest
            const highestRankedCards = Card.highestCards(this.trickInProgressCards);
            winningCard = highestRankedCards[highestRankedCards.length - 1];
        }

        return winningCard;
    }


    get handNotFinished(): boolean {
        return this.players.map(
            (player) => player.hand
        ).some(
            (hand) => hand.length > 0
        );
    }

    private async computerMove(): Promise<number> {
        const agent = this.currentPlayer.agent;
        if (agent === 'human') {
            // TODO: error
            console.log("Error: trying to move for a human")
            return -20;
        }
        if (this.currentState !== 'play_card') {
            // TODO: error
            console.log(`Error: can't play card in ${this.currentState}`)
            return -20;
        }

        const currentLegalMoves = this.legalMoveIndices;
        const cardToPlayIndex = await agent.chooseMove(this, currentLegalMoves);
        const cardToPlay = Card.cardFromIndex(cardToPlayIndex, this.pack)

        if (!this.playCard(cardToPlay)) {
            console.log("Error playing card");
        }
        return cardToPlayIndex;
    }

    giveCardToPlayer(playerIndex: number, card: Card) {
        this.players[playerIndex].hand.push(card);
    }

    getPlayerHand(playerIndex: number): Card[] {
        return this.players[playerIndex].hand ?? [];
    }

    playCard(card: Card): boolean {
        if (!this.legalMoveIndices.includes(card.index)) {
            console.log(`Error: Cannot play illegal card ${card}`);
            return false;
        }
        const player = this.currentPlayer;
        const hand = player.hand;
        if (!hand) {
            console.log("Error: I couldn't find a hand!");
            return false;
        }

        const index = hand.findIndex(
            c => c.rank === card.rank && c.suit === card.suit
        );
        if (index < 0) {
            return false;
        }
        const [playedCard] = hand.splice(index, 1);
        this.trickInProgress.push([playedCard, player]);

        if (this.trickInProgress.length === this.numPlayers) {
            this.currentState = "trick_complete";
            return true;
        }
        const newCurrentPlayerIndex = this.getNextPlayerIndex(this.currentPlayerIndex);
        this.currentPlayerIndex = newCurrentPlayerIndex;
        return true;
    }

    // TODO: seed?
    dealCards(log: GameLog): void {
        const pack = getFullPack();
        shuffle(pack);
        for (let i = 0; i < 13; i++) {
            // for (const player of this.state.players) {
            // TODO: loop this properly!
            for (let playerIndex = 0; playerIndex < this.numPlayers; playerIndex++) {
                const card = pack.pop();
                if (card) this.giveCardToPlayer(playerIndex, card);
            }
        }

        // TODO now pack should be empty
        console.log("Empty pack:");
        console.log([...pack]);
        console.log([...this.getPlayerHand(0)]);
        console.log([...this.getPlayerHand(1)]);
        console.log([...this.getPlayerHand(2)]);
        console.log([...this.getPlayerHand(3)]);
        this.currentState = 'play_card';
        this.currentPlayerIndex = this.getNextPlayerIndex(this.dealerIndex);
        this.handNumber++;
        this.trickIndex = 0;

        // and update the current log
        log.dealerIndex = this.dealerIndex;
        log.handNumber = this.handNumber;
        log.captureHands(this.players.map((player) => [...this.getPlayerHand(player.positionIndex)]));
        log.startingScores = this.players.map((player) => player.score);
    }

    resetTrick(log: GameLog): void {
        const winnerPlayer = this.trickWinnerPlayer();
        const winnerPlayerIndex = winnerPlayer.positionIndex;
        this.currentPlayerIndex = winnerPlayerIndex;
        const trickValue = this.updateScores(winnerPlayerIndex);
        if (this.gameIsFinished) {
            this.currentState = "game_complete";
            return;
        }

        this.previousTrick = this.trickInProgress

        log.captureTrick(trickValue, this.trickInProgress, winnerPlayer.positionIndex);
        // empty the trick, and increment the counter!
        this.trickInProgress = [];
        this.trickIndex++;
        if (this.handNotFinished) {
            this.currentState = "play_card";
        } else {
            this.currentState = "hand_complete";
        }
    }

    updateScores(winnerPlayerIndex: number): number {

        const categoriesAndScores: [scoreCategory, number][] = [];
        const trickValue = categoriesAndScores.map(
            ([_category, score]) => score
        ).reduce(
            (x, y) => x + y, 0
        );

        // update the scores
        this.players[winnerPlayerIndex].scores.push(trickValue);
        this.players[(winnerPlayerIndex + 2) % this.numPlayers].scores.push(trickValue);
        // other players explicitly score 0 !
        this.players[(winnerPlayerIndex + 1) % this.numPlayers].scores.push(0);
        this.players[(winnerPlayerIndex + 3) % this.numPlayers].scores.push(0);

        this.scoresAndCategories = categoriesAndScores
        return trickValue;

        // cats_and_score = trick_score_cats(
        //     self.trick_in_progress,
        //     self.seasonal_suit,
        //     self.dealer_index == self.trick_winner_player_index,
        //     self.trick_index,
        // )
        // cat_scores = [value for _cat, value in cats_and_score]
        // trick_value = sum(cat_scores)

        // self.players[self.trick_winner_player_index].scores.append(trick_value)
        // self.players[
        //     (self.trick_winner_player_index + 2) % self.num_players
        // ].scores.append(trick_value)
        // # other players explicitly score 0 !
        // self.players[
        //     (self.trick_winner_player_index + 1) % self.num_players
        // ].scores.append(0)
        // self.players[
        //     (self.trick_winner_player_index + 3) % self.num_players
        // ].scores.append(0)
        // self.score_cat_info = cats_and_score
    }

    get gameIsFinished(): boolean {
        return this.players.map(
            (player) => player.score
        ).some((score) => score > this.config.targetScore)
    }

    completeLog(log: GameLog) {
        log.handScores = this.scores;
        log.complete = true;
    }

    getStateForUI(): GameStateForUI {
        return ({
            hands: { comp1: [], player: this.currentState === "hand_complete" ? [] : this.humanHand.slice(), comp2: [], comp3: [] },
            played: this.played,
            previous: this.previous,

            scores: Object.fromEntries(
                this.players.map(
                    (player) => [player.name, player.score]
               )
            ) as Record<PlayerName, number>,
            prevScores: Object.fromEntries(
                this.players.map(
                    (player) => [player.name, player.previousScore]
               )
            ) as Record<PlayerName, number>,
            scoresAndCategories: this.scoresAndCategories,

            gameState: this.currentState,
            whoseTurn: this.currentPlayer.name,
            handNumber: this.handNumber,
            trickNumber: this.trickNumber,
            target: this.config.targetScore,
        })
    }
}

export interface GameStateForUI {
    hands: Record<PlayerName, Card[]>;
    played: Record<PlayerName, Card | null | 'back'>;
    previous: Record<PlayerName, Card | null>;

    scores: Record<PlayerName, number>,
    prevScores: Record<PlayerName, number>,
    scoresAndCategories: [scoreCategory, number][],

    handNumber: number;
    trickNumber: number;
    target: number;

    gameState: state;
    whoseTurn: PlayerName;
}

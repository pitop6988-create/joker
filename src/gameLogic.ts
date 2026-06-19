import { Card, Suit, Rank } from './types';

export const createDeck = (gameType: 'uno' | 'joker' | 'dama' | 'dobble' | 'tictactoe' | 'airhockey' | 'ludo' = 'uno'): Card[] => {
  const deck: Card[] = [];

  if (gameType === 'dama' || gameType === 'dobble' || gameType === 'tictactoe' || gameType === 'airhockey' || gameType === 'ludo') return []; // No cards

  if (gameType === 'uno') {
    const colors: Suit[] = ['red', 'yellow', 'green', 'blue'];
    const numberRanks: Rank[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const actionRanks: Rank[] = ['skip', 'reverse', 'draw2'];

    colors.forEach(color => {
      // One 0 per color
      deck.push({ id: `${color}-0`, suit: color, rank: '0', value: 0 });
      // Two of each 1-9, skip, reverse, draw2
      for (let i = 0; i < 2; i++) {
        numberRanks.slice(1).forEach(rank => {
          deck.push({ id: `${color}-${rank}-${i}`, suit: color, rank, value: parseInt(rank) });
        });
        actionRanks.forEach(rank => {
          deck.push({ id: `${color}-${rank}-${i}`, suit: color, rank, value: 20 });
        });
      }
    });

    // Special cards
    for (let i = 0; i < 4; i++) {
      deck.push({ id: `wild-${i}`, suit: 'special', rank: 'wild', value: 50 });
      deck.push({ id: `wild4-${i}`, suit: 'special', rank: 'wild4', value: 50 });
    }
  } else {
    // Joker/Standard game type
    const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    suits.forEach((suit) => {
      ranks.forEach((rank) => {
        let value = 0;
        if (rank === 'A') value = 11;
        else if (['K', 'Q', 'J'].includes(rank)) value = 10;
        else value = parseInt(rank);

        deck.push({
          id: `${suit}-${rank}`,
          suit,
          rank,
          value,
        });
      });
    });

    // Add 2 Jokers for "Joker" mode
    deck.push({ id: 'joker-1', suit: 'joker', rank: 'Joker', value: 15 });
    deck.push({ id: 'joker-2', suit: 'joker', rank: 'Joker', value: 15 });
  }

  return deck;
};

export const shuffle = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

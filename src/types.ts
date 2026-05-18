export interface CardSkin {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserProfile {
  displayName: string;
  photoURL: string;
  totalWins: number;
  chips: number;
  level: number;
  xp: number;
  ownedSkins?: string[];
  activeSkinId?: string;
}

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker' | 'red' | 'yellow' | 'green' | 'blue' | 'special';
export type Rank = 'A' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'Joker' | '0' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export type GameStatus = 'waiting' | 'active' | 'finished';

export interface Game {
  id: string;
  status: GameStatus;
  players: string[];
  playerNames: Record<string, string>;
  roomName: string;
  password?: string;
  isPrivate: boolean;
  turn: string;
  deck: Card[];
  hands: Record<string, Card[]>;
  pile: Card[];
  scores: Record<string, number>;
  winner: string | null;
  hostId: string;
  gameType: 'uno' | 'joker';
  createdAt: number;
  lastMoveAt: number;
}

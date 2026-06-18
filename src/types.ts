export interface CardSkin {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  emoji?: string;
  isNew?: boolean;
}

export interface UserProfile {
  displayName: string;
  photoURL: string;
  totalWins: number;
  chips: number;
  level: number;
  xp: number;
  shortId?: string;
  friends?: string[];
  friendRequests?: string[];
  ownedSkins?: string[];
  activeSkinId?: string;
  clubId?: string | null;
  ownedEmojis?: string[];
  country?: string;
  ownedTableSkins?: string[];
  activeTableSkinId?: string | null;
  isAdmin?: boolean;
}

export interface TableSkin {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  emoji?: string;
  isNew?: boolean;
}

export interface RadioTrack {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  isChunked?: boolean;
  chunkCount?: number;
}

export interface EmojiItem {
  id: string;
  name: string;
  url: string;
  price: number;
  type: 'emoji' | 'gif';
  createdAt: number;
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

export interface ClubMessage {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: number;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  logo: string;
  ownerId: string;
  members: string[]; // List of user UIDs
  password?: string;
  isPrivate: boolean;
  maxMembers: number; // 1-30
  chipsPool: number;
  createdAt: number;
}

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
  gameType: 'uno' | 'joker' | 'dama' | 'dobble' | 'tictactoe' | 'airhockey' | 'ludo';
  board?: (string | null)[]; // Added for Dama (flattened for Firestore)
  createdAt: number;
  lastMoveAt: number;
}

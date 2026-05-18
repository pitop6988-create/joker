import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, onSnapshot, collection, query, where, limit, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, signIn, signOut, signInEmail, signUpEmail } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Play, Trophy, Users, RefreshCcw, Hand, Plus, Lock, MoreVertical, Coins, ShoppingBag, X, Mail, Key, User as UserIcon, Menu, Settings, MessageSquare, Gift, MoreHorizontal, ChevronUp, Edit, Camera, Save, Check, Image as ImageIcon, Crown, ShieldCheck, Star } from 'lucide-react';
import { Game, GameStatus, Card, UserProfile, CardSkin } from './types';
import { createDeck, shuffle } from './gameLogic';
import confetti from 'canvas-confetti';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'profile'>('home');
  const [searchGameType, setSearchGameType] = useState<'uno' | 'joker'>('uno');
  const [skinsMap, setSkinsMap] = useState<Record<string, CardSkin>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cardSkins'), (snapshot) => {
      const map: Record<string, CardSkin> = {};
      snapshot.docs.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() } as CardSkin;
      });
      setSkinsMap(map);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cardSkins');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${u.uid}`);
          return;
        }

        if (!userSnap?.exists()) {
          const newProfile: UserProfile = {
            displayName: u.displayName || 'Guest',
            photoURL: u.photoURL || '',
            totalWins: 0,
            chips: 1000,
            level: 1,
            xp: 0,
            ownedSkins: [],
            activeSkinId: null
          };
          try {
            await setDoc(userRef, newProfile);
          } catch (e) {
            handleFirestoreError(e, OperationType.CREATE, `users/${u.uid}`);
          }
          setProfile(newProfile);
        } else {
          setProfile(userSnap.data() as UserProfile);
        }
        setUser(u);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

    // Sync profile chips if they change (e.g. from winning)
    useEffect(() => {
      if (!user) return;
      const path = `users/${user.uid}`;
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
          setProfile(doc.data() as UserProfile);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return unsubscribe;
    }, [user]);

  useEffect(() => {
    if (!activeGameId) {
      setCurrentGame(null);
      return;
    }
    const path = `games/${activeGameId}`;
    const unsubscribe = onSnapshot(doc(db, 'games', activeGameId), (doc) => {
      if (doc.exists()) {
        setCurrentGame({ id: doc.id, ...doc.data() } as Game);
      } else {
        setActiveGameId(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [activeGameId]);

  const claimDailyReward = async () => {
    if (!user || !profile) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        chips: (profile.chips || 0) + 1000
      });
      alert("Daily reward claimed! +1000 Chips");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const startSearching = async (gameType: 'uno' | 'joker' = 'uno') => {
    if (!user || !profile) return;
    if (profile.chips <= 0) {
      alert("You need chips to play!");
      return;
    }
    setSearchGameType(gameType);
    setIsSearching(true);
    setTimeout(async () => {
      if (!user) return;
      
      const gamesRef = collection(db, 'games');
      const waitingQuery = query(gamesRef, where('status', '==', 'waiting'), where('gameType', '==', gameType), limit(10));
      let querySnap;
      try {
        querySnap = await getDocs(waitingQuery);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'games');
        setIsSearching(false);
        return;
      }
      
      const gameToJoin = querySnap.docs.find(d => !d.data().players.includes(user.uid));
      
      if (gameToJoin) {
        joinGame(gameToJoin.id);
      } else {
        createGame(`${user.displayName}'s Room`, '', gameType);
      }
    }, 3000);
  };

  const createGame = async (roomName: string, password?: string, gameType: 'uno' | 'joker' = 'uno') => {
    if (!user || !profile) return;
    if (profile.chips <= 0) {
      alert("You need chips to play!");
      return;
    }
    const isPrivate = !!password;
    const newGame: Partial<Game> = {
      status: 'waiting',
      roomName: roomName || `${user.displayName}'s Room`,
      password: password || '',
      isPrivate,
      gameType,
      players: [user.uid],
      playerNames: { [user.uid]: user.displayName || 'Player 1' },
      hostId: user.uid,
      createdAt: Date.now(),
      turn: user.uid,
      deck: [],
      hands: {},
      pile: [],
      scores: { [user.uid]: 0 },
      winner: null
    };
    try {
      const docRef = await addDoc(collection(db, 'games'), newGame);
      setActiveGameId(docRef.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'games');
    }
    setIsSearching(false);
  };

  const joinGame = async (gameId: string, inputPassword?: string) => {
    if (!user || !profile) return;
    if (profile.chips <= 0) {
      alert("You need chips to play!");
      return;
    }
    const gameRef = doc(db, 'games', gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) return;
    const gameData = gameSnap.data() as Game;
    
    if (gameData.status !== 'waiting') return;
    if (gameData.isPrivate && gameData.password !== inputPassword) {
      alert("Incorrect password!");
      return;
    }
    if (gameData.players.includes(user.uid)) {
      setActiveGameId(gameId);
      return;
    }

    const deck = shuffle(createDeck(gameData.gameType));
    const player1Id = gameData.players[0];
    const player2Id = user.uid;
    
    // Deal hands - 16 CARDS AS REQUESTED
    const hand1 = deck.splice(0, 16);
    const hand2 = deck.splice(0, 16);
    const firstPile = deck.splice(0, 1);

    try {
      await updateDoc(gameRef, {
        status: 'active',
        players: [player1Id, player2Id],
        playerNames: { ...gameData.playerNames, [player2Id]: user.displayName || 'Player 2' },
        deck: deck,
        hands: {
          [player1Id]: hand1,
          [player2Id]: hand2
        },
        pile: firstPile,
        scores: { [player1Id]: 0, [player2Id]: 0 },
        turn: Math.random() > 0.5 ? player1Id : player2Id
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `games/${gameId}`);
    }
    setActiveGameId(gameId);
    setIsSearching(false);
  };

  const handleLeaveGame = async () => {
    if (currentGame && currentGame.status === 'active' && user) {
      const opponentId = currentGame.players.find(p => p !== user.uid);
      if (opponentId) {
        try {
          await updateDoc(doc(db, 'games', currentGame.id), {
            status: 'finished',
            winner: opponentId,
            lastMoveAt: Date.now()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `games/${currentGame.id}`);
        }
      }
    }
    setActiveGameId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-cyan-500"
        >
          <Play size={64} fill="currentColor" />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onGoogleSignIn={signIn} onEmailSignIn={signInEmail} onEmailSignUp={signUpEmail} />;
  }

  if (isSearching) {
    return <SearchingView user={user} gameType={searchGameType} onCancel={() => setIsSearching(false)} />;
  }

  if (activeGameId && currentGame) {
    return <GameView user={user} game={currentGame} onLeave={handleLeaveGame} profile={profile} skinsMap={skinsMap} />;
  }

  if (activeTab === 'shop') {
    return <ShopView user={user} profile={profile!} onBack={() => setActiveTab('home')} setActiveTab={setActiveTab} />;
  }

  if (activeTab === 'leaderboard') {
    return <LeaderboardView profile={profile!} setActiveTab={setActiveTab} />;
  }

  if (activeTab === 'profile') {
    return <ProfileView user={user} profile={profile!} onBack={() => setActiveTab('home')} onLogout={signOut} setActiveTab={setActiveTab} />;
  }

  return <LobbyView user={user} profile={profile} onStartSearch={startSearching} onJoin={joinGame} onLogout={signOut} onCreate={createGame} setActiveTab={setActiveTab} onClaimDaily={claimDailyReward} />;
}

function AuthView({ onGoogleSignIn, onEmailSignIn, onEmailSignUp }: any) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (!displayName) throw new Error('Display name is required');
        await onEmailSignUp(email, password, displayName);
      } else {
        await onEmailSignIn(email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#c0bba9] p-4 font-vintage">
      <FallingCards />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/40 border-4 border-[#868378] p-8 rounded-[40px] shadow-2xl z-10 backdrop-blur-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-6xl font-display font-bold text-[#8b0000] tracking-tighter italic">UNO</h1>
          <p className="text-[#8b0000]/60 font-bold uppercase tracking-widest text-xs">Joker Edition</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#8b0000] uppercase ml-2">Display Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b0000]/40" size={18} />
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white/50 border-2 border-[#868378] rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#8b0000] transition-colors"
                  placeholder="LuckyPlayer77"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8b0000] uppercase ml-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b0000]/40" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border-2 border-[#868378] rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#8b0000] transition-colors"
                placeholder="player@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#8b0000] uppercase ml-2">Password</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b0000]/40" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 border-2 border-[#868378] rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#8b0000] transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-center text-xs font-bold uppercase">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#8b0000] text-white rounded-2xl font-bold hover:bg-[#a00000] transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            {loading ? <RefreshCcw className="animate-spin" /> : isSignUp ? 'CREATE ACCOUNT' : 'LOG IN'}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#868378]"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#c0bba9] px-2 text-[#8b0000]/60 font-bold">Or continue with</span></div>
          </div>

          <button 
            onClick={onGoogleSignIn}
            className="w-full py-3 border-2 border-[#868378] text-[#868378] rounded-2xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-black border border-black/10">G</div>
            GOOGLE
          </button>

          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center text-[#8b0000]/60 hover:text-[#8b0000] text-xs font-bold uppercase transition-colors"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function GameLogo({ size = 'large' }: { size?: 'small' | 'large' }) {
  if (size === 'small') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#8b0000] rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg rotate-12 border border-yellow-500/30">
          <Star size={16} fill="currentColor" />
        </div>
        <span className="text-white font-display font-black italic tracking-widest text-base sm:text-lg">PRO DUEL</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-4">
        <motion.div 
          animate={{ rotate: [12, -12, 12] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-[#8b0000] rounded-[24px] sm:rounded-[32px] border-4 border-yellow-500 shadow-[0_0_50px_rgba(139,0,0,0.4)] flex items-center justify-center text-white relative z-10"
        >
          <Crown size={40} className="sm:size-12" fill="currentColor" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full border-4 border-[#8b0000] flex items-center justify-center text-[#8b0000]">
            <X size={16} sm:size-20 className="font-black" />
          </div>
        </motion.div>
        <div className="absolute inset-0 bg-[#8b0000] blur-3xl opacity-20 scale-150" />
      </div>
      <h1 className="text-5xl sm:text-7xl font-display font-black text-[#8b0000] tracking-tighter italic leading-none drop-shadow-sm">JOKER DUEL</h1>
      <div className="mt-2 flex items-center gap-3">
        <Star size={12} className="text-yellow-600" fill="currentColor" />
        <span className="text-[10px] font-black text-[#8b0000]/60 uppercase tracking-[0.5em] sm:tracking-[0.8em]">PRO EDITION</span>
        <Star size={12} className="text-yellow-600" fill="currentColor" />
      </div>
    </div>
  );
}

function FallingCards() {
  const [cards, setCards] = useState<{ id: number; suit: string; left: number; delay: number; duration: number }[]>([]);
  
  useEffect(() => {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades', 'joker'];
    const newCards = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      suit: suits[Math.floor(Math.random() * suits.length)],
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 15 + Math.random() * 10
    }));
    setCards(newCards);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
      {cards.map(card => (
        <motion.div
          key={card.id}
          initial={{ y: -300, rotate: 0 }}
          animate={{ 
            y: 1200, 
            rotate: 720,
          }}
          transition={{ 
            duration: card.duration, 
            delay: card.delay, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute"
          style={{ left: `${card.left}%` }}
        >
          <div className={`w-16 h-24 sm:w-24 sm:h-36 bg-white border border-black/10 rounded-xl shadow-2xl flex flex-col justify-between p-2 font-display ${card.suit === 'hearts' || card.suit === 'diamonds' || card.suit === 'joker' ? 'text-red-600' : 'text-black'}`}>
             <div className="text-sm font-bold">{card.suit === 'joker' ? '★' : 'A'}</div>
             <div className="self-center text-4xl sm:text-6xl">
                {card.suit === 'hearts' && '♥'}
                {card.suit === 'diamonds' && '♦'}
                {card.suit === 'clubs' && '♣'}
                {card.suit === 'spades' && '♠'}
                {card.suit === 'joker' && '★'}
             </div>
             <div className="text-sm font-bold rotate-180">{card.suit === 'joker' ? '★' : 'A'}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function AdminView({ onBack }: { onBack: () => void }) {
  const [skinName, setSkinName] = useState('');
  const [skinPrice, setSkinPrice] = useState(1000);
  const [skinRarity, setSkinRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('common');
  const [skinImage, setSkinImage] = useState('');
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveAdminTab] = useState<'skins' | 'users'>('skins');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const q = query(collection(db, 'users'), limit(100));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile)));
    };
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const handleUpdateChips = async (userUid: string, currentChips: number) => {
    const amount = prompt("Enter new chip amount:", currentChips.toString());
    if (amount === null) return;
    try {
      await updateDoc(doc(db, 'users', userUid), { chips: parseInt(amount) });
      setUsers(users.map(u => u.uid === userUid ? { ...u, chips: parseInt(amount) } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userUid}`);
    }
  };

  const handleUpdateWins = async (userUid: string, currentWins: number) => {
    const amount = prompt("Enter total wins:", currentWins.toString());
    if (amount === null) return;
    try {
      await updateDoc(doc(db, 'users', userUid), { totalWins: parseInt(amount) });
      setUsers(users.map(u => u.uid === userUid ? { ...u, totalWins: parseInt(amount) } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userUid}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && (reader.result as string).length < 2000000) {
          setSkinImage(reader.result as string);
        } else {
          alert("Image too large! Try < 1MB");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkin = async () => {
    if (!skinName || !skinImage) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'cardSkins'), {
        name: skinName,
        price: skinPrice,
        rarity: skinRarity,
        imageUrl: skinImage
      });
      alert("Skin added!");
      setSkinName('');
      setSkinImage('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'cardSkins');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black text-white p-8 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24} /></button>
              <h1 className="text-2xl font-black italic tracking-widest">ADMIN PANEL</h1>
           </div>
           <div className="flex bg-white/10 rounded-xl p-1">
              <button 
                onClick={() => setActiveAdminTab('skins')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'skins' ? 'bg-white text-black' : 'text-white/40'}`}
              >
                Skins
              </button>
              <button 
                onClick={() => setActiveAdminTab('users')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-white/40'}`}
              >
                Users
              </button>
           </div>
        </div>

        {activeTab === 'skins' ? (
          <div className="space-y-6">
           <div>
              <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Skin Name</label>
              <input 
                type="text" 
                value={skinName}
                onChange={(e) => setSkinName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />
           </div>
           
           <div>
              <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Price (Chips)</label>
              <input 
                type="number" 
                value={skinPrice}
                onChange={(e) => setSkinPrice(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />
           </div>

           <div>
              <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Rarity</label>
              <select 
                value={skinRarity}
                onChange={(e) => setSkinRarity(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              >
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
           </div>

           <div>
              <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Skin Image (Back of card)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[2/3] bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors overflow-hidden"
              >
                 {skinImage ? (
                   <img src={skinImage} alt="Preview" className="w-full h-full object-cover" />
                 ) : (
                   <>
                     <Camera size={48} className="text-white/20 mb-2" />
                     <span className="text-[10px] font-black uppercase opacity-20">Tap to Upload</span>
                   </>
                 )}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
           </div>

           <button 
             onClick={handleAddSkin}
             disabled={saving}
             className="w-full py-4 bg-yellow-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] mb-12"
           >
              {saving ? 'ADDING...' : 'ADD SKIN'}
           </button>
         </div>
        ) : (
          <div className="space-y-4 pb-20">
             {users.map(u => (
               <div key={u.uid} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
                     <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                     <p className="font-black text-xs uppercase tracking-widest leading-none mb-1">{u.displayName}</p>
                     <p className="text-[10px] text-white/40 leading-none">{u.email}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleUpdateChips(u.uid, u.chips)} className="px-3 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[9px] font-black uppercase">
                        ${u.chips}
                     </button>
                     <button onClick={() => handleUpdateWins(u.uid, u.totalWins)} className="px-3 py-2 bg-white/10 text-white/60 border border-white/20 rounded-xl text-[9px] font-black uppercase">
                        {u.totalWins} W
                     </button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopView({ user, profile, onBack, setActiveTab }: { user: User, profile: UserProfile, onBack: () => void, setActiveTab?: (tab: any) => void }) {
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showPassInput, setShowPassInput] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cardSkins'), (snapshot) => {
      const skinsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardSkin));
      setSkins(skinsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cardSkins');
    });
    return unsubscribe;
  }, []);

  const handleBuy = async (skin: CardSkin) => {
    if (!user || !profile) return;
    if (profile.ownedSkins?.includes(skin.id)) {
      alert("Already owned!");
      return;
    }
    if (profile.chips < skin.price) {
      alert("Insufficient chips!");
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        chips: profile.chips - skin.price,
        ownedSkins: [...(profile.ownedSkins || []), skin.id]
      });
      alert(`Purchased ${skin.name}!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const checkAdmin = () => {
    if (adminPass === 'EMAD8912') {
      setShowAdmin(true);
      setShowPassInput(false);
    } else {
      alert("Incorrect password");
    }
  };

  if (showAdmin) return <AdminView onBack={() => setShowAdmin(false)} />;

  return (
    <div className="min-h-screen bg-lobby-vintage p-6 sm:p-8 font-vintage flex flex-col relative pb-32 overflow-y-auto">
      <FallingCards />
      <header className="flex justify-between items-center mb-12 z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/40 text-[#8b0000] hover:bg-white/60 transition-colors shadow-sm"><X size={24} /></button>
          <div className="relative">
             <h1 className="text-3xl font-display font-black text-[#8b0000] italic tracking-widest cursor-pointer group" onClick={() => setShowPassInput(!showPassInput)}>
               THE BOUTIQUE
               <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#8b0000] transition-all group-hover:w-full"></span>
             </h1>
             {showPassInput && (
               <div className="absolute top-10 left-0 bg-white p-4 rounded-xl shadow-2xl border border-black/5 z-50 flex gap-2">
                 <input 
                   type="password" 
                   value={adminPass}
                   onChange={(e) => setAdminPass(e.target.value)}
                   className="bg-black/5 px-3 py-2 rounded-lg outline-none"
                   placeholder="Admin Pass"
                 />
                 <button onClick={checkAdmin} className="bg-[#8b0000] text-white px-4 rounded-lg font-bold">GO</button>
               </div>
             )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-full text-yellow-700 font-bold shadow-sm">
           <Coins size={18} className="text-yellow-600" />
           <span className="text-lg leading-none">{profile.chips?.toLocaleString()}</span>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
           <RefreshCcw className="animate-spin text-[#8b0000]" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 z-10 w-full max-w-6xl mx-auto">
          {skins.map(skin => (
            <motion.div 
              key={skin.id} 
              whileHover={{ y: -10 }}
              className="bg-white/40 border-4 border-[#868378] p-6 rounded-[48px] flex flex-col items-center gap-4 shadow-xl hover:border-[#8b0000] transition-colors group relative overflow-hidden"
            >
               <div className="w-full aspect-[2/3] rounded-[32px] overflow-hidden border-2 border-black/5 shadow-inner">
                  <img src={skin.imageUrl} alt={skin.name} className="w-full h-full object-cover" />
               </div>
               <div className="text-center">
                  <h3 className="text-2xl font-display font-black text-[#8b0000] italic tracking-tight">{skin.name}</h3>
                  <div className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border mb-2 inline-block
                    ${skin.rarity === 'legendary' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-700' :
                      skin.rarity === 'epic' ? 'bg-purple-500/10 border-purple-500 text-purple-700' :
                      skin.rarity === 'rare' ? 'bg-blue-500/10 border-blue-500 text-blue-700' :
                      'bg-green-500/10 border-green-500 text-green-700'}
                  `}>
                    {skin.rarity}
                  </div>
               </div>
               
               <button 
                 onClick={() => handleBuy(skin)}
                 disabled={profile.ownedSkins?.includes(skin.id)}
                 className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-xs font-black uppercase tracking-widest
                    ${profile.ownedSkins?.includes(skin.id) 
                      ? 'bg-white/40 text-[#8b0000]/20 cursor-not-allowed border-2 border-[#868378]' 
                      : 'bg-[#8b0000] text-white hover:bg-[#a00000]'}
                 `}
               >
                  {profile.ownedSkins?.includes(skin.id) ? (
                    <><Check size={18} /> OWNED</>
                  ) : (
                    <><Coins size={18} /> {skin.price.toLocaleString()}</>
                  )}
               </button>
            </motion.div>
          ))}
          {skins.length === 0 && (
             <div className="col-span-full py-20 text-center opacity-30 font-display font-black italic tracking-widest text-[#8b0000] text-2xl">
                NO COLLECTIONS AVAILABLE YET
             </div>
          )}
        </div>
      )}

      {setActiveTab && <TapBar activeTab="shop" setActiveTab={setActiveTab} />}
    </div>
  )
}

function CardBack({ skinUrl, className = "", style = {} }: { skinUrl?: string, className?: string, style?: any, key?: any }) {
  if (skinUrl) {
    return (
      <div className={`relative overflow-hidden rounded-xl border-2 border-white/20 shadow-2xl ${className}`} style={style}>
        <img src={skinUrl} alt="Card Back" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
      </div>
    );
  }
  return (
    <div className={`bg-gradient-to-br from-[#d40000] to-[#8b0000] border-2 border-white/20 rounded-xl shadow-2xl flex items-center justify-center overflow-hidden ${className}`} style={style}>
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)]" />
      <div className="text-[8px] font-black italic rotate-45 opacity-20 text-white">JOKER DUEL</div>
    </div>
  );
}

function ProfileView({ user, profile, onBack, onLogout, setActiveTab }: { user: User, profile: UserProfile, onBack: () => void, onLogout: () => void, setActiveTab: (tab: any) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile.displayName);
  const [newPhoto, setNewPhoto] = useState(profile.photoURL);
  const [saving, setSaving] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSkins = async () => {
      const q = query(collection(db, 'cardSkins'));
      const snap = await getDocs(q);
      setSkins(snap.docs.map(d => ({ id: d.id, ...d.data() } as CardSkin)));
    };
    fetchSkins();
  }, []);

  const PRESET_AVATARS = [
    'Felix', 'Aneka', 'Jasper', 'Tigger', 'Bella', 'Snuggles', 'Midnight', 'Shadow', 'Ace', 'Lucky'
  ].map(seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: newName,
        photoURL: newPhoto
      });
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSkin = async (skinId: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        activeSkinId: skinId === profile.activeSkinId ? null : skinId
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && (reader.result as string).length < 800000) {
          setNewPhoto(reader.result as string);
        } else {
          alert("Image too large! Please choose a smaller file (< 500kb)");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const ownedSkinsData = skins.filter(s => profile.ownedSkins?.includes(s.id));

  return (
    <div className="min-h-screen bg-lobby-vintage p-6 sm:p-8 font-vintage flex flex-col items-center pb-32 overflow-y-auto">
      <FallingCards />
      <header className="w-full max-w-lg flex justify-between items-center mb-12 z-20">
        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/40 text-[#8b0000] hover:bg-white/60 transition-colors shadow-sm"><X size={24} /></button>
        <h1 className="text-2xl font-display font-black text-[#8b0000] italic tracking-widest">PLAYER DOSSIER</h1>
        <button onClick={onLogout} className="w-12 h-12 flex items-center justify-center rounded-full bg-[#8b0000] text-white hover:bg-red-800 transition-colors shadow-lg">
          <LogOut size={20} />
        </button>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/40 border-4 border-[#868378] p-10 rounded-[56px] shadow-2xl flex flex-col items-center space-y-8 z-10"
      >
        <div className="relative">
          <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-2xl relative">
            <img 
              src={newPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt={profile.displayName} 
              className="w-full h-full object-cover grayscale brightness-110" 
            />
            <div className="absolute inset-0 border-4 border-[#8b0000]/10 rounded-full" />
          </div>
          {isEditing && (
            <div className="absolute -bottom-2 -right-2 flex flex-col gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 bg-[#8b0000] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-white"
              >
                <Camera size={18} />
              </button>
              <button 
                onClick={() => setShowAvatars(!showAvatars)}
                className="w-10 h-10 bg-yellow-500 text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-white"
              >
                <ImageIcon size={18} />
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        <AnimatePresence>
          {isEditing && showAvatars && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full grid grid-cols-5 gap-2 overflow-hidden pb-4"
            >
              {PRESET_AVATARS.map((url, i) => (
                <button 
                  key={i}
                  onClick={() => setNewPhoto(url)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${newPhoto === url ? 'border-[#8b0000] scale-110 shadow-lg' : 'border-black/5 opacity-60 hover:opacity-100'}`}
                >
                  <img src={url} alt="Avatar" className="w-full h-full object-cover grayscale" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="w-full text-center">
          {isEditing ? (
            <div className="space-y-4">
              <input 
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white/50 border-2 border-[#868378] rounded-xl px-4 py-3 text-center text-2xl font-display font-black text-[#8b0000] italic outline-none focus:border-[#8b0000] transition-colors"
                placeholder="Name"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-white/60 text-[#8b0000] font-bold rounded-xl hover:bg-white/80 transition-all border border-[#868378]/20"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 bg-[#8b0000] text-white font-bold rounded-xl hover:bg-[#a00000] transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <RefreshCcw className="animate-spin" size={18} /> : <><Save size={18} /> SAVE</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4">
                <h2 className="text-5xl font-display font-black text-[#8b0000] tracking-tighter italic leading-none">{profile.displayName}</h2>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-[#8b0000]/40 hover:text-[#8b0000] transition-colors"
                >
                  <Edit size={24} />
                </button>
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                 <span className="w-8 h-[2px] bg-[#8b0000]/20" />
                 <p className="text-[#8b0000]/60 font-bold uppercase tracking-[0.3em] text-[10px]">Rank: Professional Gambler</p>
                 <span className="w-8 h-[2px] bg-[#8b0000]/20" />
              </div>
            </>
          )}
        </div>

        <div className="w-full space-y-6">
           <div className="bg-[#8b0000]/5 border-2 border-[#868378]/30 p-6 rounded-[32px] flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-[#8b0000]/40 uppercase tracking-widest">Total Wealth</p>
                 <h4 className="text-2xl font-display font-black text-[#8b0000] italic leading-none">{profile.chips?.toLocaleString()} CHIPS</h4>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-[#8b0000] shadow-lg">
                 <Coins size={24} />
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-center text-[10px] font-black text-[#8b0000]/40 uppercase tracking-[0.5em]">MY SKINS</h3>
              {ownedSkinsData.length === 0 ? (
                <div className="py-8 text-center bg-white/20 rounded-[32px] border-2 border-dashed border-[#868378]/20">
                   <p className="text-[10px] font-black text-[#8b0000]/30 uppercase tracking-widest">Visit the shop to unlock skins</p>
                   <button onClick={() => setActiveTab('shop')} className="mt-4 text-[#8b0000] font-black text-[10px] uppercase tracking-widest border-b border-[#8b0000]">Go to Boutique</button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                   {ownedSkinsData.map(skin => (
                     <button 
                       key={skin.id}
                       onClick={() => handleSelectSkin(skin.id)}
                       className={`relative aspect-[2/3] rounded-xl overflow-hidden border-4 transition-all shadow-md group
                         ${profile.activeSkinId === skin.id ? 'border-[#8b0000] scale-110 z-10 shadow-xl' : 'border-black/5 opacity-60 hover:opacity-100 hover:scale-105'}
                       `}
                     >
                        <img src={skin.imageUrl} alt={skin.name} className="w-full h-full object-cover" />
                        {profile.activeSkinId === skin.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-[#8b0000] text-white rounded-full flex items-center justify-center shadow-lg">
                             <Check size={12} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <span className="text-[8px] font-black text-white px-2 py-1 bg-black/60 rounded-full uppercase">USE</span>
                        </div>
                     </button>
                   ))}
                </div>
              )}
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#8b0000] p-5 rounded-[32px] shadow-lg flex flex-col items-center">
                 <Trophy size={28} className="text-white mb-2" />
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Wins</span>
                 <p className="text-2xl font-display font-black text-white italic">{profile.totalWins}</p>
              </div>
              <div className="bg-white/60 p-5 rounded-[32px] border-2 border-[#868378]/30 flex flex-col items-center">
                 <Star size={28} className="text-[#8b0000] mb-2" />
                 <span className="text-[10px] font-black text-[#8b0000]/40 uppercase tracking-widest">Level</span>
                 <p className="text-2xl font-display font-black text-[#8b0000] italic">{profile.level}</p>
              </div>
           </div>
        </div>
      </motion.div>

      <TapBar activeTab="profile" setActiveTab={setActiveTab} />
    </div>
  );
}

function LeaderboardView({ profile, setActiveTab }: { profile: UserProfile, setActiveTab: (tab: any) => void }) {
  const [topPlayers, setTopPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('chips', 'desc'), limit(25));
        const snap = await getDocs(q);
        setTopPlayers(snap.docs.map(d => d.data() as UserProfile));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-lobby-vintage p-6 sm:p-8 font-vintage flex flex-col items-center pb-32 overflow-y-auto">
      <FallingCards />
      <header className="w-full max-w-lg mb-12 text-center z-10">
        <h1 className="text-5xl font-display font-black text-[#8b0000] tracking-tighter italic leading-none drop-shadow-sm">ELITE LIST</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Star size={12} className="text-yellow-600" fill="currentColor" />
          <span className="text-[10px] font-black text-[#8b0000]/60 uppercase tracking-[0.6em]">TOP PLAYERS</span>
          <Star size={12} className="text-yellow-600" fill="currentColor" />
        </div>
      </header>

      <div className="w-full max-w-lg z-10 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center">
            <RefreshCcw className="animate-spin text-[#8b0000]/30" size={32} />
          </div>
        ) : (
          topPlayers.map((player, i) => (
            <motion.div 
              key={player.uid || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-[32px] border-2 transition-all
                ${i === 0 ? 'bg-yellow-500/10 border-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.15)] scale-105' : 'bg-white/40 border-[#868378]/20'}
              `}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-black italic text-xl
                ${i === 0 ? 'bg-yellow-500 text-[#8b0000]' : i === 1 ? 'bg-[#c0bba9] text-[#8b0000]' : i === 2 ? 'bg-[#8b4513] text-white' : 'text-[#8b0000]/40'}
              `}>
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                 <img src={player.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.displayName}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-display font-black text-[#8b0000] italic leading-tight text-lg">{player.displayName}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-[9px] font-black text-[#8b0000]/50 uppercase tracking-widest">{player.totalWins} Victories</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-yellow-600 font-display font-black italic text-lg">
                   <Coins size={16} />
                   <span>{player.chips.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <TapBar activeTab="leaderboard" setActiveTab={setActiveTab} />
    </div>
  );
}

function TapBar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: any) => void }) {
  const tabs = [
    { id: 'home', icon: <Play size={20} />, label: 'Lobby' },
    { id: 'shop', icon: <ShoppingBag size={20} />, label: 'Bazaar' },
    { id: 'leaderboard', icon: <Trophy size={20} />, label: 'Rank' },
    { id: 'profile', icon: <UserIcon size={20} />, label: 'Vault' },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-[#c0bba9]/90 backdrop-blur-xl border-4 border-[#868378] rounded-[32px] p-2 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex flex-col items-center gap-1.5 py-3 px-6 rounded-[24px] transition-all duration-300
              ${activeTab === tab.id ? 'bg-[#8b0000] text-white shadow-lg' : 'text-[#8b0000]/60 hover:bg-black/5'}
            `}
          >
            <motion.div
              animate={{ scale: activeTab === tab.id ? 1.1 : 1 }}
            >
              {React.cloneElement(tab.icon as React.ReactElement, { fill: activeTab === tab.id ? 'currentColor' : 'none' })}
            </motion.div>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchingView({ user, gameType, onCancel }: { user: User, gameType: string, onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-lobby-vintage flex flex-col items-center justify-between py-16 px-8 font-vintage overflow-hidden">
      <FallingCards />
      <div className="text-center z-20">
        <div className="mb-4 inline-block px-4 py-1 bg-[#8b0000]/10 border border-[#8b0000]/20 rounded-full text-[10px] font-black text-[#8b0000] uppercase tracking-[0.3em] italic">
          Grand Arena Duel
        </div>
        <h1 className="text-5xl font-display font-black text-[#8b0000] mb-8 italic tracking-tighter uppercase leading-none">{gameType} MODE</h1>
        <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white mx-auto shadow-2xl mb-6 relative">
          <img src={user.photoURL || undefined} alt="me" className="w-full h-full object-cover grayscale brightness-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#8b0000]/20 to-transparent" />
        </div>
        <h2 className="text-3xl font-display font-black text-[#8b0000] tracking-tighter italic">{user.displayName}</h2>
      </div>

      <div className="space-y-12 flex flex-col items-center z-10">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-56 h-56 rounded-full border-4 border-dashed border-[#8b0000]/20 flex items-center justify-center"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-display font-black text-[#8b0000] italic leading-none">{formatTime(seconds)}</div>
            <div className="text-[#8b0000]/40 text-[9px] font-black uppercase tracking-[0.2em] mt-2">Looking for rival...</div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/20 p-4 rounded-[32px] border border-[#8b0000]/10 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#8b0000] flex items-center justify-center shadow-lg">
             <Users size={24} className="text-white" />
          </div>
          <div className="text-lg text-[#8b0000] font-display font-black italic leading-none uppercase tracking-tighter">
            Shuffling the <br /> {gameType} Deck...
          </div>
        </div>
      </div>

      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCancel}
        className="w-full max-w-sm py-5 bg-[#8b0000] text-white text-xs font-black rounded-[24px] shadow-2xl hover:bg-[#a00000] z-20 uppercase tracking-[0.3em] flex items-center justify-center gap-3"
      >
        <X size={18} /> ABANDON DUEL
      </motion.button>
    </div>
  );
}

function LobbyView({ user, profile, onStartSearch, onJoin, onLogout, onCreate, setActiveTab, onClaimDaily }: any) {
  const [games, setGames] = useState<Game[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGameForJoin, setSelectedGameForJoin] = useState<Game | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedType, setSelectedType] = useState<'uno' | 'joker'>('uno');

  useEffect(() => {
    const q = query(collection(db, 'games'), where('status', '==', 'waiting'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Game)).filter(game => !game.players.includes(user.uid));
      setGames(g);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'games');
    });
    return unsubscribe;
  }, [user.uid]);

  const handleJoinClick = (game: Game) => {
    if (game.isPrivate) {
      setSelectedGameForJoin(game);
      setJoinPassword('');
    } else {
      onJoin(game.id);
    }
  };

  const submitJoinPassword = () => {
    if (selectedGameForJoin) {
      onJoin(selectedGameForJoin.id, joinPassword);
      setSelectedGameForJoin(null);
    }
  };

  return (
    <div className="min-h-screen bg-lobby-vintage p-4 sm:p-8 font-vintage flex flex-col relative overflow-hidden pb-32">
      <FallingCards />
      <header className="flex justify-between items-center mb-12 z-20">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab('profile')}
            className="group cursor-pointer flex items-center gap-4 bg-white/40 border-2 border-[#868378] py-2 px-4 rounded-[32px] hover:border-[#8b0000] transition-all"
          >
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#8b0000] shadow-sm">
              <img src={user.photoURL || undefined} alt="me" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#8b0000] uppercase tracking-tighter leading-none">{profile?.displayName?.split(' ')[0]}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-[#8b0000]/60 uppercase">Lev. {profile?.level || 1}</span>
                <div className="w-12 h-1 bg-black/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8b0000]" 
                    style={{ width: `${((profile?.xp || 0) / ((profile?.level || 1) * 500)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-full text-yellow-700 font-bold shadow-sm">
             <Coins size={18} className="text-yellow-600" />
             <span className="text-lg leading-none">{profile?.chips?.toLocaleString() || 0}</span>
          </div>
        </div>
      </header>

        <div className="flex-1 flex flex-col items-center justify-center gap-12 relative text-center">
          <GameLogo />

          {profile.chips <= 0 && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClaimDaily}
              className="bg-yellow-500 text-black px-10 py-5 rounded-[24px] font-bold flex items-center gap-3 animate-bounce shadow-2xl z-50 hover:bg-yellow-400 transition-colors"
            >
              <Coins size={24} /> CLAIM 1,000 CHIPS
            </motion.button>
          )}

          <div className="flex flex-col lg:flex-row gap-10 items-center z-10 w-full max-w-5xl px-4">
            {/* Uno Selection */}
            <div className="flex-1 w-full text-center group cursor-pointer" onClick={() => onStartSearch('uno')}>
              <motion.div 
                whileHover={{ y: -10, scale: 1.02 }}
                className="w-full h-64 bg-gradient-to-br from-white/60 to-white/20 border-4 border-[#868378] rounded-[48px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-[#8b0000] transition-colors"
              >
                <div className="absolute inset-0 bg-[#8b0000]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-7xl sm:text-8xl font-display font-black text-[#8b0000] italic pointer-events-none tracking-tighter">UNO</div>
                <div className="text-[#8b0000]/60 font-bold uppercase tracking-[0.3em] text-xs mt-4">Ranked 1V1 Arena</div>
                <div className="mt-4 flex gap-1">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-2 h-2 rounded-full bg-[#8b0000]/20" />)}
                </div>
                <div className="absolute top-4 right-4 p-3 bg-[#8b0000] text-white rounded-full shadow-lg transform translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                  <Play size={24} fill="currentColor" />
                </div>
              </motion.div>
              <p className="mt-6 text-[#8b0000] font-bold uppercase tracking-[0.2em] text-sm opacity-60 group-hover:opacity-100 transition-opacity">Enter Tournament</p>
            </div>

            {/* Joker Selection */}
            <div className="flex-1 w-full text-center group cursor-pointer" onClick={() => onStartSearch('joker')}>
              <motion.div 
                whileHover={{ y: -10, scale: 1.02 }}
                className="w-full h-64 bg-gradient-to-br from-white/60 to-white/20 border-4 border-yellow-500/50 rounded-[48px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group-hover:border-yellow-500 transition-colors"
              >
                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-8xl text-yellow-600 pointer-events-none drop-shadow-md">★</div>
                <div className="text-yellow-600 font-display italic text-4xl uppercase tracking-tighter mt-2">JOKER</div>
                <div className="text-yellow-600/60 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Classic High Stakes</div>
                <div className="absolute top-4 right-4 p-3 bg-yellow-500 text-black rounded-full shadow-lg transform translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
                  <Play size={24} fill="currentColor" />
                </div>
              </motion.div>
              <p className="mt-6 text-yellow-600 font-bold uppercase tracking-[0.2em] text-sm opacity-60 group-hover:opacity-100 transition-opacity">Place Your Bets</p>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-3 px-10 py-5 border-4 border-[#8b0000]/20 text-[#8b0000] rounded-[24px] font-bold hover:bg-[#8b0000]/5 transition-all uppercase tracking-widest text-xs z-10"
          >
            <Plus size={20} /> Host A Private Table
          </motion.button>

        <div className="w-full max-w-xl space-y-6 z-10">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-[#8b0000] uppercase tracking-[0.2em] flex items-center gap-2">
               Active Tables
            </h2>
            <div className="text-[10px] font-bold text-[#8b0000]/40 uppercase tracking-widest">
              {games.length} tables found
            </div>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[35vh] pr-2 custom-scrollbar">
             {games.length === 0 ? (
               <div className="bg-white/20 p-10 rounded-[32px] border-2 border-dashed border-[#868378]/40 text-center">
                  <div className="w-16 h-16 bg-[#868378]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-[#868378]/40" />
                  </div>
                  <p className="text-[#8b0000]/40 font-bold uppercase tracking-widest text-[10px]">No active games tonight</p>
               </div>
             ) : (
               games.map(g => (
                 <motion.div 
                    key={g.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="group flex justify-between items-center bg-white/60 p-6 rounded-[32px] border-2 border-[#868378]/20 backdrop-blur-md hover:border-[#8b0000] hover:bg-white/80 transition-all shadow-sm"
                 >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${g.gameType === 'uno' ? 'bg-[#8b0000]/10 text-[#8b0000]' : 'bg-yellow-500/10 text-yellow-600'}`}>
                        {g.gameType === 'uno' ? <div className="text-xl font-display font-black italic">U</div> : <div className="text-xl">★</div>}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#8b0000] text-lg tracking-tight uppercase">{g.roomName}</span>
                          {g.isPrivate && <Lock size={14} className="text-[#8b0000]/40" />}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-[#8b0000]/50 mt-1 uppercase tracking-widest">
                          <span>{g.gameType}</span>
                          <span className="w-1 h-1 rounded-full bg-black/10" />
                          <span>HOST: {g.playerNames[g.players[0]]?.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleJoinClick(g)}
                      className="px-8 py-3 bg-[#8b0000] text-white rounded-2xl font-bold hover:bg-[#a00000] text-xs uppercase tracking-widest shadow-lg group-hover:scale-105 transition-all active:scale-95"
                    >
                      SIT DOWN
                    </button>
                 </motion.div>
               ))
             )}
          </div>
        </div>
      </div>

      <TapBar activeTab="home" setActiveTab={setActiveTab} />

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-[#c0bba9] border-4 border-[#868378] p-10 rounded-[56px] shadow-2xl space-y-10"
            >
              <div className="text-center">
                <h2 className="text-4xl font-display font-bold text-[#8b0000] tracking-widest italic">OPEN A TABLE</h2>
                <div className="w-12 h-1 bg-[#8b0000]/20 mx-auto mt-4 rounded-full" />
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-[#8b0000]/40 uppercase ml-2 mb-3 block tracking-widest">Game Variant</label>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedType('uno')}
                      className={`flex-1 py-5 rounded-[24px] font-display font-black italic transition-all border-4 ${selectedType === 'uno' ? 'bg-[#8b0000] text-white border-[#8b0000]' : 'bg-white/40 text-[#8b0000] border-transparent hover:bg-white/60'}`}
                    >
                      UNO
                    </button>
                    <button 
                      onClick={() => setSelectedType('joker')}
                      className={`flex-1 py-5 rounded-[24px] font-display font-black italic transition-all border-4 ${selectedType === 'joker' ? 'bg-yellow-500 text-black border-yellow-500 shadow-xl' : 'bg-white/40 text-[#8b0000] border-transparent hover:bg-white/60'}`}
                    >
                      JOKER
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative group">
                    <label className="text-[10px] font-black text-[#8b0000]/40 uppercase ml-2 block tracking-widest mb-2">Room Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Royal Flush"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-white/60 border-2 border-[#868378]/30 rounded-[20px] px-6 py-4 outline-none focus:border-[#8b0000] focus:bg-white transition-all font-sans text-sm font-bold uppercase tracking-tighter"
                    />
                  </div>
                  <div className="relative group">
                    <label className="text-[10px] font-black text-[#8b0000]/40 uppercase ml-2 block tracking-widest mb-2">Secret Entry Code</label>
                    <div className="relative">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-[#8b0000]/30" size={20} />
                      <input 
                        type="password" 
                        placeholder="••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/60 border-2 border-[#868378]/30 rounded-[20px] pl-14 pr-6 py-4 outline-none focus:border-[#8b0000] focus:bg-white transition-all font-sans text-sm font-bold tracking-[0.5em]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-5 border-2 border-[#8b0000]/30 text-[#8b0000]/60 font-bold rounded-[24px] hover:text-[#8b0000] hover:bg-[#8b0000]/5 transition-all font-sans uppercase tracking-[0.2em] text-[10px]"
                >
                  RETIRE
                </button>
                <button 
                  onClick={() => {
                    onCreate(roomName, password, selectedType);
                    setShowCreateModal(false);
                  }}
                  className="flex-1 py-5 bg-[#8b0000] text-white font-bold rounded-[24px] hover:bg-[#a00000] shadow-2xl shadow-[#8b0000]/30 font-sans uppercase tracking-[0.2em] text-[10px]"
                >
                  DEAL ME IN
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Password Modal */}
      <AnimatePresence>
        {selectedGameForJoin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-sm w-full bg-[#c0bba9] border-4 border-[#868378] p-10 rounded-[48px] shadow-2xl space-y-8"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-[#8b0000]/10 rounded-full flex items-center justify-center mx-auto">
                  <Lock size={32} className="text-[#8b0000]" />
                </div>
                <h2 className="text-2xl font-display font-bold text-[#8b0000] tracking-widest italic leading-none">KEY REQUIRED</h2>
                <p className="text-[10px] text-[#8b0000]/60 font-bold uppercase tracking-widest">THIS TABLE IS RESTRICTED</p>
              </div>
              
              <input 
                type="password" 
                placeholder="••••"
                autoFocus
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitJoinPassword()}
                className="w-full bg-white border-2 border-[#868378] rounded-[20px] px-4 py-5 outline-none focus:border-[#8b0000] transition-all font-sans text-center text-3xl tracking-[0.5em] font-black"
              />

              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedGameForJoin(null)}
                  className="flex-1 py-4 border-2 border-[#8b0000]/20 text-[#8b0000]/60 font-bold rounded-[20px] hover:text-[#8b0000] transition-all uppercase tracking-widest text-[10px]"
                >
                  LEAVE
                </button>
                <button 
                  onClick={submitJoinPassword}
                  className="flex-1 py-4 bg-[#8b0000] text-white font-bold rounded-[20px] hover:bg-[#a00000] shadow-xl transition-all uppercase tracking-widest text-[10px]"
                >
                  UNLOCK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GameView({ user, game, onLeave, profile, skinsMap }: { user: User, game: Game, onLeave: () => void, profile: UserProfile | null, skinsMap: Record<string, CardSkin> }) {
  const [showMore, setShowMore] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<UserProfile | null>(null);
  const isMyTurn = game.turn === user.uid;
  const opponentId = game.players.find(p => p !== user.uid);
  const myHand = game.hands[user.uid] || [];
  const opponentHandCount = game.hands[opponentId || '']?.length || 0;
  const topCard = game.pile[game.pile.length - 1];

  useEffect(() => {
    if (opponentId) {
      const fetchOpponent = async () => {
        const snap = await getDoc(doc(db, 'users', opponentId));
        if (snap.exists()) {
          setOpponentProfile(snap.data() as UserProfile);
        }
      };
      fetchOpponent();
    }
  }, [opponentId]);

  const mySkin = profile?.activeSkinId ? skinsMap[profile.activeSkinId]?.imageUrl : undefined;
  const opponentSkin = opponentProfile?.activeSkinId ? skinsMap[opponentProfile.activeSkinId]?.imageUrl : undefined;

  useEffect(() => {
    if (game.status === 'finished' && !rewardClaimed) {
      const updateResult = async () => {
        setRewardClaimed(true);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const currentData = userSnap.data() as UserProfile;
          const isWinner = game.winner === user.uid;
          
          let newChips = (currentData.chips || 0) + (isWinner ? 500 : -200);
          if (newChips < 0) newChips = 0;

          let newXp = (currentData.xp || 0) + (isWinner ? 100 : 20);
          let newLevel = currentData.level || 1;
          const xpNeeded = newLevel * 500;
          if (newXp >= xpNeeded) {
            newLevel += 1;
            newXp -= xpNeeded;
          }

          try {
            await updateDoc(userRef, { 
              totalWins: isWinner ? (currentData.totalWins || 0) + 1 : (currentData.totalWins || 0),
              chips: newChips,
              xp: newXp,
              level: newLevel
            });
          } catch (e) {
            handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
          }
        }
      };
      updateResult();
    }
  }, [game.status, game.winner, user.uid, rewardClaimed]);

  const playCard = async (cardIndex: number) => {
    if (!isMyTurn || game.status !== 'active') return;
    
    const card = myHand[cardIndex];
    if (!canPlay(card, topCard)) return;

    const newHand = [...myHand];
    newHand.splice(cardIndex, 1);
    const newPile = [...game.pile, card];
    
    let nextTurn = opponentId!;
    let status: GameStatus = 'active';
    let winner = null;

    if (newHand.length === 0) {
      status = 'finished';
      winner = user.uid;
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    try {
      await updateDoc(doc(db, 'games', game.id), {
        hands: { ...game.hands, [user.uid]: newHand },
        pile: newPile,
        turn: nextTurn,
        status,
        winner,
        lastMoveAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `games/${game.id}`);
    }
  };

  const drawCard = async () => {
    if (!isMyTurn || game.status !== 'active') return;
    if (game.deck.length === 0) return;

    const newDeck = [...game.deck];
    const drawn = newDeck.pop()!;
    const newHand = [...myHand, drawn];

    try {
      await updateDoc(doc(db, 'games', game.id), {
        deck: newDeck,
        hands: { ...game.hands, [user.uid]: newHand },
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `games/${game.id}`);
    }
  };

  const skipTurn = async () => {
    if (!isMyTurn || game.status !== 'active') return;
    try {
      await updateDoc(doc(db, 'games', game.id), {
        turn: opponentId!
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `games/${game.id}`);
    }
  };

  const endGame = async () => {
    if (window.confirm("End this game and delete the room?")) {
      try {
        await deleteDoc(doc(db, 'games', game.id));
        onLeave();
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `games/${game.id}`);
      }
    }
  };

  const canPlay = (card: Card, top: Card) => {
    if (!top) return true;
    if (game.gameType === 'uno') {
      if (card.suit === 'special') return true;
      if (top.suit === 'special') return true;
      return card.suit === top.suit || card.rank === top.rank;
    } else {
      if (card.suit === 'joker') return true;
      if (top.suit === 'joker') return true;
      return card.suit === top.suit || card.rank === top.rank;
    }
  };

  const onDragEnd = async (event: any, info: any, index: number) => {
    // Relative threshold based on window height
    const threshold = window.innerHeight * 0.15;
    if (info.offset.y < -threshold) {
      playCard(index);
    }
  };

  const getHandLayout = (index: number, total: number) => {
    const isSmallHeight = window.innerHeight < 500;
    // Wider fan for more cards
    const angleRange = Math.min(total * 8, 90); 
    const angleStep = angleRange / Math.max(total - 1, 1);
    const angle = (index - (total - 1) / 2) * angleStep;
    
    // Calculate 3D-like curve
    const radius = 600; // Large radius for subtle curve
    const rad = angle * (Math.PI / 180);
    const x = Math.sin(rad) * radius * 0.8; // Compressed horizontally
    const y = (1 - Math.cos(rad)) * radius * 0.4; // Subtle vertical arc
    
    return { x, y, rotate: angle };
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden flex flex-col font-sans select-none touch-none">
      {/* Top Navigation Bar - Similar to screenshot */}
      <div className="absolute top-0 w-full h-14 bg-black/60 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-[110]">
        <div className="flex items-center gap-4">
           <button className="text-white/60 hover:text-white transition-colors relative">
             <Menu size={24} />
             <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] font-black flex items-center justify-center border border-black">1</div>
           </button>
           <button className="text-white/60 hover:text-white transition-colors">
             <RefreshCcw size={20} />
           </button>
           <button className="text-white/60 hover:text-white transition-colors">
             <ShoppingBag size={20} />
           </button>
        </div>
        <GameLogo size="small" />
        <div className="flex items-center gap-4">
           <button className="text-white/60 hover:text-white transition-colors">
             <UserIcon size={24} />
           </button>
           <button onClick={() => setShowMore(!showMore)} className="text-white/60 hover:text-white transition-colors">
             <Settings size={24} />
           </button>
        </div>
      </div>

      {/* Main Game Surface with Screenshot-like frame */}
      <div className="absolute inset-0 pt-14 pb-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#2a2a2a] to-[#0a0a0a]">
        <div className="relative w-full max-w-[500px] aspect-[2/3] max-h-[82vh] bg-[#1a7b3e] rounded-[48px] border-[14px] border-[#222] shadow-[0_0_100px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Subtle gradient overlay for the field */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-black/20" />
          
          {/* Status Label (Round Info) */}
          <div className="absolute top-6 left-6 z-50">
             <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                 <span className="text-white font-black italic text-[10px] sm:text-xs uppercase tracking-wider">Round: 1/5</span>
             </div>
          </div>

          {/* Opponent Avatar (Screenshot Style) */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
             <div className="relative">
                {/* Decorative Golden Ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full animate-pulse blur-[1px]" />
                <div className="relative w-20 h-20 rounded-full border-[2px] border-black bg-neutral-800 overflow-hidden shadow-2xl">
                   <img 
                      src={opponentProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentId}`} 
                      alt="Opponent" 
                      className="w-full h-full object-cover" 
                   />
                </div>
                {!isMyTurn && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 right-2 w-5 h-5 bg-yellow-500 rounded-full border-2 border-black flex items-center justify-center"
                  >
                     <div className="w-2 h-2 bg-black rounded-full" />
                  </motion.div>
                )}
             </div>
             <div className="px-6 py-1 bg-black rounded-full border border-yellow-500/30 shadow-xl min-w-[100px] text-center flex items-center justify-center gap-2">
                <Crown size={12} className="text-yellow-500" />
                <span className="text-white font-black text-[10px] sm:text-xs uppercase tracking-widest truncate block">
                  {game.playerNames[opponentId || ''] || 'RIVAL'}
                </span>
             </div>
          </div>

          {/* Table Center with Pile and Deck */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-12">
             {/* Opponent cards fanned at top */}
             <div className="absolute top-24 flex justify-center scale-[0.65] origin-top">
                {Array.from({ length: Math.min(opponentHandCount, 15) }).map((_, i) => (
                   <CardBack 
                     key={i} 
                     skinUrl={opponentSkin}
                     className="w-20 h-28 -mx-10 relative"
                     style={{ 
                       transform: `rotate(${180 + (i - (Math.min(opponentHandCount,15)-1)/2) * 4}deg) translateY(-30px)`,
                       zIndex: i,
                       transformOrigin: 'bottom'
                     }}
                   />
                ))}
             </div>

             {/* Center Play Area */}
             <div className="flex items-center gap-10 pointer-events-auto transform translate-y-12">
               {/* Deck */}
               <motion.div 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="relative w-24 h-34 cursor-pointer" 
                 onClick={drawCard}
               >
                  <div className="absolute inset-0 translate-x-1 translate-y-1 bg-black/40 rounded-xl" />
                  <CardBack skinUrl={mySkin} className="absolute inset-0" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="text-white/20 text-4xl mb-2">🎴</div>
                    <div className="text-white font-black text-[10px] bg-black/50 px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest backdrop-blur-sm">
                      {game.deck.length}
                    </div>
                  </div>
               </motion.div>

               {/* Center Pile */}
               <div className="relative w-28 h-38 flex items-center justify-center">
                 <div className="absolute inset-x-[-10px] inset-y-[-10px] bg-black/20 rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center">
                    <span className="text-white/5 font-black italic text-[10px] tracking-[0.5em] rotate-45 select-none">DUEL AREA</span>
                 </div>
                 <AnimatePresence>
                   {game.pile.map((card, i) => (
                     <CardComponent 
                        key={card.id + i} 
                        card={card} 
                        index={i} 
                        isPile 
                     />
                   ))}
                 </AnimatePresence>
               </div>
             </div>
          </div>

          {/* Match Status / Waiting Overlay */}
          {game.status === 'waiting' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px]">
               <motion.div 
                 animate={{ scale: [1, 1.05, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="flex flex-col items-center gap-6"
               >
                  <div className="relative w-20 h-20">
                     <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full" />
                     <div className="absolute inset-0 border-4 border-t-yellow-500 rounded-full animate-spin" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-yellow-500 font-display font-black italic tracking-[0.3em] text-2xl drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]">FINDING</span>
                    <span className="text-white/60 font-bold text-xs mt-1 uppercase tracking-widest">RIVAL...</span>
                  </div>
               </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Control Bar - From Screenshot */}
      <div className="absolute bottom-0 w-full h-44 bg-[#0d0d0d] border-t border-white/10 flex flex-col pb-4 z-[120]">
        <div className="flex-1 flex items-center justify-between px-6 pt-4">
           {/* Local Player HUD (Bottom Left) */}
           <div className="flex items-center gap-4">
              <div className="relative">
                {/* Silver Ring for local */}
                <div className="absolute -inset-1 bg-gradient-to-b from-neutral-400 to-neutral-700 rounded-full blur-[1px]" />
                <div className="relative w-16 h-16 rounded-full border-[3px] border-black bg-neutral-800 overflow-hidden shadow-2xl">
                   <img 
                     src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                     alt="Me" 
                     className="w-full h-full object-cover" 
                   />
                </div>
                {/* Name Badge */}
                <div className="absolute -bottom-2 -left-2 -right-2 px-2 py-1 bg-black border border-white/10 rounded-md shadow-xl text-center flex items-center justify-center gap-1">
                   <ShieldCheck size={10} className="text-neutral-400" />
                   <span className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate block">
                     {user.displayName?.split(' ')[0] || 'PLAYER-1'}
                   </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white/50 hover:text-white transition-all hover:bg-white/10">
                    <MessageSquare size={20} />
                 </button>
                 <button className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white/50 hover:text-white transition-all hover:bg-white/10">
                    <Gift size={20} />
                 </button>
              </div>
           </div>

           {/* Central Action HUD (Centered) */}
           <div className="flex flex-col items-center gap-2">
              <div className="flex bg-neutral-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                 <div className="px-8 py-2 border-r border-white/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1">Sum</span>
                    <span className="text-sm font-bold text-white tracking-widest">0/51</span>
                 </div>
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={skipTurn}
                   disabled={!isMyTurn}
                   className={`px-12 h-14 flex items-center justify-center font-black italic tracking-[0.1em] text-sm uppercase transition-all
                     ${isMyTurn 
                       ? 'bg-gradient-to-b from-[#ffcc00] to-[#cc9900] text-black shadow-[0_0_20px_rgba(255,204,0,0.3)]' 
                       : 'bg-neutral-800 text-white/10 cursor-not-allowed'}
                   `}
                 >
                    {game.gameType === 'joker' ? 'DROP A MELD' : 'PASS TURN'}
                 </motion.button>
              </div>
              {isMyTurn && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em]"
                >
                  Your Turn
                </motion.div>
              )}
           </div>

           {/* Right Spacer / Other icons */}
           <div className="flex flex-col gap-2">
              <button onClick={() => setShowMore(!showMore)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl text-white/50">
                 <MoreHorizontal size={20} />
              </button>
              <div className="w-10 h-10" /> 
           </div>
        </div>

        {/* Player's Cards (Docked at bottom) */}
        <div className="absolute -top-16 left-0 right-0 h-32 flex items-center justify-center overflow-visible pointer-events-none">
           <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
             <AnimatePresence>
               {myHand.map((card, i) => {
                 const layout = getHandLayout(i, myHand.length);
                 const playIsPossible = canPlay(card, topCard);
                 
                 return (
                  <motion.div
                    key={card.id}
                    layoutId={card.id}
                    drag={isMyTurn && playIsPossible}
                    dragElastic={0.1}
                    dragConstraints={{ top: -400, bottom: 50, left: -200, right: 200 }}
                    onDragEnd={(e, info) => onDragEnd(e, info, i)}
                    initial={{ y: 200, opacity: 0, rotate: layout.rotate }}
                    animate={{ 
                      x: layout.x * 0.75, 
                      y: layout.y * 0.75, 
                      rotate: layout.rotate,
                      opacity: 1,
                      scale: 0.9,
                      transition: { 
                        type: 'spring', 
                        stiffness: 300, 
                        damping: 25,
                        delay: i * 0.03
                      }
                    }}
                    exit={{ y: -300, opacity: 0, transition: { duration: 0.3 } }}
                    whileHover={{ 
                      y: (layout.y * 0.75) - 80,
                      rotate: 0,
                      scale: 1.15,
                      zIndex: 2000,
                      transition: { type: 'spring', stiffness: 500, damping: 20 }
                    }}
                    whileDrag={{ 
                      scale: 1.25, 
                      rotate: 0,
                      zIndex: 3000,
                    }}
                    className={`absolute origin-bottom ${!isMyTurn || !playIsPossible ? 'brightness-50 grayscale-[0.3]' : 'cursor-grab active:cursor-grabbing'}`}
                    style={{ zIndex: i + 100 }}
                  >
                    {isMyTurn && playIsPossible && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: [0, -10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                      >
                         <ChevronUp size={20} className="text-yellow-500" />
                      </motion.div>
                    )}
                    <CardComponent card={card} skinUrl={mySkin} />
                  </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
        </div>
      </div>

      {/* More Options Menu Overlay */}
      <AnimatePresence>
        {showMore && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            onClick={() => setShowMore(false)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
             >
                <div className="p-8 flex flex-col gap-4">
                   <h3 className="text-white font-display font-black italic tracking-widest text-xl mb-4 border-b border-white/5 pb-4">GAME OPTIONS</h3>
                   <button 
                     onClick={onLeave}
                     className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
                   >
                     <LogOut size={20} /> LEAVE GAME
                   </button>
                   {game.hostId === user.uid && (
                     <button 
                       onClick={endGame}
                       className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
                     >
                       <X size={20} /> DELETE ROOM
                     </button>
                   )}
                   <button 
                     onClick={() => setShowMore(false)}
                     className="w-full py-4 bg-white text-black font-bold rounded-2xl mt-4"
                   >
                     CLOSE
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Popup Overlay */}
      <AnimatePresence>
        {game.status === 'finished' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="max-w-md w-full bg-[#8b0000] border-4 border-yellow-500 p-12 text-center rounded-[40px] shadow-2xl"
            >
              <Trophy size={80} className="text-yellow-500 mx-auto mb-6" />
              <h2 className="text-4xl font-display mb-2 text-white neon-text-gold">
                {game.winner === user.uid ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              {game.winner === user.uid ? (
                <div className="flex flex-col items-center gap-2 my-4">
                   <div className="flex items-center gap-2 text-yellow-500 font-bold text-xl">
                      <Coins /> +500
                   </div>
                   <div className="text-blue-400 font-bold">+100 XP</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 my-4">
                   <div className="flex items-center gap-2 text-red-500 font-bold text-xl">
                      <Coins /> -200
                   </div>
                   <div className="text-blue-400 font-bold">+20 XP</div>
                </div>
              )}
              <button 
                onClick={onLeave}
                className="w-full mt-8 py-4 bg-yellow-500 text-black font-display font-bold rounded-2xl hover:bg-yellow-400 transition-all shadow-lg"
              >
                CONTINUE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TriangleDownIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21L2 5H22L12 21Z" />
    </svg>
  );
}

function CardComponent({ card, index = 0, isPile = false, skinUrl }: { card: Card, index?: number, isPile?: boolean, skinUrl?: string }) {
  const getSuitColor = (suit: string) => {
    switch (suit) {
      case 'hearts': case 'diamonds': case 'red': return 'text-[#d40000]';
      case 'joker': return 'text-[#ff4500]';
      case 'green': return 'text-[#008f11]';
      case 'blue': return 'text-[#0047ab]';
      case 'yellow': return 'text-[#e1ad01]';
      case 'special': return 'text-purple-600';
      default: return 'text-neutral-900';
    }
  };

  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      case 'joker': return '★';
      case 'red': case 'yellow': case 'green': case 'blue': return '●';
      case 'special': return '✦';
      default: return '';
    }
  };

  const getRankDisplay = (rank: string) => {
    if (rank === 'skip') return '🚫';
    if (rank === 'reverse') return '⇄';
    if (rank === 'draw2') return '+2';
    if (rank === 'wild') return 'W';
    if (rank === 'wild4') return '+4';
    if (rank === 'Joker') return '★';
    return rank;
  };

  const isUno = ['red', 'yellow', 'green', 'blue', 'special'].includes(card.suit);

  return (
    <motion.div
      initial={isPile ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      style={{ 
        transform: isPile ? `rotate(${Math.sin(index) * 20}deg) translate(${Math.cos(index) * 2}px, ${Math.sin(index) * 2}px)` : 'none',
        zIndex: index + 10,
        position: isPile ? 'absolute' : 'relative'
      }}
      className={`relative w-20 h-28 sm:w-28 sm:h-40 rounded-lg sm:rounded-xl border-[0.5px] border-black/10 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col items-center justify-between p-1.5 sm:p-2 select-none overflow-hidden ${getSuitColor(card.suit)}`}
    >
      {/* Texture/Skin Layer */}
      <div className="absolute inset-0 bg-white" />
      {skinUrl && (
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale brightness-150 mix-blend-multiply">
           <img src={skinUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className={`absolute inset-[2px] sm:inset-[4px] border rounded-md sm:rounded-lg pointer-events-none z-0 ${skinUrl ? 'border-yellow-500/20' : 'border-black/5'}`} />

      {/* Top Left Corner */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none z-10">
        <span className="font-sans font-black text-sm sm:text-lg">{getRankDisplay(card.rank)}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{getSuitIcon(card.suit)}</span>
      </div>

      {/* Middle icon */}
      <div className="flex-1 flex items-center justify-center z-10">
        <div className={`
          ${isUno ? 'w-16 h-16 sm:w-20 sm:h-20 rotate-12 rounded-full border-4 border-current flex items-center justify-center translate-y-1' : ''}
          drop-shadow-sm
        `}>
          <span className={`${isUno ? 'text-4xl sm:text-5xl -rotate-12 italic font-black' : 'text-4xl sm:text-6xl'}`}>
             {getSuitIcon(card.suit)}
          </span>
        </div>
      </div>

      {/* Bottom Right Corner (inverted) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none z-10 rotate-180">
        <span className="font-sans font-black text-sm sm:text-lg">{getRankDisplay(card.rank)}</span>
        <span className="text-xs sm:text-sm -mt-0.5">{getSuitIcon(card.suit)}</span>
      </div>
      
      {/* Center watermark or Skin name */}
      {!isUno && !skinUrl && (
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-45 select-none">
          <div className="text-6xl font-black italic">PRO</div>
        </div>
      )}
    </motion.div>
  );
}

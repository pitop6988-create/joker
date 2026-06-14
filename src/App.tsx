import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, onSnapshot, collection, query, where, limit, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { auth, db, signIn, signOut, signInEmail, signUpEmail } from './lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, Play, Trophy, Users, RefreshCcw, Hand, Plus, Lock, MoreVertical, Coins, ShoppingBag, X, Mail, Key, User as UserIcon, Menu, Settings, MessageSquare, Gift, MoreHorizontal, ChevronUp, ChevronRight, Edit, Camera, Save, Check, Image as ImageIcon, Crown, ShieldCheck, Star, Eye, LayoutGrid, ArrowLeft, Radio, Music, Volume2, VolumeX, Smile, Send, Copy, Search, Trash } from 'lucide-react';
import DobbleBoard from './DobbleBoard';
import { Game, GameStatus, Card, UserProfile, CardSkin, Club, ClubMessage, RadioTrack, EmojiItem, TableSkin } from './types';
import { createDeck, shuffle } from './gameLogic';
import confetti from 'canvas-confetti';
// @ts-ignore
import homeBgBlackImage from './assets/images/home_bg_black_1781448504157.jpg';
// @ts-ignore
import clubLogoDefaultImage from './assets/images/club_logo_default_1781448519688.jpg';
// @ts-ignore
import levelLogoImage from './assets/images/level_logo_badge_1781449343797.jpg';

function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  try {
    const parts = dataUrl.split(',');
    const header = parts[0];
    const base64Data = parts[1];
    if (!base64Data) return dataUrl;

    const mime = header.match(/:(.*?);/)?.[1] || 'audio/mpeg';
    const binaryStr = atob(base64Data);
    const len = binaryStr.length;
    const u8arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8arr[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([u8arr], { type: mime });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Failed to convert data URL to Blob URL:", e);
    return dataUrl;
  }
}

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  Kurdistan: { name: 'Kurdistan', flag: '☀' },
  USA: { name: 'USA', flag: '🇺🇸' },
  UK: { name: 'UK', flag: '🇬🇧' },
  Germany: { name: 'Germany', flag: '🇩🇪' },
  Canada: { name: 'Canada', flag: '🇨🇦' },
  Sweden: { name: 'Sweden', flag: '🇸🇪' },
  Iraq: { name: 'Iraq', flag: '🇮🇶' },
  Turkey: { name: 'Turkey', flag: '🇹🇷' }
};

type Language = 'en' | 'ku';

const translations: Record<Language, any> = {
  en: {
    lobby: 'Lobby',
    boutique: 'Boutique',
    rank: 'Rank',
    vault: 'Vault',
    eliteList: 'ELITE LIST',
    topPlayers: 'TOP PLAYERS',
    champions: 'Champions',
    victories: 'Victories',
    settings: 'Settings',
    language: 'Language',
    preview: 'Preview',
    owned: 'Owned',
    buy: 'Buy',
    logout: 'Log Out',
    dossier: 'PLAYER DOSSIER',
    wins: 'Wins',
    level: 'Level',
    chips: 'Chips',
    rankProf: 'Rank: Professional Gambler',
    mySkins: 'MY SKINS',
    clubs: 'Clubs',
    events: 'Events',
    home: 'Home',
    findingRival: 'FINDING RIVAL',
    loadingAssets: 'Loading Assets...',
    abandonDuel: 'ABANDON DUEL',
    visitShop: 'Visit the shop to unlock skins',
    gotoBoutique: 'Go to Boutique',
    use: 'USE',
    victoriesCount: 'Victories',
    wealth: 'Total Wealth',
    editProfile: 'Edit Profile',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    sendGift: 'Send Gift',
    myItems: 'My Items',
    badges: 'Badges',
    allBadges: 'All badges',
    verifyAccount: 'Verify your account to earn your first Badge.',
    gifts: 'Gifts',
    giftsWall: 'Gifts Wall',
    pointsReceived: 'Points Received',
    pointsSent: 'Points Sent',
    playerNumber: 'Player Number',
    games: 'Games',
    store: 'Store',
  },
  ku: {
    lobby: 'لۆبی',
    boutique: 'دوکان',
    rank: 'پلەبەندی',
    vault: 'پڕۆفایل',
    eliteList: 'لیستی نوخبە',
    topPlayers: 'باشترین یاریزانەکان',
    champions: 'پاڵەوانەکان',
    victories: 'سەرکەوتن',
    settings: 'ڕێکخستنەکان',
    language: 'زمان',
    preview: 'ببینە',
    owned: 'ھەتە',
    buy: 'کڕین',
    logout: 'چوونەدەرەوە',
    dossier: 'دۆسیەی یاریزان',
    wins: 'سەرکەوتن',
    level: 'ئاست',
    chips: 'چێپ',
    rankProf: 'پلە: قومارچی پرۆفیشناڵ',
    mySkins: 'سکنەکانم',
    clubs: 'کڵەبەکان',
    events: 'چالاکییەکان',
    home: 'سەرەتا',
    findingRival: 'بەدوای یاریزاندا دەگەڕێت...',
    loadingAssets: 'کەلوپەلەکان بار دەکرێن...',
    abandonDuel: 'پاشەکشە',
    visitShop: 'سەردانی دوکان بکە بۆ سکن',
    gotoBoutique: 'بڕۆ بۆ دوکان',
    use: 'بەکارھێنان',
    victoriesCount: 'سەرکەوتن',
    wealth: 'سامانی گشتی',
    editProfile: 'بۆردی پڕۆفایل',
    saveChanges: 'پاشەکەوت',
    cancel: 'لابردن',
    sendGift: 'ناردنی دیاری',
    myItems: 'کەلوپەلەکانم',
    badges: 'نیشانەکان',
    allBadges: 'ھەموو نیشانەکان',
    verifyAccount: 'ھەژمارەکەت بپشکنە بۆ بەدەستھێنانی یەکەم نیشانە.',
    gifts: 'دیارییەکان',
    giftsWall: 'دیواری دیارییەکان',
    pointsReceived: 'خاڵە وەرگیراوەکان',
    pointsSent: 'خاڵە نێردراوەکان',
    playerNumber: 'ژمارەی یاریزان',
    games: 'یارییەکان',
    store: 'بازاڕ',
  }
};
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
  console.warn('Firestore Error Handled (Graceful Retry / Idle): ', JSON.stringify(errInfo));
}

const soundManager = {
  ctx: null as AudioContext | null,
  get enabled() {
    return localStorage.getItem('sound_enabled') !== 'false';
  },
  set enabled(val: boolean) {
    localStorage.setItem('sound_enabled', val ? 'true' : 'false');
  },
  
  getRawCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  },

  playCardDeal() {
    if (!this.enabled) return;
    try {
      const ctx = this.getRawCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Sound error: ", e);
    }
  },

  playCardMove() {
    if (!this.enabled) return;
    try {
      const ctx = this.getRawCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      console.warn("Sound error: ", e);
    }
  },

  playDamaMove() {
    if (!this.enabled) return;
    try {
      const ctx = this.getRawCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) {
      console.warn("Sound error: ", e);
    }
  },

  playDamaCapture() {
    if (!this.enabled) return;
    try {
      const ctx = this.getRawCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(250, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.linearRampToValueAtTime(0.01, now + 0.06);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(190, now + 0.04);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain2.gain.setValueAtTime(0.25, now + 0.04);
      gain2.gain.linearRampToValueAtTime(0.01, now + 0.15);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.06);
      osc2.start(now + 0.04);
      osc2.stop(now + 0.15);
    } catch (e) {
      console.warn("Sound error: ", e);
    }
  },

  playShopBuy() {
    if (!this.enabled) return;
    try {
      const ctx = this.getRawCtx();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1100, now);
      osc1.frequency.setValueAtTime(1500, now + 0.08);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1350, now);
      osc2.frequency.setValueAtTime(1800, now + 0.08);
      gain2.gain.setValueAtTime(0.1, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.28);
      osc2.start(now);
      osc2.stop(now + 0.28);
    } catch (e) {
      console.warn("Sound error: ", e);
    }
  },

  playGameEnd(isVictory: boolean) {
    if (!this.enabled) return;
    try {
      const ctx = this.getRawCtx();
      const now = ctx.currentTime;
      if (isVictory) {
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.15, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.4);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.4);
        });
      } else {
        const notes = [220.00, 207.65, 196.00, 146.83]; // A3, Ab3, G3, D3
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.15, now + idx * 0.14);
          gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.14 + 0.35);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.35);
        });
      }
    } catch (e) {
      console.warn("Sound error: ", e);
    }
  }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const updatingShortIdRef = React.useRef(false);
  const clearingClubIdRef = React.useRef(false);
  const [loading, setLoading] = useState(true);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'shop' | 'profile' | 'leaderboard' | 'settings' | 'clubs' | 'my-items'>('home');
  const [searchGameType, setSearchGameType] = useState<'uno' | 'joker' | 'dama'>('uno');
  const [skinsMap, setSkinsMap] = useState<Record<string, CardSkin>>({});
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const [tableSkinsMap, setTableSkinsMap] = useState<Record<string, TableSkin>>({});
  const [tableSkins, setTableSkins] = useState<TableSkin[]>([]);
  const [gameLogos, setGameLogos] = useState<Record<string, string>>({ uno: '', joker: '', dama: '' });
  const [language, setLanguage] = useState<Language>('en');
  const [activeClubId, setActiveClubId] = useState<string | null>(null);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showRadioHub, setShowRadioHub] = useState(false);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [radioTracks, setRadioTracks] = useState<RadioTrack[]>([]);
  const [trackCache, setTrackCache] = useState<Record<string, string>>({});
  const [emojiItems, setEmojiItems] = useState<EmojiItem[]>([]);
  const [lobbyBg, setLobbyBg] = useState('');

  useEffect(() => {
    const unsubLogos = onSnapshot(collection(db, 'gameLogos'), (snapshot) => {
      const map: Record<string, string> = { uno: '', joker: '', dama: '' };
      snapshot.docs.forEach(doc => {
        map[doc.id] = (doc.data() as any).url || '';
      });
      setGameLogos(map);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'gameLogos');
    });

    const unsubLobbyBg = onSnapshot(doc(db, 'config', 'lobbyBackground'), (snapshot) => {
      if (snapshot.exists()) {
        setLobbyBg(snapshot.data().url || '');
      } else {
        setLobbyBg('');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/lobbyBackground');
    });

    return () => {
      unsubLogos();
      unsubLobbyBg();
    };
  }, []);

  useEffect(() => {
    const unsubTables = onSnapshot(collection(db, 'tableSkins'), (snapshot) => {
      const map: Record<string, TableSkin> = {};
      const list: TableSkin[] = [];
      snapshot.docs.forEach(doc => {
        const item = { id: doc.id, ...doc.data() } as TableSkin;
        map[doc.id] = item;
        list.push(item);
      });
      setTableSkinsMap(map);
      setTableSkins(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tableSkins');
    });
    return unsubTables;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'emojiItems'), (snap) => {
      setEmojiItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as EmojiItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'emojiItems');
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'cardSkins'), (snapshot) => {
      const map: Record<string, CardSkin> = {};
      const list: CardSkin[] = [];
      snapshot.docs.forEach(doc => {
        const item = { id: doc.id, ...doc.data() } as CardSkin;
        map[doc.id] = item;
        list.push(item);
      });
      setSkinsMap(map);
      setSkins(list);
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
            activeSkinId: null,
            shortId: Math.floor(Math.random() * 9000000 + 1000000).toString()
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
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (!data.shortId && !updatingShortIdRef.current) {
            updatingShortIdRef.current = true;
            const shortId = Math.floor(Math.random() * 9000000 + 1000000).toString();
            updateDoc(doc(db, 'users', user.uid), { shortId }).catch(console.error);
          }
          setProfile(data as UserProfile);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
      return unsubscribe;
    }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'radioTracks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRadioTracks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RadioTrack)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'radioTracks');
    });
    return unsubscribe;
  }, []);

  const [audio] = useState(new Audio());

  useEffect(() => {
    (window as any).toggleRadioHub = () => setShowRadioHub(prev => !prev);
  }, []);

  useEffect(() => {
    let active = true;
    if (radioTracks.length > 0 && isMusicOn) {
      const currentTrack = radioTracks[currentTrackIndex];
      if (!currentTrack) return;

      const playAudio = (srcStr: string) => {
        if (!active) return;
        if (srcStr && audio.src !== srcStr) {
          audio.src = srcStr;
        }
        if (srcStr) {
          audio.play().catch((err: any) => {
            console.warn("Audio play failed or was blocked by player/browser context:", err);
            setIsMusicOn(false);
          });
        }
        audio.onended = () => {
          setCurrentTrackIndex((prev) => (prev + 1) % radioTracks.length);
        };
      };

      if (currentTrack.isChunked && !currentTrack.url) {
        if (trackCache[currentTrack.id]) {
          playAudio(trackCache[currentTrack.id]);
        } else {
          const fetchChunks = async () => {
            try {
              const chunksSnap = await getDocs(query(collection(db, `radioTracks/${currentTrack.id}/chunks`), orderBy('index', 'asc')));
              const fullUrl = chunksSnap.docs.map(d => d.data().data).join('');
              const blobUrl = dataUrlToBlobUrl(fullUrl);
              if (active) {
                setTrackCache(prev => ({ ...prev, [currentTrack.id]: blobUrl }));
              }
            } catch (e) {
              console.error("Failed to load chunked track:", e);
              if (active) {
                setCurrentTrackIndex((prev) => (prev + 1) % radioTracks.length);
              }
            }
          };
          fetchChunks();
        }
      } else {
        if (trackCache[currentTrack.id]) {
          playAudio(trackCache[currentTrack.id]);
        } else {
          const blobUrl = dataUrlToBlobUrl(currentTrack.url || "");
          if (active) {
            setTrackCache(prev => ({ ...prev, [currentTrack.id]: blobUrl }));
          }
          playAudio(blobUrl);
        }
      }
    } else {
      audio.pause();
    }
    return () => {
      active = false;
    };
  }, [currentTrackIndex, radioTracks, isMusicOn, trackCache]);

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

  useEffect(() => {
    if (!profile?.clubId || !user) {
      setCurrentClub(null);
      return;
    }
    const userId = user.uid;
    const unsubscribe = onSnapshot(doc(db, 'clubs', profile.clubId), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentClub({ id: snapshot.id, ...snapshot.data() } as Club);
      } else if (!clearingClubIdRef.current) {
        // If club was deleted, clear user's clubId
        clearingClubIdRef.current = true;
        const userRef = doc(db, 'users', userId);
        updateDoc(userRef, { clubId: null })
          .catch(e => {
            console.error("Failed to clear clubId:", e);
          })
          .finally(() => {
            clearingClubIdRef.current = false;
          });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `clubs/${profile.clubId}`);
    });
    return unsubscribe;
  }, [profile?.clubId, user]);

  const handleCreateClub = async (data: any) => {
    if (!user || !profile) return;
    if (profile.chips < 30000) {
      alert("Insufficient chips! Creation costs 30,000.");
      return;
    }

    try {
      const clubRef = await addDoc(collection(db, 'clubs'), {
        ...data,
        ownerId: user.uid,
        members: [user.uid],
        chipsPool: 0,
        createdAt: Date.now()
      });

      await updateDoc(doc(db, 'users', user.uid), {
        clubId: clubRef.id,
        chips: profile.chips - 30000
      });

      alert("Club founded successfully!");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'clubs');
    }
  };

  const handleJoinClub = async (clubId: string) => {
    if (!user || !profile) return;
    if (profile.clubId) {
       alert("You are already in a club! Leave your current one first.");
       return;
    }

    const clubRef = doc(db, 'clubs', clubId);
    const clubSnap = await getDoc(clubRef);
    if (!clubSnap.exists()) return;
    const clubData = clubSnap.data() as Club;

    if (clubData.members.length >= (clubData.maxMembers || 30)) {
       alert("Club is full!");
       return;
    }

    if (clubData.isPrivate) {
       const pass = prompt("Enter Entry Code:");
       if (pass !== clubData.password) {
          alert("Incorrect code!");
          return;
       }
    }

    try {
       await updateDoc(clubRef, {
          members: [...clubData.members, user.uid]
       });
       await updateDoc(doc(db, 'users', user.uid), {
          clubId: clubId
       });
    } catch (e) {
       handleFirestoreError(e, OperationType.UPDATE, `clubs/${clubId}`);
    }
  };

  const handleLeaveClub = async () => {
    if (!user || !profile || !profile.clubId || !currentClub) return;
    
    if (confirm("Are you sure you want to leave this syndicate?")) {
       try {
          const members = currentClub.members.filter(m => m !== user.uid);
          if (members.length === 0) {
             // Delete club if last member
             await deleteDoc(doc(db, 'clubs', profile.clubId));
          } else {
             await updateDoc(doc(db, 'clubs', profile.clubId), {
                members,
                ownerId: currentClub.ownerId === user.uid ? members[0] : currentClub.ownerId
             });
          }
          await updateDoc(doc(db, 'users', user.uid), {
             clubId: null
          });
          setActiveTab('home');
       } catch (e) {
          handleFirestoreError(e, OperationType.UPDATE, `clubs/${profile.clubId}`);
       }
    }
  };

  const handlePostClubMessage = async (text: string) => {
    if (!user || !profile || !profile.clubId) return;
    try {
       await addDoc(collection(db, `clubs/${profile.clubId}/messages`), {
          userId: user.uid,
          userName: profile.displayName,
          userPhoto: profile.photoURL,
          text,
          createdAt: Date.now()
       });
    } catch (e) {
       handleFirestoreError(e, OperationType.CREATE, `clubs/${profile.clubId}/messages`);
    }
  };

  const handleSaveProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
       await updateDoc(doc(db, 'users', user.uid), data);
       setShowProfileEditor(false);
    } catch (e) {
       handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

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

  const startSearching = async (gameType: 'uno' | 'joker' | 'dama' = 'uno') => {
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

  const createGame = async (roomName: string, password?: string, gameType: 'uno' | 'joker' | 'dama' = 'uno') => {
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
    
    // Configurable card count: 9 for Uno, 16 for Joker (Real Card Game feel)
    const cardCount = gameData.gameType === 'uno' ? 9 : 16;
    let hand1 = deck.splice(0, cardCount);
    let hand2 = deck.splice(0, cardCount);
    const firstPile = deck.splice(0, 1);

    let board: (string | null)[] | undefined = undefined;

    if (gameData.gameType === 'dama') {
      board = Array(64).fill(null);
      // Top player pieces
      for (let r = 1; r < 3; r++) {
        for (let c = 0; c < 8; c++) {
          board[r * 8 + c] = player1Id;
        }
      }
      // Bottom player pieces
      for (let r = 5; r < 7; r++) {
        for (let c = 0; c < 8; c++) {
          board[r * 8 + c] = player2Id;
        }
      }
    }

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
        board: board || null,
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] relative overflow-hidden font-vintage">
        {/* Dark Red Curtain Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8b0000]/20 to-black" />
        
        <div className="z-10 flex flex-col items-center gap-12 w-full max-w-sm px-8">
          <div className="flex flex-col items-center">
             <div className="relative mb-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                   <div className="flex gap-1 mb-2">
                      <div className="w-12 h-16 bg-red-600 rounded-lg shadow-xl -rotate-12 flex items-center justify-center text-white text-4xl border-2 border-white/20">🃏</div>
                      <div className="w-12 h-16 bg-[#ffcc00] rounded-lg shadow-xl rotate-12 flex items-center justify-center text-[#8b0000] text-4xl border-2 border-white/20">★</div>
                   </div>
                   <h1 className="text-7xl font-display font-black text-white tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">Jawaker</h1>
                </motion.div>
             </div>
          </div>

          <div className="w-full space-y-6 mt-20">
             <div className="relative">
                <p className="text-white font-black text-center text-lg mb-4">Loading...</p>
                <div className="w-full h-2 bg-black/40 rounded-full border border-white/10 overflow-hidden">
                   <motion.div 
                     initial={{ width: "0%" }}
                     animate={{ width: "100%" }}
                     transition={{ duration: 3, ease: "linear" }}
                     className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-full"
                   />
                </div>
             </div>
          </div>
        </div>

        {/* Thematic elements at bottom */}
        <div className="absolute bottom-32 w-full flex justify-center gap-4 opacity-40">
           <div className="w-16 h-24 bg-white/5 rounded-lg border border-white/10" />
           <div className="w-16 h-24 bg-white/5 rounded-lg border border-white/10 rotate-12" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onGoogleSignIn={signIn} onEmailSignIn={signInEmail} onEmailSignUp={signUpEmail} />;
  }

  if (isSearching) {
    return (
      <>
        <SearchingView user={user} gameType={searchGameType} onCancel={() => setIsSearching(false)} />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeGameId && currentGame) {
    return (
      <>
        <GameView user={user} game={currentGame} onLeave={handleLeaveGame} profile={profile} skinsMap={skinsMap} emojiItems={emojiItems} />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeTab === 'shop') {
    return (
      <>
        <ShopView user={user} profile={profile!} onBack={() => setActiveTab('home')} setActiveTab={setActiveTab} language={language} lobbyBg={lobbyBg} />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeTab === 'leaderboard') {
    return (
      <>
        <LeaderboardView profile={profile!} setActiveTab={setActiveTab} language={language} />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeTab === 'clubs') {
    if (profile?.clubId && currentClub) {
      return (
        <>
          <ClubDetailView club={currentClub} user={user} profile={profile} onLeave={handleLeaveClub} onPostMessage={handlePostClubMessage} onBack={() => setActiveTab('home')} emojiItems={emojiItems} />
          <RadioHub 
            tracks={radioTracks} 
            active={showRadioHub} 
            onClose={() => setShowRadioHub(false)} 
            isMusicOn={isMusicOn} 
            toggleMusic={() => setIsMusicOn(!isMusicOn)} 
            currentTrackIndex={currentTrackIndex} 
            setCurrentTrackIndex={setCurrentTrackIndex} 
          />
        </>
      );
    }
    return (
      <>
        <ClubsView user={user} profile={profile!} onJoinClub={handleJoinClub} onCreateClub={handleCreateClub} onBack={() => setActiveTab('home')} />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeTab === 'profile') {
    return (
      <>
        <ProfileView user={user} profile={profile!} onBack={() => setActiveTab('home')} onLogout={signOut} setActiveTab={setActiveTab} language={language} onOpenSettings={() => setActiveTab('settings')} onEditProfile={() => setShowProfileEditor(true)} />
        {showProfileEditor && (
          <ProfileEditor 
            profile={profile!} 
            user={user} 
            onSave={handleSaveProfile} 
            onCancel={() => setShowProfileEditor(false)} 
          />
        )}
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeTab === 'my-items') {
    return (
      <>
        <MyItemsView 
          user={user} 
          profile={profile!} 
          onBack={() => setActiveTab('profile')} 
          emojiItems={emojiItems} 
          setActiveTab={setActiveTab}
          language={language}
        />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  if (activeTab === 'settings') {
    return (
      <>
        <SettingsView language={language} setLanguage={setLanguage} onBack={() => setActiveTab('profile')} user={user} profile={profile!} />
        <RadioHub 
          tracks={radioTracks} 
          active={showRadioHub} 
          onClose={() => setShowRadioHub(false)} 
          isMusicOn={isMusicOn} 
          toggleMusic={() => setIsMusicOn(!isMusicOn)} 
          currentTrackIndex={currentTrackIndex} 
          setCurrentTrackIndex={setCurrentTrackIndex} 
        />
      </>
    );
  }

  return (
    <>
      <LobbyView user={user} profile={profile} onStartSearch={startSearching} onJoin={joinGame} onLogout={signOut} onCreate={createGame} setActiveTab={setActiveTab} onClaimDaily={claimDailyReward} language={language} gameLogos={gameLogos} lobbyBg={lobbyBg} />
      <RadioHub 
        tracks={radioTracks} 
        active={showRadioHub} 
        onClose={() => setShowRadioHub(false)} 
        isMusicOn={isMusicOn} 
        toggleMusic={() => setIsMusicOn(!isMusicOn)} 
        currentTrackIndex={currentTrackIndex} 
        setCurrentTrackIndex={setCurrentTrackIndex} 
      />
    </>
  );
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err: any) {
      console.error("Google login failed", err);
      if (err.code === 'auth/operation-not-supported-in-this-environment' || err.message?.includes('not supported') || err.message?.includes('operation is not supported')) {
        setError('Google login is not supported inside pre-embed iframe. Please sign in with Email/Password or Open App in New Tab!');
      } else {
        setError(err.message || 'Google login failed');
      }
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
            onClick={handleGoogleSignIn}
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

function GameLogo({ size = 'large', profile }: { size?: 'small' | 'large', profile?: UserProfile | null }) {
  if (size === 'small') {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#8b0000] rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg rotate-12 border border-yellow-500/30 overflow-hidden">
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
          ) : (
            <Star size={16} fill="currentColor" />
          )}
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
          className="w-20 h-20 sm:w-24 sm:h-24 bg-[#8b0000] rounded-[24px] sm:rounded-[32px] border-4 border-yellow-500 shadow-[0_0_50px_rgba(139,0,0,0.4)] flex items-center justify-center text-white relative z-10 overflow-hidden"
        >
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile Logo" className="w-full h-full object-cover" />
          ) : (
            <Crown size={40} className="sm:size-12" fill="currentColor" />
          )}
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
  return null;
}

function GameSandbox() {
  const [board, setBoard] = useState<(any | null)[][]>(Array(8).fill(null).map(() => Array(8).fill(null)));
  const [activeBrush, setActiveBrush] = useState<'red-pawn' | 'red-king' | 'black-pawn' | 'black-king' | 'empty'>('red-pawn');
  const [mode, setMode] = useState<'edit' | 'move'>('edit');
  const [selectedPiece, setSelectedPiece] = useState<{ r: number, c: number } | null>(null);
  const [testResult, setTestResult] = useState<string>('');

  const loadClassicCheckers = () => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          if (r < 3) {
            newBoard[r][c] = { type: 'pawn', color: 'black' };
          } else if (r > 4) {
            newBoard[r][c] = { type: 'pawn', color: 'red' };
          }
        }
      }
    }
    setBoard(newBoard);
    setTestResult('Loaded Classic starting checkers layout.');
  };

  const loadEmptyBoard = () => {
    setBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
    setTestResult('Cleared entire board canvas.');
  };

  const loadMidGameSetup = () => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    newBoard[1][2] = { type: 'king', color: 'black' };
    newBoard[2][5] = { type: 'pawn', color: 'red' };
    newBoard[3][4] = { type: 'pawn', color: 'black' };
    newBoard[4][3] = { type: 'pawn', color: 'red' };
    newBoard[5][2] = { type: 'king', color: 'red' };
    newBoard[6][5] = { type: 'pawn', color: 'black' };
    setBoard(newBoard);
    setTestResult('Loaded Mid-Game custom simulation preset.');
  };

  const saveSandboxToCloud = async () => {
    try {
      await setDoc(doc(db, 'config', 'sandboxDama'), {
        boardState: JSON.stringify(board),
        updatedAt: Date.now()
      });
      alert("Successfully saved current sandbox checker board setup to firebase!");
    } catch (e) {
      alert("Error saving: " + (e as Error).message);
    }
  };

  const loadSandboxFromCloud = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'sandboxDama'));
      if (snap.exists() && snap.data().boardState) {
        setBoard(JSON.parse(snap.data().boardState));
        setTestResult('Synchronized layouts from firebase database.');
      } else {
        alert("No cloud preset found. Loading starting classic instead.");
        loadClassicCheckers();
      }
    } catch (e) {
      alert("Error loading: " + (e as Error).message);
    }
  };

  useEffect(() => {
    loadClassicCheckers();
  }, []);

  const handleTileClick = (r: number, c: number) => {
    if ((r + c) % 2 === 0) {
      setTestResult('Cannot place piece on light square (checkers only moves on dark).');
      return;
    }

    if (mode === 'edit') {
      const newBoard = board.map(row => [...row]);
      if (activeBrush === 'empty') {
        newBoard[r][c] = null;
        setTestResult(`Cleared cell at row ${r + 1}, col ${c + 1}.`);
      } else {
        const [color, type] = activeBrush.split('-');
        newBoard[r][c] = { type, color };
        setTestResult(`Placed ${color} ${type} at tile [${r + 1}, ${c + 1}].`);
      }
      setBoard(newBoard);
    } else {
      const piece = board[r][c];
      if (selectedPiece) {
        if (selectedPiece.r === r && selectedPiece.c === c) {
          setSelectedPiece(null);
          return;
        }
        if (piece) {
          setSelectedPiece({ r, c });
          setTestResult(`Selected new piece at row ${r + 1}, col ${c + 1}.`);
        } else {
          const newBoard = board.map(row => [...row]);
          const movingPiece = board[selectedPiece.r][selectedPiece.c];
          
          if (!movingPiece) {
            setSelectedPiece(null);
            return;
          }

          const rDiff = Math.abs(r - selectedPiece.r);
          const cDiff = Math.abs(c - selectedPiece.c);

          if (rDiff === 1 && cDiff === 1) {
            newBoard[r][c] = movingPiece;
            newBoard[selectedPiece.r][selectedPiece.c] = null;
            
            if (movingPiece.color === 'red' && r === 0) {
              newBoard[r][c].type = 'king';
            } else if (movingPiece.color === 'black' && r === 7) {
              newBoard[r][c].type = 'king';
            }

            setBoard(newBoard);
            setTestResult(`Moved piece to [${r + 1}, ${c + 1}].`);
            setSelectedPiece(null);
          } else if (rDiff === 2 && cDiff === 2) {
            const midR = (r + selectedPiece.r) / 2;
            const midC = (c + selectedPiece.c) / 2;
            const enemyPiece = board[midR][midC];

            newBoard[r][c] = movingPiece;
            newBoard[selectedPiece.r][selectedPiece.c] = null;
            newBoard[midR][midC] = null;

            if (movingPiece.color === 'red' && r === 0) {
              newBoard[r][c].type = 'king';
            } else if (movingPiece.color === 'black' && r === 7) {
              newBoard[r][c].type = 'king';
            }

            setBoard(newBoard);
            setTestResult(`Captured piece at [${midR + 1}, ${midC + 1}] and jumped to [${r + 1}, ${c + 1}]!`);
            setSelectedPiece(null);
          } else {
            setTestResult('Invalid movement! Checkers move diagonally 1 step (or 2 steps to jump/capture).');
          }
        }
      } else {
        if (piece) {
          setSelectedPiece({ r, c });
          setTestResult(`Selected piece at row ${r + 1}, col ${c + 1}. Ready to skip or slide.`);
        }
      }
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 animate-fade-in text-white">
      <div className="flex justify-between items-center">
         <div>
           <h2 className="text-lg font-black uppercase text-yellow-500 tracking-wider">
             Dama Game Sandbox & Editor
           </h2>
           <p className="text-[10px] text-zinc-400 mt-0.5">
             Simulate checker board layouts, piece mechanics, and promotional criteria.
           </p>
         </div>
         <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase rounded-lg">EDITOR ACTIVE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
         <div className="md:col-span-7 flex flex-col items-center">
            <div className="aspect-square bg-zinc-950 border-4 border-zinc-900 rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8 w-full max-w-[360px] shadow-2xl relative">
               {board.map((row, r) => 
                 row.map((cell, c) => {
                   const isDark = (r + c) % 2 === 1;
                   const isSelected = selectedPiece && selectedPiece.r === r && selectedPiece.c === c;
                   return (
                     <div 
                       key={`${r}-${c}`}
                       onClick={() => handleTileClick(r, c)}
                       className={`aspect-square relative flex items-center justify-center cursor-pointer transition-all ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-orange-100/10'}`}
                     >
                       {isSelected && (
                         <div className="absolute inset-0 border-2 border-yellow-500 animate-pulse z-10" />
                       )}
                       
                       {cell && (
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-transform ${cell.color === 'red' ? 'bg-[#8b0000] border-2 border-[#ff3b3b]' : 'bg-black border-2 border-zinc-700'}`}>
                           {cell.type === 'king' && (
                             <span className="text-yellow-400 text-xs font-black">👑</span>
                           )}
                         </div>
                       )}
                     </div>
                   );
                 })
               )}
            </div>
            
            <div className="mt-4 p-3 bg-black/40 border border-white/10 rounded-xl w-full max-w-[360px] text-center">
               <span className="text-[10px] text-yellow-500/80 font-black uppercase tracking-wider block">Sandbox status message</span>
               <p className="text-xs text-zinc-300 font-bold font-mono mt-1 leading-snug">{testResult || 'IDLE - Ready for input.'}</p>
            </div>
         </div>

         <div className="md:col-span-5 space-y-4">
            <div>
               <label className="block text-[9px] font-black uppercase text-white/40 tracking-wider mb-2">Sandbox Interactive Mode</label>
               <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => { setMode('edit'); setSelectedPiece(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${mode === 'edit' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Edit Brush
                  </button>
                  <button 
                    onClick={() => { setMode('move'); setSelectedPiece(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${mode === 'move' ? 'bg-yellow-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                  >
                    Playtest Moves
                  </button>
               </div>
            </div>

            {mode === 'edit' && (
               <div className="space-y-2">
                  <label className="block text-[9px] font-black uppercase text-white/40 tracking-wider">Active Placement Brush</label>
                  <div className="grid grid-cols-2 gap-2">
                     <button 
                       onClick={() => setActiveBrush('red-pawn')}
                       className={`p-2.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeBrush === 'red-pawn' ? 'bg-white/10 border-yellow-500 text-white' : 'bg-black/20 border-white/10 text-white/50'}`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-[#8b0000] border border-[#ff3b3b]" /> Red Pawn
                     </button>
                     <button 
                       onClick={() => setActiveBrush('red-king')}
                       className={`p-2.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeBrush === 'red-king' ? 'bg-white/10 border-yellow-500 text-white' : 'bg-black/20 border-white/10 text-white/50'}`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-[#8b0000] border border-[#ff3b3b] flex items-center justify-center text-[8px] text-yellow-400">👑</span> Red King
                     </button>
                     <button 
                       onClick={() => setActiveBrush('black-pawn')}
                       className={`p-2.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeBrush === 'black-pawn' ? 'bg-white/10 border-yellow-500 text-white' : 'bg-black/20 border-white/10 text-white/50'}`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-black border border-zinc-700" /> Black Pawn
                     </button>
                     <button 
                       onClick={() => setActiveBrush('black-king')}
                       className={`p-2.5 rounded-xl border text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeBrush === 'black-king' ? 'bg-white/10 border-yellow-500 text-white' : 'bg-black/20 border-white/10 text-white/50'}`}
                     >
                       <span className="w-3.5 h-3.5 rounded-full bg-black border border-zinc-700 flex items-center justify-center text-[8px] text-yellow-400">👑</span> Black King
                     </button>
                  </div>
                  <button 
                    onClick={() => setActiveBrush('empty')}
                    className={`w-full p-2.5 rounded-xl border text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${activeBrush === 'empty' ? 'bg-white/10 border-red-500 text-red-400' : 'bg-red-550/15 border-red-550/30 text-red-300 hover:text-white'}`}
                  >
                    🗑️ Eraser (Clear Cell)
                  </button>
               </div>
            )}

            <div className="space-y-2 pt-2 border-t border-white/5">
               <label className="block text-[9px] font-black uppercase text-white/40 tracking-wider">Canvas Setup Presets</label>
               <div className="grid grid-cols-3 gap-2">
                  <button onClick={loadClassicCheckers} className="p-2 bg-black/40 border border-white/10 text-[9px] font-bold uppercase rounded-lg hover:border-yellow-500 transition-colors">Starting Dama</button>
                  <button onClick={loadMidGameSetup} className="p-2 bg-black/40 border border-white/10 text-[9px] font-bold uppercase rounded-lg hover:border-yellow-500 transition-colors">Mid Game Duel</button>
                  <button onClick={loadEmptyBoard} className="p-2 bg-black/40 border border-white/10 text-[9px] font-bold uppercase rounded-lg hover:border-red-500 hover:text-red-400 transition-colors">Clean Board</button>
               </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/5">
               <label className="block text-[9px] font-black uppercase text-white/40 tracking-wider">Draft Setup Synchronizer</label>
               <div className="flex gap-2">
                  <button onClick={saveSandboxToCloud} className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[10px] font-black uppercase rounded-xl shadow tracking-widest transition-colors">
                     Save Blueprint
                  </button>
                  <button onClick={loadSandboxFromCloud} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase rounded-xl border border-white/10 tracking-widest transition-colors">
                     Load Cloud
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function AdminView({ onBack, lobbyBg }: { onBack: () => void, lobbyBg?: string }) {
  const [skinName, setSkinName] = useState('');
  const [skinPrice, setSkinPrice] = useState(1000);
  const [skinRarity, setSkinRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('common');
  const [skinImage, setSkinImage] = useState('');
  const [skinEmoji, setSkinEmoji] = useState('🃏');
  const [skinIsNew, setSkinIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveAdminTab] = useState<'skins' | 'users' | 'radio' | 'emojis' | 'tables' | 'logos' | 'sandbox'>('skins');
  const [tempBgUrl, setTempBgUrl] = useState('');
  const [lobbyBgState, setLobbyBgState] = useState(lobbyBg || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [trackName, setTrackName] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  
  const [emojiName, setEmojiName] = useState('');
  const [emojiUrl, setEmojiUrl] = useState('');
  const [emojiPrice, setEmojiPrice] = useState(500);
  const [emojiType, setEmojiType] = useState<'emoji' | 'gif'>('emoji');

  const [tableName, setTableName] = useState('');
  const [tablePrice, setTablePrice] = useState(2500);
  const [tableRarity, setTableRarity] = useState<'common' | 'rare' | 'epic' | 'legendary'>('common');
  const [tableImage, setTableImage] = useState('');
  const [tableEmoji, setTableEmoji] = useState('🎴');

  const [selectedLogoGame, setSelectedLogoGame] = useState<'uno' | 'joker' | 'dama'>('uno');
  const [gameLogoUrl, setGameLogoUrl] = useState('');
  const [logoScope, setLogoScope] = useState<'game' | 'club' | 'background'>('game');
  const [clubLogoUrl, setClubLogoUrl] = useState('');
  const [clubLogos, setClubLogos] = useState<{ id: string; url: string; createdAt: number }[]>([]);
  const [tableIsNew, setTableIsNew] = useState(false);

  // Real-time collections for editing
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const [tableSkins, setTableSkins] = useState<TableSkin[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Realtime sync for users
    const qUsers = query(collection(db, 'users'), limit(100));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data(), uid: d.id } as any as UserProfile)));
    });

    // Realtime sync for card skins
    const unsubSkins = onSnapshot(collection(db, 'cardSkins'), (snap) => {
      setSkins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardSkin)));
    });

    // Realtime sync for radio tracks
    const unsubTracks = onSnapshot(collection(db, 'radioTracks'), (snap) => {
      setTracks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RadioTrack)));
    });

    // Realtime sync for emoji items
    const unsubEmojis = onSnapshot(collection(db, 'emojiItems'), (snap) => {
      setEmojis(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmojiItem)));
    });

    // Realtime sync for table skins
    const unsubTables = onSnapshot(collection(db, 'tableSkins'), (snap) => {
      setTableSkins(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableSkin)));
    });

    // Realtime sync for club logos
    const unsubClubLogos = onSnapshot(query(collection(db, 'clubLogos'), orderBy('createdAt', 'desc')), (snap) => {
      setClubLogos(snap.docs.map(doc => ({ id: doc.id, url: doc.data().url || '', createdAt: doc.data().createdAt || 0 })));
    });

    return () => {
      unsubUsers();
      unsubSkins();
      unsubTracks();
      unsubEmojis();
      unsubTables();
      unsubClubLogos();
    };
  }, []);

  const handleUpdateChips = async (userUid: string, currentChips: number) => {
    const amount = prompt("Enter new chip amount:", currentChips.toString());
    if (amount === null) return;
    try {
      await updateDoc(doc(db, 'users', userUid), { chips: parseInt(amount) });
      setUsers(users.map(u => (u as any).uid === userUid ? { ...u, chips: parseInt(amount) } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userUid}`);
    }
  };

  const handleUpdateWins = async (userUid: string, currentWins: number) => {
    const amount = prompt("Enter total wins:", currentWins.toString());
    if (amount === null) return;
    try {
      await updateDoc(doc(db, 'users', userUid), { totalWins: parseInt(amount) });
      setUsers(users.map(u => (u as any).uid === userUid ? { ...u, totalWins: parseInt(amount) } : u));
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userUid}`);
    }
  };

  const handleDeleteUser = async (userUid: string) => {
    if (!window.confirm("Permanently delete this user profile?")) return;
    try {
      await deleteDoc(doc(db, 'users', userUid));
      setUsers(users.filter(u => (u as any).uid !== userUid));
      alert("User deleted from database (auth entry remains)");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${userUid}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isRadio = activeTab === 'radio';
      const maxAllowedSize = isRadio ? 10 * 1024 * 1024 : 2 * 1024 * 1024;
      
      if (file.size > maxAllowedSize) {
        alert(isRadio ? "Audio file too large! Max 10MB." : "File too large! Try < 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (activeTab === 'skins') setSkinImage(result);
        if (activeTab === 'tables') setTableImage(result);
        if (activeTab === 'logos') {
          if (logoScope === 'club') {
            setClubLogoUrl(result);
          } else if (logoScope === 'background') {
            setTempBgUrl(result);
          } else {
            setGameLogoUrl(result);
          }
        }
        if (activeTab === 'emojis') setEmojiUrl(result);
        if (activeTab === 'radio') setTrackUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Card Skins Handlers
  const handleEditSkin = (skin: CardSkin) => {
    setEditingId(skin.id);
    setSkinName(skin.name);
    setSkinPrice(skin.price);
    setSkinRarity(skin.rarity);
    setSkinImage(skin.imageUrl || '');
    setSkinEmoji(skin.emoji || '🃏');
  };

  const handleSaveSkin = async () => {
    if (!skinName || !skinImage) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'cardSkins', editingId), {
          name: skinName,
          price: skinPrice,
          rarity: skinRarity,
          imageUrl: skinImage,
          emoji: skinEmoji
        });
        alert("Skin updated!");
      } else {
        await addDoc(collection(db, 'cardSkins'), {
          name: skinName,
          price: skinPrice,
          rarity: skinRarity,
          imageUrl: skinImage,
          emoji: skinEmoji
        });
        alert("Skin created!");
      }
      handleCancelEdit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'cardSkins');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSkin = async (id: string) => {
    if (!window.confirm("Permanently delete this card skin?")) return;
    try {
      await deleteDoc(doc(db, 'cardSkins', id));
      alert("Deleted!");
    } catch (e) {
      console.error(e);
    }
  };

  // Radio Tracks Handlers
  const handleEditTrack = (track: RadioTrack) => {
    setEditingId(track.id);
    setTrackName(track.name);
    setTrackUrl(track.url || '');
  };

  const handleSaveTrack = async () => {
    if (!trackName) return;
    setSaving(true);
    try {
      if (editingId) {
        const updateData: any = { name: trackName };
        const originalTrack = tracks.find(t => t.id === editingId);
        if (trackUrl && trackUrl !== originalTrack?.url) {
          const chunkSize = 500000;
          const totalLength = trackUrl.length;
          const numChunks = Math.ceil(totalLength / chunkSize);

          updateData.isChunked = true;
          updateData.chunkCount = numChunks;
          updateData.url = "";

          const chunksSnap = await getDocs(collection(db, `radioTracks/${editingId}/chunks`));
          for (const d of chunksSnap.docs) {
            await deleteDoc(doc(db, `radioTracks/${editingId}/chunks`, d.id));
          }

          for (let i = 0; i < numChunks; i++) {
            const chunkData = trackUrl.substring(i * chunkSize, (i + 1) * chunkSize);
            await setDoc(doc(db, `radioTracks/${editingId}/chunks`, `chunk_${i}`), {
              index: i,
              data: chunkData
            });
          }
        }
        await updateDoc(doc(db, 'radioTracks', editingId), updateData);
        alert("Track updated!");
      } else {
        if (!trackUrl) {
          alert("Please upload an audio file first!");
          setSaving(false);
          return;
        }
        const chunkSize = 500000;
        const totalLength = trackUrl.length;
        const numChunks = Math.ceil(totalLength / chunkSize);

        const docRef = await addDoc(collection(db, 'radioTracks'), {
          name: trackName,
          createdAt: Date.now(),
          isChunked: true,
          chunkCount: numChunks,
          url: ""
        });

        for (let i = 0; i < numChunks; i++) {
          const chunkData = trackUrl.substring(i * chunkSize, (i + 1) * chunkSize);
          await setDoc(doc(db, `radioTracks/${docRef.id}/chunks`, `chunk_${i}`), {
            index: i,
            data: chunkData
          });
        }
        alert("Track added to Radio!");
      }
      handleCancelEdit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'radioTracks');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!window.confirm("Permanently delete this radio track and audio chunks?")) return;
    try {
      await deleteDoc(doc(db, 'radioTracks', id));
      const chunksSnap = await getDocs(collection(db, `radioTracks/${id}/chunks`));
      for (const d of chunksSnap.docs) {
        await deleteDoc(doc(db, `radioTracks/${id}/chunks`, d.id));
      }
      alert("Deleted!");
    } catch (e) {
      console.error(e);
    }
  };

  // Emojis Handlers
  const handleEditEmoji = (emoji: EmojiItem) => {
    setEditingId(emoji.id);
    setEmojiName(emoji.name);
    setEmojiPrice(emoji.price);
    setEmojiType(emoji.type);
    setEmojiUrl(emoji.url);
  };

  const handleSaveEmoji = async () => {
    if (!emojiName || !emojiUrl) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'emojiItems', editingId), {
          name: emojiName,
          url: emojiUrl,
          price: emojiPrice,
          type: emojiType
        });
        alert("Emoji updated!");
      } else {
        await addDoc(collection(db, 'emojiItems'), {
          name: emojiName,
          url: emojiUrl,
          price: emojiPrice,
          type: emojiType,
          createdAt: Date.now()
        });
        alert("Emoji added to Shop!");
      }
      handleCancelEdit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'emojiItems');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmoji = async (id: string) => {
    if (!window.confirm("Delete this shop emoji?")) return;
    try {
      await deleteDoc(doc(db, 'emojiItems', id));
      alert("Deleted!");
    } catch (e) {
      console.error(e);
    }
  };

  // Table Skins Handlers
  const handleEditTableRaw = (table: TableSkin) => {
    setEditingId(table.id);
    setTableName(table.name);
    setTablePrice(table.price);
    setTableRarity(table.rarity);
    setTableImage(table.imageUrl || '');
    setTableEmoji(table.emoji || '🎴');
  };

  const handleSaveTable = async () => {
    if (!tableName || !tableImage) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'tableSkins', editingId), {
          name: tableName,
          price: tablePrice,
          rarity: tableRarity,
          imageUrl: tableImage,
          emoji: tableEmoji
        });
        alert("Table layout updated!");
      } else {
        await addDoc(collection(db, 'tableSkins'), {
          name: tableName,
          price: tablePrice,
          rarity: tableRarity,
          imageUrl: tableImage,
          emoji: tableEmoji,
          createdAt: Date.now()
        });
        alert("Table layout deployed to boutique!");
      }
      handleCancelEdit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tableSkins');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!window.confirm("Permanently remove this table skin?")) return;
    try {
      await deleteDoc(doc(db, 'tableSkins', id));
      alert("Deleted!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveGameLogo = async () => {
    if (!gameLogoUrl) {
      alert("Please upload a logo file first!");
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'gameLogos', selectedLogoGame), {
        url: gameLogoUrl,
        updatedAt: Date.now()
      });
      alert(`Updated game logo for ${selectedLogoGame.toUpperCase()} successfully!`);
      handleCancelEdit();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `gameLogos/${selectedLogoGame}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClubPresetLogo = async () => {
    if (!clubLogoUrl) {
      alert("Please upload a logo file first!");
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'clubLogos'), {
        url: clubLogoUrl,
        createdAt: Date.now()
      });
      alert("Deployed preset club logo successfully!");
      handleCancelEdit();
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'clubLogos');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClubPresetLogo = async (id: string) => {
    if (!window.confirm("Permanently delete this club logo preset?")) return;
    try {
      await deleteDoc(doc(db, 'clubLogos', id));
      alert("Deleted club logo preset!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLobbyBg = async () => {
    if (!tempBgUrl) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'config', 'lobbyBackground'), {
        url: tempBgUrl,
        updatedAt: Date.now()
      });
      alert("Home/Lobby background successfully deployed!");
      setLobbyBgState(tempBgUrl);
      setTempBgUrl('');
    } catch (e) {
      console.error(e);
      alert("Failed to save background: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleClearLobbyBg = async () => {
    if (!window.confirm("Are you sure you want to revert to the default classic background?")) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'config', 'lobbyBackground'));
      setLobbyBgState('');
      setTempBgUrl('');
      alert("Reverted to default background successfully!");
    } catch (e) {
      console.error(e);
      alert("Error: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSkinName('');
    setSkinImage('');
    setSkinPrice(1000);
    setSkinRarity('common');
    setSkinEmoji('🃏');
    
    setTrackName('');
    setTrackUrl('');
    
    setEmojiName('');
    setEmojiUrl('');
    setEmojiPrice(500);
    setEmojiType('emoji');

    setTableName('');
    setTableImage('');
    setTablePrice(2500);
    setTableRarity('common');
    setTableEmoji('🎴');

    setGameLogoUrl('');
    setClubLogoUrl('');
    setTempBgUrl('');
    setLogoScope('game');
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black text-white p-8 flex flex-col items-center overflow-y-auto font-sans">
      <div className="w-full max-w-lg pb-32">
        <div className="flex flex-col mb-8 gap-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <button onClick={onBack} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={24} /></button>
                 <h1 className="text-2xl font-black italic tracking-widest text-zinc-300">ADMIN PANEL</h1>
              </div>
              {editingId && (
                <button 
                  onClick={handleCancelEdit} 
                  className="px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500/30"
                >
                  Cancel Edit
                </button>
              )}
           </div>
           <div className="flex bg-white/10 rounded-xl p-1 overflow-x-auto">
              {['skins', 'tables', 'logos', 'users', 'radio', 'emojis', 'sandbox'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => {
                    handleCancelEdit();
                    setActiveAdminTab(tab as any);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-black font-black' : 'text-white/40 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
           </div>
        </div>

        {activeTab === 'skins' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                {editingId ? 'Modify Selected Card Skin' : 'Deploy New Card Skin'}
              </h2>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Skin Name</label>
                <input type="text" value={skinName} onChange={(e) => setSkinName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Emoji Badge</label>
                <input type="text" value={skinEmoji} onChange={(e) => setSkinEmoji(e.target.value)} placeholder="🃏" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Price (Chips)</label>
                <input type="number" value={skinPrice} onChange={(e) => setSkinPrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Rarity</label>
                <select value={skinRarity} onChange={(e) => setSkinRarity(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold capitalize">
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[2/3] bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/55 transition-colors overflow-hidden relative">
                 {skinImage ? <img src={skinImage} alt="" className="w-full h-full object-cover" /> : <Camera size={48} className="opacity-20" />}
                 {!skinImage && <span className="text-[10px] font-bold text-white/40 mt-2">Upload visual preview</span>}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
              <button onClick={handleSaveSkin} disabled={saving} className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow transition-all ${editingId ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-yellow-500 text-black hover:bg-yellow-400'} disabled:opacity-50`}>
                 {saving ? 'SAVING...' : editingId ? 'UPDATE CARD SKIN' : 'CREATE NEW SKIN'}
              </button>
            </div>

            {/* Skins list */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Registered Card Skins ({skins.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {skins.map(sk => (
                  <div key={sk.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 relative">
                    <div className="aspect-[2/3] bg-black border border-white/10 rounded-xl overflow-hidden relative">
                       {sk.imageUrl && <img src={sk.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate leading-none mb-1">{sk.emoji || '🃏'} {sk.name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">{sk.rarity}</span>
                        <span className="text-xs font-black text-white/60">${sk.price}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <button onClick={() => handleEditSkin(sk)} className="py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleDeleteSkin(sk.id)} className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 flex items-center justify-center"><Trash size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'radio' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                {editingId ? 'Modify Selected Radio Track' : 'Load Cybernetic Sound'}
              </h2>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Track Name</label>
                <input type="text" value={trackName} onChange={(e) => setTrackName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="w-full py-12 bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500 transition-colors">
                 {trackUrl ? <Music size={48} className="text-yellow-500 animate-pulse" /> : <Music size={48} className="opacity-20" />}
                 <span className="text-[10px] font-black uppercase mt-2 opacity-40">{trackUrl ? 'Audio file fully loaded' : 'Upload MP3/OGG (Max 10MB)'}</span>
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="audio/*" />
              <button onClick={handleSaveTrack} disabled={saving} className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow ${editingId ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-yellow-500 text-black hover:bg-yellow-400'} disabled:opacity-50`}>
                 {saving ? 'SYNCHRONIZING AUDIO...' : editingId ? 'UPDATE RADIO TRACK' : 'CREATE TRACK'}
              </button>
            </div>

            {/* Radio channels listing */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Registered Audio Channels ({tracks.length})</h3>
              <div className="space-y-3">
                {tracks.map(tc => (
                  <div key={tc.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center">
                        <Music size={18} className="text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate leading-none mb-1 text-white">{tc.name}</p>
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-wider">
                          {tc.chunkCount ? `${tc.chunkCount} parts` : 'No file data'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleEditTrack(tc)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleDeleteTrack(tc.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 flex items-center justify-center"><Trash size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'emojis' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                {editingId ? 'Modify Premium Emoji' : 'Add Premium Emoji'}
              </h2>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Emoji/GIF Name</label>
                <input type="text" value={emojiName} onChange={(e) => setEmojiName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Price (Chips)</label>
                <input type="number" value={emojiPrice} onChange={(e) => setEmojiPrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Type</label>
                <select value={emojiType} onChange={(e) => setEmojiType(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold capitalize">
                  <option value="emoji">Emoji</option>
                  <option value="gif">GIF</option>
                </select>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/55 transition-colors overflow-hidden relative">
                 {emojiUrl ? <img src={emojiUrl} alt="" className="max-w-full max-h-full object-contain" /> : <Smile size={48} className="opacity-20" />}
                 {!emojiUrl && <span className="text-[10px] font-bold text-white/40 mt-2">Upload Emoji or GIF</span>}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*,image/gif" />
              <button onClick={handleSaveEmoji} disabled={saving} className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow ${editingId ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-yellow-500 text-black hover:bg-yellow-400'} disabled:opacity-50`}>
                 {saving ? 'SYNCHRONIZING DATABASE...' : editingId ? 'UPDATE EMOJI' : 'CREATE EMOJI / GIF'}
              </button>
            </div>

            {/* Emojis list */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Premium Emojis Catalog ({emojis.length})</h3>
              <div className="grid grid-cols-3 gap-3">
                {emojis.map(em => (
                  <div key={em.id} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 relative">
                    <div className="w-12 h-12 flex items-center justify-center overflow-hidden bg-black/40 rounded-lg">
                      {em.url && <img src={em.url} alt="" className="max-w-full max-h-full object-contain" />}
                    </div>
                    <div className="text-center min-w-0 w-full mb-1">
                      <p className="font-bold text-[10px] text-white truncate">{em.name}</p>
                      <p className="text-[8px] font-black text-yellow-500 uppercase tracking-wider">${em.price}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1 w-full">
                      <button onClick={() => handleEditEmoji(em)} className="py-1 bg-white/5 hover:bg-white/10 rounded text-[8px] font-black uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleDeleteEmoji(em.id)} className="py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded flex items-center justify-center"><Trash size={10} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'tables' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                {editingId ? 'Modify Table Design' : 'Deploy Premium Table'}
              </h2>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Table Name</label>
                <input type="text" value={tableName} onChange={(e) => setTableName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Emoji Badge</label>
                <input type="text" value={tableEmoji} onChange={(e) => setTableEmoji(e.target.value)} placeholder="🎴" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Price (Chips)</label>
                <input type="number" value={tablePrice} onChange={(e) => setTablePrice(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Rarity</label>
                <select value={tableRarity} onChange={(e) => setTableRarity(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold capitalize">
                  <option value="common">Common</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[3/2] bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/55 transition-colors overflow-hidden relative">
                 {tableImage ? <img src={tableImage} alt="" className="w-full h-full object-cover" /> : <Camera size={48} className="opacity-20" />}
                 {!tableImage && <span className="text-[10px] font-bold text-white/40 mt-2">Upload table layout preview</span>}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
              <button onClick={handleSaveTable} disabled={saving} className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow transition-all ${editingId ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-yellow-500 text-black hover:bg-yellow-400'} disabled:opacity-50`}>
                 {saving ? 'SAVING...' : editingId ? 'UPDATE TABLE SKIN' : 'CREATE TABLE DESIGN'}
              </button>
            </div>

            {/* Tables list */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Premium Tables List ({tableSkins.length})</h3>
              <div className="grid grid-cols-2 gap-4">
                {tableSkins.map(tbl => (
                  <div key={tbl.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2 relative">
                    <div className="aspect-[3/2] bg-black border border-white/10 rounded-xl overflow-hidden relative">
                       {tbl.imageUrl && <img src={tbl.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate leading-none mb-1">{tbl.emoji || '🎴'} {tbl.name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">{tbl.rarity}</span>
                        <span className="text-xs font-black text-white/60">${tbl.price}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      <button onClick={() => handleEditTableRaw(tbl)} className="py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleDeleteTable(tbl.id)} className="py-2 bg-red-500/10 hover:bg-[#a00000]/25 text-red-500 rounded-lg border border-red-500/20 flex items-center justify-center"><Trash size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'logos' ? (
          <div className="space-y-6 animate-fade-in">
            {/* Logo Scope Selector */}
            <div className="flex bg-white/5 p-1 rounded-xl">
              <button 
                onClick={() => {
                  setLogoScope('game');
                  handleCancelEdit();
                }}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${logoScope === 'game' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
              >
                Game Arena
              </button>
              <button 
                onClick={() => {
                  setLogoScope('club');
                  handleCancelEdit();
                }}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${logoScope === 'club' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
              >
                Club Presets
              </button>
              <button 
                onClick={() => {
                  setLogoScope('background');
                  handleCancelEdit();
                }}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${logoScope === 'background' ? 'bg-yellow-500 text-black' : 'text-white/40 hover:text-white'}`}
              >
                Home Background
              </button>
            </div>

            {logoScope === 'game' ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                  Upload Game Arena Logo
                </h2>
                <div>
                  <label className="block text-[10px] font-black uppercase text-white/40 mb-2">Select Game Arena Type</label>
                  <select value={selectedLogoGame} onChange={(e) => setSelectedLogoGame(e.target.value as any)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 text-sm font-bold capitalize">
                    <option value="uno">UNO</option>
                    <option value="joker">JOKER</option>
                    <option value="dama">DAMA</option>
                  </select>
                </div>
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[2/1] bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/55 transition-colors overflow-hidden relative">
                   {gameLogoUrl ? <img src={gameLogoUrl} alt="" className="max-w-[90%] max-h-[80%] object-contain" /> : <ImageIcon size={48} className="opacity-20" />}
                   {!gameLogoUrl && <span className="text-[10px] font-bold text-white/40 mt-2">Upload visual asset for {selectedLogoGame.toUpperCase()}</span>}
                </div>
                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                <button onClick={handleSaveGameLogo} disabled={saving} className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow transition-all bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50">
                   {saving ? 'SAVING LOGO...' : 'DEPLOY LOGO ASSET'}
                </button>
              </div>
            ) : logoScope === 'club' ? (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                  <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                    Add Club Preset Logo
                  </h2>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-square bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/55 transition-colors overflow-hidden relative max-w-[200px] mx-auto">
                     {clubLogoUrl ? <img src={clubLogoUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={48} className="opacity-20" />}
                     {!clubLogoUrl && <span className="text-[10px] font-bold text-white/40 mt-2">Upload Image File</span>}
                  </div>
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                  <button onClick={handleSaveClubPresetLogo} disabled={saving} className="w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow transition-all bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50">
                     {saving ? 'SAVING LOGO...' : 'ADD CLUB PRESET LOGO'}
                  </button>
                </div>

                {/* Club logos list */}
                <div className="pt-6 border-t border-white/10 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Preset Club Logos ({clubLogos.length})</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {clubLogos.map(cl => (
                      <div key={cl.id} className="bg-white/5 border border-white/10 rounded-xl p-2 flex flex-col items-center gap-2 relative">
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-black/40 border border-white/10">
                          {cl.url && <img src={cl.url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <button onClick={() => handleDeleteClubPresetLogo(cl.id)} className="w-full py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-[8px] font-black uppercase flex items-center justify-center"><Trash size={10} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 animate-fade-in">
                 <h2 className="text-sm font-black uppercase text-yellow-500 tracking-wider">
                   Home Background Configuration
                 </h2>
                 <p className="text-[10px] text-zinc-400">
                   Upload a custom high-resolution image file to set as the background for the Lobby, Home, and Shop views.
                 </p>
                 <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-[2/1] bg-black/40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-yellow-500/55 transition-colors overflow-hidden relative">
                    {tempBgUrl ? (
                      <img src={tempBgUrl} alt="Lobby background to upload" className="w-full h-full object-cover" />
                    ) : lobbyBgState ? (
                      <img src={lobbyBgState} alt="Current lobby background" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={48} className="opacity-25" />
                    )}
                    {!tempBgUrl && !lobbyBgState && (
                      <span className="text-[10px] font-black uppercase hover:text-yellow-500 text-white/40 mt-2">Upload Custom Image File</span>
                    )}
                 </div>
                 <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                 
                 <div className="flex gap-3">
                   <button 
                     onClick={handleSaveLobbyBg} 
                     disabled={saving || !tempBgUrl} 
                     className="flex-grow py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow transition-all bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50"
                   >
                      {saving ? 'DEPLOING...' : 'APPLY WORLD BACKGROUND'}
                   </button>
                   {lobbyBgState && (
                     <button 
                       onClick={handleClearLobbyBg} 
                       className="px-6 py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow transition-all bg-red-650 text-white hover:bg-red-750"
                     >
                       RESET
                     </button>
                   )}
                 </div>
              </div>
            )}
          </div>
        ) : activeTab === 'sandbox' ? (
          <GameSandbox />
        ) : (
          <div className="space-y-4">
             {users.map(u => (
               <div key={(u as any).uid} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10">
                     <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.displayName}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                     <p className="font-black text-xs uppercase tracking-widest leading-none mb-1">{u.displayName}</p>
                     <p className="text-[10px] text-white/40 leading-none">{(u as any).email}</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleUpdateChips((u as any).uid, u.chips)} className="px-3 py-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-xl text-[9px] font-black uppercase">${u.chips}</button>
                     <button onClick={() => handleUpdateWins((u as any).uid, u.totalWins)} className="px-3 py-2 bg-white/10 text-white/60 border border-white/20 rounded-xl text-[9px] font-black uppercase">{u.totalWins} W</button>
                     <button onClick={() => handleDeleteUser((u as any).uid)} className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl"><X size={14} /></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShopView({ user, profile, onBack, setActiveTab, language, lobbyBg }: { user: User, profile: UserProfile, onBack: () => void, setActiveTab?: (tab: any) => void, language: Language, lobbyBg?: string }) {
  const t = translations[language];
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const [emojis, setEmojis] = useState<EmojiItem[]>([]);
  const [tableSkins, setTableSkins] = useState<TableSkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [showPassInput, setShowPassInput] = useState(false);
  const [previewSkin, setPreviewSkin] = useState<CardSkin | null>(null);
  const [previewTable, setPreviewTable] = useState<TableSkin | null>(null);
  const [activeShopTab, setActiveShopTab] = useState<'skins' | 'chips' | 'emojis' | 'tables'>('skins');

  useEffect(() => {
    const unsubscribeSkins = onSnapshot(collection(db, 'cardSkins'), (snapshot) => {
      setSkins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardSkin)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cardSkins');
    });
    const unsubscribeEmojis = onSnapshot(collection(db, 'emojiItems'), (snapshot) => {
      setEmojis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmojiItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'emojiItems');
    });
    const unsubscribeTables = onSnapshot(collection(db, 'tableSkins'), (snapshot) => {
      setTableSkins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableSkin)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tableSkins');
    });
    return () => {
      unsubscribeSkins();
      unsubscribeEmojis();
      unsubscribeTables();
    };
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
      soundManager.playShopBuy();
      alert(`Purchased ${skin.name}!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleBuyTable = async (table: TableSkin) => {
    if (!user || !profile) return;
    if (profile.ownedTableSkins?.includes(table.id)) {
      alert("Already owned!");
      return;
    }
    if (profile.chips < table.price) {
      alert("Insufficient chips!");
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        chips: profile.chips - table.price,
        ownedTableSkins: [...(profile.ownedTableSkins || []), table.id]
      });
      soundManager.playShopBuy();
      alert(`Purchased ${table.name}!`);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleBuyEmoji = async (emoji: EmojiItem) => {
    if (!user || !profile) return;
    if (profile.ownedEmojis?.includes(emoji.id)) {
      alert("Already owned!");
      return;
    }
    if (profile.chips < emoji.price) {
      alert("Insufficient chips!");
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, {
        chips: profile.chips - emoji.price,
        ownedEmojis: [...(profile.ownedEmojis || []), emoji.id]
      });
      soundManager.playShopBuy();
      alert("Emoji purchased!");
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleCoinPurchase = async (amount: number) => {
    if (!user) return;
    const pass = prompt(`Purchase ${amount.toLocaleString()} chips. Enter Password:`);
    if (pass === 'EMAD8912') {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          chips: (profile.chips || 0) + amount
        });
        alert(`Successfully added ${amount} chips!`);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    } else {
      alert("Incorrect password!");
    }
  };

  const coinPackages = [
    { amount: 500, price: "$0.99" },
    { amount: 4000, price: "$4.99" },
    { amount: 12000, price: "$12.99" },
  ];

  const checkAdmin = () => {
    if (adminPass === 'EMAD8912') {
      setShowAdmin(true);
      setShowPassInput(false);
    } else {
      alert("Incorrect password");
    }
  };

  if (showAdmin) return <AdminView onBack={() => setShowAdmin(false)} lobbyBg={lobbyBg} />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black font-sans relative pb-24 flex flex-col pt-[max(env(safe-area-inset-top),_16px)]">
      <header className="flex items-center justify-between px-4 py-3 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-20 bg-white">
         <button onClick={onBack} className="p-2 -ml-2 text-gray-900 border-none outline-none"><ChevronLeft size={24} weight="bold" /></button>
         <h1 className="text-lg font-black font-sans tracking-tight pt-1">Decoration shop</h1>
         <button className="flex items-center gap-1.5 bg-[#ff4f64] text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm relative overflow-hidden" onClick={() => setActiveTab && setActiveTab('profile')}>
            <User size={14} weight="bold" /> Mine<span className="w-2.5 h-2.5 bg-red-500 border-2 border-[#ff4f64] rounded-full absolute top-0.5 right-0.5 shadow-sm" />
         </button>
      </header>

      <div className="flex px-4 gap-6 text-sm font-black text-gray-400 overflow-x-auto no-scrollbar shrink-0 bg-white relative pb-0 shadow-sm z-10 tracking-widest">
        <button onClick={() => setActiveShopTab('skins')} className={`py-4 relative whitespace-nowrap transition-colors ${activeShopTab === 'skins' ? 'text-black' : ''}`}>Headframe{activeShopTab === 'skins' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#1b5df2]" />}</button>
        <button onClick={() => setActiveShopTab('tables')} className={`py-4 relative whitespace-nowrap transition-colors ${activeShopTab === 'tables' ? 'text-black' : ''}`}>Fantasy profile{activeShopTab === 'tables' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#1b5df2]" />}</button>
        <button onClick={() => setActiveShopTab('emojis')} className={`py-4 relative whitespace-nowrap transition-colors ${activeShopTab === 'emojis' ? 'text-black' : ''}`}>Entrance{activeShopTab === 'emojis' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#1b5df2]" />}</button>
        <button onClick={() => setActiveShopTab('chips')} className={`py-4 relative whitespace-nowrap transition-colors flex items-center gap-1 ${activeShopTab === 'chips' ? 'text-black' : ''}`}>Chips {activeShopTab === 'chips' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-[#1b5df2]" />}<ChevronDown size={14} className="ml-1" /></button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
           <RefreshCcw className="animate-spin text-[#8b0000]" size={40} />
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto z-10">
          {activeShopTab === 'skins' && (
            <div className="grid grid-cols-3 gap-x-3 gap-y-6 pt-2">
              {skins.map(skin => (
                <div key={skin.id} className="flex flex-col items-center">
                   <div 
                     className="w-full aspect-square bg-gradient-to-b from-[#11162d] to-[#252f53] rounded-[24px] rounded-t-[10px] relative flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_8px_16px_rgba(37,47,83,0.3)] mb-3"
                     onClick={() => handleBuy(skin)}
                   >
                      <img src={skin.imageUrl} className="w-[70%] max-h-[70%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-full border-[3px] border-white/20" />
                   </div>
                   <div className="relative z-10 w-[85%] bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] py-1.5 flex items-center justify-center gap-1 border border-gray-100">
                      <Star size={12} weight="fill" className="text-[#ffcc00]" />
                      <span className="text-[#ff9500] font-black text-xs">{skin.price}</span>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeShopTab === 'emojis' && (
            <div className="grid grid-cols-3 gap-x-3 gap-y-6 pt-2">
              {emojis.map(emoji => (
                <div key={emoji.id} className="flex flex-col items-center">
                   <div 
                     className="w-full aspect-square bg-gradient-to-b from-[#11162d] to-[#252f53] rounded-[24px] rounded-t-[10px] relative flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_8px_16px_rgba(37,47,83,0.3)] mb-3"
                     onClick={() => handleBuyEmoji(emoji)}
                   >
                      <img src={emoji.url} className="w-1/2 max-h-[50%] object-contain drop-shadow" />
                   </div>
                   <div className="relative z-10 w-[85%] bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] py-1.5 flex items-center justify-center gap-1 border border-gray-100">
                      <Star size={12} weight="fill" className="text-[#ffcc00]" />
                      <span className="text-[#ff9500] font-black text-xs">{emoji.price}</span>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeShopTab === 'tables' && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-2">
              {tableSkins.map(table => (
                <div key={table.id} className="flex flex-col items-center">
                   <div 
                     className="w-full aspect-square bg-[#11162d] rounded-[32px] rounded-t-[12px] relative flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_8px_16px_rgba(37,47,83,0.3)] mb-3"
                     onClick={() => handleBuyTable(table)}
                   >
                      <img src={table.imageUrl} className="w-[95%] h-[95%] object-cover rounded-[28px] overflow-hidden bg-zinc-900" />
                   </div>
                   <div className="relative z-10 w-[85%] bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] py-2 flex items-center justify-center gap-1 border border-gray-100">
                      <Star size={14} weight="fill" className="text-[#ffcc00]" />
                      <span className="text-[#ff9500] font-black text-sm leading-none mt-0.5">{table.price}</span>
                   </div>
                </div>
              ))}
              {tableSkins.length === 0 && (
                <div className="col-span-full py-20 text-center border-4 border-dashed border-[#868378] rounded-[48px] w-full max-w-md mx-auto">
                   <p className="text-[#8b0000] font-black uppercase tracking-widest text-xs">NO TABLES IN BOUTIQUE YET</p>
                </div>
              )}
            </div>
          )}

          {activeShopTab === 'chips' && (
            <div className="grid grid-cols-3 gap-x-3 gap-y-6 pt-2">
              {coinPackages.map(pkg => (
                <div key={pkg.amount} className="flex flex-col items-center">
                   <div 
                     className="w-full aspect-square bg-[#ffcc00] rounded-[24px] rounded-t-[10px] relative flex items-center justify-center overflow-hidden cursor-pointer shadow-[0_8px_16px_rgba(37,47,83,0.3)] border border-yellow-400 mb-3"
                     onClick={() => handleCoinPurchase(pkg.amount)}
                   >
                      <Coins size={36} className="text-yellow-700 drop-shadow-sm" />
                   </div>
                   <div className="relative z-10 w-[85%] bg-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.05)] py-1.5 flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-[#ff9500] font-black text-[10px] leading-tight flex items-center gap-1"><Star size={10} weight="fill" className="text-[#ffcc00]" /> {pkg.amount.toLocaleString()}</span>
                      <span className="text-gray-400 font-extrabold text-[8px] leading-tight">{pkg.price}</span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 h-[68px] bg-white flex flex-col justify-center px-6 z-50 pointer-events-none shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
         <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-gray-900 font-extrabold text-[11px] uppercase tracking-widest mt-0.5">Balance:</span>
            <div className="flex items-center bg-gray-100 border border-gray-200 rounded-full pl-1.5 pr-1.5 py-1">
               <Star size={18} weight="fill" className="text-[#ffcc00] mr-1.5 drop-shadow-sm" />
               <span className="font-black text-gray-900 tracking-tight mr-2.5 text-sm">{profile.chips?.toLocaleString()}</span>
               <button className="w-[18px] h-[18px] bg-[#32d74b] text-white rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(50,215,75,0.4)] font-black text-sm leading-none pt-0.5 cursor-pointer flex-shrink-0" onClick={() => setActiveShopTab('chips')}>+</button>
            </div>
         </div>
      </div>
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

function ProfileView({ user, profile, onBack, onLogout, setActiveTab, language, onOpenSettings, onEditProfile }: { user: User, profile: UserProfile, onBack: () => void, onLogout: () => void, setActiveTab: (tab: any) => void, language: Language, onOpenSettings: () => void, onEditProfile: () => void }) {
  const t = translations[language];
  const [showAvatars, setShowAvatars] = useState(false);
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    const idToCopy = profile.shortId || user.uid;
    try {
      const el = document.createElement('textarea');
      el.value = idToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  };

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

  const ownedSkinsData = skins.filter(s => profile.ownedSkins?.includes(s.id));

  return (
    <div className={`min-h-screen bg-[#1c1c1c] text-white p-6 font-sans flex flex-col items-center pb-32 overflow-y-auto ${language === 'ku' ? 'rtl text-right' : ''}`}>
      <header className="w-full max-w-lg mb-8 flex justify-end gap-2 px-2 z-20">
         <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
           <Settings size={22} className="text-zinc-400" />
         </button>
         <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
           <X size={22} className="text-zinc-400" />
         </button>
      </header>

      <div className="flex flex-col items-center mb-10 w-full max-w-lg">
         <div className="relative mb-4 group">
            <div className="w-40 h-40 rounded-full border-[6px] border-zinc-800 shadow-2xl p-1 bg-gradient-to-b from-zinc-700 to-zinc-900 group-hover:scale-105 transition-transform duration-500">
               <img 
                 src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}`} 
                 alt="Profile" 
                 className="w-full h-full rounded-full object-cover" 
               />
            </div>
       </div>

       <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2">
               <h2 className="text-3xl font-black uppercase tracking-tight">{profile.displayName}</h2>
               <button onClick={onEditProfile} className="text-zinc-500 hover:text-white"><Edit size={16} /></button>
               {profile.country && COUNTRY_MAP[profile.country] ? (
                  <span className="flex items-center gap-1.5 bg-zinc-850 px-2 rounded-full border border-white/5 text-[9px] font-black uppercase tracking-wider text-zinc-300">
                    <span>{COUNTRY_MAP[profile.country].flag}</span>
                    <span>{COUNTRY_MAP[profile.country].name}</span>
                  </span>
                ) : (
                  <span className="text-lg">🌍</span>
                )}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1">
               <p className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">ID: {profile.shortId || '-------'}</p>
               <button 
                 onClick={handleCopyId}
                 className="p-1 px-2.5 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:border-white/10 active:scale-95 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                 title="Copy ID"
               >
                 {copied ? (
                   <>
                     <Check size={11} className="text-emerald-500 animate-[bounce_0.2s_ease-out-in]" />
                     <span className="text-emerald-400">Copied</span>
                   </>
                 ) : (
                   <>
                     <Copy size={11} />
                     <span>Copy</span>
                   </>
                 )}
               </button>
            </div>
            <div className="mt-4 flex flex-col items-center justify-center gap-1">
               <div className="relative w-[52px] h-[52px] flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <img src={levelLogoImage} className="absolute inset-0 w-full h-full object-cover rounded-full" alt="Level Badge" />
                  <span className="relative z-10 text-white font-black text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-0.5">{profile.level || 1}</span>
               </div>
               <span className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest leading-none drop-shadow-sm">{t.level}</span>
            </div>
         </div>
      </div>

      <div className="w-full max-w-lg grid grid-cols-2 gap-3 mb-8">
         <button className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800/50 transition-colors group">
            <div className="w-12 h-12 mb-3 flex items-center justify-center text-blue-400"><Gift size={24} /></div>
            <span className="text-sm font-bold">{t.sendGift}</span>
         </button>
         <button className="flex flex-col items-center justify-center p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:bg-zinc-800/50 transition-colors group" onClick={() => setActiveTab('my-items')}>
            <div className="w-12 h-12 mb-3 flex items-center justify-center text-purple-400"><ShoppingBag size={24} /></div>
            <span className="text-sm font-bold">{t.myItems}</span>
         </button>
      </div>

      <div className="w-full max-w-lg mb-8">
         <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-lg font-black">{t.badges}</h3>
            <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg">{t.allBadges}</button>
         </div>
         <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar opacity-30 grayscale cursor-not-allowed">
               {Array.from({ length: 8 }).map((_, i) => (
                 <div key={i} className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                    <Star size={20} />
                 </div>
               ))}
            </div>
            <div className="mt-4 p-4 bg-zinc-800/50 rounded-2xl flex items-center gap-3 border border-zinc-700/50">
               <div className="flex-1 text-[10px] font-bold text-zinc-400 text-center uppercase tracking-wider">{t.verifyAccount}</div>
            </div>
         </div>
      </div>

      <div className="w-full max-w-lg mb-8">
         <div className="flex items-center justify-between px-2 mb-4">
            <h3 className="text-lg font-black">{t.gifts}</h3>
         </div>
         <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
            <div className="flex gap-3 mb-6">
               <button className="flex-1 py-3 bg-white/5 rounded-xl font-bold text-sm text-zinc-300">{t.giftsWall}</button>
               <button className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"><Gift size={16} /> {t.sendGift}</button>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="aspect-square bg-white/5 rounded-xl border border-white/5" />
               ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">{t.pointsReceived}</p>
                  <p className="text-lg font-black text-green-500">0</p>
               </div>
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">{t.pointsSent}</p>
                  <p className="text-lg font-black text-blue-500">0</p>
               </div>
            </div>
         </div>
      </div>

      <div id="player-num-marker" className="mt-4 mb-20 text-center">
         <p className="text-xs font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1">{t.playerNumber}: {user.uid.slice(0, 10).replace(/[^0-9]/g, '')}</p>
      </div>
      <TapBar activeTab="profile" setActiveTab={setActiveTab} language={language} />
    </div>
  );
}

function LeaderboardView({ profile, setActiveTab, language }: { profile: UserProfile, setActiveTab: (tab: any) => void, language: Language }) {
  const [topPlayers, setTopPlayers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('totalWins', 'desc'), limit(25));
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
    <div className={`min-h-screen bg-[#1c1c1c] text-white p-6 font-sans flex flex-col items-center pb-32 overflow-y-auto ${language === 'ku' ? 'rtl text-right' : ''}`}>
      <header className="w-full max-w-lg mb-8 text-center z-10 pt-4">
        <h1 className="text-4xl font-black uppercase tracking-tight text-white">{t.eliteList}</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-[1px] w-8 bg-zinc-800" />
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t.topPlayers}</span>
          <div className="h-[1px] w-8 bg-zinc-800" />
        </div>
      </header>

      <div className="w-full max-w-lg z-10 space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center">
            <RefreshCcw className="animate-spin text-zinc-800" size={32} />
          </div>
        ) : topPlayers.length === 0 ? (
          <div className="py-12 text-center bg-zinc-900/20 border border-dashed border-white/5 rounded-3xl">
             <p className="text-sm font-bold text-zinc-500">No players listed in the syndicate.</p>
          </div>
        ) : (
          topPlayers.map((player, i) => (
            <motion.div 
              key={player.uid || i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all
                ${i === 0 ? 'bg-zinc-800/80 border-zinc-700 shadow-xl scale-[1.02]' : 'bg-zinc-900/40 border-white/5'}
              `}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-zinc-400 text-black' : i === 2 ? 'bg-orange-700 text-white' : 'text-zinc-600'}
              `}>
                {i + 1}
              </div>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800">
                 <img src={player.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.displayName}`} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-zinc-100 leading-tight">{player.displayName}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{player.totalWins} {t.victories}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-sm">
                   <Trophy size={14} className="text-zinc-600" />
                   <span>{player.totalWins}</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <TapBar activeTab="leaderboard" setActiveTab={setActiveTab} language={language} />
    </div>
  );
}

function TapBar({ activeTab, setActiveTab, language }: { activeTab: string, setActiveTab: (tab: any) => void, language: Language }) {
  const t = translations[language];
  const tabs = [
    { id: 'shop', icon: <ShoppingBag size={24} />, label: t.store },
    { id: 'leaderboard', icon: <LayoutGrid size={24} />, label: t.games },
    { id: 'home', icon: <div className="p-3 bg-gradient-to-b from-green-500 to-green-700 rounded-full shadow-[0_0_20px_rgba(26,123,62,0.6)] border-2 border-white/20 -translate-y-4 relative">
       <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">🤡</div>
       <Play size={24} className="text-white fill-current translate-y-0.5" />
    </div>, label: t.home },
    { id: 'clubs', icon: <Users size={24} />, label: t.clubs },
    { id: 'profile', icon: <UserIcon size={24} />, label: t.vault },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[300] bg-[#121212]/95 backdrop-blur-xl border-t border-white/5 pb-8 pt-2">
      <div className="max-w-md mx-auto flex justify-between items-center px-4">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative flex flex-col items-center gap-1 transition-all duration-300 flex-1
              ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            <div className="relative">
               {tab.id === 'home' ? (
                 tab.icon
               ) : (
                 <motion.div animate={{ scale: activeTab === tab.id ? 1.1 : 1 }}>
                    {tab.icon}
                 </motion.div>
               )}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-tight transition-all ${tab.id === 'home' ? '-mt-2' : ''}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && tab.id !== 'home' && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute -bottom-1 w-8 h-1 bg-white rounded-full blur-[2px]"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ language, setLanguage, onBack, user, profile }: { language: Language, setLanguage: (l: Language) => void, onBack: () => void, user: any, profile: UserProfile }) {
  const t = translations[language];
  const countries = [
    { code: 'Kurdistan', name: '☀ Kurdistan' },
    { code: 'USA', name: '🇺🇸 United States' },
    { code: 'UK', name: '🇬🇧 United Kingdom' },
    { code: 'Germany', name: '🇩🇪 Germany' },
    { code: 'Canada', name: '🇨🇦 Canada' },
    { code: 'Sweden', name: '🇸🇪 Sweden' },
    { code: 'Iraq', name: '🇮🇶 Iraq' },
    { code: 'Turkey', name: '🇹🇷 Turkey' }
  ];

  const handleCountryChange = async (val: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { country: val });
      alert("Country updated successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0a0a0b] text-white p-6 sm:p-8 font-sans flex flex-col items-center pb-32 overflow-y-auto ${language === 'ku' ? 'rtl text-right' : ''}`}>
       <FallingCards />
       <header className="w-full max-w-lg flex items-center gap-4 mb-12 z-20">
         <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shadow-sm"><X size={24} /></button>
         <h1 className="text-2xl font-black uppercase tracking-widest text-[#8b0000]">{t.settings}</h1>
       </header>

       <div className="w-full max-w-lg bg-zinc-900/60 border border-white/10 p-8 rounded-[40px] shadow-2xl z-10 space-y-8 backdrop-blur-md">
          {/* Language Selection */}
          <div>
             <label className="text-[10px] font-black text-white/40 uppercase block tracking-widest mb-4">{t.language}</label>
             <div className="grid grid-cols-2 gap-4">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`py-4 rounded-2xl font-bold border-2 transition-all ${language === 'en' ? 'bg-[#8b0000] text-white border-[#8b0000]' : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'}`}
               >
                 English
               </button>
               <button 
                 onClick={() => setLanguage('ku')}
                 className={`py-4 rounded-2xl font-bold border-2 transition-all ${language === 'ku' ? 'bg-[#8b0000] text-white border-[#8b0000]' : 'bg-white/5 text-white/60 border-transparent hover:bg-white/10'}`}
               >
                 کوردی
               </button>
             </div>
          </div>

          {/* Country Selection */}
          <div className="pt-6 border-t border-white/5">
             <label className="text-[10px] font-black text-white/40 uppercase block tracking-widest mb-4">Location / Country</label>
             <select 
               value={profile?.country || ''}
               onChange={(e) => handleCountryChange(e.target.value)}
               className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-[#8b0000] text-sm text-white font-bold cursor-pointer"
             >
               <option value="" disabled>Select your Country</option>
               {countries.map(c => (
                 <option key={c.code} value={c.code} className="text-white bg-zinc-950 font-bold">
                   {c.name}
                 </option>
               ))}
             </select>
          </div>

          {/* Version */}
          <div className="pt-8 border-t border-white/5 text-center flex flex-col items-center">
             <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">BUILD SYSTEM ACTIVE</span>
             <span className="text-xs font-mono text-[#8b0000] font-bold mt-1 tracking-widest uppercase">Version 1.2.5</span>
          </div>
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

function LobbyView({ user, profile, onStartSearch, onJoin, onLogout, onCreate, setActiveTab, onClaimDaily, language, gameLogos, lobbyBg }: any) {
  const t = translations[language];
  const [games, setGames] = useState<Game[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGameForJoin, setSelectedGameForJoin] = useState<Game | null>(null);
  const [joinPassword, setJoinPassword] = useState('');
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedType, setSelectedType] = useState<'uno' | 'joker' | 'dama'>('uno');

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const handleUserSearch = async (val: string) => {
    setUserSearchQuery(val);
    if (!val.trim()) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter((u: any) => {
        const queryLower = val.toLowerCase();
        const dispMatch = u.displayName?.toLowerCase().includes(queryLower);
        const idMatch = u.shortId?.includes(queryLower);
        return dispMatch || idMatch;
      });
      setUserSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

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
    <div 
      className="min-h-screen bg-black p-4 sm:p-8 font-sans flex flex-col relative overflow-hidden pb-32"
      style={{ backgroundImage: `url(${lobbyBg || homeBgBlackImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <header className="w-full max-w-lg mb-4 flex justify-between items-center px-4 pt-6 z-20 mx-auto">
         <h1 className="text-white text-2xl font-bold tracking-tight">Casual Games</h1>
         <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-all rounded-full text-white text-sm font-medium flex items-center gap-1 border border-white/5 shadow-md">
            Private room <Plus size={16} />
         </button>
      </header>

      <div className="flex-1 w-full max-w-lg mx-auto z-20 pb-10 px-4 mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
           {/* Card 1: Still Standing (OONO) */}
           <div 
             onClick={() => onStartSearch('uno')}
             className="relative group cursor-pointer"
           >
             <div className="w-full aspect-[4/5] rounded-[18px] bg-gradient-to-b from-[#29b6f6] to-[#0277bd] p-[3px] shadow-lg relative overflow-hidden transition-transform duration-300 active:scale-95">
                <div className="w-full h-full rounded-[15px] bg-[#4fc3f7] flex flex-col items-center justify-end relative shadow-inner overflow-hidden top-glow">
                   <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />
                   
                   <div className="flex-1 flex items-center justify-center w-full px-2 pt-4 relative z-20 mb-8">
                      {gameLogos?.uno ? (
                        <img src={gameLogos?.uno} alt="Uno" className="w-auto h-full object-contain drop-shadow-md" />
                      ) : (
                        <div className="text-3xl sm:text-4xl font-display font-black text-white italic drop-shadow-md">OONO</div>
                      )}
                   </div>
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-8 pb-3 z-20 flex items-center justify-center">
                     <h2 className="text-white font-black text-lg drop-shadow-md tracking-tight">Still Standing</h2>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-1 -left-2 bg-[#ff1744] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-30 tracking-widest border border-white/20">NEW</div>
           </div>

           {/* Card 2: KonKan (Joker) */}
           <div 
             onClick={() => onStartSearch('joker')}
             className="relative group cursor-pointer"
           >
             <div className="w-full aspect-[4/5] rounded-[18px] bg-gradient-to-b from-[#d81b60] to-[#880e4f] p-[3px] shadow-lg relative overflow-hidden transition-transform duration-300 active:scale-95">
                <div className="w-full h-full rounded-[15px] bg-[#ec407a] flex flex-col items-center justify-end relative shadow-inner overflow-hidden top-glow">
                   <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />
                   
                   <div className="flex-1 flex items-center justify-center w-full px-2 pt-4 relative z-20 mb-8">
                      {gameLogos?.joker ? (
                        <img src={gameLogos?.joker} alt="Joker" className="w-auto h-full object-contain drop-shadow-md" />
                      ) : (
                         <div className="flex flex-col items-center justify-center pt-2">
                           <div className="text-4xl text-yellow-300 drop-shadow-md relative z-10">★</div>
                           <div className="text-xl text-yellow-300 font-display font-black italic drop-shadow-md tracking-wide mt-2">JOKER</div>
                         </div>
                      )}
                   </div>
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-8 pb-3 z-20 flex items-center justify-center">
                     <h2 className="text-white font-black text-lg drop-shadow-md tracking-tight">KonKan</h2>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-1 -left-2 bg-[#ff1744] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-30 tracking-widest border border-white/20">NEW</div>
           </div>

           {/* Card 3: Dobble */}
           <div 
             onClick={() => onStartSearch('dobble')}
             className="relative group cursor-pointer"
           >
             <div className="w-full aspect-[4/5] rounded-[18px] bg-gradient-to-b from-[#4caf50] to-[#1b5e20] p-[3px] shadow-lg relative overflow-hidden transition-transform duration-300 active:scale-95">
                <div className="w-full h-full rounded-[15px] bg-[#66bb6a] flex flex-col items-center justify-end relative shadow-inner overflow-hidden top-glow">
                   <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />
                   
                   <div className="flex-1 flex items-center justify-center w-full px-2 pt-4 relative z-20 mb-8">
                      {gameLogos?.dobble ? (
                        <img src={gameLogos?.dobble} alt="Dobble" className="w-auto h-full object-contain drop-shadow-md" />
                      ) : (
                         <div className="flex items-center justify-center gap-1">
                           <Star size={36} className="text-yellow-300 drop-shadow-md" fill="currentColor" />
                           <Smile size={36} className="text-pink-200 drop-shadow-md" />
                         </div>
                      )}
                   </div>
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-8 pb-3 z-20 flex items-center justify-center">
                     <h2 className="text-white font-black text-lg drop-shadow-md tracking-tight">Dobble</h2>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-1 -left-2 bg-[#ff1744] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-30 tracking-widest border border-white/20">NEW</div>
           </div>

           {/* Card 4: Domino 50 (Dama) */}
           <div 
             onClick={() => onStartSearch('dama')}
             className="relative group cursor-pointer"
           >
             <div className="w-full aspect-[4/5] rounded-[18px] bg-gradient-to-b from-[#ff5722] to-[#bf360c] p-[3px] shadow-lg relative overflow-hidden transition-transform duration-300 active:scale-95">
                <div className="w-full h-full rounded-[15px] bg-[#ff7043] flex flex-col items-center justify-end relative shadow-inner overflow-hidden top-glow">
                   <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />
                   
                   <div className="flex-1 flex items-center justify-center w-full px-2 pt-4 pb-2 relative z-20 mb-8">
                      {gameLogos?.dama ? (
                        <img src={gameLogos?.dama} alt="Dama" className="w-auto h-full object-contain drop-shadow-md" />
                      ) : (
                         <div className="flex gap-1 -rotate-12 drop-shadow-lg">
                           <div className="w-8 h-12 bg-white rounded-md border border-[#ccc] flex flex-col justify-between p-[2px] shadow-xl">
                             <div className="grid grid-cols-2 gap-[2px] content-start h-1/2 border-b-2 border-gray-300 pb-1">
                               <div className="w-1.5 h-1.5 bg-black rounded-full" /><div className="w-1.5 h-1.5 bg-black rounded-full" />
                               <div className="w-1.5 h-1.5 bg-black rounded-full" /><div className="w-1.5 h-1.5 bg-black rounded-full" />
                             </div>
                             <div className="h-1/2 pt-1 flex justify-center"></div>
                           </div>
                         </div>
                      )}
                   </div>
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-8 pb-3 z-20 flex items-center justify-center">
                     <h2 className="text-white font-black text-lg drop-shadow-md tracking-tight">Domino 50</h2>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-1 -left-2 bg-[#ff1744] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-30 tracking-widest border border-white/20">NEW</div>
           </div>

           {/* Card 5: 8 Ball */}
           <div 
             onClick={() => alert("Coming Soon!")}
             className="relative group cursor-pointer"
           >
             <div className="w-full aspect-[4/5] rounded-[18px] bg-gradient-to-b from-[#2196f3] to-[#0d47a1] p-[3px] shadow-lg relative overflow-hidden transition-transform duration-300 active:scale-95">
                <div className="w-full h-full rounded-[15px] bg-[#42a5f5] flex flex-col items-center justify-end relative shadow-inner overflow-hidden top-glow">
                   <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />
                   
                   <div className="flex-1 flex items-center justify-center w-full px-2 pt-4 relative z-20 mb-8">
                      <div className="w-16 h-16 bg-[#1a1a1a] rounded-full shadow-lg border-[3px] border-gray-800 flex items-center justify-center relative drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                         <div className="absolute top-1 left-2 w-5 h-2.5 bg-white/40 rounded-full rotate-45 blur-[1px]" />
                         <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                           <span className="text-black font-black text-xs">8</span>
                         </div>
                      </div>
                   </div>
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-8 pb-3 z-20 flex items-center justify-center">
                     <h2 className="text-white font-black text-lg drop-shadow-md tracking-tight">8 Ball</h2>
                   </div>
                </div>
             </div>
           </div>

           {/* Card 6: Backgammon */}
           <div 
             onClick={() => alert("Coming Soon!")}
             className="relative group cursor-pointer"
           >
             <div className="w-full aspect-[4/5] rounded-[18px] bg-gradient-to-b from-[#ff9800] to-[#e65100] p-[3px] shadow-lg relative overflow-hidden transition-transform duration-300 active:scale-95">
                <div className="w-full h-full rounded-[15px] bg-[#ffb74d] flex flex-col items-center justify-end relative shadow-inner overflow-hidden top-glow">
                   <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none z-10" />
                   
                   <div className="flex-1 flex items-center justify-center w-full px-2 pt-4 relative z-20 mb-8">
                      <div className="w-16 h-10 bg-[#5d4037] rounded-md border border-[#3e2723] flex items-center justify-center gap-1 drop-shadow-lg rotate-[-10deg]">
                         <div className="w-6 h-6 bg-white rounded border border-[#e0e0e0] flex items-center justify-center">
                            <div className="w-1 h-1 bg-black rounded-full" />
                         </div>
                         <div className="w-6 h-6 bg-white rounded border border-[#e0e0e0] grid grid-cols-2 gap-[1px] p-[2px]">
                            <div className="w-[3px] h-[3px] bg-black rounded-full" />
                            <div className="w-[3px] h-[3px] bg-black rounded-full justify-self-end col-start-2 row-start-2" />
                         </div>
                      </div>
                   </div>
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/40 to-transparent pt-8 pb-3 z-20 flex items-center justify-center">
                     <h2 className="text-white font-black text-lg drop-shadow-md tracking-tight leading-none text-center">Backgammon</h2>
                   </div>
                </div>
             </div>
             <div className="absolute -bottom-1 -left-2 bg-[#ff1744] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md z-30 tracking-widest border border-white/20">NEW</div>
           </div>

        </div>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="bg-[#111] p-8 rounded-3xl w-full max-w-sm border border-white/10 relative">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
              
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 relative z-10">Private Room</h2>
              
              <div className="space-y-4 mb-6 relative z-10">
                <input 
                  type="text" 
                  placeholder="Room Name" 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 transition-colors"
                />
                <input 
                  type="password" 
                  placeholder="Password (Optional)" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 transition-colors"
                />
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none focus:border-yellow-500/50 transition-colors appearance-none"
                >
                  <option value="uno" className="text-black">Still Standing</option>
                  <option value="joker" className="text-black">KonKan</option>
                  <option value="dobble" className="text-black">Dobble</option>
                  <option value="dama" className="text-black">Domino 50</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  onCreate(roomName, password, selectedType);
                  setShowCreateModal(false);
                }}
                disabled={!roomName.trim()}
                className="w-full py-4 bg-yellow-500 text-black rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                Host Match
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TapBar activeTab="home" setActiveTab={setActiveTab} language={language} />

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

function GameView({ user, game, onLeave, profile, skinsMap, emojiItems }: { 
  user: User, 
  game: Game, 
  onLeave: () => void, 
  profile: UserProfile | null, 
  skinsMap: Record<string, CardSkin>,
  emojiItems: EmojiItem[]
}) {
  const [showMore, setShowMore] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [opponentProfile, setOpponentProfile] = useState<UserProfile | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  const isMyTurn = game.turn === user.uid;
  const opponentId = game.players.find(p => p !== user.uid);
  const myHand = game.hands[user.uid] || [];
  const opponentHandCount = game.hands[opponentId || '']?.length || 0;
  const topCard = game.pile[game.pile.length - 1];

  const ownedEmojis = emojiItems.filter(e => profile?.ownedEmojis?.includes(e.id));

  useEffect(() => {
    const q = query(collection(db, `games/${game.id}/chat`), orderBy('createdAt', 'asc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `games/${game.id}/chat`);
    });
    return unsub;
  }, [game.id]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, showChat]);

  const handleSendChat = async () => {
    if (!chatText.trim()) return;
    try {
      await addDoc(collection(db, `games/${game.id}/chat`), {
        userId: user.uid,
        userName: profile?.displayName || 'Player',
        text: chatText,
        createdAt: Date.now()
      });
      setChatText('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmojiSelect = async (url: string) => {
    try {
      await addDoc(collection(db, `games/${game.id}/chat`), {
        userId: user.uid,
        userName: profile?.displayName || 'Player',
        text: `emoji:${url}`,
        createdAt: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

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
          
          soundManager.playGameEnd(isWinner);
          
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

  const endGame = async () => {
    if (!window.confirm("Permanently delete this game room?")) return;
    try {
      await deleteDoc(doc(db, 'games', game.id));
      onLeave();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `games/${game.id}`);
    }
  };

  const playCard = async (cardIndex: number) => {
    if (!isMyTurn || game.status !== 'active') return;
    
    const card = myHand[cardIndex];
    if (!canPlay(card, topCard)) return;

    soundManager.playCardDeal();
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

    soundManager.playCardDeal();
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

  const canPlay = (card: Card, top: Card) => {
    if (!top) return true;
    if (game.gameType === 'uno') {
      if (card.suit === 'special') return true;
      if (top.suit === 'special') return true;
      return card.suit === top.suit || card.rank === top.rank;
    } else if (game.gameType === 'joker') {
      if (card.suit === 'joker') return true;
      if (top.suit === 'joker') return true;
      return card.suit === top.suit || card.rank === top.rank;
    }
    return false;
  };

  const handleDamaMove = async (fromR: number, fromC: number, toR: number, toC: number) => {
    if (!isMyTurn || game.status !== 'active') return;
    if (!game.board) return;

    const newBoard = [...game.board];
    const piece = newBoard[fromR * 8 + fromC];
    
    if (piece !== user.uid) return;
    if (newBoard[toR * 8 + toC] !== null) return;

    // Basic Dama move: 1 step horizontal or vertical (no diagonals in Turkish Dama unless king)
    const dr = Math.abs(toR - fromR);
    const dc = Math.abs(toC - fromC);
    
    let isCapture = false;
    let victimR = -1;
    let victimC = -1;

    // Standard move (1 step)
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // Validation: Turkish Dama pieces move only forward, left, right (not back)
        // For simplicity here, we allow orthogonal 1 step
        newBoard[toR * 8 + toC] = piece;
        newBoard[fromR * 8 + fromC] = null;
        soundManager.playDamaMove();
    } 
    // Capture move (2 steps)
    else if ((dr === 2 && dc === 0) || (dr === 0 && dc === 2)) {
        victimR = (fromR + toR) / 2;
        victimC = (fromC + toC) / 2;
        const victim = newBoard[victimR * 8 + victimC];
        
        if (victim && victim !== user.uid) {
            newBoard[toR * 8 + toC] = piece;
            newBoard[fromR * 8 + fromC] = null;
            newBoard[victimR * 8 + victimC] = null;
            isCapture = true;
            soundManager.playDamaCapture();
        } else {
            return; // Invalid jump
        }
    } else {
        return; // Invalid move distance
    }
    
    try {
      const updateData: any = {
        board: newBoard,
        turn: opponentId,
        lastMoveAt: Date.now()
      };

      if (isCapture) {
        updateData.scores = {
           ...game.scores,
           [user.uid]: (game.scores[user.uid] || 0) + 10
        };
        // In Turkish Dama, if a capture is made, you might get another turn if more captures available
        // For now, simple point addition and turn switch
      }

      await updateDoc(doc(db, 'games', game.id), updateData);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `games/${game.id}`);
    }
  };

  const onDragEnd = async (event: any, info: any, index: number) => {
    const threshold = window.innerHeight * 0.15;
    if (info.offset.y < -threshold) {
      playCard(index);
    }
  };

  const getHandLayout = (index: number, total: number) => {
    const isMobile = window.innerWidth < 768;
    const angleRange = isMobile ? Math.min(total * 10, 90) : Math.min(total * 6, 60); 
    const angleStep = angleRange / Math.max(total - 1, 1);
    const angle = (index - (total - 1) / 2) * angleStep;
    const x = isMobile ? angle * 4.5 : angle * 2;
    const yOffset = isMobile ? Math.abs(angle) * 0.8 : Math.abs(angle) * 0.5;
    return { x, y: yOffset, rotate: angle };
  };

  return (
    <div className={`fixed inset-0 overflow-hidden flex flex-col font-sans select-none touch-none ${game.gameType === 'dama' ? 'bg-[#1a1a1a]' : game.gameType === 'joker' ? 'bg-[#1a1a1a]' : 'bg-[#232323]'}`}>
      {/* Header */}
      {game.gameType !== 'dobble' && (
      <div className="absolute top-0 w-full h-14 border-b border-white/5 flex items-center justify-between px-4 z-[110]">
        <div className="flex items-center gap-4">
           <button onClick={onLeave} className="text-white/60 hover:text-white relative">
             <div className="flex gap-1 items-center bg-white/5 px-2 py-1 rounded-lg">
                <Menu size={20} />
                <div className="w-4 h-4 bg-red-600 rounded-full text-[9px] font-black flex items-center justify-center">1</div>
             </div>
           </button>
           <button className="text-white/60 hover:text-white"><RefreshCcw size={18} /></button>
        </div>
        <div className="text-white font-black tracking-[0.2em] italic uppercase text-sm">
           {game.gameType === 'uno' ? 'OONO' : game.gameType === 'joker' ? 'JOKER' : 'DAMA'}
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => (window as any).toggleRadioHub?.()} 
             className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all text-yellow-500 hover:text-yellow-400 relative"
             title="Radio Station"
           >
              <Radio size={20} className="animate-pulse" />
           </button>
           <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold">
              <Eye size={12} /> 2
           </div>
           <button className="text-white/60 hover:text-white"><Users size={20} /></button>
           <button onClick={() => setShowChat(!showChat)} className="text-white/60 hover:text-white relative">
              <MessageSquare size={20} />
              {messages.length > 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-black" />}
           </button>
        </div>
      </div>
      )}

      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 w-80 bg-black/95 backdrop-blur-xl z-[200] border-l border-white/10 flex flex-col"
          >
             <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-white/40 tracking-widest">Game Chat</h3>
                <button onClick={() => setShowChat(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
             </div>
             
             <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                   <div key={msg.id} className={`flex flex-col ${msg.userId === user.uid ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-bold text-white/20 mb-1">{msg.userName}</span>
                      <div className={`px-4 py-2 rounded-2xl text-sm ${msg.userId === user.uid ? 'bg-[#8b0000] text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none'}`}>
                         {msg.text?.startsWith('emoji:') ? (
                           <img src={msg.text.split('emoji:')[1]} alt="" className="w-16 h-16 object-contain" />
                         ) : msg.text}
                      </div>
                   </div>
                ))}
             </div>

             <div className="p-4 border-t border-white/10 flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                   <div className="flex-1 relative flex items-center">
                      <input 
                        type="text" 
                        value={chatText}
                        onChange={e => setChatText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                        placeholder="Type message..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8b0000] pr-10"
                      />
                      <div className="absolute right-2">
                         <ChatEmojiPicker ownedEmojis={ownedEmojis} onSelect={handleEmojiSelect} />
                      </div>
                   </div>
                   <button onClick={handleSendChat} className="p-2 bg-[#8b0000] text-white rounded-xl"><Send size={18} /></button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
         {game.gameType === 'dobble' ? (
           <DobbleBoard game={game} user={user} opponentProfile={opponentProfile} opponentId={opponentId} />
         ) : game.gameType === 'dama' ? (
           <DamaBoard game={game} user={user} onMove={handleDamaMove} opponentProfile={opponentProfile} opponentId={opponentId!} />
         ) : game.gameType === 'joker' ? (
           <JokerField game={game} user={user} drawCard={drawCard} topCard={topCard} opponentProfile={opponentProfile} opponentId={opponentId!} />
         ) : (
           <UnoField game={game} user={user} drawCard={drawCard} topCard={topCard} opponentProfile={opponentProfile} opponentId={opponentId!} />
         )}
      </div>

      {/* Footer / Hand Area */}
      {game.gameType !== 'dama' && game.gameType !== 'dobble' && (
        <div className="absolute bottom-0 w-full h-44 bg-gradient-to-t from-[#0d0d0d] to-transparent z-[120]">
           <div className="flex h-full items-center px-6">
              <div className="flex flex-col items-center gap-1 -translate-y-4">
                 <div className="relative w-16 h-16 rounded-full border-[3px] border-yellow-500 overflow-hidden shadow-2xl p-1 bg-[#1a1a1a]">
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" className="w-full h-full rounded-full" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-0.5">
                       <span className="text-[8px] font-black uppercase text-white truncate px-1">{user.displayName?.split(' ')[0]}</span>
                    </div>
                 </div>
                 <div className="flex gap-2 mt-2">
                    <button className="text-zinc-500"><MessageSquare size={20} /></button>
                    <button className="text-zinc-500"><Gift size={20} /></button>
                 </div>
              </div>

              <div className="flex-1 relative h-32 ml-4">
                 <AnimatePresence mode="popLayout">
                    {myHand.map((card, i) => {
                       const layout = getHandLayout(i, myHand.length);
                       return (
                          <motion.div
                             key={card.id}
                             drag={isMyTurn && canPlay(card, topCard)}
                             dragElastic={0.1}
                             dragConstraints={{ top: -400, bottom: 50, left: -200, right: 200 }}
                             onDragEnd={(e, info) => onDragEnd(e, info, i)}
                             initial={{ y: 100, opacity: 0 }}
                             animate={{ x: layout.x, y: layout.y, rotate: layout.rotate, opacity: 1 }}
                             whileHover={{ y: layout.y - 40, scale: 1.1, zIndex: 100 }}
                             className="absolute left-1/2 top-4 -translate-x-1/2"
                          >
                             <CardComponent card={card} index={i} skinUrl={mySkin} />
                          </motion.div>
                       );
                    })}
                 </AnimatePresence>
              </div>

              {game.gameType === 'joker' && (
                <div className="absolute top-0 right-6 -translate-y-6 flex bg-black/40 rounded-lg overflow-hidden border border-white/10">
                   <div className="px-4 py-1.5 border-r border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest">Sum</div>
                   <div className="px-4 py-1.5 text-white font-black text-xs tracking-widest">0/51</div>
                </div>
              )}
           </div>
        </div>
      )}

      {game.gameType === 'dama' && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[120]">
           <div className="flex flex-col items-center gap-1">
                 <div className="relative w-16 h-16 rounded-full border-[3px] border-yellow-500 overflow-hidden shadow-2xl p-1 bg-[#1a1a1a]">
                    <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" className="w-full h-full rounded-full" />
                 </div>
                 <div className="mt-1 px-3 py-1 bg-yellow-500 text-black rounded-full font-black text-[10px] uppercase shadow-lg">
                    {user.displayName}
                 </div>
           </div>
        </div>
      )}


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

function UnoField({ game, user, drawCard, topCard, opponentProfile, opponentId }: any) {
  return (
    <div className="relative w-80 h-80 rounded-full bg-[#1a1a1a] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] border border-white/5 flex items-center justify-center">
        {/* Spinning Golden Arrows */}
        <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-yellow-500/20 border-r-yellow-500/20 rotate-45" />
        <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
           className="absolute inset-[30px] rounded-full"
        >
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-500/40">▲</div>
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-500/40 rotate-180">▲</div>
        </motion.div>

        {/* Center Card */}
        <div className="relative z-10 w-28 h-40">
           <AnimatePresence mode="popLayout">
             {game.pile.length > 0 && (
               <CardComponent 
                 key={topCard.id} 
                 card={topCard} 
                 index={game.pile.length - 1} 
                 isPile 
               />
             )}
           </AnimatePresence>
        </div>

        {/* Opponent Avatar in Circle */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
           <div className="relative w-20 h-20 rounded-full border-[3px] border-zinc-700 overflow-hidden shadow-2xl">
              <img src={opponentProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentId}`} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />
           </div>
           <div className="mt-1 px-3 py-0.5 bg-black/60 rounded-full border border-white/10 text-[9px] font-bold text-white uppercase">{game.playerNames[opponentId || ''] || 'RIVAL'}</div>
        </div>

        {/* Draw Pile */}
        <div className="absolute -left-16 bottom-10">
           <button onClick={drawCard} className="relative group">
              <div className="absolute -inset-1 bg-red-600/20 rounded-xl blur-lg transition-all group-hover:bg-red-600/40" />
              <div className="w-14 h-20 bg-[#8b0000] rounded-xl border-2 border-white/20 shadow-xl flex items-center justify-center relative overflow-hidden">
                 <div className="text-white/20 text-[8px] font-black rotate-45">OONO</div>
                 <div className="absolute bottom-1 right-1 px-1 bg-black/40 rounded text-[6px] font-bold text-white">{game.deck.length}</div>
              </div>
           </button>
        </div>

        {/* Oono Challenge */}
        <div className="absolute -right-16 bottom-10">
           <button className="px-3 py-1.5 bg-gradient-to-b from-orange-400 to-orange-600 rounded-lg shadow-xl text-white font-black text-[8px] uppercase tracking-wider border border-white/20">Oono challenge</button>
        </div>
    </div>
  );
}

function JokerField({ game, user, drawCard, topCard, opponentProfile, opponentId }: any) {
  return (
    <div className="relative w-full h-[60vh] flex flex-col items-center justify-center bg-transparent">
        {/* Green Felt Table */}
        <div className="relative w-[90%] max-w-sm h-full rounded-[60px] bg-gradient-to-b from-[#2e7d32] to-[#1b5e20] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_100px_rgba(0,0,0,0.5)] border-[6px] border-[#3e2723] overflow-hidden flex flex-col items-center py-10">
            {/* Table Details */}
            <div className="absolute inset-4 rounded-[40px] border-2 border-white/10" />
            
            {/* Round info */}
            <div className="z-10 px-4 py-1.5 bg-black/40 rounded-full border border-white/10 text-[10px] font-black text-white/60 tracking-widest uppercase mb-10">
               Round: 1/5
            </div>

            {/* Center Pile */}
            <div className="flex-1 flex items-center justify-center gap-2 relative">
                 <div className="w-20 h-28 bg-[#8b0000] rounded-xl border-2 border-white/20 shadow-xl relative overflow-hidden rotate-[-5deg]">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 font-black">★</div>
                 </div>
                 {topCard && (
                    <AnimatePresence mode="popLayout">
                        <motion.div 
                           key={topCard.id}
                           initial={{ 
                             y: 300, 
                             rotate: -10, 
                             scale: 1.5,
                             opacity: 0,
                             filter: 'brightness(1.5) drop-shadow(0 0 0px rgba(0,255,255,0))'
                           }}
                           animate={{ 
                             y: [300, -50, 0], 
                             rotate: 5, 
                             scale: 1.05,
                             opacity: 1,
                             filter: 'brightness(1.2) drop-shadow(0 0 15px rgba(0,255,255,0.8))'
                           }}
                           transition={{ 
                             duration: 0.8, 
                             times: [0, 0.4, 1],
                             ease: "easeOut"
                           }}
                           className="w-20 h-28 z-20"
                        >
                           <CardComponent card={topCard} isPile />
                        </motion.div>
                    </AnimatePresence>
                 )}
            </div>

            {/* Icons to guide drop */}
            <div className="flex gap-4 mt-6 opacity-30 text-white">
               <ChevronUp size={24} className="animate-bounce" />
               <ChevronUp size={24} className="animate-bounce delay-100" />
            </div>

            {/* Opponent at top of table */}
            <div className="absolute -top-6 flex flex-col items-center gap-1">
               <div className="relative w-20 h-20 rounded-full border-4 border-yellow-600 overflow-hidden shadow-2xl bg-[#1a1a1a] p-1">
                  <img src={opponentProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentId}`} alt="" className="w-full h-full rounded-full" />
               </div>
               <div className="px-5 py-1 bg-yellow-600 text-black rounded-full font-black text-[10px] uppercase shadow-lg">
                  {game.playerNames[opponentId] || 'RIVAL'}
               </div>
            </div>
        </div>
    </div>
  );
}

function DamaBoard({ game, user, onMove, opponentProfile, opponentId }: any) {
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const board = game.board || Array(64).fill(null);

  const handleCellClick = (r: number, c: number) => {
    if (selected) {
      onMove(selected[0], selected[1], r, c);
      setSelected(null);
    } else {
      if (board[r * 8 + c] === user.uid) {
        setSelected([r, c]);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-10">
       {/* Opponent Area */}
       <div className="flex flex-col items-center gap-2">
           <div className="relative w-20 h-20 rounded-full border-4 border-zinc-700 overflow-hidden shadow-2xl bg-[#1a1a1a]">
               <img src={opponentProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentId}`} alt="" className="w-full h-full object-cover" />
               <div className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-zinc-700 text-white text-[10px] font-black shadow-lg">
                  {game.scores[opponentId] || 0}
               </div>
           </div>
           <div className="px-4 py-1 bg-black/60 border border-white/10 text-white rounded-full font-bold text-xs uppercase">
               {game.playerNames[opponentId]}
           </div>
       </div>

       {/* Dama Table */}
       <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 bg-black/40 px-8 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
             <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Your Score</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#ffcc00] shadow-[0_0_8px_rgba(255,204,0,0.5)]" />
                   <span className="text-[#ffcc00] font-display font-black text-lg">{game.scores[user.uid] || 0}</span>
                </div>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Enemy</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-black border border-white/20" />
                   <span className="text-white/60 font-display font-black text-lg">{game.scores[opponentId] || 0}</span>
                </div>
             </div>
          </div>
          <div className="p-4 bg-[#3e2723] rounded-2xl shadow-2xl border-4 border-[#2b1b17] relative">
             <div className="grid grid-cols-8 gap-1 bg-[#2b1b17] p-1 border-2 border-black/40">
             {Array.from({ length: 8 }).map((_, r) => 
               Array.from({ length: 8 }).map((_, c) => {
                 const cell = board[r * 8 + c];
                 const isSelected = selected?.[0] === r && selected?.[1] === c;
                 
                 return (
                   <div 
                     key={`${r}-${c}`}
                     onClick={() => handleCellClick(r, c)}
                     className={`w-10 h-10 flex items-center justify-center transition-all cursor-pointer
                       ${(r + c) % 2 === 0 ? 'bg-[#d7ccc8]' : 'bg-[#5d4037]'}
                       ${isSelected ? 'ring-4 ring-yellow-400 z-10 scale-110' : ''}
                       hover:brightness-110
                     `}
                   >
                     {cell && (
                       <motion.div 
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className={`w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 
                           ${cell === opponentId ? 'bg-black/80 border-black/20' : 'bg-[#ffcc00] border-[#e6b800]'}
                         `}
                       >
                          <div className={`w-6 h-6 rounded-full border border-white/10 ${cell === opponentId ? 'bg-zinc-800' : 'bg-yellow-600'}`} />
                       </motion.div>
                     )}
                   </div>
                 );
               })
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor({ profile, user, onSave, onCancel }: { profile: UserProfile, user: User, onSave: (p: Partial<UserProfile>) => void, onCancel: () => void }) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [photoURL, setPhotoURL] = useState(profile.photoURL);
  const [country, setCountry] = useState(profile.country || '');
  const [zoom, setZoom] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const countriesList = [
    { code: 'Kurdistan', name: '☀ Kurdistan' },
    { code: 'USA', name: '🇺🇸 United States' },
    { code: 'UK', name: '🇬🇧 United Kingdom' },
    { code: 'Germany', name: '🇩🇪 Germany' },
    { code: 'Canada', name: '🇨🇦 Canada' },
    { code: 'Sweden', name: '🇸🇪 Sweden' },
    { code: 'Iraq', name: '🇮🇶 Iraq' },
    { code: 'Turkey', name: '🇹🇷 Turkey' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("Image too large! Please choose a file smaller than 800kb.");
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoURL(event.target?.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] bg-white font-sans text-black flex flex-col items-center overflow-hidden">
      <div className="w-full max-w-lg flex flex-col h-full relative">
         <div className="flex items-center justify-between px-4 py-4 relative bg-white z-10 w-full shrink-0">
           <button onClick={onCancel} className="p-2 -ml-2"><ChevronLeft size={24} className="text-gray-900" /></button>
           <div className="text-center absolute left-1/2 -translate-x-1/2">
              <h2 className="text-lg font-black tracking-tight">Edit Profile</h2>
              <div className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">Current Data Completion: 37%</div>
           </div>
           <div className="w-10"></div>
         </div>

         <div className="flex-1 overflow-y-auto px-4 py-2 bg-white w-full">
           {/* Avatar */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer" onClick={() => {
              const fileInput = document.getElementById('profile-avatar-upload');
              if (fileInput) fileInput.click();
           }}>
              <span className="font-bold text-gray-800 tracking-tight">Avatar</span>
              <div className="flex items-center gap-2">
                 <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-gray-100">
                    <img src={photoURL || profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-full h-full object-cover" />
                 </div>
                 <ChevronRight size={18} className="text-gray-300" />
              </div>
           </div>
           <input type="file" id="profile-avatar-upload" className="hidden" accept="image/*" onChange={handleFileChange} />

           {/* Nickname */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50">
              <span className="font-bold text-gray-800 tracking-tight">Nickname</span>
              <div className="flex items-center gap-2">
                 <input 
                   type="text" 
                   value={displayName} 
                   onChange={e => setDisplayName(e.target.value)} 
                   className="text-right text-gray-900 font-black bg-transparent outline-none tracking-tight w-32" 
                 />
                 <ChevronRight size={18} className="text-gray-300" />
              </div>
           </div>

           {/* Gender */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer">
              <span className="font-bold text-gray-800 tracking-tight">Gender</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <Eye size={16} className="text-gray-400" /> Male
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>

           {/* Birthday */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer">
              <span className="font-bold text-gray-800 tracking-tight">Birthday</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>

           {/* Age */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer">
              <span className="font-bold text-gray-800 tracking-tight">Age</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <Eye size={16} className="text-gray-400" /> 28
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>

           {/* MBTI */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer">
              <span className="font-bold text-gray-800 tracking-tight">MBTI</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>

           {/* Self-Introduction */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer">
              <span className="font-bold text-gray-800 tracking-tight">Self-Introduction</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>

           {/* My hometown */}
           <div className="flex justify-between items-center py-5 border-b border-gray-100/50 cursor-pointer">
              <span className="font-bold text-gray-800 tracking-tight">My hometown</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>

           {/* Residency */}
           <div className="flex justify-between items-center py-5 cursor-pointer pb-24">
              <span className="font-bold text-gray-800 tracking-tight">Residency</span>
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                 <ChevronRight size={18} className="text-gray-300 ml-1" />
              </div>
           </div>
         </div>

         <div className="p-4 bg-white/90 backdrop-blur-md absolute bottom-0 left-0 right-0 border-t border-gray-100 flex items-center justify-center pointer-events-auto shrink-0 w-full">
           <button 
              onClick={() => onSave({ displayName, photoURL })}
              disabled={isUploading}
              className="w-full py-4 bg-[#8b0000] text-white rounded-full font-black tracking-widest hover:bg-[#a00000] transition-all shadow-md active:scale-95 disabled:opacity-50"
           >
              {isUploading ? 'Uploading...' : 'Save Changes'}
           </button>
         </div>
      </div>
    </div>
  );
}

function ClubsView({ user, profile, onJoinClub, onCreateClub, onBack }: { user: User, profile: UserProfile, onJoinClub: (id: string, pass?: string) => void, onCreateClub: (data: any) => void, onBack: () => void }) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubLogos, setClubLogos] = useState<{ id: string; url: string }[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'clubs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Club)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clubs');
    });

    const unsubscribeLogos = onSnapshot(collection(db, 'clubLogos'), (snapshot) => {
      setClubLogos(snapshot.docs.map(doc => ({ id: doc.id, url: doc.data().url || '' })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clubLogos');
    });

    return () => {
      unsubscribe();
      unsubscribeLogos();
    };
  }, []);

  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const filteredClubs = clubs.filter(c => 
    c.name?.toLowerCase().includes(clubSearchQuery.toLowerCase()) || 
    c.description?.toLowerCase().includes(clubSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col font-sans bg-white pb-32">
      <div className="relative w-full overflow-hidden bg-gradient-to-br from-[#6b73eb] via-[#8598ed] to-[#c6d7ff] rounded-b-[40px] shadow-sm shrink-0">
         {/* Top bar */}
         <div className="flex items-center justify-between px-4 pt-14 pb-4">
            <button onClick={onBack} className="p-2 -ml-2 text-white">
               <ChevronUp className="transform -rotate-90 w-7 h-7" />
            </button>
            <h1 className="text-white text-xl font-bold">Tribe</h1>
            <div className="flex items-center gap-3">
               <button onClick={() => setShowCreate(true)} className="flex items-center font-bold gap-1 px-4 py-1.5 bg-white text-black rounded-full shadow-md text-sm">
                  <Plus size={16} /> Create
               </button>
               <button className="p-1 text-white">
                  <Search size={24} />
               </button>
            </div>
         </div>

         {/* Banner / 3D Character Area */}
         <div className="relative h-32 px-6 flex items-center justify-between">
            <div className="flex items-center gap-1 font-black text-xl text-[#0d226b] px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm self-start mt-6">
                Tribe Bonus <ChevronRight size={20} className="mt-0.5" />
            </div>
            {/* The character in Image 2 */}
            <div className="absolute right-2 bottom-0 w-44 h-44 drop-shadow-xl pointer-events-none">
                <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=kingbot&backgroundColor=transparent`} alt="" className="w-full h-full object-cover scale-125 translate-y-4" />
            </div>
         </div>

         {/* 4 Tabs Container */}
         <div className="bg-white/80 backdrop-blur-md rounded-[28px] mx-4 mb-5 p-4 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-white">
             <div className="flex flex-col items-center gap-1 flex-1">
                 <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">🪙</div>
                 <span className="text-xs font-bold text-gray-800 tracking-tight">Coin Bonus</span>
             </div>
             <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/40">
                 <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">💬</div>
                 <span className="text-xs font-bold text-gray-800 tracking-tight">Tribe Group</span>
             </div>
             <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/40">
                 <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">🏠</div>
                 <span className="text-xs font-bold text-gray-800 tracking-tight">Tribe Room</span>
             </div>
             <div className="flex flex-col items-center gap-1 flex-1 border-l border-white/40">
                 <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-2xl">⭐</div>
                 <span className="text-xs font-bold text-gray-800 tracking-tight">Tribe Brand</span>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-2xl mx-auto p-4 pt-6 space-y-6">
        {loading ? (
          <div className="text-center py-10">Loading tribes...</div>
        ) : filteredClubs.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-bold">No tribes matched your search</div>
        ) : (
          filteredClubs.map(club => (
             <div key={club.id} className="flex items-center justify-between pb-6 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-b from-teal-400 to-teal-600 border-[3px] border-white shadow-md p-1 relative flex items-center justify-center">
                         <div className="absolute inset-0 bg-black/10 rounded-lg"></div>
                         <img src={club.logo || clubLogoDefaultImage} alt="Tribe Logo" className="w-full h-full rounded-lg object-cover z-10 drop-shadow-md brightness-110" />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
                         <div className="relative w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-yellow-500/50">
                            <img src={levelLogoImage} className="absolute inset-0 w-full h-full object-cover rounded-full" />
                            <span className="relative z-10 text-white font-black text-[9px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">{Math.floor(Math.random() * 5) + 1}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col gap-1 -mt-2">
                      <h3 className="text-black font-black text-[17px]">{club.name}</h3>
                      <p className="text-gray-500 font-medium text-[13px]">{club.description || "بەخێربێیت بۆ هۆزەکەم"}</p>
                      <div className="flex items-center text-gray-400 text-xs font-bold mt-0.5">
                         <UserIcon size={12} className="mr-1" /> {club.members?.length || 0}/{club.maxMembers || 50}
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => onJoinClub(club.id)}
                  className="px-6 py-2.5 bg-[#4a80f0] text-white font-bold rounded-full text-sm hover:bg-blue-600 shadow-md"
                >
                  Join
                </button>
             </div>
          ))
        )}
      </div>

       {showCreate && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl relative"
            >
               <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
               <div className="flex justify-between items-center mb-10 relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-black tracking-tight">Create Tribe</h2>
                    <p className="text-blue-500 font-bold text-xs mt-1">Creation Fee: 30,000 Coins</p>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                     <X size={20} className="text-gray-500" />
                  </button>
               </div>

               <ClubCreateForm 
                 chips={profile.chips} 
                 clubLogos={clubLogos}
                 onSubmit={(data) => {
                    onCreateClub(data);
                    setShowCreate(false);
                 }} 
               />
            </motion.div>
         </div>
       )}
    </div>
  );
}

function ClubCreateForm({ chips, clubLogos = [], onSubmit }: any) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [max, setMax] = useState(30);
  const [pass, setPass] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState('');

  return (
    <div className="space-y-6 relative">
       <div className="space-y-4">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Tribe Name</label>
             <input value={name} onChange={e => setName(e.target.value)} placeholder="Elite Kings" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-black font-bold outline-none focus:border-blue-500" />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Description</label>
             <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-black font-bold h-24 resize-none outline-none focus:border-blue-500" />
          </div>
          
          {clubLogos.length > 0 && (
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Select Tribe Logo</label>
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                   {clubLogos.map((logoItem: any) => (
                      <button
                         key={logoItem.id} 
                         type="button"
                         onClick={() => setSelectedLogo(logoItem.url)}
                         className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all relative shrink-0 ${selectedLogo === logoItem.url ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                         <img src={logoItem.url} alt="" className="w-full h-full object-cover" />
                         {selectedLogo === logoItem.url && (
                            <div className="absolute inset-0 bg-yellow-500/10 flex items-center justify-center">
                               <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-black text-[10px] font-black">✓</div>
                            </div>
                         )}
                      </button>
                   ))}
                </div>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Capacity (1-30)</label>
                <input type="number" min="1" max="30" value={max} onChange={e => setMax(parseInt(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-black font-bold outline-none focus:border-blue-500" />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-4">Entry Code</label>
                <input type="password" value={pass} onChange={e => { setPass(e.target.value); setIsPrivate(!!e.target.value); }} placeholder="Optional" className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 text-black font-bold outline-none focus:border-blue-500" />
             </div>
          </div>
       </div>

       <button 
         disabled={chips < 30000 || !name}
         onClick={() => onSubmit({ name, description: desc, maxMembers: max, password: pass, isPrivate, logo: selectedLogo })}
         className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-lg transition-all
           ${chips < 30000 || !name ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-[1.02]'}
         `}
       >
         Create Tribe
       </button>
    </div>
  );
}

function ClubDetailView({ club, user, profile, onLeave, onPostMessage, onBack, emojiItems }: { 
  club: Club, 
  user: User, 
  profile: UserProfile, 
  onLeave: () => void, 
  onPostMessage: (t: string) => void, 
  onBack: () => void,
  emojiItems: EmojiItem[]
}) {
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [text, setText] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const ownedEmojis = emojiItems.filter(e => profile.ownedEmojis?.includes(e.id));

  useEffect(() => {
    const path = `clubs/${club.id}/messages`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClubMessage)).reverse());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [club.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onPostMessage(text);
    setText('');
  };

  const handleEmojiSelect = (url: string) => {
    onPostMessage(`emoji:${url}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-180px)] flex flex-col gap-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
             <button onClick={onBack} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft size={24} className="text-white" />
             </button>
             <div className="w-20 h-20 rounded-3xl bg-black border-2 border-[#8b0000] flex items-center justify-center overflow-hidden shadow-2xl">
                <img src={club.logo || `https://api.dicebear.com/7.x/shapes/svg?seed=${club.id}`} alt="" className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-3">
                   <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">{club.name}</h1>
                   <div className="px-3 py-1 bg-[#8b0000]/10 border border-[#8b0000]/20 rounded-full text-[9px] font-black text-[#8b0000] uppercase tracking-widest">Syndicate HQ</div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex items-center gap-2">
                      <Users size={14} className="text-[#8b0000]" />
                      <span className="text-xs font-bold text-white/40">{club.members.length} / {club.maxMembers} Elite Members</span>
                   </div>
                   <div className="w-1 h-1 bg-white/10 rounded-full" />
                   <p className="text-xs font-medium text-white/40 italic">{club.description}</p>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
               onClick={onLeave}
               className="flex-1 md:flex-none px-8 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/40 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
             >
                Exit Syndicate
             </button>
          </div>
       </div>

       <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
          {/* Chat Section */}
          <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] flex flex-col overflow-hidden backdrop-blur-md">
             <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-3">
                   <MessageSquare size={14} className="text-[#8b0000]" />
                   War Room Chat
                </h3>
             </div>

             <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
                {messages.map((msg) => (
                   <div key={msg.id} className={`flex gap-4 ${msg.userId === user.uid ? 'flex-row-reverse' : ''}`}>
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shrink-0">
                         <img src={msg.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className={`flex flex-col gap-1.5 max-w-[70%] ${msg.userId === user.uid ? 'items-end' : ''}`}>
                         <span className="text-[9px] font-black text-white/20 uppercase tracking-widest px-1">
                            {msg.userId === user.uid ? 'You' : msg.userName}
                         </span>
                         <div className={`px-5 py-3 rounded-3xl text-sm font-medium ${msg.userId === user.uid ? 'bg-[#8b0000] text-white rounded-tr-none' : 'bg-white/5 text-white/80 rounded-tl-none'}`}>
                            {msg.text?.startsWith('emoji:') ? (
                              <img src={msg.text.split('emoji:')[1]} alt="" className="w-20 h-20 object-contain" />
                            ) : msg.text}
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <div className="flex gap-4 items-center">
                   <div className="flex-1 relative flex items-center">
                      <input 
                        value={text} 
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Broadcast a message..." 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-medium focus:outline-none focus:border-[#8b0000]/30 transition-all pr-12" 
                      />
                      <div className="absolute right-4 text-white/40 hover:text-white transition-colors">
                         <ChatEmojiPicker ownedEmojis={ownedEmojis} onSelect={handleEmojiSelect} />
                      </div>
                   </div>
                   <button 
                     onClick={handleSend}
                     className="w-14 h-14 bg-[#8b0000] text-white rounded-2xl flex items-center justify-center hover:bg-[#a00000] transition-all shadow-xl"
                   >
                      <Send size={20} />
                   </button>
                </div>
             </div>
          </div>

          {/* Members Sidebar */}
          <div className="w-full md:w-80 bg-white/[0.02] border border-white/10 rounded-[40px] p-8 flex flex-col gap-8 backdrop-blur-md">
             <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-4">
                Active Rosters
             </h3>
             <div className="flex-1 overflow-y-auto space-y-5 pr-2">
                {club.members.map((memberId: string) => (
                   <div key={memberId} className="flex items-center gap-4 group cursor-pointer">
                      <div className="relative">
                         <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#8b0000] transition-colors">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#111]" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-xs font-black text-white uppercase tracking-tight">{memberId === club.ownerId ? '👑 Owner' : 'Associate'}</span>
                         <span className="text-[10px] font-bold text-white/30 truncate w-32">#{memberId.slice(0, 8)}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}

function CardComponent({ card, index = 0, isPile = false, skinUrl }: { card: Card, index?: number, isPile?: boolean, skinUrl?: string, key?: any }) {
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

function RadioHub({ tracks, active, onClose, isMusicOn, toggleMusic, currentTrackIndex, setCurrentTrackIndex }: { 
  tracks: RadioTrack[], 
  active: boolean, 
  onClose: () => void,
  isMusicOn: boolean,
  toggleMusic: () => void,
  currentTrackIndex: number,
  setCurrentTrackIndex: (idx: number) => void
}) {
  if (!active) return null;
  
  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm shadow-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#0f0f12] border-2 border-white/10 rounded-[40px] overflow-hidden shadow-2xl flex flex-col items-center p-8"
      >
        <div className="w-full flex justify-between items-center mb-10">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">LIVE RADIO</span>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X size={20} className="text-white/40" /></button>
        </div>

        <div className="relative w-48 h-48 mb-10 group">
           <div className={`absolute inset-0 bg-yellow-500 rounded-full opacity-20 blur-2xl transition-all duration-1000 ${isMusicOn ? 'scale-125' : 'scale-75'}`} />
           <div className={`w-full h-full rounded-full border-4 border-white/10 flex items-center justify-center bg-black overflow-hidden relative ${isMusicOn ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#8b0000]/40 to-transparent" />
              <Music size={64} className="text-white relative z-10" />
           </div>
           <div className="absolute bottom-2 right-2 p-3 bg-[#8b0000] rounded-full shadow-lg border-2 border-white/20">
              <Radio size={20} className="text-white" />
           </div>
        </div>

        <div className="text-center mb-10 space-y-2">
           <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis px-4">
              {currentTrack?.name || 'Radio Offline'}
           </h2>
           <p className="text-[#8b0000] font-black text-[10px] uppercase tracking-[0.3em]">PRO SYNDICATE TUNES</p>
        </div>

        <div className="w-full flex flex-col gap-8">
           <div className="flex items-center justify-center gap-8">
              <button 
                onClick={() => setCurrentTrackIndex((currentTrackIndex - 1 + tracks.length) % (tracks.length || 1))}
                className="p-4 bg-white/5 rounded-full text-white/60 hover:text-white transition-all transform hover:scale-110"
              >
                <MoreHorizontal size={24} />
              </button>
              <button 
                onClick={toggleMusic}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-white/10 transform active:scale-90 transition-all"
              >
                {isMusicOn ? <Volume2 size={32} className="text-black" /> : <VolumeX size={32} className="text-black" />}
              </button>
              <button 
                onClick={() => setCurrentTrackIndex((currentTrackIndex + 1) % (tracks.length || 1))}
                className="p-4 bg-white/5 rounded-full text-white/60 hover:text-white transition-all transform hover:scale-110"
              >
                <MoreHorizontal size={24} className="rotate-180" />
              </button>
           </div>

           <div className="flex flex-col gap-3">
              <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                 <span>{isMusicOn ? 'Broadcasting' : 'Muted'}</span>
                 <span>{Math.floor(tracks.length)} Channels</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ x: isMusicOn ? ['-100%', '100%'] : '0%' }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="w-1/2 h-full bg-[#8b0000] rounded-full" 
                 />
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}

function ChatEmojiPicker({ ownedEmojis, onSelect }: { ownedEmojis: EmojiItem[], onSelect: (url: string) => void }) {
  const [active, setActive] = useState(false);

  return (
    <div className="relative">
      <button 
        onClick={() => setActive(!active)}
        className="p-2 text-white/40 hover:text-white transition-colors"
      >
        <Smile size={20} />
      </button>
      <AnimatePresence>
        {active && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-12 right-0 bg-[#1a1a1e] border-2 border-white/10 rounded-3xl p-4 shadow-2xl z-[100] w-64"
          >
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
               {ownedEmojis.length === 0 && (
                 <div className="col-span-4 py-4 text-center text-[8px] font-black text-white/20 uppercase tracking-widest">
                    No Emojis Owned
                 </div>
               )}
               {ownedEmojis.map(emoji => (
                 <button 
                    key={emoji.id}
                    onClick={() => {
                      onSelect(emoji.url);
                      setActive(false);
                    }}
                    className="aspect-square bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all p-2 group"
                 >
                    <img src={emoji.url} alt={emoji.name} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform" />
                 </button>
               ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
               <span className="text-[8px] font-black text-white/20 uppercase">Emoji Hub</span>
               <ShoppingBag size={12} className="text-white/20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MyItemsView({ 
  user, 
  profile, 
  onBack, 
  emojiItems,
  setActiveTab,
  language
}: { 
  user: User, 
  profile: UserProfile, 
  onBack: () => void, 
  emojiItems: EmojiItem[],
  setActiveTab?: (tab: any) => void,
  language?: Language
}) {
  const [skins, setSkins] = useState<CardSkin[]>([]);
  const [tableSkins, setTableSkins] = useState<TableSkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabTab] = useState<'skins' | 'emojis' | 'tables'>('skins');

  useEffect(() => {
    const unsubSkins = onSnapshot(collection(db, 'cardSkins'), (snapshot) => {
      setSkins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CardSkin)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'cardSkins');
    });

    const unsubTables = onSnapshot(collection(db, 'tableSkins'), (snapshot) => {
      setTableSkins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TableSkin)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tableSkins');
    });

    return () => {
      unsubSkins();
      unsubTables();
    };
  }, []);

  const handleEquipSkin = async (skinId: string | null) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activeSkinId: skinId
      });
      alert(skinId ? "Skin equipped successfully!" : "Default skin equipped!");
    } catch (e) {
      console.error("Failed to equip skin:", e);
      alert("Error equipping skin");
    }
  };

  const handleEquipTable = async (tableId: string | null) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        activeTableSkinId: tableId
      });
      alert(tableId ? "Table skin equipped!" : "Default table active!");
    } catch (e) {
      console.error("Failed to equip table skin:", e);
      alert("Error equipping table skin");
    }
  };

  const ownedSkins = skins.filter(s => profile.ownedSkins?.includes(s.id));
  const ownedEmojis = emojiItems.filter(e => profile.ownedEmojis?.includes(e.id));
  const ownedTables = tableSkins.filter(t => profile.ownedTableSkins?.includes(t.id));

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white p-6 font-sans pb-32 overflow-y-auto w-full flex flex-col items-center">
      <header className="w-full max-w-lg mb-8 flex justify-between items-center px-2 z-20">
         <div className="flex items-center gap-4">
           <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft size={22} className="text-zinc-400" />
           </button>
           <h1 className="text-2xl font-black uppercase tracking-tight">My Items</h1>
         </div>
      </header>

      <div className="w-full max-w-lg mb-8 flex bg-zinc-900/60 p-1 border border-white/5 rounded-2xl gap-1">
         <button 
           onClick={() => setActiveTabTab('skins')} 
           className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'skins' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-400'}`}
         >
           Skins ({ownedSkins.length})
         </button>
         <button 
           onClick={() => setActiveTabTab('tables')} 
           className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'tables' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-400'}`}
         >
           Tables ({ownedTables.length})
         </button>
         <button 
           onClick={() => setActiveTabTab('emojis')} 
           className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'emojis' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-400'}`}
         >
           Emojis ({ownedEmojis.length})
         </button>
      </div>

      <div className="w-full max-w-lg">
        {loading ? (
          <div className="py-20 flex justify-center">
            <RefreshCcw className="animate-spin text-zinc-500" size={32} />
          </div>
        ) : activeTab === 'skins' ? (
          <div className="grid grid-cols-2 gap-4">
             {/* Default card skin option */}
             <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-4 relative">
                <div className="aspect-[2/3] bg-zinc-950/80 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-xs text-zinc-500 font-bold overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black opacity-40" />
                    🃏 Default Red
                </div>
                <div className="flex-1 flex flex-col justify-end">
                   <p className="font-bold text-sm">Classic Joker Red</p>
                   <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">Default</p>
                   {profile.activeSkinId ? (
                      <button 
                        onClick={() => handleEquipSkin(null)}
                        className="w-full mt-3 py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
                      >
                        Equip
                      </button>
                   ) : (
                      <div className="w-full mt-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-1">
                         <Check size={12} /> Equipped
                      </div>
                   )}
                </div>
             </div>

             {ownedSkins.length === 0 ? (
                <div className="col-span-2 py-16 text-center border border-dashed border-white/5 rounded-3xl">
                   <p className="text-zinc-500 font-bold text-sm">You do not own any custom card skins.</p>
                </div>
             ) : (
                ownedSkins.map(skin => {
                  const isCurrent = profile.activeSkinId === skin.id;
                  return (
                     <div key={skin.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-4 relative">
                        <div className="aspect-[2/3] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden relative shadow-md">
                           <img src={skin.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-end">
                           <p className="font-bold text-sm truncate">{skin.name}</p>
                           <p className="text-[9px] font-black uppercase text-yellow-500 mt-1">{skin.rarity}</p>
                           {isCurrent ? (
                              <div className="w-full mt-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-1">
                                 <Check size={12} /> Equipped
                              </div>
                           ) : (
                              <button 
                                onClick={() => handleEquipSkin(skin.id)}
                                className="w-full mt-3 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl text-xs font-bold transition-all"
                              >
                                Equip
                              </button>
                           )}
                        </div>
                     </div>
                  );
                })
             )}
          </div>
        ) : activeTab === 'tables' ? (
          <div className="grid grid-cols-2 gap-4">
             {/* Default table mat option */}
             <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-4 relative">
                <div className="aspect-[3/2] bg-zinc-950/80 border border-white/10 rounded-2xl flex items-center justify-center font-mono text-[10px] text-zinc-500 font-bold overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-zinc-850 to-emerald-950 opacity-40 animate-pulse" />
                    🃏 Velvet Greenfield
                </div>
                <div className="flex-1 flex flex-col justify-end">
                   <p className="font-bold text-sm">Classic Table Felt</p>
                   <p className="text-[10px] text-zinc-500 font-black uppercase mt-1">Default</p>
                   {profile.activeTableSkinId ? (
                      <button 
                        onClick={() => handleEquipTable(null)}
                        className="w-full mt-3 py-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all"
                      >
                        Equip
                      </button>
                   ) : (
                      <div className="w-full mt-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-1">
                         <Check size={12} /> Equipped
                      </div>
                   )}
                </div>
             </div>

              {ownedTables.map(table => {
                const isCurrent = profile.activeTableSkinId === table.id;
                return (
                   <div key={table.id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 flex flex-col gap-4 relative">
                      <div className="aspect-[3/2] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden relative shadow-md">
                         <img src={table.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-end">
                         <p className="font-bold text-sm truncate">{table.name}</p>
                         <p className="text-[9px] font-black uppercase text-yellow-500 mt-1">{table.rarity}</p>
                         {isCurrent ? (
                            <div className="w-full mt-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-1">
                               <Check size={12} /> Equipped
                            </div>
                         ) : (
                            <button 
                              onClick={() => handleEquipTable(table.id)}
                              className="w-full mt-3 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded-xl text-xs font-bold transition-all"
                            >
                              Equip
                            </button>
                         )}
                      </div>
                   </div>
                );
              })}
              {ownedTables.length === 0 && (
                 <div className="col-span-2 py-16 text-center border border-dashed border-white/5 rounded-3xl">
                    <p className="text-zinc-500 font-bold text-sm">You do not own any custom tables.</p>
                 </div>
              )}
          </div>
        ) : (
          <div>
             {ownedEmojis.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-white/5 rounded-3xl">
                   <p className="text-zinc-500 font-bold text-sm">You do not own any premium emojis/GIFs yet.</p>
                   <p className="text-xs text-zinc-600 mt-1">Acquire them from the store using chips!</p>
                </div>
             ) : (
                <div className="grid grid-cols-3 gap-4">
                   {ownedEmojis.map(emoji => (
                     <div key={emoji.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <div className="w-full aspect-square bg-black/40 border border-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                           <img src={emoji.url} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                        <p className="text-xs font-bold text-zinc-300 truncate w-full text-center">{emoji.name}</p>
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{emoji.type}</span>
                     </div>
                   ))}
                </div>
             )}
          </div>
        )}
      </div>

      {setActiveTab && language && (
        <TapBar activeTab="my-items" setActiveTab={setActiveTab} language={language} />
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  MoreHorizontal,
  Maximize2,
  Mic,
  MicOff,
  Menu,
  Gift,
  MessageSquare,
  User,
  Volume2,
  Plus,
  Smile,
  Coins,
  Swords,
  Clock,
  X,
  Send,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Copy,
  UserPlus,
  ChevronRight,
  ChevronUp,
  Trophy,
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import {
  doc,
  collection,
  onSnapshot,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { SuperWinnerUI } from "./SuperWinnerUI";
import { RoomProfileView } from "./RoomProfileView";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));

  if (
    errorMessage.includes("Quota limit exceeded") ||
    errorMessage.includes("resource-exhausted")
  ) {
    alert(
      "Database limit reached. Please try again later today or tomorrow when the free quota resets.",
    );
  } else {
    alert("An error occurred with the database. Please try again.");
  }
}
import { RoomLevelView } from "./RoomLevelView";

import { AvatarFrame, ChatBubble } from "./LevelShowcaseView";

export function PartyRoomView({ user, profile, roomId, onBack }: any) {
  const [showGift, setShowGift] = useState(false);
  const [showSuperWinner, setShowSuperWinner] = useState(false);
  const [showRoomProfile, setShowRoomProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRoomLevel, setShowRoomLevel] = useState(false);
  const [showPKTimes, setShowPKTimes] = useState(false);
  const [isPKMode, setIsPKMode] = useState(false);
  const [pkTime, setPkTime] = useState(0);
  const [pkLeftScore, setPkLeftScore] = useState(0);
  const [pkRightScore, setPkRightScore] = useState(0);
  const [pkSendersLeft, setPkSendersLeft] = useState<any[]>([]);
  const [pkSendersRight, setPkSendersRight] = useState<any[]>([]);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [seats, setSeats] = useState<Record<string, any>>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedSeatUser, setSelectedSeatUser] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!roomData?.ownerId) return;
    if (roomData.ownerId === user?.uid) {
      setOwnerProfile(profile);
      return;
    }
    const un = onSnapshot(doc(db, "users", roomData.ownerId), (docSnap) => {
      if (docSnap.exists()) {
        setOwnerProfile(docSnap.data());
      }
    });
    return un;
  }, [roomData?.ownerId, user?.uid, profile]);

  const topContributors = React.useMemo(() => {
    const map: Record<string, { senderId: string; senderName: string; totalAmount: number }> = {};
    
    // Add default mock contributors if empty
    const defaultContribs = [
      { senderId: "c1", senderName: "Leo", totalAmount: 5000 },
      { senderId: "c2", senderName: "Sara", totalAmount: 2500 },
      { senderId: "c3", senderName: "Mina", totalAmount: 1000 }
    ];

    banners.forEach((b) => {
      const id = b.senderId;
      const price = Number(b.giftPrice) || 0;
      if (!id) return;
      if (!map[id]) {
        map[id] = { senderId: id, senderName: b.senderName || "User", totalAmount: 0 };
      }
      map[id].totalAmount += price;
    });

    const activeContribs = Object.values(map);
    const merged = [...activeContribs];
    defaultContribs.forEach(dc => {
      if (!merged.some(m => m.senderId === dc.senderId)) {
        merged.push(dc);
      }
    });

    return merged.sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 3);
  }, [banners]);

  const [showLuckyBagSend, setShowLuckyBagSend] = useState(false);
  const [activeLuckyBag, setActiveLuckyBag] = useState<any>(null);
  const [luckyBags, setLuckyBags] = useState<any[]>([]);
  const [showLuckyBagDetail, setShowLuckyBagDetail] = useState<any>(null);

  useEffect(() => {
    if (!roomId || !user) return;
    const unBags = onSnapshot(
      query(collection(db, `partyRooms/${roomId}/luckyBags`), orderBy("createdAt", "desc")),
      (snapshot) => {
        const bags = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLuckyBags(bags);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `partyRooms/${roomId}/luckyBags`)
    );
    return () => unBags();
  }, [roomId, user?.uid]);

  useEffect(() => {
    if (!roomId || !user) return;

    if (roomId === "local-room-1") {
      setRoomData({
        title: profile?.displayName
          ? `${profile.displayName}'s Room`
          : "My Party Room",
        ownerId: user.uid,
        type: "audio",
      });
      return;
    }

    // Room
    const unRoom = onSnapshot(
      doc(db, "partyRooms", roomId),
      (doc) => {
        setRoomData(doc.data());
      },
      (error) =>
        handleFirestoreError(error, OperationType.GET, `partyRooms/${roomId}`),
    );

    // Seats
    const unSeats = onSnapshot(
      collection(db, `partyRooms/${roomId}/seats`),
      (snapshot) => {
        const s: any = {};
        snapshot.forEach((d) => {
          s[d.id] = d.data();
        });
        setSeats(s);

        // Auto detect user seat
        let mySet = null;
        for (const [id, sd] of Object.entries(s)) {
          if ((sd as any).userId === user?.uid) mySet = parseInt(id);
        }
        setMySeat(mySet);
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `partyRooms/${roomId}/seats`,
        ),
    );

    // Banners
    const unBanners = onSnapshot(
      query(
        collection(db, `partyRooms/${roomId}/banners`),
        orderBy("createdAt", "desc"),
        limit(5),
      ),
      (snapshot) => {
        const serverBanners = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .reverse();

        // We only want banners that were created in the last 10 seconds to show up initially,
        // and then we will cull them on the client side using a timer
        const recent = serverBanners.filter(
          (b) => Date.now() - (b as any).createdAt < 10000,
        );
        setBanners(recent);
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `partyRooms/${roomId}/banners`,
        ),
    );

    // Messages
    const unMessages = onSnapshot(
      query(
        collection(db, `partyRooms/${roomId}/messages`),
        orderBy("createdAt", "desc"),
        limit(30),
      ),
      (snapshot) => {
        const serverMessages = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setMessages([
          ...serverMessages,
          {
            type: "system",
            text: "Welcome to Yari Konkan. Please respect each other and chat politely.",
          },
          {
            type: "announcement",
            text: "بەخێربێیت! با بەیەکەوە گفتوگۆ بکەین!",
          },
        ]);
      },
      (error) =>
        handleFirestoreError(
          error,
          OperationType.LIST,
          `partyRooms/${roomId}/messages`,
        ),
    );

    return () => {
      unRoom();
      unSeats();
      unBanners();
      unMessages();
    };
  }, [roomId, user?.uid]);

  // Auto join as host if room owner
  useEffect(() => {
    if (!roomData || !user || !roomId) return;
    if (roomData.ownerId === user.uid && mySeat === null && !seats[1]) {
      handleTakeSeat(1);
    }
  }, [roomData, user, roomId, mySeat, seats]);

  // Cull old banners locally
  useEffect(() => {
    const interval = setInterval(() => {
      setBanners((prev) => prev.filter((b) => Date.now() - b.createdAt < 7000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPKMode && pkTime > 0) {
      timer = setInterval(() => {
        setPkTime((prev) => prev - 1);
      }, 1000);
    } else if (pkTime === 0 && isPKMode) {
      setIsPKMode(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPKMode, pkTime]);

  const formatId = profile?.shortId || user?.uid?.substring(0, 8);
  const displaySeats = Array.from({ length: 16 }).map((_, i) => ({
    id: i + 1,
    occupied: !!seats[i + 1],
    data: seats[i + 1],
  }));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !roomId) return;
    try {
      await setDoc(doc(collection(db, `partyRooms/${roomId}/messages`)), {
        type: "user",
        text: chatInput,
        userId: user.uid,
        userName: profile?.displayName || "Guest",
        userPhoto: profile?.photoURL || "",
        createdAt: Date.now(),
      });
      setChatInput("");
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `partyRooms/${roomId}/messages`,
      );
    }
  };

  const handleSendGift = async (gift: any) => {
    if (!user || !profile || !roomId) return;
    try {
      await runTransaction(db, async (trans) => {
        const userRef = doc(db, "users", user.uid);
        const uSnap = await trans.get(userRef);
        if (!uSnap.exists()) return;
        const currentChips = uSnap.data().chips || 0;
        const currentExp = uSnap.data().vipExp || 0;
        
        const qty = Number(gift.quantity) || 1;
        const totalCost = gift.price * qty;
        const newExp = currentExp + totalCost;
        const newLevel = Math.floor(newExp / 1000) + 1;
        
        if (currentChips < totalCost) throw new Error("Not enough chips");
        trans.update(userRef, {
          chips: currentChips - totalCost,
          vipExp: newExp,
          level: newLevel,
        });

        const targetNames = (gift.targetSeats || [])
          .map((seatId: number) => seats[seatId]?.userName)
          .filter(Boolean)
          .join(", ") || "Room";

        const newBannerRef = doc(
          collection(db, `partyRooms/${roomId}/banners`),
        );
        trans.set(newBannerRef, {
          senderId: user.uid,
          senderName: profile.displayName || "Guest",
          senderPhoto: profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          giftId: gift.id || 1,
          giftName: gift.name,
          giftPrice: gift.price,
          giftImage: gift.image,
          quantity: qty,
          receiverName: targetNames,
          createdAt: Date.now(),
        });

        const newMessageRef = doc(
          collection(db, `partyRooms/${roomId}/messages`),
        );
        trans.set(newMessageRef, {
          type: "event",
          text: `${profile.displayName || "Guest"} sent ${qty}x ${gift.name} to ${targetNames}`,
          userId: user.uid,
          createdAt: Date.now(),
        });
      });
      setShowGift(false);
      if (isPKMode) {
        const totalGiftVal = gift.price * (Number(gift.quantity) || 1);
        if (Math.random() > 0.5) {
          setPkLeftScore((prev) => prev + totalGiftVal);
          setPkSendersLeft((prev) => [...prev, profile]);
        } else {
          setPkRightScore((prev) => prev + totalGiftVal);
          setPkSendersRight((prev) => [...prev, profile]);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transaction:gift`);
    }
  };

  const [isMicOn, setIsMicOn] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);

  const requestMicPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
      }
    } catch (e) {
      console.error("Microphone permission denied", e);
    }
    return false;
  };

  const handleToggleMic = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = !isMicOn;

    if (newStatus) {
      const granted = await requestMicPermission();
      if (!granted) {
        alert("Please grant microphone permissions to speak.");
        return;
      }
    }

    setIsMicOn(newStatus);
    if (mySeat !== null && roomId) {
      try {
        await updateDoc(
          doc(db, `partyRooms/${roomId}/seats`, mySeat.toString()),
          {
            isMicOn: newStatus,
          },
        );
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleTakeSeat = async (seatId: number) => {
    if (!user || !roomId) return;
    if (mySeat !== null) return;

    let initialMicStatus = isMicOn;
    if (initialMicStatus) {
      const granted = await requestMicPermission();
      if (!granted) initialMicStatus = false;
      setIsMicOn(initialMicStatus);
    }

    try {
      await setDoc(doc(db, `partyRooms/${roomId}/seats`, seatId.toString()), {
        userId: user.uid,
        userName: profile?.displayName || "Guest",
        userPhoto: profile?.photoURL || "",
        level: profile?.level || 0,
        createdAt: Date.now(),
        isMicOn: initialMicStatus,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveSeat = async (seatId: number) => {
    if (!user || !roomId) return;
    if (seats[seatId]?.userId !== user.uid) return;
    try {
      await deleteDoc(doc(db, `partyRooms/${roomId}/seats`, seatId.toString()));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminMicOut = async (seatId: number) => {
    if (!user || !roomId) return;
    try {
      await deleteDoc(doc(db, `partyRooms/${roomId}/seats`, seatId.toString()));
      setSelectedSeatUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKickUser = async (userId: string) => {
    if (!roomId || !user) return;
    try {
      if (!roomData?.bannedUsers) {
        await updateDoc(doc(db, `partyRooms`, roomId), { bannedUsers: [userId] });
      } else {
        await updateDoc(doc(db, `partyRooms`, roomId), { bannedUsers: [...roomData.bannedUsers, userId] });
      }
      setSelectedSeatUser(null);
      // Remove from seat if they are on one
      const seatEntry = Object.entries(seats).find(([_, s]) => (s as any).userId === userId);
      if (seatEntry) {
        await deleteDoc(doc(db, `partyRooms/${roomId}/seats`, seatEntry[0]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!roomId) return;
    try {
      const admins = roomData?.admins || [];
      if (admins.includes(userId)) {
        await updateDoc(doc(db, `partyRooms`, roomId), { admins: admins.filter((id: string) => id !== userId) });
      } else {
        await updateDoc(doc(db, `partyRooms`, roomId), { admins: [...admins, userId] });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isRoomOwner = roomData?.ownerId === user?.uid;
  const isRoomAdmin = isRoomOwner || roomData?.admins?.includes(user?.uid) || profile?.isAdmin;

  useEffect(() => {
    if (roomData?.bannedUsers?.includes(user?.uid)) {
       alert("You have been kicked from this room.");
       onBack();
    }
  }, [roomData?.bannedUsers, user?.uid]);

  return (
    <div className="fixed inset-0 z-[300] bg-black font-sans flex flex-col overflow-hidden w-full h-full">
      {/* Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1574267432553-4b4628081524?w=800&h=1600&fit=crop')`,
          filter: "brightness(0.7) sepia(0.3) hue-rotate(-20deg) saturate(2)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        <div
          className={`absolute inset-0 ${isPKMode ? "opacity-0" : "bg-red-900/40 mix-blend-multiply"} transition-opacity`}
        />
      </div>

      {luckyBags.map((bag) => {
        const timeLeft = Math.max(0, Math.floor((bag.createdAt + bag.duration * 1000 - currentTime) / 1000));
        if (timeLeft <= 0 && bag.claimedBy?.includes(user?.uid)) return null;
        
        return (
          <div 
            key={bag.id}
            className="absolute top-[25%] right-4 z-[400] animate-bounce cursor-pointer flex flex-col items-center"
            onClick={() => setShowLuckyBagDetail(bag)}
          >
              <div className="w-14 h-14 bg-gradient-to-b from-yellow-300 via-pink-400 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(236,72,153,0.6)] cursor-pointer hover:scale-105 transition-transform">
                  <span className="text-2xl drop-shadow-md">💰</span>
              </div>
              <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded flex items-center justify-center mt-1 border border-white/20 relative z-10">
                 <span className="text-[10px] font-bold text-white tracking-widest uppercase text-nowrap">
                   {timeLeft > 0 ? `${timeLeft}s left` : 'Open'}
                 </span>
              </div>
          </div>
        );
      })}

      {isPKMode && (
        <div className="absolute top-0 inset-x-0 h-full z-0 flex pointer-events-none opacity-40">
          <div className="w-1/2 bg-gradient-to-r from-red-600 to-red-900" />
          <div className="w-1/2 bg-gradient-to-l from-blue-600 to-blue-900" />
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-2 flex items-start justify-between min-h-fit shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (mySeat !== null) handleLeaveSeat(mySeat);
              onBack();
            }}
            className="text-white p-1 -ml-2 drop-shadow-md active:scale-95 transition-transform"
          >
            <ChevronLeft size={28} />
          </button>
          <div
            className="flex items-center gap-2 bg-black/20 rounded-full pr-4 pl-1 py-1 backdrop-blur-sm border border-white/5 cursor-pointer active:scale-95 transition-transform"
            onClick={() => {
              if (ownerProfile) {
                setSelectedSeatUser({
                  userId: ownerProfile.userId || roomData?.ownerId,
                  userName: ownerProfile.displayName || roomData?.ownerName || "Room Host",
                  userPhoto: ownerProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${roomData?.ownerId}`,
                  level: ownerProfile.level || 1,
                });
              } else {
                setShowRoomProfile(true);
              }
            }}
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] relative">
              <img
                src={
                  ownerProfile?.photoURL ||
                  roomData?.ownerPhoto ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${roomData?.ownerId || "owner"}`
                }
                className="w-full h-full object-cover"
                alt="Avatar"
              />
              <div className="absolute inset-0 border border-white/20 rounded-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-white text-sm font-black truncate max-w-[100px] leading-tight block">
                {ownerProfile?.displayName || roomData?.ownerName || "ONLY ONE"}
              </span>
              <span className="text-white/60 text-[10px] font-bold">
                ID:{formatId}
              </span>
            </div>
            <div 
              className="w-6 h-6 ml-2 text-yellow-500 fill-current drop-shadow-md flex items-center justify-center hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setShowRoomLevel(true);
              }}
              title="Room Level"
            >
              🏅
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm mr-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-bold font-mono tracking-wider">
                {roomData?.viewers ||
                  Math.floor(Object.keys(seats).length * 84 + 172)}
              </span>
            </div>
            {topContributors.map((contrib, idx) => {
              const ringColor = idx === 0 
                ? "border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                : idx === 1 
                  ? "border-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.4)]" 
                  : "border-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.4)]";
              const crownEmoji = idx === 0 ? "👑" : idx === 1 ? "🥈" : "🥉";
              const photo = contrib.senderId === user?.uid 
                ? profile?.photoURL 
                : `https://api.dicebear.com/7.x/avataaars/svg?seed=${contrib.senderId}`;
              
              return (
                <div
                  key={contrib.senderId}
                  className={`w-8 h-8 rounded-full border-2 bg-black/40 flex items-center justify-center relative shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all ${ringColor}`}
                  onClick={() => {
                    setSelectedSeatUser({
                      userId: contrib.senderId,
                      userName: contrib.senderName,
                      userPhoto: photo,
                      level: Math.floor((contrib.totalAmount || 0) / 1000) + 1,
                    });
                  }}
                >
                  <img
                    src={photo}
                    className="w-full h-full object-cover rounded-full"
                    alt=""
                  />
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs select-none">
                    {crownEmoji}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black/80 rounded-full flex items-center justify-center text-white text-[9px] font-black border border-white/20">
                    {idx + 1}
                  </div>
                </div>
              );
            })}
            <button className="text-white drop-shadow-md ml-1">
              <MoreHorizontal size={24} />
            </button>
          </div>
          <div
            className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 mt-1 cursor-pointer active:scale-95 transition-transform"
            onClick={() => setShowGift(true)}
          >
            <span className="text-yellow-400 text-sm">🌻</span>
            <span className="text-white font-bold text-xs tracking-wide">
              Room Gifts
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 mt-2 flex flex-col gap-2">
        {!isPKMode && (
          <div>
            <div
              onClick={() => setShowRoomLevel(true)}
              className="bg-[#00c853] text-white px-3 py-0.5 rounded-full inline-flex font-bold text-xs shadow-md border border-[#00e676] cursor-pointer active:scale-95 transition-transform"
            >
              Lv.1
            </div>
          </div>
        )}

        {isPKMode && (
          <div className="flex flex-col items-center w-full justify-between mt-2 max-w-md mx-auto">
            <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm mb-2 cursor-pointer" onClick={() => alert("Showing all participants...")}>
              <User size={12} className="text-white/80" />
              <span className="text-white text-xs font-bold font-mono tracking-wider">
                {roomData?.viewers ||
                  Math.floor(Object.keys(seats).length * 84 + 172)}
              </span>
            </div>
            <div className="flex items-center w-full justify-between items-start" onClick={() => alert("Showing PK contributor leaderboard")}>
              <div className="flex-1 flex flex-col items-start gap-1 cursor-pointer">
                <div className="w-full bg-gradient-to-r from-red-600 to-red-500 h-8 rounded-l-full flex items-center px-4 border border-red-400/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                  <span className="text-white font-black text-sm drop-shadow-md">
                    LV4
                  </span>
                  <span className="text-yellow-400 font-bold ml-2 flex items-center gap-1 text-xs shadow-sm">
                    <Coins size={12} className="fill-current" />{" "}
                    {pkLeftScore.toLocaleString()}
                  </span>
                </div>
                <div className="flex px-2 -space-x-2 w-full mt-1 overflow-visible">
                  {pkSendersLeft.slice(-5).map((p, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full overflow-hidden border border-white shrink-0 relative z-[1] shadow-sm"
                    >
                      <img
                        src={
                          p.photoURL ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.displayName}`
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-3 md:px-6 relative z-10 font-black italic text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0 flex flex-col items-center">
                <span className="text-[#ff1744] text-[10px] font-bold not-italic drop-shadow-none mb-[-4px]">
                  PK
                </span>
                {Math.floor(pkTime / 60)}:
                {(pkTime % 60).toString().padStart(2, "0")}
              </div>

              <div className="flex-1 flex flex-col items-end gap-1">
                <div className="w-full bg-gradient-to-l from-blue-600 to-blue-500 h-8 rounded-r-full flex items-center justify-end px-4 border border-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  <span className="text-yellow-400 font-bold mr-2 flex items-center gap-1 text-xs shadow-sm">
                    <Coins size={12} className="fill-current" />{" "}
                    {pkRightScore.toLocaleString()}
                  </span>
                  <span className="text-white font-black text-sm drop-shadow-md">
                    LV2
                  </span>
                </div>
                <div className="flex px-2 -space-x-2 w-full mt-1 overflow-visible justify-end">
                  {pkSendersRight.slice(-5).map((p, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full overflow-hidden border border-white shrink-0 relative z-[1] shadow-sm"
                    >
                      <img
                        src={
                          p.photoURL ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.displayName}`
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-4 gap-x-2 gap-y-3 sm:gap-y-6 px-6 mt-4 sm:mt-8 max-w-sm mx-auto w-full shrink-0">
        {displaySeats.map((seat) => (
          <div
            key={seat.id}
            className="flex flex-col items-center gap-2 relative"
          >
            {seat.id === 1 ? (
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  seat.data && mySeat !== 1 && setSelectedSeatUser({ ...seat.data, seatId: seat.id })
                }
              >
                {seat.data?.isMicOn && (
                  <div
                    className="absolute inset-x-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full border-[3px] border-green-400 opacity-50 animate-ping shadow-[0_0_15px_rgba(34,197,94,0.8)] pointer-events-none"
                    style={{ animationDuration: "1.5s" }}
                  />
                )}
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 ${seat.data?.isMicOn ? "border-green-400" : "border-[#ffcc00]"} shadow-[0_0_15px_rgba(255,204,0,0.4)] relative p-0.5 bg-black`}
                >
                  <img
                    src={
                      roomData?.image ||
                      "https://images.unsplash.com/photo-1574267432553-4b4628081524?w=150&h=150&fit=crop"
                    }
                    className={`w-full h-full object-cover rounded-full ${seat.data?.isMicOn ? "scale-[1.05] transition-transform" : ""}`}
                    alt="Host"
                  />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center z-10">
                  <span className="text-2xl drop-shadow-md">👑</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 z-10 flex items-center justify-center">
                  {mySeat === 1 ? (
                    <button
                      onClick={handleToggleMic}
                      className="w-full h-full bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md active:scale-90 transition-transform"
                    >
                      {isMicOn ? (
                        <Mic size={12} className="text-green-400" />
                      ) : (
                        <MicOff size={12} className="text-red-400" />
                      )}
                    </button>
                  ) : (
                    <div className="w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md">
                      {seat.data?.isMicOn ? (
                        <Mic
                          size={10}
                          className="text-green-400 animate-pulse"
                        />
                      ) : (
                        <MicOff size={10} className="text-white/50" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : seat.data ? (
              <div
                className="relative cursor-pointer active:scale-95 transition-transform"
                onClick={() =>
                  mySeat === seat.id
                    ? handleLeaveSeat(seat.id)
                    : setSelectedSeatUser({ ...seat.data, seatId: seat.id })
                }
              >
                {seat.data.isMicOn && (
                  <div
                    className="absolute inset-0 rounded-full border-[3px] border-green-400 opacity-50 animate-ping shadow-[0_0_15px_rgba(34,197,94,0.8)] pointer-events-none"
                    style={{ animationDuration: "1.5s" }}
                  />
                )}
                <AvatarFrame
                  level={seat.data.level || 1}
                  className={`w-14 h-14 sm:w-[72px] sm:h-[72px] ${mySeat === seat.id ? "drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]" : ""} ${seat.data.isMicOn ? "scale-[1.05] transition-transform" : ""}`}
                  src={
                    seat.data.userPhoto ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=U"
                  }
                />
                {mySeat === seat.id ? (
                  <button
                    onClick={handleToggleMic}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md active:scale-90 transition-transform z-10"
                  >
                    {isMicOn ? (
                      <Mic size={12} className="text-green-400" />
                    ) : (
                      <MicOff size={12} className="text-red-400" />
                    )}
                  </button>
                ) : (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md z-10">
                    {seat.data.isMicOn ? (
                      <Mic size={10} className="text-green-400 animate-pulse" />
                    ) : (
                      <MicOff size={10} className="text-white/50" />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleTakeSeat(seat.id)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-900/30 backdrop-blur-sm border border-red-500/20 shadow-inner flex items-center justify-center active:bg-red-800/40 transition-colors"
              >
                <Plus
                  size={20}
                  className="text-white/40 font-light"
                  strokeWidth={1.5}
                />
              </button>
            )}
            <span
              className={`text-[11px] font-bold drop-shadow-md tracking-wider max-w-[50px] truncate ${seat.id === 1 || seat.data ? "text-white" : "text-white/50"}`}
            >
              {seat.id === 1
                ? "Host"
                : seat.data
                  ? seat.data.userName || "Guest"
                  : seat.id}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Chat / Announcements */}
      <div className="relative z-10 px-4 pb-4 mt-auto space-y-3 pointer-events-none min-h-[140px] flex flex-col justify-end shrink-0">
        {/* Banners */}
        <div className="absolute bottom-[200px] left-4 right-4 flex flex-col gap-3 pointer-events-none z-50 items-start overflow-visible">
          <AnimatePresence>
            {banners.map((banner) => (
              <motion.div
                key={banner.id}
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                onClick={() => {
                  setSelectedSeatUser({
                    userId: banner.senderId,
                    userName: banner.senderName,
                    userPhoto: banner.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${banner.senderId}`,
                    level: 1,
                  });
                }}
                className="bg-gradient-to-r from-[#293af5] via-[#4f3eff] to-[#0c0a21] rounded-full flex items-center pl-2 pr-5 py-1.5 drop-shadow-2xl shadow-lg border border-white/20 relative cursor-pointer pointer-events-auto active:scale-95 transition-transform"
                style={{ minWidth: "280px" }}
              >
                {/* Left side avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 shrink-0 bg-black/40">
                  <img
                    src={banner.senderPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${banner.senderId}`}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                </div>

                {/* Senders and targets text */}
                <div className="flex flex-col ml-3 flex-1 min-w-0 text-left">
                  <span className="text-white font-extrabold text-xs tracking-wide leading-tight truncate">
                    {banner.senderName}
                  </span>
                  <span className="text-[10px] leading-tight mt-0.5 truncate text-yellow-300">
                    Send <span className="text-white font-bold">{banner.receiverName || "Room"}</span>
                  </span>
                </div>

                {/* Overlapping Gift emoji */}
                <div className="w-12 h-12 shrink-0 relative -top-1 ml-3 flex items-center justify-center">
                  <img
                    src={
                      banner.giftImage ||
                      "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/gift.svg"
                    }
                    className="w-[110%] h-[110%] max-w-none object-contain drop-shadow-md scale-110 relative"
                    alt=""
                  />
                </div>

                {/* Multiplier */}
                <span className="text-yellow-400 font-extrabold italic ml-3 text-2xl font-serif select-none">
                  X {banner.quantity || 1}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Left floating buttons */}
        <div className="absolute -top-16 left-4 flex flex-col gap-3">
          <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center pointer-events-auto shadow-sm">
            <Maximize2 size={16} className="text-white/80" />
          </button>
          <button className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1.5 rounded-md shadow-md pointer-events-auto">
            <span className="text-black text-[10px] font-black uppercase">
              ALL
            </span>
            <ChevronLeft size={14} className="text-black rotate-[270deg]" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[160px] flex flex-col-reverse gap-2 mask-image-b pb-2 pointer-events-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="flex flex-col items-start drop-shadow-md pointer-events-auto"
            >
              {msg.type === "announcement" && (
                <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-xl px-4 py-2 font-bold text-sm tracking-wide text-right w-fit max-w-[85%] rounded-tl-none relative isolate">
                  {msg.text}
                </div>
              )}
              {msg.type === "system" && (
                <div className="bg-black/50 backdrop-blur-md border-[0.5px] border-white/20 text-white rounded-xl px-4 py-2 font-bold text-[13px] tracking-wide w-fit max-w-[85%] rounded-bl-sm mt-1">
                  {msg.text}
                </div>
              )}
              {msg.type === "event" && (
                <div className="bg-black/50 backdrop-blur-md border-[0.5px] border-white/10 text-white rounded-2xl px-4 py-2 text-[13px] tracking-wide w-fit max-w-[85%] mt-1 flex gap-1 font-semibold text-white/90">
                  {msg.text}
                </div>
              )}
              {msg.type === "user" && (
                <div className="flex items-start gap-2 max-w-[85%] mt-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20 mt-1">
                    <img
                      src={
                        msg.userPhoto ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white/60 text-[10px] font-bold ml-1 mb-0.5">
                      {msg.userName}
                    </span>
                    <ChatBubble level={msg.userLevel || 1}>
                      <span className="text-white text-[13px] font-medium leading-relaxed">
                        {msg.text}
                      </span>
                    </ChatBubble>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 px-3 pb-6 pt-4 flex items-center gap-2 w-full bg-gradient-to-t from-black/80 to-transparent shrink-0">
        <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
          <Volume2 size={20} className="text-white" />
        </button>

        <button
          onClick={handleToggleMic}
          className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border ${isMicOn ? "border-green-400 border-2 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "border-white/10"} flex items-center justify-center shrink-0 active:scale-95 transition-transform`}
        >
          {isMicOn ? (
            <Mic size={20} className="text-green-400" />
          ) : (
            <MicOff size={20} className="text-white" />
          )}
        </button>

        <button
          onClick={() => setShowMusicModal(true)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
        >
          <Music size={20} className="text-[#a855f7]" />
        </button>

        <form
          onSubmit={handleSendMessage}
          className="flex-1 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-1 flex items-center min-w-0"
        >
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            type="text"
            placeholder="Say something..."
            className="bg-transparent border-none outline-none text-white text-[13px] font-medium w-full placeholder-white/50"
          />
          {chatInput.trim() && (
            <button
              type="submit"
              className="w-8 h-8 rounded-full bg-[#ff7242] flex items-center justify-center shrink-0 ml-1 active:scale-95 transition-transform shadow-md"
            >
              <Send size={14} className="text-white -ml-0.5 mt-0.5" />
            </button>
          )}
        </form>

        {user?.uid === roomData?.ownerId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(true)}
              className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0"
            >
              <Menu size={20} className="text-white" />
            </button>
          </div>
        )}

        <button
          onClick={() => setShowLuckyBagSend(true)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0 relative pointer-events-auto active:scale-95 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
        >
          <span className="text-xl drop-shadow-md pb-0.5">💰</span>
        </button>

        <button
          onClick={() => setShowSuperWinner(true)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0 relative pointer-events-auto active:scale-95"
        >
          <Trophy className="text-[#ffb300]" size={22} />
        </button>

        <button
          onClick={() => setShowGift(true)}
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0 relative pointer-events-auto active:scale-95"
        >
          <Gift className="text-[#ff7242]" size={24} />
        </button>

        <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 relative">
          <MessageSquare size={20} className="text-white" />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff1744] text-white rounded-full flex items-center justify-center text-[10px] font-black border border-black/50 shadow-sm">
            12
          </div>
        </button>
      </div>

      {showGift && (
        <GiftUI
          onClose={() => setShowGift(false)}
          onSendGift={handleSendGift}
          seats={seats}
          user={user}
          profile={profile}
        />
      )}
      {showLuckyBagSend && (
        <LuckyBagUI 
          onClose={() => setShowLuckyBagSend(false)} 
          onSend={async (bag) => {
             if (!roomId || !user) return;
             try {
                await runTransaction(db, async (transaction) => {
                   const userRef = doc(db, "users", user.uid);
                   const userSnap = await transaction.get(userRef);
                   if (!userSnap.exists()) throw new Error("User not found");
                   const currentChips = userSnap.data().chips || 0;
                   if (currentChips < bag.total) {
                      alert("Insufficient chips!");
                      return;
                   }
                   
                   const bagRef = doc(collection(db, `partyRooms/${roomId}/luckyBags`));
                   transaction.set(bagRef, {
                      ...bag,
                      senderId: user.uid,
                      senderName: profile?.displayName || "Guest",
                      senderPhoto: profile?.photoURL || "",
                      createdAt: Date.now(),
                      claimedBy: [],
                      remainingQty: bag.qty,
                      remainingTotal: bag.total
                   });

                   transaction.update(userRef, {
                      chips: currentChips - bag.total
                   });
                });
                setShowLuckyBagSend(false);
             } catch (e) {
                console.error(e);
                handleFirestoreError(e, OperationType.WRITE, `partyRooms/${roomId}/luckyBags`);
             }
          }} 
        />
      )}
      {showLuckyBagDetail && (
        <LuckyBagDetailModal
          bag={showLuckyBagDetail}
          user={user}
          onClose={() => setShowLuckyBagDetail(null)}
          onClaim={async (bagId) => {
             if (!roomId || !user) return;
             try {
                let winAmount = 0;
                await runTransaction(db, async (transaction) => {
                   const bagRef = doc(db, `partyRooms/${roomId}/luckyBags`, bagId);
                   const userRef = doc(db, "users", user.uid);
                   
                   const [bagSnap, uSnap] = await Promise.all([
                      transaction.get(bagRef),
                      transaction.get(userRef)
                   ]);

                   if (!bagSnap.exists()) return;
                   const data = bagSnap.data();
                   if (data.claimedBy?.includes(user.uid)) return;
                   if (data.remainingQty <= 0) return;

                   winAmount = data.remainingQty === 1 ? data.remainingTotal : Math.floor(Math.random() * (data.remainingTotal / data.remainingQty) * 2) + 1;
                   
                   transaction.update(bagRef, {
                      claimedBy: [...(data.claimedBy || []), user.uid],
                      remainingQty: data.remainingQty - 1,
                      remainingTotal: data.remainingTotal - winAmount
                   });

                   if (uSnap.exists()) {
                      transaction.update(userRef, {
                         chips: (uSnap.data().chips || 0) + winAmount
                      });
                   }
                });
                
                if (winAmount > 0) {
                   alert(`Congratulations! You claimed ${winAmount} coins!`);
                }
                setShowLuckyBagDetail(null);
             } catch (e) {
                console.error(e);
             }
          }}
        />
      )}
      {showMusicModal && (
        <MusicModal onClose={() => setShowMusicModal(false)} />
      )}
      {showMenu && (
        <div className="fixed inset-0 z-[600] flex flex-col justify-end bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="flex-1 w-full" onClick={() => setShowMenu(false)} />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full p-6 pb-12 shadow-2xl relative max-h-[85vh] overflow-y-auto"
          >
            <h2 className="text-black font-black text-lg mb-6">Tools</h2>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <button className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#fff5ea] opacity-50" />
                  <img
                    src="https://api.dicebear.com/7.x/notionists/svg?seed=Lucky"
                    alt="lucky bag"
                    className="w-8 h-8 z-10"
                  />
                </div>
                <span className="text-xs font-bold text-gray-500">
                  Lucky bag
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  setShowMusicModal(true);
                  setShowMenu(false);
                }}
              >
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                  <Music size={24} className="text-[#00e676]" />
                </div>
                <span className="text-xs font-bold text-gray-500">Music</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-500">Effect</span>
              </button>
            </div>

            <h2 className="text-black font-black text-lg mb-6">
              Interactive Features
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  setIsPKMode(true);
                  setPkTime(5 * 60);
                  setShowMenu(false);
                }}
              >
                <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-md bg-gradient-to-br from-blue-600 to-purple-600 p-[2px]">
                  <div className="w-full h-full bg-gradient-to-b from-[#ff8a65] to-[#f4511e] rounded-[1rem] flex items-center justify-center p-2 relative overflow-hidden">
                    <span className="text-white font-black text-2xl drop-shadow-md z-10 italic tracking-tighter">
                      PK
                    </span>
                    <div className="absolute -right-2 -bottom-2 w-8 h-8 bg-white/20 rounded-full blur-md" />
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-600 mt-1">PK</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-md bg-gradient-to-br from-orange-400 to-red-500 p-[2px]">
                  <div className="w-full h-full bg-gradient-to-b from-[#fcd34d] to-[#fb923c] rounded-[1rem] flex flex-col items-center justify-center relative overflow-hidden">
                    <span className="text-white font-black text-sm drop-shadow-md z-10 italic">
                      Score
                    </span>
                    <div className="absolute inset-0 bg-[#fbbf24]/50 rounded-[1rem]" />
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-600 mt-1">
                  Scoreboard
                </span>
              </button>
              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  setShowSuperWinner(true);
                  setShowMenu(false);
                }}
              >
                <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-md bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[2px]">
                  <div className="w-full h-full bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] rounded-[1rem] flex items-center justify-center relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full border-[3px] border-[#fbbf24] flex items-center justify-center relative shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                      <div className="w-3 h-3 bg-[#fbbf24] rounded-full shadow-inner" />
                      <div className="absolute -top-1 w-1 h-3 bg-[#fcd34d] rounded-full" />
                      <div className="absolute top-1/2 -right-1 w-3 h-1 bg-[#fcd34d] rounded-full" />
                      <div className="absolute -bottom-1 w-1 h-3 bg-[#fcd34d] rounded-full" />
                      <div className="absolute top-1/2 -left-1 w-3 h-1 bg-[#fcd34d] rounded-full" />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-600 mt-1">
                  Super Winner
                </span>
              </button>

              <button
                className="flex flex-col items-center gap-2"
                onClick={() => {
                  alert("Ludo game is starting! Roll the dice!");
                  setShowMenu(false);
                }}
              >
                <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 p-[2px]">
                  <div className="w-full h-full bg-gradient-to-b from-[#34d399] to-[#059669] rounded-[1rem] flex items-center justify-center relative overflow-hidden text-3xl pb-1 shadow-inner">
                    🎲
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-600 mt-1">
                  Ludo
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {showRoomProfile && (
        <RoomProfileView
          onClose={() => setShowRoomProfile(false)}
          roomData={roomData}
          profile={profile}
          user={user}
        />
      )}
      {showSuperWinner && (
        <SuperWinnerUI
          onClose={() => setShowSuperWinner(false)}
          roomId={roomId}
          user={user}
          profile={profile}
        />
      )}
      {showRoomLevel && (
        <RoomLevelView
          onBack={() => setShowRoomLevel(false)}
          profile={profile}
          roomData={roomData}
        />
      )}

      {selectedSeatUser && (
        <div className="fixed inset-0 z-[500] bg-black/60 flex flex-col justify-end">
          <div
            className="h-[20vh] w-full"
            onClick={() => setSelectedSeatUser(null)}
          />
          <div className="bg-white rounded-t-3xl min-h-[50vh] flex flex-col relative w-full font-sans max-w-lg mx-auto overflow-hidden">
            <div className="h-32 bg-[#2d1b4e] relative flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-30"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1574267432553-4b4628081524?w=800&h=1600&fit=crop')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d1b4e] to-transparent pointer-events-none" />
            </div>

            <div className="absolute top-[60px] left-6 z-10">
              <div className="w-[88px] h-[88px] rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-md">
                <img
                  src={
                    selectedSeatUser.userPhoto ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=X"
                  }
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div
              className="absolute top-[16px] left-4 z-10 cursor-pointer p-2"
              onClick={() => setSelectedSeatUser(null)}
            >
              <ChevronLeft className="text-white drop-shadow-md" size={28} />
            </div>
            <div className="absolute top-[16px] right-4 z-10 cursor-pointer p-2">
              <MoreHorizontal className="text-white drop-shadow-md" size={24} />
            </div>

            <div className="px-6 pt-12 flex flex-col flex-1 pb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-black tracking-tight text-black">
                  {selectedSeatUser.userName}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                <span className="text-[14px] font-bold">
                  ID:{selectedSeatUser.userId?.substring(0, 8) || "28643239"}
                </span>
                <Copy
                  size={12}
                  className="cursor-pointer hover:text-gray-600 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    const el = document.createElement("textarea");
                    el.value =
                      selectedSeatUser.userId?.substring(0, 8) || "28643239";
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand("copy");
                    document.body.removeChild(el);
                  }}
                />
              </div>

              <div className="flex items-center flex-wrap gap-2 mt-8">
                <div className="bg-[#00b0ff] px-2 py-0.5 rounded-full text-white text-[11px] font-extrabold shadow-sm flex items-center gap-1">
                  <span className="text-[9px]">♂</span> 18
                </div>
                <div className="bg-[#b388ff] px-2 py-0.5 rounded-full text-white text-[11px] font-extrabold shadow-sm tracking-wide">
                  ENTP
                </div>
                <div className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 text-[11px] font-bold flex items-center gap-1">
                  <span className="mb-[1px]">📍</span> Arbil
                </div>
                <div className="bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 text-[11px] font-bold flex items-center gap-1">
                  <span className="mb-[1px]">🕒</span> 12 Days
                </div>
                <ChevronRight size={14} className="text-gray-300 ml-auto" />
              </div>

              <div className="mt-4 flex pb-8 border-b border-gray-100 flex-wrap gap-2 items-center">
                <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-lg p-0.5 pr-8 pl-1 pb-1 pt-1 flex items-center shadow-sm border border-purple-400">
                  <div className="w-7 h-7 bg-green-500 rounded-full border border-white shadow-sm flex items-center justify-center relative">
                    <span className="text-white text-[10px] font-black drop-shadow-md">
                      👑
                    </span>
                  </div>
                  <span className="text-white font-black text-[13px] ml-2 drop-shadow-sm">
                    Lv.{selectedSeatUser.level || 0}
                  </span>
                </div>
                {roomData?.admins?.includes(selectedSeatUser.userId) && (
                  <div className="bg-red-500 rounded-lg px-2 py-1 text-white text-[11px] font-black uppercase">
                    Admin
                  </div>
                )}
              </div>

              {isRoomAdmin && selectedSeatUser.userId !== user.uid && (
                <div className="flex gap-2 flex-wrap mt-4">
                   <button onClick={() => handleAdminMicOut(selectedSeatUser.seatId)} className="bg-gray-200 px-3 py-2 rounded-xl text-[12px] font-black text-gray-800 uppercase flex-1 shadow">Mic Out</button>
                   <button onClick={() => handleKickUser(selectedSeatUser.userId)} className="bg-red-100 px-3 py-2 rounded-xl text-[12px] font-black text-red-600 uppercase flex-1 shadow border border-red-200">Kick User</button>
                   {isRoomOwner && (
                      <button onClick={() => handleToggleAdmin(selectedSeatUser.userId)} className="bg-blue-100 px-3 py-2 rounded-xl text-[12px] font-black text-blue-600 uppercase flex-1 shadow border border-blue-200">
                         {roomData?.admins?.includes(selectedSeatUser.userId) ? 'Remove Admin' : 'Set Admin'}
                      </button>
                   )}
                </div>
              )}

              <div className="mt-auto pt-8 flex items-center gap-4 w-full">
                <button className="flex-1 bg-[#ff6b4a] py-[14px] rounded-full text-white font-black flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,107,74,0.3)] active:bg-[#e05638] transition-colors text-[16px]">
                  <UserPlus size={20} strokeWidth={2.5} /> Add
                </button>
                <button className="flex-1 bg-[#ff6b4a] py-[14px] rounded-full text-white font-black flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(255,107,74,0.3)] active:bg-[#e05638] transition-colors text-[16px]">
                  <MessageSquare size={20} strokeWidth={2.5} /> Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LuckyBagUI({ onClose, onSend }: { onClose: () => void, onSend: (bag: any) => void }) {
  const [tab, setTab] = useState('Room');
  const [total, setTotal] = useState(1000);
  const [qty, setQty] = useState(6);
  const [duration, setDuration] = useState(20);
  const [condition, setCondition] = useState('All');

  return (
    <div className="fixed inset-0 z-[600] bg-black/70 flex items-center justify-center p-4">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         exit={{ scale: 0.9, opacity: 0 }}
         className="w-full max-w-sm bg-[#1c222d] rounded-[2.5rem] overflow-hidden relative shadow-2xl flex flex-col pt-12 border border-white/5"
       >
          <div className="absolute top-5 right-5 z-10 cursor-pointer bg-white/10 p-1 rounded-full" onClick={onClose}>
             <X size={20} className="text-white/80" />
          </div>
          
          <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-40 h-40 drop-shadow-2xl z-20 pointer-events-none">
              <img src="https://cdn-icons-png.flaticon.com/512/825/825441.png" className="w-full h-full object-contain" alt="Lucky Bag Icon" />
          </div>

          <div className="flex bg-[#272d3a] rounded-full mx-6 mb-6 mt-16 p-1 relative z-10">
             <button onClick={() => setTab('Room')} className={`flex-1 py-2.5 text-center rounded-full text-[14px] font-black transition-all ${tab === 'Room' ? 'bg-[#373f4e] text-[#0cf6d4] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-white/60'}`}>Room</button>
             <button onClick={() => setTab('World')} className={`flex-1 py-2.5 text-center rounded-full text-[14px] font-black transition-all ${tab === 'World' ? 'bg-[#373f4e] text-[#0cf6d4] shadow-md scale-[1.02]' : 'text-gray-400 hover:text-white/60'}`}>World</button>
          </div>

          <div className="px-6 space-y-5 z-10 pb-8 max-h-[60vh] overflow-y-auto no-scrollbar">
             <div>
                <div className="text-white font-black mb-3 text-sm flex items-center gap-2">
                   <div className="w-1.5 h-3 bg-[#0cf6d4] rounded-full" /> Total Coins
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {[1000, 3000, 5000, 10000].map(v => (
                      <button key={v} onClick={() => setTotal(v)} className={`py-2 rounded-xl text-[13px] font-black border transition-all ${total === v ? 'bg-[#153434] text-[#0cf6d4] border-[#0cf6d4] shadow-[0_0_10px_rgba(12,246,212,0.2)]' : 'bg-[#272d3a] text-white/70 border-transparent hover:bg-white/5'}`}>{v}</button>
                   ))}
                </div>
             </div>

             <div>
                <div className="text-white font-black mb-3 text-sm flex items-center gap-2">
                   <div className="w-1.5 h-3 bg-[#0cf6d4] rounded-full" /> Quantity
                </div>
                <div className="grid grid-cols-4 gap-2">
                   {[6, 12, 20, 30].map(v => (
                      <button key={v} onClick={() => setQty(v)} className={`py-2 rounded-xl text-[13px] font-black border transition-all ${qty === v ? 'bg-[#153434] text-[#0cf6d4] border-[#0cf6d4] shadow-[0_0_10px_rgba(12,246,212,0.2)]' : 'bg-[#272d3a] text-white/70 border-transparent hover:bg-white/5'}`}>{v}</button>
                   ))}
                </div>
             </div>

             <div>
                <div className="text-white font-black mb-3 text-sm flex items-center gap-2">
                   <div className="w-1.5 h-3 bg-[#0cf6d4] rounded-full" /> Duration
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {[10, 20, 300].map(v => (
                      <button key={v} onClick={() => setDuration(v)} className={`py-2 rounded-xl text-[13px] font-black border transition-all ${duration === v ? 'bg-[#153434] text-[#0cf6d4] border-[#0cf6d4] shadow-[0_0_10px_rgba(12,246,212,0.2)]' : 'bg-[#272d3a] text-white/70 border-transparent hover:bg-white/5'}`}>{v}s</button>
                   ))}
                </div>
             </div>

             <div>
                <div className="text-white font-black mb-3 text-sm flex items-center gap-2">
                   <div className="w-1.5 h-3 bg-[#0cf6d4] rounded-full" /> Condition
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {['All', 'Fans', 'On mic'].map(v => (
                      <button key={v} onClick={() => setCondition(v)} className={`py-2 rounded-xl text-[13px] font-black border transition-all ${condition === v ? 'bg-[#153434] text-[#0cf6d4] border-[#0cf6d4] shadow-[0_0_10px_rgba(12,246,212,0.2)]' : 'bg-[#272d3a] text-white/70 border-transparent hover:bg-white/5'}`}>{v}</button>
                   ))}
                </div>
             </div>

             <button 
                onClick={() => {
                   onSend({ total, qty, duration, condition, type: tab });
                   onClose();
                }}
                className="w-full bg-[#0cf6d4] text-black font-black uppercase text-base rounded-2xl py-4 mt-4 active:scale-[0.98] transition-all shadow-lg hover:brightness-110"
             >
                Send Bag
             </button>
          </div>
       </motion.div>
    </div>
  );
}

function LuckyBagDetailModal({ bag, user, onClose, onClaim }: { bag: any, user: any, onClose: () => void, onClaim: (id: string) => void }) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const timeLeft = Math.max(0, Math.floor((bag.createdAt + bag.duration * 1000 - currentTime) / 1000));
  const isClaimed = bag.claimedBy?.includes(user?.uid);
  const isExpired = bag.remainingQty <= 0;

  useEffect(() => {
     if (timeLeft > 0) {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
     }
  }, [timeLeft]);

  return (
    <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         exit={{ scale: 0.9, opacity: 0 }}
         className="w-full max-w-sm aspect-[4/5] rounded-[3.5rem] overflow-hidden relative shadow-2xl flex flex-col items-center p-0 text-center"
         style={{ background: 'linear-gradient(180deg, #ff6b6b 0%, #ff4757 100%)' }}
       >
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10px 10px, white 2px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="absolute top-6 left-6 w-12 h-12 opacity-80">
             <div className="w-full h-full border-t-[3px] border-l-[3px] border-yellow-400 rounded-tl-3xl relative">
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-500 rounded-full border-2 border-red-500" />
             </div>
          </div>
          <div className="absolute top-6 right-6 w-12 h-12 opacity-80">
             <div className="w-full h-full border-t-[3px] border-r-[3px] border-yellow-400 rounded-tr-3xl relative">
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full border-2 border-red-500" />
             </div>
          </div>

          <div className="mt-16 flex flex-col items-center px-8 w-full">
             <div className="w-28 h-28 rounded-full border-[6px] border-white/20 overflow-hidden shadow-2xl relative mb-4">
                <img src={bag.senderPhoto || "https://api.dicebear.com/7.x/notionists/svg?seed=Lucky"} className="w-full h-full object-cover" alt="Sender" />
                <div className="absolute inset-0 ring-4 ring-yellow-400/30 rounded-full" />
             </div>
             
             <h3 className="text-white font-black text-3xl tracking-[0.2em] uppercase italic drop-shadow-lg mb-4">
                {bag.senderName}
             </h3>
             
             <div className="relative w-full flex justify-center mb-8">
                <div className="bg-[#d63031] px-10 py-2.5 rounded-full text-yellow-400 text-base font-black border-2 border-yellow-500/30 shadow-inner flex items-center gap-3">
                   <span className="opacity-40">✦</span>
                   Coin bag
                   <span className="opacity-40">✦</span>
                </div>
             </div>
             
             <div className="mb-12">
                <div className="text-white text-3xl font-black flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
                   <span className="text-white/80 text-xl font-bold">Totally worth</span>
                   <span className="text-white text-4xl drop-shadow-lg">{bag.total}</span>
                   <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-sm text-yellow-900 border border-yellow-200 shadow-md">
                      ★
                   </div>
                </div>
             </div>

             <div className="w-full mt-auto pb-12 flex justify-center">
                {isClaimed ? (
                   <div className="w-full py-5 rounded-[2.5rem] bg-black/20 text-white font-black text-xl uppercase tracking-[0.2em] border border-white/10">
                      Claimed
                   </div>
                ) : isExpired ? (
                   <div className="w-full py-5 rounded-[2.5rem] bg-black/20 text-white font-black text-xl uppercase tracking-[0.2em] border border-white/10">
                      Empty
                   </div>
                ) : timeLeft > 0 ? (
                   <button className="w-48 h-48 rounded-full bg-white/90 text-[#ff4757] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform border-[12px] border-white/20 backdrop-blur-sm">
                      <span className="text-xl font-black uppercase leading-none mb-1">Available</span>
                      <span className="text-2xl font-black uppercase leading-none">after {timeLeft}s...</span>
                   </button>
                ) : (
                   <button 
                      onClick={() => onClaim(bag.id)}
                      className="w-48 h-48 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-500 text-yellow-900 shadow-[0_20px_60px_rgba(251,191,36,0.6)] flex flex-col items-center justify-center gap-1 active:scale-95 transition-all animate-bounce border-[12px] border-yellow-100"
                   >
                      <span className="text-5xl font-black uppercase italic tracking-tighter">OPEN</span>
                   </button>
                )}
             </div>
          </div>
          
          <div className="absolute bottom-0 inset-x-0 h-4 bg-black/10" />
       </motion.div>
       
       <button 
          onClick={onClose}
          className="mt-8 w-14 h-14 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white active:scale-90 transition-transform"
       >
          <X size={32} />
       </button>
    </div>
  );
}

function MusicModal({ onClose }: { onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);

  const defaultTracks = [
    {
      id: 1,
      name: "Ambient Chill",
      url: "https://cdn.pixabay.com/download/audio/2022/05/16/audio_946b5a363f.mp3?filename=ambient-chill-114400.mp3",
    },
    {
      id: 2,
      name: "LoFi Beats",
      url: "https://cdn.pixabay.com/download/audio/2022/02/07/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3",
    },
    {
      id: 3,
      name: "Acoustic Vibe",
      url: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=acoustic-vibe-124586.mp3",
    },
  ];

  const currentTrack = defaultTracks[currentTrackIdx];

  useEffect(() => {
    const audio = document.getElementById(
      "bg-music-player",
    ) as HTMLAudioElement;
    if (audio) {
      if (isPlaying) {
        audio.play().catch((e) => console.log("Audio play failed", e));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrackIdx]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const playNext = () =>
    setCurrentTrackIdx((prev) => (prev + 1) % defaultTracks.length);
  const playPrev = () =>
    setCurrentTrackIdx(
      (prev) => (prev - 1 + defaultTracks.length) % defaultTracks.length,
    );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute inset-x-0 bottom-0 z-50 bg-[#1c1815] bg-opacity-95 backdrop-blur-xl rounded-t-[32px] flex flex-col pt-2 overflow-hidden border-t border-white/10"
        style={{ height: "35vh" }}
      >
        <audio
          id="bg-music-player"
          src={currentTrack.url}
          onEnded={playNext}
          loop={false}
        />
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

        <div className="px-6 pb-2 flex items-center justify-between border-b border-white/5">
          <h2 className="text-white text-lg font-black tracking-tight">
            Music Player
          </h2>
          <button onClick={onClose} className="p-2 -mr-2">
            <ChevronLeft className="text-white/40 rotate-[270deg]" />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center p-6 flex-1 gap-6">
          {/* Track Info */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg relative overflow-hidden">
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-full h-full border-4 border-dashed border-white/20 rounded-full absolute inset-0"
              />
              <Music className="text-white" size={28} />
            </div>
            <span className="text-white font-bold text-lg mt-2 tracking-wide">
              {currentTrack.name}
            </span>
            <span className="text-white/50 text-xs font-semibold">
              Royalty Free Music
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 mt-2">
            <button
              onClick={playPrev}
              className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform hover:bg-white/20"
            >
              <SkipBack className="text-white" fill="white" size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-xl shadow-white/10 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="text-black" fill="black" size={28} />
              ) : (
                <Play className="text-black ml-1" fill="black" size={28} />
              )}
            </button>
            <button
              onClick={playNext}
              className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform hover:bg-white/20"
            >
              <SkipForward className="text-white" fill="white" size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function GiftUI({
  onClose,
  onSendGift,
  seats,
  user,
  profile,
}: {
  onClose: () => void;
  onSendGift: (gift: any) => void;
  seats: Record<string, any>;
  user: any;
  profile?: any;
}) {
  const [activeTab, setActiveTab] = useState("Gift");
  const [selectedGiftId, setSelectedGiftId] = useState<number>(1);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [customGifts, setCustomGifts] = useState<any[]>([]);
  const [userChips, setUserChips] = useState<number>(profile?.chips || 0);

  const [newGift, setNewGift] = useState({
    name: "",
    price: "",
    image: "",
    videoUrl: "",
  });

  useEffect(() => {
    if (!user) return;
    const unChips = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setUserChips(snap.data().chips || 0);
      }
    });
    return unChips;
  }, [user]);

  useEffect(() => {
    const un = onSnapshot(collection(db, "gifts"), (snapshot) => {
      setCustomGifts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return un;
  }, []);

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(collection(db, "gifts")), {
        name: newGift.name,
        price: Number(newGift.price) || 0,
        image: newGift.image,
        videoUrl: newGift.videoUrl || "",
        createdAt: Date.now(),
      });
      setNewGift({ name: "", price: "", image: "", videoUrl: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const defaultGifts = [
    {
      name: "World Cup",
      price: 100000,
      image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=200&h=200&fit=crop",
      id: 1,
    },
    {
      name: "Eating watermelon",
      price: 99,
      image: "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?w=200&h=200&fit=crop",
      id: 2,
    },
    {
      name: "Savory sandwich",
      price: 999,
      image: "https://images.unsplash.com/photo-1540713434306-5850587b614d?w=200&h=200&fit=crop",
      id: 3,
    },
    {
      name: "instant noodles",
      price: 99,
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=200&fit=crop",
      id: 4,
    },
    {
      name: "lipstick",
      price: 199,
      image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200&h=200&fit=crop",
      id: 5,
    },
    {
      name: "Black Rifle",
      price: 299,
      image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=200&h=200&fit=crop",
      id: 6,
    },
    {
      name: "football",
      price: 999,
      image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=200&h=200&fit=crop",
      id: 7,
    },
    {
      name: "baby bottle",
      price: 999,
      image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=200&h=200&fit=crop",
      id: 8,
    },
  ];

  const gifts = [...customGifts, ...defaultGifts];

  if (showAdminPanel) {
    return (
      <div className="absolute inset-0 z-[60] bg-[#1c1815] p-6 flex flex-col pt-8 overflow-y-auto w-full h-full">
        <button
          onClick={() => setShowAdminPanel(false)}
          className="absolute top-4 right-4 text-white p-2"
        >
          <X size={24} />
        </button>
        <h2 className="text-white text-xl font-black mb-4">Add Custom Gift</h2>

        {!isAuthenticated ? (
          <div className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white"
            />
            <button
              onClick={() => {
                if (password === "EMAD8912") setIsAuthenticated(true);
                else alert("Wrong Password");
              }}
              className="bg-blue-600 text-white font-bold py-3 rounded-xl"
            >
              Verify
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-20">
            <form onSubmit={handleAddGift} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Gift Name"
                value={newGift.name}
                onChange={(e) =>
                  setNewGift({ ...newGift, name: e.target.value })
                }
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                required
              />
              <input
                type="number"
                placeholder="Chips Price"
                value={newGift.price}
                onChange={(e) =>
                  setNewGift({ ...newGift, price: e.target.value })
                }
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
                required
              />

              <div className="flex flex-col gap-2 p-3 border border-white/10 rounded-xl bg-white/5">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest">
                  Image
                </label>
                <input
                  type="url"
                  placeholder="Image URL (Or choose file below)"
                  value={newGift.image}
                  onChange={(e) =>
                    setNewGift({ ...newGift, image: e.target.value })
                  }
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setNewGift({
                          ...newGift,
                          image: ev.target?.result as string,
                        });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-white text-xs mt-1"
                />
                {newGift.image && (
                  <img
                    src={newGift.image}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg border border-white/20 mt-2"
                  />
                )}
              </div>

              <div className="flex flex-col gap-2 p-3 border border-white/10 rounded-xl bg-white/5">
                <label className="text-white/60 text-xs font-bold uppercase tracking-widest">
                  Video (Optional)
                </label>
                <input
                  type="url"
                  placeholder="Video URL (Or choose file below)"
                  value={newGift.videoUrl}
                  onChange={(e) =>
                    setNewGift({ ...newGift, videoUrl: e.target.value })
                  }
                  className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                />
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setNewGift({
                          ...newGift,
                          videoUrl: ev.target?.result as string,
                        });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="text-white text-xs mt-1"
                />
                {newGift.videoUrl && (
                  <video
                    src={newGift.videoUrl}
                    className="w-24 rounded-lg border border-white/20 mt-2"
                    controls
                    muted
                  />
                )}
              </div>

              <button
                type="submit"
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl mt-2 text-md shadow-lg transition-colors uppercase tracking-widest"
              >
                Save Gift
              </button>
            </form>

            <div className="mt-4">
              <h3 className="text-white font-black mb-3 text-lg">
                Custom Gifts List
              </h3>
              {customGifts.length === 0 ? (
                <p className="text-white/50 text-sm">
                  No custom gifts added yet.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {customGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-3"
                    >
                      <img
                        src={gift.image}
                        alt={gift.name}
                        className="w-12 h-12 rounded-lg object-cover bg-black/40"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold truncate">
                          {gift.name}
                        </h4>
                        <p className="text-yellow-500 text-xs font-black flex items-center gap-1">
                          <Coins size={10} /> {gift.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {gift.videoUrl && (
                          <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase rounded-lg">
                            Video
                          </div>
                        )}
                        <button
                          onClick={() =>
                            deleteDoc(doc(db, "gifts", gift.id)).catch(
                              console.error,
                            )
                          }
                          className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center hover:bg-red-600/40"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 500 }}
        dragElastic={0.2}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.y > 100 || velocity.y > 500) {
            onClose();
          }
        }}
        className="absolute inset-x-0 bottom-0 z-50 bg-[#0f0e15] bg-opacity-95 backdrop-blur-xl rounded-t-[24px] flex flex-col pt-4 overflow-hidden shadow-2xl"
        style={{ height: "65vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-4 shrink-0" />

        {/* Top level and privileges header (Matching Image 1) */}
        <div className="px-5 py-3 flex items-center justify-between bg-black/20 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-purple-500/50">
                <img
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-black">
                0
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="bg-[#2ecc71] px-1.5 py-0.5 rounded-md text-[10px] font-black text-white flex items-center justify-center gap-0.5 shadow-sm">
                  🛡️ 3
                </div>
                <span className="text-white/40 text-[10px] font-medium tracking-wide">
                  Progress to LV.7
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-400 to-amber-500 h-full w-[45%]" />
                </div>
                <span className="text-yellow-400 text-[10px] font-black whitespace-nowrap">
                  Upgrade to LV.7 after sending &gt;
                </span>
              </div>
            </div>
          </div>
          
          <button className="ml-4 px-3 py-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-xs font-black tracking-wide active:scale-95 transition-transform shrink-0">
            My Privileges
          </button>
        </div>

        {/* Users on mic strip */}
        <div className="px-5 my-3 shrink-0 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {Object.keys(seats).length === 0 ? (
            <div className="bg-[#1c1a24] rounded-full px-4 py-1.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0">
                <div className="w-3.5 h-4 border-2 border-white/40 rounded-t-full border-b-0 relative">
                  <div className="absolute top-1/2 left-[-6px] right-[-6px] border-b-2 border-white/40" />
                </div>
              </div>
              <span className="text-white/40 text-xs font-semibold tracking-wide">
                No other one on mic
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                   if (selectedSeats.length === Object.keys(seats).length) setSelectedSeats([]);
                   else setSelectedSeats(Object.keys(seats).map(Number));
                }}
                className={`shrink-0 h-8 px-4 rounded-full border ${selectedSeats.length === Object.keys(seats).length ? "bg-[#7c4dff] border-[#7c4dff]" : "bg-[#1c1a24] border-white/10"} text-white font-bold text-xs flex items-center gap-2 transition-colors`}
              >
                All
              </button>
              {Object.entries(seats).map(([seatId, seat]) => {
                const sId = Number(seatId);
                const isSelected = selectedSeats.includes(sId);
                return (
                  <button
                    key={seatId}
                    onClick={() => {
                       if (isSelected) setSelectedSeats(selectedSeats.filter(id => id !== sId));
                       else setSelectedSeats([...selectedSeats, sId]);
                    }}
                    className={`shrink-0 bg-[#1c1a24] rounded-full p-0.5 pr-2.5 flex items-center gap-1.5 border transition-colors ${isSelected ? "border-[#7c4dff] bg-[#7c4dff]/20" : "border-white/10"}`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-black">
                      <img src={seat.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seat.userId}`} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white text-[11px] font-bold max-w-[50px] truncate">{seat.userName}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Tabs with padlock layout (Matching Image 1) */}
        <div className="flex items-center px-5 gap-6 font-bold pb-0 border-b border-white/5 relative shrink-0 overflow-x-auto no-scrollbar">
          {["Gift", "Lucky", "privilege", "Customize", "Relationship"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[14px] whitespace-nowrap pb-3 transition-colors relative ${activeTab === tab ? "text-white font-black" : "text-white/40 font-semibold"} flex items-center gap-1`}
            >
              {tab}
              {tab === "Gift" && <ChevronUp size={12} className="text-white/60 -mb-[2.5px]" />}
              {tab === "Relationship" && <span className="text-white/30 text-xs">🔒</span>}
              {activeTab === tab && (
                <motion.div
                  layoutId="giftTab"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-yellow-400 rounded-full"
                />
              )}
            </button>
          ))}
          <button
            className="ml-auto text-white/50 mb-3"
            onClick={() => setShowAdminPanel(true)}
          >
            <div className="w-5 h-5 border-[1.5px] border-current rounded flex items-center justify-center rotate-45 transform scale-90">
              <div className="w-full h-[1.5px] bg-current"></div>
              <div className="h-full w-[1.5px] bg-current absolute"></div>
            </div>
          </button>
        </div>

        {/* Recipient Info */}
        <div className="px-5 py-2 flex items-center justify-between text-white/50 text-[12px] font-semibold bg-[#0f0e15] shrink-0 border-b border-white/5">
          <div className="flex items-center gap-1">
            The recipient:{" "}
            <span className="ml-1 text-white flex items-center gap-1">
              🌻 +3 <span className="text-yellow-400 font-black ml-1">$</span>{" "}
              +1
            </span>
          </div>
          <div className="w-4 h-4 rounded-full border border-white/40 flex items-center justify-center text-[10px] text-white/50 shrink-0 select-none">
            ?
          </div>
        </div>

        {/* Gifts Grid with specialized World Cup card and Play button icons */}
        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-4 gap-x-2 gap-y-3 px-3 py-3 pb-24">
          {gifts.map((gift) => {
            const isSelected = selectedGiftId === gift.id;
            const isWorldCup = gift.id === 1;
            const hasPlayButton = gift.id !== 1 && gift.id !== 2; // Matching the screenshot play button placements
            return (
              <div
                key={gift.id}
                onClick={() => setSelectedGiftId(gift.id)}
                className={`flex flex-col items-center justify-start pt-2 pb-[14px] rounded-xl relative cursor-pointer overflow-hidden transition-all duration-200 ${
                  isWorldCup && isSelected 
                    ? "bg-gradient-to-b from-[#2b1b54] to-[#120e24] border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
                    : isSelected 
                      ? "bg-[#1c1a24] border border-[#1c1a24]" 
                      : "bg-transparent border border-transparent"
                }`}
              >
                {/* Image Play Button Badge or World Cup Special Tag */}
                {isWorldCup ? (
                  <div className="absolute top-1 left-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-[8px] text-black font-extrabold px-1 rounded shadow-sm z-10 select-none">
                    3D
                  </div>
                ) : hasPlayButton ? (
                  <div className="absolute top-1 right-1 bg-green-500/80 w-3.5 h-3.5 rounded-full flex items-center justify-center z-10 select-none">
                    <Play size={8} className="text-white fill-current ml-[1px]" />
                  </div>
                ) : null}

                <div className="w-[56px] h-[56px] rounded-xl overflow-hidden drop-shadow-md relative bg-transparent shrink-0 flex items-center justify-center z-10">
                  <img
                    src={gift.image}
                    className="w-[95%] h-[95%] object-contain pointer-events-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]"
                    alt={gift.name}
                  />
                </div>
                <span className="text-white text-[11px] font-semibold mt-1.5 whitespace-nowrap truncate max-w-[90%] drop-shadow-md z-10">
                  {gift.name}
                </span>
                <span
                  className={`text-[9px] font-black tracking-wide flex items-center gap-1 drop-shadow-md mt-0.5 z-10 ${isSelected ? "text-yellow-400" : "text-yellow-500"}`}
                >
                  <div className="w-2.5 h-2.5 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shrink-0 shadow-sm relative pt-[0.5px]">
                    <span className="text-[7px] text-[#5e3800] font-extrabold leading-none">
                      $
                    </span>
                  </div>{" "}
                  {gift.price}
                </span>

                {isWorldCup && isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetSeats =
                        selectedSeats.length > 0
                          ? selectedSeats
                          : Object.keys(seats).map(Number);
                      if (targetSeats.length === 0) {
                        alert("No users on mic");
                        return;
                      }
                      onSendGift({ ...gift, targetSeats, quantity });
                    }}
                    className="absolute inset-x-1 bottom-1 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-600 text-black text-[9px] font-extrabold rounded-lg py-1 z-20 shadow-md uppercase tracking-wide scale-[0.98] active:scale-95 transition-transform text-center"
                  >
                    start Football
                  </button>
                )}

                {isSelected && !isWorldCup && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetSeats =
                        selectedSeats.length > 0
                          ? selectedSeats
                          : Object.keys(seats).map(Number);
                      if (targetSeats.length === 0) {
                        alert("No users on mic");
                        return;
                      }
                      onSendGift({ ...gift, targetSeats, quantity });
                    }}
                    className="absolute inset-x-0 bottom-0 bg-[#7c4dff] w-full py-[5px] text-white text-[11px] font-bold z-20 active:bg-[#6236df]"
                  >
                    Send
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Control Bar with Balance, Customizable Quantity, and Purple Send button (Matching Image 1) */}
        <div className="px-5 pb-6 pt-2 flex items-center justify-between border-t border-white/5 absolute bottom-0 inset-x-0 bg-[#0f0e15] z-30">
          <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full border border-white/5 cursor-pointer hover:bg-black/50 transition-colors">
            <div className="w-3.5 h-3.5 bg-gradient-to-br from-purple-400 to-purple-700 rounded-full flex items-center justify-center shrink-0 shadow-sm pt-[0.5px]">
              <span className="text-[9px] text-white font-black leading-none">$</span>
            </div>
            <span className="text-white text-xs font-black tracking-wide">
              {userChips}
            </span>
            <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-black ml-1 select-none">
              +
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Dark Quantity capsule select */}
            <div className="flex bg-black/40 rounded-full p-0.5 items-center border border-white/5 h-9">
              {[1, 7, 77, 'other'].map((q) => {
                const isSelected = (q === 'other' && ![1, 7, 77].includes(quantity)) || quantity === q;
                return (
                  <button
                    key={q}
                    onClick={() => {
                      if (q === 'other') {
                        const val = prompt("Enter quantity:", "1");
                        const num = Number(val);
                        if (num > 0) setQuantity(num);
                      } else {
                        setQuantity(Number(q));
                      }
                    }}
                    className={`px-3 py-1 text-xs font-black rounded-full transition-all ${isSelected ? "bg-[#7c4dff] text-white shadow-md scale-105" : "text-white/40 hover:text-white"}`}
                  >
                    {q === 'other' && ![1, 7, 77].includes(quantity) ? quantity : q}
                  </button>
                );
              })}
            </div>

            <button 
               onClick={() => {
                   const gift = gifts.find(g => g.id === selectedGiftId);
                   if (!gift) return;
                   const targetSeats = selectedSeats.length > 0 ? selectedSeats : Object.keys(seats).map(Number);
                   if (targetSeats.length === 0) { alert('No users on mic'); return; }
                   onSendGift({ ...gift, targetSeats, quantity });
               }}
               className="bg-[#7c4dff] hover:bg-[#6236df] text-white px-6 h-9 rounded-full font-black text-xs uppercase flex items-center justify-center transition-colors shadow-lg shadow-purple-900/30 active:scale-95 transform shrink-0"
            >
               Send
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MoreHorizontal, Maximize2, Mic, MicOff, Menu, Gift, MessageSquare, User, Volume2, Plus, Smile, Coins, Swords, Clock, X, Send, Music, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, collection, onSnapshot, updateDoc, setDoc, deleteDoc, serverTimestamp, runTransaction, query, orderBy, limit } from 'firebase/firestore';
import { RoomLevelView } from './RoomLevelView';

export function PartyRoomView({ user, profile, roomId, onBack }: any) {
  const [showGift, setShowGift] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRoomLevel, setShowRoomLevel] = useState(false);
  const [showPKTimes, setShowPKTimes] = useState(false);
  const [isPKMode, setIsPKMode] = useState(false);
  const [pkTime, setPkTime] = useState(0);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [seats, setSeats] = useState<Record<string, any>>({});
  const [banners, setBanners] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    if (!roomId || !user) return;
    
    if (roomId === 'local-room-1') {
      setRoomData({ title: profile?.displayName ? `${profile.displayName}'s Room` : 'My Party Room', ownerId: user.uid, type: 'audio' });
      return;
    }
    
    // Room
    const unRoom = onSnapshot(doc(db, 'partyRooms', roomId), (doc) => {
      setRoomData(doc.data());
    }, (error) => console.error(error));

    // Seats
    const unSeats = onSnapshot(collection(db, `partyRooms/${roomId}/seats`), (snapshot) => {
      const s: any = {};
      snapshot.forEach(d => { s[d.id] = d.data(); });
      setSeats(s);
      
      // Auto detect user seat
      let mySet = null;
      for (const [id, sd] of Object.entries(s)) {
        if ((sd as any).userId === user?.uid) mySet = parseInt(id);
      }
      setMySeat(mySet);
    }, (error) => console.error(error));

    // Banners
    const unBanners = onSnapshot(query(collection(db, `partyRooms/${roomId}/banners`), orderBy('createdAt', 'desc'), limit(5)), (snapshot) => {
      const serverBanners = snapshot.docs.map(d => ({id: d.id, ...d.data()})).reverse();
      
      // We only want banners that were created in the last 10 seconds to show up initially,
      // and then we will cull them on the client side using a timer
      const recent = serverBanners.filter(b => Date.now() - (b as any).createdAt < 10000);
      setBanners(recent);
    }, (error) => console.error(error));

    // Messages
    const unMessages = onSnapshot(query(collection(db, `partyRooms/${roomId}/messages`), orderBy('createdAt', 'desc'), limit(30)), (snapshot) => {
      const serverMessages = snapshot.docs.map(d => ({id: d.id, ...d.data()})).reverse();
      setMessages([
        { type: 'announcement', text: 'بەخێربێیت! با بەیەکەوە گفتوگۆ بکەین!' },
        { type: 'system', text: 'Welcome to Yari Konkan. Please respect each other and chat politely.' },
        ...serverMessages
      ]);
    }, (error) => console.error(error));

    return () => { unRoom(); unSeats(); unBanners(); unMessages(); };
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
      setBanners(prev => prev.filter(b => Date.now() - b.createdAt < 7000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPKMode && pkTime > 0) {
      timer = setInterval(() => {
        setPkTime(prev => prev - 1);
      }, 1000);
    } else if (pkTime === 0 && isPKMode) {
      setIsPKMode(false);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isPKMode, pkTime]);

  const formatId = profile?.shortId || user?.uid?.substring(0, 8);
  const displaySeats = Array.from({ length: 16 }).map((_, i) => ({ id: i + 1, occupied: !!seats[i + 1], data: seats[i + 1] }));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user || !roomId) return;
    try {
      await setDoc(doc(collection(db, `partyRooms/${roomId}/messages`)), {
         type: 'user',
         text: chatInput,
         userId: user.uid,
         userName: profile?.displayName || 'Guest',
         userPhoto: profile?.photoURL || '',
         createdAt: Date.now()
      });
      setChatInput('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendGift = async (gift: any) => {
    if (!user || !profile || !roomId) return;
    try {
      await runTransaction(db, async (trans) => {
        const userRef = doc(db, 'users', user.uid);
        const uSnap = await trans.get(userRef);
        if (!uSnap.exists()) return;
        const currentChips = uSnap.data().chips || 0;
        if (currentChips < gift.price) throw new Error("Not enough chips");
        trans.update(userRef, { chips: currentChips - gift.price });

        const newBannerRef = doc(collection(db, `partyRooms/${roomId}/banners`));
        trans.set(newBannerRef, {
          senderId: user.uid,
          senderName: profile.displayName || 'Guest',
          giftId: gift.id || 1,
          giftName: gift.name,
          giftPrice: gift.price,
          giftImage: gift.image,
          createdAt: Date.now() // Transaction requires integer here instead of serverTimestamp sometimes to easily sort if fallback
        });
      });
      setShowGift(false);
    } catch (err) {
      console.error("Gifting failed", err);
      alert("Requires more coins!");
    }
  };

  const [isMicOn, setIsMicOn] = useState(true);
  const [showMusicModal, setShowMusicModal] = useState(false);

  const handleToggleMic = (e: React.MouseEvent) => {
     e.stopPropagation();
     setIsMicOn(!isMicOn);
  };

  const handleTakeSeat = async (seatId: number) => {
    if (!user || !roomId) return;
    if (mySeat !== null) return;
    try {
      await setDoc(doc(db, `partyRooms/${roomId}/seats`, seatId.toString()), {
        userId: user.uid,
        userName: profile?.displayName || 'Guest',
        userPhoto: profile?.photoURL || '',
        createdAt: Date.now()
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

  return (
    <div className="fixed inset-0 z-[300] bg-black font-sans flex flex-col overflow-hidden w-full h-full">
      {/* Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1574267432553-4b4628081524?w=800&h=1600&fit=crop')`,
          filter: 'brightness(0.7) sepia(0.3) hue-rotate(-20deg) saturate(2)'
        }}
      >
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
         <div className={`absolute inset-0 ${isPKMode ? 'opacity-0' : 'bg-red-900/40 mix-blend-multiply'} transition-opacity`} />
      </div>

      {isPKMode && (
         <div className="absolute top-0 inset-x-0 h-full z-0 flex pointer-events-none opacity-40">
            <div className="w-1/2 bg-gradient-to-r from-red-600 to-red-900" />
            <div className="w-1/2 bg-gradient-to-l from-blue-600 to-blue-900" />
         </div>
      )}

      {/* Header */}
      <div className="relative z-10 px-4 pt-12 pb-2 flex items-start justify-between min-h-fit shrink-0">
         <div className="flex items-center gap-2">
            <button onClick={() => {
               if (mySeat !== null) handleLeaveSeat(mySeat);
               onBack();
            }} className="text-white p-1 -ml-2 drop-shadow-md active:scale-95 transition-transform"><ChevronLeft size={28} /></button>
            <div className="flex items-center gap-2 bg-black/20 rounded-full pr-4 pl-1 py-1 backdrop-blur-sm border border-white/5">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 border border-white/30">
                   <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} className="w-full h-full object-cover" alt="Avatar" />
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-white text-sm font-black truncate max-w-[100px] leading-tight block">{profile?.displayName || 'ONLY ONE'}</span>
                   <span className="text-white/60 text-[10px] font-bold">ID:{formatId}</span>
                </div>
                <div className="w-6 h-6 ml-2 text-yellow-500 fill-current drop-shadow-md flex items-center justify-center">
                    🏅
                </div>
            </div>
         </div>
         <div className="flex flex-col items-end gap-2">
             <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm mr-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white text-xs font-bold font-mono tracking-wider">{roomData?.viewers || Math.floor(Object.keys(seats).length * 84 + 172)}</span>
                 </div>
                 {[1, 2, 3].map((v) => (
                    <div key={v} className="w-8 h-8 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center relative shadow-sm">
                       <User size={16} className="text-white/60" />
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold border border-black/50">{v}</div>
                    </div>
                 ))}
                 <button className="text-white drop-shadow-md ml-1"><MoreHorizontal size={24} /></button>
             </div>
             <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1 border border-white/10 mt-1 cursor-pointer active:scale-95 transition-transform" onClick={() => setShowGift(true)}>
                 <span className="text-yellow-400 text-sm">🌻</span>
                 <span className="text-white font-bold text-xs tracking-wide">Room Gifts</span>
             </div>
         </div>
      </div>

      <div className="relative z-10 px-4 mt-2 flex flex-col gap-2">
         {!isPKMode && (
            <div>
               <div onClick={() => setShowRoomLevel(true)} className="bg-[#00c853] text-white px-3 py-0.5 rounded-full inline-flex font-bold text-xs shadow-md border border-[#00e676] cursor-pointer active:scale-95 transition-transform">
                  Lv.1
               </div>
            </div>
         )}
         
         {isPKMode && (
         <div className="flex flex-col items-center w-full justify-between mt-2 max-w-md mx-auto">
            <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm mb-2">
               <User size={12} className="text-white/80" />
               <span className="text-white text-xs font-bold font-mono tracking-wider">{roomData?.viewers || Math.floor(Object.keys(seats).length * 84 + 172)}</span>
            </div>
            <div className="flex items-center w-full justify-between">
              <div className="flex-1 bg-gradient-to-r from-red-600 to-red-500 h-8 rounded-l-full flex items-center px-4 border border-red-400/50 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                 <span className="text-white font-black text-sm drop-shadow-md">LV4</span>
                 <span className="text-yellow-400 font-bold ml-2 flex items-center gap-1 text-xs shadow-sm"><Coins size={12} className="fill-current"/> 140K</span>
              </div>
              
              <div className="px-3 md:px-6 relative z-10 font-black italic text-xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0 flex flex-col items-center">
                 <span className="text-[#ff1744] text-[10px] font-bold not-italic drop-shadow-none mb-[-4px]">PK</span>
                 {Math.floor(pkTime / 60)}:{(pkTime % 60).toString().padStart(2, '0')}
              </div>
              
              <div className="flex-1 bg-gradient-to-l from-blue-600 to-blue-500 h-8 rounded-r-full flex items-center justify-end px-4 border border-blue-400/50 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                 <span className="text-yellow-400 font-bold mr-2 flex items-center gap-1 text-xs shadow-sm"><Coins size={12} className="fill-current"/> 3.6K</span>
                 <span className="text-white font-black text-sm drop-shadow-md">LV2</span>
              </div>
            </div>
         </div>
         )}
      </div>

      {/* Grid */}
      <div className="relative z-10 grid grid-cols-4 gap-x-2 gap-y-3 sm:gap-y-6 px-6 mt-4 sm:mt-8 max-w-sm mx-auto w-full shrink-0">
         {displaySeats.map(seat => (
            <div key={seat.id} className="flex flex-col items-center gap-2 relative">
               {seat.id === 1 ? (
                 <div className="relative">
                   <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#ffcc00] shadow-[0_0_15px_rgba(255,204,0,0.4)] relative p-0.5 bg-black">
                     <img src={roomData?.image || "https://images.unsplash.com/photo-1574267432553-4b4628081524?w=150&h=150&fit=crop"} className="w-full h-full object-cover rounded-full" alt="Host" />
                   </div>
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center">
                     <span className="text-2xl drop-shadow-md">👑</span>
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md">
                     <MicOff size={12} className="text-white/80" strokeWidth={2.5} />
                   </div>
                 </div>
               ) : seat.data ? (
                 <div className="relative cursor-pointer active:scale-95 transition-transform" onClick={() => mySeat === seat.id && handleLeaveSeat(seat.id)}>
                   <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 flex items-center justify-center ${mySeat === seat.id ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/20'} relative bg-black`}>
                     <img src={seat.data.userPhoto || "https://api.dicebear.com/7.x/avataaars/svg?seed=U"} className="w-full h-full object-cover" alt="User" />
                   </div>
                   {mySeat === seat.id ? (
                      <button onClick={handleToggleMic} className="absolute -bottom-1 -right-1 w-6 h-6 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md active:scale-90 transition-transform">
                        {isMicOn ? <Mic size={12} className="text-green-400" /> : <MicOff size={12} className="text-red-400" />}
                      </button>
                   ) : (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 shadow-md">
                        <MicOff size={10} className="text-white/50" />
                      </div>
                   )}
                 </div>
               ) : (
                 <button onClick={() => handleTakeSeat(seat.id)} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-900/30 backdrop-blur-sm border border-red-500/20 shadow-inner flex items-center justify-center active:bg-red-800/40 transition-colors">
                    <Plus size={20} className="text-white/40 font-light" strokeWidth={1.5} />
                 </button>
               )}
               <span className={`text-[11px] font-bold drop-shadow-md tracking-wider max-w-[50px] truncate ${seat.id === 1 || seat.data ? 'text-white' : 'text-white/50'}`}>
                 {seat.id === 1 ? 'Host' : seat.data ? (seat.data.userName || 'Guest') : seat.id}
               </span>
            </div>
         ))}
      </div>

      {/* Floating Chat / Announcements */}
      <div className="relative z-10 px-4 pb-4 mt-auto space-y-3 pointer-events-none min-h-[140px] flex flex-col justify-end shrink-0">
         {/* Banners */}
         <div className="absolute bottom-[200px] left-0 right-0 flex flex-col gap-3 pointer-events-none z-50 items-end px-2 overflow-visible">
            <AnimatePresence>
               {banners.map(banner => (
                 <motion.div
                   key={banner.id}
                   initial={{ x: '100%', opacity: 0 }}
                   animate={{ x: 0, opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ type: "spring", stiffness: 200, damping: 25 }}
                   className="bg-gradient-to-r from-[#4A3AFF] via-[#3525D3] to-[#201594] rounded-full flex items-center pr-1 pl-4 py-1 pb-[5px] pt-[5px] drop-shadow-2xl shadow-lg backdrop-blur-md max-w-full float-right border border-blue-400/30 overflow-hidden relative"
                   style={{ minWidth: '320px' }}
                 >
                    {/* Inner glowing edge */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-purple-500/20" />
                    <span className="text-[#facc15] font-black italic mr-4 ml-1 whitespace-nowrap text-[32px] font-sans relative z-10" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.4)' }}>
                       1 x
                    </span>
                    <div className="relative w-14 h-14 pointer-events-none z-20 flex items-center justify-center mx-1 flex-shrink-0">
                       <img src={banner.giftImage || 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/gift.svg'} className="w-[120%] h-[120%] max-w-none object-contain filter drop-shadow-md scale-110 relative -top-1" alt="" />
                    </div>
                    
                    <div className="flex flex-col items-center justify-center pl-2 pr-1 h-full flex-1 relative z-10 w-full min-w-0">
                       <span className="text-white font-bold text-[18px] tracking-wide leading-tight truncate w-full text-center">{banner.senderName || 'ONLY ONE'}</span>
                       <span className="text-yellow-100 font-bold text-[14px] whitespace-nowrap opacity-90">{banner.giftName || 'اهداء مميز'}</span>
                    </div>
                    
                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden border-2 border-indigo-300 shrink-0 shadow-md relative z-10 ml-2">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${banner.senderId}`} className="w-full h-full object-cover bg-black" alt="" />
                    </div>
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
                <span className="text-black text-[10px] font-black uppercase">ALL</span>
                <ChevronLeft size={14} className="text-black rotate-[270deg]" />
             </button>
         </div>

         <div className="overflow-y-auto max-h-[160px] flex flex-col-reverse gap-2 mask-image-b pb-2 pointer-events-auto">
         {messages.map((msg, i) => (
             <div key={i} className="flex flex-col items-start drop-shadow-md pointer-events-auto">
                {msg.type === 'announcement' && (
                    <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-xl px-4 py-2 font-bold text-sm tracking-wide text-right w-fit max-w-[85%] rounded-tl-none relative isolate">
                       {msg.text}
                    </div>
                )}
                {msg.type === 'system' && (
                    <div className="bg-black/50 backdrop-blur-md border-[0.5px] border-white/20 text-white rounded-xl px-4 py-2 font-bold text-[13px] tracking-wide w-fit max-w-[85%] rounded-bl-sm mt-1">
                       {msg.text}
                    </div>
                )}
                {msg.type === 'event' && (
                    <div className="bg-black/50 backdrop-blur-md border-[0.5px] border-white/10 text-white rounded-2xl px-4 py-2 text-[13px] tracking-wide w-fit max-w-[85%] mt-1 flex gap-1 font-semibold text-white/90">
                       {msg.text}
                    </div>
                )}
                {msg.type === 'user' && (
                    <div className="flex items-start gap-2 max-w-[85%] mt-1">
                       <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20 mt-1">
                          <img src={msg.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.userId}`} alt="" className="w-full h-full object-cover" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-white/60 text-[10px] font-bold ml-1 mb-0.5">{msg.userName}</span>
                          <div className="bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-2xl rounded-tl-sm px-4 py-2 text-[13px] font-medium leading-relaxed">
                             {msg.text}
                          </div>
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

          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
             <MicOff size={20} className="text-white" />
          </button>

          <button onClick={() => setShowMusicModal(true)} className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 active:scale-95 transition-transform">
             <Music size={20} className="text-[#a855f7]" />
          </button>
          
          <form onSubmit={handleSendMessage} className="flex-1 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-4 pr-1 flex items-center min-w-0">
             <input value={chatInput} onChange={e => setChatInput(e.target.value)} type="text" placeholder="Say something..." className="bg-transparent border-none outline-none text-white text-[13px] font-medium w-full placeholder-white/50" />
             {chatInput.trim() && (
               <button type="submit" className="w-8 h-8 rounded-full bg-[#ff7242] flex items-center justify-center shrink-0 ml-1 active:scale-95 transition-transform shadow-md">
                 <Send size={14} className="text-white -ml-0.5 mt-0.5" />
               </button>
             )}
          </form>
          
          <div className="relative">
             <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0"
             >
                <Menu size={20} className="text-white" />
             </button>

             <AnimatePresence>
                {showMenu && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute bottom-14 right-0 bg-[#1c1815] border border-white/10 rounded-2xl shadow-2xl p-2 w-48 flex flex-col gap-1 z-50 backdrop-blur-xl"
                   >
                     {showPKTimes ? (
                        <>
                           <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-1">
                              <span className="text-white font-bold text-sm">PK Duration</span>
                              <button onClick={() => setShowPKTimes(false)} className="text-white/50 hover:text-white"><X size={16}/></button>
                           </div>
                           <button onClick={() => { setIsPKMode(true); setPkTime(5 * 60); setShowMenu(false); setShowPKTimes(false); }} className="px-4 py-2 hover:bg-white/10 rounded-xl text-left text-white text-sm flex items-center gap-2">
                             <Clock size={16} className="text-yellow-400" /> 5:00
                           </button>
                           <button onClick={() => { setIsPKMode(true); setPkTime(10 * 60); setShowMenu(false); setShowPKTimes(false); }} className="px-4 py-2 hover:bg-white/10 rounded-xl text-left text-white text-sm flex items-center gap-2">
                             <Clock size={16} className="text-yellow-400" /> 10:00
                           </button>
                           <button onClick={() => { setIsPKMode(true); setPkTime(15 * 60); setShowMenu(false); setShowPKTimes(false); }} className="px-4 py-2 hover:bg-white/10 rounded-xl text-left text-white text-sm flex items-center gap-2">
                             <Clock size={16} className="text-yellow-400" /> 15:00
                           </button>
                        </>
                     ) : (
                        <>
                           <button onClick={() => setShowPKTimes(true)} className="px-4 py-2 hover:bg-white/10 rounded-xl text-left text-white text-sm transition-colors flex items-center gap-3">
                              <Swords size={18} className="text-[#ff5252]" />
                              Start PK Target
                           </button>
                           <button className="px-4 py-2 hover:bg-white/10 rounded-xl text-left text-white/50 text-sm transition-colors flex items-center gap-3">
                              <Smile size={18} />
                              Effects
                           </button>
                           <button className="px-4 py-2 hover:bg-white/10 rounded-xl text-left text-white/50 text-sm transition-colors flex items-center gap-3">
                              <Volume2 size={18} />
                              Sound Settings
                           </button>
                        </>
                     )}
                   </motion.div>
                )}
             </AnimatePresence>
          </div>
          
          <button 
             onClick={() => setShowGift(true)}
             className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center shrink-0 relative pointer-events-auto active:scale-95"
          >
             <Gift className="text-[#ff7242]" size={24} />
          </button>
          
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 relative">
             <MessageSquare size={20} className="text-white" />
             <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff1744] text-white rounded-full flex items-center justify-center text-[10px] font-black border border-black/50 shadow-sm">12</div>
          </button>
       </div>

       {showGift && <GiftUI onClose={() => setShowGift(false)} onSendGift={handleSendGift} seats={seats} user={user} profile={profile} />}
       {showMusicModal && <MusicModal onClose={() => setShowMusicModal(false)} />}
       {showRoomLevel && (
          <RoomLevelView 
             onBack={() => setShowRoomLevel(false)}
             profile={profile}
             roomData={roomData}
          />
       )}
    </div>
  );
}

function MusicModal({ onClose }: { onClose: () => void }) {
   const [isPlaying, setIsPlaying] = useState(false);
   const [currentTrackIdx, setCurrentTrackIdx] = useState(0);

   const defaultTracks = [
     { id: 1, name: 'Ambient Chill', url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_946b5a363f.mp3?filename=ambient-chill-114400.mp3' },
     { id: 2, name: 'LoFi Beats', url: 'https://cdn.pixabay.com/download/audio/2022/02/07/audio_d0a13f69d2.mp3?filename=lofi-study-112191.mp3' },
     { id: 3, name: 'Acoustic Vibe', url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=acoustic-vibe-124586.mp3' },
   ];
   
   const currentTrack = defaultTracks[currentTrackIdx];

   useEffect(() => {
      const audio = document.getElementById('bg-music-player') as HTMLAudioElement;
      if (audio) {
         if (isPlaying) {
            audio.play().catch(e => console.log('Audio play failed', e));
         } else {
            audio.pause();
         }
      }
   }, [isPlaying, currentTrackIdx]);

   const togglePlay = () => setIsPlaying(!isPlaying);
   const playNext = () => setCurrentTrackIdx((prev) => (prev + 1) % defaultTracks.length);
   const playPrev = () => setCurrentTrackIdx((prev) => (prev - 1 + defaultTracks.length) % defaultTracks.length);

   return (
       <AnimatePresence>
           <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="absolute inset-x-0 bottom-0 z-50 bg-[#1c1815] bg-opacity-95 backdrop-blur-xl rounded-t-[32px] flex flex-col pt-2 overflow-hidden border-t border-white/10"
               style={{ height: '35vh' }}
           >
               <audio id="bg-music-player" src={currentTrack.url} onEnded={playNext} loop={false} />
               {/* Drag Handle */}
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 shrink-0" />

               <div className="px-6 pb-2 flex items-center justify-between border-b border-white/5">
                   <h2 className="text-white text-lg font-black tracking-tight">Music Player</h2>
                   <button onClick={onClose} className="p-2 -mr-2"><ChevronLeft className="text-white/40 rotate-[270deg]" /></button>
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
                     <span className="text-white font-bold text-lg mt-2 tracking-wide">{currentTrack.name}</span>
                     <span className="text-white/50 text-xs font-semibold">Royalty Free Music</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-6 mt-2">
                     <button onClick={playPrev} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform hover:bg-white/20">
                        <SkipBack className="text-white" fill="white" size={20} />
                     </button>
                     <button onClick={togglePlay} className="w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-xl shadow-white/10 active:scale-95 transition-transform">
                        {isPlaying ? <Pause className="text-black" fill="black" size={28} /> : <Play className="text-black ml-1" fill="black" size={28} />}
                     </button>
                     <button onClick={playNext} className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full active:scale-95 transition-transform hover:bg-white/20">
                        <SkipForward className="text-white" fill="white" size={20} />
                     </button>
                  </div>
               </div>
           </motion.div>
       </AnimatePresence>
   );
}

function GiftUI({ onClose, onSendGift, seats, user, profile }: { onClose: () => void; onSendGift: (gift: any) => void; seats: Record<string, any>; user: any; profile?: any; }) {
   const [activeTab, setActiveTab] = useState<'HOT' | 'Privileges'>('HOT');
   const [selectedGiftId, setSelectedGiftId] = useState<number>(1);
   const [showAdminPanel, setShowAdminPanel] = useState(false);
   const [password, setPassword] = useState("");
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
   
   const [customGifts, setCustomGifts] = useState<any[]>([]);
   
   const [newGift, setNewGift] = useState({ name: '', price: '', image: '', videoUrl: '' });
   
   useEffect(() => {
     const un = onSnapshot(collection(db, 'gifts'), snapshot => {
       setCustomGifts(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
     });
     return un;
   }, []);

   const handleAddGift = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         await setDoc(doc(collection(db, 'gifts')), {
           name: newGift.name,
           price: Number(newGift.price) || 0,
           image: newGift.image,
           videoUrl: newGift.videoUrl || '',
           createdAt: Date.now()
         });
         setNewGift({ name: '', price: '', image: '', videoUrl: '' });
      } catch (err) {
         console.error(err);
      }
   };
   
   const defaultGifts = [
       { name: 'Rose', price: 50, image: 'https://images.unsplash.com/photo-1559563158-827b500bc7bb?w=200&h=200&fit=crop', id: 1 },
       { name: 'Flowers', price: 70, image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=200&h=200&fit=crop', id: 2 },
       { name: 'For you', price: 100, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop', id: 3 },
       { name: 'Heart', price: 500, image: 'https://images.unsplash.com/photo-1518047053526-bf318eb7ac6e?w=200&h=200&fit=crop', id: 4 },
       { name: 'Singing Mic', price: 999, image: 'https://images.unsplash.com/photo-1516280440502-c944111394a5?w=200&h=200&fit=crop', id: 5 },
       { name: 'Mony Loop', price: 1000, image: 'https://images.unsplash.com/photo-1580519542036-ed47424438a2?w=200&h=200&fit=crop', id: 6 },
       { name: 'Baby deer', price: 1000, image: 'https://images.unsplash.com/photo-1582234032138-000c2834b6e5?w=200&h=200&fit=crop', id: 7 },
       { name: 'Rocket', price: 2000, image: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=200&h=200&fit=crop', id: 8 }
   ];
   
   const gifts = [...customGifts, ...defaultGifts];

   if (showAdminPanel) {
      return (
         <div className="absolute inset-0 z-[60] bg-[#1c1815] p-6 flex flex-col pt-8 overflow-y-auto w-full h-full">
            <button onClick={() => setShowAdminPanel(false)} className="absolute top-4 right-4 text-white p-2">
               <X size={24} />
            </button>
            <h2 className="text-white text-xl font-black mb-4">Add Custom Gift</h2>
            
            {!isAuthenticated ? (
               <div className="flex flex-col gap-4">
                 <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white" />
                 <button onClick={() => { if(password === "EMAD8912") setIsAuthenticated(true); else alert("Wrong Password") }} className="bg-blue-600 text-white font-bold py-3 rounded-xl">Verify</button>
               </div>
            ) : (
               <div className="flex flex-col gap-6 pb-20">
                  <form onSubmit={handleAddGift} className="flex flex-col gap-3">
                    <input type="text" placeholder="Gift Name" value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" required />
                    <input type="number" placeholder="Chips Price" value={newGift.price} onChange={e => setNewGift({...newGift, price: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" required />
                    
                    <div className="flex flex-col gap-2 p-3 border border-white/10 rounded-xl bg-white/5">
                        <label className="text-white/60 text-xs font-bold uppercase tracking-widest">Image</label>
                        <input type="url" placeholder="Image URL (Or choose file below)" value={newGift.image} onChange={e => setNewGift({...newGift, image: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        <input type="file" accept="image/*" onChange={e => {
                           const file = e.target.files?.[0];
                           if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => setNewGift({...newGift, image: ev.target?.result as string});
                              reader.readAsDataURL(file);
                           }
                        }} className="text-white text-xs mt-1" />
                        {newGift.image && <img src={newGift.image} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-white/20 mt-2" />}
                    </div>

                    <div className="flex flex-col gap-2 p-3 border border-white/10 rounded-xl bg-white/5">
                        <label className="text-white/60 text-xs font-bold uppercase tracking-widest">Video (Optional)</label>
                        <input type="url" placeholder="Video URL (Or choose file below)" value={newGift.videoUrl} onChange={e => setNewGift({...newGift, videoUrl: e.target.value})} className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" />
                        <input type="file" accept="video/*" onChange={e => {
                           const file = e.target.files?.[0];
                           if (file) {
                              const reader = new FileReader();
                              reader.onload = ev => setNewGift({...newGift, videoUrl: ev.target?.result as string});
                              reader.readAsDataURL(file);
                           }
                        }} className="text-white text-xs mt-1" />
                        {newGift.videoUrl && <video src={newGift.videoUrl} className="w-24 rounded-lg border border-white/20 mt-2" controls muted />}
                    </div>
                    
                    <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl mt-2 text-md shadow-lg transition-colors uppercase tracking-widest">Save Gift</button>
                  </form>
                  
                  <div className="mt-4">
                     <h3 className="text-white font-black mb-3 text-lg">Custom Gifts List</h3>
                     {customGifts.length === 0 ? (
                        <p className="text-white/50 text-sm">No custom gifts added yet.</p>
                     ) : (
                        <div className="flex flex-col gap-3">
                           {customGifts.map(gift => (
                              <div key={gift.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-3">
                                 <img src={gift.image} alt={gift.name} className="w-12 h-12 rounded-lg object-cover bg-black/40" />
                                 <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-bold truncate">{gift.name}</h4>
                                    <p className="text-yellow-500 text-xs font-black flex items-center gap-1"><Coins size={10} /> {gift.price}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    {gift.videoUrl && <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase rounded-lg">Video</div>}
                                    <button 
                                       onClick={() => deleteDoc(doc(db, 'gifts', gift.id)).catch(console.error)} 
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
      )
   }

   return (
       <AnimatePresence>
           <motion.div
               initial={{ y: '100%' }}
               animate={{ y: 0 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               drag="y"
               dragConstraints={{ top: 0, bottom: 500 }}
               dragElastic={0.2}
               onDragEnd={(e, { offset, velocity }) => {
                 if (offset.y > 100 || velocity.y > 500) {
                   onClose();
                 }
               }}
               className="absolute inset-x-0 bottom-0 z-50 bg-[#1c1815] bg-opacity-95 backdrop-blur-xl rounded-t-[32px] flex flex-col pt-2 overflow-hidden"
               style={{ height: '40vh' }}
           >
               {/* Drag Handle */}
               <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2 shrink-0" />

               {/* Mic strip */}
               <div className="px-6 py-3 flex flex-col gap-2 border-b border-white/5">
                   <div className="flex items-center justify-between w-full">
                      <span className="text-white/50 text-sm font-bold">Select Receiver</span>
                      <button onClick={onClose} className="p-2 -mr-2 mb-[-8px]"><ChevronLeft className="text-white/40 rotate-[270deg]" /></button>
                   </div>
                   <div className="flex-1 flex overflow-x-auto no-scrollbar gap-3 pr-4 relative w-full pt-1 pb-1">
                       {Object.keys(seats).length === 0 ? (
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                  <Volume2 size={16} className="text-white/50" />
                              </div>
                              <span className="text-white/40 text-sm font-bold">No other one on mic</span>
                          </div>
                       ) : (
                          <>
                            <button 
                               onClick={() => setSelectedSeats(Object.keys(seats).map(Number))}
                               className={`flex flex-col items-center gap-1 shrink-0 ${selectedSeats.length === Object.keys(seats).length && selectedSeats.length > 0 ? 'opacity-100' : 'opacity-50'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-transparent relative pointer-events-none">
                                   <span className="text-white text-sm font-bold font-serif">All</span>
                                   {selectedSeats.length === Object.keys(seats).length && selectedSeats.length > 0 && (
                                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#ff7242] rounded-full border-2 border-[#1c1815]" />
                                   )}
                                </div>
                                <span className="text-white text-[10px] w-12 truncate text-center">All</span>
                            </button>
                            
                            {Object.entries(seats).map(([seatId, s]) => {
                               const id = Number(seatId);
                               const isSelected = selectedSeats.includes(id);
                               return (
                                 <button
                                    key={id}
                                    onClick={() => setSelectedSeats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                                    className={`flex flex-col items-center gap-1 shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`}
                                 >
                                    <div className={`w-10 h-10 rounded-full overflow-hidden border-2 flex items-center justify-center bg-black relative pointer-events-none ${isSelected ? 'border-[#ff7242]' : 'border-transparent'}`}>
                                       <img src={s.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.userId}`} className="w-full h-full object-cover" alt="" />
                                       {isSelected && (
                                         <div className="absolute inset-0 bg-black/20" />
                                       )}
                                    </div>
                                    <span className="text-white text-[10px] w-12 truncate text-center">{s.userName?.split(' ')[0] || 'Guest'}</span>
                                 </button>
                               );
                            })}
                          </>
                       )}
                   </div>
               </div>

               {/* Tabs & Admin */}
               <div className="flex items-center px-6 pt-4 gap-6 relative">
                   {['HOT', 'Privileges'].map(tab => (
                       <button 
                          key={tab} 
                          onClick={() => setActiveTab(tab as any)}
                          className={`text-[15px] font-black pb-2 transition-colors relative ${activeTab === tab ? 'text-white' : 'text-white/50'}`}
                       >
                          {tab}
                          {activeTab === tab && <motion.div layoutId="giftTab" className="absolute bottom-0 inset-x-0 h-[2px] bg-white rounded-full" />}
                       </button>
                   ))}
                   <button onClick={() => setShowAdminPanel(true)} className="w-6 h-6 flex items-center justify-center bg-white/10 rounded-full border border-white/20 ml-2">
                       <Plus size={14} className="text-white/60" />
                   </button>
               </div>

               {/* Recipient info strip below tabs */}
               <div className="bg-[#241f1c] px-6 py-2.5 flex justify-between items-center text-sm font-bold mt-2">
                   <div className="flex items-center gap-2 text-white/50">
                       The recipient: 
                       <span className="text-white flex items-center gap-1 ml-1">{selectedSeats.length > 0 ? `${selectedSeats.length} Users` : 'None'}</span>
                   </div>
                   <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center text-white/50 text-[10px]">?</div>
               </div>

               {/* Gifts Grid */}
               <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-4 gap-x-2 gap-y-4 px-2 py-4 pb-20">
                  {gifts.map((gift) => {
                      const isSelected = selectedGiftId === gift.id;
                      return (
                      <div 
                        key={gift.id} 
                        onClick={() => setSelectedGiftId(gift.id)}
                        className={`flex flex-col items-center justify-between px-1 py-2 rounded-2xl relative cursor-pointer transition-all ${isSelected ? 'bg-white/5 shadow-inner border border-white/5' : ''}`}
                      >
                          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden drop-shadow-md relative bg-transparent">
                             <img src={gift.image} className="w-full h-full object-cover mix-blend-lighten pointer-events-none" alt={gift.name} />
                          </div>
                          <span className="text-white text-xs font-bold mt-1 whitespace-nowrap truncate max-w-full drop-shadow-md">{gift.name}</span>
                          <span className="text-yellow-500 text-[10px] font-black tracking-wide flex items-center gap-1 drop-shadow-md"><Coins size={10} className="text-yellow-400" /> {gift.price}</span>
                          
                          {isSelected && (
                             <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end translate-y-3">
                                 <button 
                                   onClick={(e) => { 
                                      e.stopPropagation(); 
                                      if (selectedSeats.length === 0) { alert('Please select a receiver on mic'); return; }
                                      onSendGift({ ...gift, targetSeats: selectedSeats }); 
                                   }}
                                   className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[14px] font-black py-1.5 rounded-full shadow-lg pointer-events-auto active:scale-95 transition-all"
                                 >
                                    Send
                                 </button>
                             </div>
                          )}
                      </div>
                      );
                  })}
               </div>
               
               {/* Bottom Quick Select */}
               <div className="px-4 pb-8 pt-2 flex items-center justify-between border-t border-white/5 absolute bottom-0 inset-x-0 bg-[#1c1815]">
                   <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1.5 shadow-inner">
                       <span className="text-yellow-500 text-sm font-black flex items-center gap-1 mr-1"><Coins size={14} className="text-yellow-400" /> {profile?.chips || 0} <ChevronLeft className="rotate-180" size={14} /></span>
                       <Gift size={16} className="text-[#ff6b9e]" />
                   </div>
                   
                   <div className="flex items-center gap-4 text-white/50 font-bold text-[15px]">
                      <button className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-black shadow-md">1</button>
                      <button>7</button>
                      <button>77</button>
                      <button>777</button>
                      <button className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center border border-white/20"><ChevronLeft size={16} className="rotate-[135deg]"/></button>
                   </div>
               </div>
           </motion.div>
       </AnimatePresence>
   );
}

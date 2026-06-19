import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MoreHorizontal, Maximize2, Mic, MicOff, Menu, Gift, MessageSquare, User, Volume2, Plus, Smile, Coins, Swords, Clock, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, collection, onSnapshot, updateDoc, setDoc, deleteDoc, serverTimestamp, runTransaction, query, orderBy, limit } from 'firebase/firestore';

export function PartyRoomView({ user, profile, roomId, onBack }: any) {
  const [showGift, setShowGift] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showPKTimes, setShowPKTimes] = useState(false);
  const [isPKMode, setIsPKMode] = useState(false);
  const [pkTime, setPkTime] = useState(0);
  const [mySeat, setMySeat] = useState<number | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const [seats, setSeats] = useState<Record<string, any>>({});
  const [banners, setBanners] = useState<any[]>([]);

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

    return () => { unRoom(); unSeats(); unBanners(); };
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

  const chatMessages = [
    { type: 'announcement', text: 'بەخێربێیت! با بەیەکەوە گفتوگۆ بکەین!' },
    { type: 'system', text: 'Welcome to Yari Konkan. Please respect each other and chat politely.' },
    { type: 'event', text: `The owner @${roomData?.title || 'ONLY ONE'} entered the room` }
  ];

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
            <button onClick={onBack} className="text-white p-1 -ml-2 drop-shadow-md active:scale-95 transition-transform"><ChevronLeft size={28} /></button>
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
               <div className="bg-[#00c853] text-white px-3 py-0.5 rounded-full inline-flex font-bold text-xs shadow-md border border-[#00e676]">
                  Lv.1
               </div>
            </div>
         )}
         
         {isPKMode && (
         <div className="flex items-center w-full justify-between mt-2 max-w-md mx-auto">
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
                   className="bg-gradient-to-r from-blue-900/40 via-blue-700/80 to-indigo-600/90 rounded-full flex items-center pr-2 pl-6 py-1 drop-shadow-2xl backdrop-blur-md max-w-full float-right border border-white/10"
                   style={{ minWidth: '280px' }}
                 >
                    <span className="text-[#facc15] font-black italic mr-8 whitespace-nowrap text-3xl font-serif" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.6)' }}>
                       1 x
                    </span>
                    <div className="absolute left-10 w-24 h-24 pointer-events-none z-20 flex items-center justify-center -translate-y-1">
                       <img src={banner.giftImage || ''} className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mix-blend-screen scale-[1.3]" alt="" />
                    </div>
                    
                    <div className="flex flex-col items-center justify-center pl-[52px] pr-2 h-full flex-1">
                       <span className="text-white font-bold text-[15px] drop-shadow-md tracking-wide leading-tight line-clamp-1">{banner.senderName || 'Somebody'}</span>
                       <span className="text-yellow-300 font-bold text-[13px] drop-shadow-md whitespace-nowrap">{banner.giftName || 'Gift'}</span>
                    </div>
                    
                    <div className="w-[46px] h-[46px] rounded-full overflow-hidden border-2 border-indigo-300 shrink-0 shadow-md">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${banner.senderId}`} className="w-full h-full object-cover bg-white" alt="" />
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

         {chatMessages.map((msg, i) => (
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
             </div>
         ))}
      </div>

       {/* Bottom Bar */}
       <div className="relative z-10 px-3 pb-6 pt-4 flex items-center gap-2 w-full bg-gradient-to-t from-black/80 to-transparent shrink-0">
          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
             <Volume2 size={20} className="text-white" />
          </button>

          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
             <MicOff size={20} className="text-white" />
          </button>

          <button className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
             <Smile size={20} className="text-white" />
          </button>
          
          <div className="flex-1 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 flex items-center min-w-0">
             <input type="text" placeholder="Say something..." className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/50" />
          </div>
          
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

       {showGift && <GiftUI onClose={() => setShowGift(false)} onSendGift={handleSendGift} />}
    </div>
  );
}

function GiftUI({ onClose, onSendGift }: { onClose: () => void; onSendGift: (gift: any) => void }) {
   const [activeTab, setActiveTab] = useState<'HOT' | 'Privileges'>('HOT');
   const [selectedGiftId, setSelectedGiftId] = useState<number>(1);
   
   const gifts = [
       { name: 'Tea Set', price: 3, image: 'https://images.unsplash.com/photo-1576092762791-dd9e2220c4c7?w=100&h=100&fit=crop', id: 1 },
       { name: 'love box', price: 29, image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&h=100&fit=crop', id: 2 },
       { name: 'Rosaline', price: 199, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=100&h=100&fit=crop', id: 3 },
       { name: '99 roses', price: 99, image: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=100&h=100&fit=crop', id: 4 },
       { name: 'Magical Jewel', price: 199, image: 'https://images.unsplash.com/photo-1615690466487-172151f1f7ed?w=100&h=100&fit=crop', id: 5 },
       { name: 'love balloons', price: 299, image: 'https://images.unsplash.com/photo-1530103862676-de8892b00511?w=100&h=100&fit=crop', id: 6 },
       { name: 'Snack bucket', price: 499, image: 'https://images.unsplash.com/photo-1582234032138-000c2834b6e5?w=100&h=100&fit=crop', id: 7 },
       { name: 'hands in a heart', price: 599, image: 'https://images.unsplash.com/photo-1518047053526-bf318eb7ac6e?w=100&h=100&fit=crop', id: 8 }
   ];

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
               <div className="px-6 py-3 flex items-center justify-between border-b border-white/5">
                   <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                           <Volume2 size={16} className="text-white/50" />
                       </div>
                       <span className="text-white/40 text-sm font-bold">No other one on mic</span>
                   </div>
                   <button onClick={onClose} className="p-2 -mr-2"><ChevronLeft className="text-white/40 rotate-[270deg]" /></button>
               </div>

               {/* Tabs */}
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
                   <div className="ml-auto p-1.5 bg-white/10 rounded-md">
                       <div className="w-4 h-4 border border-white/50 rounded-sm" />
                   </div>
               </div>

               {/* Recipient */}
               <div className="bg-[#241f1c] px-6 py-2.5 flex justify-between items-center text-sm font-bold mt-2">
                   <div className="flex items-center gap-2 text-white/50">
                       The recipient: 
                       <span className="text-white flex items-center gap-1 ml-1">🌻 +3</span>
                       <span className="text-white flex items-center gap-1"><Coins size={12} className="text-yellow-400" /> +1</span>
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
                          {activeTab === 'HOT' && <div className="absolute top-1 left-1 bg-[#8e44ad] rounded flex items-center justify-center text-white px-[2px] py-[2px] shadow-sm"><span className="text-[8px] leading-none">🎵</span></div>}
                          <div className="w-[72px] h-[72px] rounded-xl overflow-hidden drop-shadow-md relative bg-transparent">
                             <img src={gift.image} className="w-full h-full object-cover mix-blend-lighten pointer-events-none" alt={gift.name} />
                          </div>
                          <span className="text-white text-xs font-bold mt-1 whitespace-nowrap truncate max-w-full drop-shadow-md">{gift.name}</span>
                          <span className="text-yellow-500 text-[10px] font-black tracking-wide flex items-center gap-1 drop-shadow-md"><Coins size={10} className="text-yellow-400" /> {gift.price}</span>
                          
                          {isSelected && (
                             <div className="absolute inset-x-0 bottom-0 pointer-events-none flex flex-col justify-end translate-y-3">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); onSendGift(gift); }}
                                   className="w-full bg-[#ff7242] text-white text-[14px] font-black py-1.5 rounded-full shadow-lg pointer-events-auto active:bg-[#e46433] transition-colors"
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
                       <span className="text-yellow-500 text-sm font-black flex items-center gap-1 mr-1"><Coins size={14} className="text-yellow-400" /> 160 <ChevronLeft className="rotate-180" size={14} /></span>
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

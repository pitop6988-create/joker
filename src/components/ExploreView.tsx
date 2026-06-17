import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { collection, onSnapshot, addDoc, getDocs, where, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function ExploreView({ onBack, setActiveTab, language, onJoinRoom, user, profile }: any) {
  const [activeView, setActiveView] = useState<'Mine' | 'Explore'>('Explore');
  const [activeCategory, setActiveCategory] = useState('Recommend');
  const [mineCategory, setMineCategory] = useState('Following');
  const categories = ['Recommend', 'Game', 'PK', 'Video'];

  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'partyRooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRooms(fetchedRooms);
    }, (error) => console.error(error));
    return () => unsubscribe();
  }, [user?.uid]);

  const handleCreateRoom = async () => {
    if (!user) return;
    try {
      // Find existing room by this user
      const q = query(collection(db, 'partyRooms'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        onJoinRoom(snapshot.docs[0].id);
        return;
      }
      
      const roomRef = await addDoc(collection(db, 'partyRooms'), {
        title: profile?.displayName ? `${profile.displayName}'s Room` : 'My Party Room',
        ownerId: user.uid,
        image: profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        type: 'audio',
        viewers: 1,
        createdAt: Date.now()
      });
      onJoinRoom(roomRef.id);
    } catch (err) {
      console.error("Failed to create/join room (quota limit?)", err);
      onJoinRoom('local-room-1');
    }
  };

  return (
    <div className="min-h-screen bg-[#140b08] font-sans flex flex-col pb-24 text-white" style={{ backgroundImage: 'radial-gradient(circle at top right, #381a10, #140b08 50%)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-baseline gap-4 cursor-pointer">
          <span 
            onClick={() => setActiveView('Mine')} 
            className={`transition-all ${activeView === 'Mine' ? 'text-white text-[28px] font-black tracking-tight drop-shadow-md' : 'text-white/50 text-xl font-bold hover:text-white/70'}`}
          >
            Mine
          </span>
          <span 
            onClick={() => setActiveView('Explore')} 
            className={`transition-all ${activeView === 'Explore' ? 'text-white text-[28px] font-black tracking-tight drop-shadow-md' : 'text-white/50 text-xl font-bold hover:text-white/70'}`}
          >
            Explore
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-2xl transform rotate-12 transition-transform hover:scale-110 drop-shadow-md">🎉</button>
          <button className="text-white drop-shadow-md"><Search size={26} strokeWidth={2.5}/></button>
        </div>
      </div>

      {activeView === 'Explore' ? (
        <>
          {/* Tabs */}
          <div className="px-5 py-2 flex gap-3 overflow-x-auto no-scrollbar mb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full whitespace-nowrap font-bold transition-all ${
                  activeCategory === cat 
                    ? 'bg-[#ff7242] text-white' 
                    : 'bg-[#3d3835] text-white/70 hover:bg-[#4a4441]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="px-4 space-y-3">
            {rooms.map((room) => (
              <div key={room.id} onClick={() => onJoinRoom(room.id)} className="bg-[#241f1c] rounded-[24px] p-3 flex gap-4 w-full relative active:scale-[0.98] transition-transform cursor-pointer shadow-sm">
                
                {/* Image Box */}
                <div className="relative w-[104px] h-[104px] shrink-0 rounded-2xl overflow-hidden bg-black/20">
                  <img src={room.image} className="w-full h-full object-cover" alt="" />
                  {room.topBadge && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-black text-center py-0.5 z-10 shadow-sm">
                      {room.topBadge}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center flex-1 py-1 min-w-0 pr-12 text-left">
                   <h3 className="font-bold text-[18px] text-white mb-2 truncate leading-tight tracking-wide" dir="auto">{room.title}</h3>
                   {room.subtitle && (
                     <p className="text-white/50 text-xs mb-2 truncate" dir="auto">{room.subtitle}</p>
                   )}
                   {(room.badge1 || room.level) && (
                     <div className="flex items-center gap-2 mt-auto">
                       {room.badge1 && (
                         <div className="bg-[#4d975b] border border-[#60aa6e] text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold shadow-sm">
                           {room.badge1}
                         </div>
                       )}
                       {room.level && (
                         <div className="bg-[#4378ff] border border-[#5889ff] text-white text-[11px] px-2.5 py-0.5 rounded-full font-black shadow-sm">
                           Lv.{room.level}
                         </div>
                       )}
                     </div>
                   )}
                </div>

                {/* Right Side Icons */}
                <div className="absolute right-4 top-4 flex flex-col items-end gap-6 h-full pb-8">
                   {room.type === 'pk' && (
                     <div className="bg-gradient-to-br from-[#4db4d7] to-[#128a9be3] text-white font-black text-[13px] italic px-1.5 py-0.5 rounded-md shadow-md flex items-center justify-center -skew-x-6 border border-white/20">
                        <span className="text-[#ff6b9e] mr-[1px]">P</span>K
                     </div>
                   )}
                   {room.type !== 'pk' && (
                     <div className="w-8 h-8 bg-gradient-to-br from-[#9c27b0] to-[#673ab7] rounded-full flex items-center justify-center border-2 border-[#ffcc00] shadow-sm relative">
                        <div className="w-3 h-3 bg-[#ffcc00] rounded-full shadow-inner" />
                     </div>
                   )}

                   <div className="flex items-center gap-1 text-white/50 text-[13px] font-bold absolute bottom-8 right-2 tracking-widest">
                     <span className="flex gap-[2px] opacity-70">
                        <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse" />
                        <div className="w-1 h-4 bg-white/50 rounded-full animate-pulse" style={{animationDelay: '150ms'}} />
                        <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" style={{animationDelay: '300ms'}} />
                     </span>
                     {room.viewers}
                   </div>
                </div>

              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Mine View */}
          <div className="px-5 mt-2 mb-6">
            <div onClick={handleCreateRoom} className="w-full bg-[#3a2820] bg-opacity-80 backdrop-blur-md rounded-[28px] p-5 flex items-center relative overflow-hidden border border-white/5 shadow-xl cursor-pointer active:scale-[0.98] transition-transform">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff7242] opacity-10 blur-3xl rounded-full" />
              
              <div className="relative shrink-0 w-16 h-16 mr-4 flex items-center justify-center translate-y-[-2px]">
                 <span className="text-[52px] filter drop-shadow-xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3)) sepia(1) hue-rotate(330deg) saturate(1.5)' }}>🎙️</span>
                 <div className="absolute -top-1 -left-1 text-white/80 text-xl font-bold animate-pulse">✨</div>
                 <div className="absolute top-2 -right-1 text-white/70 text-sm italic font-serif">🎵</div>
              </div>
              <div className="flex-1 min-w-0 z-10 text-left">
                 <h2 className="text-white font-black text-[22px] mb-0 tracking-wide drop-shadow-sm">My party room</h2>
                 <p className="text-white/50 text-[15px] font-bold">Chat with anyone</p>
              </div>
              <button className="w-11 h-11 bg-[#f97b4b] hover:bg-[#e46433] active:scale-95 transition-all rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg border border-[#ff916a]">
                 <Plus size={26} strokeWidth={3} className="text-white" />
              </button>
            </div>
          </div>
          
          <div className="px-5 py-2 flex gap-3 overflow-x-auto no-scrollbar mb-8">
            {['Following', 'Joined', 'Recently'].map((cat) => (
              <button
                key={cat}
                onClick={() => setMineCategory(cat)}
                className={`px-[22px] py-2.5 rounded-full whitespace-nowrap font-bold transition-all text-[15px] ${
                  mineCategory === cat 
                    ? 'bg-[#ff7242] text-white shadow-md' 
                    : 'bg-[#312b28] text-white/60 hover:bg-[#3d3835]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center pb-32">
            <div className="w-8 h-8 border-[3px] border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        </>
      )}
      
      {/* Create Room FAB */}
      <button 
        onClick={handleCreateRoom}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform z-50">
        <Plus size={28} strokeWidth={3} />
      </button>

    </div>
  );
}

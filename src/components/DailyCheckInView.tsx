import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';

export function DailyCheckInView({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState(false);
  
  const days = [
    { day: 1, coins: 5, active: true },
    { day: 2, coins: 5, active: false },
    { day: 3, coins: 5, active: false },
    { day: 4, coins: 5, active: false },
    { day: 5, coins: 10, active: false },
    { day: 6, coins: 10, active: false },
    { day: 7, isChest: true, active: false }
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[500] font-sans">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col items-center"
      >
         {/* Top yellow gradient background */}
         <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#fff6b0] via-[#fffbf0] to-white z-0" />
         
         <div className="w-full relative z-10 px-6 pt-8 pb-4 flex flex-col items-center">
            
            {/* Header Text */}
            <div className="w-full relative mb-4">
               <h2 className="font-black text-[34px] tracking-tight text-black relative inline-block">
                  Daily check in
                  <div className="absolute -bottom-2 -right-4 w-[120%] h-4 bg-[#ff6b8b] rounded-full -z-10 mix-blend-multiply opacity-70 transform -rotate-2" />
               </h2>
               
               <img src="https://api.dicebear.com/7.x/shapes/svg?seed=smile&backgroundColor=ffd700" alt="smile" className="absolute -top-4 right-0 w-16 h-16 rounded-2xl bg-[#ffd700] rotate-12 shadow-sm" />
            </div>

            {/* Notifications Toggle */}
            <div className="bg-white/80 backdrop-blur-md rounded-full px-4 py-2.5 flex items-center gap-3 w-full border border-[#fff0d4] shadow-sm mb-6">
               <span className="font-bold text-[#ff8c00] flex-1 text-[15px]">Turn on Notifications <span className="inline-flex items-center justify-center w-4 h-4 bg-[#ffd700] rounded-full text-white text-[10px] ml-1">★</span> +10%</span>
               <div 
                 onClick={() => setNotifications(!notifications)}
                 className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${notifications ? 'bg-[#ff9800]' : 'bg-[#e0e0e0]'}`}
               >
                  <motion.div 
                    initial={false}
                    animate={{ x: notifications ? 20 : 0 }}
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                  />
               </div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-4 gap-3 w-full mb-8">
               {days.slice(0, 4).map(d => (
                 <DayCard key={d.day} day={d} />
               ))}
               {days.slice(4, 6).map(d => (
                 <DayCard key={d.day} day={d} />
               ))}
               <div className="col-span-2">
                 <DayCard day={days[6]} isLarge />
               </div>
            </div>

            {/* Check in Button */}
            <button 
              onClick={() => { alert('Checked in! Come back tomorrow.'); onClose(); }}
              className="w-full bg-[#ff7b00] hover:bg-[#ff6a00] active:scale-95 transition-all py-4 rounded-3xl text-white font-black text-[22px] shadow-[0_8px_20px_rgba(255,123,0,0.3)] mb-2"
            >
              Check in
            </button>
         </div>

      </motion.div>
    </div>
  );
}

function DayCard({ day, isLarge = false }: { key?: React.Key, day: any, isLarge?: boolean }) {
  return (
    <div className={`
      relative rounded-2xl flex flex-col items-center justify-center pt-3 pb-3
      ${day.active ? 'bg-gradient-to-b from-[#fff25c] to-[#ffe500] shadow-[0_4px_15px_rgba(255,229,0,0.4)] border-2 border-white' : 'bg-[#f4f5f7]'}
      ${isLarge ? 'h-full bg-[#f4f5f7]' : 'aspect-[3/4]'}
    `}>
       <span className={`font-bold text-[14px] mb-2 tracking-tight ${day.active ? 'text-black' : 'text-gray-400'}`}>
          Day{day.day}
       </span>
       
       <div className="flex-1 flex items-center justify-center mb-1">
          {day.isChest ? (
            <div className="w-14 h-14 bg-gradient-to-br from-[#ffd700] to-[#ffaa00] rounded-xl flex items-center justify-center text-3xl shadow-sm border border-white relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay" />
               📦
            </div>
          ) : (
            <div className="relative">
              <div className="w-9 h-9 bg-[#ffd700] rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-black text-lg">★</div>
              <div className="w-9 h-9 bg-[#ffae00] rounded-full border-2 border-white shadow-sm absolute -top-1 -right-2 flex items-center justify-center text-white font-black text-lg">★</div>
            </div>
          )}
       </div>

       {day.active && !day.isChest && (
         <div className="bg-[#ff6e40] text-white text-[10px] font-black px-1.5 py-0.5 rounded-md mb-1 shadow-sm">+10%</div>
       )}
       {day.isChest && (
         <div className="bg-[#ff6e40] text-white text-[11px] font-black px-2 py-0.5 rounded-md mb-1 shadow-sm mt-1">+10%</div>
       )}

       <div className={`font-black tracking-wide ${day.active ? 'text-[#e65c00]' : 'text-[#ffb380]'} ${day.isChest ? 'text-lg mt-1' : 'text-xs'}`}>
         {day.isChest ? 'Chest' : `★ x${day.coins}`}
       </div>
    </div>
  );
}

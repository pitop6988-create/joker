import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, Settings, Trophy, Wifi, Eye, ChevronRight, MessageSquare, Smile, Mic, Volume2 } from 'lucide-react';
// @ts-ignore
import dobbleBgImage from './assets/images/dobble_game_bg_1781448487022.jpg';

export default function DobbleBoard({ game, user, opponentProfile, opponentId }: any) {
  return (
    <div className="absolute inset-0 bg-black" style={{ backgroundImage: `url(${dobbleBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      {/* Top Header */}
      <div className="absolute top-0 w-full p-4 md:p-6 flex justify-between items-start z-[150]">
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 shadow-lg">
             <RefreshCcw size={18} />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 shadow-lg">
             <Settings size={18} />
          </button>
          <div className="flex items-center justify-center w-10 h-10">
             <Trophy size={24} className="text-yellow-500 drop-shadow-md" />
          </div>
        </div>

        <div className="flex flex-col items-center">
            <div className="bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-sm mt-12">
               <div className="w-4 h-4 text-white font-black text-sm text-center">⏱</div>
               <span className="text-white font-black text-sm">1:59</span>
            </div>
        </div>

        <div className="flex gap-2">
            <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-emerald-500/30">
               <span className="text-emerald-400 font-bold text-[10px]">161ms</span>
               <Wifi size={12} className="text-emerald-400" />
            </div>
            <div className="bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
               <span className="text-white font-bold text-[10px]">2</span>
               <Eye size={12} className="text-white" />
            </div>
            <button className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
               <ChevronRight size={16} />
            </button>
        </div>
      </div>

      {/* Players */}
      <div className="absolute top-28 left-4 z-[140] flex flex-col items-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-orange-500 overflow-hidden bg-white shadow-xl">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=p1`} alt="Opponent" className="w-full h-full" />
          </div>
          <div className="absolute -top-1 -right-1 bg-white border border-gray-200 text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">0</div>
        </div>
        <div className="mt-1 bg-black/50 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
           HiwaPayam
        </div>
      </div>

      <div className="absolute top-28 right-4 z-[140] flex flex-col items-center">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-indigo-500 overflow-hidden bg-white shadow-xl">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=p3`} alt="Opponent" className="w-full h-full" />
          </div>
          <div className="absolute -top-1 -right-1 bg-white border border-gray-200 text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">0</div>
        </div>
        <div className="mt-1 bg-black/50 backdrop-blur-sm text-white text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
           Anas Gamer
        </div>
      </div>

      <div className="absolute bottom-32 left-4 z-[140] flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-[3px] border-emerald-500 overflow-hidden bg-white shadow-2xl p-0.5">
            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} alt="You" className="w-full h-full rounded-full" />
          </div>
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm border border-yellow-500">0</div>
        </div>
        <div className="mt-2 bg-black/60 backdrop-blur-md text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-widest font-black border border-white/10">
           {user?.displayName?.split(' ')[0] || 'ONLY ONE'}
        </div>
      </div>

      {/* Cards */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-[120]">
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-64 h-64 sm:w-[320px] sm:h-[320px] bg-[#fffaf0] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.15)] border-4 border-[#b59b72] relative overflow-hidden"
         >
            {/* Some mock icons placed randomly for Card 1 */}
            <div className="absolute top-[15%] left-[40%] text-purple-500 text-4xl transform -rotate-12">🦄</div>
            <div className="absolute top-[20%] right-[25%] text-yellow-500 text-4xl">☀️</div>
            <div className="absolute top-[35%] right-[15%] text-blue-300 text-5xl">❄️</div>
            <div className="absolute top-[60%] right-[20%] text-red-500 text-5xl transform rotate-[130deg]">🚗</div>
            <div className="absolute bottom-[10%] left-[30%] text-yellow-600 text-6xl">🧭</div>
            <div className="absolute top-[30%] left-[10%] text-purple-700 text-4xl transform rotate-45 border-2 border-purple-500 rounded-full p-2 bg-white flex items-center justify-center">🔍</div>
            <div className="absolute top-[45%] left-[40%] text-purple-400 text-[80px]">⭐</div>
            <div className="absolute bottom-[20%] left-[15%] text-teal-600 text-4xl transform -rotate-12">🌍</div>
         </motion.div>

         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="w-64 h-64 sm:w-[320px] sm:h-[320px] bg-[#fffaf0] rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.15)] border-4 border-[#b59b72] relative overflow-hidden"
         >
            {/* Some mock icons placed randomly for Card 2 */}
            <div className="absolute top-[15%] left-[30%] text-pink-400 text-5xl">🧁</div>
            <div className="absolute top-[20%] right-[30%] text-teal-500 text-[50px] transform rotate-12">🛼</div>
            <div className="absolute top-[45%] left-[5%] text-purple-700 text-4xl transform -rotate-45 border-2 border-purple-500 rounded-full p-2 bg-white flex items-center justify-center">🔍</div>
            <div className="absolute top-[40%] right-[10%] text-orange-400 text-6xl">🍔</div>
            <div className="absolute top-[40%] left-[35%] text-blue-500 text-[100px] transform -rotate-12">🌙</div>
            <div className="absolute bottom-[25%] left-[15%] text-green-500 text-4xl transform -rotate-45">🩹</div>
            <div className="absolute bottom-[10%] left-[45%] text-green-600 text-[60px]">🌵</div>
            <div className="absolute bottom-[15%] right-[20%] text-black text-[80px] transform rotate-12">🐧</div>
         </motion.div>
      </div>

      {/* Chat Bar */}
      <div className="absolute bottom-6 w-full px-4 z-[150] flex items-center justify-between pointer-events-auto">
         <div className="relative">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg relative cursor-pointer">
               <MessageSquare size={18} className="text-white" />
               <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#f5e6ce]">13</div>
            </div>
         </div>
         
         <div className="w-10 h-10 ml-3 mr-1 bg-[#ffcc00] rounded-lg flex items-center justify-center shadow-md transform rotate-3 cursor-pointer">
             <span className="text-white text-xl drop-shadow-md">🎁</span>
         </div>

         <div className="flex-1 max-w-[280px] mx-3 relative">
            <input 
               type="text" 
               placeholder="...شتێک بڵێ"
               className="w-full bg-black/30 border border-white/10 rounded-full py-3 px-5 text-white/80 outline-none text-right placeholder-white/40 text-sm shadow-inner backdrop-blur-md"
            />
         </div>

         <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white/70 border border-white/10 hover:bg-black/40 transition-colors">
               <Smile size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white/70 border border-white/10 hover:bg-black/40 transition-colors">
               <Mic size={18} />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center text-white/70 border border-white/10 hover:bg-black/40 transition-colors">
               <Volume2 size={18} />
            </button>
         </div>
      </div>

    </div>
  );
}

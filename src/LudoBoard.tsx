import React from 'react';
import { Game, UserProfile } from './types';
import { User, Menu, RefreshCcw, Radio, Eye, Users, MessageSquare, Gift, ArrowLeft, Star } from 'lucide-react';
import { motion } from 'motion/react';

export default function LudoBoard({ game, user, opponentProfile, opponentId }: { game: Game, user: any, opponentProfile: UserProfile | null, opponentId: string }) {
  const isMyTurn = game.turn === user.uid;

  return (
    <div className="fixed inset-0 bg-[#3b0b75] overflow-hidden flex flex-col font-sans select-none touch-none" style={{ background: 'radial-gradient(circle at center, #511c9c, #2a075e)' }}>
      {/* Subtle Background Stars Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

      {/* Header (Simplified standard header) */}
      <div className="absolute top-0 w-full h-14 border-b border-white/10 bg-black/20 flex items-center justify-between px-4 z-[110]">
        <div className="flex items-center gap-4">
           <button className="flex gap-1 items-center bg-white/10 px-2 py-1 rounded-lg text-white">
              <span className="font-bold flex gap-1">☰ <div className="w-4 h-4 bg-red-600 rounded-full text-[9px] font-black flex items-center justify-center -ml-2 -mt-1">1</div></span>
           </button>
           <button className="text-white/80"><Radio size={18} /></button>
        </div>
        <div className="text-white font-black tracking-[0.2em] uppercase text-xl">
           Name Game
        </div>
        <div className="flex items-center gap-3">
           <button className="text-white">
              <Users size={20} />
              <span className="absolute -bottom-2 -right-1 text-[10px] font-bold">+</span>
           </button>
           <button className="text-white">
              <MessageSquare size={20} />
           </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
        
        {/* Opponent Top Right */}
        <div className="absolute top-20 right-4 flex flex-col items-end">
          <div className="flex gap-2 items-center mb-1">
             <div className="bg-[#ba8d55] border-2 border-[#5c4021] w-8 h-8 rounded shrink-0 flex items-center justify-center shadow-md pb-0.5">
                <Star size={16} fill="black" className="text-black" />
             </div>
             <div className="relative w-16 h-16 rounded-full border-[3px] border-white overflow-hidden shadow-xl bg-[#1a1a1a]">
                <img src={opponentProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentId}`} alt="" className="w-full h-full rounded-full" />
             </div>
          </div>
          <div className="bg-white text-black font-medium text-xs px-3 py-1 mt-1 rounded relative -right-1">
             Name User
          </div>
        </div>

        {/* Ludo Board */}
        <div className="w-[340px] h-[340px] bg-white rounded-xl shadow-2xl relative border-4 border-white/20 p-2 z-10 flex shrink-0">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Ludo_board.svg" alt="Ludo Board Prototype" className="w-full h-full object-contain pointer-events-none opacity-90 rounded-md" />
           <div className="absolute inset-2 grid grid-cols-2 grid-rows-2 gap-[18%] p-3">
              <div className="bg-[#00bcd4]/90 rounded-xl shadow-inner border-2 border-white/30 flex items-center justify-center p-3 relative">
                 {/* Pegs */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                 </div>
              </div>
              <div className="bg-[#ffeb3b]/90 rounded-xl shadow-inner border-2 border-white/30 flex items-center justify-center p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-yellow-400"></div><div className="w-full h-0.5 bg-yellow-400"></div>
                       </div>
                    </div>
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-yellow-400"></div><div className="w-full h-0.5 bg-yellow-400"></div>
                       </div>
                    </div>
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-yellow-400"></div><div className="w-full h-0.5 bg-yellow-400"></div>
                       </div>
                    </div>
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-yellow-400"></div><div className="w-full h-0.5 bg-yellow-400"></div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="bg-[#f44336]/90 rounded-xl shadow-inner border-2 border-white/30 flex items-center justify-center p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-red-500"></div><div className="w-full h-0.5 bg-red-500"></div>
                       </div>
                    </div>
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-red-500"></div><div className="w-full h-0.5 bg-red-500"></div>
                       </div>
                    </div>
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-red-500"></div><div className="w-full h-0.5 bg-red-500"></div>
                       </div>
                    </div>
                    <div className="w-5 h-5 bg-black/20 rounded-full shadow-inner border border-black/30 flex items-center justify-center">
                       <div className="w-3 h-5 bg-gradient-to-t from-gray-300 to-white rounded-full translate-y-[-4px] shadow-sm flex flex-col items-center justify-center gap-[2px]">
                          <div className="w-full h-0.5 bg-red-500"></div><div className="w-full h-0.5 bg-red-500"></div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="bg-[#4caf50]/90 rounded-xl shadow-inner border-2 border-white/30 flex items-center justify-center p-3">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                    <div className="w-5 h-5 bg-black/60 rounded-full shadow-inner border-2 border-black/80"></div>
                 </div>
              </div>
           </div>
        </div>

        {/* Me Bottom Left */}
        <div className="absolute bottom-20 left-4 flex flex-col items-start z-20">
          <div className="flex gap-2 items-center mb-1">
             <div className="relative w-[70px] h-[70px] rounded-full border-4 border-[#00e676] overflow-hidden shadow-xl bg-[#1a1a1a] shadow-[0_0_15px_rgba(0,230,118,0.5)]">
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" className="w-full h-full rounded-full" />
             </div>
             <div className="bg-red-500 border-2 border-white/30 w-9 h-9 rounded flex items-center justify-center shadow-md relative">
                <Star size={18} fill="black" className="text-black" />
                <div className="absolute -left-1 bottom-0 w-3 h-3 bg-red-500 rotate-45 transform origin-center translate-y-1 -translate-x-1 border-b-2 border-l-2 border-white/30 z-[-1]"></div>
             </div>
             <div className="text-[#00e676] font-black text-2xl -ml-1">
                ←
             </div>
          </div>
          <div className="bg-white text-black font-medium text-sm px-4 py-1.5 mt-1 rounded-sm">
             Name My
          </div>
        </div>

      </div>
    </div>
  );
}

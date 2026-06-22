import React, { useState } from 'react';
import { Game, UserProfile } from './types';
import { User, Menu, RefreshCcw, Radio, Eye, Users, MessageSquare, Gift, ArrowLeft, Star, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LudoBoard({ game, user, opponentProfile, opponentId }: { game: Game, user: any, opponentProfile: UserProfile | null, opponentId: string }) {
  const isMyTurn = game.turn === user.uid;
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = () => {
    if (isRolling || !isMyTurn) return;
    setIsRolling(true);
    setDiceValue(null);
    
    // Simulate dice roll animation
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        setDiceValue(Math.floor(Math.random() * 6) + 1);
        setIsRolling(false);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-[#3b0b75] overflow-hidden flex flex-col font-sans select-none touch-none" style={{ background: 'radial-gradient(circle at center, #511c9c, #2a075e)' }}>
      {/* Subtle Background Stars Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")' }}></div>

      <div className="flex-1 w-full h-full relative flex items-center justify-center p-4">
        
        {/* Opponent Top Right */}
        <div className="absolute top-20 right-4 flex flex-col items-end z-20">
          <div className="flex gap-2 items-center mb-1">
             {!isMyTurn && (
                <div className="text-[#00e676] font-black text-2xl mr-1 animate-pulse drop-shadow-md">
                   →
                </div>
             )}
             <div className="bg-[#ba8d55] border-2 border-[#5c4021] w-8 h-8 rounded shrink-0 flex items-center justify-center shadow-md pb-0.5">
                <Star size={16} fill="black" className="text-black" />
             </div>
             <div className={`relative w-16 h-16 rounded-full border-[3px] overflow-hidden shadow-xl bg-[#1a1a1a] transition-all duration-300 ${!isMyTurn ? 'border-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.5)]' : 'border-white'}`}>
                <img src={opponentProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentId}`} alt="" className="w-full h-full rounded-full" />
             </div>
          </div>
          <div className="bg-white text-black font-medium text-xs px-3 py-1 mt-1 rounded relative -right-1 max-w-[120px] truncate shadow-sm">
             {opponentProfile?.displayName || game.playerNames?.[opponentId] || 'Opponent'}
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
             <div className={`relative w-[70px] h-[70px] rounded-full border-4 overflow-hidden shadow-xl bg-[#1a1a1a] transition-all duration-300 ${isMyTurn ? 'border-[#00e676] shadow-[0_0_15px_rgba(0,230,118,0.5)]' : 'border-white'}`}>
                <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="" className="w-full h-full rounded-full object-cover" />
             </div>
             <div className="bg-red-500 border-2 border-white/30 w-9 h-9 rounded flex items-center justify-center shadow-md relative">
                <Star size={18} fill="black" className="text-black" />
                <div className="absolute -left-1 bottom-0 w-3 h-3 bg-red-500 rotate-45 transform origin-center translate-y-1 -translate-x-1 border-b-2 border-l-2 border-white/30 z-[-1]"></div>
             </div>
             {isMyTurn && (
                <div className="text-[#00e676] font-black text-2xl -ml-1 animate-pulse">
                   ←
                </div>
             )}
          </div>
          <div className="bg-white text-black font-medium text-sm px-4 py-1.5 mt-1 rounded-sm max-w-[150px] truncate shadow-sm">
             {user.displayName || 'You'}
          </div>
        </div>

        {/* Dice Roll UI */}
        <div className="absolute bottom-24 right-6 z-30 flex flex-col items-center">
           {isMyTurn && !diceValue && !isRolling && (
              <div className="text-white text-sm font-bold animate-bounce mb-2 drop-shadow-md">Your Turn!</div>
           )}
           <button 
             onClick={rollDice}
             disabled={!isMyTurn || isRolling}
             className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-300 ${isMyTurn ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 border-2 border-yellow-200 cursor-pointer active:scale-95' : 'bg-gray-700/80 border-2 border-gray-500 opacity-60 cursor-not-allowed'}`}
           >
             {isRolling ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}>
                   <Dices size={40} className="text-white drop-shadow-md" />
                </motion.div>
             ) : diceValue ? (
                <span className="text-5xl font-black text-white drop-shadow-lg">{diceValue}</span>
             ) : (
                <Dices size={40} className="text-white drop-shadow-md" />
             )}
           </button>
        </div>

      </div>
    </div>
  );
}

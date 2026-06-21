import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc, onSnapshot, updateDoc, setDoc, runTransaction, increment } from 'firebase/firestore';

export function SuperWinnerUI({ roomId, onClose, user, profile }: any) {
  const [gameState, setGameState] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerTargetRotation, setWinnerTargetRotation] = useState(0);
  const JOIN_COST = 100;

  useEffect(() => {
    if (!roomId) return;
    const gameRef = doc(db, 'partyRooms', roomId, 'superWinner', 'current');
    
    const unsubscribe = onSnapshot(gameRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGameState(data);
        if (data.status === 'spinning' && data.winnerId && !isSpinning) {
          setIsSpinning(true);
          // Calculate rotation
          // Simple visual effect
          const participantsList = Object.keys(data.participants);
          const winnerIndex = participantsList.indexOf(data.winnerId);
          if (winnerIndex !== -1) {
             const anglePerUser = 360 / participantsList.length;
             const targetRotation = 360 * 5 + (anglePerUser * winnerIndex); // 5 full spins + winner angle
             setWinnerTargetRotation(targetRotation);
             
             // After spin ends
             setTimeout(() => {
               if (user.uid === data.winnerId) {
                  // award coins? If the start transaction didn't already
               }
             }, 5000);
          }
        } else if (data.status === 'waiting') {
           setIsSpinning(false);
           setWinnerTargetRotation(0);
        }
      } else {
        // Init game state
        setDoc(gameRef, {
          participants: {},
          status: 'waiting',
          pool: 0
        });
      }
    });

    return unsubscribe;
  }, [roomId]);

  const handleJoin = async () => {
    if (profile.chips < JOIN_COST) {
      alert("Not enough coins!");
      return;
    }
    
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;
        const currentChips = userSnap.data().chips || 0;
        
        if (currentChips < JOIN_COST) {
          throw new Error("Not enough coins");
        }
        
        const gameRef = doc(db, 'partyRooms', roomId, 'superWinner', 'current');
        const gameSnap = await transaction.get(gameRef);
        
        if (!gameSnap.exists()) {
           transaction.set(gameRef, {
             participants: {
               [user.uid]: {
                 photoURL: profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                 displayName: profile.displayName
               }
             },
             status: 'waiting',
             pool: JOIN_COST
           });
        } else {
           const data = gameSnap.data();
           if (data.status !== 'waiting') {
             throw new Error("Game already started");
           }
           if (Object.keys(data.participants || {}).length >= 10) {
             throw new Error("Room full");
           }
           if (data.participants[user.uid]) {
              throw new Error("Already joined");
           }
           
           transaction.update(gameRef, {
             [`participants.${user.uid}`]: {
               photoURL: profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
               displayName: profile.displayName
             },
             pool: increment(JOIN_COST)
           });
        }
        
        transaction.update(userRef, { chips: currentChips - JOIN_COST });
      });
    } catch (e: any) {
      alert(e.message || "Failed to join");
    }
  };

  const handleStart = async () => {
    if (!gameState || !gameState.participants || Object.keys(gameState.participants).length < 2) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        const gameRef = doc(db, 'partyRooms', roomId, 'superWinner', 'current');
        const gameSnap = await transaction.get(gameRef);
        if (!gameSnap.exists()) return;
        
        const data = gameSnap.data();
        if (data.status !== 'waiting') throw new Error("Already started");
        
        const users = Object.keys(data.participants);
        if (users.length < 2) throw new Error("Need at least 2 people");
        
        // Pick winner
        const winnerIndex = Math.floor(Math.random() * users.length);
        const winnerId = users[winnerIndex];
        const pool = data.pool;
        
        transaction.update(gameRef, {
          status: 'spinning',
          winnerId,
          finishedAt: Date.now() + 5000
        });
        
        // Reward winner directly here in the transaction
        const winnerRef = doc(db, 'users', winnerId);
        transaction.update(winnerRef, {
           chips: increment(pool)
        });
      });
      
      // Auto reset game after 10 seconds
      setTimeout(async () => {
        const gameRef = doc(db, 'partyRooms', roomId, 'superWinner', 'current');
        await setDoc(gameRef, {
          participants: {},
          status: 'waiting',
          pool: 0
        });
      }, 10000);
      
    } catch (e: any) {
      alert(e.message || "Failed to start");
    }
  };

  const participantsList = gameState ? Object.entries(gameState.participants || {}) : [];
  const joinedCount = participantsList.length;
  const isJoined = gameState?.participants?.[user.uid] !== undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4a0000] to-black opacity-80" />
        
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-[340px] flex flex-col items-center"
        >
          <button 
            onClick={onClose}
            className="absolute -top-12 right-0 w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-black/40 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <h1 className="text-4xl font-black text-[#ffda44] italic uppercase tracking-wider title-shadow mb-8 drop-shadow-[0_0_15px_rgba(255,218,68,0.5)]">Super winner</h1>

          {/* Spinner Wheel */}
          <div className="relative w-80 h-80 mb-8 select-none pointer-events-none">
            {/* Wheel background / border */}
            <div className="absolute inset-0 rounded-full border-[12px] border-[#6b2c91] bg-[#ffda44] shadow-[0_0_30px_rgba(255,218,68,0.3)] flex items-center justify-center overflow-hidden">
                {/* Decorative dots on border */}
                <div className="absolute inset-0 rounded-full border-[8px] border-[#ffda44]/20" />
                {[...Array(16)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: i % 2 === 0 ? '#ffda44' : '#ff4444',
                      transform: `rotate(${i * 22.5}deg) translateY(-145px)`
                    }}
                  />
                ))}

                {/* The spinning part */}
                <motion.div 
                  className="w-full h-full relative"
                  animate={{ rotate: isSpinning ? -winnerTargetRotation : 0 }}
                  transition={{ duration: 4, type: "spring", bounce: 0.2, damping: 20, stiffness: 40 }}
                >
                   {/* Slice dividers */}
                   {participantsList.length > 0 ? participantsList.map((participant, index) => {
                      const angle = 360 / participantsList.length;
                      return (
                        <div key={participant[0]} className="absolute inset-0 flex items-center justify-center origin-center" style={{ transform: `rotate(${index * angle}deg)` }}>
                           <div className="absolute top-0 w-0.5 h-1/2 bg-[#d4a821] origin-bottom" style={{ transform: `rotate(${angle / 2}deg)` }} />
                           <div 
                              className="absolute top-8 flex flex-col items-center"
                           >
                              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black/20 shadow-md">
                                <img src={(participant[1] as any).photoURL} alt="user" className="w-full h-full object-cover" />
                              </div>
                           </div>
                        </div>
                      )
                   }) : (
                      <div className="absolute inset-0 flex items-center justify-center text-black/20 font-black tracking-widest uppercase">Waiting...</div>
                   )}
                </motion.div>
                
                {/* Center peg */}
                <div className="absolute w-16 h-16 bg-[#8a2be2] rounded-full border-4 border-[#6b2c91] z-20 flex flex-col items-center justify-center shadow-lg">
                   <div className="text-[#ffda44] text-[10px] font-black">
                     <Coins size={12} className="inline mr-1" />
                     {gameState?.pool || 0}
                   </div>
                </div>

                {/* Pointer indicator */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                   <svg width="24" height="32" viewBox="0 0 24 32" fill="none" className="drop-shadow-md">
                      <path d="M12 32L0 12L12 0L24 12L12 32Z" fill="#ff4444"/>
                      <path d="M12 28L4 12L12 4L20 12L12 28Z" fill="#ff7242"/>
                   </svg>
                </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <button
               onClick={handleStart}
               disabled={joinedCount < 2 || gameState?.status !== 'waiting'}
               className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-wide border-b-4 active:border-b-0 active:translate-y-1 transition-all
                  ${joinedCount >= 2 && gameState?.status === 'waiting' 
                    ? 'bg-gradient-to-b from-gray-300 to-gray-500 text-black border-gray-600 shadow-[0_4px_15px_rgba(0,0,0,0.4)]'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-900'
                  }
               `}
            >
               Start now
            </button>
            
            <p className="text-white/60 text-xs font-bold font-sans">
              Need at least 2 people to start
            </p>

            <button
               onClick={handleJoin}
               disabled={isJoined || gameState?.status !== 'waiting'}
               className={`mt-4 w-48 py-4 rounded-xl font-black text-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2
                  ${isJoined 
                    ? 'bg-gray-400 text-white border-gray-500 shadow-md cursor-not-allowed'
                    : gameState?.status !== 'waiting' 
                       ? 'bg-zinc-800 text-zinc-500 border-zinc-900'
                       : 'bg-gradient-to-b from-[#ffb443] to-[#ff8c00] text-white border-[#cc7000] shadow-[0_4px_15px_rgba(255,140,0,0.4)]'
                  }
               `}
            >
               {isJoined ? 'Joined' : (
                 <>
                   Join 100 <Coins size={16} className="text-[#ffe066]" />
                 </>
               )}
            </button>
          </div>
          
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

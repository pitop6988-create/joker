import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

export function FriendRequestsView({ user, profile, onBack, incomingRequests = [] }: { user: User, profile: UserProfile, onBack: () => void, incomingRequests: any[] }) {
  const handleAccept = async (requestId: string) => {
    // accept logic
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        friendRequests: arrayRemove(requestId),
        friends: arrayUnion(requestId)
      });
      // Also add to the other person's friends list
      const otherRef = doc(db, 'users', requestId);
      await updateDoc(otherRef, {
        friends: arrayUnion(user.uid)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        friendRequests: arrayRemove(requestId)
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm relative font-sans">
      <div className="w-full max-w-sm bg-[#e8f7f2] rounded-[30px] overflow-hidden shadow-2xl flex flex-col pt-1">
        
        {/* Header */}
        <div className="bg-[#66c1ad] py-4 px-6 flex justify-between items-center rounded-t-[30px]">
          <div className="w-8" /> {/* Spacer */}
          <h2 className="text-xl font-black text-white text-center drop-shadow-md">Friend Requests</h2>
          <button onClick={onBack} className="text-white hover:text-white/80 active:scale-90 transition-transform">
            <X size={28} strokeWidth={3} />
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
           {incomingRequests.length === 0 ? (
             <div className="text-center py-8 text-gray-500 font-bold">No Friend Requests</div>
           ) : (
             incomingRequests.map((req) => (
               <div key={req.uid} className="bg-[#f0faf5] rounded-xl p-3 flex items-center gap-3 shadow-sm border border-black/5">
                 <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full border-2 border-pink-400 p-0.5 relative overflow-hidden bg-white shadow-inner">
                       <img src={req.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.uid}`} alt="" className="w-full h-full rounded-full object-cover" />
                    </div>
                    {/* Badge */}
                    <div className="absolute -bottom-1 -right-1 bg-[#ff1744] text-white text-[10px] font-black w-6 h-5 flex items-center justify-center rounded-md border border-white/50 shadow-sm shadow-black/20">
                      {req.level || 1}
                    </div>
                 </div>

                 <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-800 text-[15px] truncate">{req.displayName || 'Unknown'}</h3>
                    <p className="text-[#648782] font-semibold text-xs leading-tight">wants to add you<br/>as friend</p>
                 </div>

                 <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      onClick={() => handleReject(req.uid)}
                      className="w-[50px] h-[34px] bg-gradient-to-b from-[#4cd9aa] to-[#3ab98d] rounded-lg shadow-[0_4px_0_#2b936e] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all"
                    >
                       <X size={20} className="text-[#1a6449] drop-shadow-sm" strokeWidth={3} />
                    </button>
                    <button 
                       onClick={() => handleAccept(req.uid)}
                       className="w-[50px] h-[34px] bg-gradient-to-b from-[#ffcc00] to-[#e6b800] rounded-lg shadow-[0_4px_0_#b38f00] active:translate-y-1 active:shadow-none flex items-center justify-center transition-all"
                    >
                       <Check size={20} className="text-[#806600] drop-shadow-sm" strokeWidth={3} />
                    </button>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}

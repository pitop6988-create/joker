import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MoreHorizontal, Copy, MessageSquare, UserPlus } from 'lucide-react';
import { LevelBadge } from '../App';
// @ts-ignore
import clubLogoDefaultImage from '../assets/images/club_logo_default_1781448519688.jpg';

export function PublicProfileView({ uid, onBack, onAddFriend, onChat }: { uid: string, onBack: () => void, onAddFriend: () => void, onChat: () => void }) {
  // In a real app we would load the user data from Firebase using the uid
  // For the sake of this UI mapping, we display random/mock data if real data isn't easily loaded here.
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-white z-[120] flex flex-col font-sans overflow-hidden">
      {/* Top Background Area */}
      <div className="relative h-[280px] bg-gradient-to-b from-[#2a1b54] to-[#1a103c] w-full shrink-0 flex items-center justify-center overflow-hidden">
         {/* Decorative background details */}
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '40px 40px', backgroundPosition: '0 0, 20px 20px' }}></div>
         
         <div className="absolute top-12 left-4 z-10 cursor-pointer" onClick={onBack}>
           <ChevronLeft size={28} className="text-white drop-shadow-md" />
         </div>
         <div className="absolute top-12 right-4 z-10 cursor-pointer">
           <MoreHorizontal size={24} className="text-white drop-shadow-md" />
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto w-full relative bg-white pb-[100px] rounded-t-3xl -mt-[20px] shadow-lg">
         
         {/* Avatar & Details */}
         <div className="px-6 relative -mt-[40px] pt-[10px]">
            {/* Avatar Frame (Fake Custom Frame) */}
            <div className="relative w-[110px] h-[110px] rounded-full mx-auto md:mx-0">
               <div className="absolute -inset-4 bg-gradient-to-tr from-[#cfa144] via-[#f9d976] to-[#e1b854] rounded-full flex items-center justify-center p-2 shadow-xl border-4 border-white/10 z-0">
                 <div className="absolute -top-3 w-8 h-8 rotate-45 border-t-2 border-r-2 border-yellow-300"></div>
                 <div className="absolute -bottom-3 w-8 h-8 rotate-45 border-b-2 border-l-2 border-yellow-300"></div>
               </div>
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`} className="relative z-10 w-full h-full rounded-full bg-[#111] object-cover border-[3px] border-white" />
            </div>

            <div className="mt-6 flex flex-col items-start">
               <div className="flex items-center gap-2">
                  <h1 className="text-gray-900 font-extrabold text-[22px] tracking-tight truncate">STERO ❄</h1>
                  <span className="text-[16px]">🇹🇯</span>
               </div>
               
               <div className="flex items-center gap-1 mt-1 text-gray-500 font-medium text-[13px]">
                  <span>ID:28498320</span>
                  <Copy size={12} className="cursor-pointer ml-1" onClick={handleCopy} />
                  {copied && <span className="text-green-500 text-[10px] ml-1">Copied!</span>}
               </div>

               <div className="flex items-center gap-2 mt-3">
                  <div className="bg-[#42a5f5] text-white p-1 rounded-full px-2 flex items-center gap-1 shadow-sm">
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a5 5 0 00-5 5c0 2.39 1.68 4.38 3.9 4.9V14H9v2h1.9v4h2.2v-4H15v-2h-1.9v-2.1A5.002 5.002 0 0012 2zm0 8a3 3 0 110-6 3 3 0 010 6z" /></svg>
                  </div>
                  <div className="bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-gray-200">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     13 Days
                  </div>
               </div>

               <div className="mt-4 flex flex-col gap-3">
                 <div className="w-auto inline-flex h-[36px] items-center bg-gradient-to-r from-[#7b3df1] to-[#b357f8] rounded-xl pr-4 pl-1 shadow-md border border-[#c37aff]">
                    <div className="bg-blue-300 w-[28px] h-[28px] rounded-full flex items-center justify-center mr-2 shadow-sm border border-white">
                      <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                    </div>
                    <span className="text-white font-bold text-[14px]">Lv.54</span>
                 </div>
                 
                 <div className="flex gap-2">
                    <img src={clubLogoDefaultImage} className="w-[30px] h-[30px] rounded object-cover shadow border border-gray-200" />
                    <img src={clubLogoDefaultImage} className="w-[30px] h-[30px] rounded object-cover shadow border border-gray-200" />
                 </div>
               </div>
            </div>
         </div>

         {/* Supporters */}
         <div className="mt-8 px-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-900 font-extrabold text-[17px]">Supporters</h3>
              <div className="flex items-center gap-1 cursor-pointer">
                 <span className="text-gray-400 font-bold text-[13px]">5.2m</span>
                 <span className="text-[12px]">🌻</span>
                 <ChevronLeft size={16} className="text-gray-300 rotate-180" />
              </div>
            </div>
            
            <div className="flex gap-4">
               {[1, 2, 3].map((v, i) => (
                  <div key={v} className="flex flex-col items-center">
                     <div className="w-[64px] h-[64px] rounded-full bg-gray-100 overflow-hidden relative shadow-sm border border-orange-50 mb-1">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=sup${v}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-white/20"></div>
                     </div>
                     <div className="flex items-center gap-0.5">
                       <span className="text-gray-300 font-extrabold text-[10px] leading-tight mt-1">{656 - i * 123}.{i}k</span>
                       <span className="text-[8px] mt-0.5 opacity-50">🌻</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>
         
      </div>

      {/* Sticky Bottom Buttons */}
      <div className="fixed bottom-0 inset-x-0 h-[80px] bg-white border-t border-gray-50 flex items-center justify-between px-6 gap-4 z-20 z-[125]">
         <button onClick={onAddFriend} className="flex-1 h-[48px] bg-[#ff6a2b] hover:bg-[#ff5511] active:bg-[#e64a0f] text-white rounded-[24px] flex items-center justify-center font-extrabold text-[15px] shadow-[0_4px_12px_rgba(255,106,43,0.3)] transition-all gap-2">
            <UserPlus size={18} strokeWidth={2.5} />
            Add
         </button>
         <button onClick={onChat} className="flex-1 h-[48px] bg-[#ff6a2b] hover:bg-[#ff5511] active:bg-[#e64a0f] text-white rounded-[24px] flex items-center justify-center font-extrabold text-[15px] shadow-[0_4px_12px_rgba(255,106,43,0.3)] transition-all gap-2">
            <MessageSquare size={18} strokeWidth={2.5} fill="currentColor" className="text-white" />
            Chat
         </button>
      </div>
    </div>
  );
}

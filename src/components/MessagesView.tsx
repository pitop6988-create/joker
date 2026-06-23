import React from 'react';
import { UserPlus, Plus, Search } from 'lucide-react';

export function MessagesView({ language, setActiveTab, onOpenInvite }: { language: any, setActiveTab: (t: string) => void, onOpenInvite: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#0f0b0a] text-white font-sans flex flex-col z-0">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">Message</h1>
        <div className="flex gap-4 items-center text-white/90">
           <button className="p-1 active:scale-95 transition-transform" onClick={() => setActiveTab('explore')}>
             <UserPlus size={24} strokeWidth={2.5} />
           </button>
           <button className="p-1 active:scale-95 transition-transform">
             <Plus size={24} strokeWidth={2.5} className="text-[#ff6b6b]" />
           </button>
        </div>
      </div>

      <div className="px-5 mb-8">
         <div className="w-full bg-[#1e1a19] rounded-2xl flex items-center px-4 py-3.5 border border-white/5 shadow-inner">
            <Search size={20} className="text-white/40 mr-3" strokeWidth={2.5} />
            <input 
              type="text" 
              placeholder="Search friend or group chat" 
              className="bg-transparent outline-none flex-1 font-bold text-[15px] placeholder:text-white/30 text-white"
            />
         </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
         <div className="w-40 h-40 mb-6 opacity-80 flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#ff8a5c]">
               <path d="M70 60C70 54.4772 65.5228 50 60 50C54.4772 50 50 54.4772 50 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M40 60C40 48.9543 48.9543 40 60 40C71.0457 40 80 48.9543 80 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M30 60C30 43.4315 43.4315 30 60 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M20 60H100" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M30 65H90" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M40 70H80" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               
               {/* Palm tree */}
               <path d="M75 60C75 45 80 35 85 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M85 30C75 32 70 38 70 45" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M85 30C82 20 75 15 65 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M85 30C90 20 98 18 105 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               <path d="M85 30C95 32 98 40 95 48" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
               
               {/* Birds */}
               <path d="M25 25Q30 20 35 25Q40 20 45 25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M15 35Q20 30 25 35Q30 30 35 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
         </div>
         
         <h2 className="text-white/80 font-bold text-[17px] text-center leading-snug mb-8">
            Alone in the app?<br/>Invite your friends to join the fun!
         </h2>

         <button 
           onClick={onOpenInvite}
           className="bg-[#ff6e40] hover:bg-[#ff5722] active:scale-95 transition-all text-white font-black text-[17px] px-10 py-4 rounded-full shadow-[0_4px_15px_rgba(255,110,64,0.3)] tracking-wide"
         >
            go invite
         </button>
      </div>

    </div>
  );
}

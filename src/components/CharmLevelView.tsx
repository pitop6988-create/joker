import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, HelpCircle } from 'lucide-react';
import { LevelBadge } from '../App';
import type { UserProfile } from '../types';

export function CharmLevelView({ profile, onBack }: { profile: UserProfile, onBack: () => void }) {
  const level = profile.level || 31;
  const charmPoints = 129739;
  const extraPoints = 21461;
  const nextLevel = level + 1;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed inset-0 bg-[#0c1412] z-[150] flex flex-col font-sans overflow-hidden text-white"
    >
      {/* Background Gradient & Effects */}
      <div className="absolute top-0 inset-x-0 h-[40vh] bg-gradient-to-b from-[#164332] to-[#0c1412] pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative pt-12 pb-4 px-4 flex justify-between items-center z-10">
        <button onClick={onBack} className="p-1">
          <ChevronLeft size={28} className="text-white drop-shadow-md" />
        </button>
        <h1 className="text-[20px] font-extrabold tacking-tight">Charm Level</h1>
        <button className="p-1">
          <HelpCircle size={24} className="text-white drop-shadow-md" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 scrollbar-hide pb-10">
        
        {/* Top Info Section */}
        <div className="px-6 flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
             <div className="relative w-[76px] h-[76px] rounded-full border-2 border-[#164332] bg-[#1a1a1a]">
               {/* Decorative border matching level 17-31 roughly */}
               <div className="absolute -inset-2 bg-gradient-to-b from-[#8adecd] to-[#409b86] rounded-full p-1 mask-hexagon opacity-60"></div>
               <img src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.displayName}`} className="absolute inset-0 w-full h-full object-cover rounded-full z-10 border-2 border-[#8adecd]" />
               <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-4 border-[#8adecd] z-20"></div>
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-4 border-[#8adecd] z-20"></div>
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-1 opacity-70 mb-1">
                   <span className="font-bold text-sm">Charm Points</span>
                   <span className="text-[12px]">🌻</span>
                   <HelpCircle size={14} />
                </div>
                <div className="text-[28px] font-black leading-none drop-shadow-md">{charmPoints.toLocaleString()}</div>
             </div>
          </div>

          <div className="flex items-center justify-center -mt-4 drop-shadow-2xl scale-125 origin-right">
             <LevelBadge level={level} />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 px-8">
           <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#4ade80] to-[#22c55e] w-[60%]"></div>
           </div>
           
           <div className="mt-4 text-center text-sm text-gray-300">
             Have <span className="text-white font-bold">{extraPoints}</span> <span className="text-[12px]">🌻</span> extra Charm Points can be upgraded to Lv.{nextLevel}
           </div>
        </div>

        {/* My Perks Card */}
        <div className="mx-4 mt-6 bg-[#16211d] rounded-2xl p-6 border border-white/5 relative overflow-hidden shadow-lg">
           {/* Inner glow */}
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#22c55e] to-transparent opacity-20"></div>
           
           <div className="text-center absolute -top-3 inset-x-0 flex justify-center">
              <div className="bg-[#1f2f29] border border-white/10 px-4 py-1.5 rounded-full text-white font-extrabold text-[15px] shadow-md">My Perks</div>
           </div>

           <div className="mt-6 flex justify-between px-2">
              {[
                { label: `Badge Lv.17`, icon: 'badge' },
                { label: `Avatar frame Lv.17`, icon: 'frame' },
                { label: `Mini profile card borde...`, icon: 'profile' },
                { label: `Chat bubble Lv.17`, icon: 'chat' },
              ].map((perk, i) => (
                 <div key={i} className="flex flex-col items-center flex-1">
                    <div className="w-[48px] h-[48px] rounded-full bg-[#1c2c26] flex items-center justify-center mb-2 shadow-inner border border-white/5 text-[#dff1e5]">
                      {perk.icon === 'badge' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>}
                      {perk.icon === 'frame' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>}
                      {perk.icon === 'profile' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 5v14h18V5H3zm16 12H5V7h14v10z"/></svg>}
                      {perk.icon === 'chat' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>}
                    </div>
                    <span className="text-[12px] text-gray-400 font-bold text-center leading-tight">{perk.label}</span>
                 </div>
              ))}
           </div>
           
           <div className="mt-6 flex justify-center">
              <div className="bg-[#1c2c26] px-3 py-[3px] rounded-full text-gray-400 text-xs font-bold flex items-center gap-1 cursor-pointer">
                 Expand <ChevronLeft size={14} className="-rotate-90" />
              </div>
           </div>
        </div>

        {/* Separator */}
        <div className="relative mt-12 mb-6 flex items-center justify-center w-full px-4">
           {/* Center Light */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[30px] bg-gradient-to-r from-transparent via-[#409b86]/30 to-transparent blur-xl pointer-events-none"></div>
           
           <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#409b86]/50 to-transparent top-1/2 -translate-y-[0.5px]"></div>
           <div className="bg-[#0c1412] px-4 relative z-10 flex items-center gap-2">
              <div className="w-[6px] h-[6px] rotate-45 border border-[#8adecd] bg-[#164332]"></div>
              <span className="text-white font-extrabold text-[15px]">Locked Perks</span>
              <div className="w-[6px] h-[6px] rotate-45 border border-[#8adecd] bg-[#164332]"></div>
           </div>
           
           {/* Floating crystal above separator */}
           <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-gradient-to-tr from-[#6beaa4] to-[#c4fff8] rotate-45 shadow-[0_0_10px_#6beaa4] border border-white/50 z-20"></div>
        </div>

        {/* Locked Perks List */}
        <div className="mx-4 bg-gradient-to-b from-[#111916] to-[#0d1411] rounded-2xl p-6 border border-white/[0.03]">
           
           <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 bg-gradient-to-tr from-[#66b69b] to-[#b1ebd1] rounded-full flex items-center justify-center p-[2px]">
                 <div className="w-full h-full border border-white/50 rounded-full flex items-center justify-center text-[#111] font-black text-[8px]">V</div>
              </div>
              <span className="font-extrabold text-white text-[16px]">Lv17-31</span>
           </div>

           <div className="flex flex-col gap-6">
              {[
                { label: 'Avatar frame', days: '5 Days', detail: 'per level', preview: 'frame' },
                { label: 'Mini profile card border', days: '5 Days', detail: 'per level', preview: 'profile' },
                { label: 'Chat bubble', days: '5 Days', detail: 'per level', preview: 'chat' },
                { label: 'Gift Revenue Share 42%', days: '5 Days', detail: 'per level', preview: 'gift' }
              ].map((perk, i) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer">
                    <div className="text-[15px] font-bold text-gray-400">
                       {perk.label} <span className="text-[#ecd698] font-black ml-1">{perk.days}</span> {perk.detail}
                    </div>
                    
                    <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center relative bg-[#1c2c26]/50">
                       {perk.preview === 'frame' && (
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=preview2`} className="w-full h-full rounded-full border-2 border-[#8adecd] bg-gray-900 object-cover" />
                       )}
                       {perk.preview === 'profile' && (
                          <div className="w-[80%] h-[12px] bg-gradient-to-r from-[#215a4c] to-[#3a8b75] relative flex justify-center -translate-y-1">
                             <div className="absolute -top-1 w-3 h-3 bg-white rounded-full"></div>
                          </div>
                       )}
                       {perk.preview === 'chat' && (
                          <div className="bg-[#164332] border border-[#8adecd] text-[#8adecd] text-[10px] font-bold px-2 py-0.5 rounded-bl-none rounded-lg">Hello</div>
                       )}
                       {perk.preview === 'gift' && (
                          <div className="w-8 h-8 rounded-full bg-[#eca834] flex items-center justify-center text-[#111]">
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 11h-4.17l3.24-3.24-1.41-1.42L15 11h-2V9l4.66-4.66-1.42-1.41L13 6.17V2h-2v4.17L7.76 2.93 6.34 4.34 11 9v2H9L4.34 6.34 2.93 7.76 6.17 11H2v2h20v-2zm-6 2H8v8h8v-8z"/></svg>
                          </div>
                       )}
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </motion.div>
  );
}

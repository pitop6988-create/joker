import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export function RoomLevelView({ onBack, profile, roomData }: any) {
  const [activeTab, setActiveTab] = useState<'level' | 'privileges'>('level');

  return (
    <div className="fixed inset-0 bg-white z-[200] overflow-y-auto font-sans flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 shrink-0 relative bg-white border-b border-gray-50/50">
         <div className="flex items-center gap-3 w-full justify-center relative">
           <button onClick={onBack} className="absolute left-0 p-1 text-gray-900"><ChevronLeft size={28} /></button>
           <h1 className="text-[20px] font-black tracking-tight text-gray-900">Room Level</h1>
         </div>
      </header>

      <div className="p-4 flex-1">
         <div className="bg-[#f2fae6] rounded-2xl p-4 mb-6 shadow-sm border border-[#e8f5d6] relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                 <div className="w-[42px] h-[42px] rounded-lg overflow-hidden shrink-0 border border-black/5 bg-gray-200">
                    <img src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.displayName}`} className="w-full h-full object-cover" alt="" />
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[15px] font-black tracking-tight text-gray-900 uppercase leading-none">{profile?.displayName || 'ONLY ONE'}</p>
                    <p className="text-[12px] font-semibold text-gray-500 mt-1">ID:{profile?.shortId || '6806470'}</p>
                 </div>
              </div>
              <div className="bg-[#36c64b] px-3 py-1 rounded-full text-white font-black text-sm shadow-[0_2px_6px_rgba(54,198,75,0.4)] tracking-wide">
                 Lv.1
              </div>
            </div>

            <div className="mt-5 w-full bg-black/5 h-1.5 rounded-full relative">
               <div className="absolute top-0 left-0 h-full bg-[#36c64b] w-[5%] rounded-full" />
            </div>
            
            <div className="flex justify-between items-center mt-2">
               <p className="text-gray-800 text-[13px] font-bold">Room Exp: 17.1k<span className="text-gray-400">/3.3m</span></p>
               <p className="text-gray-800 text-[13px] font-bold">Lv.2</p>
            </div>
         </div>

         <div className="flex px-1 gap-6 text-[18px] font-bold text-gray-400 border-b-2 border-transparent">
           <button onClick={() => setActiveTab('level')} className={`pb-2 relative whitespace-nowrap transition-colors ${activeTab === 'level' ? 'text-gray-900 font-extrabold' : ''}`}>
             Level up
             {activeTab === 'level' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#3bccba] rounded-full" />}
           </button>
           <button onClick={() => setActiveTab('privileges')} className={`pb-2 relative whitespace-nowrap transition-colors ${activeTab === 'privileges' ? 'text-gray-900 font-extrabold' : ''}`}>
             Privileges
             {activeTab === 'privileges' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#3bccba] rounded-full" />}
           </button>
         </div>

         {activeTab === 'level' && (
           <div className="mt-8 flex flex-col gap-6">
              <div className="flex justify-between items-center px-1">
                 <h3 className="text-[15px] font-extrabold text-gray-400">Today's Room Exp: 0/9.9m</h3>
                 <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[14px]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    12:28:11
                 </div>
              </div>

              <div>
                 <h4 className="text-[16px] font-extrabold text-gray-900 px-1">Take Mic</h4>
                 <div className="mt-2 text-[14px] font-bold text-gray-400 border-t-4 border-gray-100 pt-3 pb-1 flex justify-between items-start px-1 gap-4">
                    <p className="leading-tight">+600 Room Exp / 5 minutes (Newbie: <br /> +1200 Room Exp / 5 minutes)</p>
                    <span className="shrink-0">0/900.0k</span>
                 </div>
              </div>

              <div>
                 <h4 className="text-[16px] font-extrabold text-gray-900 px-1">Send gifts in room</h4>
                 <div className="mt-2 text-[14px] font-bold text-gray-400 border-t-4 border-gray-100 pt-3 pb-1 flex justify-between items-start px-1">
                    <p className="leading-tight">+1 Room Exp / 1 coin (During PK: +2 Room<br/>Exp / 1 coin)</p>
                    <span className="shrink-0">0/9.0m</span>
                 </div>
              </div>

              <div className="mt-4 px-1">
                 <p className="text-gray-400 font-medium text-[13px] leading-snug">Notes:<br />Each user can contribute 3000000 Exp at most in <br />altogether to all rooms every day</p>
              </div>
           </div>
         )}
         
         {activeTab === 'privileges' && (
            <div className="mt-8 px-1">
               <p className="text-gray-400 font-bold">Reach Level 2 to unlock privileges</p>
            </div>
         )}
      </div>
    </div>
  );
}

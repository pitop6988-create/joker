import React, { useState } from 'react';
import { ChevronLeft, CheckCircle, Shield, Users, Trophy, Star, ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';

export function RoomUpgradeView({ onBack, language }: any) {
  const [activeType, setActiveType] = useState('Standard');
  const types = ['Standard', 'Tent', 'Apartment'];

  return (
    <div className="fixed inset-0 bg-[#f9f9f9] text-black font-sans flex flex-col z-[500]">
      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-white sticky top-0 z-10">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 font-bold active:scale-95 transition-transform">
          <ChevronLeft size={28} strokeWidth={3} className="text-black" />
        </button>
        <h1 className="flex-1 text-center font-black text-xl mr-8 text-gray-900 tracking-tight">Upgrade my room</h1>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-lg mx-auto flex flex-col pb-6">
        
        {/* Tabs */}
        <div className="px-5 pt-4 pb-6 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth relative">
          {/* Standard Tab */}
          <button 
            onClick={() => setActiveType('Standard')}
            className={`relative px-4 py-3 min-w-[110px] rounded-2xl font-black text-lg transition-all border-[2px] flex items-center justify-center bg-white shadow-sm ${activeType === 'Standard' ? 'border-[#333] shadow-md' : 'border-gray-200 text-gray-800'}`}
          >
             {activeType === 'Standard' && (
                <div className="absolute -top-3 left-2 bg-[#ffcc00] text-black text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded shadow-sm before:content-[''] before:absolute before:-bottom-1 before:left-2 before:border-4 before:border-transparent before:border-t-[#ffcc00] z-20">My room</div>
             )}
             Standard
          </button>
          
          {/* Tent Tab */}
          <button 
            onClick={() => setActiveType('Tent')}
            className={`px-4 py-3 min-w-[110px] rounded-2xl font-black text-lg transition-all border-[2px] flex items-center justify-center gap-2 bg-white shadow-sm ${activeType === 'Tent' ? 'border-[#26a69a] text-[#26a69a] shadow-md' : 'border-gray-200 text-gray-800'}`}
          >
             {activeType === 'Tent' && (
                <div className="absolute -top-3 left-2 bg-[#ffcc00] text-black text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded shadow-sm before:content-[''] before:absolute before:-bottom-1 before:left-2 before:border-4 before:border-transparent before:border-t-[#ffcc00] z-20">My room</div>
             )}
             <span className="text-2xl drop-shadow-sm">⛺</span> Tent
          </button>
          
          {/* Apartment Tab */}
          <button 
            onClick={() => setActiveType('Apartment')}
            className={`px-4 py-3 min-w-[130px] rounded-2xl font-black text-lg transition-all border-[2px] flex items-center justify-center gap-2 bg-white shadow-sm ${activeType === 'Apartment' ? 'border-[#42a5f5] text-[#42a5f5] shadow-md' : 'border-gray-200 text-gray-800'}`}
          >
             {activeType === 'Apartment' && (
                <div className="absolute -top-3 left-2 bg-[#ffcc00] text-black text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded shadow-sm before:content-[''] before:absolute before:-bottom-1 before:left-2 before:border-4 before:border-transparent before:border-t-[#ffcc00] z-20">My room</div>
             )}
             <span className="text-2xl drop-shadow-sm">🏢</span> Apartment
          </button>
        </div>

        {/* Content Box */}
        <div className="px-5 flex-1 flex flex-col">
          <div className="bg-[#f2f4f5] rounded-3xl p-6 flex-1 shadow-inner relative overflow-hidden">
             
             {activeType === 'Standard' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
                   <FeatureRow icon={<Users size={24} />} title="Room capacity" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">20</span> users are allowed in a room at the same time (room owner excluded)</>} />
                   <FeatureRow icon={<Shield size={24} />} title="Room admin" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">3</span> admins</>} />
                   <FeatureRow icon={<Users size={24} />} title="Room member" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">50</span> room members</>} />
                   <FeatureRow icon={<Trophy size={24} />} title="Room rank" desc={<>Room popularity index increases <span className="text-[#ff6b6b] font-bold">1.0</span> times. The higher the popularity index of the room, the higher room rank on the lists.</>} />
                </motion.div>
             )}

             {activeType === 'Tent' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
                   <FeatureRow icon={<Shield size={24} />} title="Room badge" desc={<>Honor badge is shown on your room in the room list</>} />
                   <FeatureRow icon={<Users size={24} />} title="Room capacity" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">100</span> users are allowed in a room at the same time (room owner excluded)</>} />
                   <FeatureRow icon={<Shield size={24} />} title="Room admin" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">7</span> admins</>} />
                   <FeatureRow icon={<Users size={24} />} title="Room member" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">100</span> room members</>} />
                   <FeatureRow icon={<Trophy size={24} />} title="Room rank" desc={<>Room popularity index increases <span className="text-[#ff6b6b] font-bold">1.3</span> times. The higher the popularity index of the room, the higher room rank on the lists.</>} />
                </motion.div>
             )}

             {activeType === 'Apartment' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-6">
                   <FeatureRow icon={<Shield size={24} />} title="Room badge" desc={<>Honor badge is shown on your room in the room list</>} />
                   <FeatureRow icon={<Users size={24} />} title="Room capacity" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">300</span> users are allowed in a room at the same time (room owner excluded)</>} />
                   <FeatureRow icon={<Shield size={24} />} title="Room admin" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">9</span> admins</>} />
                   <FeatureRow icon={<Users size={24} />} title="Room member" desc={<>Maximum <span className="text-[#ff6b6b] font-bold">200</span> room members</>} />
                   <FeatureRow icon={<Trophy size={24} />} title="Room rank" desc={<>Room popularity index increases <span className="text-[#ff6b6b] font-bold">1.5</span> times. The higher the popularity index of the room, the higher room rank on the lists.</>} />
                   <FeatureRow icon={<div className="font-black text-xl italic tracking-tighter">GIF</div>} title="Animated Room Background" desc={<>The room supports uploading animated custom backgrounds, GIF format.</>} />
                </motion.div>
             )}

          </div>

          <div className="mt-6 flex flex-col items-center">
             {activeType === 'Standard' ? (
                <div className="text-gray-500 font-bold text-center mt-4 pb-2">Your room type is Standard</div>
             ) : (
                <div className="w-full flex flex-col items-center gap-3">
                   <div className="text-[#ff5252] font-black text-sm tracking-wide">Permanent validity</div>
                   <button className="w-full py-4 bg-[#ff6835] hover:bg-[#ff551f] active:scale-95 transition-all text-white rounded-2xl font-black text-[19px] flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                      Upgrade {activeType === 'Tent' ? '30000' : '300000'} <div className="bg-[#fdd835] rounded-full p-[2px] shadow-sm"><Star size={16} fill="#ff9800" stroke="white" strokeWidth={1} /></div>
                   </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="w-14 h-14 bg-white rounded-2xl shrink-0 flex items-center justify-center text-[#90a4ae] shadow-sm">
        {icon}
      </div>
      <div className="flex flex-col">
         <h3 className="font-black text-gray-900 text-lg mb-0.5">{title}</h3>
         <p className="text-gray-500 text-[14px] font-medium leading-[1.3]">{desc}</p>
      </div>
    </div>
  );
}

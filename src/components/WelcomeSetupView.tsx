import React, { useState } from 'react';
import { Camera, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function WelcomeSetupView({ onComplete, defaultPhotoUrl }: { onComplete: (data: any) => void, defaultPhotoUrl?: string }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | null>(null);
  const [age, setAge] = useState<string>('');

  const ages = Array.from({ length: 60 }, (_, i) => String(i + 13)); // 13 to 72

  const handleSubmit = () => {
    if (!name.trim() || !gender || !age) {
      alert("Please fill all fields.");
      return;
    }
    onComplete({ name: name.trim(), gender, age: parseInt(age, 10) });
  };

  return (
    <div className="fixed inset-0 bg-[#343843] flex flex-col items-center justify-center font-sans z-[1000] px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm flex flex-col items-center">
        <h1 className="text-white font-black text-2xl mb-8 tracking-wide">Welcome to Yari Konkan</h1>
        
        <div className="relative mb-10 group">
           <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#343843] shadow-[0_0_0_2px_rgba(255,255,255,0.1)] bg-[#4285f4]">
              <img src={defaultPhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=welcome&backgroundColor=4285f4`} alt="Avatar" className="w-full h-full object-cover" />
           </div>
           <button className="absolute bottom-0 right-0 w-10 h-10 bg-[#343843] border-2 border-white/20 rounded-full flex items-center justify-center text-[#ff6b6b] active:scale-95 transition-transform">
              <Edit2 size={18} className="text-[#3b82f6]" />
           </button>
        </div>

        <div className="w-full space-y-7">
           <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-400 flex gap-1"><span className="text-red-500">*</span> Write a name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full bg-[#414552] text-white px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#ff6b6b]/50 placeholder:text-gray-500 font-medium"
                placeholder="Name"
              />
           </div>

           <div className="flex flex-col gap-3">
              <label className="text-[13px] font-bold text-gray-400 leading-snug">Choose your gender for better matching (No changes allowed after selection)</label>
              <div className="flex gap-4">
                 <button 
                   onClick={() => setGender('Male')}
                   className={`flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${gender === 'Male' ? 'bg-[#5c728a] text-[#4285f4] shadow-inner' : 'bg-[#414552] text-gray-400'}`}
                 >
                    <span className={`text-xl ${gender === 'Male' ? 'text-[#4285f4]' : ''}`}>♂</span> Male
                 </button>
                 <button 
                   onClick={() => setGender('Female')}
                   className={`flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${gender === 'Female' ? 'bg-[#8a5c6e] text-[#e91e63] shadow-inner' : 'bg-[#414552] text-gray-400'}`}
                 >
                    <span className={`text-xl ${gender === 'Female' ? 'text-[#e91e63]' : ''}`}>♀</span> Female
                 </button>
              </div>
           </div>

           <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-gray-400">Set your age for teammate matches</label>
              <div className="relative">
                <select 
                  value={age} 
                  onChange={e => setAge(e.target.value)} 
                  className="w-full bg-[#414552] text-gray-300 px-4 py-3.5 rounded-2xl outline-none appearance-none font-medium text-base"
                >
                  <option value="" disabled>Age</option>
                  {ages.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                   ▼
                </div>
              </div>
           </div>
        </div>

        <div className="w-full mt-12 flex flex-col gap-4">
           <button 
             onClick={handleSubmit}
             className="w-full py-4 rounded-2xl bg-[#ff6b6b] hover:bg-[#ff5252] text-white font-black text-lg shadow-[0_4px_15px_rgba(255,107,107,0.3)] active:scale-95 transition-all"
           >
              Next
           </button>
           <p className="text-gray-400 text-xs text-center leading-relaxed px-4">
              Your personal information is protected and only used for better matching.
           </p>
        </div>
      </motion.div>
    </div>
  );
}

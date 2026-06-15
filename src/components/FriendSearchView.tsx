import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Copy, UserPlus } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { UserProfile } from '../types';

export function FriendSearchView({ user, profile, onBack, onUserClick }: { user: User, profile: UserProfile, onBack: () => void, onUserClick: (uid: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const q = query(collection(db, 'users'), limit(50));
      const snap = await getDocs(q);
      const matched = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() })).filter((u: any) => {
        const queryLower = val.toLowerCase();
        const dispMatch = u.displayName?.toLowerCase().includes(queryLower);
        const idMatch = u.shortId?.toString().includes(queryLower);
        return dispMatch || idMatch;
      });
      setResults(matched);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const copyId = () => {
    if (profile.shortId) {
      navigator.clipboard.writeText(profile.shortId.toString());
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col font-sans">
      <div className="flex items-center px-4 pt-6 pb-2 gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-10 flex items-center px-3">
          <Search size={18} className="text-gray-400 mr-2" />
          <input 
            type="text"
            className="bg-transparent border-none outline-none flex-1 text-[15px] font-medium text-gray-900 placeholder-gray-400"
            placeholder="Search by Userid / Room id"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <button onClick={onBack} className="text-gray-900 font-bold text-[15px]">
          Cancel
        </button>
      </div>

      {!searchQuery ? (
        <div className="flex-1 flex flex-col items-center pt-8 px-4">
          <div className="bg-white border rounded-full py-2 px-4 shadow-sm flex items-center gap-2 mb-8">
            <span className="text-gray-900 font-bold text-[15px]">My ID: {profile.shortId}</span>
            <button onClick={copyId} className="text-gray-400 hover:text-gray-600">
              <Copy size={16} />
            </button>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-gray-500 font-bold text-[15px] leading-tight">
              Alone in the app?<br/>Invite your friends to join the fun!
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px]">
            <div className="flex flex-col items-center gap-2">
              <div className="w-[60px] h-[60px] rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-md cursor-pointer">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-500 font-medium text-xs">Facebook</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-md cursor-pointer">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-500 font-medium text-xs">Instagram</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-[60px] h-[60px] rounded-full bg-[#2CA5E0] flex items-center justify-center text-white shadow-md cursor-pointer">
                <svg className="w-8 h-8 ml-[-2px] mt-[2px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.96-.64-.34-1 .22-1.58.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </div>
              <span className="text-gray-500 font-medium text-xs">Telegram</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-b from-[#6cebc6] to-[#42c5ec] flex items-center justify-center text-white shadow-md cursor-pointer">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-white text-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white text-white"></div>
                  <div className="w-2 h-2 rounded-full bg-white text-white"></div>
                </div>
              </div>
              <span className="text-gray-500 font-medium text-xs">Other</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {searching ? (
             <div className="text-center py-8 text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
             <div className="flex flex-col gap-3">
               {results.map(u => (
                 <div key={u.uid} className="flex items-center gap-3 bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                   <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`} className="w-12 h-12 rounded-full bg-gray-100" />
                   <div className="flex-1">
                     <div className="font-bold text-gray-900 text-[15px]">{u.displayName}</div>
                     <div className="text-gray-500 text-xs text-left">ID: {u.shortId}</div>
                   </div>
                   <button 
                     onClick={() => alert("Friend request sent!")}
                     className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                   >
                     <UserPlus size={20} />
                   </button>
                 </div>
               ))}
             </div>
          ) : (
             <div className="text-center py-8 text-gray-500 text-[15px]">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Image as ImageIcon, AlertCircle } from "lucide-react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";

export function RoomProfileView({ onClose, roomData, profile, user }: any) {
  const handleJoin = async () => {
    if (roomData?.id) {
       try {
         await updateDoc(doc(db, "partyRooms", roomData.id), {
           viewers: increment(1)
         });
         alert("Joined successfully! Members +1");
       } catch (e) {
         console.error(e);
       }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-[600] flex flex-col justify-end pointer-events-auto"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="bg-white rounded-t-[28px] w-full max-h-[85vh] overflow-y-auto relative z-10 font-sans text-black pt-5 pb-8 px-5 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1bg-gray-200 rounded-full" />

          <div className="flex items-start gap-4 mb-6 mt-4">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border-2 border-black relative overflow-hidden shadow-sm shrink-0">
              {roomData?.image ? (
                <img
                  src={roomData.image}
                  alt="Room"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="w-12 h-8 border-2 border-black rounded-sm flex items-end px-1 pb-0.5 relative z-10 mt-1">
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-b-[8px] border-b-black border-r-[6px] border-r-transparent mr-0.5" />
                    <div className="w-0 h-0 border-l-[8px] border-l-transparent border-b-[12px] border-b-black border-r-[8px] border-r-transparent" />
                  </div>
                  <div className="absolute top-3 left-4 w-2 h-2 rounded-full border-2 border-black" />
                </>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-[19px] font-bold text-gray-900 truncate leading-tight tracking-tight pr-2">
                  {roomData?.title || "Name room live"}
                </h2>
                <AlertCircle
                  className="text-gray-400 shrink-0"
                  size={20}
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-gray-400 text-sm mb-2.5 font-medium tracking-wide">
                ID: {roomData?.id || "---"}
              </p>
              <div className="bg-[#00d632] text-white pl-2 pr-1.5 py-[2px] rounded-full inline-flex font-black text-[11px] items-center gap-0.5 shadow-sm">
                Lv.{roomData?.level || 1}{" "}
                <ChevronRight
                  size={12}
                  strokeWidth={3}
                  className="opacity-90"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-5 pb-1 border-b border-gray-100">
            <span className="font-bold text-black text-[15px]">Members: {roomData?.viewers || 0}</span>
            <button className="text-gray-400 text-[13px] font-medium flex items-center gap-0.5 active:scale-95 transition-transform">
              All <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <div className="flex flex-col items-center w-fit relative border-b border-gray-100 pb-5">
              <div className="w-[60px] h-[60px] bg-gray-200 rounded-full flex flex-col items-center justify-end overflow-hidden border-2 border-white shadow-sm shrink-0">
                {roomData?.ownerPhoto || user?.photoURL ? (
                  <img
                    src={roomData?.ownerPhoto || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${roomData?.ownerId || "owner"}`}
                    alt="Owner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="w-5 h-5 rounded-full bg-white mb-0.5 shadow-sm" />
                    <div className="w-10 h-6 bg-white rounded-t-full shadow-sm" />
                  </>
                )}
              </div>
              <div className="absolute -bottom-2 bg-[#ff1744] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide z-10 border border-white">
                Owner
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-black text-[15px] mb-2">
              Who can enter the room
            </h3>
            <p className="text-gray-400 text-sm font-medium tracking-wide">
              Everyone
            </p>
          </div>

          <div className="mb-8">
            <h3 className="font-bold text-black text-[15px] mb-2">
              Room announcement
            </h3>
            {roomData?.announcement ? (
              <p className="text-gray-500 text-sm font-medium">
                {roomData.announcement}
              </p>
            ) : null}
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-black text-[15px] mb-3">
              Room Group
            </h3>
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex flex-col items-center justify-center border-2 border-black shrink-0 relative overflow-hidden shadow-sm">
                {roomData?.image ? (
                  <img
                    src={roomData.image}
                    alt="Room"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="w-7 h-4 border border-black rounded-[2px] flex items-end px-0.5 pb-[1px] relative z-10 border-b-2">
                      <div className="w-0 h-0 border-l-[3px] border-l-transparent border-b-[5px] border-b-black border-r-[3px] border-r-transparent mr-[1px]" />
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-b-[6px] border-b-black border-r-[4px] border-r-transparent" />
                    </div>
                    <div className="absolute top-2 left-2.5 w-1.5 h-1.5 rounded-full border border-black" />
                  </>
                )}
              </div>
              <div className="flex flex-col pt-0.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-[15px] text-gray-900 leading-none">
                    {roomData?.title || "Name room live"}
                  </span>
                  <span className="bg-gray-300 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-none tracking-wide">
                    Inactive
                  </span>
                </div>
                <p className="text-gray-400 text-[13px] leading-[1.4] max-w-[270px] tracking-tight">
                  Among the room members, 20 of them have room level higher than
                  8, and the room group is automatically generated.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pb-4">
            <button className="flex-1 py-[14px] rounded-[14px] font-bold active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5 text-white bg-gradient-to-r from-[#ff875b] to-[#ff4e50] shadow-sm text-[16px] border-b-[3px] border-[#d83537] active:border-b-0 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity" />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Follow
            </button>
            <button onClick={handleJoin} className="flex-1 py-[14px] rounded-[14px] font-bold active:translate-y-[2px] transition-all flex items-center justify-center gap-1.5 text-white bg-[#00d632] shadow-sm text-[16px] border-b-[3px] border-[#00b029] active:border-b-0 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 opacity-0 group-active:opacity-100 transition-opacity" />
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v20"></path>
                <path d="M11 2h2a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"></path>
                <path d="M2 12h20"></path>
                <path d="M2 11h20v2H2z"></path>
              </svg>
              Join
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

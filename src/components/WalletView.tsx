import React, { useState } from "react";
import { ChevronLeft, HeadphonesIcon, FileText, Star } from "lucide-react";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";

export function WalletView({
  onClose,
  profile,
  user,
}: {
  onClose: () => void;
  profile: any;
  user: any;
}) {
  const packages = [
    { coins: 16875, vipExp: 99, price: 0.99, title: null },
    { coins: 88425, vipExp: 499, price: 4.99, title: "5% OFF" },
    { coins: 184725, vipExp: 999, price: 9.99, title: "9% OFF" },
    { coins: 377775, vipExp: 1999, price: 19.99, title: "11% OFF" },
    { coins: 964350, vipExp: 4999, price: 49.99, title: "12% OFF" },
    { coins: 2009025, vipExp: 9999, price: 99.99, title: "17% OFF" },
  ];

  const [purchasePassword, setPurchasePassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<(typeof packages)[0] | null>(null);

  const handlePurchaseClick = (pkg: (typeof packages)[0]) => {
      setSelectedPkg(pkg);
      setShowPasswordModal(true);
      setPurchasePassword("");
  };

  const confirmPurchase = async () => {
    if (purchasePassword !== "EAMD8912") {
       alert("Incorrect password!");
       return;
    }
    if (!user || !selectedPkg) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        chips: increment(selectedPkg.coins),
      });
      alert("Purchased successfully!");
      setShowPasswordModal(false);
      setSelectedPkg(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fdfaf5] flex flex-col font-sans">
      <div className="flex items-center justify-between px-4 py-4 relative bg-[#fdfaf5]">
        <button onClick={onClose} className="p-2 z-10">
          <ChevronLeft size={24} className="text-black" />
        </button>
        <span className="text-black text-[18px] font-black absolute inset-0 flex justify-center items-center pointer-events-none">
          My wallet
        </span>
        <div className="flex items-center gap-2 z-10 text-black">
          <button className="p-2">
            <HeadphonesIcon size={22} />
          </button>
          <button className="p-2">
            <FileText size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10">
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=100&h=100&fit=crop"
                className="w-[80%] h-[80%] object-cover mix-blend-multiply"
                alt="Knight"
              />
            </div>
            <div className="flex flex-col">
                <span className="text-black text-[15px] font-black">VAULT level <span className="text-[#ff5252]">0</span> my</span>
                <span className="text-gray-400 text-[11px] font-bold">Requires <span className="text-[#ff5252]">400</span> EXP to level up</span>
            </div>
          </div>
          <ChevronLeft className="rotate-180 text-gray-400" size={20} />
        </div>

        <div className="mt-8 flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ffca28] to-[#ffeb3b] flex items-center justify-center shadow">
            <div className="w-5 h-5 bg-[#ffc107] border-[1px] border-[#ffb300] rounded-full flex items-center justify-center">
              <Star className="text-white fill-white" size={12} />
            </div>
          </div>
          <span className="text-black text-[32px] font-black leading-none">
            {profile?.chips || 1519}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] pt-[18px] pb-4 px-2 flex flex-col items-center relative cursor-pointer active:scale-95 transition-transform"
              onClick={() => handlePurchaseClick(pkg)}
            >
              {pkg.title && (
                <div className="absolute top-0 left-0 bg-[#ff5252] text-white text-[10px] font-black px-1.5 py-0.5 rounded-tl-2xl rounded-br-lg">
                  {pkg.title}
                </div>
              )}
              <div className="w-12 h-12 relative flex items-center justify-center mb-1">
                <div className="w-8 h-8 bg-gradient-to-tr from-[#ffca28] to-[#ffeb3b] rounded-full flex items-center justify-center shadow-md absolute bottom-2 left-1 z-10 border border-[#ffb300]">
                  <Star
                    className="text-white fill-[#ffc107]"
                    strokeWidth={1}
                    size={14}
                  />
                </div>
                {pkg.coins > 50000 && (
                  <div className="w-8 h-8 bg-gradient-to-tr from-[#ffb300] to-[#ffca28] rounded-full flex items-center justify-center shadow-md absolute top-1 right-0 border border-[#ffa000]">
                    <Star
                      className="text-white fill-[#ffb300]"
                      strokeWidth={1}
                      size={14}
                    />
                  </div>
                )}
                {pkg.coins > 200000 && (
                  <div className="w-7 h-7 bg-gradient-to-tr from-[#ffeb3b] to-[#fff59d] rounded-full flex items-center justify-center shadow-md absolute bottom-0 right-1 z-20 border border-[#ffca28]">
                    <Star
                      className="text-white fill-[#ffeb3b]"
                      strokeWidth={1}
                      size={12}
                    />
                  </div>
                )}
              </div>
              <span className="text-black font-black text-[16px] mb-0.5">
                {pkg.coins}
              </span>
              <span className="text-gray-400 text-[10px] font-bold mb-3">
                {pkg.vipExp} VIP Exp
              </span>
              <div className="w-full text-center py-1.5 rounded-full border border-[#ff5252]/20 bg-[#ff5252]/5 text-[#ff5252] text-[12px] font-black">
                USD {pkg.price}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-400 text-[11px] font-bold mt-8 max-w-[280px] mx-auto leading-relaxed">
          By submitting this order, you consent that you agree to the <br />
          <span className="text-gray-500">"Terms of Service"</span> and{" "}
          <span className="text-gray-500">"Privacy Policy"</span>.
        </p>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col items-center">
              <h3 className="text-xl font-black text-black mb-4">Enter Password</h3>
              <input 
                 type="password" 
                 value={purchasePassword}
                 onChange={(e) => setPurchasePassword(e.target.value)}
                 className="w-full bg-gray-100 rounded-xl p-4 text-center font-bold tracking-widest outline-none border-2 border-transparent focus:border-[#ffca28]"
                 placeholder="Password"
                 autoFocus
              />
              <div className="flex gap-3 w-full mt-6">
                 <button className="flex-1 py-3 rounded-full bg-gray-100 text-gray-600 font-bold active:bg-gray-200" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                 <button className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#ffca28] to-[#ffeb3b] text-yellow-900 font-black active:scale-95 transition-transform" onClick={confirmPurchase}>Confirm</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

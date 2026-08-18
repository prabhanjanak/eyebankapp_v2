import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { BASE_PATH } from "@/lib/constants";

export function AppLayout({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="flex min-h-screen w-full bg-[#f8fafc] font-sans relative">
      {/* Debug Ribbon Indicator */}
      {window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname.startsWith("192.168.") ? (
        <div className="absolute top-0 right-0 bg-[#ff7a18] text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-md z-50 shadow-sm pointer-events-none select-none">
          Debug Build
        </div>
      ) : null}

      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Mobile Top Header - Now bounded below status bar with safe-area padding */}
        <div className="md:hidden pt-[env(safe-area-inset-top,24px)] bg-white/90 backdrop-blur-lg border-b border-gray-200/60 shadow-sm shrink-0 z-45">
          <div className="h-14 flex items-center px-4 w-full">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-500 hover:text-[#ff7a18] rounded-md transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <img
              src={`${BASE_PATH}/logo-icon.png`}
              alt=""
              className="ml-2.5 h-8 w-8 object-contain drop-shadow-sm"
            />
            <div className="ml-2 leading-tight">
              <p className="text-[12px] font-extrabold text-gray-800 tracking-tight">Netrasetu</p>
              <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Sankara Eye Bank</p>
            </div>
          </div>
        </div>

        <main className="flex-1 flex flex-col min-w-0 w-full relative z-0">
          <div className="w-full max-w-[1600px] mx-auto flex-1 flex flex-col md:p-8 p-3">
            <div className="w-full flex-1 pb-4 md:pb-8 page-enter overflow-x-hidden">
              {children}
            </div>

            {/* Footer — hidden on mobile to save space */}
            <footer className="hidden md:block mt-auto pt-6 border-t border-gray-200/60 text-center space-y-1.5 select-none">
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 text-xs font-bold text-gray-500">
                <span className="hover:text-[#ff7a18] transition-colors cursor-pointer">Sankara Eye Foundation India</span>
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#ff7a18] to-orange-400 shadow-sm" />
                <span className="hover:text-[#ff7a18] transition-colors cursor-pointer">Sankara Eye Hospitals</span>
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#ff7a18] to-orange-400 shadow-sm" />
                <span className="hover:text-[#ff7a18] transition-colors cursor-pointer">Sri Kanchi Kamakoti Medical Trust</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                Developed and Managed by <span className="text-gray-500 font-extrabold text-[11px] normal-case bg-gray-100 px-1.5 rounded-sm">Team Information Systems - MHQ Coimbatore</span>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

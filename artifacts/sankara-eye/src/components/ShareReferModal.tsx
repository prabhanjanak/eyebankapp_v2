import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Mail, Copy, Check, HeartHandshake, Sparkles, Send } from "lucide-react";
import { BASE_PATH } from "@/lib/constants";

// Custom WhatsApp SVG Icon
function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.834.783 2.796.784 3.182 0 5.768-2.587 5.768-5.766.001-3.182-2.585-5.77-5.768-5.77zm0 10.453c-.875 0-1.688-.242-2.404-.694l-.172-.108-1.785.468.477-1.74-.112-.178c-.496-.79-.757-1.579-.756-2.435.001-2.587 2.106-4.693 4.692-4.693 2.587 0 4.692 2.105 4.692 4.693 0 2.588-2.105 4.694-4.692 4.694zM12 0C5.373 0 0 5.373 0 12c0 2.115.553 4.103 1.518 5.83L0 24l6.335-1.482C8.01 23.46 9.947 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  );
}

interface ShareReferModalProps {
  trigger?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "header";
}

export default function ShareReferModal({ trigger, variant = "default" }: ShareReferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const portalUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${BASE_PATH}` 
    : "https://sankaraeye.com";

  const shareText = `🙏 Namaste! Join me in supporting Sankara Eye Foundation to restore sight for individuals living with corneal blindness.\n\nPlease use this official portal to pledge your eyes or report an emergency eye donation 24/7:\n${portalUrl}\n\nOne noble decision can illuminate TWO lives with vision! ✨`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Pledge to Donate Eyes — Sankara Eye Foundation Portal");
    const body = encodeURIComponent(
      `Dear Friend / Family,\n\nI wanted to share the official Sankara Eye Foundation Eye Donation portal with you.\n\nThrough this application, you can:\n1. Pledge your eyes for future donation and receive a certificate.\n2. Submit an emergency death report for immediate 24/7 medical corneal retrieval.\n3. Learn essential facts about corneal blindness and eye banking.\n\nPlease visit the portal here:\n${portalUrl}\n\nTogether, let's illuminate lives!\n\nWarm regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Sankara Eye Donation Portal",
          text: "Pledge to donate your eyes or report an emergency donation with Sankara Eye Foundation.",
          url: portalUrl,
        });
      } catch (e) {
        console.log("Native share dismissed");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm px-4 py-2 flex items-center gap-2 shadow-sm cursor-pointer transition-all hover:scale-[1.02] border-0"
          >
            <Share2 className="h-4 w-4" />
            <span>Refer to Someone</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white border border-orange-100 p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="inline-flex items-center gap-2 bg-orange-100/80 text-orange-800 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider w-fit">
            <HeartHandshake className="h-4 w-4 text-orange-600" /> Share & Refer
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 font-['Outfit']">
            Refer Sankara Eye Donation Portal
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 font-semibold leading-relaxed">
            Spread the gift of sight! Share this official application with your family, friends, and community groups to encourage eye donation pledges or facilitate emergency retrieval.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Quick Actions (WhatsApp & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <WhatsAppIcon className="h-5 w-5" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleEmailShare}
              className="flex items-center justify-center gap-2.5 bg-sky-600 hover:bg-sky-700 text-white p-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Mail className="h-5 w-5" />
              <span>Share via Email</span>
            </button>
          </div>

          {/* Direct Copy Link Section */}
          <div className="space-y-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
              Portal Application Link
            </label>
            <div className="flex gap-2">
              <Input 
                readOnly 
                value={portalUrl} 
                className="bg-white border-orange-200 text-xs font-semibold text-slate-700 h-10 rounded-xl select-all" 
              />
              <Button 
                onClick={handleCopyLink}
                className={`h-10 px-4 rounded-xl text-xs font-bold transition-all ${
                  copied 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {copied ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Copied!
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Information Highlights */}
          <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1.5 font-medium">
            <p className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Why sharing matters:
            </p>
            <p>• Enables individuals to register their eye donation pledge in under 2 minutes.</p>
            <p>• Provides 24/7 fast dispatch emergency reporting for families in need.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useListPublicUnits, customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { INDIA_STATES, BASE_PATH } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle2, Heart, Award, Download, Share2, ArrowLeft, ShieldAlert, Sparkles, MapPin, Building2, User, Mail, Loader2, Info, Activity, Clock, Phone
} from "lucide-react";
import { Link } from "wouter";

const mobileRegex = /^\+91 [6-9]\d{9}$/;

// Zod Schema for FUTURE eye pledge
const pledgeSchema = z.object({
  pledgerName: z.string().min(2, "Your name is required"),
  pledgerAge: z.coerce.number().min(1, "Enter a valid age").max(120, "Age must be below 120"),
  pledgerGender: z.enum(["male", "female", "other"]),
  pledgerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number"),
  pledgerEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  unitId: z.coerce.number().min(1, "Please select nearest Sankara hospital"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
});

type PledgeValues = z.infer<typeof pledgeSchema>;

const SANKARA_STATES = [
  "Uttar Pradesh",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Gujarat",
  "Karnataka",
  "Telangana",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan"
];

const isOutOfRegionState = (stateName: string) => {
  if (!stateName) return false;
  return !SANKARA_STATES.some(s => s.toLowerCase() === stateName.toLowerCase().trim());
};

const getMhqUnit = (unitsList: any[]) => {
  if (!unitsList) return null;
  return unitsList.find(u => 
    u.name.toLowerCase().includes("mhq") || 
    u.name.toLowerCase().includes("head quarters") ||
    u.name.toLowerCase().includes("headquarters")
  ) || unitsList[0];
};

const getAutoSelectedUnitForState = (state: string, unitsList: any[]) => {
  if (!unitsList || unitsList.length === 0 || !state) return null;
  const stateLower = state.toLowerCase().trim();
  const stateUnits = unitsList.filter(u => u.state.toLowerCase().trim() === stateLower);
  return stateUnits.length === 1 ? stateUnits[0] : null;
};

export default function Donate() {
  const [successData, setSuccessData] = useState<{ 
    whatsappUrl: string; 
    callId: string; 
    pledgerName?: string;
    pledgeDate?: string;
    unitName?: string;
    secureToken?: string;
  } | null>(null);

  const [isPledging, setIsPledging] = useState(false);

  const { data: units } = useListPublicUnits();

  // Pledge Form Hook
  const pledgeForm = useForm<PledgeValues>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      pledgerName: "",
      pledgerAge: undefined as any,
      pledgerGender: "male",
      pledgerMobile: "+91 ",
      pledgerEmail: "",
      unitId: 0,
      state: "",
      district: "",
    },
  });

  const selectedState = pledgeForm.watch("state");

  // Automatically select the unit if there is only one hospital in the selected state or route to MHQ if out-of-region
  useEffect(() => {
    if (!units || !selectedState) return;

    if (isOutOfRegionState(selectedState)) {
      const mhq = getMhqUnit(units);
      if (mhq) {
        pledgeForm.setValue("unitId", mhq.id, { shouldValidate: true });
      }
      return;
    }

    const autoUnit = getAutoSelectedUnitForState(selectedState, units);
    if (autoUnit) {
      pledgeForm.setValue("unitId", autoUnit.id, { shouldValidate: true });
    } else {
      const currentUnitId = pledgeForm.getValues("unitId");
      const currentUnit = units.find(u => u.id === currentUnitId);
      if (currentUnit && currentUnit.state.toLowerCase().trim() !== selectedState.toLowerCase().trim()) {
        pledgeForm.setValue("unitId", 0, { shouldValidate: false });
      }
    }
  }, [selectedState, units, pledgeForm]);

  const districts = useMemo(() => {
    const state = INDIA_STATES.find(s => s.name === selectedState);
    return state ? state.districts : [];
  }, [selectedState]);

  const pledgeFilteredUnits = useMemo(() => {
    if (!units) return [];
    if (!selectedState) return units;
    const matched = units.filter(u => u.state === selectedState);
    return matched.length > 0 ? matched : units;
  }, [units, selectedState]);

  const pledgeAssignedUnit = useMemo(() => {
    const selectedId = pledgeForm.watch("unitId");
    return units?.find(u => u.id === selectedId);
  }, [units, pledgeForm.watch("unitId")]);

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>, setValueFn: (val: string) => void) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      e.target.value = "+91 ";
      setValueFn("+91 ");
      return;
    }

    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    
    if (suffix.startsWith("0")) {
      suffix = suffix.substring(1);
    }
    
    const formatted = prefix + suffix.substring(0, 10);
    e.target.value = formatted;
    setValueFn(formatted);
  };

  const { toast } = useToast();

  // Submit Future Pledge Form
  const onPledgeSubmit = async (data: PledgeValues) => {
    if (isPledging) return;
    setIsPledging(true);
    const selectedUnit = units?.find(u => u.id === data.unitId);
    
    const dobYear = new Date().getFullYear() - data.pledgerAge;
    const dateOfBirth = `${dobYear}-01-01`;

    const payload = {
      fullName: data.pledgerName,
      mobile: data.pledgerMobile,
      email: data.pledgerEmail || `pledge-${Date.now()}@sankaraeye.com`,
      address: `${data.district}, ${data.state}`,
      dateOfBirth: dateOfBirth,
      bloodGroup: "N/A",
    };

    try {
      const response = await customFetch<any>("/api/pledges", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccessData({
        whatsappUrl: "",
        callId: `PLEDGE-${response.id.toString().padStart(5, '0')}`,
        pledgerName: data.pledgerName,
        pledgeDate: new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' }),
        unitName: selectedUnit?.name || "Sankara Eye Hospital",
        secureToken: response.secureToken,
      });
      toast({
        title: "Pledge Registered!",
        description: "Thank you for pledging your eyes to give the gift of sight.",
      });
    } catch (err: any) {
      console.error("Pledge registration failed:", err);
      toast({
        title: "Registration Failed",
        description: err?.message || "Could not register pledge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPledging(false);
    }
  };

  const shareCertificateOnWhatsApp = () => {
    if (!successData) return;
    const downloadUrl = successData.secureToken 
      ? `${window.location.origin}/api/public/pledges/c/${successData.secureToken}`
      : "";
    const message = 
      `I have proudly pledged to donate my eyes at *${successData.unitName}*!\n` +
      `🏥 Certificate ID: *${successData.callId}*\n` +
      `📅 Pledge Date: ${successData.pledgeDate}\n\n` +
      `Join me in gifting the miracle of sight. Register your pledge here: ${window.location.origin}/donate`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (successData) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-orange-50/20 via-white to-orange-100/10 flex flex-col items-center justify-center p-4 print:p-0 select-none">
        
        <style>{`
          @page {
            size: A4 landscape;
            margin: 0;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              width: 297mm !important;
              height: 210mm !important;
            }
            .print-hide { display: none !important; }
            #pledge-certificate-wrapper {
              position: fixed !important;
              top: 0 !important; left: 0 !important;
              width: 297mm !important; height: 210mm !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              background: white !important;
              padding: 8mm !important;
              box-sizing: border-box !important;
            }
            #pledge-certificate {
              width: 281mm !important; height: 194mm !important;
              border: 6px double #b8860b !important;
              outline: 2px solid #d4af37 !important;
              outline-offset: -10px !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: white !important;
              display: flex !important;
              flex-direction: column !important;
              overflow: hidden !important;
            }
          }
        `}</style>

        <div id="pledge-certificate-wrapper" className="flex flex-col items-center w-full max-w-5xl">
          <div className="print-hide text-center mb-6 max-w-md">
            <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 mx-auto shadow-inner">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">🎉 Pledge Registered!</h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed font-semibold">
              Thank you for your noble commitment, <strong>{successData.pledgerName}</strong>.<br />
              Your Certificate of Appreciation is ready below.
            </p>
          </div>

          <div
            id="pledge-certificate"
            className="w-full border-[6px] border-double border-[#b8860b] outline outline-2 outline-offset-[-10px] outline-[#d4af37] bg-white shadow-2xl overflow-hidden flex flex-col"
            style={{ aspectRatio: "297/210", maxWidth: "900px" }}
          >
            <div className="bg-gradient-to-r from-[#7b0000] via-[#a30000] to-[#7b0000] px-8 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 bg-white/90 rounded-xl px-3 py-1.5">
                <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 object-contain" />
              </div>
              <div className="text-center">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.3em]">Official Document</p>
                <p className="text-white text-xs font-extrabold tracking-widest uppercase font-['Outfit']">Eye Donation Pledge Registry</p>
              </div>
              <div className="text-right text-[10px] text-white/70 font-mono">
                <p className="font-bold text-white">{successData.callId}</p>
                <p>{successData.pledgeDate}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center px-12 py-4 text-center relative">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                <img src={`${BASE_PATH}/logo.png`} alt="" className="w-64 h-64 object-contain" />
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#d4af37]" />
                <Award className="h-8 w-8 text-[#b8860b]" />
                <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#d4af37]" />
              </div>

              <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b6914] font-black mb-1">
                Sankara Eye Foundation — India
              </p>

              <h1 className="font-serif text-4xl md:text-5xl font-black text-gray-900 tracking-wide uppercase leading-tight mb-2">
                Certificate of Appreciation
              </h1>

              <p className="text-xs text-gray-500 italic mb-2 font-medium">
                This certificate is proudly and gratefully presented to our esteemed Sight Ambassador
              </p>

              <h2 className="font-serif text-3xl md:text-4xl font-black text-gray-900 border-b-2 border-[#d4af37] pb-2 px-8 tracking-wide mb-3">
                {successData.pledgerName}
              </h2>

              <p className="text-sm text-gray-700 font-bold max-w-2xl leading-relaxed mb-1">
                who has solemnly and compassionately pledged to donate their eyes, bestowing the{" "}
                <span
                  className="font-black tracking-wide"
                  style={{ background: "linear-gradient(90deg, #b8860b 0%, #f5c842 40%, #d4af37 70%, #a0720a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >GIFT OF VISION</span>{" "}
                upon two blind individuals — a gift that transcends life itself.
              </p>

              <p className="text-[11px] text-gray-400 italic font-semibold">
                "Do not deny them sight — let your eyes illuminate lives even after yours."
              </p>
            </div>

            <div className="bg-[#fdf8ec] border-t-2 border-[#d4af37] px-10 py-3 flex items-center justify-between shrink-0">
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6914]">Registered Hospital Unit</p>
                <p className="text-xs font-extrabold text-gray-800">{successData.unitName || "Sankara Eye Hospital"}</p>
              </div>
              <div className="text-center flex flex-col items-center gap-0.5">
                <img src={`${BASE_PATH}/logo.png`} alt="Sankara" className="h-9 object-contain opacity-60" />
                <p className="text-[8px] text-[#8b6914] font-semibold tracking-wide">Sri Kanchi Kamakoti Medical Trust</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#8b6914]">Certificate ID</p>
                <p className="text-xs font-mono font-extrabold text-gray-800 mt-0.5">{successData.callId}</p>
              </div>
            </div>
          </div>

          <div className="print-hide flex flex-col sm:flex-row gap-3 w-full max-w-lg mt-6">
            <Button
              onClick={() => {
                if (successData.secureToken) {
                  window.open(`/api/public/pledges/c/${successData.secureToken}`, "_blank");
                } else {
                  window.print();
                }
              }}
              className="flex-1 h-12 bg-gray-950 hover:bg-gray-800 text-white rounded-2xl shadow-md border-0 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={18} /> Download / Print Certificate
            </Button>
            <Button
              onClick={shareCertificateOnWhatsApp}
              className="flex-1 h-12 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl shadow-md border-0 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 size={18} /> Share on WhatsApp
            </Button>
          </div>

          <div className="print-hide flex gap-3 mt-3">
            <Button onClick={() => setSuccessData(null)} variant="ghost" className="text-gray-500 hover:text-gray-900 text-xs font-semibold">
              Register Another Pledge
            </Button>
            <Link href="/">
              <Button variant="ghost" className="text-gray-400 hover:text-gray-900 text-xs font-semibold">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] flex flex-col select-none relative overflow-x-hidden">
      
      {/* Premium Header */}
      <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-12 sticky top-0 z-50">
        <a href="https://sankaraeye.com/" target="_blank" rel="noopener noreferrer">
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-10 md:h-12 object-contain cursor-pointer hover:scale-[1.01] transition-transform duration-300" />
        </a>
        <div className="flex items-center gap-3">
          <Link href="/awareness">
            <Button className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff8c32] hover:to-[#ffa751] text-white shadow-md rounded-xl text-xs font-black px-4 py-2 border-0 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.03]">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Eye Donation Awareness
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl h-9 md:h-10 text-xs font-semibold gap-1.5 cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <div className="w-full pt-12 pb-8 px-4 text-center relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-orange-100/50 to-transparent blur-3xl pointer-events-none -z-10" />
        <div className="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-[10px] md:text-xs font-extrabold text-orange-600 uppercase tracking-widest mb-4 shadow-sm">
          <Activity className="h-3.5 w-3.5 animate-pulse" /> Official Eye Bank Portal
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4 font-['Outfit']">
          Give the Miracle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Sight</span>
        </h1>
        <p className="text-xl md:text-2xl font-extrabold text-[#ff7a18] tracking-wide mb-4">
          "Do not Bury, Do not Burn, Donate Eyes"
        </p>
        <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed font-semibold">
          Every eye donation restores sight to two blind individuals. Declare your decision by registering your pledge below.
        </p>
      </div>

      {/* WIDESCREEN FORM FIELDS ALIGNED */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 pb-16 gap-8 md:gap-12 relative z-10">
        
        <div className="w-full max-w-5xl mx-auto">
          {/* PLEDGE FORM */}
          <div className="mt-0 animate-fadeIn">
            <Card className="border border-orange-200/60 shadow-[0_8px_35px_rgb(0,0,0,0.04)] rounded-3xl bg-white overflow-hidden relative transition-all duration-300 hover:shadow-[0_12px_45px_rgb(255,122,24,0.08)]">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 to-yellow-400" />
              <CardContent className="p-6 md:p-10 space-y-6">
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <Heart className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 leading-snug">Pledge Your Eyes</h2>
                    <p className="text-[10px] md:text-xs text-orange-600 font-extrabold tracking-widest uppercase">Register Future Donation</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed border-b border-gray-50 pb-4 font-semibold">Join 100,000+ ambassadors. Submit your details below to instantly generate your personalized digital Sight Certificate.</p>

                <form onSubmit={pledgeForm.handleSubmit(onPledgeSubmit)} className="space-y-6 pt-2">
                  
                  {/* Demographics grid (4-Column Layout) */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-orange-655 uppercase tracking-widest flex items-center gap-1.5"><User size={14} /> 1. Personal Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="pledgerName" className="text-xs font-extrabold text-slate-700">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                          <Input placeholder="Your Name" className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" {...pledgeForm.register("pledgerName")} />
                        </div>
                        {pledgeForm.formState.errors.pledgerName && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerName.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pledgerAge" className="text-xs font-extrabold text-slate-700">Age *</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                          <Input type="number" placeholder="Age" className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" {...pledgeForm.register("pledgerAge")} />
                        </div>
                        {pledgeForm.formState.errors.pledgerAge && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerAge.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-extrabold text-slate-700">Gender *</Label>
                        <Select onValueChange={(val) => pledgeForm.setValue("pledgerGender", val as any)} value={pledgeForm.watch("pledgerGender")}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium">
                            <SelectValue placeholder="Gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                    </div>
                  </div>

                  {/* Contact grid */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-orange-655 uppercase tracking-widest flex items-center gap-1.5"><Mail size={14} /> 2. Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-2">
                        <Label htmlFor="pledgerMobile" className="text-xs font-extrabold text-slate-700">Mobile Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="+91 " 
                            className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" 
                            {...pledgeForm.register("pledgerMobile", {
                              onChange: (e) => handleMobileInput(e, (v) => pledgeForm.setValue("pledgerMobile", v, { shouldValidate: true }))
                            })}
                            value={pledgeForm.watch("pledgerMobile")}
                            maxLength={15}
                          />
                        </div>
                        {pledgeForm.formState.errors.pledgerMobile && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerMobile.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pledgerEmail" className="text-xs font-extrabold text-slate-700">Email Address (Optional)</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                          <Input type="email" placeholder="name@email.com" className="pl-10 h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium transition-all" {...pledgeForm.register("pledgerEmail")} />
                        </div>
                        {pledgeForm.formState.errors.pledgerEmail && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.pledgerEmail.message}</p>}
                      </div>

                    </div>
                  </div>

                  {/* Location & Registry selection grid */}
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-black text-orange-655 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={14} /> 3. Regional Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-extrabold text-slate-700">State *</Label>
                        <Select onValueChange={(val) => { pledgeForm.setValue("state", val); pledgeForm.setValue("district", ""); }} value={pledgeForm.watch("state")}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium">
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent className="bg-white max-h-60">
                            {INDIA_STATES.map(s => (
                              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pledgeForm.formState.errors.state && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.state.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-extrabold text-slate-700">District *</Label>
                        <Select disabled={!selectedState} onValueChange={(val) => pledgeForm.setValue("district", val)} value={pledgeForm.watch("district")}>
                          <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-orange-500 shadow-sm font-medium">
                            <SelectValue placeholder={selectedState ? "Select District" : "Select State First"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white max-h-60">
                            {districts.map(d => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pledgeForm.formState.errors.district && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.district.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-extrabold text-slate-700">Preferred Sankara Registry Branch *</Label>
                        <Select onValueChange={(val) => pledgeForm.setValue("unitId", Number(val))} value={pledgeForm.watch("unitId")?.toString() || ""}>
                          <SelectTrigger className="h-11 rounded-xl border-orange-200 bg-orange-50/50 text-orange-950 font-black focus:ring-2 focus:ring-orange-500 shadow-sm">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent className="bg-white max-h-60">
                            {pledgeFilteredUnits.map((u: any) => (
                              <SelectItem key={u.id} value={u.id.toString()} className="font-semibold text-xs">{u.name} ({u.state})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {pledgeForm.formState.errors.unitId && <p className="text-[10px] font-semibold text-red-500 mt-1">{pledgeForm.formState.errors.unitId.message}</p>}
                      </div>

                    </div>
                  </div>

                  {/* Out of Area Alert Callout */}
                  {selectedState && isOutOfRegionState(selectedState) && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 animate-fadeIn">
                      <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">State Outside Main Sankara Region</p>
                        <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                          Sankara does not have a direct branch in {selectedState}. Your pledge will be securely maintained at our <strong>National Head Quarters (MHQ)</strong>, and we will coordinate local partner services if ever needed.
                        </p>
                      </div>
                    </div>
                  )}

                  {pledgeAssignedUnit && (
                    <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl space-y-3 relative overflow-hidden shadow-md">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
                      <h4 className="text-xs font-black uppercase text-orange-400 tracking-wider flex items-center gap-1.5"><Building2 size={14} /> Registered Registry Branch</h4>
                      <div>
                        <p className="text-lg font-black">{pledgeAssignedUnit.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{pledgeAssignedUnit.address}</p>
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={isPledging} className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl shadow-lg shadow-orange-500/20 border-0 text-base font-extrabold flex items-center justify-center gap-2 mt-4 transition-all cursor-pointer">
                    {isPledging ? <><Loader2 className="h-5 w-5 animate-spin" /> Registering Pledge...</> : <><Heart size={18} /> Register My Pledge &amp; Get Certificate</>}
                  </Button>

                </form>

              </CardContent>
            </Card>
          </div>
        </div>

        {/* F.A.Q Cards */}
        <div className="w-full max-w-5xl mx-auto mt-12 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-gray-900 font-['Outfit']">Frequently Asked Questions</h3>
            <p className="text-xs text-gray-500 font-bold tracking-wide uppercase">What happens next?</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white border border-orange-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-orange-400 to-amber-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600"><ShieldAlert size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Immediate Actions Required</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                As soon as a death occurs, switch off all ceiling fans in the room immediately to prevent the corneas from drying out. Close the eyelids and cover them with a clean, damp cloth or wet cotton.
              </p>
            </div>

            <div className="bg-white border border-amber-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-yellow-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Sparkles size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Zero Disfigurement</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                The surgical retrieval is clean, completely free of charge, and takes only 20 minutes in a standard room. It leaves absolutely no scars, ensuring full respect for the deceased.
              </p>
            </div>

            <div className="bg-white border border-green-100/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-400 group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-green-50 rounded-xl text-green-600"><CheckCircle2 size={20} /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Age & Cataracts Allowed</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-semibold">
                Anyone can donate their eyes. Poor eyesight, wearing spectacles, history of cataract surgery, religion, and blood group do not restrict an individual from giving the gift of sight.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-orange-50/50 to-orange-100/20 border border-orange-200/50 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden md:col-span-2 lg:col-span-2 group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#ff7a18] to-[#ff9f43] group-hover:w-2 transition-all"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-white rounded-xl text-orange-600 shadow-sm"><Heart size={20} className="animate-pulse" /></div>
                <h4 className="font-extrabold text-gray-900 text-[15px]">Illuminate Two Lives</h4>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed font-semibold">
                Corneal blindness causes severe suffering, but it is curable through transplantation. Your noble decision restores the miracle of sight to <span className="font-bold text-gray-950">not one, but two blind individuals</span> plunged into darkness. Do not deny them life—let your eyes live even after you.
              </p>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 md:h-12 border-t border-gray-100 flex items-center justify-between px-4 md:px-8 bg-white z-10 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-gray-500 font-bold tracking-wide">
          <Heart className="h-3.5 w-3.5 text-[#ff7a18] fill-[#ff7a18] animate-pulse" />
          <span>Sankara Eye Foundation - India</span>
        </div>
        <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          © {new Date().getFullYear()} Sri Kanchi Kamakoti Medical Trust. All Rights Reserved.
        </p>
      </footer>

    </div>
  );
}

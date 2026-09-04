import React, { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BASE_PATH, INDIA_STATES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitPublicEyeCall, useListPublicUnits } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  Eye, Clock, Phone, Heart, ArrowRight, ShieldAlert, HeartHandshake,
  Award, CheckCircle2, Info, Users, AlertCircle, MapPin, Building2, User, Send,
  Activity, Sparkles, Stethoscope, Syringe, Ambulance, Hospital, HeartPulse, Droplets, Microscope, Share2
} from "lucide-react";
import ShareReferModal from "@/components/ShareReferModal";

// ─── Validation ──────────────────────────────────────────────────────────────
const mobileRegex = /^\+91 [6-9]\d{9}$/;

const emergencySchema = z.object({
  referrerName: z.string().min(2, "Your name is required"),
  referrerMobile: z.string().regex(mobileRegex, "Enter a valid 10-digit number"),
  referrerRelationship: z.string().min(2, "Relationship to deceased is required"),
  donorName: z.string().min(2, "Deceased person's full name is required"),
  donorAge: z.coerce.number().min(0, "Age must be positive").max(120, "Age must be under 120"),
  donorGender: z.enum(["male", "female", "other"]),
  timeOfDeath: z.string().min(3, "Approximate time of death is required"),
  causeOfDeath: z.string().min(2, "Cause of death is required"),
  address: z.string().min(5, "Address of eye collection is required"),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  state: z.string().min(2, "State is required"),
  district: z.string().min(2, "District is required"),
  unitId: z.coerce.number().min(1, "Please select the nearest Sankara hospital branch"),
});

type EmergencyValues = z.infer<typeof emergencySchema>;

const SANKARA_STATES = [
  "Tamil Nadu",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Uttar Pradesh",
  "Gujarat",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan"
];

const DISPLAY_STATES = [
  "Tamil Nadu",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Uttar Pradesh",
  "Gujarat",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Others"
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

const FALLBACK_SANKARA_UNITS = [
  { id: 1, name: "Sankara Eye Hospital - Kanpur", state: "Uttar Pradesh", district: "Kanpur", address: "Off GT Road, Amiliha, Tatiyaganj, Kanpur, Uttar Pradesh 209203" },
  { id: 2, name: "Sankara Eye Hospital - Coimbatore", state: "Tamil Nadu", district: "Coimbatore", address: "16-A, Sathy Rd, Saravanampatti, Coimbatore, Tamil Nadu 641035" },
  { id: 3, name: "Sankara Eye Hospital - Guntur", state: "Andhra Pradesh", district: "Guntur", address: "Guntur - Vijayawada Hwy, Pedakakani, Andhra Pradesh 522509" },
  { id: 4, name: "Sankara Eye Hospital - Anand", state: "Gujarat", district: "Anand", address: "NH64, Mogar, Gujarat 388340" },
  { id: 5, name: "Sankara Eye Hospital - Bangalore", state: "Karnataka", district: "Bengaluru", address: "Varthur Main Rd, Kundalahalli, Bengaluru, Karnataka 560037" },
  { id: 6, name: "Sankara Eye Hospital - Shimoga", state: "Karnataka", district: "Shivamogga", address: "Thirthahalli Rd, Harakere, Shivamogga, Karnataka 577202" },
  { id: 7, name: "Sankara Eye Hospital - Hyderabad", state: "Telangana", district: "Hyderabad", address: "Financial District, Nanakramguda, Telangana 500032" },
  { id: 8, name: "Sankara Eye Hospital - Indore", state: "Madhya Pradesh", district: "Indore", address: "Vijay Nagar Main Rd, Indore, Madhya Pradesh 452010" },
  { id: 9, name: "RJ Sankara Eye Hospital - Panvel", state: "Maharashtra", district: "Panvel", address: "Sector 5A, New Panvel East, Panvel, Maharashtra 410206" },
  { id: 10, name: "Sankara Eye Hospital - Ludhiana", state: "Punjab", district: "Ludhiana", address: "Ferozepur Rd, near Wadi Haveli, Ludhiana, Punjab 141102" },
  { id: 11, name: "Sankara Eye Hospital - Krishnankoil", state: "Tamil Nadu", district: "Krishnan Kovil", address: "Kunnur PO, Krishnan Kovil, Tamil Nadu 626126" },
  { id: 12, name: "Sankara Eye Hospital - Varanasi", state: "Uttar Pradesh", district: "Varanasi", address: "Ring Road Phase-I, Madhopur, Varanasi, Uttar Pradesh 221003" },
  { id: 13, name: "Sankara Eye Hospital - Jaipur", state: "Rajasthan", district: "Jaipur", address: "Central Spine Rd, Sector 2, Vidyadhar Nagar, Jaipur, Rajasthan 302039" },
  { id: 14, name: "Sankara Eye Hospital - RS Puram CBE", state: "Tamil Nadu", district: "Coimbatore", address: "Dr Krishnasamy Mudaliyar Rd, RS Puram, Coimbatore, Tamil Nadu 641002" },
  { id: 15, name: "SEFI MHQ - Mission Head Quarters", state: "Tamil Nadu", district: "Coimbatore", address: "16-A, Sathy Rd, Saravanampatti, Coimbatore, Tamil Nadu 641035" },
];

export default function Home() {
  const { user } = useAuth();
  const isSignedIn = !!user;

  const { data: rawUnits } = useListPublicUnits();
  const submitCall = useSubmitPublicEyeCall();

  const activeUnits = useMemo(() => {
    if (rawUnits && rawUnits.length > 0) return rawUnits;
    return FALLBACK_SANKARA_UNITS;
  }, [rawUnits]);

  const [submittedUnit, setSubmittedUnit] = useState<any>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const emergencyForm = useForm<EmergencyValues>({
    resolver: zodResolver(emergencySchema),
    defaultValues: {
      referrerName: "",
      referrerMobile: "+91 ",
      referrerRelationship: "",
      donorName: "",
      donorAge: undefined as any,
      donorGender: "male",
      timeOfDeath: "",
      causeOfDeath: "",
      address: "",
      pincode: "",
      state: "",
      district: "",
      unitId: 0,
    },
  });

  const emergencySelectedState = emergencyForm.watch("state");
  const emergencySelectedDistrict = emergencyForm.watch("district");

  const handleStateSelect = (val: string) => {
    emergencyForm.setValue("state", val, { shouldValidate: true });
    emergencyForm.setValue("district", "", { shouldValidate: false });
    emergencyForm.setValue("unitId", 0, { shouldValidate: false });

    // Auto-update Address box when state is selected
    const currentAddress = emergencyForm.getValues("address") || "";
    if (val && val !== "Others") {
      if (!currentAddress.trim()) {
        emergencyForm.setValue("address", val, { shouldValidate: false });
      } else if (DISPLAY_STATES.includes(currentAddress.trim())) {
        emergencyForm.setValue("address", val, { shouldValidate: false });
      } else if (!currentAddress.toLowerCase().includes(val.toLowerCase())) {
        emergencyForm.setValue("address", `${currentAddress.trim()}, ${val}`, { shouldValidate: false });
      }
    }
  };

  const emergencyDistricts = useMemo(() => {
    const stateObj = INDIA_STATES.find(
      s => s.name?.toLowerCase().trim() === emergencySelectedState?.toLowerCase().trim()
    );
    return stateObj ? stateObj.districts : [];
  }, [emergencySelectedState]);

  const emergencyFilteredUnits = useMemo(() => {
    if (!emergencySelectedState) return activeUnits;
    const stateMatched = activeUnits.filter(
      (u: any) => u.state?.toLowerCase().trim() === emergencySelectedState?.toLowerCase().trim()
    );
    return stateMatched.length > 0 ? stateMatched : activeUnits;
  }, [activeUnits, emergencySelectedState]);

  // Smart Auto-Selection based on State & District
  useEffect(() => {
    if (!activeUnits || activeUnits.length === 0 || !emergencySelectedState) return;

    const stateUnits = activeUnits.filter(
      (u: any) => u.state?.toLowerCase().trim() === emergencySelectedState?.toLowerCase().trim()
    );

    // 1. If user selected a district, match hospital by district
    if (emergencySelectedDistrict) {
      const distLower = emergencySelectedDistrict.toLowerCase().trim();
      
      const matchedUnit = stateUnits.find((u: any) => {
        const uDist = (u.district || "").toLowerCase().trim();
        const uName = (u.name || "").toLowerCase().trim();
        return (
          uDist === distLower ||
          distLower.includes(uDist) ||
          uDist.includes(distLower) ||
          uName.includes(distLower) ||
          (distLower.includes("bangalore") && uName.includes("bangalore")) ||
          (distLower.includes("bengaluru") && uName.includes("bangalore")) ||
          (distLower.includes("shimoga") && uName.includes("shimoga")) ||
          (distLower.includes("shivamogga") && uName.includes("shimoga")) ||
          (distLower.includes("coimbatore") && uName.includes("coimbatore")) ||
          (distLower.includes("kanpur") && uName.includes("kanpur")) ||
          (distLower.includes("varanasi") && uName.includes("varanasi")) ||
          (distLower.includes("panvel") && uName.includes("panvel")) ||
          (distLower.includes("raigad") && uName.includes("panvel")) ||
          (distLower.includes("mumbai") && uName.includes("panvel")) ||
          (distLower.includes("jaipur") && uName.includes("jaipur")) ||
          (distLower.includes("indore") && uName.includes("indore")) ||
          (distLower.includes("ludhiana") && uName.includes("ludhiana")) ||
          (distLower.includes("guntur") && uName.includes("guntur")) ||
          (distLower.includes("anand") && uName.includes("anand")) ||
          (distLower.includes("hyderabad") && uName.includes("hyderabad"))
        );
      });

      if (matchedUnit) {
        emergencyForm.setValue("unitId", matchedUnit.id, { shouldValidate: true });
        return;
      }
    }

    // 2. If state has units and current unit is not from this state, pick first unit of state
    if (stateUnits.length > 0) {
      const currentUnitId = emergencyForm.getValues("unitId");
      const currentUnit = activeUnits.find((u: any) => u.id === currentUnitId);
      if (!currentUnit || currentUnit.state?.toLowerCase().trim() !== emergencySelectedState?.toLowerCase().trim()) {
        emergencyForm.setValue("unitId", stateUnits[0].id, { shouldValidate: true });
      }
      return;
    }

    // 3. Out-of-region state -> Route to MHQ
    const mhq = getMhqUnit(activeUnits);
    if (mhq) {
      emergencyForm.setValue("unitId", mhq.id, { shouldValidate: true });
    }
  }, [emergencySelectedState, emergencySelectedDistrict, activeUnits, emergencyForm]);

  const assignedUnit = useMemo(() => {
    const selectedId = emergencyForm.watch("unitId");
    return activeUnits?.find((u: any) => u.id === selectedId);
  }, [activeUnits, emergencyForm.watch("unitId")]);

  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+91 ")) {
      emergencyForm.setValue("referrerMobile", "+91 ", { shouldValidate: true });
      return;
    }
    const prefix = "+91 ";
    let suffix = val.substring(prefix.length).replace(/\D/g, "");
    if (suffix.startsWith("0")) suffix = suffix.substring(1);
    emergencyForm.setValue("referrerMobile", prefix + suffix.substring(0, 10), { shouldValidate: true });
  };

  const onEmergencySubmit = async (data: EmergencyValues) => {
    const payload = {
      referrerName: data.referrerName,
      referrerMobile: data.referrerMobile,
      referrerRelationship: data.referrerRelationship,
      donorName: data.donorName,
      donorAge: data.donorAge,
      donorGender: data.donorGender,
      timeOfDeath: data.timeOfDeath,
      causeOfDeath: data.causeOfDeath,
      state: data.state,
      district: data.district,
      pincode: data.pincode,
      address: data.address,
      unitId: data.unitId,
    };

    submitCall.mutate({ data: payload }, {
      onSuccess: (response) => {
        const finalUnit = assignedUnit || getMhqUnit(activeUnits || []);
        setSubmittedUnit(finalUnit);
        setIsSubmitted(true);
        try {
          window.open(response.whatsappUrl, "_blank");
        } catch (e) {
          console.error("Popup window open failed:", e);
        }
        emergencyForm.reset();
      },
      onError: (err: any) => {
        console.error("Failed to submit emergency eye call:", err);
      }
    });
  };

  const errs = emergencyForm.formState.errors;

  return (
    <div className="min-h-screen w-full bg-white font-sans select-none overflow-x-hidden">

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-gray-100 flex items-center justify-between px-3 sm:px-6 md:px-10 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <a href="https://sankaraeye.com/" target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:scale-[1.02] transition-transform shrink-0">
          <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-8 sm:h-10 md:h-11 w-auto object-contain" />
        </a>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ShareReferModal />
          <Link href="/awareness">
            <Button className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff8c32] hover:to-[#ffa751] text-white shadow-md rounded-xl text-xs font-black px-2.5 sm:px-4 py-1.5 sm:py-2 border-0 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.03]">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> 
              <span className="hidden sm:inline">Eye Donation </span>Awareness
            </Button>
          </Link>
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 rounded-xl text-xs font-semibold px-2.5 sm:px-3">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 rounded-xl text-xs font-medium px-2 sm:px-3">
                <span className="hidden sm:inline">Coordinator </span>Login
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#fff8f2] via-white to-[#fff3e6] min-h-[85vh] py-16">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-100 rounded-full blur-[160px] opacity-50 pointer-events-none -z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-100 rounded-full blur-[120px] opacity-40 pointer-events-none -z-0" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-10 flex flex-col items-center text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            {/* Urgent Badge */}
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-lg animate-pulse">
              <Ambulance className="h-4 w-4" />
              Time Critical — Act Within 6 Hours of Death
            </div>

            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight">
                Give the Miracle of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] via-[#ff9f43] to-[#ffb347]">Sight</span>
              </h1>
              <p className="text-xl md:text-2xl font-extrabold text-[#ff7a18] tracking-wide mt-2">
                "Do not Bury, Do not Burn, Donate Eyes"
              </p>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto font-medium">
                Every eye donation restores sight to two or more blind individuals. Eye retrieval must happen within <strong className="text-red-600">6 hours of demise</strong>.
              </p>
            </div>

            {/* ── INTERACTIVE SANKARA STATEWISE HELPLINE CONNECTOR ─────────────── */}
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-orange-200/90 shadow-[0_12px_45px_rgba(255,122,24,0.1)] rounded-3xl p-6 sm:p-8 text-left my-6 transition-all duration-300">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-orange-100/80 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#ff7a18] to-[#ff9f43] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                    <Phone className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                      Connect to Sankara Eye Hospital
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                      Statewise Direct 24/7 Helpline &amp; Emergency Eye Retrieval
                    </p>
                  </div>
                </div>

                {/* State Dropdown Selector */}
                <div className="w-full md:w-72 shrink-0">
                  <div className="relative">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-orange-600 mb-1.5 block">
                      Select Your State for Direct Helpline:
                    </Label>
                    <Select
                      value={emergencyForm.watch("state")}
                      onValueChange={(val) => {
                        handleStateSelect(val);
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-orange-300/80 bg-orange-50/80 hover:bg-orange-100/50 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-500/20 shadow-xs transition-colors">
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="h-4 w-4 text-orange-600 shrink-0" />
                          <SelectValue placeholder="Choose Your State" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="max-h-64 rounded-xl">
                        {DISPLAY_STATES.map((sName) => {
                          const isOthers = sName === "Others";
                          return (
                            <SelectItem key={sName} value={sName} className="text-xs font-semibold py-2">
                              <span className="flex items-center justify-between w-full gap-2">
                                <span>{sName}</span>
                                {!isOthers ? (
                                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full border border-orange-200/60">
                                    Sankara Branch
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/60">
                                    Mission HQ Route
                                  </span>
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dynamic Helpline Display based on Selected State */}
              {emergencySelectedState && emergencyFilteredUnits.length > 0 && !isOutOfRegionState(emergencySelectedState) ? (
                <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-orange-50/20 border border-orange-200/90 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                        <Building2 className="h-3.5 w-3.5" /> Sankara Eye Hospital Branch
                      </span>
                      <span className="text-xs font-bold text-orange-800 bg-orange-100/80 px-2.5 py-1 rounded-full border border-orange-200/60">
                        📍 {emergencySelectedState}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        {assignedUnit?.name || emergencyFilteredUnits[0]?.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                        {assignedUnit?.address || emergencyFilteredUnits[0]?.address}
                      </p>
                    </div>

                    {/* Branch switcher if state has multiple Sankara hospitals */}
                    {emergencyFilteredUnits.length > 1 && (
                      <div className="pt-1.5 flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 shrink-0">Branch:</span>
                        <select
                          value={assignedUnit?.id || emergencyFilteredUnits[0]?.id}
                          onChange={(e) => emergencyForm.setValue("unitId", Number(e.target.value), { shouldValidate: true })}
                          className="text-xs font-bold text-slate-800 bg-white border border-orange-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs cursor-pointer"
                        >
                          {emergencyFilteredUnits.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
                    <a
                      href={`tel:${(assignedUnit as any)?.coordinatorWhatsapp || (emergencyFilteredUnits[0] as any)?.coordinatorWhatsapp || '+919000019190'}`}
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white text-xs sm:text-sm font-extrabold px-5 py-3.5 rounded-xl shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                    >
                      <Phone className="h-4 w-4 animate-bounce" />
                      <span>Call: {(assignedUnit as any)?.coordinatorWhatsapp || (emergencyFilteredUnits[0] as any)?.coordinatorWhatsapp || '+91 90000 19190'}</span>
                    </a>
                    <a
                      href={`https://wa.me/${((assignedUnit as any)?.coordinatorWhatsapp || (emergencyFilteredUnits[0] as any)?.coordinatorWhatsapp || '+919000019190').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold px-4 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] whitespace-nowrap"
                      title="WhatsApp Emergency Helpline"
                    >
                      <Send className="h-4 w-4" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                /* Non-Sankara State or Default National HQ Helpline */
                <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-yellow-50/20 border border-amber-200/90 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-amber-600 text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                        <ShieldAlert className="h-3.5 w-3.5" /> Sankara Mission Head Quarters
                      </span>
                      {emergencySelectedState && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200/60">
                          📍 {emergencySelectedState} (Mission HQ Route)
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Sankara Eye Foundation Mission Head Quarters
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                        {emergencySelectedState
                          ? `For ${emergencySelectedState}, our Mission Head Quarters team will coordinate immediate local eye retrieval.`
                          : "Select your state above to connect directly with your nearest Sankara Eye Hospital branch."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch gap-2.5 w-full md:w-auto shrink-0">
                    <a
                      href="tel:+919000019190"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-extrabold px-5 py-3.5 rounded-xl shadow-md shadow-orange-600/20 transition-all hover:scale-[1.02] whitespace-nowrap"
                    >
                      <Phone className="h-4 w-4 animate-bounce" />
                      <span>Call Mission HQ: +91 90000 19190</span>
                    </a>
                    <a
                      href="https://wa.me/919000019190"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold px-4 py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] whitespace-nowrap"
                      title="WhatsApp Mission HQ"
                    >
                      <Send className="h-4 w-4" />
                      <span>WhatsApp HQ</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* WIDE EMERGENCY FORM OR SUCCESS VIEW */}
            {isSubmitted && submittedUnit ? (
              <Card className="w-full max-w-4xl border border-emerald-200/60 shadow-[0_8px_35px_rgb(0,0,0,0.06)] rounded-3xl bg-white overflow-hidden relative text-left transition-all duration-300 mx-auto">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-green-500" />
                <CardContent className="p-8 md:p-12 space-y-8 flex flex-col items-center text-center">
                  <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2 shadow-inner">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Request Successfully Logged</h2>
                    <p className="text-lg text-gray-600 font-medium">Our medical team has been alerted. Please contact the coordinator below for immediate assistance.</p>
                  </div>
                  
                  <div className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 md:p-8 space-y-4 mt-4 shadow-sm">
                    <h3 className="text-sm font-black text-emerald-800 uppercase tracking-widest">Assigned Hospital Coordinator</h3>
                    
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-2xl font-extrabold text-slate-900">{submittedUnit.name}</p>
                      <p className="text-sm text-slate-600 font-medium max-w-md mx-auto">{submittedUnit.address}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1 mt-6">
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Contact Person</p>
                      <p className="text-xl font-extrabold text-slate-900">{submittedUnit.coordinatorName || "Duty Coordinator"}</p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-center gap-4 mt-8 pt-4">
                       <a href={`tel:${submittedUnit.coordinatorWhatsapp}`} className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors flex-1 md:flex-none shadow-md">
                         <Phone className="h-5 w-5" /> Call {submittedUnit.coordinatorWhatsapp}
                       </a>
                       <a href={`https://wa.me/${submittedUnit.coordinatorWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-600/20 flex-1 md:flex-none">
                         <Send className="h-5 w-5" /> WhatsApp Coordinator
                       </a>
                    </div>
                  </div>
                  
                  <Button variant="ghost" onClick={() => { setIsSubmitted(false); setSubmittedUnit(null); }} className="mt-8 text-gray-500 font-bold hover:bg-gray-100 rounded-xl h-12 px-6">
                    ← Submit Another Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
            <Card className="w-full max-w-4xl border border-orange-100/80 shadow-[0_12px_40px_rgb(255,122,24,0.08)] rounded-3xl bg-white overflow-hidden relative text-left transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 to-amber-500" />
              <CardContent className="p-6 md:p-10 space-y-8">
                
                <div className="flex flex-col items-center justify-center text-center gap-4 border-b border-gray-100 pb-8">
                  <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 shadow-sm border border-orange-100">
                    <HeartHandshake className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">Eye Donation Request</h2>
                    <p className="text-sm sm:text-base text-gray-600 font-bold mt-2 max-w-xl mx-auto leading-relaxed">
                      We share your grief, We feel sorry for your loss<br />
                      Please provide few details so our medical retrieval team can assist you immediately.
                    </p>
                  </div>
                </div>

                <form onSubmit={emergencyForm.handleSubmit(onEmergencySubmit)} className="space-y-10">
                  {/* SECTION 1: REFERRER / CONTACT DETAILS */}
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="space-y-4">
                    <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm">1</span>
                      Reporter & Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-orange-50/40 p-5 md:p-6 rounded-2xl border border-orange-100/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                      
                      {/* Present On-Site vs Representative Selection Toggle */}
                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-bold text-gray-800 block">Reporter Status at Location: *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (emergencyForm.getValues("referrerRelationship") === "Myself (Self)") {
                                emergencyForm.setValue("referrerRelationship", "", { shouldValidate: false });
                              }
                            }}
                            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 shadow-xs cursor-pointer text-left flex items-center gap-2.5 ${
                              emergencyForm.watch("referrerRelationship") !== "Myself (Self)"
                                ? "bg-orange-500 border-orange-500 text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-orange-50/60"
                            }`}
                          >
                            <span className="text-base">📍</span>
                            <div>
                              <p className="font-extrabold leading-tight">Present at Location</p>
                              <p className={`text-[11px] font-medium mt-0.5 ${emergencyForm.watch("referrerRelationship") !== "Myself (Self)" ? "text-orange-100" : "text-gray-500"}`}>
                                Direct family member or relative on-site
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (emergencyForm.getValues("referrerRelationship") !== "Myself (Self)") {
                                emergencyForm.setValue("referrerRelationship", "Myself (Self)", { shouldValidate: true });
                              }
                            }}
                            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-300 shadow-xs cursor-pointer text-left flex items-center gap-2.5 ${
                              emergencyForm.watch("referrerRelationship") === "Myself (Self)"
                                ? "bg-orange-500 border-orange-500 text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-700 hover:bg-orange-50/60"
                            }`}
                          >
                            <span className="text-base">👥</span>
                            <div>
                              <p className="font-extrabold leading-tight">Reporting on Behalf of Family</p>
                              <p className={`text-[11px] font-medium mt-0.5 ${emergencyForm.watch("referrerRelationship") === "Myself (Self)" ? "text-orange-100" : "text-gray-500"}`}>
                                Remote reporter, physician, or friend
                              </p>
                            </div>
                          </button>
                        </div>
                        <p className="text-[11px] text-orange-700 font-semibold mt-1 flex items-center gap-1 bg-orange-100/60 px-3 py-1.5 rounded-lg w-fit">
                          <span>⚠️</span> Please ensure contact details match the person physically present with the deceased.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          {emergencyForm.watch("referrerRelationship") === "Myself (Self)" 
                            ? "Your Full Name *" 
                            : "Contact Person Name (at the death place) *"}
                        </Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <Input placeholder="e.g. Ramesh Kumar" className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" {...emergencyForm.register("referrerName")} />
                        </div>
                        {errs.referrerName && <p className="text-sm text-red-500 font-bold mt-1">{errs.referrerName.message}</p>}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">Contact Number *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <Phone className="h-5 w-5" />
                          </div>
                          <Input type="tel" className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base font-medium tracking-wide focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" onChange={handleMobileInput} value={emergencyForm.watch("referrerMobile")} />
                        </div>
                        {errs.referrerMobile && <p className="text-sm text-red-500 font-bold mt-1">{errs.referrerMobile.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Relationship to the Departed Soul *</Label>
                        {emergencyForm.watch("referrerRelationship") === "Myself (Self)" ? (
                          <div className="relative group/field">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                              <Users className="h-5 w-5" />
                            </div>
                            <Input value="Self / Indirect Reporter" disabled className="pl-11 h-12 rounded-xl border-gray-200 bg-gray-50 text-base font-semibold text-gray-500" />
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {["Son", "Daughter", "Spouse / Partner", "Sibling", "Grandchild", "Friend / Relative", "Hospital Staff", "Others"].map(rel => {
                              const isSelected = emergencyForm.watch("referrerRelationship") === rel;
                              return (
                                <button
                                  type="button"
                                  key={rel}
                                  onClick={() => emergencyForm.setValue("referrerRelationship", rel, { shouldValidate: true })}
                                  className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all duration-300 shadow-sm ${isSelected ? 'bg-orange-500 border-orange-500 text-white shadow-md transform scale-[1.02]' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50'}`}
                                >
                                  {rel}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {errs.referrerRelationship && <p className="text-sm text-red-500 font-bold mt-1">{errs.referrerRelationship.message}</p>}
                      </div>
                    </div>
                  </motion.div>

                  {/* SECTION 2: DECEASED PERSON DETAILS */}
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="space-y-4 pt-2 border-t border-gray-100">
                    <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm">2</span>
                      Details of the Departed Soul
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-orange-50/40 p-5 md:p-6 rounded-2xl border border-orange-100/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Full Name *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <Input placeholder="Their Name" className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" {...emergencyForm.register("donorName")} />
                        </div>
                        {errs.donorName && <p className="text-sm text-red-500 font-bold mt-1">{errs.donorName.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-1">
                        <Label className="text-sm font-semibold text-gray-700">Age *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <HeartPulse className="h-5 w-5" />
                          </div>
                          <Input
                            type="number"
                            placeholder="Age" className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" {...emergencyForm.register("donorAge")} />
                        </div>
                        {errs.donorAge && <p className="text-sm text-red-500 font-bold mt-1">{errs.donorAge.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-1">
                        <Label className="text-sm font-semibold text-gray-700">Gender *</Label>
                        <div className="flex gap-2 mt-1">
                          {["male", "female", "other"].map(gender => {
                            const isSelected = emergencyForm.watch("donorGender") === gender;
                            return (
                              <button
                                type="button"
                                key={gender}
                                onClick={() => emergencyForm.setValue("donorGender", gender as any, { shouldValidate: true })}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border capitalize transition-all duration-300 shadow-sm ${isSelected ? 'bg-orange-500 border-orange-500 text-white shadow-md transform scale-[1.02]' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50'}`}
                              >
                                {gender}
                              </button>
                            );
                          })}
                        </div>
                        {errs.donorGender && <p className="text-sm text-red-500 font-bold mt-1">{errs.donorGender.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Demise Time *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <Clock className="h-5 w-5" />
                          </div>
                          <Input type="time" className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" {...emergencyForm.register("timeOfDeath")} />
                        </div>
                        {errs.timeOfDeath && <p className="text-sm text-red-500 font-bold mt-1">{errs.timeOfDeath.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Cause of Demise *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10 group-focus-within/field:text-orange-500 transition-colors">
                            <Microscope className="h-5 w-5" />
                          </div>
                          <Select
                            onValueChange={(val) => emergencyForm.setValue("causeOfDeath", val, { shouldValidate: true })} value={emergencyForm.watch("causeOfDeath") || ""}>
                            <SelectTrigger className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm">
                              <SelectValue placeholder="Select cause" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150">
                              <SelectItem value="Natural / Old Age" className="text-base py-2">Natural / Old Age</SelectItem>
                              <SelectItem value="Cardiac Arrest / Heart Attack" className="text-base py-2">Cardiac Arrest / Heart Attack</SelectItem>
                              <SelectItem value="Accident / Trauma" className="text-base py-2">Accident / Trauma</SelectItem>
                              <SelectItem value="Prolonged Illness" className="text-base py-2">Prolonged Illness</SelectItem>
                              <SelectItem value="Jaundice" className="text-base py-2">Jaundice</SelectItem>
                              <SelectItem value="Septisemia" className="text-base py-2">Septisemia</SelectItem>
                              <SelectItem value="I don't know / Other" className="text-base py-2 font-semibold text-orange-600">I don't know / Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {errs.causeOfDeath && <p className="text-sm text-red-500 font-bold mt-1">{errs.causeOfDeath.message}</p>}
                      </div>
                    </div>
                  </motion.div>

                  {/* SECTION 3: RETRIEVAL LOCATION */}
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="space-y-4 pt-2 border-t border-gray-100">
                    <h3 className="text-base font-black text-gray-800 flex items-center gap-2">
                      <span className="bg-orange-100 text-orange-600 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm">3</span>
                      Where are they currently located?
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 bg-orange-50/40 p-5 md:p-6 rounded-2xl border border-orange-100/60 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="space-y-3 md:col-span-3">
                        <Label className="text-sm font-semibold text-gray-700">Full Address *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <Input placeholder="e.g. 12, Gandhi Nagar, Near City Hospital" className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" {...emergencyForm.register("address")} />
                        </div>
                        {errs.address && <p className="text-sm text-red-500 font-bold mt-1">{errs.address.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-1">
                        <Label className="text-sm font-semibold text-gray-700">Pincode *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within/field:text-orange-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <Input placeholder="e.g. 641035" maxLength={6} className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm" {...emergencyForm.register("pincode")} />
                        </div>
                        {errs.pincode && <p className="text-sm text-red-500 font-bold mt-1">{errs.pincode.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-1">
                        <Label className="text-sm font-semibold text-gray-700">State *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10 group-focus-within/field:text-orange-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <Select
                            onValueChange={(val) => {
                              handleStateSelect(val);
                            }}
                            value={emergencyForm.watch("state")}
                          >
                            <SelectTrigger className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm">
                              <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150 max-h-60">
                              {DISPLAY_STATES.map(sName => (
                                <SelectItem key={sName} value={sName} className="text-base py-2 font-medium">{sName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {errs.state && <p className="text-sm text-red-500 font-bold mt-1">{errs.state.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-1">
                        <Label className="text-sm font-semibold text-gray-700">District *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10 group-focus-within/field:text-orange-500 transition-colors">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <Select
                            disabled={!emergencySelectedState}
                            onValueChange={(val) => emergencyForm.setValue("district", val, { shouldValidate: true })}
                            value={emergencyForm.watch("district")}
                          >
                            <SelectTrigger className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base disabled:opacity-50 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm">
                              <SelectValue placeholder="Select District" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150 max-h-60">
                              {emergencyDistricts.map(d => <SelectItem key={d} value={d} className="text-base py-2">{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {errs.district && <p className="text-sm text-red-500 font-bold mt-1">{errs.district.message}</p>}
                      </div>

                      <div className="space-y-3 md:col-span-2">
                        <Label className="text-sm font-semibold text-gray-700">Nearest Hospital Unit *</Label>
                        <div className="relative group/field">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 z-10 group-focus-within/field:text-orange-500 transition-colors">
                            <Hospital className="h-5 w-5" />
                          </div>
                          <Select
                            onValueChange={(val) => emergencyForm.setValue("unitId", Number(val), { shouldValidate: true })}
                            value={emergencyForm.watch("unitId")?.toString() || ""}
                          >
                            <SelectTrigger className="pl-11 h-12 rounded-xl border-gray-200 bg-white text-base focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm">
                              <SelectValue placeholder="Select nearest branch" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-150">
                              {emergencyFilteredUnits.map(u => <SelectItem key={u.id} value={u.id.toString()} className="text-base py-2">{u.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        {errs.unitId && <p className="text-sm text-red-500 font-bold mt-1">{errs.unitId.message}</p>}
                        
                        {emergencySelectedState && isOutOfRegionState(emergencySelectedState) ? (
                          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-5 flex gap-4 text-left shadow-sm animate-fadeIn">
                            <AlertCircle className="h-6 w-6 text-orange-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-black uppercase tracking-wider text-orange-800">Branch Not Present In This State</p>
                              <p className="text-base text-orange-950 font-bold mt-1 leading-relaxed">
                                We will route your request directly to our <strong>Head Quarters</strong>.
                              </p>
                              <p className="text-sm text-orange-800 font-medium mt-1 leading-relaxed">
                                We will coordinate with local partner eye banks to assist you immediately.
                              </p>
                            </div>
                          </div>
                        ) : assignedUnit ? (
                          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4 text-left shadow-sm animate-fadeIn">
                            <Hospital className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-black uppercase tracking-wider text-emerald-800">Nearest Branch Assigned</p>
                              <p className="text-base font-extrabold text-emerald-950 mt-1">{assignedUnit.name}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="pt-6 pb-2">
                    <Button type="submit" disabled={submitCall.isPending} className="w-full h-14 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-orange-500/20 border-0 text-lg font-bold tracking-wide flex items-center justify-center gap-3 transition-all cursor-pointer hover:scale-[1.01]">
                      {submitCall.isPending ? "Submitting Request..." : <><Send size={20} /> Submit & Request Callback</>}
                    </Button>
                    <p className="text-center text-sm font-bold text-gray-400 mt-4">
                      A representative will call you back immediately upon submission.
                    </p>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
            )}

            {/* PLEDGE EYE CTA */}
            <div className="mt-12 text-center flex flex-col items-center">
              <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-4">Want to become a sight ambassador?</p>
              <Link href="/donate?intent=pledge">
                <button className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] p-[2px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0">
                  <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] rounded-[14px] px-10 py-5 text-white">
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-[14px]" />
                    <Award className="h-7 w-7 z-10" />
                    <span className="text-xl font-extrabold z-10 tracking-tight">Pledge Your Eyes</span>
                    <ArrowRight className="h-6 w-6 z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </button>
              </Link>
            </div>

            {/* Stats strip */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
                hidden: {}
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mt-16 w-full max-w-4xl border-t border-gray-200/60 pt-10"
            >
              {[
                { label: "Sight Restored", value: "2 Lives", icon: <Eye className="h-5 w-5 text-orange-500" /> },
                { label: "Critical Window", value: "6 Hours", icon: <Clock className="h-5 w-5 text-red-500" /> },
                { label: "Pledgers", value: "1 Lakh+", icon: <Users className="h-5 w-5 text-orange-500" /> },
                { label: "Retrieval Time", value: "20 Mins", icon: <Heart className="h-5 w-5 text-orange-500" /> },
              ].map((s) => (
                <motion.div 
                  key={s.label} 
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 12 } }
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-orange-50 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-1 group-hover:shadow-md group-hover:border-orange-100 transition-all duration-300">
                    {s.icon}
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-extrabold text-gray-900 group-hover:text-orange-500 transition-colors duration-300">{s.value}</span>
                    <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-gray-700 transition-colors duration-300">{s.label}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* ── BELOW FOLD: Guidelines ──────────────────────────── */}
      <section className="w-full bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">
              Essential <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7a18] to-[#ff9f43]">Guidelines</span>
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto font-medium">
              Important clinical instructions that every family must know when considering eye donation.
            </p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {[
              {
                icon: <ShieldAlert size={22} className="text-orange-600" />, bg: "bg-orange-50", border: "border-orange-100", color: "from-orange-500 to-orange-400",
                title: "Switch Off Fans", desc: "Turn off all ceiling fans in the room the moment death occurs. Switch on AC if available."
              },
              {
                icon: <CheckCircle2 size={22} className="text-green-600" />, bg: "bg-green-50", border: "border-green-100", color: "from-green-500 to-emerald-400",
                title: "Close Eyes & Wet Cotton", desc: "Gently close the deceased's eyes and place clean, wet cotton pads over the closed eyelids."
              },
              {
                icon: <Info size={22} className="text-blue-600" />, bg: "bg-blue-50", border: "border-blue-100", color: "from-blue-500 to-blue-400",
                title: "Age, Sex & Religion", desc: "Anyone can donate eyes regardless of age, sex, blood group, or religion."
              },
              {
                icon: <Sparkles size={22} className="text-amber-600" />, bg: "bg-amber-50", border: "border-amber-100", color: "from-amber-500 to-yellow-400",
                title: "Zero Disfigurement", desc: "The surgical retrieval takes only 20 minutes and leaves absolutely no facial disfigurement."
              },
              {
                icon: <Heart size={22} className="text-red-600" />, bg: "bg-red-50", border: "border-red-100", color: "from-red-500 to-red-400",
                title: "Ethical & Free", desc: "Donated eyes are never sold. They are used purely to restore vision free of charge."
              },
              {
                icon: <Eye size={22} className="text-purple-600" />, bg: "bg-purple-50", border: "border-purple-100", color: "from-purple-500 to-purple-400",
                title: "Illuminate Lives", desc: "One donation gives sight to two or more blind individuals through corneal transplantation."
              },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className={`relative bg-white/70 backdrop-blur-xl ${item.border} border rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:shadow-${item.color.split('-')[1]}/10 transition-all duration-300 group overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${item.color} group-hover:w-2.5 transition-all duration-300`} />
                <div className={`${item.bg} h-11 w-11 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>{item.icon}</div>
                <h4 className="font-extrabold text-gray-900 text-[15px] mb-2">{item.title}</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-semibold">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-5 px-4 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
          <Heart className="h-3.5 w-3.5 text-[#ff7a18] fill-[#ff7a18] animate-pulse" />
          Sankara Eye Foundation — India
        </div>
        <p className="text-[10px] text-gray-400 font-bold">
          © {new Date().getFullYear()} Sri Kanchi Kamakoti Medical Trust. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

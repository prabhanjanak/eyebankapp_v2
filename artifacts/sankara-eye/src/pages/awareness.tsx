import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BASE_PATH } from "@/lib/constants";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  Eye, Clock, Heart, Award, ArrowLeft, ArrowRight, ShieldAlert,
  CheckCircle2, AlertOctagon, Activity, FileText, Sparkles, BookOpen, Info, ShieldCheck, Microscope, Phone, Share2, Stethoscope
} from "lucide-react";
import ShareReferModal from "@/components/ShareReferModal";

// CountUp Component for statistics
function CountUp({ to, duration = 2, suffix = "" }: { to: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = to;
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const intervalTime = 30;
    const totalSteps = Math.round(totalMiliseconds / intervalTime);
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [to, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

// Animated Community Connection/Sight-Sharing Network
function SightSharingNetwork() {
  return (
    <div className="relative w-full h-56 bg-gradient-to-b from-emerald-50/20 to-emerald-100/10 rounded-2xl border border-emerald-100/60 overflow-hidden flex items-center justify-center p-4">
      {/* Animated ambient backdrop glows */}
      <div className="absolute w-36 h-36 bg-emerald-300/10 rounded-full blur-2xl animate-pulse" />
      
      <svg className="w-full h-full max-w-[320px]" viewBox="0 0 200 200" fill="none">
        {/* Connection lines with animated dashes representing flowing light */}
        <path d="M40,100 Q100,50 160,100" stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" opacity="0.8">
          <animate attributeName="stroke-dashoffset" values="50;0" dur="4s" repeatCount="indefinite" />
        </path>
        <path d="M40,100 Q100,150 160,100" stroke="#059669" strokeWidth="2" strokeDasharray="8 6" strokeLinecap="round" opacity="0.6">
          <animate attributeName="stroke-dashoffset" values="0;50" dur="5s" repeatCount="indefinite" />
        </path>
        <path d="M100,40 L100,160" stroke="#34d399" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4">
          <animate attributeName="stroke-dashoffset" values="30;0" dur="3s" repeatCount="indefinite" />
        </path>

        {/* Central Pulse/Glow Circle */}
        <circle cx="100" cy="100" r="28" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="2">
          <animate attributeName="r" values="24;30;24" dur="3s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" />
        </circle>
        
        {/* Eye Icon in Center representing Sight */}
        <g transform="translate(88, 88)">
          <path d="M2.5 12C2.5 12 5.5 6 12 6C18.5 6 21.5 12 21.5 12C21.5 12 18.5 18 12 18C5.5 18 2.5 12 2.5 12Z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" stroke="#059669" strokeWidth="2" fill="#34d399">
            <animate attributeName="fill" values="#34d399;#6ee7b7;#34d399" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Floating Nodes */}
        {/* Left Node: Donor */}
        <g transform="translate(30, 90)">
          <circle cx="10" cy="10" r="14" fill="#10b981" />
          <path d="M5,13 C5,9.5 7.5,7 10,7 C12.5,7 15,9.5 15,13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="6" r="2.5" fill="#fff" />
          <animateTransform attributeName="transform" type="translate" values="30 87; 30 93; 30 87" dur="4s" repeatCount="indefinite" />
        </g>

        {/* Right Node: Recipient */}
        <g transform="translate(146, 90)">
          <circle cx="10" cy="10" r="14" fill="#059669" />
          <path d="M5,13 C5,9.5 7.5,7 10,7 C12.5,7 15,9.5 15,13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="6" r="2.5" fill="#fff" />
          <animateTransform attributeName="transform" type="translate" values="146 93; 146 87; 146 93" dur="4.5s" repeatCount="indefinite" />
        </g>
        
        {/* Top Node: Community/Family */}
        <g transform="translate(88, 20)">
          <circle cx="12" cy="12" r="12" fill="#34d399" />
          <path d="M8,15 Q12,11 16,15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="8" r="2" fill="#fff" />
          <animateTransform attributeName="transform" type="translate" values="88 18; 88 22; 88 18" dur="3.5s" repeatCount="indefinite" />
        </g>
      </svg>
    </div>
  );
}

// Animated Protection Scanner / Medical Warning Shield
function MedicalShieldScanner() {
  return (
    <div className="relative w-full h-56 bg-gradient-to-b from-rose-50/20 to-rose-100/10 rounded-2xl border border-rose-100/60 overflow-hidden flex items-center justify-center p-4">
      {/* Animated ambient backdrop warning glows */}
      <div className="absolute w-36 h-36 bg-rose-400/5 rounded-full blur-2xl animate-pulse" />
      
      <svg className="w-full h-full max-w-[320px]" viewBox="0 0 200 200" fill="none">
        {/* Warning Rings */}
        <circle cx="100" cy="100" r="50" stroke="#fecdd3" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="15s" repeatCount="indefinite" />
        </circle>

        {/* Shield Path */}
        <path d="M100,50 C125,50 145,58 145,58 C145,58 145,110 100,150 C55,110 55,58 55,58 C55,58 75,50 100,50 Z" stroke="#e11d48" strokeWidth="3.5" fill="#fff1f2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          <animate attributeName="stroke-opacity" values="0.9;0.5;0.9" dur="2.5s" repeatCount="indefinite" />
        </path>

        {/* Inner Warning Icon */}
        <g transform="translate(85, 78)">
          <path d="M15,5 L27,26 L3,26 Z" stroke="#e11d48" strokeWidth="2.5" strokeLinejoin="round" fill="#ffe4e6" />
          <line x1="15" y1="12" x2="15" y2="19" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="15" cy="23" r="1.25" fill="#e11d48" />
          <animateTransform attributeName="transform" type="translate" values="0 -1; 0 1; 0 -1" dur="2s" repeatCount="indefinite" />
        </g>

        {/* Scanning Laser Line Sweep */}
        <g>
          <line x1="45" y1="60" x2="155" y2="60" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" filter="drop-shadow(0px 0px 4px rgba(244,63,94,0.8))">
            <animate attributeName="y1" values="60;140;60" dur="4s" repeatCount="indefinite" />
            <animate attributeName="y2" values="60;140;60" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;1;0.8" dur="4s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Floating Barrier Particles */}
        <circle cx="65" cy="130" r="3" fill="#fb7185">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="135" cy="70" r="2.5" fill="#fda4af">
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

export default function Awareness() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [lastScrollY, setLastScrollY] = useState(0);
  const [navVisible, setNavVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen w-full bg-[#FCFBF9] font-sans select-none overflow-x-hidden text-slate-800 relative">
      
      {/* Scroll Progress Bar */}
      <motion.div 
        style={{ scaleX }} 
        className="fixed top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 origin-left z-55"
      />

      {/* Elegant Ambient Background Blobs (Light Mode) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] bg-orange-100/40 rounded-full blur-[130px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] bg-amber-100/30 rounded-full blur-[150px] animate-pulse duration-[10000ms]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] bg-sky-100/20 rounded-full blur-[120px]" />
      </div>

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      {navVisible && (
        <header className="h-16 md:h-20 border-b border-orange-100/45 flex items-center justify-between px-3 sm:px-6 md:px-12 bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-sm transition-all duration-300">
          <Link href="/">
            <a className="cursor-pointer hover:scale-[1.02] transition-transform flex items-center shrink-0">
              <img src={`${BASE_PATH}/logo.png`} alt="Sankara Eye Foundation" className="h-8 sm:h-10 md:h-12 w-auto object-contain" />
            </a>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ShareReferModal />
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-655 hover:text-slate-900 hover:bg-slate-100 rounded-xl h-8 sm:h-9 text-xs font-semibold gap-1 sm:gap-1.5 cursor-pointer px-2 sm:px-3">
                <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Back to </span>Home
              </Button>
            </Link>
            <Link href="/donate?intent=pledge">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-black px-3 sm:px-5 py-1.5 sm:py-2.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer hover:scale-[1.02] border-0">
                <span className="hidden sm:inline">Pledge </span>Eyes Now
              </Button>
            </Link>
          </div>
        </header>
      )}

      {/* ── CINEMATIC HERO SECTION ───────────────────────────────────────── */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-28 pb-16 overflow-hidden bg-gradient-to-b from-orange-50/20 via-white to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(#ff7a1805_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-80" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 border border-orange-200/50 px-4 py-1.5 rounded-full text-xs font-black text-orange-700 uppercase tracking-widest shadow-sm">
              <Sparkles className="h-4 w-4 text-orange-600 animate-pulse" /> A Legacy of Light
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] font-['Outfit'] text-slate-900">
                Your Eyes Can Be <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">
                  Someone's Tomorrow
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 font-semibold leading-relaxed max-w-xl">
                By donating your eyes, you leave a legacy that outlasts time—letting your final act of kindness restore vision to two or more blind individuals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/donate?intent=emergency">
                <Button className="h-14 px-8 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-lg shadow-red-500/20 text-base tracking-wide flex items-center justify-center gap-2.5 cursor-pointer transition-transform hover:scale-[1.02] border-0">
                  <Activity className="h-5 w-5 animate-pulse" /> Emergency Death Report
                </Button>
              </Link>
              <Link href="/donate?intent=pledge">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-orange-200 hover:border-orange-300 text-orange-700 hover:bg-orange-50 font-bold text-base tracking-wide flex items-center justify-center gap-2.5 cursor-pointer transition-transform hover:scale-[1.02]">
                  <Award className="h-5 w-5" /> Pledge Your Eyes
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="lg:col-span-5 flex justify-center w-full"
          >
            {/* Elegant Hero Image Frame containing the real human awareness photo */}
            <div className="bg-white p-3.5 rounded-3xl border border-orange-100 w-full max-w-lg shadow-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
              <img 
                src={`${BASE_PATH}/awareness/eye_donation_hero.jpg`} 
                alt="Corneal Blindness and the Hope of Eye Donation" 
                className="w-full h-auto aspect-[16/9] object-cover rounded-2xl group-hover:scale-[1.02] transition-transform duration-700 shadow-md"
              />
              <div className="bg-orange-50/80 border border-orange-100 p-4 rounded-2xl shadow-xs text-center mt-3">
                <p className="text-sm font-black text-orange-800 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                  <Heart className="h-4.5 w-4.5 text-orange-600 fill-orange-500" /> A Real Chance at Sight
                </p>
                <p className="text-xs font-semibold text-slate-655 leading-relaxed">
                  Corneal blindness keeps over 10 million in darkness. Your one noble decision to donate can restore vision and dignity to two waiting lives.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-slate-400">
          <span className="text-[10px] font-black uppercase tracking-widest">Scroll to Learn</span>
          <motion.div 
            animate={{ y: [0, 6, 0] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-7 w-4 rounded-full border border-slate-350 flex justify-center p-1"
          >
            <div className="h-1.5 w-1 bg-slate-400 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ── STATS & BURDEN (PARALLAX & STAGGERED REVEALS) ─────────────────── */}
      <section className="py-24 bg-white border-t border-b border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              A World Waiting for Light
            </h2>
            <p className="text-slate-600 font-semibold text-base md:text-lg max-w-2xl mx-auto">
              Behind the dry numbers are real human lives: grandparents wishing to see their families, children hoping to play, and students dreaming of tomorrow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              { to: 90, suffix: "%", title: "Developing World", desc: "Of visually impaired people reside in developing countries." },
              { to: 80, suffix: "%", title: "Treatable Cases", desc: "Of all global blindness can be prevented or treated." },
              { to: 12, suffix: " Lakhs+", title: "Corneal Blindness", desc: "People in India live with bilateral corneal blindness." },
              { to: 25000, suffix: "+", title: "New Cases Yearly", desc: "New cases of corneal blindness arise annually in India." }
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="bg-[#FCFBF9] border border-orange-100/50 rounded-3xl p-8 hover:border-orange-500/20 hover:bg-orange-50/20 transition-all duration-300 relative group shadow-sm hover:shadow-md"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-3xl scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <h3 className="text-4xl md:text-5xl font-black text-slate-900 font-['Outfit'] mb-2 tracking-tight">
                  <CountUp to={stat.to} suffix={stat.suffix} />
                </h3>
                <h4 className="font-extrabold text-orange-655 text-sm uppercase tracking-wider mb-2">{stat.title}</h4>
                <p className="text-slate-500 text-xs font-semibold leading-relaxed">{stat.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Global Burden Panel */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-[#FCFBF9] border border-orange-100/50 rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-orange-200"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Activity className="h-4 w-4" /> Global Scenario
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-['Outfit']">Preventable Shadows</h3>
                <p className="text-slate-655 font-semibold text-sm leading-relaxed">
                  Blindness is not just a health issue; it limits livelihoods. WHO estimates that <strong>80% of blindness is preventable or curable</strong>. Corneal blindness is one of the most treatable forms through transplants.
                </p>
                <ul className="space-y-3.5 text-slate-600 font-semibold text-xs md:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>Corneal blindness constitutes 5% of all blindness cases globally.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>Eye transplantation is highly successful, restoring sight almost immediately.</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* India Burden Panel */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-[#FCFBF9] border border-orange-100/50 rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-orange-200"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  <BookOpen className="h-4 w-4" /> National Burden
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 font-['Outfit']">Restoring India's Sight</h3>
                <p className="text-slate-655 font-semibold text-sm leading-relaxed">
                  Over <strong>10 million citizens</strong> in India suffer from corneal blindness or related unilateral impairment. Annually, 20,000–25,000 new cases are diagnosed, mostly affecting young adults and children.
                </p>
                <ul className="space-y-3.5 text-slate-600 font-semibold text-xs md:text-sm">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>Corneal scarring represents 8% of all blindness in adults over 50.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4.5 w-4.5 text-orange-600 shrink-0 mt-0.5" />
                    <span>Pledging is an act of patriotism and humanity that brings light back home.</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CAUSES OF CORNEAL BLINDNESS ───────────────────────────────────── */}
      <section className="py-24 bg-[#FCFBF9] border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 space-y-8"
            >
              <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-100 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" /> Medical Insights
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight font-['Outfit']">
                Why Does Corneal Blindness Happen?
              </h2>
              <p className="text-slate-600 font-semibold leading-relaxed text-sm md:text-base">
                The cornea is the eye's outer window. When damaged, it becomes cloudy and scars over, blocking out light. The main causes include:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { title: "Keratoconus", desc: "A progressive thinning that bulges the cornea into a cone." },
                  { title: "Infections", desc: "Corneal ulcers caused by bacteria, fungi, or viruses." },
                  { title: "Genetic Diseases", desc: "Inherited disorders causing corneal cloudiness." },
                  { title: "Eye Trauma", desc: "Accidents, burns, or physical injuries to the eye surface." }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-orange-100/55 p-5 rounded-2xl hover:border-orange-400 transition-all shadow-sm group">
                    <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 w-full space-y-6"
            >
              {/* Premium Clinical Pathology & Photographic Case Showcase */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-orange-100/80 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-orange-100/60 pb-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <h3 className="text-base md:text-lg font-black text-slate-900 font-['Outfit']">
                        Clinical Pathology Archive
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Actual clinical cases of severe corneal opacification and dystrophy
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-widest bg-orange-100/70 text-orange-800 px-3 py-1 rounded-full border border-orange-200/50">
                    Verified Medical Data
                  </span>
                </div>

                {/* Grid of the 2 Real Clinical Eye Case Photos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="group relative rounded-2xl overflow-hidden border border-orange-100 bg-slate-950/5 p-2 shadow-xs transition-all hover:border-orange-300">
                    <div className="overflow-hidden rounded-xl bg-black aspect-[4/3] flex items-center justify-center">
                      <img 
                        src={`${BASE_PATH}/awareness/cornea_opacification_1.jpg`} 
                        alt="Clinical Case 1 - Severe Microbial Keratitis & Corneal Opacity" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="pt-2 px-1 pb-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Case A: Corneal Ulceration</span>
                        <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-black uppercase">Infectious</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                        Dense white scar tissue covering the optical axis, obstructing light transmission.
                      </p>
                    </div>
                  </div>

                  <div className="group relative rounded-2xl overflow-hidden border border-orange-100 bg-slate-950/5 p-2 shadow-xs transition-all hover:border-orange-300">
                    <div className="overflow-hidden rounded-xl bg-black aspect-[4/3] flex items-center justify-center">
                      <img 
                        src={`${BASE_PATH}/awareness/cornea_opacification_2.jpg`} 
                        alt="Clinical Case 2 - Advanced Keratoconus & Corneal Dystrophy" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="pt-2 px-1 pb-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Case B: Keratoconus / Dystrophy</span>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-black uppercase">Structural</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                        Severe corneal thinning with cone-like distortion and loss of optical clarity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pathological Etiology Breakdown Cards */}
                <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/40 to-orange-50/80 border border-orange-100/70 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Microscope className="h-4 w-4 text-orange-600" />
                    <h4 className="text-xs font-extrabold text-orange-950 uppercase tracking-wider">
                      Transplantation Is The Curative Solution
                    </h4>
                  </div>
                  <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                    In all these severe pathologies, standard corrective lenses or medication cannot restore vision. <strong className="text-slate-900 font-bold">Keratoplasty (Corneal Transplant)</strong> using healthy donor tissue is the only proven method to give sight back.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── ELIGIBILITY GUIDE (WHO CAN vs WHO CANNOT DONATE) ───────────────── */}
      <section className="py-24 bg-white border-b border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              Sharing the Light: Eligibility
            </h2>
            <p className="text-slate-600 font-semibold text-base md:text-lg max-w-2xl mx-auto">
              Most individuals are eligible to donate. Learn who can step forward and what medical safeguards are maintained.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Who Can Donate */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-emerald-50/30 border border-emerald-100 rounded-3xl p-8 flex flex-col justify-between hover:border-emerald-200 transition-colors shadow-sm"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" /> Eligible Donors
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Outfit']">Who Can Donate?</h3>
                <p className="text-slate-600 font-semibold text-sm">
                  Eye donation is highly inclusive. Do not let false assumptions prevent you or your family from gifting sight:
                </p>
                <div className="space-y-3 font-medium">
                  {[
                    "All Ages: From infants to senior citizens, the gift of sight is possible.",
                    "Spectacles or cataracts surgery do not affect corneal transplant suitability.",
                    "Common illnesses like Diabetes, Asthma, or Hypertension are fully eligible.",
                    "Even donors with poor eyesight or color blindness are eligible."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white border border-emerald-100 p-4 rounded-xl shadow-xs">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm font-semibold">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom animated network graphic */}
              <div className="mt-8">
                <SightSharingNetwork />
              </div>
            </motion.div>

            {/* Who Cannot Donate */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="bg-rose-50/30 border border-rose-100 rounded-3xl p-8 flex flex-col justify-between hover:border-rose-200 transition-colors shadow-sm"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 border border-rose-200/50 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  <AlertOctagon className="h-4 w-4 text-rose-700" /> Contraindications
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Outfit']">Who Cannot Donate?</h3>
                <p className="text-slate-600 font-semibold text-sm">
                  To protect corneal recipients from potential disease transmission, donors with the following conditions are excluded:
                </p>
                <div className="space-y-3 font-medium">
                  {[
                    "HIV / AIDS or active serological infectious status.",
                    "Rabies (active or previous history of the disease).",
                    "Active Septicemia (serious bloodstream infection).",
                    "Communicable neurological diseases (Meningitis, Encephalitis)."
                  ].map((text, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white border border-rose-100 p-4 rounded-xl shadow-xs">
                      <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm font-semibold">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom animated shield scanner graphic */}
              <div className="mt-8">
                <MedicalShieldScanner />
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── DO'S AND DON'TS (STORY-DRIVEN COMPARISON) ──────────────────────── */}
      <section className="py-24 bg-[#FCFBF9] border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              Preserving the Promise: Action Checklist
            </h2>
            <p className="text-slate-600 font-semibold text-base md:text-lg max-w-2xl mx-auto">
              In the quiet hours after a loved one passes, swift actions ensure their gift of sight is preserved successfully.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* The Do's */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white border border-emerald-100 rounded-3xl p-6 md:p-8 hover:border-emerald-300 transition-colors shadow-sm"
            >
              <h3 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-6 font-['Outfit']">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" /> Actions to Take (Do's)
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Contact immediately", text: "Alert the eye bank within 4–6 hours of death. Time is of the essence." },
                  { title: "Close the eyelids", text: "Gently pull down the eyelids of the deceased to keep the eyes closed." },
                  { title: "Keep moist", text: "Place a clean, damp cloth over the closed eyelids to prevent dry air damage." },
                  { title: "Raise the head", text: "Place a pillow to raise the head by about 6 inches, reducing potential swelling." },
                  { title: "Turn off fans", text: "Switch off ceiling fans directly overhead to protect corneal moisture." },
                  { title: "Medical history", text: "Be honest about the deceased's medical history during calls." },
                  { title: "Safe retrieval", text: "Allow technicians to carry out the sterile surgical retrieval process." },
                  { title: "Consent support", text: "Ensure family members sign authorization forms quickly." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-black rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm capitalize">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* The Don'ts */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white border border-rose-100 rounded-3xl p-6 md:p-8 hover:border-rose-300 transition-colors shadow-sm"
            >
              <h3 className="text-xl font-bold text-rose-700 flex items-center gap-2 mb-6 font-['Outfit']">
                <AlertOctagon className="h-6 w-6 text-rose-600" /> Actions to Avoid (Don'ts)
              </h3>
              <div className="space-y-4">
                {[
                  { title: "Do not delay", text: "Do not delay calling. Corneas deteriorate quickly if left uncollected past 6 hours." },
                  { title: "No ice directly", text: "Avoid putting ice or ice water directly on the eyes as this ruins cell viability." },
                  { title: "No drops or ointments", text: "Do not apply any medicine, drops, or remedies unless told by a physician." },
                  { title: "Avoid rubbing", text: "Do not press, rub, or keep the eyes open, which dries and damages the tissue." },
                  { title: "Do not assume refusal", text: "Do not pre-determine disqualification based on cataracts or glasses." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 border-b border-slate-100 pb-3.5 last:border-b-0 last:pb-0">
                    <span className="bg-rose-50 text-rose-700 text-xs font-black rounded-full h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm capitalize">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5 leading-relaxed">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CLINICAL RETRIEVAL PROCEDURES (CLEAN DYNAMIC STEPS) ───────────── */}
      <section className="py-24 bg-white border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-orange-100/80 text-orange-800 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              <Stethoscope className="h-4 w-4 text-orange-600" /> Surgical Standards & Protocols
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">
              The Two Medical Retrieval Procedures
            </h2>
            <p className="text-slate-655 font-semibold text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Eye retrieval is a gentle, sterile 15–20 minute surgical process performed by trained eye bank doctors. <strong>It causes zero facial disfigurement or visible changes.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
            
            {/* Procedure 1: In-Situ Corneoscleral Button Excision */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-[#FCFBF9] border border-orange-200/70 rounded-3xl p-7 md:p-9 flex flex-col justify-between shadow-md hover:border-orange-300 transition-all"
            >
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                    <Microscope className="h-4 w-4" /> Procedure 1
                  </div>
                  <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Most Preferred Modern Technique
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                    In-Situ Corneoscleral Excision
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mt-2">
                    Only the clear transparent cornea (the front eye button) with a 2–3mm scleral rim is excised. The natural eyeball remains completely intact in the eye socket.
                  </p>
                </div>

                {/* Clean Clinical Steps UI */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-orange-700 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-orange-500" /> Surgical Sequence:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { step: "01", title: "Sterilization & Exposure", desc: "Sterile saline and povidone-iodine ocular antisepsis with speculum insertion." },
                      { step: "02", title: "Circumferential Incision", desc: "Careful 360° scleral incision made 2–3mm posterior to the limbal margin." },
                      { step: "03", title: "Tissue Separation", desc: "Gentle excision of the corneoscleral disc without disturbing inner structures." },
                      { step: "04", title: "Cornisol / MK Medium", desc: "Immediate immersion in sterile nutrient preservation solution at 4°C." }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white border border-orange-100 p-4 rounded-2xl shadow-xs hover:border-orange-300 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-orange-100 text-orange-800 font-black text-[11px] px-2 py-0.5 rounded-lg">
                            {item.step}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-900">{item.title}</h4>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-orange-100/70 flex items-center justify-between text-xs font-bold text-orange-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-orange-600" /> Duration: 15–20 Minutes
                </span>
                <span className="bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl text-[11px]">
                  Performed On-Site (Home / Hospital)
                </span>
              </div>
            </motion.div>

            {/* Procedure 2: Whole Globe Enucleation */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="bg-[#FCFBF9] border border-sky-200/70 rounded-3xl p-7 md:p-9 flex flex-col justify-between shadow-md hover:border-sky-300 transition-all"
            >
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 bg-sky-600 text-white px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                    <FileText className="h-4 w-4" /> Procedure 2
                  </div>
                  <span className="text-[11px] font-extrabold bg-sky-100 text-sky-800 px-3 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> Complete Laboratory Evaluation
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-['Outfit']">
                    Whole Globe Enucleation
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mt-2">
                    The intact eyeball is retrieved for sterile dissection in eye bank laboratory laminar flow hoods. A medical prosthetic conformer is placed to preserve natural appearance.
                  </p>
                </div>

                {/* Clean Clinical Steps UI */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-sky-700 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-sky-600" /> Surgical Sequence:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { step: "01", title: "Peritomy & Dissection", desc: "360° conjunctival peritomy and extraocular rectus muscle isolation." },
                      { step: "02", title: "Optic Nerve Transection", desc: "Gentle nerve clamping and clean posterior surgical transection." },
                      { step: "03", title: "Moist Chamber Transport", desc: "Eyeball placed in a sterile refrigerated moist container at 4°C." },
                      { step: "04", title: "Conformer Placement", desc: "Medical prosthetic conformer placed behind eyelids for natural facial contour." }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-white border border-sky-100 p-4 rounded-2xl shadow-xs hover:border-sky-300 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-sky-100 text-sky-800 font-black text-[11px] px-2 py-0.5 rounded-lg">
                            {item.step}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-900">{item.title}</h4>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-sky-100/70 flex items-center justify-between text-xs font-bold text-sky-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-sky-600" /> Duration: 20–25 Minutes
                </span>
                <span className="bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-xl text-[11px]">
                  100% Cosmetic Integrity Restored
                </span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION SECTION (EMOTIONAL CLOSING) ───────────────────── */}
      <section className="py-24 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 opacity-35 pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black font-['Outfit'] tracking-tight">
            "Do Not Bury, Do Not Burn, Donate Eyes"
          </h2>
          <p className="text-lg md:text-xl font-bold text-orange-50 max-w-2xl mx-auto leading-relaxed">
            Your love can see the world forever. Stand with millions who have chosen to illuminate lives through eye donation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/donate?intent=pledge">
              <Button className="h-16 px-8 rounded-2xl bg-white text-orange-700 font-extrabold hover:bg-orange-50 shadow-xl text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02] border-0">
                <Award className="h-5 w-5" /> Pledge Your Eyes Now
              </Button>
            </Link>
            <Link href="/donate?intent=emergency">
              <Button className="h-16 px-8 rounded-2xl bg-red-650 hover:bg-red-700 border-2 border-white/40 text-white font-extrabold shadow-lg text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]">
                <Activity className="h-5 w-5 animate-pulse" /> Emergency Death Report
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 text-center text-xs font-semibold relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <p>© {new Date().getFullYear()} Sankara Eye Foundation, India. All Rights Reserved.</p>
          <p className="text-slate-500">Official Eye Bank Portal. Providing quality corneal care and sight restoration services.</p>
        </div>
      </footer>

    </div>
  );
}

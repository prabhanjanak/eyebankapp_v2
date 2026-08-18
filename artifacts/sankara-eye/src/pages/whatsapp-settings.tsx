import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, Save, CheckCircle2, Send, Terminal, Loader2, RefreshCw, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { customFetch } from "@workspace/api-client-react";

export default function WhatsAppSettings() {
  const { toast } = useToast();
  const [phoneNumberId, setPhoneNumberId] = useState("475216735670574");
  const [businessAccountId, setBusinessAccountId] = useState("147765438423867");
  const [accessToken, setAccessToken] = useState("EAAZAHgyNtIKcBRZBWtHPngkk4Vvt2pKrZAbzGEqMaJfqKYy5wkSF44Owstkkqn0sQUCZBeWVG4tBbFC8VIyS3qDZAyXPzsB8AFmQeV3fP60rN2ynY1fTX0OG5ZAvJKny8fZAZACYMtLa7u4gML1JMsRn871nHmYcrtJK04BYSVLWgoqBZCzQosb2KZBR56Pe69jZAZCwewZDZD");
  const [templateName, setTemplateName] = useState("hello_world");

  // Test states
  const [testMobile, setTestMobile] = useState("+91 8951568286");
  const [isTesting, setIsTesting] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testStep, setTestStep] = useState(0);

  // Load from backend API Settings and localStorage fallback
  useEffect(() => {
    let savedPhoneId = localStorage.getItem("sefi_wa_phone_id") || "475216735670574";
    let savedBizId = localStorage.getItem("sefi_wa_biz_id") || "147765438423867";
    let savedToken = localStorage.getItem("sefi_wa_token") || "EAAZAHgyNtIKcBRZBWtHPngkk4Vvt2pKrZAbzGEqMaJfqKYy5wkSF44Owstkkqn0sQUCZBeWVG4tBbFC8VIyS3qDZAyXPzsB8AFmQeV3fP60rN2ynY1fTX0OG5ZAvJKny8fZAZACYMtLa7u4gML1JMsRn871nHmYcrtJK04BYSVLWgoqBZCzQosb2KZBR56Pe69jZAZCwewZDZD";
    let savedTemplate = localStorage.getItem("sefi_wa_template") || "hello_world";

    customFetch<any>("/api/settings")
      .then(data => {
        if (data.whatsappPhoneId) savedPhoneId = data.whatsappPhoneId;
        if (data.whatsappBizId) savedBizId = data.whatsappBizId;
        if (data.whatsappToken) savedToken = data.whatsappToken;
        if (data.whatsappTemplate) savedTemplate = data.whatsappTemplate;

        setPhoneNumberId(savedPhoneId);
        setBusinessAccountId(savedBizId);
        setAccessToken(savedToken);
        setTemplateName(savedTemplate);
      })
      .catch(() => {
        setPhoneNumberId(savedPhoneId);
        setBusinessAccountId(savedBizId);
        setAccessToken(savedToken);
        setTemplateName(savedTemplate);
      });
  }, []);

  const handleSave = async () => {
    localStorage.setItem("sefi_wa_phone_id", phoneNumberId);
    localStorage.setItem("sefi_wa_biz_id", businessAccountId);
    localStorage.setItem("sefi_wa_token", accessToken);
    localStorage.setItem("sefi_wa_template", templateName);

    try {
      await customFetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({
          whatsappPhoneId: phoneNumberId,
          whatsappBizId: businessAccountId,
          whatsappToken: accessToken,
          whatsappTemplate: templateName,
        }),
      });
    } catch (e) {
      console.error("Could not sync WhatsApp settings to server:", e);
    }

    toast({
      title: "✅ Configuration Saved",
      description: "WhatsApp Cloud API integration settings stored successfully.",
    });
  };

  const runConnectionTest = async (overrideTemplate?: string) => {
    if (isTesting) return;
    if (!testMobile) {
      toast({ title: "Error", description: "Please enter a test mobile number.", variant: "destructive" });
      return;
    }
    
    const activeTemplate = overrideTemplate || templateName;

    setIsTesting(true);
    setTestLogs([]);
    setTestStep(0);

    const log = (msg: string) => setTestLogs(prev => [...prev, msg]);

    log("🔄 Initializing connection test to Meta Graph API v20.0...");
    log(`🔌 Establishing handshake with Phone Number ID: ${phoneNumberId}...`);
    log("🔑 Validating Permanent System User Access Token authentication...");
    log(`📂 Preparing to dispatch template: "${activeTemplate}"...`);
    
    try {
      const targetPhone = testMobile.replace(/[^0-9]/g, "");
      
      // Build body parameters for variables based on templates
      let templateParams: any[] = [];
      if (activeTemplate === "emergency_death_reporting_confirmation") {
        templateParams = [
          { type: "text", text: "Ramesh Kumar" },
          { type: "text", text: "EC260527" },
          { type: "text", text: "Suresh Kumar" },
          { type: "text", text: "Sankara Eye Hospital Coimbatore" }
        ];
      } else if (activeTemplate === "retrieval_team_transit_alert") {
        templateParams = [
          { type: "text", text: "Sankara Eye Hospital Coimbatore" },
          { type: "text", text: "Suresh Kumar" },
          { type: "text", text: "EC260527" }
        ];
      } else if (activeTemplate === "donation_status_update_alert") {
        templateParams = [
          { type: "text", text: "EC260527" },
          { type: "text", text: "Suresh Kumar" },
          { type: "text", text: "CORNEAS RETRIEVED" }
        ];
      } else if (activeTemplate === "living_eye_pledge_certificate") {
        templateParams = [
          { type: "text", text: "Prabhanjan" },
          { type: "text", text: `${window.location.origin}/api/public/pledges/c/a3fbc91e77d85ea0` }
        ];
      }

      const payload = {
        messaging_product: "whatsapp",
        to: targetPhone,
        type: "template",
        template: {
          name: activeTemplate,
          language: { code: activeTemplate === "hello_world" ? "en_US" : "en" },
          ...(templateParams.length > 0 ? {
            components: [
              {
                type: "body",
                parameters: templateParams
              }
            ]
          } : {})
        }
      };

      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("WhatsApp API Error:", data);
        log(`❌ Handshake FAILED: ${data.error?.message || "Unknown error from Meta Graph API"}`);
        toast({
          title: "Connection Failed",
          description: "Failed to authenticate or send message via Meta Graph API.",
          variant: "destructive"
        });
      } else {
        log("⚡ Meta API accepted the payload. Message queued for delivery!");
        log(`✅ Handshake SUCCESS: Meta WhatsApp API Endpoint verified! Sent template: "${activeTemplate}" 🟢`);
        toast({
          title: "🟢 Connection Verified",
          description: "Meta API integration is fully online. Test message dispatched.",
        });
      }
    } catch (err: any) {
      log(`❌ Network Error: ${err.message || "Could not reach Meta servers"}`);
      toast({
        title: "Network Error",
        description: "Failed to reach WhatsApp Graph API endpoints.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 select-none font-sans">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-[#ff7a18]/10 p-2.5 rounded-2xl text-[#ff7a18] border border-[#ff7a18]/25 shadow-sm">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-['Outfit']">WhatsApp API Setup</h1>
          <p className="text-sm text-gray-500 font-semibold">Configure Meta Cloud credentials for automated coordinator dispatches.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API FORM */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-500 to-emerald-400 opacity-80" />
            <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40">
              <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
                <CheckCircle2 size={18} className="text-green-500" /> Meta API Credentials
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 font-semibold mt-0.5">Automate real-time WhatsApp dispatches when emergency requests come in.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Phone Number ID</Label>
                  <Input 
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">WhatsApp Business Account ID</Label>
                  <Input 
                    value={businessAccountId}
                    onChange={e => setBusinessAccountId(e.target.value)}
                    className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Permanent System Access Token</Label>
                <Input 
                  type="password"
                  value={accessToken}
                  onChange={e => setAccessToken(e.target.value)}
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-mono focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">Generate this permanent credential inside your Facebook Business Suite Manager.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider block font-sans">Emergency Dispatch Template Name</Label>
                <Input 
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent" 
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button 
                  onClick={handleSave}
                  className="bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white rounded-xl h-11 px-6 font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all border-0 cursor-pointer"
                >
                  <Save className="mr-2 h-4.5 w-4.5" /> Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SIMULATION CONSOLE */}
          <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40">
              <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
                <Terminal size={18} className="text-[#ff7a18]" /> Connection Test Sandbox
              </CardTitle>
              <CardDescription className="text-xs text-gray-400 font-semibold mt-0.5">Verify your API endpoints with a simulated Graph handshake.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                <div className="space-y-1 flex-1">
                  <Label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block font-sans">Test Destination Mobile</Label>
                  <Input 
                    value={testMobile}
                    onChange={e => setTestMobile(e.target.value)}
                    placeholder="+91 "
                    className="h-11 rounded-xl bg-white border-gray-250/70 font-semibold text-gray-800 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  />
                </div>
                <Button 
                  onClick={() => runConnectionTest()}
                  disabled={isTesting}
                  variant="outline"
                  className="h-11 rounded-xl px-5 font-bold shadow-sm border-gray-250/75 hover:bg-gray-50 text-gray-700 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? <Loader2 className="h-4 w-4 animate-spin text-[#ff7a18]" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  {isTesting ? "Validating..." : "Ping Handshake"}
                </Button>
              </div>

              {/* Clickable Quick Templates Test Grid */}
              <div className="space-y-2 pt-2 border-t border-gray-150/40">
                <Label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block font-sans">Quick Click Template Dispatches</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => runConnectionTest("hello_world")}
                    disabled={isTesting}
                    className="h-10 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm justify-start px-3.5 border-0 cursor-pointer"
                  >
                    👋 Test "hello_world"
                  </Button>
                  <Button
                    type="button"
                    onClick={() => runConnectionTest("emergency_death_reporting_confirmation")}
                    disabled={isTesting}
                    className="h-10 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 shadow-sm justify-start px-3.5 border-0 cursor-pointer"
                  >
                    🚨 1. Death Reporting Confirmation
                  </Button>
                  <Button
                    type="button"
                    onClick={() => runConnectionTest("retrieval_team_transit_alert")}
                    disabled={isTesting}
                    className="h-10 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 shadow-sm justify-start px-3.5 border-0 cursor-pointer"
                  >
                    🚗 2. Team Dispatched Alert
                  </Button>
                  <Button
                    type="button"
                    onClick={() => runConnectionTest("donation_status_update_alert")}
                    disabled={isTesting}
                    className="h-10 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-sm justify-start px-3.5 border-0 cursor-pointer"
                  >
                    🔄 3. Status Update Alert
                  </Button>
                  <Button
                    type="button"
                    onClick={() => runConnectionTest("living_eye_pledge_certificate")}
                    disabled={isTesting}
                    className="h-10 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 shadow-sm justify-start px-3.5 border-0 cursor-pointer sm:col-span-2"
                  >
                    ✍️ 4. Pledge Certificate Link
                  </Button>
                </div>
              </div>

              {testLogs.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-48 overflow-y-auto mt-2 leading-relaxed shadow-inner">
                  {testLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold shrink-0">&gt;</span>
                      <span className={log.includes("SUCCESS") ? "text-emerald-400 font-semibold" : ""}>{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MOBILE PREVIEW */}
        <div className="space-y-6">
          <Card className="glass-panel border-0 neo-shadow rounded-3xl overflow-hidden flex flex-col h-full">
            <CardHeader className="pb-3 pt-6 bg-gradient-to-b from-gray-50/50 to-white/10 border-b border-gray-150/40 shrink-0">
              <CardTitle className="text-base font-extrabold text-gray-800 flex items-center gap-2 font-['Outfit']">
                <Smartphone size={18} className="text-blue-500" /> Live Message Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex items-center justify-center bg-gray-50/30">
              <div className="w-full max-w-[280px] bg-slate-950 rounded-[38px] p-3 shadow-xl border-4 border-slate-800 relative overflow-hidden aspect-[9/18]">
                {/* Speaker/Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-b-xl z-20 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-800 rounded-full" />
                </div>
                
                {/* Mobile screen */}
                <div className="w-full h-full bg-[#efeae2] rounded-[28px] overflow-hidden flex flex-col pt-4 relative">
                  {/* WhatsApp chat header */}
                  <div className="bg-[#075e54] text-white p-2 flex items-center gap-2 shrink-0 select-none">
                    <div className="w-7 h-7 rounded-full bg-slate-200/20 flex items-center justify-center font-bold text-xs">SE</div>
                    <div>
                      <p className="text-[10px] font-black leading-tight">SEFI Eye Bank Bot</p>
                      <p className="text-[8px] opacity-80 leading-none">Online</p>
                    </div>
                  </div>

                  {/* Chat bubbles */}
                  <div className="flex-1 p-2 overflow-y-auto space-y-3 pt-4 select-none">
                    <div className="bg-white rounded-2xl rounded-tl-none p-2.5 shadow-sm border border-slate-100/70 max-w-[85%] text-[9px] text-gray-800 leading-relaxed relative">
                      🚨 *URGENT: NEW EMERGENCY EYE DONATION* 🚨<br/>
                      *Reference ID:* EC260527<br/>
                      ---------------------------------------------<br/><br/>
                      👤 *DECEASED DETAILS:*<br/>
                      • *Name:* Suresh Kumar<br/>
                      • *Age:* 68 Years<br/>
                      • *Gender:* MALE<br/>
                      • *Time of Death:* 10:30 AM<br/>
                      • *Cause:* Cardiac arrest<br/><br/>
                      📞 *REFERRER CONTACT:*<br/>
                      • *Name:* Ramesh Kumar<br/>
                      • *Relation:* Son<br/>
                      • *Mobile:* +91 9988776655<br/><br/>
                      📍 *COLLECTION ADDRESS:*<br/>
                      • Coimbatore Hub, Tamil Nadu<br/>
                      ---------------------------------------------<br/>
                      ⚠️ *CRITICAL PROTOCOLS:*<br/>
                      1. Switch off ALL ceiling fans.<br/>
                      2. Keep eyelids closed with wet cotton.<br/>
                      <span className="text-[7px] text-gray-400 absolute bottom-1 right-2">12:35 PM</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

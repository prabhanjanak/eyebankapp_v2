import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useListEyeCalls, useUpdateEyeCallStatus, customFetch } from "@workspace/api-client-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Clock,
  AlertCircle,
  Loader2,
  MapPin,
  Volume2,
  CheckCircle2,
  Sparkles,
  Send,
  ShieldCheck,
  Radio,
  Ambulance,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateStatusMutation = useUpdateEyeCallStatus();
  const {
    permission,
    requestBrowserPermission,
    playNotificationSound,
    triggerTestNotification,
  } = useNotifications();

  const [isGenerating, setIsGenerating] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [dissolvingIds, setDissolvingIds] = useState<number[]>([]);

  // Polling every 5 seconds for real-time emergency notifications
  const { data: callsResponse, isLoading } = useListEyeCalls(
    { status: "new", limit: 20 },
    {
      query: {
        queryKey: ["/api/eye-calls", { status: "new", limit: 20 }],
        refetchInterval: 5000,
      },
    }
  );

  const newCalls = callsResponse?.data || [];

  const handleRequestPermission = async () => {
    const res = await requestBrowserPermission();
    if (res === "granted") {
      toast({
        title: "✅ Notifications Allowed",
        description: "You will now receive instant desktop popup alerts even in background tabs!",
      });
      triggerTestNotification("System desktop popup notification is active and working!");
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notification permissions in your browser site settings.",
        variant: "destructive",
      });
    }
  };

  const handleTestSound = () => {
    playNotificationSound();
    toast({
      title: "🔊 Alert Chime Played",
      description: "Dual-sequence emergency siren chime triggered via Web Audio API.",
    });
  };

  const handleGenerate10Dummy = async () => {
    setIsGenerating(true);
    try {
      const res = await customFetch<{ success: boolean; count: number }>("/api/eye-calls/generate-dummy", {
        method: "POST",
      });
      toast({
        title: "🚨 10 Emergency Alerts Dispatched!",
        description: `Successfully inserted ${res.count} realistic emergency eye donation calls.`,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/eye-calls"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch (err: any) {
      toast({
        title: "Dispatch Failed",
        description: err?.message || "Failed to trigger test calls.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDispatchTeam = async (callId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProcessingId(callId);
    try {
      await updateStatusMutation.mutateAsync({
        id: callId,
        data: { status: "team_sent" },
      });
      toast({
        title: "🚑 Coordinator Dispatched!",
        description: "Status changed to Team Sent. WhatsApp/SMS transit notifications triggered.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/eye-calls"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch (err: any) {
      toast({
        title: "Dispatch Update Failed",
        description: err?.message || "Could not update status.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkDone = async (callId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Immediately trigger swipe-out and dissolve animation
    setDissolvingIds((prev) => [...prev, callId]);
    setProcessingId(callId);

    try {
      await updateStatusMutation.mutateAsync({
        id: callId,
        data: { status: "completed" },
      });
      toast({
        title: "✅ Eye Donation Completed!",
        description: "Call marked as Done and dissolved from active radar.",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/eye-calls"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch (err: any) {
      setDissolvingIds((prev) => prev.filter((id) => id !== callId));
      toast({
        title: "Completion Failed",
        description: err?.message || "Could not mark as completed.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const activeCalls = newCalls.filter((c) => !dissolvingIds.includes(c.id));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2.5 rounded-xl relative shadow-sm">
            <Bell className="h-6 w-6 text-[#ff7a18]" />
            {activeCalls.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Active Alerts & Live Radar
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-sm text-gray-500 font-medium">Real-time emergency eye donation alert frequency</p>
          </div>
        </div>

        {/* Live Notification Status */}
        <div className="flex items-center gap-2">
          {permission === "granted" ? (
            <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Desktop Popups Enabled
            </Badge>
          ) : (
            <Button
              onClick={handleRequestPermission}
              size="sm"
              className="bg-gradient-to-r from-[#ff7a18] to-orange-500 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" /> Enable Desktop Popups
            </Button>
          )}
        </div>
      </div>

      {/* Interactive Testing Panel */}
      <Card className="border border-orange-200/80 bg-gradient-to-br from-orange-50/60 via-amber-50/30 to-white backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#ff7a18] animate-pulse" /> Notification & Audio Testing Sandbox
            </h3>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              Test audible hospital alarms, browser popups in background tabs, and generate live emergency data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleTestSound}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-orange-50 border-orange-200 text-orange-700 font-bold rounded-xl text-xs h-9 shadow-xs cursor-pointer"
            >
              <Volume2 className="h-3.5 w-3.5 mr-1 text-[#ff7a18]" /> Test Sound
            </Button>

            <Button
              onClick={() => triggerTestNotification()}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-orange-50 border-orange-200 text-orange-700 font-bold rounded-xl text-xs h-9 shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1 text-[#ff7a18]" /> Test Popup
            </Button>

            <Button
              onClick={handleGenerate10Dummy}
              disabled={isGenerating}
              size="sm"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl text-xs h-9 shadow-sm cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Send 10 Dummy Calls
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Emergency Calls Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 bg-white/70 backdrop-blur-md rounded-3xl border border-gray-200/70 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7a18] mx-auto" />
            <span className="text-xs text-gray-500 font-bold mt-2 block">Scanning radar frequency...</span>
          </div>
        ) : activeCalls && activeCalls.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {activeCalls.map((call) => (
              <motion.div
                key={call.id}
                layout
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  x: 350,
                  opacity: 0,
                  scale: 0.85,
                  filter: "blur(6px)",
                  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                }}
                transition={{ duration: 0.25 }}
              >
                <Card className="border border-red-200/80 shadow-md hover:shadow-lg transition-all duration-300 bg-white/85 backdrop-blur-md rounded-2xl overflow-hidden group select-none">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-400 animate-pulse" />
                  <div className="bg-red-50/40 px-4 py-3 border-b border-red-100/60 flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2 text-red-700 font-black text-xs uppercase tracking-wider font-['Outfit']">
                      <AlertCircle size={16} className="animate-pulse text-red-600" /> Critical Emergency Call: {call.callId}
                    </div>
                    <div className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                      <Clock size={12} /> {formatDistanceToNow(new Date(call.createdAt!), { addSuffix: true })}
                    </div>
                  </div>
                  <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-gray-900 text-sm">{call.donorName}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 text-gray-600">
                          {call.donorAge} yrs • {call.donorGender}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Referrer: <span className="font-semibold text-gray-700">{call.referrerName}</span> ({call.referrerRelationship}) • <span className="font-mono text-gray-700">{call.referrerMobile}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                        <MapPin size={12} className="text-[#ff7a18]" /> Location: {call.district}, {call.state} • Cause: {call.causeOfDeath}
                      </p>
                    </div>

                    {/* Actions: Dispatch Coordinator & Done */}
                    <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
                      <Button
                        size="sm"
                        disabled={processingId === call.id}
                        onClick={(e) => handleDispatchTeam(call.id, e)}
                        className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white font-bold text-xs h-9 px-3.5 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <Ambulance className="h-3.5 w-3.5" /> Dispatch Coordinator
                      </Button>

                      <Button
                        size="sm"
                        disabled={processingId === call.id}
                        onClick={(e) => handleMarkDone(call.id, e)}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5" /> Done
                      </Button>

                      <Link href="/eye-calls">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-gray-600 hover:text-gray-900 border-gray-250 font-bold text-xs h-9 px-3 rounded-xl cursor-pointer"
                        >
                          Details &rarr;
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="bg-white/70 backdrop-blur-md border border-gray-250/70 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center select-none shadow-sm">
            <div className="bg-[#ff7a18]/5 p-4.5 rounded-2xl mb-4 border border-[#ff7a18]/10 text-[#ff7a18] shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 font-['Outfit']">Radar Frequency Clear</h3>
            <p className="text-xs text-gray-400 mt-1.5 max-w-xs font-semibold leading-relaxed">
              No new pending emergency dispatches. Click "Send 10 Dummy Calls" above to test the system live.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

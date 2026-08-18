import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useListEyeCalls } from "@workspace/api-client-react";
import { useAuth } from "./AuthContext";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationContextType {
  hasNewCall: boolean;
  clearNotifications: () => void;
  playNotificationSound: () => void;
  requestBrowserPermission: () => Promise<string>;
  triggerTestNotification: (customText?: string) => void;
  permission: string;
}

const NotificationContext = createContext<NotificationContextType>({
  hasNewCall: false,
  clearNotifications: () => {},
  playNotificationSound: () => {},
  requestBrowserPermission: async () => "default",
  triggerTestNotification: () => {},
  permission: "default",
});

export const useNotifications = () => useContext(NotificationContext);

// Global shared AudioContext reference
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    console.error("AudioContext initialization failed:", e);
    return null;
  }
}

// Crisp Multi-tone Emergency Alert Chime using Web Audio API
export const playNotificationSound = () => {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;

    const playChimeNote = (freq: number, startTime: number, duration: number, gainValue = 0.4) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "triangle"; // richer harmonics than pure sine
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(gainValue, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // First sequence (Urgent ascending chime)
    playChimeNote(659.25, now, 0.25, 0.5);        // E5
    playChimeNote(880.00, now + 0.12, 0.25, 0.5); // A5
    playChimeNote(1046.50, now + 0.24, 0.35, 0.6); // C6
    playChimeNote(1318.51, now + 0.36, 0.5, 0.65); // E6

    // Second echo sequence (0.6s later)
    playChimeNote(880.00, now + 0.65, 0.2, 0.45);  // A5
    playChimeNote(1318.51, now + 0.78, 0.45, 0.6); // E6
  } catch (e) {
    console.error("Audio chime playback failed:", e);
  }
};

// Dynamically draws a red notification badge dot on the favicon
const updateFaviconWithBadge = (hasBadge: boolean) => {
  const favicon = document.getElementById("app-favicon") as HTMLLinkElement;
  if (!favicon) return;

  if (!hasBadge) {
    favicon.href = "/favicon.png";
    return;
  }

  const img = new Image();
  img.src = "/favicon.png";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, 64, 64);
    ctx.beginPath();
    ctx.arc(50, 14, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "#ef4444"; // red-500
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    favicon.href = canvas.toDataURL("image/png");
  };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [hasNewCall, setHasNewCall] = useState(false);
  const [permission, setPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const lastKnownMaxId = useRef<number | null>(null);
  const titleIntervalRef = useRef<any>(null);
  const originalTitleRef = useRef<string>(typeof document !== "undefined" ? document.title : "Sankara Eye Bank");

  // Unlock AudioContext on initial click or keypress
  useEffect(() => {
    const unlockAudio = () => {
      getAudioContext();
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
    };
  }, []);

  // Request browser desktop notification permission
  const requestBrowserPermission = async (): Promise<string> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      return perm;
    } catch (err) {
      console.error("Error requesting browser notification permission:", err);
      return "denied";
    }
  };

  // Start blinking tab title when alert is active and tab is in background
  const startTitleBlink = (alertText: string) => {
    if (titleIntervalRef.current) clearInterval(titleIntervalRef.current);
    let state = false;
    titleIntervalRef.current = setInterval(() => {
      document.title = state ? `🚨 ${alertText}` : `👁️ Sankara Eye Bank Alert`;
      state = !state;
    }, 1000);
  };

  const stopTitleBlink = () => {
    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    document.title = originalTitleRef.current || "Sankara Eye Bank";
  };

  const [activeAlert, setActiveAlert] = useState<{ title: string; body: string; callId?: string } | null>(null);

  // Dispatch System Popup & Mobile Alert
  const showSystemPopupNotification = (title: string, body: string, callId?: string) => {
    // 1. Play Audio Siren/Chime
    playNotificationSound();
    updateFaviconWithBadge(true);
    startTitleBlink("NEW EMERGENCY CALL!");
    setActiveAlert({ title, body, callId });

    // 2. Web Browser Desktop System Notification
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          const n = new Notification(title, {
            body,
            icon: "/favicon.png",
            badge: "/favicon.png",
            tag: callId || `eye-alert-${Date.now()}`,
            requireInteraction: true,
          });

          n.onclick = () => {
            window.focus();
            stopTitleBlink();
            updateFaviconWithBadge(false);
            setActiveAlert(null);
            window.location.href = "/eye-calls";
          };
        } catch (e) {
          console.error("Desktop notification dispatch error:", e);
        }
      } else if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          setPermission(perm);
          if (perm === "granted") {
            new Notification(title, { body, icon: "/favicon.png" });
          }
        }).catch(() => {});
      }
    }

    // 3. Mobile Capacitor Local Notifications
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Math.floor(Math.random() * 100000),
            channelId: "emergency-calls",
            schedule: { at: new Date(Date.now() + 50) },
          },
        ],
      }).catch((err) => console.error("Failed to schedule local notification", err));
    }
  };

  // Poll list of calls every 5 seconds for logged-in coordinators
  const { data } = useListEyeCalls(
    user ? { page: 1, limit: 10 } : undefined,
    {
      query: {
        queryKey: ["/api/eye-calls", user ? { page: 1, limit: 10 } : undefined],
        enabled: !!user,
        refetchInterval: 5000,
      },
    }
  );

  // Initialize Native & Web permissions on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then(setPermission).catch(() => {});
      } else {
        setPermission(Notification.permission);
      }
    }

    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions()
        .then((res) => {
          if (res.display === "granted") {
            LocalNotifications.createChannel({
              id: "emergency-calls",
              name: "Emergency Eye Bank Calls",
              description: "Alerts for new urgent eye bank calls",
              importance: 5,
              sound: "notification.wav",
              visibility: 1,
              vibration: true,
            }).catch((e) => console.error("Create channel error:", e));
          }
        })
        .catch((err) => console.error("LocalNotifications permissions error:", err));
    }

    const onWindowFocus = () => {
      stopTitleBlink();
    };
    window.addEventListener("focus", onWindowFocus);
    return () => {
      window.removeEventListener("focus", onWindowFocus);
      stopTitleBlink();
    };
  }, []);

  // Check for newly created calls
  useEffect(() => {
    const calls = data?.data;
    if (!calls || calls.length === 0) return;

    const maxId = Math.max(...calls.map((item: any) => item.id));

    if (lastKnownMaxId.current === null) {
      lastKnownMaxId.current = maxId;
      return;
    }

    if (maxId > lastKnownMaxId.current) {
      const newCalls = calls.filter((item: any) => item.id > (lastKnownMaxId.current || 0));
      const pendingNewCalls = newCalls.filter((item: any) => item.status === "new");

      if (pendingNewCalls.length > 0) {
        setHasNewCall(true);
        pendingNewCalls.forEach((item: any) => {
          showSystemPopupNotification(
            `🚨 URGENT: Eye Donation Call (${item.callId})`,
            `Donor: ${item.donorName} (${item.donorAge} yrs). Location: ${item.district}, ${item.state}. Referrer: ${item.referrerName} (${item.referrerMobile})`,
            item.callId
          );
        });
      }

      lastKnownMaxId.current = maxId;
    }
  }, [data]);

  const triggerTestNotification = (customText?: string) => {
    setHasNewCall(true);
    showSystemPopupNotification(
      "🚨 TEST POPUP: Urgent Eye Donation Alert",
      customText || "Testing system popup and siren chime! Donor: Ramesh Kumar (68 yrs). Location: Coimbatore, Tamil Nadu. Take action now!",
      `TEST-${Date.now()}`
    );
  };

  const clearNotifications = () => {
    setHasNewCall(false);
    setActiveAlert(null);
    updateFaviconWithBadge(false);
    stopTitleBlink();
  };

  return (
    <NotificationContext.Provider
      value={{
        hasNewCall,
        clearNotifications,
        playNotificationSound,
        requestBrowserPermission,
        triggerTestNotification,
        permission,
      }}
    >
      {children}

      {/* Floating In-App Emergency Alert Toast */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            key={activeAlert.callId || "active-alert"}
            initial={{ opacity: 0, x: 120, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: 280,
              scale: 0.85,
              filter: "blur(6px)",
              transition: { duration: 0.35, ease: "easeInOut" },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 300 }}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80 || info.velocity.x > 500) {
                clearNotifications();
              }
            }}
            className="fixed top-4 right-4 z-50 max-w-md w-full select-none shadow-2xl"
          >
            <div className="bg-white/95 backdrop-blur-lg border-2 border-red-500/80 rounded-2xl p-4 shadow-2xl text-gray-900 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-500 animate-pulse" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                  </span>
                  <h4 className="font-extrabold text-sm text-red-700 tracking-tight font-['Outfit']">
                    {activeAlert.title}
                  </h4>
                </div>
                <button
                  onClick={() => clearNotifications()}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold px-1.5 py-0.5 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-700 font-medium mt-2 leading-relaxed">
                {activeAlert.body}
              </p>
              <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold italic">Swipe right to dismiss &rarr;</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playNotificationSound();
                    }}
                    className="text-[11px] font-bold text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    🔊 Replay
                  </button>
                  <button
                    onClick={() => {
                      clearNotifications();
                      window.location.href = "/eye-calls";
                    }}
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm cursor-pointer"
                  >
                    View Call &rarr;
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

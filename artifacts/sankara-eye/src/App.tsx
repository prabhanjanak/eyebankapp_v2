import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Donate from "@/pages/donate";
import Awareness from "@/pages/awareness";
import Dashboard from "@/pages/dashboard";
import EyeCalls from "./pages/eye-calls";
import Units from "./pages/units";
import Users from "./pages/users";
import Profile from "./pages/profile";
import WhatsAppSettings from "./pages/whatsapp-settings";
import EmailSettings from "./pages/email-settings";
import Notifications from "./pages/notifications";
import AuditLogs from "./pages/audit-logs";
import { PledgesDashboard } from "./pages/pledges";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, Mail, AlertTriangle, KeyRound, LogOut, Fingerprint, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { StatusBar, Style } from "@capacitor/status-bar";
import { motion, AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();
import { BASE_PATH } from "./lib/constants";

function stripBase(path: string): string {
  return BASE_PATH && path.startsWith(BASE_PATH)
    ? path.slice(BASE_PATH.length) || "/"
    : path;
}

function SignInPage() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometryAvailable, setBiometryAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);

  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvasRef.width = window.innerWidth);
    let height = (canvasRef.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    }> = [];

    const colors = ["#ff7a18", "#ff9f43", "#ffedd5", "#f59e0b"];

    // Initialize random floating particles
    const particleCount = Math.min(60, Math.floor((width * height) / 18000));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        size: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvasRef) return;
      width = canvasRef.width = window.innerWidth;
      height = canvasRef.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render links between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 122, 24, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particle kinetics
      particles.forEach((p) => {
        // Gravitational attraction/repulsion to mouse pointer
        if (mouse.x > -1000) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 220) {
            // Stronger pull when mouse gets close to create highly interactive effect
            const force = (220 - dist) / 1000;
            p.vx += (dx / dist) * force * 0.5;
            p.vy += (dy / dist) * force * 0.5;
          }
        }

        // Apply friction (lower friction means particles move faster)
        p.vx *= 0.95;
        p.vy *= 0.95;

        // Apply velocity limits
        const speed = Math.hypot(p.vx, p.vy);
        const maxSpeed = 4.0;
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, [canvasRef]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      BiometricAuth.checkBiometry()
        .then((res) => {
          setBiometryAvailable(res.isAvailable);
          // If enabled, automatically prompt for fingerprint on screen open
          const useBio = localStorage.getItem("use_biometrics") === "true";
          const token = localStorage.getItem("auth_token");
          if (res.isAvailable && useBio && token) {
            // Slight delay so the UI completes transition before fingerprint popup
            setTimeout(() => {
              handleBiometricLogin();
            }, 500);
          }
        })
        .catch((err) => console.error("Biometric check failed:", err));
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (user.mustChangePassword) {
        setLocation("/change-password");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, setLocation]);

  const handleBiometricLogin = async () => {
    try {
      const checkResult = await BiometricAuth.checkBiometry();
      if (!checkResult.isAvailable) {
        setError("Biometric authentication is not set up or available on this device.");
        return;
      }

      await BiometricAuth.authenticate({
        reason: "Log in to Sankara Eye Bank",
        cancelTitle: "Cancel",
      });

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("Please sign in with your email and password first to register biometrics.");
        return;
      }

      setIsLoading(true);
      setError("");
      try {
        const { customFetch } = await import("@workspace/api-client-react");
        const loggedUser = await customFetch<any>("/api/auth/me");
        queryClient.setQueryData(["/api/auth/me"], loggedUser);
        
        if (loggedUser.mustChangePassword) {
          setLocation("/change-password");
        } else {
          setLocation("/dashboard");
        }
      } catch (err: any) {
        console.error("Biometric authentication verify failed:", err);
        setError("Biometric session expired. Please log in with password.");
      } finally {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Biometric auth error:", err);
      setError(err.message || "Biometric authentication failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // 1. Perform password authentication first
      const loggedUser = await login({ email, password });
      
      // 2. If native device and checkbox is enabled, prompt for fingerprint verification to register it
      if (Capacitor.isNativePlatform() && enableBiometric) {
        try {
          await BiometricAuth.authenticate({
            reason: "Confirm fingerprint to register biometric login on this device",
            cancelTitle: "Cancel",
          });
          localStorage.setItem("use_biometrics", "true");
        } catch (bioErr: any) {
          console.error("Biometric registration check failed:", bioErr);
        }
      }
      
      if (loggedUser.mustChangePassword) {
        setLocation("/change-password");
      } else {
        setLocation("/dashboard");
      }
    } catch (err: any) {
      setError(err?.data?.error || err?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100vh] flex-col items-center justify-center bg-gradient-to-br from-orange-50/50 via-white to-orange-100/30 px-4 py-8 gap-4 relative overflow-hidden">
      {/* Interactive Particles Canvas */}
      <canvas
        ref={setCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Ambient Blur Blobs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-200 rounded-full blur-[100px] opacity-40 pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-[440px] flex flex-col items-center gap-2 pb-2 z-10">
        <img
          src={`${BASE_PATH}/logo.png`}
          alt="Sankara Eye Foundation"
          className="w-full max-w-[280px] h-auto object-contain hover:scale-[1.02] transition-transform duration-300"
        />
      </div>

      <Card className="w-full max-w-[440px] rounded-2xl bg-white/80 backdrop-blur-md shadow-xl border border-gray-100 overflow-hidden z-10">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 text-center">
            Sankara Eye Bank Portal
          </CardTitle>
          <CardDescription className="text-gray-500 text-center text-sm">
            Sign in to access coordinator services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3">
              <AlertDescription className="text-sm font-medium leading-snug">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@sankaraeye.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {Capacitor.isNativePlatform() && biometryAvailable && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 select-none">
                  <input
                    id="enableBiometric"
                    type="checkbox"
                    checked={enableBiometric}
                    onChange={(e) => setEnableBiometric(e.target.checked)}
                    className="h-4.5 w-4.5 border-gray-300 rounded text-[#ff7a18] focus:ring-[#ff7a18] focus:ring-opacity-25 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="enableBiometric" className="text-xs font-bold text-gray-500 cursor-pointer">
                    Enable Fingerprint Login next time
                  </label>
                </div>

                <AnimatePresence>
                  {localStorage.getItem("use_biometrics") === "true" && localStorage.getItem("auth_token") && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        transition: { type: "spring", stiffness: 260, damping: 20 }
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={handleBiometricLogin}
                      disabled={isLoading}
                      className="p-2 rounded-full bg-orange-50 text-[#ff7a18] border border-orange-100 shadow-sm hover:bg-orange-100 transition-colors cursor-pointer relative"
                    >
                      <Fingerprint className="h-6 w-6" />
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.1, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 rounded-full bg-[#ff7a18] pointer-events-none"
                      />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}

             <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white font-semibold py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="w-full max-w-[440px] rounded-xl bg-orange-50 border border-orange-100 px-5 py-3 flex items-start gap-3">
        <svg className="mt-0.5 shrink-0 text-orange-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-sm text-orange-800 leading-snug">
          <span className="font-semibold">Hospital Staff Only.</span> Sign in with your registered account. Access is restricted to authorised Sankara Eye Foundation staff.
        </p>
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="text-xs font-extrabold text-gray-500 hover:text-[#ff7a18] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Return to Main Page
        </button>
      </div>
    </div>
  );
}

function ForcedPasswordChangePage() {
  const { user, changePassword, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setLocation("/sign-in");
    } else if (!user.mustChangePassword) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await changePassword({ oldPassword, newPassword });
      toast({
        title: "Success",
        description: "Password updated successfully. Welcome to your portal!",
      });
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err?.data?.error || err?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/sign-in");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gray-50 px-4 gap-4">
      <Card className="w-full max-w-[460px] rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-600 h-5 w-5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-900">Forced Password Change Required</h3>
            <p className="text-xs text-amber-700 mt-0.5 leading-snug">
              For security reasons, all newly created accounts must change their temporary password before continuing.
            </p>
          </div>
        </div>

        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-bold text-gray-900 text-center">
            Set Your Secure Password
          </CardTitle>
          <CardDescription className="text-gray-500 text-center">
            Configure a secure password to activate your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-3">
              <AlertDescription className="text-sm font-medium leading-snug">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword" className="text-sm font-medium text-gray-700">
                Current Password (temporary password)
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </span>
                <Input
                  id="oldPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                New Password (minimum 8 characters)
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter secure password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-900 focus:ring-2 focus:ring-[#ff7a18] focus:border-transparent"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4" />
                Cancel & Sign Out
              </Button>

              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#ff7a18] to-[#ff9f43] hover:from-[#ff9f43] hover:to-[#ffb347] text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (user.mustChangePassword) {
      return <Redirect to="/change-password" />;
    }
    return <Redirect to="/dashboard" />;
  }

  if (Capacitor.isNativePlatform()) {
    return <Redirect to="/sign-in" />;
  }

  return <Home />;
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Checking credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  if (user.mustChangePassword) {
    return <Redirect to="/change-password" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function AuthProviderWithRoutes() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/donate" component={Donate} />
            <Route path="/awareness" component={Awareness} />
            <Route path="/sign-in" component={SignInPage} />
            <Route path="/change-password" component={ForcedPasswordChangePage} />
            
            <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
            <Route path="/eye-calls"><ProtectedRoute component={EyeCalls} /></Route>
            <Route path="/audit-logs"><ProtectedRoute component={AuditLogs} /></Route>
            <Route path="/units"><ProtectedRoute component={Units} /></Route>
            <Route path="/users"><ProtectedRoute component={Users} /></Route>
            <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
            <Route path="/pledges"><ProtectedRoute component={PledgesDashboard} /></Route>
            <Route path="/settings/whatsapp"><ProtectedRoute component={WhatsAppSettings} /></Route>
            <Route path="/settings/email"><ProtectedRoute component={EmailSettings} /></Route>
            <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
            
            <Route component={NotFound} />
          </Switch>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setBackgroundColor({ color: "#000000" })
        .catch(err => console.error("Failed to set status bar color:", err));
      StatusBar.setStyle({ style: Style.Dark }) // Dark style makes status bar text light (white)
        .catch(err => console.error("Failed to set status bar style:", err));
    }
  }, []);

  return (
    <TooltipProvider>
      <WouterRouter base={BASE_PATH}>
        <AuthProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
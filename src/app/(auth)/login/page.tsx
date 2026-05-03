"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, EyeOff, Layers, Loader2 } from "lucide-react";
import { Label } from "@frontend/components/ui/label";
import { cn } from "@shared/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BlueprintBackground } from "@frontend/components/animations/shader-canvas";

// ─── AppInput — glass-styled input with mouse-tracking radial gradient border ─

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional slot rendered at the right edge (e.g. password eye toggle). */
  rightSlot?: React.ReactNode;
}

/**
 * Input field with glass dark styling and a radial gradient that highlights
 * the top/bottom border edges at the cursor's X position while the user hovers.
 */
const AppInput = ({ rightSlot, className, ...props }: AppInputProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={wrapperRef}
      className="w-full relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <input
        className={cn(
          "relative z-10 border border-white/15 h-12 w-full rounded-lg",
          "bg-white/[0.06] px-3 text-sm text-white",
          "outline-none transition-all placeholder:text-white/30",
          "focus:border-blue-400/60 focus:bg-white/[0.09]",
          rightSlot && "pr-10",
          className,
        )}
        {...props}
      />
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 text-white/40 hover:text-white/80 transition-colors">
          {rightSlot}
        </div>
      )}
      {hovering && (
        <>
          <div
            className="absolute pointer-events-none top-0 left-0 right-0 h-[1px] z-20 rounded-t-lg overflow-hidden"
            style={{
              background: `radial-gradient(30px circle at ${mousePos.x}px 0px, rgba(96,165,250,0.8) 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute pointer-events-none bottom-0 left-0 right-0 h-[1px] z-20 rounded-b-lg overflow-hidden"
            style={{
              background: `radial-gradient(30px circle at ${mousePos.x}px 2px, rgba(96,165,250,0.8) 0%, transparent 70%)`,
            }}
          />
        </>
      )}
    </div>
  );
};

// ─── Pupil (no white, just dark dot) ────────────────────────────────────────

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

/** Dark dot pupil that tracks the global mouse cursor position. */
const Pupil = ({
  size = 12,
  maxDistance = 5,
  pupilColor = "#1a1a1a",
  forceLookX,
  forceLookY,
}: PupilProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined)
      return { x: forceLookX, y: forceLookY };
    if (!pupilRef.current) return { x: 0, y: 0 };
    const r = pupilRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

// ─── EyeBall (white with pupil) ──────────────────────────────────────────────

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

/** White eyeball with a mouse-following pupil and optional blink state. */
const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "#1a1a1a",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined)
      return { x: forceLookX, y: forceLookY };
    if (!eyeRef.current) return { x: 0, y: 0 };
    const r = eyeRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

// ─── Dev bootstrap accounts (non-production only) ───────────────────────────

const BOOTSTRAP_ACCOUNTS = [
  { label: "Superadmin", value: "admin@serviceflow.com / local@dm1n123" },
  { label: "Admin", value: "maria@serviceflow.com / admin123" },
  { label: "User", value: "john@serviceflow.com / user123" },
];

// ─── Motion variants ─────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: "easeOut" } },
} as const;

const itemVariants = (delay: number) => ({
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay, ease: "easeOut" } },
} as const);

// ─── Login page ──────────────────────────────────────────────────────────────

/** Premium login page — WebGL2 blueprint shader background, glassmorphism card, character panel. */
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Global mouse position for character body lean
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  // Form panel mouse position for the blob and gradient effect
  const [formMouseX, setFormMouseX] = useState(0);
  const [formMouseY, setFormMouseY] = useState(0);
  const [isFormHovering, setIsFormHovering] = useState(false);

  // Blink state per character
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);

  // Interaction states
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);

  // Character refs for body lean calculation
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  // Global mouse tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Random blink — purple
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          schedule();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  // Random blink — black
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          schedule();
        }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  // Look at each other briefly when user starts typing
  useEffect(() => {
    if (!isTyping) { setIsLookingAtEachOther(false); return; }
    setIsLookingAtEachOther(true);
    const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
    return () => clearTimeout(t);
  }, [isTyping]);

  // Purple sneaky peek when password is visible
  useEffect(() => {
    if (!(password.length > 0 && showPassword)) { setIsPurplePeeking(false); return; }
    const t = setTimeout(() => {
      setIsPurplePeeking(true);
      setTimeout(() => setIsPurplePeeking(false), 800);
    }, Math.random() * 3000 + 2000);
    return () => clearTimeout(t);
  }, [password, showPassword, isPurplePeeking]);

  /** Derives body lean and eye position offsets from mouse delta relative to a character. */
  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const purplePos = calcPos(purpleRef);
  const blackPos = calcPos(blackRef);
  const yellowPos = calcPos(yellowRef);
  const orangePos = calcPos(orangeRef);

  const hidingPassword = isTyping || (password.length > 0 && !showPassword);
  const revealingPassword = password.length > 0 && showPassword;

  /** Tracks mouse position relative to the form panel for the following blob. */
  const handleFormMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFormMouseX(e.clientX - rect.left);
    setFormMouseY(e.clientY - rect.top);
  };

  /** Submits credentials to the NextAuth credentials provider. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setIsLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#050b1a] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
      {/* WebGL2 blueprint grid shader — fixed full-page layer */}
      <BlueprintBackground />

      {/* Animated card entrance */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/60"
      >

        {/* ── Left: characters + branding ─────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-col justify-between bg-blue-950/50 backdrop-blur-md p-12 text-white overflow-hidden">
          {/* Subtle inner gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-950/40 to-transparent pointer-events-none" />

          {/* Logo */}
          <motion.div
            variants={itemVariants(0.15)}
            initial="hidden"
            animate="visible"
            className="relative z-20 flex items-center gap-2 text-lg font-semibold"
          >
            <div className="size-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <Layers className="size-4" />
            </div>
            <span>ServiceFlow</span>
          </motion.div>

          {/* Characters stage — gentle float */}
          <motion.div
            className="relative z-20 flex items-end justify-center h-[500px]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative" style={{ width: "550px", height: "400px" }}>

              {/* Purple tall rectangle — back layer */}
              <div
                ref={purpleRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: "70px",
                  width: "180px",
                  height: hidingPassword ? "440px" : "400px",
                  backgroundColor: "#6C3FF5",
                  borderRadius: "10px 10px 0 0",
                  zIndex: 1,
                  transform: revealingPassword
                    ? "skewX(0deg)"
                    : hidingPassword
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <div
                  className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                  style={{
                    left: revealingPassword ? "20px" : isLookingAtEachOther ? "55px" : `${45 + purplePos.faceX}px`,
                    top: revealingPassword ? "35px" : isLookingAtEachOther ? "65px" : `${40 + purplePos.faceY}px`,
                  }}
                >
                  <EyeBall
                    size={18} pupilSize={7} maxDistance={5}
                    eyeColor="white" pupilColor="#1a1a1a"
                    isBlinking={isPurpleBlinking}
                    forceLookX={revealingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                    forceLookY={revealingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                  />
                  <EyeBall
                    size={18} pupilSize={7} maxDistance={5}
                    eyeColor="white" pupilColor="#1a1a1a"
                    isBlinking={isPurpleBlinking}
                    forceLookX={revealingPassword ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                    forceLookY={revealingPassword ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                  />
                </div>
              </div>

              {/* Black tall rectangle — middle layer */}
              <div
                ref={blackRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: "240px",
                  width: "120px",
                  height: "310px",
                  backgroundColor: "#2D2D2D",
                  borderRadius: "8px 8px 0 0",
                  zIndex: 2,
                  transform: revealingPassword
                    ? "skewX(0deg)"
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : hidingPassword
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <div
                  className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                  style={{
                    left: revealingPassword ? "10px" : isLookingAtEachOther ? "32px" : `${26 + blackPos.faceX}px`,
                    top: revealingPassword ? "28px" : isLookingAtEachOther ? "12px" : `${32 + blackPos.faceY}px`,
                  }}
                >
                  <EyeBall
                    size={16} pupilSize={6} maxDistance={4}
                    eyeColor="white" pupilColor="#1a1a1a"
                    isBlinking={isBlackBlinking}
                    forceLookX={revealingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                    forceLookY={revealingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                  />
                  <EyeBall
                    size={16} pupilSize={6} maxDistance={4}
                    eyeColor="white" pupilColor="#1a1a1a"
                    isBlinking={isBlackBlinking}
                    forceLookX={revealingPassword ? -4 : isLookingAtEachOther ? 0 : undefined}
                    forceLookY={revealingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                  />
                </div>
              </div>

              {/* Orange semi-circle — front left */}
              <div
                ref={orangeRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: "0px",
                  width: "240px",
                  height: "200px",
                  zIndex: 3,
                  backgroundColor: "#FF9B6B",
                  borderRadius: "120px 120px 0 0",
                  transform: revealingPassword ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <div
                  className="absolute flex gap-8 transition-all duration-200 ease-out"
                  style={{
                    left: revealingPassword ? "50px" : `${82 + (orangePos.faceX || 0)}px`,
                    top: revealingPassword ? "85px" : `${90 + (orangePos.faceY || 0)}px`,
                  }}
                >
                  <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a"
                    forceLookX={revealingPassword ? -5 : undefined}
                    forceLookY={revealingPassword ? -4 : undefined}
                  />
                  <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a"
                    forceLookX={revealingPassword ? -5 : undefined}
                    forceLookY={revealingPassword ? -4 : undefined}
                  />
                </div>
              </div>

              {/* Yellow rounded rectangle — front right */}
              <div
                ref={yellowRef}
                className="absolute bottom-0 transition-all duration-700 ease-in-out"
                style={{
                  left: "310px",
                  width: "140px",
                  height: "230px",
                  backgroundColor: "#E8D754",
                  borderRadius: "70px 70px 0 0",
                  zIndex: 4,
                  transform: revealingPassword ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`,
                  transformOrigin: "bottom center",
                }}
              >
                <div
                  className="absolute flex gap-6 transition-all duration-200 ease-out"
                  style={{
                    left: revealingPassword ? "20px" : `${52 + (yellowPos.faceX || 0)}px`,
                    top: revealingPassword ? "35px" : `${40 + (yellowPos.faceY || 0)}px`,
                  }}
                >
                  <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a"
                    forceLookX={revealingPassword ? -5 : undefined}
                    forceLookY={revealingPassword ? -4 : undefined}
                  />
                  <Pupil size={12} maxDistance={5} pupilColor="#1a1a1a"
                    forceLookX={revealingPassword ? -5 : undefined}
                    forceLookY={revealingPassword ? -4 : undefined}
                  />
                </div>
                {/* Mouth */}
                <div
                  className="absolute w-20 h-[4px] rounded-full transition-all duration-200 ease-out"
                  style={{
                    backgroundColor: "#1a1a1a",
                    left: revealingPassword ? "10px" : `${40 + (yellowPos.faceX || 0)}px`,
                    top: revealingPassword ? "88px" : `${88 + (yellowPos.faceY || 0)}px`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={itemVariants(0.3)}
            initial="hidden"
            animate="visible"
            className="relative z-20 flex items-center gap-8 text-sm text-white/40"
          >
            <span className="text-white/25 text-xs">
              © {new Date().getFullYear()} ServiceFlow
            </span>
          </motion.div>
        </div>

        {/* ── Right: login form ────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center p-8 bg-slate-950/70 backdrop-blur-md overflow-hidden"
          onMouseMove={handleFormMouseMove}
          onMouseEnter={() => setIsFormHovering(true)}
          onMouseLeave={() => setIsFormHovering(false)}
        >
          {/* Mouse-following gradient blob */}
          <div
            className={cn(
              "absolute pointer-events-none w-[500px] h-[500px] rounded-full blur-3xl transition-opacity duration-300",
              "bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-violet-500/15",
              isFormHovering ? "opacity-100" : "opacity-0",
            )}
            style={{
              transform: `translate(${formMouseX - 250}px, ${formMouseY - 250}px)`,
              transition: "transform 0.12s ease-out, opacity 0.3s",
            }}
          />

          {/* Animated gradient heading keyframes */}
          <style>{`
            @keyframes sf-gradient-flow {
              0%   { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
          `}</style>

          <div className="relative z-10 w-full max-w-[380px]">
            {/* Mobile logo */}
            <motion.div
              variants={itemVariants(0.1)}
              initial="hidden"
              animate="visible"
              className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12 text-white"
            >
              <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Layers className="size-4" />
              </div>
              <span>ServiceFlow</span>
            </motion.div>

            <motion.div
              variants={itemVariants(0.2)}
              initial="hidden"
              animate="visible"
              className="text-center mb-10"
            >
              <h1
                className="text-3xl font-bold tracking-tight mb-2"
                style={{
                  background: "linear-gradient(90deg, #60a5fa 0%, #a78bfa 40%, #34d399 80%, #60a5fa 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "sf-gradient-flow 4s linear infinite",
                }}
              >
                Welcome back!
              </h1>
              <p className="text-white/50 text-sm">Sign in to your account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
                variants={itemVariants(0.3)}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                <Label htmlFor="email" className="text-sm font-medium text-white/70">Email</Label>
                <AppInput
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                />
              </motion.div>

              <motion.div
                variants={itemVariants(0.38)}
                initial="hidden"
                animate="visible"
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white/70">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <AppInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  }
                />
              </motion.div>

              {/* Error message with shake animation */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key={error}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: [0, -8, 8, -5, 5, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shimmer submit button — blue gradient */}
              <motion.div
                variants={itemVariants(0.46)}
                initial="hidden"
                animate="visible"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "group/button relative w-full h-12 overflow-hidden rounded-lg",
                    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold",
                    "flex items-center justify-center gap-2",
                    "transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/30",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none",
                  )}
                >
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>{isLoading ? "Signing in…" : "Sign in"}</span>
                  {!isLoading && (
                    <div
                      className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-700 group-hover/button:[transform:skew(-13deg)_translateX(100%)]"
                      style={{ transition: "transform 0.7s" }}
                    >
                      <div className="relative h-full w-10 bg-white/25" />
                    </div>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Dev bootstrap accounts — hidden in production */}
            {process.env.NODE_ENV !== "production" && (
              <motion.div
                variants={itemVariants(0.55)}
                initial="hidden"
                animate="visible"
                className="mt-6 p-3.5 bg-white/[0.04] rounded-xl text-xs text-white/30 space-y-1.5 border border-white/[0.08]"
              >
                <p className="font-semibold text-white/50">Local bootstrap accounts</p>
                {BOOTSTRAP_ACCOUNTS.map((account) => (
                  <p key={account.label}>
                    <span className="font-medium text-white/40">{account.label}:</span>{" "}
                    {account.value}
                  </p>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

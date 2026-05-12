"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Eye, Layers, Loader2 } from "lucide-react";
import { Label } from "@frontend/components/ui/label";
import { cn } from "@shared/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FallingPattern } from "@frontend/components/animations/falling-pattern";

// ─── AppInput ────────────────────────────────────────────────────────────────

interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  rightSlot?: React.ReactNode;
}

/** Glass-styled input field. */
const AppInput = ({ rightSlot, className, ...props }: AppInputProps) => (
  <div className="w-full relative">
    <input
      className={cn(
        "relative z-10 border border-white/15 h-12 w-full rounded-lg",
        "bg-white/[0.06] px-3 text-sm text-white",
        "outline-none transition-all placeholder:text-white/30",
        "focus:border-emerald-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(52,211,153,0.08)]",
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
  </div>
);

// ─── Pupil ───────────────────────────────────────────────────────────────────

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

/** Dark dot that tracks the global mouse cursor. */
const Pupil = ({ size = 12, maxDistance = 5, pupilColor = "#1a1a1a", forceLookX, forceLookY }: PupilProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    if (!pupilRef.current) return { x: 0, y: 0 };
    const r = pupilRef.current.getBoundingClientRect();
    const dx = mouseX - (r.left + r.width / 2);
    const dy = mouseY - (r.top + r.height / 2);
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`, height: `${size}px`, backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

// ─── EyeBall ─────────────────────────────────────────────────────────────────

interface EyeBallProps {
  size?: number; pupilSize?: number; maxDistance?: number;
  eyeColor?: string; pupilColor?: string; isBlinking?: boolean;
  forceLookX?: number; forceLookY?: number;
}

/** White eyeball with mouse-following pupil and blink support. */
const EyeBall = ({ size = 48, pupilSize = 16, maxDistance = 10, eyeColor = "white", pupilColor = "#1a1a1a", isBlinking = false, forceLookX, forceLookY }: EyeBallProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const pos = (() => {
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY };
    if (!eyeRef.current) return { x: 0, y: 0 };
    const r = eyeRef.current.getBoundingClientRect();
    const dx = mouseX - (r.left + r.width / 2);
    const dy = mouseY - (r.top + r.height / 2);
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance);
    const angle = Math.atan2(dy, dx);
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist };
  })();

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{ width: `${size}px`, height: isBlinking ? "2px" : `${size}px`, backgroundColor: eyeColor, overflow: "hidden" }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`, height: `${pupilSize}px`, backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

// ─── Public test account ─────────────────────────────────────────────────────

const PUBLIC_TEST_ACCOUNT = {
  email: "john@serviceflow.com",
  password: "user123",
};

// ─── Motion variants ─────────────────────────────────────────────────────────

const cardIn   = { hidden: { opacity: 0, y: 28, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } } as const;
const item     = (delay: number) => ({ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay, ease: "easeOut" } } } as const);
const charIn   = (delay: number) => ({ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] } } } as const);

// ─── Login page ──────────────────────────────────────────────────────────────

/** Premium login page — falling pattern background, glassmorphism panels, interactive character stage. */
export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);

  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking,  setIsBlackBlinking]  = useState(false);

  const [isTyping,              setIsTyping]              = useState(false);
  const [isLookingAtEachOther,  setIsLookingAtEachOther]  = useState(false);

  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef  = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => { setIsPurpleBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => { setIsBlackBlinking(false); schedule(); }, 150);
      }, Math.random() * 4000 + 3000);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isTyping) { setIsLookingAtEachOther(false); return; }
    setIsLookingAtEachOther(true);
    const t = setTimeout(() => setIsLookingAtEachOther(false), 800);
    return () => clearTimeout(t);
  }, [isTyping]);

  /** Derives body lean and eye offsets from mouse delta relative to a character. */
  const calcPos = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
    const rect = ref.current.getBoundingClientRect();
    const dx = mouseX - (rect.left + rect.width / 2);
    const dy = mouseY - (rect.top + rect.height / 3);
    return {
      faceX:    Math.max(-15, Math.min(15, dx / 20)),
      faceY:    Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    };
  };

  const purplePos = calcPos(purpleRef);
  const blackPos  = calcPos(blackRef);
  const yellowPos = calcPos(yellowRef);
  const orangePos = calcPos(orangeRef);

  const hidingPassword   = isTyping || (password.length > 0 && !showPassword);
  const revealingPassword = password.length > 0 && showPassword;

  /** Submits credentials to the NextAuth credentials provider. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError("Please fill in all fields."); return; }
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(), password, redirect: false,
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
    <div className="min-h-screen bg-[#0d1f12] flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">

      {/* Suppress browser password reveal button */}
      <style>{`
        @keyframes sf-gradient-flow {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input[type="password"]::-webkit-credentials-auto-fill-button { display: none; }
      `}</style>

      {/* Falling pattern background */}
      <div className="absolute inset-0 z-0">
        <FallingPattern
          color="rgba(74, 222, 128, 0.65)"
          backgroundColor="#0d1f12"
          duration={130}
          blurIntensity="0.4em"
          density={1}
        />
      </div>

      {/* Ambient radial glows */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-teal-500/8 rounded-full blur-[70px]" />
      </div>

      {/* Main card */}
      <motion.div
        variants={cardIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl shadow-black/70"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >

        {/* ── Left: character stage ──────────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden backdrop-blur-sm"
          style={{ background: "linear-gradient(160deg, rgba(10,30,17,0.78) 0%, rgba(7,22,13,0.85) 100%)" }}
        >
          {/* Gradient top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-400/70 to-teal-400/0" />

          {/* Background depth layers */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/15 rounded-full blur-[60px]" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-emerald-500/15 rounded-full blur-[50px]" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-[40px]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* Logo */}
          <motion.div
            variants={item(0.15)} initial="hidden" animate="visible"
            className="relative z-20 flex items-center gap-2.5 text-lg font-semibold"
          >
            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/20 backdrop-blur-sm flex items-center justify-center">
              <Layers className="size-4 text-emerald-300" />
            </div>
            <span className="text-white/90">ServiceFlow</span>
          </motion.div>

          {/* Character stage */}
          <motion.div
            className="relative z-20 flex items-end justify-center h-[500px]"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative" style={{ width: "550px", height: "400px" }}>

              {/* ── Character glow halos (z-0, behind all characters) ── */}
              <div
                className="absolute bottom-0 pointer-events-none"
                style={{
                  left: "40px", width: "260px", height: "320px", zIndex: 0,
                  background: "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(108,63,245,0.28) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div
                className="absolute bottom-0 pointer-events-none"
                style={{
                  left: "-20px", width: "290px", height: "200px", zIndex: 0,
                  background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(255,155,107,0.22) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div
                className="absolute bottom-0 pointer-events-none"
                style={{
                  left: "290px", width: "200px", height: "220px", zIndex: 0,
                  background: "radial-gradient(ellipse 70% 60% at 50% 100%, rgba(232,215,84,0.20) 0%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />

              {/* ── Purple rectangle ── */}
              <motion.div
                variants={charIn(0.5)} initial="hidden" animate="visible"
                className="absolute bottom-0"
                style={{ left: "70px", zIndex: 1 }}
              >
                <div
                  ref={purpleRef}
                  className="relative transition-all duration-700 ease-in-out"
                  style={{
                    width: "180px",
                    height: hidingPassword ? "440px" : "400px",
                    backgroundColor: "#6C3FF5",
                    borderRadius: "10px 10px 0 0",
                    transform: revealingPassword
                      ? "skewX(0deg)"
                      : hidingPassword
                        ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                        : `skewX(${purplePos.bodySkew || 0}deg)`,
                    transformOrigin: "bottom center",
                    boxShadow: "0 -8px 30px rgba(108,63,245,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  <div
                    className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                    style={{
                      left: revealingPassword ? "20px" : isLookingAtEachOther ? "55px" : `${45 + purplePos.faceX}px`,
                      top:  revealingPassword ? "35px" : isLookingAtEachOther ? "65px" : `${40 + purplePos.faceY}px`,
                    }}
                  >
                    <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#1a1a1a" isBlinking={isPurpleBlinking}
                      forceLookX={revealingPassword ? -5 : isLookingAtEachOther ? 3 : undefined}
                      forceLookY={revealingPassword ?  6 : isLookingAtEachOther ? 4 : undefined}
                    />
                    <EyeBall size={18} pupilSize={7} maxDistance={5} eyeColor="white" pupilColor="#1a1a1a" isBlinking={isPurpleBlinking}
                      forceLookX={revealingPassword ? -5 : isLookingAtEachOther ? 3 : undefined}
                      forceLookY={revealingPassword ?  6 : isLookingAtEachOther ? 4 : undefined}
                    />
                  </div>
                </div>
              </motion.div>

              {/* ── Black rectangle ── */}
              <motion.div
                variants={charIn(0.62)} initial="hidden" animate="visible"
                className="absolute bottom-0"
                style={{ left: "240px", zIndex: 2 }}
              >
                <div
                  ref={blackRef}
                  className="relative transition-all duration-700 ease-in-out"
                  style={{
                    width: "120px",
                    height: "310px",
                    backgroundColor: "#2D2D2D",
                    borderRadius: "8px 8px 0 0",
                    transform: revealingPassword
                      ? "skewX(0deg)"
                      : isLookingAtEachOther
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                        : hidingPassword
                          ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                          : `skewX(${blackPos.bodySkew || 0}deg)`,
                    transformOrigin: "bottom center",
                    boxShadow: "0 -8px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                    style={{
                      left: revealingPassword ? "10px" : isLookingAtEachOther ? "32px" : `${26 + blackPos.faceX}px`,
                      top:  revealingPassword ? "28px" : isLookingAtEachOther ? "12px" : `${32 + blackPos.faceY}px`,
                    }}
                  >
                    <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#1a1a1a" isBlinking={isBlackBlinking}
                      forceLookX={revealingPassword ? -4 : isLookingAtEachOther ?  0 : undefined}
                      forceLookY={revealingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                    />
                    <EyeBall size={16} pupilSize={6} maxDistance={4} eyeColor="white" pupilColor="#1a1a1a" isBlinking={isBlackBlinking}
                      forceLookX={revealingPassword ? -4 : isLookingAtEachOther ?  0 : undefined}
                      forceLookY={revealingPassword ? -4 : isLookingAtEachOther ? -4 : undefined}
                    />
                  </div>
                </div>
              </motion.div>

              {/* ── Orange semicircle ── */}
              <motion.div
                variants={charIn(0.38)} initial="hidden" animate="visible"
                className="absolute bottom-0"
                style={{ left: "0px", zIndex: 3 }}
              >
                <div
                  ref={orangeRef}
                  className="relative transition-all duration-700 ease-in-out"
                  style={{
                    width: "240px",
                    height: "200px",
                    backgroundColor: "#FF9B6B",
                    borderRadius: "120px 120px 0 0",
                    transform: revealingPassword ? "skewX(0deg)" : `skewX(${orangePos.bodySkew || 0}deg)`,
                    transformOrigin: "bottom center",
                    boxShadow: "0 -8px 28px rgba(255,155,107,0.30), inset 0 1px 0 rgba(255,255,255,0.20)",
                  }}
                >
                  <div
                    className="absolute flex gap-8 transition-all duration-200 ease-out"
                    style={{
                      left: revealingPassword ? "50px"  : `${82  + (orangePos.faceX || 0)}px`,
                      top:  revealingPassword ? "85px"  : `${90  + (orangePos.faceY || 0)}px`,
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
              </motion.div>

              {/* ── Yellow rounded rectangle ── */}
              <motion.div
                variants={charIn(0.74)} initial="hidden" animate="visible"
                className="absolute bottom-0"
                style={{ left: "310px", zIndex: 4 }}
              >
                <div
                  ref={yellowRef}
                  className="relative transition-all duration-700 ease-in-out"
                  style={{
                    width: "140px",
                    height: "230px",
                    backgroundColor: "#E8D754",
                    borderRadius: "70px 70px 0 0",
                    transform: revealingPassword ? "skewX(0deg)" : `skewX(${yellowPos.bodySkew || 0}deg)`,
                    transformOrigin: "bottom center",
                    boxShadow: "0 -8px 24px rgba(232,215,84,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <div
                    className="absolute flex gap-6 transition-all duration-200 ease-out"
                    style={{
                      left: revealingPassword ? "20px" : `${52 + (yellowPos.faceX || 0)}px`,
                      top:  revealingPassword ? "35px" : `${40 + (yellowPos.faceY || 0)}px`,
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
                      top:  revealingPassword ? "88px" : `${88 + (yellowPos.faceY || 0)}px`,
                    }}
                  />
                </div>
              </motion.div>

            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            variants={item(0.3)} initial="hidden" animate="visible"
            className="relative z-20 flex items-center gap-8 text-sm"
          >
            <span className="text-white/20 text-xs">© {new Date().getFullYear()} ServiceFlow</span>
          </motion.div>
        </div>

        {/* ── Right: sign-in form ────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-center p-8 overflow-hidden backdrop-blur-sm"
          style={{ background: "linear-gradient(160deg, rgba(8,22,13,0.82) 0%, rgba(5,16,9,0.88) 100%)" }}
        >
          {/* Gradient top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          {/* Left divider glow */}
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-emerald-500/15 to-transparent" />

          {/* Subtle corner glow */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/4 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-teal-500/4 rounded-full blur-[50px] pointer-events-none" />

          <div className="relative z-10 w-full max-w-[380px]">

            {/* Mobile logo */}
            <motion.div
              variants={item(0.1)} initial="hidden" animate="visible"
              className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12 text-white"
            >
              <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/20 flex items-center justify-center">
                <Layers className="size-4 text-emerald-300" />
              </div>
              <span>ServiceFlow</span>
            </motion.div>

            {/* Heading */}
            <motion.div variants={item(0.2)} initial="hidden" animate="visible" className="text-center mb-10">
              <h1
                className="text-3xl font-bold tracking-tight mb-2"
                style={{
                  background: "linear-gradient(90deg, #34d399 0%, #a7f3d0 40%, #5eead4 70%, #34d399 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "sf-gradient-flow 4s linear infinite",
                }}
              >
                Welcome back!
              </h1>
              <p className="text-white/40 text-sm">Sign in to your account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <motion.div variants={item(0.3)} initial="hidden" animate="visible" className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/60">Email</Label>
                <AppInput
                  id="email" type="email" placeholder="you@company.com"
                  value={email} autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  required
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={item(0.38)} initial="hidden" animate="visible" className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white/60">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
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
                    password.length > 0 ? (
                      <button
                        type="button"
                        aria-label="Hold to reveal password"
                        onMouseDown={() => setShowPassword(true)}
                        onMouseUp={() => setShowPassword(false)}
                        onMouseLeave={() => setShowPassword(false)}
                        onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                        onTouchEnd={() => setShowPassword(false)}
                        onTouchCancel={() => setShowPassword(false)}
                      >
                        <Eye className="size-5" />
                      </button>
                    ) : undefined
                  }
                />
              </motion.div>

              {/* Error */}
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

              {/* Submit */}
              <motion.div variants={item(0.46)} initial="hidden" animate="visible">
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={isLoading ? {} : { scale: 1.01 }}
                  whileTap={isLoading ? {} : { scale: 0.99 }}
                  className={cn(
                    "group/button relative w-full h-12 overflow-hidden rounded-lg",
                    "bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold",
                    "flex items-center justify-center gap-2",
                    "transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/25",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isLoading && <Loader2 className="size-4 animate-spin" />}
                  <span>{isLoading ? "Signing in…" : "Sign in"}</span>
                  {!isLoading && (
                    <div
                      className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-700 group-hover/button:[transform:skew(-13deg)_translateX(100%)]"
                      style={{ transition: "transform 0.7s" }}
                    >
                      <div className="relative h-full w-10 bg-white/20" />
                    </div>
                  )}
                </motion.button>
              </motion.div>
            </form>

            <motion.div
              variants={item(0.55)} initial="hidden" animate="visible"
              className="mt-6 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-3.5 text-xs"
            >
              <p className="font-semibold text-emerald-200/85">Public test account</p>
              <p className="mt-1 text-white/45">
                Use lowest-privilege demo account to view main content before creating your own access.
              </p>
              <p className="mt-3 text-white/70">
                <span className="font-medium text-white/85">Username:</span> {PUBLIC_TEST_ACCOUNT.email}
              </p>
              <p className="mt-1 text-white/70">
                <span className="font-medium text-white/85">Password:</span> {PUBLIC_TEST_ACCOUNT.password}
              </p>
            </motion.div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

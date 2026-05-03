"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword } from "@backend/features/auth/actions";
import { cn } from "@shared/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

// ─── Motion variants ──────────────────────────────────────────────────────────

const cardIn = {
  hidden:  { opacity: 0, y: 32, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
} as const;

const item = (delay: number) => ({
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, delay, ease: "easeOut" } },
} as const);

const successAnim = {
  hidden:  { opacity: 0, scale: 0.85, y: 12 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  exit:    { opacity: 0, scale: 0.95, y: -8, transition: { duration: 0.25 } },
} as const;

// ─── Glass input ──────────────────────────────────────────────────────────────

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/** Dark glass-styled input matching the login page aesthetic. */
const GlassInput = ({ error, className, ...props }: GlassInputProps) => (
  <div className="space-y-1.5">
    <input
      className={cn(
        "border h-12 w-full rounded-lg px-3 text-sm text-white outline-none transition-all",
        "placeholder:text-white/30 bg-white/[0.06]",
        error
          ? "border-red-400/50 focus:border-red-400/70"
          : "border-white/15 focus:border-emerald-400/60 focus:bg-white/[0.09] focus:shadow-[0_0_0_3px_rgba(52,211,153,0.08)]",
        className,
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400/80">{error}</p>}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Forgot-password page — premium glass card over the final auth backdrop. */
export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await forgotPassword(data.email);
    setSent(true);
    setLoading(false);
    toast.success("Reset link sent if account exists.");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">

      {/* Suppress browser autofill button */}
      <style>{`
        @keyframes sf-gradient-flow {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Video background — hue-rotate shifts warm reds → ServiceFlow emerald */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ filter: "hue-rotate(140deg) saturate(0.75) brightness(0.6)" }}
        src="https://videos.pexels.com/video-files/18526841/uhd_30fps.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark green tint overlay */}
      <div className="absolute inset-0 z-[1]" style={{ background: "rgba(2,12,7,0.72)" }} />

      {/* Soft emerald glow behind card */}
      <div className="absolute inset-0 z-[2] pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full blur-[140px]" style={{ background: "rgba(52,211,153,0.1)" }} />
      </div>

      {/* Card */}
      <motion.div
        variants={cardIn}
        initial="hidden"
        animate="visible"
        className="relative z-[10] w-full max-w-[420px]"
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background:           "rgba(4, 14, 7, 0.72)",
            backdropFilter:       "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border:               "1px solid rgba(255,255,255,0.09)",
            boxShadow:            "0 30px 70px rgba(0,0,0,0.65), 0 0 0 1px rgba(52,211,153,0.06)",
          }}
        >
          {/* Gradient top accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />

          {/* Inner top glow */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/6 to-transparent pointer-events-none" />

          <div className="relative z-10 p-8 sm:p-10">

            {/* Logo */}
            <motion.div
              variants={item(0.1)} initial="hidden" animate="visible"
              className="flex items-center gap-2.5 mb-9"
            >
              <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/20 flex items-center justify-center">
                <Layers className="size-4 text-emerald-300" />
              </div>
              <span className="text-white/85 font-semibold text-base">ServiceFlow</span>
            </motion.div>

            {/* Content — form or success state */}
            <AnimatePresence mode="wait">
              {sent ? (
                /* ── Success state ─────────────────────────────────────────── */
                <motion.div
                  key="success"
                  variants={successAnim}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* Animated checkmark */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                      <div className="relative size-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center">
                        <CheckCircle2 className="size-7 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-bold text-white">Check your inbox</h2>
                    <p className="text-sm text-white/45 leading-relaxed">
                      If an account exists for that address, a reset link is on its way.
                      <br />
                      The link expires in <span className="text-white/65">1 hour</span>.
                    </p>
                  </div>

                  <div
                    className="p-4 rounded-xl text-xs text-white/35 text-center border border-white/[0.07]"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    Didn&apos;t receive it? Check your spam folder or try again.
                  </div>

                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full h-11 rounded-lg border border-white/12 bg-white/[0.05] text-white/70 text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-white/[0.08] hover:text-white/90 cursor-pointer"
                    >
                      <ArrowLeft className="size-4" />
                      Back to sign in
                    </motion.button>
                  </Link>
                </motion.div>
              ) : (
                /* ── Form state ────────────────────────────────────────────── */
                <motion.div
                  key="form"
                  variants={successAnim}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-7"
                >
                  {/* Heading */}
                  <div className="space-y-1.5">
                    <h1
                      className="text-2xl font-bold tracking-tight"
                      style={{
                        background:           "linear-gradient(90deg, #34d399 0%, #a7f3d0 45%, #5eead4 80%, #34d399 100%)",
                        backgroundSize:       "200% auto",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor:  "transparent",
                        backgroundClip:       "text",
                        animation:            "sf-gradient-flow 4s linear infinite",
                      }}
                    >
                      Reset your password
                    </h1>
                    <p className="text-sm text-white/40 leading-relaxed">
                      Enter your work email and we&apos;ll send a reset link if your account exists.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60 flex items-center gap-1.5">
                        <Mail className="size-3.5 text-white/30" />
                        Email address
                      </label>
                      <GlassInput
                        type="email"
                        placeholder="you@company.com"
                        autoComplete="email"
                        error={errors.email?.message}
                        {...register("email")}
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={loading ? {} : { scale: 1.01 }}
                      whileTap={loading ? {} : { scale: 0.99 }}
                      className={cn(
                        "group/button relative w-full h-12 overflow-hidden rounded-lg",
                        "bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold",
                        "flex items-center justify-center gap-2",
                        "transition-shadow duration-300 hover:shadow-lg hover:shadow-emerald-500/25",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "cursor-pointer",
                      )}
                    >
                      {loading
                        ? <Loader2 className="size-4 animate-spin" />
                        : <>
                            <span>Send reset link</span>
                            {/* Shimmer sweep */}
                            <div
                              className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-700 group-hover/button:[transform:skew(-13deg)_translateX(100%)]"
                              style={{ transition: "transform 0.7s" }}
                            >
                              <div className="relative h-full w-10 bg-white/20" />
                            </div>
                          </>
                      }
                    </motion.button>
                  </form>

                  {/* Back to login */}
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full h-10 rounded-lg text-white/40 text-sm flex items-center justify-center gap-2 transition-colors hover:text-white/65 cursor-pointer"
                    >
                      <ArrowLeft className="size-4" />
                      Back to sign in
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

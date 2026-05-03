"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Shield,
  Zap,
  MessageSquare,
  Bell,
  ChevronRight,
  Activity,
  ClipboardList,
  Clock,
  TrendingUp,
} from "lucide-react";
import { RotatingText } from "@frontend/components/animations/rotating-text";

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Request Tracking",
    desc: "Submit, categorize, and track every internal request from creation to resolution. Nothing falls through the cracks.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Live dashboards surface request volume, average resolution time, priority distribution, and department-level trends.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Granular permissions separate what regular users see from what admins control — including user creation and management.",
  },
  {
    icon: Activity,
    title: "Full Audit Trail",
    desc: "Every status change, assignment, comment, and update is logged in an immutable activity timeline per request.",
  },
  {
    icon: MessageSquare,
    title: "Threaded Comments",
    desc: "Keep context in one place. Team members can add, edit, and resolve comments directly on any request.",
  },
  {
    icon: Bell,
    title: "Email Notifications",
    desc: "Automatic emails for new requests, status changes, assignments, and comments — keeping everyone in the loop.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Submit a request",
    desc: "Any team member fills out a short form — title, description, priority, and department. Done in under a minute.",
  },
  {
    n: "02",
    title: "Assign & prioritize",
    desc: "Admins assign requests to the right person, set urgency, and track progress from a single dashboard.",
  },
  {
    n: "03",
    title: "Resolve & log",
    desc: "Once resolved, the request is closed with a full activity trail. Reports show trends over time.",
  },
];

const STATS = [
  { value: "< 1 min", label: "to submit a request" },
  { value: "100%", label: "audit coverage" },
  { value: "2 roles", label: "admin + user access" },
  { value: "Real-time", label: "dashboard updates" },
];

// ─── Dot Canvas ───────────────────────────────────────────────────────────────

/** Full-page interactive dot grid — mouse-reactive #0CF2A0 green dots. */
function DotCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasOrNull = canvasRef.current;
    if (!canvasOrNull) return;
    const canvas: HTMLCanvasElement = canvasOrNull;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const DOT_SPACING = 25;
    const BASE_RADIUS = 1;
    const INTERACTION_RADIUS = 150;
    const GRID_CELL_SIZE = 50;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let mouseX = -9999;
    let mouseY = -9999;
    let rafId: number;

    interface Dot {
      x: number;
      y: number;
      baseOpacity: number;
    }

    let dots: Dot[] = [];
    // Spatial grid: cell key → dot indices
    let grid: Map<string, number[]> = new Map();

    /** Rebuilds dot array and spatial grid for current viewport size. */
    function buildDots() {
      dots = [];
      grid = new Map();
      const cols = Math.ceil(width / DOT_SPACING) + 1;
      const rows = Math.ceil(height / DOT_SPACING) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const x = c * DOT_SPACING;
          const y = r * DOT_SPACING;
          const dot: Dot = { x, y, baseOpacity: 0.40 + Math.random() * 0.10 };
          const idx = dots.length;
          dots.push(dot);

          const cx = Math.floor(x / GRID_CELL_SIZE);
          const cy = Math.floor(y / GRID_CELL_SIZE);
          const key = `${cx},${cy}`;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key)!.push(idx);
        }
      }
    }

    /** Returns dot indices near (mx, my) using spatial grid. */
    function getNearbyDots(mx: number, my: number): number[] {
      const cellRadius = Math.ceil(INTERACTION_RADIUS / GRID_CELL_SIZE) + 1;
      const cx0 = Math.floor(mx / GRID_CELL_SIZE);
      const cy0 = Math.floor(my / GRID_CELL_SIZE);
      const result: number[] = [];

      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        for (let dy = -cellRadius; dy <= cellRadius; dy++) {
          const key = `${cx0 + dx},${cy0 + dy}`;
          const cell = grid.get(key);
          if (cell) result.push(...cell);
        }
      }
      return result;
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      buildDots();
    }

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);

      const nearby = getNearbyDots(mouseX, mouseY);
      const boostedSet = new Set(nearby);

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        let opacity = dot.baseOpacity;
        let radius = BASE_RADIUS;

        if (boostedSet.has(i)) {
          const dx = dot.x - mouseX;
          const dy = dot.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < INTERACTION_RADIUS) {
            const t = 1 - dist / INTERACTION_RADIUS;
            opacity = dot.baseOpacity + 0.6 * t;
            radius = BASE_RADIUS + 1.2 * t;
          }
        }

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(12, 242, 160, ${opacity})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

/** Sticky scroll-aware dark header with green CTA. */
function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 20));

  return (
    <motion.header
      animate={{
        backgroundColor: scrolled ? "rgba(17,17,17,0.95)" : "rgba(17,17,17,0.80)",
        borderColor: scrolled ? "rgba(75,85,99,0.7)" : "rgba(55,65,81,0.5)",
        boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,0.4)" : "none",
      }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 inset-x-0 z-50 h-16 border-b backdrop-blur-md"
    >
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0CF2A0,#06d48a)" }}>
            <Layers className="w-4 h-4 text-[#111111]" />
          </div>
          <span className="font-bold text-base text-white">ServiceFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#stats" className="hover:text-white transition-colors">Stats</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: "#0CF2A0", color: "#111111" }}
          >
            Get started
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

/** Hero section with RotatingText headline and staggered entrance. */
function Hero() {
  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" as const, delay },
  });

  return (
    <section className="relative pt-40 pb-28 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div {...fadeUp(0.3)}>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border mb-8"
            style={{
              background: "rgba(12,242,160,0.08)",
              borderColor: "rgba(12,242,160,0.25)",
              color: "#0CF2A0",
            }}
          >
            <Zap className="w-3 h-3" />
            Internal operations, simplified
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.4)}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6"
        >
          Track every service{" "}
          <span style={{ color: "#0CF2A0" }}>
            <RotatingText
              texts={["Request", "Workflow", "Operation", "Ticket", "Task"]}
              rotationInterval={2200}
              staggerDuration={0.03}
              staggerFrom="last"
              mainClassName="inline-flex"
            />
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.5)}
          className="max-w-xl mx-auto text-base sm:text-lg leading-relaxed mb-10"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          One platform for your team to submit, track, and resolve every internal
          request — from IT support to document processing — with a full audit
          trail at every step.
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.6)}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 h-11 text-sm font-semibold rounded-lg transition-all hover:opacity-90 hover:scale-[1.02] hover:shadow-lg"
            style={{ background: "#0CF2A0", color: "#111111", boxShadow: "0 0 0 0 rgba(12,242,160,0)" }}
          >
            Open dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 px-7 h-11 text-sm font-medium rounded-lg border transition-all hover:border-[#0CF2A0]/40 hover:text-white"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.65)" }}
          >
            See features
            <ChevronRight className="w-4 h-4" />
          </a>
        </motion.div>

        {/* Footnote */}
        <motion.ul
          {...fadeUp(0.65)}
          className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {["No public sign-up", "Admin-managed accounts", "Full audit trail included"].map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "rgba(12,242,160,0.6)" }} />
              {f}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

/** Stats row — dark background with green accents. */
function Stats() {
  return (
    <section id="stats" className="py-16 border-y" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl lg:text-3xl font-bold mb-1" style={{ color: "#0CF2A0" }}>{s.value}</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

/** 3×2 feature grid — dark cards with green icon accents. */
function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border mb-4"
            style={{
              background: "rgba(12,242,160,0.08)",
              borderColor: "rgba(12,242,160,0.25)",
              color: "#0CF2A0",
            }}
          >
            <TrendingUp className="w-3 h-3" />
            Everything you need
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Built for internal operations
          </h2>
          <p className="max-w-lg mx-auto text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
            ServiceFlow covers the full lifecycle — from submission to resolution —
            with the visibility and accountability your team needs.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.05 * i }}
                className="group p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg"
                style={{
                  background: "#1a1a1a",
                  borderColor: "rgba(75,85,99,0.5)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(12,242,160,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(75,85,99,0.5)";
                }}
              >
                <div
                  className="inline-flex p-2.5 rounded-xl mb-4"
                  style={{ background: "rgba(12,242,160,0.10)", color: "#0CF2A0" }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

/** Three-step workflow — dark background with green numbered circles. */
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border mb-4"
            style={{
              background: "rgba(12,242,160,0.08)",
              borderColor: "rgba(12,242,160,0.25)",
              color: "#0CF2A0",
            }}
          >
            <Clock className="w-3 h-3" />
            Simple workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            From request to resolution
          </h2>
          <p className="max-w-lg mx-auto text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
            Three straightforward steps get every request tracked and resolved —
            with full visibility the entire time.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8 relative">
          {/* Connector lines */}
          <div className="hidden sm:block absolute top-10 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.1 * i }}
              className="relative text-center"
            >
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative z-10"
                style={{
                  background: "rgba(12,242,160,0.08)",
                  border: "1px solid rgba(12,242,160,0.20)",
                }}
              >
                <span className="text-2xl font-bold" style={{ color: "#0CF2A0" }}>{step.n}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "rgba(255,255,255,0.50)" }}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

/** Final call-to-action — dark card with green glow. */
function CTABanner() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl p-12 text-center"
          style={{
            background: "#1a1a1a",
            border: "1px solid rgba(75,85,99,0.5)",
            boxShadow: "0 0 60px rgba(12,242,160,0.08)",
          }}
        >
          {/* Green glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(12,242,160,0.12)" }}
          />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ready to bring clarity to
              <br />
              your internal operations?
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Sign in to access your dashboard, manage requests, and keep your
              team aligned — from day one.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 h-11 text-sm font-semibold rounded-lg transition-all hover:opacity-90 hover:scale-[1.02]"
                style={{ background: "#0CF2A0", color: "#111111" }}
              >
                Sign in to dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              {["No public sign-up", "Admin-managed accounts", "Full audit trail included"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "rgba(12,242,160,0.7)" }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

/** Dark footer with border-gray-800. */
function Footer() {
  return (
    <footer className="py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0CF2A0,#06d48a)" }}>
            <Layers className="w-3.5 h-3.5 text-[#111111]" />
          </div>
          <span className="text-sm font-semibold text-white">ServiceFlow</span>
        </div>

        <nav className="flex items-center gap-5 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
        </nav>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} ServiceFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/** Dark Nexus-inspired landing page — always #111111, #0CF2A0 green accent. */
export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "#111111" }}>
      {/* Interactive dot grid — fixed behind everything */}
      <DotCanvas />

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(17,17,17,0.85) 100%)",
        }}
      />

      <Nav />

      <main className="relative z-10">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <CTABanner />
      </main>

      <Footer />
    </div>
  );
}

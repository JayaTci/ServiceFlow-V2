import Link from "next/link";
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
import { Button } from "@frontend/components/ui/button";
import { Badge } from "@frontend/components/ui/badge";

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Request Tracking",
    desc: "Submit, categorize, and track every internal request from creation to resolution. Nothing falls through the cracks.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Live dashboards surface request volume, average resolution time, priority distribution, and department-level trends.",
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Granular permissions separate what regular users see from what admins control — including user creation and management.",
    color: "text-violet-500 bg-violet-500/10",
  },
  {
    icon: Activity,
    title: "Full Audit Trail",
    desc: "Every status change, assignment, comment, and update is logged in an immutable activity timeline per request.",
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    icon: MessageSquare,
    title: "Threaded Comments",
    desc: "Keep context in one place. Team members can add, edit, and resolve comments directly on any request.",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Bell,
    title: "Email Notifications",
    desc: "Automatic emails for new requests, status changes, assignments, and comments — keeping everyone in the loop.",
    color: "text-rose-500 bg-rose-500/10",
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

// ─── Nav ─────────────────────────────────────────────────────────────────────

// Renders the public landing-page navigation.
function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center shadow-sm">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-foreground">ServiceFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#stats" className="hover:text-foreground transition-colors">Stats</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm">
              Sign in
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="gap-1.5 text-sm">
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

// Renders the landing hero section and primary calls to action.
function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <Badge
          variant="secondary"
          className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20"
        >
          <Zap className="w-3 h-3" />
          Internal operations, simplified
        </Badge>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-foreground leading-[1.08] mb-6">
          Service requests,
          <br />
          <span className="text-primary">managed with clarity.</span>
        </h1>

        <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
          One platform for your team to submit, track, and resolve every internal
          request — from IT support to document processing — with a full audit
          trail at every step.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
          <Link href="/login">
            <Button size="lg" className="gap-2 px-7 h-11 text-sm font-semibold shadow-lg shadow-primary/25">
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="outline" size="lg" className="gap-2 px-7 h-11 text-sm">
              See features
              <ChevronRight className="w-4 h-4" />
            </Button>
          </a>
        </div>

        {/* ── 3D Component Slot ───────────────────────────────────────────────
            Replace this placeholder with a 21st.dev 3D component.
            Recommended size: max-w-4xl mx-auto, aspect-[16/9] or similar.
        ─────────────────────────────────────────────────────────────────── */}
        <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/30">
          {/* Simulated app screenshot placeholder */}
          <div className="bg-sidebar border-b border-border h-10 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-48 h-5 rounded bg-border/60 text-[10px] flex items-center justify-center text-muted-foreground/60 font-mono">
                serviceflow.app/dashboard
              </div>
            </div>
          </div>
          <div className="aspect-[16/8] bg-background flex items-center justify-center">
            <div className="text-center space-y-2 opacity-40">
              <BarChart3 className="w-10 h-10 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground font-medium">App preview</p>
              <p className="text-xs text-muted-foreground/60">Replace with 21st.dev 3D component</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

// Renders portfolio metrics for the landing page.
function Stats() {
  return (
    <section id="stats" className="py-16 border-y border-border/60 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

// Renders the landing feature grid.
function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20"
          >
            <TrendingUp className="w-3 h-3" />
            Everything you need
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Built for internal operations
          </h2>
          <p className="max-w-lg mx-auto text-muted-foreground text-base leading-relaxed">
            ServiceFlow covers the full lifecycle — from submission to resolution —
            with the visibility and accountability your team needs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
              >
                <div className={`inline-flex p-2.5 rounded-xl mb-4 ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

// Renders the three-step product workflow section.
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <Badge
            variant="secondary"
            className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20"
          >
            <Clock className="w-3 h-3" />
            Simple workflow
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 tracking-tight">
            From request to resolution
          </h2>
          <p className="max-w-lg mx-auto text-muted-foreground text-base leading-relaxed">
            Three straightforward steps get every request tracked and resolved —
            with full visibility the entire time.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 relative">
          {/* Connector lines (desktop) */}
          <div className="hidden sm:block absolute top-10 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px bg-border" />

          {STEPS.map((step) => (
            <div key={step.n} className="relative text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 mb-5 relative z-10">
                <span className="text-2xl font-bold text-primary">{step.n}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

// Renders the final landing-page call-to-action banner.
function CTABanner() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl mesh-bg p-12 text-center">
          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Ready to bring clarity to
              <br />
              your internal operations?
            </h2>
            <p className="text-white/70 text-base max-w-md mx-auto">
              Sign in to access your dashboard, manage requests, and keep your
              team aligned — from day one.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/login">
                <Button
                  size="lg"
                  className="gap-2 px-8 h-11 bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
                >
                  Sign in to dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/60">
              {["No public sign-up", "Admin-managed accounts", "Full audit trail included"].map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/80" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

// Renders the public landing footer.
function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 gradient-brand rounded-md flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">ServiceFlow</span>
        </div>

        <nav className="flex items-center gap-5 text-xs text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
        </nav>

        <p className="text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} ServiceFlow. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// Composes the public marketing landing page.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <main>
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

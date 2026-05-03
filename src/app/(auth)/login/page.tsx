"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layers, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@shared/validation/auth";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";

const FEATURES = [
  "Track requests from submission to resolution",
  "Real-time dashboard with analytics",
  "Role-based access control",
  "Full audit trail & activity log",
];

// Renders the login form and submits credentials to Auth.js.
export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password.");
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden mesh-bg flex-col justify-between p-10">
        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">ServiceFlow</span>
        </div>

        {/* Center copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
              Internal service requests,
              <br />
              <span className="text-white/70">managed with clarity.</span>
            </h2>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">
              One place for your team to submit, track, and resolve every
              internal request — from IT support to document processing.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-white/80 shrink-0" />
                <span className="text-sm text-white/70">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <p className="text-white/30 text-xs relative z-10">
          © {new Date().getFullYear()} ServiceFlow
        </p>

        {/* Decorative blobs */}
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/5 rounded-full" />
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">ServiceFlow</span>
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Access your service request dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Sign in
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="p-3.5 bg-muted/60 rounded-xl text-xs text-muted-foreground space-y-1.5 border border-border">
            <p className="font-semibold text-foreground/70">Demo accounts</p>
            <p>
              <span className="font-medium text-foreground/60">Admin:</span>{" "}
              maria@serviceflow.com / admin123
            </p>
            <p>
              <span className="font-medium text-foreground/60">User:</span>{" "}
              john@serviceflow.com / user123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

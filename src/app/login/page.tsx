"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://empathai-backend-production-a6c7.up.railway.app";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call real login API
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Save token and user info
      localStorage.setItem("ay11sutra_token", data.access_token);
      localStorage.setItem("ay11sutra_auth", "true");
      localStorage.setItem("ay11sutra_user", JSON.stringify(data.user));
      
      router.push("/");
    } catch (err) {
      console.error("Login error:", err);
      setError("Connection error. Please check if the server is running.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wLTIwYzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0tMjAgMjBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAtMjBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 w-full">
          {/* Logo & App Name */}
          <div className="flex items-center gap-4 mb-8">
            <img src="/ndw-logo.svg" alt="NDW Logo" className="h-[58px]" />
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">
                A11ySutra
              </h1>
              <p className="text-slate-400 text-lg">
                Enterprise Edition
              </p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-3xl font-semibold text-white mb-4 leading-tight">
            Autonomous Accessibility<br />
            Auditing Platform
          </h2>
          
          <p className="text-slate-400 text-lg mb-8 max-w-md">
            Scan websites for WCAG 2.1/2.2 compliance and get AI-powered fixes instantly.
          </p>

          {/* Powered by AI Badge */}
          <div className="flex items-center gap-3 mb-12">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
              <Sparkles className="w-5 h-5 text-orange-400" />
              <span className="text-white font-medium">Powered by AI</span>
            </div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/10">
              <span className="text-slate-300 text-sm">GIGW 3.0 Compliant</span>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              "7-Agent Multi-Agent Architecture",
              "AI-Generated Code Fixes",
              "Indian Government Standards Support",
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo (shown only on small screens) */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/ndw-logo.svg" alt="NDW Logo" className="h-[38px]" />
            <span className="text-2xl font-bold text-slate-900">A11ySutra</span>
          </div>

          <Card className="shadow-xl border-slate-200">
            <CardHeader className="space-y-2 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500">Sign in to your account to continue</p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@ay11sutra.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Forgot / Signup Links */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary font-medium hover:underline text-left"
                >
                  Forgot Password?
                </Link>
                <div className="text-sm text-slate-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/signup" className="text-primary font-semibold hover:underline">
                    Create one
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mb-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Powered by AI</span>
            </div>
            <p className="text-slate-400 text-sm">
              By <span className="text-slate-700 font-semibold">Newgen Digital</span>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}

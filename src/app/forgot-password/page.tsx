"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://empathai-backend-production-a6c7.up.railway.app";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Unable to process request.");
      } else {
        setStatus("If an account exists for this email, a reset link will be sent.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Connection error. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-3 rounded-xl shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
                <p className="text-slate-500">We&apos;ll send you instructions to reset it.</p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {status && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {status}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-12">
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Remembered your password?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

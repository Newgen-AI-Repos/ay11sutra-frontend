"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  AlertCircle,
  Menu,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AuditReportView } from "@/components/audit-report-view";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://empathai-backend-production-a6c7.up.railway.app";

// Valid TLDs for URL validation
const VALID_TLDS = [
  "com", "org", "net", "edu", "gov", "io", "co", "in", "uk", "us", "de", "fr",
  "jp", "cn", "ru", "br", "au", "ca", "es", "it", "nl", "pl", "se", "ch", "at",
  "be", "dk", "fi", "no", "nz", "za", "sg", "hk", "kr", "tw", "mx", "ar", "cl",
  "info", "biz", "me", "tv", "cc", "xyz", "online", "site", "tech", "dev", "app",
  "ai", "cloud", "digital", "solutions", "agency", "design", "studio", "blog",
  "shop", "store", "news", "media", "group", "global", "world", "asia", "eu"
];

// --- TYPES (for state) ---
interface Issue {
  rule: string;
  description: string;
  wcag_sc?: string;
  fix_priority: string;
  selector?: string;
  html_snippet?: string;
  ai_explanation?: string;
  ai_fixed_code?: string;
  category?: "syntax" | "visual" | "semantic" | "interaction";
  is_vision?: boolean;
}

interface AuditSummary {
  total: number;
  critical: number;
  serious: number;
  minor: number;
  india_compliance: string;
  status: string;
}

interface AuditData {
  summary: AuditSummary;
  report: Issue[];
  error?: string;
}

export default function Home() {
  const router = useRouter();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Main State
  const [url, setUrl] = useState("");
  const [auditResult, setAuditResult] = useState<AuditData | null>(null);
  const [urlError, setUrlError] = useState("");

  // UI State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  // New account menu state
  const [userInfo, setUserInfo] = useState<{name:string; email:string} | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const auth = localStorage.getItem("ay11sutra_auth");
      const token = localStorage.getItem("ay11sutra_token");

      if (auth === "true" && token) {
        setIsAuthenticated(true);
        try {
          const res = await fetch(`${API_BASE}/auth/me`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
          });
          
          if (res.ok) {
            const data = await res.json();
            setUserInfo({ name: data.name, email: data.email });
          } else {
            console.error("Auth token invalid or expired");
            // Optional: Auto-logout if token is bad?
            // handleLogout(); 
          }
        } catch (err) {
          console.error("Failed to fetch user info", err);
        }
      } else {
        router.push("/login");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("ay11sutra_auth");
    localStorage.removeItem("ay11sutra_token");
    setUserInfo(null);
    router.push("/login");
  };

  // --- URL VALIDATION (CNA010 Fix) ---
  const validateUrl = (inputUrl: string): { valid: boolean; error: string } => {
    if (!inputUrl.trim()) {
      return { valid: false, error: "Please enter a URL" };
    }

    // Add https:// if missing
    let urlToCheck = inputUrl;
    if (!urlToCheck.startsWith("http://") && !urlToCheck.startsWith("https://")) {
      urlToCheck = "https://" + urlToCheck;
    }

    try {
      const parsed = new URL(urlToCheck);
      const hostname = parsed.hostname;
      
      // Extract TLD
      const parts = hostname.split(".");
      if (parts.length < 2) {
        return { valid: false, error: "Invalid URL format" };
      }
      
      const tld = parts[parts.length - 1].toLowerCase();
      
      // Check if TLD is valid
      if (!VALID_TLDS.includes(tld)) {
        return { 
          valid: false, 
          error: `Invalid domain extension ".${tld}". Did you mean ".com"?` 
        };
      }

      return { valid: true, error: "" };
    } catch {
      return { valid: false, error: "Invalid URL format. Please enter a valid URL." };
    }
  };

  // --- AUDIT ACTION ---
  const runAudit = async () => {
    // Validate URL first
    const validation = validateUrl(url);
    if (!validation.valid) {
      setUrlError(validation.error);
      return;
    }
    setUrlError("");

    // Normalize URL
    let auditUrl = url;
    if (!auditUrl.startsWith("http://") && !auditUrl.startsWith("https://")) {
      auditUrl = "https://" + auditUrl;
    }

    setIsAuditing(true);
    setAuditProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAuditProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      // Get JWT token
      const token = localStorage.getItem("ay11sutra_token");
      
      const res = await fetch(`${API_BASE}/audit`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url: auditUrl }),
      });

      clearInterval(progressInterval);
      setAuditProgress(100);

      if (!res.ok) {
        throw new Error("Audit failed");
      }

      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error(err);
      setUrlError("Failed to audit. Please check if the URL is accessible and the backend is running.");
      setAuditResult(null);
    }

    setIsAuditing(false);
    setAuditProgress(0);
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/ndw-logo.svg" alt="NDW Logo" className="h-[22px]" />
            <span className="font-bold text-xl tracking-tight">
              A11ySutra
            </span>
            <Badge
              variant="outline"
              className="ml-2 text-xs font-normal bg-slate-50"
            >
              Enterprise
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {userInfo && (
              <div className="relative inline-block text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Menu className="w-5 h-5" />
                  <span className="font-medium">{userInfo.name || userInfo.email}</span>
                </Button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {userInfo.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {userInfo.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => router.push('/history')}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">📜</span> History
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🚪</span> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
        {/* URL Input Section */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <Rocket className="w-5 h-5" />
              Scan URL for Accessibility Issues
            </CardTitle>
            <CardDescription>
              Enter a URL to scan for WCAG 2.1/2.2 accessibility violations
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-3 max-w-3xl">
              <div className="flex-1">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError("");
                  }}
                  className={`h-11 text-base shadow-sm ${urlError ? "border-red-500" : ""}`}
                  onKeyDown={(e) => e.key === "Enter" && runAudit()}
                />
                {urlError && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {urlError}
                  </p>
                )}
              </div>
              <Button
                onClick={runAudit}
                disabled={isAuditing}
                size="lg"
                className="bg-primary hover:bg-primary/90 h-11"
              >
                {isAuditing ? "Scanning..." : "Scan Now"}
              </Button>
            </div>

            {/* Progress Indicator */}
            {isAuditing && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <p className="text-sm font-medium text-orange-900">
                    🔍 Scanning for accessibility issues...
                  </p>
                </div>
                <Progress value={auditProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Results */}
        {auditResult && (
          <AuditReportView data={auditResult as any} url={url} />
        )}
      </main>
    </div>
  );
}

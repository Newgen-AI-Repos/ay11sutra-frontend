"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditReportView } from "@/components/audit-report-view";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://empathai-backend-production-a6c7.up.railway.app";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<{name: string; email: string} | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem("ay11sutra_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setIsAuthenticated(true);
    fetchUser(token);
    if (id) {
        fetchAuditDetail(token, id);
    }
  }, [id, router]);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserInfo({ name: data.name, email: data.email });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditDetail = async (token: string, auditId: string) => {
    try {
      const res = await fetch(`${API_BASE}/audits/${auditId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const rawData = await res.json();
        
        // Adapt backend structure to what AuditReportView expects
        const adaptedData = {
            url: rawData.url, // Ensure URL is passed through
            summary: {
                total: rawData.total_issues,
                critical: 0, // Backend might not calculate these yet for history
                serious: 0,
                minor: 0,
                india_compliance: "Unknown",
                status: "completed"
            },
            report: rawData.issues.map((issue: any) => ({
                rule: issue.rule,
                description: issue.description,
                wcag_sc: issue.wcag_sc,
                fix_priority: issue.priority, // Note: backend uses 'priority', frontend view expects 'fix_priority'
                selector: issue.selector,
                html_snippet: issue.html_snippet,
                ai_explanation: issue.ai_explanation,
                ai_fixed_code: issue.ai_fixed_code,
                category: issue.category
            }))
        };
        
        setAuditData(adaptedData);
      } else {
        console.error("Failed to fetch audit");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("ay11sutra_auth");
    localStorage.removeItem("ay11sutra_token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      {/* Navbar - Simplified for Report Page */}
      <nav className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="bg-primary p-1.5 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden sm:inline">
                    A11ySutra
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs font-normal bg-slate-50">
                    Report Viewer
                    </Badge>
                </div>
            </div>

            {/* Account Menu (Reused) */}
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

      <main className="max-w-7xl mx-auto p-6 space-y-6 mt-4">
        {auditData ? (
            <AuditReportView data={auditData} url={auditData.url} />
        ) : (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold text-slate-700">Report not found</h2>
                <Button variant="link" onClick={() => router.push("/history")}>Back to History</Button>
            </div>
        )}
      </main>
    </div>
  );
}

export default function ReportPage() {
    return (
        <Suspense fallback={<div>Loading Report...</div>}>
            <ReportContent />
        </Suspense>
    );
}

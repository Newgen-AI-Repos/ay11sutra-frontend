"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://empathai-backend-production-a6c7.up.railway.app";

interface AuditHistoryItem {
  id: string;
  url: string;
  total_issues: number;
  cached: boolean;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfo, setUserInfo] = useState<{name: string} | null>(null);

  const formatDateTimeIST = (isoString: string) => {
    const utcDate = new Date(isoString);
    // Manually shift UTC to IST (+5:30) to avoid locale quirks
    const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const day = pad(istDate.getDate());
    const month = pad(istDate.getMonth() + 1);
    const year = istDate.getFullYear().toString().slice(-2);

    let hours = istDate.getHours();
    const minutes = pad(istDate.getMinutes());
    const seconds = pad(istDate.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hourStr = pad(hours);

    return `${day}/${month}/${year} at ${hourStr}:${minutes}:${seconds} ${ampm}`;
  };

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem("ay11sutra_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch User & Audits
    fetchAudits(token);
    fetchUser(token);
  }, [router]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("ay11sutra_token");
      if (token) fetchAudits(token, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserInfo({ name: data.name });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAudits = async (token: string, query: string = "") => {
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/audits`);
      if (query) url.searchParams.append("query", query);
      
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAudits(data.audits);
      } else if (res.status === 401) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Audit History
            </h1>
          </div>

        </div>
      </div>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Search & Stats */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Filter by URL..." 
              className="pl-9 h-10 bg-white shadow-sm border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
           <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
           </div>
        ) : audits.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No audits found</h3>
            <p className="text-slate-500 mt-1">Start scanning to build your history!</p>
            <Button className="mt-4" onClick={() => router.push("/")}>Start Audit</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {audits.map((audit) => (
              <Card key={audit.id} className="hover:shadow-md transition-shadow border-slate-200">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <h3 className="font-semibold text-slate-900 truncate max-w-md" title={audit.url}>
                         {audit.url}
                       </h3>
                       {audit.cached && (
                         <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-green-50 text-green-700 border-green-200">
                           CACHED
                         </Badge>
                       )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTimeIST(audit.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                       <span className={`block text-lg font-bold ${audit.total_issues === 0 ? "text-green-600" : "text-orange-600"}`}>
                         {audit.total_issues}
                       </span>
                       <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Issues</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hidden sm:flex cursor-pointer hover:bg-slate-100"
                      onClick={() => router.push(`/report?id=${audit.id}`)}
                    >
                      View Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

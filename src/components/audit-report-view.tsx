"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileCode,
  MousePointer2,
  Rocket,
  ShieldCheck,
  Type
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export function AuditReportView({ data, url }: { data: AuditData; url: string }) {
  const exportPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- Helper for Footers ---
    const addFooter = () => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Ay11Sutra Accessibility Report - Page ${pageCount}`, 14, pageHeight - 10);
        doc.text(new Date().toLocaleDateString(), pageWidth - 30, pageHeight - 10);
    };

    // --- Header ---
    doc.setFillColor(15, 23, 42); // slate-900 (Brand Color)
    doc.rect(0, 0, pageWidth, 40, "F");

    // Logo/Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Ay11Sutra Audit Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    let yPos = 55;

    // --- Executive Summary ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Target URL: ${url || "N/A"}`, 14, yPos);
    yPos += 6;
    doc.text(`Total Issues Found: ${data.summary.total}`, 14, yPos);
    yPos += 6;
    
    const criticalCount = data.report.filter(i => i.fix_priority?.includes("CRIT") || i.fix_priority?.includes("HIGH")).length;
    const autoFixable = data.report.filter(i => i.ai_fixed_code).length;
    
    doc.text(`Critical/Serious Issues: ${criticalCount}`, 14, yPos);
    yPos += 6;
    doc.text(`AI-Fixable Issues: ${autoFixable}`, 14, yPos);
    yPos += 15;

    // --- Summary Table ---
    const rows = data.report.map((issue) => [
      issue.rule,
      issue.description,
      issue.fix_priority || "Medium",
      issue.wcag_sc || "N/A",
      issue.selector ? issue.selector.substring(0, 40) + "..." : "N/A"
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [["Violated Rule", "Description", "Priority", "WCAG Criteria", "Selector"]],
      body: rows,
      theme: "grid",
      headStyles: { 
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left'
      },
      styles: { 
          fontSize: 9, 
          cellPadding: 3,
          overflow: 'linebreak',
          valign: 'top'
      },
      columnStyles: { 
          0: { cellWidth: 35 },
          1: { cellWidth: 60 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 40 }
      },
      alternateRowStyles: {
          fillColor: [248, 250, 252]
      },
      didDrawPage: function (data) {
         addFooter();
      },
      margin: { top: 20 }
    });

    // --- Detailed Findings Section ---
    yPos = (doc as any).lastAutoTable.finalY + 20; // Start after table
    
    if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
        addFooter();
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Detailed Findings & AI Remediation", 14, yPos);
    yPos += 10;

    data.report.forEach((issue, index) => {
        // Check for page break
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
            addFooter();
        }

        // Issue Header
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(14, yPos, pageWidth - 28, 8, "F");
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`Issue #${index + 1}: ${issue.rule} (${issue.fix_priority || 'MEDIUM'})`, 18, yPos + 5.5);
        yPos += 12;

        // Description
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85); // slate-700
        
        const descLines = doc.splitTextToSize(`Description: ${issue.description}`, pageWidth - 28);
        doc.text(descLines, 14, yPos);
        yPos += (descLines.length * 4) + 2;

        const selectorLines = doc.splitTextToSize(`Selector: ${issue.selector || 'N/A'}`, pageWidth - 28);
        doc.text(selectorLines, 14, yPos);
        yPos += (selectorLines.length * 4) + 4;

        // AI Explanation & Fix
        if (issue.ai_explanation || issue.ai_fixed_code) {
             if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 20;
                addFooter();
            }

            // AI Box
            doc.setDrawColor(226, 232, 240); // slate-200
            const boxY = yPos;
            
            // AI Badge
            doc.setFillColor(240, 253, 244); // green-50
            doc.rect(14, yPos, pageWidth - 28, 100, "F"); // Placeholder height, will mask
            
            let innerY = yPos + 5;
            doc.setFont("helvetica", "bold");
            doc.setTextColor(21, 128, 61); // green-700
            doc.text("🤖 AI Insight & Solution", 18, innerY + 3);
            innerY += 8;

            doc.setFont("helvetica", "normal");
            doc.setTextColor(22, 101, 52); // green-800
            
            if (issue.ai_explanation) {
                 const explainText = doc.splitTextToSize(issue.ai_explanation, pageWidth - 36);
                 doc.text(explainText, 18, innerY);
                 innerY += (explainText.length * 4) + 4;
            }

            if (issue.ai_fixed_code) {
                doc.setFont("courier", "normal");
                doc.setFontSize(8);
                doc.setTextColor(0, 0, 0);
                
                const codeLines = doc.splitTextToSize(issue.ai_fixed_code, pageWidth - 36);
                // Code block bg
                doc.setFillColor(255, 255, 255);
                doc.rect(18, innerY - 2, pageWidth - 36, (codeLines.length * 3.5) + 4, "F");
                doc.text(codeLines, 20, innerY + 2);
                
                innerY += (codeLines.length * 3.5) + 6;
            }
            
            // Clean up box height
            const boxHeight = innerY - boxY;
            doc.setFillColor(255, 255, 255);
            doc.rect(0, innerY, pageWidth, pageHeight, "F"); // Eraser below
            
            doc.setDrawColor(187, 247, 208); // green-200
            doc.rect(14, boxY, pageWidth - 28, boxHeight); // Border
            
            yPos = innerY + 10;
        } else {
            yPos += 5;
        }
    });

    // Sanitize URL for filename
    const urlSlug = url
      .replace(/^https?:\/\//, '')
      .replace(/[^\w-]/g, '_')
      .slice(0, 30);
      
    const fileName = `Ay11Sutra_Report_${urlSlug}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <Card className="border-slate-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-3">
      <CardHeader className="bg-slate-900 text-white">
        <div className="flex justify-between items-center py-5">
          <div>
            <CardTitle className="text-xl">Audit Report</CardTitle>
            <CardDescription className="text-slate-400">
              {url}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-black border-white/20 hover:bg-white/10 hover:text-white transition-colors"
            onClick={exportPDF}
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Total Issues"
            value={data.summary.total}
            icon={<AlertCircle />}
          />
          <MetricCard
            label="Syntax (Axe)"
            value={data.report.filter((i) => i.category === "syntax" || (!i.category && !i.is_vision)).length}
            color="text-blue-600"
            bg="bg-blue-50"
            icon={<FileCode />}
          />
          <MetricCard
            label="Visual AI"
            value={data.report.filter((i) => i.category === "visual" || i.is_vision).length}
            color="text-purple-600"
            bg="bg-purple-50"
            icon={<Eye />}
          />
          <MetricCard
            label="Semantics"
            value={data.report.filter((i) => i.category === "semantic").length}
            color="text-pink-600"
            bg="bg-pink-50"
            icon={<Type />}
          />
          <MetricCard
            label="Interaction"
            value={data.report.filter((i) => i.category === "interaction").length}
            color="text-indigo-600"
            bg="bg-indigo-50"
            icon={<MousePointer2 />}
          />
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">
              Issues & Remediation
            </h3>
          </div>

          {data.report.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">
                No issues found! 🎉
              </h3>
              <p className="text-slate-500 mt-2">This page passed all accessibility checks.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full space-y-3">
              {data.report.map((issue, idx) => {
                const priority = issue.fix_priority || "LOW";
                const category = issue.category || (issue.is_vision ? "visual" : "syntax");

                return (
                  <AccordionItem
                    key={idx}
                    value={`item-${idx}`}
                    className="bg-white border border-slate-200 rounded-lg px-0 overflow-hidden data-[state=open]:ring-1 data-[state=open]:ring-primary"
                  >
                    <AccordionTrigger className="px-4 py-4 hover:bg-slate-50 hover:no-underline">
                      <div className="flex items-center gap-4 text-left w-full">
                        <PriorityBadge priority={priority} />
                        <CategoryBadge category={category} />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800">{issue.rule}</span>
                          <p className="text-sm text-slate-500 line-clamp-1">{issue.description}</p>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="bg-slate-50/50 border-t px-6 py-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: The Problem */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" /> The Violation
                          </h4>
                          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-sm">
                            <div>
                              <span className="font-semibold text-slate-500">WCAG Criteria:</span>{" "}
                              {issue.wcag_sc || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Selector:</span>{" "}
                              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">
                                {issue.selector?.slice(0, 60) || "N/A"}...
                              </code>
                            </div>
                            <div className="mt-2">
                              <span className="font-semibold text-slate-500 block mb-1">
                                Detected Source:
                              </span>
                              <pre className="bg-slate-900 text-slate-100 text-xs rounded-lg p-3 overflow-x-auto border border-slate-800">
                                <code>{issue.html_snippet || "Code not available"}</code>
                              </pre>
                            </div>
                          </div>
                        </div>

                        {/* Right: The Fix */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                            <Rocket className="w-4 h-4" /> AI Solution
                          </h4>
                          {issue.ai_explanation ? (
                            <div className="space-y-3">
                              <div className="bg-orange-50 p-3 rounded-md text-sm text-orange-900 border border-orange-100">
                                {issue.ai_explanation}
                              </div>
                              <div className="relative">
                                <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-2 py-1 rounded-bl-md rounded-tr-md font-bold">
                                  FIXED
                                </div>
                                <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto border border-slate-800 font-mono">
                                  <code>{issue.ai_fixed_code}</code>
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="text-slate-400 italic">No AI explanation available.</div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components

function MetricCard({ label, value, color = "text-slate-900", bg = "bg-slate-100", icon }: any) {
  return (
    <div className="p-4 rounded-xl border shadow-sm flex items-center justify-between bg-white">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <h3 className={`text-2xl font-extrabold ${color} mt-1`}>{value}</h3>
      </div>
      <div className={`p-2.5 ${bg} rounded-lg`}>
        {icon && <div className={`w-5 h-5 ${color}`}>{icon}</div>}
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority.includes("CRITICAL") || priority.includes("HIGH")) {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Critical</Badge>;
  }
  if (priority.includes("MEDIUM")) {
    return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Serious</Badge>;
  }
  return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Minor</Badge>;
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    semantic: "bg-pink-100 text-pink-700 border-pink-200",
    interaction: "bg-indigo-100 text-indigo-700 border-indigo-200",
    visual: "bg-purple-100 text-purple-700 border-purple-200",
    syntax: "bg-blue-50 text-blue-700 border-blue-200",
  };
  
  return (
    <Badge className={`border ${styles[category] || styles.syntax}`}>
      {category === "syntax" ? "Code" : category.charAt(0).toUpperCase() + category.slice(1)}
    </Badge>
  );
}

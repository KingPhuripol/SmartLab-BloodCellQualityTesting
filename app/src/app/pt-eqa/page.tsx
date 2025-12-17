"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  BarChart3,
  Shield,
  Download,
  Info,
  FileCheck,
  AlertCircle,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Save,
  FileText,
} from "lucide-react";
import {
  generateSummary,
  type PTEQASummary,
  type PTEQAResult,
} from "@/lib/pt-eqa-analysis";
import { exportToCSV } from "@/lib/csv";
import Collapsible from "@/components/Collapsible";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Step = 1 | 2 | 3 | 4 | 5;

export default function PTEQAWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [metadata, setMetadata] = useState<any>(null);

  const [files, setFiles] = useState<any[]>([]);
  const [results, setResults] = useState<PTEQAResult[]>([]);
  const [originalResults, setOriginalResults] = useState<PTEQAResult[]>([]);
  const [summary, setSummary] = useState<PTEQASummary | null>(null);

  const [modelFilter, setModelFilter] = useState<string>("All");
  const [gradeFilter, setGradeFilter] = useState<string>("All");
  const [query, setQuery] = useState<string>("");

  // Editable criteria
  const [allowableErrors, setAllowableErrors] = useState<
    Record<string, number>
  >({
    RBC: 0.2,
    WBC: 1.2,
    PLT: 45,
    Hb: 0.7,
    Hct: 2.1,
    MCV: 4.5,
    MCH: 1.5,
    MCHC: 1.65,
  });

  const [thresholds, setThresholds] = useState({
    excellent: 0.5,
    good: 1.0,
    satisfactory: 2.0,
    unsatisfactory: 3.0,
  });

  // CAPA Records (Mock)
  const [capaRecords, setCapaRecords] = useState<Record<string, string>>({});

  const loadFromMockups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pt-eqa/load", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "ไม่สามารถโหลดข้อมูล PT:EQA ได้"
        );
      }
      const data = await res.json();
      setMetadata(data.metadata || null);
      setFiles(data.files || []);
      const base: PTEQAResult[] = data.ptEqa?.results || [];
      setOriginalResults(base);
      setResults(base);
      setSummary(data.ptEqa?.summary || null);
      setStep(2);
    } catch (e: any) {
      setError(e.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด");
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/pt-eqa/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setMetadata(data.metadata || null);
      setFiles(data.files || []);
      const base: PTEQAResult[] = data.ptEqa?.results || [];
      setOriginalResults(base);
      setResults(base);
      setSummary(data.ptEqa?.summary || null);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 5) as Step);
  const goBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const uniqueModels = Array.from(
    new Set(results.map((r) => r.modelCode))
  ).sort((a, b) => {
    // Always sort numerically (model codes should be integers)
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    // Fallback to alphabetical if not numbers
    return a.localeCompare(b);
  });

  const grades: PTEQAResult["grade"][] = [
    "Excellent",
    "Good",
    "Satisfactory",
    "Unsatisfactory",
    "Serious",
  ];

  const filteredResults = results.filter((r) => {
    const byModel = modelFilter === "All" || r.modelCode === modelFilter;
    const byGrade = gradeFilter === "All" || r.grade === gradeFilter;
    const byQuery =
      !query ||
      r.labCode.toLowerCase().includes(query.toLowerCase()) ||
      r.parameter.toLowerCase().includes(query.toLowerCase());
    return byModel && byGrade && byQuery;
  });

  function assignGradeByThreshold(absZ: number): PTEQAResult["grade"] {
    if (absZ <= thresholds.excellent) return "Excellent";
    if (absZ <= thresholds.good) return "Good";
    if (absZ <= thresholds.satisfactory) return "Satisfactory";
    if (absZ <= thresholds.unsatisfactory) return "Unsatisfactory";
    return "Serious";
  }

  function recomputeWithCriteria(base: PTEQAResult[]) {
    const updated: PTEQAResult[] = base.map((r) => {
      const ae = allowableErrors[r.parameter] || 1;
      const z = Number(((r.measuredValue - r.referenceValue) / ae).toFixed(2));
      const g = assignGradeByThreshold(Math.abs(z));
      const status =
        g === "Unsatisfactory" || g === "Serious" ? "Fail" : "Pass";
      return { ...r, zScore: z, grade: g, status } as PTEQAResult;
    });

    const newSummary = generateSummary(updated);
    if (summary?.assignedValues) {
      newSummary.assignedValues = summary.assignedValues;
    }

    setResults(updated);
    setSummary(newSummary);
  }

  function resetCriteria() {
    setAllowableErrors({
      RBC: 0.2,
      WBC: 1.2,
      PLT: 45,
      Hb: 0.7,
      Hct: 2.1,
      MCV: 4.5,
      MCH: 1.5,
      MCHC: 1.65,
    });
    setThresholds({
      excellent: 0.5,
      good: 1.0,
      satisfactory: 2.0,
      unsatisfactory: 3.0,
    });
    if (originalResults.length) recomputeWithCriteria(originalResults);
  }

  const COLORS = {
    Excellent: "#10b981", // green-500
    Good: "#3b82f6", // blue-500
    Satisfactory: "#eab308", // yellow-500
    Unsatisfactory: "#f97316", // orange-500
    Serious: "#ef4444", // red-500
  };

  const formatValue = (param: string, value: number) => {
    if (param === "PLT") return value.toFixed(0);
    if (["RBC", "WBC"].includes(param)) return value.toFixed(2);
    return value.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                ระบบประเมินคุณภาพห้องปฏิบัติการ (PT:EQA)
              </h1>
              <p className="text-xs text-slate-500">
                Laboratory Quality Assessment System
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10" />
            {[
              { n: 1, label: "เตรียมข้อมูล", sub: "Prepare" },
              { n: 2, label: "ตรวจสอบ & เกณฑ์", sub: "Validate" },
              { n: 3, label: "ประเมินผล", sub: "Evaluate" },
              { n: 4, label: "ทบทวน & แก้ไข", sub: "Review & CAPA" },
              { n: 5, label: "อนุมัติ & ส่งออก", sub: "Export" },
            ].map((item) => (
              <div
                key={item.n}
                className="flex flex-col items-center bg-slate-50 px-2"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all duration-300 ${
                    item.n < step
                      ? "bg-green-500 border-green-500 text-white"
                      : item.n === step
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg scale-110"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {item.n < step ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    item.n
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-bold ${
                      item.n === step ? "text-blue-700" : "text-slate-600"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {item.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold">เกิดข้อผิดพลาด</h3>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => setError("")}
                className="text-xs underline mt-2 hover:text-red-800"
              >
                ปิดแจ้งเตือน
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Prepare */}
        {step === 1 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                เตรียมและเลือกข้อมูล (Prepare Data)
              </h2>
              <p className="text-slate-500 mt-1 ml-10 text-sm">
                เลือกแหล่งข้อมูลที่ต้องการนำมาประเมินผลคุณภาพ
              </p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* System Data */}
              <div
                className="border-2 border-blue-100 rounded-xl p-6 hover:border-blue-400 transition-all bg-blue-50/30 cursor-pointer group"
                onClick={loadFromMockups}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <FileCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">
                    ดึงข้อมูลจากระบบ
                  </h3>
                </div>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  ใช้ข้อมูลไฟล์ CSV ที่มีอยู่ในระบบ (Workspace) โดยอัตโนมัติ
                  เหมาะสำหรับการทดสอบหรือการประเมินประจำรอบ
                </p>
                <button
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all shadow-sm group-hover:shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      โหลดข้อมูลทันที <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Upload Data */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-blue-400 transition-all bg-slate-50/50 flex flex-col justify-center items-center text-center group relative">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">
                  อัปโหลดไฟล์ใหม่
                </h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs">
                  ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                  <span className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium text-sm transition-colors inline-block">
                    เลือกไฟล์ CSV
                  </span>
                </label>
              </div>
            </div>

            <div className="px-8 pb-8">
              <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 flex gap-3">
                <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">คำแนะนำในการเตรียมไฟล์</p>
                  <ul className="list-disc pl-4 space-y-1 opacity-90">
                    <li>ไฟล์ต้องเป็นรูปแบบ CSV (Comma Separated Values)</li>
                    <li>
                      ต้องระบุ <strong>Model Code</strong>{" "}
                      เพื่อให้ระบบจัดกลุ่มการประเมินได้ถูกต้อง
                    </li>
                    <li>
                      ตรวจสอบค่าว่าง (Null) หรือค่าศูนย์ (Zero)
                      ที่ผิดปกติก่อนนำเข้า
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Validate */}
        {step === 2 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  ตรวจสอบและกำหนดเกณฑ์ (Validate & Criteria)
                </h2>
                <p className="text-slate-500 mt-1 ml-10 text-sm">
                  ตรวจสอบความสมบูรณ์ของข้อมูลและตั้งค่าเกณฑ์การยอมรับ
                  (Acceptance Criteria)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resetCriteria()}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> คืนค่าเริ่มต้น
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* File Summary */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  สรุปข้อมูลที่นำเข้า
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm"
                    >
                      <div
                        className="font-medium text-slate-900 truncate"
                        title={f.filename}
                      >
                        {f.filename}
                      </div>
                      <div className="flex justify-between mt-2 text-slate-500 text-xs">
                        <span>{f.validRecords} รายการ</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          พร้อมใช้งาน
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Values Statistics */}
              {summary?.assignedValues && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      ค่าสถิติที่ใช้คำนวณ (Assigned Values Statistics)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      แสดงค่า Mean, SD, %CV ที่คำนวณได้หลังจากตัด Blunder ({">"}
                      10x Mean) และ Outlier (3SD)
                    </p>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            Model
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            Param
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            Mean
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            SD
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            %CV
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            Total
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            Used
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-red-600">
                            Blunder
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-orange-600">
                            Outlier
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {summary.assignedValues
                          .filter(
                            (stat) =>
                              modelFilter === "All" ||
                              stat.modelCode === modelFilter
                          )
                          .map((stat, i) => (
                            <tr
                              key={i}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-2 font-medium text-slate-900">
                                {stat.modelCode}
                              </td>
                              <td className="px-4 py-2 text-slate-600">
                                {stat.parameter}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {formatValue(stat.parameter, stat.mean)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {formatValue(stat.parameter, stat.sd)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {stat.cvPercent.toFixed(2)}%
                              </td>
                              <td className="px-4 py-2 text-right text-slate-500">
                                {stat.nTotal}
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-green-600">
                                {stat.nUsed}
                              </td>
                              <td className="px-4 py-2 text-right text-red-600 font-medium">
                                {stat.nBlunder}
                              </td>
                              <td className="px-4 py-2 text-right text-orange-600 font-medium">
                                {stat.nOutlier}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Criteria Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Allowable Error */}
                <div className="border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow opacity-50 pointer-events-none grayscale">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-100 p-1.5 rounded-md">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">
                      ค่าความคลาดเคลื่อนที่ยอมรับได้ (TEa)
                    </h3>
                    <span className="text-xs text-red-500 ml-auto font-medium">
                      (ไม่ถูกนำมาใช้คำนวณ Z-Score)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.entries(allowableErrors).map(([k, v]) => (
                      <div key={k} className="relative">
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                          {k}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={v}
                          onChange={(e) =>
                            setAllowableErrors((prev) => ({
                              ...prev,
                              [k]: Number(e.target.value) || 0,
                            }))
                          }
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-right"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Z-Score Thresholds */}
                <div className="border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-purple-100 p-1.5 rounded-md">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-slate-800">
                      เกณฑ์การตัดเกรด (Z-Score Thresholds)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Excellent (ดีเยี่ยม)",
                        color: "text-green-600",
                        key: "excellent",
                        bg: "bg-green-50",
                      },
                      {
                        label: "Good (ดี)",
                        color: "text-blue-600",
                        key: "good",
                        bg: "bg-blue-50",
                      },
                      {
                        label: "Satisfactory (พอใช้)",
                        color: "text-yellow-600",
                        key: "satisfactory",
                        bg: "bg-yellow-50",
                      },
                      {
                        label: "Unsatisfactory (ไม่ผ่าน)",
                        color: "text-orange-600",
                        key: "unsatisfactory",
                        bg: "bg-orange-50",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between p-2 rounded-lg ${item.bg}`}
                      >
                        <span className={`text-sm font-medium ${item.color}`}>
                          {item.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">≤</span>
                          <input
                            type="number"
                            step="0.1"
                            // @ts-ignore
                            value={thresholds[item.key]}
                            onChange={(e) =>
                              setThresholds({
                                ...thresholds,
                                [item.key]: Number(e.target.value) || 0,
                              })
                            }
                            className="w-20 border border-slate-300 rounded px-2 py-1 text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-red-500 text-right font-medium mt-2">
                      * ค่าที่เกินกว่า Unsatisfactory จะถือเป็น Serious
                      (ร้ายแรง)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() =>
                    recomputeWithCriteria(
                      originalResults.length ? originalResults : results
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> คำนวณผลใหม่ (Re-calculate)
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={goBack}
                className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors"
              >
                ยืนยันและดำเนินการต่อ <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Evaluate */}
        {step === 3 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                ประเมินผล (Evaluate)
              </h2>
              <p className="text-slate-500 mt-1 ml-10 text-sm">
                วิเคราะห์ผลการทดสอบ Z-Score และการกระจายตัวของเกรด
              </p>
            </div>

            <div className="p-6">
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="p-5 bg-green-50 border border-green-100 rounded-xl shadow-sm">
                    <div className="text-xs text-green-600 font-bold uppercase tracking-wider">
                      อัตราการผ่าน (Pass Rate)
                    </div>
                    <div className="text-3xl font-bold text-green-700 mt-2">
                      {summary.passRate}%
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wider">
                      ค่าเฉลี่ย |Z-Score|
                    </div>
                    <div className="text-3xl font-bold text-blue-700 mt-2">
                      {summary.averageZScore}
                    </div>
                  </div>
                  <div className="p-5 bg-purple-50 border border-purple-100 rounded-xl shadow-sm">
                    <div className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                      จำนวนรายการ
                    </div>
                    <div className="text-3xl font-bold text-purple-700 mt-2">
                      {summary.totalEvaluations}
                    </div>
                  </div>
                  <div className="p-5 bg-orange-50 border border-orange-100 rounded-xl shadow-sm">
                    <div className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                      ต้องแก้ไข (Fail)
                    </div>
                    <div className="text-3xl font-bold text-orange-700 mt-2">
                      {summary.gradeDistribution.Unsatisfactory +
                        summary.gradeDistribution.Serious}
                    </div>
                  </div>
                </div>
              )}

              {/* Assigned Values Statistics (Summary) */}
              {summary?.assignedValues && (
                <div className="mb-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      ค่าสถิติที่ใช้คำนวณ (Assigned Values Statistics)
                    </h3>
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          "assigned-stats-table"
                        );
                        if (el) el.classList.toggle("hidden");
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      แสดง/ซ่อน
                    </button>
                  </div>
                  <div
                    id="assigned-stats-table"
                    className="overflow-x-auto max-h-64 hidden"
                  >
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            Model
                          </th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">
                            Param
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            Mean
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            SD
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            %CV
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            Total
                          </th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-600">
                            Used
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {summary.assignedValues
                          .filter(
                            (stat) =>
                              modelFilter === "All" ||
                              stat.modelCode === modelFilter
                          )
                          .map((stat, i) => (
                            <tr
                              key={i}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-2 font-medium text-slate-900">
                                {stat.modelCode}
                              </td>
                              <td className="px-4 py-2 text-slate-600">
                                {stat.parameter}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {formatValue(stat.parameter, stat.mean)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {formatValue(stat.parameter, stat.sd)}
                              </td>
                              <td className="px-4 py-2 text-right font-mono">
                                {stat.cvPercent.toFixed(2)}%
                              </td>
                              <td className="px-4 py-2 text-right text-slate-500">
                                {stat.nTotal}
                              </td>
                              <td className="px-4 py-2 text-right font-medium text-green-600">
                                {stat.nUsed}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4">
                    การกระจายตัวของเกรด (Grade Distribution)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Object.entries(
                          filteredResults.reduce(
                            (acc, r) => {
                              acc[r.grade] = (acc[r.grade] || 0) + 1;
                              return acc;
                            },
                            {
                              Excellent: 0,
                              Good: 0,
                              Satisfactory: 0,
                              Unsatisfactory: 0,
                              Serious: 0,
                            } as Record<string, number>
                          )
                        ).map(([k, v]) => ({ name: k, value: v }))}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {Object.keys(COLORS).map((k, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                COLORS[k as keyof typeof COLORS] || "#8884d8"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4">
                    ค่าเฉลี่ย |Z| แยกตามรุ่น (Avg |Z| by Model)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={Array.from(
                          results.reduce((map, r) => {
                            const key = r.modelCode;
                            const cur = map.get(key) || {
                              model: key,
                              sum: 0,
                              n: 0,
                            };
                            cur.sum += Math.abs(r.zScore);
                            cur.n += 1;
                            map.set(key, cur);
                            return map;
                          }, new Map<string, { model: string; sum: number; n: number }>())
                        ).map(([, v]) => ({
                          model: v.model,
                          avg: Number((v.sum / v.n).toFixed(2)),
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="model"
                          type="category"
                          width={80}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="avg"
                          fill="#3b82f6"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table with Filters */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">
                      ตัวกรองข้อมูล
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                    >
                      <option value="All">ทุกรุ่น (All Models)</option>
                      {uniqueModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                    >
                      <option value="All">ทุกเกรด (All Grades)</option>
                      {grades.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="ค้นหา Lab Code..."
                        className="text-sm border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none w-48"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Lab Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Param
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Measured
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Ref
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Z-Score
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredResults.slice(0, 100).map((r, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm font-medium text-slate-900">
                            {r.labCode}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-500">
                            {r.modelCode}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-900">
                            {r.parameter}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-slate-600">
                            {formatValue(r.parameter, r.measuredValue)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-slate-600">
                            {formatValue(r.parameter, r.referenceValue)}
                          </td>
                          <td
                            className={`px-6 py-3 text-sm text-right font-mono font-bold ${
                              Math.abs(r.zScore) > 2
                                ? "text-red-600"
                                : "text-slate-700"
                            }`}
                          >
                            {r.zScore.toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${
                                r.grade === "Excellent"
                                  ? "bg-green-100 text-green-800"
                                  : r.grade === "Good"
                                  ? "bg-blue-100 text-blue-800"
                                  : r.grade === "Satisfactory"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {r.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredResults.length > 100 && (
                    <div className="px-6 py-3 bg-slate-50 text-center text-xs text-slate-500 border-t border-slate-200">
                      แสดง 100 รายการแรกจากทั้งหมด {filteredResults.length}{" "}
                      รายการ
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={goBack}
                className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors"
              >
                ดำเนินการต่อ <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </section>
        )}

        {/* Step 4: Review & CAPA */}
        {step === 4 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  4
                </span>
                ทบทวนและแก้ไข (Review & CAPA)
              </h2>
              <p className="text-slate-500 mt-1 ml-10 text-sm">
                จัดการข้อบกพร่อง (Non-conformities) และบันทึกการแก้ไข
                (Corrective Actions)
              </p>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl p-5">
                <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  รายการที่ต้องดำเนินการแก้ไข (Action Required)
                </h3>
                <p className="text-sm text-orange-700 mb-4">
                  พบผลการประเมินที่ไม่ผ่านเกณฑ์ (Unsatisfactory/Serious) จำนวน{" "}
                  {results.filter((r) => r.status === "Fail").length} รายการ
                </p>

                <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-orange-100">
                    <thead className="bg-orange-50/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-orange-800">
                          Lab Code
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-orange-800">
                          Parameter
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-orange-800">
                          Z-Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-orange-800">
                          Grade
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-orange-800">
                          CAPA Note
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                      {results
                        .filter((r) => r.status === "Fail")
                        .map((r, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">
                              {r.labCode}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {r.parameter}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                              {r.zScore.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
                                {r.grade}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="text"
                                placeholder="ระบุสาเหตุ/การแก้ไข..."
                                className="w-full text-sm border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-orange-500 outline-none"
                                value={
                                  capaRecords[`${r.labCode}-${r.parameter}`] ||
                                  ""
                                }
                                onChange={(e) =>
                                  setCapaRecords((prev) => ({
                                    ...prev,
                                    [`${r.labCode}-${r.parameter}`]:
                                      e.target.value,
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      {results.filter((r) => r.status === "Fail").length ===
                        0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-green-600 font-medium"
                          >
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                            ไม่พบรายการที่ต้องแก้ไข (All Passed)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-5">
                  <h3 className="font-bold text-slate-800 mb-3">
                    บันทึกข้อเสนอแนะ (Comments)
                  </h3>
                  <textarea
                    className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="ระบุข้อคิดเห็นเพิ่มเติมสำหรับการประเมินรอบนี้..."
                  ></textarea>
                </div>
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <h3 className="font-bold text-slate-800 mb-3">
                    การรับรองผล (Approval)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="approve1"
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <label
                        htmlFor="approve1"
                        className="text-sm text-slate-700"
                      >
                        ยืนยันความถูกต้องของข้อมูลดิบ
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="approve2"
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <label
                        htmlFor="approve2"
                        className="text-sm text-slate-700"
                      >
                        ยืนยันเกณฑ์การประเมิน (Criteria)
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="approve3"
                        className="h-4 w-4 text-blue-600 rounded border-slate-300"
                      />
                      <label
                        htmlFor="approve3"
                        className="text-sm text-slate-700"
                      >
                        อนุมัติผลการประเมินอย่างเป็นทางการ
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between">
              <button
                onClick={goBack}
                className="px-6 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors"
              >
                ย้อนกลับ
              </button>
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center font-medium shadow-sm transition-colors"
              >
                บันทึกและไปหน้าส่งออก <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </section>
        )}

        {/* Step 5: Export */}
        {step === 5 && (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  5
                </span>
                อนุมัติและส่งออก (Approve & Export)
              </h2>
              <p className="text-slate-500 mt-1 ml-10 text-sm">
                เสร็จสิ้นกระบวนการประเมิน ดาวน์โหลดรายงานผล
              </p>
            </div>

            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                การประเมินเสร็จสมบูรณ์
              </h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                ระบบได้ทำการประมวลผลและบันทึกข้อมูลเรียบร้อยแล้ว
                ท่านสามารถดาวน์โหลดไฟล์รายงานผลการประเมินได้ด้านล่าง
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() =>
                    exportToCSV(
                      results,
                      `PT_EQA_Results_${new Date()
                        .toISOString()
                        .slice(0, 10)}.csv`
                    )
                  }
                  className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 font-bold text-lg"
                >
                  <Download className="h-6 w-6" /> ดาวน์โหลดไฟล์ CSV
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 font-bold text-lg"
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 max-w-2xl mx-auto">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                  สรุปผลการดำเนินการ
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-slate-800">
                      {results.length}
                    </div>
                    <div className="text-xs text-slate-500">รายการทั้งหมด</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {summary?.passRate}%
                    </div>
                    <div className="text-xs text-slate-500">อัตราการผ่าน</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(capaRecords).length}
                    </div>
                    <div className="text-xs text-slate-500">
                      รายการแก้ไข (CAPA)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

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
} from "lucide-react";
import type { ProcessedCSVData, PTEQAResult } from "@/lib/csv";
import type { UniversalProcessedData } from "@/lib/universal-csv-processor";
import type { PTEQASummary } from "@/lib/pt-eqa-analysis";
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
} from "recharts";

type Step = 1 | 2 | 3 | 4 | 5;

export default function PTEQAWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [metadata, setMetadata] = useState<any>(null);

  const [files, setFiles] = useState<any[]>([]);
  const [results, setResults] = useState<PTEQAResult[]>([]); // computed/displayed
  const [originalResults, setOriginalResults] = useState<PTEQAResult[]>([]);
  const [summary, setSummary] = useState<{
    passRate: number;
    averageZScore: number;
    gradeDistribution: Record<PTEQAResult["grade"], number>;
    totalEvaluations: number;
  } | null>(null);
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

  const loadFromMockups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pt-eqa/load", { cache: "no-store" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || errorData.message || "Failed to load PT:EQA data"
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
      setError(e.message || "Unexpected error");
      console.error("Load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => setStep((s) => Math.min(s + 1, 5) as Step);
  const goBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const uniqueModels = Array.from(
    new Set(results.map((r) => r.modelCode))
  ).sort();
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
    const gradeCounts: Record<PTEQAResult["grade"], number> = {
      Excellent: 0,
      Good: 0,
      Satisfactory: 0,
      Unsatisfactory: 0,
      Serious: 0,
    };
    let sumAbsZ = 0;
    updated.forEach((r) => {
      gradeCounts[r.grade]++;
      sumAbsZ += Math.abs(r.zScore);
    });
    const total = Math.max(updated.length, 1);
    const passCount =
      gradeCounts.Excellent + gradeCounts.Good + gradeCounts.Satisfactory;
    const newSummary = {
      passRate: Number(((passCount / total) * 100).toFixed(1)),
      averageZScore: Number((sumAbsZ / total).toFixed(2)),
      gradeDistribution: gradeCounts,
      totalEvaluations: updated.length,
    } as typeof summary extends infer T ? NonNullable<T> : any;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <FileSpreadsheet className="h-7 w-7 text-blue-600 mr-3" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                PT:EQA Evaluation Wizard
              </h1>
              <p className="text-xs md:text-sm text-gray-600">
                Step-by-step process aligned with official evaluation procedures
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-3 py-2 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stepper */}
        <ol className="flex items-center w-full mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <li
              key={n}
              className={`flex-1 flex items-center ${
                n < step
                  ? "text-green-600"
                  : n === step
                  ? "text-blue-600"
                  : "text-gray-400"
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 rounded-full border ${
                  n < step
                    ? "bg-green-50 border-green-400"
                    : n === step
                    ? "bg-blue-50 border-blue-400"
                    : "bg-white border-gray-300"
                }`}
              >
                {n < step ? <CheckCircle2 className="h-5 w-5" /> : n}
              </span>
              <span className="ml-2 text-sm hidden sm:inline">
                {n === 1 && "Prepare & Select Data"}
                {n === 2 && "Validate & Criteria"}
                {n === 3 && "Calculate & Grade"}
                {n === 4 && "Review & CAPA"}
                {n === 5 && "Approve & Export"}
              </span>
              {n < 5 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
            </li>
          ))}
        </ol>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Step content */}
        {step === 1 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 1 — Prepare & Select Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <FileCheck className="h-4 w-4 mr-2 text-green-600" /> Use Real
                  Workspace Data
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Load actual CSV files from workspace including BloodData -
                  Test01.csv, Combined_Test_Data.csv, and Blood Test Mockup CSVs
                  folder.
                </p>
                {metadata && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                    <div className="font-medium text-blue-900">
                      ✓ Previously loaded:
                    </div>
                    <div className="text-blue-700 mt-1">
                      {metadata.filesLoaded?.slice(0, 3).join(", ")}
                      {metadata.filesLoaded?.length > 3 &&
                        ` +${metadata.filesLoaded.length - 3} more`}
                    </div>
                    <div className="text-blue-600 mt-1">
                      {metadata.totalRecords || 0} records,{" "}
                      {metadata.evaluations || 0} evaluations
                    </div>
                  </div>
                )}
                <button
                  disabled={loading}
                  onClick={loadFromMockups}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      Load Real Data
                    </>
                  )}
                </button>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Upload className="h-4 w-4 mr-2" /> Upload CSV Files
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  You can also upload CSVs (same format) to run an ad-hoc
                  evaluation.
                </p>
                <input
                  type="file"
                  multiple
                  accept=".csv"
                  className="text-sm"
                  onChange={(e) =>
                    alert(
                      "Upload via wizard coming soon. Use mockup loader for now."
                    )
                  }
                />
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Info className="h-4 w-4 mr-2" /> Quick guidance
                </h3>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                  <li>Use consistent CSV format.</li>
                  <li>Ensure Model code is present for grouping.</li>
                  <li>Clean zeros or invalid values.</li>
                </ul>
                <Collapsible title="Show details" className="mt-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      Required columns: Lab Code, Brand code, Model code,
                      parameters.
                    </li>
                    <li>
                      Split evaluation by Model code for like-for-like
                      comparisons.
                    </li>
                    <li>
                      See full method for rationale and examples.
                      <a
                        href="/pt-eqa/method"
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        Open method
                      </a>
                    </li>
                  </ul>
                </Collapsible>
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 2 — Validate structure & set criteria
            </h2>
            {files.length === 0 ? (
              <p className="text-sm text-gray-600">
                No files detected. Go back and load data.
              </p>
            ) : (
              <div className="space-y-3">
                {files.map((f, i) => (
                  <div
                    key={i}
                    className="border rounded-md p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 flex items-center gap-2">
                        {f.filename}
                        <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          {f.format}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Records: {f.validRecords} / {f.totalRecords} · Models:{" "}
                        {f.modelCodes?.join(", ") || "-"}
                      </div>
                    </div>
                    <div className="text-xs">
                      {f.statistics?.measuredRBC && (
                        <span className="inline-block px-2 py-1 bg-gray-50 border rounded">
                          RBC μ: {f.statistics.measuredRBC.mean}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="mt-3 p-3 rounded border bg-blue-50/60">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    Evaluation criteria (summary)
                  </div>
                  <div className="text-xs text-blue-900">
                    |Z| thresholds: Excellent ≤0.5, Good ≤1.0, Satisfactory
                    ≤2.0, Unsatisfactory ≤3.0, Serious &gt;3.0.
                  </div>
                  <Collapsible title="See details" className="mt-2">
                    <ul className="list-disc pl-5 space-y-1 text-gray-700">
                      <li>
                        Apply allowable error and reference rules per parameter.
                      </li>
                      <li>
                        Flag missing/invalid values and exclude from scoring.
                      </li>
                      <li>
                        Method background and examples are available on the
                        <a
                          href="/pt-eqa/method"
                          className="ml-1 text-blue-600 hover:underline"
                        >
                          Method page
                        </a>
                        .
                      </li>
                    </ul>
                  </Collapsible>
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-800 mb-1">
                      Edit criteria
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Allowable errors table */}
                      <div className="border rounded p-2 bg-white">
                        <div className="text-xs text-gray-600 mb-2">
                          Allowable error per parameter
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          {Object.entries(allowableErrors).map(([k, v]) => (
                            <label key={k} className="flex items-center gap-2">
                              <span className="w-14 text-gray-700">{k}</span>
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
                                className="flex-1 border rounded px-2 py-1"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      {/* Thresholds */}
                      <div className="border rounded p-2 bg-white">
                        <div className="text-xs text-gray-600 mb-2">
                          Z-score grading thresholds (by |Z|)
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2">
                            <span className="w-28 text-gray-700">
                              Excellent ≤
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              value={thresholds.excellent}
                              onChange={(e) =>
                                setThresholds({
                                  ...thresholds,
                                  excellent: Number(e.target.value) || 0,
                                })
                              }
                              className="flex-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex items-center gap-2">
                            <span className="w-28 text-gray-700">Good ≤</span>
                            <input
                              type="number"
                              step="0.1"
                              value={thresholds.good}
                              onChange={(e) =>
                                setThresholds({
                                  ...thresholds,
                                  good: Number(e.target.value) || 0,
                                })
                              }
                              className="flex-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex items-center gap-2">
                            <span className="w-28 text-gray-700">
                              Satisfactory ≤
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              value={thresholds.satisfactory}
                              onChange={(e) =>
                                setThresholds({
                                  ...thresholds,
                                  satisfactory: Number(e.target.value) || 0,
                                })
                              }
                              className="flex-1 border rounded px-2 py-1"
                            />
                          </label>
                          <label className="flex items-center gap-2">
                            <span className="w-28 text-gray-700">
                              Unsatisfactory ≤
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              value={thresholds.unsatisfactory}
                              onChange={(e) =>
                                setThresholds({
                                  ...thresholds,
                                  unsatisfactory: Number(e.target.value) || 0,
                                })
                              }
                              className="flex-1 border rounded px-2 py-1"
                            />
                          </label>
                          <div className="col-span-2 text-[11px] text-gray-500">
                            Serious &gt; Unsatisfactory threshold
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => resetCriteria()}
                        className="px-3 py-1.5 border rounded text-gray-700 hover:bg-gray-50"
                        type="button"
                      >
                        Reset defaults
                      </button>
                      <button
                        onClick={() =>
                          recomputeWithCriteria(
                            originalResults.length ? originalResults : results
                          )
                        }
                        className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                        type="button"
                      >
                        Apply criteria
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-4 flex justify-between">
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                onClick={goNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 3 — Calculate Z-scores and assign grades
            </h2>
            {summary ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 border rounded">
                  <div className="text-2xl font-bold text-green-700">
                    {summary.passRate}%
                  </div>
                  <div className="text-sm text-green-700">Pass Rate</div>
                </div>
                <div className="p-4 bg-blue-50 border rounded">
                  <div className="text-2xl font-bold text-blue-700">
                    {summary.averageZScore}
                  </div>
                  <div className="text-sm text-blue-700">Avg |Z-score|</div>
                </div>
                <div className="p-4 bg-yellow-50 border rounded">
                  <div className="text-2xl font-bold text-yellow-700">
                    {summary.totalEvaluations}
                  </div>
                  <div className="text-sm text-yellow-700">Evaluations</div>
                </div>
                <div className="p-4 bg-purple-50 border rounded">
                  <div className="text-sm text-purple-700">Grades</div>
                  <div className="text-xs text-purple-700">
                    E:{summary.gradeDistribution.Excellent} G:
                    {summary.gradeDistribution.Good} S:
                    {summary.gradeDistribution.Satisfactory} U:
                    {summary.gradeDistribution.Unsatisfactory} Sr:
                    {summary.gradeDistribution.Serious}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No summary available.</p>
            )}

            {/* Charts */}
            {summary && results.length > 0 && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Grade distribution */}
                <div className="p-4 border rounded bg-white">
                  <div className="text-sm font-medium text-gray-800 mb-2">
                    Grade distribution
                  </div>
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={[
                          {
                            grade: "Excellent",
                            count: summary.gradeDistribution.Excellent,
                          },
                          {
                            grade: "Good",
                            count: summary.gradeDistribution.Good,
                          },
                          {
                            grade: "Satisfactory",
                            count: summary.gradeDistribution.Satisfactory,
                          },
                          {
                            grade: "Unsatisfactory",
                            count: summary.gradeDistribution.Unsatisfactory,
                          },
                          {
                            grade: "Serious",
                            count: summary.gradeDistribution.Serious,
                          },
                        ]}
                        margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Avg |Z| by model */}
                <div className="p-4 border rounded bg-white">
                  <div className="text-sm font-medium text-gray-800 mb-2">
                    Average |Z| by model
                  </div>
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
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
                        )
                          .map(([, v]) => ({
                            model: v.model,
                            avg: Number((v.sum / v.n).toFixed(2)),
                          }))
                          .sort((a, b) => a.model.localeCompare(b.model))}
                        margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="model"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          height={50}
                          tickMargin={8}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="avg"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Filter by model
                </label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm"
                  value={modelFilter}
                  onChange={(e) => setModelFilter(e.target.value)}
                >
                  <option value="All">All models</option>
                  {uniqueModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Filter by grade
                </label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm"
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                >
                  <option value="All">All grades</option>
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-600 mb-1">
                  Search (Lab Code / Parameter)
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="e.g., 00012 or RBC"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Results table */}
            <div className="mt-4 border rounded-md overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2">Lab Code</th>
                    <th className="text-left px-3 py-2">Model</th>
                    <th className="text-left px-3 py-2">Parameter</th>
                    <th className="text-right px-3 py-2">Measured</th>
                    <th className="text-right px-3 py-2">Reference</th>
                    <th className="text-right px-3 py-2">Z-score</th>
                    <th className="text-left px-3 py-2">Grade</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td
                        className="px-3 py-3 text-center text-gray-500"
                        colSpan={8}
                      >
                        No records match the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.slice(0, 500).map((r, idx) => (
                      <tr
                        key={`${r.labCode}-${r.modelCode}-${r.parameter}-${idx}`}
                        className="border-t"
                      >
                        <td className="px-3 py-2">{r.labCode}</td>
                        <td className="px-3 py-2">{r.modelCode}</td>
                        <td className="px-3 py-2">{r.parameter}</td>
                        <td className="px-3 py-2 text-right">
                          {r.measuredValue.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.referenceValue.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.zScore.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              r.grade === "Excellent"
                                ? "text-green-700"
                                : r.grade === "Good"
                                ? "text-emerald-700"
                                : r.grade === "Satisfactory"
                                ? "text-yellow-700"
                                : r.grade === "Unsatisfactory"
                                ? "text-orange-700"
                                : "text-red-700"
                            }
                          >
                            {r.grade}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={
                              r.status === "Pass"
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredResults.length > 500 && (
                <div className="px-3 py-2 text-xs text-gray-500">
                  Showing first 500 rows. Refine filters to see more.
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                onClick={goNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 4 — Review nonconformities & CAPA
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded">
                <BarChart3 className="h-5 w-5 text-gray-500 mb-2" />
                <div className="text-sm text-gray-700">
                  Inspect metrics and grade distribution. Confirm trends are
                  within acceptable limits.
                </div>
              </div>
              <div className="p-4 border rounded">
                <Shield className="h-5 w-5 text-gray-500 mb-2" />
                <div className="text-sm text-gray-700">
                  Identify Serious or repeated Unsatisfactory results. Document
                  root cause and corrective actions.
                </div>
              </div>
              <div className="p-4 border rounded">
                <CheckCircle2 className="h-5 w-5 text-gray-500 mb-2" />
                <div className="text-sm text-gray-700">
                  Sign-off the evaluation (authorized reviewer) and proceed to
                  official report generation.
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                onClick={goNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Continue
              </button>
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step 5 — Approve & Export
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Download PT:EQA evaluation results as CSV for record keeping and
              submission.
            </p>
            <button
              onClick={() =>
                exportToCSV(
                  results,
                  `PT_EQA_Results_${new Date().toISOString().slice(0, 10)}.csv`
                )
              }
              className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </button>
            <div className="mt-4 flex justify-between">
              <button
                onClick={goBack}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Back
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Finish
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

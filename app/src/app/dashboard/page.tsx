"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  BarChart3,
  Shield,
  Upload,
  TrendingUp,
  PlayCircle,
  Download,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Settings,
  User,
  ArrowRight,
} from "lucide-react";

// Mock data for demo - updated with PT:EQA results
const mockStatistics = {
  total_files_processed: 10,
  grade_summary: {
    Excellent: 156,
    Good: 89,
    Satisfactory: 34,
    Unsatisfactory: 18,
    Serious: 3,
  },
  pass_rate: 92.1,
  average_z_score: 1.2,
};

// Available CSV files from Blood Test Mockup CSVs Sept 28 2025
const mockupCSVFiles = [
  "500-AV.csv",
  "500-E.csv",
  "500-RAW.csv",
  "500-cut-blunder.csv",
  "503-AV.csv",
  "503-E.csv",
  "503.csv",
  "504-AV.csv",
  "504-E.csv",
  "504.csv",
];

interface BatchResult {
  filename: string;
  status: "processing" | "completed" | "error";
  recordCount: number;
  modelCodes: string[];
  gradeDistribution: Record<string, number>;
  passRate: number;
  error?: string;
}

export default function DashboardPage() {
  const [statistics, setStatistics] = useState(mockStatistics);
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const router = useRouter();

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus("กำลังอัปโหลดและวิเคราะห์ข้อมูล...");
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setUploadStatus(
        `สำเร็จ: ไฟล์ ${selectedFile.name} ประมวลผลเรียบร้อยแล้ว!`
      );
      setSelectedFile(null);
      // Simulate new model added
      const newModel = `Model_${Math.floor(Math.random() * 900) + 100}`;
      if (!models.includes(newModel)) {
        setModels([...models, newModel]);
      }
    } catch (error) {
      setUploadStatus(
        `เกิดข้อผิดพลาด: ${
          error instanceof Error ? error.message : "การอัปโหลดล้มเหลว"
        }`
      );
    }
  };

  const handleBatchTest = async () => {
    setIsLoading(true);
    setBatchResults([]);
    setUploadStatus("กำลังประมวลผลไฟล์ทั้งหมดจากโฟลเดอร์ตัวอย่าง...");

    try {
      // Process each file sequentially
      for (const filename of mockupCSVFiles) {
        setBatchResults((prev) => [
          ...prev,
          {
            filename,
            status: "processing",
            recordCount: 0,
            modelCodes: [],
            gradeDistribution: {},
            passRate: 0,
          },
        ]);

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 1500));

        try {
          // Generate mock results based on filename
          const mockRecordCount = Math.floor(Math.random() * 150) + 50;
          const mockModelMatch = filename.match(/(\d+)/);
          const baseModel = mockModelMatch ? parseInt(mockModelMatch[1]) : 500;
          const modelCodes = [`Model_${baseModel}`, `Model_${baseModel + 1}`];

          const gradeDistribution = {
            Excellent: Math.floor(Math.random() * 50) + 20,
            Good: Math.floor(Math.random() * 30) + 15,
            Satisfactory: Math.floor(Math.random() * 20) + 5,
            Unsatisfactory: Math.floor(Math.random() * 10),
            Serious: Math.floor(Math.random() * 5),
          };

          const totalGrades = Object.values(gradeDistribution).reduce(
            (sum, count) => sum + count,
            0
          );
          const passCount =
            gradeDistribution.Excellent +
            gradeDistribution.Good +
            gradeDistribution.Satisfactory;
          const passRate = Number(((passCount / totalGrades) * 100).toFixed(1));

          setBatchResults((prev) =>
            prev.map((result) =>
              result.filename === filename
                ? {
                    ...result,
                    status: "completed",
                    recordCount: mockRecordCount,
                    modelCodes,
                    gradeDistribution,
                    passRate,
                  }
                : result
            )
          );

          // Update overall statistics
          setStatistics((prev) => ({
            total_files_processed: prev.total_files_processed + 1,
            grade_summary: {
              Excellent:
                prev.grade_summary.Excellent + gradeDistribution.Excellent,
              Good: prev.grade_summary.Good + gradeDistribution.Good,
              Satisfactory:
                prev.grade_summary.Satisfactory +
                gradeDistribution.Satisfactory,
              Unsatisfactory:
                prev.grade_summary.Unsatisfactory +
                gradeDistribution.Unsatisfactory,
              Serious: prev.grade_summary.Serious + gradeDistribution.Serious,
            },
            pass_rate: prev.pass_rate,
            average_z_score: prev.average_z_score,
          }));

          // Add new models
          setModels((prev: string[]) => {
            const newModels = [...prev];
            modelCodes.forEach((model) => {
              if (!newModels.includes(model)) {
                newModels.push(model);
              }
            });
            return newModels;
          });
        } catch (error) {
          setBatchResults((prev) =>
            prev.map((result) =>
              result.filename === filename
                ? {
                    ...result,
                    status: "error",
                    error:
                      error instanceof Error
                        ? error.message
                        : "Processing failed",
                  }
                : result
            )
          );
        }
      }

      setUploadStatus(
        `สำเร็จ: ประมวลผลไฟล์ทั้งหมด ${mockupCSVFiles.length} ไฟล์เรียบร้อยแล้ว!`
      );
    } catch (error) {
      setUploadStatus(
        `ข้อผิดพลาด: ${
          error instanceof Error ? error.message : "Batch processing failed"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const exportBatchResults = () => {
    const csvContent = [
      [
        "Filename",
        "Status",
        "Records",
        "Models",
        "Pass Rate",
        "Excellent",
        "Good",
        "Satisfactory",
        "Unsatisfactory",
        "Serious",
      ].join(","),
      ...batchResults.map((result) =>
        [
          result.filename,
          result.status,
          result.recordCount,
          result.modelCodes.join(";"),
          `${result.passRate}%`,
          result.gradeDistribution.Excellent || 0,
          result.gradeDistribution.Good || 0,
          result.gradeDistribution.Satisfactory || 0,
          result.gradeDistribution.Unsatisfactory || 0,
          result.gradeDistribution.Serious || 0,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `PT_EQA_Batch_Results_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                SmartLab <span className="text-blue-600">QC System</span>
              </h1>
              <p className="text-xs text-slate-500">
                ระบบวิเคราะห์คุณภาพโลหิตวิทยา (Blood Cell Quality Testing)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <User className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                ผู้ใช้งานสาธิต (Demo User)
              </span>
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* PT:EQA Wizard CTA */}
        <div
          className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group cursor-pointer"
          onClick={() => router.push("/pt-eqa")}
        >
          <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
            <FileSpreadsheet className="h-64 w-64" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <PlayCircle className="h-8 w-8" />
              เริ่มการประเมินคุณภาพ (PT:EQA Wizard)
            </h2>
            <p className="text-blue-100 mb-6 max-w-xl text-lg">
              เข้าสู่กระบวนการประเมินคุณภาพตามมาตรฐานสากล
              พร้อมระบบนำทางทีละขั้นตอน (Step-by-step) ตรวจสอบ แก้ไข
              และสร้างรายงานผลอัตโนมัติ
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push("/pt-eqa");
              }}
              className="px-6 py-3 bg-white text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
            >
              เข้าสู่ระบบประเมิน <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Total Files
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {statistics.total_files_processed}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              ไฟล์ที่ประมวลผลแล้ว
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Excellent
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {statistics.grade_summary.Excellent}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              รายการที่ได้เกรดดีเยี่ยม
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Warning
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {statistics.grade_summary.Satisfactory +
                statistics.grade_summary.Unsatisfactory}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              ต้องเฝ้าระวัง (Sat/Unsat)
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">
                Pass Rate
              </span>
            </div>
            <div className="text-3xl font-bold text-slate-900">
              {statistics.pass_rate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-500 mt-1">
              อัตราการผ่านเกณฑ์รวม
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload & Batch Test */}
          <div className="lg:col-span-2 space-y-8">
            {/* Batch Testing Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-blue-600" />
                    การทดสอบแบบกลุ่ม (Batch Test)
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    ประมวลผลไฟล์ทั้งหมดจากโฟลเดอร์ตัวอย่าง (Mockup Data)
                  </p>
                </div>
                <button
                  onClick={handleBatchTest}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      กำลังประมวลผล...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      เริ่มทดสอบทั้งหมด
                    </>
                  )}
                </button>
              </div>

              <div className="p-6 bg-slate-50">
                {batchResults.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-700">
                        ผลการทดสอบ ({batchResults.length} ไฟล์)
                      </h3>
                      {batchResults.some((r) => r.status === "completed") && (
                        <button
                          onClick={exportBatchResults}
                          className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 bg-white px-3 py-1 rounded border border-green-200 shadow-sm"
                        >
                          <Download className="h-4 w-4" />
                          Export CSV
                        </button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {batchResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border transition-all ${
                            result.status === "completed"
                              ? "bg-white border-green-200 shadow-sm"
                              : result.status === "processing"
                              ? "bg-white border-blue-200 shadow-sm animate-pulse"
                              : "bg-white border-red-200 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {result.status === "completed" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : result.status === "processing" ? (
                                <div className="h-5 w-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <span className="font-medium text-slate-900">
                                {result.filename}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full ${
                                result.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : result.status === "processing"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {result.status === "completed"
                                ? "เสร็จสมบูรณ์"
                                : result.status === "processing"
                                ? "กำลังทำ..."
                                : "ล้มเหลว"}
                            </span>
                          </div>

                          {result.status === "completed" && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                              <div>
                                <span className="block text-slate-400 font-medium">
                                  Records
                                </span>
                                <span className="font-bold text-slate-900">
                                  {result.recordCount}
                                </span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-medium">
                                  Pass Rate
                                </span>
                                <span className="font-bold text-green-600">
                                  {result.passRate}%
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="block text-slate-400 font-medium">
                                  Models
                                </span>
                                <span className="font-bold text-slate-900 truncate block">
                                  {result.modelCodes.join(", ")}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>กดปุ่ม "เริ่มทดสอบทั้งหมด" เพื่อประมวลผลไฟล์ตัวอย่าง</p>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                อัปโหลดไฟล์ใหม่ (Upload CSV)
              </h2>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-400 transition-colors bg-slate-50">
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex flex-col items-center gap-4">
                    <label className="cursor-pointer">
                      <span className="px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                        เลือกไฟล์ CSV
                      </span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) =>
                          setSelectedFile(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>
                    <span className="text-sm text-slate-500">
                      {selectedFile ? selectedFile.name : "ยังไม่ได้เลือกไฟล์"}
                    </span>

                    <button
                      onClick={handleFileUpload}
                      disabled={!selectedFile}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                    >
                      อัปโหลดและวิเคราะห์
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    รองรับไฟล์ CSV ที่มีข้อมูลผลการตรวจเลือด (Blood Cell Test
                    Data)
                  </p>
                </div>
              </div>
              {uploadStatus && (
                <div
                  className={`mt-4 p-4 rounded-lg text-sm flex items-center gap-2 ${
                    uploadStatus.startsWith("สำเร็จ")
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : uploadStatus.startsWith("ข้อผิดพลาด")
                      ? "bg-red-50 text-red-700 border border-red-100"
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}
                >
                  {uploadStatus.startsWith("สำเร็จ") ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : uploadStatus.startsWith("ข้อผิดพลาด") ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Activity className="h-4 w-4 animate-spin" />
                  )}
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Grade Summary & Models */}
          <div className="space-y-8">
            {/* Grade Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                สรุปเกรดคุณภาพ
              </h3>
              <div className="space-y-3">
                {Object.entries(statistics.grade_summary).map(
                  ([grade, count]) => {
                    const styles = {
                      Excellent: {
                        bg: "bg-green-50",
                        text: "text-green-700",
                        bar: "bg-green-500",
                      },
                      Good: {
                        bg: "bg-blue-50",
                        text: "text-blue-700",
                        bar: "bg-blue-500",
                      },
                      Satisfactory: {
                        bg: "bg-yellow-50",
                        text: "text-yellow-700",
                        bar: "bg-yellow-500",
                      },
                      Unsatisfactory: {
                        bg: "bg-orange-50",
                        text: "text-orange-700",
                        bar: "bg-orange-500",
                      },
                      Serious: {
                        bg: "bg-red-50",
                        text: "text-red-700",
                        bar: "bg-red-500",
                      },
                    };
                    const style = styles[grade as keyof typeof styles];
                    const total = Object.values(
                      statistics.grade_summary
                    ).reduce((a, b) => a + b, 0);
                    const percent = ((count / total) * 100).toFixed(1);

                    return (
                      <div key={grade} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {grade}
                          </span>
                          <span className="text-slate-500">
                            {count} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${style.bar}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Model List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-500" />
                รุ่นเครื่องที่พบ ({models.length})
              </h2>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-xs text-slate-500">กำลังโหลด...</p>
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <p className="text-sm text-slate-500">
                    ยังไม่มีข้อมูลรุ่นเครื่อง
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    อัปโหลดไฟล์เพื่อเริ่มวิเคราะห์
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {models.map((model: string) => (
                    <button
                      key={model}
                      onClick={() => router.push(`/analysis/${model}`)}
                      className="p-3 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                        <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 truncate">
                          {model}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center">
                        ดูรายละเอียด{" "}
                        <ArrowRight className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

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
} from "lucide-react";
import { loadMockupCSVFiles, ProcessedCSVData } from "@/lib/csv";
import { performRecordPTEQAEvaluation } from "@/lib/analysis";

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
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const router = useRouter();

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadStatus("Uploading and analyzing...");
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setUploadStatus(`Success: ${selectedFile.name} processed successfully!`);
      setSelectedFile(null);
      // Simulate new model added
      const newModel = `Model_${Math.floor(Math.random() * 900) + 100}`;
      if (!models.includes(newModel)) {
        setModels([...models, newModel]);
      }
    } catch (error) {
      setUploadStatus(
        `Error: ${error instanceof Error ? error.message : "Upload failed"}`
      );
    }
  };

  const handleBatchTest = async () => {
    setIsLoading(true);
    setBatchResults([]);
    setUploadStatus(
      "กำลังประมวลผลไฟล์ทั้งหมดจากโฟลเดอร์ Blood Test Mockup CSVs..."
    );

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FileSpreadsheet className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                SmartLab Blood Cell Quality Testing
              </h1>
              <p className="text-sm text-gray-600">
                Laboratory Data Analysis System - Demo Mode
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Demo User</span>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* PT:EQA Wizard CTA */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div>
            <h3 className="text-indigo-900 font-medium">
              Run Official PT:EQA Step-by-Step
            </h3>
            <p className="text-sm text-indigo-700">
              Follow the formal evaluation process with a guided wizard and
              exportable reports.
            </p>
          </div>
          <button
            onClick={() => router.push("/pt-eqa")}
            className="px-5 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Start Wizard
          </button>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Files
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {statistics.total_files_processed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Excellent
                  </dt>
                  <dd className="text-2xl font-semibold text-green-600">
                    {statistics.grade_summary.Excellent}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Good
                  </dt>
                  <dd className="text-2xl font-semibold text-yellow-600">
                    {statistics.grade_summary.Good}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pass Rate
                  </dt>
                  <dd className="text-2xl font-semibold text-purple-600">
                    {statistics.pass_rate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Blood Test Data
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="flex items-center justify-center space-x-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={handleFileUpload}
                  disabled={!selectedFile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Upload & Analyze
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Supports CSV files with blood cell test data
              </p>
            </div>
          </div>
          {uploadStatus && (
            <div
              className={`mt-4 p-3 rounded-md ${
                uploadStatus.startsWith("Success")
                  ? "bg-green-50 text-green-700"
                  : uploadStatus.startsWith("Error")
                  ? "bg-orange-50 text-orange-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Batch Testing Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <PlayCircle className="h-5 w-5 mr-2" />
            Batch Test - PT:EQA Analysis ระบบวิเคราะห์คุณภาพ
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Test All 10 CSV Files (PT:EQA Analysis)
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  ประมวลผลและวิเคราะห์ไฟล์ทั้งหมดจากโฟลเดอร์: Blood Test Mockup
                  CSVs Sept 28 2025
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  ไฟล์ที่จะประมวลผล: 500-AV.csv, 500-E.csv, 500-RAW.csv,
                  500-cut-blunder.csv, 503-AV.csv, 503-E.csv, 503.csv,
                  504-AV.csv, 504-E.csv, 504.csv
                </div>
              </div>
              <button
                onClick={handleBatchTest}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? "กำลังประมวลผล..." : "เริ่มการทดสอบ PT:EQA"}
              </button>
            </div>
          </div>
          {batchResults.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Batch Test Results
                </h3>
                {batchResults.some((r) => r.status === "completed") && (
                  <button
                    onClick={exportBatchResults}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Results</span>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {batchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border-l-4 ${
                      result.status === "completed"
                        ? "bg-green-50 border-green-400 text-green-700"
                        : result.status === "processing"
                        ? "bg-blue-50 border-blue-400 text-blue-700"
                        : "bg-orange-50 border-orange-400 text-orange-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.filename}</span>
                      <span className="text-sm">
                        {result.status === "completed" &&
                          `${result.recordCount} records`}
                        {result.status === "processing" && "Processing..."}
                        {result.status === "error" && result.error}
                      </span>
                    </div>
                    {result.status === "completed" && (
                      <div className="mt-2 text-sm">
                        Models detected: {result.modelCodes.join(", ")} |
                        Quality grades:{" "}
                        {Object.entries(result.gradeDistribution)
                          .map(([grade, count]) => `${grade}: ${count}`)
                          .join(", ")}{" "}
                        | Pass Rate: {result.passRate}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Model List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Available Analysis Models ({models.length})
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading models...</p>
            </div>
          ) : models.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No data available. Upload a CSV file to get started.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {models.map((model: string) => (
                <button
                  key={model}
                  onClick={() => router.push(`/analysis/${model}`)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center font-medium text-gray-700 hover:text-blue-700 group"
                >
                  <div className="flex flex-col items-center">
                    <BarChart3 className="h-6 w-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                    <span className="text-sm">{model}</span>
                    <span className="text-xs text-gray-500 mt-1">
                      View Details
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grade Summary */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quality Grade Distribution
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(statistics.grade_summary).map(([grade, count]) => {
              const colors = {
                Excellent: "bg-green-100 text-green-800 border-green-200",
                Good: "bg-blue-100 text-blue-800 border-blue-200",
                Satisfactory: "bg-yellow-100 text-yellow-800 border-yellow-200",
                Unsatisfactory:
                  "bg-orange-100 text-orange-800 border-orange-200",
                Serious: "bg-purple-100 text-purple-800 border-purple-200",
              };
              return (
                <div
                  key={grade}
                  className={`p-4 rounded-lg border-2 ${
                    colors[grade as keyof typeof colors]
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm font-medium">{grade}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

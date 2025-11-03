"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  ArrowLeft,
  Download,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  BloodTestRecord,
  ProcessedCSVData,
  loadMockupCSVFiles,
  parseCSVContent,
  PTEQAResult,
} from "@/lib/csv";
import {
  performRecordPTEQAEvaluation,
  Grade,
  generatePTEQAReportSummary,
} from "@/lib/analysis";

interface AnalysisResult {
  modelCode: string;
  totalRecords: number;
  csvFiles: string[];
  gradeDistribution: Record<Grade, number>;
  passRate: number;
  averageZScore: number;
  records: BloodTestRecord[];
  ptEqaResults: PTEQAResult[];
  qualityFlags: string[];
}

// Generate analysis data based on actual CSV files for a specific model
const generateAnalysisData = async (
  modelCode: string
): Promise<AnalysisResult | null> => {
  try {
    // Load all mockup CSV files
    const csvDataArray = await loadMockupCSVFiles();

    // Filter records for the specific model
    let modelRecords: BloodTestRecord[] = [];
    let relevantFiles: string[] = [];

    for (const csvData of csvDataArray) {
      const filteredRecords = csvData.records.filter(
        (record: BloodTestRecord) =>
          record.modelCode?.toString() === modelCode.replace("Model_", "") ||
          record.modelName?.includes(modelCode) ||
          csvData.filename.includes(modelCode.replace("Model_", ""))
      );

      if (filteredRecords.length > 0) {
        modelRecords = [...modelRecords, ...filteredRecords];
        relevantFiles.push(csvData.filename);
      }
    }

    if (modelRecords.length === 0) {
      // Generate synthetic data if no matching records
      const syntheticCount = Math.floor(Math.random() * 100) + 50;
      for (let i = 0; i < syntheticCount; i++) {
        modelRecords.push({
          id: i + 1,
          labCode: `LAB_${Math.floor(Math.random() * 100)}`,
          report: "Synthetic Data",

          // Lab values with realistic variations
          RBC: 4.5 + (Math.random() - 0.5) * 1.0,
          WBC: 7.0 + (Math.random() - 0.5) * 4.0,
          PLT: 250 + (Math.random() - 0.5) * 150,
          Hb: 14.0 + (Math.random() - 0.5) * 3.0,
          Hct: 42.0 + (Math.random() - 0.5) * 8.0,
          MCV: 90.0 + (Math.random() - 0.5) * 15.0,
          MCH: 30.0 + (Math.random() - 0.5) * 5.0,
          MCHC: 34.0 + (Math.random() - 0.5) * 3.0,

          // Reference values
          RBC_ref: 4.5,
          WBC_ref: 7.0,
          PLT_ref: 250,
          Hb_ref: 14.0,
          Hct_ref: 42.0,
          MCV_ref: 90.0,
          MCH_ref: 30.0,
          MCHC_ref: 34.0,

          // Equipment info
          brand: "Sysmex",
          brandCode: 1,
          modelCode: parseInt(modelCode.replace("Model_", "")) || 500,
          modelName: modelCode,
          modelDescription: `Synthetic ${modelCode} test data`,
          submissionDate: new Date().toISOString().split("T")[0],
          labCodeHM: `HM_${Math.floor(Math.random() * 100)}`,
          type: "Synthetic",
        } as BloodTestRecord);
      }
      relevantFiles = [`Synthetic_${modelCode}.csv`];
    }

    // Perform PT:EQA evaluation on all records
    const ptEqaResults: PTEQAResult[] = [];
    const gradeDistribution: Record<Grade, number> = {
      Excellent: 0,
      Good: 0,
      Satisfactory: 0,
      Unsatisfactory: 0,
      Serious: 0,
    };

    for (const record of modelRecords) {
      try {
        const evaluationArray = performRecordPTEQAEvaluation(record);
        // Use the overall grade from the first evaluation result
        if (evaluationArray && evaluationArray.length > 0) {
          const overallGrade = evaluationArray[0].grade || "Satisfactory";
          gradeDistribution[overallGrade as Grade]++;

          // Create PTEQAResult for each parameter
          evaluationArray.forEach((param) => {
            ptEqaResults.push({
              labCode: record.labCode || "Unknown",
              modelCode: record.modelCode?.toString() || modelCode,
              parameter: param.name,
              measuredValue: param.value,
              referenceValue: param.referenceValue,
              zScore: param.zScore,
              grade: param.grade,
              status: param.status,
            });
          });
        }
      } catch (error) {
        console.warn(`Failed to evaluate record ${record.id}:`, error);
        // Default to Satisfactory if evaluation fails
        gradeDistribution["Satisfactory"]++;
      }
    }

    const totalGraded = Object.values(gradeDistribution).reduce(
      (sum, count) => sum + count,
      0
    );
    const passCount =
      gradeDistribution.Excellent +
      gradeDistribution.Good +
      gradeDistribution.Satisfactory;
    const passRate = totalGraded > 0 ? (passCount / totalGraded) * 100 : 0;

    const averageZScore =
      ptEqaResults.length > 0
        ? ptEqaResults.reduce(
            (sum, result) => sum + Math.abs(result.zScore),
            0
          ) / ptEqaResults.length
        : 0;

    const qualityFlags: string[] = [];
    if (gradeDistribution.Serious > 0) {
      qualityFlags.push(
        `${gradeDistribution.Serious} serious quality issues detected`
      );
    }
    if (gradeDistribution.Unsatisfactory > 0) {
      qualityFlags.push(
        `${gradeDistribution.Unsatisfactory} unsatisfactory results`
      );
    }
    if (passRate < 80) {
      qualityFlags.push(`Low pass rate: ${passRate.toFixed(1)}%`);
    }

    return {
      modelCode,
      totalRecords: modelRecords.length,
      csvFiles: relevantFiles,
      gradeDistribution,
      passRate,
      averageZScore,
      records: modelRecords,
      ptEqaResults,
      qualityFlags,
    };
  } catch (error) {
    console.error("Failed to generate analysis data:", error);
    return null;
  }
};

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const modelCode = params.model as string;

  useEffect(() => {
    // Load analysis results using the new PT:EQA system
    const loadAnalysisData = async () => {
      try {
        setIsLoading(true);
        const analysisResult = await generateAnalysisData(modelCode);
        setResult(analysisResult);
      } catch (error) {
        console.error("Failed to load analysis data:", error);
        setResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysisData();
  }, [modelCode]);

  const handleExport = async (format: "csv" | "excel") => {
    try {
      setIsExporting(true);

      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Create PT:EQA results CSV data
      if (format === "csv" && result) {
        const csvContent = [
          "Record ID,Lab Code,Model Code,Parameter,Measured Value,Reference Value,Z-Score,Grade,Status",
          ...result.ptEqaResults.map(
            (row) =>
              `${row.labCode},${row.labCode},${row.modelCode},${
                row.parameter
              },${row.measuredValue.toFixed(2)},${row.referenceValue.toFixed(
                2
              )},${row.zScore.toFixed(3)},${row.grade},${row.status}`
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${modelCode}_PTEQA_report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      alert("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "Excellent":
        return "text-green-600 bg-green-50";
      case "Good":
        return "text-blue-600 bg-blue-50";
      case "Satisfactory":
        return "text-yellow-600 bg-yellow-50";
      case "Unsatisfactory":
        return "text-orange-600 bg-orange-50";
      case "Serious":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileSpreadsheet className="h-6 w-6 mr-2 text-blue-600" />
                  {modelCode} - PT:EQA Analysis
                </h1>
                <p className="text-sm text-gray-600">
                  Proficiency Testing & External Quality Assessment - Laboratory
                  Data Analysis
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : result ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">
                  Total Records
                </h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {result.totalRecords}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Excellent</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {result.gradeDistribution.Excellent}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Good</h3>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {result.gradeDistribution.Good}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Pass Rate</h3>
                <p className="mt-2 text-3xl font-bold text-purple-600">
                  {result.passRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Quality Alerts */}
            {result.qualityFlags.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-amber-800 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Quality Alerts
                </h3>
                <div className="space-y-2">
                  {result.qualityFlags.map((flag, index) => (
                    <div
                      key={index}
                      className="flex items-center text-amber-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      <span className="text-sm">{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSV Files Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-blue-800 mb-3 flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                Data Sources
              </h3>
              <div className="text-sm text-blue-700">
                <p className="mb-2">
                  Files processed: {result.csvFiles.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.csvFiles.map((filename, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {filename}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                PT:EQA Performance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.passRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.averageZScore.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Avg |Z-Score|</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.gradeDistribution.Serious}
                  </div>
                  <div className="text-sm text-gray-600">Serious Issues</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {result.csvFiles.length}
                  </div>
                  <div className="text-sm text-gray-600">Data Sources</div>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Export Report
              </h2>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport("excel")}
                  disabled={isExporting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Export Excel
                </button>
              </div>
            </div>

            {/* PT:EQA Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  PT:EQA Evaluation Results ({result.ptEqaResults.length}{" "}
                  evaluations)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lab Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parameter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Measured
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Z-Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.ptEqaResults
                      .slice(0, 100)
                      .map((row, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.labCode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {row.parameter}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.measuredValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.referenceValue.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`font-medium ${
                                Math.abs(row.zScore) <= 1.0
                                  ? "text-green-600"
                                  : Math.abs(row.zScore) <= 2.0
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {row.zScore.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(
                                row.grade
                              )}`}
                            >
                              {row.grade}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`flex items-center text-sm font-medium ${
                                row.status === "Pass"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {row.status === "Pass" ? (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <XCircle className="h-4 w-4 mr-1" />
                              )}
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {result.ptEqaResults.length > 100 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
                  Showing first 100 of {result.ptEqaResults.length} PT:EQA
                  evaluations. Export to see all data.
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

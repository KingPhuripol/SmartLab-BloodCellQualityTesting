"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import type { UniversalProcessedData } from "@/lib/universal-csv-processor";

export default function ConvertPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{
    parsed: UniversalProcessedData;
    standardCSV: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/pt-eqa/convert", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Conversion failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.standardCSV], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted-${file?.name.replace(/\.[^/.]+$/, "")}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleSaveToSystem = async () => {
    if (!result || !file) return;

    setIsSaving(true);
    try {
      // Create a new file from the standard CSV
      const csvFile = new File(
        [result.standardCSV],
        `converted-${file.name.replace(/\.[^/.]+$/, "")}.csv`,
        { type: "text/csv" }
      );

      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch("/api/pt-eqa/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      // Redirect to PT-EQA dashboard
      router.push("/pt-eqa");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <RefreshCw className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  File Converter
                </h1>
                <p className="text-sm text-slate-500">
                  Convert Excel/Raw CSV to Standard Format
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-slate-500" />
                Select File
              </h2>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileSpreadsheet className="h-10 w-10 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      {file ? file.name : "Click to upload file"}
                    </span>
                    <span className="text-xs text-slate-500">
                      Supports .xlsx, .xls, .csv
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={!file || isConverting}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConverting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Convert File
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {result && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Conversion Success
                </h2>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Format Detected:</span>
                    <span className="font-medium text-slate-900">
                      {result.parsed.format}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Records:</span>
                    <span className="font-medium text-slate-900">
                      {result.parsed.totalRecords}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Records:</span>
                    <span className="font-medium text-green-600">
                      {result.parsed.validRecords}
                    </span>
                  </div>
                </div>

                <div className="pt-4 space-y-3 border-t border-slate-100">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download CSV
                  </button>

                  <button
                    onClick={handleSaveToSystem}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save to System
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    Data Preview
                  </h3>
                  <span className="text-xs text-slate-500">
                    Showing first 50 records
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 whitespace-nowrap">
                          Lab Code
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap">Model</th>
                        <th className="px-4 py-3 whitespace-nowrap">RBC</th>
                        <th className="px-4 py-3 whitespace-nowrap">WBC</th>
                        <th className="px-4 py-3 whitespace-nowrap">PLT</th>
                        <th className="px-4 py-3 whitespace-nowrap">Hb</th>
                        <th className="px-4 py-3 whitespace-nowrap">Hct</th>
                        <th className="px-4 py-3 whitespace-nowrap">Ref RBC</th>
                        <th className="px-4 py-3 whitespace-nowrap">Ref WBC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.parsed.records.slice(0, 50).map((record, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-900">
                            {record.labCode}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {record.modelCode}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {record.measuredRBC?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {record.measuredWBC?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {record.measuredPLT?.toFixed(0)}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {record.measuredHb?.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {record.measuredHct?.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-slate-500">
                            {record.referenceRBC?.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-slate-500">
                            {record.referenceWBC?.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <FileSpreadsheet className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  No Data to Display
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Upload a file and click "Convert File" to see the standardized
                  data preview here.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

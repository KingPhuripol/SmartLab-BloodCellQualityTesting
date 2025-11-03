"use client";

import Link from "next/link";
import {
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-blue-700 font-semibold text-xs tracking-wider uppercase mb-2">
                SmartLab • Hospital Quality Informatics
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                Blood Cell Quality Testing
                <br className="hidden md:block" />
                PT:EQA Evaluation System
              </h1>
              <p className="mt-4 text-gray-600 text-base md:text-lg">
                A formal step-by-step workflow with Z‑score grading and CAPA.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="px-5 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/pt-eqa"
                  className="px-5 py-3 rounded-md bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 inline-flex items-center"
                >
                  Start PT:EQA Wizard <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
                <Link
                  href="/dashboard"
                  className="px-5 py-3 rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                >
                  View Dashboard
                </Link>
              </div>
              <div className="mt-4 text-xs text-gray-500">
                Note: Some sections may require sign-in.
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/70 backdrop-blur rounded-xl border p-6 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-blue-50">
                    <div className="text-2xl font-bold text-blue-700">
                      PT:EQA
                    </div>
                    <div className="text-xs text-blue-700">5-step Wizard</div>
                  </div>
                  <div className="p-4 rounded-lg border bg-green-50">
                    <div className="text-2xl font-bold text-green-700">
                      Z-Score
                    </div>
                    <div className="text-xs text-green-700">
                      Thresholds ≤0.5 / ≤1 / ≤2 / ≤3
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-yellow-50">
                    <div className="text-2xl font-bold text-yellow-700">
                      CAPA
                    </div>
                    <div className="text-xs text-yellow-700">
                      Review & Sign-off
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-purple-50">
                    <div className="text-2xl font-bold text-purple-700">
                      Export
                    </div>
                    <div className="text-xs text-purple-700">
                      CSV for submission
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
            Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 border rounded-lg bg-gray-50">
              <ShieldCheck className="h-6 w-6 text-blue-600 mb-2" />
              <div className="font-semibold text-gray-900">
                Standards & Compliance
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Aligned with PT:EQA charts.
              </div>
            </div>
            <div className="p-5 border rounded-lg bg-gray-50">
              <FileSpreadsheet className="h-6 w-6 text-green-600 mb-2" />
              <div className="font-semibold text-gray-900">
                CSV → Automated Evaluation
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Load CSVs and auto‑evaluate.
              </div>
            </div>
            <div className="p-5 border rounded-lg bg-gray-50">
              <BarChart3 className="h-6 w-6 text-yellow-600 mb-2" />
              <div className="font-semibold text-gray-900">
                Dashboard & Summaries
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Pass rate, Avg |Z|, Grades.
              </div>
            </div>
            <div className="p-5 border rounded-lg bg-gray-50">
              <ClipboardList className="h-6 w-6 text-purple-600 mb-2" />
              <div className="font-semibold text-gray-900">
                Review & Sign-off
              </div>
              <div className="text-sm text-gray-600 mt-1">
                CAPA, approval, export.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              Begin a formal PT:EQA session
            </div>
            <div className="text-sm text-gray-600">
              Follow the steps for accuracy and full traceability.
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/pt-eqa"
              className="px-5 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center"
            >
              Open PT:EQA Wizard <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            <Link
              href="/login"
              className="px-5 py-3 rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-gray-500 flex items-center justify-between">
          <div>
            © {new Date().getFullYear()} SmartLab — Blood Cell Quality Testing
          </div>
          <div>PT:EQA • Z-score • CAPA</div>
        </div>
      </footer>
    </div>
  );
}

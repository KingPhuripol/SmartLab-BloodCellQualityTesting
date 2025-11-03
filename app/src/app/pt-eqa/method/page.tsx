"use client";

import { BookOpenCheck, Settings2, FileSpreadsheet } from "lucide-react";
import Collapsible from "@/components/Collapsible";

export default function PTEQAMethodPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start gap-3 mb-4">
        <BookOpenCheck className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            PT:EQA Evaluation Method
          </h1>
          <p className="text-sm text-gray-600">
            A concise, scannable guide that the wizard follows — faithful to the
            official charts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-3 border rounded-md bg-blue-50">
          <div className="text-xs text-blue-700">Grading Thresholds</div>
          <div className="text-sm font-semibold text-blue-800">
            |Z| ≤ 0.5 / 1 / 2 / 3
          </div>
        </div>
        <div className="p-3 border rounded-md bg-green-50">
          <div className="text-xs text-green-700">Artifacts</div>
          <div className="text-sm font-semibold text-green-800">
            CSV Import & Export
          </div>
        </div>
        <div className="p-3 border rounded-md bg-purple-50">
          <div className="text-xs text-purple-700">CAPA</div>
          <div className="text-sm font-semibold text-purple-800">
            Review & Sign-off
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Collapsible title="1) Prepare & Select Data" defaultOpen>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Required columns: Lab Code, Brand code, Model code, parameters
              (RBC, WBC, PLT, Hb, Hct, MCV, MCH, MCHC).
            </li>
            <li>Clean zeros/invalid values before analysis.</li>
            <li>Group by Model code for like-for-like evaluation.</li>
          </ul>
        </Collapsible>

        <Collapsible title="2) Validate structure & set criteria">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Confirm format and required columns; check counts and quick stats.
            </li>
            <li>Apply allowable error and reference rules per parameter.</li>
            <li>
              Grade by |Z| thresholds: Excellent ≤0.5, Good ≤1.0, Satisfactory
              ≤2.0, Unsatisfactory ≤3.0, Serious &gt;3.0.
            </li>
          </ul>
        </Collapsible>

        <Collapsible title="3) Calculate Z-scores and assign grades">
          <p>
            For each parameter, compute Z = (Measured − Reference) / Allowable
            Error (or SD per method), then apply thresholds above.
          </p>
        </Collapsible>

        <Collapsible title="4) Review nonconformities & CAPA">
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Focus on Serious (&gt;3.0) and repeated Unsatisfactory results.
            </li>
            <li>Record root cause and corrective/preventive actions.</li>
            <li>Verify resolution prior to approval.</li>
          </ul>
        </Collapsible>

        <Collapsible title="5) Approve & Export">
          <ul className="list-disc pl-5 space-y-1">
            <li>Authorized reviewer signs-off.</li>
            <li>Export CSV for records and submission.</li>
          </ul>
        </Collapsible>
      </div>

      <div className="mt-6 text-xs text-gray-500 flex items-center gap-2">
        <Settings2 className="h-4 w-4" />
        <span>
          These steps mirror the PT:EQA charts while keeping the web flow
          lightweight.
        </span>
      </div>
    </div>
  );
}

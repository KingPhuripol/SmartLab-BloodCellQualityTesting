import React, { useState, useMemo } from "react";
import {
  AssignedValueStat,
  AssignedValueExcludedItem,
  computeAssignedValues,
  detectBlunders,
  detectOutliers,
} from "@/lib/pt-eqa-analysis";
import { DensityPlot } from "@/components/DensityPlot";

// A mock definition since we're injecting.
import type { StandardBloodTestRecord } from "@/lib/universal-csv-processor";

interface Props {
  records: StandardBloodTestRecord[];
  onComplete: (assignedValues: AssignedValueStat[]) => void;
}

export function InteractiveDataReview({ records, onComplete }: Props) {
  const [step, setStep] = useState<"blunder" | "outlier" | "rules">("blunder");
  const [removedBlunders, setRemovedBlunders] = useState<Set<string>>(
    new Set(),
  );
  const [removedOutliers, setRemovedOutliers] = useState<Set<string>>(
    new Set(),
  );

  // Grouping logic (simplified)
  const [currentModelIndex, setCurrentModelIndex] = useState(0);

  // We compute base stats to find models and params
  const baseGroups = useMemo(() => {
    // Generate initial assigned values to get groups
    return computeAssignedValues(records);
  }, [records]);

  if (!baseGroups || baseGroups.length === 0) return null;

  const currentGroup = baseGroups[currentModelIndex];

  // Simulate finding blunders for current group (using raw items from computation)
  const rawItems = records
    .filter((r) => r.modelCode === currentGroup.modelCode)
    .map((r) => {
      const val = r[
        `measured${currentGroup.parameter}` as keyof StandardBloodTestRecord
      ] as number;
      return { labCode: r.labCode, value: val };
    })
    .filter((x) => typeof x.value === "number" && !isNaN(x.value));

  const blunders = detectBlunders(rawItems);

  const handleNext = () => {
    if (step === "blunder") {
      setStep("outlier");
    } else if (step === "outlier") {
      if (currentModelIndex < baseGroups.length - 1) {
        setCurrentModelIndex((c) => c + 1);
        setStep("blunder");
      } else {
        setStep("rules");
      }
    } else {
      // Calculate final mapped assignedValues applying manual exclusions
      const finalStats = computeAssignedValues(records);
      // We would pass the manual exclusions if we wired them through detectBlunders properly
      onComplete(finalStats);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <h2 className="text-xl font-bold mb-4">
        {step === "blunder"
          ? "ตรวจสอบและลบ Blunder"
          : step === "outlier"
            ? "ตรวจสอบและลบ Outlier"
            : "สรุปกฎ N Count"}
      </h2>
      <div className="mb-4 text-sm text-slate-500">
        รุ่นเครื่อง: <span className="font-bold">{currentGroup.modelCode}</span>{" "}
        | Parameter: <span className="font-bold">{currentGroup.parameter}</span>
      </div>

      {step === "rules" && (
        <div>
          <p>การวิเคราะห์เสร็จสิ้น กดปุ่มด้านล่างเพื่อไปยังหน้าประเมินผล</p>
        </div>
      )}

      {(step === "blunder" || step === "outlier") && (
        <>
          <DensityPlot
            data={rawItems.map((i) => i.value)}
            title={`การกระจายตัวข้อมูล (${step})`}
          />
          <div className="mt-4">
            <h3 className="font-bold text-red-600 mb-2">
              ค่าที่ระบบตรวจพบว่าผิดปกติ
            </h3>
            {blunders.length === 0 ? (
              <p className="text-sm text-slate-500">ไม่พบค่าผิดปกติ</p>
            ) : (
              <ul className="text-sm">
                {blunders.map((b: AssignedValueExcludedItem) => (
                  <li
                    key={b.labCode}
                    className="flex justify-between items-center bg-red-50 p-2 rounded mb-1"
                  >
                    <span>
                      Lab: {b.labCode} | Value: {b.value}
                    </span>
                    <button className="bg-red-500 text-white px-2 py-1 rounded text-xs">
                      ลบค่านี้
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
        >
          ยืนยันและดำเนินการต่อ
        </button>
      </div>
    </div>
  );
}

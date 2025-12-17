/**
 * PT:EQA Analysis Module
 * Professional Proficiency Testing / External Quality Assessment
 */

import type { StandardBloodTestRecord } from "./universal-csv-processor";

export interface PTEQAConfig {
  allowableErrors: {
    RBC: number;
    WBC: number;
    PLT: number;
    Hb: number;
    Hct: number;
    MCV: number;
    MCH: number;
    MCHC: number;
  };
  zScoreThresholds: {
    excellent: number;
    good: number;
    satisfactory: number;
    unsatisfactory: number;
  };
}

export interface PTEQAResult {
  labCode: string;
  modelCode: string;
  parameter: string;
  measuredValue: number;
  referenceValue: number;
  difference: number;
  percentDifference: number;
  zScore: number;
  grade: "Excellent" | "Good" | "Satisfactory" | "Unsatisfactory" | "Serious";
  status: "Pass" | "Fail";
  allowableError: number;

  /** Assigned value stats used for Z-score (per model + parameter) */
  assignedMean?: number;
  assignedSD?: number;
  assignedCVPercent?: number;
  assignedNUsed?: number;
}

export type PTEQAParameter = keyof PTEQAConfig["allowableErrors"];

export interface AssignedValueExcludedItem {
  labCode: string;
  value: number;
  reason: "blunder" | "outlier";
}

export interface AssignedValueStat {
  modelCode: string;
  parameter: PTEQAParameter;
  mean: number;
  sd: number;
  cvPercent: number;
  nTotal: number;
  nUsed: number;
  nBlunder: number;
  nOutlier: number;
  excluded: AssignedValueExcludedItem[];
}

export interface PTEQASummary {
  totalEvaluations: number;
  passCount: number;
  failCount: number;
  passRate: number;
  averageZScore: number;
  gradeDistribution: Record<PTEQAResult["grade"], number>;
  byModel: {
    modelCode: string;
    count: number;
    passRate: number;
    averageZScore: number;
  }[];
  byParameter: {
    parameter: string;
    count: number;
    passRate: number;
    averageZScore: number;
  }[];
  criticalIssues: PTEQAResult[];

  /** Optional: assigned value stats used for Z-score */
  assignedValues?: AssignedValueStat[];
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stdDev(values: number[], m: number): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((s, v) => s + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function round(value: number, decimals: number): number {
  if (!isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function computeAssignedValues(
  records: StandardBloodTestRecord[]
): AssignedValueStat[] {
  const parameters: PTEQAParameter[] = [
    "RBC",
    "WBC",
    "PLT",
    "Hb",
    "Hct",
    "MCV",
    "MCH",
    "MCHC",
  ];

  const groups = new Map<
    string,
    {
      modelCode: string;
      parameter: PTEQAParameter;
      items: { labCode: string; value: number }[];
    }
  >();

  for (const record of records) {
    for (const param of parameters) {
      const measuredKey = `measured${param}` as keyof StandardBloodTestRecord;
      const measured = record[measuredKey] as number | null;
      if (measured === null || isNaN(measured) || measured === 0) continue;

      const modelCode = record.modelCode;
      const key = `${modelCode}::${param}`;
      if (!groups.has(key)) {
        groups.set(key, { modelCode, parameter: param, items: [] });
      }
      groups.get(key)!.items.push({ labCode: record.labCode, value: measured });
    }
  }

  const stats: AssignedValueStat[] = [];

  for (const [, group] of groups) {
    const nTotal = group.items.length;
    const valuesAll = group.items.map((x) => x.value);
    const initialMean = mean(valuesAll);

    // Blunder rule: value > mean*10 or value < mean/10 (computed from initial mean)
    const blunders: AssignedValueExcludedItem[] = [];
    const afterBlunder = group.items.filter((x) => {
      if (!isFinite(initialMean) || initialMean <= 0) return true;
      // Blunder: value > mean*10 OR value < mean/10
      const isBlunder =
        x.value > initialMean * 10 || x.value < initialMean / 10;
      if (isBlunder)
        blunders.push({
          labCode: x.labCode,
          value: x.value,
          reason: "blunder",
        });
      return !isBlunder;
    });

    const values1 = afterBlunder.map((x) => x.value);
    const mean1 = mean(values1);
    const sd1 = stdDev(values1, mean1);

    // Outlier rule (simple): |x - mean| > 3*sd (after blunder removal), single pass
    const outliers: AssignedValueExcludedItem[] = [];
    const afterOutlier = afterBlunder.filter((x) => {
      if (!isFinite(sd1) || sd1 <= 0) return true;
      const isOutlier = Math.abs(x.value - mean1) > 3 * sd1;
      if (isOutlier)
        outliers.push({
          labCode: x.labCode,
          value: x.value,
          reason: "outlier",
        });
      return !isOutlier;
    });

    const values2 = afterOutlier.map((x) => x.value);
    const finalMean = mean(values2);
    const finalSd = stdDev(values2, finalMean);
    const cvPercent = finalMean !== 0 ? (finalSd / finalMean) * 100 : 0;

    stats.push({
      modelCode: group.modelCode,
      parameter: group.parameter,
      mean: round(finalMean, 6),
      sd: round(finalSd, 6),
      cvPercent: round(cvPercent, 3),
      nTotal,
      nUsed: values2.length,
      nBlunder: blunders.length,
      nOutlier: outliers.length,
      excluded: [...blunders, ...outliers],
    });
  }

  // Sort for stable UI
  stats.sort((a, b) => {
    const byModel = a.modelCode.localeCompare(b.modelCode);
    if (byModel !== 0) return byModel;
    return a.parameter.localeCompare(b.parameter);
  });
  return stats;
}

// Default configuration based on CLIA and Proficiency Testing standards
export const DEFAULT_PT_EQA_CONFIG: PTEQAConfig = {
  allowableErrors: {
    RBC: 0.2, // ±0.2 x10^12/L
    WBC: 1.2, // ±1.2 x10^9/L
    PLT: 45, // ±45 x10^9/L
    Hb: 0.7, // ±0.7 g/dL
    Hct: 2.1, // ±2.1%
    MCV: 4.5, // ±4.5 fL
    MCH: 1.5, // ±1.5 pg
    MCHC: 1.65, // ±1.65 g/dL
  },
  zScoreThresholds: {
    excellent: 0.5, // |Z| ≤ 0.5
    good: 1.0, // |Z| ≤ 1.0
    satisfactory: 2.0, // |Z| ≤ 2.0
    unsatisfactory: 3.0, // |Z| ≤ 3.0
    // Serious: |Z| > 3.0
  },
};

/**
 * Calculate Z-score for a single measurement
 */
export function calculateZScore(
  measured: number,
  reference: number,
  allowableError: number
): number {
  const difference = measured - reference;
  const zScore = difference / allowableError;
  return Number(zScore.toFixed(2));
}

/**
 * Assign grade based on Z-score
 */
export function assignGrade(
  zScore: number,
  thresholds: PTEQAConfig["zScoreThresholds"]
): PTEQAResult["grade"] {
  const absZScore = Math.abs(zScore);

  if (absZScore <= thresholds.excellent) return "Excellent";
  if (absZScore <= thresholds.good) return "Good";
  if (absZScore <= thresholds.satisfactory) return "Satisfactory";
  if (absZScore <= thresholds.unsatisfactory) return "Unsatisfactory";
  return "Serious";
}

/**
 * Determine pass/fail status
 */
export function determineStatus(grade: PTEQAResult["grade"]): "Pass" | "Fail" {
  return grade === "Unsatisfactory" || grade === "Serious" ? "Fail" : "Pass";
}

/**
 * Perform PT:EQA evaluation on a single record
 */
export function evaluateRecord(
  record: StandardBloodTestRecord,
  config: PTEQAConfig = DEFAULT_PT_EQA_CONFIG
): PTEQAResult[] {
  const results: PTEQAResult[] = [];
  const parameters: Array<keyof PTEQAConfig["allowableErrors"]> = [
    "RBC",
    "WBC",
    "PLT",
    "Hb",
    "Hct",
    "MCV",
    "MCH",
    "MCHC",
  ];

  parameters.forEach((param) => {
    const measuredKey = `measured${param}` as keyof StandardBloodTestRecord;
    const referenceKey = `reference${param}` as keyof StandardBloodTestRecord;

    const measured = record[measuredKey] as number | null;
    const reference = record[referenceKey] as number | null;

    // Skip if either value is missing or invalid
    if (
      measured === null ||
      reference === null ||
      isNaN(measured) ||
      isNaN(reference) ||
      measured === 0 ||
      reference === 0
    ) {
      return;
    }

    const allowableError = config.allowableErrors[param];
    const zScore = calculateZScore(measured, reference, allowableError);
    const grade = assignGrade(zScore, config.zScoreThresholds);
    const status = determineStatus(grade);

    const difference = measured - reference;
    const percentDifference = (difference / reference) * 100;

    results.push({
      labCode: record.labCode,
      modelCode: record.modelCode,
      parameter: param,
      measuredValue: measured,
      referenceValue: reference,
      difference: Number(difference.toFixed(2)),
      percentDifference: Number(percentDifference.toFixed(1)),
      zScore,
      grade,
      status,
      allowableError,
    });
  });

  return results;
}

export function evaluateMultipleRecordsWithAssignedValues(
  records: StandardBloodTestRecord[],
  config: PTEQAConfig = DEFAULT_PT_EQA_CONFIG
): { results: PTEQAResult[]; assignedValues: AssignedValueStat[] } {
  const assignedValues = computeAssignedValues(records);
  const assignedMap = new Map<string, AssignedValueStat>();
  for (const s of assignedValues) {
    assignedMap.set(`${s.modelCode}::${s.parameter}`, s);
  }

  const results: PTEQAResult[] = [];
  const parameters: PTEQAParameter[] = [
    "RBC",
    "WBC",
    "PLT",
    "Hb",
    "Hct",
    "MCV",
    "MCH",
    "MCHC",
  ];

  for (const record of records) {
    for (const param of parameters) {
      const measuredKey = `measured${param}` as keyof StandardBloodTestRecord;
      const measured = record[measuredKey] as number | null;
      if (measured === null || isNaN(measured) || measured === 0) continue;

      const assigned = assignedMap.get(`${record.modelCode}::${param}`);
      if (!assigned) continue;

      const referenceValue = assigned.mean;
      const sd = assigned.sd;

      // Use SD for Z-Score calculation as requested
      const zScore =
        sd > 0 ? Number(((measured - referenceValue) / sd).toFixed(2)) : 0;
      const grade = assignGrade(zScore, config.zScoreThresholds);
      const status = determineStatus(grade);

      const difference = measured - referenceValue;
      const percentDifference =
        referenceValue !== 0 ? (difference / referenceValue) * 100 : 0;

      results.push({
        labCode: record.labCode,
        modelCode: record.modelCode,
        parameter: param,
        measuredValue: measured,
        referenceValue,
        difference: Number(difference.toFixed(2)),
        percentDifference: Number(percentDifference.toFixed(1)),
        zScore,
        grade,
        status,
        allowableError: config.allowableErrors[param],
        assignedMean: assigned.mean,
        assignedSD: assigned.sd,
        assignedCVPercent: assigned.cvPercent,
        assignedNUsed: assigned.nUsed,
      });
    }
  }

  return { results, assignedValues };
}

/**
 * Perform PT:EQA evaluation on multiple records
 */
export function evaluateMultipleRecords(
  records: StandardBloodTestRecord[],
  config: PTEQAConfig = DEFAULT_PT_EQA_CONFIG
): PTEQAResult[] {
  const allResults: PTEQAResult[] = [];

  records.forEach((record) => {
    const results = evaluateRecord(record, config);
    allResults.push(...results);
  });

  return allResults;
}

/**
 * Generate comprehensive summary of PT:EQA results
 */
export function generateSummary(results: PTEQAResult[]): PTEQASummary {
  if (results.length === 0) {
    return {
      totalEvaluations: 0,
      passCount: 0,
      failCount: 0,
      passRate: 0,
      averageZScore: 0,
      gradeDistribution: {
        Excellent: 0,
        Good: 0,
        Satisfactory: 0,
        Unsatisfactory: 0,
        Serious: 0,
      },
      byModel: [],
      byParameter: [],
      criticalIssues: [],
    };
  }

  // Overall statistics
  const passCount = results.filter((r) => r.status === "Pass").length;
  const failCount = results.length - passCount;
  const passRate = Number(((passCount / results.length) * 100).toFixed(1));

  const totalAbsZScore = results.reduce(
    (sum, r) => sum + Math.abs(r.zScore),
    0
  );
  const averageZScore = Number((totalAbsZScore / results.length).toFixed(2));

  // Grade distribution
  const gradeDistribution: PTEQASummary["gradeDistribution"] = {
    Excellent: 0,
    Good: 0,
    Satisfactory: 0,
    Unsatisfactory: 0,
    Serious: 0,
  };

  results.forEach((r) => {
    gradeDistribution[r.grade]++;
  });

  // By model
  const modelMap = new Map<string, PTEQAResult[]>();
  results.forEach((r) => {
    if (!modelMap.has(r.modelCode)) {
      modelMap.set(r.modelCode, []);
    }
    modelMap.get(r.modelCode)!.push(r);
  });

  const byModel = Array.from(modelMap.entries())
    .map(([modelCode, modelResults]) => {
      const passCount = modelResults.filter((r) => r.status === "Pass").length;
      const totalAbsZ = modelResults.reduce(
        (sum, r) => sum + Math.abs(r.zScore),
        0
      );

      return {
        modelCode,
        count: modelResults.length,
        passRate: Number(((passCount / modelResults.length) * 100).toFixed(1)),
        averageZScore: Number((totalAbsZ / modelResults.length).toFixed(2)),
      };
    })
    .sort((a, b) => a.modelCode.localeCompare(b.modelCode));

  // By parameter
  const paramMap = new Map<string, PTEQAResult[]>();
  results.forEach((r) => {
    if (!paramMap.has(r.parameter)) {
      paramMap.set(r.parameter, []);
    }
    paramMap.get(r.parameter)!.push(r);
  });

  const byParameter = Array.from(paramMap.entries())
    .map(([parameter, paramResults]) => {
      const passCount = paramResults.filter((r) => r.status === "Pass").length;
      const totalAbsZ = paramResults.reduce(
        (sum, r) => sum + Math.abs(r.zScore),
        0
      );

      return {
        parameter,
        count: paramResults.length,
        passRate: Number(((passCount / paramResults.length) * 100).toFixed(1)),
        averageZScore: Number((totalAbsZ / paramResults.length).toFixed(2)),
      };
    })
    .sort((a, b) => a.parameter.localeCompare(b.parameter));

  // Critical issues (Serious problems)
  const criticalIssues = results
    .filter((r) => r.grade === "Serious")
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  return {
    totalEvaluations: results.length,
    passCount,
    failCount,
    passRate,
    averageZScore,
    gradeDistribution,
    byModel,
    byParameter,
    criticalIssues,
  };
}

/**
 * Filter results by criteria
 */
export function filterResults(
  results: PTEQAResult[],
  filters: {
    modelCode?: string;
    parameter?: string;
    grade?: PTEQAResult["grade"];
    status?: "Pass" | "Fail";
    minZScore?: number;
    maxZScore?: number;
    labCode?: string;
  }
): PTEQAResult[] {
  return results.filter((r) => {
    if (filters.modelCode && r.modelCode !== filters.modelCode) return false;
    if (filters.parameter && r.parameter !== filters.parameter) return false;
    if (filters.grade && r.grade !== filters.grade) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (
      filters.minZScore !== undefined &&
      Math.abs(r.zScore) < filters.minZScore
    )
      return false;
    if (
      filters.maxZScore !== undefined &&
      Math.abs(r.zScore) > filters.maxZScore
    )
      return false;
    if (
      filters.labCode &&
      !r.labCode.toLowerCase().includes(filters.labCode.toLowerCase())
    )
      return false;
    return true;
  });
}

/**
 * Export PT:EQA results to CSV
 */
export function exportPTEQAToCSV(
  results: PTEQAResult[],
  summary?: PTEQASummary
): string {
  const headers = [
    "Lab Code",
    "Model Code",
    "Parameter",
    "Measured Value",
    "Reference Value",
    "Difference",
    "% Difference",
    "Allowable Error",
    "Z-Score",
    "Grade",
    "Status",
  ];

  const rows = results.map((r) => [
    r.labCode,
    r.modelCode,
    r.parameter,
    r.measuredValue.toFixed(2),
    r.referenceValue.toFixed(2),
    r.difference.toFixed(2),
    r.percentDifference.toFixed(1) + "%",
    r.allowableError.toFixed(2),
    r.zScore.toFixed(2),
    r.grade,
    r.status,
  ]);

  let csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  // Add summary section if provided
  if (summary) {
    csv += "\n\n" + "=== SUMMARY ===\n";
    csv += `Total Evaluations,${summary.totalEvaluations}\n`;
    csv += `Pass Count,${summary.passCount}\n`;
    csv += `Fail Count,${summary.failCount}\n`;
    csv += `Pass Rate,${summary.passRate}%\n`;
    csv += `Average |Z-Score|,${summary.averageZScore}\n`;
    csv += "\nGrade Distribution\n";
    csv += Object.entries(summary.gradeDistribution)
      .map(([grade, count]) => `${grade},${count}`)
      .join("\n");
  }

  return csv;
}

/**
 * Generate recommendations based on results
 */
export function generateRecommendations(result: PTEQAResult): string[] {
  const recommendations: string[] = [];

  if (result.grade === "Serious") {
    recommendations.push("🔴 CRITICAL: Immediate review required");
    recommendations.push("- Verify instrument calibration");
    recommendations.push("- Check reagent lot and expiry");
    recommendations.push("- Review quality control procedures");
    recommendations.push("- Consider instrument maintenance");
  } else if (result.grade === "Unsatisfactory") {
    recommendations.push("⚠️ WARNING: Investigation recommended");
    recommendations.push("- Review testing procedure");
    recommendations.push("- Check instrument performance");
    recommendations.push("- Verify quality control results");
  } else if (result.grade === "Satisfactory") {
    recommendations.push("⚡ ACCEPTABLE: Monitor performance");
    recommendations.push("- Continue routine quality control");
    recommendations.push("- Watch for trends");
  } else if (result.grade === "Good") {
    recommendations.push("✅ GOOD: Performance within expected range");
    recommendations.push("- Maintain current procedures");
  } else {
    recommendations.push("⭐ EXCELLENT: Outstanding performance");
    recommendations.push("- Continue excellent practices");
  }

  return recommendations;
}

/**
 * Calculate trend over multiple PT rounds
 */
export interface PTTrend {
  parameter: string;
  modelCode: string;
  trend: "improving" | "stable" | "declining";
  averageZScores: number[];
  recommendation: string;
}

export function analyzeTrends(
  historicalResults: PTEQAResult[][],
  minRounds: number = 3
): PTTrend[] {
  if (historicalResults.length < minRounds) {
    return [];
  }

  const trends: PTTrend[] = [];

  // Group by model and parameter
  const groupMap = new Map<string, PTEQAResult[][]>();

  historicalResults.forEach((roundResults) => {
    roundResults.forEach((result) => {
      const key = `${result.modelCode}-${result.parameter}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push([result]);
    });
  });

  // Analyze each group
  groupMap.forEach((rounds, key) => {
    const [modelCode, parameter] = key.split("-");
    const averageZScores = rounds.map((round) => {
      const sum = round.reduce((s, r) => s + Math.abs(r.zScore), 0);
      return Number((sum / round.length).toFixed(2));
    });

    // Simple linear trend analysis
    let trend: PTTrend["trend"] = "stable";
    const recent = averageZScores.slice(-3);
    const older = averageZScores.slice(0, -3);

    if (recent.length >= 2 && older.length >= 1) {
      const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
      const olderAvg = older.reduce((s, v) => s + v, 0) / older.length;

      if (recentAvg < olderAvg * 0.9) {
        trend = "improving";
      } else if (recentAvg > olderAvg * 1.1) {
        trend = "declining";
      }
    }

    let recommendation = "";
    if (trend === "declining") {
      recommendation =
        "Performance declining. Review procedures and calibration.";
    } else if (trend === "improving") {
      recommendation = "Performance improving. Continue current practices.";
    } else {
      recommendation = "Performance stable. Maintain routine monitoring.";
    }

    trends.push({
      parameter,
      modelCode,
      trend,
      averageZScores,
      recommendation,
    });
  });

  return trends;
}

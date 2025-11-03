// PT:EQA Analysis Library for Blood Cell Quality Testing
// Based on Process PT:EQA Evaluation chart.pdf

import { PTEQAResult, BloodTestRecord } from "./csv";

export type Grade =
  | "Excellent"
  | "Good"
  | "Satisfactory"
  | "Unsatisfactory"
  | "Serious";

export interface PTEQAParameter {
  name: string;
  value: number;
  referenceValue: number;
  zScore: number;
  grade: Grade;
  status: "Pass" | "Fail";
  bias: number;
  biasPct: number;
  allowableError: number;
}

export interface QualityFlag {
  type: "warning" | "critical" | "info";
  message: string;
  parameter: string;
  recommendedAction: string;
}

// PT:EQA Reference standards based on international guidelines
export const PTEQA_STANDARDS = {
  RBC: {
    target: 4.5,
    allowableError: 0.2,
    unit: "×10¹²/L",
    acceptableBias: 4.4, // ±4.4%
  },
  WBC: {
    target: 8.0,
    allowableError: 1.2,
    unit: "×10⁹/L",
    acceptableBias: 15.0, // ±15%
  },
  PLT: {
    target: 300,
    allowableError: 45,
    unit: "×10⁹/L",
    acceptableBias: 15.0, // ±15%
  },
  Hb: {
    target: 14.0,
    allowableError: 0.7,
    unit: "g/dL",
    acceptableBias: 5.0, // ±5%
  },
  Hct: {
    target: 42.0,
    allowableError: 2.1,
    unit: "%",
    acceptableBias: 5.0, // ±5%
  },
  MCV: {
    target: 90.0,
    allowableError: 4.5,
    unit: "fL",
    acceptableBias: 5.0, // ±5%
  },
  MCH: {
    target: 30.0,
    allowableError: 1.5,
    unit: "pg",
    acceptableBias: 5.0, // ±5%
  },
  MCHC: {
    target: 33.0,
    allowableError: 1.65,
    unit: "g/dL",
    acceptableBias: 5.0, // ±5%
  },
};

/**
 * Calculate Z-score for PT:EQA evaluation
 * Z-score = (Measured Value - Reference Value) / Allowable Error
 */
export function calculatePTEQAZScore(
  measuredValue: number,
  referenceValue: number,
  parameter: string
): number {
  const standard = PTEQA_STANDARDS[parameter as keyof typeof PTEQA_STANDARDS];
  if (!standard) return 0;

  const bias = measuredValue - referenceValue;
  return Number((bias / standard.allowableError).toFixed(2));
}

/**
 * Calculate bias as percentage
 */
export function calculateBiasPercentage(
  measuredValue: number,
  referenceValue: number
): number {
  if (referenceValue === 0) return 0;
  return Number(
    (((measuredValue - referenceValue) / referenceValue) * 100).toFixed(2)
  );
}

/**
 * Assign PT:EQA grade based on Z-score
 * Based on international PT:EQA grading criteria
 */
export function assignPTEQAGrade(zScore: number): Grade {
  const absZScore = Math.abs(zScore);
  // Align with PT:EQA chart thresholds
  if (absZScore <= 0.5) return "Excellent";
  if (absZScore <= 1.0) return "Good";
  if (absZScore <= 2.0) return "Satisfactory";
  if (absZScore <= 3.0) return "Unsatisfactory";
  return "Serious";
}

/**
 * Determine pass/fail status
 */
export function determinePTEQAStatus(grade: Grade): "Pass" | "Fail" {
  return grade === "Unsatisfactory" || grade === "Serious" ? "Fail" : "Pass";
}

/**
 * Perform comprehensive PT:EQA evaluation for a single record
 */
export function performRecordPTEQAEvaluation(
  record: BloodTestRecord
): PTEQAParameter[] {
  const parameters: PTEQAParameter[] = [];
  const paramNames = [
    "RBC",
    "WBC",
    "PLT",
    "Hb",
    "Hct",
    "MCV",
    "MCH",
    "MCHC",
  ] as const;

  paramNames.forEach((param) => {
    const measuredValue = record[param];
    const referenceValue = record[
      `${param}_ref` as keyof BloodTestRecord
    ] as number;

    if (
      measuredValue !== null &&
      referenceValue !== null &&
      !isNaN(measuredValue) &&
      !isNaN(referenceValue)
    ) {
      const zScore = calculatePTEQAZScore(measuredValue, referenceValue, param);
      const grade = assignPTEQAGrade(zScore);
      const status = determinePTEQAStatus(grade);
      const bias = measuredValue - referenceValue;
      const biasPct = calculateBiasPercentage(measuredValue, referenceValue);
      const standard = PTEQA_STANDARDS[param];

      parameters.push({
        name: param,
        value: measuredValue,
        referenceValue,
        zScore,
        grade,
        status,
        bias: Number(bias.toFixed(2)),
        biasPct,
        allowableError: standard.allowableError,
      });
    }
  });

  return parameters;
}

/**
 * Generate quality flags based on PT:EQA results
 */
export function generatePTEQAQualityFlags(
  parameters: PTEQAParameter[]
): QualityFlag[] {
  const flags: QualityFlag[] = [];

  parameters.forEach((param) => {
    const absZScore = Math.abs(param.zScore);

    if (param.grade === "Serious") {
      flags.push({
        type: "critical",
        message: `Serious performance issue in ${param.name} (Z-score: ${param.zScore})`,
        parameter: param.name,
        recommendedAction:
          "Immediate investigation required - check calibration, controls, and reagents",
      });
    } else if (param.grade === "Unsatisfactory") {
      flags.push({
        type: "warning",
        message: `Unsatisfactory performance in ${param.name} (Z-score: ${param.zScore})`,
        parameter: param.name,
        recommendedAction:
          "Review analytical procedures and consider corrective action",
      });
    } else if (absZScore > 1.5) {
      flags.push({
        type: "info",
        message: `Borderline performance in ${param.name} (Z-score: ${param.zScore})`,
        parameter: param.name,
        recommendedAction: "Monitor trend and consider preventive measures",
      });
    }

    // Check for systematic bias
    if (Math.abs(param.biasPct) > 10) {
      flags.push({
        type: "warning",
        message: `High bias detected in ${param.name} (${param.biasPct}%)`,
        parameter: param.name,
        recommendedAction: "Check for systematic errors in measurement process",
      });
    }
  });

  return flags;
}

/**
 * Calculate laboratory performance score
 */
export function calculateLabPerformanceScore(
  parameters: PTEQAParameter[]
): number {
  if (parameters.length === 0) return 0;

  const gradeScores = {
    Excellent: 100,
    Good: 85,
    Satisfactory: 70,
    Unsatisfactory: 50,
    Serious: 25,
  };

  const totalScore = parameters.reduce(
    (sum, param) => sum + gradeScores[param.grade],
    0
  );
  return Math.round(totalScore / parameters.length);
}

/**
 * Calculate overall laboratory grade
 */
export function calculateOverallLabGrade(parameters: PTEQAParameter[]): Grade {
  if (parameters.length === 0) return "Excellent";

  // Find the worst grade (most conservative approach)
  const gradeOrder: Grade[] = [
    "Excellent",
    "Good",
    "Satisfactory",
    "Unsatisfactory",
    "Serious",
  ];

  return parameters.reduce((worstGrade, param) => {
    const currentIndex = gradeOrder.indexOf(param.grade);
    const worstIndex = gradeOrder.indexOf(worstGrade);
    return currentIndex > worstIndex ? param.grade : worstGrade;
  }, "Excellent" as Grade);
}

/**
 * Generate PT:EQA report summary
 */
export function generatePTEQAReportSummary(allParameters: PTEQAParameter[]) {
  const gradeDistribution = allParameters.reduce((acc, param) => {
    acc[param.grade] = (acc[param.grade] || 0) + 1;
    return acc;
  }, {} as Record<Grade, number>);

  const passRate =
    (allParameters.filter((p) => p.status === "Pass").length /
      allParameters.length) *
    100;
  const averageZScore =
    allParameters.reduce((sum, p) => sum + Math.abs(p.zScore), 0) /
    allParameters.length;

  return {
    totalTests: allParameters.length,
    passRate: Number(passRate.toFixed(1)),
    averageZScore: Number(averageZScore.toFixed(2)),
    gradeDistribution,
    overallGrade: calculateOverallLabGrade(allParameters),
    performanceScore: calculateLabPerformanceScore(allParameters),
  };
}

/**
 * Format numbers for display
 */
export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Format Z-score for display
 */
export function formatZScore(zScore: number): string {
  const formatted = zScore.toFixed(2);
  return zScore > 0 ? `+${formatted}` : formatted;
}

/**
 * Get color class for grade
 */
export function getGradeColorClass(grade: Grade): string {
  const colorMap = {
    Excellent: "text-green-600 bg-green-50",
    Good: "text-blue-600 bg-blue-50",
    Satisfactory: "text-yellow-600 bg-yellow-50",
    Unsatisfactory: "text-orange-600 bg-orange-50",
    Serious: "text-purple-600 bg-purple-50",
  };
  return colorMap[grade];
}

/**
 * Get badge color for quality flag type
 */
export function getFlagBadgeColor(
  type: "warning" | "critical" | "info"
): string {
  const colorMap = {
    critical: "bg-purple-100 text-purple-800",
    warning: "bg-orange-100 text-orange-800",
    info: "bg-blue-100 text-blue-800",
  };
  return colorMap[type];
}

/**
 * Check if laboratory meets PT:EQA requirements
 */
export function checkPTEQACompliance(parameters: PTEQAParameter[]): {
  isCompliant: boolean;
  failedParameters: string[];
  recommendations: string[];
} {
  const failedParameters = parameters
    .filter((p) => p.status === "Fail")
    .map((p) => p.name);

  const recommendations: string[] = [];

  if (failedParameters.length > 0) {
    recommendations.push("Address failed parameters immediately");
    recommendations.push("Review analytical procedures for failed tests");
    recommendations.push("Implement corrective actions");
  }

  const seriousIssues = parameters.filter((p) => p.grade === "Serious");
  if (seriousIssues.length > 0) {
    recommendations.push("Critical: Investigate serious performance issues");
    recommendations.push("Consider suspension of testing until resolved");
  }

  return {
    isCompliant: failedParameters.length === 0,
    failedParameters,
    recommendations,
  };
}

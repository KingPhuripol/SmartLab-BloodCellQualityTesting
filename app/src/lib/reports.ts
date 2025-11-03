import jsPDF from "jspdf";
import "jspdf-autotable";
import { LabTest, Report, QualityDistribution, DashboardStats } from "@/types";
import { formatNumber, formatZScore } from "./analysis";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Generate PDF report for lab tests
 */
export function generateLabTestReport(
  tests: LabTest[],
  title: string = "Laboratory Test Report"
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 40, {
    align: "center",
  });
  doc.text(`Total Tests: ${tests.length}`, pageWidth / 2, 50, {
    align: "center",
  });

  // Summary Statistics
  const stats = calculateReportStats(tests);
  let yPosition = 70;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Summary Statistics", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const summaryData = [
    ["Total Tests", tests.length.toString()],
    ["Average Score", `${stats.averageScore.toFixed(1)}%`],
    [
      "Excellent Grades",
      `${stats.qualityDistribution.excellent} (${(
        (stats.qualityDistribution.excellent / tests.length) *
        100
      ).toFixed(1)}%)`,
    ],
    [
      "Good Grades",
      `${stats.qualityDistribution.good} (${(
        (stats.qualityDistribution.good / tests.length) *
        100
      ).toFixed(1)}%)`,
    ],
    [
      "Satisfactory Grades",
      `${stats.qualityDistribution.satisfactory} (${(
        (stats.qualityDistribution.satisfactory / tests.length) *
        100
      ).toFixed(1)}%)`,
    ],
    [
      "Unsatisfactory Grades",
      `${stats.qualityDistribution.unsatisfactory} (${(
        (stats.qualityDistribution.unsatisfactory / tests.length) *
        100
      ).toFixed(1)}%)`,
    ],
    [
      "Serious Grades",
      `${stats.qualityDistribution.serious} (${(
        (stats.qualityDistribution.serious / tests.length) *
        100
      ).toFixed(1)}%)`,
    ],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: summaryData,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin },
  });

  // Test Results Table
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 60;
  yPosition = finalY + 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Test Results", margin, yPosition);
  yPosition += 10;

  const testData = tests.map((test) => [
    test.sampleId,
    test.laboratory,
    test.analyst,
    test.testDate.toLocaleDateString(),
    test.overallGrade,
    `${test.overallScore}%`,
    test.qualityFlags.length.toString(),
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [
      [
        "Sample ID",
        "Laboratory",
        "Analyst",
        "Test Date",
        "Grade",
        "Score",
        "Alerts",
      ],
    ],
    body: testData,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin },
    columnStyles: {
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
    },
  });

  // Download the PDF
  doc.save(
    `${title.replace(/\s+/g, "_").toLowerCase()}_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

/**
 * Generate detailed PDF report for a single test
 */
export function generateDetailedTestReport(test: LabTest): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Laboratory Test Report", pageWidth / 2, 30, {
    align: "center",
  });

  // Test Information
  let yPosition = 50;
  doc.setFontSize(14);
  doc.text("Test Information", margin, yPosition);
  yPosition += 10;

  const testInfo = [
    ["Sample ID", test.sampleId],
    ["Patient ID", test.patientId || "N/A"],
    ["Test Date", test.testDate.toLocaleDateString()],
    ["Analysis Date", test.analysisDate.toLocaleDateString()],
    ["Analyst", test.analyst],
    ["Laboratory", test.laboratory],
    ["Overall Grade", test.overallGrade],
    ["Overall Score", `${test.overallScore}%`],
    ["Status", test.status],
  ];

  doc.autoTable({
    startY: yPosition,
    body: testInfo,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 60 },
    },
    margin: { left: margin },
  });

  // Parameters Table
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 60;
  yPosition = finalY + 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Parameter Results", margin, yPosition);
  yPosition += 10;

  const parameterData = test.parameters.map((param) => [
    param.name,
    formatNumber(param.value, 2),
    param.unit,
    `${param.referenceRange.min}-${param.referenceRange.max}`,
    formatZScore(param.zScore),
    param.grade,
    param.isOutOfRange ? "Yes" : "No",
  ]);

  doc.autoTable({
    startY: yPosition,
    head: [
      [
        "Parameter",
        "Value",
        "Unit",
        "Reference Range",
        "Z-Score",
        "Grade",
        "Out of Range",
      ],
    ],
    body: parameterData,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin },
    columnStyles: {
      1: { halign: "right" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "center" },
    },
  });

  // Quality Flags
  if (test.qualityFlags.length > 0) {
    const flagsY = (doc as any).lastAutoTable.finalY + 20;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Quality Alerts", margin, flagsY);

    const flagData = test.qualityFlags.map((flag) => [
      flag.type.toUpperCase(),
      flag.message,
      flag.recommendedAction || "No specific action required",
    ]);

    doc.autoTable({
      startY: flagsY + 10,
      head: [["Type", "Message", "Recommended Action"]],
      body: flagData,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60] },
      margin: { left: margin, right: margin },
    });
  }

  // Comments
  if (test.comments) {
    const commentsY = (doc as any).lastAutoTable.finalY + 20 || 200;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Comments", margin, commentsY);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitComments = doc.splitTextToSize(
      test.comments,
      pageWidth - 2 * margin
    );
    doc.text(splitComments, margin, commentsY + 10);
  }

  // Download the PDF
  doc.save(
    `detailed_test_report_${test.sampleId}_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

/**
 * Generate comprehensive quality report
 */
export function generateQualityReport(
  tests: LabTest[],
  period: { start: Date; end: Date },
  title: string = "Quality Analysis Report"
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageWidth / 2, 30, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Period: ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`,
    pageWidth / 2,
    40,
    { align: "center" }
  );
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 50, {
    align: "center",
  });

  // Executive Summary
  let yPosition = 70;
  const stats = calculateReportStats(tests);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", margin, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summary = [
    `During the reporting period, ${tests.length} laboratory tests were analyzed across multiple laboratories.`,
    `The overall quality distribution shows ${
      stats.qualityDistribution.excellent
    } excellent grades (${(
      (stats.qualityDistribution.excellent / tests.length) *
      100
    ).toFixed(1)}%),`,
    `${stats.qualityDistribution.good} good grades (${(
      (stats.qualityDistribution.good / tests.length) *
      100
    ).toFixed(1)}%), and ${
      stats.qualityDistribution.unsatisfactory +
      stats.qualityDistribution.serious
    } tests requiring attention.`,
    `The average quality score across all tests was ${stats.averageScore.toFixed(
      1
    )}%.`,
  ];

  summary.forEach((line) => {
    const splitText = doc.splitTextToSize(line, pageWidth - 2 * margin);
    doc.text(splitText, margin, yPosition);
    yPosition += splitText.length * 5 + 3;
  });

  // Quality Distribution Chart (text representation)
  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Quality Distribution", margin, yPosition);
  yPosition += 10;

  const distributionData = [
    [
      "Excellent",
      stats.qualityDistribution.excellent.toString(),
      `${((stats.qualityDistribution.excellent / tests.length) * 100).toFixed(
        1
      )}%`,
    ],
    [
      "Good",
      stats.qualityDistribution.good.toString(),
      `${((stats.qualityDistribution.good / tests.length) * 100).toFixed(1)}%`,
    ],
    [
      "Satisfactory",
      stats.qualityDistribution.satisfactory.toString(),
      `${(
        (stats.qualityDistribution.satisfactory / tests.length) *
        100
      ).toFixed(1)}%`,
    ],
    [
      "Unsatisfactory",
      stats.qualityDistribution.unsatisfactory.toString(),
      `${(
        (stats.qualityDistribution.unsatisfactory / tests.length) *
        100
      ).toFixed(1)}%`,
    ],
    [
      "Serious",
      stats.qualityDistribution.serious.toString(),
      `${((stats.qualityDistribution.serious / tests.length) * 100).toFixed(
        1
      )}%`,
    ],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [["Grade", "Count", "Percentage"]],
    body: distributionData,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin },
  });

  // Laboratory Performance
  const labPerformance = calculateLabPerformance(tests);
  const labY = (doc as any).lastAutoTable.finalY + 20;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Laboratory Performance", margin, labY);

  const labData = Object.entries(labPerformance).map(([lab, data]) => [
    lab,
    data.totalTests.toString(),
    data.averageScore.toFixed(1),
    data.qualityAlerts.toString(),
  ]);

  doc.autoTable({
    startY: labY + 10,
    head: [["Laboratory", "Total Tests", "Avg Score", "Quality Alerts"]],
    body: labData,
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: margin, right: margin },
  });

  // Download the PDF
  doc.save(
    `${title.replace(/\s+/g, "_").toLowerCase()}_${
      period.start.toISOString().split("T")[0]
    }_${period.end.toISOString().split("T")[0]}.pdf`
  );
}

/**
 * Calculate statistics for report generation
 */
function calculateReportStats(tests: LabTest[]): {
  averageScore: number;
  qualityDistribution: QualityDistribution;
} {
  const totalScore = tests.reduce((sum, test) => sum + test.overallScore, 0);
  const averageScore = tests.length > 0 ? totalScore / tests.length : 0;

  const qualityDistribution: QualityDistribution = {
    excellent: 0,
    good: 0,
    satisfactory: 0,
    unsatisfactory: 0,
    serious: 0,
  };

  tests.forEach((test) => {
    switch (test.overallGrade) {
      case "Excellent":
        qualityDistribution.excellent++;
        break;
      case "Good":
        qualityDistribution.good++;
        break;
      case "Satisfactory":
        qualityDistribution.satisfactory++;
        break;
      case "Unsatisfactory":
        qualityDistribution.unsatisfactory++;
        break;
      case "Serious":
        qualityDistribution.serious++;
        break;
    }
  });

  return { averageScore, qualityDistribution };
}

/**
 * Calculate performance metrics per laboratory
 */
function calculateLabPerformance(tests: LabTest[]): Record<
  string,
  {
    totalTests: number;
    averageScore: number;
    qualityAlerts: number;
  }
> {
  const labStats: Record<string, { scores: number[]; alerts: number }> = {};

  tests.forEach((test) => {
    if (!labStats[test.laboratory]) {
      labStats[test.laboratory] = { scores: [], alerts: 0 };
    }

    labStats[test.laboratory].scores.push(test.overallScore);
    labStats[test.laboratory].alerts += test.qualityFlags.length;
  });

  const result: Record<
    string,
    { totalTests: number; averageScore: number; qualityAlerts: number }
  > = {};

  Object.entries(labStats).forEach(([lab, data]) => {
    const averageScore =
      data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
    result[lab] = {
      totalTests: data.scores.length,
      averageScore,
      qualityAlerts: data.alerts,
    };
  });

  return result;
}

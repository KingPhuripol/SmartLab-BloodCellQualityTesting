// CSV Processing Library for Blood Cell Quality Testing
// Based on Blood Test Mockup CSVs Sept 28 2025 structure

export interface BloodTestRecord {
  id: number;
  labCode: string;
  report: string;
  // Lab values - Original
  RBC: number | null;
  WBC: number | null;
  PLT: number | null;
  Hb: number | null;
  Hct: number | null;
  MCV: number | null;
  MCH: number | null;
  MCHC: number | null;
  // Lab values - Reference
  RBC_ref: number | null;
  WBC_ref: number | null;
  PLT_ref: number | null;
  Hb_ref: number | null;
  Hct_ref: number | null;
  MCV_ref: number | null;
  MCH_ref: number | null;
  MCHC_ref: number | null;
  // Equipment info
  brand: string;
  brandCode: number;
  modelCode: number;
  modelName: string;
  modelDescription: string;
  submissionDate: string;
  labCodeHM: string;
  type: string;
  // Additional fields
  suggestion?: string;
  remarks?: string;
  brokenSample?: string;
}

export interface ProcessedCSVData {
  filename: string;
  totalRecords: number;
  validRecords: number;
  modelCodes: string[];
  records: BloodTestRecord[];
  statistics: {
    RBC: { mean: number; std: number; range: [number, number] };
    WBC: { mean: number; std: number; range: [number, number] };
    PLT: { mean: number; std: number; range: [number, number] };
    Hb: { mean: number; std: number; range: [number, number] };
    Hct: { mean: number; std: number; range: [number, number] };
    MCV: { mean: number; std: number; range: [number, number] };
    MCH: { mean: number; std: number; range: [number, number] };
    MCHC: { mean: number; std: number; range: [number, number] };
  };
}

export interface PTEQAResult {
  labCode: string;
  modelCode: string;
  parameter: string;
  measuredValue: number;
  referenceValue: number;
  zScore: number;
  grade: "Excellent" | "Good" | "Satisfactory" | "Unsatisfactory" | "Serious";
  status: "Pass" | "Fail";
}

// Reference ranges for PT:EQA evaluation
const REFERENCE_RANGES = {
  RBC: { target: 4.5, allowableError: 0.2 }, // ±4.4%
  WBC: { target: 8.0, allowableError: 1.2 }, // ±15%
  PLT: { target: 300, allowableError: 45 }, // ±15%
  Hb: { target: 14.0, allowableError: 0.7 }, // ±5%
  Hct: { target: 42.0, allowableError: 2.1 }, // ±5%
  MCV: { target: 90.0, allowableError: 4.5 }, // ±5%
  MCH: { target: 30.0, allowableError: 1.5 }, // ±5%
  MCHC: { target: 33.0, allowableError: 1.65 }, // ±5%
};

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Calculate statistics for lab parameters
 */
function calculateStatistics(
  records: BloodTestRecord[]
): ProcessedCSVData["statistics"] {
  const parameters = [
    "RBC",
    "WBC",
    "PLT",
    "Hb",
    "Hct",
    "MCV",
    "MCH",
    "MCHC",
  ] as const;
  const stats: any = {};

  parameters.forEach((param) => {
    const values = records
      .map((r) => r[param])
      .filter((v): v is number => v !== null && !isNaN(v));

    if (values.length > 0) {
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
        values.length;
      const std = Math.sqrt(variance);

      stats[param] = {
        mean: Number(mean.toFixed(2)),
        std: Number(std.toFixed(2)),
        range: [Math.min(...values), Math.max(...values)],
      };
    } else {
      stats[param] = {
        mean: 0,
        std: 0,
        range: [0, 0],
      };
    }
  });

  return stats;
}

/**
 * Parse CSV content and extract blood test records
 */
export function parseCSVContent(
  csvContent: string,
  filename: string
): ProcessedCSVData {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  const records: BloodTestRecord[] = [];
  const modelCodes = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length / 2) continue; // Skip incomplete rows

    try {
      const record: BloodTestRecord = {
        id: parseInt(values[0]) || i,
        labCode: values[1] || "",
        report: values[2] || "",
        // Original values
        RBC: parseFloat(values[3]) || null,
        WBC: parseFloat(values[4]) || null,
        PLT: parseFloat(values[5]) || null,
        Hb: parseFloat(values[6]) || null,
        Hct: parseFloat(values[7]) || null,
        MCV: parseFloat(values[8]) || null,
        MCH: parseFloat(values[9]) || null,
        MCHC: parseFloat(values[10]) || null,
        // Reference values
        RBC_ref: parseFloat(values[12]) || null,
        WBC_ref: parseFloat(values[13]) || null,
        PLT_ref: parseFloat(values[14]) || null,
        Hb_ref: parseFloat(values[15]) || null,
        Hct_ref: parseFloat(values[16]) || null,
        MCV_ref: parseFloat(values[17]) || null,
        MCH_ref: parseFloat(values[18]) || null,
        MCHC_ref: parseFloat(values[19]) || null,
        // Equipment info
        brand: values[21] || "",
        brandCode: parseInt(values[22]) || 0,
        modelCode: parseInt(values[23]) || 0,
        modelName: values[27] || "",
        modelDescription: values[24] || "",
        submissionDate: values[28] || "",
        labCodeHM: values[32] || "",
        type: values[33] || "",
        // Additional
        suggestion: values[29] || "",
        remarks: values[30] || "",
        brokenSample: values[31] || "",
      };

      records.push(record);
      if (record.modelCode) {
        modelCodes.add(`Model_${record.modelCode}`);
      }
    } catch (error) {
      console.warn(`Error parsing row ${i}:`, error);
    }
  }

  return {
    filename,
    totalRecords: lines.length - 1,
    validRecords: records.length,
    modelCodes: Array.from(modelCodes),
    records,
    statistics: calculateStatistics(records),
  };
}

/**
 * Parse CSV file and convert to structured data (updated for real files)
 */
export function parseCSVFile(file: File): Promise<ProcessedCSVData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const result = parseCSVContent(csvContent, file.name);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Parse multiple CSV files
 */
export async function parseMultipleCSVFiles(
  files: FileList
): Promise<ProcessedCSVData[]> {
  const parsePromises = Array.from(files).map((file) => parseCSVFile(file));
  return Promise.all(parsePromises);
}

/**
 * Validate CSV file format
 */
export function validateCSVFile(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check file type
  if (!file.name.toLowerCase().endsWith(".csv")) {
    errors.push("File must be a CSV file");
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    errors.push("File size must be less than 10MB");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Perform PT:EQA evaluation according to standard guidelines
 */
export function performPTEQAEvaluation(
  records: BloodTestRecord[]
): PTEQAResult[] {
  const results: PTEQAResult[] = [];

  records.forEach((record) => {
    const parameters = [
      "RBC",
      "WBC",
      "PLT",
      "Hb",
      "Hct",
      "MCV",
      "MCH",
      "MCHC",
    ] as const;

    parameters.forEach((param) => {
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
        const zScore = calculateZScore(measuredValue, referenceValue, param);
        const grade = assignGrade(zScore);
        const status =
          grade === "Unsatisfactory" || grade === "Serious" ? "Fail" : "Pass";

        results.push({
          labCode: record.labCode,
          modelCode: `Model_${record.modelCode}`,
          parameter: param,
          measuredValue,
          referenceValue,
          zScore,
          grade,
          status,
        });
      }
    });
  });

  return results;
}

/**
 * Calculate Z-score for PT:EQA evaluation
 */
function calculateZScore(
  measured: number,
  reference: number,
  parameter: string
): number {
  const refRange = REFERENCE_RANGES[parameter as keyof typeof REFERENCE_RANGES];
  if (!refRange) return 0;

  const bias = measured - reference;
  const allowableError = refRange.allowableError;

  return Number((bias / allowableError).toFixed(2));
}

/**
 * Assign grade based on Z-score according to PT:EQA guidelines
 */
function assignGrade(zScore: number): PTEQAResult["grade"] {
  const absZScore = Math.abs(zScore);
  // Align with PT:EQA chart thresholds
  if (absZScore <= 0.5) return "Excellent";
  if (absZScore <= 1.0) return "Good";
  if (absZScore <= 2.0) return "Satisfactory";
  if (absZScore <= 3.0) return "Unsatisfactory";
  return "Serious";
}

/**
 * Load and process all CSV files from the mockup directory
 */
export async function loadMockupCSVFiles(): Promise<ProcessedCSVData[]> {
  const csvFiles = [
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

  const results: ProcessedCSVData[] = [];

  // In a real implementation, this would fetch the files
  // For demo purposes, we'll return mock processed data
  csvFiles.forEach((filename) => {
    results.push(generateMockProcessedData(filename));
  });

  return results;
}

/**
 * Generate mock processed data for demo purposes
 */
function generateMockProcessedData(filename: string): ProcessedCSVData {
  const recordCount = Math.floor(Math.random() * 100) + 50;
  const records: BloodTestRecord[] = [];
  const modelCodes = new Set<string>();

  // Extract model code from filename
  const modelMatch = filename.match(/(\d+)/);
  const baseModelCode = modelMatch ? parseInt(modelMatch[1]) : 500;

  for (let i = 0; i < recordCount; i++) {
    const modelCode = baseModelCode + Math.floor(Math.random() * 10);
    modelCodes.add(`Model_${modelCode}`);

    const record: BloodTestRecord = {
      id: i + 1,
      labCode: `${String(i + 1).padStart(5, "0")}`,
      report: "R",
      RBC: 4.0 + Math.random() * 2,
      WBC: 5.0 + Math.random() * 8,
      PLT: 200 + Math.random() * 400,
      Hb: 12.0 + Math.random() * 6,
      Hct: 35.0 + Math.random() * 15,
      MCV: 80.0 + Math.random() * 20,
      MCH: 25.0 + Math.random() * 10,
      MCHC: 30.0 + Math.random() * 8,
      RBC_ref: 4.5 + Math.random() * 0.5,
      WBC_ref: 8.0 + Math.random() * 2,
      PLT_ref: 300 + Math.random() * 100,
      Hb_ref: 14.0 + Math.random() * 2,
      Hct_ref: 42.0 + Math.random() * 5,
      MCV_ref: 90.0 + Math.random() * 10,
      MCH_ref: 30.0 + Math.random() * 3,
      MCHC_ref: 33.0 + Math.random() * 2,
      brand: "Sysmex",
      brandCode: 500,
      modelCode,
      modelName: `XN-${1000 + Math.floor(Math.random() * 9000)}`,
      modelDescription: `XN Series Lab Analyzer`,
      submissionDate: "21 พฤษภาคม 2568",
      labCodeHM: `HM ${Math.floor(Math.random() * 2000)}`,
      type: ["NGPH", "PHCH", "DH", "GNPH"][Math.floor(Math.random() * 4)],
    };

    records.push(record);
  }

  return {
    filename,
    totalRecords: recordCount,
    validRecords: recordCount,
    modelCodes: Array.from(modelCodes),
    records,
    statistics: calculateStatistics(records),
  };
}

/**
 * Export analysis results to CSV format
 */
export function exportToCSV(results: PTEQAResult[], filename: string): void {
  const headers = [
    "Lab Code",
    "Model Code",
    "Parameter",
    "Measured Value",
    "Reference Value",
    "Z-Score",
    "Grade",
    "Status",
  ];

  const csvContent = [
    headers.join(","),
    ...results.map((result) =>
      [
        result.labCode,
        result.modelCode,
        result.parameter,
        result.measuredValue.toFixed(2),
        result.referenceValue.toFixed(2),
        result.zScore.toFixed(2),
        result.grade,
        result.status,
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

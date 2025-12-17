/**
 * Universal CSV Data Processor for Blood Cell Quality Testing
 * Handles multiple CSV formats and normalizes them to a standard format
 */

export interface StandardBloodTestRecord {
  id: number;
  labCode: string;
  report?: string;

  // Measured values (from Lab/Device A)
  measuredRBC: number | null;
  measuredWBC: number | null;
  measuredPLT: number | null;
  measuredHb: number | null;
  measuredHct: number | null;
  measuredMCV: number | null;
  measuredMCH: number | null;
  measuredMCHC: number | null;

  // Reference values (from Lab/Device B or Standard)
  referenceRBC: number | null;
  referenceWBC: number | null;
  referencePLT: number | null;
  referenceHb: number | null;
  referenceHct: number | null;
  referenceMCV: number | null;
  referenceMCH: number | null;
  referenceMCHC: number | null;

  // Equipment info
  brandCode: string;
  modelCode: string;
  modelName?: string;
  type?: string;

  // Metadata
  submissionDate?: string;
  remarks?: string;
  source?: string; // Which file it came from
}

export interface UniversalProcessedData {
  filename: string;
  format:
    | "BloodData-Test01"
    | "Combined"
    | "Standard"
    | "Mindray"
    | "Mockup-AV"
    | "Mockup-E"
    | "Mockup-RAW"
    | "Unknown";
  totalRecords: number;
  validRecords: number;
  records: StandardBloodTestRecord[];
  modelCodes: string[];
  statistics: {
    [param: string]: {
      mean: number;
      std: number;
      min: number;
      max: number;
      count: number;
    };
  };
}

/**
 * Detect CSV format based on headers
 */
function detectCSVFormat(headers: string[]): UniversalProcessedData["format"] {
  const headerStr = headers.join(",").toLowerCase();

  // Check for Standard format from Converter (Lab Code,Report,Measured RBC,Measured WBC,...)
  if (
    headerStr.includes("measured rbc") &&
    headerStr.includes("reference rbc") &&
    headerStr.includes("brand code") &&
    headerStr.includes("model code")
  ) {
    return "Standard"; // Use Standard parser for converter format
  }

  // Check for BloodData - Test01.csv format (Lab Code,A_RBC,A_WBC,...)
  if (
    headerStr.includes("lab code") &&
    headerStr.includes("a_rbc") &&
    headerStr.includes("b_rbc")
  ) {
    return "BloodData-Test01";
  }

  // Check for Mindray format with underscored columns (Measured_RBC, Reference_RBC, Model_Code)
  if (
    headerStr.includes("measured_rbc") &&
    headerStr.includes("reference_rbc") &&
    headerStr.includes("model_code")
  ) {
    return "Mockup-RAW"; // Use Mockup-RAW parser with adjusted indices
  }

  // Check for Combined_Test_Data.csv format (has many columns with Thai headers)
  if (headerStr.includes("no.168") || headerStr.includes("รายงานผล")) {
    return "Combined";
  }

  // Check for Mockup-AV format (simplified with RBC, WBC, PLT columns)
  if (headerStr.includes("brand_n") && headerStr.includes("b_m_no")) {
    return "Mockup-AV";
  }

  // Check for Mockup-E format
  if (headerStr.includes("type") && headerStr.includes("model code") && headerStr.includes("source_file")) {
    return "Mockup-E";
  }

  return "Unknown";
}

/**
 * Safe parse float with null fallback
 */
function safeParseFloat(value: string | undefined | null): number | null {
  if (!value || value.trim() === "" || value.toLowerCase() === "nan") {
    return null;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function normalizeCode(value: string | undefined | null): string {
  const trimmed = (value ?? "").toString().trim();
  if (!trimmed) return "";

  // Try to parse as number first (handles "602", "602.0", "602.00", etc.)
  const asNumber = Number(trimmed);
  if (!isNaN(asNumber) && Number.isFinite(asNumber)) {
    // Convert to integer string (removes decimals)
    const intValue = Math.floor(Math.abs(asNumber));
    // Only accept valid model codes (100-999)
    if (intValue >= 100 && intValue <= 999) {
      return String(intValue);
    }
  }

  // Check if it starts with parentheses and contains a number like "(600) Mindray"
  const match = trimmed.match(/\((\d{3})\)/);
  if (match) {
    const extracted = parseInt(match[1]);
    if (extracted >= 100 && extracted <= 999) {
      return String(extracted);
    }
  }

  // If not a valid number, return empty string (will use fallback in parser)
  return "";
}

/**
 * Parse BloodData - Test01.csv format
 */
function parseBloodDataTest01(lines: string[][]): StandardBloodTestRecord[] {
  const records: StandardBloodTestRecord[] = [];

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 18) continue; // Need at least 18 columns

    const record: StandardBloodTestRecord = {
      id: i,
      labCode: row[0] || `LAB${String(i).padStart(5, "0")}`,

      // Measured values (columns A_RBC, A_WBC, etc.)
      measuredRBC: safeParseFloat(row[1]),
      measuredWBC: safeParseFloat(row[2]),
      measuredPLT: safeParseFloat(row[3]),
      measuredHb: safeParseFloat(row[4]),
      measuredHct: safeParseFloat(row[5]),
      measuredMCV: safeParseFloat(row[6]),
      measuredMCH: safeParseFloat(row[7]),
      measuredMCHC: safeParseFloat(row[8]),

      // Reference values (columns B_RBC, B_WBC, etc.)
      referenceRBC: safeParseFloat(row[9]),
      referenceWBC: safeParseFloat(row[10]),
      referencePLT: safeParseFloat(row[11]),
      referenceHb: safeParseFloat(row[12]),
      referenceHct: safeParseFloat(row[13]),
      referenceMCV: safeParseFloat(row[14]),
      referenceMCH: safeParseFloat(row[15]),
      referenceMCHC: safeParseFloat(row[16]),

      // Equipment info
      brandCode: normalizeCode(row[17]) || "600",
      modelCode: normalizeCode(row[18]) || "602",

      source: "BloodData-Test01",
    };

    records.push(record);
  }

  return records;
}

/**
 * Parse Combined_Test_Data.csv format
 */
function parseCombined(lines: string[][]): StandardBloodTestRecord[] {
  const records: StandardBloodTestRecord[] = [];

  // This format is complex with many columns
  // Key columns: 1=Lab Code, 3-10=measured values, 12-19=reference values
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 34) continue;

    const record: StandardBloodTestRecord = {
      id: i,
      labCode: row[1] || `LAB${String(i).padStart(5, "0")}`,
      report: row[2],

      // Measured values (columns 3-10)
      measuredRBC: safeParseFloat(row[3]),
      measuredWBC: safeParseFloat(row[4]),
      measuredPLT: safeParseFloat(row[5]),
      measuredHb: safeParseFloat(row[6]),
      measuredHct: safeParseFloat(row[7]),
      measuredMCV: safeParseFloat(row[8]),
      measuredMCH: safeParseFloat(row[9]),
      measuredMCHC: safeParseFloat(row[10]),

      // Reference values (columns 12-19)
      referenceRBC: safeParseFloat(row[12]),
      referenceWBC: safeParseFloat(row[13]),
      referencePLT: safeParseFloat(row[14]),
      referenceHb: safeParseFloat(row[15]),
      referenceHct: safeParseFloat(row[16]),
      referenceMCV: safeParseFloat(row[17]),
      referenceMCH: safeParseFloat(row[18]),
      referenceMCHC: safeParseFloat(row[19]),

      // Equipment info
      brandCode: normalizeCode(row[22]) || "500",
      modelCode: normalizeCode(row[34] || row[23]) || "503",
      modelName: row[27],
      type: row[33],

      submissionDate: row[28],
      remarks: row[29],

      source: "Combined",
    };

    records.push(record);
  }

  return records;
}

/**
 * Parse Standard CSV format (from Converter: Lab Code,Report,Measured RBC,...)
 */
function parseStandardFormat(lines: string[][]): StandardBloodTestRecord[] {
  const records: StandardBloodTestRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 19) continue;

    const record: StandardBloodTestRecord = {
      id: i,
      labCode: row[0] || `LAB${String(i).padStart(5, "0")}`,
      report: row[1],

      // Measured values (columns 2-9)
      measuredRBC: safeParseFloat(row[2]),
      measuredWBC: safeParseFloat(row[3]),
      measuredPLT: safeParseFloat(row[4]),
      measuredHb: safeParseFloat(row[5]),
      measuredHct: safeParseFloat(row[6]),
      measuredMCV: safeParseFloat(row[7]),
      measuredMCH: safeParseFloat(row[8]),
      measuredMCHC: safeParseFloat(row[9]),

      // Reference values (columns 10-17)
      referenceRBC: safeParseFloat(row[10]),
      referenceWBC: safeParseFloat(row[11]),
      referencePLT: safeParseFloat(row[12]),
      referenceHb: safeParseFloat(row[13]),
      referenceHct: safeParseFloat(row[14]),
      referenceMCV: safeParseFloat(row[15]),
      referenceMCH: safeParseFloat(row[16]),
      referenceMCHC: safeParseFloat(row[17]),

      // Equipment info (columns 18-19)
      brandCode: normalizeCode(row[18]) || "600",
      modelCode: normalizeCode(row[19]) || "600",
      modelName: row[20],
      type: row[21],

      submissionDate: row[22],
      remarks: row[23],
      source: row[24] || "Standard",
    };

    records.push(record);
  }

  return records;
}

/**
 * Parse Mockup CSV formats (500-AV.csv, 503-AV.csv, etc.)
 * Also used for Mindray format with columns: No,Lab Code,Lab Name,Report,Measured_RBC,...,Model_Code
 */
function parseMockupAV(lines: string[][]): StandardBloodTestRecord[] {
  const records: StandardBloodTestRecord[] = [];

  // Check if this is Mindray format (has Measured_RBC) or old Mockup format
  const header = lines[0].join(',').toLowerCase();
  const isMindrayFormat = header.includes('measured_rbc') && header.includes('reference_rbc');

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    
    if (isMindrayFormat) {
      // Mindray format: columns are 0-indexed
      // Lab Code=1, Report=3, Measured(4-11), Reference(13-20), Brand=21, Model=23
      if (row.length < 24) continue;

      const record: StandardBloodTestRecord = {
        id: i,
        labCode: row[1] || `LAB${String(i).padStart(5, "0")}`,
        report: row[3],

        // Measured values (columns 4-11, 0-indexed)
        measuredRBC: safeParseFloat(row[4]),
        measuredWBC: safeParseFloat(row[5]),
        measuredPLT: safeParseFloat(row[6]),
        measuredHb: safeParseFloat(row[7]),
        measuredHct: safeParseFloat(row[8]),
        measuredMCV: safeParseFloat(row[9]),
        measuredMCH: safeParseFloat(row[10]),
        measuredMCHC: safeParseFloat(row[11]),

        // Reference values (columns 13-20, 0-indexed)
        referenceRBC: safeParseFloat(row[13]),
        referenceWBC: safeParseFloat(row[14]),
        referencePLT: safeParseFloat(row[15]),
        referenceHb: safeParseFloat(row[16]),
        referenceHct: safeParseFloat(row[17]),
        referenceMCV: safeParseFloat(row[18]),
        referenceMCH: safeParseFloat(row[19]),
        referenceMCHC: safeParseFloat(row[20]),

        // Equipment info (0-indexed: Brand_Code=22, Model_Code=24, Model_Name=27)
        brandCode: normalizeCode(row[22]) || "600",
        modelCode: normalizeCode(row[24]) || normalizeCode(row[22]) || "600",
        modelName: row[27],
        type: row[35],

        submissionDate: row[28],
        remarks: row[30],
        source: "Mindray",
      };

      records.push(record);
      continue;
    }

    // Original Mockup format
    if (row.length < 23) continue;

    const record: StandardBloodTestRecord = {
      id: i,
      labCode: row[1] || `LAB${String(i).padStart(5, "0")}`,
      report: row[2],

      // Measured values
      measuredRBC: safeParseFloat(row[3]),
      measuredWBC: safeParseFloat(row[4]),
      measuredPLT: safeParseFloat(row[5]),
      measuredHb: safeParseFloat(row[6]),
      measuredHct: safeParseFloat(row[7]),
      measuredMCV: safeParseFloat(row[8]),
      measuredMCH: safeParseFloat(row[9]),
      measuredMCHC: safeParseFloat(row[10]),

      // Reference values
      referenceRBC: safeParseFloat(row[12]),
      referenceWBC: safeParseFloat(row[13]),
      referencePLT: safeParseFloat(row[14]),
      referenceHb: safeParseFloat(row[15]),
      referenceHct: safeParseFloat(row[16]),
      referenceMCV: safeParseFloat(row[17]),
      referenceMCH: safeParseFloat(row[18]),
      referenceMCHC: safeParseFloat(row[19]),

      // Equipment info
      brandCode: normalizeCode(row[22]) || "500",
      modelCode: normalizeCode(row[23]) || "503",
      modelName: row[27],
      type: row.length > 33 ? row[33] : undefined,

      submissionDate: row[28],

      source: "Mockup-AV",
    };

    records.push(record);
  }

  return records;
}

/**
 * Calculate statistics for a set of values
 */
function calculateStats(values: (number | null)[]): {
  mean: number;
  std: number;
  min: number;
  max: number;
  count: number;
} {
  const validValues = values.filter(
    (v): v is number => v !== null && !isNaN(v)
  );

  if (validValues.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, count: 0 };
  }

  const mean = validValues.reduce((sum, v) => sum + v, 0) / validValues.length;
  const variance =
    validValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    validValues.length;
  const std = Math.sqrt(variance);

  return {
    mean: Number(mean.toFixed(2)),
    std: Number(std.toFixed(2)),
    min: Math.min(...validValues),
    max: Math.max(...validValues),
    count: validValues.length,
  };
}

/**
 * Calculate statistics for all parameters
 */
function calculateAllStatistics(
  records: StandardBloodTestRecord[]
): UniversalProcessedData["statistics"] {
  const params = ["RBC", "WBC", "PLT", "Hb", "Hct", "MCV", "MCH", "MCHC"];
  const stats: UniversalProcessedData["statistics"] = {};

  params.forEach((param) => {
    const measuredKey = `measured${param}` as keyof StandardBloodTestRecord;
    const referenceKey = `reference${param}` as keyof StandardBloodTestRecord;

    const measuredValues = records.map((r) => r[measuredKey] as number | null);
    const referenceValues = records.map(
      (r) => r[referenceKey] as number | null
    );

    stats[`measured${param}`] = calculateStats(measuredValues);
    stats[`reference${param}`] = calculateStats(referenceValues);
  });

  return stats;
}

/**
 * Parse CSV line with proper handling of quoted values and commas
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
 * Main universal CSV processor
 */
export function processUniversalCSV(
  csvContent: string,
  filename: string
): UniversalProcessedData {
  const lines = csvContent
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => parseCSVLine(line));

  if (lines.length === 0) {
    throw new Error("Empty CSV file");
  }

  const headers = lines[0];
  const format = detectCSVFormat(headers);

  let records: StandardBloodTestRecord[];

  switch (format) {
    case "BloodData-Test01":
      records = parseBloodDataTest01(lines);
      break;
    case "Standard":
      records = parseStandardFormat(lines);
      break;
    case "Combined":
      records = parseCombined(lines);
      break;
    case "Mockup-AV":
    case "Mockup-E":
    case "Mockup-RAW":
      records = parseMockupAV(lines);
      break;
    default:
      // Try to auto-detect or use default parser
      console.warn(`Unknown format, attempting generic parse for ${filename}`);
      records = parseMockupAV(lines); // Use most flexible parser
  }

  // Filter out invalid records (must have at least lab code and one measurement)
  const validRecords = records.filter(
    (r) =>
      r.labCode &&
      (r.measuredRBC !== null ||
        r.measuredWBC !== null ||
        r.measuredPLT !== null)
  );

  // Extract unique model codes
  const modelCodes = Array.from(
    new Set(validRecords.map((r) => r.modelCode).filter(Boolean))
  ).sort();

  // Calculate statistics
  const statistics = calculateAllStatistics(validRecords);

  return {
    filename,
    format,
    totalRecords: lines.length - 1,
    validRecords: validRecords.length,
    records: validRecords,
    modelCodes,
    statistics,
  };
}

/**
 * Process multiple CSV files
 */
export async function processMultipleCSVFiles(
  files: File[]
): Promise<UniversalProcessedData[]> {
  const results: UniversalProcessedData[] = [];

  for (const file of files) {
    try {
      const content = await file.text();
      const processed = processUniversalCSV(content, file.name);
      results.push(processed);
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error);
    }
  }

  return results;
}

/**
 * Merge multiple processed datasets into one
 */
export function mergeProcessedData(
  datasets: UniversalProcessedData[]
): UniversalProcessedData {
  if (datasets.length === 0) {
    throw new Error("No datasets to merge");
  }

  const allRecords: StandardBloodTestRecord[] = [];
  const allModelCodes = new Set<string>();
  let totalRecords = 0;

  datasets.forEach((dataset) => {
    allRecords.push(...dataset.records);
    dataset.modelCodes.forEach((code) => allModelCodes.add(code));
    totalRecords += dataset.totalRecords;
  });

  return {
    filename: `Merged_${datasets.length}_files`,
    format: "Combined",
    totalRecords,
    validRecords: allRecords.length,
    records: allRecords,
    modelCodes: Array.from(allModelCodes).sort(),
    statistics: calculateAllStatistics(allRecords),
  };
}

/**
 * Export to standard CSV format
 */
export function exportToStandardCSV(
  records: StandardBloodTestRecord[]
): string {
  const headers = [
    "Lab Code",
    "Report",
    "Measured RBC",
    "Measured WBC",
    "Measured PLT",
    "Measured Hb",
    "Measured Hct",
    "Measured MCV",
    "Measured MCH",
    "Measured MCHC",
    "Reference RBC",
    "Reference WBC",
    "Reference PLT",
    "Reference Hb",
    "Reference Hct",
    "Reference MCV",
    "Reference MCH",
    "Reference MCHC",
    "Brand Code",
    "Model Code",
    "Model Name",
    "Type",
    "Submission Date",
    "Remarks",
    "Source",
  ];

  const rows = records.map((r) => [
    r.labCode,
    r.report || "",
    r.measuredRBC?.toFixed(2) || "",
    r.measuredWBC?.toFixed(2) || "",
    r.measuredPLT?.toFixed(0) || "",
    r.measuredHb?.toFixed(1) || "",
    r.measuredHct?.toFixed(1) || "",
    r.measuredMCV?.toFixed(1) || "",
    r.measuredMCH?.toFixed(1) || "",
    r.measuredMCHC?.toFixed(1) || "",
    r.referenceRBC?.toFixed(2) || "",
    r.referenceWBC?.toFixed(2) || "",
    r.referencePLT?.toFixed(0) || "",
    r.referenceHb?.toFixed(1) || "",
    r.referenceHct?.toFixed(1) || "",
    r.referenceMCV?.toFixed(1) || "",
    r.referenceMCH?.toFixed(1) || "",
    r.referenceMCHC?.toFixed(1) || "",
    r.brandCode,
    r.modelCode,
    r.modelName || "",
    r.type || "",
    r.submissionDate || "",
    r.remarks || "",
    r.source || "",
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

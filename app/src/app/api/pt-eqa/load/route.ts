import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  processUniversalCSV,
  mergeProcessedData,
  type UniversalProcessedData,
} from "@/lib/universal-csv-processor";
import {
  evaluateMultipleRecordsWithAssignedValues,
  generateSummary,
  type PTEQAResult,
  type PTEQASummary,
} from "@/lib/pt-eqa-analysis";

export async function GET() {
  try {
    const workspaceRoot = process.cwd();

    // Try multiple locations for data files
    const candidateDirs = [
      path.join(workspaceRoot, "data"),
      path.join(workspaceRoot, ".."),
      path.join(workspaceRoot, "..", ".."),
      "/Users/king_phuripol/Work/SmartLab/BloodCellQualityTesting",
    ];

    // Return empty state if no data files exist (user needs to upload)
    let dataRoot: string | null = null;
    for (const d of candidateDirs) {
      try {
        await fs.access(d);
        dataRoot = d;
        break;
      } catch {
        // continue
      }
    }

    if (!dataRoot) {
      // No data directory found - return empty state instead of error
      return NextResponse.json({
        files: [],
        results: [],
        summary: {
          totalLabs: 0,
          totalParams: 0,
          passRate: 0,
          gradeDistribution: { Excellent: 0, Good: 0, Satisfactory: 0, Unsatisfactory: 0 },
          modelPerformance: [],
        },
        metadata: {
          loadedFiles: [],
          totalRecords: 0,
          formats: [],
        },
      });
    }

    // Define all data file locations
    const dataFiles: { path: string; priority: number }[] = [];

    // 1. Add all CSV files from app/data directory
    const appDataDir = path.join(workspaceRoot, "data");
    try {
      const files = await fs.readdir(appDataDir);
      for (const f of files) {
        if (f.endsWith(".csv")) {
          dataFiles.push({ path: path.join(appDataDir, f), priority: 1 });
        }
      }
      console.log(`Found ${files.filter(f => f.endsWith('.csv')).length} CSV files in app/data`);
    } catch (e) {
      console.warn("Could not read app/data directory:", e);
    }

    // 2. Add root files if they exist (for backward compatibility)
    const rootFiles = ["BloodData - Test01.csv", "Combined_Test_Data.csv"];
    for (const f of rootFiles) {
      const p = path.join(dataRoot, f);
      try {
        await fs.access(p);
        dataFiles.push({ path: p, priority: 1 });
      } catch {}
    }

    // 3. Add files from subdirectories
    const mockupDirs = [
      path.join(dataRoot, "Blood Test Mockup CSVs Sept 28 2025"),
      path.join(dataRoot, "mockups"),
      path.join(dataRoot, "uploads"),
      path.join(appDataDir, "uploads"),
    ];

    for (const mockupDir of mockupDirs) {
      try {
        const files = await fs.readdir(mockupDir);
        for (const f of files) {
          if (f.endsWith(".csv")) {
            dataFiles.push({ path: path.join(mockupDir, f), priority: 2 });
          }
        }
      } catch (e) {
        // console.warn("Could not read mockup directory:", e);
      }
    }

    // Process all available files
    const processed: UniversalProcessedData[] = [];
    const loadedFiles: string[] = [];

    for (const { path: filePath, priority } of dataFiles) {
      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, "utf8");
        const filename = path.basename(filePath);

        const parsed = processUniversalCSV(content, filename);

        if (parsed.validRecords > 0) {
          processed.push(parsed);
          loadedFiles.push(
            `${filename} (${parsed.format}, ${parsed.validRecords} records)`
          );
          console.log(
            `✓ Loaded: ${filename} | Format: ${parsed.format} | Records: ${parsed.validRecords}`
          );
        }
      } catch (e: any) {
        console.warn(`⚠ Skipped ${path.basename(filePath)}: ${e.message}`);
      }
    }

    if (processed.length === 0) {
      // No data files to load - return empty state for user to upload
      return NextResponse.json({
        files: [],
        results: [],
        summary: {
          totalLabs: 0,
          totalParams: 0,
          passRate: 0,
          gradeDistribution: { Excellent: 0, Good: 0, Satisfactory: 0, Unsatisfactory: 0 },
          modelPerformance: [],
        },
        metadata: {
          loadedFiles: [],
          totalRecords: 0,
          formats: [],
        },
      });
    }

    // Merge all processed data
    const mergedData = mergeProcessedData(processed);

    // Compute assigned values (mean/sd/%CV) per model+parameter (with blunder removal)
    // and evaluate Z-scores against assigned mean/sd.
    const { results: ptEqaResults, assignedValues } =
      evaluateMultipleRecordsWithAssignedValues(mergedData.records);

    // Generate comprehensive summary
    const summary = generateSummary(ptEqaResults);
    summary.assignedValues = assignedValues;

    return NextResponse.json({
      metadata: {
        dataRoot,
        filesLoaded: loadedFiles,
        totalFiles: processed.length,
        totalRecords: mergedData.validRecords,
        uniqueModels: mergedData.modelCodes,
        evaluations: ptEqaResults.length,
      },
      files: processed.map((p) => ({
        filename: p.filename,
        format: p.format,
        totalRecords: p.totalRecords,
        validRecords: p.validRecords,
        modelCodes: p.modelCodes,
        statistics: Object.fromEntries(
          Object.entries(p.statistics).map(([key, stats]) => [
            key,
            { mean: stats.mean, std: stats.std, count: stats.count },
          ])
        ),
      })),
      ptEqa: {
        results: ptEqaResults,
        summary,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in PT:EQA load:", error);
    return NextResponse.json(
      {
        error: "Failed to load PT:EQA data",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

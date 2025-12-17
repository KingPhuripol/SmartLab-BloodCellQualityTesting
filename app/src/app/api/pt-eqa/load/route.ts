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

    let dataRoot: string | null = null;
    for (const d of candidateDirs) {
      try {
        const testFile = path.join(d, "BloodData - Test01.csv");
        await fs.access(testFile);
        dataRoot = d;
        break;
      } catch {
        // continue
      }
    }

    if (!dataRoot) {
      return NextResponse.json(
        {
          error: "Data files not found",
          message: "Could not locate BloodData - Test01.csv",
          searchedPaths: candidateDirs,
        },
        { status: 404 }
      );
    }

    // Define all data file locations
    const dataFiles: { path: string; priority: number }[] = [];

    // 1. Add root files if they exist
    const rootFiles = ["BloodData - Test01.csv", "Combined_Test_Data.csv"];
    for (const f of rootFiles) {
      const p = path.join(dataRoot, f);
      try {
        await fs.access(p);
        dataFiles.push({ path: p, priority: 1 });
      } catch {}
    }

    // 2. Add files from "Blood Test Mockup CSVs Sept 28 2025", "mockups", or "uploads"
    const mockupDirs = [
      path.join(dataRoot, "Blood Test Mockup CSVs Sept 28 2025"),
      path.join(dataRoot, "mockups"),
      path.join(dataRoot, "uploads"),
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
      return NextResponse.json(
        {
          error: "No valid data files found",
          message: "Could not process any CSV files",
          attemptedFiles: dataFiles.map((f) => path.basename(f.path)),
        },
        { status: 404 }
      );
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

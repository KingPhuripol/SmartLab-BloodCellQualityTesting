import { NextRequest, NextResponse } from "next/server";
import { processUniversalCSV } from "@/lib/universal-csv-processor";
import {
  evaluateMultipleRecordsWithAssignedValues,
  generateSummary,
} from "@/lib/pt-eqa-analysis";
import * as XLSX from "xlsx";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const filename = file.name;
    let content: string;

    // Handle Excel files
    if (
      filename.toLowerCase().endsWith(".xlsx") ||
      filename.toLowerCase().endsWith(".xls")
    ) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      content = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      content = await file.text();
    }

    // Save the processed CSV to data/uploads
    try {
      const uploadDir = path.join(process.cwd(), "data", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });

      const saveFilename = filename.replace(/\.(xlsx|xls)$/i, ".csv");
      await fs.writeFile(path.join(uploadDir, saveFilename), content);
      console.log(
        `Saved uploaded file to ${path.join(uploadDir, saveFilename)}`
      );
    } catch (err) {
      console.error("Failed to save uploaded file:", err);
      // Continue processing even if save fails
    }

    const parsed = processUniversalCSV(content, filename);

    if (parsed.validRecords === 0) {
      return NextResponse.json(
        { error: "No valid records found in file" },
        { status: 400 }
      );
    }

    // Evaluate
    const { results: ptEqaResults, assignedValues } =
      evaluateMultipleRecordsWithAssignedValues(parsed.records);

    const summary = generateSummary(ptEqaResults);
    summary.assignedValues = assignedValues;

    return NextResponse.json({
      metadata: {
        filesLoaded: [filename],
        totalRecords: parsed.validRecords,
        uniqueModels: parsed.modelCodes,
        evaluations: ptEqaResults.length,
      },
      files: [
        {
          filename: parsed.filename,
          format: parsed.format,
          totalRecords: parsed.totalRecords,
          validRecords: parsed.validRecords,
          modelCodes: parsed.modelCodes,
          statistics: Object.fromEntries(
            Object.entries(parsed.statistics).map(([key, stats]) => [
              key,
              { mean: stats.mean, std: stats.std, count: stats.count },
            ])
          ),
        },
      ],
      ptEqa: {
        results: ptEqaResults,
        summary,
      },
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
